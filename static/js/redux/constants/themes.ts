import { lightSlotColor, darkSlotColor } from "./colors";
import { Theme, ThemeObject } from "./commonTypes";

const lightTheme: Theme = {
  name: "light",
  slotColors: lightSlotColor,
  compareTtColors: {
    activeStart: "#fd7473",
    activeEnd: "#f4cece",
    comparedStart: "#5cccf2",
    comparedEnd: "#c2e6f2",
    commonStart: "#36debb",
    commonEnd: "#d9f6f0",
  },
  customEventDefaultColor: "#F8F6F7",
  reactSelectColors: {
    primary: "#2684ff",
    primary25: "#deebff",
    neutral0: "#ffffff",
    neutral20: "#cccccc",
  },
};

const darkTheme: Theme = {
  name: "dark",
  slotColors: darkSlotColor,
  compareTtColors: {
    activeStart: "#f16e66",
    activeEnd: "#60110c",
    comparedStart: "#5598df",
    comparedEnd: "#052c56",
    commonStart: "#39aea3",
    commonEnd: "#064d47",
  },
  customEventDefaultColor: "#979797",
  reactSelectColors: {
    primary: "#4d5057", // selected element: dblue3
    primary25: "#3d3e42", // hover color: dblue6
    neutral0: "#2d2e32", // background color: dblue7
    neutral20: "#5a5d64", // border color: dblue2
  },
};

const themeObject: ThemeObject = {
  [lightTheme.name]: lightTheme,
  [darkTheme.name]: darkTheme,
};

export default themeObject;
