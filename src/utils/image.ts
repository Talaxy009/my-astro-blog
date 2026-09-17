import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

/**
 * 把 Astro 图片引用的 src 还原成磁盘上的绝对路径
 * - dev：`/@fs/D:/repo/src/content/xxx/img.svg?origWidth=1600&...`（Vite 的 fs 前缀 + 查询串）
 * - build：`/src/content/xxx/img.svg`（相对于项目根目录）
 * - build：`/_astro/img.<hash>.png`（已是构建产物，落在 outDir 即 dist/ 里）
 */
export function resolveImageFile(src?: string) {
	if (!src) return undefined;

	const clean = src.split('?')[0].split('#')[0];
	if (clean.startsWith('/@fs/')) return clean.slice('/@fs/'.length);

	const rel = clean.replace(/^\/+/, '');
	return [path.join(process.cwd(), rel), path.join(process.cwd(), 'dist', rel)].find(
		(file) => fs.existsSync(file),
	);
}

/**
 * 生成图片的模糊占位图（base64 data URI）
 * 只指定宽度，高度按原始比例自动计算；失败时返回 undefined
 */
export async function getBlurredPlaceholder(img?: ImageMetadata, width = 20) {
	const file = resolveImageFile(img?.src);
	if (!file) return undefined;

	try {
		const buffer = await sharp(file)
			.resize({ width })
			.blur(2)
			.webp({ quality: 50 })
			.toBuffer();
		return `data:image/webp;base64,${buffer.toString('base64')}`;
	} catch (e) {
		console.warn(`[image] 无法为 ${file} 生成占位图：`, e);
		return undefined;
	}
}

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
	const placeholder = await getBlurredPlaceholder(img);
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
