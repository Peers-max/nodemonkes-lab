import { PixelGrid, PixelColor, MotionActionType, MotionActionMeta, MOTION_ACTION_PRESETS } from './types';
import { easeInOutQuad, drawActionFrame, GifActionType, calculateAdaptiveGifBudget } from '../../utils/gifEngine';

export { calculateAdaptiveGifBudget };

export function clamp(v: number, min = 0, max = 255): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

export function getBounds(grid: PixelGrid | null) {
  if (!grid) return { minY: 0, maxY: 27, minX: 0, maxX: 27 };
  let minY = 28, maxY = -1, minX = 28, maxX = -1;
  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      if (grid[y] && grid[y][x]) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  if (minY > maxY) return { minY: 0, maxY: 27, minX: 0, maxX: 27 };
  return { minY, maxY, minX, maxX };
}

// --- 1. Head Dynamic Effects Engine (20 Distinct Effects + None) ---
export function applyHeadEffect(
  name: string,
  fxId: string,
  baseGrid: PixelGrid | null,
  f: number,
  totalFrames: number = 8
): PixelGrid | null {
  if (!baseGrid) return null;
  if (!fxId || fxId === 'none') return baseGrid;

  const progress = (f % totalFrames) / totalFrames;
  const sineWave = Math.sin(progress * Math.PI * 2);
  const frameGrid: PixelGrid = [];
  const bounds = getBounds(baseGrid);
  const width = Math.max(1, bounds.maxX - bounds.minX + 1);
  const height = Math.max(1, bounds.maxY - bounds.minY + 1);

  for (let y = 0; y < 28; y++) {
    const row: (PixelColor | null)[] = [];
    for (let x = 0; x < 28; x++) {
      const p = baseGrid[y] ? baseGrid[y][x] : null;
      if (!p) { row.push(null); continue; }
      let { r, g, b, a } = p;

      switch (fxId) {
        case 'vertical_shimmer': {
          const sweepX = Math.round(bounds.minX - 1 + progress * (width + 3));
          const dist = Math.abs(x - sweepX);
          if (dist <= 1) {
            const boost = (dist === 0) ? 60 : 35;
            r = clamp(r + boost); g = clamp(g + boost); b = clamp(b + boost);
          } else {
            const breathe = sineWave * 14;
            r = clamp(r + breathe); g = clamp(g + breathe); b = clamp(b + breathe);
          }
          break;
        }
        case 'dual_beam': {
          const sweep1 = Math.round(bounds.minX + progress * width);
          const sweep2 = Math.round(bounds.minX + ((progress + 0.5) % 1) * width);
          if (Math.abs(x - sweep1) <= 1 || Math.abs(x - sweep2) <= 1) {
            r = clamp(r + 50); g = clamp(g + 50); b = clamp(b + 50);
          }
          break;
        }
        case 'diagonal_glint': {
          const sweep = bounds.minX + bounds.minY + progress * (width + height + 2) - 2;
          const dist = Math.abs((x + y * 0.75) - sweep);
          if (dist <= 1.5) {
            const boost = Math.round(70 * (1 - dist / 1.5));
            r = clamp(r + boost); g = clamp(g + boost); b = clamp(b + boost);
          }
          break;
        }
        case 'pingpong_radar': {
          const pp = 0.5 - 0.5 * Math.cos(progress * Math.PI * 2);
          const sweepX = Math.round(bounds.minX + pp * width);
          if (Math.abs(x - sweepX) <= 1) {
            r = clamp(r + 65); g = clamp(g + 65); b = clamp(b + 65);
          }
          break;
        }
        case 'comet_trail': {
          const headX = bounds.minX - 2 + progress * (width + 6);
          const diff = headX - x;
          if (diff >= 0 && diff <= 4) {
            const intensity = 1 - (diff / 4);
            const boost = Math.round(75 * intensity);
            r = clamp(r + boost); g = clamp(g + boost); b = clamp(b + boost);
          } else {
            const breathe = sineWave * 10;
            r = clamp(r + breathe); g = clamp(g + breathe); b = clamp(b + breathe);
          }
          break;
        }
        case 'holo_prism': {
          const phase = (x * 0.25 - progress * Math.PI * 2);
          r = clamp(r + Math.sin(phase) * 60);
          g = clamp(g + Math.sin(phase + 2.09) * 60);
          b = clamp(b + Math.sin(phase + 4.18) * 60);
          break;
        }
        case 'cyber_neon': {
          const wave = Math.sin((x - bounds.minX) * 0.35 + progress * Math.PI * 2);
          if (wave > 0) {
            r = clamp(r + wave * 60); b = clamp(b + wave * 70);
          } else {
            g = clamp(g - wave * 60); b = clamp(b - wave * 70);
          }
          break;
        }
        case 'pure_gold': {
          const sweepX = Math.round(bounds.minX + progress * width);
          if (Math.abs(x - sweepX) <= 1) {
            r = clamp(r + 70); g = clamp(g + 45); b = clamp(b + 10);
          } else {
            const goldBreathe = sineWave * 18;
            r = clamp(r + goldBreathe * 1.2); g = clamp(g + goldBreathe * 0.8);
          }
          break;
        }
        case 'imperial_jade': {
          const jadeSweep = Math.sin((x - bounds.minX) * 0.25 + (y - bounds.minY) * 0.2 + progress * Math.PI * 2);
          r = clamp(r + jadeSweep * 10);
          g = clamp(g + jadeSweep * 65);
          b = clamp(b + jadeSweep * 30);
          break;
        }
        case 'glacier_ice': {
          const icePhase = Math.sin((x - bounds.minX) * 0.3 - (y - bounds.minY) * 0.2 + progress * Math.PI * 2);
          r = clamp(r + icePhase * 15);
          g = clamp(g + icePhase * 40);
          b = clamp(b + icePhase * 75);
          break;
        }
        case 'electric_arc': {
          const noise = Math.sin(x * 12.9898 + y * 78.233 + f * 15.32) * 43758.5453;
          const flicker = (noise - Math.floor(noise)) > 0.68;
          if (flicker) {
            r = clamp(r + 80); g = clamp(g + 110); b = clamp(b + 140);
          } else {
            const glow = sineWave * 25;
            r = clamp(r + glow); g = clamp(g + glow); b = clamp(b + glow);
          }
          break;
        }
        case 'matrix_scan': {
          const scanY = Math.floor(bounds.minY + progress * height);
          const distY = Math.abs(y - scanY);
          if (distY <= 1) {
            r = clamp(r + 20); g = clamp(g + 115); b = clamp(b + 50);
          } else {
            const scanline = (y % 2 === 0) ? -12 : 12;
            g = clamp(g + scanline);
          }
          break;
        }
        case 'overcharge': {
          let charge = 0;
          if (f <= 5) charge = (f / 5) * 40;
          else if (f === 6) charge = 90;
          else charge = 15;
          r = clamp(r + charge); g = clamp(g + charge); b = clamp(b + charge * 1.2);
          break;
        }
        case 'terminator_red': {
          const sweepX = Math.round(bounds.minX + progress * width);
          const dist = Math.abs(x - sweepX);
          if (dist <= 1.2) {
            r = clamp(r + 90); g = clamp(g - 20); b = clamp(b - 20);
          } else {
            r = clamp(r + 15);
          }
          break;
        }
        case 'cosmic_stardust': {
          const swirl = Math.sin(((x - bounds.minX) * 0.25 + (y - bounds.minY) * 0.2) + progress * Math.PI * 2);
          r = clamp(r + swirl * 45);
          g = clamp(g + swirl * 15);
          b = clamp(b + swirl * 60);
          break;
        }
        case 'diamond_bling': {
          const isSparkPoint = (((x - bounds.minX) * 3 + (y - bounds.minY) * 7) % 7 === (f % 7));
          if (isSparkPoint) {
            r = 255; g = 255; b = 255;
          } else {
            const glint = (((x - bounds.minX) + (y - bounds.minY)) % 3 === (f % 3)) ? 35 : 0;
            r = clamp(r + glint); g = clamp(g + glint); b = clamp(b + glint);
          }
          break;
        }
        case 'lava_flame': {
          const heat = Math.sin((bounds.maxY - y) * 0.45 + progress * Math.PI * 2);
          r = clamp(r + heat * 70);
          g = clamp(g + heat * 38);
          b = clamp(b - heat * 25);
          break;
        }
        case 'ocean_tidal': {
          const ripple = Math.sin(((x - bounds.minX) * 0.3 + (y - bounds.minY) * 0.2) - progress * Math.PI * 2);
          r = clamp(r - ripple * 20);
          g = clamp(g + ripple * 45);
          b = clamp(b + ripple * 70);
          break;
        }
        case 'luxury_breathe': {
          const pulse = (Math.cos(progress * Math.PI * 2) * 0.5 + 0.5);
          const factor = 0.7 + pulse * 0.55;
          r = clamp(r * factor); g = clamp(g * factor); b = clamp(b * factor);
          break;
        }
        case 'twinkling_stars': {
          const hash = Math.sin(x * 91.345 + y * 47.123 + f * 3.1415) * 10000;
          const isStar = (hash - Math.floor(hash)) > 0.72;
          if (isStar) {
            r = clamp(r + 70); g = clamp(g + 70); b = clamp(b + 90);
          } else {
            const ambient = sineWave * 10;
            r = clamp(r + ambient); g = clamp(g + ambient); b = clamp(b + ambient);
          }
          break;
        }
        default: {
          break;
        }
      }
      row.push({ r, g, b, a });
    }
    frameGrid.push(row);
  }
  return frameGrid;
}

