import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Card, Table, Button, Space, Modal, message, Tag, 
  Tabs, Statistic, Row, Col, Typography, Empty, Progress, Divider,
  Form, Input, Select, Switch, InputNumber, Popconfirm, Alert
} from 'antd';
import { 
  QrcodeOutlined, FileTextOutlined, EyeOutlined,
  EditOutlined, AppstoreOutlined, LinkOutlined,
  CopyOutlined, CheckCircleOutlined, WarningOutlined,
  RocketOutlined, PlusOutlined, DeleteOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { TabPane } = Tabs;
const { Text, Title } = Typography;

const PROMOTION_API = `${API_BASE_URL}/api/v1/promotion`;
const ADMIN_API = `${API_BASE_URL}/api/v1/admin`;
const CMS_API = `${API_BASE_URL}/api/v1/cms`;
const WEB_BASE = 'https://st-ltd-web.pages.dev';
const getToken = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });

// ============ SEO 评分计算 ============
const calcSeoScore = (item: any): number => {
  let score = 0;
  if (item.seoTitle && item.seoTitle.length >= 10 && item.seoTitle.length <= 60) score += 25;
  else if (item.seoTitle) score += 10;
  if (item.seoDesc && item.seoDesc.length >= 50 && item.seoDesc.length <= 160) score += 25;
  else if (item.seoDesc) score += 10;
  if (item.slug || item.domain) score += 15;
  if (item.status === 'published') score += 20;
  if (item.title && item.title.length >= 5) score += 15;
  return score;
};

const getSeoFixes = (item: any): { label: string; ok: boolean }[] => {
  const fixes: { label: string; ok: boolean }[] = [];
  if (!item.seoTitle || item.seoTitle.length < 10) fixes.push({ label: 'SEO标题过短，建议10-60个字符', ok: false });
  else if (item.seoTitle.length > 60) fixes.push({ label: 'SEO标题过长，建议60字符以内', ok: false });
  else fixes.push({ label: `SEO标题 (${item.seoTitle.length}字符)`, ok: true });
  if (!item.seoDesc || item.seoDesc.length < 50) fixes.push({ label: 'SEO描述过短，建议50-160个字符', ok: false });
  else if (item.seoDesc.length > 160) fixes.push({ label: 'SEO描述过长，建议160字符以内', ok: false });
  else fixes.push({ label: `SEO描述 (${item.seoDesc.length}字符)`, ok: true });
  if (item.status !== 'published') fixes.push({ label: '未发布，发布后才能被搜索引擎收录', ok: false });
  else fixes.push({ label: '已发布', ok: true });
  if (!item.title || item.title.length < 5) fixes.push({ label: '标题过短，建议至少5个字符', ok: false });
  else fixes.push({ label: '标题长度合格', ok: true });
  if (fixes.filter(f => !f.ok).length === 0) fixes.push({ label: 'SEO状态良好，无需修复', ok: true });
  return fixes;
};

// ============ 获取链接URL ============
const getItemUrl = (record: any): string => {
  return record.domain ? record.domain : `${WEB_BASE}/p/${record.slug}`;
};

