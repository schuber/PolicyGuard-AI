import React from 'react';
import { Risk } from '@/lib/ai/analyze';

interface AnalysisResultProps {
  data: {
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
  };
}

const RiskLevelBadge: React.FC<{ level: string }> = ({ level }) => {
  const getColor = () => {
    switch (level.toLowerCase()) {
      case '高':
        return 'bg-red-100 text-red-800';
      case '中':
        return 'bg-yellow-100 text-yellow-800';
      case '低':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColor()}`}>
      {level}风险
    </span>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold mb-4">{title}</h3>
    {children}
  </div>
);

const ListSection: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <Section title={title}>
    <ul className="list-disc list-inside space-y-2">
      {items.map((item, index) => (
        <li key={index} className="text-gray-700">{item}</li>
      ))}
    </ul>
  </Section>
);

const AnalysisResult: React.FC<AnalysisResultProps> = ({ data }) => {
  const { summary, risks } = data;
  const { data_collection, usage_purpose, sharing_parties, user_rights, protection_strategy } = summary;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">隐私政策分析报告</h2>

      <div className="space-y-8">
        <Section title="数据收集">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ListSection title="基本信息" items={data_collection.basic_info} />
            <ListSection title="行为信息" items={data_collection.behavior_info} />
            <ListSection title="设备信息" items={data_collection.device_info} />
            {data_collection.third_party_login && (
              <ListSection title="第三方登录信息" items={data_collection.third_party_login} />
            )}
            {data_collection.account_info && (
              <ListSection title="账户信息" items={data_collection.account_info} />
            )}
            {data_collection.real_name_authentication && (
              <ListSection title="实名认证信息" items={data_collection.real_name_authentication} />
            )}
            {data_collection.content_interaction && (
              <ListSection title="内容交互信息" items={data_collection.content_interaction} />
            )}
          </div>
        </Section>

        <Section title="使用目的">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">账户服务</h4>
                <p className="text-gray-700">{usage_purpose.account_services}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">内容服务</h4>
                <p className="text-gray-700">{usage_purpose.content_services}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">客户服务</h4>
                <p className="text-gray-700">{usage_purpose.customer_service}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">营销推广</h4>
                <p className="text-gray-700">{usage_purpose.marketing}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">交易服务</h4>
                <p className="text-gray-700">{usage_purpose.transaction_services}</p>
              </div>
              {usage_purpose.general.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">其他用途</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {usage_purpose.general.map((item, index) => (
                      <li key={index} className="text-gray-700">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Section>

        <ListSection title="数据共享方" items={sharing_parties} />
        <ListSection title="用户权利" items={user_rights} />
        <ListSection title="保护措施" items={protection_strategy} />

        <Section title="隐私风险">
          <div className="space-y-4">
            {risks.privacy_risks.map((risk, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{risk.description}</h4>
                  <RiskLevelBadge level={risk.risk_level} />
                </div>
                <p className="text-gray-700">{risk.reason}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
};

export default AnalysisResult;