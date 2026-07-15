
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixTargetRoles() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const mentors = await db.collection('mentors').find({}).toArray();

        for (const m of mentors) {
            if (m.mentorship?.students?.pendingRequests) {
                let modified = false;
                m.mentorship.students.pendingRequests.forEach(req => {
                    if (req.studentProfile && (req.studentProfile.targetRole === 'N/A' || !req.studentProfile.targetRole)) {
                        req.studentProfile.targetRole = 'Full stack dev';
                        modified = true;
                        console.log(`Fixing request from ${req.studentProfile.name}`);
                    }
                });

                if (modified) {
                    await db.collection('mentors').updateOne(
                        { _id: m._id },
                        { $set: { 'mentorship.students.pendingRequests': m.mentorship.students.pendingRequests } }
                    );
                    console.log(`Updated mentor: ${m.profile?.displayName || m.email}`);
                }
            }
        }

        console.log('Fix complete');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

fixTargetRoles();
