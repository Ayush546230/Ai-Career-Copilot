const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Student, Mentor } = require('../models');
// Generate JWT token
const generateToken = (userId, role) => {
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
};

// @desc    Register new user (Student or Mentor)
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
    try {
        const {
            email, password, role, firstName, lastName,
            targetRole, currentCompany, yearsOfExperience
        } = req.body;

        // Validate required fields
        if (!email || !password || !role || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email, password, role, firstName, and lastName'
            });
        }

        // Validate role
        if (!['student', 'mentor'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Role must be either "student" or "mentor"'
            });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        // Check if user already exists in both collections
        const existingStudent = await Student.findOne({ email: email.toLowerCase() });
        const existingMentor = await Mentor.findOne({ email: email.toLowerCase() });

        if (existingStudent || existingMentor) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }


        let user;

        // Create user based on role
        if (role === 'student') {
            user = await Student.create({
                email: email.toLowerCase(),
                passwordHash: password, // Model will hash this automatically
                profile: { firstName, lastName },
                careerRoadmap: { targetRole: targetRole || '' }, // Mapping targetRole
                accountStatus: 'active',
                privacy: {
                    dataProcessingConsent: true,
                    termsAcceptedAt: new Date(),
                    privacyPolicyAcceptedAt: new Date()
                }
            });
        } else {
            user = await Mentor.create({
                email: email.toLowerCase(),
                passwordHash: password,
                profile: {
                    firstName,
                    lastName,
                    currentCompany: currentCompany || '' // Mapping currentCompany
                },
                mentorship: {
                    experience: { totalYears: yearsOfExperience || 0 } // Mapping years
                },
                account: { status: 'active', verificationStatus: 'pending' },
                privacy: {
                    dataProcessingConsent: true,
                    termsAcceptedAt: new Date(),
                    privacyPolicyAcceptedAt: new Date()
                }
            });
        }

        // Generate token
        const token = generateToken(user._id, role);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    role,
                    firstName: user.profile.firstName,
                    lastName: user.profile.lastName,
                    displayName: user.profile.displayName
                }
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
};

// @desc    Login user (Student or Mentor)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user in both collections
        let user = await Student.findOne({ email: email.toLowerCase() });
        let role = 'student';

        if (!user) {
            user = await Mentor.findOne({ email: email.toLowerCase() });
            role = 'mentor';
        }

        // Check if user exists
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check account status
        if (user.accountStatus === 'suspended' || user.account?.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: 'Account suspended. Please contact support.'
            });
        }

        if (user.accountStatus === 'deleted' || user.account?.status === 'deactivated') {
            return res.status(403).json({
                success: false,
                message: 'Account no longer active'
            });
        }

        // Check if account is locked
        if (user.accountLocked && user.accountLockedUntil > new Date()) {
            const remainingTime = Math.ceil((user.accountLockedUntil - new Date()) / 60000);
            return res.status(403).json({
                success: false,
                message: `Account locked. Try again in ${remainingTime} minutes.`
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            // Increment failed login attempts
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

            // Lock account after 5 failed attempts
            if (user.failedLoginAttempts >= 5) {
                user.accountLocked = true;
                user.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
            }

            await user.save();

            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Reset failed login attempts on successful login
        if (user.failedLoginAttempts > 0 || user.accountLocked) {
            user.failedLoginAttempts = 0;
            user.accountLocked = false;
            user.accountLockedUntil = null;
        }

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user._id, role);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    role,
                    firstName: user.profile.firstName,
                    lastName: user.profile.lastName,
                    displayName: user.profile.displayName,
                    avatarUrl: user.profile.avatarUrl
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        // User is already attached by protect middleware
        const user = req.user;
        const role = req.userRole;

        // Prepare response based on role
        let userData = {
            id: user._id,
            email: user.email,
            role,
            emailVerified: user.emailVerified,
            profile: user.profile,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt
        };

        if (role === 'student') {
            userData.accountStatus = user.accountStatus;
            userData.subscription = user.subscription;
            userData.progressMetrics = {
                totalResumeUploads: user.progressMetrics?.activityStats?.totalResumeUploads || 0,
                totalMockInterviews: user.progressMetrics?.activityStats?.totalMockInterviews || 0,
                totalMentorSessions: user.progressMetrics?.activityStats?.totalMentorSessions || 0
            };
        } else {
            userData.accountStatus = user.account?.status;
            userData.verificationStatus = user.account?.verificationStatus;
            userData.reputation = {
                overallRating: user.reputation?.overallRating || 0,
                totalRatings: user.reputation?.totalRatings || 0
            };
            userData.availability = user.mentorship?.availability?.status;
        }

        res.status(200).json({
            success: true,
            data: userData
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user data',
            error: error.message
        });
    }
};
module.exports = {
    signup,
    login,
    getMe
};