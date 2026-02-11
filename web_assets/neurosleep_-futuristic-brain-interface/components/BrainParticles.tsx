import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';

// Vertex Shader: Standard point positioning + size attenuation
const vertexShader = `
  varying vec3 vPosition;
  varying float vRandom;
  attribute float aRandom;
  uniform float uTime;

  void main() {
    vPosition = position;
    vRandom = aRandom;
    
    // Subtle breathing animation with some metallic noise movement
    vec3 pos = position;
    float breathe = sin(uTime * 1.5 + position.x) * 0.015;
    pos += normal * breathe;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = (3.5 + aRandom * 2.0) * (10.0 / -mvPosition.z);
  }
`;

// Fragment Shader: High tech neon metallic look
const fragmentShader = `
  varying vec3 vPosition;
  varying float vRandom;
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uWaveColor;
  uniform float uWaveProgress; 
  uniform vec3 uSourcePos; 
  
  void main() {
    // Make points circular
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    
    // Sharp edge for a digital/tech dot look
    float alpha = 1.0 - smoothstep(0.3, 0.5, r);
    
    // Base glow - Neon Metallic Blue
    // Mix slightly different hues based on position for "metallic" iridescence
    vec3 baseColor = uColor;
    baseColor += vec3(0.1, 0.2, 0.3) * sin(vPosition.y * 10.0 + uTime); // Iridescent shimmer
    
    vec3 finalColor = baseColor;
    
    // Wave Logic
    float dist = distance(vPosition, uSourcePos);
    float waveSpeed = 6.0;
    float waveFrequency = 5.0;
    
    if (uWaveProgress > 0.0) {
      float wave = sin(dist * waveFrequency - uTime * waveSpeed);
      wave = pow(max(0.0, wave), 8.0); 
      finalColor = mix(finalColor, uWaveColor, wave * uWaveProgress);
      // Bright flash on wave
      alpha += wave * 0.8 * uWaveProgress;
    }

    // High Tech flicker occasionally based on random attribute
    float flicker = step(0.98, sin(uTime * 10.0 + vRandom * 100.0));
    finalColor += vec3(flicker * 0.5);

    // Semi-transparent but high intensity (Neon)
    gl_FragColor = vec4(finalColor, alpha * 0.7); 
  }
`;

const BrainParticles: React.FC = () => {
  const scroll = useScroll();
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Generate brain-shaped points
  const { positions, normals, randoms } = useMemo(() => {
    const count = 7000; // Increased count for density
    const pos = new Float32Array(count * 3);
    const norm = new Float32Array(count * 3);
    const rand = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const hemisphere = Math.random() > 0.5 ? 1 : -1;
      let u = Math.random();
      let v = Math.random();
      const r_base = 1.1 + Math.random() * 0.2; 
      
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      
      let x = r_base * Math.sin(phi) * Math.cos(theta);
      let y = r_base * Math.sin(phi) * Math.sin(theta) * 0.8; 
      let z = r_base * Math.cos(phi) * 1.2; 
      
      x = Math.abs(x) * hemisphere + (hemisphere * 0.15); 
      
      if (y < -0.5) { x *= 0.9; z *= 0.9; }

      // Less noise, more structure for high-tech look
      x += (Math.random() - 0.5) * 0.02;
      y += (Math.random() - 0.5) * 0.02;
      z += (Math.random() - 0.5) * 0.02;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      
      const nx = x - (hemisphere * 0.15);
      const ny = y;
      const nz = z;
      const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
      norm[i * 3] = nx / len;
      norm[i * 3 + 1] = ny / len;
      norm[i * 3 + 2] = nz / len;

      rand[i] = Math.random();
    }
    
    return { positions: pos, normals: norm, randoms: rand };
  }, []);

  const buttonPos = useMemo(() => {
    const r = 1.9;
    const angle = 0.8;
    return new THREE.Vector3(Math.sin(angle) * r, 0.1, Math.cos(angle) * r);
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      // Lighter, neon blue
      uColor: { value: new THREE.Color('#80ebff') },
      uWaveColor: { value: new THREE.Color('#ffffff') },
      uWaveProgress: { value: 0 },
      uSourcePos: { value: buttonPos },
    }),
    [buttonPos]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      const waveActivation = scroll.range(0.5, 0.5); 
      materialRef.current.uniforms.uWaveProgress.value = waveActivation;
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-normal"
          count={normals.length / 3}
          array={normals}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default BrainParticles;