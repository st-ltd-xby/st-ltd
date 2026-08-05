import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Typography, Spin, Result, Button, Form, Input, message } from 'antd';
import { ArrowLeftOutlined, PictureOutlined, PhoneOutlined, MailOutlined, UserOutlined, SendOutlined } from '@ant-design/icons';
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

// 表单提交组件
function FormBlock({ props: formProps, fields }: { props: any; fields: any[] }) {
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/api/v1/public/form-submit`, {
        formId: formProps.formId || formProps.id || 'embedded',
        tenantId: formProps.tenantId || 'test-tenant-001',
        name: values.name || values.姓名 || '',
        phone: values.phone || values.电话 || values.手机 || '',
        email: values.email || values.邮箱 || '',
        company: values.company || values.公司 || '',
        message: values.message || values.留言 || values.需求 || '',
      });
      message.success('提交成功，我们会尽快联系您！');
      form.resetFields();
    } catch (err: any) {
      message.error(err?.response?.data?.message || '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 根据 fields 配置渲染表单项
  const fieldLabelMap: Record<string, { label: string; name: string; type: string; required: boolean }> = {
    'name': { label: '姓名', name: 'name', type: 'text', required: true },
    '姓名': { label: '姓名', name: 'name', type: 'text', required: true },
    'phone': { label: '电话', name: 'phone', type: 'text', required: false },
    '电话': { label: '电话', name: 'phone', type: 'text', required: false },
    '手机': { label: '手机', name: 'phone', type: 'text', required: false },
    'email': { label: '邮箱', name: 'email', type: 'email', required: false },
    '邮箱': { label: '邮箱', name: 'email', type: 'email', required: false },
    'company': { label: '公司', name: 'company', type: 'text', required: false },
    '公司': { label: '公司', name: 'company', type: 'text', required: false },
    'message': { label: '留言', name: 'message', type: 'textarea', required: false },
    '留言': { label: '留言', name: 'message', type: 'textarea', required: false },
    '需求': { label: '需求描述', name: 'message', type: 'textarea', required: false },
  };

  const renderFields = fields.map((f: any) => {
    const fieldName = typeof f === 'string' ? f : (f.name || f.field || '');
    const mapped = fieldLabelMap[fieldName] || { label: fieldName, name: fieldName, type: 'text', required: false };
    return { ...mapped, ...f, label: mapped.label, name: mapped.name };
  });

  return (
    <div style={{ background: '#f8faff', padding: 24, borderRadius: 8, border: '1px solid #e8f0fe', margin: '16px 0' }}>
      {formProps.title && <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>{formProps.title}</Title>}
      {formProps.description && <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>{formProps.description}</Text>}
      <Form form={form} onFinish={handleSubmit} layout="vertical" size="middle">
        {renderFields.map((field: any, idx: number) => (
          <Form.Item key={idx} name={field.name} label={field.label} rules={field.required ? [{ required: true, message: `请输入${field.label}` }] : []}>
            {field.type === 'textarea' ? (
              <Input.TextArea rows={3} placeholder={`请输入${field.label}`} />
            ) : (
              <Input placeholder={`请输入${field.label}`} />
            )}
          </Form.Item>
        ))}
        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={submitting} icon={<SendOutlined />}>
            {formProps.buttonText || '提交'}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

// 组件渲染（与PageBuilder一致）
function RenderPageComponent({ comp, tenantId }: { comp: any; tenantId?: string }) {
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
      return <FormBlock props={{ ...props, tenantId }} fields={formFields} />;
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
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 生成访客指纹（基于浏览器特征）
  const getVisitorId = () => {
    const nav = navigator as any;
    return btoa(`${nav.userAgent}${nav.language}${screen.width}x${screen.height}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  };

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/api/v1/cms/pages/${slug}/public`);
        if (res.data.code === 0) {
          const pageData = res.data.data;
          setPage(pageData);
          document.title = pageData.seoTitle || pageData.title || 'ST-LTD';

          // 检测是否通过推广短链访问
          const promoCode = searchParams.get('promo');
          if (promoCode) {
            const visitorId = getVisitorId();
            // 发送追踪请求（含 promoCode），后端自动创建线索
            fetch(`${API_BASE_URL}/api/v1/visitor/track`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tenantId: pageData.tenantId || 'test-tenant-001',
                visitorId,
                type: 'pageview',
                url: window.location.href,
                title: pageData.title,
                timestamp: Date.now(),
                ua: navigator.userAgent,
                screen: { width: screen.width, height: screen.height },
                viewport: { width: window.innerWidth, height: window.innerHeight },
                lang: navigator.language,
                promoCode,
              }),
            }).catch(() => {}); // 追踪失败不影响页面
          }
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
              <RenderPageComponent key={comp.id} comp={comp} tenantId={page.tenantId} />
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
