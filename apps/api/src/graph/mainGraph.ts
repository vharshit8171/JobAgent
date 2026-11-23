import { END, START, StateGraph } from '@langchain/langgraph';
import { ToolNode, toolsCondition } from '@langchain/langgraph/prebuilt';
import { MainState, type MainStateType } from './state.js';
import { checkpointer } from '../lib/checkpointer.js';
import { tools } from '../tools/index.js';
import { router } from '../node/navigator.js';
import { chatAgent } from '../node/chatAgent.js';
import { parseJob } from '../node/parseJob.js';
import { retrieveEvidence } from '../node/retrieveEvidence.js';
import { scoreMatch } from '../node/scoreMatch.js';
import { generateTailoring } from '../node/generateTailoring.js';
import { groundingCheck } from '../node/groundingCheck.js';
import { humanReview } from '../node/humanReview.js';
import { lowFitReport, saveApplication } from '../node/finish.js';
import { FIT_THRESHOLD, MAX_RETRIES } from './config.js';

function routeIntent(state: MainStateType): 'chatAgent' | 'parseJob' {
  return state.intent === 'analyze_job' ? 'parseJob' : 'chatAgent';
}

function fitCheck(state: MainStateType): 'generateTailoring' | 'lowFitReport' {
  return state.score >= FIT_THRESHOLD ? 'generateTailoring' : 'lowFitReport';
}

function afterGrounding(state: MainStateType): 'generateTailoring' | 'humanReview' {
  if (state.groundingIssues.length > 0 && state.attempts <= MAX_RETRIES) return 'generateTailoring';
  return 'humanReview';
}

const workflow = new StateGraph(MainState)
  // chat path
  .addNode('router', router)
  .addNode('chatAgent', chatAgent)
  .addNode('tools', new ToolNode(tools))
  // analysis path
  .addNode('parseJob', parseJob)
  .addNode('retrieveEvidence', retrieveEvidence)
  .addNode('scoreMatch', scoreMatch)
  .addNode('lowFitReport', lowFitReport)
  .addNode('generateTailoring', generateTailoring)
  .addNode('groundingCheck', groundingCheck)
  .addNode('humanReview', humanReview)
  .addNode('saveApplication', saveApplication)
  // edges
  .addEdge(START, 'router')
  .addConditionalEdges('router', routeIntent, ['chatAgent', 'parseJob'])
  .addConditionalEdges('chatAgent', toolsCondition, ['tools', END])
  .addEdge('tools', 'chatAgent')
  .addEdge('parseJob', 'retrieveEvidence')
  .addEdge('retrieveEvidence', 'scoreMatch')
  .addConditionalEdges('scoreMatch', fitCheck, ['generateTailoring', 'lowFitReport'])
  .addEdge('lowFitReport', END)
  .addEdge('generateTailoring', 'groundingCheck')
  .addConditionalEdges('groundingCheck', afterGrounding, ['generateTailoring', 'humanReview'])
  .addEdge('humanReview', 'saveApplication')
  .addEdge('saveApplication', END);

export const graph = workflow.compile({ checkpointer });