import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { 
  Brain, 
  Plus, 
  Upload, 
  Settings, 
  Search, 
  Star, 
  Share, 
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  FileText,
  Clipboard,
  Sparkles,
  Eye,
  Edit3,
  Edit,
  RotateCcw
} from "lucide-react";
import { AIAssistantModal } from "@/components/modals/AIAssistantModal";

interface Mindmap {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  modifiedAt: string;
  nodeCount: number;
  source: 'AI' | 'Manual';
  isFavorite: boolean;
  thumbnail: string;
  nodes: MindmapNode[];
}

interface MindmapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  children: string[];
  parent?: string;
}

const sampleMindmaps: Mindmap[] = [
  {
    id: '1',
    title: 'Project Planning',
    description: 'AI-generated project structure',
    createdAt: '2024-01-15',
    modifiedAt: '2024-01-15',
    nodeCount: 23,
    source: 'AI',
    isFavorite: true,
    thumbnail: '',
    nodes: []
  },
  {
    id: '2',
    title: 'Learning Path',
    description: 'Personal learning journey',
    createdAt: '2024-01-14',
    modifiedAt: '2024-01-14',
    nodeCount: 15,
    source: 'Manual',
    isFavorite: false,
    thumbnail: '',
    nodes: []
  },
  {
    id: '3',
    title: 'Business Strategy',
    description: 'AI-generated business analysis',
    createdAt: '2024-01-13',
    modifiedAt: '2024-01-13',
    nodeCount: 31,
    source: 'AI',
    isFavorite: true,
    thumbnail: '',
    nodes: []
  }
];

