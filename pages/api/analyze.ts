import { NextApiRequest, NextApiResponse } from 'next';
import { analyzePrivacyPolicy } from '@/lib/ai/analyze';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '只支持 POST 请求' });
  }

  // 检查环境变量
  if (!process.env.OPENAI_API_KEY) {
    console.error('缺少 OPENAI_API_KEY 环境变量');
    return res.status(500).json({ 
      success: false, 
      message: '服务器配置错误：未设置 OpenAI API 密钥' 
    });
  }

  if (!process.env.OPENAI_ASSISTANT_ID) {
    console.error('缺少 OPENAI_ASSISTANT_ID 环境变量');
    return res.status(500).json({ 
      success: false, 
      message: '服务器配置错误：未设置 OpenAI Assistant ID' 
    });
  }

  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({ 
        success: false, 
        message: '请提供隐私政策文本或链接' 
      });
    }

    if (typeof input !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: '输入必须是字符串类型' 
      });
    }

    const trimmedInput = input.trim();
    if (trimmedInput.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '输入内容不能为空' 
      });
    }

    console.log('开始分析隐私政策，文本长度:', trimmedInput.length);
    const result = await analyzePrivacyPolicy(trimmedInput);
    console.log('分析完成，返回结果');
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('分析过程出错:', error);
    
    // 根据错误类型返回不同的错误信息
    let statusCode = 500;
    let message = '分析过程中出现错误';
    
    if (error instanceof Error) {
      if (error.message.includes('未设置')) {
        statusCode = 500;
        message = '服务器配置错误：' + error.message;
      } else if (error.message.includes('AI响应格式')) {
        statusCode = 500;
        message = 'AI 响应解析失败：' + error.message;
      } else if (error.message.includes('分析超时')) {
        statusCode = 504;
        message = '分析请求超时，请稍后重试';
      }
    }

    return res.status(statusCode).json({ 
      success: false, 
      message,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
}

// 配置 API 路由以接受较大的请求体，并设置较长的超时时间
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: false,
    externalResolver: true,
  },
};