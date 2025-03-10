const Datastore = require('nedb');
const path = require('path');

// Создаем хранилище данных
const db = new Datastore({
  filename: path.join(__dirname, '../data/transactions.db'),
  autoload: true
});

// Создаем индекс для быстрого поиска по userId
db.ensureIndex({ fieldName: 'userId' });

const Transaction = {
  // Создание новой транзакции
  create: (transactionData) => {
    // Добавляем временные метки
    const now = new Date();
    transactionData.createdAt = now;
    transactionData.updatedAt = now;
    
    return new Promise((resolve, reject) => {
      db.insert(transactionData, (err, newTransaction) => {
        if (err) return reject(err);
        resolve(newTransaction);
      });
    });
  },

  // Поиск транзакции по ID
  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.findOne({ _id: id }, (err, transaction) => {
        if (err) return reject(err);
        resolve(transaction);
      });
    });
  },

  // Обновление транзакции
  update: (id, updateData) => {
    // Обновляем временную метку
    updateData.updatedAt = new Date();
    
    return new Promise((resolve, reject) => {
      db.update({ _id: id }, { $set: updateData }, {}, (err, numReplaced) => {
        if (err) return reject(err);
        
        // Получаем обновленную транзакцию
        Transaction.findById(id)
          .then(transaction => resolve(transaction))
          .catch(err => reject(err));
      });
    });
  },

  // Поиск транзакций по критериям с пагинацией
  find: (query = {}, options = {}) => {
    return new Promise((resolve, reject) => {
      const limit = options.limit || 10;
      const skip = options.skip || 0;
      
      db.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec((err, transactions) => {
          if (err) return reject(err);
          resolve(transactions);
        });
    });
  },

  // Подсчет количества транзакций по критериям
  count: (query = {}) => {
    return new Promise((resolve, reject) => {
      db.count(query, (err, count) => {
        if (err) return reject(err);
        resolve(count);
      });
    });
  }
};

module.exports = Transaction; 