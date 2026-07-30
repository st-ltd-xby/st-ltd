import React, { useState, useEffect } from 'react';
import {
  Card, Tabs, Button, Space, Input, Modal, Form, message, Tag, Select,
  Popconfirm, Row, Col, Upload, Image, Empty, Tooltip,
  Typography, Drawer, Descriptions, Table
} from 'antd';
import {
  PictureOutlined, VideoCameraOutlined, FileTextOutlined,
  UploadOutlined, PlusOutlined, DeleteOutlined, EditOutlined,
  EyeOutlined, SearchOutlined, ReloadOutlined, PlayCircleOutlined,
  FileOutlined, LinkOutlined, CopyOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Text } = Typography;

const ADMIN_API = `${API_BASE_URL}/api/v1/admin`;
const UPLOAD_API = `${API_BASE_URL}/api/v1`;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

// ==================== Types ====================

interface ImageItem {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

interface ContentItem {
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
  createdAt: string;
  updatedAt: string;
}

const typeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  article: { label: '\u56fe\u6587', color: 'blue', icon: <FileTextOutlined /> },
  video: { label: '\u89c6\u9891', color: 'orange', icon: <VideoCameraOutlined /> },
  whitepaper: { label: '\u6587\u4ef6', color: 'purple', icon: <FileOutlined /> },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '\u8349\u7a3f', color: 'default' },
  published: { label: '\u5df2\u53d1\u5e03', color: 'success' },
  archived: { label: '\u5df2\u5f52\u6863', color: 'warning' },
};

// ==================== Image Library ====================

function ImageLibrary() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewVisible, setPreviewVisible] = useState(false);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (search) params.append('search', search);
      const res = await axios.get(`${ADMIN_API}/images?${params}`, { headers: getAuthHeaders() });
      if (res.data.code === 0 || res.data.code === 200) {
        setImages(res.data.data?.list || []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchImages(); }, []);

  const handleDelete = async (id: string) => {
    try {
      const res = await axios.delete(`${ADMIN_API}/images/${id}`, { headers: getAuthHeaders() });
      if (res.data.code === 0 || res.data.code === 200) {
        message.success('\u5220\u9664\u6210\u529f');
        fetchImages();
      }
    } catch { message.error('\u5220\u9664\u5931\u8d25'); }
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post(`${UPLOAD_API}/upload`, formData, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.code === 0) {
        message.success('\u56fe\u7247\u4e0a\u4f20\u6210\u529f');
        fetchImages();
      } else {
        message.error(res.data.message || '\u4e0a\u4f20\u5931\u8d25');
      }
    } catch { message.error('\u4e0a\u4f20\u5931\u8d25'); }
    return false;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="\u641c\u7d22\u56fe\u7247\u540d\u79f0..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onPressEnter={fetchImages}
            style={{ width: 220 }}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={fetchImages}>{'\u5237\u65b0'}</Button>
        </Space>
        <Upload accept="image/*" showUploadList={false} beforeUpload={handleUpload} multiple>
          <Button type="primary" icon={<UploadOutlined />}>{'\u4e0a\u4f20\u56fe\u7247'}</Button>
        </Upload>
      </div>

      {images.length === 0 ? (
        <Empty description="\u6682\u65e0\u56fe\u7247\uff0c\u70b9\u51fb\u4e0a\u65b9\u6309\u94ae\u4e0a\u4f20" style={{ padding: 60 }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {images.map(img => (
            <Card
              key={img.id}
              hoverable
              size="small"
              cover={
                <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => { setPreviewImage(img.url); setPreviewVisible(true); }}>
                  <img src={img.url.startsWith('/') ? API_BASE_URL + img.url : img.url} alt={img.name}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
              }
              actions={[
                <Tooltip title="\u9884\u89c8" key="view"><EyeOutlined onClick={() => { setPreviewImage(img.url); setPreviewVisible(true); }} /></Tooltip>,
                <Tooltip title="\u590d\u5236\u94fe\u63a5" key="copy">
                  <CopyOutlined onClick={() => {
                    const fullUrl = img.url.startsWith('/') ? API_BASE_URL + img.url : img.url;
                    navigator.clipboard.writeText(fullUrl);
                    message.success('\u94fe\u63a5\u5df2\u590d\u5236');
                  }} />
                </Tooltip>,
                <Popconfirm title="\u786e\u5b9a\u5220\u9664\u6b64\u56fe\u7247\uff1f" onConfirm={() => handleDelete(img.id)} key="del">
                  <DeleteOutlined style={{ color: '#ff4d4f' }} />
                </Popconfirm>,
              ]}
            >
              <Card.Meta
                title={<Text ellipsis style={{ fontSize: 13 }}>{img.name}</Text>}
                description={<Text type="secondary" style={{ fontSize: 11 }}>{formatSize(img.size)} {'\u00b7'} {new Date(img.createdAt).toLocaleDateString('zh-CN')}</Text>}
              />
            </Card>
          ))}
        </div>
      )}

      <Image
        src={previewImage.startsWith('/') ? API_BASE_URL + previewImage : previewImage}
        style={{ display: 'none' }}
        preview={{ visible: previewVisible, onVisibleChange: setPreviewVisible }}
      />
    </div>
  );
}

