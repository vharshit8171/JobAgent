import { create } from 'zustand';
import { api } from '@/lib/api';
import { postStream, type StreamEvent } from '@/lib/stream';
import type { ReviewRequest, ThreadSummary } from '@/lib/types';

export type UiMessage =
    | { id: string; role: 'user'; text: string }
    | { id: string; role: 'assistant'; text: string; notes: string[] };

// What the agent did, written as margin notes.
const NODE_NOTES: Record<string, string> = {
    parseJob: 'Read the job post',
    retrieveEvidence: 'Searched your resume for each requirement',
    scoreMatch: 'Compared the requirements with your experience',
    generateTailoring: 'Wrote tailored bullets and a cover letter',
    groundingCheck: 'Checked every claim against your resume',
    lowFitReport: 'Stopped early because the fit is low',
    saveApplication: 'Recorded your decision',
};
const TOOL_NOTES: Record<string, string> = {
    searchCareerData: 'Searched your resume',
    listApplications: 'Looked through your tracker',
    updateApplicationStatus: 'Changed an application status',
    tavily_search: 'Searched the web',
};

type ChatState = {
    threads: ThreadSummary[];
    threadId: string | null;
    messages: UiMessage[];
    review: ReviewRequest | null;
    streaming: boolean;
    loading: boolean;
    error: string | null;
    controller: AbortController | null;
    loadThreads: () => Promise<void>;
    newChat: () => void;
    openThread: (id: string) => Promise<void>;
    send: (text: string) => Promise<void>;
    submitReview: (approved: boolean) => Promise<void>;
    stop: () => void;
};

const uid = () => crypto.randomUUID();
const emptyReply = (): UiMessage => ({ id: uid(), role: 'assistant', text: '', notes: [] });

export const useChatStore = create<ChatState>()((set, get) => {
    /** Edit the assistant message that is currently being written. */
    const updateLast = (fn: (text: string, notes: string[]) => { text?: string; notes?: string[] }) =>
        set((s) => {
            const messages = [...s.messages];
            const last = messages[messages.length - 1];
            if (last?.role !== 'assistant') return s;
            messages[messages.length - 1] = { ...last, ...fn(last.text, last.notes) };
            return { messages };
        });

    const addNote = (note: string) =>
        updateLast((_text, notes) => ({ notes: notes.includes(note) ? notes : [...notes, note] }));

    const lastNotes = () => {
        const last = get().messages.at(-1);
        return last?.role === 'assistant' ? last.notes : [];
    };

    async function consume(stream: AsyncGenerator<StreamEvent>) {
        for await (const ev of stream) {
            switch (ev.event) {
                case 'thread':
                    if (get().threadId !== ev.data.threadId) {
                        set({ threadId: ev.data.threadId });
                        // A new chat gets its own address without reloading the page.
                        if (window.location.pathname === '/chat') {
                            window.history.replaceState(null, '', `/chat/${ev.data.threadId}`);
                        }
                    }
                    break;
                case 'node': {
                    const note = NODE_NOTES[ev.data.name];
                    if (!note) break;
                    if (ev.data.name === 'generateTailoring' && lastNotes().includes(note)) {
                        addNote('Rewrote the draft after the check');
                    } else {
                        addNote(note);
                    }
                    break;
                }
                case 'tool':
                    addNote(TOOL_NOTES[ev.data.name] ?? 'Used a tool');
                    break;
                case 'token':
                    updateLast((text) => ({ text: text + ev.data.text }));
                    break;
                case 'message':
                    updateLast((text) => ({ text: text ? `${text}\n\n${ev.data.text}` : ev.data.text }));
                    break;
                case 'review':
                    set({ review: ev.data });
                    break;
                case 'error':
                    set({ error: ev.data.message });
                    break;
            }
        }
    }

    async function run(open: (signal: AbortSignal) => AsyncGenerator<StreamEvent>) {
        const controller = new AbortController();
        set({ streaming: true, error: null, controller });
        try {
            await consume(open(controller.signal));
        } catch (err) {
            if (!controller.signal.aborted) {
                set({ error: err instanceof Error ? err.message : 'Something went wrong. Try again.' });
            }
        } finally {
            set({ streaming: false, controller: null });
            void get().loadThreads();
        }
    }

    return {
        threads: [],
        threadId: null,
        messages: [],
        review: null,
        streaming: false,
        loading: false,
        error: null,
        controller: null,

        loadThreads: async () => {
            try {
                set({ threads: await api.threads() });
            } catch {
                // The sidebar list is a convenience, so a failure here stays quiet.
            }
        },

        newChat: () => {
            get().controller?.abort();
            set({ threadId: null, messages: [], review: null, error: null, streaming: false, loading: false });
        },

        openThread: async (id) => {
            if (get().threadId === id) return; // already open, or being created right now
            get().controller?.abort();
            set({ threadId: id, messages: [], review: null, error: null, streaming: false, loading: true });
            try {
                const detail = await api.thread(id);
                set({
                    messages: detail.messages.map(
                        (m): UiMessage =>
                            m.role === 'user'
                                ? { id: uid(), role: 'user', text: m.text }
                                : { id: uid(), role: 'assistant', text: m.text, notes: [] }
                    ),
                    review: detail.pendingReview,
                });
            } catch (err) {
                set({ error: err instanceof Error ? err.message : 'Could not load this chat.' });
            } finally {
                set({ loading: false });
            }
        },

        send: async (text) => {
            const { threadId, streaming, review } = get();
            if (streaming || review || !text.trim()) return;
            set((s) => ({ messages: [...s.messages, { id: uid(), role: 'user', text }, emptyReply()] }));
            await run((signal) =>
                postStream('/api/chat', { threadId: threadId ?? undefined, message: text }, signal)
            );
        },

        submitReview: async (approved) => {
            const { threadId, review } = get();
            if (!threadId || !review) return;
            set((s) => ({ review: null, messages: [...s.messages, emptyReply()] }));
            await run((signal) => postStream(`/api/chat/${threadId}/review`, { approved }, signal));
            if (get().error) set({ review }); // the decision did not go through, so bring the draft back
        },

        stop: () => {
            get().controller?.abort();
            set({ streaming: false });
        },
    };
});