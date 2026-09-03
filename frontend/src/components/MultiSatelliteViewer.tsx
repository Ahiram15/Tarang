import React, { useState } from 'react';
import { VisualLayers } from '../types';
import { Eye, Sliders, Maximize2, X } from 'lucide-react';

interface MultiSatelliteViewerProps {
  layers: VisualLayers;
  threshold: number;
}

export const MultiSatelliteViewer: React.FC<MultiSatelliteViewerProps> = ({
  layers,
  threshold,
}) => {
  const [imgSize, setImgSize] = useState<number>(185);
  const [modalImg, setModalImg] = useState<{ url: string; title: string } | null>(null);

  const layerItems = [
    {
      id: 'sar',
      title: '1. Sentinel-1 SAR',
      caption: 'Radar Backscatter (All-Weather)',
      color: '#00f2fe',
      url: layers.sentinel1_sar,
    },
    {
      id: 'optical',
      title: '2. Sentinel-2 Optical',
      caption: 'Visible RGB Sunlight Photo',
      color: '#ffaa00',
      url: layers.sentinel2_optical,
      fallbackText: 'Optical pass pending or cloud cover',
    },
    {
      id: 'heatmap',
      title: '3. Probability Heatmap',
      caption: 'U-Net Deep Learning (0-100%)',
      color: '#a855f7',
      url: layers.probability_heatmap,
    },
    {
      id: 'mask',
      title: '4. Binary Mask',
      caption: `Spill Mask (> ${(threshold * 100).toFixed(0)}%)`,
      color: '#38bdf8',
      url: layers.binary_mask,
    },
    {
      id: 'overlay',
      title: '5. Red Spill Overlay',
      caption: 'Contamination Boundary on SAR',
      color: '#f87171',
      url: layers.red_overlay,
    },
  ];

  return (
    <div style={{ marginTop: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Eye size={18} color="#00f2fe" />
          <span>Multi-Satellite & AI Visual Decomposition</span>
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Image Dimension:</span>
          <input
            type="range"
            min="120"
            max="260"
            step="10"
            className="control-slider"
            style={{ width: '100px' }}
            value={imgSize}
            onChange={(e) => setImgSize(parseInt(e.target.value))}
          />
          <span className="slider-val" style={{ fontSize: '0.75rem' }}>{imgSize}px</span>
        </div>
      </div>

      <div className="visual-grid">
        {layerItems.map((item) => (
          <div key={item.id} className="visual-layer-card">
            <div className="layer-tag" style={{ color: item.color }}>
              {item.title}
            </div>

            <div
              className="layer-img-container"
              style={{ maxHeight: `${imgSize}px`, cursor: item.url ? 'pointer' : 'default', position: 'relative' }}
              onClick={() => item.url && setModalImg({ url: item.url, title: item.title })}
            >
              {item.url ? (
                <>
                  <img src={item.url} alt={item.title} className="layer-img" />
                  <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', padding: '3px', borderRadius: '4px' }}>
                    <Maximize2 size={12} color="#fff" />
                  </div>
                </>
              ) : (
                <div style={{ padding: '16px', fontSize: '0.75rem', color: '#64748b' }}>
                  {item.fallbackText || 'Awaiting Acquisition'}
                </div>
              )}
            </div>

            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '6px' }}>
              {item.caption}
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Preview Modal */}
      {modalImg && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setModalImg(null)}
        >
          <div
            style={{
              background: '#0d1424',
              border: '1px solid #00f2fe',
              borderRadius: '12px',
              padding: '16px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 0 40px rgba(0, 242, 254, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
              <h4 style={{ color: '#00f2fe' }}>{modalImg.title} (High-Definition Inspection)</h4>
              <button
                onClick={() => setModalImg(null)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <img
              src={modalImg.url}
              alt="High Definition Inspection"
              style={{ maxWidth: '512px', maxHeight: '512px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
