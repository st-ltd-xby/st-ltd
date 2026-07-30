import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Space, List, Typography, Tag, Spin, Empty, Popconfirm, message, Avatar, Divider } from 'antd';
import {
  RobotOutlined, UserOutlined, SendOutlined, PlusOutlined,
  DeleteOutlined, MessageOutlined, BulbOutlined, ReloadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const AGENT_API = `${API_BASE_URL}/api/v1/agent`;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

interface MessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

// Quick action suggestions
const quickSuggestions = [
  { icon: <BulbOutlined />, text: '\u5206\u6790\u5f53\u524d\u7ebf\u7d22\u8d28\u91cf\uff0c\u7ed9\u51fa\u8ddf\u8fdb\u5efa\u8bae', color: 'blue' },
  { icon: <BulbOutlined />, text: '\u6839\u636e\u5ba2\u6237\u753b\u50cf\uff0c\u63a8\u8350\u5185\u5bb9\u8425\u9500\u7b56\u7565', color: 'green' },
  { icon: <BulbOutlined />, text: '\u5206\u6790\u5546\u673a\u8f6c\u5316\u74f6\u9888\uff0c\u63d0\u4f9b\u4f18\u5316\u65b9\u6848', color: 'orange' },
  { icon: <BulbOutlined />, text: '\u5236\u5b9a\u4e0b\u5468\u7684\u63a8\u5e7f\u8ba1\u5212', color: 'purple' },
];

export default function AIAgent() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [convLoading, setConvLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Load conversations
  const fetchConversations = async () => {
    setConvLoading(true);
    try {
      const res = await axios.get(`${AGENT_API}/conversations`, { headers: getAuthHeaders() });
      if (res.data.code === 0 || res.data.code === 200) {
        setConversations(res.data.data || []);
      }
    } catch { /* ignore */ }
    finally { setConvLoading(false); }
  };

  useEffect(() => { fetchConversations(); }, []);

  // Load conversation messages
  const loadConversation = async (convId: string) => {
    setCurrentConvId(convId);
    setMessages([]);
    try {
      const res = await axios.get(`${AGENT_API}/conversations/${convId}`, { headers: getAuthHeaders() });
      if (res.data.code === 0 || res.data.code === 200) {
        setMessages(res.data.data?.messages || []);
      }
    } catch { /* ignore */ }
  };

  // Send message (non-streaming for simplicity)
  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: MessageItem = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${AGENT_API}/chat`, {
        message: text,
        conversationId: currentConvId,
      }, { headers: getAuthHeaders(), timeout: 120000 });

      if (res.data.code === 0) {
        const { conversationId, reply } = res.data.data;
        if (!currentConvId) {
          setCurrentConvId(conversationId);
          fetchConversations();
        }
        setMessages(prev => [...prev, {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: reply,
          createdAt: new Date().toISOString(),
        }]);
      } else {
        message.error(res.data.message || 'AI \u56de\u590d\u5931\u8d25');
      }
    } catch (err: any) {
      if (err.code === 'ECONNABORTED') {
        message.error('AI \u54cd\u5e94\u8d85\u65f6\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5');
      } else {
        message.error(err.response?.data?.message || 'AI \u670d\u52a1\u5f02\u5e38');
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete conversation
  const deleteConversation = async (convId: string) => {
    try {
      await axios.delete(`${AGENT_API}/conversations/${convId}`, { headers: getAuthHeaders() });
      if (currentConvId === convId) {
        setCurrentConvId(null);
        setMessages([]);
      }
      fetchConversations();
      message.success('\u5bf9\u8bdd\u5df2\u5220\u9664');
    } catch { message.error('\u5220\u9664\u5931\u8d25'); }
  };

  // New conversation
  const newConversation = () => {
    setCurrentConvId(null);
    setMessages([]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Headers
      if (line.startsWith('### ')) return <div key={i} style={{ fontWeight: 'bold', fontSize: 15, marginTop: 12, marginBottom: 4 }}>{line.slice(4)}</div>;
      if (line.startsWith('## ')) return <div key={i} style={{ fontWeight: 'bold', fontSize: 16, marginTop: 16, marginBottom: 6 }}>{line.slice(3)}</div>;
      // List items
      if (line.startsWith('- ')) return <div key={i} style={{ paddingLeft: 16, marginBottom: 2 }}>{'\u2022'} {line.slice(2)}</div>;
      if (line.match(/^\d+\. /)) return <div key={i} style={{ paddingLeft: 16, marginBottom: 2 }}>{line}</div>;
      // Bold
      const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (boldLine !== line) return <div key={i} dangerouslySetInnerHTML={{ __html: boldLine }} style={{ marginBottom: 2 }} />;
      // Empty line
      if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
      // Normal text
      return <div key={i} style={{ marginBottom: 2 }}>{line}</div>;
    });
  };

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 140px)' }}>
      {/* Left sidebar - Conversation list */}
      <Card
        size="small"
        style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, overflow: 'auto', padding: 8 }}
        title={
          <Space>
            <MessageOutlined />
            <span>{'\u5bf9\u8bdd\u5217\u8868'}</span>
          </Space>
        }
        extra={
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={newConversation}>
            {'\u65b0\u5efa'}
          </Button>
        }
      >
        {convLoading ? (
          <div style={{ textAlign: 'center', padding: 20 }}><Spin /></div>
        ) : conversations.length === 0 ? (
          <Empty description={"\u6682\u65e0\u5bf9\u8bdd"} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            dataSource={conversations}
            renderItem={(conv) => (
              <List.Item
                style={{
                  padding: '8px 12px', cursor: 'pointer', borderRadius: 6,
                  background: currentConvId === conv.id ? '#e6f4ff' : 'transparent',
                  marginBottom: 4,
                }}
                onClick={() => loadConversation(conv.id)}
                actions={[
                  <Popconfirm title={"\u786e\u5b9a\u5220\u9664\uff1f"} onConfirm={(e) => { e?.stopPropagation(); deleteConversation(conv.id); }} key="del">
                    <DeleteOutlined style={{ color: '#ff4d4f', fontSize: 12 }} onClick={e => e.stopPropagation()} />
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  avatar={<RobotOutlined style={{ fontSize: 16, color: '#1677ff' }} />}
                  title={<Text ellipsis style={{ fontSize: 13 }}>{conv.title}</Text>}
                  description={<Text type="secondary" style={{ fontSize: 11 }}>{new Date(conv.updatedAt).toLocaleDateString('zh-CN')}</Text>}
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Right - Chat area */}
      <Card
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
      >
        {/* Messages area */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 80 }}>
              <RobotOutlined style={{ fontSize: 64, color: '#1677ff', marginBottom: 16 }} />
              <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>{'ST-LTD AI \u667a\u56ca'}</div>
              <Text type="secondary">{'\u57fa\u4e8e\u4e1a\u52a1\u6570\u636e\uff0c\u4e3a\u60a8\u63d0\u4f9b\u8425\u9500\u5efa\u8bae\u3001\u7ebf\u7d22\u5206\u6790\u3001\u5185\u5bb9\u7b56\u5212\u7b49\u667a\u80fd\u670d\u52a1'}</Text>
              <Divider />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                {quickSuggestions.map((s, i) => (
                  <Button
                    key={i}
                    icon={s.icon}
                    onClick={() => sendMessage(s.text)}
                    style={{ borderRadius: 20 }}
                  >
                    {s.text}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.filter(m => m.role !== 'system').map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex', gap: 12, marginBottom: 20,
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  }}
                >
                  <Avatar
                    icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                    style={{
                      background: msg.role === 'user' ? '#1677ff' : '#722ed1',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{
                    maxWidth: '75%', padding: '12px 16px', borderRadius: 12,
                    background: msg.role === 'user' ? '#1677ff' : '#f5f5f5',
                    color: msg.role === 'user' ? '#fff' : '#333',
                  }}>
                    {msg.role === 'assistant' ? renderContent(msg.content) : (
                      <Paragraph style={{ margin: 0, color: '#fff' }}>{msg.content}</Paragraph>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <Avatar icon={<RobotOutlined />} style={{ background: '#722ed1', flexShrink: 0 }} />
                  <div style={{ padding: '12px 16px', borderRadius: 12, background: '#f5f5f5' }}>
                    <Spin size="small" /> <Text type="secondary">{'AI \u6b63\u5728\u601d\u8003...'}</Text>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid #f0f0f0', background: '#fafafa' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <TextArea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={"\u8f93\u5165\u60a8\u7684\u95ee\u9898\uff0c\u6309 Enter \u53d1\u9001\uff0cShift+Enter \u6362\u884c..."}
              autoSize={{ minRows: 1, maxRows: 4 }}
              disabled={loading}
              style={{ borderRadius: 8 }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => sendMessage(input)}
              loading={loading}
              disabled={!input.trim()}
              style={{ height: 'auto', borderRadius: 8 }}
            >
              {'\u53d1\u9001'}
            </Button>
          </div>
          <div style={{ marginTop: 6 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {'AI \u667a\u56ca\u4f1a\u57fa\u4e8e\u5f53\u524d\u4e1a\u52a1\u6570\u636e\u8fdb\u884c\u5206\u6790\uff0c\u5305\u62ec\u7ebf\u7d22\u3001\u5ba2\u6237\u3001\u5546\u673a\u3001\u5185\u5bb9\u7b49'}
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
}
