'use client';

import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { UserButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { useChatStore } from '@/store/chatStore';
import { BriefcaseBusiness } from 'lucide-react';

const NAV = [
    { href: '/chat', label: 'Chat' },
    { href: '/applications', label: 'Applications' },
    { href: '/resume', label: 'Resume' },
];

function SidebarContent() {
    const pathname = usePathname();
    const threads = useChatStore((s) => s.threads);
    const loadThreads = useChatStore((s) => s.loadThreads);

    useEffect(() => {
        void loadThreads();
    }, [loadThreads]);

    const activeThread = pathname.startsWith('/chat/')
        ? pathname.split('/')[2]
        : null;

    const isActive = (href: string) =>
        pathname === href || pathname.startsWith(`${href}/`);

    const links = NAV.map((item) => (
        <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? 'page' : undefined}
            className={`block rounded-lg px-1 py-2 font-medium transition-colors ${isActive(item.href)
                ? 'bg-[#526B54]/10 text-[#526B54]'
                : 'text-muted-foreground hover:bg-[#EDF2E9] hover:text-[#526B54]'
                }`}
        >
            <span>
                {item.label}
            </span>
        </Link>
    ));

    return (
        <>
            <aside className="hidden w-68 shrink-0 flex-col border-r border-rule p-5 md:flex">
                <Link
                    href="/chat"
                    className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-[#526B54] transition-opacity hover:opacity-80"
                >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#526B54] text-white shadow-sm">
                        <BriefcaseBusiness size={18} />
                    </span>
                    <span>
                        Career<span className="text-[#849B85]">Pilot</span>
                    </span>
                </Link>

                <nav className="mt-8" aria-label="Main">
                    {links}
                </nav>

                <div className="mt-8 flex items-baseline justify-between">
                    <h2 className="text-sm font-semibold text-[#526B54]">Recent chats</h2>
                    <Link
                        href="/chat"
                        className="text-sm font-semibold text-cobalt-dark decoration-cobalt-dark underline-offset-4 transition-colors hover:text-cobalt"
                    >
                        New chat
                    </Link>
                </div>

                <ul className="mt-3 min-h-0 flex-1 space-y-0.5 overflow-y-auto">
                    {threads.map((t) => (
                        <li key={t.threadId}>
                            <Link
                                href={`/chat/${t.threadId}`}
                                className={`block truncate border-l-2 py-1.5 pl-3 text-sm ${t.threadId === activeThread
                                    ? 'border-cobalt font-semibold'
                                    : 'border-transparent text-graphite/70 hover:border-rule'
                                    }`}
                            >
                                {t.title}
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="mt-4 border-t border-rule pt-4">
                    <UserButton showName />
                </div>
            </aside>
        </>
    );
}

export function Sidebar() {
    return (
        <Suspense fallback={<div className="min-h-12" />}>
            <SidebarContent />
        </Suspense>
    );
}
