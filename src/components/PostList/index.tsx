import React from 'react';
import { useStore } from '@nanostores/react';

import PostItem from '../PostItem';
import Pagination from '../Pagination';

import { menuIndex, pageIndex } from 'src/store';

import './index.css';

type Props = {
	postMap: Map<string, Post>;
	tags: TagInfo[];
};

export default function PostList({ postMap, tags }: Props) {
	const ref = React.useRef<HTMLDivElement>(null);
	const page = useStore(pageIndex);
	const menu = useStore(menuIndex);

	const handleChangeTag = (index = 0) => {
		menuIndex.set(index);
		pageIndex.set(1);
	};

	const handleChangePage = (index = 1) => {
		pageIndex.set(index);
		if (ref.current) {
			const target = ref.current;
			setTimeout(
				() => target.scrollIntoView({ behavior: 'smooth' }),
				150,
			);
		}
	};

	return (
		<div id="list-body" className="beer" ref={ref}>
			<button className="border">
				<span>{tags[menu].name}</span>
				<menu className="no-wrap">
					{tags.map((tag, index) => (
						<li key={tag.name}>
							<a onClick={() => handleChangeTag(index)}>
								{tag.name}
							</a>
						</li>
					))}
				</menu>
			</button>
			{tags[menu].slugs[page - 1].map((slug) => (
				<PostItem key={slug} post={postMap.get(slug)} />
			))}
			<Pagination
				value={page}
				onChange={handleChangePage}
				pageNumber={tags[menu].slugs.length}
			/>
		</div>
	);
}
