const jwt = require("jsonwebtoken");

async function authArtist(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({
      message: "unauthorized",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "artist") {
      return res.status(403).json({
        message: "you dont have access",
      });
    }
    req.user = decoded; // store the decoded user information in the request object for further use , req k andar aik new property create hogi user k naaam sy
    next(); // if the user is an artist, proceed to the next middleware or route handler
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      message: "unauthorized",
    });
  }
}

async function authUser(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({
      message: "unauthorized",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role != "user") {
      return res.status(403).json({
        message: "you dont have access",
      });
    }
    req.user = decoded;
    next();
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      message: "unauthorized",
    });
  }
}

async function authAuthenticated(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({
      message: "unauthorized",
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({
      message: "unauthorized",
    });
  }
}

module.exports = { authArtist, authUser, authAuthenticated };
