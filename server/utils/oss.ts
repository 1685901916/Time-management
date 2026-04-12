/**
 * 阿里云 OSS 上传模块
 */
import OSS from 'ali-oss';

let client: OSS | null = null;

function getClient(): OSS {
  if (client) return client;

  const required = [
    'OSS_ACCESS_KEY_ID',
    'OSS_ACCESS_KEY_SECRET',
    'OSS_BUCKET',
    'OSS_REGION',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`缺少环境变量: ${key}`);
    }
  }

  client = new OSS({
    accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
    bucket: process.env.OSS_BUCKET!,
    region: process.env.OSS_REGION!,
    directory: process.env.OSS_DIRECTORY || 'itime-photos',
  });

  return client;
}

/**
 * 上传文件到 OSS
 * @param buffer 文件 Buffer
 * @param filename 文件名（含扩展名）
 * @returns OSS 完整访问 URL
 */
export async function uploadToOSS(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const oss = getClient();
  const directory = process.env.OSS_DIRECTORY || 'itime-photos';
  const key = `${directory}/${filename}`;

  const result = await oss.put(key, buffer);

  // 返回完整 URL
  return result.url;
}

/**
 * 从 OSS 删除文件
 * @param url 文件的完整 URL
 */
export async function deleteFromOSS(url: string): Promise<void> {
  try {
    const oss = getClient();
    const directory = process.env.OSS_DIRECTORY || 'itime-photos';

    // 从 URL 中提取 key
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(new RegExp(`/${directory}/(.+)`));
    if (pathMatch) {
      const key = `${directory}/${pathMatch[1]}`;
      await oss.delete(key);
    }
  } catch {
    // 删除失败不阻塞主流程，记录日志即可
    console.warn('OSS 文件删除失败:', url);
  }
}
