import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Store } from "@tauri-apps/plugin-store";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function SettingsPage() {
  const [toggleShortcut, setToggleShortcut] = useState("ctrl+space");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const store = await Store.load("settings.json");
        const savedShortcut = await store.get<string>("toggleShortcut");
        if (savedShortcut) {
          setToggleShortcut(savedShortcut);
        }
      } catch (err) {
        console.warn("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  // 保存设置
  const saveSettings = async () => {
    setSaving(true);
    try {
      const store = await Store.load("settings.json");
      await store.set("toggleShortcut", toggleShortcut);
      await store.save();
      
      // 通知后端更新快捷键
      await invoke("update_toggle_shortcut", { newShortcut: toggleShortcut });
      
      console.log("Settings saved successfully");
    } catch (err) {
      console.error("Failed to save settings:", err);
      alert("保存设置失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const closeWindow = async () => {
    const win = getCurrentWindow();
    await win.close();
  };

  // 常用快捷键选项
  const shortcutOptions = [
    { value: "ctrl+space", label: "Ctrl+Space" },
    { value: "cmd+space", label: "Cmd+Space" },
    { value: "alt+space", label: "Alt+Space" },
    { value: "ctrl+shift+space", label: "Ctrl+Shift+Space" },
    { value: "cmd+shift+space", label: "Cmd+Shift+Space" },
    { value: "alt+shift+space", label: "Alt+Shift+Space" },
    { value: "ctrl+`", label: "Ctrl+`" },
    { value: "cmd+`", label: "Cmd+`" },
  ];

  if (loading) {
    return (
      <div className="settings-overlay" data-tauri-drag-region>
        <div className="settings-content">
          <p>加载设置中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-overlay" data-tauri-drag-region>
      <div className="settings-content">
        <h3 className="settings-title">Prompt Buddy 设置</h3>
        
        <div className="settings-section">
          <label className="settings-label">
            显示/隐藏快捷键:
            <select 
              value={toggleShortcut}
              onChange={(e) => setToggleShortcut(e.target.value)}
              className="settings-select"
              data-tauri-drag-region="false"
            >
              {shortcutOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <p className="settings-hint-small">
            选择用于显示/隐藏应用窗口的快捷键组合
          </p>
        </div>

        <div className="settings-section">
          <p className="settings-hint">使用 Cmd+Alt+1-9 快速注入提示词</p>
          <p className="settings-hint">当前显示/隐藏快捷键: {toggleShortcut}</p>
        </div>
        
        <div className="settings-buttons">
          <button
            className="settings-save"
            onClick={saveSettings}
            disabled={saving}
            data-tauri-drag-region="false"
          >
            {saving ? "保存中..." : "保存设置"}
          </button>
          <button
            className="settings-close"
            onClick={closeWindow}
            data-tauri-drag-region="false"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage; 