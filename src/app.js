import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}
))
// middleware use to check some certain things before accepting request from client
//  like isLoggedIn, isAdmin
// when onemiddleware completes work it send a flag named next
// server can check this next flag




app.use(express.json())   //data received from form (as json)
app.use(express.urlencoded({extended: true, limit:"16kb"}))   //data received from url  
app.use(express.static("public"))     //store file folder in my server, anyone can access  
app.use(cookieParser())     //to do CRUD on cookies of client browser by server


//routes import
import userRouter from './routes/user.routes.js'

//routes declaration
//we used app.get when we are not importing route like this
// now we need to use middleware to use router
app.use("/api/v1/users", userRouter)
// real url :: http://localhost:8000/api/v1/users/register

export {app}