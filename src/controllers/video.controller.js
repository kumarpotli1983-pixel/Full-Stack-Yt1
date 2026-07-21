import mongoose from "mongoose"
import { User } from "../models/user.models.js"
import { Video } from "../models/video.models.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { deleteFromCloudinary } from "../utils/cloudinary.js"

//DONE: get all videos based on query, sort, pagination
const getAllVideos = asyncHandler(async(req,res)=>{
  const { query, sortBy, sortType, userId} = req.query
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 10
  
  const pipeline = []

  const matchStage = {}
  if(query?.trim())
  {
    matchStage.title={
      $regex:query,
      $options:"i"
    }
  }

  if(userId?.trim())
  {
    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError(400,"Invalid userId")
    }
    matchStage.owner = new mongoose.Types.ObjectId(userId)
  }

  if(Object.keys(matchStage).length>0)
  {
    pipeline.push({
      $match:matchStage
    })
  }

  const allowedFields = ["createdAt", "views", "title"]
  let fieldToSort = ""
  if(allowedFields.some((field)=>{
    return field===sortBy?.trim()
  }))
  {
    fieldToSort = sortBy.trim()
  }

  if(fieldToSort)
  {
    const sortByObject = {
    $sort:{
      [fieldToSort]:sortType==="desc"? -1:1
      }
    }
    pipeline.push(sortByObject)
  }
  
  if(page>1)
  {
    const skipObject = {
      $skip:(page-1)*limit
    }
    pipeline.push(skipObject)
  }

  const limitObject = {
    $limit:limit
  }
  pipeline.push(limitObject)

  const videos = await Video.aggregate(pipeline)

  res.status(200)
    .json(new ApiResponse(200,videos,"Videos fetched successfully")) 
})

// DONE: get video, upload to cloudinary, create video
const publishAVideo = asyncHandler(async (req,res)=>{
  const { title, description} = req.body
  if(!title?.trim() || !description?.trim())
  {
    throw new ApiError(400,"both title & description are required")
  }
  const videoLocalPath = req.files?.videoFile?.[0]?.path
  const thumbnailLocalPath = req.files?.thumbnailFile?.[0]?.path

  if(!videoLocalPath)
  {
    throw new ApiError(400,"VideoLocalPath is required!")
  }
  if(!thumbnailLocalPath)
  {
    throw new ApiError(400,"thumbnailLocalPath is required!")
  }
  const videoFile = await uploadOnCloudinary(videoLocalPath)

  if(!videoFile)
  {
    throw new ApiError(500,"Video is missing")
  }
  console.log("VideoFile returned : ",videoFile)
  const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath)

  if(!thumbnailFile)
  {
    throw new ApiError(500,"thumbnail is missing")
  }
  console.log("thumbnailFile returned : ",thumbnailFile)
  const video = await Video.create({
    videoFile:{
      url:videoFile.secure_url,
      public_id:videoFile.public_id
    },
    thumbnailFile:{
      url:thumbnailFile?.secure_url,
      public_id:thumbnailFile?.public_id
    },
    title,
    description,
    duration:videoFile.duration,
    owner:req.user?._id
  })

  return res.status(201)
            .json(new ApiResponse(201,video,"Video created Successfully"))
})

//DONE: get video by id
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

  if(!mongoose.Types.ObjectId.isValid(videoId))
  {
    throw new ApiError(400,"Video ID is invalid")
  }
  const checkVideo = await Video.findById(videoId);

  if(!checkVideo)
  {
    throw new ApiError(404,"Video not found!")
  }

  return res.status(200)
            .json(new ApiResponse(200,video,"Video fetched succesfully"))
})

