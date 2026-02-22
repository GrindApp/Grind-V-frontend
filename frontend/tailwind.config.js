/** @type {import('tailwindcss').Config} */
export const content = ["./app/**/*.{js,jsx,ts,tsx}"];
export const presets = [require("nativewind/preset")];
export const theme = {
  extend: {
    colors: {
      primary: "#1C1E20",
      secondary: "#999999",
      accent: "#EF4444",
    }
  },
};
export const plugins = [];