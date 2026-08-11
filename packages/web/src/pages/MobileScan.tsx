import { useState, useRef, useEffect } from 'react';
import { authApi, scrmApi } from '../services/api';

// OCR.Space API（免费，无需实名认证）
const OCR_SPACE_API_KEY = 'helloworld'; // 免费测试 key

interface CardInfo {
  name: string;
  company: string;
  phone: string;
  email: string;
}

// 名片文本解析规则
function parseCardText(text: string): CardInfo {
  const info: CardInfo = { name: '', company: '', phone: '', email: '' };
  const lines = text.split(/\n|。|；|;|\|/).map(l => l.trim()).filter(l => l.length > 0);

  const phoneLabel = /\b(Tel|Mob|Mobile|Cell|手机|电话|移动|固话)\b/i;
  const faxLabel = /\b(Fax|传真)\b/i;
  const emailLabel = /\b(Email|E-mail|邮箱)\b/i;
  const addressKeywords = /街道|路|号|大厦|广场|栋|楼|层|室|Add|Address|地址/;
  const companySuffixWords = /有限公司|集团|股份|科技|商贸|中心|协会|事务所|控股|实业$/;
  const companyKeywords = /有限|责任|科技|技术|网络|信息|软件|实业|控股|股份|商贸|贸易/;
  const positionKeywords = /经理|总监|总裁|总经理|顾问|主管|主任|工程师|设计师|代表|专员|助理|院长|校长|教授|医生|律师|CEO|CTO|CFO|COO|VP/;

  // 1. 邮箱（带@，最确定）
  for (const line of lines) {
    if (!info.email) {
      if (emailLabel.test(line)) {
        const m = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (m) { info.email = m[0].toLowerCase(); continue; }
      }
      const m = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (m) { info.email = m[0].toLowerCase(); }
    }
  }

  // 2. 电话
  for (const line of lines) {
    if (faxLabel.test(line)) continue;
    if (!info.phone) {
      if (phoneLabel.test(line)) {
        const m1 = line.match(/\+?86[\s-]*1[3-9][\d\s-]{9,12}/);
        if (m1) { info.phone = m1[0].replace(/[\s\-()]/g, ''); continue; }
        const m2 = line.match(/1[3-9][\d\s-]{9,12}/);
        if (m2) { info.phone = m2[0].replace(/[\s\-()]/g, ''); continue; }
        const m3 = line.match(/0\d{2,3}[\s-]?\d{7,8}/);
        if (m3) { info.phone = m3[0].replace(/[\s\-()]/g, ''); continue; }
        const m4 = line.match(/400[\s-]?\d{3,4}[\s-]?\d{3,4}/);
        if (m4) { info.phone = m4[0].replace(/[\s\-()]/g, ''); continue; }
        const m5 = line.match(/(\d{7,15})/);
        if (m5) { info.phone = m5[1]; continue; }
      }
      const m1 = line.match(/\+?86[\s-]*1[3-9][\d\s-]{9,12}/);
      if (m1) { info.phone = m1[0].replace(/[\s\-()]/g, ''); continue; }
      const m2 = line.match(/1[3-9][\d\s-]{9,12}/);
      if (m2) { info.phone = m2[0].replace(/[\s\-()]/g, ''); continue; }
      const m3 = line.match(/0\d{2,3}[\s-]?\d{7,8}/);
      if (m3) { info.phone = m3[0].replace(/[\s\-()]/g, ''); continue; }
      const m4 = line.match(/400[\s-]?\d{3,4}[\s-]?\d{3,4}/);
      if (m4) { info.phone = m4[0].replace(/[\s\-()]/g, ''); continue; }
    }
  }

  // 3. 公司名
  for (const line of lines) {
    if (!info.company) {
      if (line.length < 4 || line.length > 30) continue;
      if (addressKeywords.test(line)) continue;
      if (/1[3-9]\d{9}/.test(line)) continue;
      if (line.includes('@')) continue;
      if (companySuffixWords.test(line) || companyKeywords.test(line)) {
        info.company = line; continue;
      }
      if (/^[A-Z]{2,10}$/.test(line) && line.length >= 2) {
        info.company = line; continue;
      }
    }
  }

  // 4. 姓名（多种模式匹配）
  // 收集所有候选行，排除已识别为公司/电话/邮箱/地址的行
  const excludedLines = new Set<string>();
  lines.forEach(l => {
    if (l.includes('@') || /1[3-9]\d{9}/.test(l) || addressKeywords.test(l)) excludedLines.add(l);
    if (companySuffixWords.test(l) || (/^[A-Z]{2,10}$/.test(l) && l.length >= 2)) excludedLines.add(l);
  });

  for (const line of lines) {
    if (info.name) break;
    if (excludedLines.has(line)) continue;

    // 模式A: 纯中文姓名 2-4字（整行或行内提取）
    const pureCn = line.match(/^[\u4e00-\u9fa5]{2,4}$/);
    if (pureCn && !companyKeywords.test(line) && !positionKeywords.test(line)) {
      info.name = pureCn[0]; continue;
    }

    // 模式B: 中文姓名 + 英文名（许舒婷 Luisa / 许舒婷Luisa）
    const cnBeforeEn = line.match(/^([\u4e00-\u9fa5]{2,4})\s*[A-Za-z]/);
    if (cnBeforeEn && !companyKeywords.test(cnBeforeEn[1]) && !positionKeywords.test(cnBeforeEn[1])) {
      info.name = cnBeforeEn[1]; continue;
    }

    // 模式C: 英文名 + 中文姓名（Luisa 许舒婷）
    const enBeforeCn = line.match(/^[A-Za-z]+\s*([\u4e00-\u9fa5]{2,4})/);
    if (enBeforeCn && !positionKeywords.test(enBeforeCn[1])) {
      info.name = enBeforeCn[1]; continue;
    }

    // 模式D: 中文姓名 + 职位（许舒婷 销售经理）— 提取前面2-4汉字
    const cnWithPos = line.match(/^([\u4e00-\u9fa5]{2,4})[\s]*(?:经理|总监|总裁|总经理|顾问|主管|主任|工程师|设计师|代表|专员|助理|院长|校长|教授|医生|律师)/);
    if (cnWithPos && !companyKeywords.test(cnWithPos[1])) {
      info.name = cnWithPos[1]; continue;
    }

    // 模式E: 行内提取2-4个连续汉字（排除公司/职位关键词）
    const inlineCn = line.match(/([\u4e00-\u9fa5]{2,4})/);
    if (inlineCn && line.length <= 12) {
      const candidate = inlineCn[1];
      if (!companyKeywords.test(candidate) && !positionKeywords.test(candidate) && !addressKeywords.test(line)) {
        info.name = candidate;
      }
    }
  }

  return info;
}

