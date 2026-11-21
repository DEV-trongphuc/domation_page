import argparse
import base64
import json
import math
import shutil
import subprocess
import time
import wave
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(r"D:\GITHUB_SPACE\DOMATION_LANDINGPAGE")
STUDIO_DIR = ROOT / "scripts" / "video-studio"
OUT_VIDEO = ROOT / "public" / "videos" / "domation-ecosystem-master.mp4"
OUT_POSTER_DIR = ROOT / "public" / "videos" / "posters"
QA_DIR = STUDIO_DIR / ".qa" / "master"
TMP_DIR = STUDIO_DIR / ".tmp" / "master"

FPS = 60
DURATION_SEC = 44
TOTAL_FRAMES = FPS * DURATION_SEC  # 2640 frames @ 60fps
WIDTH = 1280
HEIGHT = 720

KEYFRAME_CHAPTERS = [
    ("chapter-01-pain", "scene_01", 132),
    ("chapter-02-ecosystem", "scene_02", 390),
    ("chapter-03-autodata", "scene_03", 648),
    ("chapter-04-flywheel", "scene_04", 930),
    ("chapter-05-crm", "scene_05", 1180),
    ("chapter-06-report", "scene_06", 1440),
    ("chapter-07-automation", "scene_07", 1725),
    ("chapter-08-erp", "scene_08", 1980),
    ("chapter-09-multiagent", "scene_09", 2240),
    ("chapter-10-outro", "scene_10", 2520),
]

BROWSER_CANDIDATES = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
]


def find_browser() -> str:
    for p in BROWSER_CANDIDATES:
        if Path(p).exists():
            return p
    raise FileNotFoundError("Could not locate Edge/Chrome executable.")


def to_data_uri(rel_or_abs: Path, resize_max: int | None = None) -> str:
    if not rel_or_abs.exists():
        raise FileNotFoundError(f"Missing visual asset: {rel_or_abs}")
    ext = rel_or_abs.suffix.lower()
    if ext == ".svg":
        b64 = base64.b64encode(rel_or_abs.read_bytes()).decode("ascii")
        return f"data:image/svg+xml;base64,{b64}"
    if resize_max and ext in (".png", ".jpg", ".jpeg", ".webp"):
        import io
        with Image.open(rel_or_abs) as im:
            w, h = im.size
            if w > resize_max:
                nh = int(h * (resize_max / w))
                im = im.resize((resize_max, nh), Image.Resampling.LANCZOS)
            buf = io.BytesIO()
            if im.mode in ("RGBA", "LA"):
                im.save(buf, "WEBP", quality=90)
                mime = "image/webp"
            else:
                im.convert("RGB").save(buf, "JPEG", quality=90)
                mime = "image/jpeg"
            b64 = base64.b64encode(buf.getvalue()).decode("ascii")
            return f"data:{mime};base64,{b64}"
    mime_map = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
    }
    b64 = base64.b64encode(rel_or_abs.read_bytes()).decode("ascii")
    return f"data:{mime_map.get(ext, 'image/png')};base64,{b64}"


def collect_assets() -> dict:
    # Swiss Daylight assets: official DOMATION logo + verified platform icons + 3D mascots
    return {
        "logo_uri": to_data_uri(ROOT / "public" / "domation-logo.svg"),
        # Platform logos (used strictly where those platforms apply)
        "ico_meta": to_data_uri(ROOT / "public" / "assets" / "brands" / "meta-icon.svg"),
        "ico_zalo": to_data_uri(ROOT / "public" / "assets" / "brands" / "zalobot-logo.webp"),
        "ico_gmail": to_data_uri(ROOT / "public" / "assets" / "brands" / "gmail-logo.webp"),
        "ico_sheets": to_data_uri(ROOT / "public" / "assets" / "brands" / "sheets-icon.svg"),
        # 3D DOMATION Mascots
        "m_dom1": to_data_uri(ROOT / "public" / "imgs" / "dom_mascots" / "dom_1.webp"),
        "m_dom4": to_data_uri(ROOT / "public" / "imgs" / "dom_mascots" / "dom_4.webp"),
        "m_master": to_data_uri(ROOT / "public" / "imgs" / "dom_mascots" / "agent_master.webp"),
        "m_sales": to_data_uri(ROOT / "public" / "imgs" / "dom_mascots" / "agent_sales.webp"),
        "m_mkt": to_data_uri(ROOT / "public" / "imgs" / "dom_mascots" / "agent_marketing.webp"),
        "m_exec": to_data_uri(ROOT / "public" / "imgs" / "dom_mascots" / "agent_executive.webp"),
        "m_it": to_data_uri(ROOT / "public" / "imgs" / "dom_mascots" / "agent_it.webp"),
    }


def generate_master_audio_wav(out_wav: Path) -> None:
    """Synthesize a clean 44.1kHz Stereo SFX-only stem (zero background music) for external BGM layering."""
    sr = 44100
    n_samples = sr * DURATION_SEC
    rng = np.random.default_rng(2026)
    two_pi = 2.0 * np.pi

    left = np.zeros(n_samples, dtype=np.float64)
    right = np.zeros(n_samples, dtype=np.float64)

    def add_slice(t_start: float, sig_l: np.ndarray, sig_r: np.ndarray | None = None):
        i0 = max(0, int(round(t_start * sr)))
        i1 = min(n_samples, i0 + len(sig_l))
        if i1 <= i0:
            return
        cnt = i1 - i0
        left[i0:i1] += sig_l[:cnt]
        right[i0:i1] += (sig_l[:cnt] if sig_r is None else sig_r[:cnt])

    # 1. Pure air riser sweep before Scene 2 reveal (3.45s -> 4.18s, noise only - key-neutral)
    r_dur = 0.75
    rt = np.arange(int(r_dur * sr), dtype=np.float64) / sr
    rn = rng.normal(0.0, 1.0, len(rt))
    r_bp = np.convolve(rn, np.ones(9) / 9.0, mode="same") - np.convolve(rn, np.ones(35) / 35.0, mode="same")
    r_env = (rt / r_dur) ** 2.2 * np.clip((r_dur - rt) / 0.04, 0.0, 1.0) * 0.42
    add_slice(3.45, r_bp * r_env, r_bp * r_env)

    # 2. Directional stereo transition whoosh + soft sub-thump
    def add_whoosh(center_t: float, pan_dir: float = 1.0, strength: float = 0.46):
        w_dur = 0.44
        wt = np.arange(int(w_dur * sr), dtype=np.float64) / sr
        wn = rng.normal(0.0, 1.0, len(wt))
        w_bp = np.convolve(wn, np.ones(15) / 15.0, mode="same") - np.convolve(wn, np.ones(61) / 61.0, mode="same")
        w_env = np.sin(np.pi * wt / w_dur) ** 1.6
        sub_f = 82.0 - 46.0 * (wt / w_dur)
        sub_thump = np.sin(two_pi * np.cumsum(sub_f) / sr) * np.exp(-wt * 15.0) * 0.34
        pan = 0.5 + 0.38 * pan_dir * (2.0 * wt / w_dur - 1.0)
        pan_l = np.clip(1.0 - pan, 0.14, 0.86)
        pan_r = np.clip(pan, 0.14, 0.86)
        sig = w_bp * w_env * strength * 1.9 + sub_thump * strength
        add_slice(center_t - w_dur * 0.45, sig * pan_l, sig * pan_r)

    # 3. Crisp neutral tactile UI pop (short glass click)
    def add_ui_pop(pop_t: float, freq: float = 720.0, pan: float = 0.5, vol: float = 0.28):
        p_dur = 0.095
        pt = np.arange(int(p_dur * sr), dtype=np.float64) / sr
        f_env = freq * (1.0 + 0.38 * np.exp(-pt * 72.0))
        sig = np.sin(two_pi * np.cumsum(f_env) / sr) * np.exp(-pt * 38.0) * (1.0 - np.exp(-pt * 450.0)) * vol
        add_slice(pop_t, sig * (1.0 - pan) * 1.4, sig * pan * 1.4)

    # 4. Crisp sparkling notification ping (key-neutral crystalline bell tap)
    def add_ping(c_t: float, freq: float = 960.0, pan: float = 0.5, vol: float = 0.22, decay: float = 9.0):
        c_dur = 0.38
        ct = np.arange(int(c_dur * sr), dtype=np.float64) / sr
        tone = (
            np.sin(two_pi * freq * ct)
            + 0.28 * np.sin(two_pi * freq * 2.0 * ct) * np.exp(-ct * 12.0)
        ) * np.exp(-ct * decay) * (1.0 - np.exp(-ct * 300.0)) * vol
        add_slice(c_t, tone * (1.0 - pan) * 1.4, tone * pan * 1.4)

    # 9 Transition Whooshes at exact Scene Boundaries
    for idx, wt in enumerate([4.16, 8.46, 12.76, 17.46, 21.76, 26.06, 30.76, 35.06, 39.36]):
        add_whoosh(wt, pan_dir=1.0 if idx % 2 == 0 else -1.0, strength=0.46)

    # Scene 1: 3 stat cards cascading pops
    for idx, pt in enumerate([0.24, 0.42, 0.60]):
        add_ui_pop(pt, freq=560.0 - idx * 55.0, pan=0.65, vol=0.26)

    # Scene 2: 5 pillar arc cards pop-ins
    for idx in range(5):
        add_ui_pop(4.42 + idx * 0.10, freq=620.0 + idx * 65.0, pan=0.2 + idx * 0.15, vol=0.26)

    # Scene 3: Stacked deck fan + 3 channel icon pops + routing zip
    add_ui_pop(8.72, freq=640.0, pan=0.70, vol=0.28)
    for idx, pt in enumerate([8.86, 8.99, 9.12]):
        add_ui_pop(pt, freq=760.0 + idx * 90.0, pan=0.58, vol=0.24)
    add_ping(10.10, freq=1180.0, pan=0.68, vol=0.20, decay=11.0)

    # Scene 4 (6-Card Closed-Loop CAPI Flywheel): 6 clockwise ascending clicks/pings
    loop_pans = [0.22, 0.50, 0.78, 0.78, 0.50, 0.22]
    for idx in range(6):
        lt = 13.05 + idx * 0.42
        add_ui_pop(lt, freq=640.0 + idx * 60.0, pan=loop_pans[idx], vol=0.26)
        add_ping(lt + 0.02, freq=960.0 + idx * 95.0, pan=loop_pans[idx], vol=0.16, decay=11.0)

    # Scene 5: 4 CRM journey stages confirmation pings
    for idx in range(4):
        st = 17.75 + idx * 0.46
        add_ui_pop(st, freq=660.0 + idx * 80.0, pan=0.35, vol=0.27)
        add_ping(st + 0.02, freq=980.0 + idx * 110.0, pan=0.35, vol=0.18, decay=10.0)

    # Scene 6: Report BI bar ticks + curve peak resolve ping
    for idx in range(7):
        add_ui_pop(22.02 + idx * 0.13, freq=520.0 + idx * 70.0, pan=0.65, vol=0.20)
    add_ping(23.55, freq=1240.0, pan=0.68, vol=0.26, decay=8.0)

    # Scene 7: 5-node Automation Branching Flowchart sequential triggers
    flow_times = [26.32, 26.74, 27.18, 27.68, 28.02]
    flow_freqs = [640.0, 760.0, 880.0, 1080.0, 960.0]
    flow_pans = [0.22, 0.40, 0.56, 0.78, 0.78]
    for ft, ff, fp in zip(flow_times, flow_freqs, flow_pans):
        add_ui_pop(ft, freq=ff, pan=fp, vol=0.28)
        add_ping(ft + 0.02, freq=ff * 1.5, pan=fp, vol=0.18, decay=10.5)

    # Scene 8: 6 ERP tiles top sweep clicks
    for idx in range(6):
        add_ui_pop(31.05 + idx * 0.27, freq=580.0 + idx * 72.0, pan=0.60 if idx % 2 == 0 else 0.78, vol=0.25)

    # Scene 9: 5 Multi-Agent pop-ins
    for idx in range(5):
        add_ui_pop(35.35 + idx * 0.10, freq=640.0 + idx * 65.0, pan=0.2 + idx * 0.15, vol=0.25)

    # Scene 10 Outro: Crisp signature brand lockup chime
    add_ping(39.72, freq=880.0, pan=0.45, vol=0.26, decay=6.5)
    add_ping(39.94, freq=1320.0, pan=0.55, vol=0.28, decay=5.5)

    # Punchier calibrated SFX loudness (-2.2 dB sweet spot) with pure silence gaps
    left = np.tanh(left * 2.15) * 0.85
    right = np.tanh(right * 2.15) * 0.85

    stereo = np.empty(n_samples * 2, dtype=np.int16)
    stereo[0::2] = np.clip(left * 32767.0, -32767, 32767).astype(np.int16)
    stereo[1::2] = np.clip(right * 32767.0, -32767, 32767).astype(np.int16)

    out_wav.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out_wav), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(stereo.tobytes())


