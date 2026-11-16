import { ChatGroq } from '@langchain/groq';
import { env } from './env.js';

// 1. Ensure the Groq API key is available before initializing the LLM.
if (!env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is missing. Add it to apps/api/.env');
}

// 2. Initialize a reusable Groq LLM instance with the required configuration.
export const llm = new ChatGroq({
  model: 'openai/gpt-oss-120b',
  temperature: 0, // Keep responses consistent and reduce randomness.
  maxRetries: 2, // Retry failed API requests up to two times.
  apiKey: env.GROQ_API_KEY, // Authenticate requests using the configured Groq API key.
});


/**
 * 🤖 LARGE LANGUAGE MODEL CONFIGURATION
 *
 * WHAT THIS FILE DOES:
 * 1. Imports ChatGroq to integrate Groq-hosted language models with LangChain.
 * 2. Loads the Groq API key from the application's environment configuration.
 * 3. Checks whether the required API key is available before proceeding.
 * 4. Initializes the GPT-OSS-120B model with the desired configuration.
 * 5. Exports a reusable LLM instance for use throughout the JobAgent application.
 *
 * WHY IT EXISTS:
 * - Centralization: Keeps LLM initialization and configuration in one place.
 * - Reusability: Allows different LangGraph nodes to use the same configured LLM.
 * - Consistency: Maintains common model settings across the application.
 * - Reliability: Configures retries and prevents initialization without an API key.
 */