export default function Mindmaps() {
  const [mindmaps, setMindmaps] = useState<Mindmap[]>(sampleMindmaps);
  const [selectedMindmap, setSelectedMindmap] = useState<Mindmap | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showAIModal, setShowAIModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiInputSource, setAiInputSource] = useState<'text' | 'document' | 'clipboard'>('text');
  const [mindmapStyle, setMindmapStyle] = useState('organic');
  const [complexity, setComplexity] = useState([5]);
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredMindmaps = mindmaps.filter(mindmap => {
    const matchesSearch = mindmap.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         mindmap.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'recent' && new Date(mindmap.modifiedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
                      (activeTab === 'ai' && mindmap.source === 'AI') ||
                      (activeTab === 'favorites' && mindmap.isFavorite) ||
                      (activeTab === 'shared' && false); // Placeholder for shared logic
    return matchesSearch && matchesTab;
  });

  const handleAIGenerate = async () => {
    if (!aiInput.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const newMindmap: Mindmap = {
        id: Date.now().toString(),
        title: `AI Generated: ${aiInput.slice(0, 30)}...`,
        description: 'Generated from AI analysis',
        createdAt: new Date().toISOString().split('T')[0],
        modifiedAt: new Date().toISOString().split('T')[0],
        nodeCount: Math.floor(Math.random() * 30) + 10,
        source: 'AI',
        isFavorite: false,
        thumbnail: '',
        nodes: []
      };
      
      setMindmaps(prev => [newMindmap, ...prev]);
      setSelectedMindmap(newMindmap);
      setIsGenerating(false);
      setShowAIModal(false);
      setAiInput('');
    }, 3000);
  };

  const handleCreateNew = () => {
    const newMindmap: Mindmap = {
      id: Date.now().toString(),
      title: 'New Mindmap',
      description: 'Manual creation',
      createdAt: new Date().toISOString().split('T')[0],
      modifiedAt: new Date().toISOString().split('T')[0],
      nodeCount: 1,
      source: 'Manual',
      isFavorite: false,
      thumbnail: '',
      nodes: []
    };
    
    setMindmaps(prev => [newMindmap, ...prev]);
    setSelectedMindmap(newMindmap);
    setShowCreateModal(false);
  };

  const toggleFavorite = (id: string) => {
    setMindmaps(prev => prev.map(mindmap => 
      mindmap.id === id ? { ...mindmap, isFavorite: !mindmap.isFavorite } : mindmap
    ));
  };

  const deleteMindmap = (id: string) => {
    setMindmaps(prev => prev.filter(mindmap => mindmap.id !== id));
    if (selectedMindmap?.id === id) {
      setSelectedMindmap(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mindmaps</h1>
            <p className="text-lg text-muted-foreground mt-1">
              Visualize your ideas with AI-powered mindmaps
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0"
              onClick={() => setShowAIModal(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate with AI
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create New
            </Button>
            <Button 
              onClick={() => window.location.href = '/dashboard/mindmaps/editor'}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Launch Editor
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Mindmap Library */}
        <div className="w-80 border-r border-border bg-card p-4 overflow-y-auto">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search mindmaps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="ai">AI</TabsTrigger>
            </TabsList>
            <TabsList className="grid w-full grid-cols-2 mt-2">
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Mindmap List */}
          <div className="space-y-3">
            {filteredMindmaps.map((mindmap) => (
              <Card 
                key={mindmap.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedMindmap?.id === mindmap.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedMindmap(mindmap)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium">{mindmap.title}</CardTitle>
                      <CardDescription className="text-xs">{mindmap.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(mindmap.id);
                        }}
                      >
                        <Star className={`h-3 w-3 ${mindmap.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Share functionality
                        }}
                      >
                        <Share className="h-3 w-3 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMindmap(mindmap.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Badge variant={mindmap.source === 'AI' ? 'default' : 'secondary'} className="text-xs">
                        {mindmap.source}
                      </Badge>
                      <span>{mindmap.nodeCount} nodes</span>
                    </div>
                    <span>{mindmap.modifiedAt}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Main Canvas */}
        <div className="flex-1 flex flex-col">
          {selectedMindmap ? (
            <>
              {/* Canvas Header */}
              <div className="border-b border-border bg-muted/20 px-4 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-foreground">{selectedMindmap.title}</h2>
                    <p className="text-sm text-muted-foreground">{selectedMindmap.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Present
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>

              {/* Canvas Area */}
              <div className="flex-1 relative bg-background">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                      <Brain className="w-12 h-12 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {selectedMindmap.source === 'AI' ? 'AI-Generated Mindmap' : 'Manual Mindmap'}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Interactive mindmap canvas will be rendered here
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <Badge variant="outline">{selectedMindmap.nodeCount} nodes</Badge>
                        <Badge variant="outline">{selectedMindmap.source}</Badge>
                        <Badge variant="outline">Modified {selectedMindmap.modifiedAt}</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Canvas Controls */}
                <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                  <Button variant="outline" size="icon">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>

                {/* Mini-map placeholder */}
                <div className="absolute bottom-4 left-4 w-32 h-24 bg-muted/50 rounded border border-border">
                  <div className="p-2 text-xs text-muted-foreground">Mini-map</div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Brain className="w-16 h-16 mx-auto text-muted-foreground/50" />
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Select a Mindmap</h3>
                  <p className="text-muted-foreground">
                    Choose a mindmap from the library or create a new one to get started
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Generation Modal */}
      <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Generate Mindmap with AI
            </DialogTitle>
            <DialogDescription>
              Describe your topic or paste content to create an AI-powered mindmap
            </DialogDescription>
          </DialogHeader>

          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-foreground">Creating Your Mindmap...</p>
                <p className="text-sm text-muted-foreground">
                  AI is analyzing your content and generating visual connections
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Input Source Selection */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">Content Source</label>
                <Tabs value={aiInputSource} onValueChange={(value: any) => setAiInputSource(value)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="text" className="flex items-center gap-2">
                      <Edit3 className="h-4 w-4" />
                      Text Input
                    </TabsTrigger>
                    <TabsTrigger value="document" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Document
                    </TabsTrigger>
                    <TabsTrigger value="clipboard" className="flex items-center gap-2">
                      <Clipboard className="h-4 w-4" />
                      Clipboard
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Content Input */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {aiInputSource === 'text' ? 'Describe your topic' : 
                   aiInputSource === 'document' ? 'Select document' : 'Paste content'}
                </label>
                {aiInputSource === 'text' ? (
                  <Textarea
                    placeholder="Describe your topic or paste content here..."
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    className="min-h-[120px]"
                  />
                ) : aiInputSource === 'document' ? (
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a document..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doc1">Project Plan Document</SelectItem>
                      <SelectItem value="doc2">Meeting Notes</SelectItem>
                      <SelectItem value="doc3">Research Summary</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full h-24 border-dashed"
                    onClick={() => {
                      navigator.clipboard.readText().then(text => {
                        setAiInput(text);
                      });
                    }}
                  >
                    <Clipboard className="h-6 w-6 mr-2" />
                    Click to paste from clipboard
                  </Button>
                )}
              </div>

              {/* Generation Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Mindmap Style</label>
                  <Select value={mindmapStyle} onValueChange={setMindmapStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="organic">Organic</SelectItem>
                      <SelectItem value="structured">Structured</SelectItem>
                      <SelectItem value="hierarchical">Hierarchical</SelectItem>
                      <SelectItem value="radial">Radial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Complexity Level: {complexity[0]}
                  </label>
                  <Slider
                    value={complexity}
                    onValueChange={setComplexity}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setShowAIModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAIGenerate}
                  disabled={!aiInput.trim()}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Mindmap
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create New Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Mindmap</DialogTitle>
            <DialogDescription>
              Start with a blank mindmap or choose from templates
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Button onClick={handleCreateNew} className="w-full justify-start h-16">
              <Plus className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Blank Mindmap</div>
                <div className="text-sm text-muted-foreground">Start from scratch</div>
              </div>
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-16 justify-start">
                <div className="text-left">
                  <div className="font-medium text-sm">Business Plan</div>
                  <div className="text-xs text-muted-foreground">Strategy template</div>
                </div>
              </Button>
              <Button variant="outline" className="h-16 justify-start">
                <div className="text-left">
                  <div className="font-medium text-sm">Project Structure</div>
                  <div className="text-xs text-muted-foreground">Planning template</div>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}