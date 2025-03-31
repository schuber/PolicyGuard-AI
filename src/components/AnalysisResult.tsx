import React from 'react';

interface Risk {
  risk_level: string;
  description: string;
  reason: string;
}

interface AnalysisResultProps {
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

export default function AnalysisResult({ summary, risks }: AnalysisResultProps) {
  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
      case '高':
        return {
          border: 'border-red-200',
          bg: 'bg-red-50',
          badge: 'bg-red-100 text-red-800',
        };
      case 'medium':
      case '中':
        return {
          border: 'border-yellow-200',
          bg: 'bg-yellow-50',
          badge: 'bg-yellow-100 text-yellow-800',
        };
      case 'low':
      case '低':
        return {
          border: 'border-green-200',
          bg: 'bg-green-50',
          badge: 'bg-green-100 text-green-800',
        };
      default:
        return {
          border: 'border-gray-200',
          bg: 'bg-gray-50',
          badge: 'bg-gray-100 text-gray-800',
        };
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
      case '高':
        return '高风险';
      case 'medium':
      case '中':
        return '中风险';
      case 'low':
      case '低':
        return '低风险';
      default:
        return '未知风险';
    }
  };

  // 查找与特定类别相关的风险
  const findRelatedRisks = (category: string): Risk[] => {
    if (!risks?.privacy_risks) return [];
    return risks.privacy_risks.filter(risk => 
      risk.description.toLowerCase().includes(category.toLowerCase()) ||
      risk.reason.toLowerCase().includes(category.toLowerCase())
    );
  };

  // 渲染风险提示
  const renderRiskWarnings = (risks: Risk[]) => {
    if (!risks || risks.length === 0) return null;
    
    return (
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-medium text-gray-900">相关风险提示：</h4>
        {risks.map((risk, index) => {
          const colors = getRiskColor(risk.risk_level);
          return (
            <div
              key={index}
              className={`p-3 rounded-lg ${colors.bg} ${colors.border} border`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                  {getRiskLabel(risk.risk_level)}
                </span>
              </div>
              <p className="text-sm text-gray-900">{risk.description}</p>
              <p className="text-xs text-gray-600 mt-1">{risk.reason}</p>
            </div>
          );
        })}
      </div>
    );
  };

  // 渲染信息卡片
  const renderInfoCard = (title: string, items: string[] | undefined, category: string) => {
    if (!items || items.length === 0) return null;
    
    const relatedRisks = findRelatedRisks(category);
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          {items.map((item, index) => (
            <li key={index} className="text-sm">{item}</li>
          ))}
        </ul>
        {renderRiskWarnings(relatedRisks)}
      </div>
    );
  };

  // 渲染使用目的卡片
  const renderUsagePurposeCard = () => {
    const items = summary.usage_purpose.general || [];
    const category = '使用目的';
    const relatedRisks = findRelatedRisks(category);
    
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">使用目的</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          {items.map((item, index) => (
            <li key={index} className="text-sm">{item}</li>
          ))}
        </ul>
        {renderRiskWarnings(relatedRisks)}
      </div>
    );
  };

  // 渲染风险卡片
  const renderRiskCard = (risk: Risk) => {
    const colors = getRiskColor(risk.risk_level);
    return (
      <div
        className={`p-6 rounded-xl border ${colors.border} ${colors.bg}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors.badge}`}>
            {getRiskLabel(risk.risk_level)}
          </span>
        </div>
        <p className="text-gray-900 mb-3">{risk.description}</p>
        <p className="text-sm text-gray-600">{risk.reason}</p>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* 数据收集部分 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">数据收集范围</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {renderInfoCard('基本信息', summary.data_collection.basic_info, '基本信息')}
          {renderInfoCard('行为信息', summary.data_collection.behavior_info, '行为信息')}
          {renderInfoCard('设备信息', summary.data_collection.device_info, '设备信息')}
          {renderInfoCard('第三方登录信息', summary.data_collection.third_party_login, '第三方登录')}
          {renderInfoCard('账号信息', summary.data_collection.account_info, '账号信息')}
          {renderInfoCard('实名认证信息', summary.data_collection.real_name_authentication, '实名认证')}
          {renderInfoCard('内容交互信息', summary.data_collection.content_interaction, '内容交互')}
        </div>
      </div>

      {/* 数据使用目的 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">数据使用目的</h2>
        {renderUsagePurposeCard()}
      </div>

      {/* 数据共享对象 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">数据共享对象</h2>
        {renderInfoCard('共享对象', summary.sharing_parties, '共享')}
      </div>

      {/* 用户权利 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">用户权利</h2>
        {renderInfoCard('您的权利', summary.user_rights, '权利')}
      </div>

      {/* 数据保护措施 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">数据保护措施</h2>
        {renderInfoCard('保护措施', summary.protection_strategy, '保护')}
      </div>

      {/* 风险评估 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">风险评估</h2>
        <div className="grid gap-4">
          {risks?.privacy_risks?.map((risk, index) => (
            <div key={index}>
              {renderRiskCard(risk)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}