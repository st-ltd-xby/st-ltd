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
  BarChartOutlined,
  BuildOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { TabPane } = Tabs;
const { Option } = Select;

interface Page {
  id: string;
  title: string;
  slug: string;
  status: string;
  siteId: string;
  siteName: string;
  type: string;
  seoTitle?: string;
  seoDescription?: string;
  traffic: number;
  auditStatus: 'pending' | 'approved' | 'rejected';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

const PageBuilderManagement: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [activeTab, setActiveTab] = useState('pages');
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();
  
  const pageTypes = [
    { value: 'landing', label: '落地页', color: 'blue' },
    { value: 'product', label: '产品页', color: 'green' },
    { value: 'about', label: '关于我们', color: 'orange' },
    { value: 'contact', label: '联系页面', color: 'purple' },
    { value: 'form', label: '表单页面', color: 'cyan' },
    { value: 'other', label: '其他', color: 'default' },
  ];
  
  const pageStatuses = [
    { value: 'published', label: '已发布', color: 'success' },
    { value: 'draft', label: '草稿', color: 'default' },
    { value: 'archived', label: '已归档', color: 'warning' },
  ];
  
  const auditStatuses = [
    { value: 'pending', label: '待审核', color: 'warning' },
    { value: 'approved', label: '已批准', color: 'success' },
    { value: 'rejected', label: '已拒绝', color: 'error' },
  ];

