'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { MatchItem, MatchStatus, Tailoring } from '@/lib/types';

function markClass(status: MatchStatus, animate: boolean) {
    if (status === 'missing') {
        return 'text-[#A75D55] decoration-[#D9A39B] underline decoration-wavy underline-offset-4';
    }

    const color =
        status === 'covered'
            ? 'decoration-[#82A886] bg-[#E4EFE2]'
            : 'decoration-[#C6A66C] bg-[#F4EDDB]';

    return `rounded-sm px-1 ${color} ${animate ? 'swipe swipe-draw' : ''
        }`;
}

function evidenceText(item: MatchItem) {
    if (item.status === 'missing') {
        return 'Nothing in your resume covers this yet.';
    }

    if (item.status === 'partial') {
        return `Partly covered. ${item.evidence}`;
    }

    return item.evidence;
}

export function RequirementList({
    items,
    animate = false,
}: {
    items: MatchItem[];
    animate?: boolean;
}) {
    return (
        <ul className="mt-4 space-y-5">
            {items.map((item, i) => (
                <li key={`${item.requirement}-${i}`}>
                    <p className="text-[17px] font-medium leading-snug text-[#354B3B]">
                        <span className="sr-only">
                            {item.status}:{' '}
                        </span>

                        <span
                            className={markClass(item.status, animate)}
                            style={
                                animate
                                    ? ({
                                        '--delay': `${350 + i * 110}ms`,
                                    } as CSSProperties)
                                    : undefined
                            }
                        >
                            {item.requirement}
                        </span>
                    </p>

                    <p className="mt-1 max-w-prose font-serif text-[15px] italic leading-relaxed text-[#788579]">
                        {evidenceText(item)}
                    </p>
                </li>
            ))}
        </ul>
    );
}

export function CopyButton({
    text,
    label,
}: {
    text: string;
    label: string;
}) {
    const [copied, setCopied] = useState(false);

    async function copy() {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard access can be blocked by the browser.
        }
    }

    return (
        <button
            type="button"
            onClick={copy}
            aria-label={`Copy ${label}`}
            className="text-sm font-medium text-[#526B54] underline decoration-[#A9BBA9] underline-offset-4 transition-colors hover:text-[#354B3B]"
        >
            {copied ? 'Copied' : 'Copy'}
        </button>
    );
}

export function DraftView({ draft }: { draft: Tailoring }) {
    return (
        <>
            <section className="mt-10">
                <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-bold text-[#354B3B]">
                        Resume bullets
                    </h3>

                    <CopyButton
                        text={draft.bullets
                            .map((b) => `• ${b}`)
                            .join('\n')}
                        label="resume bullets"
                    />
                </div>

                <ul className="mt-3 list-disc space-y-2 pl-5 font-serif text-[17px] leading-relaxed text-[#455449] marker:text-[#849084]">
                    {draft.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                    ))}
                </ul>
            </section>

            <section className="mt-10">
                <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-bold text-[#354B3B]">
                        Cover letter
                    </h3>

                    <CopyButton
                        text={draft.coverLetter}
                        label="cover letter"
                    />
                </div>

                <div className="mt-3 max-w-[65ch] whitespace-pre-wrap font-serif text-[17px] leading-[1.7] text-[#455449]">
                    {draft.coverLetter}
                </div>
            </section>
        </>
    );
}
