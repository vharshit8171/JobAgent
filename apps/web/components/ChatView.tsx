'use client';

import Link from 'next/link';
import { Composer } from './Composer';
import { ReviewSheet } from './ReviewSheet';
import { useParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { useChatStore, type UiMessage } from '@/store/chatStore';
import type { ReviewRequest } from '@/lib/types';

const STARTERS = [
    'What are my strongest skills?',
    'Which of my projects shows backend work best?',
    'Show my applications',
];

const markdown: Components = {
    p: ({ children }) => (
        <p className="mb-3 text-[#455449] leading-7 last:mb-0">
            {children}
        </p>
    ),
    ul: ({ children }) => (
        <ul className="mb-3 list-disc space-y-1 pl-5 text-[#526254]">
            {children}
        </ul>
    ),
    ol: ({ children }) => (
        <ol className="mb-3 list-decimal space-y-1 pl-5 text-[#526254]">
            {children}
        </ol>
    ),
    strong: ({ children }) => (
        <strong className="font-semibold text-[#354B3B]">
            {children}
        </strong>
    ),
    a: ({ href, children }) => (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-[#526B54] underline decoration-[#A9BBA9] underline-offset-2 hover:text-[#354B3B]"
        >
            {children}
        </a>
    ),
    code: ({ children }) => (
        <code className="rounded bg-[#E8EEE6] px-1 text-[0.9em] text-[#526B54]">
            {children}
        </code>
    ),
};

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
    return (
        <div className="mx-auto mt-[10vh] max-w-xl">
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-[#354B3B]">
                Paste a job post and see where you stand.
            </h1>

            <p className="mt-4 max-w-md text-[#68776A]">
                CareerPilot only quotes what is in your resume.{' '}
                <Link
                    href="/resume"
                    className="text-[#526B54] underline decoration-[#A9BBA9] underline-offset-4 hover:text-[#354B3B]"
                >
                    Upload your resume
                </Link>{' '}
                first if you have not yet.
            </p>

            <ul className="mt-8 space-y-3">
                {STARTERS.map((q) => (
                    <li key={q}>
                        <button
                            type="button"
                            onClick={() => onPick(q)}
                            className="text-left font-medium cursor-pointer text-[#526B54] underline decoration-[#DCE5D9] underline-offset-4 transition-colors hover:text-[#354B3B] hover:decoration-[#526B54]"
                        >
                            {q}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function UserTurn({ text }: { text: string }) {
    const [expanded, setExpanded] = useState(false);
    const long = text.length > 600;

    return (
        <div className="grid gap-x-8 md:grid-cols-[12rem_1fr]">
            <div className="hidden md:block" />

            <div>
                <p
                    className={`whitespace-pre-wrap font-medium leading-relaxed text-[#49684F] ${long && !expanded ? 'line-clamp-4' : ''
                        }`}
                >
                    <span className="sr-only">You: </span>
                    {text}
                </p>

                {long && (
                    <button
                        type="button"
                        onClick={() => setExpanded(!expanded)}
                        className="mt-2 text-sm font-medium text-[#66816A] transition-colors hover:text-[#354B3B]"
                    >
                        {expanded
                            ? 'Show less'
                            : `Show all ${text.length} characters`}
                    </button>
                )}
            </div>
        </div>
    );
}

function AssistantTurn({
    message,
    live,
}: {
    message: Extract<UiMessage, { role: 'assistant' }>;
    live: boolean;
}) {
    return (
        <div className="grid gap-x-8 md:grid-cols-[12rem_1fr]">
            <ul
                className="mb-2 space-y-1 text-[13px] leading-snug text-[#849084] md:mb-0 md:text-right"
                aria-label="What Margin did"
            >
                {message.notes.map((note) => (
                    <li key={note}>{note}</li>
                ))}
            </ul>

            <div>
                <span className="sr-only">Reply: </span>

                {message.text ? (
                    <div className="max-w-prose leading-relaxed">
                        <ReactMarkdown components={markdown}>
                            {message.text}
                        </ReactMarkdown>
                    </div>
                ) : (
                    live && (
                        <p className="text-[#849084]">
                            Working on it
                        </p>
                    )
                )}
            </div>
        </div>
    );
}

function ChatViewContent() {
    const params = useParams<{ threadId?: string[] }>();
    const routeThreadId = params.threadId?.[0];

    const messages = useChatStore((s) => s.messages);
    const streaming = useChatStore((s) => s.streaming);
    const loading = useChatStore((s) => s.loading);
    const error = useChatStore((s) => s.error);
    const review = useChatStore((s) => s.review);
    const send = useChatStore((s) => s.send);
    const stop = useChatStore((s) => s.stop);
    const submitReview = useChatStore((s) => s.submitReview);
    const openThread = useChatStore((s) => s.openThread);
    const newChat = useChatStore((s) => s.newChat);

    const [dismissedFor, setDismissedFor] =
        useState<ReviewRequest | null>(null);

    const sheetOpen = review !== null && dismissedFor !== review;

    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (routeThreadId) void openThread(routeThreadId);
        else newChat();
    }, [routeThreadId, openThread, newChat]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ block: 'end' });
    }, [messages]);

    return (
        <div className="mx-auto flex h-full max-w-4xl flex-col border-x border-[#DCE5D9] bg-[#F4F7F2]">
            <div className="flex-1 overflow-y-auto bg-[#F4F7F2] px-5 py-10 md:px-8">
                {loading ? (
                    <p className="text-[#849084]">
                        Loading this chat
                    </p>
                ) : messages.length === 0 ? (
                    <EmptyState onPick={send} />
                ) : (
                    <div
                        role="log"
                        className="relative space-y-10 md:before:absolute md:before:inset-y-0 md:before:left-52 md:before:w-px md:before:bg-[#A9BBA9]/40"
                    >
                        {messages.map((m, i) =>
                            m.role === 'user' ? (
                                <UserTurn
                                    key={m.id}
                                    text={m.text}
                                />
                            ) : (
                                <AssistantTurn
                                    key={m.id}
                                    message={m}
                                    live={
                                        streaming &&
                                        i === messages.length - 1
                                    }
                                />
                            )
                        )}
                    </div>
                )}

                {error && (
                    <p
                        role="alert"
                        className="mt-8 text-[#A34D45]"
                    >
                        {error}
                    </p>
                )}

                <div ref={endRef} />
            </div>

            <div className="border-t border-[#DCE5D9] bg-[#FBFCF9] px-5 py-4 md:px-10">
                {review && !sheetOpen && (
                    <div className="mb-3 flex items-center justify-between rounded-lg border border-[#DCE5D9] bg-[#EDF2E9] px-4 py-2 text-sm text-[#526254]">
                        <span>
                            A draft is waiting for your decision.
                        </span>

                        <button
                            type="button"
                            onClick={() => setDismissedFor(null)}
                            className="font-semibold text-[#526B54] underline hover:text-[#354B3B]"
                        >
                            Open draft
                        </button>
                    </div>
                )}

                <Composer
                    streaming={streaming}
                    locked={review !== null}
                    onSend={send}
                    onStop={stop}
                />
            </div>

            {review && sheetOpen && (
                <ReviewSheet
                    review={review}
                    onDecide={submitReview}
                    onClose={() => setDismissedFor(review)}
                />
            )}
        </div>
    );
}

export function ChatView() {
    return (
        <Suspense fallback={<div className="h-full" />}>
            <ChatViewContent />
        </Suspense>
    );
}