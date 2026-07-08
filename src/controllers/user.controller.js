import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
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
  console.log("email:",email)
  

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

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar localPath is required")
  }

  console.log("Avatar Local Path:", avatarLocalPath);
  console.log("Calling uploadOnCloudinary...");

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  console.log("Returned Avatar:", avatar);

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

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



export {registerUser}