// ============ Component ============
const PromotionCenter: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'promotion';
  const setActiveTab = (key: string) => setSearchParams({ tab: key });

  const [sites, setSites] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [trackingLinks, setTrackingLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [seoFixModal, setSeoFixModal] = useState<any>(null);
  const [qrModal, setQrModal] = useState<any>(null);
  // SEO 策略状态
  const [strategies, setStrategies] = useState<any[]>([]);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyModal, setStrategyModal] = useState<any>(null);
  const [strategyForm] = Form.useForm();
  const [ruleForm] = Form.useForm();
  const [currentRules, setCurrentRules] = useState<any[]>([]);

  // 获取推广数据
  const fetchData = async () => {
    setLoading(true);
    try {
      const [sitesRes, pagesRes, linksRes] = await Promise.all([
        axios.get(`${ADMIN_API}/sites`, getToken()).catch(() => ({ data: { data: [] } })),
        axios.get(`${ADMIN_API}/pages`, getToken()).catch(() => ({ data: { data: { list: [] } } })),
        axios.get(`${PROMOTION_API}/tracking-links`, getToken()).catch(() => ({ data: { data: [] } })),
      ]);
      const sitesData = sitesRes.data?.data;
      const pagesData = pagesRes.data?.data;
      const linksData = linksRes.data?.data;
      setSites(Array.isArray(sitesData) ? sitesData : []);
      setPages(Array.isArray(pagesData?.list) ? pagesData.list : Array.isArray(pagesData) ? pagesData : []);
      setTrackingLinks(Array.isArray(linksData) ? linksData : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); fetchStrategies(); }, []);

  // 获取 SEO 策略
  const fetchStrategies = async () => {
    setStrategyLoading(true);
    try {
      const res = await axios.get(`${PROMOTION_API}/seo/strategies`, getToken());
      if (res.data.code === 0) setStrategies(res.data.data || []);
    } catch {}
    setStrategyLoading(false);
  };

  // 保存策略
  const handleSaveStrategy = async (values: any) => {
    try {
      const data = { ...values, rules: currentRules };
      if (strategyModal?.id) {
        const res = await axios.put(`${PROMOTION_API}/seo/strategies/${strategyModal.id}`, data, getToken());
        if (res.data.code === 0) { message.success('策略更新成功'); setStrategyModal(null); strategyForm.resetFields(); setCurrentRules([]); fetchStrategies(); }
        else message.error(res.data.message || '保存失败');
      } else {
        const res = await axios.post(`${PROMOTION_API}/seo/strategies`, data, getToken());
        if (res.data.code === 0) { message.success('策略创建成功'); setStrategyModal(null); strategyForm.resetFields(); setCurrentRules([]); fetchStrategies(); }
        else message.error(res.data.message || '创建失败');
      }
    } catch { message.error('操作失败'); }
  };

  // 删除策略
  const handleDeleteStrategy = async (id: string) => {
    try {
      const res = await axios.delete(`${PROMOTION_API}/seo/strategies/${id}`, getToken());
      if (res.data.code === 0) { message.success('策略已删除'); fetchStrategies(); }
      else message.error(res.data.message || '删除失败');
    } catch { message.error('删除失败'); }
  };

  // 添加规则
  const handleAddRule = async (values: any) => {
    const newRules = [...currentRules, values];
    setCurrentRules(newRules);
    ruleForm.resetFields();
  };

  // 删除规则
  const handleRemoveRule = (index: number) => {
    setCurrentRules(currentRules.filter((_, i) => i !== index));
  };

  // 编辑策略
  const handleEditStrategy = (record: any) => {
    let rules: any[] = [];
    try { rules = typeof record.rules === 'string' ? JSON.parse(record.rules) : record.rules; } catch {}
    setCurrentRules(rules);
    strategyForm.setFieldsValue({
      name: record.name,
      description: record.description,
      target: record.target,
      isActive: record.isActive,
      sortOrder: record.sortOrder,
    });
    setStrategyModal(record);
  };

  // 新建策略
  const handleAddStrategy = () => {
    setCurrentRules([]);
    strategyForm.resetFields();
    strategyForm.setFieldsValue({ target: 'page', isActive: true, sortOrder: 0 });
    setStrategyModal({});
  };

  // 合并站点和页面
  const allItems = [
    ...sites.map((s: any) => ({ ...s, _source: '站点' as const })),
    ...pages.map((p: any) => ({ ...p, _source: '页面' as const })),
  ];

  // 生成追踪链接
  const handleGenerateTracking = async (record: any) => {
    const url = getItemUrl(record);
    try {
      if (record._source === '页面' && record.id) {
        // 页面用 CMS API
        const res = await axios.post(`${CMS_API}/pages/${record.id}/generate-link`, {
          utmSource: 'promotion-center', utmMedium: 'tracking',
        }, getToken());
        if (res.data.code === 0) {
          message.success('追踪链接已生成');
          fetchData();
        } else {
          message.error(res.data.message || '生成失败');
        }
      } else {
        // 站点用 Promotion API
        const res = await axios.post(`${PROMOTION_API}/tracking-links`, {
          targetUrl: url, utmSource: 'promotion-center', utmMedium: 'tracking', utmCampaign: record.name || record.title,
        }, getToken());
        if (res.data.code === 0) {
          message.success('追踪链接已生成');
          fetchData();
        } else {
          message.error(res.data.message || '生成失败');
        }
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '生成失败');
    }
  };

  // 复制链接
  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    message.success('链接已复制');
  };

  // ============ 页面推广 Tab ============
  const renderPromotionTab = () => (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}><Card size="small"><Statistic title="站点数" value={sites.length} prefix={<AppstoreOutlined />} /></Card></Col>
        <Col span={8}><Card size="small"><Statistic title="页面数" value={pages.length} prefix={<FileTextOutlined />} /></Card></Col>
        <Col span={8}><Card size="small"><Statistic title="已发布" value={allItems.filter(p => p.status === 'published').length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>
      <Card title="站点与页面推广">
        <Table dataSource={allItems} rowKey="id" loading={loading} pagination={{ pageSize: 10 }}>
          <Table.Column title="来源" dataIndex="_source" width={60} render={(s) => <Tag color={s === '站点' ? 'blue' : 'green'}>{s}</Tag>} />
          <Table.Column title="名称" dataIndex="title" render={(t, r: any) => (
            <div>
              <Text strong>{t || r.name}</Text>
              {r.domain && <div style={{ fontSize: 12, color: '#999' }}>{r.domain}</div>}
              {r.slug && <div style={{ fontSize: 12, color: '#999' }}>{WEB_BASE}/p/{r.slug}</div>}
            </div>
          )} />
          <Table.Column title="状态" dataIndex="status" width={80} render={(s) => <Tag color={s === 'published' ? 'green' : 'default'}>{s === 'published' ? '已发布' : '草稿'}</Tag>} />
          <Table.Column title="操作" width={260} render={(_: any, record: any) => {
            const url = getItemUrl(record);
            return (
              <Space size="small">
                <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => handleCopy(url)}>复制链接</Button>
                <Button type="link" size="small" icon={<QrcodeOutlined />} onClick={() => setQrModal({ url, title: record.title || record.name })}>二维码</Button>
                <Button type="link" size="small" icon={<RocketOutlined />} onClick={() => handleGenerateTracking(record)}>生成推广链接</Button>
              </Space>
            );
          }} />
        </Table>
      </Card>
    </>
  );

  // ============ 追踪链接 Tab ============
  const renderTrackingTab = () => (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="追踪链接总数" value={trackingLinks.length} prefix={<LinkOutlined />} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="总点击数" value={trackingLinks.reduce((s: number, l: any) => s + (l.clickCount || 0), 0)} prefix={<EyeOutlined />} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="活跃链接" value={trackingLinks.filter((l: any) => (l.clickCount || 0) > 0).length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="站点+页面" value={allItems.length} /></Card></Col>
      </Row>

      <Card title="站点与页面 — 生成追踪链接" style={{ marginBottom: 16 }}>
        <Table dataSource={allItems} rowKey="id" loading={loading} pagination={{ pageSize: 5 }} size="small">
          <Table.Column title="来源" dataIndex="_source" width={60} render={(s) => <Tag color={s === '站点' ? 'blue' : 'green'}>{s}</Tag>} />
          <Table.Column title="名称" dataIndex="title" render={(t, r: any) => <Text strong>{t || r.name}</Text>} />
          <Table.Column title="链接" render={(_: any, r: any) => <Text type="secondary" style={{ fontSize: 12 }}>{getItemUrl(r)}</Text>} />
          <Table.Column title="操作" width={120} render={(_: any, record: any) => (
            <Button type="primary" size="small" icon={<LinkOutlined />} onClick={() => handleGenerateTracking(record)}>生成追踪链接</Button>
          )} />
        </Table>
      </Card>

      <Card title="已有追踪链接">
        {trackingLinks.length === 0 ? (
          <Empty description="暂无追踪链接，点击上方按钮生成" style={{ padding: 20 }} />
        ) : (
          <Table dataSource={trackingLinks} rowKey="id" pagination={{ pageSize: 10 }}>
            <Table.Column title="短链" dataIndex="shortCode" render={(code) => (
              <Tag color="blue" style={{ cursor: 'pointer' }} onClick={() => handleCopy(`${WEB_BASE}/t/${code}`)}>
                st-ltd-web.pages.dev/t/{code}
              </Tag>
            )} />
            <Table.Column title="目标页面" dataIndex="targetUrl" render={(url) => (
              <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</div>
            )} />
            <Table.Column title="点击次数" dataIndex="clickCount" width={100} sorter={(a: any, b: any) => (a.clickCount || 0) - (b.clickCount || 0)} render={(c) => <Tag color={c > 0 ? 'blue' : 'default'}>{c || 0} 次</Tag>} />
            <Table.Column title="创建时间" dataIndex="createdAt" width={160} render={(d) => d ? new Date(d).toLocaleString('zh-CN') : '-'} />
          </Table>
        )}
      </Card>
    </>
  );

  // ============ SEO优化 Tab ============
  const renderSeoTab = () => {
    const itemsWithScore = allItems.map(i => ({ ...i, seoScore: calcSeoScore(i) }));
    const avgScore = itemsWithScore.length > 0 ? Math.round(itemsWithScore.reduce((s, i) => s + i.seoScore, 0) / itemsWithScore.length) : 0;
    return (
      <>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}><Card size="small"><Statistic title="站点+页面总数" value={allItems.length} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="平均SEO评分" value={avgScore} suffix="/100" /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="优秀(≥80)" value={itemsWithScore.filter(p => p.seoScore >= 80).length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="需优化(<60)" value={itemsWithScore.filter(p => p.seoScore < 60).length} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        </Row>
        <Card title="SEO评分与AI优化建议">
          <Table dataSource={itemsWithScore} rowKey="id" loading={loading} pagination={{ pageSize: 10 }}>
            <Table.Column title="来源" dataIndex="_source" width={60} render={(s) => <Tag color={s === '站点' ? 'blue' : 'green'}>{s}</Tag>} />
            <Table.Column title="名称" dataIndex="title" render={(t, r: any) => <Text strong>{t || r.name}</Text>} />
            <Table.Column title="SEO标题" dataIndex="seoTitle" render={(t) => t ? t.substring(0, 30) + (t.length > 30 ? '...' : '') : <Text type="danger">未设置</Text>} />
            <Table.Column title="SEO评分" dataIndex="seoScore" width={100} render={(score: number) => (
              <Progress percent={score} size="small" strokeColor={score >= 80 ? '#52c41a' : score >= 50 ? '#faad14' : '#ff4d4f'} />
            )} sorter={(a: any, b: any) => a.seoScore - b.seoScore} />
            <Table.Column title="操作" width={120} render={(_: any, record: any) => (
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => setSeoFixModal(record)}>AI修复建议</Button>
            )} />
          </Table>
        </Card>
      </>
    );
  };

  // ============ SEO策略管理 Tab ============
  const renderSeoStrategyTab = () => {
    const columns = [
      { title: '策略名称', dataIndex: 'name', render: (v: string) => <Text strong>{v}</Text> },
      { title: '描述', dataIndex: 'description', ellipsis: true },
      { title: '目标', dataIndex: 'target', width: 80, render: (v: string) => <Tag color={v === 'site' ? 'blue' : 'green'}>{v === 'site' ? '站点' : '页面'}</Tag> },
      { title: '规则数', width: 80, render: (_: any, r: any) => {
        try { const rules = typeof r.rules === 'string' ? JSON.parse(r.rules) : r.rules; return <Tag>{Array.isArray(rules) ? rules.length : 0} 条</Tag>; } catch { return <Tag>0 条</Tag>; }
      }},
      { title: '状态', dataIndex: 'isActive', width: 80, render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '启用' : '禁用'}</Tag> },
      { title: '排序', dataIndex: 'sortOrder', width: 60 },
      { title: '操作', width: 150, render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditStrategy(record)}>编辑</Button>
          <Popconfirm title="确定删除此策略？" onConfirm={() => handleDeleteStrategy(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )},
    ];
    return (
      <>
        <Alert message="SEO策略用于指导前端“一键修复”功能的行为。创建策略后，前端推广工具的SEO模块会按照策略规则执行修复，而不是随机修复。" type="info" showIcon style={{ marginBottom: 16 }} />
        <Card title="SEO优化策略列表" extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAddStrategy}>新建策略</Button>}>
          <Table dataSource={strategies} rowKey="id" loading={strategyLoading} columns={columns} pagination={{ pageSize: 10 }} />
        </Card>
      </>
    );
  };

  return (
    <div>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="页面推广" key="promotion">{renderPromotionTab()}</TabPane>
          <TabPane tab="追踪链接" key="tracking">{renderTrackingTab()}</TabPane>
          <TabPane tab="SEO优化" key="seo">{renderSeoTab()}</TabPane>
          <TabPane tab="SEO策略管理" key="seo-strategy">{renderSeoStrategyTab()}</TabPane>
        </Tabs>
      </Card>

      {/* SEO修复建议弹窗 */}
      <Modal title={seoFixModal ? `SEO优化建议 — ${seoFixModal.title || seoFixModal.name}` : ''} open={!!seoFixModal} onCancel={() => setSeoFixModal(null)} footer={null} width={500}>
        {seoFixModal && (() => {
          const fixes = getSeoFixes(seoFixModal);
          const score = calcSeoScore(seoFixModal);
          return (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Progress type="circle" percent={score} size={100} strokeColor={score >= 80 ? '#52c41a' : score >= 50 ? '#faad14' : '#ff4d4f'} />
                <div style={{ marginTop: 8 }}><Text type="secondary">SEO综合评分</Text></div>
              </div>
              <Divider />
              <Title level={5}>诊断结果：</Title>
              {fixes.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '8px 12px', background: f.ok ? '#f6ffed' : '#fff2f0', borderRadius: 6, border: `1px solid ${f.ok ? '#b7eb8f' : '#ffccc7'}` }}>
                  {f.ok ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} /> : <WarningOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />}
                  <Text>{f.label}</Text>
                </div>
              ))}
            </div>
          );
        })()}
      </Modal>

      {/* SEO策略编辑弹窗 */}
      <Modal
        title={strategyModal?.id ? '编辑SEO策略' : '新建SEO策略'}
        open={!!strategyModal}
        onCancel={() => { setStrategyModal(null); strategyForm.resetFields(); setCurrentRules([]); }}
        onOk={() => strategyForm.submit()}
        width={700}
        destroyOnClose
      >
        <Form form={strategyForm} onFinish={handleSaveStrategy} layout="vertical">
          <Form.Item name="name" label="策略名称" rules={[{ required: true, message: '请输入策略名称' }]}>
            <Input placeholder="例如：页面SEO标题自动优化" />
          </Form.Item>
          <Form.Item name="description" label="策略描述">
            <Input.TextArea rows={2} placeholder="描述此策略的作用" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="target" label="目标类型" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="site">站点</Select.Option>
                  <Select.Option value="page">页面</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sortOrder" label="执行顺序">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isActive" label="启用" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Divider>规则配置</Divider>
          {currentRules.length > 0 && (
            <Table
              size="small"
              dataSource={currentRules}
              rowKey={(_, i) => String(i)}
              pagination={false}
              style={{ marginBottom: 16 }}
              columns={[
                { title: '字段', dataIndex: 'field', width: 100, render: (v: string) => <Tag>{({seoTitle:'SEO标题',seoDesc:'SEO描述',seoKeywords:'关键词',title:'标题',slug:'路径',status:'状态'} as any)[v] || v}</Tag> },
                { title: '条件', dataIndex: 'condition', width: 80, render: (v: string) => <Tag color="orange">{({empty:'为空',short:'过短',missing:'缺失'} as any)[v] || v}</Tag> },
                { title: '操作', dataIndex: 'action', width: 80, render: (v: string) => <Tag color="blue">{({fill:'填充',append:'追加',replace:'替换'} as any)[v] || v}</Tag> },
                { title: '模板', dataIndex: 'template', ellipsis: true, render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v || '-'}</Text> },
                { title: '', width: 50, render: (_: any, __: any, index: number) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => handleRemoveRule(index)} /> },
              ]}
            />
          )}
          <Card size="small" title="添加规则" style={{ background: '#fafafa' }}>
            <Form form={ruleForm} onFinish={handleAddRule} layout="inline" style={{ flexWrap: 'wrap', gap: 8 }}>
              <Form.Item name="field" rules={[{ required: true, message: '必填' }]} style={{ marginBottom: 8 }}>
                <Select placeholder="字段" style={{ width: 110 }}>
                  <Select.Option value="seoTitle">SEO标题</Select.Option>
                  <Select.Option value="seoDesc">SEO描述</Select.Option>
                  <Select.Option value="seoKeywords">SEO关键词</Select.Option>
                  <Select.Option value="title">标题</Select.Option>
                  <Select.Option value="slug">路径</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="condition" rules={[{ required: true, message: '必填' }]} style={{ marginBottom: 8 }}>
                <Select placeholder="条件" style={{ width: 90 }}>
                  <Select.Option value="empty">为空</Select.Option>
                  <Select.Option value="short">过短</Select.Option>
                  <Select.Option value="missing">缺失</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="action" rules={[{ required: true, message: '必填' }]} style={{ marginBottom: 8 }}>
                <Select placeholder="操作" style={{ width: 90 }}>
                  <Select.Option value="fill">填充</Select.Option>
                  <Select.Option value="append">追加</Select.Option>
                  <Select.Option value="replace">替换</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="template" style={{ marginBottom: 8 }}>
                <Input placeholder="模板，如 {pageTitle} - {siteName}" style={{ width: 200 }} />
              </Form.Item>
              <Form.Item name="minLength" style={{ marginBottom: 8 }}>
                <InputNumber placeholder="最小长度" min={1} style={{ width: 100 }} />
              </Form.Item>
              <Form.Item style={{ marginBottom: 8 }}>
                <Button type="primary" htmlType="submit" size="small" icon={<PlusOutlined />}>添加</Button>
              </Form.Item>
            </Form>
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              模板变量：&#123;siteName&#125; = 站点名称，&#123;siteDomain&#125; = 域名，&#123;pageTitle&#125; = 页面标题
            </div>
          </Card>
        </Form>
      </Modal>

      {/* 二维码弹窗 */}
      <Modal title={qrModal?.title || '二维码'} open={!!qrModal} onCancel={() => setQrModal(null)} footer={null}>
        {qrModal && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrModal.url)}`} alt="QR Code" width={200} height={200} />
            <div style={{ marginTop: 12 }}>
              <Text copyable style={{ color: '#1677ff' }}>{qrModal.url}</Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PromotionCenter;
