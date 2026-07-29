import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Card, Table, Button, Space, Input, Modal, Form, message, Tag, Select, 
  Popconfirm, Tabs, Statistic, Row, Col, Tooltip, Drawer, Descriptions, Badge
} from 'antd';
import { 
  SearchOutlined, PlusOutlined, DeleteOutlined, 
  CheckCircleOutlined, EyeOutlined,
  ShopOutlined, LinkOutlined, CopyOutlined, FireOutlined,
  ShoppingCartOutlined, ThunderboltOutlined, GlobalOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { TabPane } = Tabs;
const { Option } = Select;

const API_BASE = `${API_BASE_URL}/api/v1/admin`;
const getToken = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });

// ============ Types ============
interface MallItem {
  id: string;
  name: string;
  url: string;
  platform: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewNote?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  status: string;
  createdAt: string;
  products?: any[];
}

interface HotProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  coverImage?: string;
  category?: string;
  status: string;
  salesCount: number;
  stock: number;
  externalUrl?: string;
  tags: string;
  trackingLinks: TrackingLinkItem[];
  skus: any[];
}

interface TrackingLinkItem {
  id: string;
  shortCode: string;
  targetUrl: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  clickCount: number;
  leadCount: number;
  createdAt: string;
}

interface MallStats { total: number; pendingCount: number; approvedCount: number; rejectedCount: number; }
interface ProductStats { totalProducts: number; promotedCount: number; totalClicks: number; totalLeads: number; }

