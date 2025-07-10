import { useState, useEffect } from "react";
import { Store } from "@tauri-apps/plugin-store";
import { emit } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
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

function PromptEditor() {
  const urlParams = new URLSearchParams(window.location.search);
  const index = parseInt(urlParams.get("edit") || "-1", 10);

  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const store = await Store.load("prompts.json");
      let saved = (await store.get<Prompt[]>("prompts")) || [];
      if (saved.length === 0) saved = DEFAULT_PROMPTS;
      if (index >= 0 && index < saved.length) {
        const p = saved[index];
        setPrompt(p);
        setTitle(p.title);
        setContent(p.content);
      }
      setLoaded(true);
    };
    load();
  }, [index]);

  const save = async () => {
    if (!prompt) return;
    const store = await Store.load("prompts.json");
    const saved = (await store.get<Prompt[]>("prompts")) || DEFAULT_PROMPTS;
    if (index >= 0 && index < saved.length) {
      saved[index] = { ...prompt, title, content };
      await store.set("prompts", saved);
      await emit("prompts-updated");
      const win = getCurrentWindow();
      await win.close();
    }
  };

  const cancel = async () => {
    const win = getCurrentWindow();
    await win.close();
  };

  if (!loaded) {
    return <div className="prompt-editor">Loading...</div>;
  }

  if (prompt === null) {
    return <div className="prompt-editor">Invalid prompt index</div>;
  }

  return (
    <div className="prompt-editor">
      <h2>Edit Prompt {index + 1}</h2>
      <label>
        Title:
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="editor-input"
        />
      </label>
      <label>
        Content:
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="editor-textarea"
          rows={5}
        />
      </label>
      <div className="editor-buttons">
        <button onClick={save} className="save-btn">Save</button>
        <button onClick={cancel} className="cancel-btn">Cancel</button>
      </div>
    </div>
  );
}

export default PromptEditor; 