# Contributing to Prompt Picker

First off, thanks for taking the time to contribute! ❤

The following is a set of guidelines for contributing to Prompt Picker. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

---

## 🧐 How Can I Contribute?

### 1. Reporting Bugs

- **Search first** – maybe the bug has already been reported or even fixed.
- **Open an issue** and include:
  - A clear, descriptive title (e.g. *"Crash when adding a prompt containing emoji"*).
  - Steps to reproduce (screenshots or screen recordings help a ton).
  - Expected vs actual behaviour.
  - Your environment (macOS version, Cursor version, Prompt Picker commit).

### 2. Suggesting Enhancements

Feature requests are welcome! Please open an issue and describe:

- The problem you’re trying to solve.
- Any screenshots/mock-ups that convey the idea.
- Potential alternatives you have considered.

### 3. Pull Requests

1. Fork the repository and create your branch from `dev`.
2. Install dependencies with `npm install` and run `npm run tauri dev` to verify your changes.
3. Lint & test (when tests are available) before pushing.
4. Keep PRs focused – one feature/fix per pull request.
5. Provide a clear description of **what** and **why** in the PR body.

#### Commit Style

This project loosely follows [Conventional Commits](https://www.conventionalcommits.org/) – examples:

- `feat: add dark-mode toggle`
- `fix: clipboard copy fails on Ventura`
- `docs: update README install section`

#### Code Style

- Use Prettier defaults (2-space indent, single quotes).
- Prefer functional React components and hooks.
- Keep components small and focused.

---

## 🏗️ Project Structure

```
root
├─ src/            # React frontend
├─ src-tauri/      # Rust + Tauri backend
└─ ...
```

---

## 🔐 License

By contributing, you agree that your contributions will be licensed under the [GNU Affero General Public License v3.0](LICENSE). 