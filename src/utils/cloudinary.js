import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) =>{
  try{
    console.log("Inside uploadOnCloudinary");
    if(!localFilePath) return null
    //upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath,{
      resource_type:"auto"
    })
    //file has been uplaoded
    console.log("file has been uploaded on cloudinary ",response.url);
    console.log(response)

    fs.unlinkSync(localFilePath);
    return response;
  }
  catch(error){
    console.log("========== CLOUDINARY ERROR ==========");
    console.log(error);
    console.log("=====================================");

    if(localFilePath && fs.existsSync(localFilePath)){
        fs.unlinkSync(localFilePath);//reomve from local file sysytem bsz the failed ones pile up taking space of disk (from multer)
    }

    return null;
}
}

const deleteFromCloudinary = async(public_id,resourceType) =>{
  try {
    if(!public_id?.trim() || !resourceType?.trim())
    {
      throw new ApiError(400,"Both public_id & resourceType are required")
    }

    const response = await cloudinary.uploader.destroy(public_id,{
      resource_type:resourceType
    })

    console.log("Deleted response from cloudinary : ",response)
    
    return response;
  } catch (error) {
        console.log("Cloudinary delete failed:", error);
        return null;
    }
}
export {
  uploadOnCloudinary,
  deleteFromCloudinary
}