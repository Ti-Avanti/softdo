# 🟣 SoftDo

<div align="center">

![SoftDo Banner](https://raw.githubusercontent.com/xxomega2077xx/softdo/main/resources/banner.png)

**A beautiful, fluid, and powerful desktop todo widget.**  
_Designed for flow. Built for focus._

[![Version](https://img.shields.io/github/v/release/xxomega2077xx/softdo?style=flat-square&color=8b5cf6)](https://github.com/xxomega2077xx/softdo/releases)
[![Downloads](https://img.shields.io/github/downloads/xxomega2077xx/softdo/total?style=flat-square&color=10b981)](https://github.com/xxomega2077xx/softdo/releases)
[![Platform](https://img.shields.io/badge/platform-win%20%7C%20linux-gray?style=flat-square)](https://github.com/xxomega2077xx/softdo/releases)
[![License](https://img.shields.io/github/license/xxomega2077xx/softdo?style=flat-square)](LICENSE)

[Download Now](https://github.com/xxomega2077xx/softdo/releases/latest) • [Features](#-features) • [Changelog](CHANGELOG.md)

</div>

---

## ✨ Features

### 🌊 Silky Smooth Flow

SoftDo v1.5.0 introduces a rewritten animation engine based on premium cubic-bezier physics.

- **Zero Jitter**: Tasks glide in with momentum.
- **Accordion Logic**: Lists and menus expand naturally without layout shifts.
- **Unified Feel**: Every interaction shares the same fluid DNA.

### 🔮 Glassmorphism UI

Designed to sit beautifully on your desktop.

- **Frosted Glass**: Real-time background blurring (Windows).
- **Adaptive**: Looks great mainly in Light mode (Dark mode coming soon).
- **Compact**: Tucks away when you don't need it.

### ⚡ Smart Input

Don't fiddle with date pickers unless you want to.

- **Natural Language**: Type _"Meeting tmr 9am"_ or _"Gym in 2 hours"_.
- **Instant Parsing**: Visual indicators confirm the detected time immediately.

### 🐧 Cross-Platform

Now officially supporting **Linux** (Ubuntu/Debian & AppImage) alongside **Windows**.

---

## 🚀 Installation

### Windows

1. Go to [Releases](https://github.com/xxomega2077xx/softdo/releases/latest).
2. Download `SoftDo-Setup-1.5.1.exe`.
3. Run to install. It will auto-launch.

### Linux (Ubuntu/Debian)

1. Download `SoftDo_1.5.1_amd64.deb`.
2. Install via terminal:
   ```bash
   sudo dpkg -i SoftDo_1.5.1_amd64.deb
   ```
3. Or use the `.AppImage` version for a portable experience (chmod +x and run).

---

## 🛠️ Development

Want to contribute or build it yourself?

```bash
# 1. Clone
git clone https://github.com/xxomega2077xx/softdo.git
cd softdo

# 2. Install (Node 20+ required)
npm install

# 3. Dev Mode
npm run electron:dev

# 4. Build
# For Windows
npm run electron:build -- --win

# For Linux
npm run electron:build -- --linux
```

## 📝 Keyboard Shortcuts

| Key            | Action                                     |
| :------------- | :----------------------------------------- |
| `Enter`        | Add task / Save edit                       |
| `Esc`          | Cancel edit / Close window (if configured) |
| `Double Click` | Edit parsing text (Time)                   |

---

<div align="center">
Made with 💜 by Evan
</div>
