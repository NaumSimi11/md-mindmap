import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import Workspace from "./pages/Workspace";

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
            <Route path="/old-landing" element={<LandingPage />} />
            
            {/* NEW: Main Workspace (AI Office Suite) */}
            <Route path="/workspace" element={<Workspace />} />
            <Route path="/workspace/doc/:id/edit" element={<Workspace />} />
            <Route path="/workspace/doc/:id/mindmap" element={<Workspace />} />
            <Route path="/workspace/doc/:id/slides" element={<Workspace />} />
            <Route path="/workspace/doc/:id/present" element={<Workspace />} />
            
            {/* Standalone Mindmap Studio */}
            <Route path="/studio2" element={<MindmapStudio2 />} />
            
            {/* OLD: Dashboard (keeping for backward compatibility) */}
            <Route path="/dashboard" element={<AppLayout />}>
              <Route index element={<Index />} />
              <Route path="editor" element={<Editor />} />
              <Route path="mindmaps" element={<Mindmaps />} />
              <Route path="mindmaps/editor" element={<MindmapEditor />} />
              <Route path="mindmaps/studio" element={<MindmapStudio />} />
              <Route path="mindmaps/studio1" element={<MindmapStudio1 />} />
              <Route path="mindmaps/studio2" element={<MindmapStudio2 />} />
              <Route path="library" element={<div className="p-6 text-center text-muted-foreground">Library feature coming soon...</div>} />
              <Route path="slash-demo" element={<SlashCommandDemo />} />
              <Route path="templates" element={<Templates />} />
              <Route path="settings" element={<div className="p-6 text-center text-muted-foreground">Settings feature coming soon...</div>} />
            </Route>
            <Route path="/workspace-demo" element={<WorkspaceDemo />} />
            <Route path="/presentation/:presentationId/edit" element={<PresentationEditor />} />
            <Route path="/presentation/:presentationId/present" element={<PresenterMode />} />
            <Route path="/install" element={
              <div className="min-h-screen bg-dark text-white">
                {/* Header */}
                <header className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <span className="sr-only">Toggle menu</span>
                      <div className="w-6 h-6 flex flex-col justify-center">
                        <span className="block w-full h-0.5 bg-white mb-1"></span>
                        <span className="block w-full h-0.5 bg-white mb-1"></span>
                        <span className="block w-full h-0.5 bg-white"></span>
                      </div>
                    </button>
                    <h1 className="text-xl font-semibold">Install</h1>
                    <div></div>
                  </div>
                </header>
                
                {/* Content */}
                <div className="p-8 max-w-4xl mx-auto">
                  <h1 className="text-4xl font-bold mb-6">Install MD Creator</h1>
                  <p className="text-white/70">Installation page coming soon...</p>
                </div>
              </div>
            } />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/support" element={
              <div className="min-h-screen bg-dark text-white">
                {/* Header */}
                <header className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <span className="sr-only">Toggle menu</span>
                      <div className="w-6 h-6 flex flex-col justify-center">
                        <span className="block w-full h-0.5 bg-white mb-1"></span>
                        <span className="block w-full h-0.5 bg-white mb-1"></span>
                        <span className="block w-full h-0.5 bg-white"></span>
                      </div>
                    </button>
                    <h1 className="text-xl font-semibold">Support</h1>
                    <div></div>
                  </div>
                </header>
                
                {/* Content */}
                <div className="p-8 max-w-4xl mx-auto">
                  <h1 className="text-4xl font-bold mb-6">Support</h1>
                  <p className="text-white/70">Support page coming soon...</p>
                </div>
              </div>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
