import React, { MouseEventHandler, ReactNode } from "react";
// @ts-ignore
import Rodal from "rodal";
import "./rodal.scss";

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
  onClose: MouseEventHandler<HTMLSpanElement>;
  onAnimationEnd?: () => never;
};

const Modal = (props: RodalProps) => {
  return <Rodal {...props}>{props.children}</Rodal>;
};

export default Modal;
