import { readFile } from 'node:fs/promises';
import readline from 'node:readline/promises';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { Command } from '@langchain/langgraph';
import { connectMongo } from '../lib/mongo.js';
import { checkpointClient } from '../lib/checkpointer.js';
import { DEV_USER_ID } from '../lib/config.js';
import { contentToString } from '../lib/text.js';
import { graph } from '../graph/mainGraph.js';
import type { ReviewRequest } from '../node/humanReview.js';

function showReview(review: ReviewRequest) {
  console.log(`\n=== Match score: ${review.score}% ===`);
  for (const item of review.report?.items ?? []) {
    console.log(`  [${item.status.toUpperCase()}] ${item.requirement}`);
  }
  if (review.groundingIssues.length) {
    console.log('\nWARNING: these claims could not be verified against your resume:');
    for (const issue of review.groundingIssues) console.log(`  - ${issue}`);
  }
  console.log('\n--- Resume bullets ---');
  for (const b of review.draft?.bullets ?? []) console.log(`• ${b}`);
  console.log(`\n--- Cover letter ---\n${review.draft?.coverLetter}`);
}

function getInterrupts(result: unknown): { value: ReviewRequest }[] | undefined {
  return (result as { __interrupt__?: { value: ReviewRequest }[] }).__interrupt__;
}

async function main() {
  await connectMongo();

  const threadId = process.argv[2] ?? randomUUID();
  // userId travels in the config so tools can read it. The LLM never sees or sets it.
  const config = { configurable: { thread_id: threadId, userId: DEV_USER_ID } };
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log(`Thread: ${threadId}`);
  console.log('Continue this chat later with: npm run chat -- <thread id>');
  console.log('Commands: /file <path> sends a file as your message, /bye quits.');

  try {
    while (true) {
      let input = (await rl.question('\nYou: ')).trim();
      if (!input) continue;
      if (input === '/bye') break;

      try {
        // Pasting multi-line text into a terminal breaks at each newline, so we read it from a file.
        if (input.startsWith('/file ')) input = await readFile(input.slice(6).trim(), 'utf8');

        let result = await graph.invoke(
          { userId: DEV_USER_ID, messages: [{ role: 'user', content: input }] },
          config
        );

        let pending = getInterrupts(result);
        while (pending?.length) {
          showReview(pending[0].value);
          const answer = await rl.question('\nApprove and save this application? (y/n): ');
          result = await graph.invoke(
            new Command({ resume: { approved: answer.trim().toLowerCase() === 'y' } }),
            config
          );
          pending = getInterrupts(result);
        }

        const last = result.messages[result.messages.length - 1];
        console.log(`\nAI: ${contentToString(last.content)}`);
      } catch (err) {
        console.error('Something went wrong:', err instanceof Error ? err.message : err);
      }
    }
  } finally {
    rl.close();
    await mongoose.disconnect();
    await checkpointClient.close();
  }
}

main();