import { type CollectionEntry } from 'astro:content';

declare global {
	type TagInfo = {
		name: string;
		count: number;
		slugs: string[][];
	};

	type Post = Omit<CollectionEntry<'blogs'>['data'], 'img'> & {
		id: string;
		minutesRead: number;
		img?: NonNullable<CollectionEntry<'blogs'>['data']['img']> & {
			srcset?: string;
			sizes?: string;
		};
	};
}
