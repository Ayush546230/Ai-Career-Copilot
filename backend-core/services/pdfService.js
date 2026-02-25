/**
 * PDF Service
 * Utility for extracting text from PDF buffers
 */

const pdf = require('pdf-parse-fork');

class PDFService {
    /**
     * Extract text from PDF buffer
     * @param {Buffer} buffer - PDF file buffer from multer
     * @returns {Promise<string>} Extracted text
     */
    async extractText(buffer) {
        try {
            if (!buffer || !Buffer.isBuffer(buffer)) {
                throw new Error('Invalid PDF buffer');
            }

            if (buffer.length === 0) {
                throw new Error('PDF file is empty');
            }

            // Parse PDF
            let data;
            if (typeof pdf === 'function') {
                data = await pdf(buffer);
            } else if (pdf && typeof pdf.default === 'function') {
                data = await pdf.default(buffer);
            } else {
                throw new Error('PDF parsing module not found as a function');
            }

            if (!data.text || data.text.trim().length === 0) {
                throw new Error('No text found in PDF. Please ensure it\'s a text-based PDF, not a scanned image.');
            }

            // Clean text
            const cleanedText = this.cleanText(data.text);

            console.log(`✅ Extracted ${cleanedText.length} characters from PDF`);

            return cleanedText;

        } catch (error) {
            console.error('❌ PDF extraction error:', error.message);

            // User-friendly error messages
            if (error.message.includes('Invalid PDF')) {
                throw new Error('The uploaded file is not a valid PDF');
            }
            if (error.message.includes('encrypted')) {
                throw new Error('Cannot process password-protected PDFs');
            }

            throw new Error(`PDF processing failed: ${error.message}`);
        }
    }

    /**
     * Clean extracted text
     * @param {string} text - Raw text
     * @returns {string} Cleaned text
     */
    cleanText(text) {
        return text
            .replace(/\s+/g, ' ')           // Remove extra whitespace
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control chars
            .trim();
    }
}

module.exports = new PDFService();