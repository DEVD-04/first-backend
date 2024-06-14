import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"  //bearer token :: whoever has this token got that specific permission for specific time
import bcrypt from "bcrypt"     //to encrypt password

const userSchema = new Schema(
    {
        username:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index:true,     //to make the field searchable optimally
        },
        email:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName:{
            type: String,
            required: true,
            trim: true,
            index:true
        },
        avatar:{
            type: String,   //from cloudinary
            required: true
        },
        coverImage:{
            type: String,   //from cloudinary
        },
        watchHistory:[{
            type: Schema.Types.ObjectId,
            ref: "Video"
        }],
        password:{
            type: String,
            required: [true,"password is required"]
        },
        refreshToken:{
            type:String
        }
},{timestamps:true}
)

//to execute some code(here encrypting) just before some event on the object(here saving) [like middleware it has next]
userSchema.pre("save", async function(next) {       //encrypt algo requires time so use async   
                                                    //here arrow function will not work, because arrow function doesn't know about context('this' keyword)
    if(!this.isModified("password")) return next(); //when password is not modified, dont do anything
    this.password=await bcrypt.hash(this.password, 10);
    next();                                               
})   

// write some custom methods
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}
userSchema.methods.generateAccessToken = function(password){
    return jwt.sign(   //to generate token
        {   //payload in sign method
            _id: this._id,      //get this from database(mongodb)
            email: this.email,
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(   //to generate token
        {   //payload in sign method
            _id: this._id,      //get this from database(mongodb)
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User", userSchema)