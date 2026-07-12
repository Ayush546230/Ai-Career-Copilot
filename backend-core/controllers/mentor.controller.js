const { Student, Mentor, Message } = require('../models');
const aiEngineService = require('../services/aiEngine.service');
const mongoose = require('mongoose');
const { redisClient } = require('../config/redis');

// @desc    Get list of mentors with filters
// @route   GET /api/mentor
// @access  Public
const getMentors = async (req, res) => {
    try {
        const {
            skill,
            experience,
            limit = 20,
            page = 1,
            isFree,
            minRating,
            availability
        } = req.query;

        // Build query
        const query = {
            'account.status': 'active',
            'account.verificationStatus': 'verified'
        };

        // Filter by skill
        if (skill) {
            query['expertise.technicalSkills.name'] = {
                $regex: new RegExp(skill, 'i')
            };
        }

        // Filter by minimum years of experience
        if (experience) {
            query['profile.totalYearsOfExperience'] = {
                $gte: parseInt(experience)
            };
        }

        // Filter by free/paid
        if (isFree !== undefined) {
            query['mentorship.pricing.isFree'] = isFree === 'true';
        }

        // Filter by minimum rating
        if (minRating) {
            query['reputation.overallRating'] = {
                $gte: parseFloat(minRating)
            };
        }

        // Filter by availability
        if (availability) {
            query['mentorship.availability.status'] = availability;
        }

        // Pagination
        const limitNum = parseInt(limit);
        const skip = (parseInt(page) - 1) * limitNum;

        // Execute query with optimized field selection
        const mentors = await Mentor.find(query)
            .select(
                'profile.firstName profile.lastName profile.displayName profile.avatarUrl ' +
                'profile.tagline profile.currentRole profile.currentCompany profile.totalYearsOfExperience ' +
                'expertise.technicalSkills expertise.domains expertise.canHelpWith ' +
                'mentorship.pricing mentorship.availability.status ' +
                'reputation.overallRating reputation.totalRatings reputation.badges'
            )
            .sort({ 'reputation.overallRating': -1, 'reputation.totalRatings': -1 })
            .limit(limitNum)
            .skip(skip)
            .lean();

        // Get total count for pagination
        const total = await Mentor.countDocuments(query);

        // Format response
        const formattedMentors = mentors.map(mentor => ({
            id: mentor._id,
            name: mentor.profile?.displayName ||
                `${mentor.profile?.firstName} ${mentor.profile?.lastName}`,
            avatarUrl: mentor.profile?.avatarUrl,
            tagline: mentor.profile?.tagline,
            currentRole: mentor.profile?.currentRole,
            currentCompany: mentor.profile?.currentCompany,
            yearsOfExperience: mentor.profile?.totalYearsOfExperience,
            skills: mentor.expertise?.technicalSkills?.slice(0, 5).map(s => s.name) || [],
            canHelpWith: mentor.expertise?.canHelpWith || [],
            rating: mentor.reputation?.overallRating || 0,
            totalRatings: mentor.reputation?.totalRatings || 0,
            badges: mentor.reputation?.badges?.map(b => b.name) || [],
            isFree: mentor.mentorship?.pricing?.isFree || false,
            isPaid: mentor.mentorship?.pricing?.isPaid || false,
            availability: mentor.mentorship?.availability?.status,
            sessionTypes: mentor.mentorship?.pricing?.sessionTypes || []
        }));

        res.status(200).json({
            success: true,
            count: formattedMentors.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limitNum),
            data: formattedMentors
        });
    } catch (error) {
        console.error('Get mentors error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching mentors',
            error: error.message
        });
    }
};

