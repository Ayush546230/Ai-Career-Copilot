const { Student } = require('../models');
const aiEngineService = require('../services/aiEngine.service');
const pdfService = require('../services/pdfService');
const roadmapService = require('../services/roadmapService');
const logger = require('../utils/logger');
const { redisClient } = require('../config/redis');
// @desc    Upload resume metadata
// @route   POST /api/student/resume/upload
// @access  Private (Student only)
const uploadResume = async (req, res) => {
    try {
        const studentId = req.user.id; // From auth middleware
        const file = req.file; // From multer
        // 1. Validation
        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a PDF file'
            });
        }
        console.log(`Processing resume`);

        let resumeText;
        try {
            resumeText = await pdfService.extractText(file.buffer);
        } catch (pdfError) {
            return res.status(400).json({
                success: false,
                message: pdfError.message
            });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // 2. Subscription Reset Logic (Monthly)
        const currentMonth = new Date().getMonth();
        const lastResetMonth = student.subscription?.usage?.resetDate
            ? new Date(student.subscription.usage.resetDate).getMonth()
            : -1;

        if (currentMonth !== lastResetMonth) {
            student.subscription.usage = {
                mockInterviewsUsed: 0,
                resumeScansUsed: 0,
                aiCreditsUsed: 0,
                resetDate: new Date()
            };
        }

        // 3. Check Resume Scan Limits
        const resumeLimit = student.subscription?.limits?.monthlyResumeScans || 3;
        const resumesUsed = student.subscription?.usage?.resumeScansUsed || 0;

        if (resumesUsed >= resumeLimit) {
            return res.status(403).json({
                success: false,
                message: `Monthly limit (${resumeLimit}) reached. Upgrade your plan.`
            });
        }

        // 4. ===== CALL REAL AI-ENGINE MICROSERVICE =====
        const targetRole = req.body.targetRole || student.profile?.targetRole || 'Full Stack Developer';
        console.log(`Analyzing resume for: ${targetRole}`);

        const analysisResult = await aiEngineService.analyzeResume(resumeText, targetRole);

        let finalAIData;
        if (analysisResult.success) {
            finalAIData = analysisResult.data;
        } else {
            console.warn('AI Engine fail, falling back to mock data');
            finalAIData = generateMockAnalysis();
        }
        console.log('DEBUG: roadmapService object is:', roadmapService);
        console.log('DEBUG: Type of generateRoadmap:', typeof roadmapService.generateRoadmap);

        let roadmap = null;
        try {
            const missingSkills = finalAIData.skill_gap_analysis?.missing_skills || [];
            roadmap = await roadmapService.generateRoadmap(missingSkills, targetRole);
        } catch (roadmapError) {
            console.error('Roadmap generation failed, but continuing with resume save:', roadmapError.message);
        }

        // 5. Update Primary Status & Create New Resume Entry
        student.resumes.forEach(resume => { resume.isPrimary = false; });

        const newResume = {
            fileName: file.originalname,
            fileUrl: `uploads/${Date.now()}-${file.originalname}`,
            fileSize: file.size,
            uploadedAt: new Date(),
            version: student.resumes.length + 1,
            isPrimary: true,
            extractedText: resumeText,

            // Mapping Snake Case (Python) to Camel Case (Mongoose)
            atsScore: finalAIData.ats_score,
            skillGapAnalysis: finalAIData.skill_gap_analysis,
            suggestions: finalAIData.suggestions,

            // Metadata
            embeddingModel: finalAIData.model_version || 'gemini-2.5-flash',
            embeddingGeneratedAt: new Date(finalAIData.analyzed_at || Date.now())
        };

        student.resumes.push(newResume);

        if (roadmap) {
            student.careerRoadmap = roadmap;
            logger.info('Saved roadmap to student profile');
        }

        // Update usage stats
        if (!student.subscription.usage) {
            student.subscription.usage = {};
        }
        student.subscription.usage.resumeScansUsed = resumesUsed + 1;
        if (!student.progressMetrics?.activityStats) {
            student.progressMetrics = { activityStats: { totalResumeUploads: 0 } };
        }
        student.progressMetrics.activityStats.totalResumeUploads += 1;
        student.progressMetrics.activityStats.lastActiveDate = new Date();


        await redisClient.del(`dashboard:${studentId}`);
        await student.save();

        // Step 8: Return Response
        res.status(201).json({
            success: true,
            message: roadmap
                ? 'Resume analyzed and roadmap generated successfully'
                : 'Resume analyzed successfully',
            data: {
                // Resume analysis
                analysis: {
                    resumeId: newResume._id,
                    fileName: newResume.fileName,
                    atsScore: newResume.atsScore,
                    skillGapAnalysis: newResume.skillGapAnalysis,
                    suggestions: newResume.suggestions
                },
                // Roadmap (Updated to match our nested Schema)
                roadmap: roadmap ? {
                    targetRole: roadmap.targetRole,
                    totalMilestones: roadmap.progress.totalMilestones, // Schema match
                    percentComplete: roadmap.progress.percentComplete, // Schema match
                    milestones: roadmap.milestones,
                    generatedAt: roadmap.generatedAt,
                    isFallback: roadmap.isFallback || false
                } : null,
                // Usage info
                usageLimits: {
                    limit: resumeLimit,
                    used: student.subscription.usage.resumeScansUsed,
                    remaining: resumeLimit - student.subscription.usage.resumeScansUsed
                }
            }
        });

    } catch (error) {
        console.error('Resume upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error analyzing resume',
            error: error.message
        });
    }
};

