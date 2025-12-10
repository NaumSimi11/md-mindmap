# 🌟 **MDReader: Local-First Vision Document**

**Date**: December 10, 2025  
**Status**: 🎯 **Greenfield Vision**  
**Purpose**: Define what MDReader should be as a local-first markdown editor

---

## 📋 **Table of Contents**

1. [Core Philosophy](#1-core-philosophy)
2. [What We Offer (Services)](#2-what-we-offer-services)
3. [Core Features](#3-core-features)
4. [User Personas & Use Cases](#4-user-personas--use-cases)
5. [User Flows & Diagrams](#5-user-flows--diagrams)
6. [Local-First Architecture](#6-local-first-architecture)
7. [Feature Matrix](#7-feature-matrix)
8. [Success Metrics](#8-success-metrics)

---

## 1. Core Philosophy

### 1.1 What is "Local-First"?

**Local-first** means:
- ✅ **Your data lives on your device first**
- ✅ **Works offline by default**
- ✅ **Cloud is optional, not required**
- ✅ **You own your files**
- ✅ **No vendor lock-in**
- ✅ **Fast, instant edits (no network latency)**

**Inspiration**: Obsidian, VS Code, Notion (offline mode), Figma, Linear

---

### 1.2 The Problem We Solve

**Traditional markdown editors**:
- ❌ Require login to start
- ❌ Can't work offline
- ❌ Cloud-only storage (risk of data loss)
- ❌ Vendor lock-in
- ❌ Slow (network latency on every edit)

**MDReader (Local-First)**:
- ✅ Start writing immediately (no login)
- ✅ Always works offline
- ✅ Your files, your device, your control
- ✅ Export anytime (plain markdown)
- ✅ Instant edits (local-first)
- ✅ Optional cloud sync for convenience

---

### 1.3 Design Principles

1. **Instant Start** - No login, no setup, just write
2. **Always Available** - Works offline, online, anywhere
3. **User Owns Data** - Plain markdown files, exportable
4. **Progressive Enhancement** - Start local, add cloud later
5. **Zero Lock-In** - Export to markdown, switch anytime
6. **Fast & Responsive** - Local edits are instant

---

## 2. What We Offer (Services)

### 2.1 Core Service: Markdown Editing

**What We Provide**:
- 📝 **Rich markdown editor** (TipTap-based)
- 📁 **Document organization** (folders, tags, search)
- 💾 **Local storage** (IndexedDB, filesystem)
- 🔄 **Automatic saving** (no manual "Save" button)
- 📤 **Export/Import** (.md, .txt, .docx, PDF)

**Unique Value**: Works completely offline, no server required.

---

### 2.2 Optional Service: Cloud Sync

**What We Provide** (when user enables it):
- ☁️ **Cross-device sync** (edit on laptop, continue on phone)
- 🔗 **Shareable links** (share a document with anyone)
- 👥 **Real-time collaboration** (Google Docs-style)
- 🔒 **Cloud backup** (never lose your work)
- 📱 **Mobile access** (web app works on phones)

**Unique Value**: You choose which documents to sync, which stay local.

---

### 2.3 Optional Service: Collaboration

**What We Provide** (when user enables it):
- 👁️ **See who's online** (presence indicators)
- ✍️ **Collaborative cursors** (see where others are typing)
- 💬 **Comments & discussions** (inline document comments)
- 🔔 **Notifications** (when someone edits your doc)
- 🕐 **Version history** (see all changes over time)

**Unique Value**: Collaboration is opt-in, not forced.

---

### 2.4 Platform Service: Tauri Desktop App

**What We Provide**:
- 🖥️ **Native desktop app** (Mac, Windows, Linux)
- 📂 **Filesystem integration** (save to Documents folder)
- 🔐 **OS-level encryption** (optional)
- ⚡ **Better performance** (native vs web)
- 📴 **True offline mode** (no browser required)

**Unique Value**: Desktop app works 100% offline, forever.

---

## 3. Core Features

### 3.1 Tier 0: Must-Have (MVP)

| Feature | Description | Why Critical |
|---------|-------------|--------------|
| **Markdown Editor** | Rich editor with live preview | Core product |
| **Local Storage** | IndexedDB / filesystem | Local-first foundation |
| **Folders** | Organize documents | Basic organization |
| **Auto-save** | Save as you type | Modern UX |
| **Search** | Find documents quickly | Usability |
| **Export** | Download as .md | User owns data |
| **Guest Mode** | No login required | Zero friction |

---

### 3.2 Tier 1: Nice-to-Have (Post-MVP)

| Feature | Description | User Benefit |
|---------|-------------|--------------|
| **Tags** | Tag documents for organization | Better organization |
| **Starred/Favorites** | Mark important docs | Quick access |
| **Dark Mode** | Dark theme | Eye comfort |
| **Keyboard Shortcuts** | Power user efficiency | Speed |
| **Templates** | Pre-made document structures | Save time |
| **Word Count** | Track document length | Writer tool |
| **Reading Mode** | Distraction-free reading | Focus |

---

### 3.3 Tier 2: Advanced (Phase 2)

| Feature | Description | User Benefit |
|---------|-------------|--------------|
| **Cloud Sync** | Optional cloud backup | Cross-device |
| **Sharing** | Share documents via link | Collaboration |
| **Comments** | Inline document comments | Feedback |
| **Version History** | Time-travel through edits | Safety net |
| **Real-time Collab** | Multi-user editing | Teamwork |
| **Mobile App** | iOS/Android apps | Anywhere access |

---

## 4. User Personas & Use Cases

### 4.1 Persona 1: **Solo Writer (Alice)**

**Profile**:
- Freelance writer, writes blog posts and articles
- Works from coffee shops (unreliable WiFi)
- Needs distraction-free writing environment
- Wants her files local (doesn't trust cloud)

**Use Case**:
1. Opens MDReader (no login)
2. Starts new document "Blog Post Ideas"
3. Writes 500 words offline in coffee shop
4. Closes laptop, goes home
5. Opens laptop, document still there
6. Exports as .md to upload to Medium

**Critical Features**: Guest mode, offline, export

---

### 4.2 Persona 2: **Student (Bob)**

**Profile**:
- University student, takes class notes
- Uses multiple devices (laptop, tablet)
- Needs notes available everywhere
- Budget-conscious (free tier user)

**Use Case**:
1. Takes notes in class on laptop (offline mode)
2. Goes home, notes auto-sync to cloud
3. Reviews notes on tablet before exam
4. Shares study guide with classmates via link
5. Collaborates on group project document

**Critical Features**: Cloud sync, cross-device, sharing

---

### 4.3 Persona 3: **Developer (Charlie)**

**Profile**:
- Software engineer, writes technical docs
- Needs code syntax highlighting
- Uses markdown for README files
- Prefers keyboard shortcuts

**Use Case**:
1. Writes API documentation locally
2. Uses markdown tables and code blocks
3. Exports as .md to commit to GitHub
4. Keeps local copy for quick reference
5. Never needs cloud (all local)

**Critical Features**: Code blocks, export, local-first

---

### 4.4 Persona 4: **Remote Team (Diana's Team)**

**Profile**:
- Marketing team at startup
- Works remotely across time zones
- Needs to collaborate on documents
- Wants version control

**Use Case**:
1. Diana creates "Q1 Marketing Plan" doc
2. Enables cloud sync + collaboration
3. Shares link with 5 team members
4. Everyone edits simultaneously (real-time)
5. Comments on specific sections
6. Reviews version history to see who changed what

**Critical Features**: Real-time collab, comments, version history

---

## 5. User Flows & Diagrams

### 5.1 Flow 1: Guest User (First-Time)

```
┌─────────────────────────────────────────────────────────────┐
│                  First-Time Guest Flow                      │
└─────────────────────────────────────────────────────────────┘

User opens website
        ↓
    Landing Page
    "Start Writing Now" (big button)
        ↓
    [No Login Required]
        ↓
    Blank Editor Opens
        ↓
    User types: "My First Note"
        ↓
    Auto-saves to IndexedDB (local)
        ↓
    Document appears in sidebar
        ↓
    User continues writing...
        ↓
    Closes browser tab
        ↓
    (Next day)
        ↓
    Opens website again
        ↓
    Document still there! ✅
```

**Key Points**:
- ✅ Zero friction (no signup wall)
- ✅ Data persists across sessions
- ✅ Works offline
- ⚠️ Data is browser-bound (if user clears cookies, data lost)

---

### 5.2 Flow 2: Guest → Authenticated User

```
┌─────────────────────────────────────────────────────────────┐
│              Guest Upgrade Flow                             │
└─────────────────────────────────────────────────────────────┘

Guest has 10 documents locally
        ↓
    Clicks "Sign Up" (in banner)
        ↓
    Signs up with email/password
        ↓
    [Migration Modal Appears]
    "You have 10 documents. Import to account?"
        ↓
    User clicks "Yes, Import"
        ↓
    System uploads all 10 docs to cloud
        ↓
    Documents now synced to account
        ↓
    Can access from any device
        ↓
    Local copies remain for offline use
```

**Key Points**:
- ✅ Seamless migration (no data loss)
- ✅ One-click import
- ✅ Documents immediately synced

---

### 5.3 Flow 3: Cloud Sync Enable/Disable

```
┌─────────────────────────────────────────────────────────────┐
│              Cloud Sync Toggle Flow                         │
└─────────────────────────────────────────────────────────────┘

User has local document "Private Journal"
        ↓
    Document Info Panel
    [Sync to Cloud: OFF] ← toggle
        ↓
    User toggles ON
        ↓
    System creates cloud copy
        ↓
    Document now syncs automatically
        ↓
    Available on all devices
        ↓
    (Later) User toggles OFF
        ↓
    [Confirmation Dialog]
    "Stop syncing? Local copy will remain."
        ↓
    User confirms
        ↓
    Document becomes local-only again
```

**Key Points**:
- ✅ User controls sync per document
- ✅ Can mix local + cloud documents
- ✅ Reversible (can disable sync anytime)

---

### 5.4 Flow 4: Offline Editing (Cloud-Synced Doc)

```
┌─────────────────────────────────────────────────────────────┐
│              Offline Editing Flow                           │
└─────────────────────────────────────────────────────────────┘

User has cloud-synced document open
        ↓
    Network goes offline (WiFi drops)
        ↓
    [Status Indicator: "Offline" 📴]
        ↓
    User continues editing
        ↓
    Changes saved locally (IndexedDB)
        ↓
    Queue builds up (pending sync)
        ↓
    Network comes back online
        ↓
    [Status Indicator: "Syncing..." ⏳]
        ↓
    System syncs changes to cloud
        ↓
    [Status Indicator: "Synced ✅"]
        ↓
    Other devices receive updates
```

**Key Points**:
- ✅ Seamless offline editing
- ✅ No data loss
- ✅ Automatic sync on reconnect
- ⚠️ Conflict resolution if others edited same doc

---

## 6. Local-First Architecture

### 6.1 Core Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                     LOCAL-FIRST LAYERS                         │
└────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Layer 1: USER INTERFACE                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  TipTap Editor │ Sidebar │ Search │ Settings         │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│  Layer 2: LOCAL STORAGE (Primary)                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  IndexedDB (Dexie.js)                                │   │
│  │  • Documents (id, title, content, metadata)          │   │
│  │  • Folders (id, name, parent_id)                     │   │
│  │  • Workspaces (id, name, is_active)                  │   │
│  │  • Pending Changes (queue for cloud sync)            │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│  Layer 3: SYNC ENGINE (Optional)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  When Online + Cloud Enabled:                        │   │
│  │  • Detect changes (diff local vs remote)             │   │
│  │  • Queue pending uploads                             │   │
│  │  • Retry failed syncs                                │   │
│  │  • Resolve conflicts (if any)                        │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│  Layer 4: CLOUD (Optional)                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Backend API (FastAPI)                               │   │
│  │  • User accounts                                     │   │
│  │  • Document storage (PostgreSQL)                     │   │
│  │  • Collaboration server (optional)                   │   │
│  │  • File sharing                                      │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Key Insight**: Layers 1 + 2 work **completely standalone**. Layers 3 + 4 are optional enhancements.

---

### 6.2 Data Flow: Guest Mode

```
User types in editor
        ↓
TipTap captures edit
        ↓
Debounce (500ms)
        ↓
IndexedDB.documents.put({ id, title, content, updatedAt })
        ↓
Sidebar updates (shows latest document list)
        ↓
DONE ✅

[No network call]
[No authentication]
[No cloud involved]
```

**Latency**: **< 10ms** (local IndexedDB write)

---

### 6.3 Data Flow: Authenticated + Cloud Sync

```
User types in editor
        ↓
TipTap captures edit
        ↓
1. Save to IndexedDB FIRST (local-first!)
        ↓
2. Queue change for cloud sync
        ↓
3. (Background) Sync engine wakes up
        ↓
4. POST /api/documents/:id/update
        ↓
5. Backend saves to PostgreSQL
        ↓
6. Sync engine marks as "synced"
        ↓
DONE ✅

[If offline: Steps 3-6 happen later when online]
```

**Latency**: 
- Local save: **< 10ms**
- Cloud sync: **100-500ms** (background, non-blocking)

---

### 6.4 Storage Modes (Per Document)

Each document can be in one of three modes:

| Mode | Description | Storage | Collaboration | Use Case |
|------|-------------|---------|---------------|----------|
| **Local-Only** | Device-bound | IndexedDB only | ❌ No | Private notes, journals |
| **Cloud-Synced** | Cross-device | IndexedDB + Cloud | ⚠️ Share-only | Personal docs with backup |
| **Collaborative** | Real-time multi-user | IndexedDB + Cloud | ✅ Yes | Team documents |

**User Control**: User chooses mode per document via toggle.

---

## 7. Feature Matrix

### 7.1 Features by Mode

| Feature | Guest (Local-Only) | Authenticated (Local-Only) | Cloud-Synced | Collaborative |
|---------|-------------------|---------------------------|--------------|---------------|
| **Create Documents** | ✅ | ✅ | ✅ | ✅ |
| **Edit Offline** | ✅ | ✅ | ✅ | ✅ |
| **Folders** | ✅ | ✅ | ✅ | ✅ |
| **Search** | ✅ (local) | ✅ (local) | ✅ (local + cloud) | ✅ (local + cloud) |
| **Export .md** | ✅ | ✅ | ✅ | ✅ |
| **Cross-device** | ❌ | ❌ | ✅ | ✅ |
| **Shareable Links** | ❌ | ❌ | ✅ (read-only) | ✅ (edit) |
| **Real-time Editing** | ❌ | ❌ | ❌ | ✅ |
| **Comments** | ❌ | ❌ | ❌ | ✅ |
| **Version History** | ❌ | ❌ | ✅ (cloud-stored) | ✅ (cloud-stored) |
| **Data Safety** | ⚠️ Browser | ⚠️ Browser | ✅ Cloud backup | ✅ Cloud backup |

---

### 7.2 Progressive Enhancement Path

```
Stage 1: Guest (Local-Only)
    ↓
Stage 2: Sign Up (Still Local-Only)
    ↓
Stage 3: Enable Cloud Sync (Cloud-Synced)
    ↓
Stage 4: Enable Collaboration (Collaborative)
```

**Key Point**: Each stage is optional. User can stay at Stage 1 forever if they want.

---

## 8. Success Metrics

### 8.1 Adoption Metrics

| Metric | Target | Tracking |
|--------|--------|----------|
| **Guest → User Conversion** | > 15% | After 7 days of use |
| **Cloud Sync Adoption** | > 40% | Of authenticated users |
| **Collaboration Adoption** | > 20% | Of cloud-synced users |
| **Documents Created (Guest)** | Avg 3+ | Per guest session |
| **Offline Usage** | > 60% | Sessions with offline edits |

---

### 8.2 Performance Metrics

| Metric | Target | Why Important |
|--------|--------|---------------|
| **Time to First Edit** | < 2 seconds | From landing page to typing |
| **Local Save Latency** | < 10ms | Instant feedback |
| **Cloud Sync Latency** | < 500ms | Background, non-blocking |
| **Offline Capability** | 100% | All features work offline |
| **Data Loss Rate** | < 0.1% | Guest mode browser clears |

---

### 8.3 User Satisfaction Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **NPS Score** | > 50 | Monthly survey |
| **Retention (7-day)** | > 40% | Weekly active users |
| **Retention (30-day)** | > 25% | Monthly active users |
| **Export Rate** | > 50% | Users who export at least once |
| **Share Rate** | > 30% | Users who share documents |

---

## 9. Competitive Analysis

### 9.1 How We Compare

| Feature | MDReader | Obsidian | Notion | Google Docs | Bear |
|---------|----------|----------|--------|-------------|------|
| **Local-First** | ✅ Yes | ✅ Yes | ⚠️ Partial | ❌ No | ⚠️ Partial |
| **No Login Required** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Works Offline** | ✅ 100% | ✅ 100% | ⚠️ Limited | ❌ No | ✅ Yes |
| **Cloud Sync** | ✅ Optional | ⚠️ Paid | ✅ Yes | ✅ Yes | ✅ Yes |
| **Real-time Collab** | ✅ Optional | ❌ No | ✅ Yes | ✅ Yes | ❌ No |
| **Web + Desktop** | ✅ Both | ⚠️ Desktop only | ✅ Both | ✅ Web only | ⚠️ Mac/iOS only |
| **Free Tier** | ✅ Generous | ✅ Yes | ⚠️ Limited | ✅ Yes | ⚠️ Limited |

---

### 9.2 Our Unique Value Proposition

**What makes MDReader different?**

1. **True Local-First** - Start writing instantly, no login wall
2. **Granular Control** - Choose local vs cloud per document
3. **Zero Lock-In** - Plain markdown, export anytime
4. **Progressive Enhancement** - Guest → User → Cloud → Collab
5. **Web + Desktop** - Same experience everywhere
6. **Privacy-First** - You choose what goes to cloud

**Tagline**: *"Your markdown, your device, your rules."*

---

## 10. Monetization Strategy (Optional)

### 10.1 Freemium Model

**Free Tier** (Guest + Basic User):
- ✅ Unlimited local documents
- ✅ Full offline mode
- ✅ Export to .md, .txt
- ⚠️ No cloud sync
- ⚠️ No collaboration

**Pro Tier** ($5/month):
- ✅ Everything in Free
- ✅ Cloud sync (unlimited documents)
- ✅ Cross-device access
- ✅ Version history (30 days)
- ✅ Shareable links

**Team Tier** ($15/user/month):
- ✅ Everything in Pro
- ✅ Real-time collaboration
- ✅ Comments & discussions
- ✅ Team workspaces
- ✅ Admin controls

---

### 10.2 Alternative: Open Source + Hosting

**Open Source** (Local-first app):
- Free, self-hosted
- All features available

**Managed Hosting** (SaaS):
- Paid cloud sync + collab
- Zero setup, managed infrastructure

---

## 11. Implementation Phases

### 11.1 Phase 1: Local-First MVP (4 weeks)

**Deliverables**:
- ✅ Guest mode (no login)
- ✅ Markdown editor (TipTap)
- ✅ Local storage (IndexedDB)
- ✅ Folders
- ✅ Auto-save
- ✅ Search (local)
- ✅ Export (.md)

**Goal**: Fully functional local-only app

---

### 11.2 Phase 2: Authentication + Migration (2 weeks)

**Deliverables**:
- ✅ User signup/login
- ✅ Guest → User migration
- ✅ Account management
- ✅ Multiple workspaces

**Goal**: User accounts work, no cloud yet

---

### 11.3 Phase 3: Cloud Sync (4 weeks)

**Deliverables**:
- ✅ Backend API (FastAPI + PostgreSQL)
- ✅ Per-document sync toggle
- ✅ Offline queue + retry logic
- ✅ Conflict resolution
- ✅ Cross-device sync

**Goal**: Documents sync across devices

---

### 11.4 Phase 4: Collaboration (6 weeks)

**Deliverables**:
- ✅ Real-time editing (Yjs + Hocuspocus OR custom)
- ✅ Presence indicators
- ✅ Collaborative cursors
- ✅ Comments system
- ✅ Shareable links

**Goal**: Google Docs-style collaboration

---

## 12. Summary

### 12.1 What We're Building

**MDReader** is a **local-first markdown editor** that:
- ✅ Works completely offline
- ✅ Requires no login to start
- ✅ Gives users full control over their data
- ✅ Optionally syncs to cloud for convenience
- ✅ Supports real-time collaboration (optional)

---

### 12.2 Core Philosophy

```
Local-First > Cloud-Optional > Collaboration-Enhanced
```

1. **Local-First**: Your device is the source of truth
2. **Cloud-Optional**: Add sync when YOU want it
3. **Collaboration-Enhanced**: Share when YOU need it

---

### 12.3 Success Criteria

**We succeed if**:
- ✅ Users can create documents in < 2 seconds
- ✅ 100% offline capability
- ✅ > 15% guest → user conversion
- ✅ < 0.1% data loss rate
- ✅ Users love the speed (local-first)

---

**Status**: 🎯 **Vision Defined**  
**Next Step**: Architecture design for local-first implementation  
**Document Created**: December 10, 2025

