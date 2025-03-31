import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import AnalysisResult from '../src/components/AnalysisResult'

interface ApiResponse {
  success: boolean
  data: {
    summary: {
      data_collection: {
        basic_info: string[]
        third_party_login: string[]
        account_info: string[]
        real_name_authentication: string[]
        content_interaction: string[]
      }
      usage_purpose: {
        account_services: string
        content_services: string
        customer_service: string
        marketing: string
        transaction_services: string
      }
      sharing_parties: {
        advertising: string
        content_distribution: string
        delivery_services: string
        payment_services: string
        third_party_sdk: string
      }
      user_rights: {
        access_correction_deletion: string
        account_deletion: string
        algorithm_decision: string
        personal_info_copy: string
        withdraw_consent: string
      }
      protection_strategy: {
        deceased_users_protection: string
        management_system: string
        minors_protection: string
        security_measures: string
        storage: string
      }
    }
    risks: {
      privacy_risks: Array<{
        risk_level: string
        description: string
        reason: string
      }>
    }
  }
}

// 输入区域组件
const InputSection = ({ 
  text, 
  url, 
  onTextChange, 
  onUrlChange 
}: { 
  text: string
  url: string
  onTextChange: (value: string) => void
  onUrlChange: (value: string) => void
}) => {
  return (
    <div className="space-y-6 w-full max-w-3xl">
      <div className="space-y-2">
        <label htmlFor="policy-text" className="block text-sm font-medium text-gray-700">
          隐私政策文本
        </label>
        <textarea
          id="policy-text"
          rows={8}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="在此粘贴隐私政策文本..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 text-gray-500 bg-white">或</span>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="policy-url" className="block text-sm font-medium text-gray-700">
          隐私政策链接
        </label>
        <input
          type="url"
          id="policy-url"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="输入隐私政策页面链接..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  )
}

// 分析按钮组件
const AnalyzeButton = ({ 
  onClick, 
  isLoading 
}: { 
  onClick: () => void
  isLoading: boolean 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="relative inline-flex items-center px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
    >
      {isLoading ? (
        <>
          <LoadingSpinner />
          <span className="ml-2">分析中...</span>
        </>
      ) : (
        '开始分析'
      )}
    </button>
  )
}

// 加载动画组件
const LoadingSpinner = () => {
  return (
    <svg
      className="animate-spin h-5 w-5 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

// 主页组件
export default function Home() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleAnalyze = async () => {
    if (!input.trim()) {
      setError('请输入隐私政策文本或链接')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const isUrl = input.trim().startsWith('http://') || input.trim().startsWith('https://')
      console.log('输入类型:', isUrl ? '链接' : '文本')

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: input.trim() }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || '分析失败，请稍后重试')
      }

      console.log('分析成功，准备存储结果')
      sessionStorage.setItem('analysisResult', JSON.stringify(data.data))
      await router.push('/result')
    } catch (error) {
      console.error('分析错误:', error)
      setError(error instanceof Error ? error.message : '分析过程中出现错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Head>
        <title>PolicyGuard - AI 驱动的隐私政策分析工具</title>
        <meta name="description" content="使用 AI 快速分析和理解隐私政策" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            PolicyGuard
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI 驱动的隐私政策分析工具
          </p>
          <p className="text-gray-500">
            粘贴隐私政策文本，立即获取详细分析报告和潜在风险提示
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              隐私政策文本或链接
            </label>
            <textarea
              className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="在此粘贴隐私政策文本..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            className={`w-full py-4 px-6 text-white font-medium rounded-lg ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={handleAnalyze}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                正在分析...
              </span>
            ) : (
              '开始分析'
            )}
          </button>
        </div>

        <footer className="text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} PolicyGuard. 保护您的隐私权益
        </footer>
      </main>
    </div>
  )
}