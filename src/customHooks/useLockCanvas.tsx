
import { useState } from 'react';

export const useLockCanvas = (lockUpperSection:boolean) => {
  const [tempLockCanvas, setTempLockCanvas] = useState(false);
  const finalLockCanvas = tempLockCanvas || lockUpperSection;

  return { finalLockCanvas, setTempLockCanvas };
};


