import { ApiError } from "../utils/Apierror.js";
import { asynchandler } from "../utils/asynchandler.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { Tweet } from "../models/tweet.model.js";
import { Like } from "../models/like.model.js";
import mongoose from "mongoose";


const createTweet = asynchandler( async (req , res) => {
    const {Tweet} = req.body 
    if(!Tweet) {
        throw new ApiError(400 , "Please write a tweet")
    }

    tweetRes = await Tweet.create({
        content:Tweet ,
        owner:req.user?._id
    })

    if(!tweetRes) {
        throw new ApiError(500 , "Something went wrong while creating tweet")
    }

    let newTweet = {
        ...tweetRes._doc , 
        owner: {
            fullname: req.user?.fullname,
            username: req.user?.username, 
            avatar : req.user?.avatar
        },
        totalLikes: 0,
        totalDislikes: 0,
        isLiked: false,
        isDisliked: false
    };

     return res.status(201).json(
        new ApiResponse(201 , newTweet , "Tweet created successfully")
    )
}) ;

const getUserTweets = asynchandler(async (req , res) => {
    const { userId } = req.params

    if( ! mongoose.isValidObjectId(userId) ) {
        throw new ApiError(400 , "Invalid user id")
    }

    const allTweets = Tweet.aggregate([
        {
            $match: { 
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        //sort by latest
        {
            $sort: {
                createdAt: -1
            }
        },
        //fetch likes of tweet
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes",
                pipeline:[{
                    $match: {
                        liked: true
                    }
                },
                {
                    $group: {
                        _id: "liked",
                        owners: {
                            $push: "$likedBy"
                        }
                    }
                }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "dislikes",
                pipeline:[{
                    $match: {
                        liked: false
                    }
                },
                {
                    $group:{
                        _id: "disliked",
                        owners: {
                            $push: "$likedBy"
                        }
                    }
                }
            ]
            }
        },
        //reshape likes and dislikes
        {
            $addFields: {
                likes: {
                    $cond: {
                        if:{
                            $gt: [{ $size : "$likes"} , 0 ]
                        },
                        then: {
                            $likes : "$likes.owners"
                        },
                        else: [],
                    }
                },
                dislikes: {
                    $cond: {
                        if: {
                            $gt : [{$size : "$dislikes"} , 0 ]
                        },
                        then: {
                            $dislikes : "$dislikes.owners"
                        },
                        else: []
                    }
                }

            }
        },
        //get owner details
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
            $unwind: "$owner"
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: 1,
                isOwner: {
                    $cond:{
                        if: { $eq: [req.user?._id , "$owner._id"] },
                            then: true,
                            else: false
                        }
                    }
                totalLikes: {
                    $size: "$likes"
                },
                totalDislikes: {
                    $size: "$dislikes"
                },
                isLiked: {
                    $cond: {
                        if: {
                            $in: [req.user?._id , "$likes"]
                        },
                        then: true,
                        else: false
                    }
                },
                isDisliked: {
                    $cond: {
                        if: {
                            $in: [req.user?._id , "$dislikes"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        }
    ])
    return res.status(200)
    .json(new ApiResponse(200 , allTweets , "All Tweets fetched successfully"))
});

const updateTweet = asyncHandler(async (req, res) => {
        const { tweetId } = req.params;
        const { tweet } = req.body;
        if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweetId");
        if (!tweet) throw new ApiError(400, "tweet content required");
      
        const updatedTweet = await Tweet.findByIdAndUpdate(
          tweetId,
          {
            $set: {
              content: tweet,
            },
          },
          {
            new: true,
          }
        );
        return res
          .status(200)
          .json(new ApiResponse(200, updatedTweet, "tweet updated successfully"));
      });

const deleteTweet = asyncHandler(async (req, res) => {
        const { tweetId } = req.params;

        if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweetId");

        const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

        if (!deletedTweet) throw new ApiError(404, "tweet not found");

        return res
          .status(200)
          .json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully"));
      });

      export {
        createTweet,
        getUserTweets,
        updateTweet,
        deleteTweet
      }