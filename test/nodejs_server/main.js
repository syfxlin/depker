const { createServer } = require("node:http");

const app = createServer((req, res) => {
  res.end("<h1>depker</h1>");
});

app.listen(80);