// ==================== Content Library ====================

function ContentLibrary() {
  const [articles, setArticles] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [current, setCurrent] = useState<ContentItem | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [detail, setDetail] = useState<ContentItem | null>(null);
  const [form] = Form.useForm();
  const [selectedType, setSelectedType] = useState('article');

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (search) params.append('search', search);
      if (filterType !== 'all') params.append('type', filterType);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      const res = await axios.get(`${ADMIN_API}/articles?${params}`, { headers: getAuthHeaders() });
      if (res.data.code === 0 || res.data.code === 200) {
        setArticles(res.data.data?.list || []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchArticles(); }, []);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const isEdit = !!current;
      const url = isEdit ? `${ADMIN_API}/articles/${current.id}` : `${ADMIN_API}/articles`;
      const method = isEdit ? 'put' : 'post';
      const res = await axios[method](url, values, { headers: getAuthHeaders() });
      if (res.data.code === 0 || res.data.code === 200) {
        message.success(isEdit ? '\u5185\u5bb9\u66f4\u65b0\u6210\u529f' : '\u5185\u5bb9\u521b\u5efa\u6210\u529f');
        setModalVisible(false);
        form.resetFields();
        setCurrent(null);
        fetchArticles();
      }
    } catch (e: any) {
      if (!e.errorFields) message.error('\u64cd\u4f5c\u5931\u8d25');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axios.delete(`${ADMIN_API}/articles/${id}`, { headers: getAuthHeaders() });
      if (res.data.code === 0 || res.data.code === 200) {
        message.success('\u5220\u9664\u6210\u529f');
        fetchArticles();
      }
    } catch { message.error('\u5220\u9664\u5931\u8d25'); }
  };

  const openCreate = (type: string = 'article') => {
    form.resetFields();
    setCurrent(null);
    setSelectedType(type);
    form.setFieldsValue({ type, status: 'draft' });
    setModalVisible(true);
  };

  const openEdit = (record: ContentItem) => {
    setCurrent(record);
    setSelectedType(record.type);
    form.setFieldsValue({
      title: record.title, type: record.type, status: record.status,
      summary: record.summary, content: record.content, coverImage: record.coverImage,
      videoUrl: record.videoUrl, documentUrl: record.documentUrl, tags: record.tags,
    });
    setModalVisible(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Space wrap>
          <Input placeholder="\u641c\u7d22\u6807\u9898..." prefix={<SearchOutlined />} value={search}
            onChange={e => setSearch(e.target.value)} onPressEnter={fetchArticles} style={{ width: 200 }} allowClear />
          <Select value={filterType} onChange={setFilterType} style={{ width: 120 }}>
            <Select.Option value="all">{'\u5168\u90e8\u7c7b\u578b'}</Select.Option>
            <Select.Option value="article">{'\u56fe\u6587'}</Select.Option>
            <Select.Option value="video">{'\u89c6\u9891'}</Select.Option>
            <Select.Option value="whitepaper">{'\u6587\u4ef6'}</Select.Option>
          </Select>
          <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 120 }}>
            <Select.Option value="all">{'\u5168\u90e8\u72b6\u6001'}</Select.Option>
            <Select.Option value="draft">{'\u8349\u7a3f'}</Select.Option>
            <Select.Option value="published">{'\u5df2\u53d1\u5e03'}</Select.Option>
            <Select.Option value="archived">{'\u5df2\u5f52\u6863'}</Select.Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={fetchArticles}>{'\u5237\u65b0'}</Button>
        </Space>
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => openCreate('article')}>{'\u65b0\u589e\u56fe\u6587'}</Button>
          <Button icon={<VideoCameraOutlined />} onClick={() => openCreate('video')} style={{ color: '#fa8c16', borderColor: '#fa8c16' }}>{'\u65b0\u589e\u89c6\u9891'}</Button>
          <Button icon={<FileOutlined />} onClick={() => openCreate('whitepaper')} style={{ color: '#722ed1', borderColor: '#722ed1' }}>{'\u65b0\u589e\u6587\u4ef6'}</Button>
        </Space>
      </div>

      <Table dataSource={articles} rowKey="id" loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `\u5171 ${t} \u6761` }}>
        <Table.Column title={"\u6807\u9898"} dataIndex="title" key="title"
          render={(title, r: ContentItem) => <a onClick={() => { setDetail(r); setDrawerVisible(true); }}>{title}</a>} />
        <Table.Column title={"\u7c7b\u578b"} dataIndex="type" key="type" width={90}
          render={(type) => { const cfg = typeConfig[type]; return cfg ? <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag> : type; }} />
        <Table.Column title={"\u72b6\u6001"} dataIndex="status" key="status" width={90}
          render={(status) => { const cfg = statusConfig[status]; return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : status; }} />
        <Table.Column title={"\u5c01\u9762"} dataIndex="coverImage" key="coverImage" width={80}
          render={(url) => url ? <img src={url.startsWith('/') ? API_BASE_URL + url : url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} /> : '-'} />
        <Table.Column title={"\u6d4f\u89c8"} dataIndex="viewCount" key="viewCount" width={70} />
        <Table.Column title={"\u6807\u7b7e"} dataIndex="tags" key="tags"
          render={(tags) => tags ? tags.split(',').filter(Boolean).slice(0, 3).map((t: string, i: number) => <Tag key={i}>{t}</Tag>) : '-'} />
        <Table.Column title={"\u521b\u5efa\u65f6\u95f4"} dataIndex="createdAt" key="createdAt" width={160}
          render={(d) => d ? new Date(d).toLocaleString('zh-CN') : '-'} />
        <Table.Column title={"\u64cd\u4f5c"} key="action" width={120}
          render={(_: any, record: ContentItem) => (
            <Space size="small">
              <Tooltip title={"\u7f16\u8f91"}><Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} /></Tooltip>
              <Popconfirm title={"\u786e\u5b9a\u5220\u9664\uff1f"} onConfirm={() => handleDelete(record.id)}>
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          )} />
      </Table>

      <Modal title={current ? '\u7f16\u8f91\u5185\u5bb9' : '\u65b0\u589e\u5185\u5bb9'} open={modalVisible}
        onOk={handleSubmit} onCancel={() => { setModalVisible(false); form.resetFields(); setCurrent(null); }}
        width={640} destroyOnClose okText={current ? '\u66f4\u65b0' : '\u521b\u5efa'} cancelText={"\u53d6\u6d88"}>
        <Form form={form} layout="vertical" initialValues={{ type: 'article', status: 'draft' }}>
          <Form.Item name="title" label={"\u6807\u9898"} rules={[{ required: true, message: '\u8bf7\u8f93\u5165\u6807\u9898' }]}>
            <Input placeholder={"\u8bf7\u8f93\u5165\u6807\u9898"} />
          </Form.Item>
          <Form.Item name="type" label={"\u7c7b\u578b"} rules={[{ required: true }]}>
            <Select onChange={(v: string) => setSelectedType(v)}>
              <Select.Option value="article"><FileTextOutlined /> {'\u56fe\u6587'}</Select.Option>
              <Select.Option value="video"><VideoCameraOutlined /> {'\u89c6\u9891'}</Select.Option>
              <Select.Option value="whitepaper"><FileOutlined /> {'\u6587\u4ef6/\u767d\u76ae\u4e66'}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="summary" label={"\u6458\u8981"}>
            <TextArea placeholder={"\u7b80\u8981\u63cf\u8ff0\u5185\u5bb9"} rows={2} />
          </Form.Item>
          <Form.Item name="content" label={"\u6b63\u6587\u5185\u5bb9"}>
            <TextArea placeholder={"\u8bf7\u8f93\u5165\u8be6\u7ec6\u5185\u5bb9"} rows={4} />
          </Form.Item>
          <Form.Item name="coverImage" label={"\u5c01\u9762\u56fe\u7247"}>
            <Input placeholder={"\u8f93\u5165\u56fe\u7247URL\u6216\u4ece\u56fe\u7247\u5e93\u590d\u5236"} addonAfter={
              <Upload accept="image/*" showUploadList={false} beforeUpload={async (file) => {
                const formData = new FormData();
                formData.append('file', file);
                try {
                  const res = await axios.post(`${UPLOAD_API}/upload`, formData, {
                    headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
                  });
                  if (res.data.code === 0) {
                    form.setFieldsValue({ coverImage: res.data.data.url });
                    message.success('\u5c01\u9762\u4e0a\u4f20\u6210\u529f');
                  }
                } catch { message.error('\u4e0a\u4f20\u5931\u8d25'); }
                return false;
              }}><UploadOutlined style={{ cursor: 'pointer' }} /></Upload>
            } />
          </Form.Item>
          {selectedType === 'video' && (
            <Form.Item name="videoUrl" label={"\u89c6\u9891\u5730\u5740"}>
              <Input placeholder={"\u8f93\u5165\u89c6\u9891URL\u6216\u4e0a\u4f20"} addonAfter={
                <Upload accept="video/*" showUploadList={false} beforeUpload={async (file) => {
                  const formData = new FormData();
                  formData.append('file', file);
                  try {
                    const res = await axios.post(`${UPLOAD_API}/upload/video`, formData, {
                      headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
                    });
                    if (res.data.code === 0) {
                      form.setFieldsValue({ videoUrl: res.data.data.url });
                      message.success('\u89c6\u9891\u4e0a\u4f20\u6210\u529f');
                    }
                  } catch { message.error('\u4e0a\u4f20\u5931\u8d25'); }
                  return false;
                }}><UploadOutlined style={{ cursor: 'pointer' }} /></Upload>
              } />
            </Form.Item>
          )}
          {selectedType === 'whitepaper' && (
            <Form.Item name="documentUrl" label={"\u6587\u6863\u5730\u5740"}>
              <Input placeholder={"\u8f93\u5165\u6587\u6863URL"} />
            </Form.Item>
          )}
          <Form.Item name="status" label={"\u72b6\u6001"}>
            <Select>
              <Select.Option value="draft">{'\u8349\u7a3f'}</Select.Option>
              <Select.Option value="published">{'\u53d1\u5e03'}</Select.Option>
              <Select.Option value="archived">{'\u5f52\u6863'}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="tags" label={"\u6807\u7b7e"}>
            <Input placeholder={"\u9017\u53f7\u5206\u9694\uff0c\u5982\uff1a\u79d1\u6280,\u8425\u9500,\u4ea7\u54c1"} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title={detail?.title} open={drawerVisible}
        onClose={() => { setDrawerVisible(false); setDetail(null); }} width={500}>
        {detail && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label={"\u7c7b\u578b"}>
                {(() => { const c = typeConfig[detail.type]; return c ? <Tag color={c.color} icon={c.icon}>{c.label}</Tag> : detail.type; })()}
              </Descriptions.Item>
              <Descriptions.Item label={"\u72b6\u6001"}>
                {(() => { const c = statusConfig[detail.status]; return c ? <Tag color={c.color}>{c.label}</Tag> : detail.status; })()}
              </Descriptions.Item>
              <Descriptions.Item label={"\u6458\u8981"}>{detail.summary || '-'}</Descriptions.Item>
              {detail.videoUrl && <Descriptions.Item label={"\u89c6\u9891"}><a href={detail.videoUrl.startsWith('/') ? API_BASE_URL + detail.videoUrl : detail.videoUrl} target="_blank" rel="noreferrer">{'\u64ad\u653e\u89c6\u9891'}</a></Descriptions.Item>}
              {detail.documentUrl && <Descriptions.Item label={"\u6587\u6863"}><a href={detail.documentUrl} target="_blank" rel="noreferrer">{'\u67e5\u770b\u6587\u6863'}</a></Descriptions.Item>}
              <Descriptions.Item label={"\u5c01\u9762"}>{detail.coverImage ? <img src={detail.coverImage.startsWith('/') ? API_BASE_URL + detail.coverImage : detail.coverImage} alt="" style={{ maxWidth: 200 }} /> : '-'}</Descriptions.Item>
              <Descriptions.Item label={"\u6807\u7b7e"}>{detail.tags || '-'}</Descriptions.Item>
              <Descriptions.Item label={"\u6d4f\u89c8/\u5206\u4eab"}>{detail.viewCount} / {detail.shareCount}</Descriptions.Item>
              <Descriptions.Item label={"\u521b\u5efa\u65f6\u95f4"}>{new Date(detail.createdAt).toLocaleString('zh-CN')}</Descriptions.Item>
            </Descriptions>
            {detail.content && (
              <Card size="small" title={"\u6b63\u6587"} style={{ marginTop: 16 }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{detail.content}</div>
              </Card>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}

// ==================== Video Library ====================

function VideoLibrary() {
  const [videos, setVideos] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [current, setCurrent] = useState<ContentItem | null>(null);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '100', type: 'video' });
      if (search) params.append('search', search);
      const res = await axios.get(`${ADMIN_API}/articles?${params}`, { headers: getAuthHeaders() });
      if (res.data.code === 0 || res.data.code === 200) {
        setVideos(res.data.data?.list || []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVideos(); }, []);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const isEdit = !!current;
      const url = isEdit ? `${ADMIN_API}/articles/${current.id}` : `${ADMIN_API}/articles`;
      const method = isEdit ? 'put' : 'post';
      const res = await axios[method](url, { ...values, type: 'video' }, { headers: getAuthHeaders() });
      if (res.data.code === 0 || res.data.code === 200) {
        message.success(isEdit ? '\u89c6\u9891\u66f4\u65b0\u6210\u529f' : '\u89c6\u9891\u6dfb\u52a0\u6210\u529f');
        setModalVisible(false);
        form.resetFields();
        setCurrent(null);
        fetchVideos();
      }
    } catch (e: any) {
      if (!e.errorFields) message.error('\u64cd\u4f5c\u5931\u8d25');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axios.delete(`${ADMIN_API}/articles/${id}`, { headers: getAuthHeaders() });
      if (res.data.code === 0 || res.data.code === 200) {
        message.success('\u5220\u9664\u6210\u529f');
        fetchVideos();
      }
    } catch { message.error('\u5220\u9664\u5931\u8d25'); }
  };

  const handleVideoUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post(`${UPLOAD_API}/upload/video`, formData, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.code === 0) {
        form.setFieldsValue({ videoUrl: res.data.data.url });
        if (!form.getFieldValue('title')) {
          form.setFieldsValue({ title: file.name.replace(/\.[^.]+$/, '') });
        }
        message.success('\u89c6\u9891\u4e0a\u4f20\u6210\u529f');
      }
    } catch { message.error('\u89c6\u9891\u4e0a\u4f20\u5931\u8d25'); }
    finally { setUploading(false); }
    return false;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space>
          <Input placeholder={"\u641c\u7d22\u89c6\u9891..."} prefix={<SearchOutlined />} value={search}
            onChange={e => setSearch(e.target.value)} onPressEnter={fetchVideos} style={{ width: 220 }} allowClear />
          <Button icon={<ReloadOutlined />} onClick={fetchVideos}>{'\u5237\u65b0'}</Button>
        </Space>
        <Button type="primary" icon={<UploadOutlined />}
          onClick={() => { form.resetFields(); setCurrent(null); setModalVisible(true); }}>{'\u6dfb\u52a0\u89c6\u9891'}</Button>
      </div>

      {videos.length === 0 ? (
        <Empty description={"\u6682\u65e0\u89c6\u9891\uff0c\u70b9\u51fb\u4e0a\u65b9\u6309\u94ae\u6dfb\u52a0"} style={{ padding: 60 }} />
      ) : (
        <Row gutter={[16, 16]}>
          {videos.map(v => (
            <Col key={v.id} xs={24} sm={12} md={8} lg={6}>
              <Card hoverable size="small"
                cover={
                  <div style={{ height: 160, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderRadius: '8px 8px 0 0', overflow: 'hidden' }}>
                    {v.coverImage ? (
                      <img src={v.coverImage.startsWith('/') ? API_BASE_URL + v.coverImage : v.coverImage} alt={v.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <PlayCircleOutlined style={{ fontSize: 48, color: '#fff' }} />
                    )}
                    <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                      <Tag color="orange" style={{ margin: 0 }}>{'\u89c6\u9891'}</Tag>
                    </div>
                  </div>
                }
                actions={[
                  <Tooltip title={"\u7f16\u8f91"} key="edit">
                    <EditOutlined onClick={() => {
                      setCurrent(v);
                      form.setFieldsValue({ title: v.title, summary: v.summary, videoUrl: v.videoUrl, coverImage: v.coverImage, tags: v.tags, status: v.status });
                      setModalVisible(true);
                    }} />
                  </Tooltip>,
                  <Tooltip title={"\u590d\u5236\u94fe\u63a5"} key="copy">
                    <CopyOutlined onClick={() => {
                      const url = v.videoUrl?.startsWith('/') ? API_BASE_URL + v.videoUrl : v.videoUrl;
                      navigator.clipboard.writeText(url || '');
                      message.success('\u94fe\u63a5\u5df2\u590d\u5236');
                    }} />
                  </Tooltip>,
                  <Popconfirm title={"\u786e\u5b9a\u5220\u9664\u6b64\u89c6\u9891\uff1f"} onConfirm={() => handleDelete(v.id)} key="del">
                    <DeleteOutlined style={{ color: '#ff4d4f' }} />
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  title={<Text ellipsis style={{ fontSize: 13 }}>{v.title}</Text>}
                  description={<Text type="secondary" style={{ fontSize: 11 }}>{v.status === 'published' ? '\u5df2\u53d1\u5e03' : '\u8349\u7a3f'} {'\u00b7'} {new Date(v.createdAt).toLocaleDateString('zh-CN')}</Text>}
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal title={current ? '\u7f16\u8f91\u89c6\u9891' : '\u6dfb\u52a0\u89c6\u9891'} open={modalVisible}
        onOk={handleSubmit} onCancel={() => { setModalVisible(false); form.resetFields(); setCurrent(null); }}
        width={560} destroyOnClose okText={current ? '\u66f4\u65b0' : '\u6dfb\u52a0'} cancelText={"\u53d6\u6d88"}>
        <Form form={form} layout="vertical" initialValues={{ status: 'draft' }}>
          <Form.Item label={"\u4e0a\u4f20\u89c6\u9891\u6587\u4ef6"}>
            <Upload accept="video/*" showUploadList={false} beforeUpload={handleVideoUpload} disabled={uploading}>
              <Button icon={<UploadOutlined />} loading={uploading} block>
                {uploading ? '\u4e0a\u4f20\u4e2d...' : '\u9009\u62e9\u89c6\u9891\u6587\u4ef6\u4e0a\u4f20\uff08\u6700\u5927 100MB\uff09'}
              </Button>
            </Upload>
          </Form.Item>
          <Form.Item name="title" label={"\u89c6\u9891\u6807\u9898"} rules={[{ required: true, message: '\u8bf7\u8f93\u5165\u89c6\u9891\u6807\u9898' }]}>
            <Input placeholder={"\u8bf7\u8f93\u5165\u89c6\u9891\u6807\u9898"} />
          </Form.Item>
          <Form.Item name="videoUrl" label={"\u89c6\u9891\u5730\u5740"} rules={[{ required: true, message: '\u8bf7\u8f93\u5165\u6216\u4e0a\u4f20\u89c6\u9891\u5730\u5740' }]}>
            <Input placeholder={"\u89c6\u9891URL\uff08\u652f\u6301\u4e0a\u4f20\u6216\u5916\u90e8\u94fe\u63a5\uff09"} />
          </Form.Item>
          <Form.Item name="coverImage" label={"\u5c01\u9762\u56fe"}>
            <Input placeholder={"\u5c01\u9762\u56feURL\uff08\u53ef\u9009\uff09"} />
          </Form.Item>
          <Form.Item name="summary" label={"\u7b80\u4ecb"}>
            <TextArea placeholder={"\u89c6\u9891\u7b80\u4ecb"} rows={2} />
          </Form.Item>
          <Form.Item name="tags" label={"\u6807\u7b7e"}>
            <Input placeholder={"\u9017\u53f7\u5206\u9694"} />
          </Form.Item>
          <Form.Item name="status" label={"\u72b6\u6001"}>
            <Select>
              <Select.Option value="draft">{'\u8349\u7a3f'}</Select.Option>
              <Select.Option value="published">{'\u53d1\u5e03'}</Select.Option>
              <Select.Option value="archived">{'\u5f52\u6863'}</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ==================== Main Component ====================

export default function PageBuilder() {
  const [activeTab, setActiveTab] = useState('images');

  return (
    <div>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={<span><PictureOutlined /> {'\u56fe\u7247\u5e93'}</span>} key="images">
            <ImageLibrary />
          </TabPane>
          <TabPane tab={<span><FileTextOutlined /> {'\u6587\u6848\u5e93'}</span>} key="content">
            <ContentLibrary />
          </TabPane>
          <TabPane tab={<span><VideoCameraOutlined /> {'\u89c6\u9891\u5e93'}</span>} key="videos">
            <VideoLibrary />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}
