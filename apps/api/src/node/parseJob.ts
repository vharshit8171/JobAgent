import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { llm } from '../lib/llm.js';
import { parsedJobSchema } from '../graph/schemas.js';
import type { State, Update } from '../graph/state.js';

// 1. Configure the LLM to return job information matching the predefined Zod schema.
const structured = llm.withStructuredOutput(parsedJobSchema, { name: 'parsed_job' });

// 2. Define a LangGraph node responsible for extracting structured information from a job description.
export async function parseJob(state: State): Promise<Update> {
  console.log('→ parseJob');

  // 3. Send instructions and the user's job description to the LLM for structured extraction.
  const parsedJob = await structured.invoke([
    new SystemMessage(
      'You extract structured data from job descriptions. Be concise. ' +
      'Requirements must be short phrases like "React.js" or "REST API design".'
    ),
    new HumanMessage(state.jobDescription),
  ]);

  // 4. Return the extracted job details to update the shared LangGraph state.
  return { parsedJob };
}


/**
 * 📄 JOB DESCRIPTION PARSING NODE
 *
 * WHAT THIS FILE DOES:
 * 1. Imports the configured Groq LLM and the job parsing Zod schema.
 * 2. Configures the LLM to generate structured output matching parsedJobSchema.
 * 3. Receives the job description from the shared LangGraph state.
 * 4. Sends system instructions and the job description to the LLM.
 * 5. Extracts important job details such as title, company, requirements, and responsibilities.
 * 6. Returns the structured job information as a state update.
 *
 * WHY IT EXISTS:
 * - Job Extraction: Converts unstructured job descriptions into structured information.
 * - Structured Output: Ensures extracted information follows the predefined schema.
 * - Workflow Integration: Makes job details available to subsequent LangGraph nodes.
 * - Reusability: Keeps job description parsing logic separate from the main workflow.
 */