// --- 2. Eye Dynamic Effects Engine (20 Distinct Effects + None) ---
export function applyEyeEffect(
  name: string,
  fxId: string,
  baseGrid: PixelGrid | null,
  f: number,
  totalFrames: number = 8,
  isPeer: boolean = false,
  eyelidColor?: { r: number; g: number; b: number } | null
): PixelGrid | null {
  if (!baseGrid) return null;
  if (!fxId || fxId === 'none') return baseGrid;

  const progress = (f % totalFrames) / totalFrames;
  const frameGrid: PixelGrid = [];
  const bounds = getBounds(baseGrid);
  const width = Math.max(1, bounds.maxX - bounds.minX + 1);
  const height = Math.max(1, bounds.maxY - bounds.minY + 1);
  const midX = Math.round((bounds.minX + bounds.maxX) / 2);
  const isPeerEye = isPeer || (bounds.minX <= 7 && bounds.maxX >= 22);

  const lidR = eyelidColor?.r ?? (name === 'Pepe' ? 45 : 180);
  const lidG = eyelidColor?.g ?? (name === 'Pepe' ? 175 : 140);
  const lidB = eyelidColor?.b ?? (name === 'Pepe' ? 35 : 100);

  for (let y = 0; y < 28; y++) {
    const row: (PixelColor | null)[] = [];
    for (let x = 0; x < 28; x++) {
      let p = baseGrid[y] ? baseGrid[y][x] : null;

      // On PEER with decorative brow/lashes at Y=13:
      // When closed (f=5 in natural_blink or sleepy_snap), ensure the full forehead bar (x: 6..19)
      // is covered with smooth eyelid skin tone even if the trait PNG had null gaps between lashes
      if (isPeerEye && y === 13 && x >= 6 && x <= 19 && bounds.minY <= 13) {
        if ((fxId === 'natural_blink' || fxId === 'sleepy_snap') && f === 5) {
          p = p || { r: lidR, g: lidG, b: lidB, a: 255 };
        }
      }

      if (!p) { row.push(null); continue; }

      let { r, g, b, a } = p;
      const relX = (x - bounds.minX) / width;

      const eyeTopY = 14;
      const eyeBottomY = 15;

      switch (fxId) {
        case 'natural_blink': {
          if (name === 'Pepe') {
            if (f === 5) {
              r = 45; g = 175; b = 35;
            } else if (f === 4 || f === 6) {
              if (y <= 14) { r = 45; g = 175; b = 35; }
            }
          } else {
            if (f === 5) {
              if (y === eyeBottomY) {
                // Seam line
                r = 25; g = 25; b = 25;
              } else if (y === eyeTopY) {
                // Eyelid row
                r = lidR; g = lidG; b = lidB;
              } else if (y < eyeTopY) {
                // Decorative row above eyeball (e.g. Lashes, Monobrow):
                if (isPeerEye && x >= 20) {
                  // Beside the eyebrow outside forehead: clear so no black lash residue from base image shows
                  a = 0;
                } else if (!isPeerEye || x <= 19) {
                  // Forehead skin covers lash roots smoothly
                  r = lidR; g = lidG; b = lidB;
                }
              }
            } else if (f === 4 || f === 6) {
              if (y === eyeTopY) {
                // Half-closed: upper eye row narrows to eyelid skin tone
                r = lidR; g = lidG; b = lidB;
              }
            }
          }
          break;
        }
        case 'chill_squint': {
          if (name === 'Pepe') {
            if (f === 4 || f === 5) {
              if (y <= 14) { r = 45; g = 175; b = 35; }
              if (y === 15 && (x === bounds.minX || x === bounds.maxX)) {
                r = clamp(r + 40); g = clamp(g + 40); b = clamp(b + 40);
              }
            } else if (f === 3 || f === 6) {
              if (y <= 14) { r = 45; g = 175; b = 35; }
            }
          } else {
            if (f === 4 || f === 5) {
              if (y === eyeTopY) {
                // Top row narrows into eyelid skin tone
                r = lidR; g = lidG; b = lidB;
              } else if (y === eyeBottomY) {
                // Subtle warm relaxed gleam on remaining eye pixels
                r = clamp(r + 35); g = clamp(g + 30); b = clamp(b + 20);
              }
            } else if (f === 3 || f === 6) {
              if (y === eyeTopY) {
                r = clamp(r * 0.7 + lidR * 0.3);
                g = clamp(g * 0.7 + lidG * 0.3);
                b = clamp(b * 0.7 + lidB * 0.3);
              }
            }
          }
          break;
        }
        case 'gaze_highlight': {
          // Specular highlight gently drifting across the eye surface
          // Smooth sine sweep across the width
          const sweepX = bounds.minX + (progress * (width + 3)) - 1;
          const dist = Math.abs(x - sweepX);
          if (dist < 0.8) {
            r = clamp(r * 0.5 + 130);
            g = clamp(g * 0.5 + 130);
            b = clamp(b * 0.5 + 140);
          } else if (dist < 1.8) {
            r = clamp(r + 40);
            g = clamp(g + 40);
            b = clamp(b + 50);
          }
          break;
        }
        case 'divine_gold': {
          // Divine 24K gold aura breathing with a gentle travelling shimmer
          const breath = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5;
          const sweepX = bounds.minX + ((f * 2) % (width + 2));
          const isGleam = Math.abs(x - sweepX) <= 1;
          const gleamBoost = isGleam ? 0.35 : 0;
          const goldAmount = 0.5 + 0.3 * breath + gleamBoost;
          // Rich 24K gold: R: 255, G: 215, B: 20
          r = clamp(r * (1 - goldAmount * 0.7) + 255 * goldAmount);
          g = clamp(g * (1 - goldAmount * 0.7) + 210 * goldAmount);
          b = clamp(b * (1 - goldAmount * 0.7) + 30 * goldAmount);
          break;
        }
        case 'cyber_scan': {
          const beamX = Math.round(bounds.minX + progress * (width + 2) - 1);
          const dist = Math.abs(x - beamX);
          if (dist === 0) {
            r = 0; g = 240; b = 255;
          } else if (dist === 1) {
            r = clamp(r + 20); g = clamp(g + 90); b = clamp(b + 120);
          }
          break;
        }
        case 'holo_iridescent': {
          const huePhase = (relX + progress) % 1.0;
          let hr = 0, hg = 0, hb = 0;
          if (huePhase < 0.33) {
            hr = 0; hg = 220; hb = 255;
          } else if (huePhase < 0.66) {
            hr = 255; hg = 50; hb = 220;
          } else {
            hr = 255; hg = 210; hb = 40;
          }
          r = clamp(r * 0.4 + hr * 0.6);
          g = clamp(g * 0.4 + hg * 0.6);
          b = clamp(b * 0.4 + hb * 0.6);
          break;
        }
        case 'plasma_burst': {
          if (f === 5) {
            r = 255; g = 255; b = 255;
          } else if (f === 4) {
            r = 100; g = 200; b = 255;
          } else if (f === 6) {
            r = clamp(r + 80); g = clamp(g + 100); b = clamp(b + 130);
          } else {
            const charge = (f / 4) * 30;
            r = clamp(r + charge * 0.3); g = clamp(g + charge * 0.6); b = clamp(b + charge);
          }
          break;
        }
        case 'aurora_flow': {
          const wave = Math.sin((relX * 2 + progress * 2) * Math.PI);
          if (wave > 0) {
            r = clamp(r * 0.4 + 20);
            g = clamp(g * 0.4 + 240 * wave);
            b = clamp(b * 0.4 + 140 * wave);
          } else {
            const w2 = -wave;
            r = clamp(r * 0.4 + 180 * w2);
            g = clamp(g * 0.4 + 30);
            b = clamp(b * 0.4 + 240 * w2);
          }
          break;
        }
        case 'deep_pulse': {
          const pulse = (Math.cos(progress * Math.PI * 2) * 0.5 + 0.5);
          const factor = 0.65 + pulse * 0.6;
          r = clamp(r * factor);
          g = clamp(g * factor);
          b = clamp(b * factor);
          break;
        }
        case 'glitch_jitter': {
          if (f === 3) {
            r = clamp(r * 0.3); g = clamp(g + 120); b = clamp(b + 160);
          } else if (f === 4) {
            r = clamp(r + 160); g = clamp(g * 0.3); b = clamp(b * 0.3);
          }
          break;
        }
        case 'matrix_rain': {
          const dropY = bounds.minY + Math.floor((f * 1.5 + x) % (height + 2));
          if (y === dropY) {
            r = 240; g = 255; b = 240;
          } else if (y === dropY - 1) {
            r = 30; g = 220; b = 50;
          } else {
            r = clamp(r * 0.4); g = clamp(g * 0.6 + 30); b = clamp(b * 0.4);
          }
          break;
        }
        case 'inferno_ember': {
          const flicker = Math.sin((x * 3 + f * 4)) * 40;
          r = clamp(r + 70 + flicker);
          g = clamp(g * 0.6 + 40 + flicker * 0.5);
          b = clamp(b * 0.3);
          break;
        }
        case 'sleepy_snap': {
          if (f === 3 || f === 4) {
            if (y === eyeTopY) {
              r = lidR; g = lidG; b = lidB;
            }
          } else if (f === 5) {
            if (y === eyeBottomY) {
              r = 25; g = 25; b = 25;
            } else if (y === eyeTopY) {
              r = lidR; g = lidG; b = lidB;
            } else if (y < eyeTopY) {
              if (isPeerEye && x >= 20) {
                a = 0;
              } else if (!isPeerEye || x <= 19) {
                r = lidR; g = lidG; b = lidB;
              }
            }
          } else if (f === 6) {
            if (y === eyeTopY || y === eyeBottomY) {
              r = clamp(r + 60); g = clamp(g + 60); b = clamp(b + 60);
            }
          }
          break;
        }
        case 'neon_tracer': {
          const isBorder = (x === bounds.minX || x === bounds.maxX || y === bounds.minY || y === bounds.maxY);
          const step = (f * 3) % (width * 2 + height * 2);
          let currentStep = (x - bounds.minX) + (y - bounds.minY);
          if (isBorder && Math.abs(currentStep - step) <= 1) {
            r = 255; g = 230; b = 0;
          }
          break;
        }
        case 'frost_gaze': {
          // Arctic ice crystal shimmer: crystalline cyan-blue glow
          const wave = Math.sin((relX * 2.5 + progress * 2) * Math.PI);
          const frostFactor = Math.max(0, wave);
          // Ice Cyan: R: 140, G: 235, B: 255
          r = clamp(r * 0.4 + (100 + 40 * frostFactor));
          g = clamp(g * 0.4 + (200 + 55 * frostFactor));
          b = clamp(b * 0.4 + (235 + 20 * frostFactor));
          if (frostFactor > 0.85) {
            // Crystalline glint peak
            r = clamp(r + 50); g = clamp(g + 50); b = 255;
          }
          break;
        }
        case 'overheat_alert': {
          if (f === 2 || f === 4) {
            r = 255; g = 20; b = 20;
          } else if (f >= 5) {
            const cool = (f - 5) * 20;
            r = clamp(r * 0.8 + 40 - cool);
            g = clamp(g * 0.8);
            b = clamp(b * 0.8);
          }
          break;
        }
        case 'nebula_pulse': {
          // Ethereal cosmic nebula: deep violet and electric magenta breathing waves
          const wave = Math.sin((relX * 2 - progress * 2) * Math.PI);
          const pulse = Math.cos(progress * Math.PI * 2) * 0.5 + 0.5;
          // Magenta/Violet transition:
          const nr = 190 + 60 * wave;
          const ng = 50 + 40 * (1 - pulse);
          const nb = 240 + 15 * pulse;
          const blend = 0.55 + 0.35 * pulse;
          r = clamp(r * (1 - blend) + nr * blend);
          g = clamp(g * (1 - blend) + ng * blend);
          b = clamp(b * (1 - blend) + nb * blend);
          break;
        }
        case 'disco_spectrum': {
          const colorIndex = f % 4;
          if (colorIndex === 0) { r = 255; g = 20; b = 147; }
          else if (colorIndex === 1) { r = 0; g = 230; b = 255; }
          else if (colorIndex === 2) { r = 50; g = 255; b = 50; }
          else { r = 255; g = 215; b = 0; }
          break;
        }
        case 'hex_shield': {
          const gridPattern = (x + y * 2 + f) % 3 === 0;
          if (gridPattern) {
            r = clamp(r * 0.3 + 40);
            g = clamp(g * 0.3 + 180);
            b = clamp(b * 0.3 + 255);
          }
          break;
        }
        case 'moonlight_glimmer': {
          const diag = (x + y - (bounds.minX + bounds.minY));
          const sweepPos = Math.round(progress * (width + height + 2));
          const diff = Math.abs(diag - sweepPos);
          if (diff === 0) {
            r = 255; g = 255; b = 255;
          } else if (diff === 1) {
            r = clamp(r + 80); g = clamp(g + 90); b = clamp(b + 120);
          }
          break;
        }
        default: {
          break;
        }
      }
      row.push({ r, g, b, a });
    }
    frameGrid.push(row);
  }
  return frameGrid;
}

