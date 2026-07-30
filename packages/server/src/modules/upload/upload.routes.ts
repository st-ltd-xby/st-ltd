import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../../common/prisma';
import { authMiddleware } from '../../middleware/auth';
import { success, fail } from '../../common/response';

const router: Router = Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 视频上传子目录
const videoDir = path.join(uploadDir, 'videos');
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

// 图片配置
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) cb(null, true);
    else cb(new Error('只支持图片格式: jpeg, jpg, png, gif, webp, svg'));
  }
});

// 视频配置
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, videoDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|webm|mov|avi|mkv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('video/');
    if (mimetype || extname) cb(null, true);
    else cb(new Error('只支持视频格式: mp4, webm, mov, avi, mkv'));
  }
});

// 上传图片文件（自动创建 MediaAsset 记录）
router.post('/upload', authMiddleware, imageUpload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return fail(res, '请选择要上传的文件');
    const fileUrl = `/uploads/${req.file.filename}`;

    // 如果提供了 siteId，创建 MediaAsset 记录
    const siteId = req.body.siteId;
    if (siteId) {
      try {
        await prisma.mediaAsset.create({
          data: {
            siteId,
            name: req.file.originalname,
            type: 'image',
            url: fileUrl,
            size: req.file.size,
            mimeType: req.file.mimetype,
          }
        });
      } catch (e) {
        console.error('创建 MediaAsset 记录失败:', e);
      }
    }

    success(res, {
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
    }, '上传成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 上传视频文件
router.post('/upload/video', authMiddleware, videoUpload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return fail(res, '请选择要上传的视频文件');
    const fileUrl = `/uploads/videos/${req.file.filename}`;

    success(res, {
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
    }, '视频上传成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

export default router;
