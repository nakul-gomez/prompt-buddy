import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Store } from "@tauri-apps/plugin-store";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { Settings, X } from "lucide-react";
import "./App.css";

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
    content: "Come up with 5-7 most likely root causes of this bug, and attempt the 1-2 most likely fixes with proper logging. Don't hold back, give it your all.",
    color: "from-purple-500 to-pink-500"
  },
  {
    id: "2",
    title: "Explain Code",
    content: "Explain this code in detail, including its purpose, how it works, potential edge cases, and any improvements that could be made.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: "3",
    title: "Refactor",
    content: "Refactor this code to be more readable, maintainable, and performant. Follow best practices and explain your changes.",
    color: "from-green-500 to-emerald-500"
  },
  {
    id: "4",
    title: "Write Tests",
    content: "Write comprehensive unit tests for this code, covering edge cases and error scenarios. Use appropriate testing patterns.",
    color: "from-orange-500 to-red-500"
  },
  {
    id: "5",
    title: "Optimize Performance",
    content: "Analyze this code for performance bottlenecks and suggest specific optimizations with examples.",
    color: "from-indigo-500 to-purple-500"
  },
  {
    id: "6",
    title: "Add Error Handling",
    content: "Add comprehensive error handling to this code with proper logging and user-friendly error messages.",
    color: "from-teal-500 to-green-500"
  }
];

let store: Store | null = null;

function App() {
  const [prompts, setPrompts] = useState<Prompt[]>(DEFAULT_PROMPTS);
  const [injectedId, setInjectedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);

  // Initialize store and load prompts on mount
  useEffect(() => {
    const initStore = async () => {
      store = await Store.load("prompts.json");
      const saved = await store.get<Prompt[]>("prompts");
      if (saved) {
        setPrompts(saved);
      }
    };
    initStore();
  }, []);

  // Listen for keyboard shortcut events from backend
  useEffect(() => {
    const unlistenPromise = listen<number>("inject-prompt", (event) => {
      const promptIndex = event.payload;
      console.log(`🎯 Frontend: Received inject-prompt event for index: ${promptIndex}`);
      
      if (promptIndex >= 0 && promptIndex < prompts.length) {
        const prompt = prompts[promptIndex];
        console.log(`🚀 Frontend: Injecting prompt ${promptIndex + 1}: ${prompt.title}`);
        injectTextViaShortcut(prompt, promptIndex + 1);
      } else {
        console.warn(`⚠️  Frontend: Invalid prompt index: ${promptIndex}`);
      }
    });

    return () => {
      unlistenPromise.then(unlisten => unlisten());
    };
  }, [prompts]);

  // Inject text via keyboard shortcut (no window focus issues)
  const injectTextViaShortcut = async (prompt: Prompt, shortcutNumber: number) => {
    console.log(`🚀 Frontend: Injecting via Cmd+Alt+${shortcutNumber}: ${prompt.title}`);
    console.log(`📝 Frontend: Text to inject: ${prompt.content}`);
    
    // Clear any previous states
    setInjectedId(null);
    setErrorMessage("");
    
    try {
      // Direct injection without any window manipulation
      const result = await invoke<string>("inject_text", { text: prompt.content });
      console.log("✅ Frontend: Injection successful:", result);
      
      // Show success feedback briefly
      setInjectedId(prompt.id);
      setTimeout(() => {
        setInjectedId(null);
      }, 2000);
      
    } catch (error) {
      console.error("❌ Frontend: Injection failed:", error);
      setErrorMessage(`Failed to inject prompt ${shortcutNumber}`);
      
      // Clear error after 3 seconds
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
    }
  };

  const closeWindow = async () => {
    const currentWindow = getCurrentWindow();
    await currentWindow.close();
  };

  return (
    <div className="prompt-bar" data-tauri-drag-region>
      {/* Liquid glass background */}
      <div className="bar-background" data-tauri-drag-region />
      
      {/* Main content */}
      <div className="bar-content" data-tauri-drag-region>
        {/* Prompts display */}
        <div className="prompts-container" data-tauri-drag-region>
          {prompts.slice(0, 9).map((prompt, index) => (
            <div 
              key={prompt.id} 
              className={`prompt-pill ${injectedId === prompt.id ? 'injected' : ''}`}
              data-tauri-drag-region
            >
              {/* Number label */}
              <div className="prompt-number" data-tauri-drag-region>
                {index + 1}
              </div>
              
              {/* Prompt content */}
              <div className="prompt-info" data-tauri-drag-region>
                <div className="prompt-title" data-tauri-drag-region>
                  {prompt.title}
                </div>
                <div className="prompt-shortcut" data-tauri-drag-region>
                  ⌘⌥{index + 1}
                </div>
              </div>
              
              {/* Color gradient */}
              <div className={`prompt-gradient bg-gradient-to-r ${prompt.color}`} data-tauri-drag-region />
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bar-controls" data-tauri-drag-region="false">
          <button 
            className="control-btn"
            onClick={() => setShowSettings(!showSettings)}
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

      {/* Error message */}
      {errorMessage && (
        <div className="error-toast" data-tauri-drag-region>
          {errorMessage}
        </div>
      )}

      {/* Settings overlay */}
      {showSettings && (
        <div className="settings-overlay" data-tauri-drag-region>
          <div className="settings-content" data-tauri-drag-region>
            <p className="settings-hint" data-tauri-drag-region>
              Use Cmd+Alt+1-9 to inject prompts
            </p>
            <p className="settings-hint" data-tauri-drag-region>
              Cmd+Shift+Enter to show/hide bar
            </p>
            <button 
              onClick={() => setShowSettings(false)}
              className="settings-close"
              data-tauri-drag-region="false"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
