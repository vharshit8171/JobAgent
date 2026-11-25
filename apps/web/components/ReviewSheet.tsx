
'use client';

import { useEffect, useRef } from 'react';
import type { MatchItem, ReviewRequest } from '@/lib/types';
import { DraftView, RequirementList } from './Markup';

type Props = {
    review: ReviewRequest;
    onDecide: (approved: boolean) => void;
    onClose: () => void;
};

function SegmentBar({ items }: { items: MatchItem[] }) {
    const count = (s: MatchItem['status']) =>
        items.filter((i) => i.status === s).length;

    const color = {
        covered: 'bg-[#668B6A]',
        partial: 'bg-[#C49A52]',
        missing: 'bg-[#C47770]',
    };

    return (
        <div
            className="mt-4 flex gap-1"
            role="img"
            aria-label={`${count('covered')} covered, ${count('partial')} partial, ${count('missing')} missing`}
        >
            {items.map((item, i) => (
                <span
                    key={i}
                    className={`h-2 flex-1 rounded-sm ${color[item.status]}`}
                />
            ))}
        </div>
    );
}

export function ReviewSheet({
    review,
    onDecide,
    onClose,
}: Props) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        ref.current?.focus();
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const items = review.report?.items ?? [];

    const covered = items.filter(
        (i) => i.status === 'covered'
    ).length;

    const partial = items.filter(
        (i) => i.status === 'partial'
    ).length;

    const headline = items.length
        ? `You cover ${covered} of ${items.length} requirements${partial ? ` and ${partial} partly` : ''}.`
        : 'No requirements were found in this post.';

    return (
        <div className="fixed inset-0 z-30 flex justify-end">
            <button
                type="button"
                aria-label="Close review"
                className="absolute inset-0 bg-[#26352C]/40 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div
                ref={ref}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby="review-title"
                className="sheet-in relative flex h-full w-full max-w-3xl flex-col border-l border-[#DCE5D9] bg-[#F4F7F2] shadow-[-16px_0_40px_-16px_rgba(38,53,44,0.25)] outline-none"
            >
                <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
                    <h2
                        id="review-title"
                        className="text-3xl font-extrabold leading-tight tracking-tight text-[#354B3B]"
                    >
                        {review.job?.title ?? 'Job post'}
                    </h2>

                    {review.job?.company && (
                        <p className="mt-1 text-[#849084]">
                            {review.job.company}
                        </p>
                    )}

                    <p className="mt-6 text-lg font-semibold text-[#354B3B]">
                        {headline}
                    </p>

                    {review.report?.summary && (
                        <p className="mt-1 max-w-prose leading-relaxed text-[#68776A]">
                            {review.report.summary}
                        </p>
                    )}

                    <SegmentBar items={items} />

                    <h3 className="mt-10 text-lg font-bold text-[#354B3B]">
                        Requirements
                    </h3>

                    <RequirementList items={items} animate />

                    {review.groundingIssues.length > 0 && (
                        <section
                            className="mt-10 rounded-lg border-l-4 border-[#C47770] bg-[#F8ECE9] p-4"
                            role="note"
                        >
                            <h3 className="font-bold text-[#994D46]">
                                Check these before you save
                            </h3>

                            <p className="mt-1 text-sm leading-relaxed text-[#765B56]">
                                Margin could not find support for these claims in your resume.
                            </p>

                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#765B56]">
                                {review.groundingIssues.map((issue) => (
                                    <li key={issue}>
                                        <span className="font-medium text-[#994D46]">
                                            {issue}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {review.draft && (
                        <DraftView draft={review.draft} />
                    )}
                </div>

                <div className="flex items-center gap-3 border-t border-[#DCE5D9] bg-[#FBFCF9] px-6 py-4 md:px-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="mr-auto text-sm font-medium text-[#849084] underline underline-offset-4 transition-colors hover:text-[#354B3B]"
                    >
                        Decide later
                    </button>

                    <button
                        type="button"
                        onClick={() => onDecide(false)}
                        className="rounded-lg border border-[#DCE5D9] bg-white px-4 py-2 font-semibold text-[#526254] transition-colors hover:border-[#C47770] hover:bg-[#F8ECE9] hover:text-[#994D46]"
                    >
                        Discard draft
                    </button>

                    <button
                        type="button"
                        onClick={() => onDecide(true)}
                        className="rounded-lg bg-[#526B54] px-4 py-2 font-semibold text-white transition-colors hover:bg-[#405A43]"
                    >
                        Save application
                    </button>
                </div>
            </div>
        </div>
    );
}
