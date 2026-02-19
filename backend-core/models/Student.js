
// STUDENT (USER) MONGOOSE SCHEMA

const mongoose = require('mongoose');
const { Schema } = mongoose;
const bcrypt = require('bcrypt');

// Sub-schemas for better organization
const LocationSchema = new Schema({
    city: String,
    state: String,
    country: String,
    timezone: String
}, { _id: false });

const EducationSchema = new Schema({
    institution: String,
    degree: String,
    major: String,
    graduationYear: Number,
    current: { type: Boolean, default: false }
}, { _id: true });

const TechnicalSkillSchema = new Schema({
    name: { type: String, required: true },
    proficiency: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    yearsOfExperience: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    lastAssessed: Date
}, { _id: false });

const SoftSkillSchema = new Schema({
    name: String,
    rating: { type: Number, min: 1, max: 5 }
}, { _id: false });

const ResumeSchema = new Schema({
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: Number,
    uploadedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
    isPrimary: { type: Boolean, default: false },

    extractedText: String,
    parsedData: {
        contactInfo: Schema.Types.Mixed,
        experience: [Schema.Types.Mixed],
        education: [Schema.Types.Mixed],
        skills: [String],
        certifications: [String]
    },

    atsScore: {
        overall: { type: Number, min: 0, max: 100 },
        breakdown: {
            formatting: Number,
            keywords: Number,
            experience: Number,
            education: Number,
            skills: Number
        },
        analyzedAt: Date,
        modelVersion: String
    },

    skillGapAnalysis: {
        currentSkills: [String],
        requiredSkills: [String],
        missingSkills: [String],
        skillsToImprove: [{
            skill: String,
            currentLevel: String,
            targetLevel: String,
            priority: { type: String, enum: ['high', 'medium', 'low'] }
        }],
        analyzedAt: Date
    },

    suggestions: [{
        category: { type: String, enum: ['formatting', 'content', 'keywords', 'experience', 'education', 'skills'] },
        priority: { type: String, enum: ['critical', 'important', 'optional'] },
        issue: String,
        recommendation: String,
        exampleBefore: String,
        exampleAfter: String
    }],

    embeddingVector: [Number],
    embeddingModel: String,
    embeddingGeneratedAt: Date
}, { _id: true, timestamps: true });

const InterviewQuestionSchema = new Schema({
    questionId: Schema.Types.ObjectId,
    questionText: String,
    questionType: { type: String, enum: ['coding', 'behavioral', 'technical_theory', 'system_design'] },
    askedAt: Date,

    response: {
        textResponse: String,
        codeResponse: String,
        audioUrl: String,
        transcription: String,
        submittedAt: Date
    },

    score: { type: Number, min: 0, max: 100 },
    feedback: {
        strengths: [String],
        weaknesses: [String],
        improvementAreas: [String],
        detailedAnalysis: String,

        codingMetrics: {
            timeComplexity: String,
            spaceComplexity: String,
            codeQuality: { type: Number, min: 0, max: 100 },
            testsPassed: Number,
            totalTests: Number,
            edgeCasesHandled: Boolean
        }
    }
}, { _id: true });

const MockInterviewSchema = new Schema({
    type: {
        type: String,
        enum: ['technical', 'behavioral', 'system_design', 'coding'],
        required: true
    },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    role: String,
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    duration: Number,
    status: {
        type: String,
        enum: ['in_progress', 'completed', 'abandoned'],
        default: 'in_progress'
    },

    questions: [InterviewQuestionSchema],

    overallScore: { type: Number, min: 0, max: 100 },
    overallFeedback: {
        summary: String,
        technicalSkills: Number,
        problemSolving: Number,
        communication: Number,
        cultureFit: Number,
        hireRecommendation: {
            type: String,
            enum: ['strong_yes', 'yes', 'maybe', 'no', 'strong_no']
        },
        keyStrengths: [String],
        keyWeaknesses: [String],
        nextSteps: [String]
    },

    aiModel: String,
    modelVersion: String,
    tokensUsed: Number
}, { _id: true, timestamps: true });

const MilestoneTaskSchema = new Schema({
    description: String,
    resources: [{
        type: { type: String, enum: ['course', 'article', 'video', 'book', 'documentation'] },
        title: String,
        url: String,
        estimatedTime: Number
    }],
    completed: { type: Boolean, default: false },
    completedAt: Date
}, { _id: true });

const MilestoneSchema = new Schema({
    order: Number,
    title: { type: String, required: true },
    description: String,
    category: { type: String, enum: ['skill', 'project', 'certification', 'networking', 'job_search'] },
    estimatedDuration: Number,
    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed'],
        default: 'not_started'
    },
    priority: { type: String, enum: ['critical', 'important', 'optional'] },

    tasks: [MilestoneTaskSchema],
    prerequisiteMilestones: [Schema.Types.ObjectId],

    completedAt: Date,
    verificationMethod: String
}, { _id: true });

