
'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
    streaming: boolean;
    locked: boolean;
    onSend: (text: string) => void;
    onStop: () => void;
};

export function Composer({
    streaming,
    locked,
    onSend,
    onStop,
}: Props) {
    const [value, setValue] = useState('');
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
    }, [value]);

    function submit() {
        const text = value.trim();

        if (!text || streaming || locked) return;

        onSend(text);
        setValue('');
    }

    return (
        <div className="flex items-end gap-3">
            <textarea
                ref={ref}
                rows={1}
                value={value}
                disabled={locked}
                aria-label="Message"
                placeholder={
                    locked
                        ? 'Decide on the draft first'
                        : 'Paste a job post or ask a question'
                }
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                    if (
                        e.key === 'Enter' &&
                        !e.shiftKey &&
                        !e.nativeEvent.isComposing
                    ) {
                        e.preventDefault();
                        submit();
                    }
                }}
               className="max-h-60 min-h-11 flex-1 resize-none rounded-xl border border-border bg-card px-4 py-2.5 leading-snug text-foreground placeholder:text-muted-foreground outline-none appearance-none transition-all focus:outline-none focus-visible:outline-none focus:border-primary/50 focus:ring-0 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
            />

            {streaming ? (
                <button
                    type="button"
                    onClick={onStop}
                    className="h-11 rounded-xl border border-border bg-muted px-4 font-semibold text-foreground transition-colors hover:bg-muted/80"
                >
                    Stop
                </button>
            ) : (
                <button
                    type="button"
                    onClick={submit}
                    disabled={locked || !value.trim()}
                    className="h-11 rounded-lg bg-[#526B54] px-5 font-semibold text-white transition-colors cursor-pointer hover:bg-[#405A43] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Send
                </button>
            )}
        </div>
    );
}
