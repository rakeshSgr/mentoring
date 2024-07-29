'use strict'

module.exports = (sequelize, DataTypes) => {
	const IdMapping = sequelize.define(
		'IdMapping',
		{
			id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
			},
			uuid: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
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
				allowNull: true,
			},
		},
		{
			sequelize,
			modelName: 'IdMapping',
			tableName: 'id_mappings',
			freezeTableName: true,
			timestamps: true,
			paranoid: true,
		}
	)

	return IdMapping
}
