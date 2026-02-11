// Product Example WebGL Scene
// Three.js implementation for scroll-based brain and mask animation

(function() {
    'use strict';

    let scene, camera, renderer;
    let brain, mask;
    let waveEffects = [];
    let animationId = null;
    let isVisible = false;
    let scrollProgress = 0;
    let lastTime = 0;

    // Initialize the WebGL scene
    function init() {
        const container = document.getElementById('webgl-container');
        if (!container) return;

        // Scene setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x040912);

        // Camera setup
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        camera.position.set(0, 0, 8);

        // Renderer setup
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight1 = new THREE.DirectionalLight(0x8758ff, 0.9);
        directionalLight1.position.set(5, 5, 5);
        scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0x003b8b, 0.7);
        directionalLight2.position.set(-5, -5, -5);
        scene.add(directionalLight2);

        const pointLight = new THREE.PointLight(0x8758ff, 1.2, 100);
        pointLight.position.set(0, 0, 10);
        scene.add(pointLight);

        // Add rim light for better definition
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
        rimLight.position.set(0, 0, -5);
        scene.add(rimLight);

        // Create brain model
        createBrain();

        // Create sleep mask
        createMask();

        // Setup scroll listener
        setupScrollListener();

        // Setup intersection observer for performance
        setupIntersectionObserver();

        // Handle resize
        window.addEventListener('resize', onWindowResize);

        // Initial render
        animate();
    }

    // Generate high-poly brain model
    function createBrain() {
        // Create a high-segment sphere as base
        const segments = 64;
        const geometry = new THREE.SphereGeometry(2, segments, segments);

        // Apply noise/displacement to create brain-like folds
        const positions = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        const noise = new THREE.Vector3();

        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);
            
            // Normalize to get direction from center
            const length = vertex.length();
            const normalized = vertex.clone().normalize();
            
            // Create brain-like folds using multiple noise functions
            const noise1 = Math.sin(vertex.x * 3) * Math.cos(vertex.y * 4) * Math.sin(vertex.z * 2.5);
            const noise2 = Math.sin(vertex.x * 5) * Math.cos(vertex.y * 3) * Math.sin(vertex.z * 4);
            const noise3 = Math.sin(vertex.x * 2) * Math.cos(vertex.y * 5) * Math.sin(vertex.z * 3);
            
            const displacement = (noise1 * 0.15 + noise2 * 0.1 + noise3 * 0.08) * 0.3;
            
            // Apply displacement along normal
            vertex.add(normalized.multiplyScalar(displacement));
            
            positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }

        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();

        // Create brain material with realistic colors
        const brainMaterial = new THREE.MeshPhongMaterial({
            color: 0xd4a5a5,
            shininess: 30,
            specular: 0x333333,
            emissive: 0x1a0a0a,
            flatShading: false,
            transparent: true,
            opacity: 0
        });

        brain = new THREE.Mesh(geometry, brainMaterial);
        brain.rotation.x = -0.3;
        brain.rotation.y = 0.5;
        brain.position.set(0, 0, 0);
        brain.scale.set(0, 0, 0); // Start invisible
        scene.add(brain);
    }

    // Create sleep mask 3D model
    function createMask() {
        // Create a curved surface for the mask
        const maskGeometry = new THREE.PlaneGeometry(2.5, 1.2, 32, 16);
        
        // Curve the plane to fit over the brain
        const positions = maskGeometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            
            // Create a curved surface
            const curve = Math.pow(x / 1.25, 2) * 0.3;
            positions.setZ(i, z + curve);
        }

        maskGeometry.computeVertexNormals();

        // Create mask material
        const maskMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a1a2e,
            shininess: 50,
            specular: 0x333333,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });

        mask = new THREE.Mesh(maskGeometry, maskMaterial);
        mask.position.set(0, 0.3, 1.8);
        mask.rotation.x = -0.2;
        mask.scale.set(0, 0, 0); // Start invisible
        scene.add(mask);

        // Add straps (optional visual detail)
        const strapGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 16);
        const strapMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a2e });
        
        const leftStrap = new THREE.Mesh(strapGeometry, strapMaterial);
        leftStrap.position.set(-1.2, 0, 1.5);
        leftStrap.rotation.z = 0.3;
        leftStrap.scale.set(0, 0, 0);
        mask.add(leftStrap);

        const rightStrap = new THREE.Mesh(strapGeometry, strapMaterial);
        rightStrap.position.set(1.2, 0, 1.5);
        rightStrap.rotation.z = -0.3;
        rightStrap.scale.set(0, 0, 0);
        mask.add(rightStrap);
    }

    // Create wave effects with shader-based animation
    function createWaveEffect(origin) {
        // Create multiple rings for a more complex wave effect
        const rings = [];
        const ringCount = 3;
        
        for (let i = 0; i < ringCount; i++) {
            const waveGeometry = new THREE.RingGeometry(0.1, 0.4, 64);
            
            // Create custom shader material for animated waves
            const waveMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    color: { value: new THREE.Color(0x8758ff) },
                    opacity: { value: 0.9 }
                },
                vertexShader: `
                    varying vec3 vPosition;
                    varying vec3 vNormal;
                    void main() {
                        vPosition = position;
                        vNormal = normal;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 color;
                    uniform float opacity;
                    varying vec3 vPosition;
                    varying vec3 vNormal;
                    
                    void main() {
                        float dist = length(vPosition);
                        float wave = sin(dist * 10.0 - time * 5.0) * 0.5 + 0.5;
                        float fade = 1.0 - smoothstep(0.0, 2.0, dist);
                        float alpha = wave * fade * opacity;
                        vec3 glowColor = color + vec3(0.3, 0.2, 0.4);
                        gl_FragColor = vec4(glowColor, alpha);
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });

            const wave = new THREE.Mesh(waveGeometry, waveMaterial);
            wave.position.copy(origin);
            wave.position.y += i * 0.1;
            wave.lookAt(camera.position);
            wave.userData = {
                age: 0,
                maxAge: 2.5,
                speed: 1.5,
                maxRadius: 4,
                ringIndex: i,
                startTime: Date.now() * 0.001
            };
            
            scene.add(wave);
            rings.push(wave);
        }
        
        waveEffects.push(...rings);
    }

    // Update wave effects
    function updateWaves(deltaTime) {
        const currentTime = Date.now() * 0.001;
        
        for (let i = waveEffects.length - 1; i >= 0; i--) {
            const wave = waveEffects[i];
            const data = wave.userData;
            
            data.age += deltaTime * data.speed;
            
            if (data.age >= data.maxAge) {
                scene.remove(wave);
                wave.geometry.dispose();
                if (wave.material.dispose) wave.material.dispose();
                waveEffects.splice(i, 1);
                continue;
            }

            const progress = data.age / data.maxAge;
            const scale = 1 + (data.maxRadius - 1) * progress;
            wave.scale.set(scale, scale, 1);
            
            // Update shader uniforms if it's a shader material
            if (wave.material.uniforms) {
                wave.material.uniforms.time.value = currentTime - data.startTime;
                wave.material.uniforms.opacity.value = 0.9 * (1 - progress);
            } else {
                wave.material.opacity = 0.8 * (1 - progress);
            }
            
            // Move wave slightly forward to simulate penetration
            wave.position.z += deltaTime * 0.5;
        }
    }

    // Setup scroll listener
    function setupScrollListener() {
        let ticking = false;

        function updateScrollProgress() {
            const section = document.getElementById('product-example');
            if (!section) return;

            const rect = section.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            // Calculate scroll progress within the section
            if (rect.top < windowHeight && rect.bottom > 0) {
                const sectionHeight = section.offsetHeight;
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const sectionTop = section.offsetTop;
                const scrollPosition = scrollTop + windowHeight - sectionTop;
                
                scrollProgress = Math.max(0, Math.min(1, scrollPosition / (sectionHeight + windowHeight)));
            } else {
                scrollProgress = 0;
            }

            updateAnimation();
            ticking = false;
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateScrollProgress);
                ticking = true;
            }
        });

        // Initial update
        updateScrollProgress();
    }

    // Update animation based on scroll progress
    function updateAnimation() {
        if (!brain || !mask) return;

        // Stage 1: Brain Reveal (0-0.33)
        if (scrollProgress <= 0.33) {
            const stage1Progress = scrollProgress / 0.33;
            const easeProgress = easeInOutCubic(stage1Progress);
            
            // Fade in and scale brain
            brain.scale.setScalar(easeProgress);
            brain.material.opacity = easeProgress;
            brain.rotation.y = 0.5 + Math.sin(easeProgress * Math.PI) * 0.3;
            
            // Camera animation
            camera.position.set(
                0 + Math.sin(easeProgress * Math.PI) * 1,
                0 + Math.cos(easeProgress * Math.PI) * 0.5,
                8 - easeProgress * 1
            );
            camera.lookAt(0, 0, 0);
            
            // Hide mask
            mask.scale.set(0, 0, 0);
        }
        // Stage 2: Mask Animation (0.33-0.66)
        else if (scrollProgress <= 0.66) {
            const stage2Progress = (scrollProgress - 0.33) / 0.33;
            const easeProgress = easeInOutCubic(stage2Progress);
            
            // Brain stays visible
            brain.scale.setScalar(1);
            brain.material.opacity = 1;
            
            // Animate mask onto brain
            mask.scale.setScalar(easeProgress);
            mask.position.y = 0.3 + (1 - easeProgress) * 0.5;
            mask.rotation.x = -0.2 + (1 - easeProgress) * 0.3;
            
            // Animate mask children (straps)
            mask.children.forEach(child => {
                child.scale.setScalar(easeProgress);
            });
            
            // Camera slight adjustment
            camera.position.set(
                0,
                0.2 * easeProgress,
                7
            );
            camera.lookAt(0, 0.1, 0);
        }
        // Stage 3: Wave Propagation (0.66-1.0)
        else {
            const stage3Progress = (scrollProgress - 0.66) / 0.34;
            
            // Brain and mask stay visible
            brain.scale.setScalar(1);
            brain.material.opacity = 1;
            mask.scale.setScalar(1);
            mask.position.y = 0.3;
            mask.rotation.x = -0.2;
            mask.children.forEach(child => {
                child.scale.setScalar(1);
            });
            
            // Create waves periodically
            if (stage3Progress > 0) {
                const waveInterval = 0.2;
                const waveCount = Math.floor(stage3Progress / waveInterval);
                const currentWaveCount = Math.floor(waveEffects.length / 3); // Each wave creates 3 rings
                
                if (waveCount > currentWaveCount && waveEffects.length < 15) {
                    const waveOrigin = new THREE.Vector3(0, 0.3, 1.5);
                    createWaveEffect(waveOrigin);
                }
            }
            
            // Camera final position
            camera.position.set(0, 0.2, 7);
            camera.lookAt(0, 0.1, 0);
        }
    }

    // Easing function
    function easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Setup intersection observer for performance
    function setupIntersectionObserver() {
        const section = document.getElementById('product-example');
        if (!section) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isVisible = entry.isIntersecting;
                if (isVisible && !animationId) {
                    lastTime = 0; // Reset time for delta calculation
                    animate();
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '100px'
        });

        observer.observe(section);
        
        // Initial check
        const rect = section.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        if (rect.top < windowHeight && rect.bottom > 0) {
            isVisible = true;
        }
    }

    // Animation loop
    function animate(currentTime) {
        if (!isVisible && scrollProgress === 0) {
            animationId = null;
            return;
        }

        animationId = requestAnimationFrame(animate);

        // Calculate deltaTime
        const deltaTime = lastTime ? (currentTime - lastTime) / 1000 : 0.016;
        lastTime = currentTime || Date.now();

        // Update waves
        updateWaves(deltaTime);

        // Rotate brain slowly
        if (brain && scrollProgress > 0) {
            brain.rotation.y += 0.002;
        }

        // Render
        renderer.render(scene, camera);
    }

    // Handle window resize
    function onWindowResize() {
        const container = document.getElementById('webgl-container');
        if (!container || !camera || !renderer) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

