things tha tneed to be done :
-tempaltes to be fixes ( design and the creating from design ) (  where do we use templates? we use tehmplates in the new document dialog, we use template in the home workspacace page )  to be add more comprehensive templates ( check notions and other shits ) 
 - we should bring more templates ( i know ive written this - i need a fking nice shit as notion as capcat and all other shits. )
 - workspace dahsboard whould have more templaty preview - it's too basic now ( even looks nice ) 

 - the main landing page should  get reworked wiht the premium style templates. 


- ✅ DONE: added X button next to document title to close and go back to workspace home 

- ✅ DONE: import more document types - added mammoth for Word (.docx) and xlsx for Excel (.xlsx/.xls) conversion to Markdown   
- export more types of documents ( maybe )
- organize the export - export or save - now we have export to md, and that is, we shoyld think how can we organize that better, it it's ok as it is :) 

 - ✅ DONE: wired settings page to global Zustand store (userPreferencesStore) - theme, font size, toolbar style, spellcheck, auto-save, AI settings now apply globally and persist
 - ✅ DONE: added toolbar visibility controls in Settings > Appearance - can now show/hide Action Bar, Formatting Toolbar, and Side Toolbar
 - ✅ DONE: fixed toolbar duplication - removed Format expandable from Side Toolbar, removed Diagram/AI pills from Formatting Toolbar
 - ✅ DONE: unified toolbar settings UI - consolidated into visual preview cards (Action Bar, Formatting, Side Bar) in one section

 - the createion document dialog to be redesigned - now it's nice ui, but bad UX i think. 
 - ✅ DONE: updated UnifiedAIModal with premium glassmorphism styling (tabs, quick actions, buttons)

 - ✅ DONE: improved light theme contrast - stronger shadows, visible borders, better section definition in sidebar/header/cards
 - ✅ DONE: fixed recent documents card alignment in WorkspaceHome.tsx
 - the chat ai to be fixes - and implemented SIMPLE chat - ( we can let this for later, we will implement cli )
 - llm cli to be think about. this is relarted with the chat

 - ✅ DONE: to add  more fast text comands in the toolbar tiptap (Basic formatting added: Bold, Italic, Underline, Headings, Lists, Link)
 - TODO: Add more text formatting commands to toolbar - need to research competitors (Notion, Linear, Cursor, etc.) and add most-used formatting options for fast access. Should include: Highlight, Strikethrough, Code, Quote, Alignment, Text Color, Background Color, and other commonly used formatting options. Make them easily accessible in the Formatting Toolbar with expand/collapse option if needed.

 - the size - we should take care do not have initial size ( whole height ) if the editor scollable - we have problem sometimes with the scroll , this need to be redefined and taking care for it. 

 - ✅ DONE: removed collaboration icon and sidebar from Workspace.tsx

 - ✅ DONE: removed floating 'Collapse' button from AdaptiveSidebar.tsx


 - ✅ DONE: updated editor/mindmap switcher (MindmapLoadingScreen) with premium orange/amber gradient styling

 - ✅ DONE: updated mindmap dialog (UnifiedDiagramModal) with premium glassmorphism styling

 - we do not show history on not logged users for now - we should hide history if we are not on the cloud - or we shoyld implement offline history ( this to be brainstoemd , leave it for later)

 - we should fix the tauri , and test on tauri from now on 
 - ✅ DONE: updated startup scripts (start-services.sh + start-services.ps1) to ask for Web or Tauri mode interactively

 - ✅ DONE: "Workspace Settings" now works for both guests and logged-in users (removed ProtectedRoute, added dual-mode settings page)
 - ✅ DONE: Documents now correctly belong to specific workspace (fixed merge bug in DocumentDataContext - was keeping old workspace docs)
 - ✅ DONE: Export now uses actual document title (added useEffect to sync title state with documentTitle prop in WYSIWYGEditor)

 - ✅ DONE: Press Enter in New Document modal to create document (added onKeyDown handler)
 - ✅ DONE: Rename Folder now works with proper modal (created RenameFolderModal.tsx, replaced browser prompt())
 - ✅ DONE: Proper "Rename Folder" dialog title (no more "localhost:5173 says")
 - ✅ DONE: Input label changed to "New Name" in rename folder modal
"Import md" inside application is not working. Presents empty document
"Don't have a file? Try a sample" hyperlink is not working
 
 - ✅ DONE: rename na folder (RenameFolderModal implemented)
kreiranje nov dokument mora da e na top of lista
 
md sidebar - node sidebar - single node sidebar
 
kreiranje vo offline / online mode da se proveri 
 
 - ✅ DONE: tabot so alatki, na hover - explanation ostanuva pod main board. da se digne gore so z index. (Fixed submenu z-index in WYSIWYGEditor.tsx) 
 
da se dodadat most used tools na isitot bar - so moznost za expand ili whatever 
 
editor label to be removed 
 
 // menu
 
prva najava na tauri - ostanat e refresh token odosno korisnikot e logiran 
levo se loadiraat dokumenti ( local only shown ) 
 
kopce za najava od landing page
 
limit na document length vo sidebar  - +3 more items are not in the preview
 
 

- workspace sidebar ( local workspace ) has 2 folders : 
 - Getting Started folder
 - Quick Notes folder

 Creating new document - ( i dont have control if i create a document into any folder - main folder issue i guess ) , i do create document test 1, document is created in the workspace Local workspace - in the root. Move documents into getting started folder, adding some data into the document. Doing regresh, the document is still in the folder. 



- Person setting http://localhost:5173/settings

here we have Apperience / editor preferences. 
 - ✅ DONE: I need plan here, we have few toolbars. what toolbar to show . which one to be freeze, witch one to be movable, - do not duplicate the same toolbars ( examplle, top toolbar and lofaring right toolbar are the same ) .. and stuffs like that. 

 - ✅ DONE: right click - paste - is not working. we need to make check on all right click menu functionalities. (Fixed: replaced document.execCommand with Clipboard API for copy/cut/paste) 

 