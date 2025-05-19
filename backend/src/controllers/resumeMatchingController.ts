import { Request, Response } from 'express';
import { DefaultMatchingService } from '../azure/defaultMatchingService';
import { IMatchingService } from '../azure/matchingService';
import { z } from 'zod';
import { MatchingOptionsSchema } from '@jobfit-ai/shared/src/zodSchemas';

// Input validation schema
const ResumeMatchingRequestSchema = z.object({
  jobDescription: z.string().min(50, "Job description must be at least 50 characters"),
  matchingOptions: MatchingOptionsSchema.optional().default({})
});

// Create a singleton instance of the matching service
const matchingService: IMatchingService = new DefaultMatchingService();

/**
 * @swagger
 * /api/resume-matching/analyze-job:
 *   post:
 *     summary: Analyze a job description
 *     description: Extracts key requirements, skills, and criteria from a job description
 *     tags: [Resume Matching]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobAnalysisRequest'
 *     responses:
 *       200:
 *         description: Successful analysis of job description
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobAnalysisResponse'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * Analyze a job description
 * @param req Express request with job description in the body
 * @param res Express response
 */
export const analyzeJob = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request
    const result = ResumeMatchingRequestSchema.safeParse(req.body);
    
    if (!result.success) {
      res.status(400).json({ 
        error: "Invalid request",
        details: result.error.format() 
      });
      return;
    }
    
    const { jobDescription } = result.data;
    
    // Analyze the job description
    // This will use the appropriate analysis based on the service implementation
    const analysis = await matchingService.analyzeJobDescription(jobDescription);
    
    res.status(200).json(analysis);
    
  } catch (error: any) {
    console.error("Error analyzing job:", error);
    res.status(500).json({ error: error.message || "Failed to analyze job description" });
  }
};

/**
 * @swagger
 * /api/resume-matching/match-resumes:
 *   post:
 *     summary: Match resumes to a job description
 *     description: Finds and ranks resumes that best match the given job description
 *     tags: [Resume Matching]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResumeMatchingRequest'
 *     responses:
 *       200:
 *         description: Successful matching of resumes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResumeMatchResponse'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * Match resumes to a job description
 * @param req Express request with job description and matching options
 * @param res Express response
 */
export const matchResumes = async (req: Request, res: Response) : Promise<void> => {
  try {
    // Validate request
    const result = ResumeMatchingRequestSchema.safeParse(req.body);
    
    if (!result.success) {
      res.status(400).json({ 
        error: "Invalid request",
        details: result.error.format() 
      });
      return
    }
    
    const { jobDescription, matchingOptions } = result.data;
    
    // Get resume matches
    // This will use the appropriate matching logic based on the service implementation
    const matches = await matchingService.matchResumes(
      jobDescription,
      matchingOptions
    );
    
    res.status(200).json(matches);
    
  } catch (error: any) {
    console.error("Error matching resumes:", error);
    res.status(500).json({ error: error.message || "Failed to match resumes" });
  }
};

// You can still export the controller if needed for backward compatibility
export class ResumeMatchingController {
  public analyzeJob = analyzeJob;
  public matchResumes = matchResumes;
}
