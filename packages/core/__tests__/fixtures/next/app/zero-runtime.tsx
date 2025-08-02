'use client';

/* ① import the generated defaults */
import { bodyAttributes } from '../.zero-ui/attributes';

/* ② activate the runtime shipped in the package */
import { activateZeroUiRuntime } from '@react-zero-ui/core/experimental/runtime';

activateZeroUiRuntime(bodyAttributes);

export default function ZeroUiRuntime() {
	return null; // this component just runs the side effect
}
