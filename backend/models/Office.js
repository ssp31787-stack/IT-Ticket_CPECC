const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Office = sequelize.define('Office', {
        name: { type: DataTypes.STRING, allowNull: false, unique: true },
    });
    return Office;
};
