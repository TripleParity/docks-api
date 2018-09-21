'use strict';
module.exports = (sequelize, DataTypes) => {
    const Webhook = sequelize.define('Webhook', {
        name: DataTypes.STRING,
        url: DataTypes.STRING,
        types: DataTypes.ARRAY(DataTypes.STRING),
    }, {});
    Webhook.associate = function(models) {
        // associations can be defined here
    };
    return Webhook;
};