import {v2 as cloudinary} from "cloudinary"
import fs, { unlink } from "fs"
import { format } from "path"


    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret:process.env.CLOUDINARY_API_SECRET
    }) 

   
  const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath , {resource_type:"auto"})
        //file has been uploaded successfully
        console.log("file is uploaded on cloudinary" , response);
        fs.unlinkSync(localFilePath)
        return response ;
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary fle as the upload operation got failed
        return null;
    }
  }

  const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    try {
        // Delete the asset with the given public ID
        const response = await cloudinary.uploader.destroy(publicId, {resource_type: resourceType});
        return response;
    } catch (error) {
        console.error("Error deleting asset from Cloudinary:", error.message);
        return null;
    }
};


  export {uploadOnCloudinary , deleteFromCloudinary}

// const uploadPhotoOnCoudinary = async (localFilePath) => {
//     try {
//         if(!localFilePath) return null
//         console.log("uploading thumbnail...");

//         const cldnry_res = await cloudinary.uploader.upload(localFilePath ,
//             {
//                 resource_type: "auto" ,
//                 folder: "videotube/photos"
//             }
//         )

//         fs.unlinkSync(localFilePath)
//         return cldnry_res;
//     } catch (error) {
//         fs.unlinkSync(localFilePath) // remove the locally saved temporary fle as the upload operation got failed
//         console.log("CLOUDINARY :: FILE UPLOAD ERROR" , error);
//         return null;
//     }
// }


//     const uploadVideoOnCoudinary = async (localFilePath) => {
//         try {
//         if(!localFilePath) return null
//         console.log("uploading video...");
    
//         return new Promise((resolve ,  reject) => {
//              cloudinary.uploader.upload(localFilePath , {
//                 resource_type: "video" ,
//                 folder: "videotube/videos",
//                 chunk_size: 6000000, // increase chunk size to 6 MB
//                 eager: [
//                     {
//                         streaming_profile: "hd",
//                         format :"m3u8" // hls format
//                     },
//                 ],
//                 timeout: 600000 // increase timeout to 10 minutes
//             },(error , result) => {
//                 if(error) {
//                     console.log("CLOUDINARY :: FILE UPLOAD ERROR" , error);
//                     reject(error);
//                 } else {
//                     console.log("CLOUDINARY :: FILE UPLOAD SUCCESS" , result);
    
//                     const hlsurl = result.eager?.[0]?.secure_url;
    
//                     if(!hlsurl) {
//                         console.log("HLS URL not found in cloudinary response")
//                         reject(new Error("hls url not found"));
//                     } else {
//                         resolve({ ...result , hlsurl });
//                     }
//                 }
    
//                 //clean up local file after upload attempt
//                 fs.unlinkSync(localFilePath , (unlinkError) => {
//                     if(unlinkError) console.log("erro deleting local file path" , unlinkError);
//                 })
//             })
//         })
//     } catch (error) {
//         console.log("CLOUDINARY :: FILE UPLOAD ERROR" , error);
//         return null;
//     }
//  }

//  const deleteImageOnCloudinary = async (URL) => {
//     try {
//         if(!URL) return false

//         let imageId = URL.match(
//             /(?:image|video)\/upload\/v\d+\/videotube\/(photos|videos)\/(.+?)\.\w+$/
//           )[2];
      
//           console.log("deleting image from cloudinary...");

//           const cldnry_res = await cloudinary.uploader.destroy(`videotube/photos/${imageId}` ,
//             {
//                 resource_type: "image"
//             }
//           )
//           return cldnry_res
        
//     } catch (error) {
//         console.log("CLOUDINARY :: FILE DELETE ERROR" , error);
//         return false;
        
//     }
//  }

// const deleteVideoOnCloudinary = async (URL) => {
//     try {
//         if(!URL) return false

//         let videoId = URL.match(
//             /(?:image|video)\/upload\/v\d+\/videotube\/(photos|videos)\/(.+?)\.\w+$/
//           )[2];

//           console.log("deleting video from cloudinary...");

//           const cldnry_res = await cloudinary.uploader.destroy(`videotube/videos/${videoId}` ,
//             {
//                 resource_type: "video"
//             }
//           )
//           return cldnry_res
          
//     } catch (error) {
//         console.log("CLOUDINARY :: FILE DELETE ERROR" , error);
//         return false;
        
//     }
// }

// export{
//     uploadPhotoOnCoudinary,
//     uploadVideoOnCoudinary,
//     deleteImageOnCloudinary,
//     deleteVideoOnCloudinary
// }