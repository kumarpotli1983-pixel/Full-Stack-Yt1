import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const registerUser = asyncHandler(async (req,res)=>{
  // get user details from frontend
  // validation - not empty 
  // check if user already exists : username,email
  // check for images , check for avatar
  // uplaod them to cloudinary,avatr check
  // create user object -  create entry in DB
  // remove password and refresh token field form response
  // check for user creation 
  // return response

  const {fullname,username,email,password} = req.body
  

  /*if(fullname === "")
  {
    throw new ApiError(400,"full name is required")
  } this is only for fullname , if we want for all we can do like this */

  if([fullname,email,password,username].some((field)=>field?.trim()===""))
  {
    throw new ApiError(400,"All fields are required")
  }

  const existedUser = await User.findOne({
    $or:[{ email },{ username }]// it checks for all things listed in the array like "or" function
  })

  if(existedUser){
    throw new ApiError(409,"User with email or username is already existed!")
  }

  console.log("Body:", req.body);
  console.log("Files:", req.files);
  console.log("File:", req.file);

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar localPath is required")
  }

  console.log("Avatar Local Path:", avatarLocalPath);
  console.log("Calling uploadOnCloudinary...");

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  console.log("Returned Avatar:", avatar);

  let coverImage=null;
  // instead of if case , we can do if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
  //   coverImageLocalPath = req.files.coverImage[0].path
  // }
  
  if(coverImageLocalPath){
     coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }
  
  if(!avatar){
    throw new ApiError(400,"Avatar file is required")
  }

  const user = await User.create({
    fullname,
    avatar:avatar.url,
    coverImage: coverImage?.url|| "",
    email,
    password,
    username:username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser){
    throw new ApiError(500,"something went wrong while registring a User")
  }

  return res.status(201).json(
    new ApiResponse(201,createdUser,"User Registered Successfully")
  )

})

const generateAccessAndRefreshTokens =( async (user_id)=>{
  try {
    const user = await User.findById(user_id)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false })

    return {accessToken, refreshToken};

  } catch (error) {
      throw new ApiError(500,"Something went wrong!")
  }
})

const loginUser = asyncHandler(async (req,res)=>{
  //req.body -> data
  //take email and check whether availabe in DB
  //take password and check whether it matches with DB
  // take username and check if it matches with Db
  // if all matches then access and refresh token
  // send cookies
  console.log(req.body);
  const {username,email,password} = req.body

  if([username,email,password].some((field)=>field?.trim()==="")){
    throw new ApiError(400,"All fields are required")
  }

  const user = await User.findOne({
    email
    // $or:[{username},{email}] lets check only for email then compare pass and username
  })
  if(!user) {
    throw new ApiError(404,"User does not Exist or Email doesnt exist")
  }

  if(username.trim()!==user.username){
    throw new ApiError(402,"username is invalid")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if(!isPasswordValid) {
    throw new ApiError(401,"incorrect password")
  }

  const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly:true,
    secure:true
  }

  return res.status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(200,{
      user: loggedInUser,accessToken,refreshToken
    }),
    "User loggedIn Succesfully"
  )

})

const logoutUser = asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
    req.user._id,{
      $unset:{
      refreshToken:1}//this removes field from document
    }//$set:{
      //   refreshToken:undefined
      // }
    ,
    {
      new:true
    }
  )

  const options = {
    httpOnly:true,
    secure:true
  }

  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User LoggedOut successfully"))

})

