import type { StructuredToolInterface } from '@langchain/core/tools';
import { TavilySearch } from '@langchain/tavily';
import { env } from '../lib/env.js';
import { listApplications, searchCareerData, updateApplicationStatus } from './careerTools.js';

export const tools: StructuredToolInterface[] = [
  searchCareerData,
  listApplications,
  updateApplicationStatus,
];

if (env.TAVILY_API_KEY) {
  tools.push(new TavilySearch({ maxResults: 3, topic: 'general' }));
}