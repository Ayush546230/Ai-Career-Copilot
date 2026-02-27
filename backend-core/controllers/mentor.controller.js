const { Student, Mentor } = require('../models');
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
            .select('mentorship profile');

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
        if (!student.mentorship) {
            student.mentorship = { mentorRequests: [] };
        }
        if (!student.mentorship.mentorRequests) {
            student.mentorship.mentorRequests = [];
        }

        student.mentorship.mentorRequests.push({
            mentorId,
            requestedAt: new Date(),
            status: 'pending',
            message: message || ''
        });

        // Add request to mentor's pending requests
        if (!mentor.mentorship.students) {
            mentor.mentorship.students = { pendingRequests: [] };
        }
        if (!mentor.mentorship.students.pendingRequests) {
            mentor.mentorship.students.pendingRequests = [];
        }

        mentor.mentorship.students.pendingRequests.push({
            studentId,
            requestedAt: new Date(),
            status: 'pending',
            studentMessage: message || '',
            studentProfile: {
                name: student.profile?.displayName ||
                    `${student.profile?.firstName} ${student.profile?.lastName}`,
                targetRole: student.profile?.targetRole,
                experience: `${student.profile?.yearsOfExperience || 0} years`,
                goals: student.mentorship?.preferences?.mentorshipGoals || []
            },
            viewedByMentor: false
        });

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
            return res.status(404).json({
                success: false,
                message: 'Mentor not found'
            });
        }

        // Allowed fields for update
        const allowedUpdates = {
            'profile.tagline': updates.tagline,
            'profile.bio': updates.bio,
            'profile.linkedinUrl': updates.linkedinUrl,
            'profile.githubUrl': updates.githubUrl,
            'profile.portfolioUrl': updates.portfolioUrl
        };

        // Update expertise if provided
        if (updates.technicalSkills) {
            mentor.expertise.technicalSkills = updates.technicalSkills;
        }

        if (updates.canHelpWith) {
            mentor.expertise.canHelpWith = updates.canHelpWith;
        }

        // Update availability
        if (updates.availability) {
            if (updates.availability.status) {
                mentor.mentorship.availability.status = updates.availability.status;
            }
            if (updates.availability.maxActiveStudents) {
                mentor.mentorship.availability.maxActiveStudents =
                    updates.availability.maxActiveStudents;
            }
            if (updates.availability.hoursPerWeek) {
                mentor.mentorship.availability.hoursPerWeek =
                    updates.availability.hoursPerWeek;
            }
        }

        // Update pricing
        if (updates.pricing) {
            if (updates.pricing.isFree !== undefined) {
                mentor.mentorship.pricing.isFree = updates.pricing.isFree;
            }
            if (updates.pricing.isPaid !== undefined) {
                mentor.mentorship.pricing.isPaid = updates.pricing.isPaid;
            }
            if (updates.pricing.sessionTypes) {
                mentor.mentorship.pricing.sessionTypes = updates.pricing.sessionTypes;
            }
        }

        // Update basic profile fields
        Object.keys(allowedUpdates).forEach(key => {
            if (allowedUpdates[key] !== undefined) {
                const keys = key.split('.');
                if (keys.length === 2) {
                    mentor[keys[0]][keys[1]] = allowedUpdates[key];
                }
            }
        });

        await mentor.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
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
            return res.status(404).json({
                success: false,
                message: 'Mentor not found'
            });
        }

        // 1. Overview Logic
        const activeStudents = mentor.mentorship?.students?.active?.length || 0;
        const pendingRefRequests = mentor.mentorship?.students?.pendingRequests?.length || 0;
        const rating = mentor.reputation?.overallRating || 0;
        // Mocking sessions this month for now as session model is not fully visible/linked here easily
        // In a real app, query the Session model.
        const sessionsThisMonth = 0;

        // 2. Requests Data
        const requestsData = mentor.mentorship?.students?.pendingRequests?.map(req => ({
            id: req._id || Date.now(), // Fallback ID
            studentName: req.studentProfile?.name || 'Unknown Student',
            targetRole: req.studentProfile?.targetRole || 'N/A',
            message: req.studentMessage,
            requestedAt: req.requestedAt
        })) || [];

        // 3. Sessions Data (Mock for now or empty array)
        const sessionsData = [];

        // 4. Earnings Data (Mock)
        const earningsData = {
            thisMonth: 0,
            total: 0,
            pending: 0,
            currency: '$'
        };

        // 5. Profile Completion (Simple calculation)
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
module.exports = {
    getMentors,
    sendMentorshipRequest,
    updateProfile,
    getDashboard
};