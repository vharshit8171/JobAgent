import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { fastLlm } from '../lib/llm.js';
import { contentToString } from '../lib/text.js';
import { resetAnalysis, type MainStateType, type MainUpdate } from '../graph/state.js';

const routeSchema = z.object({
  intent: z.enum(['analyze_job', 'chat']),
});

const structured = fastLlm.withStructuredOutput(routeSchema, { name: 'route' });

export async function router(state: MainStateType): Promise<MainUpdate> {
  const last = state.messages[state.messages.length - 1];
  const text = contentToString(last.content);

  const { intent } = await structured.invoke([
    new SystemMessage(
      `Classify the user's latest message.
"analyze_job": it contains a pasted job description or posting (responsibilities, requirements, company) and the user wants it analyzed, matched, or an application prepared.
"chat": everything else, including questions about the candidate's own resume, tracking applications, career advice, or messages that only mention a job without pasting it.`
    ),
    new HumanMessage(text),
  ]);

  console.log(`→ router: ${intent}`);
  if (intent === 'analyze_job') {
    return { intent, jobDescription: text, ...resetAnalysis };
  }
  return { intent };
}