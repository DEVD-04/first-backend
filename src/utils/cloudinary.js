import {v2 as cloudinary} from "cloudinary"
import fs from "fs" //file system in nodejs, read,write,remove file

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});


// funtion to upload on cloudinary :: local file path as parameter, 
const uploadOnCloudinary = async (localFilePath)=>{
    try{
        if(!localFilePath) return null;
        //now upload file
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        //file uploaded successfully
        console.log("file uploaded on cloudinary", response.url);
        return response;

    }catch(error){
        fs.unlinkSync(localFilePath)    //remove locally saved temp file as upload got failed
        return null;
    }
}

export {uploadOnCloudinary}