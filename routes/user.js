const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { User, Post } = require("../models");
const passport = require("passport");

const { isLoggedIn, isNotLoggedIn } = require("./middlewares");

router.post("/login", (req, res, next) => {
  // 미들웨어 확장 사용 가능.
  passport.authenticate("local", (serverError, user, clientError) => {
    if (serverError) {
      console.error(serverError);
      return next(serverError);
    }

    if (clientError) {
      console.error(clientError);
      return res.status(401).send(clientError.reason);
    }
    return req.login(user, async (loginError) => {
      // passport에 들어있는 로그인 내용
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }

      const allUserInfoWithoutPassword = await User.findOne({
        where: { id: user.id },
        attributes: {
          // 데이터를 걸러낼 수 있는 속성
          exclude: ["password"],
        },
        include: [
          {
            model: Post,
          },
          {
            model: User,
            as: "Followings",
          },
          {
            model: User,
            as: "Followers",
          },
        ],
      });

      return res.json(allUserInfoWithoutPassword);
    });
  })(req, res, next); // 기존  passport.authenticate로는 next 사용이 안됬으나 뒤에 붙여줌으로서 사용 가능
});

router.post("/", async (req, res, next) => {
  try {
    const existUser = await User.findOne({
      where: {
        email: req.body.email,
      },
    });
    // res가 2번이 가면 오류가 발생한다. 해당 오류는 캡쳐해둠.
    const hashedPassword = await bcrypt.hash(req.body.password, 11);
    if (existUser) {
      return res.status(403).send("현재 사용 중인 이메일입니다.");
    }
    await User.create({
      email: req.body.email,
      nickname: req.body.nickname,
      password: hashedPassword,
    });

    res.status(200).send("success");
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post("/logout", (req, res) => {
  req.logout();
  req.session.destroy();
  res.status(200).send("logout succcess");
});

module.exports = router;
