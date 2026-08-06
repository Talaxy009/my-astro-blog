import { visit } from 'unist-util-visit';

/**
 * Rehype plugin that wraps <pre> elements in a custom <div>.
 * Useful for adding extra UI elements (copy button, filename label, etc.)
 * around code blocks.
 *
 * @param {{ className?: string }} [options]
 * @returns {import('unified').Transformer<import('hast').Root, import('hast').Root>}
 */
export default function rehypeCodeWrapper(options = {}) {
	const className = options.className || 'code-wrapper';

	return function (tree) {
		visit(tree, 'element', (node, index, parent) => {
			if (node.tagName === 'pre') {
				const wrapper = {
					type: 'element',
					tagName: 'div',
					properties: { className: [className] },
					children: [node],
				};
				parent.children[index] = wrapper;
			}
		});
	};
}
