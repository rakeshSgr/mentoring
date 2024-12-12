'use strict'

module.exports = (sequelize, DataTypes) => {
	const Report = sequelize.define(
		'Report',
		{
			id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				primaryKey: true,
				autoIncrement: true,
			},
			code: {
				type: DataTypes.STRING(255),
				allowNull: false,
			},
			title: {
				type: DataTypes.STRING(255),
				allowNull: false,
			},
			description: {
				type: DataTypes.TEXT,
			},
			report_type_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			config: {
				type: DataTypes.JSONB,
			},
			organization_id: {
				type: DataTypes.STRING,
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
			modelName: 'Report',
			tableName: 'reports',
			freezeTableName: true,
			paranoid: true, // Enables soft delete handling via deleted_at
		}
	)

	return Report
}
