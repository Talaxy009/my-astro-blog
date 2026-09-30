#!/usr/bin/env node
/**
 * beercss 工具
 *
 * 模式一（默认）—— 引入清单体检：对 src/styles/beer.css 的模块引入做四类检查
 *   【1】清单概览（模块 / 体积 / 顺序）
 *   【2】疑似多余：引入了，但源码里找不到任何使用痕迹
 *   【3】疑似遗漏：源码用到，但没有任何已引入模块定义它
 *   【4】风险 lint：上游坑 + 顺序 + 主题类位置（确定性检查，最值得看）
 *
 * 模式二 —— 写作时查类名：看某个 class 在当前模块清单下能不能用
 *   node .agents/skills/beercss/scripts/audit.mjs --find chip card padding left-shadow
 *   node .agents/skills/beercss/scripts/audit.mjs --find          # 不带类名则列出全部可用类
 *
 * 用法：
 *   node .agents/skills/beercss/scripts/audit.mjs [项目根目录]
 *
 * 为什么不直接“从源码反推模块清单”：beercss 里 `.small` / `.large` / `.bottom`
 * 这类修饰类被 10+ 个模块各自定义（语义完全不同），按类名反推会命中几乎全部模块。
 * 【2】【3】因此只是启发式提示，必须配合视觉回归确认。
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const argv = process.argv.slice(2);
const FLAGS = new Set(argv.filter((a) => a.startsWith('--')));
const findAt = argv.indexOf('--find');
/** `--find` 后面的位置参数是要查询的类名；其余位置参数里第一个是项目根目录 */
const findList =
	findAt >= 0
		? argv.slice(findAt + 1).filter((a) => !a.startsWith('--'))
		: [];
const plain = (findAt >= 0 ? argv.slice(0, findAt) : argv).filter(
	(a) => !a.startsWith('--'),
);
const root = resolve(plain[0] ?? process.cwd());
const CDN = join(root, 'node_modules/beercss/dist/cdn');
const BEER_CSS = join(root, 'src/styles/beer.css');
const LAYERS = ['settings', 'helpers', 'elements'];
const SKIP_DIRS = new Set([
	'node_modules',
	'.git',
	'dist',
	'.astro',
	'.yarn',
	'.agents',
]);
const problems = [];
const warns = [];

if (!existsSync(CDN)) {
	console.error(
		`✗ 找不到 ${relative(root, CDN)}，先安装依赖：yarn add beercss --exact`,
	);
	process.exit(1);
}
if (!existsSync(BEER_CSS)) {
	console.error(`✗ 找不到 ${relative(root, BEER_CSS)}`);
	process.exit(1);
}
const version = JSON.parse(
	readFileSync(join(root, 'node_modules/beercss/package.json'), 'utf8'),
).version;

/* ---------- 选择器解析：只取“被定义”的类名（不含 :is/:not/:has 里的引用） ---------- */

const splitTop = (s, seps) => {
	const parts = [];
	let depth = 0;
	let cur = '';
	for (const ch of s) {
		if (ch === '(' || ch === '[') depth++;
		else if (ch === ')' || ch === ']') depth--;
		if (depth === 0 && seps.includes(ch)) {
			parts.push(cur);
			cur = '';
		} else cur += ch;
	}
	parts.push(cur);
	return parts;
};

