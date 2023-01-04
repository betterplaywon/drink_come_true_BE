module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      //id가 기본적으로 들어있음.(mySQL에서 자동 세팅)
      email: {
        type: DataTypes.STRING(31),
        allowNull: false, // 필수
        unique: true, // 고유값
      },
      nickname: {
        type: DataTypes.STRING(31),
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING(31),
        allowNull: false,
      },
    },
    {
      charset: "utf8",
      collate: "utf8_general_ci",
    }
  );
  User.associate = (db) => {
    db.User.hasMany(db.Post);
    db.User.hasMany(db.Comment);
    db.User.belongsToMany(db.Post, { through: "Like", as: "Liked" });
    db.User.belongsToMany(db.User, {
      // addFollowers,removeFollowers
      through: "Follow",
      as: "Followers",
      foreignKey: "FollowingId",
    });
    db.User.belongsToMany(db.User, {
      //addFollowings, removeFollowings
      through: "Follow",
      as: "Followings",
      foreignKey: "FollowerId",
    });
  };
  return User;
};
