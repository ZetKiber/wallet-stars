const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const config = require('./config/config');
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');

// Инициализация приложения
const app = express();

// Настройка CORS для работы с любыми источниками во время разработки
app.use(cors({
  origin: '*', // Разрешаем все источники (для разработки)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Настройка middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Создаем папку для хранения данных, если её нет
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Подключение маршрутов API
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);

// Настройка статических файлов
// Путь к клиентским файлам (wallet-stars/wallet-stars)
const clientDir = path.join(__dirname, '..', 'wallet-stars', 'wallet-stars');
app.use(express.static(clientDir));

// Добавляем путь к страницам, чтобы их можно было запрашивать напрямую
app.get('/*.html', (req, res) => {
  const requestedPage = req.path.substring(1); // Удаляем начальный слеш
  const pagePath = path.join(clientDir, 'pages', requestedPage);

  // Проверяем, существует ли запрашиваемый файл
  if (fs.existsSync(pagePath)) {
    res.sendFile(pagePath);
  } else {
    // Если файл не найден, перенаправляем на главную
    res.sendFile(path.join(clientDir, 'pages', 'index.html'));
  }
});

// Маршруты для API
// Проверка состояния сервера
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', version: '1.0.0' });
});

// Тестовый маршрут для проверки сервера
app.get('/api/test', (req, res) => {
  res.json({ message: 'API сервер WalletStars работает!' });
});

// Все остальные GET запросы направляем на index.html
app.get('*', (req, res) => {
  // Исключаем API запросы
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(clientDir, 'pages', 'index.html'));
  } else {
    // Для API запросов, которые не обработаны выше, возвращаем 404
    res.status(404).json({ message: 'Маршрут не найден', path: req.originalUrl });
  }
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(`Ошибка: ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ message: 'Внутренняя ошибка сервера', error: err.message });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
  console.log(`Клиентский интерфейс: http://localhost:${PORT}`);
  console.log('Доступные тестовые маршруты:');
  console.log('- http://localhost:' + PORT + '/api/health');
  console.log('- http://localhost:' + PORT + '/api/test');
}); 