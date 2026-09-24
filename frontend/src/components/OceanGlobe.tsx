import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Compass, Navigation, Radio, MapPin, Layers, Waves, Radar, ArrowRight, ShieldAlert } from 'lucide-react';
import { SpillTooltipCard } from './SpillTooltipCard';

export interface IncidentLocation {
  id: string;
  name: string;
  badge: string;
  lat: number;
  lon: number;
  date: string;
  spillId: string;
}

interface OceanGlobeProps {
  onSelectIncident: (lat: number, lon: number, incident?: IncidentLocation) => void;
  onInspectIncident?: (lat: number, lon: number, incident?: IncidentLocation) => void;
  targetLat?: number;
  targetLon?: number;
  useLiveSat?: boolean;
  onToggleLiveSat?: (val: boolean) => void;
  onOpenSimulation?: () => void;
  onOpenCharacterization?: (incident?: IncidentLocation) => void;
  onOpenInvestigation?: (incident?: IncidentLocation) => void;
  selectedIncident?: IncidentLocation;
  incidents?: IncidentLocation[];
}

const DEFAULT_INCIDENTS: IncidentLocation[] = [
  {
    id: 'emerald',
    name: 'MT Emerald Mystery Spill (Levantine Basin, Mediterranean)',
    badge: '🇵🇦 MT EMERALD (33.15°N, 34.20°E)',
    lat: 33.15,
    lon: 34.20,
    date: '2021-02-05',
    spillId: 'emerald',
  },
  {
    id: 'wakashio',
    name: 'MV Wakashio Grounding & Bunker Spill (Pointe d\'Esny, Mauritius)',
    badge: '🇵🇦 MV WAKASHIO (20.44°S, 57.74°E)',
    lat: -20.437,
    lon: 57.742,
    date: '2020-08-06',
    spillId: 'wakashio',
  },
];

