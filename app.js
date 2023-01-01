const express = require("express");
const postRouter = require("./routes/post");
const userRouter = require("./routes/user");
const cors = require("cors");
const app = express();
const db = require("./models");

const passportConfig = require("./passport");

db.sequelize
  .sync()
  .then(() => {
    console.log("db connect success");
  })
  .catch(console.error);

passportConfig();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // FE에서 보낸 데이터를 req.body에 넣어주겠다
app.use(
  cors({
    origin: "*",
  })
);

app.get("/", (req, res) => {
  res.send("HELLO EXPRESS");
});

app.get("/", (req, res) => {
  res.send("hello API");
});

app.get("/posts", (req, res) => {
  res.json([
    { id: 1, content: "위스키1병" },
    { id: 2, content: "위스키2병" },
    { id: 3, content: "위스키3병" },
  ]);
});

app.use("/post", postRouter);
app.use("/user", userRouter);

app.listen(3065, () => {
  console.log("서버 실행 중 체크");
});
