import { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, Typography, Empty } from 'antd';
import { scrmApi } from '../../services/api';
const { Title } = Typography;
export default function Opportunities() {
  const [opps, setOpps] = useState<any[]>([]);
  useEffect(() => { scrmApi.getOpportunities().then((res: any) => { if (res.code === 0) setOpps(res.data || []); }).catch(() => {}); }, []);
  const stages = [
    { key: 'demand', label: '需求确认', color: '#1677ff' },
    { key: 'proposal', label: '方案报价', color: '#faad14' },
    { key: 'negotiation', label: '商务谈判', color: '#ff7a45' },
    { key: 'won', label: '赢单', color: '#52c41a' },
  ];
  const totalAmount = opps.reduce((sum, o) => sum + (o.amount || 0), 0);
  return (<div>
    <Title level={4}>商机管理</Title>
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={6}><Card><Statistic title="进行中商机" value={opps.length} /></Card></Col>
      <Col span={6}><Card><Statistic title="预估总额" value={totalAmount} prefix="¥" /></Card></Col>
      <Col span={6}><Card><Statistic title="本月成交" value={opps.filter(o => o.stage === 'won').length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      <Col span={6}><Card><Statistic title="赢单率" value={opps.length ? Math.round(opps.filter(o => o.stage === 'won').length / opps.length * 100) : 0} suffix="%" /></Card></Col>
    </Row>
    <Row gutter={16}>
      {stages.map(stage => (
        <Col span={6} key={stage.key}>
          <Card title={<span>{stage.label} ({opps.filter(o => o.stage === stage.key).length})</span>} size="small">
            {opps.filter(o => o.stage === stage.key).length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> :
              opps.filter(o => o.stage === stage.key).map(o => (
                <Card key={o.id} size="small" style={{ marginBottom: 8, borderLeft: `3px solid ${stage.color}` }}>
                  <div style={{ fontWeight: 500 }}>{o.title}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>¥{o.amount?.toLocaleString()}</div>
                </Card>
              ))}
          </Card>
        </Col>
      ))}
    </Row>
  </div>);
}
