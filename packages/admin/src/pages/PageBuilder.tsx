import React, { useState, useEffect } from 'react';
import {
  Card, Button, Space, Input, Modal, Form, message, Tag, Select,
  Upload, Empty, Tooltip, QRCode, Divider, InputNumber,
  Switch, Typography, Alert
} from 'antd';
import {
  FontSizeOutlined, PictureOutlined,
  BorderOutlined, ColumnWidthOutlined, VideoCameraOutlined,
  FormOutlined, DeleteOutlined, EditOutlined, EyeOutlined,
  UploadOutlined, PlusOutlined, LinkOutlined,
  ArrowUpOutlined, ArrowDownOutlined, SaveOutlined,
  FolderOutlined, ThunderboltOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { TextArea } = Input;
const { Text } = Typography;

const CMS_API = `${API_BASE_URL}/api/v1/cms`;
const UPLOAD_API = `${API_BASE_URL}/api/v1`;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

// ==================== Types ====================

interface PageComponent {
  id: string;
  type: 'title' | 'text' | 'image' | 'button' | 'divider' | 'spacing' | 'video' | 'form';
  props: Record<string, any>;
}

interface PageData {
  id?: string;
  title: string;
  slug: string;
  siteId: string;
  content: PageComponent[];
  status: 'draft' | 'published';
  seoTitle?: string;
  seoDesc?: string;
}

interface PromotionLink {
  id: string;
  shortCode: string;
  shortUrl: string;
  targetUrl: string;
  clickCount: number;
}

// ==================== Component Library ====================

const COMPONENT_LIBRARY = [
  { type: 'title' as const, label: '标题', icon: <FontSizeOutlined />, defaultProps: { text: '请输入标题', fontSize: 28, color: '#333', align: 'left' } },
  { type: 'text' as const, label: '文本段落', icon: <FontSizeOutlined />, defaultProps: { text: '请输入文本内容', fontSize: 16, color: '#666', lineHeight: 1.8, align: 'left' } },
  { type: 'image' as const, label: '图片', icon: <PictureOutlined />, defaultProps: { url: '', alt: '图片', borderRadius: 8, width: '100%' } },
  { type: 'button' as const, label: '按钮', icon: <BorderOutlined />, defaultProps: { text: '点击按钮', link: '', color: '#1677ff', size: 'middle' } },
  { type: 'divider' as const, label: '分割线', icon: <ColumnWidthOutlined />, defaultProps: { color: '#e8e8e8', dashed: false } },
  { type: 'spacing' as const, label: '间距', icon: <ColumnWidthOutlined />, defaultProps: { height: 24 } },
  { type: 'video' as const, label: '视频', icon: <VideoCameraOutlined />, defaultProps: { url: '', poster: '', autoplay: false } },
  { type: 'form' as const, label: '表单', icon: <FormOutlined />, defaultProps: { title: '联系我们', fields: [{ name: '姓名', type: 'text', required: true }, { name: '电话', type: 'tel', required: true }, { name: '留言', type: 'textarea', required: false }] } },
];

// ==================== Component Renderer ====================

function ComponentRenderer({ comp, selected, onClick }: { comp: PageComponent; selected: boolean; onClick: () => void }) {
  const renderComponent = () => {
    switch (comp.type) {
      case 'title':
        return <h2 style={{ fontSize: comp.props.fontSize || 28, color: comp.props.color || '#333', textAlign: comp.props.align || 'left', margin: 0 }}>{comp.props.text || '标题'}</h2>;
      case 'text':
        return <p style={{ fontSize: comp.props.fontSize || 16, color: comp.props.color || '#666', lineHeight: comp.props.lineHeight || 1.8, textAlign: comp.props.align || 'left', margin: 0, whiteSpace: 'pre-wrap' }}>{comp.props.text || '文本内容'}</p>;
      case 'image': {
        const imgUrl = comp.props.url
          ? (comp.props.url.startsWith('/') ? API_BASE_URL + comp.props.url : comp.props.url)
          : '';
        return imgUrl ? (
          <img src={imgUrl} alt={comp.props.alt || ''} style={{ width: comp.props.width || '100%', borderRadius: comp.props.borderRadius || 0, objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', minHeight: 160, background: '#f5f5f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', border: '2px dashed #d9d9d9' }}>
            <PictureOutlined style={{ fontSize: 24, marginRight: 8 }} />
            <span>点击右侧设置图片</span>
          </div>
        );
      }
      case 'button':
        return (
          <Button type="primary" size={comp.props.size || 'middle'} style={{ background: comp.props.color || '#1677ff', borderColor: comp.props.color || '#1677ff', fontSize: 16, padding: '8px 32px' }}>
            {comp.props.text || '按钮'}
          </Button>
        );
      case 'divider':
        return <Divider style={{ borderColor: comp.props.color || '#e8e8e8', borderStyle: comp.props.dashed ? 'dashed' : 'solid', margin: '16px 0' }} />;
      case 'spacing':
        return <div style={{ height: comp.props.height || 24 }} />;
      case 'video': {
        const videoUrl = comp.props.url
          ? (comp.props.url.startsWith('/') ? API_BASE_URL + comp.props.url : comp.props.url)
          : '';
        return videoUrl ? (
          <video src={videoUrl} poster={comp.props.poster} controls style={{ width: '100%', borderRadius: 8 }} />
        ) : (
          <div style={{ width: '100%', minHeight: 200, background: '#000', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <VideoCameraOutlined style={{ fontSize: 32, marginRight: 8 }} />
            <span>设置视频地址</span>
          </div>
        );
      }
      case 'form':
        return (
          <div style={{ background: '#fafafa', padding: 24, borderRadius: 8, border: '1px solid #f0f0f0' }}>
            <h3 style={{ marginBottom: 16 }}>{comp.props.title || '表单'}</h3>
            {(comp.props.fields || []).map((f: any, i: number) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#333' }}>{f.name}{f.required && <span style={{ color: 'red' }}> *</span>}</label>
                {f.type === 'textarea' ? (
                  <TextArea rows={3} placeholder={`请输入${f.name}`} disabled style={{ background: '#fff' }} />
                ) : (
                  <Input placeholder={`请输入${f.name}`} disabled style={{ background: '#fff' }} />
                )}
              </div>
            ))}
            <Button type="primary" block>提交</Button>
          </div>
        );
      default:
        return <div>未知组件</div>;
    }
  };

  return (
    <div
      onClick={onClick}
      style={{
        padding: 12,
        marginBottom: 8,
        border: selected ? '2px solid #1677ff' : '2px solid transparent',
        borderRadius: 8,
        cursor: 'pointer',
        position: 'relative',
        background: selected ? '#e6f4ff' : '#fff',
        transition: 'all 0.2s',
      }}
    >
      {renderComponent()}
    </div>
  );
}

// ==================== Property Panel ====================

function PropertyPanel({ comp, onChange }: { comp: PageComponent; onChange: (props: any) => void }) {
  const p = comp.props;

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post(`${UPLOAD_API}/upload`, formData, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.code === 0) {
        onChange({ ...comp.props, url: res.data.data.url });
        message.success('图片上传成功');
      } else {
        message.error(res.data.message || '上传失败');
      }
    } catch {
      message.error('上传失败');
    }
    return false;
  };

  const handleVideoUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post(`${UPLOAD_API}/upload/video`, formData, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.code === 0) {
        onChange({ ...comp.props, url: res.data.data.url });
        message.success('视频上传成功');
      } else {
        message.error(res.data.message || '上传失败');
      }
    } catch {
      message.error('上传失败');
    }
    return false;
  };

  const renderProperties = () => {
    switch (comp.type) {
      case 'title':
        return (
          <>
            <Form.Item label="标题文字"><Input value={p.text} onChange={e => onChange({ ...p, text: e.target.value })} /></Form.Item>
            <Form.Item label="字体大小"><InputNumber value={p.fontSize} onChange={v => onChange({ ...p, fontSize: v })} min={16} max={72} style={{ width: '100%' }} /></Form.Item>
            <Form.Item label="文字颜色"><Input type="color" value={p.color || '#333333'} onChange={e => onChange({ ...p, color: e.target.value })} style={{ width: '100%', height: 36 }} /></Form.Item>
            <Form.Item label="对齐方式">
              <Select value={p.align || 'left'} onChange={v => onChange({ ...p, align: v })} style={{ width: '100%' }}>
                <Select.Option value="left">左对齐</Select.Option>
                <Select.Option value="center">居中</Select.Option>
                <Select.Option value="right">右对齐</Select.Option>
              </Select>
            </Form.Item>
          </>
        );
      case 'text':
        return (
          <>
            <Form.Item label="文本内容"><TextArea value={p.text} onChange={e => onChange({ ...p, text: e.target.value })} rows={4} /></Form.Item>
            <Form.Item label="字体大小"><InputNumber value={p.fontSize} onChange={v => onChange({ ...p, fontSize: v })} min={12} max={32} style={{ width: '100%' }} /></Form.Item>
            <Form.Item label="文字颜色"><Input type="color" value={p.color || '#666666'} onChange={e => onChange({ ...p, color: e.target.value })} style={{ width: '100%', height: 36 }} /></Form.Item>
            <Form.Item label="行高"><InputNumber value={p.lineHeight} onChange={v => onChange({ ...p, lineHeight: v })} min={1} max={3} step={0.1} style={{ width: '100%' }} /></Form.Item>
            <Form.Item label="对齐方式">
              <Select value={p.align || 'left'} onChange={v => onChange({ ...p, align: v })} style={{ width: '100%' }}>
                <Select.Option value="left">左对齐</Select.Option>
                <Select.Option value="center">居中</Select.Option>
                <Select.Option value="right">右对齐</Select.Option>
              </Select>
            </Form.Item>
          </>
        );
      case 'image':
        return (
          <>
            <Form.Item label="图片URL">
              <Space.Compact style={{ width: '100%' }}>
                <Input value={p.url || ''} onChange={e => onChange({ ...p, url: e.target.value })} placeholder="输入图片地址或上传" />
                <Upload accept="image/*" showUploadList={false} beforeUpload={handleImageUpload}>
                  <Button icon={<UploadOutlined />}>上传</Button>
                </Upload>
              </Space.Compact>
            </Form.Item>
            <Form.Item label="替代文字"><Input value={p.alt || ''} onChange={e => onChange({ ...p, alt: e.target.value })} /></Form.Item>
            <Form.Item label="圆角"><InputNumber value={p.borderRadius} onChange={v => onChange({ ...p, borderRadius: v })} min={0} max={50} style={{ width: '100%' }} /></Form.Item>
            {p.url && p.url.startsWith('/') && (
              <Alert message={`图片地址: ${API_BASE_URL}${p.url}`} type="info" showIcon style={{ fontSize: 12 }} />
            )}
          </>
        );
      case 'button':
        return (
          <>
            <Form.Item label="按钮文字"><Input value={p.text} onChange={e => onChange({ ...p, text: e.target.value })} /></Form.Item>
            <Form.Item label="跳转链接"><Input value={p.link || ''} onChange={e => onChange({ ...p, link: e.target.value })} placeholder="https://..." /></Form.Item>
            <Form.Item label="按钮颜色"><Input type="color" value={p.color || '#1677ff'} onChange={e => onChange({ ...p, color: e.target.value })} style={{ width: '100%', height: 36 }} /></Form.Item>
            <Form.Item label="按钮大小">
              <Select value={p.size || 'middle'} onChange={v => onChange({ ...p, size: v })} style={{ width: '100%' }}>
                <Select.Option value="small">小</Select.Option>
                <Select.Option value="middle">中</Select.Option>
                <Select.Option value="large">大</Select.Option>
              </Select>
            </Form.Item>
          </>
        );
      case 'divider':
        return (
          <>
            <Form.Item label="分割线颜色"><Input type="color" value={p.color || '#e8e8e8'} onChange={e => onChange({ ...p, color: e.target.value })} style={{ width: '100%', height: 36 }} /></Form.Item>
            <Form.Item label="虚线"><Switch checked={p.dashed} onChange={v => onChange({ ...p, dashed: v })} /></Form.Item>
          </>
        );
      case 'spacing':
        return (
          <Form.Item label="间距高度(px)"><InputNumber value={p.height} onChange={v => onChange({ ...p, height: v })} min={0} max={200} style={{ width: '100%' }} /></Form.Item>
        );
      case 'video':
        return (
          <>
            <Form.Item label="视频URL">
              <Space.Compact style={{ width: '100%' }}>
                <Input value={p.url || ''} onChange={e => onChange({ ...p, url: e.target.value })} placeholder="输入视频地址或上传" />
                <Upload accept="video/*" showUploadList={false} beforeUpload={handleVideoUpload}>
                  <Button icon={<UploadOutlined />}>上传</Button>
                </Upload>
              </Space.Compact>
            </Form.Item>
            <Form.Item label="封面图URL"><Input value={p.poster || ''} onChange={e => onChange({ ...p, poster: e.target.value })} placeholder="视频封面图" /></Form.Item>
            <Form.Item label="自动播放"><Switch checked={p.autoplay} onChange={v => onChange({ ...p, autoplay: v })} /></Form.Item>
          </>
        );
      case 'form':
        return (
          <>
            <Form.Item label="表单标题"><Input value={p.title} onChange={e => onChange({ ...p, title: e.target.value })} /></Form.Item>
            <Form.Item label="表单字段">
              <div>
                {(p.fields || []).map((f: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <Input value={f.name} onChange={e => { const fields = [...p.fields]; fields[i] = { ...fields[i], name: e.target.value }; onChange({ ...p, fields }); }} placeholder="字段名" style={{ flex: 1 }} />
                    <Select value={f.type} onChange={v => { const fields = [...p.fields]; fields[i] = { ...fields[i], type: v }; onChange({ ...p, fields }); }} style={{ width: 100 }}>
                      <Select.Option value="text">文本</Select.Option>
                      <Select.Option value="tel">电话</Select.Option>
                      <Select.Option value="email">邮箱</Select.Option>
                      <Select.Option value="textarea">多行</Select.Option>
                    </Select>
                    <Switch checked={f.required} onChange={v => { const fields = [...p.fields]; fields[i] = { ...fields[i], required: v }; onChange({ ...p, fields }); }} size="small" />
                    <Button type="link" danger icon={<DeleteOutlined />} onClick={() => { const fields = p.fields.filter((_: any, j: number) => j !== i); onChange({ ...p, fields }); }} />
                  </div>
                ))}
                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => onChange({ ...p, fields: [...(p.fields || []), { name: '新字段', type: 'text', required: false }] })}>
                  添加字段
                </Button>
              </div>
            </Form.Item>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <Tag color="blue">{COMPONENT_LIBRARY.find(c => c.type === comp.type)?.label || comp.type}</Tag>
        <Text type="secondary" style={{ marginLeft: 8 }}>ID: {comp.id}</Text>
      </div>
      {renderProperties()}
    </div>
  );
}

// ==================== Main Component ====================

export default function PageBuilder() {
  const [pages, setPages] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<PageData | null>(null);
  const [components, setComponents] = useState<PageComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPageModal, setShowPageModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [promotionLinks, setPromotionLinks] = useState<PromotionLink[]>([]);
  const [pageForm] = Form.useForm();
  const [showPageList, setShowPageList] = useState(false);

  const fetchPages = async () => {
    try {
      const res = await axios.get(`${CMS_API}/sites/default/pages`, { headers: getAuthHeaders() });
      if (res.data.code === 0 || res.data.code === 200) {
        setPages(res.data.data || []);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchPages(); }, []);

  const addComponent = (type: PageComponent['type']) => {
    const libItem = COMPONENT_LIBRARY.find(c => c.type === type);
    if (!libItem) return;
    const newComp: PageComponent = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      props: { ...libItem.defaultProps },
    };
    setComponents(prev => [...prev, newComp]);
    setSelectedId(newComp.id);
  };

  const updateComponent = (id: string, props: any) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, props } : c));
  };

  const deleteComponent = (id: string) => {
    setComponents(prev => prev.filter(c => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const moveComponent = (id: string, direction: 'up' | 'down') => {
    setComponents(prev => {
      const idx = prev.findIndex(c => c.id === id);
      if (idx < 0) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };

  const handleSave = async () => {
    if (!currentPage?.title) {
      message.warning('请先设置页面标题');
      setShowPageModal(true);
      return;
    }
    setSaving(true);
    try {
      const pageData = {
        title: currentPage.title,
        slug: currentPage.slug || currentPage.title.toLowerCase().replace(/\s+/g, '-'),
        content: JSON.stringify(components),
        seoTitle: currentPage.seoTitle,
        seoDesc: currentPage.seoDesc,
        status: currentPage.status,
      };
      let res;
      if (currentPage.id) {
        res = await axios.put(`${CMS_API}/pages/${currentPage.id}`, pageData, { headers: getAuthHeaders() });
      } else {
        res = await axios.post(`${CMS_API}/sites/default/pages`, pageData, { headers: getAuthHeaders() });
      }
      if (res.data.code === 0 || res.data.code === 200) {
        const savedPage = res.data.data;
        setCurrentPage(prev => prev ? { ...prev, id: savedPage.id } : null);
        message.success('页面保存成功');
        setShowPromotionModal(true);
        fetchPromotionLinks(savedPage.id);
        fetchPages();
      } else {
        message.error(res.data.message || '保存失败');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const fetchPromotionLinks = async (pageId: string) => {
    try {
      const res = await axios.get(`${CMS_API}/pages/${pageId}/links`, { headers: getAuthHeaders() });
      if (res.data.code === 0) setPromotionLinks(res.data.data || []);
    } catch { /* ignore */ }
  };

  const handleGenerateLink = async () => {
    if (!currentPage?.id) { message.warning('请先保存页面'); return; }
    try {
      const res = await axios.post(`${CMS_API}/pages/${currentPage.id}/generate-link`, {
        utmSource: 'page-builder', utmMedium: 'promotion',
      }, { headers: getAuthHeaders() });
      if (res.data.code === 0) {
        message.success('推广链接生成成功');
        fetchPromotionLinks(currentPage.id);
      } else {
        message.error(res.data.message || '生成失败');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '生成失败');
    }
  };

  const handleNewPage = () => {
    pageForm.resetFields();
    pageForm.setFieldsValue({ title: '', slug: '', status: 'draft' });
    setShowPageModal(true);
  };

  const handlePageFormOk = async () => {
    try {
      const values = await pageForm.validateFields();
      setCurrentPage({
        id: currentPage?.id,
        title: values.title,
        slug: values.slug || values.title.toLowerCase().replace(/\s+/g, '-'),
        siteId: 'default',
        content: components,
        status: values.status || 'draft',
        seoTitle: values.seoTitle,
        seoDesc: values.seoDesc,
      });
      setShowPageModal(false);
      message.success('页面信息已设置');
    } catch { /* validation error */ }
  };

  const loadPage = async (page: any) => {
    try {
      const res = await axios.get(`${CMS_API}/sites/default/pages`, { headers: getAuthHeaders() });
      if (res.data.code === 0 || res.data.code === 200) {
        const pageList = res.data.data || [];
        const found = pageList.find((p: any) => p.id === page.id);
        if (found) {
          let content: PageComponent[] = [];
          try { content = typeof found.content === 'string' ? JSON.parse(found.content) : found.content || []; } catch { content = []; }
          setCurrentPage({
            id: found.id, title: found.title, slug: found.slug,
            siteId: found.siteId || 'default', content,
            status: found.status || 'draft',
            seoTitle: found.seoTitle, seoDesc: found.seoDesc,
          });
          setComponents(content);
          setSelectedId(null);
          message.success(`已加载页面: ${found.title}`);
        }
      }
    } catch { message.error('加载页面失败'); }
  };

  const selectedComp = components.find(c => c.id === selectedId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* 顶部工具栏 */}
      <Card size="small" style={{ marginBottom: 12, borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Text strong style={{ fontSize: 16 }}>页面搭建</Text>
            {currentPage && <Tag color="green">编辑中: {currentPage.title}</Tag>}
          </Space>
          <Space>
            <Button icon={<FolderOutlined />} onClick={() => setShowPageList(true)}>页面管理</Button>
            <Button icon={<PlusOutlined />} onClick={handleNewPage}>新建页面</Button>
            <Button icon={<EyeOutlined />} disabled={!currentPage}>预览</Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>保存页面</Button>
          </Space>
        </div>
      </Card>

      <div style={{ display: 'flex', flex: 1, gap: 12, overflow: 'hidden' }}>
        {/* 左侧：组件库 */}
        <Card size="small" title="组件库" style={{ width: 200, flexShrink: 0, overflow: 'auto' }} bodyStyle={{ padding: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {COMPONENT_LIBRARY.map(item => (
              <Button key={item.type} type="default" block icon={item.icon}
                onClick={() => addComponent(item.type)}
                style={{ height: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                {item.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* 中间：画布 */}
        <Card size="small" style={{ flex: 1, overflow: 'auto' }} bodyStyle={{ padding: 20, minHeight: 400 }}>
          {components.length === 0 ? (
            <Empty description="从左侧点击组件添加到画布" style={{ marginTop: 100 }} />
          ) : (
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              {components.map(comp => (
                <div key={comp.id} style={{ position: 'relative' }}>
                  <ComponentRenderer comp={comp} selected={selectedId === comp.id} onClick={() => setSelectedId(comp.id)} />
                  {selectedId === comp.id && (
                    <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 4, zIndex: 10 }}>
                      <Tooltip title="上移"><Button size="small" icon={<ArrowUpOutlined />} onClick={(e) => { e.stopPropagation(); moveComponent(comp.id, 'up'); }} /></Tooltip>
                      <Tooltip title="下移"><Button size="small" icon={<ArrowDownOutlined />} onClick={(e) => { e.stopPropagation(); moveComponent(comp.id, 'down'); }} /></Tooltip>
                      <Tooltip title="删除"><Button size="small" danger icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); deleteComponent(comp.id); }} /></Tooltip>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 右侧：属性面板 */}
        <Card size="small" title="属性设置" style={{ width: 300, flexShrink: 0, overflow: 'auto' }} bodyStyle={{ padding: 0 }}>
          {selectedComp ? (
            <PropertyPanel comp={selectedComp} onChange={(props) => updateComponent(selectedComp.id, props)} />
          ) : (
            <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>
              <EditOutlined style={{ fontSize: 32, marginBottom: 12 }} />
              <p>点击画布中的组件<br />编辑属性</p>
            </div>
          )}
        </Card>
      </div>

      {/* 新建页面弹窗 */}
      <Modal title={currentPage?.id ? '编辑页面信息' : '新建页面'} open={showPageModal}
        onOk={handlePageFormOk} onCancel={() => setShowPageModal(false)} destroyOnClose>
        <Form form={pageForm} layout="vertical">
          <Form.Item name="title" label="页面标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="如：高新安防产品介绍" />
          </Form.Item>
          <Form.Item name="slug" label="页面路径">
            <Input placeholder="自动生成或手动输入，如：gaoxin-security" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Select.Option value="draft">草稿</Select.Option>
              <Select.Option value="published">发布</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="seoTitle" label="SEO标题"><Input placeholder="搜索引擎显示的标题" /></Form.Item>
          <Form.Item name="seoDesc" label="SEO描述"><TextArea rows={2} placeholder="搜索引擎显示的描述" /></Form.Item>
        </Form>
      </Modal>

      {/* 页面列表弹窗 */}
      <Modal title="页面管理" open={showPageList} onCancel={() => setShowPageList(false)} footer={null} width={700}>
        {pages.length === 0 ? <Empty description="暂无页面" /> : (
          <div>
            {pages.map((page: any) => (
              <Card key={page.id} size="small" style={{ marginBottom: 8, cursor: 'pointer', border: currentPage?.id === page.id ? '2px solid #1677ff' : undefined }}
                onClick={() => { loadPage(page); setShowPageList(false); }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong>{page.title}</Text>
                    <Tag style={{ marginLeft: 8 }} color={page.status === 'published' ? 'green' : 'default'}>
                      {page.status === 'published' ? '已发布' : '草稿'}
                    </Tag>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{new Date(page.createdAt).toLocaleDateString('zh-CN')}</Text>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Modal>

      {/* 推广链接弹窗 */}
      <Modal title={<span><ThunderboltOutlined style={{ color: '#fa8c16', marginRight: 8 }} />推广链接</span>}
        open={showPromotionModal} onCancel={() => setShowPromotionModal(false)} width={600}
        footer={[
          <Button key="close" onClick={() => setShowPromotionModal(false)}>关闭</Button>,
          <Button key="gen" type="primary" icon={<LinkOutlined />} onClick={handleGenerateLink}>生成新推广链接</Button>,
        ]}>
        <Alert message="页面保存成功！" description="您可以生成推广链接，用于企业推广。每个链接都可以追踪点击数据。"
          type="success" showIcon style={{ marginBottom: 16 }} />
        {promotionLinks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30 }}>
            <LinkOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 12 }} />
            <p style={{ color: '#999' }}>暂无推广链接，点击下方按钮生成</p>
          </div>
        ) : (
          <div>
            {promotionLinks.map(link => (
              <Card key={link.id} size="small" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary">推广链接：</Text>
                      <Text copyable style={{ marginLeft: 8, color: '#1677ff' }}>{link.shortUrl}</Text>
                    </div>
                    <div>
                      <Text type="secondary">目标地址：</Text>
                      <Text style={{ marginLeft: 8, fontSize: 12 }}>{link.targetUrl}</Text>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <Tag icon={<CheckCircleOutlined />} color="success">点击 {link.clickCount} 次</Tag>
                      <Tag>Code: {link.shortCode}</Tag>
                    </div>
                  </div>
                  <QRCode value={link.shortUrl} size={100} style={{ marginLeft: 16, flexShrink: 0 }} />
                </div>
              </Card>
            ))}
          </div>
        )}
        <Divider />
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>将推广链接分享到微信、微博、邮件等渠道，即可追踪推广效果</Text>
        </div>
      </Modal>
    </div>
  );
}
