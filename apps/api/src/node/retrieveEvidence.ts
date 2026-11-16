import { embedQueries } from '../rag/embed.js';
import { searchCareer } from '../rag/vectorStore.js';
import type { State, Update } from '../graph/state.js';

// 1. Retrieve resume evidence relevant to each parsed job requirement.
export async function retrieveEvidence(state: State): Promise<Update> {
  console.log('→ retrieveEvidence');

  // 2. Extract the requirements identified by the parseJob node.
  const requirements = state.parsedJob?.requirements ?? [];

  // 3. Skip vector retrieval when the job description contains no requirements.
  if (requirements.length === 0) return { evidence: {} };

  // 4. Convert all requirements into embedding vectors for semantic search.
  const vectors = await embedQueries(requirements);

  // 5. Search Qdrant for the two most relevant resume chunks per requirement.
  const results = await Promise.all(
    vectors.map((v) => searchCareer(state.userId, v, 2))
  );

  // 6. Create a mapping between each requirement and its retrieved resume evidence.
  const evidence: Record<string, string[]> = {};

  requirements.forEach((req, i) => {
    evidence[req] = results[i].map((r) => r.text);
  });

  // 7. Return the retrieved evidence to the shared LangGraph state.
  return { evidence };
}

/**
 * 🔍 WHAT THIS FILE DOES:
 *
 * 1. Receives the parsed job requirements from the shared graph state.
 * 2. Handles the case where no requirements are available.
 * 3. Converts each job requirement into a vector embedding using embedQueries().
 * 4. Performs semantic searches against the candidate's resume data in Qdrant.
 * 5. Retrieves the two most relevant resume chunks for every requirement.
 * 6. Organizes the retrieved chunks into a requirement-to-evidence mapping.
 * 7. Returns the evidence object so downstream graph nodes can evaluate
 *    how well the candidate's resume matches the job requirements.
 *
 * WHY IT EXISTS:
 *
 * - Connects job requirements with relevant information from the candidate's resume.
 * - Uses semantic similarity instead of relying only on exact keyword matching.
 * - Provides evidence to the scoreMatch node for evaluating candidate suitability.
 * - Helps the tailoring and grounding nodes generate content based on actual
 *   information available in the candidate's resume.
 * - Keeps retrieval logic separate from scoring and content generation.
 */