const refreshAccessToken = asyncHandler(async(req,res)=>{
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken)
  {
    throw new ApiError(401,"Unauthorized Request!");
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken._id);

    if(!user)
    {
      throw new ApiError(401,"Invalid RefreshToken")
    }

    if(incomingRefreshToken!==user.refreshToken)
    {
      throw new ApiError(401,error?.message || "Refresh Token not matched or expired or used");
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);
    
    const options={
      httpOnly:true,
      secure:true
    }
    res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
      new ApiResponse(
        200,
        {accessToken:accessToken,
          refreshToken:refreshToken
        },
        "Access Token Refreshed Successfully"
      )
    )
  } catch (error) {
    throw new ApiError(401, "Access Token Refreshed failed xxx")
  }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
  try {
    const {oldPassword, newPassword, confirmPassword} = req.body

    if(newPassword !== confirmPassword) {
      throw new ApiError(400,"Password not matched")
    }

    const user = await User.findById(req.user?._id)
    if(!user)
      {
        throw new ApiError(401,"Something went Wrong!")
      }
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
      throw new ApiError(400,"Password is Incorrect")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave : false})

    return res.status(200)
              .json(new ApiResponse(200,{},"Password changed Successfully"))


  } catch (error) {
    throw new ApiError(401,error?.message || "Password changing failed")
  }
})

const getCurrentUser = asyncHandler(async(req,res)=>{
  return res.status(200)
            .json(new ApiResponse(200, req.user, "Current user fetched successfully"))

})

const updateAccountDetails = asyncHandler(async(req,res)=>{
  const {fullname,email} = req.body

  if(!fullname || !email){
    throw new ApiError(400,"All fields are required")
  }

  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{
        fullname,
        email:email
      }
    },
    {new:true}
  ).select("-password -refreshToken")

  return res.status(200)
            .json(new ApiResponse(200,user,"Account Details Updated"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{

  const avatarLocalPath = req.file?.path
  if(!avatarLocalPath)
  {
    throw new ApiError(400,"Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url)
  {
    throw new ApiError(400,"Error while uploading on Avatar")
  }

  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{
        avatar:avatar.url
    }
    },
    {
      new:true
    }
  ).select("-password")
  
  return res.status(200)
            .json(new ApiResponse(200,user,"Updated Avatar Succesfully"))
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{

  const coverImageLocalPath = req.file?.path
  if(!coverImageLocalPath)
  {
    throw new ApiError(400,"coverImage file is missing")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url)
  {
    throw new ApiError(400,"Error while uploading on coverImage")
  }

  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{
        coverImage:coverImage.url
    }
    },
    {
      new:true
    }
  ).select("-password")

  return res.status(200)
            .json(new ApiResponse(200,user,"Updated Cover Image Succesfully "))

})

const getUserChannelProfile = asyncHandler(async (req,res)=>{
  const {username} = req.params

  if(!username?.trim())
  {
    throw new ApiError(400,"username is missing")
  }

  const channel = await User.aggregate(
    [
    {
      $match:{
        username:username?.toLowerCase()
      }
    },
    {
      $lookup:{// no of subscribers => for this i have to check how channels(like compare my id , channel id as both are same)
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as: "subscribers"
      }
    },
    {
      $lookup:{//my subscriptions
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields:{
        subscribersCount:{
          $size:"$subscribers"
        },
        channelsSubscribedToCount:{
          $size:"$subscribedTo"
        },
        isSubscribed:{
          $cond:{
            if:{$in: [req.user?._id,"$subscribers.subscriber"]},
            then:true,
            else:false
          }
        }
      }
    },
    {
      $project:{
        fullname:1,
        username:1,
        subscribersCount:1,
        channelsSubscribedToCount:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
        email:1
      }
    }
    ]
  )

  if(!channel?.length){
    throw new ApiError(404,"Channel Does not Exist")
  }

  return res.status(200)
            .json(new ApiResponse(200,channel[0],"User channel fetched succesfully"))
})

const getWatchHistory = asyncHandler(async(req,res)=>
{
  const user = await User.aggregate([
    {
      $match:{
        _id:new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup:{
        from:"videos",
        localField: "watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullname:1,
                    username:1,
                    avatar:1
                  }
                }
              ]

            }
          },
          {
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res.status(200)
            .json(new ApiResponse(200,user[0].watchHistory,"watchHistory fetched succesfully"))
})
export {loginUser}
export {registerUser}
export {logoutUser}
export {refreshAccessToken}
export {changeCurrentPassword}

export {
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
}
