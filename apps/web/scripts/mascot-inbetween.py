"""Generate in-between mascot frames with optical flow so the cursor-follow motion reads like video.

For every pair of consecutive source frames (n, n+1) inside the pose ranges used by MascotStage,
write two extra frames at t = 1/3 and t = 2/3 as public/mascot/frame_NNNN_1.webp and _2.webp.
Each in-between is built by warping both neighbours along the dense flow and blending them, which avoids the
ghost of a plain cross-fade. Requires: opencv-python-headless, numpy, pillow.

The take has no single neutral pose: the arms end on different frames (1 and 181 sit lower, 79 and 81 sit higher), so
passing through the centre popped. BRIDGES builds longer flow sequences from those ends to the shared centre frame 79,
as public/mascot/frame_bNNNN_i.webp (i = 1..steps, moving from frame NNNN towards 79).

Run from apps/web:  python scripts/mascot-inbetween.py [--bridges-only]
"""
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

SRC = Path(__file__).resolve().parent.parent / "public" / "mascot"
# Same ranges as X_NEG, X_POS, Y_NEG, Y_POS in src/components/MascotStage.tsx.
RANGES = [(153, 181), (81, 109), (63, 79), (1, 37)]
STEPS = (1 / 3, 2 / 3)
CENTER = 79
# (arm end frame, number of bridge frames to the centre). Keep in sync with BRIDGE_STEPS in MascotStage.tsx.
BRIDGES = [(181, 6), (1, 6), (81, 3)]

dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)


def load(n: int) -> np.ndarray:
    return np.array(Image.open(SRC / f"frame_{n:04d}.webp").convert("RGB"))


def warp(img: np.ndarray, flow: np.ndarray, scale: float, grid: tuple[np.ndarray, np.ndarray]) -> np.ndarray:
    gx, gy = grid
    mx = (gx + flow[..., 0] * scale).astype(np.float32)
    my = (gy + flow[..., 1] * scale).astype(np.float32)
    return cv2.remap(img, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def inbetweens(a: np.ndarray, b: np.ndarray, steps: tuple[float, ...] = STEPS) -> list[np.ndarray]:
    ga = cv2.cvtColor(a, cv2.COLOR_RGB2GRAY)
    gb = cv2.cvtColor(b, cv2.COLOR_RGB2GRAY)
    f_ab = dis.calc(ga, gb, None)  # a -> b
    f_ba = dis.calc(gb, ga, None)  # b -> a
    h, w = ga.shape
    grid = tuple(np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32)))  # type: ignore[assignment]
    out = []
    for t in steps:
        from_a = warp(a, f_ba, t, grid)  # sample a at x + t * flow_ba
        from_b = warp(b, f_ab, 1 - t, grid)  # sample b at x + (1 - t) * flow_ab
        out.append(cv2.addWeighted(from_a, 1 - t, from_b, t, 0))
    return out


def main() -> None:
    count = 0
    for end, n in BRIDGES:
        steps = tuple(i / (n + 1) for i in range(1, n + 1))
        for i, frame in enumerate(inbetweens(load(end), load(CENTER), steps), start=1):
            Image.fromarray(frame).save(SRC / f"frame_b{end:04d}_{i}.webp", "WEBP", quality=82, method=6)
            count += 1
    if "--bridges-only" in sys.argv:
        print(f"wrote {count} bridge frames to {SRC}")
        return
    for lo, hi in RANGES:
        for n in range(lo, hi):
            a, b = load(n), load(n + 1)
            for i, frame in enumerate(inbetweens(a, b), start=1):
                Image.fromarray(frame).save(SRC / f"frame_{n:04d}_{i}.webp", "WEBP", quality=82, method=6)
                count += 1
    print(f"wrote {count} in-between frames to {SRC}")


if __name__ == "__main__":
    main()
