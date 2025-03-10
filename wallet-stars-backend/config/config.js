require('dotenv').config();

module.exports = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  jwtSecret: process.env.JWT_SECRET || 'wallet_stars_jwt_secret',
  port: process.env.PORT || 3000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost'
}; 