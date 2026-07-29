import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Statistic, Tag, Table, Space } from 'antd';
import {
  FundOutlined, SwapOutlined, FileTextOutlined, TeamOutlined,
  GiftOutlined, CheckCircleOutlined, ClockCircleOutlined, ArrowUpOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { Title, Text } = Typography;
const API_BASE = `${API_BASE_URL}/api/v1/admin`;

const OpportunityBoard: React.FC = () => {
  const [boardData, setBoardData] = useState<any>({
    total: 0, totalAmount: 0, wonAmount: 0, conversionRate: 0,
    byType: { supply_demand: 0, bidding: 0, trade: 0, resource: 0 },
    byStage: { pending: 0, following: 0, proposal: 0, negotiation: 0, won: 0, lost: 0 },
    byTypeAmount: { supply_demand: 0, bidding: 0, trade: 0, resource: 0 },
    recentOpps: [],
  });
  const [loading, setLoading] = useState(false);

  const getToken = () => localStorage.getItem('adminToken');
  const getHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

  const fetchBoardData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/opportunities/board`, { headers: getHeaders() });
      if (res.data.code === 0 || res.data.code === 200) {
        setBoardData(res.data.data || boardData);
      }
    } catch (error) {
      console.error('Failed to fetch board data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBoardData(); }, []);

  const typeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    supply_demand: { label: '供需信息', color: '#1890ff', icon: <SwapOutlined /> },
    bidding: { label: '招投标', color: '#fa8c16', icon: <FileTextOutlined /> },
    trade: { label: '买卖关系', color: '#52c41a', icon: <TeamOutlined /> },
    resource: { label: '资源对接', color: '#722ed1', icon: <GiftOutlined /> },
  };

  const stageLabels: Record<string, string> = {
    pending: '待确认', following: '跟进中', proposal: '方案/报价',
    negotiation: '谈判中', won: '已成交', lost: '已流失'
  };
  const stageColors: Record<string, string> = {
    pending: '#d9d9d9', following: '#1890ff', proposal: '#13c2c2',
    negotiation: '#faad14', won: '#52c41a', lost: '#ff4d4f'
  };

  // 漏斗数据
  const funnelStages = ['pending', 'following', 'proposal', 'negotiation', 'won'];
  const maxCount = Math.max(...funnelStages.map(s => boardData.byStage[s] || 0), 1);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 4 }}>
          <FundOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          商机看板
        </h3>
        <span style={{ color: '#888' }}>商机漏斗、转化统计与数据概览</span>
      </div>

      {/* 核心指标 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="商机总数" value={boardData.total} prefix={<FundOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="总金额" value={boardData.totalAmount} prefix="¥" precision={0} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已成交金额" value={boardData.wonAmount} prefix="¥" precision={0} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="转化率" value={boardData.conversionRate} suffix="%" precision={1} valueStyle={{ color: '#1890ff' }} prefix={<ArrowUpOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        {/* 商机漏斗 */}
        <Col span={12}>
          <Card title="商机漏斗" size="small">
            <div style={{ padding: '16px 0' }}>
              {funnelStages.map((stage, index) => {
                const count = boardData.byStage[stage] || 0;
                const width = Math.max((count / maxCount) * 100, 20);
                return (
                  <div key={stage} style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: 80, fontSize: 13, color: '#666' }}>{stageLabels[stage]}</div>
                    <div style={{
                      flex: 1, height: 32, background: stageColors[stage],
                      borderRadius: 4, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: '#fff', fontWeight: 500,
                      width: `${width}%`, minWidth: 60, transition: 'all 0.3s'
                    }}>
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        {/* 类型分布 */}
        <Col span={12}>
          <Card title="商机类型分布" size="small">
            <Row gutter={[16, 16]} style={{ padding: '16px 0' }}>
              {Object.entries(typeConfig).map(([key, config]) => {
                const count = boardData.byType[key] || 0;
                const amount = boardData.byTypeAmount[key] || 0;
                return (
                  <Col span={12} key={key}>
                    <div style={{
                      padding: '12px 16px', borderRadius: 8,
                      border: `1px solid ${config.color}30`,
                      background: `${config.color}08`
                    }}>
                      <Space>
                        <span style={{ color: config.color, fontSize: 18 }}>{config.icon}</span>
                        <Text strong>{config.label}</Text>
                      </Space>
                      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 20, fontWeight: 'bold' }}>{count}</span>
                        <span style={{ color: '#888', fontSize: 13 }}>¥{amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 最近商机 */}
      <Card title="最近商机" size="small">
        <Table
          dataSource={boardData.recentOpps || []}
          rowKey="id"
          size="small"
          pagination={false}
          loading={loading}
          columns={[
            { title: '商机名称', dataIndex: 'title', key: 'title', ellipsis: true },
            {
              title: '类型', dataIndex: 'type', key: 'type',
              render: (type: string) => {
                const config = typeConfig[type];
                return <Tag color={config?.color}>{config?.label || type}</Tag>;
              }
            },
            {
              title: '阶段', dataIndex: 'stage', key: 'stage',
              render: (stage: string) => <Tag color={stageColors[stage]}>{stageLabels[stage]}</Tag>
            },
            {
              title: '金额', dataIndex: 'amount', key: 'amount',
              render: (v: number) => v ? `¥${v.toLocaleString()}` : '-'
            },
            {
              title: '概率', dataIndex: 'probability', key: 'probability',
              render: (v: number) => `${v || 0}%`
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default OpportunityBoard;
