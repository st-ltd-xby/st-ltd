import { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Modal, Form, Input, Select, Tabs, message, Typography, Drawer, Descriptions, Timeline, Divider, Card, Empty, Steps } from 'antd';
import { PlusOutlined, EyeOutlined, PhoneOutlined, CameraOutlined, EnvironmentOutlined, UserOutlined, StarOutlined, CheckCircleOutlined, ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { scrmApi } from '../../services/api';
const { Title } = Typography;

const levelColors: Record<string, string> = { A: 'red', B: 'orange', C: 'blue' };

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // 用于强制刷新
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  // 详情抽屉
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);

  useEffect(() => { load(); }, [refreshKey]); // 依赖 refreshKey 实现强制刷新

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await scrmApi.getCustomers();
      if (res.code === 0) setCustomers(res.data || []);
    } catch {} finally { setLoading(false); }
  };

  const handleCreate = async (values: any) => {
    try {
      const res: any = await scrmApi.createCustomer(values);
      if (res.code === 0) { message.success('客户创建成功'); setModalOpen(false); load(); }
    } catch {}
  };

  // 查看详情
  const handleViewDetail = (customer: any) => {
    setCurrentCustomer(customer);
    setDetailOpen(true);
  };

  // 获取电话联络记录
  const getPhoneRecords = (customer: any) => customer.phoneRecords || [];
  
  // 获取拜访记录（优先从 localStorage 读取，后端数据作为补充）
  const getVisitRecords = (customer: any) => {
    console.log(' getVisitRecords 被调用 - customerId:', customer.id, 'customerName:', customer.name);
    
    // 1. 先从 localStorage 读取本地存储的拜访记录
    const customerVisitsKey = `visits_customer_${customer.id}`;
    const localVisits = JSON.parse(localStorage.getItem(customerVisitsKey) || '[]');
    console.log(`💾 localStorage.${customerVisitsKey}:`, localVisits.length, '条记录');
    if (localVisits.length > 0) {
      console.log(' 第一条记录的photos:', localVisits[0].photos?.map((p: string, i: number) => ({ index: i, length: p.length })));
    }
    
    // 2. 合并后端返回的拜访记录
    const backendVisits = customer.visitRecords || [];
    const parsedBackendVisits = backendVisits.map((r: any) => ({
      ...r,
      photos: typeof r.photos === 'string' ? (() => { try { return JSON.parse(r.photos); } catch { return []; } })() : (r.photos || []),
    }));
    
    // 3. 合并并去重（以 id 为准）
    const allVisits = [...localVisits, ...parsedBackendVisits];
    const uniqueVisits = Array.from(
      new Map(allVisits.map(v => [v.id, v])).values()
    );
    
    console.log('✅ 最终返回', uniqueVisits.length, '条拜访记录');
    return uniqueVisits;
  };
  // 关联商机
  const getOpportunities = (customer: any) => customer.opportunities || [];

  // 判断任务完成状态：拜访打卡完成后，两项任务都标记为已完成
  const isPhoneTaskDone = (customer: any) => {
    const visits = getVisitRecords(customer);
    const phones = getPhoneRecords(customer);
    return phones.length > 0 || visits.length > 0;
  };
  const isVisitTaskDone = (customer: any) => {
    return getVisitRecords(customer).length > 0;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>客户管理</Title>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => setRefreshKey(prev => prev + 1)} // 强制触发重新渲染
            loading={loading}
          >
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建客户</Button>
        </Space>
      </div>
      <Tabs
        items={[
          { key: 'all', label: '全部客户' },
          { key: 'A', label: 'A类 (重点)' },
          { key: 'B', label: 'B类 (一般)' },
          { key: 'C', label: 'C类 (潜力)' },
        ]}
        style={{ marginBottom: 16 }}
      />
      <Table
        dataSource={customers}
        rowKey="id"
        loading={loading}
        columns={[
          { title: '客户名称', dataIndex: 'name', render: (v: string) => <a onClick={() => handleViewDetail(customers.find(c => c.name === v) || {})} style={{ fontWeight: 500 }}>{v}</a> },
          { title: '行业', dataIndex: 'industry', render: (v: string) => v || '-' },
          { title: '等级', dataIndex: 'level', render: (v: string) => <Tag color={levelColors[v]}>{v}类</Tag> },
          { title: '联系人', dataIndex: 'contactName', render: (v: string) => v || '-' },
          { title: '电话', dataIndex: 'contactPhone', render: (v: string) => v || '-' },
          { title: '对接人', dataIndex: 'assigneeName', render: (v: string) => v ? <Tag color="blue">{v}</Tag> : <span style={{ color: '#999' }}>未分配</span> },
          {
            title: '📞 电话联络', key: 'phoneTask', width: 110,
            render: (_: any, record: any) => {
              const done = isPhoneTaskDone(record);
              return done
                ? <Tag color="success" icon={<CheckCircleOutlined />}>已完成</Tag>
                : <Tag color="default" icon={<ClockCircleOutlined />}>待执行</Tag>;
            },
          },
          {
            title: '📷 客户拜访', key: 'visitTask', width: 110,
            render: (_: any, record: any) => {
              const done = isVisitTaskDone(record);
              return done
                ? <Tag color="success" icon={<CheckCircleOutlined />}>已完成</Tag>
                : <Tag color="default" icon={<ClockCircleOutlined />}>待执行</Tag>;
            },
          },
          {
            title: '客户转化', key: 'conversion', width: 100,
            render: (_: any, record: any) => {
              const opps = getOpportunities(record);
              return opps.length > 0
                ? <Tag color="success" icon={<CheckCircleOutlined />}>已转化 {opps.length}个</Tag>
                : <Tag color="default">未转化</Tag>;
            },
          },
          {
            title: '操作', key: 'action', render: (_: any, record: any) => (
              <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
            ),
          },
        ]}
      />

      {/* 新建客户 */}
      <Modal title="新建客户" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose>
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="name" label="客户名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="industry" label="行业"><Input /></Form.Item>
          <Form.Item name="level" label="等级">
            <Select placeholder="选择等级">
              <Select.Option value="A">A类</Select.Option>
              <Select.Option value="B">B类</Select.Option>
              <Select.Option value="C">C类</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="contactName" label="联系人"><Input /></Form.Item>
          <Form.Item name="contactPhone" label="联系电话"><Input /></Form.Item>
        </Form>
      </Modal>

      {/* 客户详情抽屉 */}
      <Drawer
        title={currentCustomer?.name || '客户详情'}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={680}
      >
        {currentCustomer && (
          <Tabs defaultActiveKey="overview">
            {/* 概览 */}
            <Tabs.TabPane tab="概览" key="overview">
              <Descriptions column={2} bordered size="small" style={{ marginBottom: 20 }}>
                <Descriptions.Item label="客户名称" span={2}><strong>{currentCustomer.name}</strong></Descriptions.Item>
                <Descriptions.Item label="等级"><Tag color={levelColors[currentCustomer.level]}>{currentCustomer.level}类</Tag></Descriptions.Item>
                <Descriptions.Item label="行业">{currentCustomer.industry || '-'}</Descriptions.Item>
                <Descriptions.Item label="联系人">{currentCustomer.contactName || '-'}</Descriptions.Item>
                <Descriptions.Item label="电话">{currentCustomer.contactPhone || '-'}</Descriptions.Item>
                <Descriptions.Item label="对接人" span={2}>
                  {currentCustomer.assigneeName ? (
                    <Tag color="blue"><UserOutlined /> {currentCustomer.assigneeName}</Tag>
                  ) : <span style={{ color: '#999' }}>未分配</span>}
                </Descriptions.Item>
              </Descriptions>

              {/* 任务执行状态 */}
              <Card size="small" title="任务进度" style={{ marginBottom: 16 }}>
                <Steps
                  current={isVisitTaskDone(currentCustomer) ? 2 : isPhoneTaskDone(currentCustomer) ? 1 : 0}
                  size="small"
                  items={[
                    {
                      title: '电话联络',
                      status: isPhoneTaskDone(currentCustomer) ? 'finish' : 'wait',
                      icon: isPhoneTaskDone(currentCustomer) ? <CheckCircleOutlined /> : <PhoneOutlined />,
                      description: isPhoneTaskDone(currentCustomer) ? `已完成 ${getPhoneRecords(currentCustomer).length + getVisitRecords(currentCustomer).length} 次` : '待执行',
                    },
                    {
                      title: '客户拜访',
                      status: isVisitTaskDone(currentCustomer) ? 'finish' : 'wait',
                      icon: isVisitTaskDone(currentCustomer) ? <CheckCircleOutlined /> : <CameraOutlined />,
                      description: isVisitTaskDone(currentCustomer) ? `已打卡 ${getVisitRecords(currentCustomer).length} 次` : '待执行',
                    },
                  ]}
                />
              </Card>

              {/* 任务执行摘要 */}
              <Card size="small" title="执行统计" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1, textAlign: 'center', padding: '12px 0', background: isPhoneTaskDone(currentCustomer) ? '#f6ffed' : '#f0f5ff', borderRadius: 8 }}>
                    {isPhoneTaskDone(currentCustomer) ? <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} /> : <PhoneOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                    <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>{getPhoneRecords(currentCustomer).length + getVisitRecords(currentCustomer).length}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>电话联络</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', padding: '12px 0', background: isVisitTaskDone(currentCustomer) ? '#f6ffed' : '#f6f6f6', borderRadius: 8 }}>
                    {isVisitTaskDone(currentCustomer) ? <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} /> : <CameraOutlined style={{ fontSize: 24, color: '#999' }} />}
                    <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>{getVisitRecords(currentCustomer).length}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>客户拜访</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', padding: '12px 0', background: '#fff7e6', borderRadius: 8 }}>
                    <StarOutlined style={{ fontSize: 24, color: '#faad14' }} />
                    <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>{getOpportunities(currentCustomer).length}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>关联商机</div>
                  </div>
                </div>
              </Card>
            </Tabs.TabPane>

            {/* 电话联络记录 */}
            <Tabs.TabPane tab={<span>{isPhoneTaskDone(currentCustomer) ? <CheckCircleOutlined style={{color:'#52c41a'}} /> : <PhoneOutlined />} 电话联络 {isPhoneTaskDone(currentCustomer) && <Tag color="green" style={{marginLeft:4}}>已完成</Tag>}</span>} key="phone">
              {getPhoneRecords(currentCustomer).length > 0 ? (
                <Timeline>
                  {getPhoneRecords(currentCustomer).map((record: any, index: number) => (
                    <Timeline.Item key={index} color="blue">
                      <div style={{ marginBottom: 4 }}>
                        <Tag color="blue">{record.result || '已联络'}</Tag>
                        <span style={{ color: '#999', fontSize: 12 }}>{record.time ? new Date(record.time).toLocaleString() : '-'}</span>
                      </div>
                      <div>{record.content || '无详细内容'}</div>
                      {record.nextAction && <div style={{ color: '#1890ff', fontSize: 13, marginTop: 4 }}>下一步：{record.nextAction}</div>}
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : isVisitTaskDone(currentCustomer) ? (
                <div style={{ textAlign: 'center', padding: 30 }}>
                  <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 12 }} />
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#52c41a', marginBottom: 8 }}>电话联络已完成</div>
                  <div style={{ color: '#999', fontSize: 13 }}>通过客户拜访打卡自动完成</div>
                </div>
              ) : (
                <Empty description="任务待执行" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                  <div style={{ color: '#999' }}>等待管理后台下达任务</div>
                </Empty>
              )}
            </Tabs.TabPane>

            {/* 客户拜访记录 */}
            <Tabs.TabPane tab={<span>{isVisitTaskDone(currentCustomer) ? <CheckCircleOutlined style={{color:'#52c41a'}} /> : <CameraOutlined />} 客户拜访 {isVisitTaskDone(currentCustomer) && <Tag color="green" style={{marginLeft:4}}>已完成</Tag>}</span>} key="visit">
              {getVisitRecords(currentCustomer).length > 0 ? (
                <Timeline>
                  {getVisitRecords(currentCustomer).map((record: any, index: number) => (
                    <Timeline.Item key={index} color="green">
                      <div style={{ marginBottom: 4 }}>
                        <Tag color="green"><CheckCircleOutlined /> 现场拜访</Tag>
                        <span style={{ color: '#999', fontSize: 12 }}>{record.visitTime ? new Date(record.visitTime).toLocaleString() : '-'}</span>
                      </div>
                      {record.content && <div style={{ marginBottom: 8 }}>{record.content}</div>}
                      {(record.address || record.location) && (
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                          <EnvironmentOutlined /> {record.address || record.location}
                        </div>
                      )}
                      {record.photos && record.photos.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                          {record.photos.map((photo: string, pIdx: number) => (
                            <img
                              key={pIdx}
                              src={photo}
                              alt={`照片${pIdx + 1}`}
                              style={{
                                width: 100,
                                height: 100,
                                objectFit: 'cover',
                                borderRadius: 8,
                                cursor: 'pointer',
                                border: '1px solid #e8e8e8',
                              }}
                              onClick={() => window.open(photo, '_blank')}
                            />
                          ))}
                        </div>
                      )}
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <Empty description="任务待执行" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                  <div style={{ color: '#999' }}>等待管理后台下达任务，移动端拍照打卡后结果将在此展示</div>
                </Empty>
              )}
            </Tabs.TabPane>

            {/* 关联商机 */}
            <Tabs.TabPane tab={<span><StarOutlined /> 关联商机</span>} key="opportunities">
              {getOpportunities(currentCustomer).length > 0 ? (
                <Table
                  dataSource={getOpportunities(currentCustomer)}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '商机名称', dataIndex: 'title', render: (v: string) => <strong>{v}</strong> },
                    {
                      title: '阶段', dataIndex: 'stage',
                      render: (v: string) => {
                        const colors: Record<string, string> = { phone_contact: 'blue', customer_visit: 'cyan', project_publish: 'purple', project_docking: 'gold', project_landing: 'green' };
                        const labels: Record<string, string> = { phone_contact: '电话联络', customer_visit: '客户拜访', project_publish: '项目发布', project_docking: '项目对接', project_landing: '项目落地' };
                        return <Tag color={colors[v]}>{labels[v] || v}</Tag>;
                      },
                    },
                    { title: '金额', dataIndex: 'amount', render: (v: number) => v ? `¥${v.toLocaleString()}` : '-' },
                    { title: '概率', dataIndex: 'probability', render: (v: number) => `${v || 0}%` },
                  ]}
                />
              ) : (
                <Empty description="暂无关联商机" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Tabs.TabPane>
          </Tabs>
        )}
      </Drawer>
    </div>
  );
}
