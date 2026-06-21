import { useEffect, useState } from 'react';

import { getTimeDiff, toISOString } from '../utils/dataUtils';

type Props = {
	buildTime: Date;
};

export default function BuildTimeFromNow({ buildTime }: Props) {
	const [timeStr, setTimeStr] = useState('几秒前');

	useEffect(() => {
		setTimeStr(getTimeDiff(buildTime));
	}, [buildTime]);

	return <time dateTime={toISOString(buildTime)}>{timeStr}</time>;
}
