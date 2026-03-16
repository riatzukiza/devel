#!/usr/bin/env python3
"""Render the Hormuz Risk Clock v4 image from a state file.

Usage:
  python scripts/generate_v4_clock.py data/state.v4.json assets/hormuz_risk_clock_v4.png
"""
from __future__ import annotations
import json
import math
import sys
from pathlib import Path
from datetime import datetime
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Wedge, Rectangle, FancyBboxPatch

state_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / 'data' / 'state.v4.json'
out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parents[1] / 'assets' / 'hormuz_risk_clock_v4.png'
state = json.loads(state_path.read_text())

T0 = datetime.fromisoformat(state['clock']['t0_utc'].replace('Z', '+00:00'))
ASOF = datetime.fromisoformat(state['as_of_utc'].replace('Z', '+00:00'))
DIAL_DAYS = 180
SECOND_D = state['clock']['second_hand_days']
MINUTE_D = state['clock']['minute_hand_days']
HOUR_D = state['clock']['hour_hand_days']
STRUCTURAL_MAX = state['clock']['structural_bar_days']

signals = [
    ('Transit', state['states']['transit_flow']['score']),
    ('Attack', state['states']['attack_tempo']['score']),
    ('Insurance', state['states']['insurance_availability']['score']),
    ('Navigation', state['states']['navigation_integrity']['score']),
    ('Bypass', state['states']['bypass_capacity']['score']),
    ('Asia buffers', state['states']['asia_buffer_stress']['score']),
]
branches = [
    ('Reopening', round(state['branches']['reopening'] * 100)),
    ('Effective closure', round(state['branches']['effective_closure'] * 100)),
    ('Wider escalation', round(state['branches']['wider_escalation'] * 100)),
]
windows = [
    (15, 25, 'Shipping pipeline'),
    (25, 40, 'Refinery adjustment'),
    (40, 60, 'SPR / reserve decision'),
    (60, 90, 'Shortage cascade risk'),
]

def angle_for_day(day: float) -> float:
    return math.radians(90 - (day / DIAL_DAYS) * 360.0)

def pol2xy(cx: float, cy: float, r: float, ang: float):
    return cx + r * math.cos(ang), cy + r * math.sin(ang)

fig = plt.figure(figsize=(14, 10), dpi=220)
ax = plt.axes([0, 0, 1, 1])
ax.set_xlim(0, 1400)
ax.set_ylim(0, 1000)
ax.axis('off')

cx, cy, r = 430, 560, 235
ax.text(700, 965, 'Strait of Hormuz Risk Clock — v4', ha='center', va='center', fontsize=22, fontweight='bold')
ax.text(700, 936, f"As of {ASOF.strftime('%d %b %Y, %H:%M UTC')}  •  T0 = {T0.strftime('%d %b %Y, %H:%M UTC')}  •  main dial = 180 days", ha='center', va='center', fontsize=11)
ax.add_patch(Circle((cx, cy), r, fill=False, linewidth=2.2))
for rr in [r * 0.30, r * 0.55, r * 0.80]:
    ax.add_patch(Circle((cx, cy), rr, fill=False, linewidth=0.8))

sector_span = 360 / len(signals)
for i, (name, score) in enumerate(signals):
    start_deg = 90 - (i + 1) * sector_span
    end_deg = 90 - i * sector_span
    for level in range(5):
        outer = r * (1.15 - level * 0.04)
        inner = r * (1.11 - level * 0.04)
        fill = str(0.15 + 0.18 * level) if level < score else 'white'
        ax.add_patch(Wedge((cx, cy), outer, start_deg, end_deg, width=outer-inner, linewidth=1.0, edgecolor='black', facecolor=fill))
    mid_deg = (start_deg + end_deg) / 2
    ang = math.radians(mid_deg)
    lx, ly = pol2xy(cx, cy, r * 1.33, ang)
    ax.text(lx, ly + 9, name, ha='center', va='center', fontsize=9, fontweight='bold')
    ax.text(lx, ly - 8, f'{score}/4', ha='center', va='center', fontsize=8)

for h in range(12):
    day = (DIAL_DAYS / 12) * h
    ang = angle_for_day(day)
    x1, y1 = pol2xy(cx, cy, r * 0.92, ang)
    x2, y2 = pol2xy(cx, cy, r * 1.00, ang)
    ax.plot([x1, x2], [y1, y2], linewidth=2, color='black')
    lx, ly = pol2xy(cx, cy, r * 1.08, ang)
    ax.text(lx, ly, f'+{int(day)}d', ha='center', va='center', fontsize=8)

for start_day, end_day, label in windows:
    theta1 = 90 - (end_day / DIAL_DAYS) * 360
    theta2 = 90 - (start_day / DIAL_DAYS) * 360
    ax.add_patch(Wedge((cx, cy), r * 0.78, theta1, theta2, width=r * 0.12, linewidth=1.2, edgecolor='black', facecolor='0.85'))
    mid_day = (start_day + end_day) / 2
    ang = angle_for_day(mid_day)
    lx, ly = pol2xy(cx, cy, r * 0.61, ang)
    ax.text(lx, ly, label, ha='center', va='center', fontsize=8)