// --- 2.5 Earring Dynamic Effects Engine (10 Distinct Effects + None) ---
export function applyEarringEffect(
  name: string,
  fxId: string,
  baseGrid: PixelGrid | null,
  f: number,
  totalFrames: number = 8
): PixelGrid | null {
  if (!baseGrid) return null;
  if (!fxId || fxId === 'none') return baseGrid;

  const progress = (f % totalFrames) / totalFrames;
  const bounds = getBounds(baseGrid);
  const width = Math.max(1, bounds.maxX - bounds.minX + 1);
  const height = Math.max(1, bounds.maxY - bounds.minY + 1);

  // Color, Shimmer, and Lighting Shaders
  const frameGrid: PixelGrid = [];
  for (let y = 0; y < 28; y++) {
    const row: (PixelColor | null)[] = [];
    for (let x = 0; x < 28; x++) {
      const p = baseGrid[y] ? baseGrid[y][x] : null;
      if (!p) { row.push(null); continue; }
      let { r, g, b, a } = p;
      const relX = (x - bounds.minX) / width;
      const relY = (y - bounds.minY) / height;

      switch (fxId) {
        case 'sparkle_star': {
          // Brilliant pure white jewelry facet starburst
          const isTopFacet = (x === bounds.minX && y === bounds.minY);
          const isBottomFacet = (x === bounds.maxX && y === bounds.maxY);
          if ((f === 2 || f === 3) && isTopFacet) {
            r = 255; g = 255; b = 255;
          } else if ((f === 6 || f === 7) && isBottomFacet) {
            r = 255; g = 255; b = 255;
          } else if (f === 2 || f === 6) {
            r = clamp(r + 55); g = clamp(g + 55); b = clamp(b + 55);
          }
          break;
        }
        case 'gold_gleam': {
          // 24K Liquid Gold shimmer wave
          const wave = Math.sin((progress * 2 + relY + relX) * Math.PI * 2) * 0.5 + 0.5;
          r = clamp(r * 0.55 + 255 * 0.45 * wave);
          g = clamp(g * 0.55 + 220 * 0.45 * wave);
          b = clamp(b * 0.55 + 30 * 0.45 * wave);
          break;
        }
        case 'glint_flash': {
          // Instant sharp jeweler's camera flash reflection
          if (f === 4) {
            r = clamp(r + 150); g = clamp(g + 150); b = clamp(b + 150);
          } else if (f === 3 || f === 5) {
            r = clamp(r + 65); g = clamp(g + 65); b = clamp(b + 65);
          }
          break;
        }
        case 'neon_pulse': {
          // Cyberpunk neon pulse between cyan and magenta
          const t = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5;
          r = clamp(r * 0.35 + (t * 255 + (1 - t) * 0) * 0.65);
          g = clamp(g * 0.35 + (t * 40 + (1 - t) * 235) * 0.65);
          b = clamp(b * 0.35 + 255 * 0.65);
          break;
        }
        case 'aurora_glow': {
          // Ethereal aurora green-purple soft gradient
          const aWave = Math.sin((progress + relX) * Math.PI * 2) * 0.5 + 0.5;
          r = clamp(r * 0.45 + (aWave * 60 + (1 - aWave) * 160) * 0.55);
          g = clamp(g * 0.45 + (aWave * 255 + (1 - aWave) * 60) * 0.55);
          b = clamp(b * 0.45 + (aWave * 180 + (1 - aWave) * 255) * 0.55);
          break;
        }
        case 'disco_rainbow': {
          // Cut diamond chromatic dispersion
          const phase = ((x + y) * 0.4 - progress * Math.PI * 2);
          r = clamp(r * 0.35 + (Math.sin(phase) * 0.5 + 0.5) * 210 + 40);
          g = clamp(g * 0.35 + (Math.sin(phase + 2.09) * 0.5 + 0.5) * 210 + 40);
          b = clamp(b * 0.35 + (Math.sin(phase + 4.18) * 0.5 + 0.5) * 210 + 40);
          break;
        }
        case 'ember_warmth': {
          // Warm glowing liquid ember breath
          const breath = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5;
          r = clamp(r * 0.55 + 255 * 0.45);
          g = clamp(g * 0.55 + (100 + breath * 100) * 0.45);
          b = clamp(b * 0.35 + 15);
          break;
        }
        case 'frost_ice': {
          // Glacial crystalline ice blue
          const iWave = Math.sin((progress * 2 - relY) * Math.PI * 2) * 0.5 + 0.5;
          r = clamp(r * 0.35 + (140 + iWave * 60) * 0.65);
          g = clamp(g * 0.35 + (230 + iWave * 25) * 0.65);
          b = clamp(b * 0.35 + 255 * 0.65);
          break;
        }
        default:
          break;
      }

      row.push({ r, g, b, a });
    }
    frameGrid.push(row);
  }
  return frameGrid;
}

