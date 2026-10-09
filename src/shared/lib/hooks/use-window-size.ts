import { useLayoutEffect, useState } from "react";

export type WindowSize = [width: number, height: number];

export const useWindowSize = (): WindowSize => {
  const [size, setSize] = useState<WindowSize>([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return size;
};
