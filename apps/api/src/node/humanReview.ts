import { interrupt } from '@langchain/langgraph';
import type { MatchReport, Tailoring } from '../graph/schemas.js';
import type { State, Update } from '../graph/state.js';

// 1. Define the information that will be presented to the user for manual review.
export type ReviewRequest = {
  score: number;
  report: MatchReport | null;
  draft: Tailoring | null;
  groundingIssues: string[];
};

// 2. Define the structure of the user's review decision.
export type ReviewDecision = { approved: boolean };

// 3. Define a LangGraph node that pauses execution and requests human approval.
export function humanReview(state: State): Update {

  // 4. Interrupt graph execution and pass the current analysis results to the caller.
  const decision = interrupt({
    score: state.score,
    report: state.matchReport,
    draft: state.draft,
    groundingIssues: state.groundingIssues,
  } satisfies ReviewRequest) as ReviewDecision;

  // 5. Log whether the user approved or rejected the generated application content.
  console.log(`→ humanReview: ${decision.approved ? 'approved' : 'rejected'}`);

  // 6. Return the user's decision to update the shared LangGraph state.
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