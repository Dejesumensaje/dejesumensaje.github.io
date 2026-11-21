// Copies Alborada from its own repo into public/play/alborada/ and adds an
// embed mode (?embed=1) used by the footer CRT:
//   - no utility bar, hints, touch lanes or toast; canvas fills the frame
//   - starts muted; the parent toggles sound via postMessage
//   - Esc hands keyboard focus back to the page
// The game itself is untouched otherwise. Re-run after every game update:
//   node scripts/sync-alborada.mjs [path/to/alborada/index.html]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = process.argv[2] ?? join(homedir(), 'Developer/alborada/index.html');
const outDir = join(root, 'public/play/alborada');

let html = readFileSync(src, 'utf8');

const head = `
  <!-- portfolio embed mode -->
  <script>if (/[?&]embed=1/.test(location.search)) document.documentElement.classList.add('embed');</script>
  <style>
    html.embed, html.embed body { background: #000 !important; }
    html.embed body { padding: 0 !important; }
    html.embed .utility-bar, html.embed #desktop-hint, html.embed #touch-lanes,
    html.embed #toast, html.embed #crt-layer { display: none !important; }
    html.embed .game-main { gap: 0; }
    html.embed .p8-screen-box, html.embed body.is-desktop .p8-screen-box {
      width: 100vmin !important; height: 100vmin !important;
      border: 0 !important; border-radius: 0 !important; box-shadow: none !important;
    }
  </style>
</head>`;

const tail = `
  <script>
    /* portfolio embed bridge */
    if (document.documentElement.classList.contains('embed')) {
      audioMuted = true;
      var post = function (m) { if (window.parent !== window) window.parent.postMessage(m, location.origin); };
      window.addEventListener('message', function (e) {
        if (e.origin !== location.origin || !e.data) return;
        var d = e.data;
        if (d.type === 'alborada:press') { initAudio(); keyPressLatch[d.btn | 0] = true; }
        if (d.type === 'alborada:start') {
          // The title screen ignores input for its first frames: keep
          // pressing X until the game leaves the title (max ~2s).
          initAudio();
          var tries = 0;
          var poke = function () {
            if (state !== 0 || tries++ > 60) return;
            keyPressLatch[5] = true;
            setTimeout(poke, 34);
          };
          poke();
        }
        if (d.type === 'alborada:mute') {
          audioMuted = !!d.muted;
          initAudio();
          if (masterGain && audioCtx) masterGain.gain.setValueAtTime(audioMuted ? 0 : 1, audioCtx.currentTime);
        }
      });
      window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { clearAllInputs(); post({ type: 'alborada:escape' }); }
      });
      post({ type: 'alborada:ready' });
    }
  </script>
</body>`;

if (!html.includes('</head>') || !html.includes('</body>')) throw new Error('Unexpected game markup');
html = html.replace('</head>', head).replace(/<\/body>(?![\s\S]*<\/body>)/, tail);

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'index.html'), html);
console.log(`Alborada synced → ${join(outDir, 'index.html')} (${(html.length / 1024).toFixed(0)} KB)`);
