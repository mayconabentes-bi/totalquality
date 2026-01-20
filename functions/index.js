/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const {onObjectFinalized} = require("firebase-functions/v2/storage");
const {GoogleGenerativeAI} = require("@google/generative-ai");

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
}, async (event) => {
  const filePath = event.data.name;
  const contentType = event.data.contentType;

  // Only process video files in the companies/{companyId}/videos/ path
  if (!contentType.startsWith("video/") || !filePath.includes("/videos/")) {
    logger.info("Skipping non-video file or invalid path:", filePath);
    return null;
  }

  logger.info("Processing video:", filePath);

  // Extract company ID from path
  const pathParts = filePath.split("/");
  const companyId = pathParts[1];
  const videoId = pathParts[3]?.split(".")[0];

  if (!companyId || !videoId) {
    logger.error("Invalid file path structure:", filePath);
    return null;
  }

  try {
    // Initialize Gemini AI (requires GEMINI_API_KEY environment variable)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({model: "gemini-1.5-pro"});

    // Get video file from Storage
    const bucket = admin.storage().bucket(event.data.bucket);
    const file = bucket.file(filePath);

    // Create a temporary download URL (valid for 1 hour)
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 3600000,
    });

    // Process video with Gemini 1.5 Pro
    const prompt = `Analise este vídeo de qualidade empresarial e forneça:
1. Resumo do conteúdo
2. Identificação de problemas de qualidade (se houver)
3. Métricas de conformidade
4. Recomendações de melhoria
5. Score de qualidade (0-100)`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: contentType,
          data: url,
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
