import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Function to toggle like on a video
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user.id; // Assuming the user ID is available in req.user

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

    if (existingLike) {
        await existingLike.remove();
        res.status(200).json(new ApiResponse(200, "Video like removed"));
    } else {
        const newLike = new Like({ video: videoId, likedBy: userId });
        await newLike.save();
        res.status(201).json(new ApiResponse(201, "Video liked"));
    }
});


// Function to get all liked videos
const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user.id; // Assuming the user ID is available in req.user

    const likes = await Like.find({ likedBy: userId, video: { $exists: true } }).populate('video');

    const likedVideos = likes.map(like => like.video);

    res.status(200).json(new ApiResponse(200, likedVideos));
});

export {
    toggleVideoLike,
    getLikedVideos
};
