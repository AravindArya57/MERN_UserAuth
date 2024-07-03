import Video from '../models/uploadVideoModel.js';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Multer setup for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './src/uploads/encrypted/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const algorithm = 'aes-256-ctr';

const encryptFile = (filePath, secretKey, iv, callback) => {
    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(filePath + '.enc');
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

    input.pipe(cipher).pipe(output);
    output.on('finish', () => {
        callback();
    });
};

const decryptFile = (encryptedFilePath, decryptedFilePath, secretKey, iv, callback) => {
    const input = fs.createReadStream(encryptedFilePath);
    const output = fs.createWriteStream(decryptedFilePath);
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);

    input.pipe(decipher).pipe(output);

    output.on('finish', () => {
        callback(null);
    });

    input.on('error', (error) => {
        console.error('Error reading the encrypted file:', error);
        callback(error);
    });

    output.on('error', (error) => {
        console.error('Error writing the decrypted file:', error);
        callback(error);
    });
};

const uploadVideo = async (req, res) => {
    const { title, description } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const secretKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    const filePath = file.path;

    encryptFile(filePath, secretKey, iv, async () => {
        const encryptedFilePath = filePath + '.enc';

        try {
            fs.renameSync(filePath, `${filePath}.bak`); // Rename the original file instead of deleting it
        } catch (err) {
            console.error('Error renaming original file:', err);
            return res.status(500).json({ message: 'Error processing file' });
        }

        const newVideo = new Video({
            title,
            description,
            filename: file.filename + '.enc',
            path: encryptedFilePath,
            secretKey: secretKey.toString('hex'),
            iv: iv.toString('hex')
        });

        try {
            await newVideo.save();
            res.status(201).json({ message: 'Video uploaded and encrypted successfully', video: newVideo });
        } catch (err) {
            console.error('Error saving video to database:', err);
            res.status(500).json({ message: 'Error saving video' });
        }
    });
};

const decryptVideo = async (req, res) => {
    const { videoId } = req.params; // Assuming videoId is passed in the request params
    const { secretKey, iv, encryptedFilePath } = req.body; // Assuming these details are passed in the request body

    if (!secretKey || !iv || !encryptedFilePath) {
        return res.status(400).json({ message: 'Missing decryption parameters' });
    }

    const decryptedFilePath = path.join('./src/uploads/decrypted/', `${videoId}_decrypted.mp4`); // Adjust the file name and extension as needed

    decryptFile(encryptedFilePath, decryptedFilePath, Buffer.from(secretKey, 'hex'), Buffer.from(iv, 'hex'), (err) => {
        if (err) {
            console.error('Error decrypting video:', err);
            return res.status(500).json({ message: 'Error decrypting video', error: err.message });
        }

        res.status(200).json({ message: 'Video decrypted successfully', decryptedFilePath });
    });
};

export  { upload, uploadVideo , decryptVideo };
