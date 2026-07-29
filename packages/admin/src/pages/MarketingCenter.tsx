import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Card, Table, Button, Space, Input, Modal, Form, message, Tag, Select, 
  Popconfirm, Tabs, Statistic, Row, Col, Tooltip, Progress, Drawer, Descriptions
} from 'antd';
import { 
  SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, 
  FileTextOutlined, VideoCameraOutlined, BookOutlined,
  EyeOutlined, TeamOutlined, UserOutlined, PhoneOutlined, MailOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { TabPane } = Tabs;
const { Option } = Select;

const API_BASE = `${API_BASE_URL}/api/v1/admin`;

interface ArticleItem {
  id: string;
  title: string;
  summary?: string;
  content: string;
  coverImage?: string;
  type: 'article' | 'video' | 'whitepaper';
  videoUrl?: string;
  documentUrl?: string;
  status: 'draft' | 'published' | 'archived';
  tags: string;
  viewCount: number;
  shareCount: number;
  leadCount: number;
  publishedAt?: string;
  createdAt: string;
}

interface EmployeeProfile {
  id: string;
  name: string;
  title: string;
  department?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  viewCount: number;
  leadCount: number;
  createdAt: string;
  user?: { name: string; email: string; role: string; status: string };
}

interface EmployeeStats {
  total: number;
  activeCount: number;
  departmentCounts: Record<string, number>;
}

interface ContentStats {
  total: number;
  articleCount: number;
  videoCount: number;
  whitepaperCount: number;
  publishedCount: number;
  draftCount: number;
}

const contentTypeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  article: { label: '图文', color: 'blue', icon: <FileTextOutlined /> },
  video: { label: '视频', color: 'orange', icon: <VideoCameraOutlined /> },
  whitepaper: { label: '白皮书', color: 'purple', icon: <BookOutlined /> },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  published: { label: '已发布', color: 'success' },
  archived: { label: '已归档', color: 'warning' },
};

const getToken = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });

const MarketingCenter: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'content';
  const setActiveTab = (key: string) => setSearchParams({ tab: key });
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [empStats, setEmpStats] = useState<EmployeeStats>({ total: 0, activeCount: 0, departmentCounts: {} });
  const [isEmployeeModalVisible, setIsEmployeeModalVisible] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeProfile | null>(null);
  const [employeeForm] = Form.useForm();
  const [empSearch, setEmpSearch] = useState('');
  const [empDeptFilter, setEmpDeptFilter] = useState('all');
  const [empDrawerVisible, setEmpDrawerVisible] = useState(false);
  const [detailEmployee, setDetailEmployee] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ContentStats>({ total: 0, articleCount: 0, videoCount: 0, whitepaperCount: 0, publishedCount: 0, draftCount: 0 });
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [currentArticle, setCurrentArticle] = useState<ArticleItem | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [detailArticle, setDetailArticle] = useState<ArticleItem | null>(null);
  const [contentForm] = Form.useForm();

  const [selectedType, setSelectedType] = useState<string>('article');

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/articles/stats`, getToken());
      if (res.data.code === 0 || res.data.code === 200) {
        setStats(res.data.data);
      }
    } catch (e) { /* ignore */ }
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (searchTerm) params.append('search', searchTerm);
      if (filterType !== 'all') params.append('type', filterType);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      const res = await axios.get(`${API_BASE}/articles?${params}`, getToken());
      if (res.data.code === 0 || res.data.code === 200) {
        setArticles(res.data.data.list || []);
      }
    } catch (error: any) {
      message.error('获取内容列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (empSearch) params.append('search', empSearch);
      if (empDeptFilter !== 'all') params.append('department', empDeptFilter);
      const res = await axios.get(`${API_BASE}/employees?${params}`, getToken());
      if (res.data.code === 0 || res.data.code === 200) {
        setEmployees(res.data.data.list || []);
      }
    } catch (error: any) {
      // ignore
    }
  };

  const fetchEmpStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/employees/stats`, getToken());
      if (res.data.code === 0 || res.data.code === 200) {
        setEmpStats(res.data.data);
      }
    } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    fetchStats();
    fetchArticles();
    fetchEmployees();
    fetchEmpStats();
  }, []);

  useEffect(() => { fetchArticles(); }, [searchTerm, filterType, filterStatus]);
  useEffect(() => { fetchEmployees(); fetchEmpStats(); }, [empSearch, empDeptFilter]);

  const handleSubmit = async () => {
    try {
      const values = await contentForm.validateFields();
      const isEdit = !!currentArticle;
      const url = isEdit ? `${API_BASE}/articles/${currentArticle.id}` : `${API_BASE}/articles`;
      const method = isEdit ? 'put' : 'post';
      
      const res = await axios[method](url, values, getToken());
      if (res.data.code === 0 || res.data.code === 200) {
        message.success(isEdit ? '内容更新成功' : '内容创建成功');
        setIsModalVisible(false);
        contentForm.resetFields();
        setCurrentArticle(null);
        fetchArticles();
        fetchStats();
      }
    } catch (error: any) {
      if (error.errorFields) return;
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axios.delete(`${API_BASE}/articles/${id}`, getToken());
      if (res.data.code === 0 || res.data.code === 200) {
        message.success('删除成功');
        fetchArticles();
        fetchStats();
      }
    } catch { message.error('删除失败'); }
  };

  const openCreate = () => {
    contentForm.resetFields();
    setCurrentArticle(null);
    setSelectedType('article');
    setIsModalVisible(true);
  };

  const openEdit = (record: ArticleItem) => {
    setCurrentArticle(record);
    setSelectedType(record.type);
    contentForm.setFieldsValue({
      title: record.title,
      type: record.type,
      status: record.status,
      summary: record.summary,
      content: record.content,
      coverImage: record.coverImage,
      videoUrl: record.videoUrl,
      documentUrl: record.documentUrl,
      tags: record.tags,
    });
    setIsModalVisible(true);
  };



  const handleEmployeeSubmit = async () => {
    try {
      const values = await employeeForm.validateFields();
      const isEdit = !!currentEmployee;
      const url = isEdit ? `${API_BASE}/employees/${currentEmployee.id}` : `${API_BASE}/employees`;
      const method = isEdit ? 'put' : 'post';
      const res = await axios[method](url, values, getToken());
      if (res.data.code === 0 || res.data.code === 200) {
        message.success(isEdit ? '员工档案更新成功' : '员工档案创建成功');
        setIsEmployeeModalVisible(false);
        employeeForm.resetFields();
        setCurrentEmployee(null);
        fetchEmployees();
        fetchEmpStats();
      }
    } catch (error: any) {
      if (error.errorFields) return;
      message.error('操作失败');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      const res = await axios.delete(`${API_BASE}/employees/${id}`, getToken());
      if (res.data.code === 0 || res.data.code === 200) {
        message.success('删除成功');
        fetchEmployees();
        fetchEmpStats();
      }
    } catch { message.error('删除失败'); }
  };

  const openCreateEmployee = () => {
    employeeForm.resetFields();
    setCurrentEmployee(null);
    setIsEmployeeModalVisible(true);
  };

  const openEditEmployee = (record: EmployeeProfile) => {
    setCurrentEmployee(record);
    employeeForm.setFieldsValue({
      name: record.name,
      title: record.title,
      department: record.department,
      phone: record.phone,
      email: record.email,
      avatar: record.avatar,
    });
    setIsEmployeeModalVisible(true);
  };

  const departments = Object.keys(empStats.departmentCounts);

  return (
    <div>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="内容管理" key="content">
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={4}>
                <Card size="small"><Statistic title="总内容" value={stats.total} /></Card>
              </Col>
              <Col span={4}>
                <Card size="small" style={{ borderTop: '2px solid #1677ff' }}>
                  <Statistic title="图文" value={stats.articleCount} prefix={<FileTextOutlined />} valueStyle={{ color: '#1677ff' }} />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small" style={{ borderTop: '2px solid #fa8c16' }}>
                  <Statistic title="视频" value={stats.videoCount} prefix={<VideoCameraOutlined />} valueStyle={{ color: '#fa8c16' }} />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small" style={{ borderTop: '2px solid #722ed1' }}>
                  <Statistic title="白皮书" value={stats.whitepaperCount} prefix={<BookOutlined />} valueStyle={{ color: '#722ed1' }} />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small"><Statistic title="已发布" value={stats.publishedCount} valueStyle={{ color: '#52c41a' }} /></Card>
              </Col>
              <Col span={4}>
                <Card size="small"><Statistic title="草稿" value={stats.draftCount} valueStyle={{ color: '#999' }} /></Card>
              </Col>
            </Row>

            <Card
              title="内容列表"
              extra={
                <Space wrap>
                  <Input
                    placeholder="搜索标题/摘要..."
                    prefix={<SearchOutlined />}
                    style={{ width: 200 }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    allowClear
                  />
                  <Select value={filterType} onChange={setFilterType} style={{ width: 120 }}>
                    <Option value="all">全部类型</Option>
                    <Option value="article">图文</Option>
                    <Option value="video">视频</Option>
                    <Option value="whitepaper">白皮书</Option>
                  </Select>
                  <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 120 }}>
                    <Option value="all">全部状态</Option>
                    <Option value="draft">草稿</Option>
                    <Option value="published">已发布</Option>
                    <Option value="archived">已归档</Option>
                  </Select>
                  <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增内容</Button>
                </Space>
              }
            >
              <Table
                dataSource={articles}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
              >
                <Table.Column
                  title="标题"
                  dataIndex="title"
                  key="title"
                  render={(title, r: ArticleItem) => (
                    <div>
                      <a onClick={() => { setDetailArticle(r); setDrawerVisible(true); }}>{title}</a>
                      {r.summary && <div style={{ color: '#999', fontSize: 12 }}>{r.summary.slice(0, 50)}</div>}
                    </div>
                  )}
                />
                <Table.Column
                  title="类型"
                  dataIndex="type"
                  key="type"
                  width={100}
                  render={(type) => {
                    const cfg = contentTypeConfig[type as keyof typeof contentTypeConfig];
                    return cfg ? <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag> : type;
                  }}
                />
                <Table.Column
                  title="状态"
                  dataIndex="status"
                  key="status"
                  width={90}
                  render={(status) => {
                    const cfg = statusConfig[status as keyof typeof statusConfig];
                    return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : status;
                  }}
                />
                <Table.Column title="浏览" dataIndex="viewCount" key="viewCount" width={70} sorter={(a: ArticleItem, b: ArticleItem) => a.viewCount - b.viewCount} />
                <Table.Column title="分享" dataIndex="shareCount" key="shareCount" width={70} sorter={(a: ArticleItem, b: ArticleItem) => a.shareCount - b.shareCount} />
                <Table.Column title="线索" dataIndex="leadCount" key="leadCount" width={70} />
                <Table.Column
                  title="标签"
                  dataIndex="tags"
                  key="tags"
                  render={(tags) => tags ? tags.split(',').filter(Boolean).slice(0, 3).map((t: string, i: number) => <Tag key={i}>{t}</Tag>) : '-'}
                />
                <Table.Column
                  title="创建时间"
                  dataIndex="createdAt"
                  key="createdAt"
                  width={160}
                  render={(d) => d ? new Date(d).toLocaleString('zh-CN') : '-'}
                  sorter={(a: ArticleItem, b: ArticleItem) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()}
                />
                <Table.Column
                  title="操作"
                  key="action"
                  width={150}
                  render={(_: any, record: ArticleItem) => (
                    <Space size="small">
                      <Tooltip title="查看详情"><Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setDetailArticle(record); setDrawerVisible(true); }} /></Tooltip>
                      <Tooltip title="编辑"><Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} /></Tooltip>
                      <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
                        <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  )}
                />
              </Table>
            </Card>
          </TabPane>
          
          <TabPane tab="全员营销" key="marketing">
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card size="small" style={{ borderTop: '2px solid #1677ff' }}>
                  <Statistic title="总员工数" value={empStats.total} prefix={<TeamOutlined />} valueStyle={{ color: '#1677ff' }} />
                </Card>
              </Col>
              {departments.slice(0, 3).map(dept => (
                <Col span={6} key={dept}>
                  <Card size="small">
                    <Statistic title={dept} value={empStats.departmentCounts[dept] || 0} prefix={<UserOutlined />} />
                  </Card>
                </Col>
              ))}
            </Row>

            <Card
              title="员工档案"
              extra={
                <Space wrap>
                  <Input
                    placeholder="搜索姓名/邮箱/手机..."
                    prefix={<SearchOutlined />}
                    style={{ width: 200 }}
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    allowClear
                  />
                  <Select value={empDeptFilter} onChange={setEmpDeptFilter} style={{ width: 130 }}>
                    <Option value="all">全部部门</Option>
                    {departments.map(d => <Option key={d} value={d}>{d}</Option>)}
                  </Select>
                  <Button type="primary" icon={<PlusOutlined />} onClick={openCreateEmployee}>新增员工</Button>
                </Space>
              }
            >
              <Table
                dataSource={employees}
                rowKey="id"
                pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
              >
                <Table.Column
                  title="员工信息"
                  key="info"
                  render={(_: any, r: EmployeeProfile) => (
                    <Space>
                      {r.avatar ? (
                        <img src={r.avatar} alt={r.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1677ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {r.name?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <a onClick={() => { setDetailEmployee(r); setEmpDrawerVisible(true); }}><strong>{r.name}</strong></a>
                        <div style={{ fontSize: 12, color: '#999' }}>{r.title}</div>
                      </div>
                    </Space>
                  )}
                />
                <Table.Column title="部门" dataIndex="department" key="department" width={120} render={(v) => v || '-'} />
                <Table.Column
                  title="联系方式"
                  key="contact"
                  render={(_: any, r: EmployeeProfile) => (
                    <div>
                      {r.phone && <div><PhoneOutlined style={{ marginRight: 4 }} />{r.phone}</div>}
                      {r.email && <div style={{ fontSize: 12, color: '#999' }}><MailOutlined style={{ marginRight: 4 }} />{r.email}</div>}
                      {!r.phone && !r.email && '-'}
                    </div>
                  )}
                />
                <Table.Column title="浏览" dataIndex="viewCount" key="viewCount" width={70} />
                <Table.Column title="线索" dataIndex="leadCount" key="leadCount" width={70} />
                <Table.Column
                  title="创建时间"
                  dataIndex="createdAt"
                  key="createdAt"
                  width={160}
                  render={(d) => d ? new Date(d).toLocaleString('zh-CN') : '-'}
                  sorter={(a: EmployeeProfile, b: EmployeeProfile) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()}
                />
                <Table.Column
                  title="操作"
                  key="action"
                  width={120}
                  render={(_: any, record: EmployeeProfile) => (
                    <Space size="small">
                      <Tooltip title="查看详情"><Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setDetailEmployee(record); setEmpDrawerVisible(true); }} /></Tooltip>
                      <Tooltip title="编辑"><Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditEmployee(record)} /></Tooltip>
                      <Popconfirm title="确定删除该员工档案？" onConfirm={() => handleDeleteEmployee(record.id)} okText="确定" cancelText="取消">
                        <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  )}
                />
              </Table>
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={currentArticle ? '编辑内容' : '新增内容'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => { setIsModalVisible(false); contentForm.resetFields(); setCurrentArticle(null); }}
        width={640}
        destroyOnClose
        okText={currentArticle ? '更新' : '创建'}
        cancelText="取消"
      >
        <Form form={contentForm} layout="vertical" initialValues={{ type: 'article', status: 'draft' }}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入内容标题" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select onChange={(v: string) => setSelectedType(v)}>
              <Option value="article"><FileTextOutlined /> 图文</Option>
              <Option value="video"><VideoCameraOutlined /> 视频</Option>
              <Option value="whitepaper"><BookOutlined /> 白皮书</Option>
            </Select>
          </Form.Item>
          <Form.Item name="summary" label="摘要">
            <Input.TextArea placeholder="简要描述内容" rows={2} />
          </Form.Item>
          <Form.Item name="content" label="正文内容">
            <Input.TextArea placeholder="请输入详细内容" rows={4} />
          </Form.Item>
          <Form.Item name="coverImage" label="封面图片URL">
            <Input placeholder="https://example.com/image.jpg" />
          </Form.Item>
          {selectedType === 'video' && (
            <Form.Item name="videoUrl" label="视频地址">
              <Input placeholder="https://example.com/video.mp4" />
            </Form.Item>
          )}
          {selectedType === 'whitepaper' && (
            <Form.Item name="documentUrl" label="文档地址">
              <Input placeholder="https://example.com/document.pdf" />
            </Form.Item>
          )}
          <Form.Item name="status" label="状态">
            <Select>
              <Option value="draft">草稿</Option>
              <Option value="published">发布</Option>
              <Option value="archived">归档</Option>
            </Select>
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Input placeholder="逗号分隔，如：科技,营销,趋势" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={detailArticle?.title}
        open={drawerVisible}
        onClose={() => { setDrawerVisible(false); setDetailArticle(null); }}
        width={500}
      >
        {detailArticle && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="类型">
                {(() => { const c = contentTypeConfig[detailArticle.type as keyof typeof contentTypeConfig]; return c ? <Tag color={c.color} icon={c.icon}>{c.label}</Tag> : detailArticle.type; })()}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {(() => { const c = statusConfig[detailArticle.status as keyof typeof statusConfig]; return c ? <Tag color={c.color}>{c.label}</Tag> : detailArticle.status; })()}
              </Descriptions.Item>
              <Descriptions.Item label="摘要">{detailArticle.summary || '-'}</Descriptions.Item>
              {detailArticle.videoUrl && <Descriptions.Item label="视频地址"><a href={detailArticle.videoUrl} target="_blank" rel="noreferrer">{detailArticle.videoUrl}</a></Descriptions.Item>}
              {detailArticle.documentUrl && <Descriptions.Item label="文档地址"><a href={detailArticle.documentUrl} target="_blank" rel="noreferrer">{detailArticle.documentUrl}</a></Descriptions.Item>}
              <Descriptions.Item label="封面">{detailArticle.coverImage ? <img src={detailArticle.coverImage} alt="cover" style={{ maxWidth: 200 }} /> : '-'}</Descriptions.Item>
              <Descriptions.Item label="标签">{detailArticle.tags || '-'}</Descriptions.Item>
              <Descriptions.Item label="浏览/分享/线索">{detailArticle.viewCount} / {detailArticle.shareCount} / {detailArticle.leadCount}</Descriptions.Item>
              <Descriptions.Item label="发布时间">{detailArticle.publishedAt ? new Date(detailArticle.publishedAt).toLocaleString('zh-CN') : '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{new Date(detailArticle.createdAt).toLocaleString('zh-CN')}</Descriptions.Item>
            </Descriptions>
            {detailArticle.content && (
              <Card size="small" title="正文" style={{ marginTop: 16 }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{detailArticle.content}</div>
              </Card>
            )}
          </>
        )}
      </Drawer>

      {/* 新增/编辑员工 Modal */}
      <Modal
        title={currentEmployee ? '编辑员工档案' : '新增员工档案'}
        open={isEmployeeModalVisible}
        onOk={handleEmployeeSubmit}
        onCancel={() => { setIsEmployeeModalVisible(false); employeeForm.resetFields(); setCurrentEmployee(null); }}
        destroyOnClose
        okText={currentEmployee ? '更新' : '创建'}
        cancelText="取消"
      >
        <Form form={employeeForm} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入员工姓名' }]}>
            <Input placeholder="请输入员工姓名" />
          </Form.Item>
          <Form.Item name="title" label="职位" rules={[{ required: true, message: '请输入职位' }]}>
            <Input placeholder="请输入职位" />
          </Form.Item>
          <Form.Item name="department" label="部门">
            <Input placeholder="请输入部门" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '请输入有效邮箱' }]}>
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="avatar" label="头像URL">
            <Input placeholder="https://example.com/avatar.jpg" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 员工详情 Drawer */}
      <Drawer
        title={detailEmployee?.name}
        open={empDrawerVisible}
        onClose={() => { setEmpDrawerVisible(false); setDetailEmployee(null); }}
        width={400}
      >
        {detailEmployee && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              {detailEmployee.avatar ? (
                <img src={detailEmployee.avatar} alt={detailEmployee.name} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#1677ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 28, margin: '0 auto' }}>
                  {detailEmployee.name?.charAt(0)}
                </div>
              )}
              <h3 style={{ marginTop: 12 }}>{detailEmployee.name}</h3>
              <Tag color="blue">{detailEmployee.title}</Tag>
            </div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="部门">{detailEmployee.department || '-'}</Descriptions.Item>
              <Descriptions.Item label="电话">{detailEmployee.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{detailEmployee.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="浏览次数">{detailEmployee.viewCount}</Descriptions.Item>
              <Descriptions.Item label="线索数">{detailEmployee.leadCount}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{new Date(detailEmployee.createdAt).toLocaleString('zh-CN')}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default MarketingCenter;