  // 获取页面列表
  const fetchPages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/pages`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.code === 0 || response.data.code === 200) {
        setPages(response.data.data.list || response.data.data);
      } else {
        message.error(response.data.message || '获取页面列表失败');
      }
    } catch (error: any) {
      console.error('Error fetching pages:', error);
      message.error(error.response?.data?.message || '获取页面列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取页面列表
  useEffect(() => {
    fetchPages();
  }, []);

  // 显示新增页面模态框
  const showModal = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  // 显示编辑页面模态框
  const showEditModal = (page: Page) => {
    setCurrentPage(page);
    form.setFieldsValue({
      title: page.title,
      slug: page.slug,
      siteId: page.siteId,
      type: page.type,
      status: page.status,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      auditStatus: page.auditStatus,
    });
    setIsEditModalVisible(true);
  };

  // 创建新页面
  const handleCreatePage = async () => {
    try {
      const values = await form.validateFields();
      
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_BASE_URL}/api/v1/admin/pages`, values, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.code === 0 || response.data.code === 200) {
        message.success('页面创建成功');
        setIsModalVisible(false);
        form.resetFields();
        fetchPages(); // 重新获取页面列表
      } else {
        message.error(response.data.message || '页面创建失败');
      }
    } catch (error: any) {
      console.error('Error creating page:', error);
      message.error(error.response?.data?.message || '页面创建失败');
    }
  };

  // 更新页面
  const handleUpdatePage = async () => {
    if (!currentPage) return;
    
    try {
      const values = await form.validateFields();
      
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(`${API_BASE_URL}/api/v1/admin/pages/${currentPage.id}`, values, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.code === 0 || response.data.code === 200) {
        message.success('页面更新成功');
        setIsEditModalVisible(false);
        setCurrentPage(null);
        form.resetFields();
        fetchPages(); // 重新获取页面列表
      } else {
        message.error(response.data.message || '页面更新失败');
      }
    } catch (error: any) {
      console.error('Error updating page:', error);
      message.error(error.response?.data?.message || '页面更新失败');
    }
  };

  // 删除页面
  const handleDeletePage = async (id: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.delete(`${API_BASE_URL}/api/v1/admin/pages/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.code === 0 || response.data.code === 200) {
        message.success('页面删除成功');
        fetchPages(); // 重新获取页面列表
      } else {
        message.error(response.data.message || '页面删除失败');
      }
    } catch (error: any) {
      console.error('Error deleting page:', error);
      message.error(error.response?.data?.message || '页面删除失败');
    }
  };

  // 审核页面
  const handleAuditPage = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.patch(`${API_BASE_URL}/api/v1/admin/pages/${id}/audit`, {
        auditStatus: status
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.code === 0 || response.data.code === 200) {
        message.success(`页面${status === 'approved' ? '审核通过' : '审核拒绝'}成功`);
        fetchPages(); // 重新获取页面列表
      } else {
        message.error(response.data.message || `页面审核${status === 'approved' ? '通过' : '拒绝'}失败`);
      }
    } catch (error: any) {
      console.error(`Error ${status === 'approved' ? 'approving' : 'rejecting'} page:`, error);
      message.error(error.response?.data?.message || `页面审核${status === 'approved' ? '通过' : '拒绝'}失败`);
    }
  };

  // 处理取消
  const handleCancel = () => {
    setIsModalVisible(false);
    setIsEditModalVisible(false);
    setCurrentPage(null);
    form.resetFields();
  };

  // 过滤页面
  const filteredPages = pages.filter(page => 
    page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 计算统计数据
  const totalPages = pages.length;
  const publishedPages = pages.filter(page => page.status === 'published').length;
  const pendingAuditPages = pages.filter(page => page.auditStatus === 'pending').length;
  const avgTraffic = pages.length > 0 ? Math.round(pages.reduce((sum, page) => sum + page.traffic, 0) / pages.length) : 0;

  return (
    <div>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="页面管理" key="pages">
            <div style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic title="总页面数" value={totalPages} />
                </Col>
                <Col span={6}>
                  <Statistic title="已发布页面" value={publishedPages} />
                </Col>
                <Col span={6}>
                  <Statistic title="待审核" value={pendingAuditPages} />
                </Col>
                <Col span={6}>
                  <Statistic title="平均访问量" value={avgTraffic} />
                </Col>
              </Row>
            </div>
            
            <Card 
              title="页面列表" 
              extra={
                <Space>
                  <Input 
                    placeholder="搜索页面（标题/路径/ID）..." 
                    prefix={<SearchOutlined />} 
                    style={{ width: 300 }} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
                    新增页面
                  </Button>
                </Space>
              }
            >
              <Table 
                dataSource={filteredPages} 
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
                  title="页面标题" 
                  dataIndex="title" 
                  key="title" 
                  sorter={(a: Page, b: Page) => a.title.localeCompare(b.title)}
                />
                <Table.Column 
                  title="路径" 
                  dataIndex="slug" 
                  key="slug" 
                  render={(slug, record) => (
                    <Tooltip title="点击访问页面">
                      <a href={`http://${record.siteId}/${slug}`} target="_blank" rel="noopener noreferrer">
                        /{slug}
                      </a>
                    </Tooltip>
                  )}
                />
                <Table.Column 
                  title="所属网站" 
                  dataIndex="siteName" 
                  key="siteName" 
                />
                <Table.Column 
                  title="类型" 
                  dataIndex="type" 
                  key="type" 
                  render={(type) => {
                    const typeInfo = pageTypes.find(t => t.value === type);
                    return (
                      <Tag color={typeInfo?.color || 'default'}>
                        {typeInfo?.label || type}
                      </Tag>
                    );
                  }}
                  filters={pageTypes.map(type => ({ text: type.label, value: type.value }))}
                  onFilter={(value, record) => record.type === value}
                />
                <Table.Column 
                  title="状态" 
                  dataIndex="status" 
                  key="status" 
                  render={(status) => {
                    const statusInfo = pageStatuses.find(s => s.value === status);
                    return (
                      <Tag color={statusInfo?.color || 'default'}>
                        {statusInfo?.label || status}
                      </Tag>
                    );
                  }}
                  filters={pageStatuses.map(status => ({ text: status.label, value: status.value }))}
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
                  title="SEO标题" 
                  dataIndex="seoTitle" 
                  key="seoTitle" 
                  render={(seoTitle) => seoTitle || '-'}
                />
                <Table.Column 
                  title="创建时间" 
                  dataIndex="createdAt" 
                  key="createdAt" 
                  render={(date) => new Date(date).toLocaleString('zh-CN')}
                  sorter={(a: Page, b: Page) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()}
                />
                <Table.Column 
                  title="创建者" 
                  dataIndex="createdBy" 
                  key="createdBy" 
                />
                <Table.Column
                  title="操作"
                  key="action"
                  fixed="right"
                  width={250}
                  render={(_: any, record: Page) => (
                    <Space size="middle">
                      <Tooltip title="预览页面">
                        <Button 
                          type="link" 
                          icon={<EyeOutlined />} 
                          onClick={() => window.open(`http://${record.siteId}/${record.slug}`, '_blank')}
                        >
                          预览
                        </Button>
                      </Tooltip>
                      <Tooltip title="编辑页面">
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
                              onClick={() => handleAuditPage(record.id, 'approved')}
                              style={{ color: 'green' }}
                            >
                              通过
                            </Button>
                          </Tooltip>
                          <Tooltip title="审核拒绝">
                            <Button 
                              type="link" 
                              icon={<CloseCircleOutlined />} 
                              onClick={() => handleAuditPage(record.id, 'rejected')}
                              style={{ color: 'red' }}
                            >
                              拒绝
                            </Button>
                          </Tooltip>
                        </Space>
                      )}
                      <Popconfirm
                        title="确定要删除这个页面吗？"
                        onConfirm={() => handleDeletePage(record.id)}
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
          
          <TabPane tab="模板管理" key="templates">
            <Card title="页面模板管理">
              <p>页面模板功能允许您创建和管理可复用的页面模板，包括：</p>
              <ul>
                <li>预设页面模板库</li>
                <li>自定义模板创建</li>
                <li>模板分类管理</li>
                <li>模板版本控制</li>
                <li>模板权限设置</li>
              </ul>
              <Button icon={<BuildOutlined />} type="primary" style={{ marginTop: 16 }}>
                创建新模板
              </Button>
            </Card>
          </TabPane>
          
          <TabPane tab="发布管理" key="publishing">
            <Card title="页面发布管理">
              <p>发布管理功能提供页面发布的集中管理，包括：</p>
              <ul>
                <li>批量页面发布</li>
                <li>定时发布设置</li>
                <li>发布计划管理</li>
                <li>发布历史记录</li>
                <li>发布状态监控</li>
              </ul>
              <Button icon={<ThunderboltOutlined />} type="primary" style={{ marginTop: 16 }}>
                批量发布
              </Button>
            </Card>
          </TabPane>
          
          <TabPane tab="性能监控" key="performance">
            <Card title="页面性能分析">
              <p>性能监控功能提供页面性能的详细分析，包括：</p>
              <ul>
                <li>页面加载速度分析</li>
                <li>SEO评分监控</li>
                <li>移动端适配检测</li>
                <li>页面错误监控</li>
                <li>性能优化建议</li>
              </ul>
              <Button icon={<BarChartOutlined />} type="primary" style={{ marginTop: 16 }}>
                查看详细报告
              </Button>
            </Card>
          </TabPane>
        </Tabs>
      </Card>
      
      {/* 新增页面模态框 */}
      <Modal
        title="新增页面"
        open={isModalVisible}
        onOk={handleCreatePage}
        onCancel={handleCancel}
        destroyOnClose
        okText="创建"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          name="pageForm"
          autoComplete="off"
        >
          <Form.Item
            name="title"
            label="页面标题"
            rules={[{ required: true, message: '请输入页面标题!' }]}
          >
            <Input placeholder="请输入页面标题" />
          </Form.Item>
          <Form.Item
            name="slug"
            label="页面路径"
            rules={[{ required: true, message: '请输入页面路径!' }]}
          >
            <Input placeholder="请输入页面路径，如：about-us" />
          </Form.Item>
          <Form.Item
            name="siteId"
            label="所属网站"
            rules={[{ required: true, message: '请选择所属网站!' }]}
          >
            <Select placeholder="请选择网站">
              <Option value="site-1">企业官网</Option>
              <Option value="site-2">电商平台</Option>
              <Option value="site-3">博客网站</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="type"
            label="页面类型"
            rules={[{ required: true, message: '请选择页面类型!' }]}
          >
            <Select placeholder="请选择页面类型">
              {pageTypes.map(type => (
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
              {pageStatuses.map(status => (
                <Option key={status.value} value={status.value}>{status.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="seoTitle"
            label="SEO标题"
          >
            <Input placeholder="请输入SEO标题" />
          </Form.Item>
          <Form.Item
            name="seoDescription"
            label="SEO描述"
          >
            <Input.TextArea placeholder="请输入SEO描述" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 编辑页面模态框 */}
      <Modal
        title="编辑页面"
        open={isEditModalVisible}
        onOk={handleUpdatePage}
        onCancel={handleCancel}
        destroyOnClose
        okText="更新"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          name="editPageForm"
          autoComplete="off"
        >
          <Form.Item
            name="title"
            label="页面标题"
            rules={[{ required: true, message: '请输入页面标题!' }]}
          >
            <Input placeholder="请输入页面标题" />
          </Form.Item>
          <Form.Item
            name="slug"
            label="页面路径"
            rules={[{ required: true, message: '请输入页面路径!' }]}
          >
            <Input placeholder="请输入页面路径" />
          </Form.Item>
          <Form.Item
            name="siteId"
            label="所属网站"
            rules={[{ required: true, message: '请选择所属网站!' }]}
          >
            <Select placeholder="请选择网站">
              <Option value="site-1">企业官网</Option>
              <Option value="site-2">电商平台</Option>
              <Option value="site-3">博客网站</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="type"
            label="页面类型"
            rules={[{ required: true, message: '请选择页面类型!' }]}
          >
            <Select placeholder="请选择页面类型">
              {pageTypes.map(type => (
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
              {pageStatuses.map(status => (
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
            name="seoTitle"
            label="SEO标题"
          >
            <Input placeholder="请输入SEO标题" />
          </Form.Item>
          <Form.Item
            name="seoDescription"
            label="SEO描述"
          >
            <Input.TextArea placeholder="请输入SEO描述" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PageBuilderManagement;