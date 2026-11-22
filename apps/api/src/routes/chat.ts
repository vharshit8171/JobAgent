import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { Command } from '@langchain/langgraph';
import { z } from 'zod';
import { asyncHandler, HttpError } from '../lib/http.js';
import { Thread } from '../model/Thread.js';
import { graph } from '../graph/mainGraph.js';
import { streamRun } from '../graph/streamGraph.js';

const chatBody = z.object({
    threadId: z.string().uuid().optional(),
    message: z.string().min(1).max(20000),
});
const reviewBody = z.object({ approved: z.boolean() });

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
    const result = schema.safeParse(body);
    if (!result.success) throw new HttpError(400, result.error.issues.map((i) => i.message).join(', '));
    return result.data;
}

async function requireThread(threadId: string, userId: string) {
    const thread = await Thread.findOne({ threadId, userId });
    if (!thread) throw new HttpError(404, 'Thread not found');
    return thread;
}

export const chatRouter = Router();

chatRouter.post(
    '/',
    asyncHandler(async (req, res) => {
        const userId: string = res.locals.userId;
        const { threadId: existingId, message } = parse(chatBody, req.body);

        let threadId: string;
        if (existingId) {
            await requireThread(existingId, userId);
            await Thread.updateOne({ threadId: existingId }, { $set: { lastMessageAt: new Date() } });
            threadId = existingId;
        } else {
            threadId = randomUUID(); // the server decides thread ids
            await Thread.create({ threadId, userId, title: message.split('\n')[0].slice(0, 60) });
        }

        await streamRun(res, threadId, userId, {
            userId,
            messages: [{ role: 'user', content: message }],
        });
    })
);

chatRouter.post(
    '/:threadId/review',
    asyncHandler(async (req, res) => {
        const userId: string = res.locals.userId;
        const threadId = String(req.params.threadId);
        const { approved } = parse(reviewBody, req.body);

        await requireThread(threadId, userId);

        // Only resume if the graph is really paused at the review step.
        const snapshot = await graph.getState({ configurable: { thread_id: threadId } });
        if (!snapshot.next.includes('humanReview')) {
            throw new HttpError(409, 'This conversation is not waiting for a review');
        }

        await streamRun(res, threadId, userId, new Command({ resume: { approved } }));
    })
);