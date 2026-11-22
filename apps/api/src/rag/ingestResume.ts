import path from 'node:path';
import { HttpError } from '../lib/http.js';
import { Resume } from '../model/Resume.js';
import { chunkResume } from './chunk.js';
import { embedDocuments } from './embed.js';
import { parsePdfBuffer } from './parsePdf.js';
import { ensureCollection, replaceResumeChunks } from './vectorStore.js';

type IngestInput = { userId: string; fileName: string; data: Uint8Array };

export async function ingestResume({ userId, fileName, data }: IngestInput) {
    // "My Resume (1).pdf" becomes "my-resume-1"
    const resumeId = path
        .parse(fileName)
        .name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'resume';

    const text = await parsePdfBuffer(data);
    if (text.length < 50) {
        throw new HttpError(422, 'Could not read text from this PDF. Is it a scanned image?');
    }

    const chunks = await chunkResume(text);
    const vectors = await embedDocuments(chunks.map((c) => c.text));
    await ensureCollection();
    await replaceResumeChunks(userId, resumeId, chunks, vectors);

    await Resume.findOneAndUpdate(
        { userId, resumeId },
        { fileName, rawText: text, chunkCount: chunks.length },
        { upsert: true }
    );

    return { resumeId, chunkCount: chunks.length, sections: [...new Set(chunks.map((c) => c.section))] };
}