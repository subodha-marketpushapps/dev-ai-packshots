import { atom } from "recoil";

export interface CanvasSize {
  width: number;
  height: number;
}

export const canvasSizeState = atom<CanvasSize>({
  key: "canvasSizeState",
  default: {
    width: 800,
    height: 600,
  },
});
