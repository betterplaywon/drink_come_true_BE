const express = require("express");
const postRouter = require("./routes/post");
const app = express();

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

app.listen(3065, () => {
  console.log("서버 실행 중 체크");
});
