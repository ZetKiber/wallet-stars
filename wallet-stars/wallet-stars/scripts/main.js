/**
 * WalletStars - основной файл JavaScript
 * Содержит общие функции, используемые на всех страницах
 */

// Базовый URL для API
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://${window.location.hostname}:3000/api`
    : `${window.location.protocol}//${window.location.hostname}/api`;

// Функция для проверки авторизации
function checkAuth() {
    const token = localStorage.getItem('wallet_stars_token');
    const userData = JSON.parse(localStorage.getItem('wallet_stars_user'));

    // Проверяем, не находимся ли мы уже на странице логина
    const currentPage = window.location.pathname.split('/').pop();
    const isLoginPage = currentPage === 'login.html' || currentPage === '';

    if (!token || !userData) {
        // Перенаправляем только если мы не на странице логина
        if (!isLoginPage) {
            window.location.href = 'login.html';
        }
        return null;
    }

    return userData;
}

// Демо-данные для имитации работы кошелька
function getDemoUserData() {
    return {
        id: 12345678,
        first_name: "Демо пользователь",
        username: "demo_user",
        photo_url: "https://placehold.co/100x100/333/FFF?text=User",
        balances: {
            STARS: 5000,
            TON: 0.532,
            USDT: 10.25
        },
        transactions: [
            {
                id: 1,
                type: "deposit",
                amount: 1000,
                currency: "STARS",
                date: "2023-12-01T12:34:56"
            },
            {
                id: 2,
                type: "withdraw",
                amount: 200,
                currency: "STARS",
                date: "2023-12-05T15:22:30"
            },
            {
                id: 3,
                type: "deposit",
                amount: 0.5,
                currency: "TON",
                date: "2023-12-10T09:45:12"
            },
            {
                id: 4,
                type: "deposit",
                amount: 10,
                currency: "USDT",
                date: "2023-12-12T18:30:00"
            }
        ],
        partnershipStats: {
            percentage: 0.5,
            referralLink: "https://wallet-stars.com/ref/123456",
            invitedUsers: 3,
            earnings: {
                STARS: 250,
                TON: 0.032,
                USDT: 0.25
            }
        }
    };
}

// Функция для демо-логина
function demoLogin() {
    const demoUser = getDemoUserData();
    localStorage.setItem('wallet_stars_user', JSON.stringify(demoUser));
    window.location.href = 'index.html';
}

// Форматирование числа с ограничением десятичных знаков
function formatNumber(number, decimals = 2) {
    if (typeof number !== 'number') return '0';

    // Для целых чисел (например STARS) не показываем десятичные
    if (number % 1 === 0 && decimals === 0) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    return number.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Форматирование даты для отображения
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Показ уведомления (тост)
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');

    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }
}

// Функция для копирования текста в буфер обмена
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            showToast('Скопировано в буфер обмена');
        })
        .catch(err => {
            console.error('Ошибка при копировании: ', err);
            showToast('Не удалось скопировать текст');
        });
}

// Инициализация Telegram Login Widget
function initTelegramLogin() {
    if (!window.Telegram) {
        console.error('Telegram Web App не загружен');
        return;
    }

    window.Telegram.WebApp.ready();

    // Получаем данные пользователя
    const user = window.Telegram.WebApp.initDataUnsafe.user;

    if (user) {
        // Создаем объект пользователя с демо-данными
        const userData = {
            id: user.id,
            name: user.first_name + (user.last_name ? ' ' + user.last_name : ''),
            username: user.username || 'user' + user.id,
            balances: {
                STARS: 0,
                TON: 0,
                USDT: 0
            },
            transactions: [],
            partnershipStats: {
                percentage: 0.5,
                referralLink: `https://wallet-stars.com/ref/${user.id}`,
                invitedUsers: 0,
                earnings: {
                    STARS: 0,
                    TON: 0,
                    USDT: 0
                }
            }
        };

        // Сохраняем данные пользователя
        localStorage.setItem('wallet_stars_user', JSON.stringify(userData));

        // Перенаправляем на главную страницу
        window.location.href = 'index.html';
    }
}

// Обновляет интерфейс пользователя данными из профиля
function updateUserInterface(userData) {
    // Обновляем аватар пользователя
    const userAvatar = document.getElementById('user-avatar');
    if (userAvatar && userData.photoUrl) {
        userAvatar.src = userData.photoUrl;
    } else if (userAvatar) {
        // Если нет фото, используем стандартный аватар
        userAvatar.src = '../assets/images/default-avatar.png';
    }

    // Обновляем имя пользователя
    const username = document.getElementById('username');
    if (username && userData.name) {
        username.textContent = userData.name;
    }

    // Обновляем ID пользователя
    const userId = document.getElementById('user-id');
    if (userId && userData.telegramId) {
        userId.textContent = '#' + userData.telegramId;
    }

    // Обновляем балансы
    updateBalances(userData.balances);
}

