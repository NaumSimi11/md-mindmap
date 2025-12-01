import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { LandingPage } from "./components/landing/LandingPage";
import Index from "./pages/Index";
import Editor from "./pages/Editor";
import Templates from "./pages/Templates";
import Mindmaps from "./pages/Mindmaps";
import { MindmapEditor } from "./components/mindmap/MindmapEditor";
import MindmapStudio from "./pages/MindmapStudio";
import MindmapStudio1 from "./pages/MindmapStudio1";
import MindmapStudio2 from "./pages/MindmapStudio2";
import SlashCommandDemo from "./pages/SlashCommandDemo";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import PresentationEditor from "./pages/PresentationEditor";
import PresenterMode from "./pages/PresenterMode";
import WorkspaceDemo from "./pages/WorkspaceDemo";
import AILandingPage from "./pages/AILandingPage";
import AILandingPageRedesigned from "./pages/AILandingPageRedesigned";
import Workspace from "./pages/Workspace";
import Install from "./pages/Install";
import Support from "./pages/Support";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AILandingPage />} />
            <Route path="/landing-redesigned" element={<AILandingPageRedesigned />} />
            <Route path="/old-landing" element={<LandingPage />} />

            {/* NEW: Main Workspace (AI Office Suite) */}
            <Route path="/workspace" element={<Workspace />} />
            <Route path="/workspace/doc/:id/edit" element={<Workspace />} />
            <Route path="/workspace/doc/:id/mindmap" element={<Workspace />} />
            <Route path="/workspace/doc/:id/slides" element={<Workspace />} />
            <Route path="/workspace/doc/:id/present" element={<Workspace />} />

            {/* Standalone Mindmap Studio */}
            <Route path="/studio2" element={<MindmapStudio2 />} />

            {/* OLD: Dashboard - Redirect to Workspace (unified navigation) */}
            <Route path="/dashboard" element={<Navigate to="/workspace" replace />} />
            <Route path="/dashboard/*" element={<Navigate to="/workspace" replace />} />

            {/* Legacy dashboard routes - redirect to workspace */}
            <Route path="/dashboard/editor" element={<Navigate to="/workspace" replace />} />
            <Route path="/dashboard/mindmaps" element={<Navigate to="/workspace" replace />} />
            <Route path="/dashboard/mindmaps/*" element={<Navigate to="/workspace" replace />} />
            <Route path="/dashboard/templates" element={<Navigate to="/workspace" replace />} />
            <Route path="/dashboard/library" element={<Navigate to="/workspace" replace />} />
            <Route path="/dashboard/settings" element={<Navigate to="/workspace" replace />} />
            <Route path="/dashboard/slash-demo" element={<Navigate to="/workspace" replace />} />
            <Route path="/workspace-demo" element={<WorkspaceDemo />} />
            <Route path="/presentation/:presentationId/edit" element={<PresentationEditor />} />
            <Route path="/presentation/:presentationId/present" element={<PresenterMode />} />
            <Route path="/install" element={<Install />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/support" element={<Support />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
