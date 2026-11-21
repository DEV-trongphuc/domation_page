import argparse
import html
import io
import json
import math
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(r"D:\GITHUB_SPACE\DOMATION_LANDINGPAGE")
PUBLIC_DIR = ROOT / "public"
SPECS_PATH = ROOT / "scripts" / ".visual-specs-cache.json"

BROWSER_CANDIDATES = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
]


def find_browser() -> str:
    for p in BROWSER_CANDIDATES:
        if Path(p).exists():
            return p
    raise FileNotFoundError("Could not find Edge or Chrome executable for Playwright rendering.")


def esc(text: object) -> str:
    return html.escape(str(text or ""), quote=True)


def clean_tick(text: object, max_chars: int) -> str:
    s = " ".join(str(text or "").split())
    if len(s) <= max_chars:
        return esc(s)
    head = s.split(" (")[0].strip()
    if head and len(head) <= max_chars:
        return esc(head)
    base = head if head else s
    if len(base) <= max_chars:
        return esc(base)
    cut = base[: max(1, max_chars - 1)]
    if " " in cut:
        cut = cut.rsplit(" ", 1)[0]
    return esc(cut.rstrip(" -–•,.") + "…")


def title_font_size(title: str, base: int = 44) -> int:
    n = len(title.strip())
    if n <= 44:
        return base
    if n <= 68:
        return base - 5
    if n <= 92:
        return base - 10
    return base - 14


def extract_numeric_series(spec: dict):
    chart_blk = spec.get("chartBlock") or {}
    chart = chart_blk.get("chart") or {}
    data = chart.get("data") or []
    series = chart.get("series") or []
    x_key = chart.get("xKey") or ""
    if not data or not series:
        return [], [], "", chart.get("chartType", "bar")
    return data, series, x_key, chart.get("chartType", "bar")


