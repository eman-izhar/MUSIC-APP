const app = require("./src/app")
require ("dotenv").config()
const connectDB = require("./src/db/db")

connectDB();
app.listen(3000, ()=>{
    console.log("connected to port no 3000")
}
)


