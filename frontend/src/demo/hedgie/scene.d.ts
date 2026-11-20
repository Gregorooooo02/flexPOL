export interface HedgieReaction {
  readonly gesture: 'glance' | 'shake' | 'huff';
  readonly reducedMotion: boolean;
  readonly onSpeech: (visible: boolean) => void;
}

export interface HedgieScene {
  readonly ready: Promise<void>;
  mount(viewport: HTMLElement, reaction?: HedgieReaction): () => void;
  celebrate(): void;
  dispose(): void;
}

export function prepareHedgieScene(): HedgieScene;
