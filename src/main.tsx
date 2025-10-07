import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { PlatformProvider } from "./contexts/PlatformContext";

createRoot(document.getElementById("root")!).render(
  <PlatformProvider>
    <App />
  </PlatformProvider>
);
