import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

/**
 * Q-LIA2 - ECOSISTEMA QUÍMICO (BRILLO CALIBRADO)
 */

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);
camera.position.z = 15;

// --- BOTÓN FS ---
const btn = document.createElement('button');
btn.innerText = "❒";
btn.style.cssText = "position:fixed; top:15px; right:15px; z-index:100; padding:10px; background:rgba(0,255,255,0.1); color:cyan; border:1px solid cyan; border-radius:50%; width:45px; height:45px; font-size:10px;";
document.body.appendChild(btn);
btn.onclick = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); };

// --- BLOOM ---
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 2.2, 0.5, 0.05);
composer.addPass(bloomPass);

let viewWidth, viewHeight;
const updateLimits = () => {
    const dist = camera.position.z;
    const vFov = (camera.fov * Math.PI) / 180;
    viewHeight = 2 * Math.tan(vFov / 2) * dist;
    viewWidth = viewHeight * camera.aspect;
};
updateLimits();

// --- MATERIALES ---
const matCian = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x00ffff, emissiveIntensity: 0.5 });
const matMagma = new THREE.MeshStandardMaterial({ color: 0x110500, emissive: 0xff6600, emissiveIntensity: 0.7 });
// Ajuste de Cromo: Emissive base más tranquilo
const matCromo = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: 0.2 });

const countPerType = 25;
const geometry = new THREE.IcosahedronGeometry(0.35, 3);

const meshCian = new THREE.InstancedMesh(geometry, matCian, countPerType);
const meshMagma = new THREE.InstancedMesh(geometry, matMagma, countPerType);
const meshCromo = new THREE.InstancedMesh(geometry, matCromo, countPerType);
scene.add(meshCian, meshMagma, meshCromo);

const dummy = new THREE.Object3D();
const particles = [];

const createType = (type, count) => {
    for(let i=0; i<count; i++) {
        particles.push({
            type: type,
            pos: new THREE.Vector3((Math.random()-0.5)*viewWidth, (Math.random()-0.5)*viewHeight, 0),
            vel: new THREE.Vector3(),
            scale: 0.6 + Math.random(),
            id: i
        });
    }
};

createType('cian', countPerType);
createType('magma', countPerType);
createType('cromo', countPerType);

// --- INTERACCIÓN ---
let gravity = new THREE.Vector3(0, -0.05, 0);
let isTouching = false;
window.addEventListener('deviceorientation', (e) => { 
    gravity.set((e.gamma || 0)*0.005, -(e.beta || 0)*0.005, 0); 
});
window.addEventListener('touchstart', () => isTouching = true);
window.addEventListener('touchend', () => isTouching = false);

function animate() {
    requestAnimationFrame(animate);

    particles.forEach((p, i) => {
        // 1. REPULSIÓN
        for (let j = i + 1; j < particles.length; j++) {
            let p2 = particles[j];
            let diff = p.pos.clone().sub(p2.pos);
            let dist = diff.lengthSq();
            if (dist < 1.5) {
                let force = diff.normalize().multiplyScalar(0.008 / (dist + 0.1));
                p.vel.add(force);
                p2.vel.sub(force);
            }
        }

        // 2. FÍSICAS POR TIPO
        if (p.type === 'cian') {
            p.vel.add(gravity);
            if (isTouching) p.vel.add(new THREE.Vector3().sub(p.pos).multiplyScalar(0.04));
            p.vel.multiplyScalar(0.94);
        } 
        else if (p.type === 'magma') {
            p.vel.add(gravity.clone().multiplyScalar(0.3));
            if (isTouching) p.vel.add(new THREE.Vector3().sub(p.pos).multiplyScalar(0.01));
            p.vel.multiplyScalar(0.88); 
        } 
        else if (p.type === 'cromo') {
            p.vel.add(gravity.clone().multiplyScalar(1.3));
            if (isTouching) p.vel.add(new THREE.Vector3().sub(p.pos).multiplyScalar(0.06));
            p.vel.multiplyScalar(0.96);
            
            // --- CALIBRACIÓN DE BRILLO CROMO ---
            let speed = p.vel.length();
            let hue = (0.6 + speed * 0.3) % 1.0;
            // Min: 0.8, Max: ~5.0 (antes llegaba a 15-20)
            matCromo.emissiveIntensity = Math.min(0.2 + speed * 8, 1.0);
            matCromo.emissive.setHSL(hue, 0.8, 0.5);
        }

        p.pos.add(p.vel);

        // 3. LÍMITES
        const lx = viewWidth / 2, ly = viewHeight / 2;
        if (Math.abs(p.pos.x) > lx) { p.pos.x = Math.sign(p.pos.x)*lx; p.vel.x *= -0.7; }
        if (Math.abs(p.pos.y) > ly) { p.pos.y = Math.sign(p.pos.y)*ly; p.vel.y *= -0.7; }

        // 4. DIBUJAR
        dummy.position.copy(p.pos);
        dummy.scale.setScalar(p.scale);
        dummy.updateMatrix();
        
        const m = p.type === 'cian' ? meshCian : (p.type === 'magma' ? meshMagma : meshCromo);
        m.setMatrixAt(p.id, dummy.matrix);
    });

    meshCian.instanceMatrix.needsUpdate = true;
    meshMagma.instanceMatrix.needsUpdate = true;
    meshCromo.instanceMatrix.needsUpdate = true;
    composer.render();
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    updateLimits();
});
