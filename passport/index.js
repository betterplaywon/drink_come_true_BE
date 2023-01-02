const passport = require("passport");
const local = require("./local");
const { User } = require("../models");

module.exports = () => {
  passport.serializeUser((user, done) => {
    done(null, user.id); // 세션에서 유저 데이터를 모두 저장하기엔 양이 많아 id만 저장
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findOne({ where: { id } }); // 위의 유저 id를 가져온다
      done(null, user); // DB에서 유저 복구
    } catch (error) {
      console.error(error);
      done(error);
    }
  });

  local();
};
