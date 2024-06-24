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
				allowNull: false,
			},
			target_field: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			is_target_from_sessions_mentor: {
				type: DataTypes.BOOLEAN,
			},
			requester_field: {
				type: DataTypes.STRING,
				allowNull: false,
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
			indexes: [
				{
					fields: ['type'],
				},
				{
					fields: ['organization_id'],
				},
				{
					fields: ['type', 'organization_id'],
				},
			],
			uniqueKeys: {
				unique_default_rules_constraint: {
					fields: ['type', 'target_field', 'requester_field', 'organization_id'],
				},
			},
		}
	)

	return DefaultRule
}
