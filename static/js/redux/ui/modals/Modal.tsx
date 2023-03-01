import React, { MouseEventHandler, ReactNode, useState } from "react";
// @ts-ignore
import Rodal from "rodal";
import useDelayUnmount from "../../hooks/useDelayedUnmount";

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

/**
 * This is the generic modal component that is used for all modals. It is a wrapper of
 * the Rodal library.
 */
const Modal = (props: RodalProps) => {
  if ("visible" in props) {
    const shouldRenderPopup = useDelayUnmount(props.visible, 500);
    return <>{shouldRenderPopup && <Rodal {...props}>{props.children}</Rodal>}</>;
  }
  return <Rodal {...props}>{props.children}</Rodal>;
};
export default Modal;
