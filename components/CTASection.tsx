'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

const RealisticCloud1 = () => (
  <svg viewBox="0 0 320 140" width="320" height="140" className="filter drop-shadow-lg">
    <defs>
      <filter id="cloudBlur1">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
      </filter>
      <radialGradient id="cloudFill1" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
        <stop offset="60%" style={{ stopColor: '#ffffff', stopOpacity: 0.8 }} />
        <stop offset="100%" style={{ stopColor: '#d0e8ff', stopOpacity: 0.3 }} />
      </radialGradient>
    </defs>
    
    {/* Natural cloud shape with rounded edges */}
    <path d="M 20 90 Q 15 75 30 65 Q 45 50 65 52 Q 80 40 95 48 Q 105 35 120 48 Q 140 35 155 50 Q 170 42 185 55 Q 200 45 220 60 Q 235 50 250 65 Q 265 55 280 70 Q 300 60 310 80 Q 305 100 290 105 Q 270 115 250 110 Q 230 120 210 115 Q 190 125 170 118 Q 150 128 130 120 Q 110 125 90 120 Q 70 128 50 115 Q 35 120 20 110 Z" 
          fill="url(#cloudFill1)" filter="url(#cloudBlur1)" opacity="0.95" />
  </svg>
);

const RealisticCloud2 = () => (
  <svg viewBox="0 0 360 160" width="360" height="160" className="filter drop-shadow-lg">
    <defs>
      <filter id="cloudBlur2">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
      </filter>
      <radialGradient id="cloudFill2" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
        <stop offset="60%" style={{ stopColor: '#ffffff', stopOpacity: 0.75 }} />
        <stop offset="100%" style={{ stopColor: '#b0d8ff', stopOpacity: 0.35 }} />
      </radialGradient>
    </defs>
    
    {/* Large fluffy cloud with natural shape */}
    <path d="M 15 100 Q 10 80 25 70 Q 40 55 60 58 Q 75 45 95 55 Q 110 42 130 55 Q 150 40 170 58 Q 190 45 215 62 Q 235 48 260 68 Q 280 55 305 75 Q 325 62 350 85 Q 345 115 325 120 Q 305 135 280 128 Q 260 140 240 132 Q 220 145 200 135 Q 180 148 160 140 Q 140 150 120 142 Q 100 152 80 140 Q 60 150 40 135 Q 25 140 15 125 Z" 
          fill="url(#cloudFill2)" filter="url(#cloudBlur2)" opacity="0.95" />
  </svg>
);

const RealisticCloud3 = () => (
  <svg viewBox="0 0 310 140" width="310" height="140" className="filter drop-shadow-lg">
    <defs>
      <filter id="cloudBlur3">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
      </filter>
      <radialGradient id="cloudFill3" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
        <stop offset="60%" style={{ stopColor: '#ffffff', stopOpacity: 0.78 }} />
        <stop offset="100%" style={{ stopColor: '#a0d8ff', stopOpacity: 0.32 }} />
      </radialGradient>
    </defs>
    
    {/* Organic cloud shape */}
    <path d="M 25 90 Q 20 75 35 65 Q 50 55 70 58 Q 85 48 105 58 Q 120 48 140 62 Q 160 52 180 68 Q 200 58 225 75 Q 240 65 270 80 Q 290 70 305 90 Q 300 110 280 115 Q 260 122 240 110 Q 220 120 200 115 Q 180 125 160 118 Q 140 128 120 120 Q 100 128 80 120 Q 60 128 40 115 Q 25 120 25 105 Z" 
          fill="url(#cloudFill3)" filter="url(#cloudBlur3)" opacity="0.95" />
  </svg>
);

export default function CTASection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Real sky background with clouds */}
      <div className="relative w-full rounded-3xl overflow-hidden p-12 md:p-16 border border-sky-200 shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, #e0f6ff 0%, #87ceeb 50%, #a8d8ff 100%)'
        }}>
        
        {/* Animated Realistic Clouds */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Cloud 1 - Top right */}
          <div className="cloud-animation-1 absolute top-8 right-0">
            <RealisticCloud1 />
          </div>

          {/* Cloud 2 - Upper middle */}
          <div className="cloud-animation-2 absolute top-24 right-20">
            <RealisticCloud2 />
          </div>

          {/* Cloud 3 - Lower right */}
          <div className="cloud-animation-3 absolute bottom-12 right-10">
            <RealisticCloud3 />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-3 drop-shadow-md">
            Still have questions?
          </h2>
          
          <p className="text-lg md:text-xl text-white font-medium mb-8 leading-relaxed drop-shadow-md">
            Can't find what you're looking for? We're here to help.
          </p>

          <a
            href="mailto:brancrave@gmail.com"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl font-semibold shadow-lg hover:shadow-2xl hover:from-blue-600 hover:to-cyan-500 hover:scale-110 active:scale-95 transition-all duration-300"
          >
            Contact our support team
            <ArrowRight size={20} />
          </a>
        </div>
      </div>
    </section>
  );
}