export const OceanGlobe: React.FC<OceanGlobeProps> = ({
  onSelectIncident,
  onInspectIncident,
  targetLat,
  targetLon,
  useLiveSat = false,
  onToggleLiveSat,
  onOpenSimulation,
  onOpenCharacterization,
  onOpenInvestigation,
  selectedIncident,
  incidents = DEFAULT_INCIDENTS,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIncident, setHoveredIncident] = useState<IncidentLocation | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [activeIncidentId, setActiveIncidentId] = useState<string>(selectedIncident?.id || 'emerald');

  // Keep activeIncident in sync with prop if passed
  useEffect(() => {
    if (selectedIncident && selectedIncident.id !== activeIncidentId) {
      setActiveIncidentId(selectedIncident.id);
    }
  }, [selectedIncident]);

  const currentIncident = incidents.find(i => i.id === activeIncidentId) || incidents[0];

  // Target globe rotation for each incident
  const incidentRotations = useRef<{ [key: string]: { x: number; y: number } }>({
    emerald: { x: 0.55, y: -2.17 },   // Levantine Basin, Mediterranean (~33°N, 34°E)
    wakashio: { x: -0.36, y: -2.60 }, // Mauritius, South Indian Ocean (~20°S, 57°E)
  });

  const targetRotRef = useRef<{ x: number; y: number }>(
    incidentRotations.current[activeIncidentId] || incidentRotations.current.emerald
  );

  useEffect(() => {
    if (incidentRotations.current[activeIncidentId]) {
      targetRotRef.current = incidentRotations.current[activeIncidentId];
    }
  }, [activeIncidentId]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, WebGL Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 2.80;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const globeRadius = 1.0;
    const globeGeo = new THREE.SphereGeometry(globeRadius, 64, 64);

    // High-Resolution Earth Texture Loader
    const textureLoader = new THREE.TextureLoader();
    const earthTextureUrl = 'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg';
    const earthBumpUrl = 'https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png';

    const earthTexture = textureLoader.load(earthTextureUrl, () => renderer.render(scene, camera));
    const earthBump = textureLoader.load(earthBumpUrl);

    const globeMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      bumpMap: earthBump,
      bumpScale: 0.04,
      roughness: 0.45,
      metalness: 0.1,
    });

    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // 3. Atmospheric Cyan Rim Glow
    const atmosGeo = new THREE.SphereGeometry(globeRadius * 1.12, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.60 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.0, 0.9, 1.0, 1.0) * intensity * 0.8;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    scene.add(atmosMesh);

    // 4. Background Starfield
    const starCount = 800;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 25;
      starPos[i + 1] = (Math.random() - 0.5) * 25;
      starPos[i + 2] = -Math.random() * 10 - 2;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.035, transparent: true, opacity: 0.7 });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 5. Geographic Coordinates to 3D Sphere Vector
    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    // Arcs for Shipping Corridors
    const createArc = (startLat: number, startLon: number, endLat: number, endLon: number, colorHex: number) => {
      const start = latLonToVector3(startLat, startLon, globeRadius * 1.002);
      const end = latLonToVector3(endLat, endLon, globeRadius * 1.002);

      const midLat = (startLat + endLat) / 2;
      const midLon = (startLon + endLon) / 2;
      const distance = start.distanceTo(end);
      const altitude = distance * 0.22;
      const mid = latLonToVector3(midLat, midLon, globeRadius * (1.002 + altitude));

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.65,
      });
      return new THREE.Line(geometry, material);
    };

    // --- CORRIDORS 1: Mediterranean (Emerald) ---
    const laneEm1 = createArc(31.25, 32.30, 33.15, 34.20, 0x00f2fe); // Suez to Levantine
    globeGroup.add(laneEm1);
    const laneEm2 = createArc(33.15, 34.20, 35.18, 35.94, 0x22c55e); // Levantine to Baniyas Syria
    globeGroup.add(laneEm2);
    const laneEm3 = createArc(33.15, 34.20, 37.94, 23.63, 0xf97316); // Levantine to Piraeus Greece
    globeGroup.add(laneEm3);

    // --- CORRIDORS 2: Indian Ocean (Wakashio) ---
    const laneWk1 = createArc(1.35, 103.82, -20.437, 57.742, 0x00f2fe); // Malacca/Singapore to Mauritius
    globeGroup.add(laneWk1);
    const laneWk2 = createArc(-20.437, 57.742, -34.35, 18.47, 0x22c55e); // Mauritius to Cape of Good Hope
    globeGroup.add(laneWk2);
    const laneWk3 = createArc(-20.437, 57.742, -25.96, 32.58, 0xf97316); // Mauritius to Mozambique Channel
    globeGroup.add(laneWk3);

    // --- CORRIDORS 3: Persian Gulf & Strait of Hormuz Tanker Chokepoint ---
    const laneHz1 = createArc(29.50, 49.50, 26.56, 56.25, 0x00f2fe); // Northern Persian Gulf to Strait of Hormuz
    globeGroup.add(laneHz1);
    const laneHz2 = createArc(26.56, 56.25, 23.61, 58.54, 0x38bdf8); // Strait of Hormuz to Gulf of Oman
    globeGroup.add(laneHz2);
    const laneHz3 = createArc(23.61, 58.54, 18.90, 72.80, 0x4edea3); // Gulf of Oman to Arabian Sea / India Corridor
    globeGroup.add(laneHz3);

    // =========================================================================
    // 6. TWO RED DOT BEACONS (EMERALD & WAKASHIO)
    // =========================================================================

    // --- RED DOT 1: MT EMERALD (Mediterranean: 33.15°N, 34.20°E) ---
    const emPos = latLonToVector3(33.15, 34.20, globeRadius * 1.015);
    const emCoreGeo = new THREE.SphereGeometry(0.026, 16, 16);
    const emCoreMat = new THREE.MeshBasicMaterial({ color: 0xff1111 });
    const emCore = new THREE.Mesh(emCoreGeo, emCoreMat);
    emCore.position.copy(emPos);
    (emCore as any).incidentId = 'emerald';
    globeGroup.add(emCore);

    const emRingGeo = new THREE.RingGeometry(0.03, 0.085, 32);
    const emRingMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const emRingMesh = new THREE.Mesh(emRingGeo, emRingMat);
    emRingMesh.position.copy(emPos);
    emRingMesh.lookAt(emPos.clone().multiplyScalar(2));
    (emRingMesh as any).incidentId = 'emerald';
    globeGroup.add(emRingMesh);

    // --- RED DOT 2: MV WAKASHIO (Mauritius: -20.437°S, 57.742°E) ---
    const wkPos = latLonToVector3(-20.437, 57.742, globeRadius * 1.015);
    const wkCoreGeo = new THREE.SphereGeometry(0.026, 16, 16);
    const wkCoreMat = new THREE.MeshBasicMaterial({ color: 0xff1111 });
    const wkCore = new THREE.Mesh(wkCoreGeo, wkCoreMat);
    wkCore.position.copy(wkPos);
    (wkCore as any).incidentId = 'wakashio';
    globeGroup.add(wkCore);

    const wkRingGeo = new THREE.RingGeometry(0.03, 0.085, 32);
    const wkRingMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const wkRingMesh = new THREE.Mesh(wkRingGeo, wkRingMat);
    wkRingMesh.position.copy(wkPos);
    wkRingMesh.lookAt(wkPos.clone().multiplyScalar(2));
    (wkRingMesh as any).incidentId = 'wakashio';
    globeGroup.add(wkRingMesh);

    // Interactive target meshes for raycasting
    const interactiveMeshes = [emCore, emRingMesh, wkCore, wkRingMesh];

    // 7. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const cyanRim = new THREE.DirectionalLight(0x00f2fe, 0.75);
    cyanRim.position.set(-5, -2, -3);
    scene.add(cyanRim);

    // Set initial rotation
    const initRot = targetRotRef.current;
    globeGroup.rotation.x = initRot.x;
    globeGroup.rotation.y = initRot.y;

    // =========================================================================
    // 8. ORBITING SATELLITES — 4 Realistic Satellite Models
    // =========================================================================
    const satelliteConfigs = [
      { orbitRadius: 1.36, speed: 0.42, inclination: 0.52, startAngle: 0.0, bodyColor: 0xc0d8f0, panelColor: 0x1a6fbd, glowColor: 0x00f2fe, name: 'S1' }, // Sentinel-1 SAR
      { orbitRadius: 1.44, speed: 0.27, inclination: -0.28, startAngle: 2.1, bodyColor: 0xd4e8c0, panelColor: 0x2d8a3e, glowColor: 0x38ef7d, name: 'S2' }, // Sentinel-2 Optical
      { orbitRadius: 1.52, speed: 0.19, inclination: 1.10, startAngle: 4.3, bodyColor: 0xe8d4c0, panelColor: 0x9b4e1a, glowColor: 0xf97316, name: 'EV' }, // ENVISAT
      { orbitRadius: 1.60, speed: 0.14, inclination: -0.72, startAngle: 1.55, bodyColor: 0xd8c8e8, panelColor: 0x6b3fa0, glowColor: 0xa78bfa, name: 'LS' }, // Landsat-9
    ];

    const satPivots: THREE.Group[] = [];
    const satGroups: THREE.Group[] = [];
    const satGlows: THREE.Mesh[] = [];

    const buildSatellite = (cfg: typeof satelliteConfigs[0]) => {
      const pivot = new THREE.Group();
      pivot.rotation.x = cfg.inclination;
      pivot.rotation.y = cfg.startAngle;
      scene.add(pivot);
      satPivots.push(pivot);

      // ---- Orbit ring (faint circle at this orbit radius) ----
      const orbitRingGeo = new THREE.RingGeometry(cfg.orbitRadius - 0.001, cfg.orbitRadius + 0.001, 128);
      const orbitRingMat = new THREE.MeshBasicMaterial({
        color: cfg.glowColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.08,
      });
      const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
      orbitRing.rotation.x = Math.PI / 2;
      pivot.add(orbitRing);

      // ---- Satellite group positioned on the orbit ----
      const satGroup = new THREE.Group();
      satGroup.position.set(cfg.orbitRadius, 0, 0);
      pivot.add(satGroup);
      satGroups.push(satGroup);

      // Bus / body — rectangular box (main satellite bus)
      const busGeo = new THREE.BoxGeometry(0.026, 0.016, 0.014);
      const busMat = new THREE.MeshStandardMaterial({
        color: cfg.bodyColor,
        roughness: 0.25,
        metalness: 0.85,
        envMapIntensity: 1.0,
      });
      const bus = new THREE.Mesh(busGeo, busMat);
      satGroup.add(bus);

      // Solar panel wing LEFT
      const panelGeo = new THREE.BoxGeometry(0.038, 0.002, 0.018);
      const panelMat = new THREE.MeshStandardMaterial({
        color: cfg.panelColor,
        emissive: cfg.panelColor,
        emissiveIntensity: 0.18,
        roughness: 0.4,
        metalness: 0.6,
        transparent: true,
        opacity: 0.90,
      });
      const panelL = new THREE.Mesh(panelGeo, panelMat);
      panelL.position.set(0, 0, -0.030); // offset left
      satGroup.add(panelL);

      // Solar panel wing RIGHT
      const panelR = new THREE.Mesh(panelGeo, panelMat);
      panelR.position.set(0, 0, 0.030);  // offset right
      satGroup.add(panelR);

      // Connector strut L
      const strutGeo = new THREE.BoxGeometry(0.002, 0.002, 0.020);
      const strutMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6, metalness: 0.7 });
      const strutL = new THREE.Mesh(strutGeo, strutMat);
      strutL.position.set(0, 0, -0.018);
      satGroup.add(strutL);
      const strutR = new THREE.Mesh(strutGeo, strutMat);
      strutR.position.set(0, 0, 0.018);
      satGroup.add(strutR);

      // Dish / antenna nub on top
      const dishGeo = new THREE.CylinderGeometry(0.004, 0.007, 0.008, 8);
      const dishMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.3, metalness: 0.9 });
      const dish = new THREE.Mesh(dishGeo, dishMat);
      dish.position.set(0.010, 0.012, 0);
      dish.rotation.z = Math.PI / 5;
      satGroup.add(dish);

      // Thruster / engine glow sphere at rear
      const glowGeo = new THREE.SphereGeometry(0.006, 12, 12);
      const glowMat = new THREE.MeshBasicMaterial({
        color: cfg.glowColor,
        transparent: true,
        opacity: 0.85,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.set(-0.018, 0, 0); // behind the bus
      satGroup.add(glow);
      satGlows.push(glow);
    };

    satelliteConfigs.forEach(buildSatellite);


    // Mouse Interaction
    let isDragging = false;
    let dragDistance = 0;
    let prevMouse = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      dragDistance = 0;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / height) * 2 + 1;

      // Raycast to check beacon hover
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);
      if (intersects.length > 0) {
        container.style.cursor = 'pointer';
        const hitId = (intersects[0].object as any).incidentId;
        const matched = incidents.find(i => i.id === hitId);
        setHoveredIncident(matched || null);
        setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      } else {
        container.style.cursor = isDragging ? 'grabbing' : 'grab';
        setHoveredIncident(null);
        setHoverPos(null);
      }

      if (isDragging) {
        const deltaX = e.clientX - prevMouse.x;
        const deltaY = e.clientY - prevMouse.y;
        dragDistance += Math.abs(deltaX) + Math.abs(deltaY);
        globeGroup.rotation.y += deltaX * 0.004;
        globeGroup.rotation.x = Math.max(-0.7, Math.min(0.7, globeGroup.rotation.x + deltaY * 0.004));
        prevMouse = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      container.style.cursor = 'grab';
    };

    const onClick = (e: MouseEvent) => {
      if (dragDistance > 6) return;

      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hitId = (intersects[0].object as any).incidentId;
        const clickedInc = incidents.find(i => i.id === hitId);
        if (clickedInc) {
          handleSwitchIncident(clickedInc);
        }
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('click', onClick);

    // Animation Loop with smooth auto-centering on active incident
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth flight camera damping toward active incident when not dragging
      if (!isDragging) {
        const targetRot = targetRotRef.current;
        globeGroup.rotation.y += (targetRot.y - globeGroup.rotation.y) * 0.06;
        globeGroup.rotation.x += (targetRot.x - globeGroup.rotation.x) * 0.06;
      }

      // Pulsing transparent ripple rings
      const pulseScale = 1.0 + (Math.sin(elapsedTime * 3.5) + 1.0) * 0.6;
      const pulseOpacity = 0.9 - (Math.sin(elapsedTime * 3.5) + 1.0) * 0.4;

      emRingMesh.scale.set(pulseScale, pulseScale, 1);
      emRingMat.opacity = Math.max(0.12, pulseOpacity);

      wkRingMesh.scale.set(pulseScale, pulseScale, 1);
      wkRingMat.opacity = Math.max(0.12, pulseOpacity);

      // Animate satellites — each pivot rotates at its own speed
      satelliteConfigs.forEach((cfg, i) => {
        satPivots[i].rotation.y += cfg.speed * 0.007;
        // Keep satellite facing direction of travel (tangent to orbit)
        satGroups[i].rotation.y = -satPivots[i].rotation.y * 0.5;
        // Pulsing thruster glow
        const glowMat = satGlows[i].material as THREE.MeshBasicMaterial;
        glowMat.opacity = 0.5 + Math.sin(elapsedTime * 5 + i * 1.8) * 0.35;
        const glowScale = 0.85 + Math.sin(elapsedTime * 6 + i) * 0.15;
        satGlows[i].scale.setScalar(glowScale);
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [incidents, onSelectIncident]);

  const handleSwitchIncident = (inc: IncidentLocation) => {
    setActiveIncidentId(inc.id);
    if (incidentRotations.current[inc.id]) {
      targetRotRef.current = incidentRotations.current[inc.id];
    }
    onSelectIncident(inc.lat, inc.lon, inc);
  };

  const isEmerald = currentIncident.id === 'emerald';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* 🧭 Top-Right Cardinal Direction Compass Rose */}
      <div style={{
        position: 'absolute',
        top: '24px',
        right: '24px',
        background: 'rgba(6, 10, 20, 0.88)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 242, 254, 0.35)',
        borderRadius: '12px',
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 242, 254, 0.15)',
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00f2fe', fontSize: '0.78rem', fontWeight: 800 }}>
          <Compass size={16} />
          <span>CARDINAL ORIENTATION</span>
        </div>

        {/* 4-Point Compass Visual */}
        <div style={{
          position: 'relative',
          width: '74px',
          height: '74px',
          borderRadius: '50%',
          border: '1px dashed rgba(0, 242, 254, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ position: 'absolute', top: '2px', fontSize: '0.75rem', fontWeight: 900, color: '#ef4444' }}>N</span>
          <span style={{ position: 'absolute', bottom: '2px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>S</span>
          <span style={{ position: 'absolute', right: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>E</span>
          <span style={{ position: 'absolute', left: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>W</span>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00f2fe' }} />
          <div style={{
            position: 'absolute',
            width: '2px',
            height: '24px',
            background: 'linear-gradient(to top, transparent, #ef4444)',
            top: '12px',
          }} />
        </div>

        <div style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>
          {isEmerald ? (
            <>
              Eastern Mediterranean<br />
              <b style={{ color: '#00f2fe' }}>Levantine Basin Sector</b>
            </>
          ) : (
            <>
              South Indian Ocean<br />
              <b style={{ color: '#00f2fe' }}>Mauritius Sector</b>
            </>
          )}
        </div>
      </div>

      {/* 📍 Top-Left Target Telemetry & Dual Incident Controller HUD */}
      <div style={{
        position: 'absolute',
        top: '24px',
        left: '24px',
        background: 'rgba(6, 10, 20, 0.88)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 242, 254, 0.35)',
        borderRadius: '12px',
        padding: '16px 20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 242, 254, 0.15)',
        pointerEvents: 'auto',
        maxWidth: '410px',
        zIndex: 100,
      }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid rgba(0, 242, 254, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 900, color: '#00f2fe', fontSize: '0.95rem', letterSpacing: '1px' }}>GLOBAL RADAR</span>
            <span style={{ color: '#64748b', fontSize: '0.70rem' }}>|</span>
            <span style={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600 }}>2 ACTIVE INCIDENTS</span>
          </div>
          {onOpenSimulation && (
            <button
              onClick={onOpenSimulation}
              style={{
                background: 'rgba(0, 242, 254, 0.12)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                color: '#00f2fe',
                borderRadius: '5px',
                padding: '3px 8px',
                fontSize: '0.66rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <Radio size={11} />
              <span>Watchdog Sim</span>
            </button>
          )}
        </div>

        {/* Dual Red-Dot Incident Switcher */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {incidents.map((inc, idx) => {
              const isSelected = inc.id === activeIncidentId;
              return (
                <button
                  key={inc.id}
                  onClick={() => handleSwitchIncident(inc)}
                  style={{
                    padding: '8px 10px',
                    fontSize: '0.72rem',
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? '#ffffff' : '#94a3b8',
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(220, 38, 38, 0.2))'
                      : 'rgba(255, 255, 255, 0.04)',
                    border: isSelected ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: isSelected ? '0 0 15px rgba(239, 68, 68, 0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    flexShrink: 0,
                    boxShadow: isSelected ? '0 0 8px #ef4444' : 'none'
                  }} />
                  <span>Spill {idx + 1}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Incident Information */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            {isEmerald ? 'TANKER MYSTERY DISCHARGE ALERT' : 'CORAL REEF GROUNDING ALERT'}
          </span>
        </div>

        <h3 style={{ margin: 0, fontSize: '1.02rem', color: '#f1f5f9', fontWeight: 700 }}>
          {isEmerald
            ? 'Levantine Basin, Mediterranean (33.15°N, 34.20°E)'
            : "Pointe d'Esny, Mauritius (-20.438°S, 57.745°E)"}
        </h3>
        <p style={{ margin: '4px 0 10px 0', fontSize: '0.78rem', color: '#94a3b8' }}>
          {isEmerald
            ? 'Copernicus Sentinel-1 SAR & Sentinel-2 Optical detection. Drifting crude oil slick (~42.6 km²), coastal trajectory toward Hadera/Dor HaBonim.'
            : 'Copernicus Sentinel-1 & 2 MSI detection. Bulk carrier grounded on coral barrier reef (~28.5 km² bunker fuel spill into tidal lagoon).'}
        </p>

        {/* Data Pipeline Mode Switcher */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '8px 10px',
          marginBottom: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.70rem', color: '#94a3b8', fontWeight: 600 }}>Data Source Mode:</span>
            <span style={{ fontSize: '0.68rem', color: useLiveSat ? '#f59e0b' : '#00f2fe', fontWeight: 700 }}>
              {useLiveSat ? '🛰️ ESA LIVE' : '⚡ INSTANT CALIBRATED'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleLiveSat?.(false);
              }}
              style={{
                padding: '6px 8px',
                fontSize: '0.70rem',
                fontWeight: !useLiveSat ? 800 : 500,
                color: !useLiveSat ? '#00f2fe' : '#64748b',
                background: !useLiveSat ? 'rgba(0, 242, 254, 0.18)' : 'rgba(255,255,255,0.03)',
                border: !useLiveSat ? '1px solid #00f2fe' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              ⚡ Fast Instant (~1s)
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleLiveSat?.(true);
              }}
              style={{
                padding: '6px 8px',
                fontSize: '0.70rem',
                fontWeight: useLiveSat ? 800 : 500,
                color: useLiveSat ? '#f59e0b' : '#64748b',
                background: useLiveSat ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255,255,255,0.03)',
                border: useLiveSat ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              🛰️ Live ESA API (~15s)
            </button>
          </div>
        </div>

        {/* Primary Action Button: Launch Satellite Lab */}
        <button
          onClick={() => {
            if (onInspectIncident) {
              onInspectIncident(currentIncident.lat, currentIncident.lon, currentIncident);
            } else {
              onSelectIncident(currentIncident.lat, currentIncident.lon, currentIncident);
            }
          }}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            padding: '10px 14px',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
        >
          <span>
            🛰️ Inspect Spill Imagery ({currentIncident.lat.toFixed(2)}°, {currentIncident.lon.toFixed(2)}°) →
          </span>
        </button>



        {/* Corridor Legend */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
            {isEmerald ? 'Active Mediterranean Corridors:' : 'Active Indian Ocean Corridors:'}
          </div>
          {isEmerald ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#f1f5f9' }}>
                <span style={{ width: '10px', height: '3px', background: '#00f2fe', borderRadius: '2px' }} />
                <span>Suez Canal ⇄ Levantine Basin Corridor</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#f1f5f9' }}>
                <span style={{ width: '10px', height: '3px', background: '#22c55e', borderRadius: '2px' }} />
                <span>Levantine Basin ⇄ Baniyas / Syria Route</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#f1f5f9' }}>
                <span style={{ width: '10px', height: '3px', background: '#f97316', borderRadius: '2px' }} />
                <span>Levantine Basin ⇄ Piraeus / Aegean Route</span>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#f1f5f9' }}>
                <span style={{ width: '10px', height: '3px', background: '#00f2fe', borderRadius: '2px' }} />
                <span>Strait of Malacca / Singapore ⇄ Mauritius Corridor</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#f1f5f9' }}>
                <span style={{ width: '10px', height: '3px', background: '#22c55e', borderRadius: '2px' }} />
                <span>Mauritius ⇄ Cape of Good Hope Bulk Route</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#f1f5f9' }}>
                <span style={{ width: '10px', height: '3px', background: '#f97316', borderRadius: '2px' }} />
                <span>Mauritius ⇄ Mozambique Channel Route</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating Hover Tooltip Pinned Directly Next to the Red Dot */}
      {hoveredIncident && hoverPos && (
        <div style={{
          position: 'absolute',
          left: `${Math.min(hoverPos.x + 18, (containerRef.current?.clientWidth || 800) - 340)}px`,
          top: `${Math.max(16, hoverPos.y - 20)}px`,
          pointerEvents: 'none',
          zIndex: 200,
          transition: 'top 0.05s ease-out, left 0.05s ease-out',
        }}>
          <SpillTooltipCard
            title={`🚨 ${hoveredIncident.id === 'emerald' ? 'MT EMERALD INCIDENT' : 'MV WAKASHIO INCIDENT'}`}
            lat={hoveredIncident.lat}
            lon={hoveredIncident.lon}
            areaKm2={hoveredIncident.id === 'emerald' ? 31.42 : 2.805}
            timestamp={`${hoveredIncident.date} UTC`}
            spillId={hoveredIncident.spillId}
          />
        </div>
      )}
    </div>
  );
};
