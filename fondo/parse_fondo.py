#!/usr/bin/env python3
"""
parse_fondo.py — fondo_web.svg -> JSON para Three.js (campo fluido 3D).
- Resuelve shapes (path/polygon/circle/rect/ellipse) a polígonos absolutos.
- Muestrea Bézier/arcos a segmentos.
- Agrupa por la estructura de <g> de Illustrator (grupos con 2-30 shapes = "objeto").
- Shapes sueltos -> objetos individuales.
- Emite fondo-data.json.
"""
import xml.etree.ElementTree as ET
import re, json, math
from pathlib import Path

SRC = Path(r"C:/Users/Tomi/Desktop/fondo_web.svg")
OUT = Path(r"C:/Users/Tomi/portfolio/fondo/fondo-data.json")

SHAPE_TAGS = {"path", "polygon", "circle", "rect", "ellipse", "line", "polyline"}

# ---------------------------------------------------------------- path parser
_NUM = r"[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?"
_TOKEN = re.compile(r"[MLHVCSQTAZmlhvcsqtaz]|" + _NUM)

def _pt(cur, x, y, rel):
    return (cur[0] + x, cur[1] + y) if rel else (x, y)

def _seg_pts(p0, c1, c2, p1, n=10):
    out = []
    for i in range(1, n + 1):
        t = i / n
        mt = 1 - t
        a = mt * mt * mt; b = 3 * mt * mt * t; c = 3 * mt * t * t; d = t * t * t
        out.append((a * p0[0] + b * c1[0] + c * c2[0] + d * p1[0],
                    a * p0[1] + b * c1[1] + c * c2[1] + d * p1[1]))
    return out

def _qseg_pts(p0, c, p1, n=10):
    out = []
    for i in range(1, n + 1):
        t = i / n; mt = 1 - t
        out.append((mt * mt * p0[0] + 2 * mt * t * c[0] + t * t * p1[0],
                    mt * mt * p0[1] + 2 * mt * t * c[1] + t * t * p1[1]))
    return out

