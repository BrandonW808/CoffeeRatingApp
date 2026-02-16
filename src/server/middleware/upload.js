// server/middleware/upload.js
const multer = require('multer');

// Use memory storage so we get a Buffer for sharp processing
// instead of writing the raw file to disk first
const memoryStorage = multer.memoryStorage();

const createUpload = (options = {}) => {
    const {
        maxFileSize = 10 * 1024 * 1024, // 10MB default
        maxFiles = 5,
    } = options;

    return multer({
        storage: memoryStorage,
        limits: {
            fileSize: maxFileSize,
            files: maxFiles,
        },
        fileFilter: (req, file, cb) => {
            const allowed = /jpeg|jpg|png|webp|heic/;
            const ext = allowed.test(
                file.originalname.toLowerCase().split('.').pop()
            );
            const mime = /^image\/(jpeg|png|webp|heic)$/.test(file.mimetype);

            if (ext && mime) {
                cb(null, true);
            } else {
                cb(
                    new Error(
                        'Only image files (jpg, png, webp, heic) are allowed'
                    ),
                    false
                );
            }
        },
    });
};

// Pre-built configurations for different use cases
module.exports = {
    coffeeImages: createUpload({ maxFiles: 5, maxFileSize: 10 * 1024 * 1024 }),
    brewImages: createUpload({ maxFiles: 3, maxFileSize: 10 * 1024 * 1024 }),
    avatar: createUpload({ maxFiles: 1, maxFileSize: 5 * 1024 * 1024 }),
};