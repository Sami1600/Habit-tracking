const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

async function createUser(req, res) {
  // console.log(req.body)
  try {
    const salt = await bcrypt.genSalt();
    const hashed = await bcrypt.hash(req.body.password_set, salt);
    const newUser = await User.createUser({
      ...req.body,
      password_set: hashed,
    });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ err: "User cannot be created" });
  }
}

async function login(req, res) {
  try {
    let user = await User.findByEmail(req.body.email);
    console.log(req.body);
    if (!user) {
      throw new Error("No user with this email");
    }
    const passwordCheck = await bcrypt.compare(
      req.body.password_set,
      user.password_set
    );
    if (passwordCheck) {
      const payload = { username: user.username, email: user.email };
      jwt.sign(
        payload,
        process.env.ACCESS_SECRET_TOKEN,
        { expiresIn: 60 },
        sendToken
      );
      function sendToken(err, token) {
        if (err) {
          throw new Error("Token could not be generated");
        }
        res.status(200).json({
          user,
          success: true,
          token: `Bearer ${token}`,
        });
      }
    } else {
      throw new Error("User could not be authenticated");
    }
  } catch (error) {
    res.status(401).json({ error: "User could not be logged in" });
  }
}

function verifyToken(req, res, next) {
  console.log('verifyToken function called')
  const header = req.headers["authorization"];
  if (header) {
    const token = header.split(" ")[1];
    jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, (err, data) => {
      //removed (err, data)
      if (err) {
        res.status(403).json({ err: "Token not verified" });
      } else {
        next();
      }
    });
  } else {
    res.sendStatus(403).json({ error: "Missing token" });
  }
}

module.exports = { createUser, login, verifyToken };
