import { NextApiRequest, NextApiResponse } from 'next';
import { analyzePrivacyPolicy } from '@/lib/ai/analyze';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只支持 POST 请求' });
  }

  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({ message: '请提供隐私政策文本或链接' });
    }

    const result = await analyzePrivacyPolicy(input.trim());
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('分析过程出错:', error);
    return res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : '分析过程中出现错误' 
    });
  }
}

// 配置 API 路由以接受较大的请求体
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};