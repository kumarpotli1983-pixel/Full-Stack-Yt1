import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

// most of the middlewares are configured by "use"
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials:true
}))

app.use(express.json({limit:"16kb"}))/*this is beacause , suppose frontend sends js object like 
{
name:Enosh,
age:30
}
backend receives  it as a string, {"\name"\="\Enosh"\...} something like that , so when we call console.log(req.body)=>gives undifined.
----- express.json(), express uses a middleware , now that js object is made in the form of object from string 
*/
app.use(express.urlencoded({extended:true,limt:"16kb"}))
/*
  Urlencoded is for HTML form
  <form>
  <input name="username">
  <input name="password">
  </form>
  browser sends "username=Enosh&password=1234" NOT JSON.

  Extended is used for nested objects as urlencoded is only for destruting objects / getting data from key-value pairs only

  the limit is used for sequrity purpose , if someone send 500mb data /string foramt object , its has to be stored in the RAM before json parsea it, which might cause crash!

*/
app.use(express.static("public"))

app.use(cookieParser())
/**
 same like why express.json is used, from the server the express recives cookie but in the form one entire string , "name:Enosh age:40 gender:male" to store cookie in the form of object for better readability and usage cookie-parser parses it and store in the form of object and whenever user comes to site for login page second time it automatically sned to browser
 */











// export { app } both are same , but if we use this one then while importing we have to "import { app } from "./index.js""...
export default app 
// if we use this we have to "import app from './index.js'"..."