//DONE: update video details like title, description, thumbnail
const updateVideo =  asyncHandler(async(req,res)=>{
  const { videoId } = req.params
  //check proper user or not 
  // check any one field to update is given or not
  // if thumbnail is to update then delete old one from cloudinary && upload new thumbnail on cloudinary
  if(!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400,"VideoId is required")
  }

  const video = await Video.findById(videoId)
  if(!video)
  {
    throw new ApiError(404,"Video not found")
  }

  if(!video.owner.equals(req.user?._id))
  {
    throw new ApiError(403,"User Not allowed to Update Video")
  }

  const {title,description} = req.body

  const thumbnailLocalPath = req.file?.path

  if(!title?.trim() && !description?.trim() && !thumbnailLocalPath)
  {
    throw new ApiError(400,"Any one field is required to Update")
  }

  const updateFields = {}
  if(title?.trim())
  {
    updateFields.title = title
  }
  if(description?.trim())
  {
    updateFields.description = description
  }
  if(thumbnailLocalPath)
  {
    const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbnailFile)
    {
      throw new ApiError(500,"thumbnailFile is missing")
    }

    updateFields.thumbnailFile = {
      url:thumbnailFile.secure_url,
      public_id:thumbnailFile.public_id
    }

    const thumbnailDeleteResponse = await deleteFromCloudinary(video.thumbnailFile.public_id,"image")

    if(!thumbnailDeleteResponse || thumbnailDeleteResponse.result!=="ok")
    {
      throw new ApiError(500,"Thumbnail failed to delete from Cloudinary")
    }
  }

  const updatedVideo = await Video.findByIdAndUpdate(videoId,{
    $set : updateFields
  },
  {
    new:true
  })

  return res.status(200)
            .json(new ApiResponse(200,updatedVideo,"Updated Successfully"))
})

const deleteVideo = asyncHandler(async(req,res)=>{
  const { videoId } = req.params

  if(!mongoose.Types.ObjectId.isValid(videoId))
  {
    throw new ApiError(400,"VideoId is not Valid")
  }

  const video = await Video.findById(videoId)
  if(!video)
  {
    throw new ApiError(404,"video not found")
  }
  //if(video.owner!==req.user?._id)//this does not work as both are object id's
  //or u can use (video.owner.toString()!==req.user._id.to_string())
  if(!video.owner.equals(req.user?._id))
  {
    throw new ApiError(403,"You are not allowed to delete this video")
  }

  const [videoDeleteResponse,thumbnailDeleteResponse] = await Promise.all([
    deleteFromCloudinary(video.videoFile.public_id,"video"),
    deleteFromCloudinary(video.thumbnailFile.public_id,"image")
  ])

  if(!videoDeleteResponse || videoDeleteResponse.result !== "ok")
  {
    throw new ApiError(500,"Video failed to delete from Cloudinary")
  }
  if(!thumbnailDeleteResponse || thumbnailDeleteResponse.result !== "ok")
  {
    throw new ApiError(500,"Thumbnail failed to delete from Cloudinary")
  }

  const deletedVideo = await Video.findByIdAndDelete(videoId)

  if (!deletedVideo) {
    throw new ApiError(404, "Video not found");
}
  return res.status(200)
            .json(new ApiResponse(200,{},"Video deleted Successfully"))
})

const togglePublishStatus = asyncHandler(async(req,res)=>{
  const { videoId } = req.params
  //check if videoId is valid
  //check if user is valid and same
  //toggle status
  if(!mongoose.Types.ObjectId.isValid(videoId))
  {
    throw new ApiError(400,"Required valid VideoId!")
  }
  const video = await Video.findById(videoId);

  if(!video)
  {
    throw new ApiError(404,"Video not found!")
  }

  if(!video.owner.equals(req.user?._id))
  {
    throw new ApiError(403,"user not matched")
  }

  const toggledVideo = await Video.findByIdAndUpdate(videoId,{
    $set:{
      isPublished:!video.isPublished
    }
  },
  {
    new:true
  })

  return res.status(200)
            .json(new ApiResponse(200,toggledVideo,"Toggled Video status succesfully"))
})

export {
  getAllVideos,
  publishAVideo,
  updateVideo,
  deleteVideo,
  togglePublishStatus
}