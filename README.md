<div align="center">

# ✨ SoftDo

### A Beautiful Desktop Todo Widget

**精美的桌面待办小组件**

[![Build](https://github.com/xxomega2077xx/softdo/actions/workflows/build.yml/badge.svg)](https://github.com/xxomega2077xx/softdo/actions)
[![Version](https://img.shields.io/badge/version-1.1.2-purple)](https://github.com/xxomega2077xx/softdo/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-blue)](https://github.com/xxomega2077xx/softdo/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

<br/>

> 🎨 **Glassmorphism Design** • ⏰ **Smart Due Times** • 💾 **Auto Save** • 📌 **System Tray**

</div>

---

## 🌟 About | 关于

**SoftDo** is a modern, elegant desktop todo widget that stays on your desktop. Built with a stunning glassmorphism design, smooth Framer Motion animations, and thoughtful UX details that make task management a joy.

**SoftDo** 是一款现代优雅的桌面待办小组件，常驻于您的桌面。采用惊艳的玻璃拟态设计、丝滑的 Framer Motion 动画，以及精心打磨的用户体验细节，让任务管理成为一种享受。

---

## 🆕 What's New in v1.1.2 | 新版本特性

- ↔️ **Multi-Corner Resizing** - Resize from bottom-right or bottom-left freely
- ✨ **Glow Interaction** - Subtle glow indicates resize areas (no ugly icons)
- 💧 **Opacity Control** - Adjust window transparency (20%-100%) via droplet menu
- 🔧 **Fixed Shadow Issue** - Clean transparent window on all backgrounds
- 🖥️ **System Tray** - Minimize to tray, right-click menu
- 🔄 **Smart Updates** - Auto-check with beautiful welcome notification
- 📌 **Desktop Shortcut** - Automatically created during installation

---

## ✨ Features | 功能特点

### 🎨 Premium Design | 高级设计

- **Glassmorphism UI** - Clean, elegant appearance on any wallpaper
- **Smooth Animations** - Satisfying checkbox completion effects
- **Custom Window Controls** - Minimal, clean window buttons
- **Opacity Control** - Adjustable transparency for perfect integration

### 📋 Task Management | 任务管理

- **Quick Add** - Simple input to add tasks instantly
- **Smart Due Times** - Optional due dates with inline calendar picker
- **Real-time Countdown** - Shows time remaining (e.g., "5m left", "2h overdue")
- **Auto Color Coding** - Red for overdue, amber for urgent

### 🖥️ Desktop Widget | 桌面小组件

- **Frameless Window** - Clean, borderless design
- **Draggable & Resizable** - Move and resize anywhere on your desktop
- **Always on Top** - Pin to stay above other windows
- **System Tray** - Minimize to tray, click to show/hide
- **Compact Size** - scalable from compact to large

### 💾 Data & Storage | 数据存储

- **Local Storage** - Tasks saved automatically
- **No Account Needed** - Works completely offline
- **Clear All** - One-click to clear completed tasks

### 🔄 Auto Updates | 自动更新

- **Version Check** - Automatically checks GitHub for new releases
- **Smart Notifications** - Non-intrusive update prompts
- **Skip Option** - "Don't remind me" for network issues

---

## 📥 Download | 下载

Get the latest version for your platform:

| Platform    | Download                                                                            | Notes                                        |
| ----------- | ----------------------------------------------------------------------------------- | -------------------------------------------- |
| **Windows** | [SoftDo-1.1.2-Windows.exe](https://github.com/xxomega2077xx/softdo/releases/latest) | Windows 10/11, auto-creates desktop shortcut |
| **macOS**   | [SoftDo-1.1.2-macOS.dmg](https://github.com/xxomega2077xx/softdo/releases/latest)   | macOS 12+ (Apple Silicon)                    |

👉 [View All Releases](https://github.com/xxomega2077xx/softdo/releases)

---

## 🛠️ Development | 开发

### Prerequisites | 前置要求

- Node.js 20+
- npm or yarn

### Quick Start | 快速开始

```bash
# Clone the repository | 克隆仓库
git clone https://github.com/xxomega2077xx/softdo.git
cd softdo

# Install dependencies | 安装依赖
npm install

# Run in development mode | 开发模式运行
npm run electron:dev

# Build for production | 生产构建
npm run electron:build
```

### Project Structure | 项目结构

```
softdo/
├── src/
│   ├── components/
│   │   ├── TodoInput.tsx    # Task input with due time picker
│   │   ├── TodoItem.tsx     # Individual task component
│   │   └── TodoList.tsx     # Task list container
│   ├── App.tsx              # Main application
│   └── index.css            # Global styles
├── electron/
│   └── main.js              # Electron main process (tray, updates)
├── build/
│   ├── icon.ico             # Windows icon
│   └── icon.png             # macOS icon
└── package.json
```

---

## 🔧 Tech Stack | 技术栈

| Category       | Technology            |
| -------------- | --------------------- |
| **Framework**  | React 19 + TypeScript |
| **Build Tool** | Vite 7                |
| **Styling**    | Tailwind CSS          |
| **Animations** | Framer Motion         |
| **Icons**      | Lucide React          |
| **Desktop**    | Electron 40           |
| **Bundler**    | electron-builder      |

---

## 🗺️ Roadmap | 路线图

- [x] System tray support
- [x] Auto update checking
- [x] Desktop shortcut on install
- [x] Window opacity control
- [x] Window resizing (Multi-corner)
- [ ] Task categories / tags
- [ ] Keyboard shortcuts
- [ ] Drag to reorder tasks
- [ ] Multiple todo lists
- [ ] Theme customization
- [ ] Cloud sync (optional)

---

## 📄 License | 许可证

MIT © 2026 Evan

---

<div align="center">

**Made with ❤️ by Evan**

[Report Bug](https://github.com/xxomega2077xx/softdo/issues) · [Request Feature](https://github.com/xxomega2077xx/softdo/issues)

</div>