def _arc_sample(p0, rx, ry, rot, fa, fs, p1, n=10):
    phi = math.radians(rot)
    x1, y1 = p1; x0, y0 = p0
    dx = (x0 - x1) / 2.0; dy = (y0 - y1) / 2.0
    xp = math.cos(phi) * dx + math.sin(phi) * dy
    yp = -math.sin(phi) * dx + math.cos(phi) * dy
    rx = abs(rx); ry = abs(ry)
    lam = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry)
    if lam > 1:
        s = math.sqrt(lam); rx *= s; ry *= s
    num = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp
    den = rx * rx * yp * yp + ry * ry * xp * xp
    num = 0.0 if num < 0 else num
    coef = math.sqrt(num / den) if den else 0
    if fa == fs:
        coef = -coef
    cxp = coef * (rx * yp / ry)
    cyp = coef * (-ry * xp / rx)
    cx = math.cos(phi) * cxp - math.sin(phi) * cyp + (x0 + x1) / 2.0
    cy = math.sin(phi) * cxp + math.cos(phi) * cyp + (y0 + y1) / 2.0
    def ang(ux, uy, vx, vy):
        dot = ux * vx + uy * vy
        ln = math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy)) or 1
        cc = max(-1.0, min(1.0, dot / ln))
        a = math.acos(cc)
        if ux * vy - uy * vx < 0:
            a = -a
        return a
    th1 = ang(1, 0, (xp - cxp) / rx, (yp - cyp) / ry)
    dth = ang((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry)
    if not fs and dth > 0: dth -= 2 * math.pi
    elif fs and dth < 0: dth += 2 * math.pi
    seg = max(2, int(abs(dth) / (math.pi / n)) + 1)
    pts = []
    for i in range(1, seg):
        t = th1 + dth * (i / seg)
        x = cx + rx * math.cos(t) * math.cos(phi) - ry * math.sin(t) * math.sin(phi)
        y = cy + rx * math.cos(t) * math.sin(phi) + ry * math.sin(t) * math.cos(phi)
        pts.append((x, y))
    pts.append((x1, y1))
    return pts

def parse_path(tokens):
    """tokens: lista plana [cmd, num, num, cmd, ...]. Devuelve lista de subpaths."""
    subs = []
    sub = None
    startpt = None
    pos = [0, 0]
    prev_ctl = None
    prev_raw = ""
    i = 0
    while i < len(tokens):
        tok = tokens[i]
        if tok in "MLHVCSQTAZmlhvcsqtaz":
            raw = tok; i += 1
            prev_raw = raw
        else:
            raw = "L" if prev_raw == "M" else ("l" if prev_raw == "m" else prev_raw)
        rel = raw.islower(); cmd = raw.upper()
        def nums(n):
            nonlocal i
            r = [float(tokens[i + k]) for k in range(n)]
            i += n
            return r
        if cmd == "M":
            x, y = nums(2)
            p = _pt(pos, x, y, rel)
            if sub and len(sub) >= 2: subs.append(sub)
            sub = [p]; pos = list(p); startpt = list(p)
        elif cmd == "L":
            x, y = nums(2)
            p = _pt(pos, x, y, rel); sub.append(p); pos = list(p)
        elif cmd == "H":
            x = nums(1)[0]
            p = _pt(pos, x, 0, rel) if rel else (x, pos[1]); sub.append(p); pos = list(p)
        elif cmd == "V":
            y = nums(1)[0]
            p = _pt(pos, 0, y, rel) if rel else (pos[0], y); sub.append(p); pos = list(p)
        elif cmd == "C":
            x1, y1, x2, y2, x, y = nums(6)
            c1 = _pt(pos, x1, y1, rel); c2 = _pt(pos, x2, y2, rel); p1 = _pt(pos, x, y, rel)
            sub.extend(_seg_pts(pos, c1, c2, p1)); prev_ctl = c2; pos = list(p1)
        elif cmd == "S":
            x2, y2, x, y = nums(4)
            c1 = (2 * pos[0] - prev_ctl[0], 2 * pos[1] - prev_ctl[1]) if prev_ctl else list(pos)
            c2 = _pt(pos, x2, y2, rel); p1 = _pt(pos, x, y, rel)
            sub.extend(_seg_pts(pos, c1, c2, p1)); prev_ctl = c2; pos = list(p1)
        elif cmd == "Q":
            x1, y1, x, y = nums(4)
            c = _pt(pos, x1, y1, rel); p1 = _pt(pos, x, y, rel)
            sub.extend(_qseg_pts(pos, c, p1)); prev_ctl = c; pos = list(p1)
        elif cmd == "T":
            x, y = nums(2)
            c = (2 * pos[0] - prev_ctl[0], 2 * pos[1] - prev_ctl[1]) if prev_ctl else list(pos)
            p1 = _pt(pos, x, y, rel)
            sub.extend(_qseg_pts(pos, c, p1)); prev_ctl = c; pos = list(p1)
        elif cmd == "A":
            rx, ry, rot, fa, fs, x, y = nums(7)
            p1 = _pt(pos, x, y, rel)
            sub.extend(_arc_sample(pos, rx, ry, rot, fa, fs, p1)); pos = list(p1)
        elif cmd == "Z":
            if startpt and sub: sub.append(list(startpt))
            pos = list(startpt) if startpt else pos
    if sub and len(sub) >= 2:
        subs.append(sub)
    return subs

def shape_to_subpaths(el):
    tag = el.tag.split('}')[-1]
    subs = []
    if tag == "polygon":
        pts = [float(v) for v in el.get('points', '').replace(',', ' ').split()]
        poly = [(pts[i], pts[i + 1]) for i in range(0, len(pts), 2)]
        if len(poly) >= 3: subs.append(poly + [poly[0]])
    elif tag == "polyline":
        pts = [float(v) for v in el.get('points', '').replace(',', ' ').split()]
        poly = [(pts[i], pts[i + 1]) for i in range(0, len(pts), 2)]
        if len(poly) >= 2: subs.append(poly)
    elif tag == "rect":
        x = float(el.get('x', 0)); y = float(el.get('y', 0))
        w = float(el.get('width', 0)); h = float(el.get('height', 0))
        rx = float(el.get('rx', 0)); ry = float(el.get('ry', 0))
        if rx or ry:
            rx = rx or ry; ry = ry or rx; n = 8; pts = []
            cx = [(x + rx, y + ry), (x + w - rx, y + ry), (x + w - rx, y + h - ry), (x + rx, y + h - ry)]
            for k, (ccx, ccy) in enumerate(cx):
                a0 = math.pi * (k + 1) / 2 + math.pi / 2
                for j in range(1, n + 1):
                    a = a0 + (math.pi / 2) * (j / n)
                    pts.append((ccx + rx * math.cos(a), ccy + ry * math.sin(a)))
            subs.append(pts + [pts[0]])
        else:
            subs.append([(x, y), (x + w, y), (x + w, y + h), (x, y + h), (x, y)])
    elif tag == "circle":
        cx = float(el.get('cx', 0)); cy = float(el.get('cy', 0)); r = float(el.get('r', 0)); n = 26
        pts = [(cx + r * math.cos(2 * math.pi * i / n), cy + r * math.sin(2 * math.pi * i / n)) for i in range(n)]
        subs.append(pts + [pts[0]])
    elif tag == "ellipse":
        cx = float(el.get('cx', 0)); cy = float(el.get('cy', 0))
        rx = float(el.get('rx', 0)); ry = float(el.get('ry', 0)); n = 26
        pts = [(cx + rx * math.cos(2 * math.pi * i / n), cy + ry * math.sin(2 * math.pi * i / n)) for i in range(n)]
        subs.append(pts + [pts[0]])
    elif tag == "path":
        d = el.get('d', '')
        if d:
            toks = _TOKEN.findall(d)
            items = [tk if tk in "MLHVCSQTAZmlhvcsqtaz" else tk for tk in toks]
            subs = parse_path(items)
    return subs

def bbox_of_subpaths(subs):
    xs = [p[0] for s in subs for p in s]; ys = [p[1] for s in subs for p in s]
    return (min(xs), min(ys), max(xs), max(ys)) if xs else (0, 0, 0, 0)

def resolve_fill(el, parent_map):
    e = el
    while e is not None:
        f = e.get('fill')
        if f and f not in (None, 'none', 'transparent', 'inherit'):
            return f
        e = parent_map.get(e)
    return '#ffffff'

# ---------------------------------------------------------------- main
def tag(e): return e.tag.split('}')[-1]

tree = ET.parse(SRC)
root = tree.getroot()

parent_map = {}
for p in root.iter():
    for c in p:
        parent_map[c] = p

def count_shapes(e):
    return sum(1 for c in e.iter() if tag(c) in SHAPE_TAGS)

def is_icon(g):
    n = count_shapes(g)
    if n < 1 or n > 30:
        return False
    child_g = [c for c in g if tag(c) == 'g']
    if len(child_g) == 1 and count_shapes(child_g[0]) == n:
        return False  # wrapper redundante
    return True

icon_groups = []
def find_icons(e):
    if tag(e) == 'g' and is_icon(e):
        icon_groups.append(e); return
    for c in e:
        if tag(c) == 'g':
            find_icons(c)
for c in root:
    if tag(c) == 'g':
        find_icons(c)

# shapes sueltos (no contenidos en ningún icon group)
assigned = set()
for g in icon_groups:
    for s in g.iter():
        if tag(s) in SHAPE_TAGS:
            assigned.add(s)

icons = []
def build_icon(subpath_list, color_map):
    if not subpath_list:
        return None
    bb = bbox_of_subpaths(subpath_list)
    if bb[2] - bb[0] < 0.6 and bb[3] - bb[1] < 0.6:
        return None
    col = max(color_map, key=color_map.get) if color_map else '#ffffff'
    return {"cx": round((bb[0] + bb[2]) / 2, 2), "cy": round((bb[1] + bb[3]) / 2, 2),
            "w": round(bb[2] - bb[0], 2), "h": round(bb[3] - bb[1], 2),
            "color": col, "polys": [[[round(p[0], 2), round(p[1], 2)] for p in s] for s in subpath_list]}

for g in icon_groups:
    subs = []
    cols = {}
    for s in g.iter():
        if tag(s) in SHAPE_TAGS:
            ss = shape_to_subpaths(s)
            if ss:
                subs.extend(ss)
                cols[resolve_fill(s, parent_map)] = cols.get(resolve_fill(s, parent_map), 0) + 1
    ic = build_icon(subs, cols)
    if ic: icons.append(ic)

for s in root.iter():
    if tag(s) in SHAPE_TAGS and s.get('id') != 'Fondo' and s not in assigned:
        subs = shape_to_subpaths(s)
        cols = {resolve_fill(s, parent_map): 1}
        ic = build_icon(subs, cols)
        if ic: icons.append(ic)

print(f"objetos 3D generados: {len(icons)}")
ws = [ic["w"] for ic in icons]; hs = [ic["h"] for ic in icons]
print(f"tamaño: w min={min(ws):.0f} med={sorted(ws)[len(ws)//2]:.0f} max={max(ws):.0f} | h min={min(hs):.0f} med={sorted(hs)[len(hs)//2]:.0f} max={max(hs):.0f}")
cols = {}
for ic in icons: cols[ic["color"]] = cols.get(ic["color"], 0) + 1
print("colores:", cols)
spi = [len(ic["polys"]) for ic in icons]
print(f"shapes por objeto: min={min(spi)} med={sorted(spi)[len(spi)//2]} max={max(spi)}")

OUT.parent.mkdir(parents=True, exist_ok=True)
data = {"viewBox": [0, 0, 960, 1200], "bg": "#79547a", "icons": icons}
OUT.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
print("OK ->", OUT, f"({OUT.stat().st_size/1024:.0f} KB)")
