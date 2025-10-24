/**
 * IconPickerModal - Modal for selecting and adding icons to mindmap
 * Shows categorized icons with search functionality
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icon } from "@iconify/react";
import { Search, X } from "lucide-react";

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon: (title: string, icon: string, color?: string) => void;
}

// Organized icon library
const iconCategories = {
  devops: {
    label: "DevOps & Tools",
    icon: "🛠️",
    items: [
      { title: "Docker", icon: "simple-icons:docker", color: "#2496ed" },
      { title: "Kubernetes", icon: "simple-icons:kubernetes", color: "#326ce5" },
      { title: "Jenkins", icon: "simple-icons:jenkins", color: "#D24939" },
      { title: "GitHub", icon: "simple-icons:github" },
      { title: "GitLab", icon: "simple-icons:gitlab", color: "#fc6d26" },
      { title: "CircleCI", icon: "simple-icons:circleci", color: "#343434" },
      { title: "Travis CI", icon: "simple-icons:travisci", color: "#3EAAAF" },
      { title: "Terraform", icon: "simple-icons:terraform", color: "#7B42BC" },
      { title: "Ansible", icon: "simple-icons:ansible", color: "#EE0000" },
      { title: "Vagrant", icon: "simple-icons:vagrant", color: "#1563FF" },
    ],
  },
  cloud: {
    label: "Cloud & Infrastructure",
    icon: "☁️",
    items: [
      { title: "AWS", icon: "simple-icons:amazonaws", color: "#FF9900" },
      { title: "Azure", icon: "simple-icons:microsoftazure", color: "#0078D4" },
      { title: "Google Cloud", icon: "simple-icons:googlecloud", color: "#4285F4" },
      { title: "DigitalOcean", icon: "simple-icons:digitalocean", color: "#0080FF" },
      { title: "Heroku", icon: "simple-icons:heroku", color: "#430098" },
      { title: "Netlify", icon: "simple-icons:netlify", color: "#00C7B7" },
      { title: "Vercel", icon: "simple-icons:vercel" },
      { title: "Cloudflare", icon: "simple-icons:cloudflare", color: "#F38020" },
    ],
  },
  databases: {
    label: "Databases",
    icon: "🗄️",
    items: [
      { title: "PostgreSQL", icon: "simple-icons:postgresql", color: "#4169e1" },
      { title: "MySQL", icon: "simple-icons:mysql", color: "#4479A1" },
      { title: "MongoDB", icon: "simple-icons:mongodb", color: "#47A248" },
      { title: "Redis", icon: "simple-icons:redis", color: "#D82C20" },
      { title: "Elasticsearch", icon: "simple-icons:elasticsearch", color: "#005571" },
      { title: "SQLite", icon: "simple-icons:sqlite", color: "#003B57" },
      { title: "MariaDB", icon: "simple-icons:mariadb", color: "#003545" },
      { title: "Cassandra", icon: "simple-icons:apachecassandra", color: "#1287B1" },
    ],
  },
  frontend: {
    label: "Frontend",
    icon: "🎨",
    items: [
      { title: "React", icon: "simple-icons:react", color: "#61DAFB" },
      { title: "Vue", icon: "simple-icons:vuedotjs", color: "#4FC08D" },
      { title: "Angular", icon: "simple-icons:angular", color: "#DD0031" },
      { title: "Svelte", icon: "simple-icons:svelte", color: "#FF3E00" },
      { title: "Next.js", icon: "simple-icons:nextdotjs" },
      { title: "Nuxt", icon: "simple-icons:nuxtdotjs", color: "#00DC82" },
      { title: "Tailwind", icon: "simple-icons:tailwindcss", color: "#06B6D4" },
      { title: "Bootstrap", icon: "simple-icons:bootstrap", color: "#7952B3" },
    ],
  },
  backend: {
    label: "Backend",
    icon: "⚙️",
    items: [
      { title: "Node.js", icon: "simple-icons:nodedotjs", color: "#339933" },
      { title: "Python", icon: "simple-icons:python", color: "#3776AB" },
      { title: "Go", icon: "simple-icons:go", color: "#00ADD8" },
      { title: "Rust", icon: "simple-icons:rust", color: "#000000" },
      { title: "Java", icon: "simple-icons:openjdk", color: "#437291" },
      { title: "PHP", icon: "simple-icons:php", color: "#777BB4" },
      { title: "Ruby", icon: "simple-icons:ruby", color: "#CC342D" },
      { title: "Nginx", icon: "simple-icons:nginx", color: "#009639" },
    ],
  },
  general: {
    label: "General",
    icon: "📦",
    items: [
      { title: "Server", icon: "tabler:server" },
      { title: "Database", icon: "tabler:database" },
      { title: "Shield", icon: "tabler:shield" },
      { title: "Globe", icon: "tabler:world" },
      { title: "Queue", icon: "tabler:arrows-shuffle" },
      { title: "API", icon: "tabler:api" },
      { title: "Webhook", icon: "tabler:webhook" },
      { title: "Code", icon: "tabler:code" },
      { title: "Terminal", icon: "tabler:terminal" },
      { title: "Settings", icon: "tabler:settings" },
    ],
  },
};

export default function IconPickerModal({ isOpen, onClose, onSelectIcon }: IconPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("devops");

  const handleSelectIcon = (item: { title: string; icon: string; color?: string }) => {
    onSelectIcon(item.title, item.icon, item.color);
    onClose();
    setSearchQuery("");
  };

  // Filter icons based on search
  const getFilteredIcons = () => {
    if (!searchQuery) return iconCategories[selectedCategory as keyof typeof iconCategories].items;
    
    const query = searchQuery.toLowerCase();
    return iconCategories[selectedCategory as keyof typeof iconCategories].items.filter(
      item => item.title.toLowerCase().includes(query)
    );
  };

  const filteredIcons = getFilteredIcons();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            🎨 Icon Library
          </DialogTitle>
          <DialogDescription>
            Choose an icon to add to your mindmap. All icons are fully customizable.
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search icons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tabs for Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-6 w-full">
            {Object.entries(iconCategories).map(([key, category]) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                <span className="mr-1">{category.icon}</span>
                <span className="hidden sm:inline">{category.label.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(iconCategories).map(([key, category]) => (
            <TabsContent key={key} value={key} className="flex-1 overflow-y-auto mt-4">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                {filteredIcons.map((item) => (
                  <button
                    key={item.icon}
                    onClick={() => handleSelectIcon(item)}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 hover:scale-105 group"
                    title={item.title}
                  >
                    <Icon 
                      icon={item.icon} 
                      width={32} 
                      height={32} 
                      color={item.color || 'currentColor'}
                      className="group-hover:scale-110 transition-transform"
                    />
                    <span className="text-[10px] text-center text-muted-foreground group-hover:text-foreground line-clamp-2 leading-tight">
                      {item.title}
                    </span>
                  </button>
                ))}
              </div>

              {filteredIcons.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg mb-2">No icons found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            {filteredIcons.length} icons available
          </p>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

