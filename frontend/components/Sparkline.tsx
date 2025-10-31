'use client';

import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
}

// Very light-weight SVG sparkline for tiny inline charts
export default function Sparkline({
  data,
  width = 260,
  height = 36,
  stroke = '#00D07E',
  fill = 'rgba(0,208,126,0.1)',
  strokeWidth = 2,
}: SparklineProps) {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  // Build area path for fill
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <path d={areaD} fill={fill} stroke="none" />
      <path d={pathD} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


