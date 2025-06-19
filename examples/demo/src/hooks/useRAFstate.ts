import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

/**
 * A hook that provides a state that is updated on the next available animation frame.
 *
 * @param initialState The initial state value
 * @param skip Optional number of frames to skip between updates (defaults to 1, meaning update every frame)
 * @returns A tuple containing the current state and a function to update it
 */

export const useRAFstate = <S>(initialState: S | (() => S), skip: number = 1): [S, Dispatch<SetStateAction<S>>] => {
  const frame = useRef(0);
  const skipCount = useRef(0);
  const [state, setState] = useState(initialState);

  const setRafState = useCallback(
    (value: S | ((prevState: S) => S)) => {
      cancelAnimationFrame(frame.current);

      frame.current = requestAnimationFrame(() => {
        skipCount.current = (skipCount.current + 1) % skip;

        if (skipCount.current === 0 || skip === 1) {
          setState(value);
        }
      });
    },
    [skip]
  );

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return [state, setRafState];
};
