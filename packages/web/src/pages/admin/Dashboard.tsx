import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Table, Tag, Typography, Progress, Spin, Empty } from 'antd';
import { 
  UserOutlined, 
  RiseOutlined, 
  EyeOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { Column } from '@ant-design/charts';
import { dashboardApi } from '../../services/api';

const { Title } = Typography;

const AdminDashboard: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [funnel, setFunnel] = useState<any[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [leadsBySource, setLeadsBySource] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, funnelRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getFunnel(),
      ]);
      const statsData = statsRes.data || statsRes;
      const funnelData = funnelRes.data || funnelRes;
      setOverview(statsData.overview);
      setRecentLeads(statsData.recentLeads || []);
      setLeadsBySource(statsData.leadsBySource || []);
      setFunnel(funnelData.funnel || []);
    } catch (err: any) {
      setError(err.message || '数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 销售趋势图 - 用线索来源分布数据替代
  const sourceChartData = leadsBySource.length > 0
    ? leadsBySource.map((item: any) => ({ type: item.source || '未知', sales: item.count }))
    : [];

  const statusColorMap: Record<string, string> = {
    new: 'blue',
    following: 'orange',
    qualified: 'purple',
    won: 'green',
    lost: 'red',
  };

  const statusLabelMap: Record<string, string> = {
    new: '新线索',
    following: '跟进中',
    qualified: '已确认',
    won: '已成交',
    lost: '已流失',
  };

  const leadColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '公司', dataIndex: 'company', key: 'company', render: (v: string) => v || '-' },
    { title: '来源', dataIndex: 'source', key: 'source', render: (v: string) => v || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={statusColorMap[v] || 'default'}>{statusLabelMap[v] || v || '-'}</Tag>
      ),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="加载数据中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Empty description={error}>
          <Card.Actions>
            <a onClick={fetchData}>重新加载</a>
          </Card.Actions>
        </Empty>
      </div>
    );
  }

  const fmt = (n: number) => n?.toLocaleString('zh-CN') || '0';
  const fmtMoney = (n: number) => '¥' + (n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>数据看板</Title>
        <a onClick={fetchData} style={{ cursor: 'pointer' }}><ReloadOutlined /> 刷新</a>
      </div>

      {/* 第一行：核心指标 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={12} xl={12}>
          <Card>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="今日访问"
                  value={overview?.todayPageViews || 0}
                  prefix={<EyeOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="今日新增线索"
                  value={overview?.todayLeads || 0}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={12} xl={12}>
          <Card>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="本月商机金额"
                  value={overview?.monthOpportunityAmount || 0}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="本月成交订单"
                  value={overview?.monthWonOrders || 0}
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 第二行：累计指标 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={12} xl={12}>
          <Card>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="总客户数"
                  value={overview?.totalCustomers || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#13c2c2' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="总线索数"
                  value={overview?.totalLeads || 0}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="总访问量"
                  value={overview?.totalPageViews || 0}
                  prefix={<EyeOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={12} xl={12}>
          <Card>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="文章总数"
                  value={overview?.totalArticles || 0}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#2f54eb' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="文章总阅读"
                  value={overview?.totalArticleViews || 0}
                  prefix={<EyeOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="文章引流线索"
                  value={overview?.totalArticleLeads || 0}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 第三行：图表 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={14}>
          <Card title="线索来源分布">
            {sourceChartData.length > 0 ? (
              <Column 
                data={sourceChartData} 
                xField="type"
                yField="sales"
                height={280}
                color="#1890ff"
              />
            ) : (
              <Empty description="暂无线索来源数据" style={{ padding: 60 }} />
            )}
          </Card>
        </Col>
        <Col span={10}>
          <Card title="获客漏斗">
            {funnel.length > 0 ? (
              funnel.map((item: any, index: number) => {
                const pct = funnel[0]?.count > 0 ? Math.round((item.count / funnel[0].count) * 100) : 0;
                return (
                  <div key={index} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>{item.stage}</span>
                      <span>{fmt(item.count)} ({pct}%)</span>
                    </div>
                    <Progress percent={pct} showInfo={false} strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }} />
                  </div>
                );
              })
            ) : (
              <Empty description="暂无漏斗数据" style={{ padding: 40 }} />
            )}
          </Card>
        </Col>
      </Row>

      {/* 第四行：最新线索 */}
      <Row gutter={16}>
        <Col span={24}>
          <Card title="最新线索">
            <Table 
              dataSource={recentLeads} 
              columns={leadColumns} 
              rowKey="id" 
              pagination={{ pageSize: 5, showSizeChanger: false }}
              locale={{ emptyText: '暂无线索数据' }}
              size="middle"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;