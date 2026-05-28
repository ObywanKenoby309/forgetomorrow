// scripts/apply-foundry-room-status-watch.cjs
// Run from repo root: node scripts/apply-foundry-room-status-watch.cjs
// Adds room-status polling to both internal and external Foundry room pages.
// Also makes the room-status endpoint public in middleware.

const fs = require('fs');
const path = require('path');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function write(file, text) {
  fs.writeFileSync(file, text, 'utf8');
}

function patchInternalRoom() {
  const file = path.join(process.cwd(), 'pages', 'foundry', '[roomId].js');
  let text = read(file);

  if (text.includes("foundry room status watcher — internal")) {
    console.log('Internal Foundry room already patched.');
    return;
  }

  const watcher = `
  // foundry room status watcher — internal participants/host self-eject when room is ended
  useEffect(() => {
    if (!roomId || loading) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(\`/api/foundry/room-status/\${roomId}\`);
        const data = await res.json().catch(() => ({}));

        if (data.status === 'ENDED') {
          clearInterval(interval);

          if (callRef.current) {
            await callRef.current.leave().catch(() => {});
          }

          router.push('/foundry');
        }
      } catch {}
    }, 5000);

    return () => clearInterval(interval);
  }, [roomId, loading, router]);

`;

  const marker = "  const handleCallReady = useCallback((call) => {";
  if (!text.includes(marker)) {
    throw new Error('Could not find internal insertion marker: handleCallReady');
  }

  text = text.replace(marker, watcher + marker);
  write(file, text);
  console.log('Patched internal Foundry room.');
}

function patchGuestRoom() {
  const file = path.join(process.cwd(), 'pages', 'foundry', 'guest', '[roomId].js');
  let text = read(file);

  if (text.includes("foundry room status watcher — external guest")) {
    console.log('Guest Foundry room already patched.');
    return;
  }

  const watcher = `
  // foundry room status watcher — external guest self-ejects when host ends room
  useEffect(() => {
    if (!ready || !roomId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(\`/api/foundry/room-status/\${roomId}\`);
        const data = await res.json().catch(() => ({}));

        if (data.status === 'ENDED') {
          clearInterval(interval);

          if (callRef.current) {
            await callRef.current.leave().catch(() => {});
          }

          setShowConversionBanner(true);
        }
      } catch {}
    }, 5000);

    return () => clearInterval(interval);
  }, [ready, roomId]);

`;

  const marker = "  const requestGuestToken = async () => {";
  if (!text.includes(marker)) {
    throw new Error('Could not find guest insertion marker: requestGuestToken');
  }

  text = text.replace(marker, watcher + marker);
  write(file, text);
  console.log('Patched external guest Foundry room.');
}

function patchMiddleware() {
  const file = path.join(process.cwd(), 'middleware.js');
  if (!fs.existsSync(file)) {
    console.log('middleware.js not found; skipping middleware patch.');
    return;
  }

  let text = read(file);

  if (text.includes('pathname.startsWith("/api/foundry/room-status/")')) {
    console.log('Middleware already allows room-status.');
    return;
  }

  const oldLine = 'pathname === "/api/foundry/resolve-code"';
  const newLine = 'pathname === "/api/foundry/resolve-code" ||\n    pathname.startsWith("/api/foundry/room-status/")';

  if (!text.includes(oldLine)) {
    throw new Error('Could not find middleware public Foundry marker.');
  }

  text = text.replace(oldLine, newLine);
  write(file, text);
  console.log('Patched middleware public room-status access.');
}

patchInternalRoom();
patchGuestRoom();
patchMiddleware();

console.log('Done.');
