import { RootState } from "./../index";
import { lightSlotColor, darkSlotColor } from "./../../constants/colors";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SlotColorData } from "../../constants/commonTypes";

interface ThemeSliceState {
  theme: Theme;
  slotColors: { [k in Theme]?: SlotColorData[] };
}

type Theme = "light" | "dark";
const themeLocalStorageKey = "main_theme";
const availableThemes: Theme[] = ["light", "dark"];

const getInitialTheme = () => {
  const isBrowserDark =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const defaultTheme = isBrowserDark ? "dark" : "light";
  const storedTheme = localStorage.getItem(themeLocalStorageKey) as Theme;
  const initialTheme =
    availableThemes.indexOf(storedTheme) === -1 ? defaultTheme : storedTheme;
  localStorage.setItem(themeLocalStorageKey, initialTheme);
  return initialTheme;
};

const initialState: ThemeSliceState = {
  theme: getInitialTheme(),
  slotColors: {
    light: lightSlotColor,
    dark: darkSlotColor,
  },
  // slot color state goes here
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      localStorage.setItem(themeLocalStorageKey, action.payload);
    },
  },
});
export const selectSlotColorData = (state: RootState) =>
  state.theme.slotColors[state.theme.theme];
export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
