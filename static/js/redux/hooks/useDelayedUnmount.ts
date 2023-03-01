import { useEffect, useState } from "react";

/**
 * This is a fix for the rodal modal library. It delays the unmounting of the modal so
 * that the exit animation of the library can finish, and so that the cleanup process
 * doesn't take effect immediately, which would cause information on the modal to
 * disappear as it was exiting.
 * @param isMounted Whether the component is mounted or not (isVisible)
 * @param delayTime How long to wait before unmounting
 */
function useDelayUnmount(isMounted: boolean, delayTime: number) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    let timeoutId: number;
    if (isMounted && !shouldRender) {
      setShouldRender(true);
    } else if (!isMounted && shouldRender) {
      timeoutId = window.setTimeout(() => setShouldRender(false), delayTime);
    }
    return () => clearTimeout(timeoutId);
  }, [isMounted, delayTime, shouldRender]);

  return shouldRender;
}

export default useDelayUnmount;
