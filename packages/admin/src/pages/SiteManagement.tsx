import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Input, 
  Modal, 
  Form, 
  message, 
  Tag, 
  Select, 
  Popconfirm, 
  Tabs, 
  Statistic, 
  Row, 
  Col,
  Tooltip,
  Switch
} from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { TabPane } = Tabs;
const { Option } = Select;

interface Site {
  id: string;
  name: string;
  domain: string;
  status: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  owner: string;
  traffic: number;
  sslEnabled: boolean;
  auditStatus: 'pending' | 'approved' | 'rejected';
  seoScore: number;
  loadingSpeed: number; // in seconds
}

const SiteManagement: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentSite, setCurrentSite] = useState<Site | null>(null);
  const [activeTab, setActiveTab] = useState('sites');
  const [searchTerm, setSearchTerm] = useState('');
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  
  const siteTypes = [
    { value: 'pc', label: 'PC官网', color: 'blue' },
    { value: 'h5', label: 'H5页面', color: 'green' },
    { value: 'miniapp', label: '小程序', color: 'purple' },
    { value: 'mall', label: '商城', color: 'orange' },
    { value: 'blog', label: '博客', color: 'geekblue' },
    { value: 'other', label: '其他', color: 'default' },
  ];
  
  const siteStatuses = [
    { value: 'active', label: '活跃', color: 'success' },
    { value: 'inactive', label: '停用', color: 'default' },
    { value: 'pending', label: '待审核', color: 'warning' },
    { value: 'suspended', label: '已暂停', color: 'error' },
  ];
  
  const auditStatuses = [
    { value: 'pending', label: '待审核', color: 'warning' },
    { value: 'approved', label: '已批准', color: 'success' },
    { value: 'rejected', label: '已拒绝', color: 'error' },
  ];

  // 获取网站列表
  const fetchSites = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/sites`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.code === 0 || response.data.code === 200) {
        setSites(response.data.data.list || response.data.data);
      } else {
        message.error(response.data.message || '获取网站列表失败');
      }
    } catch (error: any) {
      console.error('Error fetching sites:', error);
      message.error(error.response?.data?.message || '获取网站列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取网站列表
  useEffect(() => {
    fetchSites();
  }, []);

  // 显示新增网站模态框
  const showModal = () => {
    createForm.resetFields();
    setIsModalVisible(true);
  };

  // 显示编辑网站模态框
  const showEditModal = (site: Site) => {
    setCurrentSite(site);
    editForm.setFieldsValue({
      name: site.name,
      domain: site.domain,
      type: site.type,
      status: site.status || 'active',
      sslEnabled: site.sslEnabled || false,
      auditStatus: site.auditStatus || 'approved',
    });
    setIsEditModalVisible(true);
  };

  // 创建新网站
  const handleCreateSite = async () => {
    try {
      const values = await createForm.validateFields();
      
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_BASE_URL}/api/v1/admin/sites`, values, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.code === 0 || response.data.code === 200) {
        message.success('网站创建成功');
        setIsModalVisible(false);
        createForm.resetFields();
        fetchSites();
      } else {
        message.error(response.data.message || '网站创建失败');
      }
    } catch (error: any) {
      console.error('Error creating site:', error);
      message.error(error.response?.data?.message || '网站创建失败');
    }
  };

  // 更新网站
  const handleUpdateSite = async () => {
    if (!currentSite) return;
    
    try {
      const values = await editForm.validateFields();
      
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(`${API_BASE_URL}/api/v1/admin/sites/${currentSite.id}`, values, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.code === 0 || response.data.code === 200) {
        message.success('网站更新成功');
        setIsEditModalVisible(false);
        setCurrentSite(null);
        editForm.resetFields();
        fetchSites();
      } else {
        message.error(response.data.message || '网站更新失败');
      }
    } catch (error: any) {
      console.error('Error updating site:', error);
      message.error(error.response?.data?.message || '网站更新失败');
    }
  };

  // 删除网站
  const handleDeleteSite = async (id: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.delete(`${API_BASE_URL}/api/v1/admin/sites/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.code === 0 || response.data.code === 200) {
        message.success('网站删除成功');
        fetchSites(); // 重新获取网站列表
      } else {
        message.error(response.data.message || '网站删除失败');
      }
    } catch (error: any) {
      console.error('Error deleting site:', error);
      message.error(error.response?.data?.message || '网站删除失败');
    }
  };

  // 审核网站
  const handleAuditSite = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.patch(`${API_BASE_URL}/api/v1/admin/sites/${id}/audit`, {
        auditStatus: status
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.code === 0 || response.data.code === 200) {
        message.success(`网站${status === 'approved' ? '审核通过' : '审核拒绝'}成功`);
        fetchSites(); // 重新获取网站列表
      } else {
        message.error(response.data.message || `网站审核${status === 'approved' ? '通过' : '拒绝'}失败`);
      }
    } catch (error: any) {
      console.error(`Error ${status === 'approved' ? 'approving' : 'rejecting'} site:`, error);
      message.error(error.response?.data?.message || `网站审核${status === 'approved' ? '通过' : '拒绝'}失败`);
    }
  };

  // 处理取消
  const handleCancel = () => {
    setIsModalVisible(false);
    setIsEditModalVisible(false);
    setCurrentSite(null);
    createForm.resetFields();
    editForm.resetFields();
  };

  // 过滤网站
  const filteredSites = sites.filter(site => 
    site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 计算统计数据
  const totalSites = sites.length;
  const activeSites = sites.filter(site => site.status === 'active').length;
  const pendingAuditSites = sites.filter(site => site.auditStatus === 'pending').length;
  const avgSeoScore = sites.length > 0 ? Math.round(sites.reduce((sum, site) => sum + site.seoScore, 0) / sites.length) : 0;

  return (
    <div>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="网站管理" key="sites">
            <div style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic title="总网站数" value={totalSites} />
                </Col>
                <Col span={6}>
                  <Statistic title="活跃网站" value={activeSites} />
                </Col>
                <Col span={6}>
                  <Statistic title="待审核" value={pendingAuditSites} />
                </Col>
                <Col span={6}>
                  <Statistic title="平均SEO评分" value={avgSeoScore} suffix="/100" />
                </Col>
              </Row>
            </div>
            
            <Card 
              title="网站列表" 
              extra={
                <Space>
                  <Input 
                    placeholder="搜索网站（名称/域名/ID）..." 
                    prefix={<SearchOutlined />} 
                    style={{ width: 300 }} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
                    新增网站
                  </Button>
                </Space>
              }
            >
              <Table 
                dataSource={filteredSites} 
                rowKey="id" 
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条数据`
                }}
              >
                <Table.Column title="ID" dataIndex="id" key="id" width={120} />
                <Table.Column 
                  title="网站名称" 
                  dataIndex="name" 
                  key="name" 
                  sorter={(a: Site, b: Site) => a.name.localeCompare(b.name)}
                />
                <Table.Column 
                  title="域名" 
                  dataIndex="domain" 
                  key="domain" 
                  render={(domain) => (
                    <Tooltip title="点击访问网站">
                      <a href={`http://${domain}`} target="_blank" rel="noopener noreferrer">
                        {domain}
                      </a>
                    </Tooltip>
                  )}
                />
                <Table.Column 
                  title="类型" 
                  dataIndex="type" 
                  key="type" 
                  render={(type) => {
                    const typeInfo = siteTypes.find(t => t.value === type);
                    return (
                      <Tag color={typeInfo?.color || 'default'}>
                        {typeInfo?.label || type}
                      </Tag>
                    );
                  }}
                  filters={siteTypes.map(type => ({ text: type.label, value: type.value }))}
                  onFilter={(value, record) => record.type === value}
                />
                <Table.Column 
                  title="状态" 
                  dataIndex="status" 
                  key="status" 
                  render={(status) => {
                    const statusInfo = siteStatuses.find(s => s.value === status);
                    return (
                      <Tag color={statusInfo?.color || 'default'}>
                        {statusInfo?.label || status}
                      </Tag>
                    );
                  }}
                  filters={siteStatuses.map(status => ({ text: status.label, value: status.value }))}
                  onFilter={(value, record) => record.status === value}
                />
                <Table.Column 
                  title="审核状态" 
                  dataIndex="auditStatus" 
                  key="auditStatus" 
                  render={(auditStatus) => {
                    const auditInfo = auditStatuses.find(s => s.value === auditStatus);
                    return (
                      <Tag color={auditInfo?.color || 'default'}>
                        {auditInfo?.label || auditStatus}
                      </Tag>
                    );
                  }}
                  filters={auditStatuses.map(status => ({ text: status.label, value: status.value }))}
                  onFilter={(value, record) => record.auditStatus === value}
                />
                <Table.Column 
                  title="访问量" 
                  dataIndex="traffic" 
                  key="traffic" 
                  render={(traffic) => `${(traffic / 1000).toFixed(1)}k`}
                />
                <Table.Column 
                  title="SEO评分" 
                  dataIndex="seoScore" 
                  key="seoScore" 
                  render={(score) => (
                    <div>
                      <Tag color={score >= 80 ? 'green' : score >= 60 ? 'gold' : 'red'}>
                        {score}/100
                      </Tag>
                    </div>
                  )}
                  sorter={(a: Site, b: Site) => a.seoScore - b.seoScore}
                />
                <Table.Column 
                  title="SSL" 
                  dataIndex="sslEnabled" 
                  key="sslEnabled" 
                  render={(enabled) => (
                    <Tag color={enabled ? 'green' : 'red'}>
                      {enabled ? '启用' : '未启用'}
                    </Tag>
                  )}
                />
                <Table.Column 
                  title="创建时间" 
                  dataIndex="createdAt" 
                  key="createdAt" 
                  render={(date) => new Date(date).toLocaleString('zh-CN')}
                  sorter={(a: Site, b: Site) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()}
                />
                <Table.Column 
                  title="所有者" 
                  dataIndex="owner" 
                  key="owner" 
                />
                <Table.Column
                  title="操作"
                  key="action"
                  fixed="right"
                  width={220}
                  render={(_: any, record: Site) => (
                    <Space size="middle">
                      <Tooltip title="预览网站">
                        <Button 
                          type="link" 
                          icon={<EyeOutlined />} 
                          onClick={() => window.open(`http://${record.domain}`, '_blank')}
                        >
                          预览
                        </Button>
                      </Tooltip>
                      <Tooltip title="编辑网站">
                        <Button 
                          type="link" 
                          icon={<EditOutlined />} 
                          onClick={() => showEditModal(record)}
                        >
                          编辑
                        </Button>
                      </Tooltip>
                      {record.auditStatus === 'pending' && (
                        <Space size="small">
                          <Tooltip title="审核通过">
                            <Button 
                              type="link" 
                              icon={<CheckCircleOutlined />} 
                              onClick={() => handleAuditSite(record.id, 'approved')}
                              style={{ color: 'green' }}
                            >
                              通过
                            </Button>
                          </Tooltip>
                          <Tooltip title="审核拒绝">
                            <Button 
                              type="link" 
                              icon={<CloseCircleOutlined />} 
                              onClick={() => handleAuditSite(record.id, 'rejected')}
                              style={{ color: 'red' }}
                            >
                              拒绝
                            </Button>
                          </Tooltip>
                        </Space>
                      )}
                      <Popconfirm
                        title="确定要删除这个网站吗？"
                        onConfirm={() => handleDeleteSite(record.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button 
                          type="link" 
                          danger 
                          icon={<DeleteOutlined />}
                        >
                          删除
                        </Button>
                      </Popconfirm>
                    </Space>
                  )}
                />
              </Table>
            </Card>
          </TabPane>
          
          <TabPane tab="安全设置" key="security">
            <Card title="网站安全配置">
              <p>安全配置功能允许您管理网站的安全设置，包括：</p>
              <ul>
                <li>SSL证书管理</li>
                <li>访问控制列表</li>
                <li>防火墙设置</li>
                <li>DDoS防护配置</li>
                <li>安全扫描报告</li>
              </ul>
              <Button icon={<SafetyCertificateOutlined />} type="primary" style={{ marginTop: 16 }}>
                批量安全设置
              </Button>
            </Card>
          </TabPane>
          
          <TabPane tab="SEO分析" key="seo">
            <Card title="SEO性能分析">
              <p>SEO分析功能允许您监控和优化网站的搜索引擎排名，包括：</p>
              <ul>
                <li>关键词排名监控</li>
                <li>页面加载速度分析</li>
                <li>移动端适配检查</li>
                <li>结构化数据检测</li>
                <li>反向链接分析</li>
              </ul>
              <Button icon={<GlobalOutlined />} type="primary" style={{ marginTop: 16 }}>
                批量SEO优化
              </Button>
            </Card>
          </TabPane>
          
          <TabPane tab="数据分析" key="analytics">
            <Card title="网站访问统计">
              <p>数据分析功能提供详细的网站访问统计和用户行为分析，包括：</p>
              <ul>
                <li>访问量统计（UV/PV）</li>
                <li>用户地域分布</li>
                <li>设备类型分析</li>
                <li>访问时长统计</li>
                <li>跳出率分析</li>
              </ul>
              <Button icon={<BarChartOutlined />} type="primary" style={{ marginTop: 16 }}>
                查看详细报告
              </Button>
            </Card>
          </TabPane>
        </Tabs>
      </Card>
      
      {/* 新增网站模态框 */}
      <Modal
        title="新增网站"
        open={isModalVisible}
        onOk={handleCreateSite}
        onCancel={handleCancel}
        destroyOnClose
        okText="创建"
        cancelText="取消"
      >
        <Form
          form={createForm}
          layout="vertical"
          name="siteForm"
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="网站名称"
            rules={[{ required: true, message: '请输入网站名称!' }]}
          >
            <Input placeholder="请输入网站名称" />
          </Form.Item>
          <Form.Item
            name="domain"
            label="域名"
            rules={[{ required: true, message: '请输入域名!' }]}
          >
            <Input placeholder="请输入完整域名，如 example.com" />
          </Form.Item>
          <Form.Item
            name="type"
            label="网站类型"
            rules={[{ required: true, message: '请选择网站类型!' }]}
          >
            <Select placeholder="请选择网站类型">
              {siteTypes.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="初始状态"
            rules={[{ required: true, message: '请选择初始状态!' }]}
          >
            <Select placeholder="请选择初始状态">
              {siteStatuses.filter(status => status.value !== 'pending').map(status => (
                <Option key={status.value} value={status.value}>{status.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="sslEnabled"
            label="启用SSL"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 编辑网站模态框 */}
      <Modal
        title="编辑网站"
        open={isEditModalVisible}
        onOk={handleUpdateSite}
        onCancel={handleCancel}
        destroyOnClose
        okText="更新"
        cancelText="取消"
      >
        <Form
          form={editForm}
          layout="vertical"
          name="editSiteForm"
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="网站名称"
            rules={[{ required: true, message: '请输入网站名称!' }]}
          >
            <Input placeholder="请输入网站名称" />
          </Form.Item>
          <Form.Item
            name="domain"
            label="域名"
            rules={[{ required: true, message: '请输入域名!' }]}
          >
            <Input placeholder="请输入完整域名" />
          </Form.Item>
          <Form.Item
            name="type"
            label="网站类型"
            rules={[{ required: true, message: '请选择网站类型!' }]}
          >
            <Select placeholder="请选择网站类型">
              {siteTypes.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态!' }]}
          >
            <Select placeholder="请选择状态">
              {siteStatuses.map(status => (
                <Option key={status.value} value={status.value}>{status.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="auditStatus"
            label="审核状态"
            rules={[{ required: true, message: '请选择审核状态!' }]}
          >
            <Select placeholder="请选择审核状态">
              {auditStatuses.map(status => (
                <Option key={status.value} value={status.value}>{status.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="sslEnabled"
            label="启用SSL"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SiteManagement;