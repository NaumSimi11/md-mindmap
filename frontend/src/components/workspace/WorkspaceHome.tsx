/**
 * WorkspaceHome - Premium 2025 SaaS Workspace Experience
 *
 * Features:
 * - ✨ Glassmorphism design with backdrop blur
 * - 🎨 Gradient accents and premium visual hierarchy
 * - 🌟 Interactive animations and micro-feedback
 * - 📱 Responsive grid layouts with beautiful cards
 * - 🎯 Clear visual information architecture
 * - 🚀 Modern typography and spacing
 * - 💫 Engaging hover states and transitions
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Plus,
  FileText,
  Brain,
  Presentation,
  ArrowRight,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Palette,
  BookOpen,
  Lightbulb,
} from 'lucide-react';
import type { Document } from '@/services/workspace-legacy/BackendWorkspaceService';
import { QuickSwitcher } from './QuickSwitcher';
import { documentTemplates_service, type DocumentTemplate, type TemplateCollection } from '@/services/workspace-legacy/DocumentTemplates';
import { TemplatePreview, TemplateCard } from '@/components/templates/TemplatePreview';

interface WorkspaceHomeProps {
  onDocumentSelect: (documentId: string) => void;
  onNewDocument: () => void;
  onLoadDemo?: () => void;
  documents?: Document[]; // 🔥 Now passed from parent
  createDocument?: (type: 'markdown' | 'mindmap' | 'presentation', title: string, content: string) => Promise<any>;
}

export function WorkspaceHome({
  onDocumentSelect,
  onNewDocument,
  onLoadDemo,
  documents = [],
  createDocument,
}: WorkspaceHomeProps) {
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);

  const hasAnyDocs = documents.length > 0;

  // Get recent and starred from passed documents.
  // Fallback: if lastOpenedAt is missing (common today), use updatedAt.
  const recentDocs = hasAnyDocs
    ? [...documents]
        .sort((a, b) => {
          const aTime =
            a.lastOpenedAt?.getTime?.() ??
            (a.updatedAt ? new Date(a.updatedAt as any).getTime() : 0);
          const bTime =
            b.lastOpenedAt?.getTime?.() ??
            (b.updatedAt ? new Date(b.updatedAt as any).getTime() : 0);
          return bTime - aTime;
        })
        .slice(0, 8)
    : [];
  
  const starredDocs = documents.filter(d => d.starred).slice(0, 4);

  const getDocumentIcon = (type: Document['type']) => {
    switch (type) {
      case 'markdown':
        return <FileText className="h-5 w-5 text-blue-400" />;
      case 'mindmap':
        return <Brain className="h-5 w-5 text-sky-400" />;
      case 'presentation':
        return <Presentation className="h-5 w-5 text-blue-400" />;
    }
  };

  const getDocumentTypeLabel = (type: Document['type']) => {
    switch (type) {
      case 'markdown':
        return 'Document';
      case 'mindmap':
        return 'Mindmap';
      case 'presentation':
        return 'Presentation';
    }
  };

  const allTemplates = documentTemplates_service.getAll();
  const featuredTemplates: DocumentTemplate[] = documentTemplates_service.getFeatured();
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const featured = featuredTemplates[featuredIndex] || allTemplates[0];
  const collections = documentTemplates_service.getFeaturedCollections();
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  
  // Get templates for gallery - either from collection or all
  const galleryTemplates: DocumentTemplate[] = selectedCollection 
    ? documentTemplates_service.getByCollection(selectedCollection)
    : allTemplates.slice(0, 12);

  const handlePrev = () => {
    if (featuredTemplates.length === 0) return;
    setFeaturedIndex((i) => (i - 1 + featuredTemplates.length) % featuredTemplates.length);
  };

  const handleNext = () => {
    if (featuredTemplates.length === 0) return;
    setFeaturedIndex((i) => (i + 1) % featuredTemplates.length);
  };

  const formatType = (type: DocumentTemplate['type']) => {
    switch (type) {
      case 'markdown':
        return 'Document';
      case 'mindmap':
        return 'Mindmap';
      case 'presentation':
        return 'Presentation';
      default:
        return 'Template';
    }
  };

  const getPreviewSnippet = (template: DocumentTemplate) => {
    if (template.type !== 'markdown') {
      return `Type: ${formatType(template.type)}\nCategory: ${template.category}\nTags: ${template.tags.join(', ')}`;
    }
    const cleaned = template.content.replace(/\r/g, '').trim();
    return cleaned.length > 420 ? `${cleaned.slice(0, 420)}…` : cleaned;
  };

  const handleCreateFromFeatured = async () => {
    if (!featured) return;
    if (!createDocument) {
      // fallback to modal
      onNewDocument();
      return;
    }
    try {
      const title = featured.name;
      const doc = await createDocument(featured.type, title, featured.content);
      if (doc?.id) onDocumentSelect(doc.id);
    } catch (e) {
      // Keep it simple: fall back to modal if creation fails
      console.error('Failed to create from template:', e);
      onNewDocument();
    }
  };

  const TemplateThumb = ({ template, active, onClick }: { template: DocumentTemplate; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={[
        "group flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-left min-w-[220px]",
        active
          ? "border-blue-500/50 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.25)]"
          : "border-border/40 bg-card/30 hover:bg-card/50 hover:border-blue-500/30",
      ].join(' ')}
      title={template.name}
    >
      <div className="text-lg">{template.icon}</div>
      <div className="min-w-0">
        <div className="text-sm font-semibold truncate group-hover:text-blue-400 transition-colors">
          {template.name}
        </div>
        <div className="text-[11px] text-muted-foreground truncate">
          {formatType(template.type)} • {template.category}
        </div>
      </div>
    </button>
  );

  const TemplateMini = ({
    template,
    active,
    onClick,
  }: {
    template: DocumentTemplate;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={[
        "group flex items-start gap-3 p-3 rounded-2xl border text-left transition-all",
        active
          ? "border-blue-500/50 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.25)]"
          : "border-border/35 bg-card/25 hover:bg-card/45 hover:border-blue-500/25",
      ].join(" ")}
      title={template.name}
    >
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-border/40 flex items-center justify-center text-lg shrink-0">
        {template.icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold truncate group-hover:text-blue-400 transition-colors">
          {template.name}
        </div>
        <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
          {template.description}
        </div>
      </div>
    </button>
  );

  return (
    <div className="flex-1 relative overflow-auto bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/8 to-pink-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/4 left-1/2 w-64 h-64 bg-gradient-to-br from-cyan-400/6 to-blue-500/6 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto p-6 space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Welcome to MDReader</span>
            <Sparkles className="h-4 w-4 text-purple-500" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 dark:from-white dark:via-blue-100 dark:to-slate-200 bg-clip-text text-transparent">
            Your Creative Workspace
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Create, collaborate, and organize your ideas with powerful documents, mindmaps, and presentations.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={onNewDocument}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white shadow-[0_10px_30px_rgba(59,130,246,0.3)] hover:shadow-[0_15px_40px_rgba(59,130,246,0.4)] transition-all duration-300 hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onLoadDemo}
            className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-300"
          >
            <Zap className="h-4 w-4 mr-2" />
            Try Demo
          </Button>
        </div>

        {/* Recent Documents - Premium Cards */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recent Documents</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Continue where you left off</p>
              </div>
            </div>
            {recentDocs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuickSwitcher(true)}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                View all
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {hasAnyDocs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {recentDocs.map((doc, index) => (
                <button
                  key={doc.id}
                  onClick={() => onDocumentSelect(doc.id)}
                  className="group relative overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_12px_32px_rgba(59,130,246,0.12)] hover:-translate-y-1 text-left"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-sky-500/0 group-hover:from-blue-500/5 group-hover:to-sky-500/5 transition-all duration-300" />

                  <div className="relative p-5 flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-500/15 dark:to-sky-600/15 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 flex-shrink-0 shadow-sm border border-blue-200/50 dark:border-blue-500/20">
                      {getDocumentIcon(doc.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      {/* Title row with star */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                          {doc.title || 'Untitled Document'}
                        </h3>
                        {doc.starred && (
                          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-0.5" />
                        )}
                      </div>

                      {/* Metadata row */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                          {getDocumentTypeLabel(doc.type)}
                        </span>
                        {(doc.lastOpenedAt || doc.updatedAt) && (
                          <span className="text-slate-400 dark:text-slate-500">
                            {new Date((doc.lastOpenedAt || doc.updatedAt) as any).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                <BookOpen className="h-10 w-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Start Your Journey</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                Your workspace is ready. Create your first document or explore our beautiful templates to get started.
              </p>
              <Button
                onClick={onNewDocument}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white shadow-[0_15px_35px_rgba(59,130,246,0.4)] hover:shadow-[0_20px_45px_rgba(59,130,246,0.5)] transition-all duration-300 hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-3" />
                Create Your First Document
              </Button>
            </div>
          )}
        </div>

        {/* ✨ Premium Template Showcase */}
        {featured && (
          <div className="relative">
            {/* Section Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-4">
                <Palette className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{allTemplates.length}+ Premium Templates</span>
                <Lightbulb className="h-4 w-4 text-pink-500" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-slate-800 dark:from-white dark:via-purple-100 dark:to-slate-200 bg-clip-text text-transparent mb-2">
                Start with Inspiration
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Choose from professionally designed templates across 6 collections to jumpstart your creativity.
              </p>
            </div>

            {/* Collection Pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <button
                onClick={() => setSelectedCollection(null)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${!selectedCollection
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }
                `}
              >
                <Star className="h-4 w-4" />
                Featured
              </button>
              {collections.map(col => (
                <button
                  key={col.id}
                  onClick={() => setSelectedCollection(col.id)}
                  className={`
                    inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                    ${selectedCollection === col.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }
                  `}
                >
                  <span>{col.icon}</span>
                  {col.name}
                </button>
              ))}
            </div>

            {/* Featured Template Hero */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/90 to-slate-50/90 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-[0_25px_50px_rgba(0,0,0,0.1)] mb-8">
              {/* Animated background gradients */}
              <div className="absolute inset-0">
                <div className="absolute -inset-32 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.15),transparent_50%),radial-gradient(circle_at_70%_40%,rgba(168,85,247,0.12),transparent_45%),radial-gradient(circle_at_50%_70%,rgba(236,72,153,0.1),transparent_50%)] animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-slate-100/20 dark:from-slate-900/20 dark:to-slate-800/20" />
              </div>

              <div className="relative p-8 lg:p-12">
                <div className="flex flex-col lg:flex-row items-start gap-8">
                  {/* Featured Template Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <span className="text-xl">{featured.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                          {featured.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {formatType(featured.type)} • {featured.category}
                        </p>
                      </div>
                    </div>

                    <p className="text-lg text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
                      {featured.description}
                    </p>

                    <div className="flex items-center gap-3 mb-8">
                      <Button
                        onClick={handleCreateFromFeatured}
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-[0_15px_35px_rgba(168,85,247,0.4)] hover:shadow-[0_20px_45px_rgba(168,85,247,0.5)] transition-all duration-300 hover:scale-105"
                      >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Use This Template
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={onNewDocument}
                        className="border-2 border-slate-300 dark:border-slate-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all duration-300"
                      >
                        Browse All Templates
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>

                    {/* Navigation dots */}
                    <div className="flex items-center gap-2">
                      {featuredTemplates.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setFeaturedIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            idx === featuredIndex
                              ? 'bg-purple-500 w-8'
                              : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Preview Panel - Rich Template Preview */}
                  <div className="w-full lg:w-[420px]">
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.1)]">
                      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50">
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          Live Preview
                        </h4>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={handlePrev}
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center"
                            title="Previous template"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <span className="text-xs text-slate-500 dark:text-slate-400 px-2">
                            {featuredIndex + 1} / {featuredTemplates.length}
                          </span>
                          <button
                            onClick={handleNext}
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center"
                            title="Next template"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <TemplatePreview
                        template={featured}
                        maxLength={400}
                        className="border-0 rounded-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Template Grid */}
            {galleryTemplates.length > 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {selectedCollection 
                      ? `${collections.find(c => c.id === selectedCollection)?.name || 'Collection'} Templates`
                      : 'All Templates'
                    }
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {selectedCollection
                      ? collections.find(c => c.id === selectedCollection)?.description
                      : `Explore ${allTemplates.length}+ professionally designed templates`
                    }
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {galleryTemplates.map((template, index) => {
                    const idx = featuredTemplates.findIndex((ft) => ft.id === template.id);
                    const isActive = idx === featuredIndex;

                    return (
                      <button
                        key={template.id}
                        onClick={() => {
                          if (idx >= 0) setFeaturedIndex(idx);
                          else onNewDocument();
                        }}
                        className={`group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-[0_20px_40px_rgba(168,85,247,0.15)] hover:-translate-y-1 ${
                          isActive
                            ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/50 shadow-[0_15px_35px_rgba(168,85,247,0.2)]'
                            : 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 hover:border-purple-500/50'
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        )}

                        <div className="relative">
                          {/* Icon */}
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <span className="text-2xl">{template.icon}</span>
                          </div>

                          {/* Title */}
                          <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {template.name}
                          </h4>

                          {/* Description */}
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                            {template.description}
                          </p>

                          {/* Tags */}
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                              {formatType(template.type)}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                              {template.category}
                            </span>
                          </div>
                        </div>

                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                      </button>
                    );
                  })}
                </div>

                {/* View All Button */}
                <div className="text-center pt-4">
                  <Button
                    onClick={onNewDocument}
                    variant="outline"
                    size="lg"
                    className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all duration-300"
                  >
                    <BookOpen className="h-5 w-5 mr-2" />
                    View Complete Template Library
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Switcher */}
      <QuickSwitcher
        isOpen={showQuickSwitcher}
        onDocumentSelect={onDocumentSelect}
        onClose={() => setShowQuickSwitcher(false)}
      />
    </div>
  );
}

