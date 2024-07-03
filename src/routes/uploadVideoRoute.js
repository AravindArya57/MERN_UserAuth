import express from 'express';
import { upload, uploadVideo, decryptVideo } from '../controllers/uploadVideoController.js';

const router = express.Router();

router.post('/upload', upload.single('video'), uploadVideo);
router.post('/decrypt/:videoId', decryptVideo);

export default router;
