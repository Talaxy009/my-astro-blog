import { getCoverImage } from './image';

/**
 * 把 content collection 的原始数据转换成渲染用的 Post
 *
 * ⚠️ 仅服务端可用：依赖 sharp / astro:assets 的 getImage。
 * 只能被 .astro frontmatter、getStaticPaths 等构建期代码引入，
 * 不要被客户端组件（hydrate 的 React/Vue 岛屿）直接或间接引用，
 * 否则会把 sharp、node:path 等打进浏览器产物。
 */
export async function convertBlogToPost(
	blog: Blog,
	minutesRead: number = 0,
	optimizeImage = true,
): Promise<Post> {
	return {
		...blog.data,
		id: blog.id,
		minutesRead,
		img: await getCoverImage(blog.data.img, optimizeImage),
	};
}
