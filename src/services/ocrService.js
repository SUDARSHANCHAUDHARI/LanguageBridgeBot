/**
 * OCR Service
 * Handles image text extraction and translation using Google Cloud Vision API
 */

const vision = require('@google-cloud/vision');
const config = require('../config/environment');
const { translateText, detectLanguage } = require('./translationService');
const { client } = require('../bot/webhook');

// Initialize Google Vision client
let visionClient = null;
if (config.google?.visionApiKey) {
  visionClient = new vision.ImageAnnotatorClient({
    key: config.google.visionApiKey,
  });
}

/**
 * Download image content from LINE
 * @param {string} messageId - LINE message ID
 * @returns {Promise<Buffer>} Image content buffer
 */
async function downloadImage(messageId) {
  try {
    const stream = await client.getMessageContent(messageId);
    const chunks = [];
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

/**
 * Extract text from image using OCR
 * @param {Buffer} imageBuffer - Image content buffer
 * @param {string[]} targetLanguages - Optional hint languages for better detection
 * @returns {Promise<Object>} Extracted text and language information
 */
async function extractTextFromImage(imageBuffer, targetLanguages = []) {
  try {
    if (!visionClient) {
      throw new Error('Vision API not configured. Please set GOOGLE_VISION_API_KEY in .env');
    }

    // Prepare image for Vision API
    const image = {
      content: imageBuffer,
    };

    // Configure text detection with language hints
    const imageContext = {
      languageHints: targetLanguages.length > 0 ? targetLanguages : undefined,
    };

    // Perform text detection
    const [result] = await visionClient.textDetection({
      image,
      imageContext: Object.keys(imageContext).length > 0 ? imageContext : undefined,
    });

    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      throw new Error('No text found in image');
    }

    // First detection contains all text, others are individual words
    const fullText = detections[0].description;
    const detectedLanguage = detections[0].locale || 'en';

    // Extract individual text blocks with positions
    const textBlocks = detections.slice(1).map(detection => ({
      text: detection.description,
      boundingBox: detection.boundingPoly,
    }));

    return {
      fullText: fullText.trim(),
      detectedLanguage,
      textBlocks,
      wordCount: textBlocks.length,
    };
  } catch (error) {
    throw new Error(`OCR extraction failed: ${error.message}`);
  }
}

/**
 * Handle image message - extract text and translate
 * @param {Object} event - LINE message event with image
 * @param {string[]} targetLanguages - Array of target language codes
 * @returns {Promise<Object>} Extracted text and translations
 */
async function handleImageMessage(event, targetLanguages) {
  try {
    const messageId = event.message.id;

    // Download image
    const imageBuffer = await downloadImage(messageId);

    // Extract text from image
    const ocrResult = await extractTextFromImage(imageBuffer, targetLanguages);

    if (!ocrResult.fullText || ocrResult.fullText.trim().length === 0) {
      throw new Error('No text found in image');
    }

    // Detect source language
    const sourceLang = await detectLanguage(ocrResult.fullText);

    // Translate to target languages
    const { translateToMultiple } = require('./translationService');
    const translations = await translateToMultiple(
      ocrResult.fullText,
      sourceLang,
      targetLanguages
    );

    return {
      originalText: ocrResult.fullText,
      sourceLanguage: sourceLang,
      translations,
      textBlocks: ocrResult.textBlocks,
      detectedLanguage: ocrResult.detectedLanguage,
    };
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`);
  }
}

/**
 * Check if image contains text (quick check before full OCR)
 * @param {Buffer} imageBuffer - Image content buffer
 * @returns {Promise<boolean>} True if image likely contains text
 */
async function hasText(imageBuffer) {
  try {
    if (!visionClient) {
      return false;
    }

    const image = { content: imageBuffer };
    const [result] = await visionClient.textDetection({ image });
    
    return result.textAnnotations && result.textAnnotations.length > 0;
  } catch (error) {
    console.error('Error checking for text in image:', error);
    return false;
  }
}

module.exports = {
  downloadImage,
  extractTextFromImage,
  handleImageMessage,
  hasText,
};
