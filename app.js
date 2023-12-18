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

const covertUserTweetDBObjToResponseObj = (DbObj) => {
  return {
    username: DbObj.username,
    tweet: DbObj.tweet,
    dateTime: DbObj.date_time,
  };
};
//middleware function
const authenticateToken = async (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (authHeader === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "bhanu", (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        //console.log(request.username);
        next();
      }
    });
  }
};

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
      console.log(jwtToken);
      response.send({ jwtToken });
    }
  }
});

//get request
app.get("/user/tweets/feed/", authenticateToken, async (request, response) => {
  const getUserTweetQuery = `select username,tweet,date_time
    from user natural join tweet`;
  const userTweetresult = await db.all(getUserTweetQuery);
  //console.log(userTweetresult);
  response.send(
    userTweetresult.map((UT) => covertUserTweetDBObjToResponseObj(UT))
  );
});

//get request
app.get("/user/following/", authenticateToken, async (request, response) => {
  // const request.username = request.body;
  //console.log(request.username);
  const userName = request.username;
  const getUserQuery = `select user_id from user where username='${userName}'`;
  const getUserID = await db.get(getUserQuery);
  console.log(getUserID);
  //const getFollowingNamesQuery = `select * from user where user_id=${getUserID.user_id}`;
  const getFollowingNamesQuery = `select following_user_id,name 
  from user join follower 
  on user.user_id=follower.follower_id 
  group by user_id=${getUserID.user_id}`;
  const names = await db.all(getFollowingNamesQuery);
  console.log(names);
});

//get request
app.get("/user/followers/", authenticateToken, async (request, response) => {
  //   const { userName } = request.body;
  //const userName = "bhanu111";
  const userName = request.username;
  const getUserQuery = `select user_id from user where username='${userName}'`;
  const getUserID = await db.get(getUserQuery);

  const getFollowingNamesQuery = `select name  
  from user join follower 
  on user.user_id=follower.follower_id 
  where user_id
  group by user_id=${getUserID.user_id}`;
  const names = await db.all(getFollowingNamesQuery);
  response.send(names);
});

//get request
app.get("/tweets/:tweetId/", async (request, response) => {
  const { tweetId } = request.params;
});
