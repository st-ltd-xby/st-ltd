import { useState, useEffect } from 'react';
import { Button, Upload, message, Input, Form, Card, Avatar, Space } from 'antd';
import { CameraOutlined, EnvironmentOutlined, PlusOutlined, UserOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { scrmApi } from '../../services/api';
import type { UploadFile } from 'antd/es/upload/interface';

// 百度地图AK（请替换为你自己的密钥）
const BAIDU_MAP_AK = 'sOscyZcqY8tzycnEPRlPNYuW2TyOKj9I';

// WGS84坐标 → BD09坐标（百度坐标系）
const wgs84ToBd09 = (wgsLat: number, wgsLng: number): { lat: number; lng: number } => {
  const pi = Math.PI;
  const a = 6378245.0;
  const ee = 0.00669342162296594323;
  let lat = wgsLat, lng = wgsLng;
  // WGS84 → GCJ02
  let dLat = 0, dLng = 0;
  const radLat = lat / 180 * pi;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (lat - 35) * 180 / (pi * a * (1 - ee) / (magic * sqrtMagic));
  dLng = (lng - 105) * 180 / (pi * a / sqrtMagic * Math.cos(radLat));
  let gcjLat = lat + dLat;
  let gcjLng = lng + dLng;
  // GCJ02 → BD09
  const x = gcjLng, y = gcjLat;
  const z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * pi * 3000 / 180);
  const theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * pi * 3000 / 180);
  return { lat: z * Math.sin(theta) + 0.006, lng: z * Math.cos(theta) + 0.0065 };
};

