export const Colors = {
  babyBlue: '#5582F3',
  sunlight: '#FFCB66',
  darkBlue: '#0038B3',
  indigo: '#1E1C61',
  cloudBlue: '#EDF2FE',
  lightMidBlue: '#CBD7EE',
  coral: '#EC776F',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorKey = keyof typeof Colors;
