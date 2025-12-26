# PromptPack

PromptPack is a lightweight tool for converting **codebases** (GitHub repositories, ZIP archives, or local folders) into **LLM-friendly prompt text**.

It lets you selectively include or exclude files, preview code, and export the result as **clean Markdown or compact raw text** that can be pasted directly into large language models without unnecessary noise.

## Why PromptPack

LLMs don’t understand repositories — they understand text.
PromptPack bridges that gap by turning real-world codebases into structured, controllable prompts.

## Features

* Import code from **GitHub**, **ZIP files**, or **local folders**
* Tree-based file selection with include/exclude glob filters
* Automatic handling of large projects
* Export as:

  * **Markdown** (structured, readable)
  * **Raw text** (compact, token-efficient)
* Live preview with syntax highlighting
* Designed to avoid unnecessary tokens and boilerplate
* Local-first: runs entirely on your machine

## Tech Stack

* **React + TypeScript**
* **Vite**
* **Zustand** (state management)
* **Browser File System Access API**
* Minimal custom syntax highlighting (no heavy editors)

## Use Cases

* Preparing large repositories for LLM code review
* Generating prompts for refactoring or explanation
* Feeding multi-file projects into context-limited models
* Creating reproducible, shareable prompt bundles

## Running Locally

```bash
npm install
npm run dev
```

Then open the local URL shown in your terminal.

## License

MIT

---

If you want a slightly more “startup-y” tone or a more “developer util” tone, I can tweak the wording in one pass.