/** 只删掉 `:not(...)` / `:has(...)`（它们里的类只是被引用），保留 `:is()` / `:where()` 里的主语类 */
const stripNotHas = (s) => {
	let out = '';
	let i = 0;
	while (i < s.length) {
		if (s[i] === ':' && /^:(not|has)\(/.test(s.slice(i))) {
			let depth = 0;
			let j = i;
			for (; j < s.length; j++) {
				if (s[j] === '(') depth++;
				else if (s[j] === ')' && --depth === 0) break;
			}
			i = j + 1;
			continue;
		}
		out += s[i++];
	}
	return out;
};

function definedSubjects(css) {
	const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
	const classes = new Set();
	const elements = new Set();
	let start = 0;
	for (let i = 0; i < text.length; i++) {
		if (text[i] === '{') {
			const prelude = text.slice(start, i).trim();
			start = i + 1;
			// 跳过 @media / @font-face 等 at-rule 的 prelude，以及 keyframes 里的 from/to/0%
			if (
				!prelude ||
				prelude.startsWith('@') ||
				/^(from|to|[\d.]+%)$/.test(prelude)
			)
				continue;
			for (const sel of splitTop(prelude, ',')) {
				const subject =
					splitTop(stripNotHas(sel), ' >+~').filter(Boolean).pop() ??
					'';
				for (const m of subject.matchAll(/\.([a-zA-Z][\w-]*)/g))
					classes.add(m[1]);
				// 元素主语：前面不是 . # : [ - 的标识符（:is(nav,.tabs) 里的 nav 也算）
				for (const m of subject.matchAll(
					/(?:^|[^.\w#:[\]-])([a-z][a-z0-9-]*)/g,
				))
					elements.add(m[1]);
			}
		} else if (text[i] === '}') {
			start = i + 1;
		}
	}
	elements.delete('is');
	elements.delete('where');
	return { classes, elements };
}

/* ---------- 模块索引 ---------- */

const modules = [];
for (const layer of LAYERS) {
	const dir = join(CDN, layer);
	if (!existsSync(dir)) continue;
	for (const file of readdirSync(dir).sort()) {
		if (!file.endsWith('.scoped.css') || file.startsWith('all.')) continue;
		const name = file.replace('.scoped.css', '');
		const defined = definedSubjects(readFileSync(join(dir, file), 'utf8'));
		modules.push({
			layer,
			name,
			size: statSync(join(dir, file)).size,
			classes: defined.classes,
			elements: defined.elements,
		});
	}
}
const key = (layer, name) => `${layer}/${name}`;
const ownerOf = new Map();
const ownerOfElement = new Map();
for (const m of modules) {
	for (const c of m.classes) {
		if (!ownerOf.has(c)) ownerOf.set(c, []);
		ownerOf.get(c).push(key(m.layer, m.name));
	}
	for (const e of m.elements) {
		if (!ownerOfElement.has(e)) ownerOfElement.set(e, []);
		ownerOfElement.get(e).push(key(m.layer, m.name));
	}
}

/* ---------- 源码里的使用痕迹 ---------- */

const files = [];
(function walk(dir) {
	if (!existsSync(dir)) return;
	for (const entry of readdirSync(dir)) {
		if (SKIP_DIRS.has(entry)) continue;
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) walk(full);
		else if (/\.(astro|tsx|jsx|ts|js|md|mdx)$/.test(entry)) {
			// 去掉 <style>：那是“定义”类的地方，不是“使用”
			files.push({
				file: relative(root, full),
				text: readFileSync(full, 'utf8').replace(
					/<style[\s\S]*?<\/style>/g,
					'',
				),
			});
		}
	}
})(join(root, 'src'));

const usedClasses = new Set();
for (const { text } of files) {
	const re =
		/(?:class|className|class:list)\s*[:=]\s*(?:"([^"]*)"|'([^']*)'|\{([\s\S]*?)\})/g;
	let m;
	while ((m = re.exec(text))) {
		for (const token of (m[1] ?? m[2] ?? m[3] ?? '').split(/[^\w-]+/))
			if (token && token !== 'beer') usedClasses.add(token);
	}
}

/** 元素选择器痕迹：只在出现了 .beer 标记的文件里找，否则文章正文的元素会误判 */
const beerText = files
	.filter(({ text }) =>
		/(?:class|className)\s*[:=]\s*(?:"[^"]*\bbeer\b|'[^']*\bbeer\b|\{[\s\S]*?\bbeer\b)/.test(
			text,
		),
	)
	.map((f) => f.text)
	.join('\n');
