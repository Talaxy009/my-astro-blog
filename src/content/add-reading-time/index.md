---
title: 为 Gatsby 添加阅读时长提示
date: '2020-04-27T14:44:49.233Z'
description: '一直想要的功能，今天总算实现了'
tags: ['Gatsby', '技术']
img: 'img.png'
---

## 前言

一些博客的时间栏附近会提示阅读完这篇博客大致所需要的时间，原理是统计这篇文章的总字数，然后按照每几百字对应一分钟来进行换算的，今天正好将此功能实现了，现记录在此

参考：

[$card](https://overreacted.io/)

需要注意的是本文的操作皆是基于 gatsby-starter-blog 进行的

## 修改 index.js

在首页 index.js 的 `pageQuery` 下添加 `timeToRead`

```diff
export const pageQuery = graphql`
    query {
        site {
            siteMetadata {
                title
            }
        }
        allMarkdownRemark(sort: {fields: [frontmatter___date], order: DESC}) {
            edges {
                node {
                    excerpt
                    fields {
                        slug
                    }
+                     timeToRead
                    frontmatter {
                        date(formatString: "YYYY 年 MM 月 DD 日")
                        title
                        description
                    }
                }
            }
        }
    }
`;
```

是的，第一步并不是安装插件，因为 Gatsby 的 `gatsby-transformer-remark` 已经帮我们统计好字数和阅读时间了，所以我们直接用 GraphQL 查询即可。

## 编写 helper.js

这是将时间数据转换成 🍵 或 🍚 并输出文本的主要文件

```js
export function formatReadingTime(minutes) {
	let cups = Math.round(minutes / 5);
	if (cups > 4) {
		return `${new Array(Math.round(cups / 4))
			.fill('🍚')
			.join('')} 阅读需要 ${minutes} 分钟`;
	} else {
		return `${new Array(cups || 1)
			.fill('🍵')
			.join('')} 阅读需要 ${minutes} 分钟`;
	}
}
```

每 5 minutes 会被转换为 1 cup 🍵（至少有 1 cup 🍵），当有 4 cups 🍵 以上时，所有的 🍵 会以 4 个转换为 1 🍚（即等于 20mins，较为符合平均进餐时间）

时间和 emoji 都可以自行修改，下附全部食物 emoji~

---

🍇🍈🍉🍊🍋🍌🍍🍎🍏🍐🍑🍒🍓🍅🍆🌽🍄🌰🍞🍖🍗🍔🍟🍕🍳🍲🍱🍘🍙🍚🍛🍜🍝🍠🍢🍣🍤🍥🍡🍦🍧🍨🍩🍪🎂🍰🍫🍬🍭🍮🍯🍼☕🍵🍶🍷🍸🍹🍺🍻🍴

---

## 修改 PostList.js

修改 PostList.js 中的 `<small>`

PostList.js 是我将 index.js 拆分后的文件，若你没有修改过 index.js，则应在 index.js 中操作

```jsx
import { formatReadingTime } from '../utils/helper'; //导入 helper，路径请自行修改
//略
return (
	<article key={node.fields.slug}>
		<header>
			<small>
				{node.frontmatter.date}
				{` • ${formatReadingTime(node.timeToRead)}`}
			</small>
		</header>
	</article>
);
//略
```

## 修改 blog-post.js

```jsx
import { formatReadingTime } from '../utils/helper'; //导入 helper，路径请自行修改
//略
<p
	style={{
		...scale(-1 / 5),
		display: `block`,
		marginBottom: rhythm(1),
	}}
>
	{post.frontmatter.date}
	{` • ${formatReadingTime(post.timeToRead)}`} //插入代码
</p>;
//略
export const pageQuery = graphql`
	query BlogPostBySlug($slug: String!) {
		site {
			siteMetadata {
				title
			}
		}
		markdownRemark(fields: { slug: { eq: $slug } }) {
			id
			excerpt(pruneLength: 160)
			html
			timeToRead
			frontmatter {
				title
				date(formatString: "YYYY 年 MM 月 DD 日")
				description
			}
		}
	}
`;
```

---

做完以上步骤后，阅读时长提示应该会完美的出现在你文章时间栏的附近 (=v=)b

另外，经过这次实践后不得不感叹 GraphQL 的奇妙，以后有时间必须得深入了解下