def build_master_html(assets: dict) -> str:
    assets_json = json.dumps(assets, ensure_ascii=False)

    return f"""<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>DOMATION Ecosystem Master Film (Swiss Daylight 60FPS)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }}
    html, body {{
      width: {WIDTH}px; height: {HEIGHT}px; overflow: hidden;
      background: #FDFCFA;
      font-family: 'Be Vietnam Pro', 'Segoe UI', system-ui, -apple-system, sans-serif;
      user-select: none;
    }}
    #stage {{ position: relative; width: {WIDTH}px; height: {HEIGHT}px; overflow: hidden; }}
    .scene {{
      position: absolute; inset: 0; width: {WIDTH}px; height: {HEIGHT}px;
      overflow: hidden; opacity: 0; visibility: hidden;
      will-change: transform, opacity, clip-path, filter;
    }}
    .bg-ivory {{
      background: radial-gradient(circle at 86% 16%, rgba(220, 38, 38, 0.055), transparent 44%),
                  linear-gradient(160deg, #FDFCFA 0%, #F4F3EE 100%);
    }}
    .bg-ivory-blue {{
      background: radial-gradient(circle at 84% 18%, rgba(30, 64, 255, 0.065), transparent 46%),
                  linear-gradient(160deg, #FDFCFA 0%, #F3F5FA 100%);
    }}
    .bg-pearl {{
      background: radial-gradient(circle at 50% 0%, rgba(30, 64, 255, 0.08), transparent 54%),
                  radial-gradient(circle at 88% 92%, rgba(6, 182, 212, 0.08), transparent 46%),
                  linear-gradient(180deg, #FFFFFF 0%, #F1F6FF 100%);
    }}
    .bg-ice {{
      background: radial-gradient(circle at 16% 16%, rgba(6, 182, 212, 0.08), transparent 46%),
                  linear-gradient(160deg, #FAFCFF 0%, #EDF4FF 100%);
    }}
    .bg-alabaster {{
      background: radial-gradient(circle at 82% 84%, rgba(30, 64, 255, 0.07), transparent 48%),
                  linear-gradient(160deg, #FAF9F6 0%, #EEF3FA 100%);
    }}
    .bg-sky {{
      background: radial-gradient(circle at 50% 18%, rgba(30, 64, 255, 0.085), transparent 52%),
                  linear-gradient(180deg, #FFFFFF 0%, #ECF3FF 100%);
    }}
    .bg-outro {{
      background: radial-gradient(circle at 50% 44%, #FFFFFF 0%, #EEF4FF 48%, #DCE8FF 100%);
    }}
    .hud-top {{
      position: absolute; top: 0; left: 48px; right: 48px; height: 74px;
      display: flex; align-items: center; justify-content: space-between;
      z-index: 40; pointer-events: none;
    }}
    .hud-btm {{
      position: absolute; bottom: 0; left: 48px; right: 48px; height: 34px;
      display: flex; align-items: center;
      z-index: 40; pointer-events: none;
    }}
    .line-clip {{ overflow: hidden; padding: 6px 0 8px 0; }}
    .tabular {{ font-variant-numeric: tabular-nums; }}
    .lux-card {{
      background: linear-gradient(180deg, #FFFFFF 0%, #FAFBFD 100%);
      border: 1px solid rgba(15, 23, 42, 0.08);
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04),
                  0 14px 30px -10px rgba(15, 23, 42, 0.10),
                  0 24px 48px -18px rgba(30, 64, 255, 0.08),
                  inset 0 1px 0 rgba(255, 255, 255, 0.95);
    }}
    .ico-box {{
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border-radius: 14px;
    }}
    .nowrap-row {{ display: flex; flex-wrap: nowrap; align-items: center; white-space: nowrap; }}
  </style>
</head>
<body>
  <div id="stage"></div>
  <div id="hud-top" class="hud-top"></div>
  <div id="hud-btm" class="hud-btm"></div>

  <script>
    const A = {assets_json};
    const FPS = {FPS};
    const TOTAL = {TOTAL_FRAMES};

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    function interp(val, [i0, i1], [o0, o1], ease = 'linear') {{
      let t = i1 === i0 ? 1 : clamp((val - i0) / (i1 - i0), 0, 1);
      if (ease === 'outExpo') t = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      else if (ease === 'outCubic') t = 1 - Math.pow(1 - t, 3);
      else if (ease === 'inOutCubic') t = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;
      return o0 + (o1 - o0) * t;
    }}

    function spring({{ frame, fps = 60, config = {{}} }}) {{
      const {{ mass = 1, stiffness = 140, damping = 14, overshootClamping = false }} = config;
      if (frame <= 0) return 0;
      const t = frame / fps;
      const w0 = Math.sqrt(stiffness / mass);
      const zeta = damping / (2 * Math.sqrt(stiffness * mass));
      let v = 1;
      if (zeta < 1) {{
        const wd = w0 * Math.sqrt(1 - zeta * zeta);
        v = 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t));
      }} else {{
        v = 1 - Math.exp(-w0 * t) * (1 + w0 * t);
      }}
      return overshootClamping ? clamp(v, 0, 1) : v;
    }}

    function bezier(t, p0, p1, p2, p3) {{
      const u = 1 - t;
      return {{
        x: u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x,
        y: u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y,
      }};
    }}

    // Bespoke crisp duotone geometric SVG icon library (inherits currentColor cleanly)
    function ico(name, stroke = 'currentColor', size = 24) {{
      const icons = {{
        clock: '<circle cx="12" cy="12" r="9" fill="currentColor" fill-opacity="0.16"/><circle cx="12" cy="12" r="9" fill="none"/><polyline points="12 7 12 12 15.5 14" fill="none"/>',
        trendDown: '<path d="M3 7 L9.5 13.5 L14 9 L21 16 L21 20 L3 20 Z" fill="currentColor" fill-opacity="0.15" stroke="none"/><polyline points="3 7 9.5 13.5 14 9 21 16" fill="none"/><polyline points="15 16 21 16 21 10" fill="none"/>',
        eyeOff: '<path d="M2 12 C4.8 7 8 5 12 5 C16 5 19.2 7 22 12 C19.2 17 16 19 12 19 C8 19 4.8 17 2 12 Z" fill="currentColor" fill-opacity="0.14" stroke="none"/><path d="M9.8 9.8 A3 3 0 0 1 14.2 14.2" fill="none"/><path d="M10.7 5.1 C11.1 5 11.6 5 12 5 C16 5 19.2 7 22 12 C21.1 13.5 20.1 14.8 19 15.9" fill="none"/><path d="M6.6 6.6 C4.7 8 3.2 9.9 2 12 C4.8 17 8 19 12 19 C13.7 19 15.2 18.6 16.6 17.9" fill="none"/><line x1="3" y1="3" x2="21" y2="21" fill="none"/>',
        users: '<circle cx="9" cy="8" r="3.5" fill="currentColor" fill-opacity="0.16"/><path d="M3 19 C3 15.8 5.7 14 9 14 C12.3 14 15 15.8 15 19" fill="currentColor" fill-opacity="0.14"/><circle cx="16.5" cy="9" r="2.6" fill="none"/><path d="M16.5 14.3 C18.9 14.7 21 16.3 21 19" fill="none"/>',
        barChart: '<rect x="3" y="13" width="4.5" height="7" rx="1.2" fill="currentColor" fill-opacity="0.18"/><rect x="9.75" y="9" width="4.5" height="11" rx="1.2" fill="currentColor" fill-opacity="0.18"/><rect x="16.5" y="4" width="4.5" height="16" rx="1.2" fill="currentColor" fill-opacity="0.24"/><line x1="2.5" y1="20.5" x2="21.5" y2="20.5" fill="none"/>',
        workflow: '<rect x="3" y="4" width="6.5" height="5.5" rx="1.5" fill="currentColor" fill-opacity="0.18"/><rect x="14.5" y="4" width="6.5" height="5.5" rx="1.5" fill="currentColor" fill-opacity="0.18"/><rect x="9" y="15" width="6.5" height="5.5" rx="1.5" fill="currentColor" fill-opacity="0.22"/><path d="M9.5 6.8 L14.5 6.8" fill="none"/><path d="M17.8 9.5 C17.8 12.6 15.5 17.8 15.5 17.8" fill="none"/>',
        layers: '<polygon points="12 3 21 7.5 12 12 3 7.5" fill="currentColor" fill-opacity="0.20"/><polyline points="3 12 12 16.5 21 12" fill="none"/><polyline points="3 16.5 12 21 21 16.5" fill="none"/>',
        sparkle: '<path d="M12 3 L14.1 9.1 L20.2 11.2 L14.1 13.3 L12 19.4 L9.9 13.3 L3.8 11.2 L9.9 9.1 Z" fill="currentColor" fill-opacity="0.18"/><circle cx="19" cy="5" r="1.3" fill="currentColor" stroke="none"/><circle cx="5.5" cy="18.5" r="1.1" fill="currentColor" stroke="none"/>',
        inbox: '<rect x="3" y="4" width="18" height="16" rx="3" fill="currentColor" fill-opacity="0.16"/><path d="M3 13 H8.2 L10 15.5 H14 L15.8 13 H21" fill="none"/><polyline points="9 8.5 12 11.5 15 8.5" fill="none"/><line x1="12" y1="6.5" x2="12" y2="11.5" fill="none"/>',
        zap: '<polygon points="13 2.5 5 13.5 11.5 13.5 10.5 21.5 19 10.5 12.5 10.5" fill="currentColor" fill-opacity="0.20"/>',
        userCheck: '<circle cx="9.5" cy="8" r="3.6" fill="currentColor" fill-opacity="0.16"/><path d="M3 19 C3 15.7 5.8 14 9.5 14 C13.2 14 16 15.7 16 19" fill="none"/><polyline points="16.5 11.5 18.5 13.5 22 9.5" fill="none"/>',
        radio: '<circle cx="12" cy="12" r="2.2" fill="currentColor" fill-opacity="0.30"/><path d="M7.5 16.5 A6.4 6.4 0 0 1 7.5 7.5" fill="none"/><path d="M16.5 7.5 A6.4 6.4 0 0 1 16.5 16.5" fill="none"/><path d="M4.5 19.5 A10.5 10.5 0 0 1 4.5 4.5" fill="none"/><path d="M19.5 4.5 A10.5 10.5 0 0 1 19.5 19.5" fill="none"/>',
        target: '<circle cx="12" cy="12" r="9" fill="currentColor" fill-opacity="0.12"/><circle cx="12" cy="12" r="5.5" fill="currentColor" fill-opacity="0.12"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/>',
        trendUp: '<path d="M3 17 L9.5 10.5 L13.8 14.5 L21 7 L21 20 L3 20 Z" fill="currentColor" fill-opacity="0.15" stroke="none"/><polyline points="3 17 9.5 10.5 13.8 14.5 21 7" fill="none"/><polyline points="15.5 7 21 7 21 12.5" fill="none"/>',
        loop: '<path d="M17 4 L20.5 7.5 L17 11" fill="none"/><path d="M4 11 V9.5 A3 3 0 0 1 7 6.5 H20" fill="none"/><path d="M7 20 L3.5 16.5 L7 13" fill="none"/><path d="M20 13 V14.5 A3 3 0 0 1 17 17.5 H4" fill="none"/>',
        fileForm: '<rect x="4" y="3" width="16" height="18" rx="2.5" fill="currentColor" fill-opacity="0.14"/><line x1="8" y1="8.5" x2="16" y2="8.5" fill="none"/><line x1="8" y1="12.5" x2="16" y2="12.5" fill="none"/><line x1="8" y1="16.5" x2="12.5" y2="16.5" fill="none"/>',
        branch: '<circle cx="6" cy="6" r="2.5" fill="currentColor" fill-opacity="0.22"/><circle cx="18" cy="7.5" r="2.5" fill="currentColor" fill-opacity="0.22"/><circle cx="18" cy="17.5" r="2.5" fill="currentColor" fill-opacity="0.22"/><path d="M6 8.5 V14.5 A3 3 0 0 0 9 17.5 H15.5" fill="none"/><path d="M6 12 C9 12 10 7.5 15.5 7.5" fill="none"/>',
        bag: '<path d="M5.5 8 H18.5 L19.8 20 H4.2 Z" fill="currentColor" fill-opacity="0.16"/><path d="M8.5 8 V6.5 A3.5 3.5 0 0 1 15.5 6.5 V8" fill="none"/>',
        kanban: '<rect x="3" y="4" width="18" height="16" rx="2.5" fill="currentColor" fill-opacity="0.12"/><rect x="6" y="7.5" width="3.5" height="9" rx="1" fill="currentColor" fill-opacity="0.22"/><rect x="10.8" y="7.5" width="3.5" height="6" rx="1" fill="currentColor" fill-opacity="0.22"/><rect x="15.5" y="7.5" width="3" height="10" rx="1" fill="currentColor" fill-opacity="0.22"/>',
        checkDoc: '<rect x="4.5" y="3" width="15" height="18" rx="2.5" fill="currentColor" fill-opacity="0.14"/><polyline points="8.5 12.5 11 15 16 9.5" fill="none"/>',
        wallet: '<rect x="3" y="6" width="18" height="13" rx="2.5" fill="currentColor" fill-opacity="0.16"/><path d="M16 12.5 H21 V14.5 H16 A1 1 0 0 1 16 12.5 Z" fill="none"/><path d="M6 6 V5 A2 2 0 0 1 8 3 H17" fill="none"/>',
        shield: '<path d="M12 3 L19.5 6 V11.5 C19.5 16.3 16.2 19.7 12 21 C7.8 19.7 4.5 16.3 4.5 11.5 V6 Z" fill="currentColor" fill-opacity="0.18"/><polyline points="9 12 11.2 14.2 15.5 9.8" fill="none"/>',
        check: '<polyline points="5 12.5 9.5 17 19 7.5" fill="none"/>',
        arrowRight: '<line x1="5" y1="12" x2="19" y2="12" fill="none"/><polyline points="13 6 19 12 13 18" fill="none"/>',
      }};
      const colorAttr = stroke === 'currentColor' ? '' : `color:${{stroke}};`;
      return `<svg width="${{size}}" height="${{size}}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0;${{colorAttr}}">${{icons[name] || ''}}</svg>`;
    }}

    // Clean chapter labels (ONLY Scene 2 is Cobalt dark, ALL other 9 scenes are Bright Daylight!)
    const SCENES_META = [
      {{ code: 'NỖI ĐAU', start: 0, end: 266, dark: false, outro: false }},
      {{ code: 'HỆ SINH THÁI', start: 244, end: 524, dark: true, outro: false }},
      {{ code: 'AUTO CHIA DATA', start: 502, end: 782, dark: false, outro: false }},
      {{ code: 'VÒNG LẶP CAPI', start: 760, end: 1064, dark: false, outro: false }},
      {{ code: 'CRM 360°', start: 1042, end: 1322, dark: false, outro: false }},
      {{ code: 'REPORT BI', start: 1300, end: 1580, dark: false, outro: false }},
      {{ code: 'AUTOMATION AI', start: 1558, end: 1862, dark: false, outro: false }},
      {{ code: 'ERP 5.0', start: 1840, end: 2120, dark: false, outro: false }},
      {{ code: 'MULTI-AGENT AI', start: 2098, end: 2378, dark: false, outro: false }},
      {{ code: '', start: 2356, end: 2640, dark: false, outro: true }},
    ];

    const LOOP_CARDS = [
      {{ icon: 'inbox', tag: 'TIẾP NHẬN', t: 'Thu Lead Đa Kênh', sub: 'Gom đa nguồn, lọc trùng ngay', x: 30, y: 10, c: '#1E40FF', tint: '#EEF2FF' }},
      {{ icon: 'zap', tag: 'CHIA SALE', t: 'Chia Sale < 3 Giây', sub: 'Báo Zalo ngay & chống ôm số', x: 414, y: 10, c: '#0284C7', tint: '#E0F2FE' }},
      {{ icon: 'userCheck', tag: 'PHÂN LOẠI', t: 'Chăm Sóc & Gắn Thẻ', sub: 'Tách bạch khách nét với số rác', x: 798, y: 10, c: '#059669', tint: '#ECFDF5' }},
      {{ icon: 'radio', tag: 'BẮN CAPI', t: 'Bắn Tín Hiệu CAPI', sub: 'Gửi kết quả chốt thực về Meta', x: 798, y: 312, c: '#4F46E5', tint: '#EEF2FF' }},
      {{ icon: 'target', tag: 'HỌC TỆP', t: 'Quảng Cáo Tự Học Tệp', sub: 'Tìm người mua thật, né tệp rác', x: 414, y: 312, c: '#7C3AED', tint: '#F5F3FF' }},
      {{ icon: 'trendUp', tag: 'TĂNG TRƯỞNG', t: 'Giảm Chi Phí • Tăng Chốt', sub: 'Khách về nét hơn sau mỗi vòng', x: 30, y: 312, c: '#0D9488', tint: '#F0FDFA' }},
    ];

    const stage = document.getElementById('stage');

    stage.innerHTML = `
      <!-- ════════════════════ SCENE 1: NỖI ĐAU (BRIGHT IVORY) ════════════════════ -->
      <section id="sc-0" class="scene bg-ivory" style="color:#0B1120;">
        <div style="width:100%;height:100%;padding:96px 56px 56px;display:grid;grid-template-columns:1.05fr 0.95fr;gap:38px;align-items:center;">
          <div>
            <div class="line-clip"><div id="s1-h1" style="font-size:66px;font-weight:900;line-height:1.08;letter-spacing:-0.03em;color:#0B1120;">Dữ Liệu Rời Rạc</div></div>
            <div class="line-clip" style="margin-bottom:18px;"><div id="s1-h2" style="font-size:64px;font-weight:900;line-height:1.08;letter-spacing:-0.03em;color:#DC2626;">Mất 60% Khách</div></div>
            <div id="s1-bar" style="width:78px;height:5px;border-radius:99px;background:#DC2626;margin-bottom:20px;transform-origin:left;"></div>
            <p id="s1-desc" style="font-size:24px;font-weight:500;line-height:1.45;color:#334155;max-width:560px;margin-bottom:26px;">
              Mỗi bộ phận một bảng tính rời khiến khách chờ lâu và thất thoát doanh thu.
            </p>
            <div id="s1-strip" class="nowrap-row" style="gap:20px;padding-top:16px;border-top:1px solid rgba(15,23,42,0.14);">
              <span style="font-size:20px;font-weight:800;color:#DC2626;">Chậm phản hồi</span>
              <span style="width:1px;height:20px;background:rgba(15,23,42,0.22);"></span>
              <span style="font-size:20px;font-weight:700;color:#334155;">Thất thoát cơ hội mỗi ngày</span>
            </div>
          </div>

          <div style="position:relative;height:430px;">
            ${{[
              {{ id: 's1-v0', icon: 'clock', tint: '#FEF2F2', bdr: 'rgba(220,38,38,0.18)', num: '45 Phút', txt: 'Khách phải chờ phản hồi', mw: 175, top: 14, right: 16, c: '#DC2626' }},
              {{ id: 's1-v1', icon: 'trendDown', tint: '#FFF7ED', bdr: 'rgba(234,88,12,0.18)', num: '-60%', txt: 'Cơ hội rơi vào đối thủ', mw: 155, top: 150, right: 50, c: '#EA580C' }},
              {{ id: 's1-v2', icon: 'eyeOff', tint: '#F1F5F9', bdr: 'rgba(51,65,85,0.16)', num: 'Mù Số', txt: 'Không rõ lãi lỗ từng kênh', mw: 170, top: 286, right: 10, c: '#0B1120' }},
            ].map((item, i) => `
              <div id="s1-card-${{i}}" class="lux-card" style="position:absolute;top:${{item.top}}px;right:${{item.right}}px;width:490px;padding:22px 26px;border-radius:22px;display:flex;align-items:center;justify-content:space-between;gap:16px;">
                <div style="display:flex;align-items:center;gap:16px;">
                  <div class="ico-box" style="width:54px;height:54px;background:${{item.tint}};border:1px solid ${{item.bdr}};color:${{item.c}};">
                    ${{ico(item.icon, 'currentColor', 26)}}
                  </div>
                  <div id="${{item.id}}" class="tabular" style="font-size:40px;font-weight:900;color:${{item.c}};letter-spacing:-0.03em;white-space:nowrap;">${{item.num}}</div>
                </div>
                <div style="font-size:19px;font-weight:700;color:#334155;text-align:right;line-height:1.28;max-width:${{item.mw}}px;">${{item.txt}}</div>
              </div>
            `).join('')}}
          </div>
        </div>
      </section>

      <!-- ════════════════════ SCENE 2: HỆ SINH THÁI DOMATION.NET (SIGNATURE ROYAL COBALT) ════════════════════ -->
      <section id="sc-1" class="scene" style="background:linear-gradient(145deg,#1E40FF 0%,#1432C8 60%,#0E239A 100%);color:#FFFFFF;">
        <div style="width:100%;height:100%;padding:88px 56px 52px;display:flex;flex-direction:column;justify-content:space-between;align-items:center;">
          <div style="text-align:center;display:flex;flex-direction:column;align-items:center;">
            <div id="s2-brand" style="display:inline-flex;align-items:center;gap:18px;margin-bottom:10px;">
              <img src="${{A.logo_uri}}" style="width:72px;height:72px;border-radius:17px;box-shadow:0 16px 36px rgba(0,0,0,0.28);" />
              <div style="font-size:56px;font-weight:900;letter-spacing:-0.025em;line-height:1;">
                <span style="color:#FFFFFF;">DOMATION</span><span style="color:#22D3EE;">.NET</span>
              </div>
            </div>
            <div class="line-clip">
              <div id="s2-sub" style="font-size:38px;font-weight:800;letter-spacing:-0.02em;color:#E0F2FE;">Hệ Sinh Thái Vận Hành AI 5.0</div>
            </div>
          </div>

          <div style="position:relative;width:1168px;height:395px;">
            <svg width="1168" height="395" viewBox="0 0 1168 395" style="position:absolute;inset:0;pointer-events:none;">
              <path d="M 110 210 Q 584 18 1058 210" fill="none" stroke="rgba(255,255,255,0.44)" stroke-width="2.5" stroke-dasharray="10 8" />
              <circle id="s2-bead-0" cx="0" cy="0" r="7" fill="#22D3EE" />
              <circle id="s2-bead-1" cx="0" cy="0" r="7" fill="#FFFFFF" />
              <circle id="s2-bead-2" cx="0" cy="0" r="5" fill="#67E8F9" />
            </svg>

            <img id="s2-mascot" src="${{A.m_dom1}}" style="position:absolute;left:50%;bottom:0px;width:210px;height:210px;margin-left:-105px;object-fit:contain;filter:drop-shadow(0 24px 36px rgba(0,0,0,0.34));z-index:4;" />

            ${{[
              {{ icon: 'users', c: '#1E40FF', tint: '#EEF2FF', t: 'CRM 360°', sub: 'Quản lý khách hàng', x: 4, y: 158 }},
              {{ icon: 'barChart', c: '#0284C7', tint: '#E0F2FE', t: 'Report BI', sub: 'Báo cáo doanh thu', x: 239, y: 56 }},
              {{ icon: 'workflow', c: '#4F46E5', tint: '#EEF2FF', t: 'Automation', sub: 'Chăm sóc tự động', x: 474, y: 0 }},
              {{ icon: 'layers', c: '#059669', tint: '#ECFDF5', t: 'ERP 5.0', sub: 'Vận hành đồng bộ', x: 709, y: 56 }},
              {{ icon: 'sparkle', c: '#7C3AED', tint: '#F5F3FF', t: 'Multi-Agent', sub: 'Trợ lý AI đa nhiệm', x: 944, y: 158 }},
            ].map((p, i) => `
              <div id="s2-p-${{i}}" class="lux-card" style="position:absolute;left:${{p.x}}px;top:${{p.y}}px;width:220px;padding:18px 18px;border-radius:20px;z-index:3;">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                  <div class="ico-box" style="width:42px;height:42px;border-radius:12px;background:${{p.tint}};color:${{p.c}};">
                    ${{ico(p.icon, 'currentColor', 21)}}
                  </div>
                  <div style="flex:1;height:4px;border-radius:99px;background:linear-gradient(90deg,${{p.c}},#06B6D4);opacity:0.45;"></div>
                </div>
                <div style="font-size:22px;font-weight:900;color:#0B1120;margin-bottom:4px;white-space:nowrap;">${{p.t}}</div>
                <div style="font-size:18px;font-weight:600;color:#475569;white-space:nowrap;">${{p.sub}}</div>
              </div>
            `).join('')}}
          </div>
        </div>
      </section>

      <!-- ════════════════════ SCENE 3: AUTO CHIA DATA (STACKED DECK - BRIGHT IVORY-BLUE) ════════════════════ -->
      <section id="sc-2" class="scene bg-ivory-blue" style="color:#0B1120;">
        <div style="width:100%;height:100%;padding:96px 56px 56px;display:grid;grid-template-columns:1.08fr 0.92fr;gap:38px;align-items:center;">
          <div>
            <div class="line-clip"><div id="s3-h1" style="font-size:66px;font-weight:900;line-height:1.08;letter-spacing:-0.03em;color:#0B1120;">Auto Chia Data</div></div>
            <div class="line-clip" style="margin-bottom:18px;"><div id="s3-h2" style="font-size:62px;font-weight:900;line-height:1.08;letter-spacing:-0.03em;color:#1E40FF;">Tức Thì Đa Kênh</div></div>
            <div id="s3-bar" style="width:78px;height:5px;border-radius:99px;background:linear-gradient(90deg,#1E40FF,#06B6D4);margin-bottom:20px;transform-origin:left;"></div>
            <p id="s3-desc" style="font-size:24px;font-weight:500;line-height:1.45;color:#334155;max-width:560px;margin-bottom:26px;">
              Khách vừa để lại thông tin là chuyển ngay đến đúng nhân viên phụ trách.
            </p>
            <div class="nowrap-row" style="gap:14px;">
              <div style="padding:13px 22px;border-radius:14px;background:#1E40FF;color:#FFFFFF;font-size:19px;font-weight:800;white-space:nowrap;display:inline-flex;align-items:center;gap:10px;box-shadow:0 12px 26px rgba(30,64,255,0.24);">
                ${{ico('zap', '#FFFFFF', 20)}}
                <span>PHẢN HỒI &lt; 3 GIÂY</span>
              </div>
              <div class="lux-card" style="padding:13px 22px;border-radius:14px;color:#0B1120;font-size:19px;font-weight:800;white-space:nowrap;display:inline-flex;align-items:center;gap:10px;">
                ${{ico('shield', '#059669', 20)}}
                <span>LỌC TRÙNG TỰ ĐỘNG</span>
              </div>
            </div>
          </div>

          <div style="position:relative;height:445px;display:flex;align-items:center;justify-content:center;">
            <svg width="520" height="445" viewBox="0 0 520 445" style="position:absolute;inset:0;pointer-events:none;">
              <path d="M 78 82 L 175 180" fill="none" stroke="rgba(30,64,255,0.28)" stroke-width="2.5" stroke-dasharray="6 6" />
              <path d="M 54 222 L 175 222" fill="none" stroke="rgba(2,132,199,0.28)" stroke-width="2.5" stroke-dasharray="6 6" />
              <path d="M 78 362 L 175 264" fill="none" stroke="rgba(5,150,105,0.28)" stroke-width="2.5" stroke-dasharray="6 6" />
              <circle id="s3-sig-0" cx="0" cy="0" r="6" fill="#1E40FF" />
              <circle id="s3-sig-1" cx="0" cy="0" r="6" fill="#0284C7" />
              <circle id="s3-sig-2" cx="0" cy="0" r="6" fill="#059669" />
            </svg>

            <div id="s3-deck-wrap" style="position:relative;width:356px;height:356px;">
              <div id="s3-back-2" class="lux-card" style="position:absolute;inset:0;border-radius:30px;"></div>
              <div id="s3-back-1" class="lux-card" style="position:absolute;inset:0;border-radius:30px;"></div>
              <div id="s3-front" style="position:relative;width:356px;height:356px;border-radius:30px;overflow:hidden;box-shadow:0 28px 58px -16px rgba(15,23,42,0.24);display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:3px;background:#FFFFFF;border:1px solid rgba(255,255,255,0.65);">
                <div style="background:linear-gradient(135deg,#1E40FF,#2563EB);"></div>
                <div style="background:linear-gradient(135deg,#2563EB,#0284C7);"></div>
                <div style="background:linear-gradient(135deg,#0284C7,#06B6D4);"></div>
                <div style="background:#102A7A;"></div>
              </div>
              <img id="s3-mascot" src="${{A.m_sales}}" style="position:absolute;left:50%;top:48%;width:348px;height:348px;transform:translate(-50%,-50%);object-fit:contain;filter:drop-shadow(0 24px 34px rgba(15,23,42,0.28));z-index:5;" />
            </div>

            <div id="s3-i0" class="lux-card" style="position:absolute;left:12px;top:46px;width:74px;height:74px;border-radius:18px;display:flex;align-items:center;justify-content:center;">
              <img src="${{A.ico_meta}}" style="width:42px;height:42px;" />
            </div>
            <div id="s3-i1" class="lux-card" style="position:absolute;left:-2px;top:185px;width:74px;height:74px;border-radius:18px;display:flex;align-items:center;justify-content:center;">
              <img src="${{A.ico_zalo}}" style="width:42px;height:42px;border-radius:10px;" />
            </div>
            <div id="s3-i2" class="lux-card" style="position:absolute;left:12px;bottom:46px;width:74px;height:74px;border-radius:18px;display:flex;align-items:center;justify-content:center;">
              <img src="${{A.ico_sheets}}" style="width:42px;height:42px;" />
            </div>
          </div>
        </div>
      </section>

      <!-- ════════════════════ SCENE 4: VÒNG LẶP 6 CARD CAPI (BRIGHT PEARL DAYLIGHT) ════════════════════ -->
      <section id="sc-3" class="scene bg-pearl" style="color:#0B1120;">
        <div style="width:100%;height:100%;padding:84px 52px 42px;display:flex;flex-direction:column;justify-content:space-between;align-items:center;">
          <div style="text-align:center;">
            <div class="line-clip"><div id="s4loop-h1" style="font-size:52px;font-weight:900;line-height:1.08;letter-spacing:-0.03em;color:#0B1120;">Vòng Lặp Tăng Trưởng Khép Kín</div></div>
            <div style="font-size:22px;font-weight:700;color:#1E40FF;margin-top:2px;">Chia Sale Tức Thì • Học Tệp Khách Nét • Bắn Tín Hiệu CAPI</div>
          </div>

          <div style="position:relative;width:1176px;height:474px;">
            <svg width="1176" height="474" viewBox="0 0 1176 474" style="position:absolute;inset:0;pointer-events:none;z-index:1;">
              <rect x="24" y="88" width="1128" height="298" rx="46" fill="none" stroke="rgba(30,64,255,0.22)" stroke-width="3" stroke-dasharray="9 7" />
              <polygon points="390,79 406,88 390,97" fill="#1E40FF" />
              <polygon points="772,79 788,88 772,97" fill="#06B6D4" />
              <polygon points="1143,228 1161,228 1152,244" fill="#1E40FF" />
              <polygon points="786,377 770,386 786,395" fill="#4F46E5" />
              <polygon points="402,377 386,386 402,395" fill="#06B6D4" />
              <polygon points="15,244 33,244 24,228" fill="#0D9488" />
              ${{[0, 1, 2, 3, 4, 5].map((i) => `<circle id="s4loop-pkt-${{i}}" cx="0" cy="0" r="${{i % 2 === 0 ? 7 : 5}}" fill="${{i % 2 === 0 ? '#1E40FF' : '#06B6D4'}}" />`).join('')}}
            </svg>

            <div class="lux-card" style="position:absolute;left:50%;top:204px;transform:translateX(-50%);padding:11px 26px;border-radius:999px;border:1.5px solid rgba(30,64,255,0.20);display:flex;align-items:center;gap:14px;z-index:2;white-space:nowrap;">
              <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#1E40FF,#06B6D4);color:#FFFFFF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                ${{ico('loop', '#FFFFFF', 20)}}
              </div>
              <span style="font-size:20px;font-weight:900;color:#0B1120;letter-spacing:-0.01em;">VÒNG LẶP KHÉP KÍN • TỰ TỐI ƯU 24/7</span>
            </div>

            ${{LOOP_CARDS.map((card, i) => `
              <div id="s4loop-c-${{i}}" class="lux-card" style="position:absolute;left:${{card.x}}px;top:${{card.y}}px;width:348px;height:150px;border-radius:22px;padding:18px 20px;display:flex;flex-direction:column;justify-content:center;z-index:3;">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                  <div id="s4loop-ico-${{i}}" class="ico-box" style="width:44px;height:44px;background:${{card.tint}};color:${{card.c}};">
                    ${{ico(card.icon, 'currentColor', 22)}}
                  </div>
                  <div style="font-size:18px;font-weight:800;color:${{card.c}};background:${{card.tint}};padding:4px 12px;border-radius:9px;letter-spacing:0.01em;white-space:nowrap;">${{card.tag}}</div>
                </div>
                <div style="font-size:22px;font-weight:900;color:#0B1120;line-height:1.15;white-space:nowrap;margin-bottom:4px;">${{card.t}}</div>
                <div style="font-size:18px;font-weight:500;color:#475569;line-height:1.25;white-space:nowrap;">${{card.sub}}</div>
              </div>
            `).join('')}}
          </div>
        </div>
      </section>

      <!-- ════════════════════ SCENE 5: CRM 360° (BRIGHT ICE) ════════════════════ -->
      <section id="sc-4" class="scene bg-ice" style="color:#0B1120;">
        <div style="width:100%;height:100%;padding:96px 56px 56px;display:grid;grid-template-columns:0.96fr 1.04fr;gap:46px;align-items:center;">
          <div style="position:relative;">
            <div class="lux-card" style="position:absolute;inset:0;border-radius:24px;transform:translate(-12px,14px) rotate(-1.5deg);opacity:0.65;"></div>
            <div id="s4-sheet" class="lux-card" style="position:relative;border-radius:24px;padding:30px 32px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;">
                <div style="font-size:24px;font-weight:900;color:#0B1120;">Hành Trình Khách Hàng</div>
                <div style="font-size:19px;font-weight:800;color:#059669;">100% Rõ Ràng</div>
              </div>
              <div style="display:flex;flex-direction:column;gap:12px;">
                ${{[
                  {{ label: 'Tiếp Nhận Yêu Cầu', stat: 'Tự động gán nguồn' }},
                  {{ label: 'Tư Vấn & Theo Dõi', stat: 'Lưu đủ lịch sử' }},
                  {{ label: 'Chốt Đơn & Đối Soát', stat: 'Rõ từng giao dịch' }},
                  {{ label: 'Chăm Sóc Dài Hạn', stat: 'Tăng tỷ lệ quay lại' }},
                ].map((r, i) => `
                  <div id="s4-row-${{i}}" style="padding:14px 18px;border-radius:15px;background:#F8FAFC;border:1px solid rgba(15,23,42,0.08);display:flex;align-items:center;justify-content:space-between;gap:14px;">
                    <div style="display:flex;align-items:center;gap:14px;">
                      <div id="s4-num-${{i}}" style="width:34px;height:34px;border-radius:10px;background:#E2E8F0;color:#475569;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        ${{ico('arrowRight', 'currentColor', 18)}}
                      </div>
                      <div style="font-size:21px;font-weight:800;color:#0B1120;white-space:nowrap;">${{r.label}}</div>
                    </div>
                    <div style="font-size:18px;font-weight:600;color:#64748B;white-space:nowrap;">${{r.stat}}</div>
                  </div>
                `).join('')}}
              </div>
            </div>
          </div>

          <div>
            <div class="line-clip"><div id="s4-h1" style="font-size:70px;font-weight:900;line-height:1.08;letter-spacing:-0.03em;color:#0B1120;">CRM 360°</div></div>
            <div class="line-clip" style="margin-bottom:16px;"><div id="s4-h2" style="font-size:52px;font-weight:900;line-height:1.08;letter-spacing:-0.03em;white-space:nowrap;color:#1E40FF;">Chốt Đơn Tập Trung</div></div>
            <div id="s4-bar" style="width:78px;height:5px;border-radius:99px;background:linear-gradient(90deg,#1E40FF,#06B6D4);margin-bottom:18px;transform-origin:left;"></div>
            <p id="s4-desc" style="font-size:24px;font-weight:500;line-height:1.45;color:#334155;max-width:560px;margin-bottom:22px;">
              Lưu trọn hành trình khách hàng, bám sát tiến độ bán hàng &amp; đối soát tự động.
            </p>
            <div class="lux-card nowrap-row" style="gap:20px;margin-bottom:16px;padding:12px 20px;border-radius:14px;border-color:rgba(30,64,255,0.16);width:fit-content;">
              <span style="font-size:19px;font-weight:800;color:#1E40FF;display:inline-flex;align-items:center;gap:8px;">${{ico('check', '#1E40FF', 20)}} Hồ sơ tập trung</span>
              <span style="width:1px;height:18px;background:rgba(15,23,42,0.16);"></span>
              <span style="font-size:19px;font-weight:800;color:#0B1120;display:inline-flex;align-items:center;gap:8px;">${{ico('check', '#059669', 20)}} Không bỏ sót khách</span>
            </div>
            <div style="display:flex;align-items:center;gap:24px;">
              <img id="s4-mascot" src="${{A.m_dom4}}" style="width:196px;height:196px;object-fit:contain;filter:drop-shadow(0 18px 28px rgba(15,23,42,0.18));" />
              <div style="border-left:3px solid #1E40FF;padding-left:18px;">
                <div style="font-size:38px;font-weight:900;color:#1E40FF;line-height:1;">100%</div>
                <div style="font-size:19px;font-weight:700;color:#334155;margin-top:4px;white-space:nowrap;">Minh bạch doanh số</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ════════════════════ SCENE 6: REPORT BI (BRIGHT PEARL) ════════════════════ -->
      <section id="sc-5" class="scene bg-pearl" style="color:#0B1120;">
        <div style="width:100%;height:100%;padding:96px 56px 56px;display:grid;grid-template-columns:0.94fr 1.06fr;gap:42px;align-items:center;">
          <div>
            <div class="line-clip"><div id="s5-h1" style="font-size:70px;font-weight:900;line-height:1.08;letter-spacing:-0.03em;color:#0B1120;">Report BI</div></div>
            <div class="line-clip" style="margin-bottom:16px;"><div id="s5-h2" style="font-size:48px;font-weight:900;line-height:1.08;letter-spacing:-0.03em;white-space:nowrap;color:#1E40FF;">Rõ Từng Đồng Lời Lỗ</div></div>
            <div id="s5-bar" style="width:78px;height:5px;border-radius:99px;background:linear-gradient(90deg,#1E40FF,#06B6D4);margin-bottom:18px;transform-origin:left;"></div>
            <p style="font-size:24px;font-weight:500;line-height:1.45;color:#334155;max-width:520px;margin-bottom:20px;">
              Kết nối chi phí quảng cáo với doanh thu thực trên một bảng điều khiển duy nhất.
            </p>
            <div class="lux-card nowrap-row" style="gap:16px;padding:12px 20px;border-radius:14px;width:fit-content;margin-bottom:16px;">
              <span style="display:inline-flex;align-items:center;gap:8px;font-size:19px;font-weight:800;color:#1E40FF;">${{ico('barChart', '#1E40FF', 20)}} Cập nhật tức thì</span>
              <span style="width:1px;height:18px;background:rgba(15,23,42,0.16);"></span>
              <span style="font-size:19px;font-weight:700;color:#0B1120;">So sánh từng kênh</span>
            </div>
            <div style="display:flex;align-items:center;gap:22px;">
              <img id="s5-mascot" src="${{A.m_mkt}}" style="width:192px;height:192px;object-fit:contain;filter:drop-shadow(0 18px 28px rgba(30,64,255,0.18));" />
              <div style="border-left:3px solid #059669;padding-left:18px;">
                <div style="font-size:38px;font-weight:900;color:#059669;line-height:1;" class="tabular" id="s5-waste">-35%</div>
                <div style="font-size:19px;font-weight:700;color:#334155;margin-top:4px;white-space:nowrap;">Ngân sách lãng phí</div>
              </div>
            </div>
          </div>

          <div style="position:relative;">
            <div class="lux-card" style="position:relative;border-radius:26px;padding:28px 32px;color:#0B1120;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
                <div style="display:flex;align-items:center;gap:12px;">
                  <div class="ico-box" style="width:44px;height:44px;background:#EEF2FF;color:#1E40FF;">
                    ${{ico('barChart', '#1E40FF', 22)}}
                  </div>
                  <div style="font-size:21px;font-weight:800;color:#334155;">HIỆU QUẢ KINH DOANH</div>
                </div>
                <div id="s5-roas" class="tabular" style="font-size:56px;font-weight:900;color:#1E40FF;line-height:1;">6.8x</div>
              </div>

              <svg width="540" height="220" viewBox="0 0 540 220" style="width:100%;height:auto;margin-bottom:16px;overflow:visible;">
                <defs>
                  <linearGradient id="s5Fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#1E40FF" stop-opacity="0.18" />
                    <stop offset="100%" stop-color="#1E40FF" stop-opacity="0.01" />
                  </linearGradient>
                </defs>
                ${{[60, 86, 112, 138, 162, 184, 204].map((h, i) => `
                  <rect id="s5-bar-${{i}}" x="${{20 + i * 74}}" y="${{210 - h}}" width="42" height="${{h}}" rx="8" fill="${{i >= 5 ? '#B8D2FF' : '#DCE8FF'}}" />
                `).join('')}}
                <path id="s5-area" d="M 41 178 C 120 158, 205 130, 290 98 C 375 68, 445 38, 505 20 L 505 210 L 41 210 Z" fill="url(#s5Fill)" />
                <path id="s5-line" d="M 41 178 C 195 142, 355 76, 505 20" fill="none" stroke="#1E40FF" stroke-width="6.5" stroke-linecap="round" stroke-dasharray="560" stroke-dashoffset="560" />
                <circle id="s5-ring" cx="505" cy="20" r="16" fill="none" stroke="#06B6D4" stroke-width="3" opacity="0" />
                <circle id="s5-dot" cx="41" cy="178" r="10" fill="#06B6D4" stroke="#FFFFFF" stroke-width="4" />
              </svg>

              <div class="nowrap-row" style="justify-content:space-between;padding-top:16px;border-top:1px solid #E2E8F0;">
                <div style="font-size:21px;font-weight:800;color:#059669;">Hiệu suất từng chiến dịch</div>
                <div style="font-size:21px;font-weight:800;color:#0B1120;">Báo Cáo 24/7</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ════════════════════ SCENE 7: AUTOMATION AI (5-NODE BRANCHING FLOW - BRIGHT ICE DAYLIGHT) ════════════════════ -->
      <section id="sc-6" class="scene bg-ice" style="color:#0B1120;">
        <div style="width:100%;height:100%;padding:88px 56px 48px;display:flex;flex-direction:column;justify-content:space-between;">
          <div>
            <div class="line-clip"><div id="s6-h1" style="font-size:62px;font-weight:900;line-height:1.06;letter-spacing:-0.03em;color:#0B1120;">Automation AI</div></div>
            <div class="line-clip"><div id="s6-h2" style="font-size:34px;font-weight:800;line-height:1.15;letter-spacing:-0.02em;color:#1E40FF;">Kịch Bản Chăm Sóc Riêng Từng Khách — Rẽ Nhánh Đa Kênh</div></div>
          </div>

          <div style="position:relative;width:1168px;height:396px;">
            <svg width="1168" height="396" viewBox="0 0 1168 396" style="position:absolute;inset:0;pointer-events:none;z-index:1;">
              <path d="M 242 85 L 288 85" fill="none" stroke="rgba(30,64,255,0.34)" stroke-width="3.5" stroke-dasharray="8 6" />
              <path d="M 544 85 C 572 85, 566 196, 590 196" fill="none" stroke="rgba(30,64,255,0.34)" stroke-width="3.5" stroke-dasharray="8 6" />
              <path d="M 820 168 C 844 168, 838 89, 862 89" fill="none" stroke="#0284C7" stroke-width="3.5" />
              <path d="M 820 224 C 844 224, 838 291, 862 291" fill="none" stroke="#1E40FF" stroke-width="3.5" />
              ${{[0, 1, 2, 3].map((i) => `<circle id="s6-b${{i}}" cx="0" cy="0" r="7" fill="${{i === 2 ? '#0284C7' : '#1E40FF'}}" />`).join('')}}
            </svg>

            <div id="s6-n0" class="lux-card" style="position:absolute;left:0px;top:14px;width:242px;height:142px;border-radius:22px;padding:18px 20px;display:flex;flex-direction:column;justify-content:center;z-index:2;">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                <div class="ico-box" style="width:36px;height:36px;border-radius:10px;background:#EEF2FF;color:#1E40FF;">
                  ${{ico('fileForm', '#1E40FF', 19)}}
                </div>
                <span style="font-size:18px;font-weight:800;color:#1E40FF;white-space:nowrap;">KÍCH HOẠT</span>
              </div>
              <div style="font-size:23px;font-weight:900;color:#0B1120;line-height:1.15;margin-bottom:4px;white-space:nowrap;">Đăng Ký Form</div>
              <div style="font-size:18px;font-weight:500;color:#475569;white-space:nowrap;">Nhận thông tin mới</div>
            </div>

            <div id="s6-n1" class="lux-card" style="position:absolute;left:288px;top:14px;width:256px;height:142px;border-radius:22px;padding:18px 20px;display:flex;flex-direction:column;justify-content:center;z-index:2;">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                <div style="width:36px;height:36px;border-radius:10px;background:#FFFFFF;border:1px solid #E2E8F0;display:flex;align-items:center;justify-content:center;padding:5px;flex-shrink:0;">
                  <img src="${{A.ico_gmail}}" style="width:100%;height:100%;object-fit:contain;" />
                </div>
                <span style="font-size:18px;font-weight:800;color:#DC2626;white-space:nowrap;">GỬI NGAY</span>
              </div>
              <div style="font-size:23px;font-weight:900;color:#0B1120;line-height:1.15;margin-bottom:4px;white-space:nowrap;">Gửi Email Chào</div>
              <div style="font-size:18px;font-weight:500;color:#475569;white-space:nowrap;">Tài liệu theo nhu cầu</div>
            </div>

            <div id="s6-n2" style="position:absolute;left:590px;top:118px;width:230px;height:156px;border-radius:22px;background:linear-gradient(180deg,#EEF4FF 0%,#E0ECFF 100%);border:1.5px solid rgba(30,64,255,0.34);color:#0B1120;padding:18px 20px;box-shadow:0 20px 44px -10px rgba(30,64,255,0.20),inset 0 1px 0 rgba(255,255,255,0.95);display:flex;flex-direction:column;justify-content:center;z-index:3;">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                <div class="ico-box" style="width:36px;height:36px;border-radius:10px;background:#1E40FF;color:#FFFFFF;">
                  ${{ico('branch', '#FFFFFF', 19)}}
                </div>
                <span style="font-size:18px;font-weight:800;color:#1E40FF;white-space:nowrap;">CHỜ 10 PHÚT</span>
              </div>
              <div style="font-size:24px;font-weight:900;line-height:1.15;margin-bottom:5px;color:#0B1120;">Rẽ Nhánh Tự Động</div>
              <div style="font-size:18px;font-weight:600;color:#334155;">Kiểm tra tương tác</div>
            </div>

            <div id="s6-n3" class="lux-card" style="position:absolute;right:0px;top:8px;width:306px;height:162px;border-radius:22px;padding:18px 22px;display:flex;flex-direction:column;justify-content:center;z-index:2;">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                <div style="width:38px;height:38px;border-radius:10px;background:#FFFFFF;border:1px solid #E2E8F0;display:flex;align-items:center;justify-content:center;padding:4px;flex-shrink:0;">
                  <img src="${{A.ico_zalo}}" style="width:100%;height:100%;object-fit:contain;border-radius:6px;" />
                </div>
                <span style="font-size:18px;font-weight:800;color:#0284C7;white-space:nowrap;">NHÁNH ĐÃ MỞ MAIL</span>
              </div>
              <div style="font-size:26px;font-weight:900;color:#0B1120;line-height:1.15;margin-bottom:6px;white-space:nowrap;">Gửi Zalo ZNS</div>
              <div style="font-size:18px;font-weight:500;color:#475569;line-height:1.3;">Nhắc lịch &amp; ưu đãi riêng cho từng khách</div>
            </div>

            <div id="s6-n4" class="lux-card" style="position:absolute;right:0px;top:208px;width:306px;height:166px;border-radius:22px;padding:18px 22px;display:flex;flex-direction:column;justify-content:center;z-index:2;">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                <div style="width:38px;height:38px;border-radius:10px;background:#FFFFFF;border:1px solid #E2E8F0;display:flex;align-items:center;justify-content:center;padding:5px;flex-shrink:0;">
                  <img src="${{A.ico_gmail}}" style="width:100%;height:100%;object-fit:contain;" />
                </div>
                <span style="font-size:18px;font-weight:800;color:#DC2626;white-space:nowrap;">NHÁNH CHƯA MỞ</span>
              </div>
              <div style="font-size:26px;font-weight:900;color:#0B1120;line-height:1.15;margin-bottom:6px;white-space:nowrap;">Chuỗi Email Khác</div>
              <div style="font-size:18px;font-weight:500;color:#475569;line-height:1.3;">Gửi nối tiếp ngày 2 &amp; ngày 5 tăng 2.4x tái mua</div>
            </div>

            <img id="s6-mascot" src="${{A.m_dom1}}" style="position:absolute;left:44px;bottom:-4px;width:186px;height:186px;object-fit:contain;filter:drop-shadow(0 18px 26px rgba(15,23,42,0.20));z-index:3;" />
          </div>
        </div>
      </section>

      <!-- ════════════════════ SCENE 8: ERP 5.0 (BRIGHT ALABASTER) ════════════════════ -->
      <section id="sc-7" class="scene bg-alabaster" style="color:#0B1120;">
        <div style="width:100%;height:100%;padding:92px 56px 56px;display:grid;grid-template-columns:0.83fr 1.17fr;gap:30px;align-items:center;">
          <div>
            <div class="line-clip"><div id="s7-h1" style="font-size:66px;font-weight:900;line-height:1.08;letter-spacing:-0.03em;color:#0B1120;">ERP 5.0</div></div>
            <div class="line-clip" style="margin-bottom:14px;"><div id="s7-h2" style="font-size:48px;font-weight:900;line-height:1.08;letter-spacing:-0.03em;white-space:nowrap;color:#1E40FF;">May Đo Quy Trình</div></div>
            <div id="s7-bar" style="width:78px;height:5px;border-radius:99px;background:linear-gradient(90deg,#1E40FF,#06B6D4);margin-bottom:16px;transform-origin:left;"></div>
            <p style="font-size:22px;font-weight:500;line-height:1.42;color:#334155;max-width:460px;margin-bottom:18px;">
              Hợp nhất bán hàng, dự án, nhân sự &amp; vận hành nội bộ theo đúng cách công ty chạy.
            </p>
            <div class="nowrap-row" style="gap:10px;margin-bottom:16px;">
              <div style="padding:12px 18px;border-radius:12px;background:#1E40FF;color:#FFFFFF;font-size:18px;font-weight:800;white-space:nowrap;">-70% BÁO CÁO TAY</div>
              <div class="lux-card" style="padding:12px 18px;border-radius:12px;color:#0B1120;font-size:18px;font-weight:800;white-space:nowrap;">SỞ HỮU HỆ THỐNG</div>
            </div>
            <div style="display:flex;align-items:center;gap:20px;">
              <img id="s7-mascot" src="${{A.m_exec}}" style="width:182px;height:182px;object-fit:contain;filter:drop-shadow(0 16px 26px rgba(15,23,42,0.18));" />
              <div style="border-left:3px solid #1E40FF;padding-left:18px;">
                <div id="s7-pct" class="tabular" style="font-size:44px;font-weight:900;color:#1E40FF;line-height:1;">-70%</div>
                <div style="font-size:19px;font-weight:700;color:#334155;margin-top:4px;white-space:nowrap;">Giờ tổng hợp số liệu</div>
              </div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;">
            ${{[
              {{ icon: 'bag', c: '#1E40FF', tint: '#EEF2FF', t: 'Bán Hàng', sub: 'Theo sát từng cơ hội' }},
              {{ icon: 'kanban', c: '#0284C7', tint: '#E0F2FE', t: 'Dự Án', sub: 'Rõ tiến độ từng người' }},
              {{ icon: 'users', c: '#4F46E5', tint: '#EEF2FF', t: 'Nhân Sự', sub: 'Chấm công & bảng lương' }},
              {{ icon: 'checkDoc', c: '#059669', tint: '#ECFDF5', t: 'Phê Duyệt', sub: 'Duyệt chi & đề xuất nhanh' }},
              {{ icon: 'wallet', c: '#0D9488', tint: '#F0FDFA', t: 'Kho & Tài Chính', sub: 'Kiểm soát thu chi chuẩn' }},
              {{ icon: 'shield', c: '#7C3AED', tint: '#F5F3FF', t: 'Phân Quyền', sub: 'Bảo mật theo cấp bậc' }},
            ].map((m, i) => `
              <div id="s7-mod-${{i}}" class="lux-card" style="position:relative;overflow:hidden;padding:22px 16px;border-radius:20px;display:flex;align-items:center;gap:13px;">
                <div id="s7-top-${{i}}" style="position:absolute;top:0;left:0;height:4px;width:0%;background:linear-gradient(90deg,#1E40FF,#06B6D4);"></div>
                <div class="ico-box" style="width:44px;height:44px;background:${{m.tint}};color:${{m.c}};">
                  ${{ico(m.icon, 'currentColor', 21)}}
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:22px;font-weight:900;color:#0B1120;white-space:nowrap;margin-bottom:3px;">${{m.t}}</div>
                  <div style="font-size:18px;font-weight:500;color:#64748B;line-height:1.25;white-space:nowrap;">${{m.sub}}</div>
                </div>
              </div>
            `).join('')}}
          </div>
        </div>
      </section>

      <!-- ════════════════════ SCENE 9: MULTI-AGENT AI (BRIGHT SKY DAYLIGHT) ════════════════════ -->
      <section id="sc-8" class="scene bg-sky" style="color:#0B1120;">
        <div style="width:100%;height:100%;padding:86px 56px 54px;display:flex;flex-direction:column;justify-content:space-between;">
          <div style="text-align:center;">
            <div class="line-clip"><div id="s8-h1" style="font-size:64px;font-weight:900;line-height:1.08;letter-spacing:-0.03em;color:#0B1120;">Multi-Agent AI</div></div>
            <div style="font-size:26px;font-weight:700;color:#1E40FF;margin-top:2px;">Biệt Đội Trợ Lý AI Đa Nhiệm Cho Doanh Nghiệp</div>
          </div>

          <div style="position:relative;width:100%;height:262px;display:flex;align-items:flex-end;justify-content:space-between;padding:0 12px;">
            <svg width="1168" height="262" viewBox="0 0 1168 262" style="position:absolute;inset:0;pointer-events:none;">
              <line x1="115" y1="138" x2="584" y2="96" stroke="rgba(30,64,255,0.22)" stroke-width="2.5" stroke-dasharray="6 6" />
              <line x1="345" y1="138" x2="584" y2="96" stroke="rgba(6,182,212,0.34)" stroke-width="2.5" stroke-dasharray="6 6" />
              <line x1="823" y1="138" x2="584" y2="96" stroke="rgba(6,182,212,0.34)" stroke-width="2.5" stroke-dasharray="6 6" />
              <line x1="1053" y1="138" x2="584" y2="96" stroke="rgba(30,64,255,0.22)" stroke-width="2.5" stroke-dasharray="6 6" />
              ${{[0, 1, 2, 3].map((i) => `<circle id="s8-pkt-${{i}}" cx="0" cy="0" r="6" fill="#1E40FF" />`).join('')}}
            </svg>
            ${{[
              {{ img: A.m_sales, name: 'Trợ Lý Bán Hàng', sz: 148, master: false }},
              {{ img: A.m_mkt, name: 'Trợ Lý Marketing', sz: 158, master: false }},
              {{ img: A.m_master, name: 'AI Điều Phối', sz: 196, master: true }},
              {{ img: A.m_exec, name: 'AI Phân Tích', sz: 158, master: false }},
              {{ img: A.m_it, name: 'AI Bảo Mật', sz: 148, master: false }},
            ].map((ag, i) => `
              <div id="s8-ag-${{i}}" style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:10px;width:214px;">
                <img src="${{ag.img}}" style="width:${{ag.sz}}px;height:${{ag.sz}}px;object-fit:contain;filter:drop-shadow(0 18px 26px rgba(15,23,42,0.18));" />
                <div class="${{ag.master ? '' : 'lux-card'}}" style="padding:8px 18px;border-radius:12px;background:${{ag.master ? 'linear-gradient(135deg,#1E40FF,#0284C7)' : ''}};color:${{ag.master ? '#FFFFFF' : '#0B1120'}};font-size:19px;font-weight:800;white-space:nowrap;box-shadow:${{ag.master ? '0 14px 28px rgba(30,64,255,0.28)' : ''}};">${{ag.name}}</div>
              </div>
            `).join('')}}
          </div>

          <div style="padding-top:18px;border-top:1px solid rgba(15,23,42,0.10);display:flex;align-items:center;justify-content:space-between;gap:24px;">
            <div style="display:flex;align-items:center;gap:48px;">
              ${{[
                {{ id: 's8-k0', l: 'Hệ Thống Đã Triển Khai', c: '#1E40FF' }},
                {{ id: 's8-k1', l: 'Dữ Liệu Đã Xử Lý', c: '#0B1120' }},
                {{ id: 's8-k2', l: 'Tăng Trưởng Nổi Bật', c: '#059669' }},
              ].map((k) => `
                <div>
                  <div id="${{k.id}}" class="tabular" style="font-size:46px;font-weight:900;color:${{k.c}};line-height:1;">0</div>
                  <div style="font-size:18px;font-weight:600;color:#475569;margin-top:6px;">${{k.l}}</div>
                </div>
              `).join('')}}
            </div>

            <div style="display:flex;align-items:center;gap:16px;">
              <img src="${{A.logo_uri}}" style="width:54px;height:54px;border-radius:14px;box-shadow:0 8px 20px rgba(30,64,255,0.22);" />
              <div style="font-size:36px;font-weight:900;letter-spacing:-0.025em;line-height:1;">
                <span style="color:#1E40FF;">DOMATION</span><span style="color:#06B6D4;">.NET</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ════════════════════ SCENE 10: GRAND BRAND OUTRO DOMATION.NET (BRIGHT PEARL-SKY FINALE) ════════════════════ -->
      <section id="sc-9" class="scene bg-outro" style="color:#0B1120;">
        <svg width="1280" height="720" viewBox="0 0 1280 720" style="position:absolute;inset:0;pointer-events:none;">
          <circle id="s9-ring-0" cx="640" cy="340" r="210" fill="none" stroke="rgba(30,64,255,0.12)" stroke-width="1.5" />
          <circle id="s9-ring-1" cx="640" cy="340" r="320" fill="none" stroke="rgba(6,182,212,0.14)" stroke-width="1.5" />
        </svg>

        <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:48px;">
          <div id="s9-lockup" style="display:flex;align-items:center;gap:26px;margin-bottom:24px;">
            <img src="${{A.logo_uri}}" style="width:112px;height:112px;border-radius:28px;box-shadow:0 24px 52px rgba(30,64,255,0.24);" />
            <div style="font-size:82px;font-weight:900;letter-spacing:-0.03em;line-height:1;">
              <span style="color:#1E40FF;">DOMATION</span><span style="color:#06B6D4;">.NET</span>
            </div>
          </div>

          <div id="s9-bar" style="width:128px;height:5px;border-radius:99px;background:linear-gradient(90deg,#1E40FF,#06B6D4);margin-bottom:24px;transform-origin:center;"></div>

          <div class="line-clip" style="margin-bottom:32px;">
            <div id="s9-tag" style="font-size:32px;font-weight:700;color:#1E293B;letter-spacing:-0.01em;">
              Hệ Sinh Thái Vận Hành Doanh Nghiệp AI 5.0
            </div>
          </div>

          <div id="s9-cta" style="padding:16px 40px;border-radius:16px;background:linear-gradient(135deg,#1E40FF,#0284C7);color:#FFFFFF;font-size:24px;font-weight:900;letter-spacing:0.01em;box-shadow:0 20px 44px rgba(30,64,255,0.28);white-space:nowrap;">
            domation.net
          </div>
        </div>

        <img id="s9-mascot" src="${{A.m_dom1}}" style="position:absolute;right:74px;bottom:48px;width:188px;height:188px;object-fit:contain;filter:drop-shadow(0 22px 34px rgba(15,23,42,0.20));z-index:3;" />
      </section>
    `;

    const sceneEls = Array.from({{ length: 10 }}, (_, i) => document.getElementById(`sc-${{i}}`));
    const hudTop = document.getElementById('hud-top');
    const hudBtm = document.getElementById('hud-btm');

    function renderHud(f) {{
      let active = 0;
      for (let i = 0; i < SCENES_META.length; i++) {{
        if (f >= SCENES_META[i].start + 10) active = i;
      }}
      const meta = SCENES_META[active];
      const dark = meta.dark;

      if (meta.outro) {{
        hudTop.style.display = 'none';
      }} else {{
        hudTop.style.display = 'flex';
        hudTop.style.opacity = '1';
        const lineClr = dark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.10)';
        const domClr = dark ? '#FFFFFF' : '#1E40FF';
        const netClr = dark ? '#22D3EE' : '#06B6D4';
        const chapClr = dark ? '#67E8F9' : '#1E40FF';

        hudTop.style.borderBottom = `1px solid ${{lineClr}}`;
        hudTop.innerHTML = `
          <div style="display:flex;align-items:center;gap:14px;">
            <img src="${{A.logo_uri}}" style="width:44px;height:44px;border-radius:12px;display:block;box-shadow:0 6px 16px rgba(30,64,255,0.20);" />
            <span style="font-size:28px;font-weight:900;letter-spacing:-0.02em;line-height:1;">
              <span style="color:${{domClr}};">DOMATION</span><span style="color:${{netClr}};">.NET</span>
            </span>
          </div>
          <div style="font-size:20px;font-weight:800;letter-spacing:0.04em;color:${{chapClr}};">
            ${{meta.code}}
          </div>
        `;
      }}

      const pct = clamp((f / TOTAL) * 100, 0, 100);
      const trackBg = dark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.10)';
      hudBtm.innerHTML = `
        <div style="width:100%;height:3px;border-radius:99px;background:${{trackBg}};overflow:hidden;">
          <div style="height:100%;width:${{pct.toFixed(2)}}%;background:linear-gradient(90deg,#1E40FF,#06B6D4);"></div>
        </div>
      `;
    }}

    function rectLoopPoint(tNorm) {{
      const x0 = 24, y0 = 88, w = 1128, h = 298;
      const per = 2 * (w + h);
      let d = ((tNorm % 1) + 1) % 1 * per;
      if (d < w) return {{ x: x0 + d, y: y0 }};
      d -= w;
      if (d < h) return {{ x: x0 + w, y: y0 + d }};
      d -= h;
      if (d < w) return {{ x: x0 + w - d, y: y0 + h }};
      d -= w;
      return {{ x: x0, y: y0 + h - d }};
    }}

    window.__renderFrame = function(f) {{
      renderHud(f);

      for (let i = 0; i < 10; i++) {{
        const m = SCENES_META[i];
        const el = sceneEls[i];
        const vis = f >= m.start - 4 && f <= m.end + 4;
        el.style.visibility = vis ? 'visible' : 'hidden';
        if (!vis) continue;

        let op = 1;
        let clip = 'none';
        let tr = 'none';

        if (i === 1 && f < m.start + 22) {{
          const r = interp(f, [m.start, m.start + 22], [0, 82], 'outExpo');
          clip = `circle(${{r.toFixed(1)}}% at 50% 50%)`;
        }} else if (i === 2 && f < m.start + 22) {{
          const tx = interp(f, [m.start, m.start + 22], [100, 0], 'outExpo');
          tr = `translateX(${{tx.toFixed(1)}}%)`;
        }} else if (i === 3 && f < m.start + 22) {{
          const r = interp(f, [m.start, m.start + 22], [0, 82], 'outExpo');
          clip = `circle(${{r.toFixed(1)}}% at 50% 50%)`;
        }} else if (i === 4 && f < m.start + 22) {{
          const p = interp(f, [m.start, m.start + 22], [0, 125], 'outCubic');
          clip = `polygon(0% 0%, ${{p}}% 0%, ${{Math.max(0, p - 22)}}% 100%, 0% 100%)`;
        }} else if (i === 5 && f < m.start + 22) {{
          const r = interp(f, [m.start, m.start + 22], [100, 0], 'outExpo');
          clip = `inset(0% ${{r.toFixed(1)}}% 0% 0%)`;
        }} else if (i === 6 && f < m.start + 22) {{
          const p = interp(f, [m.start, m.start + 22], [50, 0], 'outExpo');
          clip = `inset(${{p.toFixed(1)}}% 0% ${{p.toFixed(1)}}% 0%)`;
        }} else if (i === 7 && f < m.start + 22) {{
          const l = interp(f, [m.start, m.start + 22], [100, 0], 'outCubic');
          clip = `inset(0% 0% 0% ${{l.toFixed(1)}}%)`;
        }} else if (i === 8 && f < m.start + 22) {{
          const r = interp(f, [m.start, m.start + 22], [0, 82], 'outExpo');
          clip = `circle(${{r.toFixed(1)}}% at 50% 50%)`;
        }} else if (i === 9 && f < m.start + 24) {{
          const r = interp(f, [m.start, m.start + 24], [0, 82], 'outExpo');
          clip = `circle(${{r.toFixed(1)}}% at 50% 50%)`;
        }}

        if (i < 9 && f > m.end - 22) {{
          op = interp(f, [m.end - 22, m.end], [1, 0], 'outCubic');
          const scOut = interp(f, [m.end - 22, m.end], [1.0, 0.96], 'outCubic');
          tr = `scale(${{scOut.toFixed(4)}})`;
        }}
        el.style.opacity = op.toFixed(3);
        el.style.clipPath = clip;
        el.style.transform = tr;
        el.style.zIndex = 10 + i;
      }}

      // ── S1 Ivory Pain ──
      if (f <= 270) {{
        const lf = f;
        const s1 = spring({{ frame: lf - 4, config: {{ overshootClamping: true }} }});
        const s2 = spring({{ frame: lf - 10, config: {{ overshootClamping: true }} }});
        const blur = interp(lf, [0, 18], [6, 0], 'outCubic');
        document.getElementById('s1-h1').style.transform = `translateY(${{(1 - s1) * 85}}px)`;
        document.getElementById('s1-h1').style.filter = `blur(${{blur.toFixed(2)}}px)`;
        document.getElementById('s1-h2').style.transform = `translateY(${{(1 - s2) * 85}}px)`;
        document.getElementById('s1-h2').style.filter = `blur(${{blur.toFixed(2)}}px)`;
        document.getElementById('s1-bar').style.transform = `scaleX(${{interp(lf, [10, 36], [0, 1], 'outExpo')}})`;
        document.getElementById('s1-desc').style.opacity = interp(lf, [12, 32], [0, 1]).toFixed(3);
        document.getElementById('s1-strip').style.opacity = interp(lf, [20, 42], [0, 1]).toFixed(3);

        const cN = interp(lf, [16, 75], [0, 1], 'outExpo');
        document.getElementById('s1-v0').textContent = `${{Math.round(45 * cN)}} Phút`;
        document.getElementById('s1-v1').textContent = `-${{Math.round(60 * cN)}}%`;

        const rots = [-1.5, 1.2, -1.0];
        for (let k = 0; k < 3; k++) {{
          const sp = spring({{ frame: lf - (14 + k * 10), config: {{ stiffness: 155, damping: 14 }} }});
          const dy = Math.sin((lf + k * 20) / 16) * 5;
          const el = document.getElementById(`s1-card-${{k}}`);
          el.style.opacity = clamp(sp * 1.4, 0, 1).toFixed(3);
          el.style.transform = `translateY(${{dy.toFixed(1)}}px) rotate(${{rots[k]}}deg) scale(${{sp.toFixed(3)}})`;
        }}
      }}

      // ── S2 Royal Cobalt Ecosystem ──
      if (f >= 240 && f <= 528) {{
        const lf = f - 244;
        const spB = spring({{ frame: lf - 4 }});
        document.getElementById('s2-brand').style.transform = `scale(${{spB.toFixed(3)}})`;
        const shSub = spring({{ frame: lf - 10, config: {{ overshootClamping: true }} }});
        document.getElementById('s2-sub').style.transform = `translateY(${{(1 - shSub) * 60}}px)`;
        document.getElementById('s2-mascot').style.transform = `translateY(${{(Math.sin(lf / 14) * 8).toFixed(1)}}px) rotate(${{(Math.sin(lf / 26) * 2.5).toFixed(2)}}deg)`;

        const spotIdx = Math.floor((lf - 35) / 42) % 5;
        for (let i = 0; i < 5; i++) {{
          const sp = spring({{ frame: lf - (14 + i * 6), config: {{ stiffness: 165, damping: 14 }} }});
          const active = lf >= 35 && i === spotIdx;
          const lift = active ? -10 : 0;
          const card = document.getElementById(`s2-p-${{i}}`);
          card.style.transform = `translateY(${{lift}}px) scale(${{(sp * (active ? 1.05 : 1.0)).toFixed(3)}})`;
          card.style.boxShadow = active
            ? '0 28px 54px rgba(255,255,255,0.34), 0 0 0 2.5px #67E8F9'
            : '0 22px 46px rgba(5,12,48,0.28)';
        }}
        for (let b = 0; b < 3; b++) {{
          const t = ((lf + b * 32) % 96) / 96;
          const bx = (1 - t)*(1 - t)*110 + 2*(1 - t)*t*584 + t*t*1058;
          const by = (1 - t)*(1 - t)*210 + 2*(1 - t)*t*18 + t*t*210;
          const bd = document.getElementById(`s2-bead-${{b}}`);
          bd.setAttribute('cx', bx.toFixed(1));
          bd.setAttribute('cy', by.toFixed(1));
        }}
      }}

      // ── S3 Auto Chia Data Stacked Deck ──
      if (f >= 498 && f <= 786) {{
        const lf = f - 502;
        const sh1 = spring({{ frame: lf - 4, config: {{ overshootClamping: true }} }});
        const sh2 = spring({{ frame: lf - 10, config: {{ overshootClamping: true }} }});
        document.getElementById('s3-h1').style.transform = `translateY(${{(1 - sh1) * 85}}px)`;
        document.getElementById('s3-h2').style.transform = `translateY(${{(1 - sh2) * 85}}px)`;
        document.getElementById('s3-bar').style.transform = `scaleX(${{interp(lf, [10, 36], [0, 1], 'outExpo')}})`;
        document.getElementById('s3-desc').style.opacity = interp(lf, [14, 34], [0, 1]).toFixed(3);

        const spDeck = spring({{ frame: lf - 10, config: {{ stiffness: 145, damping: 14 }} }});
        const swayY = Math.sin(lf / 22) * 4.5;
        document.getElementById('s3-deck-wrap').style.transform = `perspective(1100px) rotateY(${{swayY.toFixed(2)}}deg)`;
        document.getElementById('s3-back-2').style.transform = `translate(${{(30 * spDeck).toFixed(1)}}px, ${{(-18 * spDeck).toFixed(1)}}px) rotate(${{(4.5 * spDeck).toFixed(2)}}deg)`;
        document.getElementById('s3-back-1').style.transform = `translate(${{(15 * spDeck).toFixed(1)}}px, ${{(-9 * spDeck).toFixed(1)}}px) rotate(${{(2.2 * spDeck).toFixed(2)}}deg)`;
        document.getElementById('s3-front').style.transform = `scale(${{spDeck.toFixed(3)}})`;
        document.getElementById('s3-mascot').style.transform = `translate(-50%, -50%) translateY(${{(Math.sin(lf / 14) * 7).toFixed(1)}}px) rotate(${{(Math.sin(lf / 24) * 2).toFixed(2)}}deg)`;

        for (let k = 0; k < 3; k++) {{
          const bob = Math.sin((lf + k * 24) / 14) * 6;
          const spI = spring({{ frame: lf - (18 + k * 7) }});
          document.getElementById(`s3-i${{k}}`).style.transform = `translateY(${{bob.toFixed(1)}}px) scale(${{spI.toFixed(3)}})`;
        }}
        const sigStarts = [{{x:78,y:82}}, {{x:54,y:222}}, {{x:78,y:362}}];
        const sigEnds = [{{x:175,y:180}}, {{x:175,y:222}}, {{x:175,y:264}}];
        for (let s = 0; s < 3; s++) {{
          const st = ((lf + s * 18) % 52) / 52;
          const sx = sigStarts[s].x + (sigEnds[s].x - sigStarts[s].x) * st;
          const sy = sigStarts[s].y + (sigEnds[s].y - sigStarts[s].y) * st;
          const sig = document.getElementById(`s3-sig-${{s}}`);
          sig.setAttribute('cx', sx.toFixed(1));
          sig.setAttribute('cy', sy.toFixed(1));
        }}
      }}

      // ── S4 6-Card Closed-Loop CAPI Flywheel (BRIGHT PEARL) ──
      if (f >= 756 && f <= 1068) {{
        const lf = f - 760;
        const sh1 = spring({{ frame: lf - 4, config: {{ overshootClamping: true }} }});
        document.getElementById('s4loop-h1').style.transform = `translateY(${{(1 - sh1) * 75}}px)`;

        const activeIdx = Math.floor((lf - 16) / 36) % 6;
        for (let i = 0; i < 6; i++) {{
          const sp = spring({{ frame: lf - (12 + i * 7), config: {{ stiffness: 165, damping: 14 }} }});
          const isLit = lf >= 16 && i === activeIdx;
          const el = document.getElementById(`s4loop-c-${{i}}`);
          const icoEl = document.getElementById(`s4loop-ico-${{i}}`);
          const liftY = isLit ? -4 : 0;
          el.style.transform = `translateY(${{liftY}}px) scale(${{(sp * (isLit ? 1.032 : 1.0)).toFixed(3)}})`;
          el.style.borderColor = isLit ? '#1E40FF' : 'rgba(15, 23, 42, 0.08)';
          el.style.boxShadow = isLit
            ? '0 22px 44px -10px rgba(30,64,255,0.24), 0 0 0 2px rgba(30,64,255,0.16), inset 0 1px 0 rgba(255,255,255,0.95)'
            : '0 1px 2px rgba(15,23,42,0.04), 0 14px 30px -10px rgba(15,23,42,0.10), 0 24px 48px -18px rgba(30,64,255,0.08), inset 0 1px 0 rgba(255,255,255,0.95)';
          icoEl.style.background = isLit ? LOOP_CARDS[i].c : LOOP_CARDS[i].tint;
          icoEl.style.color = isLit ? '#FFFFFF' : LOOP_CARDS[i].c;
        }}

        for (let b = 0; b < 6; b++) {{
          const pt = rectLoopPoint((lf / 180) + b / 6);
          const pk = document.getElementById(`s4loop-pkt-${{b}}`);
          pk.setAttribute('cx', pt.x.toFixed(1));
          pk.setAttribute('cy', pt.y.toFixed(1));
        }}
      }}

      // ── S5 CRM 360° (BRIGHT ICE) ──
      if (f >= 1038 && f <= 1326) {{
        const lf = f - 1042;
        const sh1 = spring({{ frame: lf - 4, config: {{ overshootClamping: true }} }});
        const sh2 = spring({{ frame: lf - 10, config: {{ overshootClamping: true }} }});
        document.getElementById('s4-h1').style.transform = `translateY(${{(1 - sh1) * 85}}px)`;
        document.getElementById('s4-h2').style.transform = `translateY(${{(1 - sh2) * 85}}px)`;
        document.getElementById('s4-bar').style.transform = `scaleX(${{interp(lf, [10, 36], [0, 1], 'outExpo')}})`;
        document.getElementById('s4-desc').style.opacity = interp(lf, [14, 34], [0, 1]).toFixed(3);
        document.getElementById('s4-mascot').style.transform = `translateY(${{(Math.sin(lf / 15) * 7).toFixed(1)}}px)`;
        document.getElementById('s4-sheet').style.transform = `translateY(${{(Math.sin(lf / 26) * 4).toFixed(1)}}px)`;

        for (let i = 0; i < 4; i++) {{
          const activeStep = Math.min(3, Math.floor((lf - 16) / 28));
          const isLit = i <= activeStep;
          const row = document.getElementById(`s4-row-${{i}}`);
          const num = document.getElementById(`s4-num-${{i}}`);
          row.style.background = isLit ? '#EFF6FF' : '#F8FAFC';
          row.style.borderColor = isLit ? 'rgba(30,64,255,0.34)' : 'rgba(15,23,42,0.08)';
          num.style.background = isLit ? '#1E40FF' : '#E2E8F0';
          num.style.color = isLit ? '#FFFFFF' : '#475569';
          num.innerHTML = isLit ? ico('check', '#FFFFFF', 18) : ico('arrowRight', '#475569', 18);
        }}
      }}

      // ── S6 Report BI (BRIGHT PEARL) ──
      if (f >= 1296 && f <= 1584) {{
        const lf = f - 1300;
        const sh1 = spring({{ frame: lf - 4, config: {{ overshootClamping: true }} }});
        const sh2 = spring({{ frame: lf - 10, config: {{ overshootClamping: true }} }});
        document.getElementById('s5-h1').style.transform = `translateY(${{(1 - sh1) * 85}}px)`;
        document.getElementById('s5-h2').style.transform = `translateY(${{(1 - sh2) * 85}}px)`;
        document.getElementById('s5-bar').style.transform = `scaleX(${{interp(lf, [10, 36], [0, 1], 'outExpo')}})`;
        const tR = interp(lf, [10, 92], [0, 1], 'outExpo');
        document.getElementById('s5-roas').textContent = `${{(6.8 * tR).toFixed(1)}}x`;
        document.getElementById('s5-waste').textContent = `-${{Math.round(35 * tR)}}%`;
        document.getElementById('s5-mascot').style.transform = `translateY(${{(Math.sin(lf / 14) * 7).toFixed(1)}}px)`;

        const barH = [60, 86, 112, 138, 162, 184, 204];
        for (let i = 0; i < 7; i++) {{
          const sb = spring({{ frame: lf - (10 + i * 6), config: {{ overshootClamping: true }} }});
          const hn = barH[i] * sb;
          const el = document.getElementById(`s5-bar-${{i}}`);
          el.setAttribute('height', hn.toFixed(1));
          el.setAttribute('y', (210 - hn).toFixed(1));
        }}
        const tc = interp(lf, [12, 102], [0, 1], 'outExpo');
        document.getElementById('s5-line').style.strokeDashoffset = (560 * (1 - tc)).toFixed(1);
        document.getElementById('s5-area').style.opacity = tc.toFixed(3);
        const ptTip = bezier(tc, {{x:41,y:178}}, {{x:195,y:142}}, {{x:355,y:76}}, {{x:505,y:20}});
        const dot = document.getElementById('s5-dot');
        dot.setAttribute('cx', ptTip.x.toFixed(1));
        dot.setAttribute('cy', ptTip.y.toFixed(1));

        const ring = document.getElementById('s5-ring');
        if (tc > 0.94) {{
          const rp = ((lf % 38) / 38);
          ring.setAttribute('r', (12 + rp * 22).toFixed(1));
          ring.style.opacity = (1 - rp).toFixed(2);
        }} else {{
          ring.style.opacity = '0';
        }}
      }}

      // ── S7 Automation 5-Node Branching Flow (BRIGHT ICE DAYLIGHT) ──
      if (f >= 1554 && f <= 1866) {{
        const lf = f - 1558;
        const sh1 = spring({{ frame: lf - 4, config: {{ overshootClamping: true }} }});
        const sh2 = spring({{ frame: lf - 10, config: {{ overshootClamping: true }} }});
        document.getElementById('s6-h1').style.transform = `translateY(${{(1 - sh1) * 85}}px)`;
        document.getElementById('s6-h2').style.transform = `translateY(${{(1 - sh2) * 60}}px)`;
        document.getElementById('s6-mascot').style.transform = `translateY(${{(Math.sin(lf / 14) * 7).toFixed(1)}}px)`;

        const nodeDelays = [10, 34, 60, 88, 106];
        for (let i = 0; i < 5; i++) {{
          const sp = spring({{ frame: lf - nodeDelays[i], config: {{ stiffness: 155, damping: 14 }} }});
          document.getElementById(`s6-n${{i}}`).style.transform = `scale(${{sp.toFixed(3)}})`;
        }}

        const s6Paths = [
          [{{x:242,y:85}}, {{x:257,y:85}}, {{x:273,y:85}}, {{x:288,y:85}}],
          [{{x:544,y:85}}, {{x:572,y:85}}, {{x:566,y:196}}, {{x:590,y:196}}],
          [{{x:820,y:168}}, {{x:844,y:168}}, {{x:838,y:89}}, {{x:862,y:89}}],
          [{{x:820,y:224}}, {{x:844,y:224}}, {{x:838,y:291}}, {{x:862,y:291}}],
        ];
        for (let b = 0; b < 4; b++) {{
          const t = ((lf + b * 22) % 72) / 72;
          const pt = bezier(t, ...s6Paths[b]);
          const bd = document.getElementById(`s6-b${{b}}`);
          bd.setAttribute('cx', pt.x.toFixed(1));
          bd.setAttribute('cy', pt.y.toFixed(1));
        }}
      }}

      // ── S8 Bright Alabaster ERP 5.0 ──
      if (f >= 1836 && f <= 2124) {{
        const lf = f - 1840;
        const sh1 = spring({{ frame: lf - 4, config: {{ overshootClamping: true }} }});
        const sh2 = spring({{ frame: lf - 10, config: {{ overshootClamping: true }} }});
        document.getElementById('s7-h1').style.transform = `translateY(${{(1 - sh1) * 85}}px)`;
        document.getElementById('s7-h2').style.transform = `translateY(${{(1 - sh2) * 85}}px)`;
        document.getElementById('s7-bar').style.transform = `scaleX(${{interp(lf, [10, 36], [0, 1], 'outExpo')}})`;
        document.getElementById('s7-mascot').style.transform = `translateY(${{(Math.sin(lf / 14) * 7).toFixed(1)}}px)`;
        document.getElementById('s7-pct').textContent = `-${{Math.round(70 * interp(lf, [12, 85], [0, 1], 'outExpo'))}}%`;

        for (let i = 0; i < 6; i++) {{
          const tOn = 18 + i * 16;
          const lit = lf >= tOn;
          const sp = spring({{ frame: lf - (10 + i * 6) }});
          const fillW = interp(lf, [tOn, tOn + 18], [0, 100], 'outExpo');
          const card = document.getElementById(`s7-mod-${{i}}`);
          const bar = document.getElementById(`s7-top-${{i}}`);
          card.style.transform = `scale(${{sp.toFixed(3)}})`;
          card.style.borderColor = lit ? 'rgba(30,64,255,0.34)' : 'rgba(15,23,42,0.08)';
          bar.style.width = `${{fillW.toFixed(1)}}%`;
        }}
      }}

      // ── S9 Multi-Agent AI Squad (BRIGHT SKY DAYLIGHT) ──
      if (f >= 2094 && f <= 2382) {{
        const lf = f - 2098;
        const sh1 = spring({{ frame: lf - 4, config: {{ overshootClamping: true }} }});
        document.getElementById('s8-h1').style.transform = `translateY(${{(1 - sh1) * 85}}px)`;

        for (let i = 0; i < 5; i++) {{
          const sp = spring({{ frame: lf - (10 + i * 6), config: {{ stiffness: 165, damping: 13 }} }});
          const bob = Math.sin((lf + i * 16) / 14) * 7;
          document.getElementById(`s8-ag-${{i}}`).style.transform = `translateY(${{bob.toFixed(1)}}px) scale(${{sp.toFixed(3)}})`;
        }}

        const targets = [{{x:115,y:138}}, {{x:345,y:138}}, {{x:823,y:138}}, {{x:1053,y:138}}];
        for (let p = 0; p < 4; p++) {{
          const ph = ((lf + p * 18) % 64) / 64;
          const tPing = ph < 0.5 ? ph * 2 : (1 - ph) * 2;
          const px = 584 + (targets[p].x - 584) * tPing;
          const py = 96 + (targets[p].y - 96) * tPing;
          const pkt = document.getElementById(`s8-pkt-${{p}}`);
          pkt.setAttribute('cx', px.toFixed(1));
          pkt.setAttribute('cy', py.toFixed(1));
        }}

        const tk = interp(lf, [16, 94], [0, 1], 'outExpo');
        document.getElementById('s8-k0').textContent = Math.round(35 * tk) + '+';
        document.getElementById('s8-k1').textContent = Math.round(150 * tk) + 'K+';
        document.getElementById('s8-k2').textContent = (8.2 * tk).toFixed(1) + 'x';
      }}

      // ── S10 Grand Brand Outro DOMATION.NET (BRIGHT PEARL-SKY FINALE) ──
      if (f >= 2352) {{
        const lf = f - 2356;
        const spL = spring({{ frame: lf - 6, config: {{ stiffness: 135, damping: 13 }} }});
        document.getElementById('s9-lockup').style.transform = `scale(${{spL.toFixed(3)}})`;
        document.getElementById('s9-bar').style.transform = `scaleX(${{interp(lf, [12, 42], [0, 1], 'outExpo')}})`;
        const shT = spring({{ frame: lf - 14, config: {{ overshootClamping: true }} }});
        document.getElementById('s9-tag').style.transform = `translateY(${{(1 - shT) * 55}}px)`;
        const spC = spring({{ frame: lf - 22 }});
        document.getElementById('s9-cta').style.transform = `scale(${{spC.toFixed(3)}})`;
        document.getElementById('s9-mascot').style.transform = `translateY(${{(Math.sin(lf / 14) * 7).toFixed(1)}}px) scale(${{spring({{ frame: lf - 16 }}).toFixed(3)}})`;

        document.getElementById('s9-ring-0').setAttribute('r', (200 + lf * 0.45).toFixed(1));
        document.getElementById('s9-ring-1').setAttribute('r', (310 + lf * 0.65).toFixed(1));
      }}
    }};

    window.__renderFrame(0);
  </script>
</body>
</html>"""


