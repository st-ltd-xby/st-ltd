"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma_1 = __importDefault(require("../../common/prisma"));
const auth_1 = require("../../middleware/auth");
const response_1 = require("../../common/response");
const router = (0, express_1.Router)();
// 确保上传目录存在
const uploadDir = path_1.default.join(__dirname, '../../../uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// 视频上传子目录
const videoDir = path_1.default.join(uploadDir, 'videos');
if (!fs_1.default.existsSync(videoDir)) {
    fs_1.default.mkdirSync(videoDir, { recursive: true });
}
// 图片配置
const imageStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});
const imageUpload = (0, multer_1.default)({
    storage: imageStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname)
            cb(null, true);
        else
            cb(new Error('只支持图片格式: jpeg, jpg, png, gif, webp, svg'));
    }
});
// 视频配置
const videoStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => cb(null, videoDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});
const videoUpload = (0, multer_1.default)({
    storage: videoStorage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /mp4|webm|mov|avi|mkv/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = file.mimetype.startsWith('video/');
        if (mimetype || extname)
            cb(null, true);
        else
            cb(new Error('只支持视频格式: mp4, webm, mov, avi, mkv'));
    }
});
// 上传图片文件（自动创建 MediaAsset 记录）
router.post('/upload', auth_1.authMiddleware, imageUpload.single('file'), async (req, res) => {
    try {
        if (!req.file)
            return (0, response_1.fail)(res, '请选择要上传的文件');
        const fileUrl = `/uploads/${req.file.filename}`;
        // 如果提供了 siteId，创建 MediaAsset 记录
        const siteId = req.body.siteId;
        if (siteId) {
            try {
                await prisma_1.default.mediaAsset.create({
                    data: {
                        siteId,
                        name: req.file.originalname,
                        type: 'image',
                        url: fileUrl,
                        size: req.file.size,
                        mimeType: req.file.mimetype,
                    }
                });
            }
            catch (e) {
                console.error('创建 MediaAsset 记录失败:', e);
            }
        }
        (0, response_1.success)(res, {
            url: fileUrl,
            filename: req.file.originalname,
            size: req.file.size,
        }, '上传成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 上传视频文件
router.post('/upload/video', auth_1.authMiddleware, videoUpload.single('file'), async (req, res) => {
    try {
        if (!req.file)
            return (0, response_1.fail)(res, '请选择要上传的视频文件');
        const fileUrl = `/uploads/videos/${req.file.filename}`;
        (0, response_1.success)(res, {
            url: fileUrl,
            filename: req.file.originalname,
            size: req.file.size,
        }, '视频上传成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
exports.default = router;
//# sourceMappingURL=upload.routes.js.map