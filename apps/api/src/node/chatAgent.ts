import { SystemMessage } from '@langchain/core/messages';
import { llm } from '../lib/llm.js';
import { tools } from '../tools/index.js';
import type { MainStateType, MainUpdate } from '../graph/state.js';

const agentLlm = llm.bindTools(tools);

const systemPrompt = () => `You are a friendly career assistant for a software developer who is applying to jobs.
- For anything about the candidate's skills, projects or experience, call searchCareerData first. Never invent experience.
- To show or change tracked applications, use listApplications and updateApplicationStatus (list first to get the id).
- Use web search only for company or industry research.
- If the user wants a job analyzed, ask them to paste the full job description in one message.
Keep answers short. Today is ${new Date().toDateString()}.`;

export async function chatAgent(state: MainStateType): Promise<MainUpdate> {
  console.log('→ chatAgent');
  const response = await agentLlm.invoke([new SystemMessage(systemPrompt()), ...state.messages]);
  return { messages: [response] };
}