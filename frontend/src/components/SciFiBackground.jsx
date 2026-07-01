import React from 'react';
import { motion } from 'framer-motion';

export default function SciFiBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#04070D]">
      {/* Animated Glowing Orbs */}
      <motion.div
        animate={{ 
          x: [0, 80, -40, 0], 
          y: [0, -60, 40, 0], 
          scale: [1, 1.2, 0.8, 1],
          opacity: [0.15, 0.3, 0.15] 
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#00F5FF] rounded-full blur-[150px]"
      />
      <motion.div
        animate={{ 
          x: [0, -70, 50, 0], 
          y: [0, 80, -30, 0], 
          scale: [0.8, 1.1, 0.9, 0.8],
          opacity: [0.1, 0.2, 0.1] 
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 -left-20 w-[500px] h-[500px] bg-[#7B61FF] rounded-full blur-[120px]"
      />
      <motion.div
        animate={{ 
          x: [0, 40, -40, 0], 
          y: [0, 30, -50, 0], 
          opacity: [0.05, 0.15, 0.05] 
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] left-[40%] w-[400px] h-[400px] bg-[#FF4DFF] rounded-full blur-[100px]"
      />

      {/* Sci-Fi Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #00F5FF 1px, transparent 1px),
            linear-gradient(to bottom, #00F5FF 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
    </div>
  );
}
