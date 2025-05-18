import { Router } from 'express';
import { analyzeJob, matchResumes } from '../controllers/resumeMatchingController';

const router = Router();

/**
 * @route POST /api/resume-matching/analyze-job
 * @desc Analyze a job description
 * @access Public
 */
router.post('/analyze-job', analyzeJob);

/**
 * @route POST /api/resume-matching/match-resumes
 * @desc Match resumes to a job description
 * @access Public
 */
router.post('/match-resumes', matchResumes);

export default router;
