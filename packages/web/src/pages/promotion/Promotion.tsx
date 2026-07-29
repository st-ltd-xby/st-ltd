import { useState, useEffect } from 'react';
import {
  Card, Tabs, Button, Typography, Space, Table, Modal, Form, Input, Select,
  InputNumber, message, Tag, Statistic, Row, Col, Popconfirm, List, Badge,
  Tooltip, Divider, Alert,
} from 'antd';
import {
  LinkOutlined, QrcodeOutlined, MailOutlined, SearchOutlined,
  PlusOutlined, CopyOutlined, DeleteOutlined, SendOutlined,
  BarChartOutlined, EyeOutlined, CheckCircleOutlined, EditOutlined,
} from '@ant-design/icons';
import { promotionApi, cmsApi } from '../../services/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function Promotion() {
  return (
    <div>
      <Title level={4}>推广工具</Title>
      <Tabs defaultActiveKey="tracking" type="card" size="large">
        <TabPane tab={<span><LinkOutlined /> 追踪链接</span>} key="tracking">
          <TrackingLinks />
        </TabPane>
        <TabPane tab={<span><QrcodeOutlined /> 二维码生成</span>} key="qrcode">
          <QrCodeGenerator />
        </TabPane>
        <TabPane tab={<span><MailOutlined /> 邮件营销</span>} key="email">
          <EmailMarketing />
        </TabPane>
        <TabPane tab={<span><SearchOutlined /> SEO 优化</span>} key="seo">
          <SeoTools />
        </TabPane>
      </Tabs>
    </div>
  );
}

