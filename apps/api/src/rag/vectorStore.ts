import { randomUUID } from 'node:crypto';
import { qdrant } from '../lib/qdrant.js';
import { COLLECTION, EMBEDDING_DIM } from '../lib/config.js';
import type { Chunk } from './chunk.js';

export async function ensureCollection(): Promise<void> {
    const { exists } = await qdrant.collectionExists(COLLECTION);
    if (exists) return;
    await qdrant.createCollection(COLLECTION, {
        vectors: { size: EMBEDDING_DIM, distance: 'Cosine' },
    });
    // Indexes make filtering by these fields fast.
    await qdrant.createPayloadIndex(COLLECTION, { field_name: 'userId', field_schema: 'keyword' });
    await qdrant.createPayloadIndex(COLLECTION, { field_name: 'resumeId', field_schema: 'keyword' });
}

/** Delete old chunks of this resume, then insert the new ones, so re-running never duplicates. */
export async function replaceResumeChunks(
    userId: string,
    resumeId: string,
    chunks: Chunk[],
    vectors: number[][]
): Promise<void> {
    await qdrant.delete(COLLECTION, {
        wait: true,
        filter: {
            must: [
                { key: 'userId', match: { value: userId } },
                { key: 'resumeId', match: { value: resumeId } }
            ]
        },
    });
    await qdrant.upsert(COLLECTION, {
        wait: true,
        points: chunks.map((c, i) => ({
            id: randomUUID(),
            vector: vectors[i],
            payload: { userId, resumeId, section: c.section, text: c.text, chunkIndex: c.index },
        })),
    });
}

export async function searchCareer(userId: string, vector: number[], limit = 4) {
    const res = await qdrant.query(COLLECTION, {
        query: vector,
        limit,
        with_payload: true,
        filter: { must: [{ key: 'userId', match: { value: userId } }] },
    });
    return res.points.map((p) => ({
        score: p.score,
        section: String(p.payload?.section ?? ''),
        text: String(p.payload?.text ?? ''),
    }));
}


/**
 * 🗄️ QDRANT VECTOR DATABASE UTILITY
 *
 * WHAT THIS FILE DOES:
 * 1. Checks whether the Qdrant collection exists and creates it when needed.
 * 2. Configures vector dimensions and cosine similarity for semantic search.
 * 3. Creates payload indexes for efficient filtering by userId and resumeId.
 * 4. Deletes previously stored chunks when a resume is reprocessed.
 * 5. Stores new resume chunks, their embeddings, and related metadata in Qdrant.
 * 6. Searches for relevant resume chunks using vector similarity.
 * 7. Filters search results by userId to keep retrieval user-specific.
 *
 * WHY IT EXISTS:
 * - Vector Storage: Stores resume embeddings for semantic search.
 * - Data Management: Keeps resume vectors updated without accumulating duplicates.
 * - Semantic Retrieval: Finds relevant resume information based on query meaning.
 * - User Isolation: Ensures users retrieve their own resume information.
 * - RAG Integration: Supplies relevant resume context to the LLM when generating responses.
 * - Reusability: Centralizes Qdrant database operations in one utility.
 */