import { readFile } from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import { connectMongo } from '../lib/mongo.js';
import { DEV_USER_ID } from '../lib/config.js';
import { ingestResume } from '../rag/ingestResume.js';

async function main() {
    const filePath = process.argv[2];
    if (!filePath) throw new Error('Usage: npm run ingest -- <path-to-resume.pdf>');

    await connectMongo();
    const data = new Uint8Array(await readFile(filePath));
    const result = await ingestResume({ userId: DEV_USER_ID, fileName: path.basename(filePath), data });
    console.log('Done:', result);
}

main()
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());

/**
 * 📥 RESUME INGESTION SCRIPT
 *
 * WHAT THIS FILE DOES:
 * 1. Accepts a PDF resume path through command-line arguments.
 * 2. Extracts readable text from the PDF using the PDF parsing utility.
 * 3. Divides the extracted text into smaller, meaningful resume chunks.
 * 4. Generates vector embeddings for all resume chunks using Google AI.
 * 5. Ensures the Qdrant collection exists and stores the generated vectors.
 * 6. Saves the original extracted text and resume metadata in MongoDB.
 * 7. Handles ingestion errors and disconnects from MongoDB after execution.
 *
 * WHY IT EXISTS:
 * - Pipeline Orchestration: Connects all RAG preprocessing utilities into one workflow.
 * - Resume Processing: Automates the conversion of PDF resumes into searchable data.
 * - Vector Storage: Stores resume embeddings in Qdrant for semantic retrieval.
 * - Data Management: Maintains original resume content and metadata in MongoDB.
 * - Development Testing: Provides a simple way to test the complete RAG ingestion pipeline.
 */