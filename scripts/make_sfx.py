#!/usr/bin/env python3
"""Synthesize a 48 kHz stereo 16-bit WAV bed of bathroom-comedy foley.

Uses only the Python standard library (wave, struct, math, random), so it runs
anywhere the renderer runs. Output duration matches the video length.

Usage:
    python3 scripts/make_sfx.py --out exports/sfx.wav --duration 18
"""
import argparse
import math
import random
import struct
import wave

SR = 48000
random.seed(7)


def env_exp(t, decay):
    return math.exp(-t * decay)


def knock(t0, buf, amp=0.9):
    # hollow wood door knock: low sine body + short noise click
    for i in range(int(0.25 * SR)):
        t = i / SR
        s = math.sin(2 * math.pi * 165 * t) * env_exp(t, 22) + 0.25 * (random.random() * 2 - 1) * env_exp(t, 90)
        add(buf, t0 + t, s * amp)


def plop_splash(t0, buf):
    # toilet-bowl PLOP (pitch-dropping sine) then SPLASH (filtered noise)
    for i in range(int(0.35 * SR)):
        t = i / SR
        f = 420 * math.exp(-t * 9) + 60
        add(buf, t0 + t, math.sin(2 * math.pi * f * t) * env_exp(t, 7) * 0.8)
    lp = 0.0
    for i in range(int(1.2 * SR)):
        t = i / SR
        lp += 0.18 * ((random.random() * 2 - 1) - lp)  # one-pole low-pass for a wet hiss
        add(buf, t0 + 0.05 + t, lp * env_exp(t, 3.2) * 0.9)


def whoosh(t0, dur, buf, amp=0.35):
    # gut-tunnel rush: rising band-limited noise
    lp = 0.0
    for i in range(int(dur * SR)):
        t = i / SR
        k = t / dur
        lp += (0.02 + 0.3 * k) * ((random.random() * 2 - 1) - lp)
        add(buf, t0 + t, lp * math.sin(math.pi * k) * amp)


def grunt(t0, dur, buf, amp=0.22):
    # strain: low voiced-ish hum with vibrato
    for i in range(int(dur * SR)):
        t = i / SR
        f = 96 + 6 * math.sin(2 * math.pi * 5 * t)
        add(buf, t0 + t, math.sin(2 * math.pi * f * t) * math.sin(math.pi * t / dur) * amp)


def room_tone(buf, total, silent_from, silent_to, amp=0.0056):  # about -45 dBFS
    lp = 0.0
    for i in range(int(total * SR)):
        t = i / SR
        if silent_from <= t < silent_to:
            continue
        lp += 0.02 * ((random.random() * 2 - 1) - lp)
        add(buf, t, lp * amp * 12)


def kalimba_bed(buf, total, silent_from, silent_to, amp=0.09):
    # soft pentatonic bed; paused during the silent anticipation beat
    notes = [523.25, 587.33, 659.25, 783.99, 880.0]
    step = 0.32
    n = 0
    t0 = 0.0
    while t0 < total:
        if not (silent_from - 0.1 <= t0 < silent_to):
            f = notes[(n * 3) % len(notes)]
            for i in range(int(0.9 * SR)):
                t = i / SR
                add(buf, t0 + t, math.sin(2 * math.pi * f * t) * env_exp(t, 5) * amp)
        n += 1
        t0 += step


def add(buf, t, v):
    idx = int(t * SR)
    if 0 <= idx < len(buf):
        buf[idx] += v


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--duration", type=float, default=18.0)
    ap.add_argument("--silent-from", type=float, default=5.2)
    ap.add_argument("--silent-to", type=float, default=6.1)
    args = ap.parse_args()

    total = args.duration
    n = int(total * SR)
    buf = [0.0] * n

    room_tone(buf, total, args.silent_from, args.silent_to)
    kalimba_bed(buf, total, args.silent_from, args.silent_to)
    for t0 in (0.5, 0.95, 1.4):  # three knocks on the door
        knock(t0, buf)
    grunt(1.5, 1.9, buf)  # strain
    whoosh(args.silent_from - 0.6, 0.9, buf)  # gut-tunnel rush
    plop_splash(args.silent_to, buf)  # bowl splashdown after the silent beat
    knock(args.silent_to + 1.7, buf, amp=0.4)  # relief "ahhh" sigh
    for i in range(int(0.9 * SR)):
        t = i / SR
        add(buf, 8.6 + t, math.sin(2 * math.pi * (300 + 120 * t) * t) * env_exp(t, 4) * 0.12)

    peak = max(1e-9, max(abs(v) for v in buf))
    scale = min(1.0, 0.89 / peak)  # headroom before loudnorm
    with wave.open(args.out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        frames = bytearray()
        for v in buf:
            s = int(max(-1.0, min(1.0, v * scale)) * 32767)
            frames += struct.pack("<hh", s, s)  # dual mono; swap in true stereo panning if needed
        w.writeframes(bytes(frames))
    print(f"wrote {args.out}: {total:.2f}s, 48 kHz stereo, peak {peak:.3f}")


if __name__ == "__main__":
    main()
