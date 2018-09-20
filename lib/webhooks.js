const Sequelize = require('sequelize');
const Promise = require('promise');

class Webhooks {
  constructor(db) {
    this.db = db;
    this.ready = false;

    // TODO(egeldenhuys): Move to dedicated models file/dir?
    this.WH = WebhookModel(db, Sequelize.DataTypes);
  }

  getDatabaseState() {
    return this.ready;
  }

  initDatabase() {
    return new Promise((resolve, reject) => {
      this.WH.sync({force: false}).then(() => {
        this.WH.findById(1).then((possibleWH) => {
          if (possibleWH == null) {
            this.createWH('null', 'null', ['null']).then((newWH) => {
              if (newWH != null) {
                this.ready = true;
                resolve(true);
              } else {
                this.ready = false;
                resolve(false);
              }
            });
          } else {
            this.ready = true;
            resolve(true);
          }
        });
      });
    });
  }
  getAllWH() {
    return new Promise((resolve, reject) => {
      this.WH.findAll()
        .then((wh) => {
          resolve(wh);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getWHById(id) {
    return this.WH.findById(id);
  }

  getWHByName(name) {
    return this.WH.findOne({where: {name: name}});
  }

  createWH(name, url, types) {
    return new Promise((resolve, reject) => {
      this.getWHByName(name)
        .then((possibleWH) => {
          if (possibleWH == null) {
            this.WH.create({
                name: name,
                url: url,
                types: types,
            })
          } else {
            resolve(possibleWH);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  removeWH(name) {
    return new Promise((resolve, reject) => {
      this.getWHByName(name)
        .then((WHToDelete) => {
          if (WHToDelete != null) {
            this.WH.destroy({where: {name: name}}).then(
              (rows) => {
                if (rows > 0) {
                  resolve(true);
                } else {
                  resolve(false);
                }
              }
            );
          } else {
            resolve(false);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  testConnection() {
    return this.db.authenticate();
  }
}

module.exports = Webhooks;