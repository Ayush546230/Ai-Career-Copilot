const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Mentor = require('../models/Mentor');


// Verify JWT token and attach user to request
const protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Ensure token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route. Token missing.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        console.time('AUTH_MW_DB');
        let user;
        const isFastPath = req.path.includes('/dashboard') || req.path.includes('/roadmap') || req.path.includes('/resumes');
        const skipUserFetch = isFastPath || req.headers['x-skip-user-fetch'] === 'true';

        if (skipUserFetch) {
            // Fast path: Just verify ID exists in token, controller will do the heavy lifting
            user = { _id: decoded.userId, role: decoded.role, accountStatus: 'active' };
            console.log(`⚡ Fast Path Auth: Skipping DB fetch for ${req.path}`);
        } else {
            const selectFields = '_id role accountStatus account.status profile.firstName profile.lastName';
            if (decoded.role === 'student') {
                user = await Student.findById(decoded.userId).select(selectFields);
            } else if (decoded.role === 'mentor') {
                user = await Mentor.findById(decoded.userId).select(selectFields);
            }
        }
        console.timeEnd('AUTH_MW_DB');

        // Check if user exists
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists'
            });
        }

        // Check account status
        const accountStatus = user.accountStatus || user.account?.status;
        if (accountStatus !== 'active') {
            return res.status(401).json({
                success: false,
                message: `Account is ${accountStatus || 'unknown'}. Please contact support.`
            });
        }

        // Attach user and role to request
        req.user = user;
        req.userId = decoded.userId || decoded.id;
        req.userRole = decoded.role;

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Authentication failed',
            error: error.message
        });
    }
};

// Restrict to Student role only
const isStudent = (req, res, next) => {
    if (req.userRole !== 'student') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Students only.'
        });
    }
    next();
};

// Restrict to Mentor role only
const isMentor = (req, res, next) => {
    if (req.userRole !== 'mentor') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Mentors only.'
        });
    }
    next();
};
module.exports = {
    protect,
    isStudent,
    isMentor
};