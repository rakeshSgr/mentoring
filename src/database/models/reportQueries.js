'use strict'

module.exports = (sequelize, DataTypes) => {
	const ReportQuery = sequelize.define(
		'ReportQuery',
		{
			id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				primaryKey: true,
				autoIncrement: true,
			},
			report_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			query: {
				type: DataTypes.TEXT,
			},
			status: {
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
			sequelize,
			modelName: 'ReportQuery',
			tableName: 'report_queries',
			freezeTableName: true,
			paranoid: true, // Enables soft delete handling via deleted_at
			timestamps: true, // Automatically manages created_at and updated_at
			createdAt: 'created_at',
			updatedAt: 'updated_at',
			deletedAt: 'deleted_at',
		}
	)

	// Define associations
	ReportQuery.associate = (models) => {
		ReportQuery.belongsTo(models.Report, {
			foreignKey: 'report_id',
			as: 'report',
		})
	}

	return ReportQuery
}
