const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());

app.use("/", (req, res) => {
  const { name } = req.body;
  res.status(200).send({ message: `Hello ${name}!` });
});

app.listen(3001, () => {
  console.log("Formatter listening on port 3001");
});