def render_svg_mini_chart(spec: dict, dark: bool = True) -> str:
    data, series, x_key, chart_type = extract_numeric_series(spec)
    text_muted = "#94A3B8" if dark else "#475569"
    grid_stroke = "rgba(148,163,184,0.18)" if dark else "rgba(15,23,42,0.10)"

    if not data or not series:
        # Fallback clean architectural metric bars from metricsOutcome
        outcomes = (spec.get("metricsOutcome") or [])[:4]
        rows = ""
        widths = [86, 72, 64, 91]
        for idx, m in enumerate(outcomes):
            lbl = esc(m.get("label", ""))
            val = esc(m.get("value", ""))
            w = widths[idx % len(widths)]
            bg = "rgba(255,255,255,0.08)" if dark else "#E2E8F0"
            fg_txt = "#F8FAFC" if dark else "#0F172A"
            rows += f"""
            <div style="margin-bottom:14px;">
              <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:6px;color:{fg_txt};">
                <span style="opacity:0.85;">{lbl}</span>
                <span style="color:#38BDF8;font-family:Consolas,monospace;">{val}</span>
              </div>
              <div style="height:8px;border-radius:99px;background:{bg};overflow:hidden;">
                <div style="height:100%;width:{w}%;border-radius:99px;background:linear-gradient(90deg,#1E40FF,#06B6D4);"></div>
              </div>
            </div>"""
        return rows

    # Render crisp SVG chart preview (480x230) using real numbers
    w, h = 480, 220
    pad_l, pad_r, pad_t, pad_b = 14, 14, 18, 36
    cw, ch = w - pad_l - pad_r, h - pad_t - pad_b
    rows = data[:6]
    s0 = series[0]
    s0_key = s0.get("key")
    s1 = series[1] if len(series) > 1 else None
    s1_key = s1.get("key") if s1 else None
    c0 = s0.get("color") or "#38BDF8"
    c1 = (s1.get("color") if s1 else None) or "#10B981"

    vals = []
    for r in rows:
        for k in [s0_key, s1_key]:
            if k and isinstance(r.get(k), (int, float)):
                vals.append(float(r[k]))
    max_v = max(vals) if vals and max(vals) > 0 else 100.0

    svg_elems = []
    for gy in [0.25, 0.5, 0.75, 1.0]:
        yy = pad_t + ch * (1.0 - gy)
        svg_elems.append(f'<line x1="{pad_l}" y1="{yy:.1f}" x2="{w-pad_r}" y2="{yy:.1f}" stroke="{grid_stroke}" stroke-dasharray="3 4" />')

    n = max(1, len(rows))
    step = cw / n

    if chart_type in ("line", "area"):
        pts0 = []
        pts1 = []
        for i, r in enumerate(rows):
            cx = pad_l + step * (i + 0.5)
            v0 = float(r.get(s0_key, 0) or 0)
            y0 = pad_t + ch * (1.0 - min(1.0, max(0.0, v0 / max_v)))
            pts0.append((cx, y0, r.get(x_key, "")))
            if s1_key:
                v1 = float(r.get(s1_key, 0) or 0)
                y1 = pad_t + ch * (1.0 - min(1.0, max(0.0, v1 / max_v)))
                pts1.append((cx, y1))

        if chart_type == "area" and len(pts0) >= 2:
            area_d = f"M {pts0[0][0]:.1f},{pad_t+ch:.1f} " + " ".join(f"L {x:.1f},{y:.1f}" for x, y, _ in pts0) + f" L {pts0[-1][0]:.1f},{pad_t+ch:.1f} Z"
            svg_elems.append(f'<path d="{area_d}" fill="{c0}" fill-opacity="0.22" />')

        if len(pts0) >= 2:
            d0 = "M " + " L ".join(f"{x:.1f},{y:.1f}" for x, y, _ in pts0)
            svg_elems.append(f'<path d="{d0}" fill="none" stroke="{c0}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />')
        for x, y, lbl in pts0:
            svg_elems.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4.5" fill="{c0}" stroke="#0B1220" stroke-width="1.5" />')
            short_lbl = clean_tick(lbl, 12)
            svg_elems.append(f'<text x="{x:.1f}" y="{h-12}" text-anchor="middle" fill="{text_muted}" font-size="11" font-family="Segoe UI, sans-serif">{short_lbl}</text>')
        if len(pts1) >= 2:
            d1 = "M " + " L ".join(f"{x:.1f},{y:.1f}" for x, y in pts1)
            svg_elems.append(f'<path d="{d1}" fill="none" stroke="{c1}" stroke-width="2.6" stroke-dasharray="5 3" stroke-linecap="round" />')
            for x, y in pts1:
                svg_elems.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3.8" fill="{c1}" />')
    else:
        bar_w = min(22, (step * 0.68) / (2 if s1_key else 1))
        for i, r in enumerate(rows):
            cx = pad_l + step * (i + 0.5)
            v0 = float(r.get(s0_key, 0) or 0)
            bh0 = max(4.0, ch * (v0 / max_v))
            x0 = cx - bar_w - 2 if s1_key else cx - bar_w / 2
            y0 = pad_t + ch - bh0
            svg_elems.append(f'<rect x="{x0:.1f}" y="{y0:.1f}" width="{bar_w:.1f}" height="{bh0:.1f}" rx="5" fill="{c0}" />')
            if s1_key:
                v1 = float(r.get(s1_key, 0) or 0)
                bh1 = max(4.0, ch * (v1 / max_v))
                x1 = cx + 2
                y1 = pad_t + ch - bh1
                svg_elems.append(f'<rect x="{x1:.1f}" y="{y1:.1f}" width="{bar_w:.1f}" height="{bh1:.1f}" rx="5" fill="{c1}" />')
            short_lbl = clean_tick(r.get(x_key, ""), 12)
            svg_elems.append(f'<text x="{cx:.1f}" y="{h-12}" text-anchor="middle" fill="{text_muted}" font-size="11" font-family="Segoe UI, sans-serif">{short_lbl}</text>')

    legend_html = f'<div style="display:flex;gap:14px;font-size:11px;font-weight:700;margin-bottom:8px;color:{text_muted};">'
    legend_html += f'<span><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:{c0};margin-right:5px;"></span>{esc(s0.get("label",""))}</span>'
    if s1:
        legend_html += f'<span><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:{c1};margin-right:5px;"></span>{esc(s1.get("label",""))}</span>'
    legend_html += "</div>"

    return f'{legend_html}<svg viewBox="0 0 {w} {h}" width="100%" height="215" style="display:block;">{"".join(svg_elems)}</svg>'


