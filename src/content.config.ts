import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';

const blogs = defineCollection({
	// Load Markdown and MDX files in the `src/content` directory.
	loader: glob({ base: './src/content', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			img: image().optional(),
			description: z.string(),
			// Transform string to Date object
			date: z.coerce.date(),
			tags: z.array(z.string()),
		}),
});

export const collections = { blogs };
