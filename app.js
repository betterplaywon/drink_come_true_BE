const express = require("express");
const postRouter = require("./routes/post");
const postsRouter = require("./routes/posts");
const userRouter = require("./routes/user");
const cors = require("cors");
const app = express();
const db = require("./models");
const passport = require("passport");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const morgan = require("morgan");

const passportConfig = require("./passport");

dotenv.config();

db.sequelize
  .sync()
  .then(() => {
    console.log("db connect success");
  })
  .catch(console.error);

passportConfig();

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

app.listen(3065, () => {
  console.log("서버 실행 중 체크");
});
