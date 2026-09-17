import { useEffect, useRef, useState } from 'react';
import CalendarIcon from '@iconify-react/material-symbols/calendar-month-outline-rounded';
import ClockIcon from '@iconify-react/material-symbols/nest-clock-farsight-analog-outline-rounded';

import { formatDate, formatTime, toISOString } from 'src/utils/dataUtils';

import './index.css';

type Props = {
	post?: Post;
};

export default function PostItem({ post }: Props) {
	const imgRef = useRef<HTMLImageElement>(null);
	const [loaded, setLoaded] = useState(false);

	// 图片可能在水合之前就已加载完成，这种情况下 load 事件不会再触发
	useEffect(() => {
		if (imgRef.current?.complete) setLoaded(true);
	}, []);

	if (!post) return null;

	const link = `/${post.id}`;
	const placeholder = post.img?.placeholder;

	return (
		<a href={link} className="post-item-body">
			{post.img && (
				<div
					className="post-item-img"
					style={{
						viewTransitionName: `post-img-${post.id}`,
						backgroundImage: placeholder
							? `url(${placeholder})`
							: undefined,
					}}
				>
					<img
						ref={imgRef}
						className={`responsive${loaded ? ' loaded' : ''}`}
						src={post.img.src}
						srcSet={post.img.srcset}
						sizes={post.img.sizes}
						width={post.img.width}
						height={post.img.height}
						onLoad={() => setLoaded(true)}
						alt={post.title}
					/>
				</div>
			)}
			<div className="post-item-content">
				<h3>{post.title}</h3>
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
