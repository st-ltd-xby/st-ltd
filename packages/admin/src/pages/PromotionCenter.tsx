import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Card, Table, Button, Space, Modal, message, Tag, 
  Tabs, Statistic, Row, Col, Typography, Empty, Progress, Divider
} from 'antd';
import { 
  QrcodeOutlined, FileTextOutlined, EyeOutlined,
  EditOutlined, AppstoreOutlined, LinkOutlined,
  CopyOutlined, CheckCircleOutlined, WarningOutlined,
  RocketOutlined
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

  useEffect(() => { fetchData(); }, []);

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

  return (
    <div>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="页面推广" key="promotion">{renderPromotionTab()}</TabPane>
          <TabPane tab="追踪链接" key="tracking">{renderTrackingTab()}</TabPane>
          <TabPane tab="SEO优化" key="seo">{renderSeoTab()}</TabPane>
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

      {/* 二维码弹窗 */}
      <Modal title={qrModal?.title || '二维码'} open={!!qrModal} onCancel={() => setQrModal(null)} footer={null}>
        {qrModal && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <AntQR value={qrModal.url} size={200} />
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
