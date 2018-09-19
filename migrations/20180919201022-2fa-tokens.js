'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Users', 'twofactorenabled', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }),

      queryInterface.addColumn('Users', 'twofactortoken', {
        type: Sequelize.STRING,
        defaultValue: null,
      }),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Users', 'twofactorenabled'),
      queryInterface.removeColumn('Users', 'twofactortoken'),
    ]);
  }
};
