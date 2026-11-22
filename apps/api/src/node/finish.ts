import { AIMessage } from '@langchain/core/messages';
import { Application } from '../model/Application.js';
import type { MainStateType, MainUpdate } from '../graph/state.js';

export function lowFitReport(state: MainStateType): MainUpdate {
  console.log('→ lowFitReport');
  const gaps = (state.matchReport?.items ?? [])
    .filter((i) => i.status === 'missing')
    .map((i) => i.requirement);

  const text =
    `This role looks like a weak fit right now (match score ${state.score}%), so I skipped tailoring. ` +
    (gaps.length ? `Main gaps: ${gaps.join(', ')}. ` : '') +
    'Ask me how to close these gaps, or paste another job.';

  return { outcome: 'low_fit', messages: [new AIMessage(text)] };
}


export async function saveApplication(state: MainStateType): Promise<MainUpdate> {
  const job = state.parsedJob;

  if (!state.reviewApproved) {
    console.log('→ saveApplication: draft discarded');
    return {
      outcome: 'discarded',
      messages: [new AIMessage('Okay, I discarded that draft. Nothing was saved.')],
    };
  }

  if (!job?.company || !job?.title) {
    throw new Error('Cannot save application: company or job title is missing');
  }

  await Application.findOneAndUpdate(
    {
      userId: state.userId,
      company: job.company,
      title: job.title,
    },
    {
      $set: {
        jobDescription: state.jobDescription,
        score: state.score,
        matchReport: state.matchReport,
        draft: state.draft,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );

  console.log('→ saveApplication: application upserted in MongoDB');

  return {
    outcome: 'saved',
    messages: [
      new AIMessage(
        `Saved your application for ${job.title} at ${job.company} (match ${state.score}%). Ask me to list your applications or update a status.`
      ),
    ],
  };
}
