const userModel = require("../models/user.models");

async function resgisterUser(req, res) {
 
        const {username, email, password, role='user'}  = req.body;

}

module.exports = { resgisterUser };