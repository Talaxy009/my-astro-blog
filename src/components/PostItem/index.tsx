import CalendarIcon from '@iconify-react/material-symbols/calendar-month-outline-rounded';
import ClockIcon from '@iconify-react/material-symbols/nest-clock-farsight-analog-outline-rounded';

import PostCover from '../PostCover';

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
			<PostCover
				img={post.img}
				alt={post.title}
				className="post-cover-list"
				viewTransitionName={`post-img-${post.id}`}
			/>
			<div className="post-item-content">
				<h4 className="small">{post.title}</h4>
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
