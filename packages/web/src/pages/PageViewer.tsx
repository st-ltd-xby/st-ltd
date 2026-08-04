import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Spin, Result, Button } from 'antd';
import { ArrowLeftOutlined, PictureOutlined, PhoneOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { Title, Text, Paragraph } = Typography;

// 解析图片 URL（相对路径拼接后端地址）
const resolveImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

// 图片组件（带加载失败回退）
function ImageComponent({ props }: { props: any }) {
  const [imgError, setImgError] = useState(false);
  const resolvedUrl = resolveImageUrl(props.url);
  if (!resolvedUrl || imgError) {
    return (
      <div style={{ width: props.width || '100%', height: 200, background: '#f5f5f5', borderRadius: props.borderRadius || 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', margin: '12px 0', border: '1px dashed #d9d9d9' }}>
        <PictureOutlined style={{ fontSize: 24, marginRight: 8 }} /> {props.url ? '图片加载失败' : '图片（请在编辑器中设置图片URL）'}
      </div>
    );
  }
  return <img src={resolvedUrl} alt={props.alt} style={{ width: props.width, height: props.height, borderRadius: props.borderRadius, display: 'block', margin: '12px 0' }} onError={() => setImgError(true)} />;
}

// 组件渲染（与PageBuilder一致）
function RenderPageComponent({ comp }: { comp: any }) {
  const { type, props } = comp;

  switch (type) {
    case 'heading':
    case 'title': {
      const text = props.content || props.text || '';
      const style: React.CSSProperties = { textAlign: props.align || 'left', color: props.color || '#333', margin: 0, fontSize: props.fontSize };
      if (props.level) {
        switch (props.level) {
          case 1: return <h1 style={style}>{text}</h1>;
          case 3: return <h3 style={style}>{text}</h3>;
          case 4: return <h4 style={style}>{text}</h4>;
          default: return <h2 style={style}>{text}</h2>;
        }
      }
      // 管理端 title 组件：根据 fontSize 决定标签
      const size = props.fontSize || 28;
      if (size >= 32) return <h1 style={style}>{text}</h1>;
      if (size >= 24) return <h2 style={style}>{text}</h2>;
      if (size >= 20) return <h3 style={style}>{text}</h3>;
      return <h4 style={style}>{text}</h4>;
    }
    case 'text':
      return <p style={{ fontSize: props.fontSize, color: props.color, textAlign: props.align, margin: '12px 0', lineHeight: props.lineHeight }}>{props.content || props.text || ''}</p>;
    case 'image':
      return <ImageComponent props={props} />;
    case 'button':
      return (
        <div style={{ textAlign: 'center', margin: '12px 0' }}>
          <Button type="primary" size={props.size} style={{ background: props.color, borderColor: props.color }} href={props.url || props.link}>
            {props.text}
          </Button>
        </div>
      );
    case 'divider':
      return <div style={{ margin: '16px 0' }}><hr style={{ border: 'none', borderTop: `1px solid ${props.color}`, margin: 0 }} />{props.text && <Text type="secondary" style={{ background: '#fff', padding: '0 12px' }}>{props.text}</Text>}</div>;
    case 'spacer':
    case 'spacing':
      return <div style={{ height: props.height }} />;
    case 'video':
      return props.url ? (
        <video src={props.url} style={{ width: props.width, height: props.height, borderRadius: 8, margin: '12px 0' }} controls />
      ) : null;
    case 'form': {
      const formFields = Array.isArray(props.fields)
        ? props.fields
        : (props.fields || '').split(',').map((f: string) => ({ name: f.trim(), type: 'text', required: true }));
      return (
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 24, margin: '12px 0' }}>
          <Title level={4} style={{ marginTop: 0 }}>{props.title}</Title>
          {formFields.map((f: any, i: number) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>{f.name || f}</Text>
              {f.type === 'textarea' ? (
                <textarea style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, minHeight: 80 }} />
              ) : (
                <input type={f.type === 'tel' ? 'tel' : f.type === 'email' ? 'email' : 'text'} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14 }} />
              )}
            </div>
          ))}
          <Button type="primary" block size="large">{props.submitText || '提交'}</Button>
        </div>
      );
    }
    case 'contact':
      return (
        <div style={{ background: '#fafafa', padding: 24, borderRadius: 8, border: '1px solid #f0f0f0', margin: '12px 0' }}>
          {props.title && <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>{props.title}</Title>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserOutlined style={{ color: '#999' }} /> <span style={{ color: '#999', minWidth: 60 }}>联系人：</span>
              <span style={{ color: '#333' }}>{props.name || '-'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MailOutlined style={{ color: '#999' }} /> <span style={{ color: '#999', minWidth: 60 }}>邮箱：</span>
              <a href={`mailto:${props.email}`} style={{ color: '#1677ff' }}>{props.email || '-'}</a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PhoneOutlined style={{ color: '#999' }} /> <span style={{ color: '#999', minWidth: 60 }}>电话：</span>
              <a href={`tel:${props.phone}`} style={{ color: '#333' }}>{props.phone || '-'}</a>
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
}

export default function PageViewer() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/api/v1/cms/pages/${slug}/public`);
        if (res.data.code === 0) {
          setPage(res.data.data);
          // 设置页面标题
          document.title = res.data.data.seoTitle || res.data.data.title || 'ST-LTD';
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
        <Result
          status="404"
          title="页面不存在"
          subTitle="该页面可能未发布或已被删除"
          extra={<Button type="primary" onClick={() => navigate('/')}>返回首页</Button>}
        />
      </div>
    );
  }

  let components: any[] = [];
  try {
    components = typeof page.content === 'string' ? JSON.parse(page.content) : (page.content || []);
  } catch {
    components = [];
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* 顶部导航 */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
          <Text strong style={{ fontSize: 16 }}>{page.site?.name || 'ST-LTD'}</Text>
        </div>
        <Text type="secondary" style={{ fontSize: 12 }}>ST-LTD 运营系统</Text>
      </div>

      {/* 页面内容 */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: '48px 40px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          {components.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: 60 }}>
              <Title level={3} style={{ color: '#999' }}>{page.title}</Title>
              <Text>页面内容为空</Text>
            </div>
          ) : (
            components.map((comp) => (
              <RenderPageComponent key={comp.id} comp={comp} />
            ))
          )}
        </div>

        {/* 底部信息 */}
        <div style={{ textAlign: 'center', marginTop: 24, color: '#999', fontSize: 12 }}>
          <Text type="secondary">Powered by ST-LTD 运营系统</Text>
        </div>
      </div>
    </div>
  );
}
