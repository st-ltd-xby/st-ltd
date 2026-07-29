import { useState } from 'react';
import { Card, Form, Input, Button, Switch, Select, Tabs, Typography, Row, Col, Divider, message, Upload, Space, Tag, Statistic } from 'antd';
import { SaveOutlined, UploadOutlined, GlobalOutlined, BellOutlined, SafetyOutlined, DatabaseOutlined } from '@ant-design/icons';
const { Title, Text } = Typography;

export default function Settings() {
  const [siteForm] = Form.useForm();
  const [notifForm] = Form.useForm();

  const handleSaveSite = (values: any) => {
    console.log('Site settings:', values);
    message.success('站点设置已保存');
  };

  const handleSaveNotif = (values: any) => {
    console.log('Notification settings:', values);
    message.success('通知设置已保存');
  };

  return (
    <div>
      <Title level={4}>系统设置</Title>

      <Tabs items={[
        {
          key: 'site',
          label: <span><GlobalOutlined /> 站点信息</span>,
          children: (
            <Card>
              <Form form={siteForm} onFinish={handleSaveSite} layout="vertical" style={{ maxWidth: 600 }}
                initialValues={{ siteName: 'ST-LTD 运营系统', siteDesc: '企业数字化营销管理平台', language: 'zh-CN', timezone: 'Asia/Shanghai' }}
              >
                <Form.Item name="siteName" label="站点名称" rules={[{ required: true }]}>
                  <Input placeholder="请输入站点名称" />
                </Form.Item>
                <Form.Item name="siteDesc" label="站点描述">
                  <Input.TextArea rows={2} placeholder="站点描述信息" />
                </Form.Item>
                <Form.Item name="logo" label="站点 Logo">
                  <Upload maxCount={1} beforeUpload={() => false}>
                    <Button icon={<UploadOutlined />}>上传 Logo</Button>
                  </Upload>
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="language" label="默认语言">
                      <Select>
                        <Select.Option value="zh-CN">简体中文</Select.Option>
                        <Select.Option value="en-US">English</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="timezone" label="时区">
                      <Select>
                        <Select.Option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</Select.Option>
                        <Select.Option value="UTC">UTC</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="icp" label="ICP 备案号">
                  <Input placeholder="如：京ICP备XXXXXXXX号" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>保存设置</Button>
                </Form.Item>
              </Form>
            </Card>
          ),
        },
        {
          key: 'notification',
          label: <span><BellOutlined /> 通知设置</span>,
          children: (
            <Card>
              <Form form={notifForm} onFinish={handleSaveNotif} layout="vertical" style={{ maxWidth: 600 }}
                initialValues={{ emailNotify: true, smsNotify: false, wechatNotify: true, newLeadNotify: true, newOrderNotify: true }}>
                <Divider orientation="left">通知渠道</Divider>
                <Form.Item name="emailNotify" label="邮件通知" valuePropName="checked">
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                </Form.Item>
                <Form.Item name="smsNotify" label="短信通知" valuePropName="checked">
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                </Form.Item>
                <Form.Item name="wechatNotify" label="微信通知" valuePropName="checked">
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                </Form.Item>
                <Divider orientation="left">通知事件</Divider>
                <Form.Item name="newLeadNotify" label="新线索通知" valuePropName="checked">
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                </Form.Item>
                <Form.Item name="newOrderNotify" label="新订单通知" valuePropName="checked">
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>保存设置</Button>
                </Form.Item>
              </Form>
            </Card>
          ),
        },
        {
          key: 'security',
          label: <span><SafetyOutlined /> 安全设置</span>,
          children: (
            <Card>
              <Row gutter={[24, 16]}>
                <Col span={24}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div>
                      <Text strong>登录密码强度要求</Text>
                      <div><Text type="secondary">要求密码包含大小写字母、数字和特殊字符</Text></div>
                    </div>
                    <Switch defaultChecked checkedChildren="开启" unCheckedChildren="关闭" />
                  </div>
                </Col>
                <Col span={24}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div>
                      <Text strong>两步验证 (2FA)</Text>
                      <div><Text type="secondary">登录时需要额外验证</Text></div>
                    </div>
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </div>
                </Col>
                <Col span={24}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div>
                      <Text strong>登录失败锁定</Text>
                      <div><Text type="secondary">连续 5 次登录失败后锁定账号 30 分钟</Text></div>
                    </div>
                    <Switch defaultChecked checkedChildren="开启" unCheckedChildren="关闭" />
                  </div>
                </Col>
                <Col span={24}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                    <div>
                      <Text strong>会话超时时间</Text>
                      <div><Text type="secondary">无操作自动退出登录</Text></div>
                    </div>
                    <Select defaultValue="30" style={{ width: 120 }}>
                      <Select.Option value="15">15 分钟</Select.Option>
                      <Select.Option value="30">30 分钟</Select.Option>
                      <Select.Option value="60">1 小时</Select.Option>
                      <Select.Option value="120">2 小时</Select.Option>
                    </Select>
                  </div>
                </Col>
              </Row>
            </Card>
          ),
        },
        {
          key: 'team',
          label: <span><DatabaseOutlined /> 数据与备份</span>,
          children: (
            <Card>
              <Row gutter={[24, 24]}>
                <Col span={8}>
                  <Card>
                    <Statistic title="数据存储" value={2.4} suffix="GB" />
                    <div style={{ marginTop: 8 }}>
                      <Tag color="blue">已用 2.4 GB</Tag>
                      <Tag>总计 50 GB</Tag>
                    </div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic title="最后备份" value="2024-01-15" />
                    <Button type="link" style={{ padding: 0, marginTop: 8 }}>立即备份</Button>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic title="操作日志" value={12580} suffix="条" />
                    <Button type="link" style={{ padding: 0, marginTop: 8 }}>查看日志</Button>
                  </Card>
                </Col>
              </Row>
            </Card>
          ),
        },
      ]} />
    </div>
  );
}
