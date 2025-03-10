const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middleware/auth');

// Применяем middleware авторизации ко всем маршрутам
router.use(authMiddleware);

// Маршруты для работы с балансом
router.get('/balance', walletController.getBalance);
router.post('/deposit', walletController.deposit);
router.post('/withdraw', walletController.withdraw);

// Маршруты для работы со звездами
router.post('/stars/buy', walletController.buyStars);
router.post('/stars/sell', walletController.sellStars);

// Маршрут для получения истории транзакций
router.get('/transactions', walletController.getTransactions);

module.exports = router; 