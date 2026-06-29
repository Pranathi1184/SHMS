const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const dotenv = require('dotenv');
const logger = require('../utils/logger');
const { promptTemplates } = require('../prompts/aiPrompts');

dotenv.config();

const AI_PROVIDER = (process.env.AI_PROVIDER || 'groq').toLowerCase();

let openaiClient = null;
let groqClient = null;
let geminiClient = null;
let bedrockClient = null;

const getOpenAIClient = () => {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
};

const getGroqClient = () => {
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }
  return groqClient;
};

const getGeminiClient = () => {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
};

const getBedrockClient = () => {
  if (!bedrockClient && process.env.AWS_REGION) {
    bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
  }
  return bedrockClient;
};

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0';

const DEFAULT_RETRY_ATTEMPTS = Number(process.env.AI_RETRY_ATTEMPTS || 3);
const DEFAULT_RETRY_DELAY_MS = Number(process.env.AI_RETRY_DELAY_MS || 500);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const hasConfiguredProvider = () => {
  if (AI_PROVIDER === 'openai') return Boolean(process.env.OPENAI_API_KEY);
  if (AI_PROVIDER === 'gemini') return Boolean(process.env.GEMINI_API_KEY);
  if (AI_PROVIDER === 'bedrock') return Boolean(process.env.AWS_REGION && process.env.BEDROCK_MODEL_ID);
  return Boolean(process.env.GROQ_API_KEY);
};

const fallbackResponse = (contextLabel) => {
  switch (contextLabel) {
    case 'patientSummary':
      return 'AI service is not configured (missing GROQ_API_KEY). Unable to generate patient summary right now.';
    case 'medicalReport':
      return 'AI service is not configured (missing GROQ_API_KEY). Unable to generate medical report right now.';
    case 'appointmentReminder':
      return 'AI service is not configured (missing GROQ_API_KEY). Unable to generate reminder message right now.';
    case 'chatbot':
      return 'AI chatbot is temporarily unavailable because GROQ_API_KEY is not configured.';
    default:
      return 'AI service is currently unavailable.';
  }
};

const callOpenAICompatible = async (client, model, prompt) => {
  if (!client) {
    throw new Error('Selected provider client is not configured');
  }
  const response = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
  });
  return response?.choices?.[0]?.message?.content?.trim();
};

const callGemini = async (prompt) => {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: GEMINI_MODEL });
  const response = await model.generateContent(prompt);
  return response.response?.text()?.trim();
};

const callBedrock = async (prompt) => {
  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 900,
    temperature: 0.4,
    messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
  };

  const cmd = new InvokeModelCommand({
    modelId: BEDROCK_MODEL_ID,
    body: JSON.stringify(payload),
    contentType: 'application/json',
    accept: 'application/json',
  });

  const result = await getBedrockClient().send(cmd);
  const raw = JSON.parse(Buffer.from(result.body).toString('utf-8'));
  return raw?.content?.[0]?.text?.trim();
};

async function callAI(prompt, contextLabel) {
  if (!hasConfiguredProvider()) {
    logger.warn('AI fallback response returned: provider not configured', { context: contextLabel, provider: AI_PROVIDER });
    return fallbackResponse(contextLabel);
  }

  let lastError;

  for (let attempt = 1; attempt <= DEFAULT_RETRY_ATTEMPTS; attempt += 1) {
    const start = Date.now();
    try {
      let text = null;
      if (AI_PROVIDER === 'openai') {
        text = await callOpenAICompatible(getOpenAIClient(), OPENAI_MODEL, prompt);
      } else if (AI_PROVIDER === 'gemini') {
        text = await callGemini(prompt);
      } else if (AI_PROVIDER === 'bedrock') {
        text = await callBedrock(prompt);
      } else {
        text = await callOpenAICompatible(getGroqClient(), GROQ_MODEL, prompt);
      }

      if (!text) {
        throw new Error('Empty model response');
      }

      logger.info('AI call succeeded', {
        context: contextLabel,
        provider: AI_PROVIDER,
        attempt,
        durationMs: Date.now() - start,
      });
      return text;
    } catch (error) {
      lastError = error;
      logger.warn('AI call attempt failed', {
        context: contextLabel,
        attempt,
        maxAttempts: DEFAULT_RETRY_ATTEMPTS,
        message: error.message,
      });

      if (attempt < DEFAULT_RETRY_ATTEMPTS) {
        await sleep(DEFAULT_RETRY_DELAY_MS * attempt);
      }
    }
  }

  logger.warn('AI fallback response returned after retries exhausted', {
    context: contextLabel,
    provider: AI_PROVIDER,
    message: lastError?.message,
  });
  return fallbackResponse(contextLabel);
}

/**
 * Generate AI Patient Summary
 */
const generatePatientSummary = async (patientData) => {
  const prompt = promptTemplates.patientSummary(patientData);
  return callAI(prompt, 'patientSummary');
};

/**
 * Generate Professional Medical Report
 */
const generateMedicalReport = async (doctorNotes) => {
  const prompt = promptTemplates.medicalReport(doctorNotes);
  return callAI(prompt, 'medicalReport');
};

/**
 * Generate Appointment Reminder Message
 */
const generateAppointmentReminder = async (appointmentDetails) => {
  const prompt = promptTemplates.appointmentReminder(appointmentDetails);
  return callAI(prompt, 'appointmentReminder');
};

/**
 * Hospital AI Chatbot Logic
 */
const hospitalChatbot = async (userQuery, context, role = 'User') => {
  const prompt = promptTemplates.chatbot(userQuery, context, role);
  return callAI(prompt, 'chatbot');
};

module.exports = {
  generatePatientSummary,
  generateMedicalReport,
  generateAppointmentReminder,
  hospitalChatbot,
};
