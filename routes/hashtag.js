const express = require("express");
const router = express.Router();
const { User, Post, Hashtag, Image, Comment } = require("../models");
const { Op } = require("sequelize");

router.get("/:hashtag", async (req, res, next) => {
  // GET/hastag/ㄹㅇ 이런 식으로 됨.해시태그가 한글 쿼리로 넘어가 프론트에서 인코딩해줘 백에서 디코딩 필요
  try {
    const where = {};
    const endId = parseInt(req.query.endId, 10);
    if (endId) {
      where.id = { [Op.lt]: endId }; // Op.lt를 사용해 endId보다 작은 숫자를 넣어준다
    }
    const posts = await Post.findAll({
      where,
      limit: 10,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Hashtag,
          where: { name: decodeURIComponent(req.params.hashtag) }, // include 내부에서도 where 작성이 가능.
        },
        {
          model: User,
          attributes: ["id", "nickname"],
        },
        {
          model: Image,
        },
        {
          model: Comment, // 게시글 작성자
          include: [
            {
              model: User,
              attributes: ["id", "nickname"],
            },
          ],
        },
        {
          model: User,
          as: "Likers",
          attributes: ["id"],
        },
      ],
    });

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