function generateMockAnalysis() {
    // Fallback mock data 
    return {
        ats_score: {
            overall: Math.floor(Math.random() * 30) + 70,
            breakdown: {
                formatting: Math.floor(Math.random() * 20) + 80,
                keywords: Math.floor(Math.random() * 30) + 70,
                experience: Math.floor(Math.random() * 25) + 75,
                education: Math.floor(Math.random() * 15) + 85,
                skills: Math.floor(Math.random() * 30) + 70
            }
        },
        skill_gap_analysis: {
            current_skills: ['JavaScript', 'React', 'Node.js'],
            required_skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'AWS'],
            missing_skills: ['TypeScript', 'AWS'],
            skills_to_improve: []
        },
        suggestions: [],
        analyzed_at: new Date().toISOString(),
        model_version: 'fallback-mock'
    };
}

// @desc    Get student dashboard data
// @route   GET /api/student/dashboard
// @access  Private (Student only)
const getDashboard = async (req, res) => {
    try {
        const studentId = req.user?.id || req.userId;
        const cacheKey = `dashboard:${studentId}`;

        // 1. Redis Check
        const cachedDashboard = await redisClient.get(cacheKey);
        if (cachedDashboard) {
            console.log('⚡ Dashboard Cache Hit');
            return res.status(200).json({ success: true, data: JSON.parse(cachedDashboard) });
        }
        const student = await Student.findById(studentId)
            .select('resumes careerRoadmap mentorship progressMetrics profile')
            .lean();

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // 1. Overview Data
        const primaryResume = student.resumes?.find(r => r.isPrimary) || student.resumes?.[0];
        const latestATSScore = primaryResume?.atsScore?.overall || 0;

        // Calculate missing skills count
        const missingSkillsCount = primaryResume?.skillGapAnalysis?.missing_skills?.length || 0;

        // Calculate roadmap progress
        const roadmapProgress = student.careerRoadmap?.milestones?.length > 0
            ? Math.round((student.careerRoadmap.milestones.filter(m => m.status === 'completed').length /
                student.careerRoadmap.milestones.length) * 100)
            : 0;

        const activeMentorsCount = student.mentorship?.activeMentors?.filter(m => m.status === 'active').length || 0;

        // 2. Resume Data
        const resumeData = primaryResume ? {
            fileName: primaryResume.fileName,
            analyzedAt: primaryResume.uploadedAt,
            atsScore: primaryResume.atsScore || { overall: 0, breakdown: {} }
        } : null;

        // 3. Skill Gaps Data
        const skillGapsData = primaryResume?.skillGapAnalysis ? {
            missing: primaryResume.skillGapAnalysis.missing_skills?.map(skill => ({
                skill,
                priority: 'high' // Default priority as it's not in the simple string array
            })) || [],
            toImprove: primaryResume.skillGapAnalysis.skills_to_improve?.map(skill => ({
                skill,
                currentLevel: 'Intermediate', // Default
                targetLevel: 'Advanced'      // Default
            })) || []
        } : null;

        // 4. Roadmap Data (Simplified for dashboard snapshot)
        const roadmapData = student.careerRoadmap?.milestones?.map((m, index) => ({
            id: m._id || index + 1,
            title: m.title,
            status: m.status,
            dueDate: null, // Roadmap schema might need dates if not present
            tasks: m.tasks?.length || 0,
            completedTasks: m.tasks?.filter(t => t.completed).length || 0
        })) || [];

        // 5. Mentors Data (Mock rich data from ID references if needed, or just return basic info)
        // In a real app, you'd populate mentor details. For now, we'll return the structure.
        const mentorsData = student.mentorship?.activeMentors?.map(m => ({
            id: m.mentorId,
            name: m.mentorName || 'Mentor', // storage of name in activeMentors is recommended to avoid extra queries
            role: 'Mentor',
            company: 'Unknown',
            rating: 5.0,
            nextSession: null
        })) || [];

        const dashboardData = {
            student: {
                overview: {
                    atsScore: latestATSScore,
                    skillGaps: missingSkillsCount,
                    roadmapProgress: roadmapProgress,
                    activeMentors: activeMentorsCount
                },
                resume: resumeData,
                skillGaps: skillGapsData,
                roadmap: roadmapData,
                mentors: mentorsData
            }
        };
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(dashboardData));

        res.status(200).json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data',
            error: error.message
        });
    }
};

