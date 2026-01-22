import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Monitor, Smartphone, Laptop, CheckCircle } from 'lucide-react';

interface ReleaseAsset {
  name: string;
  download_url: string;
  size: number;
  browser_download_url: string;
}

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  assets: ReleaseAsset[];
}

export function DownloadPage() {
  const [release, setRelease] = useState<GitHubRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPlatform, setUserPlatform] = useState<string>('unknown');

  useEffect(() => {
    // Detect user's platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mac')) {
      setUserPlatform('macos');
    } else if (userAgent.includes('win')) {
      setUserPlatform('windows');
    } else if (userAgent.includes('linux')) {
      setUserPlatform('linux');
    }

    // Fetch latest release from GitHub
    fetchLatestRelease();
  }, []);

  const fetchLatestRelease = async () => {
    try {
      const response = await fetch('https://api.github.com/repos/yourusername/mdreader/releases/latest');
      if (!response.ok) {
        throw new Error('Failed to fetch release information');
      }
      const data = await response.json();
      setRelease(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendedDownload = () => {
    if (!release) return null;

    const platformMap = {
      macos: release.assets.find(asset => asset.name.includes('macOS') && asset.name.includes('ARM64')),
      windows: release.assets.find(asset => asset.name.includes('Windows')),
      linux: release.assets.find(asset => asset.name.includes('Linux')),
    };

    return platformMap[userPlatform as keyof typeof platformMap] || release.assets[0];
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'macos':
        return <Laptop className="w-5 h-5" />;
      case 'windows':
        return <Monitor className="w-5 h-5" />;
      case 'linux':
        return <Smartphone className="w-5 h-5" />;
      default:
        return <Download className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading latest release...</p>
        </div>
      </div>
    );
  }

  if (error || !release) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Downloads</CardTitle>
            <CardDescription>
              {error || 'Could not load release information. Please try again later.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchLatestRelease} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recommendedAsset = getRecommendedDownload();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Download MDReader</h1>
          <p className="text-xl text-muted-foreground mb-8">
            AI-Powered Markdown Editor with Real-time Collaboration
          </p>
          <Badge variant="secondary" className="text-sm">
            Latest Version: {release.tag_name}
          </Badge>
        </div>

        {/* Recommended Download */}
        {recommendedAsset && (
          <Card className="max-w-2xl mx-auto mb-8 border-primary/20">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                {getPlatformIcon(userPlatform)}
                <CardTitle>Recommended for Your System</CardTitle>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <CardDescription>
                Auto-detected {userPlatform.charAt(0).toUpperCase() + userPlatform.slice(1)} • {formatFileSize(recommendedAsset.size)}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button size="lg" asChild className="text-lg px-8 py-6">
                <a href={recommendedAsset.browser_download_url} download>
                  <Download className="w-6 h-6 mr-2" />
                  Download {recommendedAsset.name}
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* All Downloads */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>All Downloads</CardTitle>
            <CardDescription>
              Choose the version that matches your operating system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {release.assets.map((asset) => (
                <Card key={asset.name} className="text-center">
                  <CardContent className="pt-6">
                    <div className="flex justify-center mb-4">
                      {asset.name.includes('macOS') && <Laptop className="w-8 h-8 text-blue-500" />}
                      {asset.name.includes('Windows') && <Monitor className="w-8 h-8 text-blue-600" />}
                      {asset.name.includes('Linux') && <Smartphone className="w-8 h-8 text-orange-500" />}
                    </div>
                    <h3 className="font-semibold mb-2">{asset.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {formatFileSize(asset.size)}
                    </p>
                    <Button asChild variant="outline" className="w-full">
                      <a href={asset.browser_download_url} download>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Installation Instructions */}
        <Card className="max-w-4xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Installation Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">macOS</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Download the .dmg file</li>
                <li>Open the downloaded file</li>
                <li>Drag MDReader to your Applications folder</li>
                <li>Launch MDReader from Applications</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Windows</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Download the .msi file</li>
                <li>Run the installer</li>
                <li>Follow the installation wizard</li>
                <li>Launch MDReader from the Start menu</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Linux</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Download the .AppImage file</li>
                <li>Make it executable: <code className="bg-muted px-1 rounded">chmod +x MDReader*.AppImage</code></li>
                <li>Run the AppImage file</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}