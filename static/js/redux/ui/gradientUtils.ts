import { ThemeName } from "./../constants/commonTypes";
import tinycolor from "tinycolor2";

interface RGBObj {
  r: number;
  g: number;
  b: number;
}

export const calcGradientRange = (range: number) => (range === 2 ? range + 1 : range);

const componentToHex = (c: number) => {
  const hex = c.toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
};

export const rgbToHex = ({ r, g, b }: RGBObj) =>
  `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;

export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const subtractRgb = (end: RGBObj, start: RGBObj) => ({
  r: end.r - start.r,
  g: end.g - start.g,
  b: end.b - start.b,
});

export const addRgb = (op1: RGBObj, op2: RGBObj) => ({
  r: op1.r + op2.r,
  g: op1.g + op2.g,
  b: op1.b + op2.b,
});

// Change this to raw division with floats
export const divideRgb = (color: RGBObj, scale: number) => ({
  r: color.r / scale,
  g: color.g / scale,
  b: color.b / scale,
});

export const multRgb = (color: RGBObj, scale: number) => ({
  r: color.r * scale,
  g: color.g * scale,
  b: color.b * scale,
});

// Add this to round only when necessary
export const roundRgb = (color: RGBObj) => ({
  r: Math.round(color.r),
  g: Math.round(color.g),
  b: Math.round(color.b),
});

export const isRgbValid = (color: any) => {
  const invalid = Object.keys(color).some((key) => color[key] > 255 || color[key] < 0);
  return !invalid;
};

export const equalRgb = (a: RGBObj, b: RGBObj) =>
  a.r === b.r && a.g === b.g && a.b === b.b;

export const gradientToSlotColorData = (color: string, curTheme: ThemeName) => ({
  background: color,
  highlight: tinycolor(color).darken(5).toString(),
  border:
    curTheme === "dark"
      ? tinycolor(color).lighten(10).toString()
      : tinycolor(color).darken(20).toString(),
  font: "#222",
});

export const buildGradient = (
  start: string,
  end: string,
  rng: number,
  curTheme: ThemeName
) => {
  if (rng < 2) {
    return [gradientToSlotColorData(start, curTheme)];
    // OR: throw new Error("Gradient should have at least two steps");
  }
  const b = hexToRgb(start); // y-intercept
  const diff = subtractRgb(hexToRgb(end), b);
  // Change this to range - 1 so that you get both start and end as values
  // The caveat here is that range has to be > 1 now
  // (which means you need two colors for a gradient, which is expected anyways)
  const step = divideRgb(diff, rng - 1);
  const gradient: RGBObj[] = [];
  for (let i = 0; i < rng; i += 1) {
    const next = gradient.length > 0 ? addRgb(gradient[gradient.length - 1], step) : b;
    gradient.push(next);
  }
  // Only round when converting to Hex
  return gradient
    .map((color) => rgbToHex(roundRgb(color)))
    .map((color) => gradientToSlotColorData(color, curTheme));
};

export default {};
