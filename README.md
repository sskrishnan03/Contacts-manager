<div align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19"/>
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.8"/>
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite 6"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/Groq_API-38B2AC?logo=groq&logoColor=white" alt="Groq API"/>
  <br/>
  <img src="https://img.shields.io/badge/IndexedDB-FF6F00?logo=sqlite&logoColor=white" alt="IndexedDB"/>
  <img src="https://img.shields.io/badge/PWA-Ready-5C3EE8?logo=pwa&logoColor=white" alt="PWA Ready"/>
  <img src="https://img.shields.io/badge/vCard_QR-4285F4?logo=google-pay&logoColor=white" alt="vCard QR"/>
  <img src="https://img.shields.io/badge/CSV_Import%2FExport-30A14E?logo=googlesheets&logoColor=white" alt="CSV Import/Export"/>
</div>

<h1 align="center">📇 Contacts Manager</h1>
<p align="center">
  <strong>A modern, feature-rich contact management platform powered by AI</strong>
  <br/>
  <em>Manage contacts, track interactions, schedule events, chat with AI — all offline-first with Groq AI superpowers</em>
</p>

---

## ✨ Features at a Glance

| Category | Features |
|---|---|
| **📇 Contacts** | Add/edit with rich fields (phones, emails, address, social, tags, birthday, notes), favorites, search with 300ms debounce, A-Z grouping with scroller |
| **🔗 Organization** | Link contacts bi-directionally, merge duplicates with field-level wizard, archive/block/trash with restore, bulk delete, tags & groups |
| **📅 Calendar** | Dashboard stat cards, upcoming events (birthdays + custom), month calendar view, event management (type, repeat, reminder, alert mode) |
| **📞 Activity** | Log calls/messages/emails/WhatsApp/video calls per contact, AI note summarization |
| **🤖 AI Assistant** | Full chat interface with session management, function calling (add/remove/search contacts, navigate pages, report settings), streaming responses |
| **🎂 Birthday AI** | One-click AI-generated birthday wishes sent via WhatsApp Web, relationship-aware messaging |
| **🖼️ Profile Pictures** | Static avatars (15), file upload, AI-generated avatars from text prompts |
| **📤 Sharing** | vCard QR code generation, download PNG, Web Share API, WhatsApp direct link |
| **💾 Data** | CSV import/export, full JSON backup/restore with validation |
| **🔒 Security** | Optional 4-digit PIN lock, private contact marking |
| **🎨 Customization** | Dark/light mode, toggle profile pictures, phone numbers, numbers-only filter |
| **↩️ Undo/Redo** | Every action tracked with labels — undo/redo anytime |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **npm** 9+
- A **Groq API key** (for AI features) — get one at [Groq Console](https://console.groq.com/keys)

### Installation

```bash
# Install dependencies
npm install

# Set up your Groq API key in .env
# Edit the .env file and set:
# GROQ_API_KEY=gsk_your_key_here

# Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview production build |

---

## 🧠 AI Features

All AI features are powered by **Groq** via the OpenAI-compatible API endpoint. Groq provides extremely fast LLM inference using LPU (Language Processing Unit) technology.

### Models Used

| Model | Used For |
|---|---|
| `llama-3.3-70b-versatile` | AI Assistant chat with function calling |
| `llama3-8b-8192` | Birthday wish generation, activity log summarization, avatar prompts |

### 🤖 AI Assistant (Chat)

A full-featured conversational assistant integrated directly into the app with:

- **Session management** — create, rename, delete chat sessions
- **Function calling** — the AI can perform real actions:
  - **Add contacts** — asks for first name, last name, and phone number
  - **Remove contacts** — confirms full name, moves to trash
  - **Contact summary** — reports active, archived, blocked, trash, and favorites counts
  - **Search contacts** — by name, tag, or favorites
  - **App settings** — reports current theme and display preferences
  - **Page navigation** — jumps to Dashboard, Contacts, or Settings
- **Persistent history** — all chats saved to IndexedDB

### 🎂 AI Birthday Wishes

When viewing upcoming birthdays on the Dashboard, click the WhatsApp button to:
1. Generate a personalized birthday message using Groq (tailored to relationship: Family/Friends/Work)
2. Open WhatsApp Web with the pre-filled message

### 📝 AI Activity Summarization

When logging a contact activity (call, message, etc.), click "Summarize with AI" to condense your notes into a single concise sentence.

### 🖼️ AI Avatar Generation

In the Profile Customization modal, describe your ideal avatar in text and Groq will generate a profile picture for the contact.

---

## 🗺️ Pages & Navigation

| Page | Description |
|---|---|
| **Dashboard** | Stat cards (total contacts, favorites, events this month, new this month), upcoming events list, birthdays with WhatsApp wish button, month calendar modal with event dots |
| **Contacts** | Search with debounce, tag filter, favorites toggle, A–Z grouped list with letter scroller, bulk edit mode with "Select All Visible" and floating delete bar, undo/redo |
| **Settings** | 7 tabs: Appearance (dark/light), Contact List (display toggles), Data (CSV import/export, JSON backup/restore), Archived (unarchive all), Blocked (unblock all), Trash (restore/empty), Duplicates (merge) |

### Navigation Bar

- **Mobile** — Fixed bottom tab bar with 5 items: Dashboard, Contacts, Add (primary button), Settings, AI (sparkles icon)
- **Desktop** — Centered floating pill at the bottom

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 |
| **Language** | TypeScript 5.8 |
| **Bundler** | Vite 6 |
| **Styling** | Tailwind CSS 4 (CDN) + CSS Custom Properties |
| **Storage** | IndexedDB (fully client-side, no server needed) |
| **AI** | Groq API (OpenAI-compatible, via `fetch`) |
| **QR Codes** | api.qrserver.com |
| **Avatars** | avatar.iran.liara.run |
| **Font** | Poppins (Google Fonts) |
| **Icons** | 55 custom SVG components |

### Data Flow

```
User Interface (React Components)
        ↕
App.tsx (State Management + useHistoryState for undo/redo)
        ↕
IndexedDB (ContactManagerDB) — contacts, settings, chat_sessions, calendar_events
        ↕
Browser Persistence — survives refresh, no sign-in required
```

### Project Structure

```
contacts-manager/
├── index.html               # Entry point, Tailwind CDN, CSS custom properties (light/dark)
├── index.tsx                # React mount
├── App.tsx                  # Root component: state, routing, modals, AI integration
├── types.ts                 # All TypeScript interfaces & types
├── database.ts              # IndexedDB CRUD + schema migration
├── vite.config.ts           # Vite config with env injection & path aliases
├── tsconfig.json            # TypeScript configuration
├── metadata.json            # App metadata descriptor
├── package.json             # Dependencies & scripts
├── .env                     # Environment variables (GROQ_API_KEY)
├── hooks/
│   └── useHistoryState.ts   # Generic undo/redo hook with labeled history
├── assets/
│   └── avatars.ts           # 15 static avatar URLs
├── components/
│   ├── Sidebar.tsx          # Bottom nav (mobile fixed, desktop floating pill)
│   ├── Dashboard.tsx        # Dashboard with stats, events, calendar, birthday wishes
│   ├── ContactsPage.tsx     # Contact list with search, filter, A-Z grouping, bulk edit
│   ├── ContactModal.tsx     # Add/Edit contact form (3 tabs: Address, Personal, Other)
│   ├── ContactDetailPage.tsx# Slide-in panel with details, activity log, linked contacts, actions
│   ├── SettingsPage.tsx     # Full settings (appearance, data, management tabs)
│   ├── EventModal.tsx       # Add/Edit calendar event with type, repeat, reminder, contact picker
│   ├── AIAssistant.tsx      # AI chat panel with session sidebar + message bubbles
│   ├── ManagementPage.tsx   # Archived/Blocked/Trash/Duplicates tabbed management
│   ├── MergeContactsModal.tsx   # Step-by-step duplicate merge wizard
│   ├── LinkContactsModal.tsx    # Bi-directional contact linking
│   ├── ShareContactModal.tsx    # vCard QR code generator with download/share
│   ├── LogActivityModal.tsx     # Activity logging with AI summarization
│   ├── ProfileCustomizationModal.tsx # Avatar picker (static/upload/AI generate)
│   ├── PinModal.tsx         # 4-digit PIN entry keypad
│   ├── icons.tsx            # 55 custom SVG icon components
│   └── ...                  # Legacy stubs
```

---

## 💾 Data Storage

### IndexedDB Schema

**Database:** `ContactManagerDB` (version 2)

| Store | Key Path | Purpose |
|---|---|---|
| `contacts` | `id` | All contacts with full fields |
| `settings` | key-value | Theme, display settings, security PIN |
| `chat_sessions` | `id` | AI chat sessions with full message history |
| `calendar_events` | `id` | Custom calendar events |

### Schema Migration (`database.ts:migrateContacts`)

The app automatically handles schema evolution:
- Single phone/email → labeled arrays
- String address → structured address object
- Boolean reminder → string reminder setting
- Initializes missing fields (activityLog, linkedContactIds, socialMediaLinks, etc.)

### Import/Export

| Feature | Format | Details |
|---|---|---|
| **Import** | CSV | Bulk add contacts with preview + confirmation |
| **Export** | CSV | Download all contacts as CSV |
| **Backup** | JSON | Full backup of contacts, events, settings, chat history |
| **Restore** | JSON | Upload backup with validation (version check, structure validation) |

---

## 🖼️ Profile Picture System

3 ways to set a contact's profile picture:

| Method | Source | Details |
|---|---|---|
| **Avatars** | avatar.iran.liara.run | 15 pre-made avatars (James, Emily, Michael, etc.) |
| **Upload** | Local device | Square image upload with "Choose File" + "Apply Image" |
| **AI Generate** | Groq LLM | Text prompt → AI-generated 1:1 avatar image |

---

## 📱 Contact Detail Panel

Click any contact to open a slide-in panel with:

- **Profile section** — picture/initials, name, job title, company, favorite heart, blocked badge
- **Quick actions** — Call, Video (WhatsApp), Message (SMS), Email, WhatsApp — each auto-logs activity
- **Info cards** — Contact Info (phones/emails), Other Info (nickname, tags, website), Address, Birthday
- **Linked contacts** — view and navigate to linked contacts, unlink
- **Recent activity** — last 10 activity entries with type-specific icons
- **Bottom bar** — Edit, Share (QR), Archive, Block, Move to Trash

---

## 📊 Dashboard Analytics

The Dashboard provides:

- **4 Stat Cards** — Total Contacts, Favorites, Events This Month, New This Month
- **Upcoming Events** — next 7 upcoming birthdays + custom events with dates
- **WhatsApp Birthday Wishes** — one-click AI-generated wishes sent via `wa.me`
- **Calendar Modal** — full month grid with event indicators, navigation, event details, edit/delete

---

## 📸 Modal Dialogs

| Modal | Trigger | Purpose |
|---|---|---|
| **Contact Modal** | "+" nav button or Edit in detail panel | Add or edit a contact (3-tab form) |
| **Event Modal** | "Add Event" on Dashboard or edit event | Add or edit a calendar event |
| **AI Assistant** | Sparkles icon in nav | Chat with Groq AI assistant |
| **Profile Customization** | Camera icon in Contact Modal | Choose/upload/generate profile picture |
| **Share Contact** | Share button in contact detail | Generate vCard QR code (download/share) |
| **Log Activity** | Call/Message/Email/WhatsApp/Video in detail panel | Log activity with optional AI-summarized notes |
| **Link Contacts** | Link button in contact detail | Bi-directional contact linking |
| **Merge Contacts** | Duplicates tab in Settings > Management | Wizard for merging duplicate contacts |
| **PIN Modal** | (Future: private vault) | 4-digit PIN entry with shake on error |
| **Calendar View** | "View Calendar" on Dashboard | Full month calendar with events |

---

## 🌗 Theming

### Dark / Light Mode

The app uses CSS custom properties for seamless theme switching:

```css
:root { /* Light */
  --background: 220 13% 96%;
  --card: 0 0% 100%;
  --text: 240 6% 10%;
  --primary: 0 0% 0%;
}
.dark { /* Dark */
  --background: 220 3% 14%;
  --card: 220 3% 20%;
  --text: 0 0% 92%;
  --primary: 0 0% 100%;
}
```

### Display Settings

| Setting | Description |
|---|---|
| Show Profile Pictures | Toggle avatar/initials visibility in contact list |
| Show Contact Number | Toggle phone number display in contact list |
| Show Only With Numbers | Filter contacts list to only those with phone numbers |

---

## 🔄 Undo / Redo System

The `useHistoryState` hook powers undo/redo for contact operations:

- **Labeled history** — each change shows what was done ("Added John Doe", "Moved 3 contacts to trash")
- **Smart tracking** — skips duplicate states (strict equality check)
- **Clearable** — history can be reset (useful after restore)
- **Used by** — all contact mutations (add, edit, delete, archive, block, merge, link, activity log)

---

## 🛠️ Technical Details

### Key Implementation Notes

- **No server required** — fully client-side PWA; all data stays in your browser
- **CDN dependencies** — Tailwind CSS loaded via CDN in `index.html`; no postCSS config needed
- **Environment variables** — Vite's `loadEnv` with empty prefix loads all `.env` vars; mapped to `process.env.API_KEY` for runtime access
- **Schema evolution** — contacts are automatically migrated on load to handle old formats
- **Activity logging** — quick action buttons (call, message, etc.) auto-log activities
- **Dynamic tag filtering** — tag dropdown is derived from all contacts' unique tags
- **Debounced search** — 300ms debounce; auto-navigates on exact phone/email match (>5 chars)

### Performance Considerations

- All data stored locally in IndexedDB — no network latency for data
- AI requests go directly from browser to Groq API
- Contact list uses `useMemo` for filtered/sorted views
- Lazy loading for page components (Dashboard, Contacts, Settings, ContactModal, EventModal)
- Undo/redo history is maintained in memory only (not persisted to IndexedDB)

---

## 🔮 Future Possibilities

- **Private vault** — PIN-protected section for private contacts (PinModal ready)
- **Reports & analytics** — Reports page stub exists
- **QR scanning** — QRScannerModal for importing contacts via scan
- **Collaboration** — share contacts between devices

---

## 📄 License

This project is provided for personal and educational use.

---

<div align="center">
  <sub>Built with ❤️ for managing connections that matter</sub>
</div>
