import type { NextApiRequest, NextApiResponse } from 'next'
import { OpenAI } from 'openai'
import axios from 'axios'
import { JSDOM } from 'jsdom'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ApiResponse {
  success: boolean
  data?: any
  message?: string
}

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url)
    const dom = new JSDOM(response.data)
    const content = dom.window.document.body.textContent || ''
    return content.trim()
  } catch (error) {
    console.error('Error fetching URL content:', error)
    throw new Error('无法获取链接内容，请检查链接是否正确')
  }
}

async function analyzePrivacyPolicy(text: string): Promise<any> {
  try {
    const thread = await openai.beta.threads.create()
    
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: `请分析以下隐私政策，并以JSON格式返回分析结果：\n\n${text}\n\n请按照以下格式返回结果：
      {
        "summary": {
          "data_collection": {
            "basic_info": [],
            "third_party_login": [],
            "account_info": [],
            "real_name_authentication": [],
            "content_interaction": []
          },
          "usage_purpose": {
            "account_services": "",
            "content_services": "",
            "customer_service": "",
            "marketing": "",
            "transaction_services": ""
          },
          "sharing_parties": {
            "advertising": "",
            "content_distribution": "",
            "delivery_services": "",
            "payment_services": "",
            "third_party_sdk": ""
          },
          "user_rights": {
            "access_correction_deletion": "",
            "account_deletion": "",
            "algorithm_decision": "",
            "personal_info_copy": "",
            "withdraw_consent": ""
          },
          "protection_strategy": {
            "deceased_users_protection": "",
            "management_system": "",
            "minors_protection": "",
            "security_measures": "",
            "storage": ""
          }
        },
        "risks": {
          "privacy_risks": [
            {
              "risk_level": "high/medium/low",
              "description": "",
              "reason": ""
            }
          ]
        }
      }`
    })

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID!,
    })

    let response
    let retryCount = 0
    const maxRetries = 180 // 3分钟超时
    const statusMessages: { [key: string]: string } = {
      queued: '排队中...',
      in_progress: '分析中...',
      completed: '分析完成',
      failed: '分析失败',
      cancelled: '分析已取消',
      expired: '分析已过期',
      requires_action: '需要操作'
    }

    while (retryCount < maxRetries) {
      const runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
      
      if (retryCount % 10 === 0) { // 每5秒记录一次状态
        console.log('Analysis status:', statusMessages[runStatus.status] || runStatus.status)
      }

      if (runStatus.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(thread.id)
        response = messages.data[0].content[0].text.value
        break
      } else if (['failed', 'cancelled', 'expired'].includes(runStatus.status)) {
        throw new Error(`分析${statusMessages[runStatus.status]}`)
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
      retryCount++
    }

    if (!response) {
      throw new Error('分析超时')
    }

    try {
      const parsedResponse = JSON.parse(response)
      return parsedResponse
    } catch (error) {
      console.error('Error parsing response:', error)
      throw new Error('无法解析分析结果')
    }
  } catch (error) {
    console.error('Analysis error:', error)
    throw error
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '仅支持 POST 请求' })
  }

  try {
    const { text, url } = req.body

    if (!text && !url) {
      return res.status(400).json({
        success: false,
        message: '请提供隐私政策文本或链接',
      })
    }

    let content = text
    if (url) {
      content = await fetchUrlContent(url)
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '无法获取隐私政策内容',
      })
    }

    const result = await analyzePrivacyPolicy(content)
    return res.status(200).json({ success: true, data: result })
  } catch (error: any) {
    console.error('API error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || '分析过程中出现错误',
    })
  }
}