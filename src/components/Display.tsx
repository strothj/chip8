import React, {
  forwardRef,
  Fragment,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";

export type DisplayRef = {
  get: (pixelOffset: number) => number;
  set: (pixelOffset: number, value: number) => void;
  width: number;
  height: number;
};

type DisplayProps = {
  className?: string;
  width?: number;
  height?: number;
  onClick?: () => void;
};

const DEFAULT_DISPLAY_WIDTH = 64;
const DEFAULT_DISPLAY_HEIGHT = 32;

export const Display = forwardRef<DisplayRef, DisplayProps>(
  (
    {
      className,
      width = DEFAULT_DISPLAY_WIDTH,
      height = DEFAULT_DISPLAY_HEIGHT,
      onClick,
    },
    ref,
  ) => {
    const svgRef = useRef<SVGSVGElement>(null);

    const getRect = useCallback((pixelOffset: number) => {
      if (!svgRef.current) {
        throw new Error("Svg element ref not set.");
      }

      return svgRef.current.childNodes[pixelOffset] as SVGRectElement;
    }, []);

    const get = useCallback(
      (pixelOffset: number) => {
        if (pixelOffset < 0 || pixelOffset >= width * height) {
          throw new Error("Attempt to draw on out of range pixel.");
        }
        return getRect(pixelOffset).getAttribute("fill") === "#fff" ? 0 : 1;
      },
      [width, height, getRect],
    );

    const set = useCallback(
      (pixelOffset: number, value: number) => {
        const currentValue = get(pixelOffset);
        if (value > 0 && currentValue === 1) {
          return;
        }
        getRect(pixelOffset).setAttribute("fill", value > 0 ? "#000" : "#fff");
      },
      [getRect, get],
    );

    useImperativeHandle(ref, () => ({ get, set, width, height }), [
      get,
      set,
      width,
      height,
    ]);

    const rects = useMemo(
      () =>
        Array.from({ length: height }, (_, y) => (
          <Fragment key={y}>
            {Array.from({ length: width }, (_, x) => (
              <rect
                key={x}
                x={x.toString()}
                y={y.toString()}
                width="1"
                height="1"
                fill="#fff"
              />
            ))}
          </Fragment>
        )),
      [width, height],
    );

    return (
      <svg
        ref={svgRef}
        className={className}
        viewBox={`0 0 ${width} ${height}`}
        onClick={onClick}
      >
        {rects}
        <rect
          x="0"
          y="0"
          width={width.toString()}
          height={height.toString()}
          fill="transparent"
          stroke="#eee"
          strokeWidth="0.2"
        />
      </svg>
    );
  },
);
