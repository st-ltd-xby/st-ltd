import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Typography, Space, Button, Tag, Badge, Divider, Progress
} from 'antd';
import {
  AppstoreOutlined, FileTextOutlined, TeamOutlined, UserOutlined,
  RiseOutlined, ShopOutlined, SearchOutlined, DatabaseOutlined,
  EyeOutlined, WarningOutlined, DashboardOutlined, FundOutlined,
  ShareAltOutlined, CaretUpOutlined, CaretDownOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { Title, Text } = Typography;

// 统计项组件
const StatItem: React.FC<{
  label: string;
  value: number | string;
  suffix?: string;
  trend?: { value: string; direction: 'up' | 'down' };
  color?: string;
}> = ({ label, value, suffix, trend, color = '#1d3557' }) => (
  <div style={{ textAlign: 'center', padding: '12px 8px' }}>
    <div style={{ fontSize: 28, fontWeight: 'bold', color, lineHeight: 1.2 }}>
      {typeof value === 'number' ? value.toLocaleString() : value}
      {suffix && <span style={{ fontSize: 14, marginLeft: 2 }}>{suffix}</span>}
    </div>
    <div style={{ fontSize: 13, color: '#8c8c8c', marginTop: 6 }}>{label}</div>
    {trend && (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, marginTop: 4, fontSize: 12 }}>
        {trend.direction === 'up'
          ? <CaretUpOutlined style={{ color: '#52c41a' }} />
          : <CaretDownOutlined style={{ color: '#f5222d' }} />}
        <span style={{ color: trend.direction === 'up' ? '#52c41a' : '#f5222d' }}>{trend.value}</span>
      </div>
    )}
  </div>
);

// 预警项组件
const AlertItem: React.FC<{
  level: 'error' | 'warning' | 'info';
  title: string;
  desc: string;
  time: string;
}> = ({ level, title, desc, time }) => {
  const config: Record<string, { color: string; label: string }> = {
    error: { color: '#f5222d', label: '严重' },
    warning: { color: '#fa8c16', label: '警告' },
    info: { color: '#1890ff', label: '提示' },
  };
  const c = config[level];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
      <Tag color={c.color} style={{ margin: 0, flexShrink: 0 }}>{c.label}</Tag>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{desc}</div>
      </div>
      <Text type="secondary" style={{ fontSize: 12, flexShrink: 0 }}>{time}</Text>
    </div>
  );
};

