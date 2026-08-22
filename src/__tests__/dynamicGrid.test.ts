import { describe, it, expect } from 'vitest';
import { calculatePanelRects, calculateDynamicPanelRects } from '../lib/canvasCompositor';

describe('Dynamic Grid Generation', () => {
  const containerW = 1200;
  const containerH = 1700;
  const gutter = 14;
  const margin = 28;

  it('should calculate rects for 1 splash panel correctly', () => {
    const rects = calculateDynamicPanelRects(1, containerW - margin * 2, containerH - margin * 2, gutter, margin);
    expect(rects.length).toBe(1);
    expect(rects[0].x).toBe(margin);
    expect(rects[0].y).toBe(margin);
    expect(rects[0].width).toBe(containerW - margin * 2);
    expect(rects[0].height).toBe(containerH - margin * 2);
  });

  it('should calculate rects for 4-panel grid correctly', () => {
    const rects = calculateDynamicPanelRects(4, containerW - margin * 2, containerH - margin * 2, gutter, margin);
    expect(rects.length).toBe(4);
    expect(rects[0].width).toBeGreaterThan(0);
    expect(rects[0].height).toBeGreaterThan(0);
  });

  it('should calculate rects for 7-panel and 8-panel dynamic compositions', () => {
    const rects7 = calculateDynamicPanelRects(7, containerW - margin * 2, containerH - margin * 2, gutter, margin);
    expect(rects7.length).toBe(7);

    const rects8 = calculateDynamicPanelRects(8, containerW - margin * 2, containerH - margin * 2, gutter, margin);
    expect(rects8.length).toBe(8);
  });

  it('should invoke dynamic calculation when layout_type is dynamic-auto', () => {
    const rects = calculatePanelRects('dynamic-auto', containerW, containerH, gutter, margin, 7);
    expect(rects.length).toBe(7);
  });
});
