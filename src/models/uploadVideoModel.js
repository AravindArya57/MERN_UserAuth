import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    filename: { type: String, required: true },
    path: { type: String, required: true },
    secretKey: { type: String, required: true },
    iv: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
});

const Video = mongoose.model('Video', videoSchema);

export default Video;

