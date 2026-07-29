import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Tabs, 
  Upload, 
  message,
  Space,
  Popconfirm,
  Typography 
} from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

const { TabPane } = Tabs;
const { Title } = Typography;
const { TextArea } = Input;

interface Site {
  id: string;
  name: string;
  type: string;
  domain: string;
  status: string;
  createdAt: string;
}

interface Page {
  id: string;
  title: string;
  slug: string;
  status: string;
  createdAt: string;
}

const SiteManagementPage: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [activeTab, setActiveTab] = useState('sites');
  const [siteModalVisible, setSiteModalVisible] = useState(false);
  const [pageModalVisible, setPageModalVisible] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [siteForm] = Form.useForm();
  const [pageForm] = Form.useForm();

  useEffect(() => {
    // 模拟加载数据
    setSites([
      { id: '1', name: '企业官网', type: 'pc', domain: 'https://company.com', status: 'published', createdAt: '2026-01-15' },
      { id: '2', name: '产品展示站', type: 'h5', domain: 'https://product.com', status: 'draft', createdAt: '2026-02-20' },
      { id: '3', name: '营销活动页', type: 'pc', domain: 'https://campaign.com', status: 'published', createdAt: '2026-03-10' },
    ]);
    
    setPages([
      { id: '1', title: '首页', slug: 'home', status: 'published', createdAt: '2026-01-16' },
      { id: '2', title: '关于我们', slug: 'about', status: 'published', createdAt: '2026-01-17' },
      { id: '3', title: '产品介绍', slug: 'products', status: 'draft', createdAt: '2026-02-21' },
    ]);
  }, []);

  const handleAddSite = () => {
    setEditingSite(null);
    siteForm.resetFields();
    setSiteModalVisible(true);
  };

  const handleEditSite = (site: Site) => {
    setEditingSite(site);
    siteForm.setFieldsValue(site);
    setSiteModalVisible(true);
  };

  const handleDeleteSite = (id: string) => {
    setSites(sites.filter(site => site.id !== id));
    message.success('网站删除成功');
  };

  const handleSiteOk = async () => {
    try {
      const values = await siteForm.validateFields();
      
      if (editingSite) {
        // 更新网站
        setSites(sites.map(site => site.id === editingSite.id ? { ...site, ...values } : site));
      } else {
        // 添加新网站
        const newSite: Site = {
          id: `${sites.length + 1}`,
          ...values,
          createdAt: new Date().toISOString().split('T')[0],
        };
        setSites([...sites, newSite]);
      }
      
      setSiteModalVisible(false);
      message.success(editingSite ? '网站更新成功' : '网站创建成功');
    } catch (error) {
      console.log('Validate Failed:', error);
    }
  };

  const handleAddPage = () => {
    setEditingPage(null);
    pageForm.resetFields();
    setPageModalVisible(true);
  };

  const handleEditPage = (page: Page) => {
    setEditingPage(page);
    pageForm.setFieldsValue(page);
    setPageModalVisible(true);
  };

  const handleDeletePage = (id: string) => {
    setPages(pages.filter(page => page.id !== id));
    message.success('页面删除成功');
  };

  const handlePageOk = async () => {
    try {
      const values = await pageForm.validateFields();
      
      if (editingPage) {
        // 更新页面
        setPages(pages.map(page => page.id === editingPage.id ? { ...page, ...values } : page));
      } else {
        // 添加新页面
        const newPage: Page = {
          id: `${pages.length + 1}`,
          ...values,
          createdAt: new Date().toISOString().split('T')[0],
        };
        setPages([...pages, newPage]);
      }
      
      setPageModalVisible(false);
      message.success(editingPage ? '页面更新成功' : '页面创建成功');
    } catch (error) {
      console.log('Validate Failed:', error);
    }
  };

  const siteColumns = [
    {
      title: '网站名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '网站类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          pc: 'PC端',
          h5: '移动端(H5)',
          miniapp: '小程序',
          mall: '商城',
        };
        return typeMap[type] || type;
      }
    },
    {
      title: '域名',
      dataIndex: 'domain',
      key: 'domain',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, string> = {
          draft: '草稿',
          published: '已发布',
          offline: '已下线',
        };
        return statusMap[status] || status;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Site) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEditSite(record)}>编辑</Button>
          <Popconfirm
            title="确定要删除这个网站吗？"
            onConfirm={() => handleDeleteSite(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const pageColumns = [
    {
      title: '页面标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '路径',
      dataIndex: 'slug',
      key: 'slug',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, string> = {
          draft: '草稿',
          published: '已发布',
        };
        return statusMap[status] || status;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Page) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEditPage(record)}>编辑</Button>
          <Popconfirm
            title="确定要删除这个页面吗？"
            onConfirm={() => handleDeletePage(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>建站中心管理</Title>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="网站管理" key="sites">
          <Card 
            title="网站列表"
            extra={
              <Button type="primary" onClick={handleAddSite}>
                <PlusOutlined /> 添加网站
              </Button>
            }
          >
            <Table 
              dataSource={sites} 
              columns={siteColumns} 
              rowKey="id"
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </Card>
        </TabPane>
        <TabPane tab="页面搭建" key="pages">
          <Card 
            title="页面列表"
            extra={
              <Button type="primary" onClick={handleAddPage}>
                <PlusOutlined /> 添加页面
              </Button>
            }
          >
            <Table 
              dataSource={pages} 
              columns={pageColumns} 
              rowKey="id"
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </Card>
        </TabPane>
        <TabPane tab="图文数据管理" key="content">
          <Card title="图文内容管理">
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Typography.Text type="secondary">图文数据管理功能将在后续版本中实现</Typography.Text>
            </div>
          </Card>
        </TabPane>
      </Tabs>

      {/* 网站编辑模态框 */}
      <Modal
        title={editingSite ? "编辑网站" : "添加网站"}
        open={siteModalVisible}
        onOk={handleSiteOk}
        onCancel={() => setSiteModalVisible(false)}
        destroyOnClose
      >
        <Form
          form={siteForm}
          layout="vertical"
          name="site_form"
          initialValues={editingSite || {}}
        >
          <Form.Item
            name="name"
            label="网站名称"
            rules={[{ required: true, message: '请输入网站名称!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="type"
            label="网站类型"
            rules={[{ required: true, message: '请选择网站类型!' }]}
          >
            <Select>
              <Select.Option value="pc">PC端</Select.Option>
              <Select.Option value="h5">移动端(H5)</Select.Option>
              <Select.Option value="miniapp">小程序</Select.Option>
              <Select.Option value="mall">商城</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="domain"
            label="域名"
          >
            <Input placeholder="例如：https://example.com" />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态!' }]}
          >
            <Select>
              <Select.Option value="draft">草稿</Select.Option>
              <Select.Option value="published">已发布</Select.Option>
              <Select.Option value="offline">已下线</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 页面编辑模态框 */}
      <Modal
        title={editingPage ? "编辑页面" : "添加页面"}
        open={pageModalVisible}
        onOk={handlePageOk}
        onCancel={() => setPageModalVisible(false)}
        destroyOnClose
      >
        <Form
          form={pageForm}
          layout="vertical"
          name="page_form"
          initialValues={editingPage || {}}
        >
          <Form.Item
            name="title"
            label="页面标题"
            rules={[{ required: true, message: '请输入页面标题!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="slug"
            label="页面路径"
            rules={[{ required: true, message: '请输入页面路径!' }]}
          >
            <Input placeholder="例如：home, about-us" />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态!' }]}
          >
            <Select>
              <Select.Option value="draft">草稿</Select.Option>
              <Select.Option value="published">已发布</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SiteManagementPage;