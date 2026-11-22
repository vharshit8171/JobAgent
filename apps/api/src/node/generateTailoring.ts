import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { llm } from '../lib/llm.js';
import { tailoringSchema } from '../graph/schemas.js';
import { collectEvidence, type State, type Update } from '../graph/state.js';

const CANDIDATE_NAME = process.env.CANDIDATE_NAME ?? "Harshit";

// 1. Configure the LLM to generate resume and cover letter content matching the tailoring schema.
const structured = llm.withStructuredOutput(tailoringSchema, { name: 'tailoring' });

// 2. Define a LangGraph node responsible for generating job-specific application content.
export async function generateTailoring(state: State): Promise<Update> {

  // 3. Increment the attempt counter to track how many times tailoring has been generated.
  const attempt = state.attempts + 1;
  console.log(`→ generateTailoring (attempt ${attempt})`);

  // 4. Retrieve the previously extracted job details from the shared graph state.
  const job = state.parsedJob;

  // 5. Prepare feedback from previous grounding checks, if any unsupported claims were found.
  const feedback = state.groundingIssues.length
    ? `\n\nYour previous draft had unsupported claims. Fix them:\n- ${state.groundingIssues.join('\n- ')}`
    : '';

  // 6. Generate tailored resume bullet points and a cover letter using the job and candidate information.
  const draft = await structured.invoke([
    new SystemMessage(
      `You help a candidate apply for a job. Strict rules:
- Use ONLY facts found in the CANDIDATE MATERIAL. Never invent employers, tools, numbers or achievements.
- Do not claim skills missing from the material. You may mention willingness to learn them.
- Write 3 to 6 resume bullets and a cover letter under 200 words.
- Sign the cover letter with "[Your Name]".
- The candidate's name is ${CANDIDATE_NAME}. Sign the cover letter with it.
Never use placeholders like [Your Name].
Do not claim years of experience or any employer that is not in the evidence.
The candidate is a recent graduate, so frame experience around projects.`
    ),
    new HumanMessage(
      `JOB: ${job?.title} at ${job?.company}
REQUIREMENTS: ${job?.requirements.join(', ')}

CANDIDATE MATERIAL:
${collectEvidence(state.evidence)}${feedback}`
    ),
  ]);
  draft.coverLetter = draft.coverLetter.replace(/\[Your Name\]/gi, CANDIDATE_NAME);

  // 7. Return the generated draft and updated attempt count to the shared graph state.
  return { draft, attempts: attempt };
}


/**
 * ✍️ RESUME & COVER LETTER TAILORING NODE
 *
 * WHAT THIS FILE DOES:
 * 1. Configures the LLM to generate structured tailoring output using tailoringSchema.
 * 2. Tracks the number of times resume tailoring has been attempted.
 * 3. Retrieves parsed job details and candidate evidence from the shared graph state.
 * 4. Collects unique candidate evidence into a single text block.
 * 5. Includes feedback from previous grounding checks when unsupported claims are detected.
 * 6. Instructs the LLM to generate 3 to 6 tailored resume bullet points.
 * 7. Generates a customized cover letter based on the job requirements and candidate information.
 * 8. Returns the generated draft and updated attempt count as a LangGraph state update.
 *
 * WHY IT EXISTS:
 * - Resume Optimization: Highlights candidate qualifications relevant to a specific job.
 * - Personalized Applications: Generates job-specific resume content and cover letters.
 * - Grounded Generation: Restricts generated content to facts supported by candidate material.
 * - Feedback Loop: Uses previous validation feedback to correct unsupported claims.
 * - Iterative Improvement: Tracks generation attempts for controlled review and regeneration.
 * - Workflow Integration: Makes tailored application content available to subsequent LangGraph nodes.
 */