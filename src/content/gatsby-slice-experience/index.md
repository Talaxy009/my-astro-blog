---
title: Gatsby Slice 使用体验
date: '2022-11-23T11:50:21.725Z'
description: 'Gatsby Slice——一个能让组件用上 GraphQL 的新玩具'
tags: ['Gatsby', '技术', '记录']
img: 'img.png'
---

最近体验了一下 Gatsby 5 的新特新之一——Slice API，顺便也记录一下使用体验。对了，封面的披萨图是 Stable Diffusion 生成的 😋 感觉披萨看着还不错，就是桌子和草地融到一起去了······为什么拿披萨做封面呢？这是因为官方文档就是用 🍕 来做 Slice 的图标。

## Slice 是什么？

Slice 是 Gatsby 在 5.0 版本推出的新特新。通过使用 Slice 你可以把一些组件单独提取出来进行构建，Gatsby 会在生成页面时插入构建好的片段而不必再次构建这块代码。举个例子：我有一个 `<Bio />` 组件会在 5 个页面中使用到它，那在构建这 5 个页面时就会把 `<Bio />` 也一起构建 5 次，实际上每个页面的 `<Bio />` 都是一样，你只需要构建一次就好，这就是 Slice 做的事。

如果你有在 `gatsby-node.js` 中用过的 `createPage` 的话······那 Slice 其实和 Page 的创建方法很相似，它和 Page 类似有一个 `createSlice` 函数供你在 `gatsby-node.js` 中创建它。你几乎可以把它当作一个 Page，只是它并不对应一个 URL，而是对应一个 ID 并作为组件插入到真正的 Page 中来使用。Slice 和 Page 还有一点不同在于 Slice 不能通过将代码放置在 `src` 文件夹中来直接创建。

下面一段代码是 Slice 和 Page 的创建示例，你会发现它们真的很像（毕竟某种意义上 Slice 就是一个小 Page）。

```js
// gatsby-node.js
export const createPages = async ({ graphql, actions }) => {
	const { createPage, createSlice } = actions;

	const bioSlice = path.resolve('./src/slices/Bio.jsx');
	const blogTemplate = path.resolve('./src/templates/BlogTemplate.jsx');

	const posts = await graphql`...`;

	// 创建 slice
	createSlice({
		id: 'bio',
		component: bioSlice,
		context: {
			id: 'id',
		},
	});

	posts.forEach((post, index) => {
		// 创建 page
		createPage({
			path: post.fields.slug,
			component: blogTemplate,
			context: {
				id: post.id,
			},
		});
	});
};
```

## 为什么说 Slice 能让组件用上 GraphQL

有了 Slice 后，组件可以像 Page 一样使用参数来进行查询了，如下：

```jsx
import React from 'react';
import { graphql } from 'gatsby';

export default function Bio({ data }) {
	return <Somethings data={data} />;
}

export const query = graphql`
	query ($id: String) {
		myField(id: { eq: $id }) {
			name
		}
	}
`;
```

这里的 `title` 参数是由 `createSlice` 的 `context` 传入进来的。而在这之前组件进行数据查询只能通过 `useStaticQuery` 来进行且 `id` 必须是确定的，如下：

```jsx
import React from 'react';
import { useStaticQuery, graphql } from 'gatsby';

export default function Bio() {
	const data = useStaticQuery(graphql`
		query {
			myField(id: { eq: "id" }) {
				name
			}
		}
	`);

	return <Somethings data={data} />;
}
```

因此，在我看来 Slice 给组件提供了完整的 GraphQL 体验，可以将更多的数据查询逻辑封装在组件中了，所以说是一个能让组件用上 GraphQL 的新玩具。

## 唯一的绊脚石

当我意识到可以将数据查询封装在组件中后，我有了一个“大胆”的想法：我的首页以卡片的形式排列了所有的文章，每个卡片都展示了文章的基本信息——标题、介绍、字数、封面······这些数据都是在首页查询完一层层传递给卡片组件的，于是我便想把这些数据查询封装在卡片组件中，如下：

```js
// gatsby-node.js
export const createPages = async ({ graphql, actions }) => {
	const { createPage, createSlice } = actions;

	const postItemSlice = path.resolve('./src/slices/postItem.jsx');
	const blogTemplate = path.resolve('./src/templates/BlogTemplate.jsx');

	const posts = await graphql`...`;

	posts.forEach((post, index) => {
		// 创建 page
		createPage({
			path: post.fields.slug,
			component: blogTemplate,
			context: {
				id: post.id,
			},
		});

		// 创建 slice
		createSlice({
			id: `post-item--${post.fields.slug.slice(1, -1)}`,
			component: postItemSlice,
			context: {
				id: post.id,
			},
		});
	});
};
```

⬆️ 在创建文章页的同时创建文章卡片的 Slice，很优雅！

```jsx
// postItem.jsx
import React from 'react';
import { graphql } from 'gatsby';

export default function postItem({ data }) {
	return <Somethings>{data}</Somethings>;
}

export const query = graphql`
    query ($id: String) {
        markdownRemark(id: {eq: $id}) {
            ...
        }
    }
`;
```

⬆️ 在卡片组件中获取 `id` 参数并查询文章数据，很优雅！

```jsx
// index.jsx
import React from 'react';
import { Slice, graphql } from 'gatsby';

export default function index({ data }) {
	const { posts } = data.allMarkdownRemark;

	return (
		<Somethings>
			{posts.map(({ post }) => (
				<Slice alias={`post-item--${post.fields.slug.slice(1, -1)}`} />
			))}
		</Somethings>
	);
}

export const pageQuery = graphql`
	query Post {
		allMarkdownRemark(sort: { frontmatter: { date: DESC } }) {
			posts: edges {
				node {
					fields {
						slug
					}
				}
			}
		}
	}
`;
```

⬆️ 在首页获取所有文章 `slug` 并传递给 Slice，~~很优雅~~ 报错了！

```txt
warn [Gatsby Slice API] Could not find values in "index.jsx:9:5" for the following props at build time:
alias
```

接着我便在官方文档里看到了这样的说明：

> The `alias` prop must be statically analyzable, which means it must be an inline string.

也就是说，`alias` 的值必须是静态，这里的静态可以是事先定义的，也可以是直接的字符串，而不能是从某个地方获取的（包括 GraphQL），于是我只能乖乖把查询部分放回首页了😭。

## 最后

Slice 的这个限制可能是由于其底层设计决定的，我也觉得很可惜，因为封装实际上可行的，只是最后的 `alias` 传参存在限制问题。最后我只把 `<Bio />` 组件给迁移至 Slice 了，无论如何 Slice 对性能的优化是肯定有的。值得一提的是 Slice 还有很多使用的方法，你可以在官方文档里看到更详细的介绍：

[$card](https://www.gatsbyjs.com/docs/reference/built-in-components/gatsby-slice/)

[$card](https://www.gatsbyjs.com/docs/how-to/performance/using-slices/)
