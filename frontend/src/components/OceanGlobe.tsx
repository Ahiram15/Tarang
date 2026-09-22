import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Compass, Navigation, Radio, MapPin, Layers } from 'lucide-react';

interface OceanGlobeProps {
  onSelectIncident: (lat: number, lon: number) => void;
  targetLat?: number;
  targetLon?: number;
  useLiveSat?: boolean;
  onToggleLiveSat?: (val: boolean) => void;
  onOpenSimulation?: () => void;
}

export const OceanGlobe: React.FC<OceanGlobeProps> = ({
  onSelectIncident,
  targetLat = 33.15,
  targetLon = 34.20,
  useLiveSat = false,
  onToggleLiveSat,
  onOpenSimulation,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [rotationAngle, setRotationAngle] = useState<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 2.75;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const globeRadius = 1.0;
    const globeGeo = new THREE.SphereGeometry(globeRadius, 64, 64);

    // 1. High-Resolution Blue & Green Earth Texture Loader
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

    // 2. Atmospheric Cyan Glow Rim
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

    // 3. Starfield
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

    // 4. Coordinates to 3D Vector Function
    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    // 5. Active Shipping Lanes (Dynamically selected for Mediterranean or Indian Ocean)
    const createArc = (startLat: number, startLon: number, endLat: number, endLon: number, colorHex: number) => {
      const start = latLonToVector3(startLat, startLon, globeRadius * 1.002);
      const end = latLonToVector3(endLat, endLon, globeRadius * 1.002);
      const mid = start.clone().add(end).multiplyScalar(0.5);
      const dist = start.distanceTo(end);
      mid.normalize().multiplyScalar(globeRadius * (1.0 + dist * 0.15));

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(40);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.65,
      });
      return new THREE.Line(geometry, material);
    };

    const isMedLocation = targetLat > 0;
    if (isMedLocation) {
      // Mediterranean Corridor Lanes
      const lane1 = createArc(31.25, 32.30, targetLat, targetLon, 0x00f2fe); // Suez to Levantine Basin
      globeGroup.add(lane1);
      const lane2 = createArc(targetLat, targetLon, 35.18, 35.94, 0x22c55e); // Levantine to Baniyas Syria
      globeGroup.add(lane2);
      const lane3 = createArc(targetLat, targetLon, 37.94, 23.63, 0xf97316); // Levantine to Piraeus Greece
      globeGroup.add(lane3);
    } else {
      // Cape of Good Hope to Mauritius Lane (Cyan)
      const lane1 = createArc(-34.35, 18.47, targetLat, targetLon, 0x00f2fe);
      globeGroup.add(lane1);
      // Mauritius to Sunda / Malacca Strait Corridor (Emerald Green)
      const lane2 = createArc(targetLat, targetLon, -5.0, 105.0, 0x22c55e);
      globeGroup.add(lane2);
      // Mozambique Channel to Mauritius Route (Amber Orange)
      const lane3 = createArc(-15.0, 42.0, targetLat, targetLon, 0xf97316);
      globeGroup.add(lane3);
    }

    // 6. Single Pulsing Red Dot Beacon on Incident Location
    const beaconPos = latLonToVector3(targetLat, targetLon, globeRadius * 1.015);
    
    // Core glowing red sphere
    const beaconCoreGeo = new THREE.SphereGeometry(0.026, 16, 16);
    const beaconCoreMat = new THREE.MeshBasicMaterial({ color: 0xff1111 });
    const beaconCore = new THREE.Mesh(beaconCoreGeo, beaconCoreMat);
    beaconCore.position.copy(beaconPos);
    globeGroup.add(beaconCore);

    // Pulsing transparent ripple ring
    const ringGeo = new THREE.RingGeometry(0.03, 0.085, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.copy(beaconPos);
    ringMesh.lookAt(beaconPos.clone().multiplyScalar(2));
    globeGroup.add(ringMesh);

    // 7. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const cyanRim = new THREE.DirectionalLight(0x00f2fe, 0.75);
    cyanRim.position.set(-5, -2, -3);
    scene.add(cyanRim);

    // LOCKED ROTATION: Lock active incident location facing directly forward
    if (isMedLocation) {
      // Longitude ~34.2°E, Latitude ~33.15°N
      globeGroup.rotation.y = -2.17;
      globeGroup.rotation.x = 0.55;
    } else {
      // Longitude ~57.75°E, Latitude ~ -20.44°S
      globeGroup.rotation.y = -Math.PI / 1.55;
      globeGroup.rotation.x = -0.32;
    }

    // Mouse Interaction (Manual drag only, NO continuous over-rotation)
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

      // Raycast ONLY to check beacon hover
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([beaconCore, ringMesh]);
      if (intersects.length > 0) {
        container.style.cursor = 'pointer';
        setIsHovered(true);
      } else {
        container.style.cursor = isDragging ? 'grabbing' : 'grab';
        setIsHovered(false);
      }

      if (isDragging) {
        const deltaX = e.clientX - prevMouse.x;
        const deltaY = e.clientY - prevMouse.y;
        dragDistance += Math.abs(deltaX) + Math.abs(deltaY);
        globeGroup.rotation.y += deltaX * 0.004;
        globeGroup.rotation.x = Math.max(-0.6, Math.min(0.6, globeGroup.rotation.x + deltaY * 0.004));
        prevMouse = { x: e.clientX, y: e.clientY };
        setRotationAngle(Math.round((globeGroup.rotation.y * 180) / Math.PI));
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      container.style.cursor = 'grab';
    };

    const onClick = (e: MouseEvent) => {
      // If the user was dragging the globe, do NOT trigger click
      if (dragDistance > 6) return;

      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      // ONLY trigger if clicking the red dot beacon itself, NOT the background globe
      const intersects = raycaster.intersectObjects([beaconCore, ringMesh]);
      
      if (intersects.length > 0) {
        onSelectIncident(targetLat, targetLon);
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('click', onClick);

    // Animation Loop (NO continuous rotation; only gentle ripple pulsing)
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Pulsing transparent ripple ring
      const pulseScale = 1.0 + (Math.sin(elapsedTime * 3.5) + 1.0) * 0.6;
      const pulseOpacity = 0.9 - (Math.sin(elapsedTime * 3.5) + 1.0) * 0.4;
      ringMesh.scale.set(pulseScale, pulseScale, 1);
      ringMat.opacity = Math.max(0.1, pulseOpacity);

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
  }, [targetLat, targetLon, onSelectIncident]);

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
          South Indian Ocean<br />
          <b style={{ color: '#00f2fe' }}>Mauritius Sector</b>
        </div>
      </div>

      {/* 📍 Top-Left Target Telemetry & Corridors HUD */}
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
        maxWidth: '390px',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(0, 242, 254, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 900, color: '#00f2fe', fontSize: '0.95rem', letterSpacing: '1px' }}>SPILL TRACE</span>
            <span style={{ color: '#64748b', fontSize: '0.70rem' }}>|</span>
            <span style={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600 }}>SPACE SURVEILLANCE</span>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            ORBITAL CHANGE DETECTION ALERT
          </span>
        </div>

        <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f1f5f9', fontWeight: 700 }}>
          Pointe d'Esny, Mauritius (-20.4381°S, 57.7446°E)
        </h3>
        <p style={{ margin: '4px 0 10px 0', fontSize: '0.8rem', color: '#94a3b8' }}>
          Coral reef grounding & oil slick flagged (~28.5 km²). AOI Bounding Box: <b>[-20.38, 57.68 to -20.50, 57.82]</b>.
        </p>

        {/* Data Pipeline Mode Switcher */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '8px 10px',
          marginBottom: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Data Source Mode:</span>
            <span style={{ fontSize: '0.68rem', color: useLiveSat ? '#f59e0b' : '#00f2fe', fontWeight: 700 }}>
              {useLiveSat ? '🛰️ ESA LIVE' : '⚡ INSTANT BENCHMARK'}
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
                fontSize: '0.72rem',
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
                fontSize: '0.72rem',
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

        {/* Action Button */}
        <button
          onClick={() => onSelectIncident(targetLat, targetLon)}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            padding: '10px 14px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
        >
          <span>
            🧠 Run AI Detection & Satellite Lab (
            {targetLat > 0 ? `${targetLat.toFixed(2)}°N, ${targetLon.toFixed(2)}°E` : `${Math.abs(targetLat).toFixed(4)}°S, ${targetLon.toFixed(4)}°E`}
            ) →
          </span>
        </button>

        {/* Corridor Legend with Colors */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
            {targetLat > 0 ? 'Active Mediterranean Corridors:' : 'Active Indian Ocean Corridors:'}
          </div>
          {targetLat > 0 ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#f1f5f9' }}>
                <span style={{ width: '12px', height: '3px', background: '#00f2fe', borderRadius: '2px' }} />
                <span>Suez Canal ⇄ Levantine Basin Corridor</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#f1f5f9' }}>
                <span style={{ width: '12px', height: '3px', background: '#22c55e', borderRadius: '2px' }} />
                <span>Levantine Basin ⇄ Baniyas / Syria Tanker Route</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#f1f5f9' }}>
                <span style={{ width: '12px', height: '3px', background: '#f97316', borderRadius: '2px' }} />
                <span>Levantine Basin ⇄ Piraeus / Aegean Route</span>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#f1f5f9' }}>
                <span style={{ width: '12px', height: '3px', background: '#00f2fe', borderRadius: '2px' }} />
                <span>Cape of Good Hope ⇄ Mauritius Lane</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#f1f5f9' }}>
                <span style={{ width: '12px', height: '3px', background: '#22c55e', borderRadius: '2px' }} />
                <span>Mauritius ⇄ Sunda / Malacca Strait</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#f1f5f9' }}>
                <span style={{ width: '12px', height: '3px', background: '#f97316', borderRadius: '2px' }} />
                <span>Mozambique Channel ⇄ Mauritius Route</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating Hover Indicator Banner */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(10, 15, 29, 0.95)',
          border: '1px solid #ef4444',
          boxShadow: '0 0 25px rgba(239, 68, 68, 0.5)',
          borderRadius: '30px',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: '1rem' }}>🎯</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9' }}>
            {targetLat > 0
              ? `CLICK TO INSPECT MT EMERALD SATELLITE IMAGERY (${targetLat.toFixed(2)}°N, ${targetLon.toFixed(2)}°E)`
              : `CLICK TO INSPECT WAKASHIO SATELLITE IMAGERY (${Math.abs(targetLat).toFixed(4)}°S, ${targetLon.toFixed(4)}°E)`}
          </span>
        </div>
      )}
    </div>
  );
};

