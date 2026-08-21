// Interactive 3D WebGL Canvas for Franky's Merino Wool Cap
// Built with Three.js: Procedural 3D beanie mesh with knit texture, ribbed cuff, and 360-degree rotation.

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export function Cap3DViewer({
  colorHex = "#faa21f",
  className = "",
}: {
  colorHex?: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 1.2, 3.8);

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    // Group for Cap Mesh
    const capGroup = new THREE.Group();
    scene.add(capGroup);

    // Lighting (Warm Arcade Setup)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    dirLight.position.set(3, 4, 3);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xfaa21f, 1.2);
    rimLight.position.set(-3, 2, -3);
    scene.add(rimLight);

    // Materials
    const capColor = new THREE.Color(colorHex);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: capColor,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true, // Retro low-poly arcade look
    });

    const cuffMat = new THREE.MeshStandardMaterial({
      color: capColor.clone().multiplyScalar(0.9),
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true,
    });

    // 1. Cap Crown (Dome)
    const domeGeo = new THREE.SphereGeometry(1.0, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const domeMesh = new THREE.Mesh(domeGeo, bodyMat);
    domeMesh.position.y = 0.2;
    capGroup.add(domeMesh);

    // 2. Folded Cuff (Torus / Cylinder)
    const cuffGeo = new THREE.CylinderGeometry(1.02, 1.04, 0.45, 24, 2);
    const cuffMesh = new THREE.Mesh(cuffGeo, cuffMat);
    cuffMesh.position.y = 0.05;
    capGroup.add(cuffMesh);

    // 3. Top Wool Seam Button (Pompom / Arcade Stitch)
    const buttonGeo = new THREE.SphereGeometry(0.12, 12, 10);
    const buttonMesh = new THREE.Mesh(buttonGeo, cuffMat);
    buttonMesh.position.y = 1.18;
    capGroup.add(buttonMesh);

    // Center & slight tilt
    capGroup.position.y = -0.3;
    capGroup.rotation.x = 0.25;

    // Orbit / Drag Controls
    let targetRotationY = 0;
    let targetRotationX = 0.25;
    let isPointerDown = false;
    let prevPointerX = 0;
    let prevPointerY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      setIsDragging(true);
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      const deltaX = e.clientX - prevPointerX;
      const deltaY = e.clientY - prevPointerY;
      targetRotationY += deltaX * 0.008;
      targetRotationX = Math.max(-0.2, Math.min(0.6, targetRotationX + deltaY * 0.008));
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
    };

    const onPointerUp = () => {
      isPointerDown = false;
      setIsDragging(false);
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // Animation Loop
    let reqId: number | undefined;
    let isVisible = true;
    const animate = () => {
      if (!isVisible) {
        reqId = undefined;
        return;
      }

      // Auto rotation when idle
      if (!isPointerDown) {
        targetRotationY += 0.006;
      }

      // Smooth damping
      capGroup.rotation.y += (targetRotationY - capGroup.rotation.y) * 0.08;
      capGroup.rotation.x += (targetRotationX - capGroup.rotation.x) * 0.08;

      renderer.render(scene, camera);
      reqId = requestAnimationFrame(animate);
    };

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = Boolean(entry?.isIntersecting);
        if (isVisible && reqId === undefined) {
          animate();
        }
      },
      { threshold: 0.01 },
    );
    visibilityObserver.observe(container);
    animate();

    // Resize handler
    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      if (reqId !== undefined) cancelAnimationFrame(reqId);
      visibilityObserver.disconnect();
      window.removeEventListener("resize", onResize);
      domEl.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      domeGeo.dispose();
      cuffGeo.dispose();
      buttonGeo.dispose();
      bodyMat.dispose();
      cuffMat.dispose();
      renderer.dispose();
      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }
    };
  }, [colorHex]);

  return (
    <div
      className={`relative w-full h-[220px] select-none flex items-center justify-center ${className}`}
    >
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        aria-label="3D Interactive Merino Cap Viewer - Drag to rotate"
      />
      <span
        className="absolute bottom-2 text-muted pointer-events-none arcade-bevel px-2 py-0.5 bg-cream/80 border border-pixel rounded-btn text-[9px]"
        style={{ fontFamily: "var(--font-arcade)" }}
      >
        {isDragging ? "ROTATING 360°" : "← DRAG 3D MODEL →"}
      </span>
    </div>
  );
}
