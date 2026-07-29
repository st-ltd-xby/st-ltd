import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Card, Table, Button, Space, Input, Modal, Form, message, Tag, Select, 
  Popconfirm, Tabs, Statistic, Row, Col, Tooltip, QRCode as AntQR, Empty
} from 'antd';
import { 
  SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, 
  QrcodeOutlined, MailOutlined, FileTextOutlined,
  EyeOutlined, CopyOutlined, DownloadOutlined, SendOutlined,
  TeamOutlined, InboxOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { TabPane } = Tabs;
const { Option } = Select;

const PROMOTION_API = `${API_BASE_URL}/api/v1/promotion`;
const ADMIN_API = `${API_BASE_URL}/api/v1/admin`;
const getToken = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });

// ============ Types ============
interface QrCodeItem {
  id: string;
  name: string;
  targetUrl: string;
  imageUrl?: string;
  scanCount: number;
  size: number;
  color: string;
  bgColor: string;
  createdAt: string;
}

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  recipients: string;
  totalCount: number;
  sentCount: number;
  successCount: number;
  failCount: number;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}

interface EmailAddress {
  id: string;
  email: string;
  name?: string;
  group: string;
  status: string;
  tags?: string;
  createdAt: string;
}

interface ArticleItem {
  id: string;
  title: string;
  summary?: string;
  content: string;
  coverImage?: string;
  type: string;
  status: string;
  tags: string;
  viewCount: number;
  shareCount: number;
  createdAt: string;
}

