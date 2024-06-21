'use strict'
module.exports = (sequelize, DataTypes) => {
	const DefaultRule = sequelize.define(
		'DefaultRule',
		{
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: DataTypes.INTEGER,
			},
			type: {
				type: DataTypes.STRING,
			},
			target_field: {
				type: DataTypes.STRING,
			},
			is_target_from_sessions_mentor: {
				type: DataTypes.BOOLEAN,
			},
			requester_field: {
				type: DataTypes.STRING,
			},
			field_configs: {
				type: DataTypes.JSON,
			},
			matching_operator: {
				type: DataTypes.STRING,
			},
			requester_roles: {
				type: DataTypes.ARRAY(DataTypes.STRING),
			},
			role_config: {
				type: DataTypes.JSON,
			},
			organization_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
				primaryKey: true,
			},
			created_by: {
				type: DataTypes.INTEGER,
			},
			updated_by: {
				type: DataTypes.INTEGER,
			},
			created_at: {
				allowNull: false,
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
			},
			updated_at: {
				allowNull: false,
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
			},
			deleted_at: {
				type: DataTypes.DATE,
			},
		},
		{
			sequelize,
			modelName: 'DefaultRule',
			tableName: 'default_rules',
			freezeTableName: true,
			paranoid: true,
			timestamps: true,
			createdAt: 'created_at',
			updatedAt: 'updated_at',
			deletedAt: 'deleted_at',
		}
	)

	return DefaultRule
}
