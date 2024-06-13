import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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
    const existedUser=User.findOne({  //if we want to find by any one attribute then just write the attribute name
        $or: [{username}, {email}]  //here using or operator if any of them found then it will return that 
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exist");
    }
    
    //check avatar : will get from multer[multer puts file in local server, from that it will go to cloudinary]
    const avatarLocalPath=req.files?.avatar[0]?.path  //[0] gives first property, ? means optional(it may not present), path: will give proper path which multer uploaded on public/temp/...
    const coverImageLocalPath=req.files?coverImage[0]?.path

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

export {registerUser}