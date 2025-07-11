import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Store } from "@tauri-apps/plugin-store";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Settings, X, Pencil } from "lucide-react";
import "./App.css";
import { PhysicalPosition } from "@tauri-apps/api/window";

interface Prompt {
  id: string;
  title: string;
  content: string;
  color: string;
}

const DEFAULT_PROMPTS: Prompt[] = [
  {
    id: "1",
    title: "Debug Root Cause",
    content:
      "Come up with 5-7 most likely root causes of this bug, and attempt the 1-2 most likely fixes with proper logging. Don't hold back, give it your all.",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "2",
    title: "Explain Code",
    content:
      "Explain this code in detail, including its purpose, how it works, potential edge cases, and any improvements that could be made.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "3",
    title: "Refactor",
    content:
      "Refactor this code to be more readable, maintainable, and performant. Follow best practices and explain your changes.",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "4",
    title: "Write Tests",
    content:
      "Write comprehensive unit tests for this code, covering edge cases and error scenarios. Use appropriate testing patterns.",
    color: "from-orange-500 to-red-500",
  },
  {
    id: "5",
    title: "Optimize Performance",
    content:
      "Analyze this code for performance bottlenecks and suggest specific optimizations with examples.",
    color: "from-indigo-500 to-purple-500",
  },
  {
    id: "6",
    title: "Add Error Handling",
    content:
      "Add comprehensive error handling to this code with proper logging and user-friendly error messages.",
    color: "from-teal-500 to-green-500",
  },
];

