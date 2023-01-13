const express = require("express");
const postRouter = require("./routes/post");
const postsRouter = require("./routes/posts");
const userRouter = require("./routes/user");
const hashtagRouter = require("./routes/hashtag");
const cors = require("cors");
const app = express();
const db = require("./models");
const passport = require("passport");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const morgan = require("morgan");
const path = require("path");
const passportConfig = require("./passport");

dotenv.config();

db.sequelize
  .sync()
  .then(() => {
    console.log("db connect success");
  })
  .catch(console.error);

passportConfig();

app.use("/", express.static(path.join(__dirname, "uploads"))); // image upload 관련 코드, static은 디렉토리 네임이 현재 폴더이고 업로드를 합쳐준다는 의미.
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // FE에서 보낸 데이터를 req.body에 넣어주겠다
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser(process.env.DRINK_SECRET));
app.use(
  session({
    saveUninitialized: false,
    resave: false,
    secret: process.env.DRINK_SECRET,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/post", postRouter);
app.use("/posts", postsRouter);
app.use("/user", userRouter);
app.use("/hashtag", hashtagRouter);

app.listen(3065, () => {
  console.log("서버 실행 중 체크");
});