// ============================================
// 追踪链接
// ============================================
function TrackingLinks() {
  const [links, setLinks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ summary: {} });
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [linksRes, statsRes]: any[] = await Promise.all([
        promotionApi.getTrackingLinks(),
        promotionApi.getTrackingStats(),
      ]);
      if (linksRes.code === 0) setLinks(linksRes.data || []);
      if (statsRes.code === 0) setStats(statsRes.data);
    } catch {}
  };

  const handleCreate = async (values: any) => {
    setLoading(true);
    try {
      const res: any = await promotionApi.createTrackingLink(values);
      if (res.code === 0) {
        message.success('追踪链接创建成功');
        setModalOpen(false);
        form.resetFields();
        loadData();
      }
    } catch { message.error('创建失败'); }
    setLoading(false);
  };

  const copyLink = (record: any) => {
    const url = `${window.location.origin}/t/${record.shortCode}`;
    navigator.clipboard.writeText(url);
    message.success('链接已复制到剪贴板');
  };

  const handleSimulateClick = async (record: any) => {
    try {
      const res: any = await promotionApi.simulateClick(record.id, Math.floor(Math.random() * 10) + 1);
      if (res.code === 0) { message.success(res.message); loadData(); }
    } catch { message.error('模拟失败'); }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      const res: any = await promotionApi.deleteTrackingLink(id);
      if (res.code === 0) { message.success('删除成功'); loadData(); }
    } catch { message.error('删除失败'); }
  };

  const columns = [
    { title: '短链接', dataIndex: 'shortCode', key: 'shortCode', render: (code: string) => (
      <Tag color="blue" style={{ cursor: 'pointer' }} onClick={() => navigator.clipboard.writeText(`${window.location.origin}/t/${code}`)}>{`/t/${code}`}</Tag>
    )},
    { title: '目标地址', dataIndex: 'targetUrl', key: 'targetUrl', ellipsis: true },
    { title: '来源', dataIndex: 'utmSource', key: 'utmSource', render: (v: string) => v ? <Tag>{v}</Tag> : '-' },
    { title: '点击数', dataIndex: 'clickCount', key: 'clickCount', sorter: (a: any, b: any) => a.clickCount - b.clickCount },
    { title: '转化数', dataIndex: 'leadCount', key: 'leadCount' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => new Date(v).toLocaleDateString() },
    { title: '操作', key: 'action', width: 150, render: (_: any, record: any) => (
      <Space>
        <Tooltip title="复制链接"><Button size="small" icon={<CopyOutlined />} onClick={() => copyLink(record)} /></Tooltip>
        <Tooltip title="模拟点击"><Button size="small" type="primary" onClick={() => handleSimulateClick(record)}>模拟点击</Button></Tooltip>
        <Popconfirm title="确定删除此链接？" onConfirm={() => handleDeleteLink(record.id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}><Card><Statistic title="总链接数" value={stats.summary?.totalLinks || 0} prefix={<LinkOutlined />} /></Card></Col>
        <Col span={8}><Card><Statistic title="总点击数" value={stats.summary?.totalClicks || 0} prefix={<EyeOutlined />} /></Card></Col>
        <Col span={8}><Card><Statistic title="总转化数" value={stats.summary?.totalLeads || 0} prefix={<CheckCircleOutlined />} /></Card></Col>
      </Row>

      <Card extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>创建追踪链接</Button>}>
        <Table dataSource={links} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="创建追踪链接" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} confirmLoading={loading}>
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="targetUrl" label="目标地址" rules={[{ required: true, message: '请输入目标URL' }]}>
            <Input placeholder="https://example.com/landing-page" />
          </Form.Item>
          <Form.Item name="utmSource" label="来源渠道">
            <Select placeholder="选择渠道" allowClear>
              <Select.Option value="wechat">微信</Select.Option>
              <Select.Option value="xiaohongshu">小红书</Select.Option>
              <Select.Option value="douyin">抖音</Select.Option>
              <Select.Option value="weibo">微博</Select.Option>
              <Select.Option value="baidu">百度</Select.Option>
              <Select.Option value="email">邮件</Select.Option>
              <Select.Option value="sms">短信</Select.Option>
              <Select.Option value="offline">线下</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="utmMedium" label="媒介">
            <Input placeholder="如: social, cpc, banner" />
          </Form.Item>
          <Form.Item name="utmCampaign" label="活动名称">
            <Input placeholder="如: 618促销" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ============================================
// 二维码生成
// ============================================
function QrCodeGenerator() {
  const [qrcodes, setQrcodes] = useState<any[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [instantModal, setInstantModal] = useState(false);
  const [instantUrl, setInstantUrl] = useState('');
  const [instantQr, setInstantQr] = useState('');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadQrcodes(); }, []);

  const loadQrcodes = async () => {
    try {
      const res: any = await promotionApi.getQrCodes();
      if (res.code === 0) setQrcodes(res.data || []);
    } catch {}
  };

  const handleCreate = async (values: any) => {
    setLoading(true);
    try {
      const res: any = await promotionApi.createQrCode(values);
      if (res.code === 0) {
        message.success('二维码生成成功');
        setModalOpen(false);
        form.resetFields();
        loadQrcodes();
      }
    } catch { message.error('生成失败'); }
    setLoading(false);
  };

  const handleInstantGenerate = async () => {
    if (!instantUrl) return;
    try {
      const res: any = await promotionApi.generateQrCode({ url: instantUrl });
      if (res.code === 0) setInstantQr(res.data.imageUrl);
    } catch { message.error('生成失败'); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res: any = await promotionApi.deleteQrCode(id);
      if (res.code === 0) { message.success('删除成功'); loadQrcodes(); }
    } catch { message.error('删除失败'); }
  };

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>保存二维码</Button>
        <Button icon={<QrcodeOutlined />} onClick={() => { setInstantModal(true); setInstantQr(''); setInstantUrl(''); }}>快速生成</Button>
      </Space>

      <Row gutter={[16, 16]}>
        {qrcodes.map(qr => (
          <Col key={qr.id} xs={12} sm={8} md={6}>
            <Card hoverable actions={[
              <Tooltip title="复制链接" key="copy"><CopyOutlined onClick={() => { navigator.clipboard.writeText(qr.targetUrl); message.success('已复制'); }} /></Tooltip>,
              <Tooltip title="查看大图" key="view"><EyeOutlined onClick={() => setPreviewUrl(qr.imageUrl)} /></Tooltip>,
              <Popconfirm title="确定删除？" onConfirm={() => handleDelete(qr.id)} key="del">
                <DeleteOutlined style={{ color: '#ff4d4f' }} />
              </Popconfirm>,
            ]}>
              <Card.Meta
                avatar={qr.imageUrl ? <img src={qr.imageUrl} alt={qr.name} style={{ width: 120, height: 120 }} /> : <QrcodeOutlined style={{ fontSize: 48 }} />}
                title={qr.name}
                description={<Text ellipsis style={{ fontSize: 12 }}>{qr.targetUrl}</Text>}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>扫码 {qr.scanCount} 次</div>
            </Card>
          </Col>
        ))}
        {qrcodes.length === 0 && <Col span={24}><Alert message="还没有保存的二维码，点击上方按钮生成" type="info" showIcon /></Col>}
      </Row>

      {/* 创建二维码 */}
      <Modal title="生成并保存二维码" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} confirmLoading={loading}>
        <Form form={form} onFinish={handleCreate} layout="vertical" initialValues={{ size: 300, color: '#000000', bgColor: '#ffffff' }}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input placeholder="如: 官网首页" /></Form.Item>
          <Form.Item name="targetUrl" label="目标链接" rules={[{ required: true }]} extra="输入域名自动补全 https://，如 example.com → https://example.com"><Input placeholder="https://example.com 或 example.com" /></Form.Item>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="size" label="尺寸(px)"><InputNumber min={100} max={800} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="color" label="前景色"><Input type="color" style={{ height: 36 }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="bgColor" label="背景色"><Input type="color" style={{ height: 36 }} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* 快速生成 */}
      <Modal title="快速生成二维码" open={instantModal} onCancel={() => setInstantModal(false)} footer={null} width={400}>
        <Input.Search placeholder="输入链接（自动补全 https://）" enterButton="生成" value={instantUrl} onChange={e => setInstantUrl(e.target.value)} onSearch={handleInstantGenerate} style={{ marginBottom: 16 }} />
        {instantQr && <div style={{ textAlign: 'center' }}><img src={instantQr} alt="QR" style={{ maxWidth: '100%' }} /><Button style={{ marginTop: 12 }} onClick={() => { const a = document.createElement('a'); a.href = instantQr; a.download = 'qrcode.png'; a.click(); }}>下载图片</Button></div>}
      </Modal>

      {/* 预览大图 */}
      <Modal open={!!previewUrl} footer={null} onCancel={() => setPreviewUrl('')} width={400}>
        {previewUrl && <img src={previewUrl} alt="Preview" style={{ width: '100%' }} />}
      </Modal>
    </div>
  );
}

