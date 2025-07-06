# Prompt Picker

A lightweight, always-on-top desktop app for quickly accessing and managing your frequently used prompts for Cursor. Built with Tauri v2 for a native, performant experience with a beautiful acrylic design.

## Features

- 🎨 **Beautiful Acrylic UI** - Modern glassmorphism design that fits perfectly with macOS and Windows aesthetics
- 📌 **Always On Top** - Stays visible for quick access while coding
- 📋 **One-Click Copy** - Click any prompt to instantly copy it to your clipboard
- ✏️ **Customizable Prompts** - Edit, add, or delete prompts to fit your workflow
- 💾 **Persistent Storage** - Your custom prompts are saved automatically
- 🌓 **Dark Mode Support** - Automatically adapts to your system theme
- 🖱️ **Draggable Window** - Position it anywhere on your screen
- 🚀 **Lightweight** - Built with Tauri for minimal resource usage

## Installation

### Prerequisites
- Node.js (v16 or higher)
- Rust (latest stable)
- Platform-specific dependencies:
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft C++ Build Tools

### Build from Source

1. Clone the repository:
```bash
git clone <repository-url>
cd prompt-picker
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm run tauri dev
```

4. Build for production:
```bash
npm run tauri build
```

## Usage

1. **Launch the app** - It will appear as a floating window that stays on top
2. **Click any prompt** - The content is instantly copied to your clipboard
3. **Edit prompts** - Click the edit button (✏️) to modify any prompt
4. **Add new prompts** - Click the "Add Prompt" button to create custom prompts
5. **Delete prompts** - Click the delete button (✕) to remove unwanted prompts
6. **Reset to defaults** - Use the settings menu to restore the original prompts

## Default Prompts

The app comes with several useful debugging prompts:

- **Debug Root Cause**: "Come up with 5-7 most likely root causes of this bug..."
- **Explain Code**: "Explain this code in detail, including its purpose..."
- **Refactor**: "Refactor this code to be more readable, maintainable..."
- **Write Tests**: "Write comprehensive unit tests for this code..."

## Customization

All prompts are fully customizable. Your changes are automatically saved and will persist between app restarts.

## Platform Support

- ✅ macOS (10.15+)
- ✅ Windows (10/11)
- 🚧 Linux (coming soon)

## Development

This app is built with:
- [Tauri v2](https://v2.tauri.app/) - For the native app framework
- React + TypeScript - For the UI
- Lucide React - For beautiful icons

## License

MIT License - feel free to modify and distribute as needed!
