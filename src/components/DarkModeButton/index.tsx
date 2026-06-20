import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import DarkModeIcon from '@iconify-react/material-symbols/dark-mode-rounded';
import LightModeIcon from '@iconify-react/material-symbols/light-mode-rounded';

import { theme } from 'src/store';

import './index.css';

export default function DarkModeButton() {
	const mode = useStore(theme);

	const toggle = () => theme.set(mode === 'light' ? 'dark' : 'light');

	const handleClick = (event: React.MouseEvent) => {
		if (!document.startViewTransition) return toggle();

		const x = event.clientX;
		const y = event.clientY;
		const endRadius = Math.hypot(
			Math.max(x, innerWidth - x),
			Math.max(y, innerHeight - y),
		);
		const transition = document.startViewTransition(toggle);
		transition.ready.then(() => {
			const clipPath = [
				`circle(0px at ${x}px ${y}px)`,
				`circle(${endRadius}px at ${x}px ${y}px)`,
			];
			document.documentElement.animate(
				{
					clipPath,
				},
				{
					duration: 500,
					easing: 'ease-in',
					pseudoElement: '::view-transition-new(root)',
				},
			);
		});
	};

	useEffect(() => {
		document.documentElement.classList.contains('dark') &&
			theme.set('dark');

		theme.subscribe((mode) => {
			localStorage.setItem('theme', mode);
			document.documentElement.classList.remove('dark', 'light');
			document.documentElement.classList.add(mode);
		});
	}, []);

	return (
		<button
			className="chip circle large no-border no-margin"
			onClick={handleClick}
		>
			<DarkModeIcon id="moon-icon" />
			<LightModeIcon id="sun-icon" />
			<div className="tooltip bottom">
				{mode === 'dark' ? '关闭' : '打开'}夜间模式
			</div>
		</button>
	);
}
