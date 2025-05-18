import { Request, Response } from 'express';
import { DefaultMatchingService } from '../azure/defaultMatchingService';
import { IMatchingService } from '../azure/matchingService';
import { z } from 'zod';
import { MatchingOptionsSchema } from '../azure/matchingTypes';

// Input validation schema
const ResumeMatchingRequestSchema = z.object({
  jobDescription: z.string().min(50, "Job description must be at least 50 characters"),
  matchingOptions: MatchingOptionsSchema.optional().default({})
});

export class ResumeMatchingController {
  private matchingService: IMatchingService;
  
  constructor() {
    // Using the default implementation
    // In the future, this could be chosen dynamically based on industry type in the request
    this.matchingService = new DefaultMatchingService();
  }
  
  /**
   * Analyze a job description
   * @param req Express request with job description in the body
   * @param res Express response
   */
  public analyzeJob = async (req: Request, res: Response) => {
    try {
      // Validate request
      const result = ResumeMatchingRequestSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid request",
          details: result.error.format() 
        });
      }
      
      const { jobDescription } = result.data;
      
      // Analyze the job description
      // This will use the appropriate analysis based on the service implementation
      const analysis = await this.matchingService.analyzeJobDescription(jobDescription);
      
      return res.status(200).json(analysis);
      
    } catch (error: any) {
      console.error("Error analyzing job:", error);
      res.status(500).json({ error: error.message || "Failed to analyze job description" });
    }
  };
  
  /**
   * Match resumes to a job description
   * @param req Express request with job description and matching options
   * @param res Express response
   */
  public matchResumes = async (req: Request, res: Response) => {
    try {
      // Validate request
      const result = ResumeMatchingRequestSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid request",
          details: result.error.format() 
        });
      }
      
      const { jobDescription, matchingOptions } = result.data;
      
      // Get resume matches
      // This will use the appropriate matching logic based on the service implementation
      const matches = await this.matchingService.matchResumes(
        jobDescription,
        matchingOptions
      );
      
      return res.status(200).json(matches);
      
    } catch (error: any) {
      console.error("Error matching resumes:", error);
      res.status(500).json({ error: error.message || "Failed to match resumes" });
    }
  };
}
