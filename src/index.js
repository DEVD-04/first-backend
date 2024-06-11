// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})

connectDB()
.then(()=>{
    let connectedPort=process.env.PORT || 8000
    app.listen( connectedPort, ()=>{ 
        console.log(`app is listening on ${connectedPort}`)
    })
})
.catch((error)=>{
    console.log("mongodb connection failed ",error)
})
