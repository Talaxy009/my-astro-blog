import { getBlurredPlaceholder } from './placeholder-core.js';

/**
 * 给文章封面生成模糊占位图，写进 `remarkPluginFrontmatter.coverPlaceholder`。
 *
 * ⚠️ 缓存粒度是**内容文件**（loader 用文件内容算 digest），不是图片本身：
 * 换了封面图但没改 md/mdx，占位图不会刷新。需要删掉缓存后重跑：
 * - dev：`.astro/data-store.json`
 * - build：`node_modules/.astro/data-store.json`
 *
 */
export default function remarkCoverPlaceholder() {
	return async function (_tree, file) {
		const frontmatter = file?.data?.astro?.frontmatter;
		const imgFileName = frontmatter?.img;

		if (!frontmatter || typeof imgFileName !== 'string') return;

		// 已经算过（例如同一份缓存被复用）或渲染侧用不到占位图（SVG）就跳过
		if (frontmatter.coverPlaceholder) return;
		if (imgFileName.toLowerCase().endsWith('.svg')) return;

		// 远程图片、找不到的本地文件都会静默返回 undefined，不打断 markdown 渲染
		const placeholder = await getBlurredPlaceholder(file.path, imgFileName);
		if (placeholder) frontmatter.coverPlaceholder = placeholder;
	};
}
