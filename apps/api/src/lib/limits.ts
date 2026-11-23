import rateLimit from 'express-rate-limit';
import type { NextFunction, Request, Response } from 'express';
import { env } from './env.js';
import { HttpError } from './http.js';
import { Usage } from '../model/Usage.js';

// Limits count per signed-in user, not per IP address.
const byUser = (_req: Request, res: Response) => String(res.locals.userId);

const options = {
    keyGenerator: byUser,
    standardHeaders: 'draft-7' as const,
    legacyHeaders: false,
};

export const apiLimiter = rateLimit({
    ...options,
    windowMs: 60_000,
    limit: 120,
    message: { error: 'Too many requests. Wait a minute and try again.' },
});

export const agentLimiter = rateLimit({
    ...options,
    windowMs: 60_000,
    limit: 10,
    message: { error: 'You are sending messages too quickly. Wait a minute and try again.' },
});

export const uploadLimiter = rateLimit({
    ...options,
    windowMs: 60 * 60_000,
    limit: 10,
    message: { error: 'Upload limit reached. Try again in an hour.' },
});

/** Each chat message costs LLM calls, so cap how many one person can send per day. */
export async function enforceDailyQuota(_req: Request, res: Response, next: NextFunction) {
    try {
        const day = new Date().toISOString().slice(0, 10);
        const usage = await Usage.findOneAndUpdate(
            { userId: res.locals.userId, day },
            { $inc: { messages: 1 } },
            { upsert: true, new: true }
        );
        if (usage.messages > env.DAILY_MESSAGE_LIMIT) {
            throw new HttpError(
                429,
                `You have used your ${env.DAILY_MESSAGE_LIMIT} messages for today. The limit resets at midnight UTC.`
            );
        }
        next();
    } catch (err) {
        next(err);
    }
}