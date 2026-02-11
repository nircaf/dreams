import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls, Scroll } from '@react-three/drei';
import Scene from './components/Scene';
import UI from './components/UI';

const App: React.FC = () => {
  return (
    <div className="w-full h-screen relative bg-gradient-to-b from-[#02020a] to-[#0a0a1a]">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <ScrollControls pages={4} damping={0.2}>
            <Scene />
            <Scroll html>
              <UI />
            </Scroll>
          </ScrollControls>
        </Suspense>
      </Canvas>
      
      {/* Fixed UI Overlay elements that shouldn't scroll */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center pointer-events-none z-50 mix-blend-screen">
        <div className="text-cyan-400 opacity-80 text-xs tracking-[0.2em] font-bold">
          NEURO//SYNC_V.2.4
        </div>
        <div className="text-cyan-400 opacity-80 text-xs tracking-[0.2em] font-bold">
          SYSTEM: ONLINE
        </div>
      </div>
      
      <div className="absolute bottom-6 left-6 text-[10px] text-cyan-900 tracking-widest pointer-events-none">
        RENDER_MODE: PARTICULATE_SCAN
      </div>
    </div>
  );
};

export default App;