def build_thumbnail_html(spec: dict) -> str:
    theme = spec.get("thumbnailTheme") or "slate-cobalt-exec"
    title = spec.get("thumbnailTitle") or spec.get("title") or ""
    hook = spec.get("thumbnailHook") or ""
    badge = spec.get("thumbnailBadge") or spec.get("pillarLabel") or ""
    num = spec.get("number") or "00"
    industry = spec.get("industry") or "DOMATION Research"
    pillar_label = spec.get("pillarLabel") or ""
    outcomes = (spec.get("metricsOutcome") or [])[:3]

    base_css = """
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 1376px; height: 768px; overflow: hidden;
      font-family: 'Segoe UI', 'Arial', system-ui, -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    """

    # THEME 4: swiss-editorial-paper (crisp light editorial magazine style)
    if theme == "swiss-editorial-paper":
        fs = title_font_size(title, 45)
        right_svg = render_svg_mini_chart(spec, dark=False)
        kpis_html = "".join(
            f'<div style="background:#FFFFFF;border:1px solid #E2DCCF;border-radius:14px;padding:12px 14px;">'
            f'<div style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;">{esc(m.get("label",""))}</div>'
            f'<div style="font-size:21px;font-weight:900;color:#1E40FF;margin-top:3px;">{esc(m.get("value",""))}</div></div>'
            for m in outcomes[:2]
        )
        return f"""<!doctype html><html><head><meta charset="utf-8"><style>{base_css}
        body {{
          background: #F6F3EB;
          color: #0F172A;
          background-image: radial-gradient(circle at 86% 18%, rgba(30,64,255,0.08), transparent 42%),
                            linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px);
          background-size: 100% 100%, 44px 44px, 44px 44px;
        }}
        </style></head><body>
          <div style="width:1376px;height:768px;padding:46px 56px;display:flex;flex-direction:column;justify-content:space-between;border-top:10px solid #1E40FF;">
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid #D6CFC0;padding-bottom:18px;">
              <div style="display:flex;align-items:center;gap:12px;">
                <span style="background:#0F172A;color:#F8FAFC;padding:6px 14px;border-radius:6px;font-size:13px;font-weight:800;letter-spacing:0.08em;">DOMATION DOSSIER #{esc(num)}</span>
                <span style="background:#E0E7FF;color:#1E40FF;border:1px solid #BFDBFE;padding:6px 14px;border-radius:99px;font-size:13px;font-weight:800;text-transform:uppercase;">{esc(badge)}</span>
              </div>
              <span style="font-size:14px;font-weight:700;color:#475569;">{esc(industry)}</span>
            </div>

            <div style="display:grid;grid-template-columns:1.22fr 0.95fr;gap:42px;align-items:center;flex:1;padding:24px 0;">
              <div style="display:flex;flex-direction:column;gap:22px;">
                <h1 style="font-size:{fs}px;line-height:1.18;font-weight:900;letter-spacing:-0.025em;color:#0F172A;">{esc(title)}</h1>
                <div style="border-left:5px solid #1E40FF;padding:12px 18px;background:#FFFFFF;border-radius:0 14px 14px 0;box-shadow:0 10px 25px -12px rgba(15,23,42,0.12);">
                  <div style="font-size:12px;font-weight:800;color:#1E40FF;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">GÓC NHÌN CHIẾN LƯỢC</div>
                  <p style="font-size:19px;font-weight:700;line-height:1.42;color:#1E293B;">{esc(hook)}</p>
                </div>
              </div>

              <div style="background:#FFFFFF;border:1.5px solid #DDD6C7;border-radius:24px;padding:24px;box-shadow:0 24px 50px -24px rgba(15,23,42,0.16);display:flex;flex-direction:column;gap:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.07em;color:#1E40FF;">Bằng Chứng &amp; Dữ Liệu Thực Chiến</span>
                  <span style="font-family:Consolas,monospace;font-size:12px;color:#64748B;">LIVE BENCHMARK</span>
                </div>
                {right_svg}
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">{kpis_html}</div>
              </div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;border-top:1.5px solid #D6CFC0;padding-top:16px;font-size:14px;font-weight:700;color:#475569;">
              <span>DOMATION.NET/BOOST • {esc(pillar_label)}</span>
              <span style="color:#0F172A;">Kiến trúc &amp; Phân tích: <span style="color:#1E40FF;">Huỳnh Trọng Phúc (TurnioDEV)</span></span>
            </div>
          </div>
        </body></html>"""

    # THEME 5: github-terminal-audit
    if theme == "github-terminal-audit":
        fs = title_font_size(title, 41)
        repo = spec.get("repoMeta") or {}
        full_name = repo.get("fullName") or badge
        lang = repo.get("primaryLanguage") or "TypeScript"
        lic = repo.get("license") or "Open Source"
        stars = repo.get("starsTier") or "Popular Repo"
        scores = repo.get("scores") or {"productionReadiness": 8, "vibecodeSpeed": 9, "securityGovernance": 8, "costEfficiency": 9}
        bars = [
            ("Production Readiness", scores.get("productionReadiness", 8), "#38BDF8"),
            ("Vibecode Velocity", scores.get("vibecodeSpeed", 9), "#818CF8"),
            ("Security & Governance", scores.get("securityGovernance", 8), "#34D399"),
            ("Cost / Token Efficiency", scores.get("costEfficiency", 9), "#FBBF24"),
        ]
        bars_html = ""
        for lbl, val, clr in bars:
            pct = min(100, max(20, int(float(val) * 10)))
            bars_html += f"""
            <div style="margin-bottom:14px;">
              <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:5px;color:#E2E8F0;">
                <span>{esc(lbl)}</span>
                <span style="font-family:Consolas,monospace;color:{clr};">{val}/10</span>
              </div>
              <div style="height:9px;background:#1E293B;border-radius:99px;overflow:hidden;">
                <div style="height:100%;width:{pct}%;background:{clr};border-radius:99px;"></div>
              </div>
            </div>"""

        return f"""<!doctype html><html><head><meta charset="utf-8"><style>{base_css}
        body {{
          background: radial-gradient(circle at 80% 22%, rgba(6,182,212,0.22), transparent 45%),
                      radial-gradient(circle at 12% 85%, rgba(30,64,255,0.24), transparent 45%),
                      #070D19;
          color: #F8FAFC;
        }}
        </style></head><body>
          <div style="width:1376px;height:768px;padding:46px 54px;display:flex;flex-direction:column;justify-content:space-between;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="background:rgba(6,182,212,0.16);border:1px solid rgba(56,189,248,0.45);color:#67E8F9;padding:7px 14px;border-radius:10px;font-family:Consolas,monospace;font-size:14px;font-weight:700;">GITHUB AUDIT #{esc(num)}</span>
                <span style="background:#0F172A;border:1px solid #334155;color:#A5B4FC;padding:7px 14px;border-radius:10px;font-family:Consolas,monospace;font-size:14px;font-weight:700;">github.com/{esc(full_name)}</span>
              </div>
              <div style="display:flex;gap:8px;font-family:Consolas,monospace;font-size:13px;">
                <span style="background:#0F172A;border:1px solid #1E293B;padding:6px 12px;border-radius:8px;color:#34D399;">{esc(lic)}</span>
                <span style="background:#0F172A;border:1px solid #1E293B;padding:6px 12px;border-radius:8px;color:#FCD34D;">★ {esc(stars)}</span>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1.25fr 0.92fr;gap:40px;align-items:center;flex:1;">
              <div style="display:flex;flex-direction:column;gap:20px;">
                <h1 style="font-size:{fs}px;line-height:1.18;font-weight:900;letter-spacing:-0.02em;color:#FFFFFF;">{esc(title)}</h1>
                <div style="background:rgba(15,23,42,0.85);border:1px solid rgba(56,189,248,0.28);border-left:5px solid #06B6D4;border-radius:14px;padding:15px 18px;">
                  <p style="font-size:19px;font-weight:700;line-height:1.45;color:#BAE6FD;">{esc(hook)}</p>
                </div>
              </div>

              <div style="background:rgba(15,23,42,0.92);border:1px solid #1E293B;border-radius:24px;padding:24px;box-shadow:0 30px 60px -25px rgba(0,0,0,0.8);">
                <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1E293B;padding-bottom:12px;margin-bottom:18px;">
                  <div style="display:flex;gap:7px;">
                    <span style="width:11px;height:11px;border-radius:50%;background:#EF4444;display:inline-block;"></span>
                    <span style="width:11px;height:11px;border-radius:50%;background:#F59E0B;display:inline-block;"></span>
                    <span style="width:11px;height:11px;border-radius:50%;background:#10B981;display:inline-block;"></span>
                  </div>
                  <span style="font-family:Consolas,monospace;font-size:12px;color:#94A3B8;">LANG: {esc(lang)} • AUDIT MATRIX</span>
                </div>
                {bars_html}
                <div style="margin-top:10px;padding-top:12px;border-top:1px dashed #334155;font-size:12px;color:#94A3B8;display:flex;justify-content:space-between;">
                  <span>DOMATION Vibecode Stack</span>
                  <span style="color:#67E8F9;font-weight:700;">Production Verified</span>
                </div>
              </div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #1E293B;padding-top:16px;font-size:14px;font-weight:700;color:#94A3B8;">
              <span>DOMATION.NET/BOOST • {esc(pillar_label)}</span>
              <span style="color:#E2E8F0;">Audit bởi <span style="color:#38BDF8;">Huỳnh Trọng Phúc (TurnioDEV)</span></span>
            </div>
          </div>
        </body></html>"""

    # THEME 6: arena-peer-vs
    if theme == "arena-peer-vs":
        fs = title_font_size(title, 41)
        chart_svg = render_svg_mini_chart(spec, dark=True)
        is_llm_track = spec.get("pillar") == "llm-models-mcp-skills"
        arena_tag = f"CÙNG HẠNG CÂN • PEER BENCHMARK #{esc(num)}" if is_llm_track else f"BENCHMARK ĐỐI ĐẦU • ARENA #{esc(num)}"
        arena_right = "GEMINI • CLAUDE • CODEX" if is_llm_track else esc(industry).upper()
        return f"""<!doctype html><html><head><meta charset="utf-8"><style>{base_css}
        body {{
          background: radial-gradient(circle at 20% 20%, rgba(30,64,255,0.32), transparent 44%),
                      radial-gradient(circle at 84% 75%, rgba(16,185,129,0.22), transparent 46%),
                      #080D1C;
          color: #FFFFFF;
        }}
        </style></head><body>
          <div style="width:1376px;height:768px;padding:46px 54px;display:flex;flex-direction:column;justify-content:space-between;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="background:linear-gradient(90deg,#1E40FF,#06B6D4);color:#FFFFFF;padding:7px 15px;border-radius:99px;font-size:13px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;">{esc(badge)}</span>
                <span style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.16);color:#E2E8F0;padding:7px 14px;border-radius:99px;font-size:13px;font-weight:700;">{arena_tag}</span>
              </div>
              <span style="font-family:Consolas,monospace;font-size:14px;font-weight:700;color:#67E8F9;">{arena_right}</span>
            </div>

            <div style="display:grid;grid-template-columns:1.22fr 0.95fr;gap:38px;align-items:center;flex:1;">
              <div style="display:flex;flex-direction:column;gap:20px;">
                <h1 style="font-size:{fs}px;line-height:1.18;font-weight:900;letter-spacing:-0.02em;color:#FFFFFF;">{esc(title)}</h1>
                <div style="background:rgba(30,64,255,0.18);border:1px solid rgba(96,165,250,0.45);border-radius:16px;padding:15px 18px;">
                  <div style="font-size:11px;font-weight:800;color:#67E8F9;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:5px;">TRỌNG TÂM SO ĐỌ THỰC TẾ</div>
                  <p style="font-size:19px;font-weight:700;line-height:1.42;color:#F1F5F9;">{esc(hook)}</p>
                </div>
              </div>

              <div style="background:rgba(15,23,42,0.88);border:1px solid rgba(148,163,184,0.22);border-radius:24px;padding:24px;box-shadow:0 28px 60px -24px rgba(0,0,0,0.75);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                  <span style="font-size:13px;font-weight:800;color:#38BDF8;text-transform:uppercase;">Telemetry &amp; Benchmark Scores</span>
                  <span style="font-size:11px;font-family:Consolas,monospace;color:#94A3B8;">NO-BIAS TEST</span>
                </div>
                {chart_svg}
              </div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(148,163,184,0.2);padding-top:16px;font-size:14px;font-weight:700;color:#94A3B8;">
              <span>DOMATION.NET/BOOST • {esc(pillar_label)}</span>
              <span style="color:#FFFFFF;">Biên tập bởi <span style="color:#67E8F9;">Huỳnh Trọng Phúc (TurnioDEV)</span></span>
            </div>
          </div>
        </body></html>"""

    # THEME 1 / 2 / 3 (slate-cobalt-exec, midnight-cyan-data, crimson-obsidian-sec)
    theme_palette = {
        "slate-cobalt-exec": {
            "bg": "radial-gradient(circle at 82% 22%, rgba(37,99,235,0.34), transparent 46%), radial-gradient(circle at 12% 80%, rgba(6,182,212,0.20), transparent 44%), #0A1428",
            "accent": "#38BDF8",
            "pill_bg": "rgba(37,99,235,0.24)",
            "pill_bd": "rgba(96,165,250,0.48)",
            "hook_border": "#3B82F6",
        },
        "midnight-cyan-data": {
            "bg": "radial-gradient(circle at 85% 24%, rgba(6,182,212,0.30), transparent 46%), radial-gradient(circle at 15% 82%, rgba(16,185,129,0.22), transparent 44%), #06101E",
            "accent": "#22D3EE",
            "pill_bg": "rgba(6,182,212,0.20)",
            "pill_bd": "rgba(34,211,238,0.45)",
            "hook_border": "#06B6D4",
        },
        "crimson-obsidian-sec": {
            "bg": "radial-gradient(circle at 85% 20%, rgba(239,68,68,0.28), transparent 46%), radial-gradient(circle at 15% 85%, rgba(245,158,11,0.20), transparent 44%), #100912",
            "accent": "#FCA5A5",
            "pill_bg": "rgba(239,68,68,0.22)",
            "pill_bd": "rgba(248,113,113,0.48)",
            "hook_border": "#EF4444",
        },
    }
    pal = theme_palette.get(theme, theme_palette["slate-cobalt-exec"])
    fs = title_font_size(title, 42)
    chart_svg = render_svg_mini_chart(spec, dark=True)
    kpi_strip = "".join(
        f'<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:10px 12px;">'
        f'<div style="font-size:11px;color:#94A3B8;font-weight:700;">{esc(m.get("label",""))}</div>'
        f'<div style="font-size:18px;font-weight:900;color:{pal["accent"]};margin-top:2px;">{esc(m.get("value",""))}</div></div>'
        for m in outcomes[:2]
    )

    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{base_css}
    body {{
      background: {pal["bg"]};
      color: #FFFFFF;
    }}
    </style></head><body>
      <div style="width:1376px;height:768px;padding:46px 54px;display:flex;flex-direction:column;justify-content:space-between;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="background:{pal["pill_bg"]};border:1px solid {pal["pill_bd"]};color:{pal["accent"]};padding:7px 15px;border-radius:99px;font-size:13px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;">{esc(badge)}</span>
            <span style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.14);color:#E2E8F0;padding:7px 14px;border-radius:99px;font-size:13px;font-weight:700;">REPORT #{esc(num)}</span>
          </div>
          <span style="font-size:14px;font-weight:700;color:#CBD5E1;">{esc(industry)}</span>
        </div>

        <div style="display:grid;grid-template-columns:1.22fr 0.95fr;gap:40px;align-items:center;flex:1;">
          <div style="display:flex;flex-direction:column;gap:20px;">
            <h1 style="font-size:{fs}px;line-height:1.18;font-weight:900;letter-spacing:-0.02em;color:#FFFFFF;">{esc(title)}</h1>
            <div style="background:rgba(15,23,42,0.72);border:1px solid rgba(255,255,255,0.14);border-left:5px solid {pal["hook_border"]};border-radius:14px;padding:15px 18px;">
              <p style="font-size:19px;font-weight:700;line-height:1.42;color:#E2E8F0;">{esc(hook)}</p>
            </div>
          </div>

          <div style="background:rgba(15,23,42,0.86);border:1px solid rgba(148,163,184,0.22);border-radius:24px;padding:24px;box-shadow:0 28px 60px -24px rgba(0,0,0,0.72);display:flex;flex-direction:column;gap:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:{pal["accent"]};">Statistical Snapshot</span>
              <span style="font-family:Consolas,monospace;font-size:11px;color:#94A3B8;">DOMATION BI</span>
            </div>
            {chart_svg}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">{kpi_strip}</div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(148,163,184,0.2);padding-top:16px;font-size:14px;font-weight:700;color:#94A3B8;">
          <span>DOMATION.NET/BOOST • {esc(pillar_label)}</span>
          <span style="color:#FFFFFF;">Tác giả: <span style="color:{pal["accent"]};">Huỳnh Trọng Phúc (TurnioDEV)</span></span>
        </div>
      </div>
    </body></html>"""


def build_report_chart_html(spec: dict) -> str:
    chart_blk = spec.get("chartBlock") or {}
    chart = chart_blk.get("chart") or {}
    title = chart.get("title") or chart_blk.get("heading") or spec.get("title") or ""
    subtitle = chart.get("subtitle") or chart_blk.get("subtitle") or spec.get("industry") or ""
    insight = chart_blk.get("insightSummary") or spec.get("thumbnailHook") or ""
    source_note = chart.get("sourceNote") or "DOMATION Research & Production Telemetry 2026"
    y_unit = chart.get("yUnit") or ""
    kpis = (chart.get("kpis") or [])[:4]
    if not kpis:
        kpis = [{"label": m.get("label", ""), "value": m.get("value", "")} for m in (spec.get("metricsOutcome") or [])[:4]]

    kpi_cards = ""
    for k in kpis:
        delta = k.get("delta")
        pos = k.get("positive", True)
        delta_badge = ""
        if delta:
            d_bg = "#ECFDF5" if pos else "#FFF1F2"
            d_fg = "#047857" if pos else "#BE123C"
            delta_badge = f'<span style="font-size:12px;font-weight:800;padding:3px 9px;border-radius:99px;background:{d_bg};color:{d_fg};">{esc(delta)}</span>'
        kpi_cards += f"""
        <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;padding:16px 18px;box-shadow:0 4px 12px -6px rgba(15,23,42,0.06);">
          <div style="font-size:12px;font-weight:700;color:#64748B;text-transform:uppercase;">{esc(k.get("label",""))}</div>
          <div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-top:6px;">
            <span style="font-size:26px;font-weight:900;color:#0F172A;">{esc(k.get("value",""))}</span>
            {delta_badge}
          </div>
        </div>"""

    # Full-width detailed SVG chart (1200 x 320)
    data, series, x_key, chart_type = extract_numeric_series(spec)
    w, h = 1180, 310
    pad_l, pad_r, pad_t, pad_b = 58, 30, 26, 44
    cw, ch = w - pad_l - pad_r, h - pad_t - pad_b
    rows = data[:8]
    vals = []
    for r in rows:
        for s in series[:3]:
            k = s.get("key")
            if k and isinstance(r.get(k), (int, float)):
                vals.append(float(r[k]))
    max_v = max(vals) * 1.15 if vals and max(vals) > 0 else 100.0

    svg_elems = []
    for step_i in range(5):
        frac = step_i / 4.0
        yy = pad_t + ch * (1.0 - frac)
        val_lbl = int(round(max_v * frac))
        svg_elems.append(f'<line x1="{pad_l}" y1="{yy:.1f}" x2="{w-pad_r}" y2="{yy:.1f}" stroke="#E2E8F0" stroke-dasharray="4 4" />')
        svg_elems.append(f'<text x="{pad_l-10}" y="{yy+4:.1f}" text-anchor="end" fill="#64748B" font-size="12" font-family="Consolas,monospace">{val_lbl}</text>')

    n = max(1, len(rows))
    step = cw / n
    active_series = series[:3]
    colors = [s.get("color") or c for s, c in zip(active_series, ["#1E40FF", "#06B6D4", "#10B981"])]

    if chart_type in ("line", "area"):
        for s_idx, s in enumerate(active_series):
            sk = s.get("key")
            clr = colors[s_idx]
            pts = []
            for i, r in enumerate(rows):
                cx = pad_l + step * (i + 0.5)
                v = float(r.get(sk, 0) or 0)
                yy = pad_t + ch * (1.0 - min(1.0, max(0.0, v / max_v)))
                pts.append((cx, yy, v, r.get(x_key, "")))
            if chart_type == "area" and s_idx == 0 and len(pts) >= 2:
                area_d = f"M {pts[0][0]:.1f},{pad_t+ch:.1f} " + " ".join(f"L {x:.1f},{y:.1f}" for x, y, _, _ in pts) + f" L {pts[-1][0]:.1f},{pad_t+ch:.1f} Z"
                svg_elems.append(f'<path d="{area_d}" fill="{clr}" fill-opacity="0.14" />')
            if len(pts) >= 2:
                d = "M " + " L ".join(f"{x:.1f},{y:.1f}" for x, y, _, _ in pts)
                svg_elems.append(f'<path d="{d}" fill="none" stroke="{clr}" stroke-width="3.5" stroke-linecap="round" />')
            for x, y, v, lbl in pts:
                svg_elems.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5.5" fill="{clr}" stroke="#FFFFFF" stroke-width="2" />')
                if s_idx == 0:
                    svg_elems.append(f'<text x="{x:.1f}" y="{y-11:.1f}" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="700" font-family="Consolas,monospace">{v:g}</text>')
                    svg_elems.append(f'<text x="{x:.1f}" y="{h-14}" text-anchor="middle" fill="#334155" font-size="13" font-weight="700" font-family="Segoe UI,sans-serif">{clean_tick(lbl, 20)}</text>')
    else:
        num_s = max(1, len(active_series))
        group_w = min(step * 0.72, num_s * 38)
        bw = max(14, (group_w - (num_s - 1) * 6) / num_s)
        for i, r in enumerate(rows):
            cx = pad_l + step * (i + 0.5)
            start_x = cx - group_w / 2
            for s_idx, s in enumerate(active_series):
                sk = s.get("key")
                clr = colors[s_idx]
                v = float(r.get(sk, 0) or 0)
                bh = max(4.0, ch * (v / max_v))
                bx = start_x + s_idx * (bw + 6)
                by = pad_t + ch - bh
                svg_elems.append(f'<rect x="{bx:.1f}" y="{by:.1f}" width="{bw:.1f}" height="{bh:.1f}" rx="6" fill="{clr}" />')
                svg_elems.append(f'<text x="{bx+bw/2:.1f}" y="{by-7:.1f}" text-anchor="middle" fill="#0F172A" font-size="11.5" font-weight="800" font-family="Consolas,monospace">{v:g}</text>')
            svg_elems.append(f'<text x="{cx:.1f}" y="{h-14}" text-anchor="middle" fill="#334155" font-size="12.5" font-weight="700" font-family="Segoe UI,sans-serif">{clean_tick(r.get(x_key,""), 20)}</text>')

    legend_items = "".join(
        f'<span style="display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#334155;">'
        f'<span style="width:12px;height:12px;border-radius:4px;background:{colors[i]};display:inline-block;flex-shrink:0;"></span>{esc(s.get("label",""))}</span>'
        for i, s in enumerate(active_series)
    )

    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    html, body {{
      width: 1376px; height: 768px; overflow: hidden;
      background: #F1F5F9; color: #0F172A;
      font-family: 'Segoe UI', 'Arial', system-ui, sans-serif;
    }}
    </style></head><body>
      <div style="width:1376px;height:768px;padding:34px 42px;display:flex;flex-direction:column;justify-content:space-between;gap:16px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
          <div>
            <div style="font-size:12px;font-weight:900;letter-spacing:0.08em;color:#1E40FF;text-transform:uppercase;margin-bottom:4px;">DOMATION BENCHMARK &amp; STATISTICAL REPORT #{esc(spec.get("number",""))}</div>
            <h1 style="font-size:24px;font-weight:900;color:#0F172A;line-height:1.25;">{esc(title)}</h1>
            <p style="font-size:14px;color:#475569;margin-top:3px;">{esc(subtitle)}</p>
          </div>
          <div style="display:flex;gap:14px;align-items:center;background:#FFFFFF;border:1px solid #CBD5E1;padding:10px 16px;border-radius:12px;flex-shrink:0;max-width:460px;flex-wrap:wrap;">
            {legend_items}
            {f'<span style="font-family:Consolas,monospace;font-size:12px;color:#64748B;border-left:1px solid #E2E8F0;padding-left:10px;">Đơn vị: {esc(y_unit)}</span>' if y_unit else ''}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat({max(1,len(kpis))}, 1fr);gap:14px;">{kpi_cards}</div>

        <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:20px;padding:18px 22px;box-shadow:0 12px 30px -15px rgba(15,23,42,0.08);flex:1;display:flex;align-items:center;justify-content:center;">
          <svg viewBox="0 0 {w} {h}" width="100%" height="{h}">{"".join(svg_elems)}</svg>
        </div>

        <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:14px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;gap:24px;">
          <div style="font-size:13.5px;color:#1E293B;line-height:1.45;"><strong style="color:#1E40FF;">Phân tích trọng tâm:</strong> {esc(insight)}</div>
          <div style="font-size:12px;color:#64748B;max-width:440px;text-align:right;line-height:1.4;font-weight:700;">Nguồn: {esc(source_note)}</div>
        </div>
      </div>
    </body></html>"""


