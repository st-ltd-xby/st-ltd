import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Table, Tag, Space, Typography, Progress } from 'antd';
import { 
  UserOutlined, 
  RiseOutlined, 
  ShoppingCartOutlined, 
  EyeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { Column } from '@ant-design/charts';

const { Title } = Typography;

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCustomers: 0,
    totalLeads: 0,
    totalRevenue: 0,
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟加载数据
    setTimeout(() => {
      setStats({
        totalUsers: 24,
        totalCustomers: 156,
        totalLeads: 89,
        totalRevenue: 125000,
      });

      setRecentActivities([
        { id: 1, action: '新用户注册', user: '张三', time: '2分钟前', type: 'info' },
        { id: 2, action: '新线索到达', user: '李四', time: '15分钟前', type: 'success' },
        { id: 3, action: '商机更新', user: '王五', time: '30分钟前', type: 'warning' },
        { id: 4, action: '订单完成', user: '赵六', time: '1小时前', type: 'success' },
        { id: 5, action: '系统配置更新', user: '管理员', time: '2小时前', type: 'default' },
      ]);

      setLoading(false);
    }, 800);
  }, []);

  // 模拟图表数据
  const columnData = [
    { type: '一月', sales: 3800 },
    { type: '二月', sales: 5000 },
    { type: '三月', sales: 4200 },
    { type: '四月', sales: 6100 },
    { type: '五月', sales: 5800 },
    { type: '六月', sales: 7200 },
  ];

  const leadFunnelData = [
    { stage: '访问者', count: 10000, percentage: 100 },
    { stage: '产生线索', count: 1500, percentage: 15 },
    { stage: '商机客户', count: 650, percentage: 6.5 },
    { stage: '报价跟进', count: 320, percentage: 3.2 },
    { stage: '成交', count: 120, percentage: 1.2 },
  ];

  const columns = [
    {
      title: '活动',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: '状态',
      key: 'type',
      render: (record: any) => (
        <Tag color={
          record.type === 'success' ? 'green' :
          record.type === 'warning' ? 'orange' :
          record.type === 'error' ? 'red' : 'blue'
        }>
          {record.type === 'success' ? '成功' :
           record.type === 'warning' ? '警告' :
           record.type === 'error' ? '错误' : '信息'}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>管理仪表盘</Title>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总客户数"
              value={stats.totalCustomers}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总线索数"
              value={stats.totalLeads}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总收入"
              value={stats.totalRevenue}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#cf1322' }}
              suffix="/元"
            />
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
              <ArrowUpOutlined style={{ color: '#cf1322' }} />
              <span style={{ marginLeft: 4, color: '#cf1322' }}>12.5%</span>
              <span style={{ marginLeft: 8, color: '#8c8c8c' }}>较上月</span>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card title="销售趋势图" loading={loading}>
            <Column 
              data={columnData} 
              xField="type"
              yField="sales"
              height={300}
              color="#52c41a"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="获客漏斗" loading={loading}>
            {leadFunnelData.map((item, index) => (
              <div key={index} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>{item.stage}</span>
                  <span>{item.count} ({item.percentage}%)</span>
                </div>
                <Progress percent={item.percentage} showInfo={false} strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }} />
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="最近活动" loading={loading}>
            <Table 
              dataSource={recentActivities} 
              columns={columns} 
              rowKey="id" 
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="系统状态">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>服务器状态</span>
                <Tag color="green">运行中</Tag>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>数据库连接</span>
                <Tag color="green">正常</Tag>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>API服务</span>
                <Tag color="green">可用</Tag>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>系统负载</span>
                <Tag color="orange">中等</Tag>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;