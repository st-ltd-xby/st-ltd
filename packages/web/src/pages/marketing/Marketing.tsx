import { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Button, Tag, Space, Modal, Form, Input, Select, Upload, message, Typography, Statistic, Tabs, List, Avatar } from 'antd';
import { PlusOutlined, ShareAltOutlined, QrcodeOutlined, LinkOutlined, TeamOutlined, FileTextOutlined, PictureOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { contentApi } from '../../services/api';
const { Title, Text } = Typography;

export default function Marketing() {
  const [cards, setCards] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [shareStats, setShareStats] = useState<any>({});
  const [cardModal, setCardModal] = useState(false);
  const [materialModal, setMaterialModal] = useState(false);
  const [cardForm] = Form.useForm();
  const [materialForm] = Form.useForm();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [cardsRes, materialsRes, statsRes] = await Promise.all([
        contentApi.getEmployeeCards().catch(() => ({ data: { code: 0, data: [] } })),
        contentApi.getMaterials().catch(() => ({ data: { code: 0, data: [] } })),
        contentApi.getShareStats().catch(() => ({ data: { code: 0, data: {} } })),
      ]);
      setCards((cardsRes as any)?.data?.data || (cardsRes as any)?.data || []);
      setMaterials((materialsRes as any)?.data?.data || (materialsRes as any)?.data || []);
      setShareStats((statsRes as any)?.data?.data || (statsRes as any)?.data || {});
    } catch {}
  };

  const handleCreateCard = async (values: any) => {
    try {
      const res: any = await contentApi.createEmployeeCard(values);
      if (res.code === 0) { message.success('名片创建成功'); setCardModal(false); loadData(); }
    } catch {}
  };

  const handleCreateMaterial = async (values: any) => {
    try {
      const res: any = await contentApi.createMaterial(values);
      if (res.code === 0) { message.success('素材创建成功'); setMaterialModal(false); loadData(); }
    } catch {}
  };

  const handleShare = async (materialId: string) => {
    try {
      const res: any = await contentApi.createShareRecord({ materialId });
      if (res.code === 0) message.success('分享链接已生成');
    } catch {}
  };

  const typeIcons: Record<string, React.ReactNode> = {
    article: <FileTextOutlined style={{ color: '#1677ff' }} />,
    image: <PictureOutlined style={{ color: '#52c41a' }} />,
    video: <VideoCameraOutlined style={{ color: '#ff7a45' }} />,
    poster: <PictureOutlined style={{ color: '#722ed1' }} />,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>全员营销</Title>
        <Space>
          <Button icon={<TeamOutlined />} onClick={() => setCardModal(true)}>我的名片</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setMaterialModal(true)}>上传素材</Button>
        </Space>
      </div>

      {/* 数据概览 */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总分享次数" value={shareStats.totalShares || 0} prefix={<ShareAltOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="总浏览量" value={shareStats.totalViews || 0} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="带来线索" value={shareStats.totalLeads || 0} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="参与员工" value={shareStats.totalEmployees || 0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
      </Row>

      <Tabs items={[
        {
          key: 'materials',
          label: '营销素材库',
          children: (
            <Row gutter={[16, 16]}>
              {materials.map((m: any) => (
                <Col span={6} key={m.id}>
                  <Card
                    hoverable
                    cover={
                      <div style={{ height: 160, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
                        {typeIcons[m.type] || <FileTextOutlined />}
                      </div>
                    }
                    actions={[
                      <Button type="link" icon={<ShareAltOutlined />} onClick={() => handleShare(m.id)}>分享</Button>,
                      <Button type="link" icon={<QrcodeOutlined />}>二维码</Button>,
                      <Button type="link" icon={<LinkOutlined />}>复制链接</Button>,
                    ]}
                  >
                    <Card.Meta title={m.title} description={
                      <Space direction="vertical" size={0} style={{ width: '100%' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {m.type === 'article' ? '图文' : m.type === 'video' ? '视频' : m.type === 'image' ? '图片' : '海报'}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>浏览 {m.viewCount || 0} · 分享 {m.shareCount || 0}</Text>
                      </Space>
                    } />
                  </Card>
                </Col>
              ))}
              {!materials.length && (
                <Col span={24}>
                  <Card>
                    <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                      暂无营销素材，点击"上传素材"开始创建
                    </div>
                  </Card>
                </Col>
              )}
            </Row>
          ),
        },
        {
          key: 'ranking',
          label: '分享排行榜',
          children: (
            <Card>
              <List
                dataSource={[
                  { name: '张三', dept: '销售部', shares: 156, views: 2340, leads: 23 },
                  { name: '李四', dept: '市场部', shares: 128, views: 1890, leads: 18 },
                  { name: '王五', dept: '销售部', shares: 95, views: 1420, leads: 12 },
                  { name: '赵六', dept: '运营部', shares: 82, views: 1100, leads: 9 },
                  { name: '钱七', dept: '销售部', shares: 67, views: 890, leads: 7 },
                ]}
                renderItem={(item: any, index: number) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: index < 3 ? ['#ff4d4f', '#fa8c16', '#fadb14'][index] : '#e8e8e8',
                          color: index < 3 ? '#fff' : '#999',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 'bold', fontSize: 14,
                        }}>
                          {index + 1}
                        </div>
                      }
                      title={<span>{item.name} <Tag color="blue">{item.dept}</Tag></span>}
                      description={`分享 ${item.shares} 次 · 浏览 ${item.views} · 线索 ${item.leads}`}
                    />
                    <div style={{ fontWeight: 500, color: '#1677ff' }}>{item.shares} 次分享</div>
                  </List.Item>
                )}
              />
            </Card>
          ),
        },
      ]} />

      {/* 创建名片弹窗 */}
      <Modal title="创建我的名片" open={cardModal} onCancel={() => setCardModal(false)} onOk={() => cardForm.submit()} destroyOnClose>
        <Form form={cardForm} onFinish={handleCreateCard} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input placeholder="请输入姓名" /></Form.Item>
          <Form.Item name="title" label="职位"><Input placeholder="如：销售经理" /></Form.Item>
          <Form.Item name="phone" label="手机号"><Input placeholder="请输入手机号" /></Form.Item>
          <Form.Item name="email" label="邮箱"><Input placeholder="请输入邮箱" /></Form.Item>
          <Form.Item name="department" label="部门"><Input placeholder="请输入部门" /></Form.Item>
        </Form>
      </Modal>

      {/* 上传素材弹窗 */}
      <Modal title="上传营销素材" open={materialModal} onCancel={() => setMaterialModal(false)} onOk={() => materialForm.submit()} destroyOnClose width={520}>
        <Form form={materialForm} onFinish={handleCreateMaterial} layout="vertical">
          <Form.Item name="title" label="素材标题" rules={[{ required: true }]}><Input placeholder="请输入素材标题" /></Form.Item>
          <Form.Item name="type" label="素材类型" initialValue="article">
            <Select>
              <Select.Option value="article">图文</Select.Option>
              <Select.Option value="image">图片</Select.Option>
              <Select.Option value="video">视频</Select.Option>
              <Select.Option value="poster">海报</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="素材描述"><Input.TextArea rows={2} placeholder="简要描述素材内容" /></Form.Item>
          <Form.Item name="fileUrl" label="文件链接"><Input placeholder="输入素材文件 URL" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
