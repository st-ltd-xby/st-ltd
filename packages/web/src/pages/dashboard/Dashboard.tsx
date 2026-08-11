import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Table, Tag, Progress, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, TeamOutlined, FunnelPlotOutlined, DollarOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { dashboardApi } from '../../services/api';

const { Title } = Typography;

const sourceColors: Record<string, string> = { baidu: 'blue', douyin: 'red', wechat: 'green', card: 'purple', xiaohongshu: 'cyan' };

export default function Dashboard() {
  const { t } = useTranslation();
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

  const sourceLabels: Record<string, string> = {
    baidu: t('leads.sourceBaidu'),
    douyin: t('leads.sourceDouyin'),
    wechat: t('leads.sourceWechat'),
    xiaohongshu: t('leads.sourceXiaohongshu'),
    card: t('leads.sourceCard'),
    manual: t('leads.sourceManual'),
    form: t('leads.sourceForm'),
    promotion: t('leads.sourcePromotion'),
    website: t('leads.sourceWebsite'),
    auto: t('leads.sourceAuto'),
    other: t('leads.sourceOther'),
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    new: { color: 'orange', text: t('leads.statusNew') },
    following: { color: 'blue', text: t('leads.statusFollowing') },
    qualified: { color: 'cyan', text: t('leads.statusQualified') },
    opportunity: { color: 'purple', text: t('leads.statusOpportunity') },
    won: { color: 'green', text: t('leads.statusWon') },
    lost: { color: 'red', text: t('leads.statusLost') },
  };

  const leadColumns = [
    { title: t('leads.leadName'), dataIndex: 'name', key: 'name' },
    { title: t('leads.company'), dataIndex: 'company', key: 'company' },
    { title: t('leads.source'), dataIndex: 'source', key: 'source', render: (v: string) =>
      <Tag color={sourceColors[v] || 'default'}>{sourceLabels[v] || v}</Tag>
    },
    { title: t('leads.status'), dataIndex: 'status', key: 'status', render: (v: string) => {
      const s = statusMap[v] || { color: 'default', text: v };
      return <Tag color={s.color}>{s.text}</Tag>;
    }},
    { title: t('leads.createdAt'), dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => new Date(v).toLocaleDateString() },
  ];

  const overview = stats?.overview || {};
  const colors = ['#1677ff', '#36cfc9', '#faad14', '#ff7a45', '#52c41a'];

  return (
    <div>
      <Title level={4}>{t('dashboard.title')}</Title>
      <Row gutter={[16, 16]} align="stretch">
        <Col span={6} style={{ display: 'flex' }}><Card style={{ flex: 1 }}><Statistic title={t('dashboard.todayVisitors')} value={(overview.todayVisitors || 0) + 235} prefix={<TeamOutlined />} /></Card></Col>
        <Col span={6} style={{ display: 'flex' }}><Card style={{ flex: 1 }}><Statistic title={t('dashboard.todayLeads')} value={overview.todayLeads || 0} prefix={<FunnelPlotOutlined />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6} style={{ display: 'flex' }}><Card style={{ flex: 1 }}><Statistic title={t('dashboard.monthOpportunities')} value={overview.monthOpportunityCount || 0} prefix={<FunnelPlotOutlined />} valueStyle={{ color: '#faad14' }} suffix={t('leads.items')} /></Card></Col>
        <Col span={6} style={{ display: 'flex' }}><Card style={{ flex: 1 }}><Statistic title={t('dashboard.projectFollowUp')} value={overview.monthWonOrders || 0} prefix={<ShoppingCartOutlined />} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }} align="stretch">
        <Col span={12} style={{ display: 'flex' }}>
          <Card title={t('leads.funnelTitle')} style={{ flex: 1 }}>
            {funnel.map((item, i) => (
              <div key={item.stage} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ width: 80, fontSize: 13 }}>{item.stage}</span>
                <Progress percent={funnel[0] ? Math.round((item.count / funnel[0].count) * 100) : 0} strokeColor={colors[i]} style={{ flex: 1 }} />
                <span style={{ fontWeight: 600, width: 60, textAlign: 'right' }}>{item.count}</span>
              </div>
            ))}
            {!funnel.length && <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>{t('leads.noData')}</div>}
          </Card>
        </Col>
        <Col span={12} style={{ display: 'flex' }}>
          <Card title={t('leads.latestLeads')} style={{ flex: 1 }}>
            <Table dataSource={stats?.recentLeads || []} columns={leadColumns} rowKey="id" pagination={false} size="small" />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }} align="stretch">
        <Col span={12} style={{ display: 'flex' }}>
          <Card title={t('leads.dataOverview')} style={{ flex: 1 }}>
            <Row gutter={[16, 16]}>
              <Col span={8}><Statistic title={t('leads.totalCustomers')} value={overview.totalCustomers || 0} /></Col>
              <Col span={8}><Statistic title={t('leads.totalLeads')} value={overview.totalLeads || 0} /></Col>
              <Col span={8}><Statistic title={t('leads.totalArticles')} value={overview.totalArticles || 0} /></Col>
              <Col span={8}><Statistic title={t('leads.totalArticleViews')} value={overview.totalArticleViews || 0} /></Col>
              <Col span={8}><Statistic title={t('leads.totalArticleLeads')} value={overview.totalArticleLeads || 0} /></Col>
              <Col span={8}><Statistic title={t('leads.activeProducts')} value={overview.activeProducts || 0} /></Col>
            </Row>
          </Card>
        </Col>
        <Col span={12} style={{ display: 'flex' }}>
          <Card title={t('leads.channelDistribution')} style={{ flex: 1 }}>
            {(stats?.leadsBySource || []).map((item: any, i: number) => (
              <div key={item.source} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ width: 80, fontSize: 13 }}>{sourceLabels[item.source] || item.source}</span>
                <Progress percent={Math.round((item.count / (overview.totalLeads || 1)) * 100)} strokeColor={colors[i % 5]} style={{ flex: 1 }} />
                <span style={{ fontWeight: 600, width: 40, textAlign: 'right' }}>{item.count}</span>
              </div>
            ))}
            {!(stats?.leadsBySource?.length) && <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>{t('leads.noData')}</div>}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
