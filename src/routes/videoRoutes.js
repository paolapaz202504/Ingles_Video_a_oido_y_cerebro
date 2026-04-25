import express from "express";
import { VideoController } from "../controllers/VideoController.js";

const router = express.Router();

router.get("/library", VideoController.getLibrary);
router.post("/process", VideoController.processVideo);
router.post("/direct-url", VideoController.getDirectUrl);
router.get("/proxy-video", VideoController.proxyVideo);

export default router;