import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get the channel stats: total video views, total subscribers, total videos, total likes, etc.
const getChannelStats = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Total subscribers
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });

    // Total videos uploaded by the channel
    const totalVideos = await Video.countDocuments({ uploadedBy: channelId });

    // Total video views
    const totalVideoViews = await Video.aggregate([
        { $match: { uploadedBy: mongoose.Types.ObjectId(channelId) } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } },
    ]);

    const totalViews = totalVideoViews.length > 0 ? totalVideoViews[0].totalViews : 0;

   
    const stats = {
        totalSubscribers,
        totalVideos,
        totalViews,
    };

    res.status(200).json(new ApiResponse(200, "Channel stats fetched successfully", stats));
});

// Get all videos uploaded by the channel
const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const videos = await Video.find({ uploadedBy: channelId });

    if (!videos || videos.length === 0) {
        throw new ApiError(404, "No videos found for this channel");
    }

    res.status(200).json(new ApiResponse(200, "Videos fetched successfully", videos));
});

export {
    getChannelStats,
    getChannelVideos
};
