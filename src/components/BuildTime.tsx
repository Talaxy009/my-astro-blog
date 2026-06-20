import { useEffect, useState } from 'react';
import { getTimeDiff } from '../utils/dataUtils';

type Props = {
	buildTime: Date;
};

export default function BuildTimeFromNow({ buildTime }: Props) {
	const [timeStr, setTimeStr] = useState(() => getTimeDiff(buildTime));

	useEffect(() => {
		setTimeStr(getTimeDiff(buildTime));
	}, [buildTime]);

	return (
		<time dateTime={buildTime.toISOString()} suppressHydrationWarning>
			{timeStr}
		</time>
	);
}
