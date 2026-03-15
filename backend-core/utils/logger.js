// utils/logger.js
module.exports = {
    info: (msg) => console.log(`[INFO]: ${msg}`),
    error: (msg, err) => console.error(`[ERROR]: ${msg}`, err),
    warn: (msg) => console.warn(`[WARN]: ${msg}`)
};