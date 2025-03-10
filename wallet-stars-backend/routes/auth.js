const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Маршрут для авторизации через Telegram
router.post('/telegram/callback', authController.telegramAuth);

// Маршрут для демо-авторизации (для тестирования)
router.post('/demo', authController.demoAuth);

// Маршрут для получения данных пользователя
router.get('/me', authMiddleware, authController.getMe);

module.exports = router; 