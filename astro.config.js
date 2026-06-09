// @ts-check
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';
import { unified } from '@astrojs/markdown-remark';
import { defineConfig } from 'astro/config';
import remarkGfm from 'remark-gfm';

import remarkReadingTime from './plugins/remark-reading-time.js';
import remarkTweetCard from './plugins/remark-tweet-card.js';
import remarkLinkCard from './plugins/remark-link-card.js';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.talaxy.site',
	integrations: [mdx(), sitemap(), react(), icon()],

	markdown: {
		shikiConfig: {
			theme: 'dark-plus',
		},
		processor: unified({
			remarkPlugins: [
				remarkGfm,
				remarkLinkCard,
				remarkTweetCard,
				remarkReadingTime,
			],
		}),
	},

	image: {
		layout: 'constrained',
		responsiveStyles: true,
	},

	adapter: netlify(),
});
