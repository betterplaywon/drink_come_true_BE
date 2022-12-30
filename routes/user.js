const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { User } = require("../models");

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
      password: hashedPassword,
    });
    res.status(200).send("success");
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
