import 'dotenv/config';

const DEFAULT_BASE_URL = 'http://127.0.0.1:5173';

export const env = {
  baseUrl: process.env.UI_BASE_URL ?? DEFAULT_BASE_URL,
  demoPassword: process.env.DEMO_PASSWORD ?? 'demo1234',
} as const;
