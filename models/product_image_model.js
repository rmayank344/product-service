const {DataTypes} = require('sequelize');
const sequelize = require("../config/sql_conn");

const Product_Image_Model = sequelize.define('product_image', 
  {
    image_id:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement:  true,
    },
    product_id:{
      type: DataTypes.INTEGER,
      allowNull: false,
      references:{
        model:'product_model',
        key:'product_id'
      },
     onUpdate: 'CASCADE',
     onDelete: 'CASCADE',
    },
    image_key : {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_primary:{
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    freezeTableName: true,
    tableName: 'product_image'
  }
);

// sequelize.sync({ force: false }) // Uncomment this if you want to sync the model with the database
//   .then(() => {
//     console.log(`Database & tables created!`);
// });

module.exports = Product_Image_Model;