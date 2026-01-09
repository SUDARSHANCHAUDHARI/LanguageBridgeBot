/**
 * Voice Message Service
 * Handles voice message transcription and translation
 */

const { SpeechClient } = require('@google-cloud/speech');
const config = require('../config/environment');
const { translateText } = require('./translationService');
const { client } = require('../bot/webhook');

// Initialize Google Speech-to-Text client
let speechClient = null;
if (config.google?.speechApiKey) {
  speechClient = new SpeechClient({
    key: config.google.speechApiKey,
  });
}

/**
 * Download voice message content from LINE
 * @param {string} messageId - LINE message ID
 * @returns {Promise<Buffer>} Audio content buffer
 */
async function downloadVoiceMessage(messageId) {
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
    throw new Error(`Failed to download voice message: ${error.message}`);
  }
}

/**
 * Transcribe voice message to text
 * @param {Buffer} audioBuffer - Audio content buffer
 * @param {string} languageCode - Language code (e.g., 'en-US', 'th-TH')
 * @returns {Promise<string>} Transcribed text
 */
async function transcribeVoice(audioBuffer, languageCode = 'auto') {
  try {
    if (!speechClient) {
      throw new Error('Speech-to-Text API not configured. Please set GOOGLE_SPEECH_API_KEY in .env');
    }

    // Auto-detect language if not specified
    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: languageCode === 'auto' ? null : languageCode,
      alternativeLanguageCodes: languageCode === 'auto' 
        ? ['en-US', 'th-TH', 'ja-JP', 'ko-KR', 'zh-CN', 'vi-VN']
        : [],
      enableAutomaticPunctuation: true,
    };

    const audio = {
      content: audioBuffer.toString('base64'),
    };

    const request = {
      config,
      audio,
    };

    const [response] = await speechClient.recognize(request);
    
    if (!response.results || response.results.length === 0) {
      throw new Error('No transcription results');
    }

    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join(' ');

    return transcription;
  } catch (error) {
    throw new Error(`Voice transcription failed: ${error.message}`);
  }
}

/**
 * Handle voice message - transcribe and translate
 * @param {Object} event - LINE message event with voice message
 * @param {string} targetLanguages - Array of target language codes
 * @returns {Promise<Object>} Transcription and translations
 */
async function handleVoiceMessage(event, targetLanguages) {
  try {
    const messageId = event.message.id;
    const duration = event.message.duration;

    // Check if voice message is too long (LINE limit: 60 seconds)
    if (duration > 60000) {
      throw new Error('Voice message too long. Maximum 60 seconds.');
    }

    // Download voice message
    const audioBuffer = await downloadVoiceMessage(messageId);

    // Transcribe voice to text
    const transcribedText = await transcribeVoice(audioBuffer);

    if (!transcribedText || transcribedText.trim().length === 0) {
      throw new Error('Could not transcribe voice message');
    }

    // Detect source language from transcription
    const { detectLanguage } = require('./translationService');
    const sourceLang = await detectLanguage(transcribedText);

    // Translate to target languages
    const { translateToMultiple } = require('./translationService');
    const translations = await translateToMultiple(
      transcribedText,
      sourceLang,
      targetLanguages
    );

    return {
      originalText: transcribedText,
      sourceLanguage: sourceLang,
      translations,
      duration,
    };
  } catch (error) {
    throw new Error(`Voice message processing failed: ${error.message}`);
  }
}

module.exports = {
  downloadVoiceMessage,
  transcribeVoice,
  handleVoiceMessage,
};
