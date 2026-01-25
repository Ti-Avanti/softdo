# <div align="center"><img src="resources/icon.png" width="128" height="128" alt="SoftDo Logo"></div>

<div align="center">

# SoftDo

**The Todo Widget That Breathes.**

[Download for Windows](https://github.com/xxomega2077xx/softdo/releases/latest) • [Download for Linux](https://github.com/xxomega2077xx/softdo/releases/latest) • [Features](#features)

</div>

---

## 🎨 Philosophy

SoftDo isn't just a todo list; it's a piece of digital furniture for your desktop. Built with a "Glassmorphism First" approach, it features a frosted glass interface that adapts to your wallpaper, blurring the line between your tasks and your environment.

We believe animation isn't just decoration—it's feedback. Every interaction in SoftDo is governed by a unified physics engine (`Silky Flow`), ensuring that tasks don't just appear; they glide, breathe, and settle with satisfying weight.

## ✨ Features

### 💎 Premium Aesthetics

- **Real-time Glassmorphism**: Background blurring that works seamlessly on Windows and Linux.
- **Adaptive UI**: A responsive design that looks stunning whether pinned as a small widget or expanded as a full list.
- **Squircle Perfection**: Every corner is smoothed with Apple-style super-ellipses for a modern, organic feel.

### 🌊 Silky Animation Engine

- **No Stutter**: Powered by a custom `Cubic Bezier (0.25, 0.1, 0.25, 1.0)` physics curve.
- **Fluid Layouts**: The window height animates smoothly ("Accordion Effect") as you add tasks or open the calendar. No jarring jumps.
- **Staggered Entry**: Lists load with a rhythmic cascade, making even checking your tasks feel like a performance.

### ⚡ Power User Ready

- **Natural Language Parsing**: Type "Meeting tomorrow 9am" -> It sets the due date automatically.
- **Smart Time Detection**: Recognizes "tonight", "next friday", "in 30 mins".
- **Compact & Pin**: Keeps your focus without stealing your screen real estate.
- **Cross-Platform**: Now fully native on **Ubuntu/Debian Linux** (.deb, .AppImage) and **Windows** (.nsis).

## 🚀 Installation

### Windows

1. Download `SoftDo-Setup-1.5.0.exe` from [Releases](https://github.com/xxomega2077xx/softdo/releases).
2. Run to install. It will auto-launch.

### Linux (Ubuntu/Debian)

**Option 1: AppImage (Universal)**

```bash
chmod +x SoftDo-1.5.0-Linux.AppImage
./SoftDo-1.5.0-Linux.AppImage
```

**Option 2: DEB Package**

```bash
sudo dpkg -i softdo_1.5.0_amd64.deb
```

## 🛠️ Tech Stack

- **Core**: [Electron](https://www.electronjs.org/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Motion**: [Framer Motion](https://www.framer.com/motion/)
- **Build**: [Vite](https://vitejs.dev/) + [Electron Builder](https://www.electron.build/)

## 📜 License

MIT License © 2026 SoftDo Team.
Designed with ❤️ for clarity and calm.
