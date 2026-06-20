import { getTimeDiff, toISOString } from '../utils/dataUtils';

type Props = {
	buildTime: Date;
};

export default function BuildTimeFromNow({ buildTime }: Props) {
	return (
		<time dateTime={toISOString(buildTime)}>{getTimeDiff(buildTime)}</time>
	);
}
