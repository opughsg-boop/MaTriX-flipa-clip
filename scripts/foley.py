#!/usr/bin/env python3
"""Satisfying object foley for wordless reels (stdlib only, 48 kHz stereo 16-bit WAV).

Each cue is synthesized and panned (pan -1 = left, +1 = right), then mixed on a timeline.
Built-in story sheets: `popcorn` (matches examples/popcorn-panic.ts).

Usage:
    python3 scripts/foley.py --story popcorn --out exports/popcorn-sfx.wav
"""
import argparse
import math
import random
import struct
import wave

SR = 48000


class Mix:
    def __init__(self, duration):
        self.n = int(duration * SR)
        self.L = [0.0] * self.n
        self.R = [0.0] * self.n

    def put(self, t, v, pan=0.0):
        i = int(t * SR)
        if 0 <= i < self.n:
            g = (pan + 1) / 2  # equal-power-ish pan law
            self.L[i] += v * math.cos(g * math.pi / 2)
            self.R[i] += v * math.sin(g * math.pi / 2)


def _rng(seed):
    return random.Random(seed)


def pop(mix, t, amp=0.7, pan=0.0, pitch=620):
    """Kernel / bag pop: pitch-dropping sine body + bright click."""
    for i in range(int(0.09 * SR)):
        s = i / SR
        body = math.sin(2 * math.pi * (pitch * math.exp(-s * 30) + 140) * s) * math.exp(-s * 55)
        mix.put(t + s, body * amp, pan)


def crunch(mix, t, rng, amp=0.5, pan=0.0, bites=4):
    """Chip crunch: a cluster of short band-limited noise snaps."""
    for _ in range(bites):
        t0 = t + rng.uniform(0, 0.16)
        lp = 0.0
        prev = 0.0
        for i in range(int(0.035 * SR)):
            s = i / SR
            n = rng.uniform(-1, 1)
            lp += 0.5 * (n - lp)
            hp = lp - prev * 0.6
            prev = lp
            mix.put(t0 + s, hp * math.exp(-s * 120) * amp, pan)


def fizz(mix, t, dur, rng, amp=0.16, pan=0.0):
    """Soda fizz (psss): high-passed noise with a slow swell and decay."""
    prev = 0.0
    lp = 0.0
    for i in range(int(dur * SR)):
        s = i / SR
        n = rng.uniform(-1, 1)
        lp += 0.25 * (n - lp)
        hp = n - lp
        env = min(1, s / 0.15) * math.exp(-s * 1.6)
        mix.put(t + s, hp * env * amp, pan)


def bubble(mix, t, rng, amp=0.3, pan=0.0):
    """Tiny bubble plink: fast upward sine sweep."""
    f0 = rng.uniform(380, 520)
    for i in range(int(0.07 * SR)):
        s = i / SR
        f = f0 * (1 + 3 * s / 0.07)
        mix.put(t + s, math.sin(2 * math.pi * f * s) * math.exp(-s * 45) * amp, pan)


def clink(mix, t, amp=0.35, pan=0.0):
    """Spoon on bowl ring: two inharmonic partials."""
    for i in range(int(0.9 * SR)):
        s = i / SR
        v = math.sin(2 * math.pi * 2820 * s) * 0.6 + math.sin(2 * math.pi * 4310 * s) * 0.4
        mix.put(t + s, v * math.exp(-s * 7) * amp, pan)


def tick(mix, t, amp=0.25, pan=0.0):
    """Microwave timer tick / button click."""
    for i in range(int(0.02 * SR)):
        s = i / SR
        mix.put(t + s, math.sin(2 * math.pi * 1800 * s) * math.exp(-s * 300) * amp, pan)


def hum(mix, t0, t1, amp=0.035, pan=0.0):
    """Microwave motor hum: 120 Hz with harmonic, soft fade in and out."""
    dur = t1 - t0
    for i in range(int(dur * SR)):
        s = i / SR
        env = min(1, s / 0.3) * min(1, (dur - s) / 0.3)
        v = math.sin(2 * math.pi * 120 * s) + 0.4 * math.sin(2 * math.pi * 240 * s)
        mix.put(t0 + s, v * env * amp, pan)


def slurp_chew(mix, t, rng, amp=0.22, pan=0.0):
    """Soft wet chew: low-passed noise with a jaw-rhythm envelope."""
    lp = 0.0
    for i in range(int(0.22 * SR)):
        s = i / SR
        lp += 0.05 * (rng.uniform(-1, 1) - lp)
        mix.put(t + s, lp * math.sin(math.pi * s / 0.22) * amp, pan)