const MentorSessionSchema = new Schema({
    mentorId: { type: Schema.Types.ObjectId, ref: 'Mentor', required: true },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, default: 60 },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'no_show'],
        default: 'scheduled'
    },
    meetingUrl: String,
    agenda: String,

    studentNotes: String,
    mentorNotes: String,
    actionItems: [{
        item: String,
        completed: { type: Boolean, default: false },
        completedAt: Date
    }],

    studentRating: { type: Number, min: 1, max: 5 },
    studentFeedback: String,

    paymentAmount: Number,
    paymentCurrency: { type: String, default: 'USD' },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'refunded', 'failed'],
        default: 'pending'
    }
}, { _id: true, timestamps: true });

const GoalSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    targetDate: Date,
    category: { type: String, enum: ['skill', 'job', 'certification', 'project', 'networking'] },
    status: {
        type: String,
        enum: ['active', 'completed', 'abandoned'],
        default: 'active'
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    completedAt: Date
}, { _id: true, timestamps: true });

// Main Student Schema
const StudentSchema = new Schema({
    // Authentication & Identity
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    passwordHash: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    phoneNumber: String,

    authProvider: {
        type: String,
        enum: ['local', 'google', 'github', 'linkedin'],
        default: 'local'
    },
    oauthId: String,

    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: String,
    passwordResetToken: String,
    passwordResetExpiry: Date,
    lastPasswordChange: Date,
    failedLoginAttempts: { type: Number, default: 0 },
    accountLocked: { type: Boolean, default: false },
    accountLockedUntil: Date,

    // Profile & Career Data
    profile: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        displayName: String,
        avatarUrl: String,
        bio: { type: String, maxlength: 1000 },
        location: LocationSchema,
        linkedinUrl: String,
        githubUrl: String,
        portfolioUrl: String,

        currentRole: String,
        yearsOfExperience: { type: Number, default: 0 },
        currentCompany: String,
        education: [EducationSchema],

        targetRole: String,
        targetIndustry: String,
        targetCompanies: [String],
        jobSearchStatus: {
            type: String,
            enum: ['actively_looking', 'open', 'not_looking', 'employed'],
            default: 'open'
        },
        expectedSalaryRange: {
            min: Number,
            max: Number,
            currency: { type: String, default: 'USD' }
        },
        willingToRelocate: { type: Boolean, default: false },
        preferredWorkMode: {
            type: String,
            enum: ['remote', 'hybrid', 'onsite', 'flexible']
        }
    },

    // Skills
    skills: {
        technical: [TechnicalSkillSchema],
        soft: [SoftSkillSchema]
    },

    // Resumes & AI Analysis
    resumes: [ResumeSchema],

    // Mock Interviews
    // UNUSED: This array and its sub-schema are defined but no logic exists to manage mock interviews.
    mockInterviews: [MockInterviewSchema],

    // Career Roadmap
    careerRoadmap: {
        generatedAt: Date,
        lastUpdatedAt: Date,
        targetRole: String,
        estimatedTimeToGoal: Number,

        milestones: [MilestoneSchema],

        progress: {
            completedMilestones: { type: Number, default: 0 },
            totalMilestones: { type: Number, default: 0 },
            percentComplete: { type: Number, default: 0 },
            onTrack: { type: Boolean, default: true },
            projectedCompletionDate: Date
        },

        aiModel: String,
        modelVersion: String,
        regenerationCount: { type: Number, default: 0 }
    },

    // Mentorship
    mentorship: {
        activeMentors: [{
            mentorId: { type: Schema.Types.ObjectId, ref: 'Mentor' },
            relationshipStarted: Date,
            sessionCount: { type: Number, default: 0 },
            lastSessionDate: Date,
            mentorshipType: { type: String, enum: ['free', 'paid'] },
            status: { type: String, enum: ['active', 'paused', 'ended'], default: 'active' }
        }],

        mentorRequests: [{
            mentorId: { type: Schema.Types.ObjectId, ref: 'Mentor', required: true },
            requestedAt: { type: Date, default: Date.now },
            status: {
                type: String,
                enum: ['pending', 'accepted', 'rejected'],
                default: 'pending'
            },
            message: String,
            respondedAt: Date,
            responseMessage: String
        }],

        // UNUSED: Structure exists but no endpoints to manage sessions.
        sessions: [MentorSessionSchema],

        preferences: {
            // UNUSED
            preferredMeetingTimes: [{
                dayOfWeek: {
                    type: String,
                    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                },
                startTime: String,
                endTime: String
            }],
            preferredMeetingDuration: { type: Number, default: 60 },
            // UNUSED
            communicationPreference: {
                type: String,
                enum: ['video', 'audio', 'chat'],
                default: 'video'
            },
            lookingForMentor: { type: Boolean, default: true },
            mentorshipGoals: [String]
        }
    },

    // Progress Tracking & Analytics
    progressMetrics: {
        skillsProgress: [{
            skill: String,
            timeline: [{
                date: Date,
                proficiencyLevel: String,
                assessmentScore: Number
            }]
        }],

        activityStats: {
            totalResumeUploads: { type: Number, default: 0 },
            totalMockInterviews: { type: Number, default: 0 },
            totalMentorSessions: { type: Number, default: 0 },
            totalLearningHours: { type: Number, default: 0 },
            consecutiveActiveDays: { type: Number, default: 0 },
            lastActiveDate: Date
        },

        // UNUSED: Defined but never updated.
        interviewPerformance: {
            averageScore: Number,
            trend: { type: String, enum: ['improving', 'stable', 'declining'] },
            scoreHistory: [{
                date: Date,
                score: Number,
                interviewType: String
            }]
        },

        goals: [GoalSchema],

        // UNUSED: Defined but never updated.
        weeklySummaries: [{
            weekStartDate: Date,
            weekEndDate: Date,
            activitiesCompleted: Number,
            hoursSpent: Number,
            milestonesCompleted: Number,
            averageInterviewScore: Number,
            generatedAt: { type: Date, default: Date.now }
        }]
    },

    // Vector Embeddings
    // UNUSED: This entire section is defined but not populated or used in the current codebase.
    vectorEmbeddings: {
        profileEmbedding: {
            vector: [Number],
            model: String,
            generatedAt: Date,
            sourceText: String
        },
        careerGoalEmbedding: {
            vector: [Number],
            model: String,
            generatedAt: Date,
            sourceText: String
        },
        skillsEmbedding: {
            vector: [Number],
            model: String,
            generatedAt: Date,
            sourceText: String
        }
    },

    // Subscription
    subscription: {
        tier: {
            type: String,
            enum: ['free', 'premium', 'enterprise'],
            default: 'free'
        },
        status: {
            type: String,
            enum: ['active', 'cancelled', 'expired', 'trial'],
            default: 'active'
        },
        startDate: Date,
        endDate: Date,
        autoRenew: { type: Boolean, default: false },
        paymentMethod: String,

        limits: {
            monthlyMockInterviews: { type: Number, default: 5 },
            monthlyResumeScans: { type: Number, default: 3 },
            monthlyAICredits: { type: Number, default: 100 }
        },
        usage: {
            mockInterviewsUsed: { type: Number, default: 0 },
            resumeScansUsed: { type: Number, default: 0 },
            aiCreditsUsed: { type: Number, default: 0 },
            resetDate: Date
        }
    },

    // Preferences
    preferences: {
        language: { type: String, default: 'en' },
        theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
        emailNotifications: { type: Boolean, default: true },
        pushNotifications: { type: Boolean, default: true },
        weeklyProgressEmail: { type: Boolean, default: true },
        mentorRequestAlerts: { type: Boolean, default: true }
    },

    // Privacy & Compliance
    privacy: {
        profileVisibility: {
            type: String,
            enum: ['public', 'mentors_only', 'private'],
            default: 'mentors_only'
        },
        dataProcessingConsent: { type: Boolean, default: false },
        termsAcceptedAt: Date,
        privacyPolicyAcceptedAt: Date,
        marketingConsent: { type: Boolean, default: false }
    },

    // System Tracking
    accountStatus: {
        type: String,
        enum: ['active', 'suspended', 'deleted', 'pending_verification'],
        default: 'active',
        index: true
    },
    deletionScheduledAt: Date,
    lastLoginAt: Date,
    ipAddress: String,
    userAgent: String,

    // Metadata
    metadata: {
        source: { type: String, enum: ['web', 'mobile', 'api'] },
        referralCode: String,
        utmSource: String,
        utmMedium: String,
        utmCampaign: String,
        cohort: String,
        experimentFlags: [String]
    }
}, {
    timestamps: true,
    collection: 'students'
});

