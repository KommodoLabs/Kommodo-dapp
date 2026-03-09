declare module "react-textfit" {
  import * as React from "react";

  export interface TextfitProps {
    mode?: "single" | "multi";
    forceSingleModeWidth?: boolean;
    min?: number;
    max?: number;
    throttle?: number;
    autoResize?: boolean;
    onReady?: (fontSize: number) => void;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }

  export class Textfit extends React.Component<TextfitProps> {}
}