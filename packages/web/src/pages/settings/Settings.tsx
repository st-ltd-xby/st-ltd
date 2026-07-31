import { useState } from 'react';
import { Card, Form, Input, Button, Switch, Tabs, Typography, Row, Col, Divider, message, Tag, Statistic, Progress } from 'antd';
import { SaveOutlined, BellOutlined, DatabaseOutlined, LinkOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
const { Title, Text } = Typography;

export default function Settings() {
  const [notifForm] = Form.useForm();

  const handleSaveNotif = (values: any) => {
    console.log('Notification settings:', values);
    message.success('通知设置已保存');
  };

  // 模拟平台接入状态（实际应从后端 API 获取）
  const platforms = [
    { name: '微信公众号', connected: true, desc: '已绑定，消息推送正常', color: '#07c160' },
    { name: '微信小程序', connected: true, desc: '已接入，版本 v2.3.1', color: '#07c160' },
    { name: '企业微信', connected: false, desc: '未接入', color: '#999' },
    { name: '抖音开放平台', connected: false, desc: '未接入', color: '#999' },
    { name: '百度统计', connected: true, desc: '数据同步中', color: '#07c160' },
    { name: 'Google Analytics', connected: false, desc: '未接入', color: '#999' },
    { name: '支付宝', connected: false, desc: '未接入', color: '#999' },
    { name: '微信支付', connected: false, desc: '未接入', color: '#999' },
  ];

  return (
    <div>
      <Title level={4}>系统设置</Title>

      <Tabs items={[
        {
          key: 'notification',
          label: <span><BellOutlined /> 通知设置</span>,
          children: (
            <Card>
              <Form form={notifForm} onFinish={handleSaveNotif} layout="vertical" style={{ maxWidth: 600 }}
                initialValues={{ emailNotify: true, smsNotify: false, wechatNotify: true, newLeadNotify: true, newOrderNotify: true, newCustomerNotify: true, systemAlertNotify: true }}>
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
                <Form.Item name="newCustomerNotify" label="新客户通知" valuePropName="checked">
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                </Form.Item>
                <Form.Item name="newOrderNotify" label="新订单通知" valuePropName="checked">
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                </Form.Item>
                <Form.Item name="systemAlertNotify" label="系统预警通知" valuePropName="checked">
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
          key: 'platforms',
          label: <span><LinkOutlined /> 系统接入的平台</span>,
          children: (
            <Card>
              <Row gutter={[16, 16]}>
                {platforms.map((p, i) => (
                  <Col xs={24} sm={12} md={8} key={i}>
                    <Card size="small" style={{ borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: p.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <LinkOutlined style={{ color: p.color, fontSize: 18 }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text strong>{p.name}</Text>
                            {p.connected ? (
                              <Tag color="success" icon={<CheckCircleOutlined />}>已接入</Tag>
                            ) : (
                              <Tag color="default" icon={<CloseCircleOutlined />}>未接入</Tag>
                            )}
                          </div>
                          <Text type="secondary" style={{ fontSize: 12 }}>{p.desc}</Text>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          ),
        },
        {
          key: 'data',
          label: <span><DatabaseOutlined /> 数据与备份</span>,
          children: (
            <Card>
              <Row gutter={[24, 24]}>
                <Col span={8}>
                  <Card>
                    <Statistic title="数据存储" value={2.4} suffix="GB" />
                    <div style={{ marginTop: 8 }}>
                      <Progress percent={4.8} status="active" />
                      <div style={{ marginTop: 4 }}><Tag color="blue">已用 2.4 GB</Tag><Tag>总计 50 GB</Tag></div>
                    </div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic title="最后备份" value="2026-07-30" />
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
