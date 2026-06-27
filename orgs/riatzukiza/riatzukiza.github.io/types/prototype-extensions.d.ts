/**
 * Disable type checking for Array.prototype.each and Object.prototype.each
 * These are added by Sibilant at runtime and don't follow normal type rules
 */

declare global {
  interface Array<T> {
    /**
     * Iterates over array elements and returns this array
     * @param {(item: T, index: number) => void} f - Callback function
     */
    each(f: (item: T, index: number) => void): void;
  }

  interface Object {
    /**
     * Iterates over object properties
     * @param {(value: any, key: string) => void} f - Callback function
     */
    each(f: (value: any, key: string) => void): void;
  }
}

export {};
