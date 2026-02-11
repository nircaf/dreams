import React from 'react';

const UI: React.FC = () => {
  return (
    <div className="w-full">
      {/* Section 1: Introduction */}
      <section className="h-screen w-full p-8 md:p-20 flex flex-col justify-center items-start max-w-2xl">
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-600 mb-6 drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">
          DREAMZ SLEEP MASK
        </h1>
        <p className="text-cyan-100/70 text-lg md:text-xl leading-relaxed backdrop-blur-sm bg-black/20 p-4 border-l-2 border-cyan-500/50">
          Closed-loop brainwave monitoring and adaptive neuromodulation for deeper, more restorative sleep.
        </p>
        <div className="mt-12 animate-bounce text-cyan-400 text-sm tracking-widest opacity-60">
          SCROLL TO INITIALIZE ↓
        </div>
      </section>

      {/* Section 2: Spacer for Visual Transition */}
      <section className="h-screen w-full p-8 md:p-20 flex items-center justify-end">
         <div className="text-right">
            <h2 className="text-3xl font-bold text-cyan-500/80 mb-2">ANALYZING BRAIN WAVES</h2>
            <div className="h-1 w-64 bg-cyan-900/30 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-cyan-400/50 blur-[2px] animate-pulse"></div>
            </div>
         </div>
      </section>

      {/* Section 3: Sleep Mask Activation */}
      <section className="h-screen w-full p-8 md:p-20 flex items-center justify-start">
        <div className="max-w-md">
            <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              SLEEP BETTER
            </h2>
            <p className="text-blue-200/60 text-lg">
              Shown to improve sleep quality by up to 68 percent while shortening sleep onset time by 39 percent.
            </p>
        </div>
      </section>

      {/* Section 4: Waves / Neuromodulation with Sine Spinner */}
      <section className="h-screen w-full flex flex-col items-center justify-center pointer-events-none">
        <div className="relative flex flex-col items-center justify-center scale-125">
            {/* Outer Rotating Ring */}
            <div className="w-32 h-32 rounded-full border-2 border-cyan-900/30 border-t-cyan-400 border-r-cyan-400 animate-[spin_3s_linear_infinite] shadow-[0_0_30px_rgba(0,255,255,0.2)]"></div>
            
            {/* Inner Static Container */}
            <div className="absolute w-24 h-24 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center overflow-hidden border border-cyan-500/20">
                {/* Animated Sine Wave SVG */}
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                     <defs>
                       <linearGradient id="wave-gradient" x1="0" y1="0" x2="1" y2="0">
                         <stop offset="0%" stopColor="rgba(6,182,212,0)" />
                         <stop offset="30%" stopColor="rgba(6,182,212,1)" />
                         <stop offset="50%" stopColor="rgba(255,255,255,1)" />
                         <stop offset="70%" stopColor="rgba(6,182,212,1)" />
                         <stop offset="100%" stopColor="rgba(6,182,212,0)" />
                       </linearGradient>
                     </defs>
                     {/* Path draws two full cycles (0-100, 100-200) to allow seamless looping */}
                     <path 
                       d="M0 50 Q 25 20, 50 50 T 100 50 T 150 50 T 200 50" 
                       fill="none" 
                       stroke="url(#wave-gradient)" 
                       strokeWidth="3"
                       className="animate-sine-scroll"
                       strokeLinecap="round"
                     />
                </svg>
            </div>

            {/* Text Label */}
            <div className="mt-8 text-center">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 tracking-[0.2em] drop-shadow-[0_0_15px_rgba(0,255,255,0.6)]">
                    NEUROMODULATION
                </h2>
                <div className="text-cyan-400 text-xs tracking-[0.8em] font-semibold mt-2 animate-pulse uppercase">
                    Active
                </div>
            </div>
        </div>
        
        {/* Inject CSS for custom wave animation */}
        <style>{`
          .animate-sine-scroll {
            animation: sineScroll 2s linear infinite;
          }
          @keyframes sineScroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100px); } /* Move one wavelength left */
          }
        `}</style>
      </section>
    </div>
  );
};

export default UI;