/**
 * Multer Upload Middleware
 * Handles PDF file uploads in memory
 */

const multer = require('multer');

// Memory storage (keeps file in RAM as buffer)
const storage = multer.memoryStorage();

// File filter - only PDFs
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};

// Multer config
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: fileFilter
});

module.exports = upload;