"use client";
import { type ReactNode, type RefObject, useEffect, useRef, useState } from "react";

type FloatingMenuProps = {
  targetRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  //Offset from the top of the browser when fixed (optional)
  fixedTopOffset?: number;
  fixedRightOffset?: number;
};

function FloatingMenu({
  targetRef,
  children,
  fixedTopOffset = 10,
  fixedRightOffset = 0,
}: FloatingMenuProps) {
  const [isFixed, setIsFixed] = useState(false);
  const [fixedTop, setFixedTop] = useState<number>(0);
  const [fixedRight, setFixedRight] = useState<number>(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!targetRef.current || !menuRef.current) return;

      const targetRect = targetRef.current.getBoundingClientRect();

      // Determine whether the target Div is completely above the viewport (the top exceeds the screen)
      if (targetRect.bottom < 0) {
        // The target Div is completely scrolled out of the top, and the menu is no longer fixed
        setIsFixed(false);
        setFixedTop(0);
        setFixedRight(0);
      }
      // Determine whether the target Div is within the viewport or partially within the viewport
      else if (targetRect.top <= 0) {
        // The target Div enters the viewport and starts to be fixed
        setIsFixed(true);
        // Set a fixed top value
        setFixedTop(fixedTopOffset);
        // Set a fixed right value
        setFixedRight(targetRect.right - targetRect.width);
      } else {
        // The target Div is still above the viewport, the menu is not fixed
        setIsFixed(false);
        setFixedTop(0);
        setFixedRight(0);
      }
    };

    window.addEventListener("scroll", handleScroll);
    // Execute once immediately when the component is loaded to initialize the state
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [targetRef, fixedTopOffset]);

  return (
    <div
      ref={menuRef}
      style={{
        position: isFixed ? "fixed" : "absolute",
        top: isFixed ? fixedTop : 0,
        right: fixedRightOffset + (isFixed ? fixedRight : 0),
        // Make sure the menu is above the content
        zIndex: 30,
      }}
    >
      {children}
    </div>
  );
}

export default FloatingMenu;
