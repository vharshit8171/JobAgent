import path from 'node:path';
import mongoose from 'mongoose';
import { connectMongo } from '../lib/mongo.js';
import { DEV_USER_ID } from '../lib/config.js';
import { parsePdf } from '../rag/parsePdf.js';
import { chunkResume } from '../rag/chunk.js';
import { embedDocuments } from '../rag/embed.js';
import { ensureCollection, replaceResumeChunks } from '../rag/vectorStore.js';
import { Resume } from '../model/Resume.js';

async function main() {
    const filePath = process.argv[2];
    if (!filePath) throw new Error('Usage: npm run ingest -- <path-to-resume.pdf>');

    const fileName = path.basename(filePath);
    const resumeId = path.basename(filePath, path.extname(filePath));

    const text = await parsePdf(filePath);
    console.log(`Parsed ${text.length} characters`);

    const chunks = await chunkResume(text);
    console.log(`Created ${chunks.length} chunks:`);
    for (const c of chunks) console.log(`  [${c.section}] ${c.text.length} chars`);

    const vectors = await embedDocuments(chunks.map((c) => c.text));
    await ensureCollection();
    await replaceResumeChunks(DEV_USER_ID, resumeId, chunks, vectors);

    await connectMongo();
    await Resume.findOneAndUpdate(
        { userId: DEV_USER_ID, resumeId },
        { fileName, rawText: text, chunkCount: chunks.length },
        { upsert: true }
    );
    console.log('Done. Resume stored in Qdrant and MongoDB.');
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