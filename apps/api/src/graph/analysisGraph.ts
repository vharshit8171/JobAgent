import { END, MemorySaver, START, StateGraph } from '@langchain/langgraph';
import { AnalysisState, type State } from './state.js';
import { parseJob } from '../node/parseJob.js';
import { retrieveEvidence } from '../node/retrieveEvidence.js';
import { scoreMatch } from '../node/scoreMatch.js';
import { generateTailoring } from '../node/generateTailoring.js';
import { groundingCheck } from '../node/groundingCheck.js';
import { humanReview } from '../node/humanReview.js';
import { lowFitReport, saveApplication } from '../node/finish.js';

// 1. Define the minimum job matching percentage required to proceed with resume tailoring.
const FIT_THRESHOLD = 40; // percent. Below this we skip tailoring.

// 2. Define the maximum number of additional attempts allowed to fix unsupported claims.
const MAX_RETRIES = 2; // how many times we let the model fix its draft

/** 3. Decide whether to generate tailored content or finish with a low-fit outcome. */
function fitCheck(state: State): 'generateTailoring' | 'lowFitReport' {
  return state.score >= FIT_THRESHOLD ? 'generateTailoring' : 'lowFitReport';
}

/** 4. Decide whether to regenerate the draft or proceed to human review after grounding verification. */
function afterGrounding(state: State): 'generateTailoring' | 'humanReview' {

  // Retry generation when unsupported claims exist and retry attempts are still available.
  if (state.groundingIssues.length > 0 && state.attempts <= MAX_RETRIES) return 'generateTailoring';

  // Proceed to human review when the draft passes verification or retry attempts are exhausted.
  return 'humanReview';
}

// 5. Create the main LangGraph state machine using the shared AnalysisState definition.
const workflow = new StateGraph(AnalysisState)

  // 6. Register all nodes responsible for individual stages of the job analysis workflow.
  .addNode('parseJob', parseJob)
  .addNode('retrieveEvidence', retrieveEvidence)
  .addNode('scoreMatch', scoreMatch)
  .addNode('lowFitReport', lowFitReport)
  .addNode('generateTailoring', generateTailoring)
  .addNode('groundingCheck', groundingCheck)
  .addNode('humanReview', humanReview)
  .addNode('saveApplication', saveApplication)

  // 7. Define the initial execution path from the starting point to job description parsing.
  .addEdge(START, 'parseJob')

  // 8. Connect job parsing, evidence retrieval, and candidate matching in sequence.
  .addEdge('parseJob', 'retrieveEvidence')
  .addEdge('retrieveEvidence', 'scoreMatch')

  // 9. Route execution based on the candidate's calculated matching score.
  .addConditionalEdges('scoreMatch', fitCheck, ['generateTailoring', 'lowFitReport'])

  // 10. End the workflow immediately when the candidate's job matching score is too low.
  .addEdge('lowFitReport', END)

  // 11. Connect resume generation with the grounding verification stage.
  .addEdge('generateTailoring', 'groundingCheck')

  // 12. Retry draft generation when unsupported claims are found, otherwise request human review.
  .addConditionalEdges('groundingCheck', afterGrounding, ['generateTailoring', 'humanReview'])

  // 13. Send the human review decision to the final application saving node.
  .addEdge('humanReview', 'saveApplication')

  // 14. End the workflow after the application has been saved or discarded.
  .addEdge('saveApplication', END);

// 15. Compile the workflow with MemorySaver to support pausing and resuming interrupted executions.
export const analysisGraph = workflow.compile({ checkpointer: new MemorySaver() });


/**
 * 🔀 MAIN JOBAGENT LANGGRAPH WORKFLOW
 *
 * WHAT THIS FILE DOES:
 * 1. Imports all nodes responsible for the individual stages of job analysis.
 * 2. Defines the shared AnalysisState used to manage data across the workflow.
 * 3. Sets a minimum matching score required to proceed with resume tailoring.
 * 4. Defines the maximum number of attempts allowed to correct unsupported AI-generated claims.
 * 5. Implements conditional routing based on the candidate's matching score.
 * 6. Registers all processing nodes in the LangGraph StateGraph.
 * 7. Defines the execution sequence from job parsing to evidence retrieval and candidate scoring.
 * 8. Routes low-scoring candidates directly to the low-fit completion node.
 * 9. Generates tailored resume content for candidates who meet the matching threshold.
 * 10. Verifies generated content and retries generation when unsupported claims are detected.
 * 11. Pauses execution for human review before saving the application.
 * 12. Saves approved applications to MongoDB and ends the workflow.
 * 13. Compiles and exports the graph with MemorySaver for interrupt and resume support.
 *
 * WHY IT EXISTS:
 * - Workflow Orchestration: Connects individual processing nodes into one complete AI workflow.
 * - Conditional Routing: Allows execution paths to change based on matching scores and grounding results.
 * - Iterative Refinement: Supports repeated draft generation when unsupported claims are detected.
 * - Human-in-the-Loop: Allows users to approve or reject generated application content.
 * - State Management: Maintains shared information throughout the entire execution process.
 * - Checkpointing: Uses MemorySaver to preserve graph execution state during interruptions.
 * - Modularity: Keeps each operation separate while coordinating everything through a single graph.
 */