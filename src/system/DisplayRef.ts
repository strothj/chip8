export type DisplayRef = {
  get: (pixelOffset: number) => number;
  set: (pixelOffset: number, value: number) => void;
  width: number;
  height: number;
};
