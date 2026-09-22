import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

/**
 * 把 frontmatter 里的图片名解析成磁盘上的绝对路径。
 *
 * frontmatter 的 `img: 'img.jpg'` 是**相对文章目录**的，所以要配合内容文件的路径一起解析。
 *
 * @param {string | URL | undefined} filePath 内容文件路径（`src/content/<slug>/index.md` 或绝对路径 / file: URL）
 * @param {string | undefined} imgFileName frontmatter 里的裸文件名，如 `img.jpg`
 * @returns {string | undefined} 绝对路径；远程链接 / data URI 等返回 undefined
 */
export function resolveImageFile(filePath, imgFileName) {
	if (!filePath || !imgFileName) return undefined;

	// 远程链接、data URI 等不是本地文件
	if (/^[a-z][a-z0-9+.-]*:/i.test(imgFileName)) return undefined;

	const raw = filePath instanceof URL ? fileURLToPath(filePath) : String(filePath);
	const contentPath = /^file:\/\//i.test(raw) ? fileURLToPath(raw) : raw;

	// 开头的斜杠统一按「相对项目根目录」处理
	const name = imgFileName.replace(/^[/\\]+/, '');

	// contentPath 是绝对路径时 dirname 也是绝对的，path.resolve 会忽略 cwd
	return path.resolve(process.cwd(), path.dirname(contentPath), name);
}

/**
 * 生成图片的模糊占位图（base64 data URI）
 * 只指定宽度，高度按原始比例自动计算；失败时返回 undefined
 *
 * @param {string | URL | undefined} filePath
 * @param {string | undefined} imgFileName
 * @param {number} [width]
 * @returns {Promise<string | undefined>}
 */
export async function getBlurredPlaceholder(filePath, imgFileName, width = 20) {
	const file = resolveImageFile(filePath, imgFileName);
	if (!file) return undefined;

	try {
		const buffer = await sharp(file)
			.resize({ width })
			.blur(2)
			.webp({ quality: 50 })
			.toBuffer();
		return `data:image/webp;base64,${buffer.toString('base64')}`;
	} catch (e) {
		console.warn(`[placeholder] 无法为 ${file} 生成占位图：`, e);
		return undefined;
	}
}