def render_to_webp(page, html_str: str, out_path: Path):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    page.set_content(html_str, wait_until="load")
    png_bytes = page.screenshot(type="png")
    img = Image.open(io.BytesIO(png_bytes)).convert("RGB")
    img.save(out_path, "WEBP", quality=88, method=6)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pilot", action="store_true", help="Render 6 pilot theme thumbnails + 2 report charts")
    args = parser.parse_args()

    specs = json.loads(SPECS_PATH.read_text(encoding="utf-8"))
    if args.pilot:
        picked = []
        seen_themes = set()
        for sp in specs:
            th = sp.get("thumbnailTheme", "slate-cobalt-exec")
            if th not in seen_themes:
                seen_themes.add(th)
                picked.append(sp)
            if len(seen_themes) >= 6:
                break
        targets = picked
    else:
        targets = specs

    browser_exe = find_browser()
    print(f"Using browser: {browser_exe} | Rendering {len(targets)} spec targets (pilot={args.pilot})")

    rendered_covers = []
    rendered_charts = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=browser_exe, headless=True)
        context = browser.new_context(viewport={"width": 1376, "height": 768}, device_scale_factor=1)
        page = context.new_page()

        for idx, sp in enumerate(targets, 1):
            cover_rel = sp.get("coverImage", "")
            if cover_rel.startswith("/imgs/boost/v2/"):
                out_cover = PUBLIC_DIR / cover_rel.lstrip("/")
                render_to_webp(page, build_thumbnail_html(sp), out_cover)
                rendered_covers.append(str(out_cover))

            chart_rel = sp.get("screenshotImage", "")
            should_render_chart = (not args.pilot) or len(rendered_charts) < 2
            if should_render_chart and chart_rel.startswith("/imgs/boost/charts/"):
                out_chart = PUBLIC_DIR / chart_rel.lstrip("/")
                render_to_webp(page, build_report_chart_html(sp), out_chart)
                rendered_charts.append(str(out_chart))

            if not args.pilot:
                for fig in sp.get("figureTargets") or []:
                    fig_rel = fig.get("src", "")
                    if fig_rel.startswith("/imgs/boost/charts/") and fig_rel != chart_rel:
                        out_fig = PUBLIC_DIR / fig_rel.lstrip("/")
                        render_to_webp(page, build_report_chart_html(sp), out_fig)
                        rendered_charts.append(str(out_fig))

            if idx % 20 == 0 or args.pilot:
                print(f"  [{idx}/{len(targets)}] Rendered {sp['slug']}")

        browser.close()

    print(f"DONE: {len(rendered_covers)} cover thumbnails, {len(rendered_charts)} report dashboards.")
    if args.pilot:
        print("PILOT COVERS:", json.dumps(rendered_covers, indent=2))
        print("PILOT CHARTS:", json.dumps(rendered_charts, indent=2))


if __name__ == "__main__":
    main()
