'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { setTokenGetter } from '@/lib/auth';
import { useChatStore } from '@/store/chatStore';

export function AuthGate({ children }: { children: React.ReactNode }) {
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const router = useRouter();

    const [ready, setReady] = useState(false);
    const getTokenRef = useRef(getToken);

    useEffect(() => {
        getTokenRef.current = getToken;
    }, [getToken]);

    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn) {
            setReady(false);
            setTokenGetter(null);

            // Clear previous user's chat data
            useChatStore.getState().newChat();
            useChatStore.setState({ threads: [] });

            router.replace('/sign-in');
            return;
        }

        setTokenGetter(() => getTokenRef.current());
        setReady(true);

        return () => {
            setTokenGetter(null);
        };
    }, [isLoaded, isSignedIn, router]);

    if (!isLoaded || !isSignedIn || !ready) {
        return (
            <div className="flex h-dvh items-center justify-center text-pencil">
                Loading...
            </div>
        );
    }

    return <>{children}</>;
}
