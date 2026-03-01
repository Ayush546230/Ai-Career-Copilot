const express = require('express');
const router = express.Router();
const {
  uploadResume,
  getResumes,
  getResumeById,
  deleteResume,
  setPrimaryResume,
  getDashboard,
  getRoadmap
} = require('../controllers/student.controller');
const { protect, isStudent } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/uploadMiddleware');

// All routes are protected and student-only
router.use(protect, isStudent);


router.post('/resume/upload', upload.single('resume'), uploadResume);
router.get('/resumes', getResumes);
router.get('/resumes/:id', getResumeById);
router.delete('/resumes/:id', deleteResume);
router.patch('/resumes/:id/primary', setPrimaryResume);
router.get('/dashboard', getDashboard);
router.get('/roadmap', getRoadmap);

module.exports = router;