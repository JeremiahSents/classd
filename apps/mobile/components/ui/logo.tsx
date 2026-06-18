import { Image, type ImageStyle, type StyleProp } from "react-native";

const logo = require("../assets/images/logo.png");

interface LogoProps {
  size?: number;
  /** Recolor the mark to a solid color (e.g. "#fff" on a dark background). */
  tintColor?: string;
  style?: StyleProp<ImageStyle>;
}

/**
 * App logo. The source PNG has a 3:2 aspect ratio (1536x1024) with a
 * transparent background, so `size` controls the width and height scales
 * to keep it crisp.
 */
export function Logo({ size = 96, tintColor, style }: LogoProps) {
  return (
    <Image
      source={logo}
      resizeMode="contain"
      tintColor={tintColor}
      style={[{ width: size, height: size }, style]}
    />
  );
}
