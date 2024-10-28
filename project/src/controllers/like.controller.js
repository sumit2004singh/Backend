import { ApiError } from "../utils/ApiError.js";
import { asynchandler } from "../utils/asynchandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";
import mongoose , { isValidObjectId } from "mongoose";

const toggleVideoLike = asynchandler( async (req , res) => {
    const { videoId } = req.params;

    if( !isValidObjectId(videoId) || !(videoId) ) {
        throw new ApiError(400 , "Invalid video id");
    }

    const isLiked = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    })

    if(isLiked) {
        const removeLike = await Like.findByIdAndDelete(isLiked._id);
        if(!removeLike) {
            throw new ApiError(500 , "Something went wrong while removing like");
        }
    } else {
        const liked = await Like.create({
            video: videoId,
            likedBy: req.user?._id
        })
        if(!liked) {
            throw new ApiError(500 , "Something went wrong while adding like");
        }
    }

    return res
        .status(200)
        .json(new ApiResponse(200 ,{} , "Like toggled successfully"))
})

const toggleCommentLike = asynchandler( async (req , res) => {
    const { commentId } = req.params;

    if( !isValidObjectId(commentId) || !(commentId) ) {
        throw new ApiError(400 , "Invalid comment id");
    }

    const isLiked = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })

    if(isLiked) {
        const removeLike = await Like.findByIdAndDelete(isLiked._id);
        if(!removeLike) {
            throw new ApiError(500 , "Something went wrong while removing like");
        }
    } else {
        const liked = await Like.create({
            comment: commentId,
            likedBy: req.user?._id
        })
        if(!liked) {
            throw new ApiError(500 , "Something went wrong while adding like");
        }
    }

    return res
        .status(200)
        .json(new ApiResponse(200 ,{} , "Like toggled successfully"))
})

const toggleTweetLike = asynchandler( async (req , res) => {
    const { tweetId } = req.params;

    if( !isValidObjectId(tweetId) || !(tweetId) ) {
        throw new ApiError(400 , "Invalid tweet id");
    }

    const isLiked = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    if(isLiked) {
        const removeLike = await Like.findByIdAndDelete(isLiked._id);
        if(!removeLike) {
            throw new ApiError(500 , "Something went wrong while removing like");
        }
    } else {
        const liked = await Like.create({
            tweet: tweetId,
            likedBy: req.user?._id
        })
        if(!liked) {
            throw new ApiError(500 , "Something went wrong while adding like");
        }
    }

    return res
        .status(200)
        .json(new ApiResponse(200 ,{} , "Like toggled successfully"))
})

const getLikedVedios = asynchandler( async (req , res) => {
    const { page = 1 , limit = 10 } = req.query;

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $match: { isPublished: true }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                video: {
                    $first: "$video"
                }
            }
        },
        {
            $match: {
                video: { $exists: true }, //filterout non-video documents
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $skip: ( page - 1 ) * limit
        },
        {
            $limit: parseInt(limit)
        }
    ]);

    if(!likedVideos) {
        throw new ApiError(500 , "Something went wrong while fetching liked videos");
    }

    return res
        .status(200)    
        .json(new ApiResponse(200 , likedVideos , "Liked videos fetched successfully"))
})

export{
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVedios
}