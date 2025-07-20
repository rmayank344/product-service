const {DataTypes} = require('sequelize');
const sequelize = require("../config/sql_conn");

const Category_Model =  sequelize.define('category_model',
  {
    category_id:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name:{
      type: DataTypes.STRING,
      allowNull: false,
    },
    brand:{
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_active:{
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    freezeTableName: true,
    tableName: 'category_model',
  }
);

// sequelize.sync({ force: false }) // Uncomment this if you want to sync the model with the database
//   .then(() => {
//     console.log('Database & tables created!');
// });

module.exports = Category_Model