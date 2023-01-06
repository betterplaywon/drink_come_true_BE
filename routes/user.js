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

router.get("/:userId", async (req, res, next) => {
  // 새로고침 할 때마다 사용자 불러오는 기능
  try {
    const allUserInfoWithoutPassword = await User.findOne({
      where: { id: req.params.userId },
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
    if (allUserInfoWithoutPassword) {
      const data = allUserInfoWithoutPassword.toJSON(); // 그냥 전달해주는 방법도 있겠지만 불필요하게 많은 정보를 보낼 필요도 없고, 타인의 개인 정보를 해킹당할 우려도 있기에 length만 간추려 전달
      data.Posts = data.Posts.length;
      data.Followers = data.Followers.length;
      data.Followings = data.Followings.length;
      res.status(200).json(data);
    } else {
      res.status(404).json("존재하지 않는 사용자입니다");
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
    await user.removeFollowings(req.user.Id);

    res.status(200).json({ UserId: parseInt(req.params.userId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
