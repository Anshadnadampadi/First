import express from 'express';
import { getVideoManagement, uploadHeroVideo, deleteHeroVideo } from '../../controllers/admin/videoController.js';
import { uploadVideo } from '../../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/', getVideoManagement);
router.post('/upload', uploadVideo.single('video'), uploadHeroVideo);
router.delete('/delete/:slot', deleteHeroVideo);

export default router;
