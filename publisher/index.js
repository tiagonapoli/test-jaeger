const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());

app.use("/", async (req, res) => {
  const { message } = req.body;
  console.log(message);
  res.status(200).end();
});

app.listen(3000, () => {
  console.log("Publisher listening on port 3000");
});
