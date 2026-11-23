import { readFile } from 'node:fs/promises';
import { DEV_USER_ID } from '../lib/config.js';
import { FIT_THRESHOLD, MAX_RETRIES } from '../graph/config.js';
import type { State, Update } from '../graph/state.js';
import { parseJob } from '../node/parseJob.js';
import { retrieveEvidence } from '../node/retrieveEvidence.js';
import { scoreMatch } from '../node/scoreMatch.js';
import { generateTailoring } from '../node/generateTailoring.js';
import { groundingCheck } from '../node/groundingCheck.js';

type Case = { name: string; file: string; expectFit: 'high' | 'low'; mustFind: string[] };
type Check = { name: string; pass: boolean; detail: string };

const PAUSE_MS = Number(process.env.EVAL_PAUSE_MS ?? 15000); // be kind to free-tier rate limits
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function runCase(c: Case): Promise<Check[]> {
    const jobDescription = await readFile(c.file, 'utf8');

    let state: State = {
        userId: DEV_USER_ID,
        jobDescription,
        parsedJob: null,
        evidence: {},
        matchReport: null,
        score: 0,
        draft: null,
        groundingIssues: [],
        attempts: 0,
        reviewApproved: null,
        outcome: null,
    };
    // Run one node and merge what it returns, the same thing the graph does.
    const step = async (node: (s: State) => Promise<Update>) => {
        const update = await node(state);
        state = { ...state, ...update } as State;
    };

    await step(parseJob);
    await step(retrieveEvidence);
    await step(scoreMatch);

    const found = (state.parsedJob?.requirements ?? []).map((r) => r.toLowerCase());
    const missed = c.mustFind.filter((t) => !found.some((r) => r.includes(t.toLowerCase())));
    const checks: Check[] = [
        { name: 'parses key requirements', pass: missed.length === 0, detail: missed.length ? `missed: ${missed.join(', ')}` : '' },
    ];

    const fits = state.score >= FIT_THRESHOLD;
    checks.push({ name: `fit is ${c.expectFit}`, pass: fits === (c.expectFit === 'high'), detail: `score ${state.score}%` });

    if (fits) {
        do {
            await step(generateTailoring);
            await step(groundingCheck);
        } while (state.groundingIssues.length > 0 && state.attempts <= MAX_RETRIES);

        checks.push({
            name: 'draft is grounded',
            pass: state.groundingIssues.length === 0,
            detail: `${state.attempts} attempt(s)`,
        });
    }
    return checks;
}

async function main() {
    const cases: Case[] = JSON.parse(await readFile('evals/cases.json', 'utf8'));
    let passed = 0;
    let total = 0;

    for (const [i, c] of cases.entries()) {
        console.log(`\n${c.name}`);
        let checks: Check[];
        try {
            checks = await runCase(c);
        } catch (err) {
            checks = [{ name: 'case ran', pass: false, detail: err instanceof Error ? err.message : String(err) }];
        }
        for (const check of checks) {
            total++;
            if (check.pass) passed++;
            console.log(`  ${check.pass ? 'PASS' : 'FAIL'}  ${check.name}${check.detail ? ` (${check.detail})` : ''}`);
        }
        if (i < cases.length - 1) await sleep(PAUSE_MS);
    }

    console.log(`\nPassed ${passed} of ${total} checks`);
    if (passed < total) process.exitCode = 1;
}

main();