import client from './client';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatCompletionPayload = {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
};

export const fetchProxyModels = async () => {
  const { data } = await client.get('/ai/models');
  return data;
};

export const createProxyChatCompletion = async (payload: ChatCompletionPayload) => {
  const { data } = await client.post('/ai/chat/completions', payload);
  return data;
};