// --- 3. Image & Grid Utilities ---
const imageCache = new Map<string, HTMLImageElement>();

export function normalizeTraitUrl(url: string): string {
  if (!url) return url;
  // If it's a normal trait (head, eyes, earring), prefer the local static bundle in public/traits/normal/
  const normalTraitMatch = url.match(/https:\/\/pub-2f0821e8464b4c139f681d763393f4ee\.r2\.dev\/(head|eyes|earring)\/([^/]+)/);
  if (normalTraitMatch) {
    return `/traits/normal/${normalTraitMatch[1]}/${normalTraitMatch[2]}`;
  }
  const peerEyesMatch = url.match(/https:\/\/pub-026e5fdeaab545cc9c5aa34738735770\.r2\.dev\/eyes\/([^/]+)/);
  if (peerEyesMatch) {
    return `/traits/peer/eyes/${peerEyesMatch[1]}`;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return url
      .replace('https://pub-2f0821e8464b4c139f681d763393f4ee.r2.dev', '/r2-normal')
      .replace('https://pub-4d8b3f7049bb4025a6642c75eeb71c46.r2.dev', '/r2-dog')
      .replace('https://pub-d7a7a960d42949efb84bea391aa90d4c.r2.dev', '/r2-block')
      .replace('https://pub-e50795db8d0d41dd942f04a8b290f95f.r2.dev', '/r2-rabbit')
      .replace('https://pub-026e5fdeaab545cc9c5aa34738735770.r2.dev', '/r2-peer');
  }
  return url;
}