// @desc    Get student career roadmap
// @route   GET /api/student/roadmap
// @access  Private (Student only)
const getRoadmap = async (req, res) => {
    try {
        const studentId = req.user.id;
        const cacheKey = `roadmap:${studentId}`;

        const cachedRoadmap = await redisClient.get(cacheKey);
        if (cachedRoadmap) {
            console.log('⚡ Serving Roadmap from Redis Cache');
            return res.status(200).json({
                success: true,
                fromCache: true,
                data: JSON.parse(cachedRoadmap)
            });
        }

        const student = await Student.findById(studentId)
            .select('careerRoadmap profile')
            .lean();

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // If roadmap exists, return it
        if (student.careerRoadmap && student.careerRoadmap.milestones?.length > 0) {
            return res.status(200).json({
                success: true,
                data: student.careerRoadmap
            });
        }

        // Generate placeholder roadmap if none exists
        const placeholderRoadmap = {
            generatedAt: new Date(),
            lastUpdatedAt: new Date(),
            targetRole: student.profile?.targetRole || 'Software Engineer',
            estimatedTimeToGoal: 12, // months
            milestones: [
                {
                    order: 1,
                    title: 'Master Core Programming Fundamentals',
                    description: 'Build strong foundation in data structures and algorithms',
                    category: 'skill',
                    estimatedDuration: 60,
                    status: 'not_started',
                    priority: 'critical',
                    tasks: [
                        {
                            description: 'Complete data structures course',
                            completed: false
                        },
                        {
                            description: 'Solve 50 LeetCode problems',
                            completed: false
                        }
                    ]
                },
                {
                    order: 2,
                    title: 'Build Portfolio Projects',
                    description: 'Create 3-5 full-stack projects showcasing your skills',
                    category: 'project',
                    estimatedDuration: 90,
                    status: 'not_started',
                    priority: 'critical',
                    tasks: [
                        {
                            description: 'Build a CRUD application',
                            completed: false
                        },
                        {
                            description: 'Deploy projects to production',
                            completed: false
                        }
                    ]
                },
                {
                    order: 3,
                    title: 'Interview Preparation',
                    description: 'Practice technical and behavioral interviews',
                    category: 'skill',
                    estimatedDuration: 45,
                    status: 'not_started',
                    priority: 'important',
                    tasks: [
                        {
                            description: 'Complete 20 mock interviews',
                            completed: false
                        },
                        {
                            description: 'Study system design patterns',
                            completed: false
                        }
                    ]
                }
            ],
            progress: {
                completedMilestones: 0,
                totalMilestones: 3,
                percentComplete: 0,
                onTrack: true
            },
            aiModel: 'gpt-4',
            modelVersion: 'v1.0-placeholder',
            regenerationCount: 0
        };

        await redisClient.setEx(cacheKey, 3600, JSON.stringify(roadmapData));

        res.status(200).json({
            success: true,
            fromCache: false,
            data: placeholderRoadmap,
            message: 'Placeholder roadmap generated. Complete your profile to get a personalized roadmap.'
        });
    } catch (error) {
        console.error('Roadmap error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching roadmap',
            error: error.message
        });
    }
};
// @desc    Get all resumes of a student
// @route   GET /api/student/resumes
// @access  Private
const getResumes = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id).select('resumes');

        res.status(200).json({
            success: true,
            count: student.resumes.length,
            data: student.resumes.sort((a, b) => b.uploadedAt - a.uploadedAt) // Latest first
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get specific resume details
// @route   GET /api/student/resumes/:id
// @access  Private
const getResumeById = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id);
        const resume = student.resumes.id(req.params.id);

        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found' });
        }

        res.status(200).json({ success: true, data: resume });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a resume
// @route   DELETE /api/student/resumes/:id
// @access  Private
const deleteResume = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id);
        const resume = student.resumes.id(req.params.id);

        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found' });
        }

        // Agar primary resume delete ho rha h, toh kisi aur ko primary banana padega (Optional Logic)
        const wasPrimary = resume.isPrimary;

        // Mongoose subdocument remove
        resume.deleteOne();

        // Agar primary delete hua aur abhi bhi resumes bache hain, toh latest wale ko primary bana do
        if (wasPrimary && student.resumes.length > 0) {
            student.resumes[0].isPrimary = true;
        }

        await student.save();

        res.status(200).json({ success: true, message: 'Resume deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Set a resume as primary
// @route   PATCH /api/student/resumes/:id/primary
// @access  Private
const setPrimaryResume = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id);

        let found = false;
        student.resumes.forEach(resume => {
            if (resume._id.toString() === req.params.id) {
                resume.isPrimary = true;
                found = true;
            } else {
                resume.isPrimary = false;
            }
        });

        if (!found) {
            return res.status(404).json({ success: false, message: 'Resume not found' });
        }

        await student.save();
        res.status(200).json({ success: true, message: 'Primary resume updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
module.exports = {
    uploadResume,
    getDashboard,
    getRoadmap,
    getResumes,
    getResumeById,
    deleteResume,
    setPrimaryResume
};