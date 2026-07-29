import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Card, Button, Typography, Space, Modal, Form, Input, Select, InputNumber, message, Divider, Tag, Popconfirm, List, Empty, Upload, Alert } from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, SaveOutlined,
  FontSizeOutlined, PictureOutlined, StopOutlined, MinusOutlined,
  DragOutlined, CopyOutlined, ArrowUpOutlined, ArrowDownOutlined,
  FolderOutlined, FileOutlined, ReloadOutlined, UploadOutlined, LinkOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { Title, Text } = Typography;
const { Sider, Content } = Layout;

const API_BASE = `${API_BASE_URL}/api/v1/cms`;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

// 组件类型定义
interface PageComponent {
  id: string;
  type: string;
  props: Record<string, any>;
}

// 组件库
const componentLibrary = [
  { type: 'heading', label: '标题', icon: <FontSizeOutlined />, defaultProps: { content: '请输入标题', level: 2, align: 'left', color: '#1a1a2e' } },
  { type: 'text', label: '文本段落', icon: <FontSizeOutlined />, defaultProps: { content: '请输入文本内容...', fontSize: 14, color: '#333', align: 'left' } },
  { type: 'image', label: '图片', icon: <PictureOutlined />, defaultProps: { url: '', alt: '图片', width: '100%', height: 'auto', borderRadius: 8 } },
  { type: 'button', label: '按钮', icon: <StopOutlined />, defaultProps: { text: '点击按钮', url: '#', color: '#1677ff', size: 'middle' } },
  { type: 'divider', label: '分割线', icon: <MinusOutlined />, defaultProps: { text: '', color: '#e8e8e8' } },
  { type: 'spacer', label: '间距', icon: <DragOutlined />, defaultProps: { height: 40 } },
  { type: 'video', label: '视频', icon: <PictureOutlined />, defaultProps: { url: '', width: '100%', height: 400 } },
  { type: 'form', label: '表单', icon: <EditOutlined />, defaultProps: { title: '联系我们', fields: '姓名,手机,留言', submitText: '提交' } },
];

