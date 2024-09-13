import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


// Publish a new video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const { file } = req;  // Assuming the file is uploaded via middleware like multer
    const userId = req.user._id;

    if (!file) {
        throw new ApiError(400, "Video file is required");
    }

    const uploadResult = await uploadOnCloudinary(file.path, "video");
    const thumbnailUploadResult = await uploadOnCloudinary(file.path, "image"); // Assuming you generate a thumbnail

    const newVideo = await Video.create({
        title,
        description,
        videoFile: uploadResult.url,
        thumbnail: thumbnailUploadResult.url,
        duration: uploadResult.duration,  // Assuming the duration is retrieved from cloudinary
        owner: userId,
    });

    res.status(201).json(new ApiResponse(201, "Video uploaded successfully", newVideo));
});

// Get video by ID
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId).populate("owner", "username fullName");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    res.status(200).json(new ApiResponse(200, "Video fetched successfully", video));
});

// Delete a video by ID
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findByIdAndDelete(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    res.status(200).json(new ApiResponse(200, "Video deleted successfully"));
});

export {
    publishAVideo,
    getVideoById,
    deleteVideo,
};
