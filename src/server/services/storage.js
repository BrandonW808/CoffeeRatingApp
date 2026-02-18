// server/services/storage/localStorage.js
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// This must resolve to the same directory that express.static serves
// server.js has: app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
// __dirname for server.js = server/src (or wherever server.js lives)
// So uploads = project_root/uploads
// localStorage.js is at server/services/storage/localStorage.js
// path.join(__dirname, '../../../uploads') = project_root/uploads  ✓
const UPLOAD_BASE = path.join(__dirname, '../../uploads');

const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const localStorage = {
    async save(buffer, category, entityId, originalName) {
        const dir = path.join(UPLOAD_BASE, category, entityId);
        const thumbDir = path.join(dir, 'thumbnails');
        ensureDir(dir);
        ensureDir(thumbDir);

        const timestamp = Date.now();
        const ext = 'webp';
        const filename = `${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        await sharp(buffer)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 82 })
            .toFile(path.join(dir, filename));

        await sharp(buffer)
            .resize(300, 300, { fit: 'cover' })
            .webp({ quality: 70 })
            .toFile(path.join(thumbDir, filename));

        // Log for debugging
        console.log(`[storage] saved: ${path.join(dir, filename)}`);
        console.log(`[storage] url will be: /uploads/${category}/${entityId}/${filename}`);

        return {
            url: `/uploads/${category}/${entityId}/${filename}`,
            thumbnailUrl: `/uploads/${category}/${entityId}/thumbnails/${filename}`,
            filename,
            originalName,
        };
    },

    async remove(category, entityId, filename) {
        const fullPath = path.join(UPLOAD_BASE, category, entityId, filename);
        const thumbPath = path.join(UPLOAD_BASE, category, entityId, 'thumbnails', filename);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    },

    async removeAll(category, entityId) {
        const dir = path.join(UPLOAD_BASE, category, entityId);
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    },
};

module.exports = localStorage;