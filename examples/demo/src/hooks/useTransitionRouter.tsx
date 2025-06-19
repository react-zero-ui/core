'use client';
import { useRouter as useNextRouter, usePathname } from 'next/navigation';
import { startTransition, useCallback, useMemo, createContext, use, useEffect, useState, useRef, Dispatch, SetStateAction, useSyncExternalStore } from 'react';
import { AppRouterInstance, NavigateOptions } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export function useHash() {
  return useSyncExternalStore(subscribeHash, getHashSnapshot, getServerHashSnapshot);
}

function getHashSnapshot() {
  return window.location.hash;
}

function getServerHashSnapshot() {
  return '';
}

function subscribeHash(onStoreChange: () => void) {
  window.addEventListener('hashchange', onStoreChange);
  return () => window.removeEventListener('hashchange', onStoreChange);
}
// TODO: This implementation might not be complete when there are nested
// Suspense boundaries during a route transition. But it should work fine for
// the most common use cases.

export function useBrowserNativeTransitions() {
  const pathname = usePathname();
  const currentPathname = useRef(pathname);

  // This is a global state to keep track of the view transition state.
  const [currentViewTransition, setCurrentViewTransition] = useState<
    | null
    | [
        // Promise to wait for the view transition to start
        Promise<void>,
        // Resolver to finish the view transition
        () => void,
      ]
  >(null);

  useEffect(() => {
    if (!('startViewTransition' in document)) {
      return () => {};
    }

    const onPopState = () => {
      let pendingViewTransitionResolve: () => void;

      const pendingViewTransition = new Promise<void>(resolve => {
        pendingViewTransitionResolve = resolve;
      });

      const pendingStartViewTransition = new Promise<void>(resolve => {
        document.startViewTransition(() => {
          resolve();
          return pendingViewTransition;
        });
      });

      setCurrentViewTransition([pendingStartViewTransition, pendingViewTransitionResolve!]);
    };
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  if (currentViewTransition && currentPathname.current !== pathname) {
    // Whenever the pathname changes, we block the rendering of the new route
    // until the view transition is started (i.e. DOM screenshotted).
    use(currentViewTransition[0]);
  }

  // Keep the transition reference up-to-date.
  const transitionRef = useRef(currentViewTransition);
  useEffect(() => {
    transitionRef.current = currentViewTransition;
  }, [currentViewTransition]);

  const hash = useHash();

  useEffect(() => {
    // When the new route component is actually mounted, we finish the view
    // transition.
    currentPathname.current = pathname;
    if (transitionRef.current) {
      transitionRef.current[1]();
      transitionRef.current = null;
    }
  }, [hash, pathname]);
}

const ViewTransitionsContext = createContext<Dispatch<SetStateAction<(() => void) | null>>>(() => () => {});

export function ViewTransitions({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [finishViewTransition, setFinishViewTransition] = useState<null | (() => void)>(null);

  useEffect(() => {
    if (finishViewTransition) {
      finishViewTransition();
      setFinishViewTransition(null);
    }
  }, [finishViewTransition]);

  useBrowserNativeTransitions();

  return <ViewTransitionsContext.Provider value={setFinishViewTransition}>{children}</ViewTransitionsContext.Provider>;
}

export function useSetFinishViewTransition() {
  return use(ViewTransitionsContext);
}

export type TransitionOptions = {
  onTransitionReady?: () => void;
};

type NavigateOptionsWithTransition = NavigateOptions & TransitionOptions;

export type TransitionRouter = AppRouterInstance & {
  push: (href: string, options?: NavigateOptionsWithTransition) => void;
  replace: (href: string, options?: NavigateOptionsWithTransition) => void;
};

export function useTransitionRouter() {
  const router = useNextRouter();
  const finishViewTransition = useSetFinishViewTransition();

  const triggerTransition = useCallback((cb: () => void, { onTransitionReady }: TransitionOptions = {}) => {
    if ('startViewTransition' in document) {
      const transition = document.startViewTransition(
        () =>
          new Promise<void>(resolve => {
            startTransition(() => {
              cb();
              finishViewTransition(() => resolve);
            });
          })
      );
      // Force a synthetic scroll so Framer-Motion measures immediately
      transition.finished.then(() => {
        document.dispatchEvent(new Event('scroll', { bubbles: true }));
      });

      if (onTransitionReady) {
        transition.ready.then(onTransitionReady);
      }
    } else {
      return cb();
    }
  }, []);

  const push = useCallback(
    (href: string, { onTransitionReady, ...options }: NavigateOptionsWithTransition = {}) => {
      triggerTransition(() => router.push(href, options), {
        onTransitionReady,
      });
    },
    [triggerTransition, router]
  );

  const replace = useCallback(
    (href: string, { onTransitionReady, ...options }: NavigateOptionsWithTransition = {}) => {
      triggerTransition(() => router.replace(href, options), {
        onTransitionReady,
      });
    },
    [triggerTransition, router]
  );

  return useMemo<TransitionRouter>(
    () => ({
      ...router,
      push,
      replace,
    }),
    [push, replace, router]
  );
}
