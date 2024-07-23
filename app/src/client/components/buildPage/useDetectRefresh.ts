import { useEffect } from 'react';

const useDetectRefresh = (onRefresh: () => void) => {
  useEffect(() => {
    // Check if the page is being reloaded
    if (performance.navigation.type === 1) {
      onRefresh();
    }
  }, []);
};

export default useDetectRefresh;
