import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';

const SleepMask: React.FC = () => {
  const scroll = useScroll();
  const groupRef = useRef<THREE.Group>(null);
  const bandMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const buttonRingRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Animation Logic
    // Start putting mask on immediately as user starts scrolling (0 to 0.25)
    const entryProgress = scroll.range(0, 0.25);
    const waveProgress = scroll.range(0.5, 0.5);
    
    // Position interpolation
    const startY = 6;
    const endY = 0.1; 
    
    const currentY = THREE.MathUtils.lerp(startY, endY, THREE.MathUtils.smoothstep(entryProgress, 0, 1));
    groupRef.current.position.y = currentY;
    
    // Gentle floating rotation
    if (entryProgress >= 0.99) {
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    } else {
        groupRef.current.rotation.y = 0;
    }

    // Button Pulse Sync - Visual feedback that the button is the source
    if (buttonRingRef.current) {
         const pulse = Math.sin(state.clock.elapsedTime * 10.0) * 0.5 + 0.5;
         const brightness = 1.0 + (waveProgress * pulse * 3.0); // High brightness when active
         buttonRingRef.current.color.setRGB(0 * brightness, 0.66 * brightness, 1 * brightness);
    }
  });

  const radius = 1.9; 

  return (
    <group ref={groupRef} position={[0, 6, 0]}>
        {/* Main Band */}
        <mesh>
            <cylinderGeometry args={[radius, radius, 1.1, 64, 1, true]} />
            <meshStandardMaterial 
                ref={bandMaterialRef}
                color="#080808" 
                roughness={0.9} 
                metalness={0.1}
                side={THREE.DoubleSide}
                transparent={true}
                opacity={0.5}
            />
        </mesh>
        
        {/* Inner padding visualization */}
        <mesh>
             <cylinderGeometry args={[radius - 0.02, radius - 0.02, 1.05, 64, 1, true]} />
             <meshStandardMaterial 
                color="#050505" 
                roughness={1} 
                side={THREE.BackSide} 
                transparent={true}
                opacity={0.5}
             />
        </mesh>

        {/* Single Button - The Source */}
        <group position={[Math.sin(0.8) * radius, 0, Math.cos(0.8) * radius]} rotation={[0, 0.8, 0]}>
            {/* Button Base - Rotated to face Z (Outward) */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                 <cylinderGeometry args={[0.18, 0.18, 0.04, 32]} />
                 <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.5} />
            </mesh>
            
            {/* Glowing Power Ring - Stacked on Z axis */}
             <mesh position={[0, 0, 0.021]}>
                 <ringGeometry args={[0.06, 0.09, 32]} />
                 <meshBasicMaterial ref={buttonRingRef} color="#00aaff" toneMapped={false} />
            </mesh>
            
            {/* Center Blackout for Ring - Stacked on Z axis */}
            <mesh position={[0, 0, 0.02]}>
                 <circleGeometry args={[0.05, 32]} />
                 <meshBasicMaterial color="#111" />
            </mesh>

            {/* Power Symbol Line - Stacked on Z axis */}
            <mesh position={[0, 0, 0.022]}>
                 <planeGeometry args={[0.025, 0.08]} />
                 <meshBasicMaterial color="#00aaff" toneMapped={false} />
            </mesh>
        </group>
        
        <pointLight position={[2, 2, 2]} intensity={0.5} distance={3} color="#444" />
    </group>
  );
};

export default SleepMask;