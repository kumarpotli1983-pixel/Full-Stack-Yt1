// require ("dotenv").config({path:"./env"})
import dotenv from "dotenv"
import  connectDB  from "./db/index.js"

dotenv.config({
  path:'./env'
})

connectDB()
.then(()=>{
  app.listen(process.env.PORT || 8000 , (req,res)=>{
    console.log(`Server is running at port ${process.env.PORT}`)
  })
})
.catch((err)=>{
  console.log("MOGNO_DB Connection Error : ",err)
})




/* ----------------- one of the approach--------------
import express from "express"
const app = express()

(async ()=>{
  try {
    mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    app.on("errror",(error)=>{
      console.log("ERRR:",error)
      throw error
    })

    app.listen(process.env.PORT,()=>{
      console.log(`App is listening on port ${process.env.PORT}`)
    })

  } catch (error) {
    console.error("ERROR : ", error)
    throw error
  
  }
})()
  */