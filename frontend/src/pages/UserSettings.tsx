/**
 * User Settings Page
 * ==================
 * 
 * Comprehensive settings page for user preferences:
 * - Profile settings (name, email, password)
 * - UI preferences (toolbar style, theme, etc.)
 * - AI/API settings (API keys, provider selection)
 * - Account management
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  User,
  Settings,
  Palette,
  Key,
  Shield,
  ArrowLeft,
  Sparkles,
  Check,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Crown,
  Zap,
  Bot,
  Lock,
  Monitor,
  Moon,
  Sun,
  Wand2,
  Brain,
  CreditCard,
} from 'lucide-react';
import { 
  useUserPreferencesStore,
  type ThemeMode,
  type FontSize,
  type ToolbarStyle,
  type AIProvider,
} from '@/stores/userPreferencesStore';

export function UserSettings() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // Use the global preferences store
  const preferences = useUserPreferencesStore();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load profile data on mount
  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  // Save preferences - the store auto-persists, so we just show a toast
  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      // The Zustand store with persist middleware already saves to localStorage
      // and applies changes immediately, so we just show confirmation
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Validate password change
      if (profileForm.newPassword) {
        if (profileForm.newPassword !== profileForm.confirmPassword) {
          toast.error('Passwords do not match');
          setSaving(false);
          return;
        }
        if (profileForm.newPassword.length < 8) {
          toast.error('Password must be at least 8 characters');
          setSaving(false);
          return;
        }
      }
      
      // TODO: Call backend API to update profile
      // await authService.updateProfile(profileForm);
      
      toast.success('Profile updated successfully');
      setProfileForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Toggle API key visibility
  const toggleApiKeyVisibility = (provider: string) => {
    setShowApiKey(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  // Model options by provider
  const getModelOptions = (provider: string) => {
    switch (provider) {
      case 'openai':
        return ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];
      case 'anthropic':
        return ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'];
      case 'google':
        return ['gemini-pro', 'gemini-pro-vision'];
      case 'mdreader':
        return ['mdreader-default'];
      default:
        return [];
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>Please sign in to access your settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/workspace')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Workspace
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">Settings</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manage your account and preferences</p>
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleSavePreferences}
            disabled={saving}
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <TabsList className="flex flex-col h-auto w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-2 gap-1 shadow-lg">
              <TabsTrigger
                value="profile"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/10 data-[state=active]:to-purple-500/10 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
              >
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="ui"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/10 data-[state=active]:to-purple-500/10 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
              >
                <Palette className="h-4 w-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger
                value="api"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/10 data-[state=active]:to-purple-500/10 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
              >
                <Key className="h-4 w-4" />
                AI & API
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/10 data-[state=active]:to-purple-500/10 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
              >
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
            </TabsList>
            
            {/* Subscription Card */}
            <Card className="mt-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-200/50 dark:border-purple-800/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <CardTitle className="text-sm">Free Plan</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Upgrade to Pro for unlimited AI features and API access.
                </p>
                <Button size="sm" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 gap-2">
                  <Zap className="h-4 w-4" />
                  Upgrade to Pro
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Tab Content */}
          <div className="flex-1">
            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and email
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Display Name</Label>
                      <Input
                        id="name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Change Password
                    </h3>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={profileForm.currentPassword}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={profileForm.newPassword}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="••••••••"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm Password</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            value={profileForm.confirmPassword}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                      <Save className="h-4 w-4" />
                      Update Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="ui" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Editor Preferences
                  </CardTitle>
                  <CardDescription>
                    Customize how the editor looks and behaves
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Toolbar Style */}
                  <div className="space-y-3">
                    <Label>Toolbar Style</Label>
                    <RadioGroup
                      value={preferences.toolbarStyle}
                      onValueChange={(value: ToolbarStyle) => 
                        preferences.setToolbarStyle(value)
                      }
                      className="grid grid-cols-2 gap-4"
                    >
                      <Label
                        htmlFor="toolbar-fixed"
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          preferences.toolbarStyle === 'fixed'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <RadioGroupItem value="fixed" id="toolbar-fixed" className="sr-only" />
                        <div className="w-full h-12 bg-slate-200 dark:bg-slate-700 rounded-lg flex flex-col">
                          <div className="h-3 bg-slate-400 dark:bg-slate-500 rounded-t-lg" />
                          <div className="flex-1" />
                        </div>
                        <span className="text-sm font-medium">Fixed Top</span>
                      </Label>
                      <Label
                        htmlFor="toolbar-floating"
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          preferences.toolbarStyle === 'floating'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <RadioGroupItem value="floating" id="toolbar-floating" className="sr-only" />
                        <div className="w-full h-12 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                          <div className="w-20 h-3 bg-slate-400 dark:bg-slate-500 rounded-full" />
                        </div>
                        <span className="text-sm font-medium">Floating</span>
                      </Label>
                    </RadioGroup>
                  </div>

                  <Separator />

                  {/* Theme */}
                  <div className="space-y-3">
                    <Label>Theme</Label>
                    <RadioGroup
                      value={preferences.theme}
                      onValueChange={(value: ThemeMode) => 
                        preferences.setTheme(value)
                      }
                      className="flex gap-4"
                    >
                      <Label
                        htmlFor="theme-light"
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          preferences.theme === 'light'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <RadioGroupItem value="light" id="theme-light" className="sr-only" />
                        <Sun className="h-4 w-4" />
                        <span className="text-sm font-medium">Light</span>
                      </Label>
                      <Label
                        htmlFor="theme-dark"
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          preferences.theme === 'dark'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
                        <Moon className="h-4 w-4" />
                        <span className="text-sm font-medium">Dark</span>
                      </Label>
                      <Label
                        htmlFor="theme-system"
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          preferences.theme === 'system'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <RadioGroupItem value="system" id="theme-system" className="sr-only" />
                        <Monitor className="h-4 w-4" />
                        <span className="text-sm font-medium">System</span>
                      </Label>
                    </RadioGroup>
                  </div>

                  <Separator />

                  {/* Font Size */}
                  <div className="space-y-2">
                    <Label>Editor Font Size</Label>
                    <Select
                      value={preferences.fontSize}
                      onValueChange={(value: FontSize) => 
                        preferences.setFontSize(value)
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small (14px)</SelectItem>
                        <SelectItem value="medium">Medium (16px)</SelectItem>
                        <SelectItem value="large">Large (18px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Toggles */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-save</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Automatically save your work
                        </p>
                      </div>
                      <Switch
                        checked={preferences.autoSave}
                        onCheckedChange={(checked) => 
                          preferences.setAutoSave(checked)
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Spell Check</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Highlight spelling errors
                        </p>
                      </div>
                      <Switch
                        checked={preferences.spellCheck}
                        onCheckedChange={(checked) => 
                          preferences.setSpellCheck(checked)
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Line Numbers</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Display line numbers in markdown mode
                        </p>
                      </div>
                      <Switch
                        checked={preferences.showLineNumbers}
                        onCheckedChange={(checked) => 
                          preferences.setShowLineNumbers(checked)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Toolbar Visibility Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Toolbar Visibility
                  </CardTitle>
                  <CardDescription>
                    Choose which toolbars to show in the editor
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Action Bar</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Top bar with Format, Diagram, AI Assistant, Share, History
                      </p>
                    </div>
                    <Switch
                      checked={preferences.showActionBar}
                      onCheckedChange={(checked) => 
                        preferences.setShowActionBar(checked)
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Formatting Toolbar</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Shortcuts bar with Bold, Italic, Headings, Lists, etc.
                      </p>
                    </div>
                    <Switch
                      checked={preferences.showFormattingToolbar}
                      onCheckedChange={(checked) => 
                        preferences.setShowFormattingToolbar(checked)
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Side Toolbar</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Floating right bar with quick action icons
                      </p>
                    </div>
                    <Switch
                      checked={preferences.showSideToolbar}
                      onCheckedChange={(checked) => 
                        preferences.setShowSideToolbar(checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI & API Tab */}
            <TabsContent value="api" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    AI Provider
                  </CardTitle>
                  <CardDescription>
                    Choose your AI provider and configure API keys
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Provider Selection */}
                  <div className="space-y-4">
                    <Label>Select AI Provider</Label>
                    <RadioGroup
                      value={preferences.aiProvider}
                      onValueChange={(value: AIProvider) => 
                        preferences.setAIProvider(value)
                      }
                      className="grid grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                      {/* MDReader (Our API) */}
                      <Label
                        htmlFor="provider-mdreader"
                        className={`relative flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          preferences.aiProvider === 'mdreader'
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <RadioGroupItem value="mdreader" id="provider-mdreader" className="sr-only" />
                        <Badge className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500">
                          Recommended
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-purple-600" />
                          <span className="font-semibold">MDReader AI</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Use our built-in AI (subscription required)
                        </p>
                      </Label>

                      {/* OpenAI */}
                      <Label
                        htmlFor="provider-openai"
                        className={`flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          preferences.aiProvider === 'openai'
                            ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <RadioGroupItem value="openai" id="provider-openai" className="sr-only" />
                        <div className="flex items-center gap-2">
                          <Brain className="h-5 w-5 text-green-600" />
                          <span className="font-semibold">OpenAI</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          GPT-4, GPT-3.5 Turbo
                        </p>
                      </Label>

                      {/* Anthropic */}
                      <Label
                        htmlFor="provider-anthropic"
                        className={`flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          preferences.aiProvider === 'anthropic'
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <RadioGroupItem value="anthropic" id="provider-anthropic" className="sr-only" />
                        <div className="flex items-center gap-2">
                          <Wand2 className="h-5 w-5 text-orange-600" />
                          <span className="font-semibold">Anthropic</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Claude 3 Opus, Sonnet, Haiku
                        </p>
                      </Label>

                      {/* Google */}
                      <Label
                        htmlFor="provider-google"
                        className={`flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          preferences.aiProvider === 'google'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <RadioGroupItem value="google" id="provider-google" className="sr-only" />
                        <div className="flex items-center gap-2">
                          <Bot className="h-5 w-5 text-blue-600" />
                          <span className="font-semibold">Google AI</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Gemini Pro
                        </p>
                      </Label>

                      {/* None */}
                      <Label
                        htmlFor="provider-none"
                        className={`flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          preferences.aiProvider === 'none'
                            ? 'border-slate-500 bg-slate-50 dark:bg-slate-950/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <RadioGroupItem value="none" id="provider-none" className="sr-only" />
                        <div className="flex items-center gap-2">
                          <Settings className="h-5 w-5 text-slate-600" />
                          <span className="font-semibold">None</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Disable AI features
                        </p>
                      </Label>
                    </RadioGroup>
                  </div>

                  {/* API Key Input based on provider */}
                  {preferences.aiProvider !== 'none' && preferences.aiProvider !== 'mdreader' && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="api-key">
                            {preferences.aiProvider === 'openai' && 'OpenAI API Key'}
                            {preferences.aiProvider === 'anthropic' && 'Anthropic API Key'}
                            {preferences.aiProvider === 'google' && 'Google AI API Key'}
                          </Label>
                          <div className="flex gap-2 mt-2">
                            <div className="relative flex-1">
                              <Input
                                id="api-key"
                                type={showApiKey[preferences.aiProvider] ? 'text' : 'password'}
                                value={
                                  preferences.aiProvider === 'openai' ? preferences.openaiApiKey :
                                  preferences.aiProvider === 'anthropic' ? preferences.anthropicApiKey :
                                  preferences.googleApiKey
                                }
                                onChange={(e) => {
                                  const key = e.target.value;
                                  if (preferences.aiProvider === 'openai') {
                                    preferences.setAPIKey('openai', key);
                                  } else if (preferences.aiProvider === 'anthropic') {
                                    preferences.setAPIKey('anthropic', key);
                                  } else if (preferences.aiProvider === 'google') {
                                    preferences.setAPIKey('google', key);
                                  }
                                }}
                                placeholder={`sk-...`}
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                onClick={() => toggleApiKeyVisibility(preferences.aiProvider)}
                              >
                                {showApiKey[preferences.aiProvider] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Your API key is stored locally and never sent to our servers.
                          </p>
                        </div>

                        {/* Model Selection */}
                        <div className="space-y-2">
                          <Label>Default Model</Label>
                          <Select
                            value={preferences.defaultModel}
                            onValueChange={(value) => 
                              preferences.setDefaultModel(value)
                            }
                          >
                            <SelectTrigger className="w-64">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getModelOptions(preferences.aiProvider).map(model => (
                                <SelectItem key={model} value={model}>
                                  {model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* MDReader Subscription */}
                  {preferences.aiProvider === 'mdreader' && (
                    <>
                      <Separator />
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                            <Crown className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 dark:text-white">MDReader AI Subscription</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              Get unlimited access to our AI features with a Pro subscription. No API keys needed!
                            </p>
                            <Button className="mt-4 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                              <CreditCard className="h-4 w-4" />
                              Subscribe to Pro
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* AI Features Toggles */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">AI Features</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-complete</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          AI-powered text completion as you type
                        </p>
                      </div>
                      <Switch
                        checked={preferences.autoComplete}
                        onCheckedChange={(checked) => 
                          preferences.setAutoComplete(checked)
                        }
                        disabled={preferences.aiProvider === 'none'}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>AI Hints</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Show AI suggestions and improvements
                        </p>
                      </div>
                      <Switch
                        checked={preferences.aiHints}
                        onCheckedChange={(checked) => 
                          preferences.setAIHints(checked)
                        }
                        disabled={preferences.aiProvider === 'none'}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your account security and sessions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Two-Factor Authentication */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline" className="gap-2">
                      <Shield className="h-4 w-4" />
                      Enable 2FA
                    </Button>
                  </div>

                  <Separator />

                  {/* Active Sessions */}
                  <div>
                    <h4 className="font-semibold mb-4">Active Sessions</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <Monitor className="h-5 w-5 text-slate-500" />
                          <div>
                            <p className="font-medium text-sm">Current Session</p>
                            <p className="text-xs text-slate-500">Chrome on macOS • Active now</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Current
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Danger Zone */}
                  <div className="p-4 rounded-xl border-2 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
                    <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">Danger Zone</h4>
                    <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">
                      These actions are irreversible. Please proceed with caution.
                    </p>
                    <div className="flex gap-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50 gap-2">
                            <Trash2 className="h-4 w-4" />
                            Delete Account
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete your account and all associated data. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                              Delete Account
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}

export default UserSettings;

