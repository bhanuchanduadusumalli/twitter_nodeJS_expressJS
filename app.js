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
    db = await open({
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
  } else {
    if (password.length < 6) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const createUserQuery = `
      INSERT INTO 
        user (name,username, password,gender) 
      VALUES 
        (
           '${name}',
          '${username}', 
          '${hashedPassword}', 
          '${gender}'
        )`;
      await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

//post login request
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  console.log(username);
  const getUserFromDbQuery = `select * from user where username='${username}'`;
  const userFromDB = await db.get(getUserFromDbQuery);
  console.log(userFromDB);
  if (userFromDB === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      userFromDB.password
    );
    if (isPasswordMatched !== true) {
      response.status(400);
      response.send("Invalid password");
    } else {
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "bhanu");
      response.send({ jwtToken });
    }
  }
});
