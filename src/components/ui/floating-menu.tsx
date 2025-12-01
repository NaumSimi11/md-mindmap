import React, { useEffect, useRef } from 'react';

interface FloatingMenuProps {
    isOpen: boolean;
    position: { x: number; y: number };
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
    width?: string | number;
    showBackdrop?: boolean;
}

export const FloatingMenu: React.FC<FloatingMenuProps> = ({
    isOpen,
    position,
    onClose,
    children,
    className = '',
    width = 'w-56',
    showBackdrop = false,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        // Only add listeners if no backdrop (backdrop handles clicks)
        if (!showBackdrop) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        document.addEventListener('keydown', handleEscape);

        return () => {
            if (!showBackdrop) {
                document.removeEventListener('mousedown', handleClickOutside);
            }
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose, showBackdrop]);

    if (!isOpen) return null;

    return (
        <>
            {showBackdrop && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={onClose}
                />
            )}
            <div
                ref={menuRef}
                className={`fixed z-50 bg-popover border border-border rounded-lg shadow-lg p-1 ${typeof width === 'number' ? '' : width} ${className}`}
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    width: typeof width === 'number' ? `${width}px` : undefined,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </>
    );
};
