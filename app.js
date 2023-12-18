const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const jwt = require("jsonwebtoken");
const dbPath = path.join(__dirname, "twitterClone.db");
let db = null;
const intializeDBandServer = async () => {
  try {
    db = open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`server running at http://localhost:3000`);
    });
  } catch (e) {
    console.log(`${e.message}`);
  }
};
intializeDBandServer();

//get request
app.post("/register/", async (request, response) => {
  const { username, password, name, gender } = request.body;
  //console.log(username);
  const getUserQuery = `select * from user where username='${username}'`;
  const getUser = await db.get(getUserQuery);
  if (getUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  }
});
