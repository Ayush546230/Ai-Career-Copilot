
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function syncRequests() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        
        // Find all students with pending requests
        const students = await db.collection('students').find({ 'mentorship.mentorRequests.status': 'pending' }).toArray();
        console.log(`Found ${students.length} students with pending requests`);

        for (const student of students) {
            for (const req of student.mentorship.mentorRequests) {
                if (req.status === 'pending') {
                    const mentorId = req.mentorId;
                    const mentor = await db.collection('mentors').findOne({ _id: new mongoose.Types.ObjectId(mentorId) });
                    
                    if (mentor) {
                        const alreadyExists = mentor.mentorship?.students?.pendingRequests?.some(
                            pr => pr.studentId.toString() === student._id.toString()
                        );

                        if (!alreadyExists) {
                            console.log(`Syncing request from ${student.profile.displayName} to ${mentor.profile.displayName}`);
                            
                            const newRequest = {
                                _id: new mongoose.Types.ObjectId(),
                                studentId: student._id,
                                requestedAt: req.requestedAt || new Date(),
                                status: 'pending',
                                studentMessage: req.message || '',
                                studentProfile: {
                                    name: student.profile.displayName,
                                    targetRole: student.profile.targetRole || student.careerRoadmap?.targetRole || 'Software Engineer',
                                    experience: `${student.profile.yearsOfExperience || 0} years`,
                                    goals: []
                                },
                                viewedByMentor: false
                            };

                            await db.collection('mentors').updateOne(
                                { _id: mentor._id },
                                { $push: { 'mentorship.students.pendingRequests': newRequest } }
                            );
                            console.log('Sync successful');
                        } else {
                            console.log(`Request already exists for mentor ${mentor.profile.displayName}`);
                        }
                    }
                }
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

syncRequests();
