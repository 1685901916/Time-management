import { Router, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import db from '../database.js';
import { uploadToOSS, deleteFromOSS } from '../utils/oss.js';

// 使用内存存储，不再写本地磁盘
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB（前端已压缩，这里兜底）
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片'));
    }
  },
});

const router = Router();

// POST /api/entries/:id/photos — 上传图片到 OSS
router.post('/:id/photos', upload.single('file'), async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const entryId = req.params.id;

  const existing = db.prepare('SELECT id FROM time_entries WHERE id = ? AND user_id = ?').get(entryId, userId);
  if (!existing) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: '没有上传文件' });
    return;
  }

  try {
    // 生成唯一文件名
    const ext = path.extname(req.file.originalname) || '.jpg';
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;

    // 上传到 OSS
    const ossUrl = await uploadToOSS(req.file.buffer, filename);

    // 存储到数据库
    const result = db.prepare(
      'INSERT INTO entry_photos (entry_id, file_path, caption, file_size, mime_type) VALUES (?, ?, ?, ?, ?)'
    ).run(entryId, ossUrl, '', req.file.size, req.file.mimetype);

    res.status(201).json({
      photo: {
        id: String(result.lastInsertRowid),
        entryId,
        filePath: ossUrl,
        caption: '',
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('OSS 上传失败:', err);
    res.status(500).json({ error: '上传失败，请稍后重试' });
  }
});

// GET /api/entries/:id/photos — 获取照片列表
router.get('/:id/photos', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const entryId = req.params.id;

  const existing = db.prepare('SELECT id FROM time_entries WHERE id = ? AND user_id = ?').get(entryId, userId);
  if (!existing) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }

  const photos = db.prepare('SELECT * FROM entry_photos WHERE entry_id = ?').all(entryId);
  res.json({
    photos: photos.map((p: any) => ({
      id: String(p.id),
      entryId: String(p.entry_id),
      filePath: p.file_path,
      caption: p.caption,
      createdAt: p.created_at,
    })),
  });
});

// DELETE /api/entries/:entryId/photos/:photoId — 删除照片
router.delete('/:entryId/photos/:photoId', async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { entryId, photoId } = req.params;

  const existing = db.prepare('SELECT id FROM time_entries WHERE id = ? AND user_id = ?').get(entryId, userId);
  if (!existing) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }

  const photo: any = db.prepare('SELECT * FROM entry_photos WHERE id = ? AND entry_id = ?').get(photoId, entryId);
  if (photo) {
    // 从 OSS 删除
    await deleteFromOSS(photo.file_path);
    // 从数据库删除
    db.prepare('DELETE FROM entry_photos WHERE id = ?').run(photoId);
  }

  res.json({ success: true });
});

export default router;
