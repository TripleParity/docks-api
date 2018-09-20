'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: DataTypes.STRING,
    hash: DataTypes.STRING,

    // Two-Factor auth values
    twofactorenabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    twofactorconfirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    twofactortoken: {
      type: DataTypes.STRING,
      defualtValue: null,
    },

  }, {});
  User.associate = function(models) {
    // associations can be defined here
  };
  return User;
};