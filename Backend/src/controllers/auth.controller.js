const userModel = require("../models/user.models");
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")

async function resgisterUser(req, res) {
  const { username, email, password, role = "user" } = req.body;

  const isUserALreadyExists = await userModel.findOne({
    $or: [{ username }, { email }],
  });
  if (isUserALreadyExists) {
    return res.status(409).json({
      message: "user already exists",
    });
  }
  const hash = await bcrypt.hash(password, 10)

const user = await userModel.create({
        username,
        email,
        password:hash,
        role
})
const token = jwt.sign({ //jwt.sign() is used to generate a token
        id:user._id,
        role: user.role
}, process.env.JWT_SECRET)

res.cookie("token", token) //cookie is set in the browser

res.status(201).json({
        message:"user registered successfully",
        user:{
                id:user._id,
                username: user.username,
                email:user.email,
                role: user.role,
        }
})
}

module.exports = { resgisterUser };
