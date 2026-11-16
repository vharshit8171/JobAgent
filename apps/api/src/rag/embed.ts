import { GoogleGenAI } from '@google/genai';
import { env } from '../lib/env.js';
import { EMBEDDING_DIM, EMBEDDING_MODEL } from '../lib/config.js';

// 1. Ensure the Google AI API key is configured before initializing the embedding client.
if (!env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY is missing. Add it to apps/api/.env');
}

// 2. Initialize the Google GenAI client using the configured API key.
const ai = new GoogleGenAI({ apiKey: env.GOOGLE_API_KEY });

// 3. Define the maximum number of texts processed in a single batch.
const BATCH_SIZE = 50;

// 4. Generate vector embeddings for multiple texts using the specified retrieval task.
async function embed(texts: string[], taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY') {
    const res = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: texts,
        config: { taskType, outputDimensionality: EMBEDDING_DIM },
    });

    // Extract the generated embedding vectors from the API response.
    const vectors = (res.embeddings ?? []).map((e) => e.values ?? []);

    // Ensure the API returns exactly one embedding for each input text.
    if (vectors.length !== texts.length) {
        throw new Error(`Expected ${texts.length} embeddings, got ${vectors.length}`);
    }

    return vectors;
}

/** 5. Generate embeddings for resume document chunks in batches. */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
    const all: number[][] = [];

    // Process the input texts in batches to avoid sending too many at once.
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        all.push(...(await embed(texts.slice(i, i + BATCH_SIZE), 'RETRIEVAL_DOCUMENT')));
    }

    return all;
}

/** 6. Generate an embedding vector for a single search query. */
export async function embedQuery(text: string): Promise<number[]> {
    const [vector] = await embed([text], 'RETRIEVAL_QUERY');
    return vector;
}

/** 7. Generate embedding vectors for multiple search queries in one API call. */
export async function embedQueries(texts: string[]): Promise<number[][]> {
    return embed(texts, 'RETRIEVAL_QUERY');
}


/**
 * 🧠 GOOGLE TEXT EMBEDDING UTILITY
 *
 * WHAT THIS FILE DOES:
 * 1. Initializes the Google Gemini embedding client using the configured API key.
 * 2. Generates vector embeddings from text using Google's embedding model.
 * 3. Processes multiple document chunks in batches to reduce API requests.
 * 4. Uses RETRIEVAL_DOCUMENT for resume content embeddings.
 * 5. Uses RETRIEVAL_QUERY for user search query embeddings.
 * 6. Validates the number of generated embeddings before returning the vectors.
 * 7. Supports embedding generation for both individual and multiple search queries.
 *
 * WHY IT EXISTS:
 * - Semantic Search: Converts text into numerical vectors that capture semantic meaning.
 * - RAG Integration: Prepares resume chunks and user queries for vector-based retrieval.
 * - Efficient Processing: Uses batch processing to handle multiple document chunks efficiently.
 * - Task Optimization: Uses different embedding task types for documents and search queries.
 * - Consistency: Centralizes embedding configuration and generation logic.
 * - Reusability: Keeps Google AI embedding operations separate from the main application workflow.
 */