import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export type Chunk = { section: string; text: string; index: number };
const HEADINGS = new Set([
    'summary', 'objective', 'education', 'experience', 'work experience',
    'professional experience', 'internships', 'projects', 'academic projects',
    'skills', 'technical skills', 'certifications', 'achievements', 'awards',
]);

function isHeading(line: string): boolean {
    const clean = line.trim().replace(/[:\-–]+$/, '').toLowerCase();
    return HEADINGS.has(clean);
}

function splitSections(text: string): { name: string; body: string }[] {
    const sections: { name: string; lines: string[] }[] = [{ name: 'General', lines: [] }];
    for (const line of text.split('\n')) {
        if (isHeading(line)) {
            sections.push({ name: line.trim().replace(/[:\-–]+$/, ''), lines: [] });
        } else {
            sections[sections.length - 1].lines.push(line);
        }
    }
    return sections
        .map((s) => ({ name: s.name, body: s.lines.join('\n').trim() }))
        .filter((s) => s.body.length > 0);
}

const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 600, chunkOverlap: 80 });

export async function chunkResume(text: string): Promise<Chunk[]> {
    const chunks: Chunk[] = [];
    for (const section of splitSections(text)) {
        const pieces = section.body.length <= 600 ? [section.body] : await splitter.splitText(section.body);
        for (const piece of pieces) {
            // Putting the section name inside the text helps the embedding capture context.
            chunks.push({ section: section.name, text: `[${section.name}]\n${piece}`, index: chunks.length });
        }
    }
    return chunks;
}


/**
 * ✂️ RESUME TEXT CHUNKING UTILITY
 *
 * WHAT THIS FILE DOES:
 * 1. Defines a standardized Chunk type to represent individual resume text chunks.
 * 2. Identifies common resume headings such as Education, Experience, Skills, and Projects.
 * 3. Divides extracted resume text into meaningful sections.
 * 4. Uses LangChain's RecursiveCharacterTextSplitter to split large sections into smaller chunks.
 * 5. Adds section names to each chunk to preserve contextual information.
 * 6. Assigns a unique sequential index to every generated chunk.
 *
 * WHY IT EXISTS:
 * - RAG Preparation: Converts large resume documents into smaller, manageable text units.
 * - Better Retrieval: Section-based chunking helps maintain the relationship between content and its context.
 * - Embedding Optimization: Produces appropriately sized text chunks for embedding generation.
 * - Semantic Search: Allows relevant resume information to be retrieved independently instead of processing the entire document.
 * - Reusability: Keeps text preprocessing and chunking logic separate from the main RAG workflow.
 */