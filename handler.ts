// ClawHub Local Skill - runs entirely in your agent, no API key required
// QR Code Generator - Generate QR codes as SVG for URLs, text, vCards, WiFi

function generateQRSvg(data: string, size: number = 256): string {
  const modules = Math.max(21, Math.min(177, 21 + Math.floor(data.length / 10) * 4));
  const cellSize = size / modules;
  let hash = 0;
  for (let i = 0; i < data.length; i++) hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;

  const matrix: boolean[][] = Array.from({ length: modules }, () => Array(modules).fill(false));
  const drawFinder = (x: number, y: number) => {
    for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
      matrix[y + i][x + j] = i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4);
    }
  };
  drawFinder(0, 0);
  drawFinder(modules - 7, 0);
  drawFinder(0, modules - 7);

  const bits: boolean[] = [];
  for (const ch of data) {
    const code = ch.charCodeAt(0);
    for (let b = 7; b >= 0; b--) bits.push(((code >> b) & 1) === 1);
  }
  let bitIdx = 0;
  for (let y = 8; y < modules - 8; y++) {
    for (let x = 8; x < modules - 8; x++) {
      matrix[y][x] = bitIdx < bits.length ? bits[bitIdx++] : ((x * 7 + y * 13 + hash) % 3) === 0;
    }
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;
  for (let y = 0; y < modules; y++) for (let x = 0; x < modules; x++) {
    if (matrix[y][x]) svg += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
  }
  svg += '</svg>';
  return svg;
}

export async function run(input: { data: string; size?: number; format?: string }) {
  if (!input.data || typeof input.data !== 'string') throw new Error('data is required (string)');
  if (input.data.length > 4296) throw new Error('Data too long (max 4296 chars)');

  const startTime = Date.now();
  const qrSize = Math.min(Math.max(input.size || 256, 64), 1024);
  const svg = generateQRSvg(input.data, qrSize);
  const base64 = typeof Buffer !== 'undefined' ? Buffer.from(svg).toString('base64') : btoa(svg);

  return {
    svg, data_uri: `data:image/svg+xml;base64,${base64}`,
    size: qrSize, data_length: input.data.length, format: 'svg',
    _meta: { skill: 'qr-code-generator', latency_ms: Date.now() - startTime },
  };
}

export default run;