// Обновляет отображение балансов
function updateBalances(balances = {}) {
    // Находим все элементы баланса на странице
    const starsBalance = document.querySelector('.balance-card:nth-child(1) .balance-amount');
    const starsBalanceUsd = document.querySelector('.balance-card:nth-child(1) .balance-usd');

    const tonBalance = document.querySelector('.balance-card:nth-child(2) .balance-amount');
    const tonBalanceUsd = document.querySelector('.balance-card:nth-child(2) .balance-usd');

    const usdtBalance = document.querySelector('.balance-card:nth-child(3) .balance-amount');
    const usdtBalanceUsd = document.querySelector('.balance-card:nth-child(3) .balance-usd');

    // Приблизительные курсы для расчета USD эквивалента
    const exchangeRates = {
        STARS: 0.5, // 1 STARS = 0.5 USD
        TON: 3.5,   // 1 TON = 3.5 USD
        USDT: 1.0   // 1 USDT = 1 USD
    };

    // Обновляем баланс STARS
    if (starsBalance) {
        const amount = balances.STARS || 0;
        starsBalance.textContent = formatNumber(amount, 0);

        if (starsBalanceUsd) {
            const usdValue = amount * exchangeRates.STARS;
            starsBalanceUsd.textContent = formatNumber(usdValue, 2) + '$';
        }
    }

    // Обновляем баланс TON
    if (tonBalance) {
        const amount = balances.TON || 0;
        tonBalance.textContent = formatNumber(amount, 2);

        if (tonBalanceUsd) {
            const usdValue = amount * exchangeRates.TON;
            tonBalanceUsd.textContent = formatNumber(usdValue, 2) + '$';
        }
    }

    // Обновляем баланс USDT
    if (usdtBalance) {
        const amount = balances.USDT || 0;
        usdtBalance.textContent = formatNumber(amount, 2);

        if (usdtBalanceUsd) {
            const usdValue = amount * exchangeRates.USDT;
            usdtBalanceUsd.textContent = formatNumber(usdValue, 2) + '$';
        }
    }
}

// Функция для обновления языка
function updateLanguage(lang = 'ru') {
    // В будущей реализации - загрузка переводов и обновление текстов
    localStorage.setItem('wallet_stars_lang', lang);
}

// Функция для запросов к API
async function apiRequest(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem('wallet_stars_token');

    if (!token && endpoint !== 'auth/telegram/callback') {
        window.location.href = 'login.html';
        return null;
    }

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    // Добавляем токен авторизации, если он есть
    if (token) {
        options.headers['Authorization'] = 'Bearer ' + token;
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, options);

        if (!response.ok) {
            const error = await response.json();

            if (response.status === 401) {
                // Если токен не валидный, выходим из аккаунта
                localStorage.removeItem('wallet_stars_token');
                localStorage.removeItem('wallet_stars_user');
                window.location.href = 'login.html';
            }

            throw new Error(error.message || 'Ошибка запроса');
        }

        return await response.json();
    } catch (error) {
        console.error('API запрос неудачен:', error);
        showToast('Ошибка: ' + error.message);
        return null;
    }
}

// Функция для выхода из аккаунта
function logout() {
    localStorage.removeItem('wallet_stars_token');
    localStorage.removeItem('wallet_stars_user');
    window.location.href = 'login.html';
}

// Функции для работы с кошельком

// Получение баланса
async function getBalance() {
    return await apiRequest('wallet/balance');
}

// Пополнение баланса
async function depositFunds(currency, amount) {
    return await apiRequest('wallet/deposit', 'POST', { currency, amount });
}

// Вывод средств
async function withdrawFunds(currency, amount, address) {
    return await apiRequest('wallet/withdraw', 'POST', { currency, amount, address });
}

// Покупка звезд
async function buyStars(amount, currency, recipient = null) {
    return await apiRequest('wallet/stars/buy', 'POST', { amount, currency, recipient });
}

// Продажа звезд
async function sellStars(amount) {
    return await apiRequest('wallet/stars/sell', 'POST', { amount });
}

// Получение истории транзакций
async function getTransactions(options = {}) {
    const queryParams = new URLSearchParams();

    if (options.type) queryParams.append('type', options.type);
    if (options.currency) queryParams.append('currency', options.currency);
    if (options.limit) queryParams.append('limit', options.limit);
    if (options.page) queryParams.append('page', options.page);

    const queryString = queryParams.toString();
    return await apiRequest(`wallet/transactions${queryString ? '?' + queryString : ''}`);
} 