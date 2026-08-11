"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../../common/response");
const router = (0, express_1.Router)();
// OCR.Space 配置（免费，无需实名认证）
const OCR_SPACE_API_KEY = 'helloworld'; // 免费测试key，可替换为自己的
/**
 * 名片OCR识别（OCR.Space）
 * POST /api/v1/ocr/business-card
 * Body: { image: base64 string (data:image/xxx;base64,...) }
 */
router.post('/business-card', async (req, res) => {
    try {
        const { image } = req.body;
        if (!image)
            return (0, response_1.fail)(res, '请提供图片');
        // 提取纯base64
        const base64Data = image.includes(',') ? image.split(',')[1] : image;
        // 调用 OCR.Space API
        const formData = new URLSearchParams();
        formData.append('base64Image', `data:image/png;base64,${base64Data}`);
        formData.append('language', 'chs'); // 中文
        formData.append('isOverlayRequired', 'false');
        formData.append('detectOrientation', 'true');
        formData.append('scale', 'true');
        formData.append('OCREngine', '2'); // 引擎2，对中文更好
        if (OCR_SPACE_API_KEY) {
            formData.append('apikey', OCR_SPACE_API_KEY);
        }
        const ocrRes = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString(),
        });
        const ocrData = await ocrRes.json();
        if (ocrData.IsErroredOnProcessing) {
            return (0, response_1.fail)(res, ocrData.ErrorMessage?.[0] || 'OCR识别失败');
        }
        // 提取所有文本
        let fullText = '';
        if (ocrData.ParsedResults && ocrData.ParsedResults.length > 0) {
            fullText = ocrData.ParsedResults[0].ParsedText || '';
        }
        if (!fullText.trim()) {
            return (0, response_1.fail)(res, '未能识别出文字，请拍清晰一些');
        }
        // 基于规则解析名片信息
        const info = parseCardText(fullText);
        info._rawText = fullText; // 返回原始文本供前端调试
        (0, response_1.success)(res, info, '识别成功');
    }
    catch (error) {
        console.error('OCR识别错误:', error);
        (0, response_1.fail)(res, error.message || 'OCR识别失败');
    }
});
// 名片文本解析规则
function parseCardText(text) {
    const info = { name: '', company: '', phone: '', email: '' };
    const lines = text.split(/\n|。|；|;|\|/).map((l) => l.trim()).filter((l) => l.length > 0);
    // 标签正则
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
                if (m) {
                    info.email = m[0].toLowerCase();
                    continue;
                }
            }
            const m = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (m) {
                info.email = m[0].toLowerCase();
            }
        }
    }
    // 2. 电话（数字组合）
    for (const line of lines) {
        if (faxLabel.test(line))
            continue;
        if (!info.phone) {
            if (phoneLabel.test(line)) {
                const m1 = line.match(/\+?86[\s-]*1[3-9][\d\s-]{9,12}/);
                if (m1) {
                    info.phone = m1[0].replace(/[\s\-()]/g, '');
                    continue;
                }
                const m2 = line.match(/1[3-9][\d\s-]{9,12}/);
                if (m2) {
                    info.phone = m2[0].replace(/[\s\-()]/g, '');
                    continue;
                }
                const m3 = line.match(/0\d{2,3}[\s-]?\d{7,8}/);
                if (m3) {
                    info.phone = m3[0].replace(/[\s\-()]/g, '');
                    continue;
                }
                const m4 = line.match(/400[\s-]?\d{3,4}[\s-]?\d{3,4}/);
                if (m4) {
                    info.phone = m4[0].replace(/[\s\-()]/g, '');
                    continue;
                }
                const m5 = line.match(/(\d{7,15})/);
                if (m5) {
                    info.phone = m5[1];
                    continue;
                }
            }
            const m1 = line.match(/\+?86[\s-]*1[3-9][\d\s-]{9,12}/);
            if (m1) {
                info.phone = m1[0].replace(/[\s\-()]/g, '');
                continue;
            }
            const m2 = line.match(/1[3-9][\d\s-]{9,12}/);
            if (m2) {
                info.phone = m2[0].replace(/[\s\-()]/g, '');
                continue;
            }
            const m3 = line.match(/0\d{2,3}[\s-]?\d{7,8}/);
            if (m3) {
                info.phone = m3[0].replace(/[\s\-()]/g, '');
                continue;
            }
            const m4 = line.match(/400[\s-]?\d{3,4}[\s-]?\d{3,4}/);
            if (m4) {
                info.phone = m4[0].replace(/[\s\-()]/g, '');
                continue;
            }
        }
    }
    // 3. 公司名
    for (const line of lines) {
        if (!info.company) {
            if ((line.length < 4 || line.length > 30))
                continue;
            if (addressKeywords.test(line))
                continue;
            if (/1[3-9]\d{9}/.test(line))
                continue;
            if (line.includes('@'))
                continue;
            if (companySuffixWords.test(line) || companyKeywords.test(line)) {
                info.company = line;
                continue;
            }
            if (/^[A-Z]{2,10}$/.test(line) && line.length >= 2) {
                info.company = line;
                continue;
            }
        }
    }
    // 4. 姓名（2-4个汉字，排除公司/职位）
    for (const line of lines) {
        if (!info.name) {
            if (/[0-9@\-\/\\]/.test(line))
                continue;
            if (line.length > 6)
                continue;
            if (/^[\u4e00-\u9fa5]{2,4}$/.test(line)) {
                if (companySuffixWords.test(line) || companyKeywords.test(line))
                    continue;
                if (positionKeywords.test(line))
                    continue;
                info.name = line;
                continue;
            }
            const cnEn = line.match(/^([\u4e00-\u9fa5]{2,4})\s+[A-Za-z]/);
            if (cnEn) {
                info.name = cnEn[1];
                continue;
            }
        }
    }
    return info;
}
exports.default = router;
//# sourceMappingURL=ocr.routes.js.map