import type { Response } from 'express';
import type { AIMessage, BaseMessage } from '@langchain/core/messages';
import { graph } from './mainGraph.js';
import { openSse } from '../lib/sse.js';
import { contentToString } from '../lib/text.js';
import type { ReviewRequest } from '../node/humanReview.js';

type RunInput = Parameters<typeof graph.stream>[0];

export async function streamRun(res: Response, threadId: string, userId: string, input: RunInput) {
    const send = openSse(res);

    // If the browser disconnects, stop the run.
    const controller = new AbortController();
    res.on('close', () => controller.abort());

    send('thread', { threadId });
    let awaitingReview = false;

    try {
        const stream = await graph.stream(input, {
            configurable: { thread_id: threadId, userId },
            streamMode: ['messages', 'updates'],
            signal: controller.signal,
        });

        for await (const [mode, chunk] of stream) {
            if (mode === 'messages') {
                // LLM tokens. We only forward the chat agent's words, not the router's or parser's.
                const [message, meta] = chunk as unknown as [BaseMessage, { langgraph_node?: string }];
                if (meta.langgraph_node !== 'chatAgent') continue;
                const text = contentToString(message.content);
                if (text) send('token', { text });
                continue;
            }

            // mode === 'updates': one entry per node that just finished
            for (const [node, update] of Object.entries(chunk as Record<string, unknown>)) {
                if (node === '__interrupt__') {
                    for (const item of update as { value: ReviewRequest }[]) send('review', item.value);
                    awaitingReview = true;
                    continue;
                }

                send('node', { name: node });
                const messages = (update as { messages?: BaseMessage[] } | undefined)?.messages ?? [];

                if (node === 'chatAgent') {
                    for (const call of (messages[0] as AIMessage | undefined)?.tool_calls ?? []) {
                        send('tool', { name: call.name });
                    }
                }
                if (node === 'lowFitReport' || node === 'saveApplication') {
                    send('message', { text: contentToString(messages[0]?.content ?? '') });
                }
            }
        }

        send('done', { awaitingReview });
    } catch (err) {
        if (!controller.signal.aborted) {
            console.error('Run failed:', err);
            send('error', { message: 'Something went wrong while running the agent.' });
        }
    } finally {
        res.end();
    }
}