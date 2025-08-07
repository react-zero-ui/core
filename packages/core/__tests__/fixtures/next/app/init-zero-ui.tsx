'use client';

import { activateZeroUiRuntime } from '@react-zero-ui/core/experimental/runtime';
import { variantKeyMap } from '@zero-ui/attributes';

activateZeroUiRuntime(variantKeyMap as { [key: string]: true | string[] | '*' });

export const InitZeroUI = () => null;
