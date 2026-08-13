import { useState, useEffect } from 'react';
import { Card, Button, Upload, message, Input, Space, Tag, Timeline, Modal, Form } from 'antd';
import { CameraOutlined, EnvironmentOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons';
import { scrmApi } from '../../services/api';
import type { UploadFile } from 'antd/es/upload/interface';

interface VisitRecord {
  id: string;
  customerId: string;
  customerName: string;
  visitTime: string;
  location?: string;
  photos: string[];
  content: string;
  createdAt: string;
}

export default function CustomerVisits() {
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [photoList, setPhotoList] = useState<UploadFile[]>([]);
  const [location, setLocation] = useState<string>('');

  useEffect(() => {
    loadVisits();
    loadCustomers();
  }, []);

  const loadVisits = async () => {
    setLoading(true);
    try {
      // TODO: 调用后端 API 获取拜访记录
      // const res: any = await scrmApi.getVisits();
      // if (res.code === 0) {
      //   setVisits(res.data || []);
      // }
      setVisits([]); // 临时空数据
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const res: any = await scrmApi.getCustomers({ page: 1, pageSize: 200 });
      if (res.code === 0) {
        setCustomers(res.data?.list || res.data || []);
      }
    } catch { /* ignore */ }
  };

  // 获取当前位置
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
          setLocation(loc);
          message.success(`已获取位置：${loc}`);
        },
        () => {
          message.error('无法获取位置，请允许浏览器访问位置信息');
        }
      );
    } else {
      message.error('浏览器不支持地理位置功能');
    }
  };

  // 提交拜访记录
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 验证照片
      if (photoList.length === 0) {
        message.warning('请至少上传一张现场照片');
        return;
      }

      // 构建拜访记录
      const visitData = {
        customerId: values.customerId,
        customerName: customers.find((c: any) => c.id === values.customerId)?.name || '',
        visitTime: new Date().toISOString(),
        location: location || undefined,
        photos: photoList.map(file => file.url || '').filter(Boolean),
        content: values.content,
      };

      // TODO: 调用后端 API 保存拜访记录
      // const res: any = await scrmApi.createVisit(visitData);
      // if (res.code === 0) {
      //   message.success('拜访记录已保存');
      //   setVisitModalOpen(false);
      //   form.resetFields();
      //   setPhotoList([]);
      //   setLocation('');
      //   loadVisits();
      // }

      message.success('拜访记录已保存（演示模式）');
      setVisitModalOpen(false);
      form.resetFields();
      setPhotoList([]);
      setLocation('');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <Card
        title="客户拜访"
        extra={
          <Button 
            type="primary" 
            icon={<CameraOutlined />} 
            onClick={() => setVisitModalOpen(true)}
          >
            新建拜访记录
          </Button>
        }
      >
        {visits.length > 0 ? (
          <Timeline>
            {visits.map((visit) => (
              <Timeline.Item key={visit.id} color="blue">
                <div style={{ marginBottom: 8 }}>
                  <strong>{visit.customerName}</strong>
                  <Tag color="green" style={{ marginLeft: 8 }}>
                    {new Date(visit.visitTime).toLocaleString()}
                  </Tag>
                </div>
                {visit.location && (
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                    <EnvironmentOutlined /> {visit.location}
                  </div>
                )}
                {visit.photos.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    {visit.photos.map((photo, idx) => (
                      <img 
                        key={idx} 
                        src={photo} 
                        alt={`照片${idx + 1}`}
                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
                      />
                    ))}
                  </div>
                )}
                <div style={{ color: '#555' }}>{visit.content}</div>
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            暂无拜访记录，点击右上角按钮添加
          </div>
        )}
      </Card>

      {/* 新建拜访记录弹窗 */}
      <Modal
        title="新建拜访记录"
        open={visitModalOpen}
        onCancel={() => {
          setVisitModalOpen(false);
          form.resetFields();
          setPhotoList([]);
          setLocation('');
        }}
        onOk={handleSubmit}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="customerId" label="选择客户" rules={[{ required: true, message: '请选择客户' }]}>
            <select style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #d9d9d9' }}>
              <option value="">请选择客户</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Form.Item>

          <Form.Item label="现场照片" required>
            <Upload
              listType="picture-card"
              fileList={photoList}
              onChange={({ fileList }) => setPhotoList(fileList)}
              beforeUpload={(file) => {
                // 模拟上传，实际应该调用后端上传接口
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                  setPhotoList(prev => [...prev, {
                    uid: file.uid,
                    name: file.name,
                    url: reader.result as string,
                  }]);
                };
                return false; // 阻止自动上传
              }}
              maxCount={9}
            >
              {photoList.length < 9 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传照片</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item label="GPS定位">
            <Space.Compact style={{ width: '100%' }}>
              <Input 
                value={location} 
                placeholder="点击获取位置" 
                readOnly 
                prefix={<EnvironmentOutlined />}
              />
              <Button onClick={getCurrentLocation}>获取位置</Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item name="content" label="拜访内容" rules={[{ required: true, message: '请输入拜访内容' }]}>
            <Input.TextArea rows={4} placeholder="记录本次拜访的详细情况..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
