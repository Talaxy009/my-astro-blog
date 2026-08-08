import { visit } from 'unist-util-visit';

/** @type {Map<string, object>} */
const cache = new Map();

/**
 * Fetch page metadata from a URL
 * @param {string} url
 * @returns {Promise<{title: string, description: string|undefined, favicon: string|undefined, url: string, ogImage: string|undefined}>}
 */
async function fetchPageData(url) {
	if (cache.has(url)) return cache.get(url);

	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (compatible; LinkCardBot/1.0; +https://www.talaxy.site)',
			},
			signal: AbortSignal.timeout(8000),
		});
		const html = await response.text();

		const title =
			html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? url;

		const description =
			html.match(
				/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)/i,
			)?.[1] ??
			html.match(
				/<meta[^>]+content=["']([^"']*)[^>]+property=["']og:description["']/i,
			)?.[1] ??
			html.match(
				/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i,
			)?.[1] ??
			html.match(
				/<meta[^>]+content=["']([^"']*)[^>]+name=["']description["']/i,
			)?.[1];

		const ogImage =
			html.match(
				/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)/i,
			)?.[1] ??
			html.match(
				/<meta[^>]+content=["']([^"']*)[^>]+property=["']og:image["']/i,
			)?.[1];

		const urlObj = new URL(url);
		const faviconHref = html.match(
			/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i,
		)?.[1];
		const favicon = faviconHref
			? faviconHref.startsWith('http')
				? faviconHref
				: new URL(faviconHref, urlObj.origin).href
			: `${urlObj.origin}/favicon.ico`;

		const data = { title, description, favicon, url, ogImage };
		cache.set(url, data);
		return data;
	} catch {
		const data = {
			title: url,
			description: undefined,
			favicon: undefined,
			url,
			ogImage: undefined,
		};
		cache.set(url, data);
		return data;
	}
}

/**
 * Build html string from page data
 * @param {{title: string, description: string|undefined, favicon: string|undefined, url: string, ogImage: string|undefined}} pageData
 * @param {boolean} showFavicon
 * @returns {string}
 */
function getHTML(pageData, showFavicon) {
	const { title, description, favicon, url, ogImage } = pageData;

	const textHtml =
		'<div class="link-card-text">' +
		`<div class="link-card-title">${title}</div>` +
		(description && description !== 'undefined'
			? `<div class="link-card-description">${description}</div>`
			: '') +
		'</div>';

	const faviconHtml =
		showFavicon && favicon && favicon !== 'undefined'
			? `<img class="link-card-favicon" src="${favicon}" alt="${title}-favicon"/>`
			: '';

	const ogImageHtml =
		ogImage && ogImage !== 'undefined'
			? '<div class="link-card-image-wrapper">' +
				`<img class="link-card-image" alt="${title}-image" src="${ogImage}" />` +
				'</div>'
			: '';

	return (
		'<div>' +
		`<a target="_blank" rel="noopener noreferrer" href="${url}" class="link-card-container">` +
		'<div class="link-card-wrapper">' +
		textHtml +
		'<div class="link-card-url">' +
		faviconHtml +
		`<div class="link-card-link">${url}</div>` +
		'</div>' +
		'</div>' +
		ogImageHtml +
		'</a>' +
		'</div>'
	).trim();
}

/**
 * Remark plugin to transform [$card](url) paragraphs into link card HTML.
 * @param {{showFavicon?: boolean}} [options]
 */
export default function remarkLinkCard(options = {}) {
	const showFavicon = options.showFavicon ?? true;

	return async function (tree) {
		/** @type {Array<{node: object, index: number, parent: object, url: string}>} */
		const targets = [];

		visit(tree, 'paragraph', (node, index, parent) => {
			if (node.children.length !== 1) return;
			const child = node.children[0];
			if (
				child.type === 'link' &&
				child.children.length === 1 &&
				child.children[0].type === 'text' &&
				child.children[0].value === '$card'
			) {
				targets.push({ node, index, parent, url: child.url });
			}
		});

		if (targets.length === 0) return;

		const pageDataList = await Promise.all(
			targets.map(({ url }) => fetchPageData(url)),
		);

		for (let i = 0; i < targets.length; i++) {
			const { index, parent } = targets[i];
			parent.children[index] = {
				type: 'html',
				value: getHTML(pageDataList[i], showFavicon),
			};
		}
	};
}
