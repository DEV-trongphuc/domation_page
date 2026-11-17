/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

declare module 'canvas-confetti' {
  const confetti: ((options?: Record<string, any>) => Promise<null> | null) & {
    reset?: () => void;
    create?: (canvas: HTMLCanvasElement, options?: Record<string, any>) => any;
  };
  export default confetti;
}
