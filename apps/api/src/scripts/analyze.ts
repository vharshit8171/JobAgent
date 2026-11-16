import { readFile } from 'node:fs/promises';
import readline from 'node:readline/promises';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { Command } from '@langchain/langgraph';
import { connectMongo } from '../lib/mongo.js';
import { DEV_USER_ID } from '../lib/config.js';
import { analysisGraph } from '../graph/analysisGraph.js';
import type { ReviewRequest } from '../node/humanReview.js';
import type { MatchReport } from '../graph/schemas.js';

// 1. Display the overall match score and individual requirement results.
function printReport(score: number, report: MatchReport | null) {
  console.log(`\n=== Match score: ${score}% ===`);

  for (const item of report?.items ?? []) {
    console.log(`  [${item.status.toUpperCase()}] ${item.requirement}`);
  }

  // 2. Display the LLM-generated summary when available.
  if (report?.summary) console.log(`\n${report.summary}`);
}

// 3. Extract pending human-review interruptions from the graph result.
function getInterrupts(result: unknown): { value: ReviewRequest }[] | undefined {
  return (result as { __interrupt__?: { value: ReviewRequest }[] }).__interrupt__;
}

// 4. Main function responsible for running the complete job-analysis workflow.
async function main() {
  // 5. Read the job-description file path supplied through the terminal.
  const file = process.argv[2];
  if (!file) throw new Error('Usage: npm run analyze -- <path-to-job-description.txt>');

  // 6. Read the job description and establish the MongoDB connection.
  const jobDescription = await readFile(file, 'utf8');
  await connectMongo();

  // 7. Generate a unique thread ID so LangGraph can identify this execution.
  const config = { configurable: { thread_id: randomUUID() } };

  // 8. Start the graph with the developer's ID and the supplied job description.
  let result = await analysisGraph.invoke({ userId: DEV_USER_ID, jobDescription }, config);

  // 9. Check whether the graph paused and requested human approval.
  const pending = getInterrupts(result);

  if (pending?.length) {
    // 10. Extract the review information returned by the human-review node.
    const review = pending[0].value;

    // 11. Display the candidate's job-match report.
    printReport(review.score, review.report);

    // 12. Highlight claims that could not be verified using resume evidence.
    if (review.groundingIssues.length) {
      console.log('\nWARNING: these claims could not be verified against your resume:');

      for (const issue of review.groundingIssues) {
        console.log(`  - ${issue}`);
      }
    }

    // 13. Display the generated resume bullets and cover letter.
    console.log('\n--- Resume bullets ---');

    for (const b of review.draft?.bullets ?? []) {
      console.log(`• ${b}`);
    }

    console.log(`\n--- Cover letter ---\n${review.draft?.coverLetter}`);

    // 14. Ask the developer to approve or reject the generated application.
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await rl.question('\nApprove and save this application? (y/n): ');
    rl.close();

    // 15. Resume the paused graph with the human's approval decision.
    result = await analysisGraph.invoke(
      new Command({
        resume: { approved: answer.trim().toLowerCase() === 'y' }
      }),
      config
    );
  } else if (result.outcome === 'low_fit') {
    // 16. Display the match report when the job falls below the fit threshold.
    printReport(result.score, result.matchReport);

    console.log('\nThe fit is below the threshold, so no tailoring was generated.');
  }

  // 17. Display the final outcome of the analysis workflow.
  console.log(`\nOutcome: ${result.outcome}`);
}

// 18. Execute the workflow and handle unexpected errors.
main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());

/**
 * 🚀 WHAT THIS FILE DOES:
 *
 * 1. Reads a job description from a text file provided through the terminal.
 * 2. Connects the application to MongoDB before starting the workflow.
 * 3. Creates a unique LangGraph thread ID for the current analysis execution.
 * 4. Invokes the analysis graph with the developer's ID and job description.
 * 5. Detects when the graph pauses for human review using its interrupt data.
 * 6. Displays the match score, requirement breakdown, grounding warnings,
 *    generated resume bullets, and cover letter.
 * 7. Collects the developer's approval or rejection through terminal input.
 * 8. Resumes the interrupted graph using Command({ resume: ... }).
 * 9. Displays the final outcome, such as saved, discarded, or low_fit.
 * 10. Handles execution errors and disconnects MongoDB when execution finishes.
 *
 * WHY IT EXISTS:
 *
 * - Provides a simple terminal interface for running the complete JobAgent workflow.
 * - Connects the individual LangGraph nodes to an actual user interaction.
 * - Allows a developer to inspect AI-generated content before saving it.
 * - Implements the human-in-the-loop approval process.
 * - Keeps workflow execution separate from the graph's internal business logic.
 */