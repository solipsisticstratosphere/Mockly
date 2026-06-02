import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is required');

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const GROQ_MODELS = {
  question:  'llama-3.1-70b-versatile',
  feedback:  'llama-3.1-70b-versatile',
  followup:  'llama-3.1-8b-instant',
  rapid:     'llama-3.1-8b-instant',
  whisper:   'whisper-large-v3',
} as const;

export const GROQ_DEFAULTS = {
  question: { max_tokens: 300,  temperature: 0.8 },
  feedback: { max_tokens: 600,  temperature: 0.3 },
  followup: { max_tokens: 150,  temperature: 0.9 },
};
