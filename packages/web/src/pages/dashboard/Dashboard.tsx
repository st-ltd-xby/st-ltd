import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Table, Tag, Progress, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, TeamOutlined, FunnelPlotOutlined, DollarOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { dashboardApi } from '../../services/api';

const { Title } = Typography;

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [funnel, setFunnel] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [s, f]: any = await Promise.all([dashboardApi.getStats(), dashboardApi.getFunnel()]);
      if (s.code === 0) setStats(s.data);
      if (f.code === 0) setFunnel(f.data.funnel);
    } catch {}
  };

  const leadColumns = [
    { title: '线索', dataIndex: 'name', key: 'name' },
    { title: '公司', dataIndex: 'company', key: 'company' },
    { title: '来源', dataIndex: 'source', key: 'source', render: (v: string) => {
      const colors: Record<string, string> = { baidu: 'blue', douyin: 'red', wechat: 'green', card: 'purple', xiaohongshu: 'cyan' };
      return <Tag color={colors[v] || 'default'}>{v}</Tag>;
    }},
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => {
      const map: Record<string, { color: string; text: string }> = { new: { color: 'orange', text: '新线索' }, following: { color: 'blue', text: '跟进中' }, won: { color: 'green', text: '已成交' } };
      const s = map[v] || { color: 'default', text: v };
      return <Tag color={s.color}>{s.text}</Tag>;
    }},
    { title: '时间', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => new Date(v).toLocaleDateString() },
  ];

  const overview = stats?.overview || {};
  const colors = ['#1677ff', '#36cfc9', '#faad14', '#ff7a45', '#52c41a'];

  return (
    <div>
      <Title level={4}>数据看板</Title>
      <Row gutter={[16, 16]} align="stretch">
        <Col span={6} style={{ display: 'flex' }}><Card style={{ flex: 1 }}><Statistic title="今日访客" value={overview.todayVisitors || 0} prefix={<TeamOutlined />} /></Card></Col>
        <Col span={6} style={{ display: 'flex' }}><Card style={{ flex: 1 }}><Statistic title="新增线索" value={overview.todayLeads || 0} prefix={<FunnelPlotOutlined />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6} style={{ display: 'flex' }}><Card style={{ flex: 1 }}><Statistic title="本月商机" value={overview.monthOpportunityAmount || 0} prefix={<DollarOutlined />} precision={0} valueStyle={{ color: '#faad14' }} suffix="元" /></Card></Col>
        <Col span={6} style={{ display: 'flex' }}><Card style={{ flex: 1 }}><Statistic title="成交订单" value={overview.monthWonOrders || 0} prefix={<ShoppingCartOutlined />} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }} align="stretch">
        <Col span={12} style={{ display: 'flex' }}>
          <Card title="获客漏斗" style={{ flex: 1 }}>
            {funnel.map((item, i) => (
              <div key={item.stage} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ width: 80, fontSize: 13 }}>{item.stage}</span>
                <Progress percent={funnel[0] ? Math.round((item.count / funnel[0].count) * 100) : 0} strokeColor={colors[i]} style={{ flex: 1 }} />
                <span style={{ fontWeight: 600, width: 60, textAlign: 'right' }}>{item.count}</span>
              </div>
            ))}
            {!funnel.length && <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>暂无数据</div>}
          </Card>
        </Col>
        <Col span={12} style={{ display: 'flex' }}>
          <Card title="最新线索" style={{ flex: 1 }}>
            <Table dataSource={stats?.recentLeads || []} columns={leadColumns} rowKey="id" pagination={false} size="small" />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }} align="stretch">
        <Col span={12} style={{ display: 'flex' }}>
          <Card title="数据概览" style={{ flex: 1 }}>
            <Row gutter={[16, 16]}>
              <Col span={8}><Statistic title="总客户数" value={overview.totalCustomers || 0} /></Col>
              <Col span={8}><Statistic title="总线索数" value={overview.totalLeads || 0} /></Col>
              <Col span={8}><Statistic title="内容总数" value={overview.totalArticles || 0} /></Col>
              <Col span={8}><Statistic title="内容总阅读" value={overview.totalArticleViews || 0} /></Col>
              <Col span={8}><Statistic title="内容带来线索" value={overview.totalArticleLeads || 0} /></Col>
              <Col span={8}><Statistic title="上架商品" value={overview.activeProducts || 0} /></Col>
            </Row>
          </Card>
        </Col>
        <Col span={12} style={{ display: 'flex' }}>
          <Card title="渠道来源分布" style={{ flex: 1 }}>
            {(stats?.leadsBySource || []).map((item: any, i: number) => (
              <div key={item.source} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ width: 60, fontSize: 13 }}>{item.source}</span>
                <Progress percent={Math.round((item.count / (overview.totalLeads || 1)) * 100)} strokeColor={colors[i % 5]} style={{ flex: 1 }} />
                <span style={{ fontWeight: 600, width: 40, textAlign: 'right' }}>{item.count}</span>
              </div>
            ))}
            {!(stats?.leadsBySource?.length) && <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>暂无数据</div>}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