// 模块标题组件
const ModuleTitle: React.FC<{ icon: React.ReactNode; color: string; title: string }> = ({ icon, color, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{
      width: 32, height: 32, borderRadius: 8,
      background: `${color}15`, display: 'flex',
      alignItems: 'center', justifyContent: 'center'
    }}>
      {React.cloneElement(icon as React.ReactElement, { style: { color, fontSize: 16 } })}
    </div>
    <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
  </div>
);

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState({
    externalSites: 0,
    ownPortals: 0,
    builtPages: 0,
    leads: 0,
    customers: 0,
    articles: 0,
    videos: 0,
    whitepapers: 0,
    onlineStaff: 0,
    mallSites: 0,
    seoOptimized: 0,
    seoScore: 0,
    dataSites: 0,
    totalVisits: 0,
    todayVisits: 0,
  });

  const alerts = [
    { level: 'error' as const, title: 'API接口响应超时', desc: '/api/v1/sites 接口响应时间超过5秒', time: '2分钟前' },
    { level: 'warning' as const, title: '站点网址风险预警', desc: '检测到2个站点SSL证书即将过期，1个站点存在不安全HTTP连接', time: '1小时前' },
    { level: 'warning' as const, title: '存储空间不足', desc: '服务器磁盘使用率已达85%', time: '3小时前' },
    { level: 'info' as const, title: '系统更新可用', desc: '新版本 v2.3.1 已发布，包含安全补丁', time: '昨天' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`${API_BASE_URL}/api/v1/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.code === 0 || res.data.code === 200) {
          setDashboardData(prev => ({ ...prev, ...res.data.data }));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // 模拟数据
        setDashboardData({
          externalSites: 24,
          ownPortals: 8,
          builtPages: 156,
          leads: 342,
          customers: 128,
          articles: 89,
          videos: 34,
          whitepapers: 12,
          onlineStaff: 56,
          mallSites: 6,
          seoOptimized: 18,
          seoScore: 82,
          dataSites: 3,
          totalVisits: 45680,
          todayVisits: 1230,
        });
      }
    };
    fetchData();
  }, []);

  const healthItems = [
    { label: 'API服务', status: '正常', percent: 99, color: '#52c41a' },
    { label: '数据库', status: '正常', percent: 98, color: '#52c41a' },
    { label: '缓存服务', status: '正常', percent: 95, color: '#52c41a' },
    { label: '文件存储', status: '良好', percent: 85, color: '#fa8c16' },
    { label: '邮件服务', status: '正常', percent: 100, color: '#52c41a' },
  ];

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            <DashboardOutlined style={{ marginRight: 12, color: '#1890ff' }} />
            数据中心
          </Title>
          <Text type="secondary">ST-LTD 运营管理平台 - 业务全景概览</Text>
        </div>
        <Space>
          <Button icon={<ShareAltOutlined />}>分享报告</Button>
          <Button type="primary" icon={<FundOutlined />}>导出数据</Button>
        </Space>
      </div>

      {/* 系统预警信息 */}
      <Card
        title={<ModuleTitle icon={<WarningOutlined />} color="#f5222d" title="系统预警信息" />}
        extra={<Badge count={alerts.filter(a => a.level === 'error').length} style={{ backgroundColor: '#f5222d' }} />}
        style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 24 }}
        bodyStyle={{ padding: '8px 20px' }}
      >
        <Row gutter={[16, 8]}>
          {alerts.map((alert, idx) => (
            <Col xs={24} sm={12} key={idx}>
              <AlertItem {...alert} />
            </Col>
          ))}
        </Row>
      </Card>

      {/* 第一行：站点统计、页面搭建、商机客户、营销推广 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* 一、站点统计 */}
        <Col xs={24} sm={12} lg={12} xl={12}>
          <Card
            title={<ModuleTitle icon={<AppstoreOutlined />} color="#1890ff" title="站点统计" />}
            extra={<Button size="small" type="link">详情</Button>}
            style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <Row gutter={8}>
              <Col span={12}>
                <StatItem label="接入外部网站" value={dashboardData.externalSites} suffix="个"
                  trend={{ value: '+3', direction: 'up' }} color="#1890ff" />
              </Col>
              <Col span={12}>
                <StatItem label="企业自有门户" value={dashboardData.ownPortals} suffix="个"
                  trend={{ value: '+1', direction: 'up' }} color="#722ed1" />
              </Col>
            </Row>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>站点总数</Text>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1d3557' }}>
                {dashboardData.externalSites + dashboardData.ownPortals} 个
              </div>
            </div>
          </Card>
        </Col>

        {/* 二、页面搭建统计 */}
        <Col xs={24} sm={12} lg={12} xl={12}>
          <Card
            title={<ModuleTitle icon={<FileTextOutlined />} color="#722ed1" title="页面搭建统计" />}
            extra={<Button size="small" type="link">详情</Button>}
            style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <StatItem label="搭建简易门户" value={dashboardData.builtPages} suffix="个"
              trend={{ value: '+12', direction: 'up' }} color="#722ed1" />
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#52c41a' }}>142</div>
                <div style={{ fontSize: 12, color: '#999' }}>已上线</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#fa8c16' }}>10</div>
                <div style={{ fontSize: 12, color: '#999' }}>搭建中</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#999' }}>4</div>
                <div style={{ fontSize: 12, color: '#999' }}>待审核</div>
              </div>
            </div>
          </Card>
        </Col>

        {/* 三、商机与客户 */}
        <Col xs={24} sm={12} lg={12} xl={12}>
          <Card
            title={<ModuleTitle icon={<TeamOutlined />} color="#52c41a" title="商机与客户" />}
            extra={<Button size="small" type="link">详情</Button>}
            style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <Row gutter={8}>
              <Col span={12}>
                <StatItem label="商机线索" value={dashboardData.leads} suffix="条"
                  trend={{ value: '+28', direction: 'up' }} color="#fa8c16" />
              </Col>
              <Col span={12}>
                <StatItem label="收录客户" value={dashboardData.customers} suffix="家"
                  trend={{ value: '+8', direction: 'up' }} color="#52c41a" />
              </Col>
            </Row>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>线索转化率</Text>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>37.4%</div>
            </div>
          </Card>
        </Col>

        {/* 四、营销推广统计 */}
        <Col xs={24} sm={12} lg={12} xl={12}>
          <Card
            title={<ModuleTitle icon={<RiseOutlined />} color="#eb2f96" title="营销推广统计" />}
            extra={<Button size="small" type="link">详情</Button>}
            style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <Row gutter={4}>
              <Col span={8}>
                <StatItem label="文章推广" value={dashboardData.articles} suffix="篇" color="#1890ff" />
              </Col>
              <Col span={8}>
                <StatItem label="视频推广" value={dashboardData.videos} suffix="个" color="#722ed1" />
              </Col>
              <Col span={8}>
                <StatItem label="白皮书" value={dashboardData.whitepapers} suffix="篇" color="#13c2c2" />
              </Col>
            </Row>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <UserOutlined style={{ color: '#52c41a' }} />
                <Text type="secondary" style={{ fontSize: 12 }}>线上参与人员</Text>
              </div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>{dashboardData.onlineStaff} 人</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 第二行：商城、SEO、数据站、访问量 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* 五、自有商城统计 */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            title={<ModuleTitle icon={<ShopOutlined />} color="#fa8c16" title="自有商城统计" />}
            extra={<Button size="small" type="link">详情</Button>}
            style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <StatItem label="接入自有商城" value={dashboardData.mallSites} suffix="个"
              trend={{ value: '+2', direction: 'up' }} color="#fa8c16" />
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#52c41a' }}>5</div>
                <div style={{ fontSize: 12, color: '#999' }}>运营中</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#999' }}>1</div>
                <div style={{ fontSize: 12, color: '#999' }}>待上线</div>
              </div>
            </div>
          </Card>
        </Col>

        {/* 六、SEO优化统计 */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            title={<ModuleTitle icon={<SearchOutlined />} color="#13c2c2" title="SEO优化统计" />}
            extra={<Button size="small" type="link">详情</Button>}
            style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <StatItem label="已优化站点" value={dashboardData.seoOptimized} suffix="个"
              trend={{ value: '+4', direction: 'up' }} color="#13c2c2" />
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>平均SEO评分</Text>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#13c2c2' }}>{dashboardData.seoScore} 分</div>
            </div>
          </Card>
        </Col>

        {/* 七、数据站接入统计 */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            title={<ModuleTitle icon={<DatabaseOutlined />} color="#2f54eb" title="数据站接入统计" />}
            extra={<Button size="small" type="link">详情</Button>}
            style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <StatItem label="数据站接入" value={dashboardData.dataSites} suffix="个"
              trend={{ value: '+1', direction: 'up' }} color="#2f54eb" />
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#52c41a' }}>2</div>
                <div style={{ fontSize: 12, color: '#999' }}>已同步</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#fa8c16' }}>1</div>
                <div style={{ fontSize: 12, color: '#999' }}>同步中</div>
              </div>
            </div>
          </Card>
        </Col>

        {/* 八、系统访问量统计 */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            title={<ModuleTitle icon={<EyeOutlined />} color="#52c41a" title="系统访问量统计" />}
            extra={<Button size="small" type="link">详情</Button>}
            style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <Row gutter={8}>
              <Col span={12}>
                <StatItem label="总访问量" value={dashboardData.totalVisits} suffix="次" color="#1890ff" />
              </Col>
              <Col span={12}>
                <StatItem label="今日访问" value={dashboardData.todayVisits} suffix="次"
                  trend={{ value: '+15%', direction: 'up' }} color="#52c41a" />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 第三行：系统健康状态 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={<ModuleTitle icon={<SafetyCertificateOutlined />} color="#52c41a" title="系统健康状态" />}
            style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            {healthItems.map((item, idx) => (
              <div key={idx} style={{ marginBottom: idx < healthItems.length - 1 ? 16 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 13 }}>{item.label}</Text>
                  <Tag color={item.color === '#52c41a' ? 'success' : 'warning'} style={{ margin: 0, fontSize: 12 }}>{item.status}</Tag>
                </div>
                <Progress percent={item.percent} strokeColor={item.color} strokeWidth={8} size="small" showInfo={false} />
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={<ModuleTitle icon={<RiseOutlined />} color="#1890ff" title="访问量趋势（本周）" />}
            style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 200, padding: '20px 0' }}>
              {[
                { day: '周一', v1: 52, v2: 120 },
                { day: '周二', v1: 48, v2: 115 },
                { day: '周三', v1: 61, v2: 142 },
                { day: '周四', v1: 55, v2: 130 },
                { day: '周五', v1: 72, v2: 168 },
                { day: '周六', v1: 68, v2: 152 },
                { day: '周日', v1: 59, v2: 135 },
              ].map((d, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 150 }}>
                    <div style={{ width: 20, height: `${d.v1}%`, background: '#1890ff', borderRadius: '4px 4px 0 0' }} />
                    <div style={{ width: 20, height: `${d.v2 / 2}%`, background: '#52c41a', borderRadius: '4px 4px 0 0' }} />
                  </div>
                  <Text style={{ fontSize: 12 }}>{d.day}</Text>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, background: '#1890ff', borderRadius: 2 }} />
                <Text style={{ fontSize: 12 }}>系统访问量(百)</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, background: '#52c41a', borderRadius: 2 }} />
                <Text style={{ fontSize: 12 }}>页面浏览量(百)</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
