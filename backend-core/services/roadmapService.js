/**
 * Roadmap Service
 * Communicates with AI Engine to generate learning roadmaps
 */

const axios = require('axios');
const logger = require('../utils/logger');

class RoadmapService {
    constructor() {
        this.baseURL = process.env.AI_ENGINE_URL || 'http://localhost:8000';
        this.timeout = parseInt(process.env.AI_ENGINE_TIMEOUT || '60000');

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Generate learning roadmap from missing skills
     * @param {Array<string>} missingSkills - Skills to learn
     * @param {string} targetRole - Target job role
     * @returns {Promise<Object>} Formatted roadmap
     */
    async generateRoadmap(missingSkills, targetRole) {
        try {
            // Validate inputs
            if (!missingSkills || !Array.isArray(missingSkills) || missingSkills.length === 0) {
                logger.warn('No missing skills provided, generating generic roadmap');
                return this.generateFallbackRoadmap(targetRole);
            }

            if (!targetRole) {
                throw new Error('Target role is required for roadmap generation');
            }

            const skillsHash = crypto.createHash('md5').update(missingSkills.sort().join(',') + targetRole).digest('hex');
            const cacheKey = `roadmap:${skillsHash}`;

            const cachedRoadmap = await redisClient.get(cacheKey);
            if (cachedRoadmap) {
                logger.info('⚡ Roadmap served from Redis');
                return JSON.parse(cachedRoadmap);
            }

            logger.info(
                `Generating roadmap for ${targetRole} ` +
                `with ${missingSkills.length} missing skills`
            );

            // Call AI Engine
            const response = await this.client.post('/api/v1/generate-roadmap', {
                missing_skills: missingSkills,
                target_role: targetRole
            });

            if (!response.data || !response.data.milestones) {
                throw new Error('Invalid roadmap response from AI Engine');
            }

            const rawMilestones = response.data.milestones;

            // Format for Mongoose schema
            const formattedRoadmap = this.formatRoadmapForSchema(
                rawMilestones,
                targetRole
            );

            logger.info(
                `Roadmap generated successfully with ${formattedRoadmap.milestones.length} milestones`
            );
            await redisClient.setEx(cacheKey, 604800, JSON.stringify(formattedRoadmap));

            return formattedRoadmap;

        } catch (error) {
            logger.error('Roadmap generation failed:', error.message);

            // Handle specific errors
            if (error.response) {
                const { status } = error.response;

                if (status === 503) {
                    logger.warn('AI Engine unavailable, using fallback roadmap');
                    return this.generateFallbackRoadmap(targetRole);
                } else if (status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later.');
                }
            }

            // Fallback on any error
            logger.warn('Using fallback roadmap due to error');
            return this.generateFallbackRoadmap(targetRole);
        }
    }

    /**
     * Format AI response to match StudentSchema structure
     * @param {Array} rawMilestones - Raw milestones from AI
     * @param {string} targetRole - Target role
     * @returns {Object} Formatted roadmap
     */


    async formatRoadmapForSchema(rawMilestones, targetRole) {
        const formattedMilestones = rawMilestones.map((milestone, index) => {
            return {
                order: index + 1,
                title: milestone.title || `Milestone ${index + 1}`,
                description: milestone.description || '',
                category: 'skill', // Schema enum: skill, project, certification, etc.
                status: 'not_started', // Schema enum: not_started, in_progress, completed
                priority: 'important', // Schema enum: critical, important, optional
                tasks: (milestone.tasks || []).map(task => ({
                    description: typeof task === 'string' ? task : task.description,
                    resources: [], // Schema expectation
                    completed: false
                }))
            };
        });

        // StudentSchema ke 'careerRoadmap' structure ke exact matching:
        return {
            targetRole: targetRole,
            generatedAt: new Date(),
            lastUpdatedAt: new Date(),
            milestones: formattedMilestones,
            progress: {
                completedMilestones: 0,
                totalMilestones: formattedMilestones.length,
                percentComplete: 0,
                onTrack: true
            }
        };
    }
    /**
         * Generate basic fallback roadmap if AI fails
         * @param {string} targetRole - Target role
         * @returns {Object} Basic roadmap formatted for Mongoose
         */
    async generateFallbackRoadmap(targetRole) {
        logger.warn('Generating fallback roadmap due to AI Engine error');

        const fallbackMilestones = [
            {
                order: 1,
                title: 'Week 1: Foundations',
                description: `Learn the fundamentals required for ${targetRole}`,
                category: 'skill',
                status: 'not_started',
                priority: 'important',
                tasks: [
                    { description: 'Research role requirements and responsibilities', resources: [], completed: false },
                    { description: 'Set up development environment', resources: [], completed: false },
                    { description: 'Complete introductory tutorials', resources: [], completed: false }
                ]
            },
            {
                order: 2,
                title: 'Week 2: Core Concepts',
                description: 'Build understanding of core concepts',
                category: 'skill',
                status: 'not_started',
                priority: 'important',
                tasks: [
                    { description: 'Study fundamental concepts', resources: [], completed: false },
                    { description: 'Practice with basic exercises', resources: [], completed: false },
                    { description: 'Read relevant documentation', resources: [], completed: false }
                ]
            }
        ];

        // Generate up to 8 weeks
        for (let i = 3; i <= 8; i++) {
            fallbackMilestones.push({
                order: i,
                title: `Week ${i}: Advanced Learning`,
                description: `Continue building skills for ${targetRole}`,
                category: 'skill',
                status: 'not_started',
                priority: 'important',
                tasks: [
                    { description: 'Study advanced topics', resources: [], completed: false },
                    { description: 'Build practice projects', resources: [], completed: false },
                    { description: 'Review and consolidate learning', resources: [], completed: false }
                ]
            });
        }

        return {
            targetRole: targetRole,
            generatedAt: new Date(),
            lastUpdatedAt: new Date(),
            milestones: fallbackMilestones,
            progress: {
                completedMilestones: 0,
                totalMilestones: fallbackMilestones.length,
                percentComplete: 0,
                onTrack: true
            }
        };
    }



    /**
         * Update roadmap progress
         * @param {Object} roadmap - Current roadmap
         * @returns {Object} Updated roadmap with recalculated progress
         */
    async calculateProgress(roadmap) {
        if (!roadmap || !roadmap.milestones) return roadmap;

        const total = roadmap.milestones.length;
        // Schema mein status 'completed' check karna sahi practice hai
        const completedCount = roadmap.milestones.filter(m => m.status === 'completed').length;

        roadmap.progress.completedMilestones = completedCount;
        roadmap.progress.totalMilestones = total;
        roadmap.progress.percentComplete = total > 0 ? Math.round((completedCount / total) * 100) : 0;
        roadmap.lastUpdatedAt = new Date();

        return roadmap;
    }
}
module.exports = new RoadmapService();