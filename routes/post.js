const express = require("express");
const router = express.Router();
const { Post, Image, Comment, User } = require("../models");
const multer = require("multer");
const path = require("path");

const fs = require("fs");
try {
  fs.accessSync("uploads");
} catch (error) {
  console.log("upload 폴더가 없으므로 생성");
  fs.mkdirSync("uploads");
}

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, done) {
      done(null, "uploads");
    },
    // 파일.확장자
    filename(req, file, done) {
      const ext = path.extname(file.originalname); // 확장자 추출
      const basename = path.basename(file.originalname, ext); // 파일명
      done(null, basename + "_" + new Date().getTime() + ext);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 파일 용량 제한
});

router.post("/", upload.none(), async (req, res, next) => {
  try {
    const post = await Post.create({
      content: req.body.content,
      UserId: req.user.id,
    });

    if (req.body.image) {
      if (Array.isArray(req.body.image)) {
        // 이미지가 여러 개가 들어왔다
        const images = await Promise.all(
          req.body.image.map((image) => Image.create({ src: image }))
        );
        await post.addImages(images);
      } else {
        // 들어온 이미지가 하나다
        const image = await Image.create({ src: req.body.image });
        await post.addImages(image);
      }
    }

    const allPost = await Post.findOne({
      where: { id: post.id },
      include: [
        {
          model: Image,
        },
        {
          model: Comment,
          include: [
            {
              model: User, // 댓글 작성자
              attributes: ["id", "nickname"],
            },
          ],
        },
        {
          model: User, // 게시글 작성자
          attributes: ["id", "nickname"],
        },
        {
          model: User, // 게시글 작성자
          as: "Likers",
          attributes: ["id"],
        },
      ],
    });

    res.status(201).json(allPost);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post("/images", upload.array("image"), async (req, res, next) => {
  console.log(req.files);
  res.json(req.files.map((m) => m.filename));
});

router.post("/:postId/comment", async (req, res, next) => {
  try {
    const isPost = Post.findOne({
      where: { id: req.params.postId },
    });
    if (!isPost) {
      return res.status(403).send("삭제되었거나 없는 게시글입니다");
    }

    const comment = await Comment.create({
      content: req.body.content,
      PostId: req.params.postId,
      UserId: req.user.id,
    });

    const allComment = await Comment.findOne({
      where: { id: comment.id },
      include: [
        {
          model: User,
          attributes: ["id", "nickname"],
        },
      ],
    });

    res.status(201).json(allComment);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.patch("/:postId/like", async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.postId } });
    if (!post) {
      return res.status(403).send("존재하지 않는 게시글입니다.");
    }
    await post.addLikers(req.user.id);
    res.json({ PostId: post.id, UserId: req.user.id });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.delete("/:postId/like", async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.postId } });
    if (!post) {
      return res.status(403).send("존재하지 않는 게시글입니다.");
    }
    await post.removeLikers(req.user.id);
    res.json({ PostId: post.id, UserId: req.user.id });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.delete("/:postId", async (req, res, next) => {
  try {
    await Post.destroy({
      where: { id: req.params.postId, UserId: req.user.id },
    });
    res.status(200).json({ PostId: parseInt(req.params.postId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
