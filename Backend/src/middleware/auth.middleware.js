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
    next(); // if the user is an artist, proceed to the next middleware or route handler
    req.user = decoded; // store the decoded user information in the request object for further use , req k andar aik new property create hogi user k naaam sy

  } catch (err) {
    console.log(err);
    return res.status(401).json({
      message: "unauthorized",
    });
  }
}



module.exports = {authArtist}