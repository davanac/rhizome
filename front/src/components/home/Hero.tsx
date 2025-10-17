import React from 'react';
import { NetworkBackground } from './NetworkBackground';

export const Hero = () => {
  return (
    <section className="relative h-[300px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <NetworkBackground />
      </div>
      <div className="relative z-10 container mx-auto px-4 text-center">
        <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto animate-fadeIn">
          Certification décentralisée pour les projets culturels et créatifs
        </p>
      </div>
    </section>
  );
};