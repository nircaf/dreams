import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';
import BrainParticles from './BrainParticles';
import SleepMask from './SleepMask';

const Scene: React.FC = () => {
  const scroll = useScroll();
  const groupRef = useRef<THREE.Group>(null);
  
  // Ref to store derived scroll values to pass to children
  const scrollState = useRef({
    maskOpacity: 0,
    waveIntensity: 0,
    rotationSpeed: 0.2
  });

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Scroll ranges (0 to 1)
    // 0.0 - 0.25: Intro
    // 0.25 - 0.50: Mask enters
    // 0.50 - 1.00: Waves active
    
    const r1 = scroll.range(0, 0.25);
    const r2 = scroll.range(0.25, 0.25); // Mask fade in duration
    const r3 = scroll.range(0.5, 0.5);   // Wave activation

    // Gently rotate the brain based on scroll + time
    groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.1 + (scroll.offset * Math.PI * 2);
    groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.1 + (scroll.offset * 0.2);

    // Update state refs for children to read (or pass via context if complex, but props works here if we manage it right, 
    // actually better to pass values via uniforms or refs to avoid full re-renders)
    
    // We will update the uniforms of the children directly in their own useFrames, 
    // but we can compute the global "story" state here.
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.2} color="#001133" />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00ffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff00ff" />
      
      {/* The Brain */}
      <BrainParticles />
      
      {/* The Mask */}
      <SleepMask />
      
      {/* Background aesthetics */}
      <Stars count={500} />
    </group>
  );
};

// Simple background stars to add depth
const Stars: React.FC<{ count: number }> = ({ count }) => {
  const points = React.useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 30;
      p[i * 3 + 1] = (Math.random() - 0.5) * 30;
      p[i * 3 + 2] = (Math.random() - 0.5) * 30 - 10; // Push back
    }
    return p;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#445566"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
};

export default Scene;