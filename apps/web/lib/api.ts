import type {
    ApplicationDetail,
    ApplicationRow,
    ApplicationStatus,
    ResumeRow,
    ThreadDetail,
    ThreadSummary,
    UploadResult,
} from './types';
import { getAuthToken } from './auth';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    const token = await getAuthToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(`${API_URL}${path}`, { ...init, headers });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Request failed (${res.status})`);
    }
    return res.json() as Promise<T>;
}

export const api = {
    threads: () => request<ThreadSummary[]>('/api/threads'),
    thread: (id: string) => request<ThreadDetail>(`/api/threads/${id}`),
    applications: () => request<ApplicationRow[]>('/api/applications'),
    application: (id: string) => request<ApplicationDetail>(`/api/applications/${id}`),
    setStatus: (id: string, status: ApplicationStatus) =>
        request<ApplicationRow>(`/api/applications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        }),
    resumes: () => request<ResumeRow[]>('/api/resume'),
    uploadResume: (file: File) => {
        const form = new FormData();
        form.append('file', file);
        return request<UploadResult>('/api/resume', { method: 'POST', body: form });
    },
};