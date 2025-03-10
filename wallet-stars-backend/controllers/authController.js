const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const config = require('../config/config');

// Функция для проверки данных от Telegram
function verifyTelegramData(data) {
  // В режиме разработки можно пропустить проверку
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_TELEGRAM_VERIFICATION === 'true') {
    console.log('Пропуск проверки данных Telegram (режим разработки)');
    return true;
  }

  try {
    const { hash, ...userData } = data;
    
    // Если нет хеша в данных, возвращаем false
    if (!hash) {
      console.error('Отсутствует хеш в данных Telegram');
      return false;
    }
    
    // Создаем проверочную строку в формате 'key=value...'
    const dataCheckString = Object.keys(userData)
      .sort()
      .map(key => `${key}=${userData[key]}`)
      .join('\n');
    
    // Создаем hmac с использованием токена бота
    const secretKey = crypto.createHash('sha256')
      .update(config.telegramBotToken)
      .digest();
    
    const hmac = crypto.createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    // Сравниваем hmac с хешем из запроса
    return hmac === hash;
  } catch (error) {
    console.error('Ошибка при проверке данных Telegram:', error);
    return false;
  }
}

// Обработка авторизации через Telegram
exports.telegramAuth = async (req, res) => {
  try {
    console.log('Получен запрос на авторизацию через Telegram:', req.body);
    const telegramData = req.body;
    
    // Проверяем валидность данных
    if (!verifyTelegramData(telegramData)) {
      console.error('Неверные данные аутентификации Telegram');
      return res.status(401).json({ message: 'Неверные данные аутентификации' });
    }
    
    // Проверяем свежесть запроса (не старше 24 часов)
    const currentTime = Math.floor(Date.now() / 1000);
    if (telegramData.auth_date && currentTime - telegramData.auth_date > 86400) {
      console.error('Срок действия аутентификации истек');
      return res.status(401).json({ message: 'Срок действия аутентификации истек' });
    }
    
    // Ищем пользователя
    let user = await User.findByTelegramId(telegramData.id);
    
    if (!user) {
      console.log('Создание нового пользователя с Telegram ID:', telegramData.id);
      // Создаем нового пользователя
      user = await User.create({
        telegramId: telegramData.id,
        firstName: telegramData.first_name,
        lastName: telegramData.last_name || '',
        username: telegramData.username || '',
        photoUrl: telegramData.photo_url || '',
        authDate: telegramData.auth_date,
        balances: {
          STARS: 0,
          TON: 0,
          USDT: 0
        },
        createdAt: new Date()
      });
    } else {
      console.log('Обновление существующего пользователя с Telegram ID:', telegramData.id);
      // Обновляем информацию о пользователе
      user = await User.update(user._id, {
        firstName: telegramData.first_name,
        lastName: telegramData.last_name || '',
        username: telegramData.username || '',
        photoUrl: telegramData.photo_url || '',
        authDate: telegramData.auth_date
      });
    }
    
    // Создаем JWT токен
    const token = jwt.sign(
      { userId: user._id, telegramId: user.telegramId },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
    
    // Отправляем токен и данные пользователя
    res.json({
      token,
      user: {
        id: user._id,
        telegramId: user.telegramId,
        name: user.firstName + (user.lastName ? ' ' + user.lastName : ''),
        username: user.username,
        photoUrl: user.photoUrl,
        balances: user.balances
      }
    });
  } catch (error) {
    console.error('Ошибка авторизации через Telegram:', error);
    res.status(500).json({ message: 'Ошибка сервера при авторизации', error: error.message });
  }
};

// Демо авторизация (для тестирования без Telegram)
exports.demoAuth = async (req, res) => {
  try {
    console.log('Использование демо-авторизации');
    
    // Создаем демо-пользователя
    const demoUser = {
      _id: 'demo_user_id',
      telegramId: 123456789,
      firstName: 'Демо',
      lastName: 'Пользователь',
      username: 'demo_user',
      photoUrl: 'https://placehold.co/100x100/0088cc/FFF?text=Demo',
      balances: {
        STARS: 1000,
        TON: 5.5,
        USDT: 100
      }
    };
    
    // Создаем JWT токен
    const token = jwt.sign(
      { userId: demoUser._id, telegramId: demoUser.telegramId },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
    
    // Отправляем токен и данные пользователя
    res.json({
      token,
      user: {
        id: demoUser._id,
        telegramId: demoUser.telegramId,
        name: demoUser.firstName + ' ' + demoUser.lastName,
        username: demoUser.username,
        photoUrl: demoUser.photoUrl,
        balances: demoUser.balances
      }
    });
  } catch (error) {
    console.error('Ошибка при демо-авторизации:', error);
    res.status(500).json({ message: 'Ошибка сервера при авторизации', error: error.message });
  }
};

// Функция для получения данных пользователя по токену
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    res.json({
      id: user._id,
      telegramId: user.telegramId,
      name: user.firstName + (user.lastName ? ' ' + user.lastName : ''),
      username: user.username,
      photoUrl: user.photoUrl,
      balances: user.balances
    });
  } catch (error) {
    console.error('Ошибка получения данных пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
}; 