export default function MobileScan() {
  const [image, setImage] = useState<string | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rawText, setRawText] = useState('');
  const [info, setInfo] = useState<CardInfo>({ name: '', company: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [recentCards, setRecentCards] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // 加载最近5条名片扫描记录
  const loadRecentCards = async () => {
    try {
      const res: any = await scrmApi.getLeads({ source: 'card', pageSize: 5 });
      const list = res?.data?.list || res?.data || [];
      setRecentCards(Array.isArray(list) ? list : []);
    } catch {}
  };

  useEffect(() => { loadRecentCards(); }, []);

  const handleImage = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imgData = e.target?.result as string;
      setImage(imgData);
      setRecognizing(true);
      setProgress(0);
      setRawText('');
      setMessage('');

      try {
        // 调用 OCR.Space API
        const formData = new FormData();
        formData.append('base64Image', imgData);
        formData.append('language', 'chs');
        formData.append('isOverlayRequired', 'false');
        formData.append('detectOrientation', 'true');
        formData.append('scale', 'true');
        formData.append('OCREngine', '2');
        if (OCR_SPACE_API_KEY) {
          formData.append('apikey', OCR_SPACE_API_KEY);
        }

        const res = await fetch('https://api.ocr.space/parse/image', {
          method: 'POST',
          body: formData,
        });

        // 模拟进度
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        const data: any = await res.json();
        clearInterval(progressInterval);
        setProgress(100);

        if (data.IsErroredOnProcessing) {
          setMessage(data.ErrorMessage?.[0] || '识别失败');
          setRecognizing(false);
          return;
        }

        // 提取文本
        let fullText = '';
        if (data.ParsedResults && data.ParsedResults.length > 0) {
          fullText = data.ParsedResults[0].ParsedText || '';
        }

        if (!fullText.trim()) {
          setMessage('未能识别出文字，请拍清晰一些');
          setRecognizing(false);
          return;
        }

        setRawText(fullText);
        setInfo(parseCardText(fullText));
        setMessage('识别完成，请核对信息后保存');
      } catch {
        setMessage('识别失败，请重试');
      } finally {
        setRecognizing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!info.name && !info.phone && !info.email) { setMessage('请至少填写姓名、电话或邮箱'); return; }
    setSaving(true);
    try {
      let token = localStorage.getItem('token');
      if (!token) {
        const loginRes: any = await authApi.adminLogin({ email: 'admin@ltd.com', password: 'admin123' });
        if (loginRes.code === 0) { token = loginRes.data.token; localStorage.setItem('token', token); }
      }
      const res: any = await scrmApi.createLead({ name: info.name || '未命名', company: info.company, phone: info.phone, email: info.email, source: 'card' });
      if (res.code === 0) {
        setMessage('保存成功！');
        setImage(null); setInfo({ name: '', company: '', phone: '', email: '' }); setRawText('');
        loadRecentCards();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(res.message || '保存失败');
      }
    } catch (err: any) {
      setMessage(err?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { label: '姓名', key: 'name' as const },
    { label: '联系电话', key: 'phone' as const },
    { label: '邮箱', key: 'email' as const },
    { label: '公司名称', key: 'company' as const },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #e8f4fd 0%, #f0f5ff 50%, #f5f8ff 100%)', fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif' }}>
      {/* 顶部导航 */}
      <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a3a6e 50%, #0f4c9e 100%)', color: '#fff', padding: '18px 20px', textAlign: 'center', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 4px 20px rgba(15, 76, 158, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/><circle cx="12" cy="12" r="2"/></svg>
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: 1 }}>名片扫描导入</span>
        </div>
      </div>
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {/* 上传区域 */}
        {!image && (
          <div onClick={() => fileRef.current?.click()} style={{ background: '#fff', borderRadius: 16, padding: '50px 20px', textAlign: 'center', border: '2px dashed #b8d4f0', cursor: 'pointer', boxShadow: '0 2px 16px rgba(0, 119, 255, 0.06)', transition: 'all 0.3s' }}>
            <div style={{ width: 72, height: 72, margin: '0 auto 16px', borderRadius: '50%', background: 'linear-gradient(135deg, #e8f4fd, #d0e8ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0077ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
            <div style={{ fontSize: 16, color: '#1a3a6e', fontWeight: 600 }}>点击拍照或选择名片图片</div>
            <div style={{ fontSize: 13, color: '#8ba4c4', marginTop: 8 }}>支持 JPG、PNG 格式 · AI 智能识别</div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImage(f); }} />

        {image && (
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 16, boxShadow: '0 2px 16px rgba(0, 119, 255, 0.08)' }}>
            <img src={image} alt="名片" style={{ width: '100%', maxHeight: 280, objectFit: 'contain', background: '#0a1628' }} />
            {recognizing && (
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 16, height: 16, border: '2px solid #0077ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: 14, color: '#0077ff', fontWeight: 500 }}>AI 智能识别中... {progress}%</span>
                </div>
                <div style={{ height: 6, background: '#e8f0fe', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #00b4ff, #0077ff)', borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
              </div>
            )}
            {!recognizing && (
              <div style={{ padding: '12px 20px', display: 'flex', gap: 10 }}>
                <button onClick={() => fileRef.current?.click()} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #b8d4f0', background: '#f0f7ff', fontSize: 14, color: '#0077ff', fontWeight: 500, cursor: 'pointer' }}>重新拍照</button>
                <button onClick={() => { setImage(null); setInfo({ name: '', company: '', phone: '', email: '' }); setRawText(''); setMessage(''); }} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #ffd0d0', background: '#fff5f5', fontSize: 14, color: '#ff4d4f', fontWeight: 500, cursor: 'pointer' }}>清除</button>
              </div>
            )}
          </div>
        )}

        {rawText && !recognizing && (
          <details style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 16, boxShadow: '0 1px 8px rgba(0, 119, 255, 0.05)' }}>
            <summary style={{ fontSize: 13, color: '#0077ff', cursor: 'pointer', fontWeight: 500 }}>查看原始识别文本</summary>
            <pre style={{ fontSize: 12, color: '#5a7a9a', whiteSpace: 'pre-wrap', margin: '8px 0 0', lineHeight: 1.6, background: '#f5f9ff', padding: 10, borderRadius: 8 }}>{rawText}</pre>
          </details>
        )}

        {(info.name || info.phone || info.email || info.company) && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 16px rgba(0, 119, 255, 0.08)' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1a3a6e', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0077ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              识别结果
            </div>
            {fields.map(({ label, key }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>{label}</div>
                <input value={info[key]} onChange={(e) => setInfo({ ...info, [key]: e.target.value })} placeholder={`请输入${label}`}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #dce8f5', fontSize: 15, boxSizing: 'border-box', outline: 'none', background: '#f8fbff', color: '#1a3a6e', transition: 'all 0.2s' }}
                  onFocus={(e) => { e.target.style.borderColor = '#0077ff'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(0,119,255,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#dce8f5'; e.target.style.background = '#f8fbff'; e.target.style.boxShadow = 'none'; }} />
              </div>
            ))}
          </div>
        )}

        {(info.name || info.phone || info.email) && !recognizing && (
          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
            background: saving ? '#ccc' : 'linear-gradient(135deg, #00b4ff 0%, #0077ff 100%)',
            color: '#fff', fontSize: 16, fontWeight: 600, cursor: saving ? 'default' : 'pointer',
            boxShadow: '0 4px 16px rgba(0, 119, 255, 0.3)',
          }}>
            {saving ? '保存中...' : '保存为线索'}
          </button>
        )}

        {message && (
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10,
            background: message.includes('成功') ? '#f0fff0' : message.includes('失败') ? '#fff0f0' : '#f0f8ff',
            color: message.includes('成功') ? '#52c41a' : message.includes('失败') ? '#ff4d4f' : '#1677ff',
            fontSize: 14, textAlign: 'center'
          }}>{message}</div>
        )}

        {/* 最近名片记录 */}
        {recentCards.length > 0 && (
          <div style={{ marginTop: 20, background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 16px rgba(0, 119, 255, 0.08)' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1a3a6e', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0077ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              最近扫描记录
            </div>
            {recentCards.map((card: any, idx: number) => (
              <div key={card.id} style={{
                padding: '12px 0',
                borderBottom: idx < recentCards.length - 1 ? '1px solid #eef3fa' : 'none',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e8f4fd, #d0e8ff)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 600, color: '#0077ff', flexShrink: 0,
                }}>{(card.name || '?')[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a3a6e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {card.name || '未命名'}
                    {card.company && <span style={{ fontSize: 12, fontWeight: 400, color: '#8ba4c4', marginLeft: 6 }}>{card.company}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {card.phone && <span>{card.phone}</span>}
                    {card.email && <span>{card.email}</span>}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#b0c4de', flexShrink: 0 }}>
                  {card.createdAt ? new Date(card.createdAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ textAlign: 'center', padding: '28px 0 20px', color: '#8ba4c4', fontSize: 12, lineHeight: 1.8 }}>
          <div style={{ fontWeight: 500, color: '#5a7a9a' }}>辽宁高新安防科技有限公司</div>
          <div>技术研发部</div>
        </div>
      </div>
    </div>
  );
}
