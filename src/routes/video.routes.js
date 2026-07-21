import { Router } from "express"
import { upload } from "../middlewares/multer.middleware"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllVideos, publishAVideo, updateVideo } from "../controllers/video.controller.js";

const router = Router()

router.use(verifyJWT)

router.route("/").get(getAllVideos)

router.route("/upload-video").post(
  upload.fields([
    {
      name:"videoFile",
      maxCount:1
    },{
      name:"thumbnailFile",
      maxCount:1
    }
  ]),publishAVideo)

router.route("/:videoId")
.get(getVideoById)
.patch(upload.single("thumbnailFile"),updateVideo)
.delete(deleteVideo)

router.route("/toggle/publish/:videoId").patch(togglePublishStatus)

  export default router