import React, { useState, useEffect } from 'react';
import { Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { GlobalOutlined } from '@ant-design/icons';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState(i18n.language || 'zh');

  useEffect(() => {
    setLang(i18n.language);
  }, [i18n.language]);

  const handleChange = (value: string) => {
    setLang(value);
    localStorage.setItem('i18n_lng', value);
    i18n.changeLanguage(value);
  };

  return (
    <Select
      value={lang}
      onChange={handleChange}
      style={{ width: 100 }}
      suffixIcon={<GlobalOutlined />}
      options={[
        { value: 'zh', label: '中文' },
        { value: 'en', label: 'English' },
      ]}
    />
  );
};

export default LanguageSwitcher;
