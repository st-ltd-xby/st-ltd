import { useState, useEffect, useCallback, useRef } from 'react';
import { Layout, Card, Button, Typography, Space, Modal, Form, Input, Select, InputNumber, message, Divider, Tag, Popconfirm, List, Empty, Upload, Alert } from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, SaveOutlined,
  FontSizeOutlined, PictureOutlined, StopOutlined, MinusOutlined,
  DragOutlined, CopyOutlined, ArrowUpOutlined, ArrowDownOutlined,
  FolderOutlined, FileOutlined, ReloadOutlined, UploadOutlined, LinkOutlined,
} from '@ant-design/icons';
import { cmsApi } from '../../services/api';
import { API_BASE_URL } from '../../config/api';

const { Title, Text } = Typography;
const { Sider, Content } = Layout;

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

// 解析图片 URL（相对路径拼接后端地址）
const resolveImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

// 图片渲染组件（带加载失败回退）
function ImageRender({ props, wrapperStyle, onClick }: { props: any; wrapperStyle: React.CSSProperties; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);
  const resolvedUrl = resolveImageUrl(props.url);
  return (
    <div style={wrapperStyle} onClick={onClick}>
      {resolvedUrl && !imgError ? (
        <img src={resolvedUrl} alt={props.alt} style={{ width: props.width, height: props.height, borderRadius: props.borderRadius, display: 'block' }} onError={() => setImgError(true)} />
      ) : (
        <div style={{ width: props.width || '100%', height: 200, background: '#f5f5f5', borderRadius: props.borderRadius || 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
          <PictureOutlined style={{ fontSize: 32, marginRight: 8 }} /> {props.url ? '图片加载失败' : '点击设置图片URL'}
        </div>
      )}
    </div>
  );
}

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
      return <ImageRender props={props} wrapperStyle={wrapperStyle} onClick={onClick} />;
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
              <Input 
                value={comp.props.url} 
                onChange={e => handleChange('url', e.target.value)} 
                placeholder="输入图片地址或上传本地图片" 
                style={{ flex: 1 }}
              />
              <Upload
                action={`${API_BASE_URL}/api/v1/upload`}
                headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                showUploadList={false}
                accept="image/*"
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith('image/');
                  if (!isImage) {
                    message.error('只能上传图片文件!');
                    return false;
                  }
                  const isLt10M = file.size / 1024 / 1024 < 10;
                  if (!isLt10M) {
                    message.error('图片大小不能超过 10MB!');
                    return false;
                  }
                  return true;
                }}
                onChange={(info) => {
                  if (info.file.status === 'uploading') {
                    message.loading('上传中...', 0);
                  }
                  if (info.file.status === 'done') {
                    message.destroy();
                    if (info.file.response?.code === 0) {
                      // 拼接完整后端地址
                      const rawUrl = info.file.response.data.url;
                      const fullUrl = rawUrl.startsWith('http') ? rawUrl : `${API_BASE_URL}${rawUrl}`;
                      handleChange('url', fullUrl);
                      message.success('图片上传成功');
                    } else {
                      message.error(info.file.response?.message || '上传失败');
                    }
                  } else if (info.file.status === 'error') {
                    message.destroy();
                    message.error('上传失败');
                  }
                }}
              >
                <Button icon={<UploadOutlined />} type="primary">上传</Button>
              </Upload>
            </div>
          </div>
          {comp.props.url && (
            <div style={{ marginBottom: 12 }}>
              <img 
                src={comp.props.url} 
                alt="预览" 
                style={{ 
                  width: '100%', 
                  maxHeight: 150, 
                  objectFit: 'contain',
                  borderRadius: 4,
                  border: '1px solid #f0f0f0',
                  background: '#fafafa',
                }} 
              />
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
  const [promotionModal, setPromotionModal] = useState(false);
  const [promotionLinks, setPromotionLinks] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);

  const selectedComp = components.find(c => c.id === selectedId) || null;

  // 加载页面列表（独立，不依赖站点）
  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = useCallback(async () => {
    try {
      const res: any = await cmsApi.getPages();
      if (res.code === 0 && res.data) {
        setPages(res.data);
      }
    } catch { /* ignore */ }
  }, []);

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
      const res: any = await cmsApi.deletePage(pageId);
      if (res.code === 0) {
        message.success('页面删除成功');
        if (currentPageId === pageId) {
          setComponents([]);
          setCurrentPageId(null);
        }
        loadPages();
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

  // 保存页面（新建或更新）
  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      const pageData = {
        title: values.title,
        slug: values.slug || values.title.toLowerCase().replace(/\s+/g, '-'),
        content: JSON.stringify(components),
        seoTitle: values.seoTitle,
        seoDesc: values.seoDesc,
      };
      console.log('保存页面数据:', pageData);
      let res: any;
      if (currentPageId) {
        res = await cmsApi.updatePage(currentPageId, pageData);
      } else {
        res = await cmsApi.createPage(pageData);
      }
      console.log('保存结果:', res);
      if (res.code === 0) {
        const savedPageId = res.data?.id || currentPageId;
        if (savedPageId) setCurrentPageId(savedPageId);
        // 生成二级链接
        const slug = values.slug || values.title.toLowerCase().replace(/\s+/g, '-');
        const url = `/p/${slug}`;
        setPageUrl(url);
        setSaveModal(false);
        loadPages();
        // 自动生成推广链接（静默）
        if (savedPageId) {
          await generatePromotionLink(savedPageId);
        }
        message.success(currentPageId ? '页面更新成功，推广链接已生成' : '页面创建成功，推广链接已生成');
      } else {
        message.error(res.message || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败，请检查网络或查看控制台');
    } finally {
      setLoading(false);
    }
  };

  // 生成推广链接（静默生成，不弹窗）
  const generatePromotionLink = async (pageId: string) => {
    try {
      const res: any = await cmsApi.generatePageLink(pageId);
      if (res.code === 0) {
        message.success('推广链接已自动生成，可在「推广工具」中查看');
      }
    } catch { /* ignore */ }
  };

  // 获取已有推广链接
  const fetchPromotionLinks = async (pageId: string) => {
    try {
      const res: any = await cmsApi.getPageLinks(pageId);
      if (res.code === 0 && res.data?.length > 0) {
        setPromotionLinks(res.data);
        setPromotionModal(true);
      }
    } catch { /* ignore */ }
  };

  // 再次生成新链接
  const handleGenerateNewLink = async () => {
    if (!currentPageId) return;
    setGenerating(true);
    try {
      const res: any = await cmsApi.generatePageLink(currentPageId);
      if (res.code === 0) {
        message.success('新推广链接已生成');
        setPromotionLinks(prev => [res.data, ...prev]);
      }
    } catch { message.error('生成失败'); }
    setGenerating(false);
  };

  // 复制推广链接
  const copyPromotionLink = (link: any) => {
    const url = link.shortUrl || `${window.location.origin}/t/${link.shortCode}`;
    navigator.clipboard.writeText(url);
    message.success('推广链接已复制');
  };

  // 打开保存弹窗（预填当前页面信息）
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
          <Button icon={<ReloadOutlined />} onClick={() => loadPages()}>刷新</Button>
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
                description={`状态: ${page.status === 'published' ? '已发布' : '草稿'} | 更新: ${new Date(page.updatedAt).toLocaleString()}`}
              />
            </List.Item>
          )}
        />
      )}
    </Modal>
  );

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
          {currentPageId && <Tag color="green">编辑中: {pages.find(p => p.id === currentPageId)?.title}</Tag>}
        </Space>
        <Space>
          <Button icon={<FolderOutlined />} onClick={() => setPageListVisible(true)}>页面管理</Button>
          <Button icon={<PlusOutlined />} onClick={newPage}>新建页面</Button>
          <Button icon={<EyeOutlined />} onClick={() => setPreviewMode(true)} disabled={!components.length}>预览</Button>
          <Button icon={<LinkOutlined />} onClick={() => currentPageId ? fetchPromotionLinks(currentPageId) : message.warning('请先保存页面')} disabled={!currentPageId}>推广链接</Button>
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

      {/* 推广链接弹窗 */}
      <Modal
        title="推广链接 - 用于推送"
        open={promotionModal}
        onCancel={() => setPromotionModal(false)}
        footer={[
          <Button key="close" onClick={() => setPromotionModal(false)}>关闭</Button>,
          <Button key="generate" type="primary" icon={<LinkOutlined />} onClick={handleGenerateNewLink} loading={generating}>生成新链接</Button>,
        ]}
        width={600}
      >
        <Alert message="以下链接可用于企业推广推送，用户点击后会被追踪统计" type="info" showIcon style={{ marginBottom: 16 }} />
        <List
          dataSource={promotionLinks}
          renderItem={(link: any) => {
            const fullUrl = link.shortUrl || `${window.location.origin}/t/${link.shortCode}`;
            return (
              <List.Item
                actions={[
                  <Button size="small" icon={<CopyOutlined />} onClick={() => copyPromotionLink(link)}>复制</Button>,
                ]}
              >
                <List.Item.Meta
                  title={<Tag color="blue">{link.shortCode}</Tag>}
                  description={
                    <div>
                      <div style={{ marginBottom: 4 }}>
                        <Text strong>短链接：</Text>
                        <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>{fullUrl}</code>
                      </div>
                      <div>
                        <Text strong>目标：</Text>
                        <Text type="secondary" ellipsis style={{ maxWidth: 300 }}>{link.targetUrl}</Text>
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>点击: {link.clickCount || 0} | 转化: {link.leadCount || 0}</Text>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
        {promotionLinks.length === 0 && <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>暂无推广链接</div>}
      </Modal>

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
                  <Button size="small" icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(window.location.origin + pageUrl); message.success('链接已复制'); }}>复制</Button>
                  <Button size="small" type="link" icon={<EyeOutlined />} href={pageUrl} target="_blank">查看</Button>
                </div>
              </div>
            }
            type="success"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Modal>
    </div>
  );
}
