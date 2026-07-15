
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

async function syncMentors() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        const mentors = await mongoose.connection.db.collection('mentors').find({}).toArray();
        console.log(`Found ${mentors.length} mentors.`);

        for (const mentor of mentors) {
            console.log(`Indexing mentor: ${mentor.profile.displayName} (${mentor._id})`);
            
            const technicalSkills = mentor.expertise?.technicalSkills || [];
            const skillNames = technicalSkills.map(s => s.name);
            
            const profileText = `
                Name: ${mentor.profile.displayName}
                Tagline: ${mentor.profile.tagline}
                Bio: ${mentor.profile.bio}
                Company: ${mentor.profile.currentCompany}
                Experience: ${mentor.profile.totalYearsOfExperience} years
                Skills: ${skillNames.join(', ')}
            `.trim();

            const payload = {
                mentor_id: mentor._id.toString(),
                profile_text: profileText,
                metadata: {
                    name: mentor.profile.displayName,
                    company: mentor.profile.currentCompany,
                    role: mentor.profile.tagline,
                    skills: skillNames,
                    experience: mentor.profile.totalYearsOfExperience
                }
            };

            try {
                const response = await axios.post(`${AI_ENGINE_URL}/api/v1/rag/index-mentor`, payload);
                console.log(`Successfully indexed ${mentor.profile.displayName}:`, response.data);
            } catch (error) {
                console.error(`Failed to index ${mentor.profile.displayName}:`, error.response?.data || error.message);
            }
        }

        console.log('Sync complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error syncing mentors:', error);
        process.exit(1);
    }
}

syncMentors();
