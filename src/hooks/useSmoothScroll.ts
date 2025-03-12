import { useEffect } from "react";

export const useSmoothScroll = () => {
  useEffect(() => {
    let scrollY = window.scrollY || window.pageYOffset;
    let currentScrollY = scrollY;
    let targetScrollY = scrollY;
    const ease = 1; // Lower = smoother

    // Function to normalize scroll speed across different browsers/devices
    const normalizeWheel = (event: WheelEvent) => {
      let pixelY = event.deltaY;

      if (event.deltaMode === 1) {
        // Delta in LINE units
        pixelY *= 40;
      } else if (event.deltaMode === 2) {
        // Delta in PAGE units
        pixelY *= 800;
      }

      return pixelY;
    };

    // Wheel event handler
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      // Get normalized scroll amount
      const scrollAmount = normalizeWheel(event);

      // Update target scroll position
      targetScrollY = Math.max(
        0,
        Math.min(
          document.body.scrollHeight - window.innerHeight,
          targetScrollY + scrollAmount
        )
      );
    };

    // Touch variables
    let touchStart = 0;
    let touchY = 0;
    let isTouch = false;

    // Touch event handlers
    const handleTouchStart = (event: TouchEvent) => {
      isTouch = true;
      touchStart = event.touches[0].clientY;
      touchY = touchStart;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isTouch) return;

      const y = event.touches[0].clientY;
      const delta = touchY - y;
      touchY = y;

      // Update target scroll position
      targetScrollY = Math.max(
        0,
        Math.min(
          document.body.scrollHeight - window.innerHeight,
          targetScrollY + delta * 2
        )
      );

      // Prevent default scrolling
      event.preventDefault();
    };

    const handleTouchEnd = () => {
      isTouch = false;
    };

    // Animation loop
    const update = () => {
      // Calculate current scroll position with lerp formula
      currentScrollY = parseFloat(
        (currentScrollY * (1 - ease) + targetScrollY * ease).toFixed(2)
      );

      // Apply the scroll
      window.scrollTo(0, currentScrollY);

      // Update scroll position for next frame
      scrollY = window.scrollY || window.pageYOffset;

      // Call next frame
      animationFrameId = requestAnimationFrame(update);
    };

    // Add event listeners
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    // Start animation loop
    let animationFrameId = requestAnimationFrame(update);

    // Cleanup
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // Empty dependency array since we don't have any dependencies
};
