import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!content) {
        throw new ApiError(400, "Content is required");
    }

    // Validate videoId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const newComment = new Comment({
        content,
        video: videoId,
        owner: userId
    });

    await newComment.save();

    res.status(201).json(new ApiResponse(201, "Comment added successfully", newComment));
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content) {
        throw new ApiError(400, "Content is required");
    }

    // Validate commentId
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findOneAndUpdate(
        { _id: commentId, owner: userId },
        { content },
        { new: true, runValidators: true }
    );

    if (!comment) {
        throw new ApiError(404, "Comment not found or user not authorized");
    }

    res.status(200).json(new ApiResponse(200, "Comment updated successfully", comment));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    // Validate commentId
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findOneAndDelete({ _id: commentId, owner: userId });

    if (!comment) {
        throw new ApiError(404, "Comment not found or user not authorized");
    }

    res.status(200).json(new ApiResponse(200, "Comment deleted successfully"));
});

export {
    addComment,
    updateComment,
    deleteComment
};
