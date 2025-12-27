'use client';

import { useEffect, useRef, useState } from "react";

interface GridBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

const GridBackground = ({ children, className = "" }: GridBackgroundProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const cellSize = 80;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top + window.scrollY) / cellSize);
    setHoveredCell({ x, y });
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Grid lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border) / 0.35) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border) / 0.35) 1px, transparent 1px)
          `,
          backgroundSize: `${cellSize}px ${cellSize}px`,
        }}
      />

      {/* Hover highlight */}
      {hoveredCell && (
        <div
          className="absolute pointer-events-none transition-all duration-200 ease-out"
          style={{
            left: hoveredCell.x * cellSize,
            top: hoveredCell.y * cellSize,
            width: cellSize,
            height: cellSize,
            background: `linear-gradient(135deg, hsl(var(--primary) / 0.12) 0%, hsl(var(--flow-blue) / 0.08) 100%)`,
            boxShadow: `inset 0 0 20px hsl(var(--primary) / 0.1)`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default GridBackground;
