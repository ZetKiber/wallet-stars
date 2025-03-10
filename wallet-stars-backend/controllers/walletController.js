const User = require('../models/user');
const Transaction = require('../models/transaction');

// Получение баланса пользователя
exports.getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    res.json({ balances: user.balances });
  } catch (error) {
    console.error('Ошибка получения баланса:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Имитация пополнения кошелька
exports.deposit = async (req, res) => {
  try {
    const { currency, amount } = req.body;
    
    if (!currency || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Необходимо указать валюту и положительную сумму' });
    }
    
    // Поддерживаемые валюты
    if (!['TON', 'USDT'].includes(currency)) {
      return res.status(400).json({ message: 'Неподдерживаемая валюта' });
    }
    
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Создаем транзакцию
    const transaction = await Transaction.create({
      userId: user._id,
      type: 'DEPOSIT',
      currency,
      amount,
      status: 'COMPLETED', // В реальной системе статус должен меняться после подтверждения оплаты
      notes: 'Пополнение баланса'
    });
    
    // Обновляем баланс пользователя
    const balances = { ...user.balances };
    balances[currency] = (balances[currency] || 0) + parseFloat(amount);
    
    await User.update(user._id, { balances });
    
    // Получаем обновленного пользователя
    const updatedUser = await User.findById(user._id);
    
    res.json({ 
      message: 'Баланс успешно пополнен',
      transaction: {
        id: transaction._id,
        type: transaction.type,
        currency: transaction.currency,
        amount: transaction.amount,
        status: transaction.status,
        createdAt: transaction.createdAt
      },
      balances: updatedUser.balances
    });
  } catch (error) {
    console.error('Ошибка пополнения баланса:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Вывод средств
exports.withdraw = async (req, res) => {
  try {
    const { currency, amount, address } = req.body;
    
    if (!currency || !amount || amount <= 0 || !address) {
      return res.status(400).json({ 
        message: 'Необходимо указать валюту, положительную сумму и адрес' 
      });
    }
    
    // Поддерживаемые валюты
    if (!['TON', 'USDT'].includes(currency)) {
      return res.status(400).json({ message: 'Неподдерживаемая валюта' });
    }
    
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Проверяем достаточно ли средств
    if (!user.balances[currency] || user.balances[currency] < amount) {
      return res.status(400).json({ message: 'Недостаточно средств' });
    }
    
    // Комиссия за вывод (в реальной системе может отличаться)
    const fee = amount * 0.01; // 1%
    const amountWithFee = amount - fee;
    
    // Создаем транзакцию
    const transaction = await Transaction.create({
      userId: user._id,
      type: 'WITHDRAW',
      currency,
      amount,
      fee,
      recipientAddress: address,
      status: 'PENDING', // В реальной системе должно быть async подтверждение
      notes: `Вывод ${amountWithFee} ${currency} на адрес ${address}`
    });
    
    // Обновляем баланс пользователя
    const balances = { ...user.balances };
    balances[currency] -= parseFloat(amount);
    
    await User.update(user._id, { balances });
    
    // Получаем обновленного пользователя
    const updatedUser = await User.findById(user._id);
    
    // В реальной системе здесь должен быть вызов блокчейн API для выполнения транзакции
    
    // Имитируем успешное завершение транзакции (в реальной системе это должно быть асинхронно)
    setTimeout(async () => {
      try {
        await Transaction.update(transaction._id, {
          status: 'COMPLETED',
          txHash: 'tx_' + Math.random().toString(36).substring(2, 15)
        });
      } catch (err) {
        console.error('Ошибка обновления статуса транзакции:', err);
      }
    }, 5000);
    
    res.json({ 
      message: 'Заявка на вывод средств создана',
      transaction: {
        id: transaction._id,
        type: transaction.type,
        currency: transaction.currency,
        amount: transaction.amount,
        fee,
        amountWithFee,
        status: transaction.status,
        recipientAddress: transaction.recipientAddress,
        createdAt: transaction.createdAt
      },
      balances: updatedUser.balances
    });
  } catch (error) {
    console.error('Ошибка вывода средств:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Покупка звезд
exports.buyStars = async (req, res) => {
  try {
    const { amount, currency, recipient } = req.body;
    
    if (!amount || amount <= 0 || !currency) {
      return res.status(400).json({ 
        message: 'Необходимо указать положительное количество звезд и валюту оплаты' 
      });
    }
    
    if (!['TON', 'USDT'].includes(currency)) {
      return res.status(400).json({ message: 'Неподдерживаемая валюта оплаты' });
    }
    
    // Получаем курс обмена (в реальной системе это должно быть из API обмена)
    const exchangeRates = {
      TON: 0.00568, // 1 звезда = 0.00568 TON
      USDT: 0.009    // 1 звезда = 0.009 USDT
    };
    
    const costAmount = amount * exchangeRates[currency];
    
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Проверяем достаточно ли средств
    if (!user.balances[currency] || user.balances[currency] < costAmount) {
      return res.status(400).json({ message: 'Недостаточно средств' });
    }
    
    // Определяем получателя звезд
    let recipientUser = user;
    
    if (recipient && recipient !== user.username) {
      const foundRecipient = await User.findByUsername(recipient);
      
      if (!foundRecipient) {
        return res.status(404).json({ message: 'Получатель не найден' });
      }
      
      recipientUser = foundRecipient;
    }
    
    // Создаем транзакцию покупки
    const transaction = await Transaction.create({
      userId: user._id,
      type: 'BUY',
      currency,
      amount: costAmount,
      receivingCurrency: 'STARS',
      receivingAmount: amount,
      status: 'COMPLETED',
      notes: recipient === user.username ? 
        `Покупка ${amount} звезд` : 
        `Покупка ${amount} звезд для ${recipient}`
    });
    
    // Обновляем балансы
    const userBalances = { ...user.balances };
    userBalances[currency] -= parseFloat(costAmount);
    
    await User.update(user._id, { balances: userBalances });
    
    // Если получатель - другой пользователь
    if (recipientUser._id.toString() !== user._id.toString()) {
      const recipientBalances = { ...recipientUser.balances };
      recipientBalances.STARS = (recipientBalances.STARS || 0) + parseFloat(amount);
      
      await User.update(recipientUser._id, { balances: recipientBalances });
    } else {
      // Если получатель - тот же пользователь
      userBalances.STARS = (userBalances.STARS || 0) + parseFloat(amount);
      await User.update(user._id, { balances: userBalances });
    }
    
    // Получаем обновленного пользователя
    const updatedUser = await User.findById(user._id);
    
    res.json({ 
      message: 'Звезды успешно куплены',
      transaction: {
        id: transaction._id,
        type: transaction.type,
        currency: transaction.currency,
        amount: costAmount,
        starsAmount: amount,
        recipient: recipient || user.username,
        status: transaction.status,
        createdAt: transaction.createdAt
      },
      balances: updatedUser.balances
    });
  } catch (error) {
    console.error('Ошибка покупки звезд:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Продажа звезд
exports.sellStars = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        message: 'Необходимо указать положительное количество звезд' 
      });
    }
    
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Проверяем достаточно ли звезд
    if (!user.balances.STARS || user.balances.STARS < amount) {
      return res.status(400).json({ message: 'Недостаточно звезд' });
    }
    
    // Получаем курс обмена (в реальной системе это должно быть из API обмена)
    const exchangeRate = 0.009; // 1 звезда = 0.009 TON при продаже
    
    const receivingAmount = amount * exchangeRate;
    
    // Создаем транзакцию продажи
    const transaction = await Transaction.create({
      userId: user._id,
      type: 'SELL',
      currency: 'STARS',
      amount,
      receivingCurrency: 'TON',
      receivingAmount,
      status: 'COMPLETED',
      notes: `Продажа ${amount} звезд за ${receivingAmount} TON`
    });
    
    // Обновляем балансы
    const balances = { ...user.balances };
    balances.STARS -= parseFloat(amount);
    balances.TON = (balances.TON || 0) + parseFloat(receivingAmount);
    
    await User.update(user._id, { balances });
    
    // Получаем обновленного пользователя
    const updatedUser = await User.findById(user._id);
    
    res.json({ 
      message: 'Звезды успешно проданы',
      transaction: {
        id: transaction._id,
        type: transaction.type,
        starsAmount: amount,
        receivingCurrency: 'TON',
        receivingAmount,
        status: transaction.status,
        createdAt: transaction.createdAt
      },
      balances: updatedUser.balances
    });
  } catch (error) {
    console.error('Ошибка продажи звезд:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Получение истории транзакций
exports.getTransactions = async (req, res) => {
  try {
    const { type, currency, limit = 10, page = 1 } = req.query;
    
    const query = { userId: req.userId };
    
    // Фильтрация по типу транзакции
    if (type) {
      query.type = type;
    }
    
    // Фильтрация по валюте
    if (currency) {
      query.currency = currency;
    }
    
    const skip = (page - 1) * limit;
    
    // Получаем транзакции с пагинацией
    const transactions = await Transaction.find(query, { 
      limit: parseInt(limit), 
      skip: skip 
    });
    
    // Получаем общее количество транзакций для пагинации
    const total = await Transaction.count(query);
    
    res.json({ 
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка получения истории транзакций:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
}; 