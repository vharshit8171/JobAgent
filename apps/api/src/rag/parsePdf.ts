import { readFile } from 'node:fs/promises';
import { extractText, getDocumentProxy } from 'unpdf';

export async function parsePdf(filePath: string): Promise<string> {
    const buffer = await readFile(filePath);
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text.trim();
}


/**
 * 📄 PDF TEXT EXTRACTION UTILITY
 *
 * WHAT THIS FILE DOES:
 * 1. Reads a PDF document from the local filesystem.
 * 2. Loads the PDF using the unpdf library.
 * 3. Extracts textual content from all PDF pages.
 * 4. Merges the extracted page content into a single string.
 * 5. Returns cleaned text for further processing.
 *
 * WHY IT EXISTS:
 * - Document Ingestion: Converts PDF documents into machine-readable text.
 * - RAG Preparation: Provides extracted content for text splitting and embedding generation.
 * - Reusability: Keeps PDF parsing logic separate from the main application workflow.
 * - Consistency: Standardizes how PDF documents are processed before entering the RAG pipeline.
 */