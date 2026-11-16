import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { llm } from '../lib/llm.js';
import { groundingSchema } from '../graph/schemas.js';
import { collectEvidence, type State, type Update } from '../graph/state.js';

// 1. Configure the LLM to return a structured grounding verification result.
const structured = llm.withStructuredOutput(groundingSchema, { name: 'grounding' });

// 2. Define a LangGraph node responsible for verifying the factual accuracy of generated content.
export async function groundingCheck(state: State): Promise<Update> {
  console.log('→ groundingCheck');

  // 3. Compare the generated draft against the original candidate evidence.
  const result = await structured.invoke([
    new SystemMessage(
      `You are a strict fact checker. Compare the DRAFT with the CANDIDATE MATERIAL.
List every claim in the draft (skill, tool, employer, project, metric, achievement) that the material does not support.
Rewording is fine. If everything is supported, set grounded to true and issues to an empty list.`
    ),
    new HumanMessage(
      `CANDIDATE MATERIAL:\n${collectEvidence(state.evidence)}

DRAFT BULLETS:\n${state.draft?.bullets.join('\n')}

DRAFT COVER LETTER:\n${state.draft?.coverLetter}`
    ),
  ]);

  // 4. Collect unsupported claims, or use an empty list when all claims are supported.
  const issues = result.grounded
    ? []
    : result.issues.length
      ? result.issues
      : ['Some claims are not supported by the candidate material'];

  // 5. Log the grounding verification result for debugging and monitoring.
  console.log(issues.length ? `  found ${issues.length} unsupported claim(s)` : '  all claims supported');

  // 6. Return grounding issues to update the shared LangGraph state.
  return { groundingIssues: issues };
}


/**
 * 🔍 AI-GENERATED CONTENT GROUNDING CHECK
 *
 * WHAT THIS FILE DOES:
 * 1. Configures the LLM to generate structured verification results using groundingSchema.
 * 2. Retrieves the original candidate evidence and generated draft from the shared graph state.
 * 3. Combines candidate evidence into a readable text block.
 * 4. Sends candidate information and generated resume content to the LLM for fact-checking.
 * 5. Checks claims involving skills, tools, employers, projects, metrics, and achievements.
 * 6. Identifies unsupported claims and collects them into an issues array.
 * 7. Returns grounding issues as a state update for further processing.
 *
 * WHY IT EXISTS:
 * - Factual Accuracy: Ensures generated application content is supported by candidate information.
 * - Hallucination Prevention: Helps identify fabricated skills, experience, and achievements.
 * - Content Reliability: Reduces the chances of submitting misleading resume information.
 * - Feedback Generation: Provides specific issues that can be used to improve the next draft.
 * - Workflow Integration: Allows LangGraph to decide whether the draft needs regeneration or human review.
 */