const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { User, Post } = require("../models");
const passport = require("passport");

const { isLoggedIn, isNotLoggedIn } = require("./middlewares");
const { where } = require("sequelize");

router.get("/", async (req, res, next) => {
  // 새로고침 할 때마다 사용자 불러오는 기능
  try {
    if (req.user) {
      const user = await User.findOne({
        where: {
          id: req.user.id,
        },
      });

      const allUserInfoWithoutPassword = await User.findOne({
        where: { id: user.id },
        attributes: {
          // 데이터를 걸러낼 수 있는 속성
          exclude: ["password"],
        },
        include: [
          {
            model: Post,
            attributes: ["id"],
          },
          {
            model: User,
            as: "Followings",
            attributes: ["id"],
          },
          {
            model: User,
            as: "Followers",
            attributes: ["id"],
          },
        ],
      });

      res.status(200).json(allUserInfoWithoutPassword);
    } else {
      res.status(200).json(null);
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

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

router.patch("/nickname", async (req, res, next) => {
  try {
    await User.update(
      {
        nickname: req.body.nickname,
      },
      {
        where: { id: req.user.id },
      }
    );

    res.status(200).json({ nickname: req.body.nickname });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.patch("/:userId/follow", async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.params.userId,
      },
    });
    if (!user) {
      res.status(403).send("존재하지 않는 회원입니다");
    }
    await user.addFollowers(req.user.id);
    res.status(200).json({ UserId: parseInt(req.params.userId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.delete("/:userId/follow", async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.params.userId,
      },
    });
    if (!user) {
      res.status(403).send("존재하지 않는 회원입니다");
    }
    await user.removeFollowers(req.user.id);
    res.status(200).json({ UserId: parseInt(req.params.userId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get("/followers", async (req, res, next) => {
  //
  try {
    const user = await User.findOne({
      where: {
        id: req.user.id,
      },
    });
    const followers = await User.getFollowers();

    res.status(200).json(followers);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get("/followings", async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.user.id,
      },
    });
    const followings = await User.getFollowings();

    res.status(200).json(followings);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.delete("/follower/:userId", async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.params.userId,
      },
    });
    if (!user) {
      res.status(403).send("지우려는 유저가 존재하지 않습니다");
    }
    // follower와 following이 대칭관계이니 following 사용해도 괜찮을듯?
    // await User.removeFollowings(req.params.userId);
    // await User.removeFollowings(req.user.Id);
    // 'U'ser 가 아니라 'u'ser를 사용해줬더니 오류 해결. 무슨 차이인지 알아봐야함
    await User.removeFollowings(req.user.Id);

    res.status(200).json({ UserId: parseInt(req.params.userId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
