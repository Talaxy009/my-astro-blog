import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content');

function getLocalISOString() {
	const now = new Date();
	const offset = -now.getTimezoneOffset();
	const sign = offset >= 0 ? '+' : '-';
	const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, '0');
	const hh = pad(offset / 60);
	const mm = pad(offset % 60);
	const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
	return `${local.toISOString().slice(0, 19)}${sign}${hh}:${mm}`;
}

function createPost(slug) {
	if (!slug || !/^[\w-]+$/.test(slug)) {
		console.error('目录名无效，只允许字母、数字、连字符和下划线');
		process.exit(1);
	}

	const postDir = path.join(CONTENT_DIR, slug);

	if (fs.existsSync(path.join(postDir, 'index.md'))) {
		console.error(`文章已存在：${postDir}`);
		process.exit(1);
	}

	fs.mkdirSync(postDir, { recursive: true });

	const frontmatter = [
		'---',
		'title: ',
		`date: '${getLocalISOString()}'`,
		"description: ''",
		'tags: []',
		"img: 'img.svg'",
		'---',
		'',
	].join('\n');

	fs.writeFileSync(path.join(postDir, 'index.md'), frontmatter);
	console.log(`成功创建：${path.join(postDir, 'index.md')}`);
}

const argSlug = process.argv[2];
if (argSlug) {
	createPost(argSlug);
} else {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	rl.question('想要创建的目录名：', (slug) => {
		rl.close();
		createPost(slug.trim());
	});
}
