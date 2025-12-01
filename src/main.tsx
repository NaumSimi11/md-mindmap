import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { PlatformProvider } from "./contexts/PlatformContext";
import { initializeApp } from "./infrastructure/config/AppInitialization";

// Initialize application (DI container, etc.)
initializeApp();

createRoot(document.getElementById("root")!).render(
  <PlatformProvider>
    <App />
  </PlatformProvider>
);
