import { defineHastPlugin } from 'satteri';

export const autolinkHeadings = defineHastPlugin({
  name: 'autolink-headings',
  element: {
    filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    visit(node, ctx) {
      const id = node.properties?.id;
      if (!id) return;
      ctx.prependChild(node, {
        type: 'element',
        tagName: 'a',
        properties: {
          href: `#${id}`,
          class: 'anchor-link',
          ariaHidden: 'true',
        },
        children: [{ type: 'text', value: '#' }],
      });
    },
  },
});
