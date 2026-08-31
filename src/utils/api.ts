import type { Monke, ColorInfo } from '../types';
import { METADATA_URL, CDN_BASE_URL } from './constants';

let cachedMonkes: Monke[] | null = null;
const colorCache = new Map<number, ColorInfo[]>();

export async function fetchMonkes(): Promise<Monke[]> {
  if (cachedMonkes && cachedMonkes.length > 0) {
    return cachedMonkes;
  }

  try {
    const response = await fetch(METADATA_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const list: Monke[] = Array.isArray(data) ? data : data.nodemonkes || [];
    cachedMonkes = list;
    return list;
  } catch (error) {
    console.error('Error fetching monkes data:', error);
    throw error;
  }
}

export function getMonkeImageUrl(id: number): string {
  return `${CDN_BASE_URL}${id}.png`;
}

export function getSantaMonkeImageUrl(id: number): string {
  return `https://raw.githubusercontent.com/supercrypto1984/santa-nodemonkes/main/public/assets/merged/${id}.png`;
}

export async function getImageColors(imageUrl: string, monkeId?: number): Promise<ColorInfo[]> {
  if (monkeId && colorCache.has(monkeId)) {
    return colorCache.get(monkeId)!;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const colorMap = new Map<string, number>();

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          if (a === 0) continue; // Skip transparent

          const colorKey = `${r},${g},${b}`;
          colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
        }

        const colors = Array.from(colorMap.entries())
          .map(([color, count]) => {
            const [r, g, b] = color.split(',').map(Number);
            return { r, g, b, count };
          })
          .sort((a, b) => b.count - a.count);

        if (monkeId) {
          colorCache.set(monkeId, colors);
        }
        resolve(colors);
      } catch (err) {
        resolve([]);
      }
    };

    img.onerror = () => {
      resolve([]);
    };

    img.src = imageUrl;
  });
}