function App() {
  const [prompts, setPrompts] = useState<Prompt[]>(DEFAULT_PROMPTS);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [injectedId, setInjectedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const pillRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* --------------------------------------------------
   * Load & persist prompts
   * -------------------------------------------------- */
  const loadPrompts = useCallback(async () => {
    const store = await Store.load("prompts.json");
    let saved = await store.get<Prompt[]>("prompts");
    if (!saved || saved.length === 0) {
      saved = DEFAULT_PROMPTS;
      await store.set("prompts", saved);
      await store.save();
    }
    setPrompts(saved);
  }, []);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  useEffect(() => {
    pillRefs.current = pillRefs.current.slice(0, prompts.length);
  }, [prompts]);

  /* --------------------------------------------------
   * Global shortcut listener from the backend
   * -------------------------------------------------- */
  useEffect(() => {
    const unlistenPromise = listen<number>(
      "inject-prompt",
      ({ payload: index }) => {
        if (index >= 0 && index < prompts.length) {
          injectTextViaShortcut(prompts[index], index + 1);
        }
      }
    );
    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [prompts]);

  useEffect(() => {
    const unlistenPromise = listen("prompts-updated", loadPrompts);
    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [loadPrompts]);

  /* --------------------------------------------------
   * Hover handlers
   * -------------------------------------------------- */
  const handleMouseEnter = useCallback((index: number) => {
    setExpandedIndex(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setExpandedIndex(null);
  }, []);

  /* --------------------------------------------------
   * Inject text helper
   * -------------------------------------------------- */
  const injectTextViaShortcut = async (prompt: Prompt, shortcut: number) => {
    setInjectedId(null);
    setErrorMessage("");
    try {
      await invoke<string>("inject_text", { text: prompt.content });
      setInjectedId(prompt.id);
      setTimeout(() => setInjectedId(null), 2000);
    } catch (e) {
      console.error(e);
      setErrorMessage(`Failed to inject prompt ${shortcut}`);
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  /* --------------------------------------------------
   * Close window helper
   * -------------------------------------------------- */
  const closeWindow = async () => {
    const win = getCurrentWindow();
    await win.close();
  };

  /* --------------------------------------------------
   * Open Settings window
   * -------------------------------------------------- */
  const openSettingsWindow = async () => {
    // If a settings window already exists, just focus it
    const settingsWin = await WebviewWindow.getByLabel("settings");
    if (settingsWin) {
      await settingsWin.setFocus();
      return;
    }

    // Otherwise create a new one
    new WebviewWindow("settings", {
      url: "index.html?settings",
      width: 450,
      height: 260,
      resizable: false,
      title: "Prompt Picker Settings",
      decorations: true,
    });
  };

  /* --------------------------------------------------
   * Open Edit Window
   * -------------------------------------------------- */
  const openEditWindow = async (index: number, element?: HTMLElement | null) => {
    console.log(`openEditWindow called for index ${index}`);
    try {
      const label = `edit-${index}`;
      const existing = await WebviewWindow.getByLabel(label);
      if (existing) {
        console.log(`Focusing existing edit window ${label}`);
        await existing.setFocus();
        return;
      }

      const EDIT_WIDTH = 400;
      const EDIT_HEIGHT = 420;

      let newLeft: number | undefined;
      let newTop: number | undefined;

      if (element) {
        const win = getCurrentWindow();
        const pos = await win.outerPosition();
        const scale = await win.scaleFactor();
        const rect = element.getBoundingClientRect();
        const physicalLeft = pos.x + Math.round(rect.left * scale);
        const physicalTop = pos.y + Math.round(rect.top * scale);
        const physicalWidth = Math.round(rect.width * scale);
        newLeft = physicalLeft + physicalWidth / 2 - Math.round((EDIT_WIDTH * scale) / 2);
        newTop = physicalTop - Math.round(EDIT_HEIGHT * scale) - 10;
        // Clamp to stay on-screen (at least 0,0) in case the calculation
        // would position the window off the visible area.
        if (newLeft < 0) newLeft = 0;
        if (newTop < 0) newTop = 0;
        console.log(`Calculated window position left=${newLeft}, top=${newTop}`);
      } else {
        console.warn(`No element provided for positioning edit window index ${index}`);
      }

      const newWin = new WebviewWindow(label, {
        url: `index.html?edit=${index}`,
        title: `Edit Prompt ${index + 1}`,
        width: EDIT_WIDTH,
        height: EDIT_HEIGHT,
        resizable: true,
        decorations: true,
        // Capabilities omitted: inherits default permissions like the settings window
      });

      if (newLeft !== undefined && newTop !== undefined) {
        await newWin.once("tauri://created", async () => {
          await newWin.setPosition(new PhysicalPosition(Math.round(newLeft!), Math.round(newTop!)));
          console.log(`Edit window positioned.`);
        });
      }
    } catch (err) {
      console.error(`Error opening edit window for ${index}:`, err);
    }
  };

  /* --------------------------------------------------
   * Render
   * -------------------------------------------------- */
  return (
    <div className="prompt-bar" data-tauri-drag-region>
      <div className="bar-background" data-tauri-drag-region />

      <div className="bar-content" data-tauri-drag-region>
        <div className="prompts-container" data-tauri-drag-region>
          {prompts.slice(0, 9).map((p, i) => (
            <div
              key={p.id}
              ref={(el) => (pillRefs.current[i] = el)}
              className={`prompt-pill ${injectedId === p.id ? "injected" : ""} ${
                expandedIndex === i ? "expanded" : ""
              }`}
              onMouseEnter={() => handleMouseEnter(i)}
              onMouseLeave={handleMouseLeave}
              onClick={() => injectTextViaShortcut(p, i + 1)}
              onMouseDown={(e: React.MouseEvent) => {
                if (e.button === 2) {
                  console.log(`Right-click (mouse down) detected on prompt ${i + 1}`);
                  e.preventDefault();
                  e.stopPropagation();
                  openEditWindow(i, e.currentTarget as HTMLElement);
                }
              }}
              data-tauri-drag-region="false"
            >
              {/* Number + Edit stacked */}
              <div className="prompt-badge" data-tauri-drag-region="false">
                <div className="prompt-number">{i + 1}</div>
                <button
                  className="edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(`Edit button clicked for prompt ${i + 1}`);
                    const pill = pillRefs.current[i];
                    openEditWindow(i, pill);
                  }}
                  data-tauri-drag-region="false"
                >
                  <Pencil size={12} />
                </button>
              </div>

              {expandedIndex === i ? (
                <div className="prompt-full-container">
                  <div className="prompt-full">
                    {p.content.length > 1000
                      ? `${p.content.slice(0, 1000)}…`
                      : p.content}
                  </div>
                </div>
              ) : (
                <div className="prompt-info">
                  <div className="prompt-title">{p.title}</div>
                  <div className="prompt-shortcut">⌘⌥{i + 1}</div>
                </div>
              )}

              <div
                className={`prompt-gradient bg-gradient-to-r ${p.color}`}
              />
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bar-controls" data-tauri-drag-region="false">
          <button
            className="control-btn"
            onClick={openSettingsWindow}
            data-tauri-drag-region="false"
          >
            <Settings size={16} />
          </button>
          <button
            className="control-btn close-btn"
            onClick={closeWindow}
            data-tauri-drag-region="false"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Error toast */}
      {errorMessage && <div className="error-toast">{errorMessage}</div>}

      {/* Settings overlay moved to dedicated window */}
    </div>
  );
}

export default App;