require ("dotenv").config()
const app = require("./src/app")
const connectDB = require("./src/db/db")

connectDB();
const port = process.env.PORT || 3001;
app.listen(port, ()=>{
    console.log(`connected to port no ${port}`)
}
)


