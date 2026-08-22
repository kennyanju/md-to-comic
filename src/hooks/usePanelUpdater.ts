import { ComicPage, PanelScript, DialogueItem, BubbleType } from '../types/comic';
import { generateUUID } from '../lib/crypto';

export function usePanelUpdater(
  pages: ComicPage[],
  onPagesChange: (pages: ComicPage[]) => void
) {
  const updatePanel = (
    panelId: string,
    updater: (p: PanelScript) => PanelScript,
    targetPageIdx?: number
  ) => {
    const newPages = pages.map((page, pIdx) => {
      if (targetPageIdx !== undefined && pIdx !== targetPageIdx) return page;
      const hasPanel = page.panels.some(p => p.id === panelId);
      if (!hasPanel) return page;

      return {
        ...page,
        panels: page.panels.map(panel => panel.id === panelId ? updater(panel) : panel)
      };
    });
    onPagesChange(newPages);
  };

  const addPanel = (pageIdx: number, defaultCharacterName: string = 'Hero') => {
    const targetPage = pages[pageIdx];
    if (!targetPage) return;

    const newPanel: PanelScript = {
      id: `panel-${targetPage.page_index}-${targetPage.panels.length + 1}-${generateUUID().slice(0, 8)}`,
      panel_index: targetPage.panels.length + 1,
      page_index: targetPage.page_index,
      shot_type: 'medium',
      scene_description: 'Dramatic comic scene with expressive lighting.',
      mood: 'Dramatic',
      dialogue: [],
      character_tags: [defaultCharacterName],
      generated_prompt: 'Medium cinematic comic shot.',
      status: 'pending'
    };

    const newPages = pages.map((page, pIdx) => {
      if (pIdx !== pageIdx) return page;
      return { ...page, panels: [...page.panels, newPanel] };
    });
    onPagesChange(newPages);
  };

  const removePanel = (panelId: string, pageIdx: number) => {
    const newPages = pages.map((page, pIdx) => {
      if (pIdx !== pageIdx) return page;
      return {
        ...page,
        panels: page.panels
          .filter(p => p.id !== panelId)
          .map((p, idx) => ({ ...p, panel_index: idx + 1 }))
      };
    });
    onPagesChange(newPages);
  };

  const reorderPanels = (pageIdx: number, sourceIdx: number, targetIdx: number) => {
    if (sourceIdx === targetIdx) return;
    const targetPage = pages[pageIdx];
    if (!targetPage || sourceIdx < 0 || targetIdx < 0 || sourceIdx >= targetPage.panels.length || targetIdx >= targetPage.panels.length) {
      return;
    }

    const newPanels = [...targetPage.panels];
    const [moved] = newPanels.splice(sourceIdx, 1);
    newPanels.splice(targetIdx, 0, moved);

    const reindexed = newPanels.map((p, idx) => ({ ...p, panel_index: idx + 1 }));

    const newPages = pages.map((page, pIdx) => {
      if (pIdx !== pageIdx) return page;
      return { ...page, panels: reindexed };
    });
    onPagesChange(newPages);
  };

  const addDialogueItem = (panelId: string, pageIdx: number, speaker: string = 'Hero') => {
    updatePanel(
      panelId,
      p => ({
        ...p,
        dialogue: [
          ...p.dialogue,
          {
            id: `dlg-${generateUUID().slice(0, 8)}`,
            speaker,
            line: 'New dialogue line...',
            type: 'speech'
          }
        ]
      }),
      pageIdx
    );
  };

  const updateDialogueItem = <K extends keyof DialogueItem>(
    panelId: string,
    pageIdx: number,
    dlgId: string,
    field: K,
    value: DialogueItem[K]
  ) => {
    updatePanel(
      panelId,
      p => ({
        ...p,
        dialogue: p.dialogue.map(d => d.id === dlgId ? { ...d, [field]: value } : d)
      }),
      pageIdx
    );
  };

  const removeDialogueItem = (panelId: string, pageIdx: number, dlgId: string) => {
    updatePanel(
      panelId,
      p => ({
        ...p,
        dialogue: p.dialogue.filter(d => d.id !== dlgId)
      }),
      pageIdx
    );
  };

  return {
    updatePanel,
    addPanel,
    removePanel,
    reorderPanels,
    addDialogueItem,
    updateDialogueItem,
    removeDialogueItem
  };
}
