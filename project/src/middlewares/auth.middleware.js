import { ApiError } from "../utils/Apierror";
import { asynchandler } from "../utils/asynchandler";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model";

export const verifyJWT = asynchandler(async (req , _ , next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer " , "")
    
        if (!token) {
            throw new ApiError(401 , "Unauthorized request")
        }
    
        const decodedTokken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
        
        const user = await  User.findById(decodedTokken?._id).select("-password -refreshToken") 
    
        if(!user) {
            throw new ApiError(401 , "Invalid access token")
        }
    
        req.user = user ;
        next()
    } catch (error) {
        throw new ApiError(401 , error?.message || "invalid access token")
    }

})