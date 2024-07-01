'use strict'

module.exports = {
	up: async (queryInterface, Sequelize) => {
		await queryInterface.createTable('id_mappings', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			uuid: {
				type: Sequelize.STRING,
				allowNull: false,
				unique: true,
			},
			created_at: {
				allowNull: false,
				type: Sequelize.DATE,
				defaultValue: Sequelize.NOW,
			},
			updated_at: {
				allowNull: false,
				type: Sequelize.DATE,
				defaultValue: Sequelize.NOW,
			},
			deleted_at: {
				type: Sequelize.DATE,
				allowNull: true,
			},
		})

		await queryInterface.addIndex('id_mappings', ['uuid'], {
			name: 'idx_id_mappings_uuid',
			unique: true,
		})
	},
	down: async (queryInterface, Sequelize) => {
		await queryInterface.removeIndex('id_mappings', 'idx_id_mappings_uuid')
		await queryInterface.dropTable('id_mappings')
	},
}
