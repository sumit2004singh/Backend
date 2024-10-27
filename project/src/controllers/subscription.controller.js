import { asyncHandler } from "../utils/asynchandler.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose , { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const toggleSubscription = asyncHandler(async (req , res) => {
    const { channelId } = req.params;

    if( !channelId || !isValidObjectId(channelId) ) {
        throw new ApiError(400 , "Invalid channel id");
    }

    if (channelId.toString() === req.user?._id.toString()) {
        throw new ApiError(400 , "You can't subscribe to your own channel");
    }

    const isSubscribed = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId
    });

    if (isSubscribed) {
        const unsubscribe = await Subscription.findByIdAndDelete(isSubscribed);
        if (!unsubscribe) {
            throw new ApiError(500 , "Something went wrong while unsubscribing");
        }
    } else {
        const subscribe = await Subscription.create({
            subscriber: req.user?._id,
            channel: channelId,
        });

        if (!subscribe) {
            throw new ApiError(500 , "Something went wrong while subscribing");
        }
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {} , "Subscription toggled successfully"));
})

const getUserChannelSubscribers = asyncHandler(async (req , res) => {
    const { channelId } = req.params;

    if( !channelId || isValidObjectId(channelId)) {
        throw new ApiError(400 , "Invalid channel id");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers"
            }
        },
        {
            $addFields: {
                subscribers: {
                    $first: "$subscribers"
                }
            }
        },
        {
            $group: {
                _id: null,
                subscribers: { $push: "$subscribers" },
                totalSubscribers: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                subscribers: {
                    fullname: 1,
                    username: 1,
                    avatar: 1
                },
                subscribersCount: "$totalSubscribers"
            }
        }
    ]);

    if( !subscribers || subscribers.length === 0 ) {
        throw new ApiError(404 , "No subscribers found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200 , subscribers , "Subscribers fetched successfully"));
})

const getSubscribedChannels = asyncHandler(async (req , res) => {
    const { subscriberId } = req.params;

    if( !subscriberId || !isValidObjectId(subscriberId)) {
        throw new ApiError(400 , "Invalid subscriber id");
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails"
            }
        },
        {
            $unwind: "$channelDetails"
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "channel",
                foreignField: "channel",
                as: "channelSubscribers",
            }
        },
        {
            $addFields: {
                "channelDetails.isSubscribed": {
                    $cond: {
                        if: {
                            $in: [new mongoose.Types.ObjectId(req.user?._id) , "$channelSubscribers.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                },
                "channelDetails.subscribersCount": {
                    $size: "$channelSubscribers"
                }
            }
        },
        {
            $group: {
                _id: null,
                channels: { $push: "$channelDetails" },
                totalChannels: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                channels: {
                    _id: 1,
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                    subscribersCount: 1,
                    isSubscribed: 1
                },
                channelsCount: "$totalChannels"
            }
        }
    ]);

    if( !subscribedChannels || subscribedChannels.length === 0 ) {
        throw new ApiError(404 , "No channels found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200 , subscribedChannels[0] , "Subscribed channels fetched successfully"));
})

export { toggleSubscription , getUserChannelSubscribers , getSubscribedChannels }