// ============ Component ============
const MallManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'mall-review';
  const setActiveTab = (key: string) => setSearchParams({ tab: key });

  // Mall Review states
  const [malls, setMalls] = useState<MallItem[]>([]);
  const [mallStats, setMallStats] = useState<MallStats>({ total: 0, pendingCount: 0, approvedCount: 0, rejectedCount: 0 });
  const [mallLoading, setMallLoading] = useState(false);
  const [mallSearch, setMallSearch] = useState('');
  const [mallFilter, setMallFilter] = useState('');
  const [mallModalVisible, setMallModalVisible] = useState(false);
  const [currentMall, setCurrentMall] = useState<MallItem | null>(null);
  const [mallForm] = Form.useForm();
  const [, setReviewModalVisible] = useState(false);
  const [reviewForm] = Form.useForm();
  const [detailMall, setDetailMall] = useState<MallItem | null>(null);

  // Hot Product states
  const [products, setProducts] = useState<HotProduct[]>([]);
  const [prodStats, setProdStats] = useState<ProductStats>({ totalProducts: 0, promotedCount: 0, totalClicks: 0, totalLeads: 0 });
  const [prodLoading, setProdLoading] = useState(false);
  const [prodSearch, setProdSearch] = useState('');
  const [prodFilter, setProdFilter] = useState('');
  const [promoteModalVisible, setPromoteModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<HotProduct | null>(null);
  const [promoteForm] = Form.useForm();

  // ============ Mall Review Functions ============
  const fetchMalls = async () => {
    setMallLoading(true);
    try {
      const params = new URLSearchParams();
      if (mallFilter) params.append('reviewStatus', mallFilter);
      if (mallSearch) params.append('search', mallSearch);
      const res = await axios.get(`${API_BASE}/mall-review?${params}`, getToken());
      if (res.data.code === 0 || res.data.code === 200) setMalls(res.data.data || []);
    } catch { /* ignore */ }
    finally { setMallLoading(false); }
  };

  const fetchMallStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/mall-review/stats`, getToken());
      if (res.data.code === 0 || res.data.code === 200) setMallStats(res.data.data);
    } catch { /* ignore */ }
  };

  const handleMallSubmit = async () => {
    try {
      const values = await mallForm.validateFields();
      const isEdit = !!currentMall;
      const url = isEdit ? `${API_BASE}/mall-review/${currentMall.id}` : `${API_BASE}/mall-review`;
      const method = isEdit ? 'put' : 'post';
      const res = await axios[method](url, values, getToken());
      if (res.data.code === 0 || res.data.code === 200) {
        message.success(isEdit ? '商城更新成功' : '商城提交成功');
        setMallModalVisible(false);
        mallForm.resetFields();
        setCurrentMall(null);
        fetchMalls();
        fetchMallStats();
      }
    } catch (e: any) { if (!e.errorFields) message.error('操作失败'); }
  };

  const handleReview = async () => {
    try {
      const values = await reviewForm.validateFields();
      const res = await axios.put(`${API_BASE}/mall-review/${detailMall!.id}`, values, getToken());
      if (res.data.code === 0 || res.data.code === 200) {
        message.success(values.reviewStatus === 'approved' ? '审核通过' : '已驳回');
        setReviewModalVisible(false);
        reviewForm.resetFields();
        setDetailMall(null);
        fetchMalls();
        fetchMallStats();
      }
    } catch (e: any) { if (!e.errorFields) message.error('操作失败'); }
  };

  const handleDeleteMall = async (id: string) => {
    try {
      await axios.delete(`${API_BASE}/mall-review/${id}`, getToken());
      message.success('删除成功');
      fetchMalls();
      fetchMallStats();
    } catch { message.error('删除失败'); }
  };

  // ============ Hot Product Functions ============
  const fetchProducts = async () => {
    setProdLoading(true);
    try {
      const params = new URLSearchParams();
      if (prodFilter) params.append('status', prodFilter);
      if (prodSearch) params.append('search', prodSearch);
      const res = await axios.get(`${API_BASE}/hot-products?${params}`, getToken());
      if (res.data.code === 0 || res.data.code === 200) setProducts(res.data.data || []);
    } catch { /* ignore */ }
    finally { setProdLoading(false); }
  };

  const fetchProdStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/hot-products/stats`, getToken());
      if (res.data.code === 0 || res.data.code === 200) setProdStats(res.data.data);
    } catch { /* ignore */ }
  };

  const handlePromote = async () => {
    try {
      const values = await promoteForm.validateFields();
      const res = await axios.post(`${API_BASE}/hot-products/promote`, {
        productId: currentProduct!.id,
        ...values,
      }, getToken());
      if (res.data.code === 0 || res.data.code === 200) {
        message.success('推广链接生成成功');
        setPromoteModalVisible(false);
        promoteForm.resetFields();
        setCurrentProduct(null);
        fetchProducts();
        fetchProdStats();
      }
    } catch (e: any) { if (!e.errorFields) message.error('操作失败'); }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      await axios.delete(`${API_BASE}/hot-products/promote/${linkId}`, getToken());
      message.success('推广链接删除成功');
      fetchProducts();
      fetchProdStats();
    } catch { message.error('删除失败'); }
  };

  const handleToggleStatus = async (product: HotProduct) => {
    const newStatus = product.status === 'active' ? 'draft' : 'active';
    try {
      const res = await axios.put(`${API_BASE}/hot-products/${product.id}/status`, { status: newStatus }, getToken());
      if (res.data.code === 0 || res.data.code === 200) {
        message.success(newStatus === 'active' ? '已上架' : '已下架');
        fetchProducts();
        fetchProdStats();
      }
    } catch { message.error('操作失败'); }
  };

  // ============ Effects ============
  useEffect(() => { fetchMalls(); fetchMallStats(); fetchProducts(); fetchProdStats(); }, []);
  useEffect(() => { fetchMalls(); }, [mallFilter, mallSearch]);
  useEffect(() => { fetchProducts(); }, [prodFilter, prodSearch]);

  const reviewStatusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: '待审核', color: 'orange' },
    approved: { label: '已通过', color: 'green' },
    rejected: { label: '已驳回', color: 'red' },
  };

  return (
    <div>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* ========== 商城审核 ========== */}
          <TabPane tab="商城审核" key="mall-review">
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}><Card size="small"><Statistic title="商城总数" value={mallStats.total} prefix={<ShopOutlined />} /></Card></Col>
              <Col span={6}><Card size="small" style={{ borderTop: '2px solid #fa8c16' }}><Statistic title="待审核" value={mallStats.pendingCount} valueStyle={{ color: '#fa8c16' }} /></Card></Col>
              <Col span={6}><Card size="small" style={{ borderTop: '2px solid #52c41a' }}><Statistic title="已通过" value={mallStats.approvedCount} valueStyle={{ color: '#52c41a' }} /></Card></Col>
              <Col span={6}><Card size="small" style={{ borderTop: '2px solid #ff4d4f' }}><Statistic title="已驳回" value={mallStats.rejectedCount} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
            </Row>
            <Card
              title="商城列表"
              extra={
                <Space>
                  <Select placeholder="审核状态" style={{ width: 120 }} value={mallFilter || undefined} onChange={(v) => setMallFilter(v || '')} allowClear>
                    <Option value="pending">待审核</Option>
                    <Option value="approved">已通过</Option>
                    <Option value="rejected">已驳回</Option>
                  </Select>
                  <Input placeholder="搜索商城名称/网址..." prefix={<SearchOutlined />} style={{ width: 220 }} value={mallSearch} onChange={(e) => setMallSearch(e.target.value)} allowClear />
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => { mallForm.resetFields(); setCurrentMall(null); setMallModalVisible(true); }}>新增商城</Button>
                </Space>
              }
            >
              <Table dataSource={malls} rowKey="id" loading={mallLoading} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}>
                <Table.Column title="商城名称" dataIndex="name" key="name" render={(name, r: MallItem) => (
                  <div><strong>{name}</strong><div style={{ fontSize: 12, color: '#999' }}>{r.platform}</div></div>
                )} />
                <Table.Column title="网址" dataIndex="url" key="url" render={(url) => (
                  <Tooltip title={url}><a href={url} target="_blank" rel="noopener noreferrer" style={{ maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</a></Tooltip>
                )} />
                <Table.Column title="联系人" dataIndex="contactName" key="contactName" width={100} render={(v) => v || '-'} />
                <Table.Column title="联系电话" dataIndex="contactPhone" key="contactPhone" width={130} render={(v) => v || '-'} />
                <Table.Column title="审核状态" dataIndex="reviewStatus" key="reviewStatus" width={100} render={(s) => {
                  const c = reviewStatusConfig[s]; return c ? <Tag color={c.color}>{c.label}</Tag> : s;
                }} />
                <Table.Column title="提交时间" dataIndex="createdAt" key="createdAt" width={160} render={(d) => d ? new Date(d).toLocaleString('zh-CN') : '-'} />
                <Table.Column title="操作" key="action" width={200} render={(_: any, record: MallItem) => (
                  <Space size="small">
                    <Tooltip title="查看详情"><Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setDetailMall(record); }} /></Tooltip>
                    {record.reviewStatus === 'pending' && (
                      <>
                        <Tooltip title="审核"><Button type="link" size="small" icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }} onClick={() => { setDetailMall(record); reviewForm.resetFields(); setReviewModalVisible(true); }} /></Tooltip>
                      </>
                    )}
                    <Popconfirm title="确定删除？" onConfirm={() => handleDeleteMall(record.id)} okText="确定" cancelText="取消">
                      <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                )} />
              </Table>
            </Card>
          </TabPane>

          {/* ========== 爆品推广 ========== */}
          <TabPane tab="爆品推广" key="hot-products">
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}><Card size="small"><Statistic title="商品总数" value={prodStats.totalProducts} prefix={<ShoppingCartOutlined />} /></Card></Col>
              <Col span={6}><Card size="small" style={{ borderTop: '2px solid #52c41a' }}><Statistic title="已上架" value={prodStats.promotedCount} valueStyle={{ color: '#52c41a' }} /></Card></Col>
              <Col span={6}><Card size="small" style={{ borderTop: '2px solid #1677ff' }}><Statistic title="总点击" value={prodStats.totalClicks} prefix={<ThunderboltOutlined />} /></Card></Col>
              <Col span={6}><Card size="small" style={{ borderTop: '2px solid #722ed1' }}><Statistic title="总转化" value={prodStats.totalLeads} prefix={<FireOutlined />} /></Card></Col>
            </Row>
            <Card
              title="爆品列表"
              extra={
                <Space>
                  <Select placeholder="状态" style={{ width: 100 }} value={prodFilter || undefined} onChange={(v) => setProdFilter(v || '')} allowClear>
                    <Option value="active">已上架</Option>
                    <Option value="draft">草稿</Option>
                    <Option value="offline">已下架</Option>
                  </Select>
                  <Input placeholder="搜索商品名称..." prefix={<SearchOutlined />} style={{ width: 200 }} value={prodSearch} onChange={(e) => setProdSearch(e.target.value)} allowClear />
                </Space>
              }
            >
              <Table dataSource={products} rowKey="id" loading={prodLoading} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
                expandable={{
                  expandedRowRender: (record: HotProduct) => (
                    <div>
                      <div style={{ marginBottom: 8, fontWeight: 'bold' }}>推广链接：</div>
                      {record.trackingLinks.length === 0 ? <span style={{ color: '#999' }}>暂无推广链接</span> : (
                        <Table dataSource={record.trackingLinks} rowKey="id" size="small" pagination={false}>
                          <Table.Column title="短链码" dataIndex="shortCode" key="shortCode" render={(code) => <Tag color="blue">{code}</Tag>} />
                          <Table.Column title="目标URL" dataIndex="targetUrl" key="targetUrl" render={(url) => <span style={{ fontSize: 12 }}>{url}</span>} />
                          <Table.Column title="来源" dataIndex="utmSource" key="utmSource" render={(v) => v || '-'} />
                          <Table.Column title="点击" dataIndex="clickCount" key="clickCount" width={60} />
                          <Table.Column title="转化" dataIndex="leadCount" key="leadCount" width={60} />
                          <Table.Column title="创建时间" dataIndex="createdAt" key="createdAt" width={160} render={(d) => new Date(d).toLocaleString('zh-CN')} />
                          <Table.Column title="操作" key="action" width={100} render={(_: any, link: TrackingLinkItem) => (
                            <Space size="small">
                              <Tooltip title="复制短链"><Button type="link" size="small" icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(`${API_BASE_URL}/s/${link.shortCode}`); message.success('已复制'); }} /></Tooltip>
                              <Popconfirm title="确定删除？" onConfirm={() => handleDeleteLink(link.id)} okText="确定" cancelText="取消">
                                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                              </Popconfirm>
                            </Space>
                          )} />
                        </Table>
                      )}
                    </div>
                  ),
                }}
              >
                <Table.Column title="商品名称" dataIndex="name" key="name" render={(name, r: HotProduct) => (
                  <div>
                    <strong>{name}</strong>
                    {r.tags && <div style={{ marginTop: 2 }}>{r.tags.split(',').filter(Boolean).slice(0, 2).map((t, i) => <Tag key={i} style={{ fontSize: 11 }}>{t}</Tag>)}</div>}
                  </div>
                )} />
                <Table.Column title="价格" dataIndex="price" key="price" width={100} render={(price: number, r: HotProduct) => (
                  <div>
                    <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{price.toFixed(2)}</span>
                    {r.originalPrice && <div style={{ fontSize: 12, color: '#999', textDecoration: 'line-through' }}>¥{r.originalPrice.toFixed(2)}</div>}
                  </div>
                )} />
                <Table.Column title="销量" dataIndex="salesCount" key="salesCount" width={80} render={(v) => <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{v}</span>} />
                <Table.Column title="库存" dataIndex="stock" key="stock" width={70} />
                <Table.Column title="推广链接" key="links" width={90} render={(_: any, r: HotProduct) => (
                  <Badge count={r.trackingLinks.length} showZero color="#1677ff">
                    <Tag icon={<LinkOutlined />} color="blue">{r.trackingLinks.length} 条</Tag>
                  </Badge>
                )} />
                <Table.Column title="状态" dataIndex="status" key="status" width={80} render={(s) => (
                  <Tag color={s === 'active' ? 'green' : s === 'draft' ? 'default' : 'red'}>{s === 'active' ? '上架' : s === 'draft' ? '草稿' : '下架'}</Tag>
                )} />
                <Table.Column title="操作" key="action" width={180} render={(_: any, record: HotProduct) => (
                  <Space size="small">
                    <Tooltip title="生成推广链接"><Button type="link" size="small" icon={<FireOutlined />} style={{ color: '#ff4d4f' }} onClick={() => { setCurrentProduct(record); promoteForm.resetFields(); setPromoteModalVisible(true); }} /></Tooltip>
                    <Tooltip title={record.status === 'active' ? '下架' : '上架'}>
                      <Button type="link" size="small" icon={<GlobalOutlined />} onClick={() => handleToggleStatus(record)} />
                    </Tooltip>
                  </Space>
                )} />
              </Table>
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      {/* 新增商城 Modal */}
      <Modal title="新增商城" open={mallModalVisible} onOk={handleMallSubmit} onCancel={() => { setMallModalVisible(false); mallForm.resetFields(); setCurrentMall(null); }} okText="提交" cancelText="取消">
        <Form form={mallForm} layout="vertical">
          <Form.Item name="name" label="商城名称" rules={[{ required: true, message: '请输入商城名称' }]}>
            <Input placeholder="请输入商城名称" />
          </Form.Item>
          <Form.Item name="url" label="商城网址" rules={[{ required: true, message: '请输入商城网址' }]}>
            <Input placeholder="https://example.com" />
          </Form.Item>
          <Form.Item name="platform" label="平台类型" rules={[{ required: true, message: '请选择平台类型' }]}>
            <Select placeholder="请选择平台类型">
              <Option value="shopify">Shopify</Option>
              <Option value="woocommerce">WooCommerce</Option>
              <Option value="self">自建商城</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="contactName" label="联系人">
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>
          <Form.Item name="contactPhone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="contactEmail" label="联系邮箱">
            <Input placeholder="请输入联系邮箱" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 商城详情 Drawer */}
      <Drawer title="商城详情" open={!!detailMall} onClose={() => { setDetailMall(null); setReviewModalVisible(false); }} width={480}>
        {detailMall && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="商城名称">{detailMall.name}</Descriptions.Item>
              <Descriptions.Item label="商城网址"><a href={detailMall.url} target="_blank" rel="noopener noreferrer">{detailMall.url}</a></Descriptions.Item>
              <Descriptions.Item label="平台类型">{detailMall.platform}</Descriptions.Item>
              <Descriptions.Item label="审核状态"><Tag color={reviewStatusConfig[detailMall.reviewStatus]?.color}>{reviewStatusConfig[detailMall.reviewStatus]?.label}</Tag></Descriptions.Item>
              {detailMall.reviewNote && <Descriptions.Item label="审核备注">{detailMall.reviewNote}</Descriptions.Item>}
              <Descriptions.Item label="联系人">{detailMall.contactName || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{detailMall.contactPhone || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系邮箱">{detailMall.contactEmail || '-'}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{new Date(detailMall.createdAt).toLocaleString('zh-CN')}</Descriptions.Item>
            </Descriptions>
            {detailMall.products && detailMall.products.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>关联商品（Top 5）</h4>
                <Table dataSource={detailMall.products} rowKey="id" size="small" pagination={false}>
                  <Table.Column title="名称" dataIndex="name" key="name" />
                  <Table.Column title="价格" dataIndex="price" key="price" width={80} render={(v: number) => `¥${v.toFixed(2)}`} />
                </Table>
              </div>
            )}
            {detailMall.reviewStatus === 'pending' && (
              <div style={{ marginTop: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
                <h4>审核操作</h4>
                <Form form={reviewForm} layout="vertical">
                  <Form.Item name="reviewStatus" label="审核结果" rules={[{ required: true }]}>
                    <Select>
                      <Option value="approved">通过</Option>
                      <Option value="rejected">驳回</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name="reviewNote" label="审核备注">
                    <Input.TextArea rows={3} placeholder="请输入审核备注" />
                  </Form.Item>
                  <Button type="primary" onClick={handleReview}>提交审核</Button>
                </Form>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* 生成推广链接 Modal */}
      <Modal title={`为「${currentProduct?.name}」生成推广链接`} open={promoteModalVisible} onOk={handlePromote} onCancel={() => { setPromoteModalVisible(false); promoteForm.resetFields(); setCurrentProduct(null); }} okText="生成" cancelText="取消">
        <Form form={promoteForm} layout="vertical" initialValues={{ targetUrl: currentProduct?.externalUrl || '' }}>
          <Form.Item name="targetUrl" label="目标链接" rules={[{ required: true, message: '请输入目标链接' }]}>
            <Input placeholder="https://example.com/product/123" />
          </Form.Item>
          <Form.Item name="utmSource" label="推广来源">
            <Input placeholder="如：wechat、douyin、xiaohongshu" />
          </Form.Item>
          <Form.Item name="utmMedium" label="推广媒介">
            <Input placeholder="如：cpc、banner、article" />
          </Form.Item>
          <Form.Item name="utmCampaign" label="推广活动">
            <Input placeholder="如：summer_sale、new_launch" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MallManagement;
