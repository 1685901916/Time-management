import { Router } from 'express';
import axios from 'axios';

const router = Router();

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, '');

const getProxyConfig = () => {
  const baseUrl = normalizeBaseUrl(
    process.env.PROXY_BASE_URL || 'https://api-orchestrator-christopherho81.replit.app'
  );
  const apiKey = process.env.PROXY_API_KEY;
  return { baseUrl, apiKey };
};

const getAuthHeaders = () => {
  const { apiKey } = getProxyConfig();
  if (!apiKey) {
    return null;
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
};

router.get('/models', async (_req, res) => {
  const { baseUrl } = getProxyConfig();
  const headers = getAuthHeaders();

  if (!headers) {
    res.status(500).json({ error: '缺少 PROXY_API_KEY 配置' });
    return;
  }

  try {
    const response = await axios.get(`${baseUrl}/v1/models`, { headers });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    const status = error?.response?.status || 500;
    const payload = error?.response?.data || { error: '代理服务请求失败' };
    res.status(status).json(payload);
  }
});

router.post('/chat/completions', async (req, res) => {
  const { baseUrl } = getProxyConfig();
  const headers = getAuthHeaders();

  if (!headers) {
    res.status(500).json({ error: '缺少 PROXY_API_KEY 配置' });
    return;
  }

  if (!req.body?.model || !Array.isArray(req.body?.messages)) {
    res.status(400).json({ error: '请求体必须包含 model 和 messages[]' });
    return;
  }

  try {
    const response = await axios.post(`${baseUrl}/v1/chat/completions`, req.body, { headers });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    const status = error?.response?.status || 500;
    const payload = error?.response?.data || { error: '代理服务请求失败' };
    res.status(status).json(payload);
  }
});

export default router;
