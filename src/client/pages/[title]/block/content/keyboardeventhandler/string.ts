export function removeSubstring(s: string, l: number, r: number): string {
  // Validate input parameters
  if (l < 0 || r < 0 || l > s.length || r > s.length) {
    throw new Error("Invalid range: indices must be within string bounds");
  }

  if (l > r) {
    throw new Error(
      "Invalid range: start index must be less than or equal to end index",
    );
  }

  // Remove substring from l to r (inclusive)
  return s.slice(0, l) + s.slice(r + 1);
}
