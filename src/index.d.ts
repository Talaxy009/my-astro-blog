import { type CollectionEntry } from 'astro:content';

declare global {
	type TagInfo = {
		name: string;
		count: number;
		slugs: string[][];
	};

	type Post = CollectionEntry<'blogs'>['data'] & {
		id: string;
		minutesRead: number;
	};
}