export function extractNativeEyeGrid(
  upperImg: HTMLImageElement | HTMLCanvasElement,
  isPeer: boolean = false
): PixelGrid {
  const cvs = document.createElement('canvas');
  cvs.width = 28;
  cvs.height = 28;
  const c = cvs.getContext('2d');
  if (!c) return [];
  c.imageSmoothingEnabled = false;
  c.drawImage(upperImg, 0, 0, 28, 28);
  const imgData = c.getImageData(0, 0, 28, 28).data;
  const grid: PixelGrid = [];
  const minX = isPeer ? 6 : 12;
  const maxX = 23;
  const minY = 14;
  const maxY = 15;
  for (let y = 0; y < 28; y++) {
    const row: (PixelColor | null)[] = [];
    for (let x = 0; x < 28; x++) {
      if (y >= minY && y <= maxY && x >= minX && x <= maxX) {
        const idx = (y * 28 + x) * 4;
        const a = imgData[idx + 3];
        if (a > 20) {
          row.push({
            r: imgData[idx],
            g: imgData[idx + 1],
            b: imgData[idx + 2],
            a: a
          });
        } else {
          row.push(null);
        }
      } else {
        row.push(null);
      }
    }
    grid.push(row);
  }
  return grid;
}

export function loadCanvasImage(url: string): Promise<HTMLImageElement> {
  const finalUrl = normalizeTraitUrl(url);
  if (imageCache.has(finalUrl)) {
    return Promise.resolve(imageCache.get(finalUrl)!);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!finalUrl.startsWith('/')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      imageCache.set(finalUrl, img);
      if ('decode' in img) {
        img.decode().catch(() => {}).then(() => resolve(img));
      } else {
        resolve(img);
      }
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${finalUrl}`));
    img.src = finalUrl;
  });
}

export function imageToGrid(img: HTMLImageElement): PixelGrid {
  const canvas = document.createElement('canvas');
  canvas.width = 28;
  canvas.height = 28;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, 28, 28);
  const imgData = ctx.getImageData(0, 0, 28, 28).data;
  const grid: PixelGrid = [];
  for (let y = 0; y < 28; y++) {
    const row: (PixelColor | null)[] = [];
    for (let x = 0; x < 28; x++) {
      const idx = (y * 28 + x) * 4;
      const a = imgData[idx + 3];
      if (a > 20) {
        row.push({
          r: imgData[idx],
          g: imgData[idx + 1],
          b: imgData[idx + 2],
          a: a
        });
      } else {
        row.push(null);
      }
    }
    grid.push(row);
  }
  return grid;
}

export function renderGridToContext(
  ctx: CanvasRenderingContext2D,
  grid: PixelGrid | null,
  size: number
) {
  if (!grid) return;
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < 28; y++) {
    const startY = Math.floor((y * size) / 28);
    const endY = Math.ceil(((y + 1) * size) / 28);
    const h = endY - startY;

    for (let x = 0; x < 28; x++) {
      const p = grid[y] ? grid[y][x] : null;
      if (p) {
        const startX = Math.floor((x * size) / 28);
        const nextP = grid[y]?.[x + 1];
        const isRightEdge = !nextP || nextP.a === 0;
        // At right boundary, extend 1px to completely cover any sub-pixel bleed from underlying image
        const endX = Math.ceil(((x + 1) * size) / 28) + (isRightEdge ? 1 : 0);
        const w = endX - startX;

        if (p.a === 0) {
          ctx.clearRect(startX, startY, w, h);
        } else {
          ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.a / 255})`;
          ctx.fillRect(startX, startY, w, h);
        }
      }
    }
  }
}

