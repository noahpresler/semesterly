declare module "rodal" {
  import { MouseEventHandler, ReactNode } from "react";

  type RodalProps = {
    children?: ReactNode;
    width?: number;
    height?: number;
    measure?: string;
    visible?: boolean;
    showMask?: boolean;
    closeOnEsc?: boolean;
    closeMaskOnClick?: boolean;
    showCloseButton?: boolean;
    animation?: string;
    enterAnimation?: string;
    leaveAnimation?: string;
    duration?: number;
    className?: string;
    customStyles?: { [key: string]: any };
    customMaskStyles?: { [key: string]: any };
    onClose?: MouseEventHandler<HTMLSpanElement>;
    onAnimationEnd?: () => never;
  };

  // @ts-ignore
  const Rodal = (_: RodalProps): JSX.Element => {};
  export = Rodal;
}
