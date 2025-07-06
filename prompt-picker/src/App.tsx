import { useState, useEffect } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { Store } from "@tauri-apps/plugin-store";
import { Copy, Plus, X, Edit2, Check, Settings } from "lucide-react";
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
  }
];

let store: Store | null = null;

function App() {
  const [prompts, setPrompts] = useState<Prompt[]>(DEFAULT_PROMPTS);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);

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

  // Save prompts to store
  const savePrompts = async (newPrompts: Prompt[]) => {
    if (!store) {
      store = await Store.load("prompts.json");
    }
    await store.set("prompts", newPrompts);
    await store.save();
  };

  const copyToClipboard = async (prompt: Prompt) => {
    await writeText(prompt.content);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEdit = (prompt: Prompt) => {
    setEditingId(prompt.id);
    setEditTitle(prompt.title);
    setEditContent(prompt.content);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    
    const newPrompts = prompts.map(p => 
      p.id === editingId 
        ? { ...p, title: editTitle, content: editContent }
        : p
    );
    setPrompts(newPrompts);
    await savePrompts(newPrompts);
    setEditingId(null);
  };

  const deletePrompt = async (id: string) => {
    const newPrompts = prompts.filter(p => p.id !== id);
    setPrompts(newPrompts);
    await savePrompts(newPrompts);
  };

  const addNewPrompt = async () => {
    const colors = [
      "from-purple-500 to-pink-500",
      "from-blue-500 to-cyan-500",
      "from-green-500 to-emerald-500",
      "from-orange-500 to-red-500",
      "from-indigo-500 to-purple-500",
      "from-teal-500 to-green-500"
    ];
    
    const newPrompt: Prompt = {
      id: Date.now().toString(),
      title: "New Prompt",
      content: "Enter your prompt here...",
      color: colors[prompts.length % colors.length]
    };
    
    const newPrompts = [...prompts, newPrompt];
    setPrompts(newPrompts);
    await savePrompts(newPrompts);
    setIsAddingNew(false);
    startEdit(newPrompt);
  };

  const resetToDefaults = async () => {
    setPrompts(DEFAULT_PROMPTS);
    await savePrompts(DEFAULT_PROMPTS);
    setShowSettings(false);
  };

  return (
    <div className="app">
      <div className="header" data-tauri-drag-region>
        <h1>Prompt Picker</h1>
        <button 
          className="settings-btn"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings size={18} />
        </button>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <button onClick={resetToDefaults} className="reset-btn">
            Reset to Defaults
          </button>
          <p className="hint">Click a prompt to copy it to clipboard</p>
        </div>
      )}

      <div className="prompts-grid">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="prompt-card">
            {editingId === prompt.id ? (
              <div className="edit-mode">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="edit-title"
                  placeholder="Title"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="edit-content"
                  placeholder="Content"
                />
                <div className="edit-actions">
                  <button onClick={saveEdit} className="save-btn">
                    <Check size={16} />
                  </button>
                  <button 
                    onClick={() => setEditingId(null)} 
                    className="cancel-btn"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={`prompt-gradient bg-gradient-to-br ${prompt.color}`} />
                <h3>{prompt.title}</h3>
                <p>{prompt.content}</p>
                <div className="prompt-actions">
                  <button
                    onClick={() => copyToClipboard(prompt)}
                    className={`copy-btn ${copiedId === prompt.id ? 'copied' : ''}`}
                  >
                    {copiedId === prompt.id ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => startEdit(prompt)}
                    className="edit-btn"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deletePrompt(prompt.id)}
                    className="delete-btn"
                  >
                    <X size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        
        {!isAddingNew && (
          <button 
            className="add-prompt-btn"
            onClick={() => setIsAddingNew(true)}
          >
            <Plus size={24} />
            <span>Add Prompt</span>
          </button>
        )}
        
        {isAddingNew && (
          <div className="add-prompt-confirm">
            <button onClick={addNewPrompt} className="confirm-add">
              <Check size={20} />
            </button>
            <button 
              onClick={() => setIsAddingNew(false)} 
              className="cancel-add"
            >
              <X size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
