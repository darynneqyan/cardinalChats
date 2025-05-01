/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

export const Colors = {
  cardinal: '#8C1515', // Stanford Cardinal Red
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    100: '#F7F7F7',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  coffee: {
    light: '#8B4513', // Saddle Brown
    dark: '#3E1F09', // Dark Brown
    cream: '#FFF5E6', // Light Cream
  },
  tint: '#8C1515', // Using Stanford Cardinal as the tint color
  background: '#FFFFFF',
  text: '#000000',
};

export type ThemeColors = typeof Colors;

export default Colors;
