const mongoose = require('mongoose');
const { Schema } = mongoose;
const bcrypt = require('bcrypt');

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


const WorkExperienceSchema = new Schema({
    company: { type: String, required: true },
    companyLogo: String,
    role: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: Date,
    current: { type: Boolean, default: false },
    description: String,
    achievements: [String],
    technologies: [String]
}, { _id: true });

const CertificationSchema = new Schema({
    name: { type: String, required: true },
    issuingOrganization: String,
    issueDate: Date,
    expiryDate: Date,
    credentialId: String,
    credentialUrl: String
}, { _id: true });

const ExpertiseSkillSchema = new Schema({
    name: { type: String, required: true },
    proficiency: {
        type: String,
        enum: ['intermediate', 'advanced', 'expert'],
        default: 'advanced'
    },
    yearsOfExperience: { type: Number, required: true },
    teachingExperience: { type: Boolean, default: false },
    verified: { type: Boolean, default: false }
}, { _id: false });

const DomainExpertiseSchema = new Schema({
    name: String,
    yearsOfExperience: Number,
    teachingExperience: { type: Boolean, default: false }
}, { _id: false });

const TimeSlotSchema = new Schema({
    startTime: String,
    endTime: String,
    available: { type: Boolean, default: true }
}, { _id: false });

const WeeklyScheduleSchema = new Schema({
    dayOfWeek: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        required: true
    },
    slots: [TimeSlotSchema]
}, { _id: false });

const BlackoutDateSchema = new Schema({
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: String
}, { _id: true });

const SessionTypeSchema = new Schema({
    type: {
        type: String,
        enum: ['one_on_one', 'group', 'async_review', 'workshop'],
        required: true
    },
    duration: { type: Number, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    description: String
}, { _id: true });

const MentorshipPackageSchema = new Schema({
    name: { type: String, required: true },
    sessions: { type: Number, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    duration: Number,
    description: String,
    features: [String]
}, { _id: true });

const CurrentStudentSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    relationshipStarted: { type: Date, default: Date.now },
    sessionCount: { type: Number, default: 0 },
    lastSessionDate: Date,
    nextSessionDate: Date,
    mentorshipType: { type: String, enum: ['free', 'paid'] },
    packageId: Schema.Types.ObjectId,
    status: {
        type: String,
        enum: ['active', 'paused', 'completed'],
        default: 'active'
    },
    privateNotes: String
}, { _id: true });

const StudentRequestSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    requestedAt: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    studentMessage: String,
    studentProfile: {
        name: String,
        targetRole: String,
        experience: String,
        goals: [String]
    },
    viewedByMentor: { type: Boolean, default: false },
    viewedAt: Date
}, { _id: true });

const MentorSessionSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, default: 60 },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'no_show'],
        default: 'scheduled'
    },
    cancellationReason: String,
    cancelledBy: { type: String, enum: ['mentor', 'student'] },

    meetingDetails: {
        platform: { type: String, enum: ['zoom', 'google_meet', 'teams', 'custom'] },
        meetingUrl: String,
        meetingId: String
    },

    agenda: String,
    topicsCovered: [String],
    mentorNotes: String,
    studentNotes: String,

    actionItems: [{
        item: String,
        assignedTo: { type: String, enum: ['mentor', 'student'] },
        dueDate: Date,
        completed: { type: Boolean, default: false },
        completedAt: Date
    }],

    resourcesShared: [{
        type: { type: String, enum: ['link', 'file', 'code', 'document'] },
        title: String,
        url: String,
        description: String
    }],

    studentRating: { type: Number, min: 1, max: 5 },
    studentFeedback: String,
    mentorSelfRating: { type: Number, min: 1, max: 5 },

    paymentAmount: Number,
    paymentCurrency: { type: String, default: 'USD' },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'refunded', 'failed'],
        default: 'pending'
    },
    paymentId: String,
    platformFee: Number,
    mentorPayout: Number
}, { _id: true, timestamps: true });

const ReviewSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: String,
    studentAvatar: String,
    rating: { type: Number, min: 1, max: 5, required: true },
    reviewText: String,
    categoryRatings: {
        expertise: { type: Number, min: 1, max: 5 },
        communication: { type: Number, min: 1, max: 5 },
        responsiveness: { type: Number, min: 1, max: 5 },
        helpfulness: { type: Number, min: 1, max: 5 },
        professionalism: { type: Number, min: 1, max: 5 }
    },
    sessionDate: Date,

    mentorResponse: String,
    mentorRespondedAt: Date,

    verified: { type: Boolean, default: false },
    helpful: { type: Number, default: 0 },
    flagged: { type: Boolean, default: false },
    flagReason: String
}, { _id: true, timestamps: true });

const SuccessStorySchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    studentName: String,
    story: { type: String, required: true },
    outcome: {
        type: String,
        enum: ['got_job', 'promotion', 'skill_mastery', 'career_change', 'salary_increase']
    },
    companyLogo: String,
    featured: { type: Boolean, default: false }
}, { _id: true, timestamps: true });

const BadgeSchema = new Schema({
    badgeId: { type: String, required: true },
    name: String,
    description: String,
    iconUrl: String,
    earnedAt: { type: Date, default: Date.now }
}, { _id: true });

const ArticleSchema = new Schema({
    title: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true },
    content: String,
    excerpt: String,
    coverImage: String,
    tags: [String],
    published: { type: Boolean, default: false },
    publishedAt: Date,
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 }
}, { _id: true, timestamps: true });

const ResourceSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    type: { type: String, enum: ['template', 'guide', 'checklist', 'ebook', 'toolkit'] },
    fileUrl: String,
    downloadCount: { type: Number, default: 0 }
}, { _id: true, timestamps: true });

const VideoSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    videoUrl: String,
    thumbnail: String,
    duration: Number,
    views: { type: Number, default: 0 }
}, { _id: true, timestamps: true });

// Main Mentor Schema
const MentorSchema = new Schema({
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

    // Professional Profile
    profile: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        displayName: String,
        avatarUrl: String,
        tagline: { type: String, maxlength: 100 },
        bio: { type: String, maxlength: 2000 },

        location: LocationSchema,

        linkedinUrl: String,
        githubUrl: String,
        portfolioUrl: String,
        twitterUrl: String,
        youtubeUrl: String,

        currentRole: String,
        currentCompany: String,
        currentCompanyLogo: String,
        totalYearsOfExperience: { type: Number, default: 0 },

        workExperience: [WorkExperienceSchema],
        education: [EducationSchema],
        certifications: [CertificationSchema],

        industries: [String],
        specializations: [String]
    },

    // Skills & Expertise
    expertise: {
        technicalSkills: [ExpertiseSkillSchema],
        domains: [DomainExpertiseSchema],
        softSkills: [String],
        canHelpWith: [String],

        idealMentee: {
            experienceLevel: [{
                type: String,
                enum: ['beginner', 'intermediate', 'advanced']
            }],
            careerStage: [{
                type: String,
                enum: ['student', 'career_changer', 'junior_dev', 'mid_level']
            }],
            goals: [String]
        }
    },

    // Mentorship Details
    mentorship: {
        availability: {
            status: {
                type: String,
                enum: ['accepting', 'limited', 'not_accepting'],
                default: 'accepting',
                index: true
            },
            maxActiveStudents: { type: Number, default: 5 },
            currentActiveStudents: { type: Number, default: 0 },
            hoursPerWeek: { type: Number, default: 5 },

            weeklySchedule: [WeeklyScheduleSchema],
            blackoutDates: [BlackoutDateSchema]
        },

        style: {
            approach: [{
                type: String,
                enum: ['hands_on', 'advisory', 'project_based', 'career_focused']
            }],
            sessionFormat: [{
                type: String,
                enum: ['video_call', 'screen_share', 'code_review', 'chat']
            }],
            preferredSessionDuration: { type: Number, default: 60 },
            responseTime: {
                type: String,
                enum: ['within_24h', 'within_48h', 'within_week'],
                default: 'within_24h'
            }
        },

        pricing: {
            isFree: { type: Boolean, default: false, index: true },
            isPaid: { type: Boolean, default: false },
            sessionTypes: [SessionTypeSchema],
            packages: [MentorshipPackageSchema],

            paymentMethods: [String],
            stripeAccountId: String,
            paypalEmail: String
        },

        students: {
            current: [CurrentStudentSchema],
            pendingRequests: [StudentRequestSchema],

            totalStudentsMentored: { type: Number, default: 0 },
            totalSessionsConducted: { type: Number, default: 0 }
        },

        sessions: [MentorSessionSchema]
    },

    // Reputation & Reviews
    reputation: {
        overallRating: { type: Number, min: 0, max: 5, default: 0, index: -1 },
        totalRatings: { type: Number, default: 0 },
        ratingBreakdown: {
            fiveStar: { type: Number, default: 0 },
            fourStar: { type: Number, default: 0 },
            threeStar: { type: Number, default: 0 },
            twoStar: { type: Number, default: 0 },
            oneStar: { type: Number, default: 0 }
        },

        categoryRatings: {
            expertise: { type: Number, min: 0, max: 5, default: 0 },
            communication: { type: Number, min: 0, max: 5, default: 0 },
            responsiveness: { type: Number, min: 0, max: 5, default: 0 },
            helpfulness: { type: Number, min: 0, max: 5, default: 0 },
            professionalism: { type: Number, min: 0, max: 5, default: 0 }
        },

        reviews: [ReviewSchema],
        successStories: [SuccessStorySchema],
        badges: [BadgeSchema],

        featured: { type: Boolean, default: false },
        verified: { type: Boolean, default: false },
        verifiedAt: Date,
        verificationMethod: String
    },

    // Vector Embeddings
    vectorEmbeddings: {
        profileEmbedding: {
            vector: [Number],
            model: String,
            generatedAt: Date,
            sourceText: String
        },
        expertiseEmbedding: {
            vector: [Number],
            model: String,
            generatedAt: Date,
            sourceText: String
        },
        teachingStyleEmbedding: {
            vector: [Number],
            model: String,
            generatedAt: Date,
            sourceText: String
        }
    },

    // Analytics & Insights
    analytics: {
        performance: {
            totalSessions: { type: Number, default: 0 },
            completedSessions: { type: Number, default: 0 },
            cancelledSessions: { type: Number, default: 0 },
            cancellationRate: { type: Number, default: 0 },
            averageSessionRating: { type: Number, default: 0 },
            responseRate: { type: Number, default: 0 },
            averageResponseTime: { type: Number, default: 0 }
        },

        studentOutcomes: {
            totalStudentsHelped: { type: Number, default: 0 },
            studentsWhoGotJobs: { type: Number, default: 0 },
            studentsWhoGotPromotions: { type: Number, default: 0 },
            averageStudentImprovement: { type: Number, default: 0 },
            repeatStudents: { type: Number, default: 0 }
        },

        engagement: {
            profileViews: { type: Number, default: 0 },
            requestsReceived: { type: Number, default: 0 },
            requestsAccepted: { type: Number, default: 0 },
            requestsRejected: { type: Number, default: 0 },
            requestsPending: { type: Number, default: 0 },
            lastActiveDate: Date,
            averageWeeklyHours: { type: Number, default: 0 }
        },

        earnings: {
            totalEarnings: { type: Number, default: 0 },
            currency: { type: String, default: 'USD' },
            earningsThisMonth: { type: Number, default: 0 },
            earningsLastMonth: { type: Number, default: 0 },
            averageSessionRevenue: { type: Number, default: 0 },
            pendingPayouts: { type: Number, default: 0 },
            completedPayouts: { type: Number, default: 0 }
        },

        monthlySummaries: [{
            month: String,
            sessionsCompleted: Number,
            studentsHelped: Number,
            earnings: Number,
            averageRating: Number,
            hoursSpent: Number,
            generatedAt: { type: Date, default: Date.now }
        }]
    },

    // Content & Resources
    content: {
        articles: [ArticleSchema],
        resources: [ResourceSchema],
        videos: [VideoSchema]
    },

    // Account Management
    account: {
        status: {
            type: String,
            enum: ['active', 'suspended', 'under_review', 'deactivated'],
            default: 'active',
            index: true
        },
        statusReason: String,
        accountType: { type: String, enum: ['individual', 'company'], default: 'individual' },

        verificationStatus: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending',
            index: true
        },
        verificationDocuments: [{
            type: { type: String, enum: ['id', 'linkedin', 'employment', 'certification'] },
            documentUrl: String,
            uploadedAt: { type: Date, default: Date.now },
            verifiedAt: Date,
            verifiedBy: Schema.Types.ObjectId
        }],

        backgroundCheckStatus: {
            type: String,
            enum: ['pending', 'cleared', 'flagged', 'not_required'],
            default: 'not_required'
        },
        backgroundCheckDate: Date,
        taxIdProvided: { type: Boolean, default: false },
        w9Submitted: { type: Boolean, default: false },

        payoutDetails: {
            method: { type: String, enum: ['bank_transfer', 'paypal', 'stripe'] },
            bankAccount: {
                accountHolderName: String,
                accountNumber: String,
                routingNumber: String,
                bankName: String
            },
            paypalEmail: String,
            stripeConnectId: String
        }
    },

    // Preferences
    preferences: {
        language: { type: String, default: 'en' },
        theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
        emailNotifications: {
            newRequests: { type: Boolean, default: true },
            upcomingSessions: { type: Boolean, default: true },
            reviews: { type: Boolean, default: true },
            platformUpdates: { type: Boolean, default: true },
            weeklyDigest: { type: Boolean, default: true }
        },
        pushNotifications: { type: Boolean, default: true },
        calendarSync: { type: Boolean, default: false },
        calendarIntegration: { type: String, enum: ['google', 'outlook', 'apple'] },
        autoAcceptRequests: { type: Boolean, default: false },
        autoDeclineIfBusy: { type: Boolean, default: false }
    },

    // Privacy & Compliance
    privacy: {
        profileVisibility: {
            type: String,
            enum: ['public', 'students_only', 'private'],
            default: 'public'
        },
        showRealName: { type: Boolean, default: true },
        showCompany: { type: Boolean, default: true },
        showEmail: { type: Boolean, default: false },
        showPhone: { type: Boolean, default: false },
        dataProcessingConsent: { type: Boolean, default: false },
        termsAcceptedAt: Date,
        privacyPolicyAcceptedAt: Date,
        marketingConsent: { type: Boolean, default: false }
    },

    // System Tracking
    lastLoginAt: Date,
    deletionScheduledAt: Date,
    ipAddress: String,
    userAgent: String,

    metadata: {
        source: { type: String, enum: ['web', 'mobile', 'referral'] },
        referredBy: { type: Schema.Types.ObjectId, ref: 'Mentor' },
        referralCode: String,
        utmSource: String,
        utmMedium: String,
        utmCampaign: String,
        cohort: String,
        experimentFlags: [String]
    }
}, {
    timestamps: true,
    collection: 'mentors'
});