// --- 4. Synthesis of Custom Upper & Lower Canvases for Motion ---
// Slices a composite DIY character into upper body (head + accessories) and lower body (torso & legs)
export function createSplitCanvases(
  bodyGrid: PixelGrid | null,
  earringGrid: PixelGrid | null,
  animatedEyeGrid: PixelGrid | null,
  animatedHeadGrid: PixelGrid | null,
  showLayers: { body: boolean; earring: boolean; eyes: boolean; head: boolean },
  size: number = 280
): { upperCanvas: HTMLCanvasElement; lowerCanvas: HTMLCanvasElement } {
  const upperCanvas = document.createElement('canvas');
  upperCanvas.width = size;
  upperCanvas.height = size;
  const upperCtx = upperCanvas.getContext('2d')!;

  const lowerCanvas = document.createElement('canvas');
  lowerCanvas.width = size;
  lowerCanvas.height = size;
  const lowerCtx = lowerCanvas.getContext('2d')!;

  const pixelSize = size / 28;

  // 1. Separate Body into Upper (y <= 16) and Lower (y >= 17)
  if (showLayers.body && bodyGrid) {
    for (let y = 0; y < 28; y++) {
      for (let x = 0; x < 28; x++) {
        const p = bodyGrid[y] ? bodyGrid[y][x] : null;
        if (!p) continue;
        const colorStr = `rgba(${p.r},${p.g},${p.b},${p.a / 255})`;
        const rx = Math.floor(x * pixelSize);
        const ry = Math.floor(y * pixelSize);
        const rw = Math.ceil(pixelSize);
        const rh = Math.ceil(pixelSize);

        if (y <= 16) {
          upperCtx.fillStyle = colorStr;
          upperCtx.fillRect(rx, ry, rw, rh);
        } else {
          lowerCtx.fillStyle = colorStr;
          lowerCtx.fillRect(rx, ry, rw, rh);
        }
      }
    }
  }

  // 2. Earring is part of head/upper
  if (showLayers.earring && earringGrid) {
    renderGridToContext(upperCtx, earringGrid, size);
  }

  // 3. Eyes (with dynamic animation) is part of head/upper
  if (showLayers.eyes && animatedEyeGrid) {
    renderGridToContext(upperCtx, animatedEyeGrid, size);
  }

  // 4. Head (with dynamic animation) is part of head/upper
  if (showLayers.head && animatedHeadGrid) {
    renderGridToContext(upperCtx, animatedHeadGrid, size);
  }

  return { upperCanvas, lowerCanvas };
}

// --- 5. Universal Master Action Frame Renderer (100% Exact Official Engine) ---
export function renderMotionDiyFrame(
  ctx: CanvasRenderingContext2D,
  size: number,
  upperCanvas: CanvasImageSource,
  lowerCanvas: CanvasImageSource,
  action: MotionActionType,
  progress: number, // 0 to 1
  bgColor: string | null,
  monkeImg: CanvasImageSource | null = null,
  antiAlias: boolean = true
) {
  drawActionFrame(
    ctx,
    upperCanvas,
    lowerCanvas,
    monkeImg,
    action as GifActionType,
    progress,
    size,
    bgColor,
    antiAlias
  );
}

// --- 6. GIF Export Generator with Full Dual Engine ---
export async function generateCustomDiyGif(options: {
  bodyGrid: PixelGrid | null;
  earringGrid: PixelGrid | null;
  eyeGrid: PixelGrid | null;
  headGrid: PixelGrid | null;
  headFxId: string;
  eyeFxId: string;
  headName: string;
  eyeName: string;
  action: MotionActionType;
  backgroundColor: string | null;
  resolution?: number;
  speed?: number;
  antiAlias?: boolean;
  showLayers: { body: boolean; earring: boolean; eyes: boolean; head: boolean };
  onProgress?: (progress: number) => void;
}): Promise<Blob> {
  const {
    bodyGrid,
    earringGrid,
    eyeGrid,
    headGrid,
    headFxId,
    eyeFxId,
    headName,
    eyeName,
    action,
    backgroundColor,
    resolution = 400,
    speed = 1.0,
    showLayers,
    onProgress
  } = options;

  let GIFConstructor = (window as any).GIF;
  if (!GIFConstructor) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load gif.js script'));
      document.head.appendChild(script);
    });
    GIFConstructor = (window as any).GIF;
  }

  if (!GIFConstructor) {
    throw new Error('GIF encoder not available');
  }

  const effectiveBg = backgroundColor || '#06080F';
  const meta = MOTION_ACTION_PRESETS.find((p) => p.id === action) || MOTION_ACTION_PRESETS[0];
  const cycleDuration = action === 'headbang' ? 800 : (action === 'static' ? 1200 : 1200);
  const budget = calculateAdaptiveGifBudget(meta.frameCount, resolution, cycleDuration, speed);
  const frameCount = budget.frameCount;
  const frameDelay = budget.frameDelay;

  const gif = new GIFConstructor({
    workers: 2,
    quality: 10,
    width: resolution,
    height: resolution,
    workerScript: './gif.worker.js',
    transparent: backgroundColor === null ? 0x00000000 : null,
    background: effectiveBg,
    repeat: 0,
  });

  const renderCanvas = document.createElement('canvas');
  renderCanvas.width = resolution;
  renderCanvas.height = resolution;
  const renderCtx = renderCanvas.getContext('2d', { willReadFrequently: true })!;

  console.log('>>> generateCustomDiyGif called, action =', action, 'frameCount =', frameCount);

  for (let f = 0; f < frameCount; f++) {
    const progress = f / frameCount;
    // Accessory micro-effects run on 8-frame cycle
    const fxFrame = f % 8;

    const animEyeGrid = applyEyeEffect(eyeName, eyeFxId, eyeGrid, fxFrame, 8);
    const animHeadGrid = applyHeadEffect(headName, headFxId, headGrid, fxFrame, 8);

    const { upperCanvas, lowerCanvas } = createSplitCanvases(
      bodyGrid,
      earringGrid,
      animEyeGrid,
      animHeadGrid,
      showLayers,
      resolution
    );

    renderMotionDiyFrame(
      renderCtx,
      resolution,
      upperCanvas,
      lowerCanvas,
      action,
      progress,
      backgroundColor
    );

    gif.addFrame(renderCtx, { copy: true, delay: frameDelay });
    if (onProgress) {
      onProgress(Math.round(((f + 1) / frameCount) * 70));
    }
    await new Promise((r) => setTimeout(r, 4));
  }

  console.log('>>> All frames added, setting up gif callbacks and calling render()');

  return new Promise<Blob>((resolve, reject) => {
    gif.on('progress', (p: number) => {
      console.log('>>> gif render progress:', p);
      if (onProgress) {
        onProgress(70 + Math.round(p * 30));
      }
    });

    gif.on('finished', (blob: Blob) => {
      console.log('>>> gif finished! Blob size:', blob.size);
      resolve(blob);
    });

    gif.on('abort', () => {
      console.error('>>> gif aborted!');
      reject(new Error('GIF generation aborted'));
    });

    try {
      gif.render();
      console.log('>>> gif.render() successfully invoked');
    } catch (err) {
      console.error('>>> gif.render() threw error:', err);
      reject(err);
    }
  });
}

