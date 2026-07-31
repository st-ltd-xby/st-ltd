import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  message, 
  Switch, 
  InputNumber, 
  Select, 
  Slider,
  Radio,
  Upload,
  Alert,
  Space,
  Divider,
  Collapse,
  Tag
} from 'antd';
import { 
  SaveOutlined, 
  ApiOutlined, 
  CloudSyncOutlined,
  SecurityScanOutlined,
  DatabaseOutlined,
  LockOutlined,
  GlobalOutlined,
  NotificationOutlined,
  MailOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  TeamOutlined,
  KeyOutlined,
  FileTextOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  FileProtectOutlined,
  SafetyCertificateOutlined,
  RobotOutlined,
  SearchOutlined,
  ToolOutlined,
  SettingOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  UploadOutlined,
  BookOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

const SystemSettings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'basic';
  const setActiveTab = (key: string) => setSearchParams({ tab: key });
  const [generalForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [apiForm] = Form.useForm();
  const [integrationForm] = Form.useForm();
  const [backupForm] = Form.useForm();
  const [notifForm] = Form.useForm();
  
  const handleGeneralSubmit = async (values: any) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_BASE_URL}/api/v1/admin/settings/general`, values, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.code === 0 || response.data.code === 200) {
        message.success('通用设置保存成功');
      } else {
        message.error(response.data.message || '保存失败');
      }
    } catch (error: any) {
      console.error('Error saving general settings:', error);
      message.error(error.response?.data?.message || '保存失败');
    }
  };
  
  const handleSecuritySubmit = async (values: any) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_BASE_URL}/api/v1/admin/settings/security`, values, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.code === 0 || response.data.code === 200) {
        message.success('安全设置保存成功');
      } else {
        message.error(response.data.message || '保存失败');
      }
    } catch (error: any) {
      console.error('Error saving security settings:', error);
      message.error(error.response?.data?.message || '保存失败');
    }
  };
  
  const handleApiSubmit = async (values: any) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_BASE_URL}/api/v1/admin/settings/api`, values, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.code === 0 || response.data.code === 200) {
        message.success('API设置保存成功');
      } else {
        message.error(response.data.message || '保存失败');
      }
    } catch (error: any) {
      console.error('Error saving API settings:', error);
      message.error(error.response?.data?.message || '保存失败');
    }
  };
  
  const handleIntegrationSubmit = async (values: any) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_BASE_URL}/api/v1/admin/settings/integration`, values, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.code === 0 || response.data.code === 200) {
        message.success('集成设置保存成功');
      } else {
        message.error(response.data.message || '保存失败');
      }
    } catch (error: any) {
      console.error('Error saving integration settings:', error);
      message.error(error.response?.data?.message || '保存失败');
    }
  };
  
  const handleBackupSubmit = async (values: any) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_BASE_URL}/api/v1/admin/settings/backup`, values, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.code === 0 || response.data.code === 200) {
        message.success('备份设置保存成功');
      } else {
        message.error(response.data.message || '保存失败');
      }
    } catch (error: any) {
      console.error('Error saving backup settings:', error);
      message.error(error.response?.data?.message || '保存失败');
    }
  };
  
  const handleNotifSubmit = async (values: any) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_BASE_URL}/api/v1/admin/settings/notification`, values, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.code === 0 || response.data.code === 200) {
        message.success('通知设置保存成功');
      } else {
        message.error(response.data.message || '保存失败');
      }
    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      message.error(error.response?.data?.message || '保存失败');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'basic': return (
            <Form
              form={generalForm}
              layout="vertical"
              onFinish={handleGeneralSubmit}
              initialValues={{
                siteName: 'ST-LTD 运营系统',
                siteDescription: '企业数字化营销管理平台',
                siteDomain: 'https://st-ltd-web.pages.dev',
                contactEmail: 'admin@ltd.com',
                contactPhone: '400-123-4567',
                timezone: 'Asia/Shanghai',
                language: 'zh-CN',
                icpNumber: '',
                currency: 'CNY',
                status: true,
                logoUrl: '',
                faviconUrl: '',
              }}
            >
              <Collapse defaultActiveKey={['basic-info', 'contact-info']}>
                <Panel header="基本信息" key="basic-info">
                  <Form.Item
                    name="siteName"
                    label="网站名称"
                    rules={[{ required: true, message: '请输入网站名称!' }]}
                  >
                    <Input placeholder="请输入网站名称" />
                  </Form.Item>
                  
                  <Form.Item
                    name="siteDescription"
                    label="网站描述"
                    rules={[{ required: true, message: '请输入网站描述!' }]}
                  >
                    <TextArea rows={3} placeholder="请输入网站描述" />
                  </Form.Item>
                  
                  <Form.Item
                    name="siteDomain"
                    label="网站域名"
                    rules={[{ required: true, message: '请输入网站域名!' }]}
                  >
                    <Input placeholder="请输入网站域名" />
                  </Form.Item>
                  
                  <Form.Item
                    name="timezone"
                    label="时区"
                  >
                    <Select placeholder="请选择时区">
                      <Option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</Option>
                      <Option value="Asia/Tokyo">亚洲/东京 (UTC+9)</Option>
                      <Option value="America/New_York">美洲/纽约 (UTC-5)</Option>
                      <Option value="Europe/London">欧洲/伦敦 (UTC+0)</Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item
                    name="language"
                    label="默认语言"
                  >
                    <Select placeholder="请选择默认语言">
                      <Option value="zh-CN">简体中文</Option>
                      <Option value="en-US">English</Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item
                    name="icpNumber"
                    label="ICP 备案号"
                  >
                    <Input placeholder="如：京ICP备XXXXXXXX号" />
                  </Form.Item>
                  
                  <Form.Item
                    name="currency"
                    label="货币单位"
                  >
                    <Select placeholder="请选择货币单位">
                      <Option value="CNY">人民币 (CNY)</Option>
                      <Option value="USD">美元 (USD)</Option>
                      <Option value="EUR">欧元 (EUR)</Option>
                      <Option value="JPY">日元 (JPY)</Option>
                    </Select>
                  </Form.Item>
                </Panel>
                
                <Panel header="站点 Logo" key="logo-info">
                  <Form.Item name="logoUrl" label="站点 Logo">
                    <Upload maxCount={1} beforeUpload={() => false}>
                      <Button icon={<UploadOutlined />}>上传 Logo</Button>
                    </Upload>
                  </Form.Item>
                  <Form.Item name="faviconUrl" label="Favicon 图标">
                    <Upload maxCount={1} beforeUpload={() => false}>
                      <Button icon={<UploadOutlined />}>上传 Favicon</Button>
                    </Upload>
                  </Form.Item>
                </Panel>
                
                <Panel header="联系信息" key="contact-info">
                  <Form.Item
                    name="contactEmail"
                    label="联系邮箱"
                    rules={[
                      { required: true, message: '请输入联系邮箱!' },
                      { type: 'email', message: '请输入有效的邮箱!' }
                    ]}
                  >
                    <Input placeholder="请输入联系邮箱" />
                  </Form.Item>
                  
                  <Form.Item
                    name="contactPhone"
                    label="联系电话"
                    rules={[{ required: true, message: '请输入联系电话!' }]}
                  >
                    <Input placeholder="请输入联系电话" />
                  </Form.Item>
                  
                  <Form.Item
                    name="address"
                    label="公司地址"
                  >
                    <TextArea rows={3} placeholder="请输入公司地址" />
                  </Form.Item>
                </Panel>
                
                <Panel header="网站状态" key="status">
                  <Form.Item
                    name="status"
                    label="网站状态"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="开启" unCheckedChildren="维护" />
                  </Form.Item>
                  
                  <Form.Item
                    name="maintenanceMsg"
                    label="维护模式消息"
                    dependencies={['status']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('status') === false ? (
                        <Form.Item name="maintenanceMsg">
                          <TextArea rows={3} placeholder="请输入维护模式下的提示消息" />
                        </Form.Item>
                      ) : null
                    )}
                  </Form.Item>
                </Panel>
              </Collapse>
              
              <Divider />
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}> 
                  保存基础设置
                </Button>
              </Form.Item>
              </Form>
      );
      case 'notification': return (
            <Form
              form={notifForm}
              layout="vertical"
              onFinish={handleNotifSubmit}
              initialValues={{
                emailNotify: true,
                smsNotify: false,
                wechatNotify: true,
                newLeadNotify: true,
                newOrderNotify: true,
                newCustomerNotify: true,
                systemAlertNotify: true,
              }}
            >
              <Collapse defaultActiveKey={['notif-channels', 'notif-events']}>
                <Panel header="通知渠道" key="notif-channels">
                  <Form.Item name="emailNotify" label="邮件通知" valuePropName="checked">
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                  <Form.Item name="smsNotify" label="短信通知" valuePropName="checked">
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                  <Form.Item name="wechatNotify" label="微信通知" valuePropName="checked">
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                </Panel>
                <Panel header="通知事件" key="notif-events">
                  <Form.Item name="newLeadNotify" label="新线索通知" valuePropName="checked">
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                  <Form.Item name="newCustomerNotify" label="新客户通知" valuePropName="checked">
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                  <Form.Item name="newOrderNotify" label="新订单通知" valuePropName="checked">
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                  <Form.Item name="systemAlertNotify" label="系统预警通知" valuePropName="checked">
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                </Panel>
              </Collapse>
              <Divider />
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}> 
                  保存通知设置
                </Button>
              </Form.Item>
            </Form>
      );
      case 'security': return (
            <Form
              form={securityForm}
              layout="vertical"
              onFinish={handleSecuritySubmit}
              initialValues={{
                enableTwoFactorAuth: false,
                sessionTimeout: 30,
                passwordMinLength: 8,
                enableBruteForceProtection: true,
                maxLoginAttempts: 5,
                lockoutDuration: 30,
                enableIpWhitelist: false,
                sslEnabled: true,
              }}
            >
              <Collapse defaultActiveKey={['auth-security', 'password-policy', 'ip-security']}>
                <Panel header="认证安全" key="auth-security">
                  <Form.Item
                    name="enableTwoFactorAuth"
                    label="双因素认证"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                  </Form.Item>
                  
                  <Form.Item
                    name="sessionTimeout"
                    label="会话超时(分钟)"
                    rules={[{ required: true, message: '请输入会话超时时间!' }]}
                  >
                    <Slider min={5} max={120} tooltip={{ formatter: (value) => `${value} 分钟` }} />
                  </Form.Item>
                  
                  <Form.Item
                    name="enableBruteForceProtection"
                    label="暴力破解防护"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                  </Form.Item>
                  
                  <Form.Item
                    name="maxLoginAttempts"
                    label="最大登录尝试次数"
                    dependencies={['enableBruteForceProtection']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('enableBruteForceProtection') ? (
                        <Form.Item name="maxLoginAttempts">
                          <InputNumber min={1} max={10} style={{ width: '100%' }} />
                        </Form.Item>
                      ) : null
                    )}
                  </Form.Item>
                  
                  <Form.Item
                    name="lockoutDuration"
                    label="锁定持续时间(分钟)"
                    dependencies={['enableBruteForceProtection']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('enableBruteForceProtection') ? (
                        <Form.Item name="lockoutDuration">
                          <InputNumber min={1} max={60} style={{ width: '100%' }} />
                        </Form.Item>
                      ) : null
                    )}
                  </Form.Item>
                </Panel>
                
                <Panel header="密码策略" key="password-policy">
                  <Form.Item
                    name="passwordMinLength"
                    label="最小密码长度"
                    rules={[{ required: true, message: '请输入最小密码长度!' }]}
                  >
                    <InputNumber min={6} max={20} style={{ width: '100%' }} />
                  </Form.Item>
                  
                  <Form.Item
                    name="requireUppercase"
                    label="要求大写字母"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="是" unCheckedChildren="否" />
                  </Form.Item>
                  
                  <Form.Item
                    name="requireLowercase"
                    label="要求小写字母"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="是" unCheckedChildren="否" />
                  </Form.Item>
                  
                  <Form.Item
                    name="requireNumbers"
                    label="要求数字"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="是" unCheckedChildren="否" />
                  </Form.Item>
                  
                  <Form.Item
                    name="requireSymbols"
                    label="要求特殊字符"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="是" unCheckedChildren="否" />
                  </Form.Item>
                </Panel>
                
                <Panel header="IP安全" key="ip-security">
                  <Form.Item
                    name="enableIpWhitelist"
                    label="IP白名单"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                  </Form.Item>
                  
                  <Form.Item
                    name="allowedIps"
                    label="允许的IP地址"
                    dependencies={['enableIpWhitelist']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('enableIpWhitelist') ? (
                        <Form.Item name="allowedIps">
                          <TextArea rows={4} placeholder="请输入允许的IP地址，每行一个，支持CIDR格式，例如：\n192.168.1.0/24\n10.0.0.1" />
                        </Form.Item>
                      ) : null
                    )}
                  </Form.Item>
                  
                  <Form.Item
                    name="sslEnabled"
                    label="强制HTTPS"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                  </Form.Item>
                </Panel>
              </Collapse>
              
              <Divider />
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SecurityScanOutlined />}> 
                  保存安全设置
                </Button>
              </Form.Item>
              </Form>
      );
      case 'api': return (
            <Form
              form={apiForm}
              layout="vertical"
              onFinish={handleApiSubmit}
              initialValues={{
                apiRateLimit: 1000,
                apiTimeout: 30,
                enableCors: true,
                allowOrigin: '*',
                enableApiLogging: true,
                apiLogLevel: 'info',
                enableRequestValidation: true,
                enableResponseCompression: true,
              }}
            >
              <Collapse defaultActiveKey={['rate-limit', 'cors-settings', 'logging-settings']}>
                <Panel header="速率限制" key="rate-limit">
                  <Form.Item
                    name="apiRateLimit"
                    label="API速率限制(次/分钟)"
                    rules={[{ required: true, message: '请输入API速率限制!' }]}
                  >
                    <InputNumber min={1} max={10000} style={{ width: '100%' }} />
                  </Form.Item>
                  
                  <Form.Item
                    name="apiTimeout"
                    label="API超时时间(秒)"
                    rules={[{ required: true, message: '请输入API超时时间!' }]}
                  >
                    <InputNumber min={1} max={300} style={{ width: '100%' }} />
                  </Form.Item>
                  
                  <Form.Item
                    name="enableRequestValidation"
                    label="请求验证"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                  </Form.Item>
                </Panel>
                
                <Panel header="跨域设置" key="cors-settings">
                  <Form.Item
                    name="enableCors"
                    label="启用CORS"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                  </Form.Item>
                  
                  <Form.Item
                    name="allowOrigin"
                    label="允许的源"
                    dependencies={['enableCors']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('enableCors') ? (
                        <Form.Item name="allowOrigin">
                          <Input placeholder="例如: https://example.com 或 *" />
                        </Form.Item>
                      ) : null
                    )}
                  </Form.Item>
                  
                  <Form.Item
                    name="allowMethods"
                    label="允许的方法"
                    dependencies={['enableCors']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('enableCors') ? (
                        <Form.Item name="allowMethods">
                          <Input placeholder="例如: GET,POST,PUT,DELETE" />
                        </Form.Item>
                      ) : null
                    )}
                  </Form.Item>
                  
                  <Form.Item
                    name="allowHeaders"
                    label="允许的头部"
                    dependencies={['enableCors']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('enableCors') ? (
                        <Form.Item name="allowHeaders">
                          <Input placeholder="例如: Content-Type,Authorization" />
                        </Form.Item>
                      ) : null
                    )}
                  </Form.Item>
                </Panel>
                
                <Panel header="日志设置" key="logging-settings">
                  <Form.Item
                    name="enableApiLogging"
                    label="API日志记录"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                  </Form.Item>
                  
                  <Form.Item
                    name="apiLogLevel"
                    label="日志级别"
                    dependencies={['enableApiLogging']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('enableApiLogging') ? (
                        <Form.Item name="apiLogLevel">
                          <Radio.Group>
                            <Radio value="debug">调试</Radio>
                            <Radio value="info">信息</Radio>
                            <Radio value="warn">警告</Radio>
                            <Radio value="error">错误</Radio>
                          </Radio.Group>
                        </Form.Item>
                      ) : null
                    )}
                  </Form.Item>
                  
                  <Form.Item
                    name="enableResponseCompression"
                    label="响应压缩"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                  </Form.Item>
                </Panel>
              </Collapse>
              
              <Divider />
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<ApiOutlined />}> 
                  保存API设置
                </Button>
              </Form.Item>
              </Form>
      );
      case 'apidocs': return (
            <div style={{ padding: '20px' }}>
              <Alert
                message="API文档"
                description="以下是系统API接口文档，可用于查看和测试所有API接口"
                type="info"
                showIcon
                style={{ marginBottom: 20 }}
              />
              <div style={{ textAlign: 'center' }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => window.open(`${API_BASE_URL}/api-docs`, '_blank')}
                  icon={<BookOutlined />}
                >
                  打开API文档
                </Button>
              </div>
            </div>
      );
      case 'integration': return (
            <Form
              form={integrationForm}
              layout="vertical"
              onFinish={handleIntegrationSubmit}
              initialValues={{
                enableWechat: false,
                enableAlipay: false,
                enableBigModel: false,
                bigModelProvider: '',
                bigModelApiKey: '',
                searchEngineEnabled: true,
                enablePaymentGateway: false,
                enableCrmIntegration: false,
                crmProvider: '',
                crmApiKey: '',
                enableAnalytics: true,
                analyticsProvider: 'ga4',
                ga4MeasurementId: '',
              }}
            >
              <Collapse defaultActiveKey={['payment', 'ai-model', 'analytics', 'crm-integration']}>
                <Panel header="支付网关" key="payment">
                  <Form.Item
                    name="enablePaymentGateway"
                    label="支付网关集成"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                  </Form.Item>
                  
                  <Form.Item
                    name="paymentProvider"
                    label="支付提供商"
                    dependencies={['enablePaymentGateway']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('enablePaymentGateway') ? (
                        <Form.Item name="paymentProvider">
                          <Select placeholder="请选择支付提供商">
                            <Option value="alipay">支付宝</Option>
                            <Option value="wechatpay">微信支付</Option>
                            <Option value="paypal">PayPal</Option>
                            <Option value="stripe">Stripe</Option>
                          </Select>
                        </Form.Item>
                      ) : null
                    )}
                  </Form.Item>
                  
                  <Form.Item
                    name="paymentApiKey"
                    label="支付API密钥"
                    dependencies={['enablePaymentGateway']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('enablePaymentGateway') ? (
                        <Form.Item name="paymentApiKey">
                          <Input.Password placeholder="请输入支付API密钥" />
                        </Form.Item>
                      ) : null
                    )}
                  </Form.Item>
                </Panel>
                
                <Panel header="AI大模型集成" key="ai-model">
                  <Form.Item
                    name="enableBigModel"
                    label="大模型集成"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                  </Form.Item>
                  
                  <Form.Item
                    name="bigModelProvider"
                    label="大模型提供商"
                    dependencies={['enableBigModel']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('enableBigModel') ? (
                        <Form.Item name="bigModelProvider">
                          <Select placeholder="请选择大模型提供商">
                            <Option value="openai">OpenAI (GPT系列)</Option>
                            <Option value="anthropic">Anthropic (Claude)</Option>
                            <Option value="google">Google (Gemini)</Option>
                            <Option value="aliyun">阿里云 (通义千问)</Option>
                            <Option value="baidu">百度 (文心一言)</Option>
                            <Option value="tencent">腾讯 (混元)</Option>
                          </Select>
                        </Form.Item>
                      ) : null
                    )}
                  </Form.Item>
                  
                  <Form.Item
                    name="bigModelApiKey"
                    label="大模型API密钥"
                    dependencies={['enableBigModel']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('enableBigModel') ? (
                        <Form.Item name="bigModelApiKey">
                          <Input.Password placeholder="请输入大模型API密钥" />
                        </Form.Item>
                      ) : null
                    )}
                  </Form.Item>
                  
                  <Form.Item
                    name="enableBigModelLogging"
                    label="大模型调用日志"
                    dependencies={['enableBigModel']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('enableBigModel') ? (
                        <Form.Item name="enableBigModelLogging">
                          <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                        </Form.Item>
                      ) : null
                    )}
                  </Form.Item>
                </Panel>
                
                <Panel header="数据分析" key="analytics">
                  <Form.Item
                    name="enableAnalytics"
                    label="数据分析集成"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                  </Form.Item>
                  
                  <Form.Item
                    name="analyticsProvider"
                    label="分析提供商"
                    dependencies={['enableAnalytics']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('enableAnalytics') ? (
                        <Form.Item name="analyticsProvider">
                          <Select placeholder="请选择分析提供商">
                            <Option value="ga4">Google Analytics 4</Option>
                            <Option value="baidu-tongji">百度统计</Option>
                            <Option value="tencent-analytics">腾讯分析</Option>
                          </Select>
                        </Form.Item>
                      ) : null
                    )}
                  </Form.Item>
                  
                  <Form.Item
                    name="ga4MeasurementId"
                    label="GA4测量ID"
                    dependencies={['enableAnalytics', 'analyticsProvider']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('enableAnalytics') && getFieldValue('analyticsProvider') === 'ga4' ? (
                        <Form.Item name="ga4MeasurementId">
                          <Input placeholder="例如: G-XXXXXXXXXX" />
                        </Form.Item>
                      ) : null
                    )}
                  </Form.Item>
                </Panel>
                
                <Panel header="CRM集成" key="crm-integration">
                  <Form.Item
                    name="enableCrmIntegration"
                    label="CRM系统集成"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                  </Form.Item>
                  
                  <Form.Item
                    name="crmProvider"
                    label="CRM提供商"
                    dependencies={['enableCrmIntegration']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('enableCrmIntegration') ? (
                        <Form.Item name="crmProvider">
                          <Select placeholder="请选择CRM提供商">
                            <Option value="salesforce">Salesforce</Option>
                            <Option value="hubspot">HubSpot</Option>
                            <Option value="zoho">Zoho CRM</Option>
                            <Option value="kecustomer">客套CRM</Option>
                          </Select>
                        </Form.Item>
                      ) : null
                    )}
                  </Form.Item>
                  
                  <Form.Item
                    name="crmApiKey"
                    label="CRM API密钥"
                    dependencies={['enableCrmIntegration']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('enableCrmIntegration') ? (
                        <Form.Item name="crmApiKey">
                          <Input.Password placeholder="请输入CRM API密钥" />
                        </Form.Item>
                      ) : null
                    )}
                  </Form.Item>
                </Panel>
              </Collapse>
              
              <Divider />
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<CloudSyncOutlined />}> 
                  保存集成设置
                </Button>
              </Form.Item>
              </Form>
      );
      case 'backup': return (
            <Form
              form={backupForm}
              layout="vertical"
              onFinish={handleBackupSubmit}
              initialValues={{
                backupEnabled: true,
                backupFrequency: 'daily',
                backupRetentionDays: 30,
                enableEncryption: true,
                backupLocation: 'local',
              }}
            >
              <Collapse defaultActiveKey={['backup-config', 'storage-location']}>
                <Panel header="备份配置" key="backup-config">
                  <Form.Item
                    name="backupEnabled"
                    label="自动备份"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                  </Form.Item>
                  
                  <Form.Item
                    name="backupFrequency"
                    label="备份频率"
                    dependencies={['backupEnabled']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('backupEnabled') ? (
                        <Form.Item name="backupFrequency">
                          <Radio.Group>
                            <Radio value="hourly">每小时</Radio>
                            <Radio value="daily">每天</Radio>
                            <Radio value="weekly">每周</Radio>
                            <Radio value="monthly">每月</Radio>
                          </Radio.Group>
                        </Form.Item>
                      ) : null
                    )}
                  </Form.Item>
                  
                  <Form.Item
                    name="backupTime"
                    label="备份时间"
                    dependencies={['backupEnabled', 'backupFrequency']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('backupEnabled') && (getFieldValue('backupFrequency') === 'daily' || getFieldValue('backupFrequency') === 'weekly' || getFieldValue('backupFrequency') === 'monthly') ? (
                        <Form.Item name="backupTime">
                          <Input placeholder="例如: 02:00 (表示凌晨2点)" />
                        </Form.Item>
                      ) : null
                    )}
                  </Form.Item>
                  
                  <Form.Item
                    name="backupRetentionDays"
                    label="备份保留天数"
                    dependencies={['backupEnabled']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('backupEnabled') ? (
                        <Form.Item name="backupRetentionDays">
                          <InputNumber min={1} max={365} style={{ width: '100%' }} />
                        </Form.Item>
                      ) : null
                    )}
                  </Form.Item>
                  
                  <Form.Item
                    name="enableEncryption"
                    label="备份加密"
                    dependencies={['backupEnabled']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('backupEnabled') ? (
                        <Form.Item name="enableEncryption">
                          <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                        </Form.Item>
                      ) : null
                    )}
                  </Form.Item>
                </Panel>
                
                <Panel header="存储位置" key="storage-location">
                  <Form.Item
                    name="backupLocation"
                    label="备份位置"
                    dependencies={['backupEnabled']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('backupEnabled') ? (
                        <Form.Item name="backupLocation">
                          <Radio.Group>
                            <Radio value="local">本地存储</Radio>
                            <Radio value="cloud">云端存储</Radio>
                            <Radio value="both">本地+云端</Radio>
                          </Radio.Group>
                        </Form.Item>
                      ) : null
                    )}
                  </Form.Item>
                  
                  <Form.Item
                    name="cloudStorageConfig"
                    label="云端存储配置"
                    dependencies={['backupEnabled', 'backupLocation']}
                    noStyle
                  >
                    {({getFieldValue}) => (
                      getFieldValue('backupEnabled') && (getFieldValue('backupLocation') === 'cloud' || getFieldValue('backupLocation') === 'both') ? (
                        <div style={{ paddingLeft: 20 }}>
                          <Form.Item name="cloudProvider" label="云存储提供商">
                            <Select placeholder="请选择云存储提供商">
                              <Option value="aws-s3">AWS S3</Option>
                              <Option value="aliyun-oss">阿里云OSS</Option>
                              <Option value="tencent-cos">腾讯云COS</Option>
                              <Option value="huawei-obs">华为云OBS</Option>
                            </Select>
                          </Form.Item>
                          <Form.Item name="cloudAccessKey" label="访问密钥">
                            <Input.Password placeholder="请输入云存储访问密钥" />
                          </Form.Item>
                          <Form.Item name="cloudSecretKey" label="密钥">
                            <Input.Password placeholder="请输入云存储密钥" />
                          </Form.Item>
                          <Form.Item name="cloudBucket" label="存储桶名称">
                            <Input placeholder="请输入存储桶名称" />
                          </Form.Item>
                        </div>
                      ) : null
                    )}
                  </Form.Item>
                </Panel>
              </Collapse>
              
              <Divider />
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<DatabaseOutlined />}> 
                  保存备份设置
                </Button>
              </Form.Item>
              </Form>
      );
      case 'tools': return (
            <>
            <Card title="系统维护工具">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                <Card size="small" style={{ cursor: 'pointer' }} onClick={() => message.info('清理缓存功能正在开发中')}>
                  <Space>
                    <ToolOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>清理系统缓存</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>清除系统临时文件和缓存数据</div>
                    </div>
                  </Space>
                </Card>
                
                <Card size="small" style={{ cursor: 'pointer' }} onClick={() => message.info('数据库优化功能正在开发中')}>
                  <Space>
                    <DatabaseOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>数据库优化</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>优化数据库性能和清理冗余数据</div>
                    </div>
                  </Space>
                </Card>
                
                <Card size="small" style={{ cursor: 'pointer' }} onClick={() => message.info('日志清理功能正在开发中')}>
                  <Space>
                    <FileTextOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>清理系统日志</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>清理过期的日志文件</div>
                    </div>
                  </Space>
                </Card>
                
                <Card size="small" style={{ cursor: 'pointer' }} onClick={() => message.info('系统诊断功能正在开发中')}>
                  <Space>
                    <SafetyCertificateOutlined style={{ fontSize: '24px', color: '#f5222d' }} />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>系统健康检查</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>检查系统各项指标健康状况</div>
                    </div>
                  </Space>
                </Card>
              </div>
            </Card>
            
            <Card title="系统信息" style={{ marginTop: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: 4 }}>系统版本</div>
                  <div style={{ fontWeight: 'bold' }}>LTD 营销系统 v1.0.0</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: 4 }}>数据库版本</div>
                  <div style={{ fontWeight: 'bold' }}>PostgreSQL 14.5</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: 4 }}>服务器时间</div>
                  <div style={{ fontWeight: 'bold' }}>{new Date().toLocaleString('zh-CN')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: 4 }}>当前用户</div>
                  <div style={{ fontWeight: 'bold' }}>Administrator</div>
                </div>
              </div>
            </Card>
            </>
      );
      default: return null;
    }
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        {renderContent()}
      </Card>
    </div>
  );
};

export default SystemSettings;