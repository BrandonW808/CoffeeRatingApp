// server/services/storage/localStorage.js
const path = require('path');
const fs = require('fs');
const sharp = require('sharp'); // npm install sharp

const UPLOAD_BASE = path.join(__dirname, '../../../uploads');

const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const localStorage = {
    /**
     * Save a file, generate a thumbnail, return metadata.
     * @param {Buffer} buffer  - raw file buffer from multer
     * @param {string} category - e.g. 'coffees', 'brews', 'avatars'
     * @param {string} entityId - the mongo document id
     * @param {string} originalName - original filename
     * @returns {Promise<{url: string, thumbnailUrl: string, filename: string}>}
     */
    async save(buffer, category, entityId, originalName) {
        const dir = path.join(UPLOAD_BASE, category, entityId);
        const thumbDir = path.join(dir, 'thumbnails');
        ensureDir(dir);
        ensureDir(thumbDir);

        const timestamp = Date.now();
        const ext = 'webp'; // convert everything to webp
        const filename = `${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        // Process full-size image: resize to max 1200px wide, strip EXIF, convert to webp
        await sharp(buffer)
            .resize(1200, 1200, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .webp({ quality: 82 })
            .toFile(path.join(dir, filename));

        // Generate thumbnail: 300px wide
        await sharp(buffer)
            .resize(300, 300, {
                fit: 'cover',
            })
            .webp({ quality: 70 })
            .toFile(path.join(thumbDir, filename));

        return {
            url: `/uploads/${category}/${entityId}/${filename}`,
            thumbnailUrl: `/uploads/${category}/${entityId}/thumbnails/${filename}`,
            filename,
            originalName,
        };
    },

    /**
     * Delete a single image and its thumbnail.
     */
    async remove(category, entityId, filename) {
        const fullPath = path.join(UPLOAD_BASE, category, entityId, filename);
        const thumbPath = path.join(UPLOAD_BASE, category, entityId, 'thumbnails', filename);

        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    },

    /**
     * Delete all images for an entity (used when deleting a coffee).
     */
    async removeAll(category, entityId) {
        const dir = path.join(UPLOAD_BASE, category, entityId);
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    },
};

module.exports = localStorage;