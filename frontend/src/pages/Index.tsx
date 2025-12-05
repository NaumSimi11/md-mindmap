import { useState } from "react";
import { 
  FileText, 
  Brain, 
  Image, 
  FileImage, 
  Bot,
  Clock,
  TrendingUp,
  FileCheck,
  CreditCard
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AIAssistantModal } from "@/components/modals/AIAssistantModal";
import { DesktopWorkspaceSelector } from "@/components/workspace/DesktopWorkspaceSelector";

export default function Index() {
  const navigate = useNavigate();
  const [showAIModal, setShowAIModal] = useState(false);

  const handleNewDocument = () => {
    navigate("/dashboard/editor");
  };

  const handleAction = (path: string) => {
    navigate(path);
  };

  const handleAIAssistant = () => {
    setShowAIModal(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-dark">
      {/* Top Bar */}
      <div className="glass-card mx-6 my-4 px-6 py-6 border border-border/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome to <span className="text-glow">Markdown reader</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Transform your ideas into beautiful documents and visual mindmaps with the power of AI
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Desktop Workspace Selector (only shows on desktop) */}
      <div className="px-6">
        <DesktopWorkspaceSelector />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-8">
        {/* Quick Actions Section */}
        <section>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-2">Quick Actions</h2>
            <p className="text-muted-foreground">Jump into your most important writing tasks</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 max-w-7xl mx-auto">
            {/* New Document Card */}
            <QuickActionCard
              title="New Document"
              description="Start writing with our AI-enhanced editor"
              icon={FileText}
              variant="secondary"
              onClick={handleNewDocument}
            />

            {/* AI Assistant Card */}
            <QuickActionCard
              title="AI Assistant"
              description="Generate diagrams from your ideas"
              icon={Bot}
              variant="primary"
              onClick={handleAIAssistant}
            />

            {/* Insert Images Card */}
            <QuickActionCard
              title="Insert Images" 
              description="Add visuals to your documents"
              icon={Image}
              variant="creative"
              onClick={() => handleAction("/dashboard/editor")}
            />

            {/* Mindmaps Card */}
            <QuickActionCard
              title="Mindmaps"
              description="Visualize your ideas with interactive mindmaps"
              icon={Brain}
              variant="success"
              onClick={() => handleAction("/dashboard/mindmaps")}
            />

            {/* Templates Card */}
            <QuickActionCard
              title="Templates"
              description="Start with professional templates"
              icon={FileImage}
              variant="warning"
              onClick={() => handleAction("/dashboard/templates")}
            />

            {/* Pricing Card */}
            <QuickActionCard
              title="Pricing"
              description="View plans and upgrade your account"
              icon={CreditCard}
              variant="primary"
              onClick={() => handleAction("/pricing")}
            />
          </div>
        </section>

        {/* Statistics Section */}
        <section>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-2">Your Progress</h2>
            <p className="text-muted-foreground">Track your writing and creativity stats</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Documents"
              value="12"
              icon={FileCheck}
              color="primary"
            />
            <StatsCard
              title="Words Written"
              value="24.5k"
              icon={TrendingUp}
              color="primary"
            />
            <StatsCard
              title="Mindmaps Created"
              value="8"
              icon={Brain}
              color="primary"
            />
            <StatsCard
              title="Templates Used"
              value="5"
              icon={Clock}
              color="primary"
            />
          </div>
        </section>
      </div>

      {/* AI Assistant Modal */}
      <AIAssistantModal 
        open={showAIModal}
        onOpenChange={setShowAIModal}
        documentContent=""
      />
    </div>
  );
}