import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Toggle subscription: Subscribe/Unsubscribe a user to a channel
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user._id;  // Assuming req.user contains the authenticated user's details

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    if (subscriberId.toString() === channelId) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    // Check if the subscription already exists
    const existingSubscription = await Subscription.findOne({ subscriber: subscriberId, channel: channelId });

    if (existingSubscription) {
        // If the subscription exists, unsubscribe (delete the record)
        await Subscription.deleteOne({ _id: existingSubscription._id });
        return res.status(200).json(new ApiResponse(200, "Unsubscribed successfully"));
    } else {
        // If the subscription does not exist, subscribe (create a new record)
        const newSubscription = await Subscription.create({
            subscriber: subscriberId,
            channel: channelId
        });
        return res.status(201).json(new ApiResponse(201, "Subscribed successfully", newSubscription));
    }
});

export {
    toggleSubscription,
};
