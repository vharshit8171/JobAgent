import { tool } from '@langchain/core/tools';
import type { RunnableConfig } from '@langchain/core/runnables';
import { z } from 'zod';
import { embedQuery } from '../rag/embed.js';
import { searchCareer } from '../rag/vectorStore.js';
import { Application } from '../model/Application.js';

const STATUSES = ['saved', 'applied', 'interview', 'rejected', 'offer'] as const;

/** The user id comes from the caller's config, never from the LLM. */
function getUserId(config?: RunnableConfig): string {
  const id = config?.configurable?.userId;
  if (typeof id !== 'string' || !id) throw new Error('userId is missing from the run config');
  return id;
}

export const searchCareerData = tool(
  async ({ query }, config) => {
    console.log(`  [tool] searchCareerData("${query}")`);
    const vector = await embedQuery(query);
    const hits = await searchCareer(getUserId(config), vector, 4);
    return hits.length ? hits.map((h) => h.text).join('\n---\n') : 'Nothing found.';
  },
  {
    name: 'searchCareerData',
    description:
      "Search the candidate's resume and project notes. Use it for any question about the candidate's own skills, experience or projects.",
    schema: z.object({
      query: z.string().describe('What to look for, for example "Node.js projects"'),
    }),
  }
);

export const listApplications = tool(
  async ({ status }, config) => {
    console.log('  [tool] listApplications');
    const filter: Record<string, unknown> = { userId: getUserId(config) };
    if (status) filter.status = status;
    const apps = await Application.find(filter).sort({ createdAt: -1 }).limit(10).lean();
    if (!apps.length) return 'No applications found.';
    return JSON.stringify(
      apps.map((a) => ({
        id: String(a._id),
        company: a.company,
        title: a.title,
        score: a.score,
        status: a.status,
      }))
    );
  },
  {
    name: 'listApplications',
    description: "List the candidate's tracked job applications, newest first. Optionally filter by status.",
    schema: z.object({ status: z.enum(STATUSES).optional() }),
  }
);

export const updateApplicationStatus = tool(
  async ({ applicationId, status }, config) => {
    console.log('  [tool] updateApplicationStatus');
    const updated = await Application.findOneAndUpdate(
      { _id: applicationId, userId: getUserId(config) },
      { status },
      { new: true }
    );
    return updated
      ? `Updated "${updated.title}" at ${updated.company} to ${status}.`
      : 'No matching application found.';
  },
  {
    name: 'updateApplicationStatus',
    description: 'Change the status of a tracked application. Call listApplications first to get the id.',
    schema: z.object({
      applicationId: z.string().describe('The id returned by listApplications'),
      status: z.enum(STATUSES),
    }),
  }
);