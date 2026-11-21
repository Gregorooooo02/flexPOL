export interface IdleHedgieScene {
  setActive(active: boolean): void;
  dispose(): void;
}

export function mountIdleHedgie(viewport: HTMLElement, onContextLost: () => void): IdleHedgieScene;
