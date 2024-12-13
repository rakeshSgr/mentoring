'use strict'

module.exports = (sequelize, DataTypes) => {
	const ReportRoleMapping = sequelize.define(
		'ReportRoleMapping',
		{
			id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				primaryKey: true,
				autoIncrement: true,
			},
			report_code: {
				type: DataTypes.STRING(255),
				allowNull: false,
			},
			role_title: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			created_at: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
			updated_at: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
			deleted_at: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
			},
		},
		{
			modelName: 'ReportRoleMapping',
			tableName: 'report_role_mapping',
			freezeTableName: true,
			paranoid: true, // Enables soft delete handling via deleted_at
		}
	)

	return ReportRoleMapping
}
