
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixCurrentStudents() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const mentor = await db.collection('mentors').findOne({ 'profile.displayName': 'Aman Verma' });

        if (mentor && mentor.mentorship?.students?.current) {
            console.log(`Found ${mentor.mentorship.students.current.length} students in current list`);
            
            const uniqueStudents = [];
            const seenIds = new Set();

            for (const s of mentor.mentorship.students.current) {
                const sIdStr = s.studentId.toString();
                if (!seenIds.has(sIdStr)) {
                    seenIds.add(sIdStr);
                    
                    // Lookup student name
                    const student = await db.collection('students').findOne({ _id: s.studentId });
                    const name = student?.profile?.displayName || 
                                 (student?.profile?.firstName ? `${student.profile.firstName} ${student.profile.lastName}` : 'Rohan Kumar');
                    
                    uniqueStudents.push({
                        ...s,
                        studentName: name
                    });
                    console.log(`Added student: ${name}`);
                }
            }

            await db.collection('mentors').updateOne(
                { _id: mentor._id },
                { $set: { 'mentorship.students.current': uniqueStudents } }
            );
            console.log('Cleaned up duplicates and added names');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

fixCurrentStudents();