ax.text(cx, cy + 12, 'NOW', ha='center', va='center', fontsize=18, fontweight='bold')
ax.text(cx, cy - 42, 'second = confirmed\nminute = soft deadline\nhour = intervention boundary', ha='center', va='center', fontsize=10)

def draw_hand(day: float, length_scale: float, lw: float, ls: str = '-') -> None:
    x, y = pol2xy(cx, cy, r * length_scale, angle_for_day(day))
    ax.plot([cx, x], [cy, y], linewidth=lw, linestyle=ls, color='black')
    ax.add_patch(Circle((x, y), 4, color='black'))

draw_hand(SECOND_D, 0.98, 2.5, '-')
draw_hand(MINUTE_D, 0.83, 4.5, '--')
draw_hand(HOUR_D, 0.62, 7, '-')

box = FancyBboxPatch((55, 140), 620, 145, boxstyle='round,pad=0.02,rounding_size=10', linewidth=1.6, edgecolor='black', facecolor='white')
ax.add_patch(box)
ax.text(75, 258,
        'How to read v4\n'
        '• Outer wedges = active signal pressure\n'
        '• Mid-ring arcs = buffer-burn windows\n'
        '• Second hand = confirmed present\n'
        '• Minute hand = 90d soft deadline\n'
        '• Hour hand = 30d intervention boundary',
        ha='left', va='top', fontsize=10)

box2 = FancyBboxPatch((760, 610), 590, 300, boxstyle='round,pad=0.02,rounding_size=10', linewidth=1.6, edgecolor='black', facecolor='white')
ax.add_patch(box2)
ax.text(780, 880, 'Current state snapshot', fontsize=14, fontweight='bold', ha='left')
ystate = 850
for key, value in state['states'].items():
    ax.text(780, ystate, f"• {key}: {value['score']}/4 ({value.get('trend','')}) — {value.get('notes','')}", fontsize=10, ha='left', va='top')
    ystate -= 34

box3 = FancyBboxPatch((760, 395), 590, 170, boxstyle='round,pad=0.02,rounding_size=10', linewidth=1.6, edgecolor='black', facecolor='white')
ax.add_patch(box3)
ax.text(780, 535, 'Working branch priors', fontsize=14, fontweight='bold', ha='left')
for i, (name, pct) in enumerate(branches):
    y = 480 - i * 38
    ax.text(780, y, name, fontsize=11, ha='left', va='center')
    ax.add_patch(Rectangle((960, y - 8), 240, 16, linewidth=1.0, edgecolor='black', facecolor='white'))
    ax.add_patch(Rectangle((960, y - 8), 2.4 * pct, 16, linewidth=0, facecolor='0.45'))
    ax.text(1210, y, f'{pct}%', fontsize=11, ha='left', va='center')

box4 = FancyBboxPatch((55, 35), 1295, 78, boxstyle='round,pad=0.02,rounding_size=10', linewidth=1.6, edgecolor='black', facecolor='white')
ax.add_patch(box4)
ax.text(75, 96, 'Structural horizon bar', fontsize=12, fontweight='bold', ha='left')
ax.text(75, 74, 'Use this for the “450 day” hard ceiling idea: if only ~20% of global supply is lost on average, depletion stretches dramatically.', fontsize=9, ha='left')
bar_x, bar_y, bar_w, bar_h = 420, 58, 860, 16
ax.add_patch(Rectangle((bar_x, bar_y), bar_w, bar_h, linewidth=1.2, edgecolor='black', facecolor='white'))

def x_for_day(day: float) -> float:
    return bar_x + bar_w * (day / STRUCTURAL_MAX)

ax.add_patch(Rectangle((bar_x, bar_y), x_for_day(30) - bar_x, bar_h, linewidth=0, facecolor='0.85'))
ax.add_patch(Rectangle((x_for_day(30), bar_y), x_for_day(90) - x_for_day(30), bar_h, linewidth=0, facecolor='0.72'))
for d in [0, 30, 90, 180, 270, 360, 450]:
    x = x_for_day(d)
    ax.plot([x, x], [bar_y - 6, bar_y + bar_h + 6], linewidth=1.1, color='black')
    ax.text(x, bar_y - 12, f'{d}', ha='center', va='top', fontsize=8)

ax.text(700, 12, 'v4: dynamic signal wedges + buffer-burn arcs + separate 450d bar + state snapshot + updateable branch priors.', ha='center', va='bottom', fontsize=8)
out_path.parent.mkdir(parents=True, exist_ok=True)
plt.savefig(out_path, bbox_inches='tight')
print(out_path)
