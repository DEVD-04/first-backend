import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens= async(userId)=>{
    try{
        const user=await User.findById(userId);
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();

        //saving refreshTokenin database
        user.refreshToken=refreshToken;  //update user
        await user.save({validateBeforeSave: false})     //save user, but it will want all required fields, to avoid this use validateBeforeSave

        return {accessToken, refreshToken};
    }
    catch(error){
        throw new ApiError(500, "something went wrong while generating access and refresh token")
    }
}

const registerUser = asyncHandler(async (req,res)=>{
    // get user detail from frontend
    //validation -> non-empty
    //check if user already exist[ check from username,email]
    // check for image, avatar
    //upload to cloudinary, check avatar upload
    // create user object - create entry in db
    // remove password and refreshtokenfield from response
    // check for user creation
    // return res

    const {fullname, email, username, password}= req.body
    // console.log("email : ",email);

    //validation
    // if(fullname===""){   //one property check at a time
    //     throw new ApiError(400, "fullname is required")
    // }
    //another method    //multi property check
    if([fullname,email,username,password].some((field)=>
        field?.trim()==="") //if after trimming any field is empty then throw error
                            // ? means if there is field then trim, otherwise not
    ){
        throw new ApiError(400, "all fields required")
    }

    //check user already exist or not
    // we'll check from database if that user exist or not
    //use user.model as it directly connected to database
    const existedUser= await User.findOne({  //if we want to find by any one attribute then just write the attribute name
        $or: [{username}, {email}]  //here using or operator if any of them found then it will return that 
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exist");
    }
    
    //check avatar and coverImage : will get from multer [multer puts file in local server, from that it will go to cloudinary]
    const avatarLocalPath=req.files?.avatar[0]?.path  //[0] gives first property, ? means optional(it may not present), path: will give proper path which multer uploaded on public/temp/...
    // const coverImageLocalPath=req.files?coverImage[0]?.path     //if there is no coverimage then we are trying to access 0th element, gives error

    //better way
    let coverImageLocalPath;
    if(req.files!==null && Array.isArray(req.files.coverImage)  //it is files not file because at user router we are taking array consisting  avatar and coverimage
    && req.files.coverImage.length>0)
    {
        coverImageLocalPath=req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file required")
    }
    //if no error upload on cloudinary
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar){    //because avatar is req.
        throw new ApiError(400, "Avatar file required")
    }

    //upload on database
    const user= await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",  //it means if there is coverImage then send url otherwise blank
        email,
        password,
        username: username.toLowerCase(),
    })
    
    //check if user successfully created
    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"   //remove password and refreshtoken field
    )

    if(!createdUser){
        throw new ApiError(500, "something went wrong registering user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})

const loginUser = asyncHandler(async (req,res)=>{
    // take data from req.body
    // username or email to login
    // find user
    // if user not found : show message
    // if user found check password
    // if password not match : show message
    // if match::  generate access and refreshtoken
    // send cookies
    // send response

    const{email, username, password}=req.body;
    if(!username && !email){
        throw new ApiError(400, "username or email not found")
    }

    const user =await User.findOne({    //User is from mongoose, user is created by us
        $or: [{username}, {email}]
    })
    if(!user){
        throw new ApiError(404, "user does not exist")
    }
    
    const isPasswordValid = await user.isPasswordCorrect(password)  //isPasswordCorrect comes from user.model custom written methods
    if(!isPasswordValid){
        throw new ApiError(401, "invalid user credential")
    }

    // generate access and refreshtoken [method written earlier]
    const {refreshToken,accessToken}= await generateAccessAndRefreshTokens(user._id)

    // send in cookies
    const loggedInUser= await User.findById(user._id).select
    ("-password -refreshToken")

    //to make cookies secure[non-modifiable]
    const options={
        httpOnly: true,
        secure: true
    }
    // send cookie(need cookie-parser which was installed) and response
    return res.status(200)  
    .cookie("accessToken", accessToken, options)  //key,value,options
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,
            {   //data
                user: loggedInUser,accessToken,refreshToken
            },
            "user Loggedin successfully"    //message
        )
    )
    // 

})

const logOutUser= asyncHandler(async(req,res)=>{
    //clear cookies
    //reset refresh token from database

    //to get instance of user which wants to logout we want to design a middleware
    //in that middleware we put req.user=user, now we have user instance in req
    await User.findByIdAndUpdate(
        req.user._id,{
            $set: {
                refreshToken:undefined
            }
        },
        {
            new : true  //it will give updated user as return 
        }
    )
    const options={
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200,{},"User logged out"))

})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
    if(!incomingRefreshToken){
        throw new ApiError (401, "unauthorized request")
    }

    try {
        const decodedToken=jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user=await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError (401, "invalid refresh token")
        }
    
        if(incomingRefreshToken!== user?.refreshToken){
            throw new ApiError(401, "refresh token expired")
        }
    
        const options={
            httpOnly : true,
            secure: true
        }
    
        const {accessToken,newRefreshToken}= await generateAccessAndRefreshTokens(user._id)
    
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200,
                {accessToken, refreshToken:newRefreshToken}
            ),
            "access token refreshed successfully"
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword} = req.body
    // if it can chabge password then it is logged in, 
    // as there is middleware auth, req.user has info about user
    const user= await User.findById(req.user?._id)

    //ispasswordcorrect from user model
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "invalid old password")
    }

    //saving new password to database
    user.password= newPassword
    user.save({validateBeforeSave: false})

    return res.status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"))

})

const getCurrentUser = asyncHandler(async(req,res)=>{
    // if it is logged in, 
    // as there is middleware auth, req.user has info about user
    return res
    .status(200)
    .json(200, req.user, "current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName, email}=req.body
    if(!fullName || !email){
        throw new ApiError(400, "all fields required")
    }

    const user=User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email,
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path;     //it is coming from multer

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file missing")
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "error while uploading avatar on cloudinary")
    }

    const user=await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new : true}
    ).select("-password")

    return res.status(200)
    .json(200, user, "avatar image updated successfully")
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path;     //it is coming from multer

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image file missing")
    }

    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "error while uploading cover Image on cloudinary")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new : true}
    ).select("-password")
    
    return res.status(200)
    .json(200, user, "cover image updated successfully")
})


export {registerUser,
    loginUser, logOutUser,
    refreshAccessToken, changeCurrentPassword,
    getCurrentUser, updateAccountDetails,
    updateUserAvatar, updateUserCoverImage,
}