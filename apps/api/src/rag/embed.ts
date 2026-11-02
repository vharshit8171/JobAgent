import { GoogleGenAI } from '@google/genai';
import { env } from '../lib/env.js';
import { EMBEDDING_DIM, EMBEDDING_MODEL } from '../lib/config.js';

if (!env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY is missing. Add it to apps/api/.env');
}

const ai = new GoogleGenAI({ apiKey: env.GOOGLE_API_KEY });
const BATCH_SIZE = 50;

async function embed(texts: string[], taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY') {
    const res = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: texts,
        config: { taskType, outputDimensionality: EMBEDDING_DIM },
    });
    const vectors = (res.embeddings ?? []).map((e) => e.values ?? []);
    if (vectors.length !== texts.length) {
        throw new Error(`Expected ${texts.length} embeddings, got ${vectors.length}`);
    }
    return vectors;
}

/** For the resume chunks we store. */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
    const all: number[][] = [];
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        all.push(...(await embed(texts.slice(i, i + BATCH_SIZE), 'RETRIEVAL_DOCUMENT')));
    }
    return all;
}

/** For the search question. */
export async function embedQuery(text: string): Promise<number[]> {
    const [vector] = await embed([text], 'RETRIEVAL_QUERY');
    return vector;
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
 *
 * WHY IT EXISTS:
 * - Semantic Search: Converts text into numerical vectors that capture semantic meaning.
 * - RAG Integration: Prepares resume chunks and user queries for vector-based retrieval.
 * - Efficient Processing: Uses batch processing to handle multiple document chunks efficiently.
 * - Consistent Embeddings: Centralizes embedding configuration and generation logic.
 * - Reusability: Keeps Google AI embedding operations separate from the main application workflow.
 */