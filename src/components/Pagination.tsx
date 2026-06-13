import { Fragment, useMemo } from 'react';

type Props = {
	pageNumber: number;
	value?: number;
	onChange: (value: number) => void;
};

export default function Pagination({
	pageNumber = 0,
	value = 1,
	onChange,
}: Props) {
	const pages = useMemo(() => {
		const pageSet = new Set<number>();

		// 首页
		pageSet.add(1);
		// 尾页
		if (pageNumber > 1) pageSet.add(pageNumber);

		// 当前页前后共保留3页
		let start, end;
		if (value === 1) {
			start = 2;
			end = Math.min(pageNumber - 1, value + 2);
		} else if (value === pageNumber) {
			start = Math.max(2, value - 2);
			end = pageNumber - 1;
		} else {
			start = Math.max(2, value - 1);
			end = Math.min(pageNumber - 1, value + 1);
		}
		for (let i = start; i <= end; i++) {
			pageSet.add(i);
		}

		return Array.from(pageSet).sort((a, b) => a - b);
	}, [pageNumber, value]);

	return (
		<nav className="group center-align">
			{pages.map((pageNum, index) => {
				const showEllipsis =
					index > 0 && pageNum - pages[index - 1] > 1;
				return (
					<Fragment key={pageNum}>
						{showEllipsis && <span>···</span>}
						<button
							onClick={() => onChange(pageNum)}
							className={
								'round' + (pageNum === value ? ' fill' : '')
							}
						>
							{pageNum}
						</button>
					</Fragment>
				);
			})}
		</nav>
	);
}
