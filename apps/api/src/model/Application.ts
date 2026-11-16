import { Schema, model } from 'mongoose';

// 1. Define the structure of a job application document stored in MongoDB.
const applicationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true }, // Associate the application with its owner and index it for faster queries.
    company: String, // Store the company name.
    title: String, // Store the job position or title.
    jobDescription: String, // Store the original job description.
    score: Number, // Store the calculated job matching score.
    matchReport: Schema.Types.Mixed, // Store the detailed requirement-wise matching report.
    draft: Schema.Types.Mixed, // Store the tailored resume bullets and cover letter.
    status: {
      type: String,
      enum: ['saved', 'applied', 'interview', 'rejected', 'offer'], // Restrict application status to predefined values.
      default: 'saved', // Set newly created applications to saved by default.
    },
  },
  { timestamps: true } // Automatically maintain createdAt and updatedAt fields.
);

// 2. Create and export the Mongoose model for interacting with application documents.
export const Application = model('Application', applicationSchema);


/**
 * 📁 JOB APPLICATION DATABASE MODEL
 *
 * WHAT THIS FILE DOES:
 * 1. Defines the MongoDB document structure for storing job applications.
 * 2. Associates each application with a specific user through userId.
 * 3. Stores job details such as company name, title, and job description.
 * 4. Stores the AI-generated matching score and detailed match report.
 * 5. Stores tailored resume content and cover letter drafts.
 * 6. Maintains the application status throughout the job application process.
 * 7. Automatically tracks document creation and modification timestamps.
 *
 * WHY IT EXISTS:
 * - Data Persistence: Saves analyzed job applications in MongoDB for future access.
 * - User Association: Allows users to retrieve and manage their own applications.
 * - Progress Tracking: Helps users track applications from saved to offer or rejection.
 * - AI Integration: Preserves matching reports and tailored application drafts.
 * - Query Performance: Uses an index on userId to improve user-specific database queries.
 * - Maintainability: Centralizes the application data structure in one reusable model.
 */