/**
 * StreamingText - Typewriter effect for AI responses
 * Displays text character by character like ChatGPT
 */

import { useEffect, useState } from 'react';

interface StreamingTextProps {
  text: string;
  speed?: number; // Characters per interval (default: 2)
  onComplete?: () => void;
}

export default function StreamingText({ text, speed = 2, onComplete }: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex >= text.length) {
      // Streaming complete
      if (onComplete) {
        onComplete();
      }
      return;
    }

    // Stream characters
    const timer = setTimeout(() => {
      const nextIndex = Math.min(currentIndex + speed, text.length);
      setDisplayedText(text.substring(0, nextIndex));
      setCurrentIndex(nextIndex);
    }, 20); // 20ms interval for smooth streaming

    return () => clearTimeout(timer);
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span>
      {displayedText}
      {currentIndex < text.length && (
        <span className="inline-block w-1 h-4 bg-purple-500 ml-0.5 animate-pulse">|</span>
      )}
    </span>
  );
}

