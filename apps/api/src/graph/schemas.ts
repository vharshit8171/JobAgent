import { z } from 'zod';

// 1. Define the expected structure of job details extracted from a job description.
export const parsedJobSchema = z.object({
  title: z.string(),
  company: z.string(),
  requirements: z
    .array(z.string())
    .describe('Distinct skills or qualifications the job asks for. One short phrase each, at most 10.'),
  responsibilities: z.array(z.string()),
});

// 2. Define the structure of the report comparing job requirements with candidate qualifications.
export const matchReportSchema = z.object({
  items: z.array(
    z.object({
      requirement: z.string(),
      status: z.enum(['covered', 'partial', 'missing']),
      evidence: z
        .string()
        .describe('Short fact from the candidate material that supports the status. Empty if missing.'),
    })
  ),
  summary: z.string().describe('Two sentences on how well the candidate fits.'),
});

// 3. Define the expected structure of AI-generated resume improvements and cover letters.
export const tailoringSchema = z.object({
  bullets: z.array(z.string()).describe('3 to 6 resume bullet points tailored to this job'),
  coverLetter: z.string(),
});

// 4. Define the structure for checking whether AI-generated claims are supported by candidate information.
export const groundingSchema = z.object({
  grounded: z.boolean(),
  issues: z.array(z.string()).describe('Claims not supported by the candidate material. Empty if all supported.'),
});

// 5. Automatically generate TypeScript types from the corresponding Zod schemas.
export type ParsedJob = z.infer<typeof parsedJobSchema>;
export type MatchReport = z.infer<typeof matchReportSchema>;
export type Tailoring = z.infer<typeof tailoringSchema>;


/**
 * 📋 AI OUTPUT VALIDATION SCHEMAS
 *
 * WHAT THIS FILE DOES:
 * 1. Defines the expected structure of job information extracted by the LLM.
 * 2. Defines a schema for evaluating how well a candidate matches job requirements.
 * 3. Defines a schema for generating tailored resume bullet points and cover letters.
 * 4. Defines a schema for checking whether AI-generated claims are supported by candidate data.
 * 5. Generates reusable TypeScript types directly from the Zod schemas.
 *
 * WHY IT EXISTS:
 * - Structured Output: Ensures AI responses follow predefined data structures.
 * - Type Safety: Helps TypeScript identify incorrect data types during development.
 * - Validation: Allows the application to validate AI-generated data using Zod.
 * - Reliability: Reduces unexpected data-format issues when passing results between LangGraph nodes.
 * - Grounding: Helps identify unsupported claims and prevents fabricated candidate qualifications.
 * - Maintainability: Keeps validation rules and their corresponding TypeScript types together.
 */