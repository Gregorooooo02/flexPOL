export interface HedgieScene {
  readonly ready: Promise<void>;
  mount(viewport: HTMLElement): void;
  celebrate(): void;
  dispose(): void;
}

export function prepareHedgieScene(): HedgieScene;
