import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { PlatformProvider } from "./contexts/PlatformContext.tsx";
import { initializeApp } from "./infrastructure/config/AppInitialization.ts";

// Initialize application (DI container, etc.)
initializeApp();

createRoot(document.getElementById("root")!).render(
  <PlatformProvider>
    <App />
  </PlatformProvider>
);
