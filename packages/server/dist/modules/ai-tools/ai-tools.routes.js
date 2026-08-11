"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const router = (0, express_1.Router)();
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
// 内容智能扩写 - 无需管理员权限
router.post('/content-expand', async (req, res) => {
    try {
        const { content, title, mode } = req.body;
        if (!content && !title)
            return res.json({ code: 400, message: '请提供内容或标题' });
        if (!DEEPSEEK_API_KEY)
            return res.json({ code: 500, message: 'AI 服务未配置' });
        const modeConfig = {
            expand: '请对以下内容进行扩写，丰富细节、增加论据和案例，使内容更加充实饱满。保持原有核心观点不变，增加深度和广度。',
            rewrite: '请对以下内容进行改写优化，提升文字质量、可读性和专业度，使表达更加精准有力。',
            summary: '请对以下内容进行精炼总结，提取核心要点，生成简洁的摘要。',
            seo: '请对以下内容进行SEO优化改写，增加关键词密度、优化标题结构、改善可读性，使其更适合搜索引擎收录。',
        };
        const instruction = modeConfig[mode || 'expand'] || modeConfig.expand;
        const prompt = `你是一个专业的内容创作专家。${instruction}

${title ? `文章标题：${title}\n\n` : ''}原文内容：
${content || '（无内容）'}

要求：
1. 保持中文输出
2. 内容专业、有深度
3. 结构清晰，段落分明
4. 直接输出修改后的内容，不要加任何说明或前缀`;
        const response = await axios_1.default.post(`${DEEPSEEK_BASE_URL}/chat/completions`, { model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 3000, temperature: 0.8 }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` }, timeout: 60000 });
        const reply = response.data?.choices?.[0]?.message?.content || '';
        res.json({ code: 0, data: { expanded: reply }, message: 'success' });
    }
    catch (error) {
        console.error('内容扩写错误:', error.message);
        res.json({ code: 500, message: 'AI 扩写失败，请稍后重试' });
    }
});
// SEO 智能分析 - 无需管理员权限
router.post('/seo-analyze', async (req, res) => {
    try {
        const { siteName, domain, seoTitle, seoDesc, seoKeywords, pages } = req.body;
        if (!DEEPSEEK_API_KEY)
            return res.json({ code: 500, message: 'AI 服务未配置' });
        const prompt = `你是一个专业的 SEO 优化专家。请分析以下站点/页面的 SEO 状况，并给出具体优化建议。

## 站点信息
- 站点名称: ${siteName || '未设置'}
- 域名: ${domain || '未设置'}
- SEO标题: ${seoTitle || '未设置'}
- SEO描述: ${seoDesc || '未设置'}
- SEO关键词: ${seoKeywords || '未设置'}
- 页面数量: ${pages?.length || 0}

${pages?.length ? '## 页面列表\n' + pages.map((p, i) => `${i + 1}. ${p.title || p.name} - slug: ${p.slug}`).join('\n') : ''}

请从以下维度分析并给出建议：
1. **标题优化**：SEO标题是否合理，建议修改方案
2. **描述优化**：Meta描述是否吸引人，建议修改方案
3. **关键词建议**：推荐适合的高频搜索关键词
4. **内容策略**：针对该站点类型的内容发布建议
5. **技术SEO**：sitemap、robots、结构化数据等方面的建议

请用中文回答，给出具体可执行的修改建议，不要泛泛而谈。`;
        const response = await axios_1.default.post(`${DEEPSEEK_BASE_URL}/chat/completions`, { model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 2000, temperature: 0.7 }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` }, timeout: 60000 });
        const reply = response.data?.choices?.[0]?.message?.content || '';
        res.json({ code: 0, data: { suggestion: reply }, message: 'success' });
    }
    catch (error) {
        console.error('SEO AI分析错误:', error.message);
        res.json({ code: 500, message: 'AI 分析失败，请稍后重试' });
    }
});
exports.default = router;
//# sourceMappingURL=ai-tools.routes.js.map