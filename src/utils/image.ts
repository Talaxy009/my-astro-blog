import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

/**
 * 生成压缩的文章封面图（不支持客户端调用该函数）
 * - 普通图片用 getImage 优化（宽度上限 width，默认 400，保持原始长宽比）
 * - SVG 无法被优化，直接返回原始元数据（仅提取 src/width/height，避免序列化问题）
 */
export async function getCoverImage(
	img?: ImageMetadata,
	optimize = true,
	width = 400,
) {
	if (!img) return undefined;

	if (img.format === 'svg' || !optimize) {
		return {
			src: img.src,
			width: img.width,
			height: img.height,
			format: img.format,
		};
	}

	const optimized = await getImage({ src: img, width });
	return {
		src: optimized.src,
		srcset: optimized.srcSet.attribute,
		sizes: optimized.attributes.sizes,
		width: optimized.attributes.width,
		height: optimized.attributes.height,
		format: img.format,
	};
}
