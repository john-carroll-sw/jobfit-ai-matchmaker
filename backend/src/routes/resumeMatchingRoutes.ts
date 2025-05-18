import express from 'express';
import { ResumeMatchingController } from '../controllers/resumeMatchingController';

const router = express.Router();
const resumeMatchingController = new ResumeMatchingController();

/**
 * @route POST /api/resume-matching/analyze-job
 * @desc Analyze a job description
 * @access Public
 */
router.post('/analyze-job', async (req, res) => {
  await resumeMatchingController.analyzeJob(req, res);
});

/**
 * @route POST /api/resume-matching/match-resumes
 * @desc Match resumes to a job description
 * @access Public
 */
router.post('/match-resumes', async (req, res) => {
  await resumeMatchingController.matchResumes(req, res);
});

export default router;