// @desc    Send mentorship request to a mentor
// @route   POST /api/mentor/request
// @access  Private (Student only)
const sendMentorshipRequest = async (req, res) => {
    try {
        const studentId = req.userId;
        const { mentorId, message } = req.body;

        // Validate input
        if (!mentorId) {
            return res.status(400).json({
                success: false,
                message: 'mentorId is required'
            });
        }

        // Find mentor
        const mentor = await Mentor.findById(mentorId);

        if (!mentor) {
            return res.status(404).json({
                success: false,
                message: 'Mentor not found'
            });
        }

        // Check if mentor is accepting students
        if (mentor.mentorship.availability.status === 'not_accepting') {
            return res.status(400).json({
                success: false,
                message: 'This mentor is not currently accepting new students'
            });
        }

        // Check if mentor has available slots
        if (!mentor.hasAvailableSlots()) {
            return res.status(400).json({
                success: false,
                message: 'This mentor has reached maximum student capacity'
            });
        }

        // Find student
        const student = await Student.findById(studentId)
            .select('mentorship profile resumes careerRoadmap');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Check if student already has active mentorship with this mentor
        const hasActiveMentor = student.mentorship?.activeMentors?.some(
            m => m.mentorId.toString() === mentorId && m.status === 'active'
        );

        if (hasActiveMentor) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active mentorship with this mentor'
            });
        }

        // Check if there's already a pending request
        const hasPendingRequest = student.mentorship?.mentorRequests?.some(
            r => r.mentorId.toString() === mentorId && r.status === 'pending'
        );

        if (hasPendingRequest) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending request to this mentor'
            });
        }

        // Create mentorship request in student's record
        if (!student.mentorship) student.mentorship = { mentorRequests: [] };
        if (!student.mentorship.mentorRequests) student.mentorship.mentorRequests = [];

        // Check if there's an existing request entry to update instead of pushing duplicate
        const existingStudentReq = student.mentorship.mentorRequests.find(r => r.mentorId.toString() === mentorId.toString());
        if (existingStudentReq) {
            existingStudentReq.status = 'pending';
            existingStudentReq.requestedAt = new Date();
            existingStudentReq.message = message || '';
        } else {
            student.mentorship.mentorRequests.push({
                mentorId,
                requestedAt: new Date(),
                status: 'pending',
                message: message || ''
            });
        }
        student.markModified('mentorship.mentorRequests');

        // Add request to mentor's pending requests
        if (!mentor.mentorship.students) mentor.mentorship.students = { pendingRequests: [] };
        if (!mentor.mentorship.students.pendingRequests) mentor.mentorship.students.pendingRequests = [];

        // Check if there's an existing pending request in mentor's array
        const existingMentorReq = mentor.mentorship.students.pendingRequests.find(r => r.studentId.toString() === studentId.toString());
        if (existingMentorReq) {
            existingMentorReq.status = 'pending';
            existingMentorReq.requestedAt = new Date();
            existingMentorReq.studentMessage = message || '';
            existingMentorReq.viewedByMentor = false;
        } else {
            mentor.mentorship.students.pendingRequests.push({
                studentId,
                requestedAt: new Date(),
                status: 'pending',
                studentMessage: message || '',
                studentProfile: {
                    name: student.profile?.displayName || `${student.profile?.firstName} ${student.profile?.lastName}`,
                    targetRole: student.profile?.targetRole || student.careerRoadmap?.targetRole || student.getPrimaryResume()?.roadmap?.targetRole || 'Software Engineer',
                    experience: `${student.profile?.yearsOfExperience || 0} years`,
                    goals: student.mentorship?.preferences?.mentorshipGoals || []
                },
                viewedByMentor: false
            });
        }
        mentor.markModified('mentorship.students.pendingRequests');

        // Update mentor's analytics
        if (!mentor.analytics) {
            mentor.analytics = { engagement: {} };
        }
        if (!mentor.analytics.engagement) {
            mentor.analytics.engagement = {};
        }
        mentor.analytics.engagement.requestsReceived =
            (mentor.analytics.engagement.requestsReceived || 0) + 1;
        mentor.analytics.engagement.requestsPending =
            (mentor.analytics.engagement.requestsPending || 0) + 1;

        await student.save();
        await mentor.save();

        res.status(201).json({
            success: true,
            message: 'Mentorship request sent successfully',
            data: {
                mentorId,
                mentorName: mentor.profile?.displayName,
                status: 'pending'
            }
        });
    } catch (error) {
        console.error('Mentorship request error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending mentorship request',
            error: error.message
        });
    }
};

