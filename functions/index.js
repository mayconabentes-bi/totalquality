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

// Analysis prompt for Gemini
const ANALYSIS_PROMPT = `Analise este vídeo de qualidade empresarial e forneça:
1. Resumo do conteúdo
2. Identificação de problemas de qualidade (se houver)
3. Métricas de conformidade
4. Recomendações de melhoria
5. Score de qualidade (0-100)`;

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Cloud Function to process uploaded videos with Gemini 1.5 Pro
 * Triggered when a new video is uploaded to Storage
 */
exports.processVideoWithGemini = onObjectFinalized({
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

  try {
    // Initialize Gemini AI with secret API key
    const genAI = new GoogleGenerativeAI(geminiApiKey.value());
    const model = genAI.getGenerativeModel({model: "gemini-1.5-pro"});

    // Get video file from Storage
    const bucket = admin.storage().bucket(event.data.bucket);
    const file = bucket.file(filePath);

    // Use GCS URI format for Gemini (gs://bucket/path)
    const gcsUri = `gs://${event.data.bucket}/${filePath}`;

    // Process video with Gemini 1.5 Pro
    const result = await model.generateContent([
      ANALYSIS_PROMPT,
      {
        fileData: {
          mimeType: contentType,
          fileUri: gcsUri,
        },
      },
    ]);

    const response = result.response;
    const analysis = response.text();

    // Store analysis results in Firestore
    await admin.firestore()
        .collection("companies")
        .doc(companyId)
        .collection("analyses")
        .doc(videoId)
        .set({
          videoPath: filePath,
          analysis: analysis,
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
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
        .collection("analyses")
        .doc(videoId)
        .set({
          videoPath: filePath,
          error: error.message,
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
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
