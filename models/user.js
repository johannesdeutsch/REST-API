'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.Course, {
        foreignKey: {
          fieldName: 'userId',
          allowNull: false,
        }
      });
    }
  }
  User.init({
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    emailAddress: {
      type: DataTypes.STRING,
      unique: {
        msg: 'This email address exists already.'
      },
      validate: {
        isEmail: {
          msg: 'Please provide a valid email address'
        }
      }
    },
    password: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};