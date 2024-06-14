
//verify user basis of access and refresh token

import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model";

export const verifyJWT= asyncHandler(async(req,res, next)=>{
    //req,res has cookie details as we did cookie-parser in app.js
    try {
        const token=req.cookies?.accessToken ||     //accesstoken may not be present
            req.header("Authorization")?.replace("Bearer ","")
            if(!token){
                throw new ApiError(401, "unauthorized request") 
            }
            const decodedToken= jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
            const user = await User.findById(decodedToken?._id).select(
                "-password -refreshToken"
            )
            if(!user){
                throw new ApiError(401, "invalid access token")
            }
            req.user=user;
            next()
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid access token")
    }
    })