import React, { useState } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Table as TableIcon } from 'lucide-react';

interface TableInsertPopoverProps {
    onInsert: (rows: number, cols: number) => void;
    children: React.ReactNode;
}

export const TableInsertPopover: React.FC<TableInsertPopoverProps> = ({
    onInsert,
    children,
}) => {
    const [hoveredRows, setHoveredRows] = useState(0);
    const [hoveredCols, setHoveredCols] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const MAX_ROWS = 10;
    const MAX_COLS = 10;

    const handleCellHover = (row: number, col: number) => {
        setHoveredRows(row);
        setHoveredCols(col);
    };

    const handleCellClick = () => {
        if (hoveredRows > 0 && hoveredCols > 0) {
            onInsert(hoveredRows, hoveredCols);
            setIsOpen(false);
            setHoveredRows(0);
            setHoveredCols(0);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent
                side="left"
                align="start"
                className="w-auto p-3 bg-card/98 backdrop-blur-xl border border-border/50 shadow-xl rounded-xl"
            >
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground/70">Insert Table</span>
                        <span className="text-xs text-muted-foreground font-mono">
                            {hoveredRows > 0 ? `${hoveredRows} × ${hoveredCols}` : 'Select size'}
                        </span>
                    </div>

                    {/* Grid Picker */}
                    <div
                        className="grid gap-1 p-1 bg-muted/30 rounded-lg border border-border/30"
                        style={{
                            gridTemplateColumns: `repeat(${MAX_COLS}, 1fr)`,
                        }}
                        onMouseLeave={() => {
                            setHoveredRows(0);
                            setHoveredCols(0);
                        }}
                    >
                        {Array.from({ length: MAX_ROWS }).map((_, rowIndex) => (
                            Array.from({ length: MAX_COLS }).map((_, colIndex) => {
                                const row = rowIndex + 1;
                                const col = colIndex + 1;
                                const isActive = row <= hoveredRows && col <= hoveredCols;

                                return (
                                    <button
                                        key={`${row}-${col}`}
                                        className={`
                      w-4 h-4 rounded-sm border transition-all duration-75
                      ${isActive
                                                ? 'bg-primary border-primary shadow-sm scale-110'
                                                : 'bg-background border-border/50 hover:border-border'
                                            }
                    `}
                                        onMouseEnter={() => handleCellHover(row, col)}
                                        onClick={handleCellClick}
                                        aria-label={`${row} rows by ${col} columns`}
                                    />
                                );
                            })
                        ))}
                    </div>

                    <div className="text-[10px] text-muted-foreground text-center mt-1">
                        Click to insert table
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
