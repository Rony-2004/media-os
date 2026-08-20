export function advanceLoadingStage(current: number, stageCount: number): number {
  if (stageCount <= 0) return 0;
  return (current + 1) % stageCount;
}
