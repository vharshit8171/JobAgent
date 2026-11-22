import { Router } from 'express';
import type { BaseMessage } from '@langchain/core/messages';
import { asyncHandler, HttpError } from '../lib/http.js';
import { contentToString } from '../lib/text.js';
import { Thread } from '../model/Thread.js';
import { graph } from '../graph/mainGraph.js';
import type { ReviewRequest } from '../node/humanReview.js';

export const threadsRouter = Router();

threadsRouter.get(
    '/',
    asyncHandler(async (_req, res) => {
        const threads = await Thread.find({ userId: res.locals.userId })
            .sort({ lastMessageAt: -1 })
            .select('threadId title lastMessageAt')
            .lean();
        res.json(threads);
    })
);

threadsRouter.get(
    '/:threadId',
    asyncHandler(async (req, res) => {
        const threadId = String(req.params.threadId);
        const thread = await Thread.findOne({ threadId, userId: res.locals.userId }).lean();
        if (!thread) throw new HttpError(404, 'Thread not found');

        const snapshot = await graph.getState({ configurable: { thread_id: threadId } });

        // Only show human and assistant text, not tool plumbing.
        const messages = ((snapshot.values.messages ?? []) as BaseMessage[]).flatMap((m) => {
            const type = m.getType();
            const text = contentToString(m.content).trim();
            if (!text || (type !== 'human' && type !== 'ai')) return [];
            return [{ role: type === 'human' ? 'user' : 'assistant', text }];
        });

        // If a review is pending, return it so the UI can show it after a page reload.
        const interrupts = snapshot.tasks.flatMap((t) => t.interrupts ?? []);
        const pendingReview = (interrupts[0]?.value as ReviewRequest | undefined) ?? null;

        res.json({ threadId, title: thread.title, messages, pendingReview });
    })
);