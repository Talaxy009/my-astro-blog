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
	return (
		<nav className="group center-align">
			{Array.from({ length: pageNumber }, (_, i) => {
				const index = i + 1;
				return (
					<button
						key={index}
						onClick={() => onChange(index)}
						className={'round' + (index === value ? ' fill' : '')}
					>
						{index}
					</button>
				);
			})}
		</nav>
	);
}