export default function MobileVisits() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [photoList, setPhotoList] = useState<UploadFile[]>([]);
  const [location, setLocation] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [step, setStep] = useState<'select-customer' | 'visit-form' | 'success'>('select-customer');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const res: any = await scrmApi.getCustomers({ page: 1, pageSize: 200 });
      if (res.code === 0) {
        setCustomers(res.data?.list || res.data || []);
      }
    } catch { /* ignore */ }
  };

  // 快速定位（直接显示经纬度）
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      message.error('当前浏览器不支持定位');
      return;
    }
    setLocationLoading(true);
    setAddress('');
    setCoords(null);
    setLocation('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });
        const locStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setLocation(locStr);
        setAddress(locStr);
        setLocationLoading(false);
        message.success('定位成功');
      },
      (err) => {
        setLocationLoading(false);
        message.error('定位失败，请检查定位权限');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 }
    );
  };

  // 直接打开相机拍照（移动端优化）
  const openCamera = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.capture = 'environment'; // 后置摄像头
    
    fileInput.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          setPhotoList(prev => [...prev, {
            uid: Date.now().toString(),
            name: file.name,
            url: reader.result as string,
          }]);
        };
      }
    };
    
    fileInput.click();
  };

  // 选择客户后进入拜访表单
  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setStep('visit-form');
    form.setFieldsValue({ customerId: customer.id });
    
    // 自动获取位置
    getCurrentLocation();
  };

  // 返回选择客户
  const handleBack = () => {
    setStep('select-customer');
    setSelectedCustomer(null);
    form.resetFields();
    setPhotoList([]);
    setLocation('');
    setAddress('');
    setCoords(null);
  };

  // 提交拜访记录
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 验证照片
      if (photoList.length === 0) {
        message.warning('请至少拍摄一张现场照片');
        return;
      }

      // 构建拜访记录
      const visitData = {
        customerId: values.customerId,
        customerName: selectedCustomer?.name || '',
        visitTime: new Date().toISOString(),
        location: location || undefined,
        address: address || undefined,
        latitude: coords?.lat || undefined,
        longitude: coords?.lng || undefined,
        photos: photoList.map(file => file.url || '').filter(Boolean),
        content: values.content,
      };

      // 调用后端 API 保存拜访记录
      const res: any = await scrmApi.createVisit(visitData);
      if (res.code === 0) {
        message.success('拜访记录已保存');
        setStep('success');
      } else {
        message.error(res.message || '保存失败');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 开始新的拜访
  const handleNewVisit = () => {
    setStep('select-customer');
    setSelectedCustomer(null);
    form.resetFields();
    setPhotoList([]);
    setLocation('');
    setAddress('');
    setCoords(null);
  };

  // 打开地图查看位置
  const openMap = () => {
    if (!coords) return;
    const bd = wgs84ToBd09(coords.lat, coords.lng);
    window.open(`https://api.map.baidu.com/marker?location=${bd.lat},${bd.lng}&title=${encodeURIComponent(address || '拜访位置')}&coord_type=bd09ll&output=html`);
  };

  // ========== 步骤1：选择客户 ==========
  if (step === 'select-customer') {
    return (
      <div style={{ padding: '16px', background: '#f5f5f5', minHeight: '100vh' }}>
        <Card 
          style={{ 
            borderRadius: 16,
            marginBottom: 16,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}
        >
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <UserOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#1a3a6e' }}>选择拜访客户</h2>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: '#999' }}>请选择今天要拜访的客户</p>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {customers.map((customer: any) => (
            <Card
              key={customer.id}
              hoverable
              onClick={() => handleSelectCustomer(customer)}
              style={{ 
                borderRadius: 12,
                border: '2px solid transparent',
                transition: 'all 0.3s'
              }}
              styles={{ body: { padding: '16px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  size="large" 
                  icon={<UserOutlined />} 
                  style={{ marginRight: 16, background: '#1890ff' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>{customer.name}</div>
                  <div style={{ fontSize: 13, color: '#999' }}>
                    {customer.contactPhone || '暂无联系方式'}
                  </div>
                </div>
                <div style={{ color: '#1890ff', fontSize: 20 }}>›</div>
              </div>
            </Card>
          ))}
        </div>

        {customers.length === 0 && (
          <Card 
            style={{ 
              borderRadius: 12,
              textAlign: 'center',
              padding: '40px 20px'
            }}
          >
            <div style={{ fontSize: 16, color: '#999' }}>暂无客户数据</div>
          </Card>
        )}
      </div>
    );
  }

  // ========== 步骤2：拜访表单 ==========
  if (step === 'visit-form') {
    return (
      <div style={{ padding: '16px', background: '#f5f5f5', minHeight: '100vh' }}>
        {/* 顶部导航 */}
        <Card 
          style={{ 
            borderRadius: 16,
            marginBottom: 16,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
              style={{ border: 'none', background: 'transparent', padding: 0, marginRight: 12 }}
            />
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>拜访记录</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#999' }}>{selectedCustomer?.name}</p>
            </div>
          </div>
        </Card>

        <Form form={form} layout="vertical">
          {/* 现场照片 */}
          <Card 
            style={{ 
              borderRadius: 16,
              marginBottom: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>
              📸 现场照片 <span style={{ color: '#ff4d4f' }}>*</span>
            </div>
            
            <Button 
              block 
              size="large"
              icon={<CameraOutlined />}
              onClick={openCamera}
              style={{ 
                borderRadius: 12,
                height: 64,
                fontSize: 18,
                marginBottom: 16,
                background: '#1890ff',
                color: '#fff',
                border: 'none'
              }}
            >
              点击拍照
            </Button>
            
            {photoList.length > 0 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
                {photoList.map((file, idx) => (
                  <div key={file.uid} style={{ position: 'relative', flexShrink: 0 }}>
                    <img 
                      src={file.url} 
                      alt={`照片${idx + 1}`}
                      style={{ 
                        width: 100, 
                        height: 100, 
                        objectFit: 'cover', 
                        borderRadius: 12
                      }}
                    />
                    <Button 
                      size="small" 
                      danger
                      onClick={() => setPhotoList(prev => prev.filter(f => f.uid !== file.uid))}
                      style={{ 
                        position: 'absolute', 
                        top: -8, 
                        right: -8,
                        borderRadius: '50%',
                        width: 28,
                        height: 28,
                        padding: 0,
                        fontSize: 16
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ fontSize: 13, color: '#999', marginTop: 8 }}>
              已拍摄 {photoList.length}/9 张照片
            </div>
          </Card>

          {/* 打卡定位 */}
          <Card 
            style={{ 
              borderRadius: 16,
              marginBottom: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>📍 打卡位置</div>
              <Button 
                size="small" 
                type="link"
                onClick={getCurrentLocation}
                loading={locationLoading}
                style={{ padding: 0 }}
              >
                {locationLoading ? '定位中...' : '重新定位'}
              </Button>
            </div>
            
            {locationLoading && !address ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#1890ff' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📡</div>
                <div>正在获取位置...</div>
              </div>
            ) : (
              <div>
                {/* 地址显示 */}
                <div style={{ 
                  background: address && !address.includes('失败') && !address.includes('解析') ? '#f6ffed' : '#fffbe6',
                  border: `1px solid ${address && !address.includes('失败') && !address.includes('解析') ? '#b7eb8f' : '#ffe58f'}`,
                  borderRadius: 8, 
                  padding: '12px 16px',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: '#333', lineHeight: 1.5 }}>
                    {address || '点击“重新定位”获取位置'}
                  </div>
                </div>
                {coords && (
                  <Button 
                    block 
                    size="small"
                    icon={<EnvironmentOutlined />}
                    onClick={openMap}
                    style={{ marginTop: 10, borderRadius: 8, color: '#1890ff' }}
                  >
                    在地图中查看
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* 拜访内容 */}
          <Card 
            style={{ 
              borderRadius: 16,
              marginBottom: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
              ✍️ 拜访内容 <span style={{ color: '#ff4d4f' }}>*</span>
            </div>
            <Form.Item name="content" rules={[{ required: true, message: '请输入拜访内容' }]}>
              <Input.TextArea 
                rows={5} 
                placeholder="记录本次拜访的详细情况..."
                style={{ borderRadius: 12, fontSize: 16 }}
              />
            </Form.Item>
          </Card>

          {/* 提交按钮 */}
          <Button 
            block 
            size="large"
            type="primary"
            onClick={handleSubmit}
            style={{ 
              borderRadius: 12,
              height: 56,
              fontSize: 18,
              fontWeight: 600,
              background: '#52c41a',
              border: 'none'
            }}
          >
            ✓ 完成拜访
          </Button>
        </Form>
      </div>
    );
  }

  // ========== 步骤3：成功提示 ==========
  if (step === 'success') {
    return (
      <div style={{ 
        padding: '16px', 
        background: '#f5f5f5', 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Card 
          style={{ 
            borderRadius: 24,
            width: '100%',
            maxWidth: 400,
            textAlign: 'center',
            padding: '40px 20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
          }}
        >
          <CheckCircleOutlined style={{ fontSize: 80, color: '#52c41a', marginBottom: 24 }} />
          
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#1a3a6e', marginBottom: 12 }}>
            拜访完成！
          </h2>
          
          <p style={{ margin: '0 0 32px', fontSize: 16, color: '#666' }}>
            已成功记录对 <strong>{selectedCustomer?.name}</strong> 的拜访
          </p>

          <div style={{ 
            background: '#f0f9ff', 
            borderRadius: 12, 
            padding: 20,
            marginBottom: 32
          }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
               拍摄照片：{photoList.length} 张
            </div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
              📍 打卡位置：{address || '未记录'}
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>
              ⏰ 拜访时间：{new Date().toLocaleString()}
            </div>
          </div>

          <Button 
            block 
            size="large"
            type="primary"
            onClick={handleNewVisit}
            style={{ 
              borderRadius: 12,
              height: 56,
              fontSize: 18,
              fontWeight: 600,
              background: '#1890ff',
              border: 'none'
            }}
          >
            继续拜访其他客户
          </Button>
        </Card>
      </div>
    );
  }

  return null;
}
