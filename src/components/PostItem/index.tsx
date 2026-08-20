import CalendarIcon from '@iconify-react/material-symbols/calendar-month-outline-rounded';
import ClockIcon from '@iconify-react/material-symbols/nest-clock-farsight-analog-outline-rounded';

import { formatDate, formatTime, toISOString } from 'src/utils/dataUtils';

import './index.css';

type Props = {
	post?: Post;
};

export default function PostItem({ post }: Props) {
	if (!post) return null;

	const link = `/${post.id}`;

	return (
		<a href={link} className="post-item-body">
			{post.img && (
				<div
					className="post-item-img"
					style={{ viewTransitionName: `post-img-${post.id}` }}
				>
					<img
						className="responsive"
						src={post.img.src}
						srcSet={post.img.srcset}
						sizes={post.img.sizes}
						width={post.img.width}
						height={post.img.height}
						alt={post.title}
					/>
				</div>
			)}
			<div className="post-item-content">
				<h3 style={{ viewTransitionName: `post-title-${post.id}` }}>
					{post.title}
				</h3>
				<nav>
					<button className="chip round">
						<CalendarIcon className="responsive" />
						<time dateTime={toISOString(post.date)}>
							{formatDate(post.date)}
						</time>
					</button>
					<button className="chip round">
						<ClockIcon className="responsive" />
						{formatTime(post.minutesRead)}
					</button>
				</nav>
				<p>{post.description}</p>
			</div>
		</a>
	);
}
