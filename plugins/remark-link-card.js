import { visit } from 'unist-util-visit';
import * as cheerio from 'cheerio';

/**
 * 页面元数据
 * @typedef {Object} PageData
 * @property {string} title
 * @property {string|undefined} description
 * @property {string|undefined} favicon
 * @property {string} url
 * @property {string|undefined} ogImage
 */

/**
 * 缓存
 * @type {Map<string, PageData>} */
const cache = new Map();

/**
 * 待转换为链接卡片的段落目标
 * @typedef {Object} LinkTarget
 * @property {object} parent - 所在的段落节点
 * @property {string} url - 链接地址
 */

/**
 * 从 URL 抓取页面元数据
 * @param {string} url
 * @returns {Promise<PageData>}
 */
async function fetchPageData(url) {
	if (cache.has(url)) return cache.get(url);

	const data = {
		title: url,
		description: undefined,
		favicon: undefined,
		url,
		ogImage: undefined,
	};

	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (compatible; LinkCardBot/1.0; +https://www.talaxy.site)',
			},
			signal: AbortSignal.timeout(8000),
		});

		if (!response.ok) throw new Error(`请求失败: ${response.status}`);

		const html = await response.text();
		const $ = cheerio.load(html);

		data.title = $('title').first().text().trim() || url;

		data.description =
			$('meta[property="og:description"]').attr('content') ||
			$('meta[name="description"]').attr('content');

		const urlObj = new URL(url);

		const ogImageContent = $('meta[property="og:image"]').attr('content');
		if (ogImageContent) {
			data.ogImage = new URL(ogImageContent, urlObj.origin).href;
		}

		const faviconHref = $('link[rel*="icon"]').first().attr('href');
		data.favicon = `${urlObj.origin}/favicon.ico`;
		if (faviconHref) {
			data.favicon = new URL(faviconHref, urlObj.origin).href;
		}
	} catch (error) {
		console.error(`抓取页面元数据失败: ${url}`, error);
	}

	cache.set(url, data);
	return data;
}

/**
 * 转义 HTML 特殊字符，防止注入
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/**
 * 根据页面元数据构建 HTML 字符串
 * @param {PageData} pageData
 * @returns {string}
 */
function getHTML(pageData) {
	const { title, description, favicon, url, ogImage } = pageData;

	const textHtml =
		'<div class="link-card-text">' +
		`<div class="link-card-title">${escapeHtml(title)}</div>` +
		(description
			? `<div class="link-card-description">${escapeHtml(description)}</div>`
			: '') +
		'</div>';

	const faviconHtml = favicon
		? `<img class="link-card-favicon" src="${escapeHtml(favicon)}" alt="${escapeHtml(title)}-favicon"/>`
		: '';

	const ogImageHtml = ogImage
		? '<div class="link-card-image-wrapper">' +
			`<img class="link-card-image" alt="${escapeHtml(title)}-image" src="${escapeHtml(ogImage)}" />` +
			'</div>'
		: '';

	return (
		'<div>' +
		`<a target="_blank" rel="noopener noreferrer" href="${escapeHtml(url)}" class="link-card-container">` +
		'<div class="link-card-wrapper">' +
		textHtml +
		'<div class="link-card-url">' +
		faviconHtml +
		`<div class="link-card-link">${escapeHtml(url)}</div>` +
		'</div>' +
		'</div>' +
		ogImageHtml +
		'</a>' +
		'</div>'
	).trim();
}

/**
 * 抓取页面元数据并原地把段落改写为链接卡片 HTML
 * @param {LinkTarget} target
 */
async function task(target) {
	const pageData = await fetchPageData(target.url);
	target.parent.type = 'html';
	target.parent.value = getHTML(pageData);
	delete target.parent.children;
}

/**
 * Remark 插件：把 [$card](url) 段落转换为链接卡片 HTML。
 * @param {{delimiter?: string}} [options]
 */
export default function remarkLinkCard(options = {}) {
	const delimiter = options.delimiter ?? '$card';

	return async function (tree) {
		/** @type {LinkTarget[]} */
		const targets = [];

		// 直接遍历 link 节点（不再遍历 paragraph）
		visit(tree, 'link', (node, _index, parent) => {
			if (
				node.children[0]?.value === delimiter &&
				parent?.type === 'paragraph' &&
				parent.children.length === 1
			) {
				targets.push({ parent, url: node.url });
			}
		});

		if (targets.length === 0) return;

		await Promise.all(targets.map(task));
	};
}