def popcorn_sheet(mix, rng):
    # microwave on (hum), timer ticks
    hum(mix, 1.2, 5.0, amp=0.03, pan=0.0)
    tick(mix, 1.2, pan=0.2)
    # kernels popping faster and faster while the bag heats up
    t = 1.8
    gap = 0.42
    while t < 4.9:
        pop(mix, t, amp=0.35 + rng.uniform(-0.05, 0.05), pan=rng.uniform(-0.8, 0.8), pitch=700)
        t += gap
        gap *= 0.88
    # silent anticipation beat 5.0-5.8s: nothing
    # the bag bursts: big pop + kernel cascade + crunchy landing
    pop(mix, 5.8, amp=0.95, pan=0.0, pitch=420)
    for k in range(14):
        pop(mix, 5.9 + k * 0.045, amp=0.3, pan=rng.uniform(-0.9, 0.9), pitch=900)
    # bowl catches it: clink + crunches while eating
    clink(mix, 6.4, pan=0.3)
    for k in range(7):
        crunch(mix, 8.3 + k * 0.85, rng, amp=0.55, pan=rng.uniform(-0.2, 0.2))
    # soda can opens: psss, then bubbles
    tick(mix, 11.5, amp=0.5, pan=-0.3)
    fizz(mix, 11.6, 2.0, rng, amp=0.18, pan=-0.4)
    for k in range(10):
        bubble(mix, 11.8 + k * 0.18, rng, amp=0.16, pan=rng.uniform(-0.6, 0.6))
    # happy final crunches
    for k in range(3):
        crunch(mix, 14.2 + k * 0.9, rng, amp=0.5)
    # gentle room tone
    lp = 0.0
    for i in range(mix.n):
        lp += 0.02 * (rng.uniform(-1, 1) - lp)
        mix.L[i] += lp * 0.004
        mix.R[i] += lp * 0.004


def tink(mix, t, amp=0.3, pan=0.0):
    """Ice cube against glass: bright, short, with a ringing partial."""
    for i in range(int(0.35 * SR)):
        s = i / SR
        v = math.sin(2 * math.pi * 2400 * s) * 0.5 + math.sin(2 * math.pi * 3710 * s) * 0.3 + math.sin(2 * math.pi * 5980 * s) * 0.2
        mix.put(t + s, v * math.exp(-s * 16) * amp, pan)


def pour(mix, t0, t1, rng, amp=0.12, pan=0.0):
    """Water pouring: band-limited noise whose brightness rises as the glass fills."""
    dur = t1 - t0
    lp = 0.0
    for i in range(int(dur * SR)):
        s = i / SR
        k = s / dur
        lp += (0.05 + 0.4 * k) * (rng.uniform(-1, 1) - lp)
        mix.put(t0 + s, lp * (0.6 + 0.4 * k) * amp, pan)


def gulp(mix, t, rng, amp=0.3, pan=0.0):
    """Sip and swallow: low wet throat sound."""
    lp = 0.0
    for i in range(int(0.45 * SR)):
        s = i / SR
        lp += 0.04 * (rng.uniform(-1, 1) - lp)
        mix.put(t + s, lp * math.sin(math.pi * s / 0.45) * amp * 6, pan)


def ice_sheet(mix, rng):
    hum_fridge = 0.0
    for i in range(mix.n):  # soft kitchen room tone
        hum_fridge += 0.02 * (rng.uniform(-1, 1) - hum_fridge)
        mix.L[i] += hum_fridge * 0.004
        mix.R[i] += hum_fridge * 0.004
    for t in (1.8, 2.5, 3.2, 3.9):  # cubes drop into the glass
        tink(mix, t, amp=0.32, pan=rng.uniform(-0.3, 0.3))
        pop(mix, t + 0.02, amp=0.15, pan=0.0, pitch=260)  # small water plunk
    pour(mix, 4.5, 5.5, rng)
    # silent beat 5.5-6.0
    gulp(mix, 6.4, rng)
    gulp(mix, 7.0, rng, amp=0.2)
    for t in (8.8, 9.1, 9.35):  # rattle with the ice when the glass is set down
        tink(mix, t, amp=0.22, pan=rng.uniform(-0.5, 0.5))
    # happy "ahhh" swell and one last tink
    for i in range(int(2.5 * SR)):
        s = i / SR
        env = math.sin(math.pi * min(1, s / 2.5)) * 0.05
        mix.put(11.0 + s, math.sin(2 * math.pi * 320 * s) * env, 0.0)
    tink(mix, 12.5, amp=0.18)


STORIES = {"popcorn": (popcorn_sheet, 18.0), "ice": (ice_sheet, 18.0)}


def write_wav(path, mix):
    peak = max(1e-9, max(max(abs(v) for v in mix.L), max(abs(v) for v in mix.R)))
    scale = min(1.0, 0.89 / peak)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        buf = bytearray()
        for l, r in zip(mix.L, mix.R):
            buf += struct.pack("<hh", int(max(-1, min(1, l * scale)) * 32767), int(max(-1, min(1, r * scale)) * 32767))
        w.writeframes(bytes(buf))
    return peak


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--story", choices=sorted(STORIES), required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    sheet, dur = STORIES[args.story]
    mix = Mix(dur)
    sheet(mix, _rng(7))
    peak = write_wav(args.out, mix)
    print(f"wrote {args.out}: {dur:.1f}s, 48 kHz stereo, peak {peak:.3f}")


if __name__ == "__main__":
    main()
