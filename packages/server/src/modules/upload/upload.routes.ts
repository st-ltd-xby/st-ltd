import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../../middleware/auth';
import { success, fail } from '../../common/response';

const router: Router = Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片格式: jpeg, jpg, png, gif, webp, svg'));
    }
  }
});

// 上传单个文件
router.post('/upload', authMiddleware, upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return fail(res, '请选择要上传的文件');
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    success(res, {
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
    }, '上传成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

export default router;
