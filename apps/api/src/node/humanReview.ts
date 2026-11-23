import { interrupt } from '@langchain/langgraph';
import type { MatchReport, Tailoring } from '../graph/schemas.js';
import type { State, Update } from '../graph/state.js';

export type ReviewRequest = {
  job: { title: string; company: string } | null;
  score: number;
  report: MatchReport | null;
  draft: Tailoring | null;
  groundingIssues: string[];
};
export type ReviewDecision = { approved: boolean };

export function humanReview(state: State): Update {
  // The graph stops right here and hands this object to the caller.
  const decision = interrupt({
    job: state.parsedJob
      ? { title: state.parsedJob.title, company: state.parsedJob.company }
      : null,
    score: state.score,
    report: state.matchReport,
    draft: state.draft,
    groundingIssues: state.groundingIssues,
  } satisfies ReviewRequest) as ReviewDecision;

  console.log(`→ humanReview: ${decision.approved ? 'approved' : 'rejected'}`);
  return { reviewApproved: decision.approved };
}


/**
 * 👤 HUMAN-IN-THE-LOOP REVIEW NODE
 *
 * WHAT THIS FILE DOES:
 * 1. Defines the structure of the review information presented to the user.
 * 2. Defines the structure of the user's approval or rejection decision.
 * 3. Uses LangGraph's interrupt function to pause workflow execution.
 * 4. Sends the matching score, report, generated draft, and grounding issues for review.
 * 5. Waits for the caller to resume the graph with a human review decision.
 * 6. Stores the approval decision in the shared LangGraph state.
 *
 * WHY IT EXISTS:
 * - Human Control: Allows users to review AI-generated content before saving it.
 * - Human-in-the-Loop: Introduces human decision-making into an automated AI workflow.
 * - Quality Assurance: Gives users an opportunity to identify issues the AI may have missed.
 * - Approval Management: Prevents unapproved drafts from being saved as applications.
 * - Workflow Control: Allows LangGraph execution to pause and resume based on user decisions.
 */