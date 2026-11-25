'use client';

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, BriefcaseBusiness, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import type {
    ApplicationDetail,
    ApplicationRow,
    ApplicationStatus,
} from '@/lib/types';
import { DraftView, RequirementList } from './Markup';

const STATUS_LABELS: Record<ApplicationStatus, string> = {
    saved: 'Saved',
    applied: 'Applied',
    interview: 'Interviewing',
    rejected: 'Rejected',
    offer: 'Offer',
};

const STATUSES = Object.keys(STATUS_LABELS) as ApplicationStatus[];

export function ApplicationsTable() {
    const [rows, setRows] = useState<ApplicationRow[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [openId, setOpenId] = useState<string | null>(null);
    const [details, setDetails] = useState<
        Record<string, ApplicationDetail>
    >({});

    useEffect(() => {
        api.applications()
            .then(setRows)
            .catch((e: Error) => setError(e.message));
    }, []);

    async function toggle(id: string) {
        setOpenId(openId === id ? null : id);

        if (details[id]) return;

        try {
            const detail = await api.application(id);
            setDetails((prev) => ({ ...prev, [id]: detail }));
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : 'Could not load this application.'
            );
        }
    }

    async function changeStatus(
        id: string,
        status: ApplicationStatus
    ) {
        const before = rows;

        setRows((rs) =>
            rs?.map((r) =>
                r._id === id ? { ...r, status } : r
            ) ?? null
        );

        try {
            await api.setStatus(id, status);
        } catch {
            setRows(before);
            setError('Could not update the status. Try again.');
        }
    }

    if (error && !rows) {
        return (
            <p
                role="alert"
                className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
            >
                {error}
            </p>
        );
    }

    if (!rows) {
        return (
            <p className="mt-8 text-sm text-muted-foreground">
                Loading your applications...
            </p>
        );
    }

    if (rows.length === 0) {
        return (
            <div className="mt-10 max-w-md rounded-2xl border border-[#DCE5D9] bg-card p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EDF2E9] text-[#526B54]">
                    <BriefcaseBusiness size={23} />
                </span>

                <h2 className="mt-5 text-xl font-bold text-foreground">
                    Track your first application
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Paste a job post in a chat and save your draft.
                    Your applications will automatically appear here.
                </p>

                <Link
                    href="/chat"
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#526B54] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#405A43]"
                >
                    Open chat
                </Link>
            </div>
        );
    }

    return (
        <div className="mt-8">
            {error && (
                <p
                    role="alert"
                    className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                >
                    {error}
                </p>
            )}

            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">
                    Your applications
                </h2>

                <span className="rounded-full bg-[#EDF2E9] px-3 py-1 text-xs font-semibold text-[#526B54]">
                    {rows.length} {rows.length === 1 ? 'application' : 'applications'}
                </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#DCE5D9] bg-card">
                <table className="w-full min-w-163 border-collapse text-left">
                    <thead>
                        <tr className="border-b border-[#DCE5D9] bg-[#EDF2E9]/60">
                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#526B54]">
                                Role
                            </th>

                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#526B54]">
                                Match
                            </th>

                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#526B54]">
                                Status
                            </th>

                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#526B54]">
                                Added
                            </th>

                            <th className="px-4 py-3" />
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-[#DCE5D9]">
                        {rows.map((row) => (
                            <Fragment key={row._id}>
                                <tr className="align-middle transition-colors hover:bg-muted/40">
                                    <td className="px-4 py-4">
                                        <button
                                            type="button"
                                            onClick={() => void toggle(row._id)}
                                            aria-expanded={openId === row._id}
                                            className="text-left"
                                        >
                                            <span className="block font-semibold text-foreground">
                                                {row.title ?? 'Untitled role'}
                                            </span>

                                            <span className="mt-1 block text-sm text-muted-foreground">
                                                {row.company ?? 'Unknown company'}
                                            </span>
                                        </button>
                                    </td>

                                    <td className="px-4 py-4 tabular-nums">
                                        {typeof row.score === 'number' ? (
                                            <div>
                                                <span className="text-sm font-semibold text-foreground">
                                                    {row.score}%
                                                </span>

                                                <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-[#EDF2E9]">
                                                    <div
                                                        className="h-full rounded-full bg-[#526B54]"
                                                        style={{
                                                            width: `${Math.min(100, Math.max(0, row.score))}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                -
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-4 py-4">
                                        <select
                                            aria-label={`Status for ${row.title ?? 'this role'}`}
                                            value={row.status}
                                            onChange={(e) =>
                                                void changeStatus(
                                                    row._id,
                                                    e.target.value as ApplicationStatus
                                                )
                                            }
                                            className="max-w-36.25 rounded-lg border border-[#DCE5D9] bg-card px-2.5 py-2 text-sm font-medium text-foreground outline-none transition-colors focus:border-[#526B54] focus:ring-2 focus:ring-[#526B54]/10"
                                        >
                                            {STATUSES.map((s) => (
                                                <option key={s} value={s}>
                                                    {STATUS_LABELS[s]}
                                                </option>
                                            ))}
                                        </select>
                                    </td>

                                    <td className="px-4 py-4 text-sm text-muted-foreground">
                                        {new Date(row.createdAt).toLocaleDateString(
                                            undefined,
                                            {
                                                day: 'numeric',
                                                month: 'short',
                                            }
                                        )}
                                    </td>

                                    <td className="px-4 py-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => void toggle(row._id)}
                                            aria-label={
                                                openId === row._id
                                                    ? 'Collapse application'
                                                    : 'Expand application'
                                            }
                                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-[#EDF2E9] hover:text-[#526B54]"
                                        >
                                            {openId === row._id ? (
                                                <ChevronUp size={18} />
                                            ) : (
                                                <ChevronDown size={18} />
                                            )}
                                        </button>
                                    </td>
                                </tr>

                                {openId === row._id && (
                                    <tr className="border-b border-[#DCE5D9] bg-[#EDF2E9]/30">
                                        <td colSpan={5} className="px-5 py-6">
                                            {details[row._id] ? (
                                                <div className="max-w-3xl space-y-6">
                                                    <div>
                                                        <div className="mb-3 flex items-center gap-2">
                                                            <BriefcaseBusiness
                                                                size={18}
                                                                className="text-[#526B54]"
                                                            />

                                                            <h3 className="text-lg font-bold text-[#526B54]">
                                                                Requirements
                                                            </h3>
                                                        </div>

                                                        <RequirementList
                                                            items={
                                                                details[row._id]
                                                                    .matchReport?.items ?? []
                                                            }
                                                        />
                                                    </div>

                                                    {details[row._id].draft && (
                                                        <div>
                                                            <div className="mb-3 flex items-center gap-2">
                                                                <FileText
                                                                    size={18}
                                                                    className="text-[#526B54]"
                                                                />

                                                                <h3 className="text-lg font-bold text-[#526B54]">
                                                                    Saved draft
                                                                </h3>
                                                            </div>

                                                            <DraftView
                                                                draft={details[row._id].draft!}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    Loading application details...
                                                </p>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}