// ============================================
// 邮件营销
// ============================================
function EmailMarketing() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [smtpConfig, setSmtpConfig] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressModal, setAddressModal] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [templateModal, setTemplateModal] = useState(false);
  const [campaignModal, setCampaignModal] = useState(false);
  const [smtpModal, setSmtpModal] = useState(false);
  const [templateForm] = Form.useForm();
  const [campaignForm] = Form.useForm();
  const [smtpForm] = Form.useForm();
  const [addressForm] = Form.useForm();
  const [importForm] = Form.useForm();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [tRes, cRes, sRes]: any[] = await Promise.all([
        promotionApi.getEmailTemplates(),
        promotionApi.getEmailCampaigns(),
        promotionApi.getSmtpConfig(),
      ]);
      if (tRes.code === 0) setTemplates(tRes.data || []);
      if (cRes.code === 0) setCampaigns(cRes.data || []);
      if (sRes.code === 0 && sRes.data) setSmtpConfig(sRes.data);
      
      // 加载邮件地址
      loadAddresses();
    } catch {}
  };

  const handleCreateTemplate = async (values: any) => {
    const res: any = await promotionApi.createEmailTemplate(values);
    if (res.code === 0) { message.success('模板创建成功'); setTemplateModal(false); templateForm.resetFields(); loadData(); }
  };

  const handleCreateCampaign = async (values: any) => {
    const res: any = await promotionApi.createEmailCampaign(values);
    if (res.code === 0) { message.success('活动创建成功'); setCampaignModal(false); campaignForm.resetFields(); loadData(); }
  };

  const handleSend = async (id: string) => {
    const res: any = await promotionApi.sendEmailCampaign(id);
    if (res.code === 0) {
      const isSimulated = !smtpConfig;
      message.success(isSimulated
        ? `模拟发送完成: 成功 ${res.data.successCount} 封（未配置SMTP，为模拟模式）`
        : `发送完成: 成功 ${res.data.successCount} 封`);
      loadData();
    } else message.error(res.message);
  };

  const handleSaveSmtp = async (values: any) => {
    const res: any = await promotionApi.saveSmtpConfig(values);
    if (res.code === 0) { message.success('SMTP 配置保存成功'); setSmtpModal(false); loadData(); }
  };

  const loadAddresses = async () => {
    try {
      const res: any = await promotionApi.getEmailAddresses();
      if (res.code === 0) setAddresses(res.data || []);
    } catch {}
  };

  const handleAddAddress = async (values: any) => {
    const res: any = await promotionApi.createEmailAddress(values);
    if (res.code === 0) { 
      message.success('邮件地址添加成功'); 
      setAddressModal(false); 
      addressForm.resetFields(); 
      loadAddresses(); 
    }
  };

  const handleImportAddresses = async (values: any) => {
    const res: any = await promotionApi.importEmailAddresses(values);
    if (res.code === 0) { 
      message.success(`批量导入完成：成功${res.data.importedCount}条，失败${res.data.errorCount}条`); 
      setImportModal(false); 
      importForm.resetFields(); 
      loadAddresses(); 
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      const res: any = await promotionApi.deleteEmailCampaign(id);
      if (res.code === 0) { message.success('删除成功'); loadData(); }
    } catch { message.error('删除失败'); }
  };

  const campaignColumns = [
    { title: '活动名称', dataIndex: 'name', key: 'name' },
    { title: '主题', dataIndex: 'subject', key: 'subject', ellipsis: true },
    { title: '收件人数', dataIndex: 'totalCount', key: 'totalCount' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => {
      const map: Record<string, { color: string; text: string }> = {
        draft: { color: 'default', text: '草稿' }, sending: { color: 'processing', text: '发送中' },
        sent: { color: 'success', text: '已发送' }, failed: { color: 'error', text: '失败' },
      };
      const item = map[s] || { color: 'default', text: s };
      return <Badge status={item.color as any} text={item.text} />;
    }},
    { title: '成功/失败', key: 'result', render: (_: any, r: any) => <span>{r.successCount}/{r.failCount}</span> },
    { title: '操作', key: 'action', render: (_: any, record: any) => (
      <Space>
        {record.status === 'draft' && (
          <Popconfirm title={smtpConfig ? "确定发送？" : "将以模拟模式发送（不实际发送邮件）"} onConfirm={() => handleSend(record.id)}>
            <Button type="primary" size="small" icon={<SendOutlined />}>{smtpConfig ? '发送' : '模拟发送'}</Button>
          </Popconfirm>
        )}
        <Popconfirm title="确定删除此活动？" onConfirm={() => handleDeleteCampaign(record.id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      {!smtpConfig && <Alert message="当前为模拟模式" description="未配置 SMTP 服务器，邮件发送将以模拟方式执行（记录发送结果但不实际发送邮件）。配置 SMTP 后可切换为真实发送。" type="info" showIcon closable style={{ marginBottom: 16 }} action={<Button size="small" type="primary" onClick={() => setSmtpModal(true)}>配置 SMTP</Button>} />}

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="邮件模板" extra={<Button size="small" icon={<PlusOutlined />} onClick={() => setTemplateModal(true)}>新建模板</Button>}>
            <List dataSource={templates} renderItem={(t: any) => (
              <List.Item actions={[<Popconfirm title="删除？" onConfirm={() => promotionApi.deleteEmailTemplate(t.id).then(() => loadData())}><DeleteOutlined /></Popconfirm>]}>
                <List.Item.Meta title={t.name} description={t.subject} />
              </List.Item>
            )} locale={{ emptyText: '暂无模板' }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="SMTP 设置" extra={<Button size="small" icon={<MailOutlined />} onClick={() => { smtpForm.setFieldsValue(smtpConfig); setSmtpModal(true); }}>编辑</Button>}>
            {smtpConfig ? (
              <div>
                <p><Text strong>服务器:</Text> {smtpConfig.host}:{smtpConfig.port}</p>
                <p><Text strong>安全:</Text> {smtpConfig.secure ? 'SSL/TLS' : 'STARTTLS'}</p>
                <p><Text strong>账号:</Text> {smtpConfig.auth?.user}</p>
              </div>
            ) : <Text type="secondary">未配置</Text>}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="收件人列表" extra={
            <Space>
              <Button size="small" icon={<PlusOutlined />} onClick={() => setAddressModal(true)}>添加</Button>
              <Button size="small" icon={<UploadOutlined />} onClick={() => setImportModal(true)}>导入</Button>
            </Space>
          }>
            <List 
              dataSource={addresses.slice(0, 5)} 
              renderItem={(addr: any) => (
                <List.Item>
                  <List.Item.Meta 
                    title={addr.email} 
                    description={addr.name || '未命名'} 
                  />
                </List.Item>
              )} 
              locale={{ emptyText: '暂无收件人' }} 
            />
            {addresses.length > 5 && <div style={{ textAlign: 'center', marginTop: 8 }}><Text type="secondary">共 {addresses.length} 个收件人</Text></div>}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="SMTP 设置" extra={<Button size="small" icon={<MailOutlined />} onClick={() => { smtpForm.setFieldsValue(smtpConfig); setSmtpModal(true); }}>编辑</Button>}>
            {smtpConfig ? (
              <div>
                <p><Text strong>服务器:</Text> {smtpConfig.host}:{smtpConfig.port}</p>
                <p><Text strong>安全:</Text> {smtpConfig.secure ? 'SSL/TLS' : 'STARTTLS'}</p>
                <p><Text strong>账号:</Text> {smtpConfig.auth?.user}</p>
              </div>
            ) : <Text type="secondary">未配置</Text>}
          </Card>
        </Col>
      </Row>

      <Card title="邮件活动" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setCampaignModal(true)}>创建活动</Button>}>
        <Table dataSource={campaigns} columns={campaignColumns} rowKey="id" pagination={{ pageSize: 5 }} />
      </Card>

      {/* 邮件地址添加弹窗 */}
      <Modal title="添加邮件地址" open={addressModal} onCancel={() => { setAddressModal(false); addressForm.resetFields(); }} onOk={() => addressForm.submit()}>
        <Form form={addressForm} onFinish={handleAddAddress} layout="vertical">
          <Form.Item name="email" label="邮箱地址" rules={[{ required: true, type: 'email', message: '请输入有效的邮箱地址' }]}><Input placeholder="example@domain.com" /></Form.Item>
          <Form.Item name="name" label="联系人姓名"><Input placeholder="张三" /></Form.Item>
          <Form.Item name="group" label="分组"><Input placeholder="默认为 'default'" /></Form.Item>
        </Form>
      </Modal>

      {/* 邮件地址导入弹窗 */}
      <Modal title="批量导入邮件地址" open={importModal} onCancel={() => { setImportModal(false); importForm.resetFields(); }} onOk={() => importForm.submit()} width={600}>
        <Alert message="CSV格式说明" description="CSV文件应包含邮箱地址，支持两列格式：邮箱,姓名 或 单列仅邮箱。每行一个邮箱地址。" type="info" showIcon style={{ marginBottom: 16 }} />
        <Form form={importForm} onFinish={handleImportAddresses} layout="vertical">
          <Form.Item name="csvData" label="CSV数据" rules={[{ required: true, message: '请粘贴CSV数据' }]}>
            <Input.TextArea rows={8} placeholder={"user1@example.com,张三\nuser2@example.com,李四\nuser3@example.com"} />
          </Form.Item>
          <Form.Item name="group" label="分组" extra="导入的邮件地址将归入指定分组">
            <Input placeholder="如: VIP客户, 普通用户 (默认为 'default')" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 模板弹窗 */}
      <Modal title="新建邮件模板" open={templateModal} onCancel={() => setTemplateModal(false)} onOk={() => templateForm.submit()}>
        <Form form={templateForm} onFinish={handleCreateTemplate} layout="vertical">
          <Form.Item name="name" label="模板名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="subject" label="邮件主题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="content" label="邮件内容 (HTML)" rules={[{ required: true }]} extra="支持个性化变量：{{姓名}} 或 {{name}} 将被替换为收件人姓名">
            <Input.TextArea rows={8} placeholder="<h1>亲爱的 {{姓名}}</h1><p>这是一封个性化的邮件...</p>" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 活动弹窗 */}
      <Modal title="创建邮件活动" open={campaignModal} onCancel={() => setCampaignModal(false)} onOk={() => campaignForm.submit()}>
        <Form form={campaignForm} onFinish={handleCreateCampaign} layout="vertical">
          <Form.Item name="name" label="活动名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="subject" label="邮件主题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="recipients" label="收件人" rules={[{ required: true }]} extra="多个邮箱用逗号分隔，支持带名称格式：张三 <zhangsan@example.com>">
            <Input.TextArea rows={3} placeholder="zhangsan@example.com,lisi@example.com 或 张三 <zhangsan@example.com>,李四 <lisi@example.com>" />
          </Form.Item>
          <Form.Item name="content" label="邮件内容 (HTML)" rules={[{ required: true }]} extra="支持个性化变量：{{姓名}} 或 {{name}} 将被替换为收件人姓名">
            <Input.TextArea rows={6} placeholder="<h1>亲爱的 {{姓名}}</h1><p>这是一封个性化的邮件...</p>" />
          </Form.Item>
        </Form>
      </Modal>

      {/* SMTP 弹窗 */}
      <Modal title="SMTP 邮箱服务器配置" open={smtpModal} onCancel={() => setSmtpModal(false)} onOk={() => smtpForm.submit()}>
        <Form form={smtpForm} onFinish={handleSaveSmtp} layout="vertical">
          <Form.Item name="host" label="SMTP 服务器" rules={[{ required: true }]}><Input placeholder="smtp.qq.com" /></Form.Item>
          <Form.Item name="port" label="端口" initialValue={465}><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="secure" label="加密方式" initialValue={true}>
            <Select><Select.Option value={true}>SSL/TLS</Select.Option><Select.Option value={false}>STARTTLS</Select.Option></Select>
          </Form.Item>
          <Divider>认证信息</Divider>
          <Form.Item name={['auth', 'user']} label="用户名/邮箱" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name={['auth', 'pass']} label="密码/授权码" rules={[{ required: true }]}><Input.Password /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ============================================
// SEO 工具（完整版）
// ============================================
function SeoTools() {
  const [analysis, setAnalysis] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState<string | null>(null);
  const [previewSite, setPreviewSite] = useState<any>(null);
  const [structuredData, setStructuredData] = useState<any[]>([]);
  const [robotsTxt, setRobotsTxt] = useState('');
  const [sitemapXml, setSitemapXml] = useState('');
  const [showSitemap, setShowSitemap] = useState(false);
  const [showRobots, setShowRobots] = useState(false);
  const [showJsonLd, setShowJsonLd] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);
  const [editSite, setEditSite] = useState<any>(null);
  const [editForm] = Form.useForm();

  useEffect(() => { loadAnalysis(); }, []);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const res: any = await promotionApi.getSeoAnalysis();
      if (res.code === 0) setAnalysis(res.data || []);
    } catch {}
    setLoading(false);
  };

  const getScoreColor = (score: number) => score >= 80 ? '#52c41a' : score >= 50 ? '#faad14' : '#ff4d4f';
  const getScoreLabel = (score: number) => score >= 80 ? '优秀' : score >= 60 ? '良好' : score >= 40 ? '一般' : '较差';

  const handleAutoFix = async (siteId: string) => {
    setFixing(siteId);
    try {
      const res: any = await promotionApi.autoFixSeo(siteId);
      if (res.code === 0) {
        setFixResult(res.data);
        await loadAnalysis();
      } else {
        message.error(res.message);
      }
    } catch { message.error('修复失败'); }
    setFixing(null);
  };

  const handleEditSite = (site: any) => {
    editForm.setFieldsValue({
      name: site.siteName,
      domain: site.domain,
      seoTitle: site.seoTitle,
      seoDesc: site.seoDesc,
      seoKeywords: site.seoKeywords,
    });
    setEditSite(site);
  };

  const handleSaveSite = async (values: any) => {
    try {
      const res: any = await cmsApi.updateSite(editSite.siteId, values);
      if (res.code === 0) {
        message.success('站点信息已更新');
        setEditSite(null);
        editForm.resetFields();
        await loadAnalysis();
      } else message.error(res.message);
    } catch { message.error('保存失败'); }
  };

  const handleDeleteSite = async (siteId: string) => {
    try {
      const res: any = await cmsApi.deleteSite(siteId);
      if (res.code === 0) {
        message.success('站点已删除');
        await loadAnalysis();
      } else message.error(res.message);
    } catch { message.error('删除失败'); }
  };

  const handleDownloadSitemap = async () => {
    try {
      const res: any = await promotionApi.getSitemapData();
      if (res.code === 0) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        for (const site of res.data.sites) {
          if (site.domain) {
            xml += `  <url><loc>${site.domain}</loc><priority>1.0</priority></url>\n`;
            for (const page of site.pages) {
              xml += `  <url><loc>${site.domain}/${page.slug}</loc><lastmod>${page.updatedAt.split('T')[0]}</lastmod><priority>0.8</priority></url>\n`;
            }
          }
        }
        xml += '</urlset>';
        setSitemapXml(xml);
        setShowSitemap(true);
      }
    } catch { message.error('获取失败'); }
  };

  const handleDownloadRobots = async () => {
    try {
      const res = await promotionApi.getRobotsTxt();
      setRobotsTxt(typeof res === 'string' ? res : JSON.stringify(res));
      setShowRobots(true);
    } catch { message.error('获取失败'); }
  };

  const handleStructuredData = async (siteId?: string) => {
    try {
      const res: any = await promotionApi.getStructuredData(siteId);
      if (res.code === 0) { setStructuredData(res.data); setShowJsonLd(true); }
    } catch { message.error('获取失败'); }
  };

  const handleExportReport = async () => {
    try {
      const res: any = await promotionApi.exportSeoReport();
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seo-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('SEO 报告已导出');
    } catch { message.error('导出失败'); }
  };

  const downloadText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* 顶部操作栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Space>
          <Button icon={<SearchOutlined />} onClick={loadAnalysis} loading={loading}>重新分析</Button>
          <Button icon={<BarChartOutlined />} onClick={handleExportReport}>导出报告</Button>
        </Space>
        <Space>
          <Button onClick={handleDownloadSitemap}>Sitemap.xml</Button>
          <Button onClick={handleDownloadRobots}>robots.txt</Button>
          <Button onClick={() => handleStructuredData()}>结构化数据</Button>
        </Space>
      </div>

      {/* 站点分析卡片 */}
      <Row gutter={[16, 16]}>
        {analysis.map((site: any) => (
          <Col key={site.siteId} xs={24}>
            <Card>
              {/* 头部：站点信息 + 评分 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <Title level={5} style={{ margin: 0 }}>{site.siteName}</Title>
                  <Space style={{ marginTop: 4 }}>
                    {site.domain ? <Tag color="green">{site.domain}</Tag> : <Tag color="red">未绑定域名</Tag>}
                    <Text type="secondary">{site.pageCount} 个页面 / {site.publishedPageCount} 个已发布</Text>
                  </Space>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 42, fontWeight: 'bold', color: getScoreColor(site.score), lineHeight: 1 }}>{site.score}</div>
                  <Text type="secondary" style={{ fontSize: 13 }}>{getScoreLabel(site.score)}</Text>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Button size="small" type="primary" loading={fixing === site.siteId} onClick={() => handleAutoFix(site.siteId)}>
                      一键修复
                    </Button>
                    <Button size="small" onClick={() => setPreviewSite(site)}>搜索预览</Button>
                    <Button size="small" icon={<EditOutlined />} onClick={() => handleEditSite(site)}>编辑</Button>
                    <Popconfirm title="确定删除此站点？删除后不可恢复" onConfirm={() => handleDeleteSite(site.siteId)}>
                      <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
                    </Popconfirm>
                  </div>
                </div>
              </div>

              {/* 检查项详情 */}
              <Table
                size="small"
                pagination={false}
                dataSource={site.checks}
                rowKey="issue"
                columns={[
                  { title: '分类', dataIndex: 'category', key: 'category', width: 80, render: (v: string) => <Tag>{v}</Tag> },
                  { title: '状态', key: 'status', width: 80, render: (_: any, r: any) => r.passed ? <Tag color="success">通过</Tag> : <Tag color="error">未通过</Tag> },
                  { title: '检查项', dataIndex: 'issue', key: 'issue' },
                  { title: '修复建议', dataIndex: 'fix', key: 'fix', width: 280, render: (v: string, r: any) => {
                    if (r.passed && v.startsWith('当前值: ')) {
                      return <Text style={{ color: '#52c41a', fontSize: 13 }}>{v}</Text>;
                    }
                    return r.passed ? '-' : <Text type="warning">{v}</Text>;
                  }},
                  { title: '影响', dataIndex: 'impact', key: 'impact', width: 80, render: (v: string) => {
                    const colors: Record<string, string> = { high: 'red', medium: 'orange', low: 'blue' };
                    const labels: Record<string, string> = { high: '高', medium: '中', low: '低' };
                    return <Tag color={colors[v]}>{labels[v]}</Tag>;
                  }},
                ]}
              />
            </Card>
          </Col>
        ))}
        {analysis.length === 0 && !loading && <Col span={24}><Alert message="暂无站点数据，请先创建站点" type="info" showIcon /></Col>}
      </Row>

      {/* 搜索结果预览弹窗 */}
      <Modal title="Google 搜索结果预览" open={!!previewSite} onCancel={() => setPreviewSite(null)} footer={null} width={600}>
        {previewSite && (
          <div>
            <Alert message="以下是您的网站在 Google 搜索结果中的显示效果预览" type="info" showIcon style={{ marginBottom: 16 }} />
            {previewSite.pages.filter((p: any) => p.status === 'published').map((page: any) => (
              <div key={page.id} style={{ marginBottom: 20, padding: 16, border: '1px solid #e8e8e8', borderRadius: 8 }}>
                <div style={{ fontSize: 13, color: '#202124', marginBottom: 4 }}>
                  {previewSite.domain || 'example.com'} › {page.slug}
                </div>
                <div style={{ fontSize: 20, color: '#1a0dab', marginBottom: 4, cursor: 'pointer', lineHeight: 1.3 }}>
                  {page.seoTitle || page.title}
                </div>
                <div style={{ fontSize: 14, color: '#4d5156', lineHeight: 1.58 }}>
                  {page.seoDesc || '该页面暂无 SEO 描述，建议在站点管理中设置。'}
                </div>
              </div>
            ))}
            {previewSite.pages.filter((p: any) => p.status === 'published').length === 0 && (
              <Alert message="该站点没有已发布的页面" type="warning" showIcon />
            )}
          </div>
        )}
      </Modal>

      {/* Sitemap 预览 */}
      <Modal title="Sitemap.xml" open={showSitemap} onCancel={() => setShowSitemap(false)} footer={<Button onClick={() => downloadText(sitemapXml, 'sitemap.xml')}>下载文件</Button>} width={700}>
        <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, maxHeight: 400, overflow: 'auto', fontSize: 13 }}>{sitemapXml}</pre>
        <Alert message="将 sitemap.xml 放到网站根目录，然后在 Google Search Console 中提交" type="info" showIcon style={{ marginTop: 12 }} />
      </Modal>

      {/* robots.txt 预览 */}
      <Modal title="robots.txt" open={showRobots} onCancel={() => setShowRobots(false)} footer={<Button onClick={() => downloadText(robotsTxt, 'robots.txt')}>下载文件</Button>} width={500}>
        <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, fontSize: 13 }}>{robotsTxt}</pre>
        <Alert message="将 robots.txt 放到网站根目录" type="info" showIcon style={{ marginTop: 12 }} />
      </Modal>

      {/* 修复结果弹窗 */}
      <Modal title="一键修复结果" open={!!fixResult} onCancel={() => setFixResult(null)} footer={<Button type="primary" onClick={() => setFixResult(null)}>知道了</Button>} width={500}>
        {fixResult && (
          <div>
            {fixResult.fixed > 0 ? (
              <Alert type="success" showIcon message={`成功修复 ${fixResult.fixed} 项 SEO 问题`} style={{ marginBottom: 16 }} />
            ) : (
              <Alert type="info" showIcon message="所有可自动修复的问题已处理完毕" style={{ marginBottom: 16 }} />
            )}
            {fixResult.details && fixResult.details.length > 0 && (
              <div>
                <Text strong>已修复项目：</Text>
                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                  {fixResult.details.map((d: string, i: number) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            )}
            <Alert type="warning" showIcon message="剩余问题（页面数量较少）需要手动创建更多页面来解决" style={{ marginTop: 16 }} />
          </div>
        )}
      </Modal>

      {/* 结构化数据预览 */}
      <Modal title="结构化数据 (JSON-LD)" open={showJsonLd} onCancel={() => setShowJsonLd(false)} footer={<Button onClick={() => downloadText(JSON.stringify(structuredData, null, 2), 'structured-data.json')}>下载文件</Button>} width={700}>
        <Alert message="将以下 JSON-LD 代码添加到网页的 &lt;head&gt; 标签中，可提升搜索结果的展示效果（富摘要）" type="info" showIcon style={{ marginBottom: 12 }} />
        <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, maxHeight: 400, overflow: 'auto', fontSize: 13 }}>{JSON.stringify(structuredData, null, 2)}</pre>
      </Modal>

      {/* 编辑站点 SEO 信息 */}
      <Modal title="编辑站点 SEO 信息" open={!!editSite} onCancel={() => { setEditSite(null); editForm.resetFields(); }} onOk={() => editForm.submit()} width={600}>
        <Form form={editForm} onFinish={handleSaveSite} layout="vertical">
          <Form.Item name="name" label="站点名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="domain" label="域名" extra="如 https://example.com"><Input placeholder="https://example.com" /></Form.Item>
          <Divider style={{ margin: '12px 0' }}>SEO 设置</Divider>
          <Form.Item name="seoTitle" label="SEO 标题" extra="建议 30-60 字符"><Input.TextArea rows={2} placeholder="页面标题，显示在搜索结果中" /></Form.Item>
          <Form.Item name="seoDesc" label="SEO 描述" extra="建议 120-160 字符"><Input.TextArea rows={3} placeholder="页面描述，显示在搜索结果标题下方" /></Form.Item>
          <Form.Item name="seoKeywords" label="SEO 关键词" extra="多个关键词用逗号分隔"><Input placeholder="关键词1,关键词2,关键词3" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
