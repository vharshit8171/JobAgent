import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { fastLlm } from '../lib/llm.js';
import { matchReportSchema } from '../graph/schemas.js';
import type { State, Update } from '../graph/state.js';

// 1. Configure the LLM to generate a structured candidate matching report.
const structured = fastLlm.withStructuredOutput(matchReportSchema, { name: 'match_report' });

// 2. Assign numerical points to each possible requirement matching status.
const POINTS = { covered: 1, partial: 0.5, missing: 0 } as const;

// 3. Define a LangGraph node responsible for evaluating the candidate against job requirements.
export async function scoreMatch(state: State): Promise<Update> {
  console.log('→ scoreMatch');

  // 4. Convert retrieved candidate evidence into a readable text block organized by job requirement.
  const material = Object.entries(state.evidence)
    .map(
      ([req, chunks], i) =>
        `${i + 1}. Requirement: ${req}\nCandidate material:\n${chunks.length ? chunks.join('\n---\n') : '(nothing found)'}`
    )
    .join('\n\n');

  // 5. Handle cases where no job requirements or candidate evidence are available.
  if (!material) {
    return {
      matchReport: { items: [], summary: 'No requirements were found in the job description.' },
      score: 0
    };
  }

  // 6. Ask the LLM to evaluate each requirement using only the supplied candidate evidence.
  const matchReport = await structured.invoke([
    new SystemMessage(
      `You judge how well a candidate's material matches job requirements.
For each requirement choose "covered" (clearly shown), "partial" (related but not the same) or "missing" (no support).
Use only the candidate material given. Never assume skills that are not written there.`
    ),
    new HumanMessage(material),
  ]);

  // 7. Calculate the total points based on the matching status of each requirement.
  const total = matchReport.items.reduce((sum, item) => sum + POINTS[item.status], 0);

  // 8. Calculate the final matching percentage based on the average requirement score.
  const score = matchReport.items.length ? Math.round((total / matchReport.items.length) * 100) : 0;

  // 9. Return the matching report and calculated score to update the shared graph state.
  return { matchReport, score };
}


/**
 * 🎯 CANDIDATE JOB MATCHING & SCORING NODE
 *
 * WHAT THIS FILE DOES:
 * 1. Configures the LLM to generate structured matching reports using matchReportSchema.
 * 2. Defines scoring weights for covered, partially covered, and missing requirements.
 * 3. Retrieves candidate evidence from the shared LangGraph state.
 * 4. Organizes retrieved evidence according to individual job requirements.
 * 5. Sends the evidence to the LLM for requirement-wise candidate evaluation.
 * 6. Classifies each requirement as covered, partial, or missing.
 * 7. Calculates an overall matching percentage based on the evaluation results.
 * 8. Returns the matching report and score as a LangGraph state update.
 *
 * WHY IT EXISTS:
 * - Candidate Evaluation: Measures how well a candidate's qualifications match a job.
 * - Evidence-Based Matching: Prevents the LLM from assuming skills without supporting evidence.
 * - Requirement Analysis: Identifies strengths and missing qualifications.
 * - Match Scoring: Converts individual requirement evaluations into an overall percentage.
 * - Decision Support: Provides useful information for deciding whether to pursue a job.
 * - Workflow Integration: Makes the matching report and score available to subsequent nodes.
 */