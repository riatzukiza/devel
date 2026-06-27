declare module "audiomotion-analyzer" {
  const AudioMotionAnalyzer: new (container: HTMLElement, options: Record<string, unknown>) => { destroy: () => void };
  export default AudioMotionAnalyzer;
}
