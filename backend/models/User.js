const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        username: { type: DataTypes.STRING, allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: false },
        role: { type: DataTypes.STRING, defaultValue: 'Admin' }, // Admin, SuperAdmin
        phone: { type: DataTypes.STRING, allowNull: true },
        officeIds: { type: DataTypes.JSON, allowNull: true }
    });
    return User;
};
