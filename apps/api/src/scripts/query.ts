import { DEV_USER_ID } from '../lib/config.js';
import { embedQuery } from '../rag/embed.js';
import { searchCareer } from '../rag/vectorStore.js';

async function main() {
    const question = process.argv.slice(2).join(' ');
    if (!question) throw new Error('Usage: npm run query -- "your question"');

    const vector = await embedQuery(question);
    const hits = await searchCareer(DEV_USER_ID, vector, 4);

    for (const h of hits) {
        console.log(`\nscore ${h.score.toFixed(3)}  [${h.section}]`);
        console.log(h.text);
    }
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});


/**
 * 🔍 RESUME QUERY AND SEMANTIC SEARCH SCRIPT
 *
 * WHAT THIS FILE DOES:
 * 1. Accepts a natural-language question through command-line arguments.
 * 2. Generates a vector embedding for the user's question using Google AI.
 * 3. Searches Qdrant for resume chunks that are semantically similar to the question.
 * 4. Filters search results using the configured development user ID.
 * 5. Retrieves the four most relevant chunks from the vector database.
 * 6. Displays similarity scores, resume sections, and matching text in the terminal.
 *
 * WHY IT EXISTS:
 * - Semantic Search: Finds relevant resume information based on the meaning of a question.
 * - Vector Retrieval: Uses embeddings to retrieve relevant content from Qdrant.
 * - RAG Testing: Allows testing of the retrieval stage before integrating an LLM.
 * - Development Utility: Provides a simple way to verify that stored resume embeddings work correctly.
 */