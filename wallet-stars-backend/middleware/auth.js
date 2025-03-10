const jwt = require('jsonwebtoken');
const config = require('../config/config');

module.exports = (req, res, next) => {
  try {
    // Получаем токен из заголовка
    const token = req.header('Authorization').replace('Bearer ', '');
    
    // Проверяем токен
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Сохраняем ID пользователя в запросе
    req.userId = decoded.userId;
    req.telegramId = decoded.telegramId;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Требуется авторизация' });
  }
}; 