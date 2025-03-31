import OpenAI from 'openai';

interface Risk {
  risk_level: string;
  description: string;
  reason: string;
}

interface AnalysisResult {
  summary: {
    data_collection: {
      basic_info: string[];
      behavior_info: string[];
      device_info: string[];
      third_party_login?: string[];
      account_info?: string[];
      real_name_authentication?: string[];
      content_interaction?: string[];
    };
    usage_purpose: {
      account_services: string;
      content_services: string;
      customer_service: string;
      marketing: string;
      transaction_services: string;
      general: string[];
    };
    sharing_parties: string[];
    user_rights: string[];
    protection_strategy: string[];
  };
  risks: {
    privacy_risks: Risk[];
  };
}

interface RawAnalysisResult {
  summary: {
    data_collection: {
      basic_info?: string[];
      behavior_info?: string[];
      device_info?: string[];
      third_party_login?: string[];
      account_info?: string[];
      real_name_authentication?: string[];
      content_interaction?: string[];
    };
    usage_purpose?: {
      account_services?: string;
      content_services?: string;
      customer_service?: string;
      marketing?: string;
      transaction_services?: string;
      general?: string[];
    } | string[];
    sharing_parties?: string[];
    user_rights?: string[];
    protection_strategy?: string[];
  };
  privacy_risks: Array<{
    risk_level?: string;
    description?: string;
    reason?: string;
  }>;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 助手ID，创建后不会改变，可以存储为常量
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

export async function analyzePrivacyPolicy(text: string): Promise<AnalysisResult> {
  if (!ASSISTANT_ID) {
    throw new Error('未设置 OPENAI_ASSISTANT_ID 环境变量');
  }

  try {
    console.log('开始分析隐私政策...');

    // 1. 创建对话线程
    const thread = await openai.beta.threads.create();
    console.log('创建对话线程:', thread.id);

    // 2. 提交消息给助手
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: text
    });
    console.log('提交消息完成');

    // 3. 运行助手分析
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    });
    console.log('启动分析进程:', run.id);

    // 4. 等待分析结果
    let result: AnalysisResult | undefined;
    let waitTime = 0;
    
    while (true) {
      const runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      console.log('分析状态:', runStatus.status, '已等待时间:', Math.floor(waitTime / 1000), '秒');

      if (runStatus.status === 'completed') {
        // 获取分析结果
        const messages = await openai.beta.threads.messages.list(thread.id);
        const lastMessage = messages.data[0];
        
        if (lastMessage.role === 'assistant' && lastMessage.content[0].type === 'text') {
          try {
            const responseText = lastMessage.content[0].text.value;
            console.log('AI响应原文:', responseText);
            
            // 尝试解析JSON
            let jsonStr = responseText;
            let jsonSource = 'original';
            
            // 1. 首先尝试直接解析
            try {
              JSON.parse(jsonStr);
            } catch (e) {
              console.log('直接解析失败，尝试其他方法');
              
              // 2. 尝试提取代码块
              const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
              if (jsonMatch) {
                jsonStr = jsonMatch[1].trim();
                jsonSource = 'code-block';
                console.log('从代码块中提取JSON');
              } else {
                // 3. 尝试查找第一个 { 和最后一个 } 之间的内容
                const start = responseText.indexOf('{');
                const end = responseText.lastIndexOf('}');
                if (start !== -1 && end !== -1 && end > start) {
                  jsonStr = responseText.substring(start, end + 1);
                  jsonSource = 'brackets';
                  console.log('从括号中提取JSON');
                }
              }
            }
            
            console.log('提取的JSON字符串 (来源: ' + jsonSource + '):', jsonStr);
            
            try {
              const rawResult = JSON.parse(jsonStr) as RawAnalysisResult;
              console.log('JSON解析成功');
              
              if (!rawResult.summary || !rawResult.privacy_risks) {
                throw new Error('JSON结构不完整：缺少必要字段');
              }
              
              console.log('解析后的JSON:', JSON.stringify(rawResult, null, 2));
              
              // 转换数据结构以匹配组件接口
              result = {
                summary: {
                  data_collection: {
                    basic_info: rawResult.summary.data_collection?.basic_info || [],
                    behavior_info: rawResult.summary.data_collection?.behavior_info || [],
                    device_info: rawResult.summary.data_collection?.device_info || [],
                    third_party_login: rawResult.summary.data_collection?.third_party_login,
                    account_info: rawResult.summary.data_collection?.account_info,
                    real_name_authentication: rawResult.summary.data_collection?.real_name_authentication,
                    content_interaction: rawResult.summary.data_collection?.content_interaction
                  },
                  usage_purpose: typeof rawResult.summary.usage_purpose === 'object' && !Array.isArray(rawResult.summary.usage_purpose) 
                    ? {
                        account_services: rawResult.summary.usage_purpose?.account_services || '',
                        content_services: rawResult.summary.usage_purpose?.content_services || '',
                        customer_service: rawResult.summary.usage_purpose?.customer_service || '',
                        marketing: rawResult.summary.usage_purpose?.marketing || '',
                        transaction_services: rawResult.summary.usage_purpose?.transaction_services || '',
                        general: rawResult.summary.usage_purpose?.general || []
                      }
                    : {
                        account_services: '',
                        content_services: '',
                        customer_service: '',
                        marketing: '',
                        transaction_services: '',
                        general: Array.isArray(rawResult.summary.usage_purpose) ? rawResult.summary.usage_purpose : []
                      },
                  sharing_parties: rawResult.summary.sharing_parties || [],
                  user_rights: rawResult.summary.user_rights || [],
                  protection_strategy: rawResult.summary.protection_strategy || []
                },
                risks: {
                  privacy_risks: rawResult.privacy_risks.map(risk => ({
                    risk_level: risk.risk_level || '未知',
                    description: risk.description || '',
                    reason: risk.reason || ''
                  }))
                }
              };
              
              console.log('分析完成');
              break;
            } catch (error) {
              console.error('解析AI响应失败:', error);
              console.error('原始响应:', lastMessage.content[0].text.value);
              throw new Error('AI响应格式错误，无法解析为JSON');
            }
          } catch (error) {
            console.error('处理AI响应失败:', error);
            throw new Error('处理AI响应时出错：' + (error instanceof Error ? error.message : '未知错误'));
          }
        } else {
          throw new Error('AI响应格式不正确');
        }
      } else if (runStatus.status === 'failed') {
        console.error('分析失败，状态:', runStatus);
        throw new Error(runStatus.last_error?.message || '分析失败');
      } else if (runStatus.status === 'expired') {
        throw new Error('分析请求已过期');
      } else if (runStatus.status === 'cancelled') {
        throw new Error('分析请求已取消');
      }

      // 每3秒检查一次状态
      await new Promise(resolve => setTimeout(resolve, 3000));
      waitTime += 3000;
    }

    if (!result) {
      throw new Error('未能获取分析结果');
    }

    // 验证结果结构
    if (!result.summary?.data_collection?.basic_info ||
        !result.summary?.data_collection?.behavior_info ||
        !result.summary?.data_collection?.device_info ||
        !result.summary?.usage_purpose ||
        !result.summary?.sharing_parties ||
        !result.summary?.user_rights ||
        !result.summary?.protection_strategy ||
        !result.risks?.privacy_risks) {
      throw new Error('AI响应数据结构不完整');
    }

    return result;
  } catch (error) {
    console.error('分析过程出错:', error);
    throw error;
  }
}