// ============ Component ============
const PromotionCenter: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'qrcodes';
  const setActiveTab = (key: string) => setSearchParams({ tab: key });

  // QR Code states
  const [qrcodes, setQrcodes] = useState<QrCodeItem[]>([]);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [currentQr, setCurrentQr] = useState<QrCodeItem | null>(null);
  const [qrForm] = Form.useForm();
  const [qrSearch, setQrSearch] = useState('');

  // Email states
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [emailAddresses, setEmailAddresses] = useState<EmailAddress[]>([]);
  const [emailLoading, setEmailLoading] = useState(false);
  const [campaignModalVisible, setCampaignModalVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [smtpModalVisible, setSmtpModalVisible] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState<EmailCampaign | null>(null);
  const [campaignForm] = Form.useForm();
  const [addressForm] = Form.useForm();
  const [smtpForm] = Form.useForm();
  const [emailTab, setEmailTab] = useState('campaigns');
  const [smtpConfig, setSmtpConfig] = useState<any>(null);

  // Article states
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleModalVisible, setArticleModalVisible] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<ArticleItem | null>(null);
  const [articleForm] = Form.useForm();
  const [articleSearch, setArticleSearch] = useState('');

  // ============ QR Code Functions ============
  const fetchQrcodes = async () => {
    setQrLoading(true);
    try {
      const res = await axios.get(`${PROMOTION_API}/qrcodes`, getToken());
      if (res.data.code === 0 || res.data.code === 200) {
        setQrcodes(res.data.data || []);
      }
    } catch { message.error('获取二维码列表失败'); }
    finally { setQrLoading(false); }
  };

  const handleQrSubmit = async () => {
    try {
      const values = await qrForm.validateFields();
      const isEdit = !!currentQr;
      const url = isEdit ? `${PROMOTION_API}/qrcodes/${currentQr.id}` : `${PROMOTION_API}/qrcodes`;
      const method = isEdit ? 'put' : 'post';
      const res = await axios[method](url, values, getToken());
      if (res.data.code === 0 || res.data.code === 200) {
        message.success(isEdit ? '二维码更新成功' : '二维码生成成功');
        setQrModalVisible(false);
        qrForm.resetFields();
        setCurrentQr(null);
        fetchQrcodes();
      }
    } catch (e: any) { if (!e.errorFields) message.error('操作失败'); }
  };

  const handleDeleteQr = async (id: string) => {
    try {
      await axios.delete(`${PROMOTION_API}/qrcodes/${id}`, getToken());
      message.success('删除成功');
      fetchQrcodes();
    } catch { message.error('删除失败'); }
  };

  const downloadQr = (item: QrCodeItem) => {
    if (!item.imageUrl) return;
    const link = document.createElement('a');
    link.href = item.imageUrl;
    link.download = `${item.name}_qrcode.png`;
    link.click();
  };

  // ============ Email Functions ============
  const fetchCampaigns = async () => {
    setEmailLoading(true);
    try {
      const res = await axios.get(`${PROMOTION_API}/email-campaigns`, getToken());
      console.log('获取邮件活动:', res.data);
      if (res.data.code === 0 || res.data.code === 200) {
        setCampaigns(res.data.data || []);
      } else {
        console.error('获取邮件活动失败:', res.data.message);
      }
    } catch (error) {
      console.error('获取邮件活动异常:', error);
    }
    finally { setEmailLoading(false); }
  };

  const fetchEmailAddresses = async () => {
    try {
      const res = await axios.get(`${PROMOTION_API}/email-addresses`, getToken());
      console.log('获取邮件地址:', res.data);
      if (res.data.code === 0 || res.data.code === 200) {
        setEmailAddresses(res.data.data || []);
      } else {
        console.error('获取邮件地址失败:', res.data.message);
      }
    } catch (error) {
      console.error('获取邮件地址异常:', error);
    }
  };

  const handleCampaignSubmit = async () => {
    try {
      const values = await campaignForm.validateFields();
      const isEdit = !!currentCampaign;
      const url = isEdit ? `${PROMOTION_API}/email-campaigns/${currentCampaign.id}` : `${PROMOTION_API}/email-campaigns`;
      const method = isEdit ? 'put' : 'post';
      const res = await axios[method](url, values, getToken());
      if (res.data.code === 0 || res.data.code === 200) {
        message.success(isEdit ? '邮件活动更新成功' : '邮件活动创建成功');
        setCampaignModalVisible(false);
        campaignForm.resetFields();
        setCurrentCampaign(null);
        fetchCampaigns();
      }
    } catch (e: any) { if (!e.errorFields) message.error('操作失败'); }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      await axios.delete(`${PROMOTION_API}/email-campaigns/${id}`, getToken());
      message.success('删除成功');
      fetchCampaigns();
    } catch { message.error('删除失败'); }
  };

  const handleSendCampaign = async (id: string) => {
    try {
      const res = await axios.post(`${PROMOTION_API}/email-campaigns/${id}/send`, {}, getToken());
      if (res.data.code === 0 || res.data.code === 200) {
        message.success('邮件发送成功');
        fetchCampaigns();
      }
    } catch { message.error('发送失败'); }
  };

  const handleAddressSubmit = async () => {
    try {
      const values = await addressForm.validateFields();
      const res = await axios.post(`${PROMOTION_API}/email-addresses`, values, getToken());
      if (res.data.code === 0 || res.data.code === 200) {
        message.success('邮件地址添加成功');
        setAddressModalVisible(false);
        addressForm.resetFields();
        fetchEmailAddresses();
      }
    } catch (e: any) { if (!e.errorFields) message.error('操作失败'); }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await axios.delete(`${PROMOTION_API}/email-addresses/${id}`, getToken());
      message.success('删除成功');
      fetchEmailAddresses();
    } catch { message.error('删除失败'); }
  };

  // ============ SMTP Functions ============
  const fetchSmtpConfig = async () => {
    try {
      const res = await axios.get(`${PROMOTION_API}/smtp-config`, getToken());
      if (res.data.code === 0 || res.data.code === 200) {
        setSmtpConfig(res.data.data);
        if (res.data.data) {
          smtpForm.setFieldsValue(res.data.data);
        }
      }
    } catch { /* ignore */ }
  };

  const handleSmtpSubmit = async () => {
    try {
      const values = await smtpForm.validateFields();
      const res = await axios.post(`${PROMOTION_API}/smtp-config`, values, getToken());
      if (res.data.code === 0 || res.data.code === 200) {
        message.success('SMTP 配置保存成功');
        setSmtpModalVisible(false);
        setSmtpConfig(values);
      }
    } catch (e: any) { if (!e.errorFields) message.error('保存失败'); }
  };

  // ============ Article Functions ============
  const fetchArticles = async () => {
    setArticleLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '100', type: 'article' });
      if (articleSearch) params.append('search', articleSearch);
      const res = await axios.get(`${ADMIN_API}/articles?${params}`, getToken());
      if (res.data.code === 0 || res.data.code === 200) {
        setArticles(res.data.data.list || []);
      }
    } catch { /* ignore */ }
    finally { setArticleLoading(false); }
  };

  const handleArticleSubmit = async () => {
    try {
      const values = await articleForm.validateFields();
      const isEdit = !!currentArticle;
      const url = isEdit ? `${ADMIN_API}/articles/${currentArticle.id}` : `${ADMIN_API}/articles`;
      const method = isEdit ? 'put' : 'post';
      const res = await axios[method](url, { ...values, type: 'article' }, getToken());
      if (res.data.code === 0 || res.data.code === 200) {
        message.success(isEdit ? '图文更新成功' : '图文创建成功');
        setArticleModalVisible(false);
        articleForm.resetFields();
        setCurrentArticle(null);
        fetchArticles();
      }
    } catch (e: any) { if (!e.errorFields) message.error('操作失败'); }
  };

  const handleDeleteArticle = async (id: string) => {
    try {
      await axios.delete(`${ADMIN_API}/articles/${id}`, getToken());
      message.success('删除成功');
      fetchArticles();
    } catch { message.error('删除失败'); }
  };

  // ============ Effects ============
  useEffect(() => {
    fetchQrcodes();
    fetchCampaigns();
    fetchEmailAddresses();
    fetchArticles();
    fetchSmtpConfig();
  }, []);

  const filteredQrcodes = qrcodes.filter(q => 
    q.name.toLowerCase().includes(qrSearch.toLowerCase()) ||
    q.targetUrl.toLowerCase().includes(qrSearch.toLowerCase())
  );

  const filteredArticles = articles.filter(a =>
    a.title.toLowerCase().includes(articleSearch.toLowerCase())
  );

  const campaignStatusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: '草稿', color: 'default' },
    sending: { label: '发送中', color: 'processing' },
    sent: { label: '已发送', color: 'success' },
    failed: { label: '失败', color: 'error' },
  };

  return (
    <div>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* ========== 二维码管理 ========== */}
          <TabPane tab="二维码管理" key="qrcodes">
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}><Card size="small"><Statistic title="二维码总数" value={qrcodes.length} prefix={<QrcodeOutlined />} /></Card></Col>
              <Col span={8}><Card size="small"><Statistic title="总扫描次数" value={qrcodes.reduce((s, q) => s + q.scanCount, 0)} prefix={<EyeOutlined />} /></Card></Col>
              <Col span={8}><Card size="small"><Statistic title="活跃二维码" value={qrcodes.length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
            </Row>
            <Card
              title="二维码列表"
              extra={
                <Space>
                  <Input placeholder="搜索名称/链接..." prefix={<SearchOutlined />} style={{ width: 200 }} value={qrSearch} onChange={(e) => setQrSearch(e.target.value)} allowClear />
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => { qrForm.resetFields(); setCurrentQr(null); setQrModalVisible(true); }}>生成二维码</Button>
                </Space>
              }
            >
              <Table dataSource={filteredQrcodes} rowKey="id" loading={qrLoading} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}>
                <Table.Column title="二维码" key="preview" width={100} render={(_: any, r: QrCodeItem) => (
                  r.imageUrl ? <img src={r.imageUrl} alt={r.name} style={{ width: 60, height: 60 }} /> : <AntQR value={r.targetUrl} size={60} />
                )} />
                <Table.Column title="名称" dataIndex="name" key="name" render={(name, r: QrCodeItem) => (
                  <div><strong>{name}</strong><div style={{ fontSize: 12, color: '#999', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.targetUrl}</div></div>
                )} />
                <Table.Column title="扫描次数" dataIndex="scanCount" key="scanCount" width={100} sorter={(a: QrCodeItem, b: QrCodeItem) => a.scanCount - b.scanCount} />
                <Table.Column title="尺寸" dataIndex="size" key="size" width={80} render={(s) => `${s}px`} />
                <Table.Column title="创建时间" dataIndex="createdAt" key="createdAt" width={160} render={(d) => d ? new Date(d).toLocaleString('zh-CN') : '-'} />
                <Table.Column title="操作" key="action" width={150} render={(_: any, record: QrCodeItem) => (
                  <Space size="small">
                    <Tooltip title="下载"><Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => downloadQr(record)} /></Tooltip>
                    <Tooltip title="复制链接"><Button type="link" size="small" icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(record.targetUrl); message.success('已复制'); }} /></Tooltip>
                    <Popconfirm title="确定删除？" onConfirm={() => handleDeleteQr(record.id)} okText="确定" cancelText="取消">
                      <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                )} />
              </Table>
            </Card>
          </TabPane>

          {/* ========== 邮件营销 ========== */}
          <TabPane tab="邮件营销" key="email">
            <Tabs type="card" activeKey={emailTab} onChange={setEmailTab} style={{ marginBottom: 16 }}>
              <TabPane tab="邮件活动" key="campaigns">
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={6}><Card size="small"><Statistic title="总活动" value={campaigns.length} prefix={<MailOutlined />} /></Card></Col>
                  <Col span={6}><Card size="small"><Statistic title="已发送" value={campaigns.filter(c => c.status === 'sent').length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
                  <Col span={6}><Card size="small"><Statistic title="总发送数" value={campaigns.reduce((s, c) => s + c.totalCount, 0)} prefix={<SendOutlined />} /></Card></Col>
                  <Col span={6}><Card size="small"><Statistic title="成功数" value={campaigns.reduce((s, c) => s + c.successCount, 0)} valueStyle={{ color: '#1677ff' }} /></Card></Col>
                </Row>
                <Card
                  title="活动列表"
                  extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { campaignForm.resetFields(); setCurrentCampaign(null); setCampaignModalVisible(true); }}>新建活动</Button>}
                >
                  {campaigns.length === 0 ? (
                    <Empty
                      description="暂无邮件活动"
                      style={{ padding: 40 }}
                    >
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => { campaignForm.resetFields(); setCurrentCampaign(null); setCampaignModalVisible(true); }}>
                        创建第一个邮件活动
                      </Button>
                    </Empty>
                  ) : (
                    <Table dataSource={campaigns} rowKey="id" loading={emailLoading} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}>
                      <Table.Column title="活动名称" dataIndex="name" key="name" />
                      <Table.Column title="主题" dataIndex="subject" key="subject" />
                      <Table.Column title="收件人" dataIndex="totalCount" key="totalCount" width={80} />
                      <Table.Column title="成功/失败" key="result" width={100} render={(_: any, r: any) => (<span><span style={{ color: '#52c41a' }}>{r.successCount}</span>{' / '}<span style={{ color: '#ff4d4f' }}>{r.failCount}</span></span>)} />
                      <Table.Column title="状态" dataIndex="status" key="status" width={90} render={(s) => { const c = campaignStatusConfig[s]; return c ? <Tag color={c.color}>{c.label}</Tag> : s; }} />
                      <Table.Column title="发送时间" dataIndex="sentAt" key="sentAt" width={160} render={(d) => d ? new Date(d).toLocaleString('zh-CN') : '-'} />
                      <Table.Column title="操作" key="action" width={150} render={(_: any, record: EmailCampaign) => (
                        <Space size="small">
                          {record.status === 'draft' && <Tooltip title="发送"><Button type="link" size="small" icon={<SendOutlined />} onClick={() => handleSendCampaign(record.id)} /></Tooltip>}
                          <Popconfirm title="确定删除？" onConfirm={() => handleDeleteCampaign(record.id)} okText="确定" cancelText="取消">
                            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </Space>
                      )} />
                    </Table>
                  )}
                </Card>
              </TabPane>

              <TabPane tab="邮件地址库" key="addresses">
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={8}><Card size="small"><Statistic title="总地址数" value={emailAddresses.length} prefix={<InboxOutlined />} /></Card></Col>
                  <Col span={8}><Card size="small"><Statistic title="活跃地址" value={emailAddresses.filter(a => a.status === 'active').length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
                  <Col span={8}><Card size="small"><Statistic title="分组数" value={new Set(emailAddresses.map(a => a.group)).size} prefix={<TeamOutlined />} /></Card></Col>
                </Row>
                <Card
                  title="系统邮件地址"
                  extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { addressForm.resetFields(); setAddressModalVisible(true); }}>添加地址</Button>}
                >
                  {emailAddresses.length === 0 ? (
                    <Empty
                      description="暂无邮件地址"
                      style={{ padding: 40 }}
                    >
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => { addressForm.resetFields(); setAddressModalVisible(true); }}>
                        添加第一个邮件地址
                      </Button>
                    </Empty>
                  ) : (
                    <Table dataSource={emailAddresses} rowKey="id" pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}>
                      <Table.Column title="邮箱" dataIndex="email" key="email" />
                      <Table.Column title="姓名" dataIndex="name" key="name" width={120} render={(v) => v || '-'} />
                      <Table.Column title="分组" dataIndex="group" key="group" width={100} render={(g) => <Tag>{g}</Tag>} />
                      <Table.Column title="状态" dataIndex="status" key="status" width={80} render={(s) => <Tag color={s === 'active' ? 'green' : s === 'unsubscribed' ? 'orange' : 'red'}>{s === 'active' ? '活跃' : s === 'unsubscribed' ? '退订' : '退信'}</Tag>} />
                      <Table.Column title="添加时间" dataIndex="createdAt" key="createdAt" width={160} render={(d) => d ? new Date(d).toLocaleString('zh-CN') : '-'} />
                      <Table.Column title="操作" key="action" width={80} render={(_: any, record: EmailAddress) => (
                        <Popconfirm title="确定删除？" onConfirm={() => handleDeleteAddress(record.id)} okText="确定" cancelText="取消">
                          <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      )} />
                    </Table>
                  )}
                </Card>
              </TabPane>

              <TabPane tab="SMTP 配置" key="smtp">
                <Card
                  title="邮件服务器配置"
                  extra={<Button type="primary" icon={<EditOutlined />} onClick={() => { fetchSmtpConfig(); setSmtpModalVisible(true); }}>配置 SMTP</Button>}
                >
                  {smtpConfig ? (
                    <div>
                      <p><strong>SMTP 服务器:</strong> {smtpConfig.host}:{smtpConfig.port}</p>
                      <p><strong>发件人邮箱:</strong> {smtpConfig.auth?.user || '未设置'}</p>
                      <p><strong>安全连接:</strong> {smtpConfig.secure ? '是 (SSL/TLS)' : '否'}</p>
                      <p style={{ color: '#52c41a' }}>✓ SMTP 已配置，可以发送邮件</p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                      <MailOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                      <p>尚未配置 SMTP 服务器</p>
                      <p>点击“配置 SMTP”按钮设置邮件服务器</p>
                    </div>
                  )}
                </Card>
              </TabPane>
            </Tabs>
          </TabPane>

          {/* ========== 文章管理（图文存储） ========== */}
          <TabPane tab="文章管理" key="articles">
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}><Card size="small"><Statistic title="图文总数" value={articles.length} prefix={<FileTextOutlined />} /></Card></Col>
              <Col span={8}><Card size="small"><Statistic title="已发布" value={articles.filter(a => a.status === 'published').length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
              <Col span={8}><Card size="small"><Statistic title="总浏览" value={articles.reduce((s, a) => s + a.viewCount, 0)} prefix={<EyeOutlined />} /></Card></Col>
            </Row>
            <Card
              title="图文列表"
              extra={
                <Space>
                  <Input placeholder="搜索标题..." prefix={<SearchOutlined />} style={{ width: 200 }} value={articleSearch} onChange={(e) => setArticleSearch(e.target.value)} allowClear />
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => { articleForm.resetFields(); setCurrentArticle(null); setArticleModalVisible(true); }}>新增图文</Button>
                </Space>
              }
            >
              <Table dataSource={filteredArticles} rowKey="id" loading={articleLoading} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}>
                <Table.Column title="标题" dataIndex="title" key="title" render={(title, r: ArticleItem) => (
                  <div><strong>{title}</strong>{r.summary && <div style={{ fontSize: 12, color: '#999' }}>{r.summary.slice(0, 50)}</div>}</div>
                )} />
                <Table.Column title="状态" dataIndex="status" key="status" width={90} render={(s) => <Tag color={s === 'published' ? 'success' : s === 'draft' ? 'default' : 'warning'}>{s === 'published' ? '已发布' : s === 'draft' ? '草稿' : '已归档'}</Tag>} />
                <Table.Column title="浏览" dataIndex="viewCount" key="viewCount" width={70} />
                <Table.Column title="分享" dataIndex="shareCount" key="shareCount" width={70} />
                <Table.Column title="标签" dataIndex="tags" key="tags" render={(tags) => tags ? tags.split(',').filter(Boolean).slice(0, 3).map((t: string, i: number) => <Tag key={i}>{t}</Tag>) : '-'} />
                <Table.Column title="创建时间" dataIndex="createdAt" key="createdAt" width={160} render={(d) => d ? new Date(d).toLocaleString('zh-CN') : '-'} />
                <Table.Column title="操作" key="action" width={120} render={(_: any, record: ArticleItem) => (
                  <Space size="small">
                    <Tooltip title="编辑"><Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setCurrentArticle(record); articleForm.setFieldsValue({ title: record.title, summary: record.summary, content: record.content, coverImage: record.coverImage, status: record.status, tags: record.tags }); setArticleModalVisible(true); }} /></Tooltip>
                    <Popconfirm title="确定删除？" onConfirm={() => handleDeleteArticle(record.id)} okText="确定" cancelText="取消">
                      <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                )} />
              </Table>
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      {/* 二维码 Modal */}
      <Modal title={currentQr ? '编辑二维码' : '生成二维码'} open={qrModalVisible} onOk={handleQrSubmit} onCancel={() => { setQrModalVisible(false); qrForm.resetFields(); setCurrentQr(null); }} okText={currentQr ? '更新' : '生成'} cancelText="取消">
        <Form form={qrForm} layout="vertical" initialValues={{ size: 300, color: '#000000', bgColor: '#ffffff' }}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入二维码名称" />
          </Form.Item>
          <Form.Item name="targetUrl" label="目标链接" rules={[{ required: true, message: '请输入链接' }]}>
            <Input placeholder="https://example.com" />
          </Form.Item>
          <Form.Item name="size" label="尺寸(px)">
            <Input type="number" placeholder="300" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 邮件活动 Modal */}
      <Modal title={currentCampaign ? '编辑邮件活动' : '新建邮件活动'} open={campaignModalVisible} onOk={handleCampaignSubmit} onCancel={() => { setCampaignModalVisible(false); campaignForm.resetFields(); setCurrentCampaign(null); }} okText={currentCampaign ? '更新' : '创建'} cancelText="取消">
        <Form form={campaignForm} layout="vertical">
          <Form.Item name="name" label="活动名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入活动名称" />
          </Form.Item>
          <Form.Item name="subject" label="邮件主题" rules={[{ required: true, message: '请输入主题' }]}>
            <Input placeholder="请输入邮件主题" />
          </Form.Item>
          <Form.Item name="content" label="邮件内容">
            <Input.TextArea placeholder="请输入邮件内容" rows={4} />
          </Form.Item>
          <Form.Item name="recipients" label="收件人（逗号分隔）">
            <Input placeholder="email1@example.com, email2@example.com" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 邮件地址 Modal */}
      <Modal title="添加邮件地址" open={addressModalVisible} onOk={handleAddressSubmit} onCancel={() => { setAddressModalVisible(false); addressForm.resetFields(); }} okText="添加" cancelText="取消">
        <Form form={addressForm} layout="vertical" initialValues={{ group: 'default' }}>
          <Form.Item name="email" label="邮箱地址" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
            <Input placeholder="email@example.com" />
          </Form.Item>
          <Form.Item name="name" label="姓名">
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="group" label="分组">
            <Select>
              <Option value="default">默认</Option>
              <Option value="vip">VIP</Option>
              <Option value="customer">客户</Option>
              <Option value="prospect">潜在客户</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* SMTP 配置 Modal */}
      <Modal title="SMTP 服务器配置" open={smtpModalVisible} onOk={handleSmtpSubmit} onCancel={() => { setSmtpModalVisible(false); smtpForm.resetFields(); }} okText="保存" cancelText="取消" width={500}>
        <Form form={smtpForm} layout="vertical" initialValues={{ port: 465, secure: true }}>
          <Form.Item name="host" label="SMTP 服务器" rules={[{ required: true, message: '请输入 SMTP 服务器地址' }]}>
            <Input placeholder="smtp.example.com" />
          </Form.Item>
          <Form.Item name="port" label="端口" rules={[{ required: true, message: '请输入端口' }]}>
            <Input type="number" placeholder="465" />
          </Form.Item>
          <Form.Item name="secure" label="安全连接" valuePropName="checked">
            <Select>
              <Option value={true}>是 (SSL/TLS)</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>
          <Form.Item name={["auth", "user"]} label="发件人邮箱" rules={[{ required: true, message: '请输入发件人邮箱' }]}>
            <Input placeholder="your-email@example.com" />
          </Form.Item>
          <Form.Item name={["auth", "pass"]} label="邮箱密码/授权码" rules={[{ required: true, message: '请输入密码或授权码' }]}>
            <Input.Password placeholder="请输入密码或授权码" />
          </Form.Item>
          <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, fontSize: 12, color: '#666' }}>
            <p style={{ margin: '0 0 8px 0' }}><strong>常用 SMTP 配置:</strong></p>
            <p style={{ margin: '4px 0' }}>QQ 邮箱: smtp.qq.com / 端口 465 / 需开启 SMTP 并获取授权码</p>
            <p style={{ margin: '4px 0' }}>163 邮箱: smtp.163.com / 端口 465 / 需开启 SMTP 并获取授权码</p>
            <p style={{ margin: '4px 0' }}>企业邮箱: 请咨询 IT 部门获取 SMTP 配置</p>
          </div>
        </Form>
      </Modal>

      {/* 图文 Modal */}
      <Modal title={currentArticle ? '编辑图文' : '新增图文'} open={articleModalVisible} onOk={handleArticleSubmit} onCancel={() => { setArticleModalVisible(false); articleForm.resetFields(); setCurrentArticle(null); }} okText={currentArticle ? '更新' : '创建'} cancelText="取消" width={640}>
        <Form form={articleForm} layout="vertical" initialValues={{ status: 'draft' }}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入图文标题" />
          </Form.Item>
          <Form.Item name="summary" label="摘要">
            <Input.TextArea placeholder="简要描述" rows={2} />
          </Form.Item>
          <Form.Item name="content" label="正文内容">
            <Input.TextArea placeholder="请输入详细内容" rows={6} />
          </Form.Item>
          <Form.Item name="coverImage" label="封面图片URL">
            <Input placeholder="https://example.com/image.jpg" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Option value="draft">草稿</Option>
              <Option value="published">发布</Option>
              <Option value="archived">归档</Option>
            </Select>
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Input placeholder="逗号分隔，如：科技,营销" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PromotionCenter;