def _render_chunk_worker(args: tuple) -> None:
    html_path_str, out_dir_str, start_f, end_f, browser_exe = args
    out_dir = Path(out_dir_str)
    html_uri = Path(html_path_str).resolve().as_uri()
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=browser_exe, headless=True)
        context = browser.new_context(viewport={"width": WIDTH, "height": HEIGHT}, device_scale_factor=1)
        page = context.new_page()
        page.goto(html_uri, wait_until="load")
        page.evaluate("Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))])")
        for f in range(start_f, end_f):
            page.evaluate(f"window.__renderFrame({f})")
            page.screenshot(path=str(out_dir / f"f_{f:05d}.jpg"), type="jpeg", quality=94)
        browser.close()


def render_keyframes_only(html_path: Path, browser_exe: str) -> None:
    QA_DIR.mkdir(parents=True, exist_ok=True)
    OUT_POSTER_DIR.mkdir(parents=True, exist_ok=True)
    html_uri = html_path.resolve().as_uri()
    t0 = time.time()
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=browser_exe, headless=True)
        context = browser.new_context(viewport={"width": WIDTH, "height": HEIGHT}, device_scale_factor=1)
        page = context.new_page()
        page.goto(html_uri, wait_until="load")
        page.evaluate("Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))])")
        for poster_slug, qa_name, frame_idx in KEYFRAME_CHAPTERS:
            page.evaluate(f"window.__renderFrame({frame_idx})")
            qa_png = QA_DIR / f"{qa_name}.png"
            page.screenshot(path=str(qa_png), type="png")
            poster_webp = OUT_POSTER_DIR / f"{poster_slug}.webp"
            with Image.open(qa_png) as im:
                im.convert("RGB").save(poster_webp, "WEBP", quality=90, method=6)
            print(f"  [KF] {qa_name}.png & {poster_slug}.webp (frame {frame_idx})")
        browser.close()
    print(f"KEYFRAMES_DONE in {time.time() - t0:.1f}s")


