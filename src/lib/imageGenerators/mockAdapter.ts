import { ImageGeneratorAdapter, GenerateImageOptions } from './types';

export class MockGraphicAdapter implements ImageGeneratorAdapter {
  id = 'mock_demo';
  name = 'Built-in Comic Synth Engine (Demo / Offline)';

  async generatePanelImage(options: GenerateImageOptions): Promise<string> {
    const { panel, artStyle } = options;

    // Simulate realistic generation latency (400ms - 800ms)
    await new Promise(r => setTimeout(r, 600));

    const canvas = document.createElement('canvas');
    const width = 1024;
    const height = 640;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D context not supported');
    }

    // 1. Determine color schemes based on art style
    let bgGradStart = '#0f172a';
    let bgGradEnd = '#020617';
    let accent1 = '#06b6d4';
    let accent2 = '#ec4899';
    let lineStyle = 'cyber';

    if (artStyle.id === 'cyberpunk-neon') {
      bgGradStart = '#0b091a';
      bgGradEnd = '#1e1035';
      accent1 = '#00f0ff';
      accent2 = '#ff007f';
      lineStyle = 'cyber';
    } else if (artStyle.id === 'western-heroic') {
      bgGradStart = '#1e293b';
      bgGradEnd = '#0f172a';
      accent1 = '#f59e0b';
      accent2 = '#ef4444';
      lineStyle = 'action';
    } else if (artStyle.id === 'manga-anime') {
      bgGradStart = '#18181b';
      bgGradEnd = '#09090b';
      accent1 = '#a855f7';
      accent2 = '#3b82f6';
      lineStyle = 'manga';
    } else if (artStyle.id === 'noir-detective') {
      bgGradStart = '#050505';
      bgGradEnd = '#1a1a1a';
      accent1 = '#e11d48';
      accent2 = '#f8fafc';
      lineStyle = 'noir';
    } else if (artStyle.id === 'watercolor-fantasy') {
      bgGradStart = '#064e3b';
      bgGradEnd = '#022c22';
      accent1 = '#34d399';
      accent2 = '#fbbf24';
      lineStyle = 'fantasy';
    }

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, bgGradStart);
    grad.addColorStop(1, bgGradEnd);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Dynamic Comic Perspective & Architectural Elements
    ctx.save();
    if (lineStyle === 'cyber') {
      // Draw neon grid floor
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 2;
      const horizonY = height * 0.55;
      const vanishX = width * 0.5;

      for (let x = -width; x < width * 2; x += 80) {
        ctx.beginPath();
        ctx.moveTo(vanishX, horizonY);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = horizonY; y < height; y += 25) {
        const factor = (y - horizonY) / (height - horizonY);
        ctx.lineWidth = 1 + factor * 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Cyber cityscape towers
      ctx.fillStyle = 'rgba(15, 12, 35, 0.9)';
      const towerCount = 7;
      for (let i = 0; i < towerCount; i++) {
        const tx = (i * width) / towerCount;
        const tw = width / towerCount - 15;
        const th = 150 + ((i * 47) % 220);
        ctx.fillRect(tx, horizonY - th, tw, th + 20);

        // Windows / neon lights
        ctx.fillStyle = i % 2 === 0 ? accent1 : accent2;
        for (let wy = horizonY - th + 20; wy < horizonY; wy += 25) {
          if (Math.sin(i * 10 + wy) > 0) {
            ctx.fillRect(tx + 10, wy, 8, 4);
            ctx.fillRect(tx + tw - 18, wy, 8, 4);
          }
        }
        ctx.fillStyle = 'rgba(15, 12, 35, 0.9)';
      }
    } else if (lineStyle === 'action' || lineStyle === 'manga') {
      // Radial Manga Speed lines from center
      const centerX = width * (panel.panel_index % 2 === 1 ? 0.65 : 0.35);
      const centerY = height * 0.45;
      const rayCount = 48;

      ctx.strokeStyle = lineStyle === 'manga' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(245, 158, 11, 0.2)';
      ctx.lineWidth = 2;

      for (let i = 0; i < rayCount; i++) {
        const angle = (i * 2 * Math.PI) / rayCount;
        const dist = Math.max(width, height) * 1.2;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(angle) * 80, centerY + Math.sin(angle) * 80);
        ctx.lineTo(centerX + Math.cos(angle) * dist, centerY + Math.sin(angle) * dist);
        ctx.stroke();
      }
    } else if (lineStyle === 'noir') {
      // Strong chiaroscuro horizontal blinds / high shadow angle
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      for (let y = 0; y < height; y += 30) {
        ctx.fillRect(0, y, width, 14);
      }
    }
    ctx.restore();

    // 3. Draw Stylized Character Silhouette & Mood Lighting
    ctx.save();
    const charX = width * 0.45;
    const charY = height * 0.35;

    // Glowing aura behind character
    const auraGrad = ctx.createRadialGradient(charX, charY + 80, 20, charX, charY + 80, 240);
    auraGrad.addColorStop(0, accent1);
    auraGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.3)');
    auraGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(charX, charY + 80, 240, 0, Math.PI * 2);
    ctx.fill();

    // Character Silhouette
    ctx.fillStyle = '#07060c';
    ctx.strokeStyle = accent2;
    ctx.lineWidth = 3;

    // Head / visor
    ctx.beginPath();
    ctx.arc(charX, charY, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Torso / shoulders
    ctx.beginPath();
    ctx.moveTo(charX - 85, charY + 180);
    ctx.lineTo(charX - 45, charY + 50);
    ctx.lineTo(charX + 45, charY + 50);
    ctx.lineTo(charX + 85, charY + 180);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Visor / eyes glow
    ctx.fillStyle = accent1;
    ctx.fillRect(charX - 25, charY - 6, 50, 10);

    ctx.restore();

    // 4. Comic Onomatopoeia / Impact FX
    if (panel.shot_type === 'dutch_angle' || panel.shot_type === 'close_up' || panel.mood.toLowerCase().includes('action')) {
      ctx.save();
      ctx.translate(width * 0.82, height * 0.28);
      ctx.rotate(-0.15);

      ctx.font = '900 62px Bangers, Impact, sans-serif';
      ctx.textAlign = 'center';
      
      const sfx = panel.shot_type === 'dutch_angle' ? 'BAM!' : 'ZZZT!';
      // Shadow
      ctx.fillStyle = '#000000';
      ctx.fillText(sfx, 5, 5);
      // Glow / Stroke
      ctx.lineWidth = 8;
      ctx.strokeStyle = accent2;
      ctx.strokeText(sfx, 0, 0);
      // Fill
      ctx.fillStyle = '#ffffff';
      ctx.fillText(sfx, 0, 0);
      ctx.restore();
    }

    // 5. Halftone Dots Texture Overlay
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    const dotSpacing = 16;
    for (let x = 0; x < width; x += dotSpacing) {
      for (let y = 0; y < height; y += dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // 6. Vignette and Cinematic Border
    const vig = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.7);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);

    // 7. Shot Type & Scene Meta Overlay in bottom corner
    ctx.save();
    ctx.font = '600 15px JetBrains Mono, monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`[${panel.shot_type.toUpperCase()}] • ${panel.mood}`, 24, height - 24);
    ctx.restore();

    return canvas.toDataURL('image/png');
  }
}
