import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const getVideoComments = asynchandler( async (req , res) => {
    const { videoId } = req.params;
    const { page = 1 , limit =10 } = req.query;

    if(!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400 , "Invalid video id");
    }

    const getComments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $sort: {
                createdAt: -1
            },
        
        },
        {
            $skip: ( page - 1 ) * limit
        },
        {
            $limit: parseInt(limit)
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
                            username: 1,
                            avatar: 1,
                            _id: 1
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
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes",
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                isLiked: {
                    $cond: {
                        if: {
                            $in: [req.user?._id , "$likes.likedBy"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                _id: 1,
                username: 1,
                avatar: 1,
                likesCount: 1,
                isLiked: 1,
                content: 1,
                owner: 1,
                createdAt: 1,
            }
        }
    ]);

    if (!getComments) {
        throw new ApiError(500 , "Something went wrong while fetching comments");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, getComments, "Comments fetched successfully"));
})

const addComment = asynchandler( async (req , res) => {
    const { content } = req.body;
    const { videoId } = req.params;

    if(!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400 , "Invalid video id");
    }

    if(!content.trim()) {
        throw new ApiError(400 , "Please write a comment");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    if(!comment){
        throw new ApiError(500 , "Something went wrong while adding comment");
    }

    return res
        .status(200)
        .json(new ApiResponse(200 , comment , "Comment added successfully"))
})

const updateComment = asynchandler(async(req , res) => {
    const { content } = req.body;
    const { commentId } = req.params;

    if(!content.trim()){
        throw new ApiError(400 , "comment cannot be empty")
    }

    if(!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400 , " invalid comment Id")
    }

    const comment = await findById(commentId);

    if(!comment) {
        throw new ApiError(500 , " comment not found ")
    }

    if(comment.owner.toString() !== req.user?.Id.toString()){
        throw new ApiError(401 , " you do not have permission to upadte the comment ")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: { content },
        },
        {
            new : true
        }
    )

    if(!updatedComment) {
        throw new ApiError(400 , "error while updating comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200 , updateComment , " comment updated successfully"))
})

const deleteComment = asynchandler(async(req ,res) => {
    const { commentId } = req.params;

    if(!commentId || isValidObjectId(commentId)){
        throw new ApiError(400 , " invalid comment id")
    }

    const comment = await Comment.findById(commentId);

    if(!comment.trim()){
        throw new ApiError(500 , "comment not found")
    }

    if(comment.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(401 , "you are not authorised to do this ")
    }

    const deleteComment = await Comment.findByIdAndDelete(commentId);

    if(!deleteComment){
        throw new ApiError(400 , "error while deleting comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200 , deleteComment , "comment deleted successfully"))
})

export{
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}