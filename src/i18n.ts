import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          "Today's Tasks": "Today's Tasks",
          "remaining": "remaining",
          "Clear All": "Clear All",
          "What needs to be done?": "What needs to be done?",
          "Welcome": "Welcome to SoftDo {{version}}!",
          "Enjoy features": "Enjoy the new Resize & Opacity features.",
          "Up to date": "Up to date",
          "Latest version": "You are on the latest version {{version}}",
          "Update Available": "New Version {{version}}",
          "Update": "Update",
          "Skip": "Skip",
          "Opacity": "Opacity",
          "Auto Start": "Auto Start",
          "Language": "Language"
        }
      },
      zh: {
        translation: {
          "Today's Tasks": "今日任务",
          "remaining": "剩余",
          "Clear All": "清除所有",
          "What needs to be done?": "有什么需要做的?",
          "Welcome": "欢迎使用 SoftDo {{version}}!",
          "Enjoy features": "尽情享受新的调整大小和透明度功能。",
          "Up to date": "已是最新版本",
          "Latest version": "您正在使用最新版本 {{version}}",
          "Update Available": "新版本 {{version}}",
          "Update": "更新",
          "Skip": "跳过",
          "Opacity": "透明度",
          "Auto Start": "开机自启",
          "Language": "语言"
        }
      }
    },
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