const ELEMENT_SIG = {
	'elements/navigation': /<nav[\s>/]/,
	'elements/menu': /<menu[\s>/]/,
	'elements/list': /<li[\s>/]|<ul[\s>/]|<ol[\s>/]/,
	'elements/button': /<button[\s>/]/,
	'elements/media': /<(img|video|iframe|audio)[\s>/]/,
	'elements/typography': /<(h[1-6]|p|blockquote|pre|code)[\s>/]/,
	'elements/table': /<table[\s>/]/,
	'elements/divider': /<hr[\s>/]/,
	'elements/icon': /<i[\s>/]/,
	'elements/bar': /<(header|footer)[\s>/]/,
};

/* ---------- 解析当前引入 ---------- */

const src = readFileSync(BEER_CSS, 'utf8');
const imports = [...src.matchAll(/@import\s+'([^']+)'\s*;/g)].map((m) => m[1]);
const beerImports = imports.filter((p) => p.startsWith('beercss/'));
const imported = new Set(
	beerImports
		.map((p) => {
			const m =
				/beercss\/dist\/cdn\/(settings|helpers|elements)\/(.+)\.scoped\.css$/.exec(
					p,
				);
			return m
				? key(m[1], m[2])
				: /settings\/global\.css$/.test(p)
					? 'settings/global'
					: null;
		})
		.filter(Boolean),
);

const kb = (n) => `${(n / 1024).toFixed(1)}KB`;
const mod = (k) => modules.find((m) => key(m.layer, m.name) === k);

/* ---------- 模式二：查类名可用性（写作时的常用诉求） ---------- */
if (FLAGS.has('--find')) {
	if (!findList.length) {
		// 不带类名：列出当前模块清单下可用的全部类
		console.log(
			`beercss v${version} — 当前清单（${imported.size} 个模块）下可用的类\n`,
		);
		for (const layer of LAYERS) {
			const inLayer = [...imported].filter((k) =>
				k.startsWith(layer + '/'),
			);
			if (!inLayer.length) continue;
			console.log(`/* ---------- ${layer} ---------- */`);
			for (const k of inLayer.sort()) {
				const cls = [...(mod(k)?.classes ?? [])]
					.filter((c) => c !== 'beer')
					.sort();
				if (cls.length)
					console.log(`${k}: ${cls.map((c) => '.' + c).join(' ')}`);
			}
			console.log('');
		}
		console.log(
			'提示：beercss 用元素选择器写样式的地方很多（nav / menu / li / button / img / h1-h6 / table / hr / i），',
		);
		console.log('      这些不靠类名，详情见 references/available.md。');
		process.exit(0);
	}
	const pad = Math.max(...findList.map((c) => c.length)) + 1;
	const sortOwners = (list) =>
		[...list].sort(
			(a, b) =>
				Number(a.startsWith('settings/')) -
					Number(b.startsWith('settings/')) || a.localeCompare(b),
		);
	const describe = (name, owners, kind) => {
		const hit = sortOwners(owners.filter((o) => imported.has(o)));
		const feature = hit.filter((o) => !o.startsWith('settings/'));
		if (hit.length && (kind === '' || feature.length)) {
			const extra =
				owners.length > hit.length
					? `（另有 ${owners.length - hit.length} 个未引入的模块也定义了它）`
					: '';
			console.log(
				`${name.padEnd(pad)} ✅ 可用    ${kind}来自 ${hit.join('、')}${extra}`,
			);
		} else if (hit.length) {
			const opts = sortOwners(owners.filter((o) => !imported.has(o))).map(
				(o) => `${o}（${mod(o) ? kb(mod(o).size) : '?'}）`,
			);
			console.log(
				`${name.padEnd(pad)} ⚠️ 只有基础 reset（${hit.join('、')}），没有组件样式${opts.length ? `；需要：${opts.join(' 或 ')}` : ''}`,
			);
		} else {
			const opts = sortOwners(owners).map(
				(o) => `${o}（${mod(o) ? kb(mod(o).size) : '?'}）`,
			);
			console.log(
				`${name.padEnd(pad)} ⚠️ 未引入  需要：${opts.join(' 或 ')}`,
			);
		}
	};
	for (const raw of findList) {
		const wantsElement = /^<.*>$/.test(raw);
		const name = raw.replace(/^[.<]|>$/g, '');
		const asClass = ownerOf.get(name) ?? [];
		const asElement = ownerOfElement.get(name) ?? [];
		if (!asClass.length && !asElement.length) {
			console.log(`${raw.padEnd(pad)} ❌ beercss 里没有这个类/元素`);
		} else if (asClass.length && !wantsElement) {
			// 同名时优先按类解释（.round 是类，round 是个别模块里的元素主语）
			describe(`.${name}`, asClass, '');
			if (asElement.length && !imported.has(asClass[0]))
				describe(`<${name}>`, asElement, '元素选择器，');
		} else if (asElement.length) {
			describe(`<${name}>`, asElement, '元素选择器，');
			if (asClass.length) describe(`.${name}`, asClass, '');
		}
	}
	process.exit(0);
}

