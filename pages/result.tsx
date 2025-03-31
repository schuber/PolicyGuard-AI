import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import AnalysisResult from '../src/components/AnalysisResult';

interface Risk {
  risk_level: string;
  description: string;
  reason: string;
}

interface ResultPageProps {
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

const defaultData: ResultPageProps = {
  summary: {
    data_collection: {
      basic_info: [],
      behavior_info: [],
      device_info: [],
      third_party_login: [],
      account_info: [],
      real_name_authentication: [],
      content_interaction: []
    },
    usage_purpose: {
      account_services: '',
      content_services: '',
      customer_service: '',
      marketing: '',
      transaction_services: '',
      general: []
    },
    sharing_parties: [],
    user_rights: [],
    protection_strategy: []
  },
  risks: {
    privacy_risks: []
  }
};

export default function ResultPage() {
  const router = useRouter();
  const [analysisData, setAnalysisData] = useState<ResultPageProps | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem('analysisResult');
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        console.log('从sessionStorage读取的数据:', parsedData);
        
        // 确保数据结构完整
        const mergedData: ResultPageProps = {
          summary: {
            data_collection: {
              basic_info: parsedData.summary?.data_collection?.basic_info || [],
              behavior_info: parsedData.summary?.data_collection?.behavior_info || [],
              device_info: parsedData.summary?.data_collection?.device_info || [],
              third_party_login: parsedData.summary?.data_collection?.third_party_login || [],
              account_info: parsedData.summary?.data_collection?.account_info || [],
              real_name_authentication: parsedData.summary?.data_collection?.real_name_authentication || [],
              content_interaction: parsedData.summary?.data_collection?.content_interaction || []
            },
            usage_purpose: {
              account_services: parsedData.summary?.usage_purpose?.account_services || '',
              content_services: parsedData.summary?.usage_purpose?.content_services || '',
              customer_service: parsedData.summary?.usage_purpose?.customer_service || '',
              marketing: parsedData.summary?.usage_purpose?.marketing || '',
              transaction_services: parsedData.summary?.usage_purpose?.transaction_services || '',
              general: Array.isArray(parsedData.summary?.usage_purpose?.general) 
                ? parsedData.summary.usage_purpose.general 
                : Array.isArray(parsedData.summary?.usage_purpose) 
                  ? parsedData.summary.usage_purpose 
                  : []
            },
            sharing_parties: parsedData.summary?.sharing_parties || [],
            user_rights: parsedData.summary?.user_rights || [],
            protection_strategy: parsedData.summary?.protection_strategy || []
          },
          risks: {
            privacy_risks: Array.isArray(parsedData.risks?.privacy_risks) 
              ? parsedData.risks.privacy_risks
              : Array.isArray(parsedData.privacy_risks)
                ? parsedData.privacy_risks.map((risk: { risk_level?: string; description?: string; reason?: string; }) => ({
                    risk_level: risk.risk_level || '未知',
                    description: risk.description || '未提供描述',
                    reason: risk.reason || '未提供原因'
                  }))
                : []
          }
        };
        
        console.log('处理后的数据:', mergedData);
        setAnalysisData(mergedData);
      } catch (error) {
        console.error('解析存储的数据时出错:', error);
        setAnalysisData(defaultData);
      }
    } else {
      console.log('未找到分析结果，返回首页');
      router.push('/');
    }
  }, [router]);

  if (!analysisData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Head>
        <title>分析结果 - PolicyGuard</title>
        <meta name="description" content="隐私政策分析结果" />
      </Head>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">分析结果</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            返回首页
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <AnalysisResult 
            summary={analysisData.summary}
            risks={analysisData.risks}
          />
        </div>
      </main>
    </div>
  );
}