// Indexes
MentorSchema.index({ 'expertise.technicalSkills.name': 1 });
MentorSchema.index({ 'expertise.domains.name': 1 });
MentorSchema.index({ 'mentorship.pricing.isFree': 1 });
MentorSchema.index({ 'profile.industries': 1 });
MentorSchema.index({ 'profile.specializations': 1 });
MentorSchema.index({ createdAt: -1 });

// Compound indexes
MentorSchema.index({
    'account.status': 1,
    'account.verificationStatus': 1,
    'mentorship.availability.status': 1
});

// Virtual for full name
MentorSchema.virtual('fullName').get(function () {
    return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Methods
MentorSchema.methods.hasAvailableSlots = function () {
    return this.mentorship.availability.currentActiveStudents <
        this.mentorship.availability.maxActiveStudents;
};

MentorSchema.methods.isAcceptingStudents = function () {
    return this.mentorship.availability.status === 'accepting' &&
        this.hasAvailableSlots();
};

MentorSchema.methods.calculateOverallRating = function () {
    if (this.reputation.totalRatings === 0) return 0;

    const totalScore =
        (this.reputation.ratingBreakdown.fiveStar * 5) +
        (this.reputation.ratingBreakdown.fourStar * 4) +
        (this.reputation.ratingBreakdown.threeStar * 3) +
        (this.reputation.ratingBreakdown.twoStar * 2) +
        (this.reputation.ratingBreakdown.oneStar * 1);

    return totalScore / this.reputation.totalRatings;
};

MentorSchema.methods.hasStudent = function (studentId) {
    return this.mentorship.students.current.some(
        s => s.studentId.toString() === studentId.toString() && s.status === 'active'
    );
};

// Static methods
MentorSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() });
};

MentorSchema.statics.findVerifiedMentors = function () {
    return this.find({
        'account.status': 'active',
        'account.verificationStatus': 'verified'
    });
};

MentorSchema.statics.findAvailableMentors = function () {
    return this.find({
        'account.status': 'active',
        'account.verificationStatus': 'verified',
        'mentorship.availability.status': 'accepting'
    });
};

MentorSchema.statics.findTopRated = function (limit = 10) {
    return this.find({
        'account.status': 'active',
        'account.verificationStatus': 'verified'
    })
        .sort({ 'reputation.overallRating': -1 })
        .limit(limit);
};

// Pre-save middleware
MentorSchema.pre('save', async function () {
    // Set display name if not provided
    if (!this.profile.displayName) {
        this.profile.displayName = `${this.profile.firstName} ${this.profile.lastName}`;
    }

    // Recalculate overall rating
    if (this.isModified('reputation.ratingBreakdown')) {
        this.reputation.overallRating = this.calculateOverallRating();
    }

    // Hash password if modified
    if (this.isModified('passwordHash')) {
        const salt = await bcrypt.genSalt(10);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    }


});

const Mentor = mongoose.model('Mentor', MentorSchema);
module.exports = Mentor;