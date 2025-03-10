const Datastore = require('nedb');
const path = require('path');

// Создаем хранилище данных
const db = new Datastore({
  filename: path.join(__dirname, '../data/users.db'),
  autoload: true
});

// Создаем индекс для быстрого поиска по telegramId
db.ensureIndex({ fieldName: 'telegramId', unique: true });
// Создаем индекс для быстрого поиска по username
db.ensureIndex({ fieldName: 'username' });

const User = {
  // Поиск пользователя по telegramId
  findByTelegramId: (telegramId) => {
    return new Promise((resolve, reject) => {
      db.findOne({ telegramId }, (err, user) => {
        if (err) return reject(err);
        resolve(user);
      });
    });
  },

  // Поиск пользователя по ID
  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.findOne({ _id: id }, (err, user) => {
        if (err) return reject(err);
        resolve(user);
      });
    });
  },

  // Поиск пользователя по username
  findByUsername: (username) => {
    return new Promise((resolve, reject) => {
      db.findOne({ username }, (err, user) => {
        if (err) return reject(err);
        resolve(user);
      });
    });
  },

  // Создание нового пользователя
  create: (userData) => {
    return new Promise((resolve, reject) => {
      db.insert(userData, (err, newUser) => {
        if (err) return reject(err);
        resolve(newUser);
      });
    });
  },

  // Обновление пользователя
  update: (id, userData) => {
    return new Promise((resolve, reject) => {
      db.update({ _id: id }, { $set: userData }, {}, (err, numReplaced) => {
        if (err) return reject(err);
        
        // Получаем обновленного пользователя
        User.findById(id)
          .then(user => resolve(user))
          .catch(err => reject(err));
      });
    });
  }
};

module.exports = User; 