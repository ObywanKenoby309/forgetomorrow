import React, { useRef, useState, useCallback } from 'react';

const TARGET_W = 1280;
const TARGET_H = 320;

export default function ProfileBannerSelector({ value, onChange, className }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const openPicker = () => fileRef.current?.click();

  const handleFiles = useCallback(async (files) => {
    setError('');
    const file = files?.[0];
    if (!file) return;

    if (!/image\/(jpeg|jpg|png|webp)/i.test(file.type)) {
      setError('Please choose a JPG, PNG, or WebP image.');
      return;
    }

    try {
      setBusy(true);
      const dataUrl = await readFileAsDataURL(file);
      const fitted = await fitToBanner(dataUrl, TARGET_W, TARGET_H);
      onChange?.(fitted);
    } catch (e) {
      console.error(e);
      setError('Sorry—could not process that image.');
    } finally {
      setBusy(false);
    }
  }, [onChange]);

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  };

  const onPaste = async (e) => {
    const item = [...e.clipboardData.items].find(i => i.type.startsWith('image/'));
    if (item) {
      const file = item.getAsFile();
      await handleFiles([file]);
    }
  };

  return (
    <div
      className={className}
      onDragOver={(e) => { e.preventDefault(); }}
      onDrop={onDrop}
      onPaste={onPaste}
      style={{ display: 'grid', gap: 8 }}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      <button
        type="button"
        onClick={openPicker}
        disabled={busy}
        style={{
          alignSelf: 'start',
          background: '#FF7043',
          color: 'white',
          border: 'none',
          borderRadius: 10,
          padding: '10px 16px',
          fontWeight: 700,
          cursor: 'pointer',
          opacity: busy ? 0.7 : 1,
        }}
      >
        {busy ? 'Processing…' : 'Choose Banner Image'}
      </button>

      <div style={{ fontSize: 14, color: '#607D8B' }}>
        Saved banner: <b>{TARGET_W}×{TARGET_H}</b> (locked)
      </div>

      {value ? (
        <div
          title="Current banner"
          style={{
            height: 60,
            width: Math.round(60 * (TARGET_W / TARGET_H)),
            backgroundImage: `url(${value})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            borderRadius: 6,
            border: '1px solid #e6e9ef',
          }}
        />
      ) : null}

      <div style={{ fontSize: 13, color: '#90A4AE' }}>
        Tip: We auto-fit your image to {TARGET_W}×{TARGET_H} (JPEG). Keep important content near the
        center vertically. You can also drag-and-drop an image here.
      </div>

      {error && <div style={{ color: '#D32F2F', fontSize: 13 }}>{error}</div>}
    </div>
  );
}

/* ---------- helpers ---------- */

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

/**
 * Cover-fit the source image into TARGET_W × TARGET_H and export JPEG.
 * Keeps aspect ratio, fills the entire frame (center-cropped if needed).
 */
function fitToBanner(srcDataUrl, outW, outH) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');

        // Compute cover scale
        const scale = Math.max(outW / img.width, outH / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const dx = (outW - drawW) / 2;
        const dy = (outH - drawH) / 2;

        ctx.clearRect(0, 0, outW, outH);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, dx, dy, drawW, drawH);

        // Export ~85% quality JPEG to keep size reasonable
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = reject;
    img.crossOrigin = 'anonymous'; // best-effort; local uploads unaffected
    img.src = srcDataUrl;
  });
}