export interface ComboMonkeGifOptions {
  monkeId: number;
  upperImg: HTMLImageElement;
  lowerImg: HTMLImageElement;
  fullImg?: HTMLImageElement | null;
  headGrid: PixelGrid | null;
  eyeGrid: PixelGrid | null;
  earringGrid?: PixelGrid | null;
  headName: string;
  eyeName: string;
  earringName?: string;
  headFxId: string;
  eyeFxId: string;
  earringFxId?: string;
  action: MotionActionType;
  backgroundColor: string | null;
  resolution?: number;
  speed?: number;
  actionSpeed?: number;
  headSpeed?: number;
  eyeSpeed?: number;
  earringSpeed?: number;
  antiAlias?: boolean;
  showLayers?: { body: boolean; eyes: boolean; head: boolean; earring?: boolean };
  onProgress?: (progress: number) => void;
  isPeer?: boolean;
  eyelidColor?: { r: number; g: number; b: number } | null;
}

export async function generateComboMonkeGif(options: ComboMonkeGifOptions): Promise<Blob> {
  const {
    upperImg,
    lowerImg,
    fullImg,
    headGrid,
    eyeGrid,
    earringGrid,
    headName,
    eyeName,
    earringName = 'None',
    headFxId,
    eyeFxId,
    earringFxId = 'none',
    action,
    backgroundColor,
    resolution = 400,
    speed = 1.0,
    actionSpeed,
    headSpeed,
    eyeSpeed,
    earringSpeed,
    antiAlias = true,
    showLayers = { body: true, eyes: true, head: true, earring: true },
    onProgress,
    isPeer = false,
    eyelidColor
  } = options;

  const actSpeed = actionSpeed ?? speed ?? 1.0;
  const hSpeed = headSpeed ?? speed ?? 1.0;
  const eSpeed = eyeSpeed ?? speed ?? 1.0;
  const earSpeed = earringSpeed ?? speed ?? 1.0;

  let GIFConstructor = (window as any).GIF;
  if (!GIFConstructor) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load gif.js script'));
      document.head.appendChild(script);
    });
    GIFConstructor = (window as any).GIF;
  }

  if (!GIFConstructor) {
    throw new Error('GIF encoder not available');
  }

  const effectiveBg = backgroundColor || '#06080F';
  const meta = MOTION_ACTION_PRESETS.find((p) => p.id === action) || MOTION_ACTION_PRESETS[0];

  // Guaranteed Grid Retrieval & Self-Healing:
  const isPeerMonke = isPeer || headName === 'Peer';

  let effectiveHeadGrid = headGrid;
  const isSpecialHead = ['Dog', 'Peer', 'Rabbit', 'Block'].includes(headName || '');
  if (!effectiveHeadGrid && headName && headName !== 'None' && !isSpecialHead) {
    try {
      const img = await loadCanvasImage(`/traits/normal/head/${encodeURIComponent(headName)}.png`);
      effectiveHeadGrid = imageToGrid(img);
    } catch (_) {}
  }

  let effectiveEyeGrid = eyeGrid;
  if (!effectiveEyeGrid) {
    if (eyeName && eyeName !== 'None' && eyeName !== 'Classic' && eyeName !== 'Peer') {
      try {
        const eyePath = isPeerMonke
          ? `/traits/peer/eyes/${encodeURIComponent(eyeName)}.png`
          : `/traits/normal/eyes/${encodeURIComponent(eyeName)}.png`;
        const img = await loadCanvasImage(eyePath);
        effectiveEyeGrid = imageToGrid(img);
      } catch (_) {}
    }
    if (!effectiveEyeGrid && upperImg && upperImg.complete) {
      effectiveEyeGrid = extractNativeEyeGrid(upperImg, isPeerMonke);
    }
  }

  let effectiveEarringGrid = earringGrid;
  if (!effectiveEarringGrid && earringName && earringName !== 'None') {
    try {
      const img = await loadCanvasImage(`/traits/normal/earring/${encodeURIComponent(earringName)}.png`);
      effectiveEarringGrid = imageToGrid(img);
    } catch (_) {}
  }

  // Determine active states of micro-FX
  const isHeadActive = headFxId !== 'none' && !!effectiveHeadGrid;
  const isEyeActive = eyeFxId !== 'none' && !!effectiveEyeGrid;
  const isEarringActive = earringFxId !== 'none' && !!effectiveEarringGrid && earringName && earringName !== 'None';

  let totalDurationMs: number;
  let actionLoops = 1;
  let eyeCycles = 1;
  let headCycles = 1;
  let earringCycles = 1;

  if (action === 'static') {
    // In Pure Micro-FX (Still Body) mode:
    // Determine the slowest active effect speed so it gets at least 1 full 8-frame cycle
    const activeSpeeds: number[] = [];
    if (isEyeActive) activeSpeeds.push(eSpeed);
    if (isHeadActive) activeSpeeds.push(hSpeed);
    if (isEarringActive) activeSpeeds.push(earSpeed);

    const minFxSpeed = activeSpeeds.length > 0 ? Math.min(...activeSpeeds) : 1.0;
    // Base cycle is 1200ms. At lower speeds (e.g. 0.5x), duration expands (e.g. 2400ms) to play the full animation smoothly
    totalDurationMs = Math.round(1200 / minFxSpeed);
    // Cap at 6000ms (6.0s) to support ultra-smooth slow motions
    if (totalDurationMs > 6000) totalDurationMs = 6000;

    // Calculate how many integer cycles each active effect completes during totalDurationMs (minimum 1)
    eyeCycles = isEyeActive ? Math.max(1, Math.round(totalDurationMs / (1200 / eSpeed))) : 1;
    headCycles = isHeadActive ? Math.max(1, Math.round(totalDurationMs / (1200 / hSpeed))) : 1;
    earringCycles = isEarringActive ? Math.max(1, Math.round(totalDurationMs / (1200 / earSpeed))) : 1;
  } else {
    // In Dynamic Body Action mode:
    const baseActionDuration = action === 'headbang' ? 800 : 1200;
    const oneActionLoopMs = baseActionDuration / actSpeed;

    // Check if any active micro-FX is running slower than the body action
    const slowestFxSpeed = Math.min(
      isEyeActive ? eSpeed : 999,
      isHeadActive ? hSpeed : 999,
      isEarringActive ? earSpeed : 999
    );

    if (slowestFxSpeed < actSpeed && slowestFxSpeed < 999) {
      // Loop the body action multiple times (up to 4) so that the slow eye/head effect completes a full cycle!
      actionLoops = Math.min(4, Math.max(1, Math.round(actSpeed / slowestFxSpeed)));
    }

    totalDurationMs = Math.round(oneActionLoopMs * actionLoops);
    if (totalDurationMs > 6000) totalDurationMs = 6000;
    eyeCycles = isEyeActive ? Math.max(1, Math.round(totalDurationMs / (1200 / eSpeed))) : 1;
    headCycles = isHeadActive ? Math.max(1, Math.round(totalDurationMs / (1200 / hSpeed))) : 1;
    earringCycles = isEarringActive ? Math.max(1, Math.round(totalDurationMs / (1200 / earSpeed))) : 1;
  }

  // Calculate resolution-adaptive frame budget
  const baseFrames = Math.round(Math.min(48, Math.max(12, (meta.frameCount || 16) * actionLoops * (action === 'static' ? (totalDurationMs / 1200) : 1))));
  const budget = calculateAdaptiveGifBudget(baseFrames, resolution, totalDurationMs, 1.0);
  const frameCount = budget.frameCount;
  const frameDelay = budget.frameDelay;

  const gif = new GIFConstructor({
    workers: 2,
    quality: 10,
    width: resolution,
    height: resolution,
    workerScript: './gif.worker.js',
    transparent: backgroundColor === null ? 0x00000000 : null,
    background: effectiveBg,
    repeat: 0,
  });

  const renderCanvas = document.createElement('canvas');
  renderCanvas.width = resolution;
  renderCanvas.height = resolution;
  const renderCtx = renderCanvas.getContext('2d', { willReadFrequently: true })!;

  const upperCompCanvas = document.createElement('canvas');
  upperCompCanvas.width = resolution;
  upperCompCanvas.height = resolution;
  const upperCompCtx = upperCompCanvas.getContext('2d', { willReadFrequently: true })!;
  console.log(`>>> generateComboMonkeGif: res=${resolution}px, frames=${frameCount}, delay=${frameDelay}ms, total=${frameCount * frameDelay}ms, action=${action}(x${actionLoops}), head=${headName}(${headFxId}, x${headCycles}), eye=${eyeName}(${eyeFxId}, x${eyeCycles}), ear=${earringName}(${earringFxId}, x${earringCycles})`);

  for (let f = 0; f < frameCount; f++) {
    const globalProgress = f / frameCount;
    const bodyActionProgress = (globalProgress * actionLoops) % 1;

    // Every active effect completes its integer cycles smoothly without truncation:
    const headFxFrame = ((Math.floor(globalProgress * headCycles * 8) % 8) + 8) % 8;
    const eyeFxFrame = ((Math.floor(globalProgress * eyeCycles * 8) % 8) + 8) % 8;
    const earringFxFrame = ((Math.floor(globalProgress * earringCycles * 8) % 8) + 8) % 8;

    upperCompCtx.clearRect(0, 0, resolution, resolution);
    upperCompCtx.imageSmoothingEnabled = false;

    if (showLayers.body && upperImg && upperImg.complete) {
      upperCompCtx.drawImage(upperImg, 0, 0, resolution, resolution);
    }

    if (showLayers.head && headFxId !== 'none' && effectiveHeadGrid) {
      const animHead = applyHeadEffect(headName, headFxId, effectiveHeadGrid, headFxFrame, 8);
      renderGridToContext(upperCompCtx, animHead, resolution);
    }

    if (showLayers.eyes && eyeFxId !== 'none' && effectiveEyeGrid) {
      const animEyes = applyEyeEffect(
        eyeName,
        eyeFxId,
        effectiveEyeGrid,
        eyeFxFrame,
        8,
        isPeer || headName === 'Peer',
        eyelidColor
      );
      renderGridToContext(upperCompCtx, animEyes, resolution);
    }

    if (showLayers.earring !== false && effectiveEarringGrid && earringName && earringName !== 'None' && earringFxId !== 'none') {
      const animEarring = applyEarringEffect(earringName, earringFxId, effectiveEarringGrid, earringFxFrame, 8);
      renderGridToContext(upperCompCtx, animEarring, resolution);
    }

    renderMotionDiyFrame(
      renderCtx,
      resolution,
      upperCompCanvas,
      lowerImg,
      action,
      bodyActionProgress,
      backgroundColor,
      fullImg || null,
      antiAlias
    );

    gif.addFrame(renderCtx, { copy: true, delay: frameDelay });
    if (onProgress) {
      onProgress(Math.round(((f + 1) / frameCount) * 70));
    }
    await new Promise((r) => setTimeout(r, 4));
  }

  return new Promise<Blob>((resolve, reject) => {
    gif.on('progress', (p: number) => {
      if (onProgress) {
        onProgress(70 + Math.round(p * 30));
      }
    });

    gif.on('finished', (blob: Blob) => {
      console.log('>>> generateComboMonkeGif FINISHED! Blob size =', blob.size);
      resolve(blob);
    });

    gif.on('abort', () => {
      console.error('>>> generateComboMonkeGif aborted!');
      reject(new Error('GIF generation aborted'));
    });

    try {
      console.log('>>> generateComboMonkeGif calling gif.render()');
      gif.render();
    } catch (err) {
      console.error('>>> gif.render() error:', err);
      reject(err);
    }
  });
}
