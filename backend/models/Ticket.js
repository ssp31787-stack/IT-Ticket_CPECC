const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Ticket = sequelize.define('Ticket', {
        ticketId: { type: DataTypes.STRING, allowNull: false, unique: true },
        name: { type: DataTypes.STRING, allowNull: false },
        userPhone: { type: DataTypes.STRING, allowNull: false },
        projectName: { type: DataTypes.STRING, allowNull: false },
        office: { type: DataTypes.STRING, allowNull: false },
        complaint: { type: DataTypes.TEXT, allowNull: false },
        status: { type: DataTypes.STRING, defaultValue: 'Pending' },
        assignedAdminId: { type: DataTypes.INTEGER, allowNull: true },
        resolvedByName: { type: DataTypes.STRING, allowNull: true },
    });
    return Ticket;
};
