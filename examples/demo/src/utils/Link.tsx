'use client';
import NextLink from 'next/link';
import { useCallback } from 'react';
import { useTransitionRouter } from '../hooks/useTransitionRouter';
import type { UrlObject } from 'url';

// copied from https://github.com/vercel/next.js/blob/66f8ffaa7a834f6591a12517618dce1fd69784f6/packages/next/src/client/link.tsx#L180-L191
function isModifiedEvent(event: React.MouseEvent): boolean {
  const eventTarget = event.currentTarget as HTMLAnchorElement | SVGAElement;
  const target = eventTarget.getAttribute('target');
  return (
    (target && target !== '_self') ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey || // triggers resource download
    (event.nativeEvent && event.nativeEvent.which === 2)
  );
}

// copied from https://github.com/vercel/next.js/blob/66f8ffaa7a834f6591a12517618dce1fd69784f6/packages/next/src/client/link.tsx#L204-L217
function shouldPreserveDefault(e: React.MouseEvent<HTMLAnchorElement>): boolean {
  const { nodeName } = e.currentTarget;

  // anchors inside an svg have a lowercase nodeName
  const isAnchorNodeName = nodeName.toUpperCase() === 'A';

  if (isAnchorNodeName && isModifiedEvent(e)) {
    // ignore click for browser's default behavior
    return true;
  }

  return false;
}

// This is a wrapper around next/link that explicitly uses the router APIs
// to navigate, and trigger a view transition.

export function Link(props: React.ComponentProps<typeof NextLink>) {
  const router = useTransitionRouter();
  const { href, as, replace, scroll } = props;

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (props.onClick) {
        props.onClick(e);
      }

      if (shouldPreserveDefault(e)) {
        return;
      }
      e.preventDefault();
      const navigate = replace ? router.replace : router.push;
      const targetUrl = as || href;

      let urlString: string;
      if (typeof targetUrl === 'string') {
        urlString = targetUrl;
      } else if (targetUrl && typeof targetUrl === 'object') {
        // Handle UrlObject
        const { pathname = '/', query, hash } = targetUrl as UrlObject;
        const queryString = query ? `?${new URLSearchParams(query as Record<string, string>).toString()}` : '';
        const hashString = hash ? `#${hash}` : '';
        urlString = `${pathname}${queryString}${hashString}`;
      } else {
        // Fallback to home
        urlString = '/';
      }

      navigate(urlString, { scroll: scroll ?? true });
    },
    [props.onClick, href, as, replace, scroll, router]
  );

  return <NextLink {...props} onClick={onClick} />;
}