console.log(`beercss v${version} — 引入清单体检\n`);
console.log(`【1】当前引入 ${imported.size} 个模块`);

/* ---------- lint：顺序 ---------- */
const layerOf = (p) => (p.match(/(settings|helpers|elements)\//) ?? [])[1];
const order = imports.map(layerOf);
const groupOrder = order.filter((v, i, a) => v && v !== a[i - 1]);
if (groupOrder.join('>') !== 'settings>helpers>elements')
	warns.push(
		`模块分层顺序不是 settings → helpers → elements（当前：${groupOrder.join(' → ')}）`,
	);
for (const layer of LAYERS) {
	const names = beerImports
		.filter((p) => p.includes(`/${layer}/`))
		.map((p) => p.split('/').pop().replace('.scoped.css', ''));
	const sorted = [...names].sort();
	if (names.join() !== sorted.join())
		warns.push(`${layer} 层内不是字母序：${names.join(', ')}`);
}
if (imports.length && !imports.at(-1)?.startsWith('.'))
	warns.push(
		`最后一个 @import 不是本地自定义主题（${imports.at(-1)}）；覆盖类规则必须放在最后才能生效`,
	);

/* ---------- 【2】疑似多余 ---------- */
const unused = [];
for (const k of imported) {
	if (k.startsWith('settings/')) continue; // settings 不靠类名使用，跳过
	const m = mod(k);
	if (!m) continue;
	const classHit = [...m.classes].some((c) => usedClasses.has(c));
	const sig = ELEMENT_SIG[k];
	const elementHit = sig ? sig.test(beerText) : false;
	if (!classHit && !elementHit) unused.push({ k, m });
}

/* ---------- 【3】疑似遗漏 ---------- */
const missed = [];
for (const c of usedClasses) {
	const owners = ownerOf.get(c);
	if (!owners) continue; // 项目自有类
	if (owners.some((o) => imported.has(o))) continue;
	missed.push({ c, owners });
}

/* ---------- 输出 ---------- */
let layer = '';
for (const p of beerImports) {
	const k = imported.size
		? [...imported].find((x) => p.includes(`/${x.split('/')[1]}.`))
		: null;
	const m = k ? mod(k) : mod('settings/global');
	if (!m) continue;
	if (m.layer !== layer) {
		layer = m.layer;
		console.log(`  /* ${layer} */`);
	}
	const name = /\/([^/]+)\.scoped\.css$/.exec(p)?.[1] ?? 'global';
	const isUnused = unused.some((u) => u.k === k);
	console.log(
		`  ${isUnused ? '?' : '✓'} ${name.padEnd(12)} ${kb(m.size).padStart(6)}  ${p}`,
	);
}

console.log(`\n【2】疑似多余（引入但源码/元素里都没找到使用痕迹）`);
if (!unused.length) console.log(`  无`);
for (const { k, m } of unused) {
	console.log(
		`  ${k}  ${kb(m.size)}   定义的部分类：${[...m.classes]
			.slice(0, 6)
			.map((c) => '.' + c)
			.join(' ')}`,
	);
}

console.log(`\n【3】疑似遗漏（源码用到，但没有已引入模块定义它）`);
if (!missed.length) console.log(`  无`);
for (const { c, owners } of missed.slice(0, 20)) {
	console.log(`  .${c}  → 可能来自：${owners.join('、')}`);
}
if (missed.length > 20) console.log(`  … 另有 ${missed.length - 20} 个`);

console.log(`\n【4】风险检查`);

// 确定性 lint
if (beerImports.some((p) => /\/all\.scoped\.css$/.test(p)))
	problems.push(
		`引入了 all.scoped.css —— 它与非 scoped 的 all.css 内容完全相同（上游构建问题），等于没有作用域。请逐个模块引入`,
	);
if (imported.has('elements/shape'))
	problems.push(
		`引入了 elements/shape —— 它只提供 .shape.* 装饰蒙版，且会引 36 个 svg，被 Vite 内联后给 CSS 多塞约 28KB`,
	);
if (imported.has('helpers/color'))
	warns.push(
		`引入了 helpers/color（9.9KB 的 amber/red/teal… 调色板），确认真的用到了`,
	);
const rippleJsWired = files.some(({ text }) =>
	/helpers\/ripple(\.min)?\.js/.test(text),
);
if (imported.has('helpers/ripple') && !rippleJsWired)
	warns.push(
		`引入了 helpers/ripple 的 CSS，但源码里找不到 ripple 的 JS —— ripple 由 JS 的委派监听实现（监听 .ripple / .fast-ripple / .slow-ripple），只引 CSS 不会有反应。在 BaseHead 里 import { updateAllRipples } from 'beercss/dist/cdn/helpers/ripple.js' 并调用；纯 CSS 的波纹请改用 helpers/wave`,
	);
if (rippleJsWired && !imported.has('helpers/ripple'))
	warns.push(
		`源码里加载了 ripple 的 JS，但没引 helpers/ripple 的 CSS —— 动画关键帧与 .ripple-js 样式在 CSS 里，只加载 JS 看不到效果`,
	);
if (
	imported.has('settings/font') &&
	/--font-icon\s*:\s*none/.test(
		readFileSync(join(root, 'src/styles/beer-theme.css'), 'utf8'),
	)
) {
	warns.push(
		`引入了 settings/font（4 个 Material Symbols 的 @font-face），但 --font-icon: none —— 可以省掉，避免多余字体请求`,
	);
}
const themeOnHtml = /documentElement\.classList|<html[^>]*class=/.test(
	files.map((f) => f.text).join('\n'),
);
if (
	themeOnHtml &&
	(imported.has('settings/dark') || imported.has('settings/light'))
) {
	problems.push(
		`主题类挂在 <html> 上，但引入了 settings/dark|light.scoped.css —— v5 的 scoped 暗色是 :is(.beer).dark，匹配不到 <html>，会掉回浅色。调色板请在本地主题文件里用全局 :root, .light / .dark 自维护`,
	);
}
if (themeOnHtml && !imported.has('settings/global')) {
	warns.push(
		`没有引入非 scoped 的 settings/global.css（当前可能是 scoped 版）—— :root 变量与 body 排版需要它，否则 .beer 之外的样式会失去颜色变量`,
	);
}

if (!problems.length && !warns.length) console.log(`  无`);
problems.forEach((p) => console.log(`  ✗ ${p}`));
warns.forEach((w) => console.log(`  ⚠️ ${w}`));

console.log(
	`\n提示：【2】【3】是启发式结果，定稿前请按 SKILL.md 第 5 步做视觉回归。`,
);
process.exitCode = problems.length ? 1 : 0;