// Indexes
StudentSchema.index({ 'profile.targetRole': 1 });
StudentSchema.index({ 'skills.technical.name': 1 });
StudentSchema.index({ 'mentorship.mentorRequests.mentorId': 1 });
StudentSchema.index({ accountStatus: 1, lastLoginAt: -1 });
StudentSchema.index({ 'resumes.isPrimary': 1 });
StudentSchema.index({ createdAt: -1 });

// Virtual for full name
StudentSchema.virtual('fullName').get(function () {
    return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Methods
StudentSchema.methods.hasActiveMentor = function (mentorId) {
    return this.mentorship.activeMentors.some(
        m => m.mentorId.toString() === mentorId.toString() && m.status === 'active'
    );
};

StudentSchema.methods.getPrimaryResume = function () {
    return this.resumes.find(r => r.isPrimary) || this.resumes[0];
};

StudentSchema.methods.calculateRoadmapProgress = function () {
    if (!this.careerRoadmap || !this.careerRoadmap.milestones.length) return 0;
    const completed = this.careerRoadmap.milestones.filter(m => m.status === 'completed').length;
    return (completed / this.careerRoadmap.milestones.length) * 100;
};

// Static methods
StudentSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() });
};

StudentSchema.statics.findActiveStudents = function () {
    return this.find({ accountStatus: 'active' });
};

// Pre-save middleware
StudentSchema.pre('save', async function () {
    if (!this.profile.displayName) {
        this.profile.displayName = `${this.profile.firstName} ${this.profile.lastName}`;
    }
    if (this.isModified('passwordHash')) {
        const salt = await bcrypt.genSalt(10);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    }
});

const Student = mongoose.model('Student', StudentSchema);
module.exports = Student;