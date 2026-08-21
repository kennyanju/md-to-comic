# MD to Comic — Public Roadmap

Welcome to the MD to Comic roadmap! We've made massive strides in recent updates, including parallel image generation, stable scene chunking, automatic LLM panel padding, and lightning-fast PDF exports with cached rendering.

However, there's still a lot to do to make this the ultimate AI-assisted comic creation tool. Here is a look at what is planned for future releases.

## 🚀 Upcoming Major Features

### 1. Global Undo / Redo Stack
Currently, there is no way to undo changes made in the **Panel Editor** or the **Comic Studio**. 
- **Plan:** Implement a robust undo/redo history using a `useReducer` stack. This will let you fearlessly delete panels, edit dialogue, and adjust layouts, knowing you can always press `Ctrl+Z` to recover.

### 2. Cloud Synchronization
Right now, projects are stored locally in your browser via LocalStorage. 
- **Plan:** Add an optional cloud-sync layer (via Firebase/Supabase or Cloudflare D1). This will allow you to log in and access your ongoing comic projects across multiple devices, and share collaborative links with co-writers.

### 3. Dynamic Grid Generation
We currently offer 6 pre-baked layout grids (e.g., *4-Panel Classic*, *5-Panel Action*, *6-Panel Manga*).
- **Plan:** Implement a dynamic grid calculation algorithm that can automatically generate diverse, unbalanced comic layouts for *any* number of panels (1 to 9) to keep page compositions feeling organic and varied.

---

## 🎨 UI & UX Enhancements

### 4. Advanced Speech Bubbles
- **Plan:** Add directional "tails" to speech bubbles that automatically point toward the character speaking, based on the prompt or manual drag.
- **Plan:** Support for uploading your own custom `.ttf` or `.woff` fonts for dialogue and narration captions.

### 5. LLM-Powered Character Extraction
While we recently expanded our regex engine to catch more characters and actions, it still misses nuanced context.
- **Plan:** Introduce a fast, lightweight LLM step during the Markdown parsing phase to semantically extract the entire character roster, their relationships, and visual descriptions directly from the text.

### 6. Flexible Art Style Switching
- **Plan:** Allow users to change the selected Art Style *after* Step 1. Currently, if you decide your Noir detective story would look better as Cyberpunk midway through script review, you have to start over.

---

## 🔒 Security & Tech Debt

### 7. Client-Side API Key Encryption
- **Plan:** Upgrade the `SettingsModal` to encrypt stored API keys using the browser's native `SubtleCrypto` API with a user-provided passphrase, rather than storing them in plain text in LocalStorage.

### 8. Cleanup Unused Backend Schema
- **Plan:** Our Cloudflare backend contains unused D1 database schemas from previous architecture explorations. We will either fully remove these or transition them to support the aforementioned Cloud Synchronization feature.

---

*Want to contribute or suggest a feature? Feel free to open an issue or pull request!*
