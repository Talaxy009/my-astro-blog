import { getImage } from 'astro:assets';

import type { ImageMetadata } from 'astro';

/**
 * 封面相关逻辑（服务端专用：依赖 astro:assets 的 getImage）。
 */

/**
 * 返回原始元数据（仅提取 src/width/height，避免序列化问题）
 */
export async function getImageObject(img?: ImageMetadata) {
	if (!img) return undefined;

	return {
		src: img.src,
		width: img.width,
		height: img.height,
		format: img.format,
	};
}

/**
 * 生成压缩的封面图（不支持客户端调用该函数）
 * - 普通图片用 getImage 优化（宽度上限 width，默认 400，保持原始长宽比）
 * - SVG 无法被优化，直接返回原始元数据
 *
 * 返回值里的 `src` 是**已优化过的产物**，只能交给原生 `<img src/srcset/sizes>` 渲染。
 *
 * @param img 图片元数据（内容条目直接传 `blog.data.img`）
 * @param placeholder 模糊占位图（data URI），来自 remarkPluginFrontmatter.coverPlaceholder
 * @param width 优化后的最大宽度，首页卡片用 400，文章页封面用 1280
 */
export async function getCoverImage(
	img?: ImageMetadata,
	placeholder?: string,
	width = 400,
) {
	if (!img) return undefined;

	if (img.format === 'svg') {
		return getImageObject(img);
	}

	const optimized = await getImage({ src: img, width });
	return {
		src: optimized.src,
		srcset: optimized.srcSet.attribute,
		sizes: optimized.attributes.sizes,
		width: optimized.attributes.width,
		height: optimized.attributes.height,
		format: img.format,
		placeholder,
	};
}
