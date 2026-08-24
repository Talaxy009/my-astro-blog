import { type CollectionEntry } from 'astro:content';

declare global {
	type TagInfo = {
		name: string;
		count: number;
		slugs: string[][];
	};

	type Blog = CollectionEntry<'blogs'>;

	type Post = Omit<Blog['data'], 'img'> & {
		id: string;
		minutesRead: number;
		img?: NonNullable<Blog['data']['img']> & {
			srcset?: string;
			sizes?: string;
		};
	};
}