// @desc    Update mentor profile
// @route   PATCH /api/mentor/profile
// @access  Private (Mentor only)
const updateProfile = async (req, res) => {
    try {
        const mentorId = req.userId;
        const updates = req.body;

        const mentor = await Mentor.findById(mentorId);

        if (!mentor) {
            return res.status(404).json({ success: false, message: 'Mentor not found' });
        }

        // 1. Update Profile Fields
        if (updates.profile) {
            if (updates.profile.firstName) mentor.profile.firstName = updates.profile.firstName;
            if (updates.profile.lastName) mentor.profile.lastName = updates.profile.lastName;
            if (updates.profile.tagline) mentor.profile.tagline = updates.profile.tagline;
            if (updates.profile.bio) mentor.profile.bio = updates.profile.bio;
            if (updates.profile.currentCompany) mentor.profile.currentCompany = updates.profile.currentCompany;
            
            // Sync displayName
            mentor.profile.displayName = `${mentor.profile.firstName} ${mentor.profile.lastName}`;
        }

        // 2. Update Expertise
        if (updates.expertise) {
            if (!mentor.expertise) mentor.expertise = {};
            
            if (updates.expertise.technicalSkills) {
                mentor.expertise.technicalSkills = updates.expertise.technicalSkills.map(s => ({
                    name: s.skill,
                    proficiency: (s.proficiency || 'expert').toLowerCase(),
                    yearsOfExperience: mentor.profile.totalYearsOfExperience || 0 
                }));
            }
            if (updates.expertise.domains) {
                // Wrap strings into objects as per DomainExpertiseSchema
                mentor.expertise.domains = updates.expertise.domains.map(d => ({
                    name: d,
                    yearsOfExperience: mentor.profile.totalYearsOfExperience || 0
                }));
            }
        }

        // 3. Update Mentorship details
        if (updates.mentorship) {
            if (!mentor.mentorship) mentor.mentorship = {};
            
            if (updates.mentorship.experience) {
                if (!mentor.mentorship.experience) mentor.mentorship.experience = {};
                mentor.mentorship.experience.totalYears = updates.mentorship.experience.totalYears;
                mentor.profile.totalYearsOfExperience = updates.mentorship.experience.totalYears;
            }
            if (updates.mentorship.style) {
                if (!mentor.mentorship.style) mentor.mentorship.style = {};
                
                // Map frontend style to snake_case enum and ensure it's an array
                const styleMap = {
                    'Hands-on': 'hands_on',
                    'Advisory': 'advisory',
                    'Project-based': 'project_based',
                    'Career Focused': 'career_focused'
                };
                const mappedStyle = styleMap[updates.mentorship.style.approach] || 'hands_on';
                mentor.mentorship.style.approach = [mappedStyle];
            }
        }

        // 4. Update Availability
        if (updates.availability) {
            if (!mentor.mentorship) mentor.mentorship = {};
            if (!mentor.mentorship.availability) mentor.mentorship.availability = {};
            
            // Map 'busy' to 'not_accepting'
            const statusMap = {
                'accepting': 'accepting',
                'busy': 'not_accepting',
                'limited': 'limited'
            };
            mentor.mentorship.availability.status = statusMap[updates.availability] || 'accepting';
        }

        await mentor.save();

        // 5. Trigger AI Sync
        try {
            const profileText = `
                Name: ${mentor.profile.displayName}
                Tagline: ${mentor.profile.tagline || ''}
                Bio: ${mentor.profile.bio || ''}
                Current Company: ${mentor.profile.currentCompany || 'Freelancer'}
                Skills: ${mentor.expertise.technicalSkills.map(s => s.name).join(', ')}
                Domains: ${mentor.expertise.domains.map(d => d.name).join(', ')}
                Style: ${mentor.mentorship.style.approach}
                Experience: ${mentor.profile.totalYearsOfExperience} years
            `.trim();

            await aiEngineService.client.post('/api/v1/rag/index-mentor', {
                mentor_id: mentor._id.toString(),
                profile_text: profileText,
                metadata: {
                    name: mentor.profile.displayName,
                    role: mentor.profile.tagline || '',
                    company: mentor.profile.currentCompany || 'Freelancer',
                    skills: mentor.expertise.technicalSkills.map(s => s.name),
                    experience: mentor.profile.totalYearsOfExperience
                }
            });
        } catch (syncError) {
            console.warn(`AI Sync failed but profile saved locally: ${syncError.message}`);
        }
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully and synced with AI',
            data: {
                profile: mentor.profile,
                expertise: mentor.expertise,
                availability: mentor.mentorship.availability,
                pricing: mentor.mentorship.pricing
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};

// @desc    Get mentor dashboard data
// @route   GET /api/mentor/dashboard
// @access  Private (Mentor only)
const getDashboard = async (req, res) => {
    try {
        const mentorId = req.userId;
        const mentor = await Mentor.findById(mentorId).lean();

        if (!mentor) {
            console.error(`DEBUG: Mentor ${mentorId} not found for dashboard`);
            return res.status(404).json({
                success: false,
                message: 'Mentor not found'
            });
        }

        // 1. Overview Logic
        const activeStudents = mentor.mentorship?.students?.current?.length || 0;
        const pendingRefRequests = mentor.mentorship?.students?.pendingRequests?.length || 0;
        const rating = mentor.reputation?.overallRating || 0;
        const sessionsThisMonth = 0;

        // 2. Requests Data
        const requestsData = mentor.mentorship?.students?.pendingRequests?.map(req => ({
            id: req._id,
            studentName: req.studentProfile?.name || 'Unknown Student',
            targetRole: req.studentProfile?.targetRole || 'N/A',
            studentId: req.studentId,
            message: req.studentMessage,
            requestedAt: req.requestedAt
        })) || [];

        // 3. Active Students Data
        const currentStudents = mentor.mentorship?.students?.current || [];
        const studentIds = currentStudents.map(s => s.studentId);
        const studentsDetails = await Student.find({ _id: { $in: studentIds } })
            .select('profile.targetRole careerRoadmap.targetRole profile.firstName profile.lastName profile.displayName email');
        
        const studentRoleMap = {};
        const studentNameMap = {};
        studentsDetails.forEach(s => {
            studentRoleMap[s._id.toString()] = s.profile?.targetRole || s.careerRoadmap?.targetRole || 'Mentee';
            studentNameMap[s._id.toString()] = s.profile?.displayName || (s.profile?.firstName ? `${s.profile.firstName} ${s.profile.lastName}` : null) || s.email || 'Student';
        });

        const activeStudentsList = currentStudents.map(s => ({
            studentId: s.studentId,
            studentName: studentNameMap[s.studentId.toString()] || 'Student',
            joinedAt: s.relationshipStarted || s.joinedAt || new Date(),
            status: s.status || 'active',
            targetRole: studentRoleMap[s.studentId.toString()] || 'Mentee'
        }));

        console.log(`DEBUG Dashboard [${mentor.profile?.displayName}]: Requests: ${requestsData.length}, Active: ${activeStudentsList.length}`);
        if (activeStudentsList.length > 0) {
            console.log(`DEBUG Dashboard [${mentor.profile?.displayName}]: First Active Student: ${activeStudentsList[0].studentName}`);
        }

        // 4. Sessions Data (Mock for now)
        const sessionsData = [];

        // 5. Earnings Data (Mock)
        const earningsData = {
            thisMonth: 0,
            total: 0,
            pending: 0,
            currency: '$'
        };

        // 6. Profile Completion
        let completionScore = 0;
        if (mentor.profile?.bio) completionScore += 20;
        if (mentor.expertise?.technicalSkills?.length > 0) completionScore += 20;
        if (mentor.mentorship?.pricing?.sessionTypes?.length > 0) completionScore += 20;
        if (mentor.profile?.linkedinUrl) completionScore += 20;
        if (mentor.profile?.avatarUrl) completionScore += 20;

        const dashboardData = {
            mentor: {
                overview: {
                    activeStudents,
                    pendingRequests: pendingRefRequests,
                    sessionsThisMonth,
                    rating
                },
                requests: requestsData,
                activeStudents: activeStudentsList,
                sessions: sessionsData,
                earnings: earningsData,
                profileCompletion: completionScore
            }
        };

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

// @desc    Match mentors using AI
// @route   POST /api/mentor/match
// @access  Private (Student only)
const matchMentorsWithAI = async (req, res) => {
    try {
        const studentId = req.userId || req.user?._id;
        const student = await Student.findById(studentId);
        
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const primaryResume = student.resumes.find(r => r.isPrimary) || student.resumes[0];
        if (!primaryResume) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please upload a resume to use AI matching' 
            });
        }

        // Call AI Engine
        const targetRole = student.profile?.targetRole || student.careerRoadmap?.targetRole || 'Software Engineer';
        
        // Extract skill names if they are stored as objects
        const extractSkillNames = (skillsArr) => {
            if (!skillsArr) return [];
            return skillsArr.map(item => {
                if (typeof item === 'string') return item;
                return item.skill || item.name || '';
            }).filter(Boolean);
        };

        const skills = extractSkillNames(primaryResume.skillGapAnalysis?.currentSkills);
        const required_skills = extractSkillNames(primaryResume.skillGapAnalysis?.requiredSkills || primaryResume.skillGapAnalysis?.required_skills);
        const missing_skills = extractSkillNames(primaryResume.skillGapAnalysis?.missingSkills || primaryResume.skillGapAnalysis?.missing_skills);

        console.log(`DEBUG: Matching Mentors for ${student.email}`);
        console.log(`DEBUG: Target Role: ${targetRole}`);
        console.log(`DEBUG: Skills Count: ${skills.length}, Required: ${required_skills.length}, Missing: ${missing_skills.length}`);

        // --- Caching Logic ---
        const cacheKey = `mentor_match:${studentId}:${primaryResume._id}:${targetRole.replace(/\s+/g, '_')}`;
        
        try {
            const cachedResults = await redisClient.get(cacheKey);
            if (cachedResults) {
                console.log(`DEBUG: Returning cached mentor matches for ${student.email}`);
                return res.status(200).json({
                    success: true,
                    data: JSON.parse(cachedResults),
                    source: 'cache'
                });
            }
        } catch (cacheError) {
            console.warn(`Redis cache fetch failed: ${cacheError.message}`);
        }
        // ----------------------

        // Call AI Engine
        const result = await aiEngineService.matchMentors({
            resume_text: primaryResume.extractedText,
            target_role: targetRole,
            skills: skills,
            required_skills: required_skills,
            missing_skills: missing_skills,
            interests: student.profile?.interests || []
        });

        if (!result.success) {
            return res.status(500).json({ success: false, message: result.error });
        }

        // --- Save to Cache ---
        try {
            // Cache results for 24 hours (86400 seconds)
            await redisClient.setEx(cacheKey, 86400, JSON.stringify(result.data));
            console.log(`DEBUG: Cached new mentor matches for ${student.email}`);
        } catch (cacheError) {
            console.warn(`Failed to save results to Redis: ${cacheError.message}`);
        }
        // ----------------------

        res.status(200).json({
            success: true,
            data: result.data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to find mentor matches',
            error: error.message
        });
    }
};

const acceptRequest = async (req, res) => {
    try {
        const mentorId = req.userId || req.user?._id;
        const { requestId } = req.params;

        console.log(`DEBUG: Accept Request - Mentor: ${mentorId}, Request: ${requestId}`);

        const mentor = await Mentor.findById(mentorId);
        if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found' });

        const request = mentor.mentorship.students.pendingRequests.id(requestId);
        if (!request) {
            console.warn(`DEBUG: Request ${requestId} not found in pending list. Maybe already processed?`);
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        const studentId = request.studentId;
        const student = await Student.findById(studentId);

        if (!student) {
            console.error(`DEBUG: Student ${studentId} no longer exists`);
            mentor.mentorship.students.pendingRequests.pull(requestId);
            await mentor.save();
            return res.status(404).json({ success: false, message: 'Student no longer exists' });
        }

        // 1. Move to active students in Mentor model
        if (!mentor.mentorship.students.current) mentor.mentorship.students.current = [];
        
        // Check if already in current to avoid duplicates
        const alreadyCurrent = mentor.mentorship.students.current.some(s => s.studentId.toString() === studentId.toString());
        if (!alreadyCurrent) {
            mentor.mentorship.students.current.push({
                studentId,
                studentName: request.studentProfile?.name || student.profile?.displayName || student.email,
                relationshipStarted: new Date(),
                status: 'active'
            });
        }
        
        // Remove from pending
        mentor.mentorship.students.pendingRequests.pull(requestId);

        // 2. Update Student's record
        if (!student.mentorship) student.mentorship = { activeMentors: [], mentorRequests: [] };
        if (!student.mentorship.activeMentors) student.mentorship.activeMentors = [];
        if (!student.mentorship.mentorRequests) student.mentorship.mentorRequests = [];

        const studentReq = student.mentorship.mentorRequests.find(r => r.mentorId.toString() === mentorId.toString());
        if (studentReq) studentReq.status = 'accepted';

        // Check if already in activeMentors to avoid duplicates
        const alreadyActive = student.mentorship.activeMentors.some(m => m.mentorId.toString() === mentorId.toString());
        if (!alreadyActive) {
            student.mentorship.activeMentors.push({
                mentorId,
                mentorName: mentor.profile.displayName || `${mentor.profile.firstName} ${mentor.profile.lastName}`,
                status: 'active',
                joinedAt: new Date()
            });
        }

        await mentor.save();
        await student.save();

        console.log(`DEBUG: Successfully accepted request from ${student.profile.displayName}`);
        res.status(200).json({ success: true, message: 'Request accepted successfully' });
    } catch (error) {
        console.error('Accept request error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const rejectRequest = async (req, res) => {
    try {
        const mentorId = req.userId;
        const { requestId } = req.params;

        const mentor = await Mentor.findById(mentorId);
        if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found' });

        const request = mentor.mentorship.students.pendingRequests.id(requestId);
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

        const studentId = request.studentId;
        const student = await Student.findById(studentId);
        
        if (student) {
            if (!student.mentorship) student.mentorship = { mentorRequests: [] };
            if (!student.mentorship.mentorRequests) student.mentorship.mentorRequests = [];
            
            const studentReq = student.mentorship.mentorRequests.find(r => r.mentorId.toString() === mentorId.toString());
            if (studentReq) studentReq.status = 'rejected';
            await student.save();
        }

        // Remove from pending
        mentor.mentorship.students.pendingRequests.pull(requestId);
        await mentor.save();

        res.status(200).json({ success: true, message: 'Request rejected' });
    } catch (error) {
        console.error('Reject request error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const removeStudent = async (req, res) => {
    try {
        const mentorId = req.userId;
        const { studentId } = req.params;

        const mentor = await Mentor.findById(mentorId);
        if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found' });

        // Remove from mentor's current students
        if (mentor.mentorship && mentor.mentorship.students && mentor.mentorship.students.current) {
            mentor.mentorship.students.current = mentor.mentorship.students.current.filter(
                s => s.studentId.toString() !== studentId.toString()
            );
            await mentor.save();
        }

        const student = await Student.findById(studentId);
        if (student && student.mentorship && student.mentorship.activeMentors) {
            // Update student's active mentors list
            student.mentorship.activeMentors = student.mentorship.activeMentors.filter(
                m => m.mentorId.toString() !== mentorId.toString()
            );
            
            // Also update the original request status to rejected so they can re-request cleanly
            if (student.mentorship.mentorRequests) {
                const reqToUpdate = student.mentorship.mentorRequests.find(r => r.mentorId.toString() === mentorId.toString());
                if (reqToUpdate) {
                    reqToUpdate.status = 'rejected';
                }
            }
            
            await student.save();
        }

        res.status(200).json({ success: true, message: 'Student removed successfully' });
    } catch (error) {
        console.error('Remove student error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getMentors,
    sendMentorshipRequest,
    updateProfile,
    getDashboard,
    matchMentorsWithAI,
    acceptRequest,
    rejectRequest,
    removeStudent
};