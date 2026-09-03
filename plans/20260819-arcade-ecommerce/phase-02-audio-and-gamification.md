# Phase 2: Web Audio 8-Bit Engine & Coin Drop Easter Egg

## Goals:

- Xây dựng Web Audio oscillator synthesizer (0 KB mp3).
- Header Sound Toggle (Mute/Unmute).
- Hero "INSERT COIN" interactive coin drop + mã giảm giá `COIN10`.

## Changes:

- `src/lib/audio/arcade-audio.ts`: Web Audio chiptune synth helpers (`playCoin`, `playBeep`, `playAddCart`, `playFanfare`).
- `src/components/frankys/Header.tsx`: Nút Loa 8-bit bật/tắt âm thanh.
- `src/routes/index.tsx`: Hiệu ứng thả đồng xu khi bấm "INSERT COIN" và kích hoạt toast tặng voucher.