// 组件渲染
function RenderComponent({ comp, selected, onClick }: { comp: PageComponent; selected: boolean; onClick: () => void }) {
  const { type, props } = comp;
  const borderStyle = selected ? '2px solid #1677ff' : '2px solid transparent';

  const wrapperStyle: React.CSSProperties = {
    border: borderStyle,
    borderRadius: 4,
    padding: 8,
    margin: 4,
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s',
  };

  switch (type) {
    case 'heading': {
      const style = { textAlign: props.align as any, color: props.color, margin: 0 };
      const content = props.content;
      switch (props.level) {
        case 1: return <div style={wrapperStyle} onClick={onClick}><h1 style={style}>{content}</h1></div>;
        case 3: return <div style={wrapperStyle} onClick={onClick}><h3 style={style}>{content}</h3></div>;
        case 4: return <div style={wrapperStyle} onClick={onClick}><h4 style={style}>{content}</h4></div>;
        default: return <div style={wrapperStyle} onClick={onClick}><h2 style={style}>{content}</h2></div>;
      }
    }
    case 'text':
      return (
        <div style={wrapperStyle} onClick={onClick}>
          <p style={{ fontSize: props.fontSize, color: props.color, textAlign: props.align, margin: 0 }}>{props.content}</p>
        </div>
      );
    case 'image':
      return (
        <div style={wrapperStyle} onClick={onClick}>
          {props.url ? (
            <img src={props.url} alt={props.alt} style={{ width: props.width, height: props.height, borderRadius: props.borderRadius, display: 'block' }} />
          ) : (
            <div style={{ width: props.width, height: 200, background: '#f5f5f5', borderRadius: props.borderRadius, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              <PictureOutlined style={{ fontSize: 32, marginRight: 8 }} /> 点击设置图片URL
            </div>
          )}
        </div>
      );
    case 'button':
      return (
        <div style={{ ...wrapperStyle, textAlign: 'center' }} onClick={onClick}>
          <Button type="primary" size={props.size as any} style={{ background: props.color, borderColor: props.color }}>{props.text}</Button>
        </div>
      );
    case 'divider':
      return (
        <div style={wrapperStyle} onClick={onClick}>
          <Divider>{props.text || undefined}</Divider>
        </div>
      );
    case 'spacer':
      return (
        <div style={{ ...wrapperStyle, background: selected ? '#e6f4ff' : '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClick}>
          <Tag>间距 {props.height}px</Tag>
        </div>
      );
    case 'video':
      return (
        <div style={wrapperStyle} onClick={onClick}>
          {props.url ? (
            <video src={props.url} style={{ width: props.width, height: props.height }} controls />
          ) : (
            <div style={{ width: props.width, height: props.height, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', borderRadius: 8 }}>
              <PictureOutlined style={{ fontSize: 32, marginRight: 8 }} /> 点击设置视频URL
            </div>
          )}
        </div>
      );
    case 'form':
      return (
        <div style={wrapperStyle} onClick={onClick}>
          <Card size="small" title={props.title}>
            {(props.fields || '').split(',').map((f: string, i: number) => (
              <div key={i} style={{ marginBottom: 8 }}><Text type="secondary">{f.trim()}</Text><Input disabled style={{ marginTop: 4 }} /></div>
            ))}
            <Button type="primary" block>{props.submitText}</Button>
          </Card>
        </div>
      );
    default:
      return <div style={wrapperStyle} onClick={onClick}>未知组件</div>;
  }
}

// 属性编辑面板
function PropertyPanel({ comp, onChange }: { comp: PageComponent | null; onChange: (props: Record<string, any>) => void }) {
  if (!comp) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>
        <EditOutlined style={{ fontSize: 32, marginBottom: 12 }} />
        <div>选择组件以编辑属性</div>
      </div>
    );
  }

  const libItem = componentLibrary.find(c => c.type === comp.type);
  const handleChange = (key: string, value: any) => {
    onChange({ ...comp.props, [key]: value });
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <Tag color="blue">{libItem?.label || comp.type}</Tag>
        <Text type="secondary" style={{ fontSize: 12 }}>ID: {comp.id.slice(0, 8)}</Text>
      </div>
      <Divider style={{ margin: '12px 0' }} />

      {comp.type === 'heading' && (
        <>
          <div style={{ marginBottom: 12 }}><Text strong>标题内容</Text><Input value={comp.props.content} onChange={e => handleChange('content', e.target.value)} style={{ marginTop: 4 }} /></div>
          <div style={{ marginBottom: 12 }}><Text strong>标题级别</Text><Select value={comp.props.level} onChange={v => handleChange('level', v)} style={{ width: '100%', marginTop: 4 }}><Select.Option value={1}>H1</Select.Option><Select.Option value={2}>H2</Select.Option><Select.Option value={3}>H3</Select.Option><Select.Option value={4}>H4</Select.Option></Select></div>
          <div style={{ marginBottom: 12 }}><Text strong>对齐方式</Text><Select value={comp.props.align} onChange={v => handleChange('align', v)} style={{ width: '100%', marginTop: 4 }}><Select.Option value="left">左对齐</Select.Option><Select.Option value="center">居中</Select.Option><Select.Option value="right">右对齐</Select.Option></Select></div>
          <div style={{ marginBottom: 12 }}><Text strong>文字颜色</Text><Input type="color" value={comp.props.color} onChange={e => handleChange('color', e.target.value)} style={{ width: '100%', marginTop: 4, height: 36 }} /></div>
        </>
      )}

      {comp.type === 'text' && (
        <>
          <div style={{ marginBottom: 12 }}><Text strong>文本内容</Text><Input.TextArea value={comp.props.content} onChange={e => handleChange('content', e.target.value)} rows={4} style={{ marginTop: 4 }} /></div>
          <div style={{ marginBottom: 12 }}><Text strong>字体大小</Text><InputNumber value={comp.props.fontSize} onChange={v => handleChange('fontSize', v)} min={12} max={72} style={{ width: '100%', marginTop: 4 }} /></div>
          <div style={{ marginBottom: 12 }}><Text strong>对齐方式</Text><Select value={comp.props.align} onChange={v => handleChange('align', v)} style={{ width: '100%', marginTop: 4 }}><Select.Option value="left">左对齐</Select.Option><Select.Option value="center">居中</Select.Option><Select.Option value="right">右对齐</Select.Option></Select></div>
        </>
      )}

      {comp.type === 'image' && (
        <>
          <div style={{ marginBottom: 12 }}>
            <Text strong>图片URL</Text>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <Input value={comp.props.url} onChange={e => handleChange('url', e.target.value)} placeholder="输入图片地址或上传" style={{ flex: 1 }} />
              <Upload
                action={`${API_BASE_URL}/api/v1/upload`}
                headers={getAuthHeaders()}
                showUploadList={false}
                accept="image/*"
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith('image/');
                  if (!isImage) { message.error('只能上传图片文件!'); return false; }
                  const isLt10M = file.size / 1024 / 1024 < 10;
                  if (!isLt10M) { message.error('图片大小不能超过 10MB!'); return false; }
                  return true;
                }}
                onChange={(info) => {
                  if (info.file.status === 'uploading') { message.loading('上传中...', 0); }
                  if (info.file.status === 'done') {
                    message.destroy();
                    if (info.file.response?.code === 0) {
                      handleChange('url', info.file.response.data.url);
                      message.success('图片上传成功');
                    } else { message.error(info.file.response?.message || '上传失败'); }
                  } else if (info.file.status === 'error') { message.destroy(); message.error('上传失败'); }
                }}
              >
                <Button icon={<UploadOutlined />} type="primary">上传</Button>
              </Upload>
            </div>
          </div>
          {comp.props.url && (
            <div style={{ marginBottom: 12 }}>
              <img src={comp.props.url} alt="预览" style={{ width: '100%', maxHeight: 150, objectFit: 'contain', borderRadius: 4, border: '1px solid #f0f0f0', background: '#fafafa' }} />
            </div>
          )}
          <div style={{ marginBottom: 12 }}><Text strong>替代文字</Text><Input value={comp.props.alt} onChange={e => handleChange('alt', e.target.value)} style={{ marginTop: 4 }} /></div>
          <div style={{ marginBottom: 12 }}><Text strong>圆角</Text><InputNumber value={comp.props.borderRadius} onChange={v => handleChange('borderRadius', v)} min={0} max={50} style={{ width: '100%', marginTop: 4 }} /></div>
        </>
      )}

      {comp.type === 'button' && (
        <>
          <div style={{ marginBottom: 12 }}><Text strong>按钮文字</Text><Input value={comp.props.text} onChange={e => handleChange('text', e.target.value)} style={{ marginTop: 4 }} /></div>
          <div style={{ marginBottom: 12 }}><Text strong>链接地址</Text><Input value={comp.props.url} onChange={e => handleChange('url', e.target.value)} placeholder="#" style={{ marginTop: 4 }} /></div>
          <div style={{ marginBottom: 12 }}><Text strong>按钮颜色</Text><Input type="color" value={comp.props.color} onChange={e => handleChange('color', e.target.value)} style={{ width: '100%', marginTop: 4, height: 36 }} /></div>
          <div style={{ marginBottom: 12 }}><Text strong>按钮大小</Text><Select value={comp.props.size} onChange={v => handleChange('size', v)} style={{ width: '100%', marginTop: 4 }}><Select.Option value="small">小</Select.Option><Select.Option value="middle">中</Select.Option><Select.Option value="large">大</Select.Option></Select></div>
        </>
      )}

      {comp.type === 'divider' && (
        <div style={{ marginBottom: 12 }}><Text strong>分割线文字</Text><Input value={comp.props.text} onChange={e => handleChange('text', e.target.value)} placeholder="可选" style={{ marginTop: 4 }} /></div>
      )}

      {comp.type === 'spacer' && (
        <div style={{ marginBottom: 12 }}><Text strong>间距高度 (px)</Text><InputNumber value={comp.props.height} onChange={v => handleChange('height', v)} min={10} max={200} style={{ width: '100%', marginTop: 4 }} /></div>
      )}

      {comp.type === 'video' && (
        <>
          <div style={{ marginBottom: 12 }}><Text strong>视频URL</Text><Input value={comp.props.url} onChange={e => handleChange('url', e.target.value)} placeholder="输入视频地址" style={{ marginTop: 4 }} /></div>
          <div style={{ marginBottom: 12 }}><Text strong>高度 (px)</Text><InputNumber value={comp.props.height} onChange={v => handleChange('height', v)} min={200} max={800} style={{ width: '100%', marginTop: 4 }} /></div>
        </>
      )}

      {comp.type === 'form' && (
        <>
          <div style={{ marginBottom: 12 }}><Text strong>表单标题</Text><Input value={comp.props.title} onChange={e => handleChange('title', e.target.value)} style={{ marginTop: 4 }} /></div>
          <div style={{ marginBottom: 12 }}><Text strong>字段 (逗号分隔)</Text><Input value={comp.props.fields} onChange={e => handleChange('fields', e.target.value)} style={{ marginTop: 4 }} /></div>
          <div style={{ marginBottom: 12 }}><Text strong>提交按钮文字</Text><Input value={comp.props.submitText} onChange={e => handleChange('submitText', e.target.value)} style={{ marginTop: 4 }} /></div>
        </>
      )}
    </div>
  );
}

export default function PageBuilder() {
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [pages, setPages] = useState<any[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [components, setComponents] = useState<PageComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [saveModal, setSaveModal] = useState(false);
  const [pageListVisible, setPageListVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveForm] = Form.useForm();
  const [pageUrl, setPageUrl] = useState<string>('');
  const [createSiteModal, setCreateSiteModal] = useState(false);
  const [createSiteForm] = Form.useForm();
  const [sitesLoaded, setSitesLoaded] = useState(false);

  const selectedComp = components.find(c => c.id === selectedId) || null;

  // 加载站点列表
  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const res = await axios.get(`${API_BASE}/sites`, { headers: getAuthHeaders(), params: { pageSize: 100 } });
      if (res.data.code === 0) {
        const list = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.list || []);
        setSites(list);
        if (list.length > 0 && !selectedSiteId) {
          setSelectedSiteId(list[0].id);
        }
      }
    } catch (err) {
      console.error('加载站点失败:', err);
    } finally {
      setSitesLoaded(true);
    }
  };

  // 快速创建站点
  const handleCreateSite = async (values: any) => {
    try {
      const res = await axios.post(`${API_BASE}/sites`, {
        name: values.name,
        type: values.type || 'pc',
        domain: values.domain || '',
      }, { headers: getAuthHeaders() });
      if (res.data.code === 0) {
        message.success('站点创建成功');
        setCreateSiteModal(false);
        createSiteForm.resetFields();
        loadSites();
      } else {
        message.error(res.data.message || '创建失败');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '创建失败');
    }
  };

  // 加载页面列表
  const loadPages = useCallback(async (siteId: string) => {
    if (!siteId) return;
    try {
      const res = await axios.get(`${API_BASE}/sites/${siteId}/pages`, { headers: getAuthHeaders() });
      if (res.data.code === 0 && res.data.data) {
        setPages(res.data.data);
      }
    } catch (err) {
      console.error('加载页面失败:', err);
    }
  }, []);

  useEffect(() => {
    if (selectedSiteId) loadPages(selectedSiteId);
  }, [selectedSiteId, loadPages]);

  // 加载页面内容
  const loadPageContent = async (page: any) => {
    try {
      const content = typeof page.content === 'string' ? JSON.parse(page.content) : page.content;
      if (Array.isArray(content)) {
        setComponents(content);
      } else {
        setComponents([]);
      }
      setCurrentPageId(page.id);
      setSelectedId(null);
      message.success(`已加载页面: ${page.title}`);
    } catch {
      setComponents([]);
      setCurrentPageId(page.id);
      message.info('该页面内容为空');
    }
  };

  // 新建空白页面
  const newPage = () => {
    setComponents([]);
    setCurrentPageId(null);
    setSelectedId(null);
    message.info('已创建空白页面，编辑后点击保存');
  };

  // 删除页面
  const deletePage = async (pageId: string) => {
    try {
      const res = await axios.delete(`${API_BASE}/pages/${pageId}`, { headers: getAuthHeaders() });
      if (res.data.code === 0) {
        message.success('页面删除成功');
        if (currentPageId === pageId) {
          setComponents([]);
          setCurrentPageId(null);
        }
        loadPages(selectedSiteId);
      }
    } catch {
      message.error('删除失败');
    }
  };

  const addComponent = (type: string) => {
    const libItem = componentLibrary.find(c => c.type === type);
    if (!libItem) return;
    const newComp: PageComponent = {
      id: `comp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      props: { ...libItem.defaultProps },
    };
    setComponents([...components, newComp]);
    setSelectedId(newComp.id);
  };

  const updateComponent = (id: string, props: Record<string, any>) => {
    setComponents(components.map(c => c.id === id ? { ...c, props } : c));
  };

  const deleteComponent = (id: string) => {
    setComponents(components.filter(c => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const moveComponent = (id: string, direction: 'up' | 'down') => {
    const index = components.findIndex(c => c.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === components.length - 1) return;
    const newComponents = [...components];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newComponents[index], newComponents[swapIndex]] = [newComponents[swapIndex], newComponents[index]];
    setComponents(newComponents);
  };

  const duplicateComponent = (id: string) => {
    const comp = components.find(c => c.id === id);
    if (!comp) return;
    const newComp: PageComponent = {
      id: `comp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: comp.type,
      props: { ...comp.props },
    };
    const index = components.findIndex(c => c.id === id);
    const newComponents = [...components];
    newComponents.splice(index + 1, 0, newComp);
    setComponents(newComponents);
    setSelectedId(newComp.id);
  };

  // 保存页面
  const handleSave = async (values: any) => {
    if (!selectedSiteId) {
      message.error('请先选择站点');
      return;
    }
    setLoading(true);
    try {
      const pageData = {
        title: values.title,
        slug: values.slug || values.title.toLowerCase().replace(/\s+/g, '-'),
        content: JSON.stringify(components),
        seoTitle: values.seoTitle,
        seoDesc: values.seoDesc,
      };
      let res;
      if (currentPageId) {
        res = await axios.put(`${API_BASE}/pages/${currentPageId}`, pageData, { headers: getAuthHeaders() });
      } else {
        res = await axios.post(`${API_BASE}/sites/${selectedSiteId}/pages`, pageData, { headers: getAuthHeaders() });
      }
      if (res.data.code === 0) {
        message.success(currentPageId ? '页面更新成功' : '页面创建成功');
        if (res.data.data?.id) setCurrentPageId(res.data.data.id);
        const slug = values.slug || values.title.toLowerCase().replace(/\s+/g, '-');
        const url = `/p/${slug}`;
        setPageUrl(url);
        setSaveModal(false);
        loadPages(selectedSiteId);
      } else {
        message.error(res.data.message || '保存失败');
      }
    } catch (error: any) {
      console.error('保存失败:', error);
      message.error(error.response?.data?.message || '保存失败，请检查网络');
    } finally {
      setLoading(false);
    }
  };

  // 打开保存弹窗
  const openSaveModal = () => {
    const currentPage = pages.find(p => p.id === currentPageId);
    if (currentPage) {
      saveForm.setFieldsValue({
        title: currentPage.title,
        slug: currentPage.slug,
        seoTitle: currentPage.seoTitle,
        seoDesc: currentPage.seoDesc,
      });
    }
    setSaveModal(true);
  };

  // 页面管理面板
  const PageListPanel = () => (
    <Modal
      title="页面管理"
      open={pageListVisible}
      onCancel={() => setPageListVisible(false)}
      footer={null}
      width={560}
    >
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Select value={selectedSiteId} onChange={v => { setSelectedSiteId(v); setCurrentPageId(null); setComponents([]); }} style={{ width: 200 }}>
            {sites.map(s => <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>)}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={() => loadPages(selectedSiteId)}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setPageListVisible(false); newPage(); }}>新建页面</Button>
        </Space>
      </div>
      {pages.length === 0 ? (
        <Empty description="暂无页面，点击新建页面开始" />
      ) : (
        <List
          dataSource={pages}
          renderItem={(page: any) => (
            <List.Item
              actions={[
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { loadPageContent(page); setPageListVisible(false); }}>编辑</Button>,
                <Popconfirm title="确定删除此页面？" onConfirm={() => deletePage(page.id)}>
                  <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                avatar={<FileOutlined style={{ fontSize: 20, color: '#1677ff' }} />}
                title={page.title}
                description={
                  <Space>
                    <Tag color="green">{page.status === 'published' ? '已发布' : '草稿'}</Tag>
                    <Text type="secondary">{new Date(page.updatedAt).toLocaleString()}</Text>
                    {page.slug && <Tag icon={<LinkOutlined />} color="blue">/p/{page.slug}</Tag>}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Modal>
  );

  // 如果没有站点，显示创建站点引导
  if (sitesLoaded && sites.length === 0) {
    return (
      <div>
        <Title level={4} style={{ marginBottom: 16 }}>页面搭建</Title>
        <Card style={{ textAlign: 'center', padding: '60px 0' }}>
          <FolderOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
          <div style={{ fontSize: 16, marginBottom: 8, color: '#666' }}>请先创建一个站点，然后才能搭建页面</div>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 24 }}>站点是页面搭建的基础，您需要至少一个站点来承载页面</div>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setCreateSiteModal(true)}>
            创建第一个站点
          </Button>
        </Card>
        <Modal title="创建站点" open={createSiteModal} onCancel={() => setCreateSiteModal(false)} onOk={() => createSiteForm.submit()} destroyOnClose okText="创建">
          <Form form={createSiteForm} onFinish={handleCreateSite} layout="vertical">
            <Form.Item name="name" label="站点名称" rules={[{ required: true, message: '请输入站点名称' }]}>
              <Input placeholder="如：企业官网" />
            </Form.Item>
            <Form.Item name="type" label="站点类型" initialValue="pc">
              <Select>
                <Select.Option value="pc">PC官网</Select.Option>
                <Select.Option value="h5">H5页面</Select.Option>
                <Select.Option value="miniapp">小程序</Select.Option>
                <Select.Option value="mall">商城</Select.Option>
                <Select.Option value="blog">博客</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="domain" label="域名（可选）">
              <Input placeholder="如：www.example.com" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }

  if (previewMode) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>预览模式</Title>
          <Button onClick={() => setPreviewMode(false)}>退出预览</Button>
        </div>
        <Card style={{ maxWidth: 800, margin: '0 auto' }}>
          {components.map(comp => (
            <RenderComponent key={comp.id} comp={comp} selected={false} onClick={() => {}} />
          ))}
          {!components.length && <div style={{ textAlign: 'center', color: '#999', padding: 60 }}>页面为空</div>}
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space>
          <Title level={4} style={{ margin: 0 }}>页面搭建</Title>
          {selectedSiteId && sites.find(s => s.id === selectedSiteId) && (
            <Tag color="blue">{sites.find(s => s.id === selectedSiteId)?.name}</Tag>
          )}
          {currentPageId && <Tag color="green">编辑中: {pages.find(p => p.id === currentPageId)?.title}</Tag>}
        </Space>
        <Space>
          <Button icon={<FolderOutlined />} onClick={() => setPageListVisible(true)}>页面管理</Button>
          <Button icon={<PlusOutlined />} onClick={newPage}>新建页面</Button>
          <Button icon={<EyeOutlined />} onClick={() => setPreviewMode(true)} disabled={!components.length}>预览</Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={openSaveModal} disabled={!components.length}>保存页面</Button>
        </Space>
      </div>

      <Layout style={{ minHeight: 600, background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
        {/* 左侧组件库 */}
        <Sider width={200} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
          <div style={{ padding: 16 }}>
            <Text strong style={{ fontSize: 14 }}>组件库</Text>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {componentLibrary.map(item => (
                <Button
                  key={item.type}
                  icon={item.icon}
                  size="small"
                  block
                  onClick={() => addComponent(item.type)}
                  style={{ height: 'auto', padding: '8px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </Sider>

        {/* 中间画布 */}
        <Content style={{ padding: 24, background: '#fafafa', minHeight: 600 }}>
          <Card style={{ maxWidth: 700, margin: '0 auto', minHeight: 500 }}>
            {components.map((comp, index) => (
              <div key={comp.id} style={{ position: 'relative' }}>
                <RenderComponent comp={comp} selected={selectedId === comp.id} onClick={() => setSelectedId(comp.id)} />
                {selectedId === comp.id && (
                  <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 4, zIndex: 10 }}>
                    <Button size="small" icon={<ArrowUpOutlined />} onClick={(e) => { e.stopPropagation(); moveComponent(comp.id, 'up'); }} disabled={index === 0} />
                    <Button size="small" icon={<ArrowDownOutlined />} onClick={(e) => { e.stopPropagation(); moveComponent(comp.id, 'down'); }} disabled={index === components.length - 1} />
                    <Button size="small" icon={<CopyOutlined />} onClick={(e) => { e.stopPropagation(); duplicateComponent(comp.id); }} />
                    <Popconfirm title="确定删除？" onConfirm={(e) => { e?.stopPropagation(); deleteComponent(comp.id); }}>
                      <Button size="small" icon={<DeleteOutlined />} danger onClick={(e) => e.stopPropagation()} />
                    </Popconfirm>
                  </div>
                )}
              </div>
            ))}
            {!components.length && (
              <div style={{ textAlign: 'center', color: '#999', padding: 80, border: '2px dashed #d9d9d9', borderRadius: 8 }}>
                <PlusOutlined style={{ fontSize: 32, marginBottom: 12 }} />
                <div style={{ fontSize: 16, marginBottom: 8 }}>从左侧选择组件添加到画布</div>
                <div style={{ fontSize: 13 }}>点击组件库中的按钮即可添加</div>
              </div>
            )}
          </Card>
        </Content>

        {/* 右侧属性面板 */}
        <Sider width={260} theme="light" style={{ borderLeft: '1px solid #f0f0f0' }}>
          <div style={{ borderBottom: '1px solid #f0f0f0', padding: '12px 16px' }}>
            <Text strong style={{ fontSize: 14 }}>属性设置</Text>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 560 }}>
            <PropertyPanel comp={selectedComp} onChange={(props) => selectedComp && updateComponent(selectedComp.id, props)} />
          </div>
        </Sider>
      </Layout>

      {/* 页面管理弹窗 */}
      <PageListPanel />

      {/* 保存弹窗 */}
      <Modal title={currentPageId ? '更新页面' : '保存新页面'} open={saveModal} onCancel={() => { setSaveModal(false); setPageUrl(''); }} onOk={() => saveForm.submit()} destroyOnClose confirmLoading={loading}>
        <Form form={saveForm} onFinish={handleSave} layout="vertical">
          <Form.Item name="title" label="页面标题" rules={[{ required: true, message: '请输入页面标题' }]}><Input placeholder="如：关于我们" /></Form.Item>
          <Form.Item name="slug" label="URL路径"><Input placeholder="自动生成（可选）" /></Form.Item>
          <Form.Item name="seoTitle" label="SEO标题"><Input placeholder="页面SEO标题" /></Form.Item>
          <Form.Item name="seoDesc" label="SEO描述"><Input.TextArea rows={2} placeholder="页面SEO描述" /></Form.Item>
        </Form>
        {pageUrl && (
          <Alert
            message="页面已保存！"
            description={
              <div>
                <div style={{ marginBottom: 8 }}>二级链接地址：</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <code style={{ background: '#f5f5f5', padding: '4px 8px', borderRadius: 4, fontSize: 13 }}>{pageUrl}</code>
                  <Button size="small" icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(`http://localhost:5173${pageUrl}`); message.success('链接已复制'); }}>复制</Button>
                  <Button size="small" type="link" icon={<EyeOutlined />} href={`http://localhost:5173${pageUrl}`} target="_blank">查看</Button>
                </div>
              </div>
            }
            type="success"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Modal>

      {/* 创建站点弹窗 */}
      <Modal title="创建站点" open={createSiteModal} onCancel={() => setCreateSiteModal(false)} onOk={() => createSiteForm.submit()} destroyOnClose okText="创建">
        <Form form={createSiteForm} onFinish={handleCreateSite} layout="vertical">
          <Form.Item name="name" label="站点名称" rules={[{ required: true, message: '请输入站点名称' }]}>
            <Input placeholder="如：企业官网" />
          </Form.Item>
          <Form.Item name="type" label="站点类型" initialValue="pc">
            <Select>
              <Select.Option value="pc">PC官网</Select.Option>
              <Select.Option value="h5">H5页面</Select.Option>
              <Select.Option value="miniapp">小程序</Select.Option>
              <Select.Option value="mall">商城</Select.Option>
              <Select.Option value="blog">博客</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="domain" label="域名（可选）">
            <Input placeholder="如：www.example.com" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
