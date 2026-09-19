/** Stable keys for rendering `count` skeleton cards. */
export function makeSkeletonKeys(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i);
}