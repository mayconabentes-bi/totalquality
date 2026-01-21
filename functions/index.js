/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const {onObjectFinalized} = require("firebase-functions/v2/storage");
const {GoogleGenerativeAI} = require("@google/generative-ai");

// Define secret for Gemini API Key
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// System instruction for POP extraction
// (Procedimento Operacional Padrão - Standard Operating Procedure)
const POP_EXTRACTION_PROMPT = `Você é um especialista em extração de ` +
`Procedimentos Operacionais Padrão (POPs) de vídeos corporativos.

Analise este vídeo e extraia os seguintes elementos estruturados em ` +
`formato JSON:

1. **Título do POP**: Identifique o procedimento sendo demonstrado
2. **Objetivo**: Qual é o propósito deste procedimento?
3. **Etapas**: Liste cada passo demonstrado no vídeo com:
   - Número da etapa
   - Descrição detalhada da ação
   - Tempo aproximado no vídeo (se identificável)
   - Ferramentas/equipamentos necessários
   - Pontos críticos de segurança ou qualidade
4. **Requisitos de Segurança**: Equipamentos de proteção, precauções
5. **Materiais e Ferramentas**: Lista completa necessária
6. **Tempo Estimado**: Duração total do procedimento
7. **Responsável**: Tipo de profissional que deve executar
8. **Critérios de Qualidade**: Como verificar se foi executado corretamente
9. **Não-Conformidades Identificadas**: Problemas ou desvios ` +
`detectados no vídeo
10. **Score de Conformidade**: Avaliação de 0-100 da execução ` +
`demonstrada

Retorne um JSON estruturado e completo.`;

// Initialize Firebase Admin
admin.initializeApp();

/**
 * VideoProcessor - Cloud Function to extract POPs from uploaded videos
 * Monitors .mp4 uploads and extracts Standard Operating Procedures
 * using Gemini 1.5 Pro. Triggered when a video is uploaded to Storage.
 */
exports.VideoProcessor = onObjectFinalized({
  cpu: 2,
  memory: "4GiB",
  timeoutSeconds: 540,
  secrets: [geminiApiKey],
}, async (event) => {
  const filePath = event.data.name;
  const contentType = event.data.contentType;

  // Validate path structure: companies/{companyId}/videos/{filename}
  const pathRegex = /^companies\/([^/]+)\/videos\/([^/]+)$/;
  const pathMatch = filePath.match(pathRegex);

  // Only process video files in the correct path structure
  if (!contentType.startsWith("video/") || !pathMatch) {
    logger.info("Skipping non-video file or invalid path:", filePath);
    return null;
  }

  logger.info("Processing video:", filePath);

  // Extract company ID and video filename from validated path
  const companyId = pathMatch[1];
  const videoFilename = pathMatch[2];
  const videoId = videoFilename.split(".")[0];

  if (!companyId || !videoId) {
    logger.error("Invalid file path structure:", filePath);
    return null;
  }

  // Use GCS URI format for Gemini (gs://bucket/path)
  const gcsUri = `gs://${event.data.bucket}/${filePath}`;

  try {
    // Initialize Gemini AI with secret API key
    const genAI = new GoogleGenerativeAI(geminiApiKey.value());
    const model = genAI.getGenerativeModel({model: "gemini-1.5-pro"});

    // Process video with Gemini 1.5 Pro for POP extraction
    const result = await model.generateContent([
      POP_EXTRACTION_PROMPT,
      {
        fileData: {
          mimeType: contentType,
          fileUri: gcsUri,
        },
      },
    ]);

    const response = result.response;
    const extractedText = response.text();

    // Try to parse as JSON, fallback to raw text if not valid JSON
    let popData;
    try {
      popData = JSON.parse(extractedText);
    } catch (parseError) {
      logger.warn("JSON parsing failed, storing as raw text:", {
        error: parseError.message,
        textPreview: extractedText.substring(0, 100),
      });
      popData = {rawText: extractedText};
    }

    // Store POP extraction results in Firestore
    await admin.firestore()
        .collection("companies")
        .doc(companyId)
        .collection("pops")
        .doc(videoId)
        .set({
          videoPath: filePath,
          videoUri: gcsUri,
          popData: popData,
          extractedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: "completed",
        });

    logger.info("Video processed successfully:", videoId);
    return {success: true, videoId: videoId};
  } catch (error) {
    logger.error("Error processing video:", error);

    // Store error in Firestore
    await admin.firestore()
        .collection("companies")
        .doc(companyId)
        .collection("pops")
        .doc(videoId)
        .set({
          videoPath: filePath,
          videoUri: gcsUri,
          error: error.message,
          extractedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: "failed",
        });

    throw error;
  }
});

/**
 * HTTP endpoint for health check
 */
exports.healthCheck = onRequest((request, response) => {
  logger.info("Health check requested");
  response.json({
    status: "ok",
    message: "TotalQuality Functions are running",
    timestamp: new Date().toISOString(),
  });
});
