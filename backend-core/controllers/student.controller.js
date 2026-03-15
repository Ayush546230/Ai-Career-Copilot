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

            // Mapping Snake Case (AI Engine) to Camel Case (Mongoose)
            atsScore: {
                overall: finalAIData.ats_score?.overall,
                breakdown: {
                    formatting: finalAIData.ats_score?.breakdown?.formatting,
                    keywords: finalAIData.ats_score?.breakdown?.keywords,
                    experience: finalAIData.ats_score?.breakdown?.experience,
                    education: finalAIData.ats_score?.breakdown?.education,
                    skills: finalAIData.ats_score?.breakdown?.skills
                }
            },
            skillGapAnalysis: {
                currentSkills: finalAIData.skill_gap_analysis?.current_skills || [],
                requiredSkills: (finalAIData.skill_gap_analysis?.required_skills || []).map(skill =>
                    typeof skill === 'string' ? { skill, priority: 'medium' } : skill
                ),
                missingSkills: (finalAIData.skill_gap_analysis?.missing_skills || []).map(skill =>
                    typeof skill === 'string' ? { skill, priority: 'high' } : skill
                ),
                skillsToImprove: finalAIData.skill_gap_analysis?.skills_to_improve?.map(s => ({
                    skill: s.skill,
                    currentLevel: s.current_level,
                    targetLevel: s.target_level,
                    priority: s.priority
                })) || []
            },
            suggestions: (finalAIData.suggestions || []).map(s => ({
                category: s.category || 'General',
                priority: s.priority || 'medium',
                issue: s.issue || '',
                suggestion: s.recommendation || s.suggestion || '',
                example: {
                    before: s.example?.before || s.example_before || '',
                    after: s.example?.after || s.example_after || ''
                }
            })),

            // Metadata
            embeddingModel: finalAIData.model_version || 'gemini-2.5-flash',
            embeddingGeneratedAt: new Date(finalAIData.analyzed_at || Date.now()),

            // Roadmap tied to this resume
            roadmap: roadmap
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
        await redisClient.del(cacheKey); // Temporary clear to sync new structure

        // 1. Redis Check
        const cachedDashboard = await redisClient.get(cacheKey);
        if (cachedDashboard) {
            console.log('⚡ Dashboard Cache Hit');
            return res.status(200).json({ success: true, data: JSON.parse(cachedDashboard) });
        }
        const student = await Student.findById(studentId)
            .select('resumes careerRoadmap mentorship progressMetrics profile email')
            .lean();

        console.log(`DEBUG: Dashboard fetch for ${student?.email || studentId}. Resumes: ${student?.resumes?.length}, Roadmap: ${!!student?.careerRoadmap}`);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // 1. Overview Data
        const primaryResume = student.resumes?.find(r => r.isPrimary) || student.resumes?.[0];
        const latestATSScore = primaryResume?.atsScore?.overall || 0;

        // Calculate resume count
        const totalResumes = student.resumes?.length || 0;

        // Calculate missing skills count
        const missingSkillsCount = primaryResume?.skillGapAnalysis?.missingSkills?.length || 0;

        // Calculate roadmap progress
        const roadmapProgress = student.careerRoadmap?.milestones?.length > 0
            ? Math.round((student.careerRoadmap.milestones.filter(m => m.status === 'completed').length /
                student.careerRoadmap.milestones.length) * 100)
            : 0;

        const activeMentorsCount = student.mentorship?.activeMentors?.filter(m => m.status === 'active').length || 0;

        // 2. Resume Data (Full data for modal compatibility)
        const resumeData = primaryResume ? {
            _id: primaryResume._id,
            fileName: primaryResume.fileName,
            analyzedAt: primaryResume.uploadedAt,
            atsScore: primaryResume.atsScore || { overall: 0, breakdown: {} },
            skillGapAnalysis: primaryResume.skillGapAnalysis,
            suggestions: primaryResume.suggestions,
            roadmap: primaryResume.roadmap || student.careerRoadmap,
            careerRoadmap: primaryResume.roadmap || student.careerRoadmap // Duplicate for modal compatibility
        } : null;

        // 3. Skill Gaps Data
        const skillGapsData = primaryResume?.skillGapAnalysis ? {
            missing: primaryResume.skillGapAnalysis.missingSkills?.map(item => {
                const skillName = typeof item === 'string' ? item : item.skill;
                const priority = typeof item === 'string' ? 'high' : item.priority;
                return { skill: skillName, priority };
            }) || [],
            toImprove: primaryResume.skillGapAnalysis.skillsToImprove?.map(s => ({
                skill: s.skill,
                currentLevel: s.currentLevel,
                targetLevel: s.targetLevel
            })) || []
        } : null;

        // 4. Roadmap Data (Simplified for dashboard snapshot)
        const roadmapData = student.careerRoadmap?.milestones?.map((m, index) => ({
            id: m._id || index + 1,
            title: m.title,
            description: m.description,
            status: m.status,
            priority: m.priority,
            tasks: m.tasks || []
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
                    resumeCount: totalResumes,
                    roadmapProgress: roadmapProgress,
                    activeMentors: activeMentorsCount,
                    targetRole: student.careerRoadmap?.targetRole || student.profile?.targetRole || 'Full Stack Developer'
                },
                resume: resumeData,
                skillGaps: skillGapsData,
                suggestions: primaryResume?.suggestions?.slice(0, 3).map(s => ({
                    category: s.category,
                    priority: s.priority,
                    issue: s.issue,
                    suggestion: s.suggestion || s.recommendation,
                    example: s.example || {
                        before: s.exampleBefore || '',
                        after: s.exampleAfter || ''
                    }
                })) || [],
                roadmap: roadmapData,
                careerRoadmap: roadmapData,
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
                        { description: 'Complete data structures course', completed: false },
                        { description: 'Solve 50 LeetCode problems', completed: false },
                        { description: 'Implement 5 basic sorting algorithms', completed: false },
                        { description: 'Solve 20 system design questions', completed: false }
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
                        { description: 'Build a CRUD application', completed: false },
                        { description: 'Deploy projects to production', completed: false },
                        { description: 'Create a responsive UI with React', completed: false },
                        { description: 'Implement user authentication', completed: false }
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
                        { description: 'Complete 20 mock interviews', completed: false },
                        { description: 'Study system design patterns', completed: false },
                        { description: 'Prepare 10 behavioral stories', completed: false },
                        { description: 'Review core CS fundamentals', completed: false }
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

        await redisClient.setEx(cacheKey, 3600, JSON.stringify(placeholderRoadmap));

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
        const student = await Student.findById(req.user.id)
            .select('resumes careerRoadmap email')
            .lean();

        if (!student) {
            console.error(`ERROR: Student not found for ID: ${req.user.id}`);
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        console.log(`DEBUG: getResumes for ${student.email}. StudentID: ${student._id}. Raw resumes count: ${student.resumes?.length || 0}`);

        // Add fallback roadmap to each resume if not present
        const resumesWithRoadmap = (student.resumes || []).map(resume => {
            const resumeObj = { ...resume };
            // Ensure roadmap is present - either on the resume or from student profile
            if ((!resumeObj.roadmap || !resumeObj.roadmap.milestones || resumeObj.roadmap.milestones.length === 0) && student.careerRoadmap) {
                resumeObj.roadmap = student.careerRoadmap;
                // Also add it as careerRoadmap key for extra safety
                resumeObj.careerRoadmap = student.careerRoadmap;
            }
            return resumeObj;
        });

        const finalResumes = (resumesWithRoadmap || []).sort((a, b) => {
            const dateA = new Date(a.uploadedAt || a.createdAt || 0);
            const dateB = new Date(b.uploadedAt || b.createdAt || 0);
            return dateB - dateA;
        });

        console.log(`DEBUG: Final resumes array length to send: ${finalResumes.length}`);

        return res.status(200).json({
            success: true,
            count: finalResumes.length,
            data: {
                resumes: finalResumes,
                careerRoadmap: student.careerRoadmap
            }
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

        // Add fallback roadmap from student profile if not present in resume
        const resumeObj = resume.toObject();
        if (!resumeObj.roadmap && student.careerRoadmap) {
            resumeObj.roadmap = student.careerRoadmap;
        }

        res.status(200).json({ success: true, data: resumeObj });
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