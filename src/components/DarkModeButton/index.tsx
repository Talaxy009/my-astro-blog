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

		// 快照伪元素的坐标空间在高 dpr 下会被错误压缩（crbug 535696703，Chromium 150 起），
		// 因此用百分比表达圆心，可同时兼容受影响与正常的浏览器
		const x = (event.clientX / innerWidth) * 100;
		const y = (event.clientY / innerHeight) * 100;
		// circle() 中的 100% 小于视口对角线，取 150% 确保圆能覆盖到最远角
		const endRadius = '150%';
		// 标记此次为暗色模式过渡，避免页面级 CSS 动画干扰
		document.documentElement.classList.add('vt-darkmode');
		const transition = document.startViewTransition(toggle);
		transition.ready.then(() => {
			const clipPath = [
				`circle(0% at ${x}% ${y}%)`,
				`circle(${endRadius} at ${x}% ${y}%)`,
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
		transition.finished.finally(() => {
			document.documentElement.classList.remove('vt-darkmode');
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
