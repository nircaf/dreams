import * as THREE from 'three';

export interface BrainUniforms {
  uTime: { value: number };
  uScroll: { value: number };
  uColor: { value: THREE.Color };
  uWaveColor: { value: THREE.Color };
}

export interface MaskUniforms {
  uTime: { value: number };
  uOpacity: { value: number };
  uColor: { value: THREE.Color };
}