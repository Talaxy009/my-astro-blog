import { getTimeDiff } from '../utils/dataUtils';

type Props = {
	buildTime: Date;
};

export default function BuildTimeFromNow({ buildTime }: Props) {
	return (
		<time dateTime={buildTime.toISOString()} suppressHydrationWarning>
			{getTimeDiff(buildTime)}
		</time>
	);
}
