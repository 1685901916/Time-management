/**
 * 图片压缩工具
 * 使用 Canvas API 在前端压缩图片，减少上传体积
 */

export interface CompressOptions {
  maxWidth?: number;     // 最大宽度，默认 1200px
  maxHeight?: number;    // 最大高度，默认 1600px
  quality?: number;      // JPEG 质量 0-1，默认 0.7
  maxSizeKB?: number;    // 目标最大体积 KB，默认 500KB
}

const DEFAULT_OPTIONS: CompressOptions = {
  maxWidth: 1200,
  maxHeight: 1600,
  quality: 0.7,
  maxSizeKB: 500,
};

/**
 * 压缩单张图片文件
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // 计算缩放后的尺寸
      let { width, height } = img;
      if (width > opts.maxWidth!) {
        height = (height * opts.maxWidth!) / width;
        width = opts.maxWidth!;
      }
      if (height > opts.maxHeight!) {
        width = (width * opts.maxHeight!) / height;
        height = opts.maxHeight!;
      }
      width = Math.round(width);
      height = Math.round(height);

      // Canvas 重绘
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      // 先用初始质量导出
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error('压缩失败'));
            return;
          }

          // 如果体积仍超标，逐步降低质量
          let result = blob;
          let quality = opts.quality!;
          while (result.size > (opts.maxSizeKB! * 1024) && quality > 0.1) {
            quality -= 0.1;
            result = await canvasToBlob(canvas, quality);
          }

          resolve(result);
        },
        'image/jpeg',
        opts.quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
    };

    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('导出失败'))),
      'image/jpeg',
      quality
    );
  });
}

/**
 * 批量压缩图片
 */
export async function compressImages(
  files: File[],
  options?: CompressOptions
): Promise<Blob[]> {
  return Promise.all(files.map((f) => compressImage(f, options)));
}

/**
 * 获取图片的本地预览 URL
 */
export function createPreviewURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * 释放预览 URL
 */
export function revokePreviewURL(url: string): void {
  URL.revokeObjectURL(url);
}