def main():
    parser = argparse.ArgumentParser(description="DOMATION Ecosystem Master Swiss Daylight Cinema Renderer")
    parser.add_argument("--keyframes-only", action="store_true", help="Render peak QA keyframes + WebP posters")
    parser.add_argument("--workers", type=int, default=6, help="Parallel headless Edge workers")
    args = parser.parse_args()

    assets = collect_assets()
    html_str = build_master_html(assets)

    TMP_DIR.mkdir(parents=True, exist_ok=True)
    html_file = TMP_DIR / "master.html"
    html_file.write_text(html_str, encoding="utf-8")

    browser_exe = find_browser()
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    print(f"Using Edge: {browser_exe} | HTML size: {len(html_str)//1024} KB")

    if args.keyframes_only:
        render_keyframes_only(html_file, browser_exe)
        return

    t0 = time.time()
    audio_wav = TMP_DIR / "master_sfx.wav"
    generate_master_audio_wav(audio_wav)

    chunk_size = math.ceil(TOTAL_FRAMES / args.workers)
    tasks = []
    for w in range(args.workers):
        sf = w * chunk_size
        ef = min(TOTAL_FRAMES, (w + 1) * chunk_size)
        if sf < ef:
            tasks.append((str(html_file), str(TMP_DIR), sf, ef, browser_exe))

    print(f"Rendering {TOTAL_FRAMES} frames @ {FPS}fps ({DURATION_SEC}s) across {len(tasks)} workers...")
    with ProcessPoolExecutor(max_workers=len(tasks)) as ex:
        list(ex.map(_render_chunk_worker, tasks))

    OUT_POSTER_DIR.mkdir(parents=True, exist_ok=True)
    for poster_slug, _, frame_idx in KEYFRAME_CHAPTERS:
        src_f = TMP_DIR / f"f_{frame_idx:05d}.jpg"
        with Image.open(src_f) as im:
            im.convert("RGB").save(OUT_POSTER_DIR / f"{poster_slug}.webp", "WEBP", quality=90, method=6)

    OUT_VIDEO.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        ffmpeg_exe,
        "-y",
        "-framerate", str(FPS),
        "-i", str(TMP_DIR / "f_%05d.jpg"),
        "-i", str(audio_wav),
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "21",
        "-pix_fmt", "yuv420p",
        "-profile:v", "high",
        "-level:v", "4.1",
        "-movflags", "+faststart",
        "-ar", "44100",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        str(OUT_VIDEO),
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"FFmpeg encode failed:\n{res.stderr}")

    shutil.rmtree(TMP_DIR, ignore_errors=True)
    elapsed = time.time() - t0
    size_mb = OUT_VIDEO.stat().st_size / (1024 * 1024)
    print(f"MASTER_DONE: {OUT_VIDEO} ({size_mb:.2f} MB) in {elapsed:.1f}s")


if __name__ == "__main__":
    main()
