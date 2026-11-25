'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileText, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import type { ResumeRow, UploadResult } from '@/lib/types';

export function ResumeUploader() {
    const [resumes, setResumes] = useState<ResumeRow[]>([]);
    const [uploading, setUploading] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        try {
            setResumes(await api.resumes());
        } catch {
            // The list is secondary. An upload error will explain a real problem.
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    async function upload(file: File | undefined) {
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError('Choose a PDF file.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5 MB.');
            return;
        }

        setUploading(true);
        setError(null);
        setResult(null);

        try {
            setResult(await api.uploadResume(file));
            await refresh();
        } catch (e) {
            setError(
                e instanceof Error ? e.message : 'Upload failed. Try again.'
            );
        } finally {
            setUploading(false);
        }
    }

    return (
        <div>
            <label
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    void upload(e.dataTransfer.files[0]);
                }}
                className={`mt-8 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all ${dragging
                    ? 'border-[#526B54] bg-[#EDF2E9]'
                    : 'border-[#DCE5D9] bg-card hover:border-[#A9BBA9] hover:bg-muted/40'
                    } ${uploading ? 'pointer-events-none opacity-70' : ''}`}
            >
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EDF2E9] text-[#526B54]">
                    {uploading ? (
                        <UploadCloud size={30} className="animate-pulse" />
                    ) : (
                        <UploadCloud size={30} />
                    )}
                </span>

                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">
                        {uploading
                            ? 'Reading your resume...'
                            : dragging
                                ? 'Drop your resume here'
                                : 'Upload your resume'}
                    </h3>

                    <p className="text-sm text-muted-foreground">
                        {uploading
                            ? 'Extracting information from your PDF.'
                            : 'Drag and drop your PDF here, or click to browse.'}
                    </p>
                </div>

                {!uploading && (
                    <span className="mt-2 rounded-lg bg-[#526B54] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#405A43]">
                        Choose PDF
                    </span>
                )}

                <p className="text-xs text-muted-foreground">
                    PDF format only · Maximum file size 5 MB
                </p>

                <input
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(e) => {
                        void upload(e.target.files?.[0]);
                        e.target.value = '';
                    }}
                />
            </label>

            <div aria-live="polite">
                {error && (
                    <div
                        role="alert"
                        className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                    >
                        <AlertCircle size={18} className="shrink-0" />
                        {error}
                    </div>
                )}

                {result && (
                    <div
                        role="status"
                        className="mt-4 rounded-xl border border-[#DCE5D9] bg-[#EDF2E9]/60 p-4"
                    >
                        <div className="flex items-center gap-2 font-semibold text-[#526B54]">
                            <CheckCircle2 size={19} />
                            Resume processed successfully
                        </div>

                        <p className="mt-2 text-sm text-foreground">
                            Read {result.chunkCount} pieces from these sections:
                            {' '}{result.sections.join(', ')}.
                        </p>

                        {result.sections.length === 1 &&
                            result.sections[0] === 'General' && (
                                <p className="mt-2 text-sm text-muted-foreground">
                                    CareerPilot could not find section headings,
                                    so search may be less precise. Headings like
                                    Experience, Projects, and Skills help.
                                </p>
                            )}
                    </div>
                )}
            </div>

            {resumes.length > 0 && (
                <section className="mt-12">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-foreground">
                            Uploaded resumes
                        </h2>

                        <span className="rounded-full bg-[#EDF2E9] px-3 py-1 text-xs font-semibold text-[#526B54]">
                            {resumes.length} {resumes.length === 1 ? 'file' : 'files'}
                        </span>
                    </div>

                    <ul className="divide-y divide-[#DCE5D9] overflow-hidden rounded-xl border border-[#DCE5D9] bg-card">
                        {resumes.map((r) => (
                            <li
                                key={r.resumeId}
                                className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/40"
                            >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDF2E9] text-[#526B54]">
                                    <FileText size={20} />
                                </span>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-foreground">
                                        {r.fileName ?? r.resumeId}
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {r.chunkCount ?? 0} pieces extracted
                                    </p>
                                </div>

                                <span className="shrink-0 text-right text-xs text-muted-foreground">
                                    Updated{' '}
                                    {new Date(r.updatedAt).toLocaleDateString(
                                        undefined,
                                        {
                                            day: 'numeric',
                                            month: 'short',
                                        }
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>

                    <p className="mt-3 text-sm text-muted-foreground">
                        Uploading a file with the same name replaces it.
                    </p>
                </section>
            )}
        </div>
    );
}