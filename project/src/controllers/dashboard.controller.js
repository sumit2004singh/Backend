import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Tweet } from "../models/tweet.model.js";
import mongoose , { isValidObjectId } from "mongoose";

const getChannelStas = asynchandler( async (req , res) => {
    const { userId } = req.params;

    if( !isValidObjectId(userId) || !(userId) ) {
        throw new ApiError(400 , "Invalid user id");
    }

    const VideoStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $project: {
                likesCount: { $size: "$likes" },
                viewsCount: "$views",
                totalVideos: 1,
            }
        },
        {
            $group: {
                _id: null,
                totalLikesCnt: { $sum: "$likesCount" },
                totalViewsCnt: { $sum: "$viewsCount" },
                totalVideos: { $sum: 1 }
            }
        }
    ])

    const subscribersStats = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                subscriberCnt: { $sum: 1 }
            }
        }
    ]);
    
    const tweetStats = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                tweetCnt: { $sum: 1 }
            }
        }
    ]);

    if(!(VideoStats && subscribersStats && tweetStats)) {
        throw new ApiError(400 , "Failed to fetch channel stats");
    }

    const stats = {
        subscriberCount: subscribersStats[0]?.subscriberCnt || 0,
        totalVideos: VideoStats[0]?.totalVideos || 0,
        totalLikes: VideoStats[0]?.totalLikesCnt || 0,
        totalViews: VideoStats[0]?.totalViewsCnt || 0,
        totalTweets: tweetStats[0]?.tweetCnt || 0
    }

    return res
        .status(200)
        .json(new ApiResponse(200, stats, "Channel stats fetched successfully")
    );
})

const getChannelVideos = asynchandler(async (req, res) => {
    const videos = await Video.aggregate([
        {
            $match: {
                owner: req.user?._id,
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            },
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes",
                },
            },
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments",
            },
        },
        {
            $addFields: {
                commentsCount: {
                    $size: "$comments",
                },
            },
        },
        {
            $project: {
                _id: 1,
                videoFile: 1,
                isPublished: 1,
                thumbnail: 1,
                likesCount: 1,
                commentsCount: 1,
                createdAt: 1,
                description: 1,
                title: 1,
                views: 1,
            },
        },
    ]);

    if (!videos) {
        throw new ApiError(404, "No videos found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

export {
    getChannelStas,
    getChannelVideos
}