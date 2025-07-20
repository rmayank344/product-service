const { DataTypes } = require('sequelize');
const sequelize = require("../config/sql_conn");

const Product_Rating_Model = sequelize.define('product_rating_model',
  {
    rating_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    rating_value: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    description: {
      type: DataTypes.STRING,
      allowNull : false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      reference: {
        model: 'product_model',
        key: 'product_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  },
  {
    timestamps: true,
    freezeTableName: true,
    tableName: 'product_rating_model'
  }
);

// sequelize.sync({ force: false }) // Uncomment this if you want to sync the model with the database
//   .then(() => {
//     console.log(`Database & tables created!`);
// });

module.exports = Product_Rating_Model;