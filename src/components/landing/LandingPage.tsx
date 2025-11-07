import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Download, Home, CreditCard, HelpCircle, User, FileText, Brain, Bot, FileImage, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AIAssistantModal } from "@/components/modals/AIAssistantModal";
import { HamburgerMenu } from "@/components/layout/HamburgerMenu";


export function LandingPage() {
  const navigate = useNavigate();
  const [showAIModal, setShowAIModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-dark relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]"></div>
      
      {/* Enhanced Header with Hamburger Menu */}
      <header className="relative z-10 pt-4 pb-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between">
            {/* Hamburger Menu Button - Always visible */}
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu size={24} className="text-white" />
            </button>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden lg:flex items-center justify-center space-x-12">
              <button 
                onClick={() => {}} 
                className="text-white/80 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Home size={16} />
                Home
              </button>
              <button 
                onClick={() => navigate('/install')} 
                className="text-white/80 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Download size={16} />
                Install
              </button>
              <button 
                onClick={() => navigate('/pricing')} 
                className="text-white/80 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <CreditCard size={16} />
                Pricing
              </button>
              <button 
                onClick={() => navigate('/support')} 
                className="text-white/80 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <HelpCircle size={16} />
                Support
              </button>
            </div>
            
            {/* Login and Theme Toggle */}
            <div className="flex items-center gap-4">
              <button className="text-white/80 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                <User size={16} />
                <span className="hidden sm:inline">Log In</span>
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        {/* Main Headline */}
        <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight">
          Translate your{" "}
          <span className="text-glow bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Markdown files
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-3xl leading-relaxed">
          The markdown editor that thinks with you. 
          <br />
          Create, visualize, and organize with AI-powered mindmaps.
        </p>

        {/* Call-to-Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <button
            onClick={() => navigate('/workspace')}
            className="btn-primary text-lg px-8 py-4 min-w-[200px] group"
          >
            Get Started Online
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={() => navigate('/install')}
            className="text-lg px-8 py-4 min-w-[200px] group bg-transparent border-2 border-white/20 text-white hover:border-white/40 hover:bg-white/5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Download size={20} className="group-hover:scale-110 transition-transform" />
            Download App
          </button>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-500 rounded-full animate-float opacity-60"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-400 rounded-full animate-float opacity-40" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-purple-300 rounded-full animate-float opacity-50" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-float opacity-30" style={{ animationDelay: '1s' }}></div>
      </main>

      {/* Quick Actions Section */}
      <section className="relative z-10 px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Quick Actions</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* New Document */}
            <button
              onClick={() => navigate('/workspace')}
              className="glass-card p-6 text-center hover:scale-[1.01] transition-all duration-200 group"
            >
              <FileText size={32} className="mx-auto mb-3 text-purple-400 transition-colors" />
              <h3 className="text-white font-medium mb-2">New Document</h3>
              <p className="text-white/60 text-sm">Start writing with AI-enhanced editor</p>
            </button>

            {/* AI Assistant */}
            <button
              onClick={() => setShowAIModal(true)}
              className="glass-card p-6 text-center hover:scale-[1.01] transition-all duration-200 group"
            >
              <Bot size={32} className="mx-auto mb-3 text-blue-400 transition-colors" />
              <h3 className="text-white font-medium mb-2">AI Assistant</h3>
              <p className="text-white/60 text-sm">Generate diagrams from your ideas</p>
            </button>

            {/* Mindmaps */}
            <button
              onClick={() => navigate('/workspace')}
              className="glass-card p-6 text-center hover:scale-[1.01] transition-all duration-200 group"
            >
              <Brain size={32} className="mx-auto mb-3 text-purple-400 group-hover:text-purple-300" />
              <h3 className="text-white font-medium mb-2">Mindmaps</h3>
              <p className="text-white/60 text-sm">Visualize your ideas interactively</p>
            </button>

            {/* Templates */}
            <button
              onClick={() => navigate('/workspace')}
              className="glass-card p-6 text-center hover:scale-[1.01] transition-all duration-200 group"
            >
              <FileImage size={32} className="mx-auto mb-3 text-orange-400 transition-colors" />
              <h3 className="text-white font-medium mb-2">Templates</h3>
              <p className="text-white/60 text-sm">Start with professional templates</p>
            </button>
          </div>
        </div>
      </section>

      {/* Bottom spacing */}
      <div className="h-32"></div>

      {/* Hamburger Menu Component */}
      <HamburgerMenu isOpen={isMenuOpen} onClose={closeMenu} />

      {/* AI Assistant Modal */}
      <AIAssistantModal 
        open={showAIModal}
        onOpenChange={setShowAIModal}
        documentContent=""
      />
    </div>
  );
}