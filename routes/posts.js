const express = require("express");
const { Op } = require("sequelize");
const router = express.Router();
const { Post, User, Image, Comment } = require("../models");

router.get("/", async (req, res, next) => {
  try {
    const where = {};
    const endId = parseInt(req.query.endId, 10);
    if (endId) {
      where.id = { [Op.lt]: endId }; // Op.lt를 사용해 endId보다 작은 숫자를 넣어준다
    }
    const posts = await Post.findAll({
      where,
      limit: 10,
      order: [
        ["createdAt", "DESC"],
        [Comment, "createdAt", "DESC"],
      ],
      include: [
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

// router.get("/", async (req, res, next) => {
//   try {
//     const where = {};
//     const endId = parceInt(req.query.endId, 10);
//     if (endId) {
//       where.id = { [Op.lt]: endId }; // Op.lt를 사용해 endId보다 작은 숫자를 넣어준다
//     }
//     const posts = await Post.findAll({
//       where,
//       limit: 10,
//       order: [
//         ["createdAt", "DESC"],
//         [Comment, "createdAt", "DESC"],
//       ],
//       include: [
//         {
//           model: User,
//           attributes: ["id", "nickname"],
//         },
//         {
//           model: Image,
//         },
//         {
//           model: Comment, // 게시글 작성자
//           include: [
//             {
//               model: User,
//               attributes: ["id", "nickname"],
//             },
//           ],
//         },
//         {
//           model: User,
//           as: "Likers",
//           attributes: ["id"],
//         },
//       ],
//     });

//     res.status(200).json(posts);
//   } catch (error) {
//     console.error(error);
//     next(error);
//   }
// });

module.exports = router;
