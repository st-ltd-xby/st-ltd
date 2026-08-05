import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Tag, Progress, Spin, Result, Typography, Descriptions, Divider } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { Title, Text } = Typography;

const STAGE_ORDER = ['pending', 'confirmed', 'in_progress', 'proposal', 'negotiating', 'won', 'lost'];
const STAGE_LABELS: Record<string, string> = {
  pending: '待确认', confirmed: '已确认', in_progress: '跟进中',
  proposal: '方案/报价', negotiating: '谈判中', won: '已成交', lost: '已流失',
};
const STAGE_COLORS: Record<string, string> = {
  pending: 'default', confirmed: 'blue', in_progress: 'processing',
  proposal: 'cyan', negotiating: 'purple', won: 'success', lost: 'error',
};
const TYPE_LABELS: Record<string, string> = {
  supply_demand: '供需信息', bidding: '招投标', trade: '买卖关系', resource: '资源对接',
};

export default function OpportunityTracker() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!token) { setError(true); setLoading(false); return; }
      try {
        const res = await axios.get(`${API_BASE_URL}/api/v1/public/opportunities/${token}`);
        if (res.data.code === 0) {
          setData(res.data.data);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [token]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
        <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
        <Result status="404" title="链接无效" subTitle="该商机链接不存在或已失效" />
      </div>
    );
  }

  const currentStageIdx = STAGE_ORDER.indexOf(data.stage);
  const progressPercent = currentStageIdx >= 0 ? Math.round((currentStageIdx / (STAGE_ORDER.length - 2)) * 100) : 0;
  const isWon = data.stage === 'won';
  const isLost = data.stage === 'lost';

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(180deg, #f0f5ff 0%, #f5f7fa 100%)',
      padding: '40px 16px',
    }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* 头部 */}
        <Card style={{ borderRadius: 12, marginBottom: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Title level={4} style={{ margin: 0 }}>{data.title}</Title>
            <Tag color={STAGE_COLORS[data.stage] || 'default'} style={{ fontSize: 13, padding: '2px 10px' }}>
              {STAGE_LABELS[data.stage] || data.stage}
            </Tag>
          </div>
          {data.customerName && <Text type="secondary">客户：{data.customerName}</Text>}
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">类型：{TYPE_LABELS[data.type] || data.type}</Text>
            {data.amount > 0 && <Text type="secondary" style={{ marginLeft: 16 }}>金额：¥{data.amount.toLocaleString()}</Text>}
          </div>
        </Card>

        {/* 进度条 */}
        <Card style={{ borderRadius: 12, marginBottom: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <Title level={5} style={{ marginBottom: 16 }}>项目进度</Title>
          {isWon ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              <div style={{ marginTop: 12 }}><Text strong style={{ color: '#52c41a', fontSize: 16 }}>项目已成交</Text></div>
            </div>
          ) : isLost ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <ClockCircleOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />
              <div style={{ marginTop: 12 }}><Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>项目已流失</Text></div>
            </div>
          ) : (
            <>
              <Progress
                percent={Math.min(progressPercent, 100)}
                strokeColor={{ from: '#1890ff', to: '#52c41a' }}
                trailColor="#f0f0f0"
                strokeWidth={12}
                style={{ marginBottom: 20 }}
              />
              {/* 阶段节点 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                {STAGE_ORDER.filter(s => s !== 'lost').map((stage, idx) => {
                  const isActive = idx <= currentStageIdx;
                  const isCurrent = idx === currentStageIdx;
                  return (
                    <div key={stage} style={{ textAlign: 'center', flex: '1 1 auto', minWidth: 60 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', margin: '0 auto 6px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                        background: isActive ? (isCurrent ? '#1890ff' : '#52c41a') : '#f0f0f0',
                        color: isActive ? '#fff' : '#999',
                        fontWeight: isCurrent ? 700 : 400,
                        boxShadow: isCurrent ? '0 0 0 4px rgba(24,144,255,0.2)' : 'none',
                      }}>
                        {isActive ? <CheckCircleOutlined /> : idx + 1}
                      </div>
                      <Text style={{ fontSize: 11, color: isActive ? '#333' : '#999' }}>
                        {STAGE_LABELS[stage]}
                      </Text>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        {/* 详细信息 */}
        <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <Title level={5} style={{ marginBottom: 16 }}>详细信息</Title>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="商机名称">{data.title}</Descriptions.Item>
            <Descriptions.Item label="类型">{TYPE_LABELS[data.type] || data.type}</Descriptions.Item>
            {data.amount > 0 && <Descriptions.Item label="预计金额">¥{data.amount.toLocaleString()}</Descriptions.Item>}
            {data.expectedCloseDate && <Descriptions.Item label="预计成交">{new Date(data.expectedCloseDate).toLocaleDateString()}</Descriptions.Item>}
            <Descriptions.Item label="创建时间">{new Date(data.createdAt).toLocaleDateString()}</Descriptions.Item>
            {data.note && <Descriptions.Item label="备注">{data.note}</Descriptions.Item>}
          </Descriptions>
        </Card>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>由 ST-LTD 系统提供 · 进度自动同步</Text>
        </div>
      </div>
    </div>
  );
}
