# Wallet Stars - приложение для работы с криптовалютой

Это комплексное приложение, состоящее из серверной части (API) и клиентской части (веб-интерфейс).

## Требования

- Node.js (версия 14.x или выше)
- npm (версия 6.x или выше)

## Установка

1. Клонируйте репозиторий
2. Перейдите в директорию серверной части:
```bash
cd wallet-stars-backend
```
3. Установите зависимости:
```bash
npm run setup
```

## Настройка

Настройте переменные окружения в файле `.env`:

```
TELEGRAM_BOT_TOKEN=ваш_токен_от_BotFather
JWT_SECRET=секретный_ключ_для_jwt_токенов
PORT=3000
FRONTEND_URL=http://localhost
NODE_ENV=development
SKIP_TELEGRAM_VERIFICATION=true    # Включен пропуск проверки данных от Telegram в режиме разработки
```

## Запуск

### Для разработки:
```bash
npm run dev
```

### Для производственной среды:
```bash
npm start
```

После запуска, приложение будет доступно по адресу:
- Веб-интерфейс: `http://localhost:3000`
- API: `http://localhost:3000/api`

## Структура проекта

### Серверная часть (wallet-stars-backend)
- `server.js` - основной файл сервера
- `controllers/` - контроллеры для обработки запросов
- `models/` - модели данных
- `routes/` - маршруты API
- `middleware/` - промежуточное ПО
- `config/` - конфигурационные файлы
- `data/` - директория для хранения данных (NeDB)

### Клиентская часть (wallet-stars)
- `pages/` - HTML-страницы
- `scripts/` - JavaScript файлы
- `styles/` - CSS файлы
- `assets/` - изображения и другие ресурсы

## API

### Аутентификация
- `POST /api/auth/telegram/callback` - авторизация через Telegram
- `POST /api/auth/demo` - демо-авторизация (для тестирования)
- `GET /api/auth/me` - получение данных пользователя

### Работа с кошельком
- `GET /api/wallet/balance` - получение баланса
- `POST /api/wallet/deposit` - пополнение кошелька
- `POST /api/wallet/withdraw` - вывод средств
- `POST /api/wallet/stars/buy` - покупка звезд
- `POST /api/wallet/stars/sell` - продажа звезд
- `GET /api/wallet/transactions` - получение истории транзакций 