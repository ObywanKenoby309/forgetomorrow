const fs = require('fs');

const file = 'components/foundry/FoundryRightPanel.js';
let s = fs.readFileSync(file, 'utf8');

s = s.replace(
  "import { useState, useEffect } from 'react';",
  "import { useState, useEffect, useRef } from 'react';"
);

const start = s.indexOf('function FilesTab(');
const end = s.indexOf('\nfunction NotesTab', start);

if (start === -1 || end === -1) {
  throw new Error('Could not find FilesTab block.');
}

const replacement = `function FilesTab({ sharedFiles, forgeFiles, onShare, onUpload }) {
  const fileInputRef = useRef(null);

  const handleComputerClick = () => {
    fileInputRef.current?.click();
  };

  const handleComputerFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onUpload?.(file);
    event.target.value = '';
  };

  const openSharedFile = (file) => {
    if (!file?.url) return;
    window.open(file.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleComputerFile}
      />

      <div style={S.fsec}>
        <div style={S.fsh}>
          <div style={S.fshl}>
            <span style={{ color: '#4caf50', fontSize: 14 }}>⊞</span>
            <span style={S.fshlabel}>Shared</span>
            <span style={S.fshcount}>{sharedFiles.length} {sharedFiles.length === 1 ? 'file' : 'files'}</span>
          </div>
          <button style={S.addF(false)} onClick={handleComputerClick}>+ Add</button>
        </div>
        {sharedFiles.length === 0 ? (
          <div style={{ ...S.emptyDrop, cursor: 'default' }}>Nothing shared yet. Share from Your Forge or Computer.</div>
        ) : (
          sharedFiles.map((f, i) => (
            <div key={f.id || \`\${f.name}-\${i}\`} style={S.fi} onClick={() => openSharedFile(f)}>
              <span style={{ fontSize: 16 }}>📄</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.fname}>{f.name}</div>
                <div style={S.fmeta}>{f.sharedBy || 'Unknown'} · {f.ago || 'just now'}<span style={S.liveBadge}>live</span></div>
              </div>
              <span style={{ fontSize: 12, color: f.url ? '#777' : '#333' }}>{f.url ? '↗' : '—'}</span>
            </div>
          ))
        )}
      </div>
      <div style={S.fdiv} />
      <div style={S.fsec}>
        <div style={S.fsh}>
          <div style={S.fshl}>
            <span style={{ color: ORANGE, fontSize: 14 }}>🔨</span>
            <span style={S.fshlabel}>Your Forge</span>
          </div>
          <button style={S.addF(true)} onClick={() => onShare && onShare()}>↗ Share</button>
        </div>
        {forgeFiles.length === 0 ? (
          <div style={{ fontSize: 10, color: '#3a3a3a', padding: '8px 0' }}>No documents in your Forge yet.</div>
        ) : (
          forgeFiles.map((f, i) => (
            <div key={i} style={S.fi} onClick={() => onShare(f)}>
              <span style={{ fontSize: 16 }}>📋</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.fname}>{f.name}</div>
                <div style={S.fmeta}>{f.type} · {f.ago}</div>
              </div>
              <span style={{ fontSize: 12, color: '#555' }}>↗</span>
            </div>
          ))
        )}
      </div>
      <div style={S.fdiv} />
      <div style={S.fsec}>
        <div style={S.fsh}>
          <div style={S.fshl}>
            <span style={{ color: '#666', fontSize: 14 }}>💻</span>
            <span style={{ ...S.fshlabel, color: '#888' }}>Computer</span>
          </div>
          <button style={S.addF(false)} onClick={handleComputerClick}>↑ Upload</button>
        </div>
        <div style={S.emptyDrop} onClick={handleComputerClick}>
          <div style={{ fontSize: 18, marginBottom: 4, color: 'rgba(255,255,255,0.1)' }}>↑</div>
          Drop a file or click to upload
        </div>
      </div>
    </div>
  );
}
`;

s = s.slice(0, start) + replacement + s.slice(end);

fs.writeFileSync(file, s);
console.log('Patched FoundryRightPanel FilesTab only.');