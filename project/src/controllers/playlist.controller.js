import { ApiError } from "../utils/ApiError.js";
import { asynchandler } from "../utils/asynchandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import mongoose , { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";

const createPlaylist = asynchandler( async (req , res) => {
    const {name , description } = req.body

    if(!name || name.trim() === "") {
        throw new ApiError(400 , "Playlist name is required");
    }

    const playlist = await Playlist.create({
        name,
        description: description || "",
        owner: req.user?._id,
    });

    if(!playlist) {
        throw new ApiError(500 , "Something went wrong while creating playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist created successfully"));
})

const getUserPlaylists = asynchandler( async (req , res) => {
    const { userId } = req.params;

    if( !mongoose.isValidObjectId(userId) || !(userId) ) {
        throw new ApiError(400 , "Invalid user id");
    }

    const playlists = await Playlist.find({ owner: userId });

    if(!playlists) {
        throw new ApiError(500 , "Something went wrong while fetching playlists");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "Playlists fetched successfully"));
})

const getPlaylistById = asynchandler( async (req , res) => {
    const { playlistId } = req.params;

    if( !isValidObjectId(playlistId) || !(playlistId) ) {
        throw new ApiError(400 , "Invalid playlist id");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist) {
        throw new ApiError(500 , "Something went wrong while fetching playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
})

const addVideoToPlaylist = asynchandler( async (req , res) => {
    const { videoId , playlistId } = req.params;

    if( !isValidObjectId(playlistId) || !(playlistId) ) {
        throw new ApiError(400 , "Invalid playlist id");
    }

    if( !isValidObjectId(videoId) || !(videoId) ) {
        throw new ApiError(400 , "Invalid video id");
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist) {
        throw new ApiError(500 , "Something went wrong while fetching playlist");
    }

    const video = await Video.findById(videoId);
    if(!video) {
        throw new ApiError(500 , "Something went wrong while fetching video");
    }

    if(playlist?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400 , "You are not authorized to add videos to this playlist");
    }

    if(playlist.videos.includes(videoId)) {
        throw new ApiError(400 , "Video already exists in playlist");
    }

    const addToPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if(!addToPlaylist) {
        throw new ApiError(500 , "Something went wrong while adding video to playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, addToPlaylist, "Video added to playlist successfully"));
})

const removeVideoFromPlaylist = asynchandler( async (req , res) => {
    const { videoId , playlistId } = req.params;

    if( !isValidObjectId(playlistId) || !(playlistId) ) {
        throw new ApiError(400 , "Invalid playlist id");
    }

    if( !isValidObjectId(videoId) || !(videoId) ) {
        throw new ApiError(400 , "Invalid video id");
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist) {
        throw new ApiError(500 , "Something went wrong while fetching playlist");
    }

    const video = await Video.findById(videoId);
    if(!video) {
        throw new ApiError(500 , "Something went wrong while fetching video");
    }

    if(playlist?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400 , "You are not authorized to remove videos from this playlist");
    }

    if(!playlist.videos.includes(videoId)) {
        throw new ApiError(400 , "Video does not exist in playlist");
    }

    const removeFromPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: {
                    $in: [`${videoId}`],
                }
            }
        },
        {
            new: true
        }
    )

    if(!removeFromPlaylist) {
        throw new ApiError(500 , "Something went wrong while removing video from playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, removeFromPlaylist, "Video removed from playlist successfully"));
})

const deletePlaylist = asynchandler( async (req , res) => {
    const { playlistId } = req.params;

    if( !isValidObjectId(playlistId) || !(playlistId) ) {
        throw new ApiError(400 , "Invalid playlist id");
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist) {
        throw new ApiError(500 , "Something went wrong while fetching playlist");
    }

    if(playlist?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400 , "You are not authorized to delete this playlist");
    }

    const deletePlaylist = await Playlist.findByIdAndDelete(playlistId);
    if(!deletePlaylist) {
        throw new ApiError(500 , "Something went wrong while deleting playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, deletePlaylist, "Playlist deleted successfully"));
})

const updatePlaylist = asynchandler( async (req , res) => {
    const { playlistId } = req.params;
    const { name , description } = req.body;

    if( !isValidObjectId(playlistId) || !(playlistId) ) {
        throw new ApiError(400 , "Invalid playlist id");
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist) {
        throw new ApiError(500 , "Something went wrong while fetching playlist");
    }

    if(!name && !description) {
        throw new ApiError(400 , "Name or description is required");
    }

    if(playlist?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400 , "You are not authorized to update this playlist");
    }

    const updatePlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
          $set: { 
            name: name || playlist?.name,
            description: description || playlist?.description
            }
        },
        {
            new: true
        }
    );

    if(!updatePlaylist) {
        throw new ApiError(500 , "Something went wrong while updating playlist");    
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatePlaylist, "Playlist updated successfully"));
})

const getVideoPlaylist = asynchandler( async (req , res) => {
    const { videoId } = req.params;

    if( !isValidObjectId(videoId) || !(videoId) ) {
        throw new ApiError(400 , "Invalid video id");
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            },
        },
        {
            $project: {
                name: 1,
                isVideoPresent: {
                    $cond: {
                        if: {
                            $in: [ new mongoose.Types.ObjectId(videoId) , "$videos" ]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        }
    ]);

    if(!playlist) {
        throw new ApiError(500 , "Something went wrong while fetching playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    getVideoPlaylist,
}
