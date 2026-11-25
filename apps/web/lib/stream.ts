import { API_URL } from './api';
import type { ReviewRequest } from './types';
import { getAuthToken } from './auth';

export type StreamEvent =
    | { event: 'thread'; data: { threadId: string } }
    | { event: 'node'; data: { name: string } }
    | { event: 'tool'; data: { name: string } }
    | { event: 'token'; data: { text: string } }
    | { event: 'message'; data: { text: string } }
    | { event: 'review'; data: ReviewRequest }
    | { event: 'done'; data: { awaitingReview: boolean } }
    | { event: 'error'; data: { message: string } };

export async function* postStream(
    path: string,
    body: unknown,
    signal: AbortSignal
): AsyncGenerator<StreamEvent> {
    const token = await getAuthToken();
    const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
        signal,
    });

    if (!res.ok || !res.body) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? `Request failed (${res.status})`);
    }

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = '';

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;

        // Events end with a blank line. Keep any half-received event for the next read.
        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';

        for (const frame of frames) {
            const event = /^event: (.+)$/m.exec(frame)?.[1];
            const data = /^data: (.+)$/m.exec(frame)?.[1];
            if (event && data) yield { event, data: JSON.parse(data) } as StreamEvent;
        }
    }
}