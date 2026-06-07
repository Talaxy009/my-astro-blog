import { useEffect, useRef } from 'react';
import { init } from '@waline/client';

import type { WalineInstance } from '@waline/client';
import type { WalineInitOptions } from '@waline/client';

type WalineProps = Omit<
	WalineInitOptions,
	'noRss' | 'el' | 'serverURL' | 'emoji'
>;

/**
 * Waline React Component
 * @param props WalineProps
 */
export default function Waline(props: WalineProps) {
	const walineInstanceRef = useRef<WalineInstance | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		walineInstanceRef.current = init({
			...props,
			noRss: true,
			serverURL: 'https://waline.talaxy.site',
			emoji: ['https://unpkg.com/@waline/emojis@1.2.0/tieba'],
			el: containerRef.current,
		});

		return () => walineInstanceRef.current?.destroy();
	}, []);

	useEffect(() => {
		walineInstanceRef.current?.update(props);
	}, [props]);

	return <div id="waline-container" ref={containerRef} />;
}
