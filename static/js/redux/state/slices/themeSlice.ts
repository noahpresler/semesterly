import { setTheme } from "./../../actions/initActions";
import { RootState } from "./../index";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Theme, ThemeName } from "../../constants/commonTypes";
import themeObject from "../../constants/themes";

interface ThemeSliceState {
  theme: Theme;
}

const themeLocalStorageKey = "main_theme";
const availableThemes: ThemeName[] = Object.keys(themeObject) as ThemeName[];

const getInitialTheme = () => {
  const isBrowserDark =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const defaultTheme = isBrowserDark ? "dark" : "light";
  const storedTheme = localStorage.getItem(themeLocalStorageKey) as ThemeName;
  const initialTheme =
    availableThemes.indexOf(storedTheme) === -1 ? defaultTheme : storedTheme;
  localStorage.setItem(themeLocalStorageKey, initialTheme);
  return themeObject[initialTheme];
};

const initialState: ThemeSliceState = {
  theme: getInitialTheme(),
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    // setTheme: (state, action: PayloadAction<Theme>) => {
    //   state.theme = action.payload;
    //   localStorage.setItem(themeLocalStorageKey, action.payload.name);
    // },
  },
  extraReducers: (builder) => {
    builder.addCase(setTheme, (state, action) => {
      state.theme = action.payload;
      localStorage.setItem(themeLocalStorageKey, action.payload.name);
    });
  },
});
export const selectSlotColorData = (state: RootState) => state.theme.theme.slotColors;
export const selectTheme = (state: RootState): Theme => state.theme.theme;
export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
