const express = require('express');
const router = express.Router();

const aiEngineService = require('../services/aiEngine.service');

router.get('/health', async (req, res) => {
    const aiHealth = await aiEngineService.healthCheck();

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            backend: 'healthy',
            database: 'healthy',
            aiEngine: aiHealth.success ? 'healthy' : 'degraded'
        }
    });
});

module.exports = router;