import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fa' ? 'en' : 'fa';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="flex justify-between items-center p-4">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-gray-400">{t('subtitle')}</p>
      </div>

      {/* دکمه سوییچ زبان */}
      <button
        onClick={toggleLanguage}
        className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm font-medium"
      >
        {i18n.language === 'fa' ? 'English' : 'فارسی'}
      </button>
    </header>
  );
}