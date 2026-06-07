import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

type PostGroup = {
	tags: TagInfo[];
	postMap: Map<string, Post>;
};

/**
 * 格式化时间
 * @param {number} minutes
 * @returns 包含已取整时间的字符串
 */
export function formatTime(minutes: number): string {
	return `${Math.round(minutes)} 分钟`;
}

/**
 * 格式化日期
 * @param {Date} date
 * @returns YYYY 年 MM 月 DD 日
 */
export function formatDate(date: Date): string {
	return dayjs(date).format('YYYY 年 MM 月 DD 日');
}

/**
 * 计算时间差
 * @param {Date} date
 * @returns 时间差
 */
export function getTimeDiff(date: Date): string {
	return dayjs(date).fromNow();
}

/**
 * 分割数组
 * @param {array} arr 待分割数组
 * @param {number} size 每段数组的大小
 * @returns 已分割的数组
 */
export function splitArray<T>(arr: readonly T[], size: number): T[][] {
	let newArr = [];
	for (let i = 0; i < arr.length; ) {
		newArr.push(arr.slice(i, (i += size)));
	}
	return newArr;
}

/**
 * 文章分组
 * @param {array} postList 文章列表
 */
export function getPostGroup(
	postList: Array<Post>,
	groupSize: number,
): PostGroup {
	const postMap = new Map<string, Post>();
	const tagList = new Map<string, Array<string>>();
	postList.forEach((post) => {
		postMap.set(post.id, post);
		post.tags.forEach((tag) => {
			if (!tagList.has(tag)) tagList.set(tag, []);
			tagList.get(tag)?.push(post.id);
		});
	});
	const tags = [];
	for (const name of tagList.keys()) {
		const list = tagList.get(name) ?? [];
		tags.push({
			name,
			count: list?.length,
			slugs: splitArray(list, groupSize),
		});
	}
	tags.unshift({
		name: '全部',
		count: postList.length,
		slugs: splitArray(
			postList.map((post) => {
				postMap.set(post.id, post);
				return post.id;
			}),
			groupSize,
		),
	});
	return { tags, postMap };
}
