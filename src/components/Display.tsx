import { createStyles, makeStyles } from "@material-ui/core/styles";
import clsx from "clsx";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { DisplayRef } from "../system";

type DisplayProps = {
  className?: string;
  onClick?: () => void;
};

const useStyles = makeStyles(() =>
  createStyles({
    wrapper: {
      flex: 1,
      position: "relative",
      width: "100%",
      height: "100%",
    },
    canvas: {
      position: "absolute",

      // Disable pixel scaling:
      // https://stackoverflow.com/questions/7615009/disable-interpolation-when-scaling-a-canvas
      "image-rendering": "pixelated",
      fallbacks: [
        // Firefox
        {
          "image-rendering": "-moz-crisp-edges",
        },
        // Safari
        {
          "image-rendering": "-webkit-optimize-contrast",
        },
      ],
    },
  }),
);

const DISPLAY_WIDTH = 64;
const DISPLAY_HEIGHT = 32;

export const Display = forwardRef<DisplayRef, DisplayProps>(
  ({ className, onClick }, ref) => {
    const classes = useStyles();
    const sizingWrapperRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageDataRef = useRef<ImageData | null>(null);

    const getImageData = useCallback(() => {
      if (!imageDataRef.current) {
        imageDataRef.current = new ImageData(
          new Uint8ClampedArray(
            new Array<number>(DISPLAY_WIDTH * DISPLAY_HEIGHT * 4).fill(255),
          ),
          DISPLAY_WIDTH,
          DISPLAY_HEIGHT,
        );
      }
      return imageDataRef.current;
    }, []);

    const get = useCallback(
      (pixelOffset: number) => {
        if (pixelOffset < 0 || pixelOffset >= DISPLAY_WIDTH * DISPLAY_HEIGHT) {
          throw new Error("Attempt to read out of range pixel.");
        }
        return getImageData().data[pixelOffset * 4] > 0 ? 0 : 1;
      },
      [getImageData],
    );

    const putImageData = useCallback(() => {
      if (!canvasRef.current) {
        return;
      }
      const context = canvasRef.current.getContext("2d");
      if (!context) {
        return;
      }
      context.putImageData(getImageData(), 0, 0);
    }, [getImageData]);

    const set = useCallback(
      (pixelOffset: number, value: number) => {
        if (!canvasRef.current) {
          return;
        }
        if (pixelOffset < 0 || pixelOffset >= DISPLAY_WIDTH * DISPLAY_HEIGHT) {
          throw new Error("Attempt to draw on out of range pixel.");
        }
        const imageData = getImageData();
        for (let i = pixelOffset * 4; i < pixelOffset * 4 + 3; i += 1) {
          imageData.data[i] = value > 0 ? 0 : 255;
        }
        putImageData();
      },
      [getImageData, putImageData],
    );

    useImperativeHandle(
      ref,
      () => ({ get, set, width: DISPLAY_WIDTH, height: DISPLAY_HEIGHT }),
      [get, set],
    );

    useEffect(() => {
      putImageData();
    }, [putImageData]);

    useEffect(() => {
      const resizeObserver = new ResizeObserver((entries) => {
        if (!sizingWrapperRef.current || !canvasRef.current) {
          return;
        }
        for (const entry of entries) {
          if (entry.target !== sizingWrapperRef.current) {
            continue;
          }
          const wrapperRect = sizingWrapperRef.current.getBoundingClientRect();
          const ratio = DISPLAY_WIDTH / DISPLAY_HEIGHT;
          const width = Math.min(wrapperRect.width, wrapperRect.height * ratio);
          const height = width / 2;
          const left = wrapperRect.width / 2 - width / 2;
          const top = wrapperRect.height / 2 - height / 2;
          canvasRef.current.style.left = `${left}px`;
          canvasRef.current.style.top = `${top}px`;
          canvasRef.current.style.width = `${width}px`;
          canvasRef.current.style.height = `${height}px`;
        }
      });

      if (sizingWrapperRef.current) {
        resizeObserver.observe(sizingWrapperRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    return (
      <div ref={sizingWrapperRef} className={classes.wrapper}>
        <canvas
          ref={canvasRef}
          className={clsx(classes.canvas, className)}
          width={DISPLAY_WIDTH}
          height={DISPLAY_HEIGHT}
          onClick={onClick}
        />
      </div>
    );
  },
);
Display.displayName = "Display";
