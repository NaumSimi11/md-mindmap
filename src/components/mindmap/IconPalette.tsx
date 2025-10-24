import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';

type PaletteItem = { title: string; icon: string; color?: string };

interface IconPaletteProps {
  onInsert: (title: string, iconId: string, color?: string) => void;
}

const DEFAULT_ITEMS: PaletteItem[] = [
  // DevOps
  { title: 'Docker', icon: 'simple-icons:docker', color: '#2496ed' },
  { title: 'Kubernetes', icon: 'simple-icons:kubernetes', color: '#326ce5' },
  { title: 'GitHub', icon: 'simple-icons:github' },
  { title: 'GitLab', icon: 'simple-icons:gitlab', color: '#fc6d26' },
  { title: 'Nginx', icon: 'simple-icons:nginx', color: '#009639' },
  { title: 'Redis', icon: 'simple-icons:redis', color: '#D82C20' },
  { title: 'Postgres', icon: 'simple-icons:postgresql', color: '#4169e1' },
  // Base
  { title: 'Server', icon: 'tabler:server' },
  { title: 'Database', icon: 'tabler:database' },
  { title: 'Shield', icon: 'tabler:shield' },
  { title: 'Globe', icon: 'tabler:world' },
  { title: 'Queue', icon: 'tabler:arrows-shuffle' },
  // AWS (via our aws nodes handled elsewhere, but show for visibility)
  { title: 'ALB', icon: 'tabler:arrows-exchange-2' },
  { title: 'EC2', icon: 'tabler:cpu' },
];

export default function IconPalette({ onInsert }: IconPaletteProps) {
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DEFAULT_ITEMS;
    return DEFAULT_ITEMS.filter((i) =>
      i.title.toLowerCase().includes(q) || i.icon.toLowerCase().includes(q)
    );
  }, [query]);

  const onDragStart = (e: React.DragEvent, item: PaletteItem) => {
    const payload = JSON.stringify({ type: 'iconify', title: item.title, icon: item.icon, color: item.color });
    e.dataTransfer.setData('text/iconify', payload);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-72 max-w-72 bg-card/95 border border-border rounded-lg p-3 shadow-lg">
      <div className="text-xs font-semibold mb-2">Icon Palette</div>
      <Input
        placeholder="Search icons…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-8 mb-3"
      />
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div
            key={item.title + item.icon}
            className="flex flex-col items-center gap-1 p-2 rounded hover:bg-muted cursor-grab"
            draggable
            onDragStart={(e) => onDragStart(e, item)}
          >
            <Icon icon={item.icon} width={24} height={24} color={item.color || 'currentColor'} />
            <div className="text-[10px] text-center leading-tight line-clamp-2">{item.title}</div>
            <Button size="xs" variant="outline" onClick={() => onInsert(item.title, item.icon, item.color)}>Add</Button>
          </div>
        ))}
      </div>
    </div>
  );
}


