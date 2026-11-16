import { Application } from '../model/Application.js';
import type { State, Update } from '../graph/state.js';

// 1. Handle cases where the candidate's job matching score is below the required threshold.
export function lowFitReport(_state: State): Update {
  console.log('→ lowFitReport');

  // 2. Mark the workflow outcome as low_fit without generating tailored application content.
  return { outcome: 'low_fit' };
}

// 3. Define an asynchronous node responsible for saving approved applications to MongoDB.
export async function saveApplication(state: State): Promise<Update> {

  // 4. Discard the generated draft if the user has not approved it.
  if (!state.reviewApproved) {
    console.log('→ saveApplication: draft discarded');
    return { outcome: 'discarded' };
  }

  // 5. Save the approved job analysis and tailored application content to MongoDB.
  await Application.create({
    userId: state.userId,
    company: state.parsedJob?.company,
    title: state.parsedJob?.title,
    jobDescription: state.jobDescription,
    score: state.score,
    matchReport: state.matchReport,
    draft: state.draft,
  });

  // 6. Log successful database storage and mark the workflow as completed.
  console.log('→ saveApplication: saved to MongoDB');
  return { outcome: 'saved' };
}


/**
 * 💾 JOB APPLICATION WORKFLOW COMPLETION
 *
 * WHAT THIS FILE DOES:
 * 1. Provides a low-fit handler for candidates whose matching score is below the required threshold.
 * 2. Marks low-fit applications without proceeding to resume tailoring.
 * 3. Checks whether the user has approved the generated application content.
 * 4. Discards unapproved drafts instead of saving them to the database.
 * 5. Saves approved application details, matching reports, scores, and tailored drafts to MongoDB.
 * 6. Updates the final workflow outcome based on the operation performed.
 *
 * WHY IT EXISTS:
 * - Workflow Completion: Handles the final stages of the JobAgent analysis process.
 * - Quality Control: Ensures only user-approved application drafts are saved.
 * - Low-Fit Handling: Avoids unnecessary tailoring for candidates with insufficient job matches.
 * - Data Persistence: Stores approved application information for future access.
 * - Outcome Tracking: Distinguishes between saved, discarded, and low-fit applications.
 * - Separation of Concerns: Keeps database operations and workflow completion logic separate from AI processing.
 */