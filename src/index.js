import fetch from 'node-fetch';
import visit from 'unist-util-visit';

const PLUGIN_NAME = 'remark-effector-share';
const SHARE_REGEXP = /https:\/\/share\.effector\.dev\/([\w\d]+)/i;

export default function effectorShare(options = {}) {
  /**
   * @link https://github.com/unifiedjs/unified#function-transformernode-file-next
   * @link https://github.com/syntax-tree/mdast
   * @link https://github.com/vfile/vfile
   * @param {object} ast MDAST
   * @param {object} vFile
   * @param {function} next
   * @return {object}
   */
  return async function transformer(ast, vFile, next) {
    try {
      await visitCode(ast, vFile, options);
    } catch (err) {
      // no-op, vFile will have the error message.
    }

    if (typeof next === 'function') {
      return next(null, ast, vFile);
    }

    return ast;
  };
}

async function visitCode(ast, vFile, options) {
  const nodes = [];

  visit(ast, 'code', (node) => {
    const { meta } = node;

    if (meta.match(SHARE_REGEXP)) {
      nodes.push(node);
    }

    return node;
  });

  if (nodes.length === 0) {
    return Promise.resolve(ast);
  }

  return Promise.all(
    nodes.map(async (node) => {
      const [, slug] = node.meta.match(SHARE_REGEXP);

      try {
        const { share } = await getShare(slug);

        if (!share) {
          vFile.message(
            `Share https://share.effector.dev/${slug} not found`,
            node.position,
            PLUGIN_NAME,
          );
          return;
        }

        node.value = share.code;

        vFile.info(
          `Downloaded share https://share.effector.dev/${slug}`,
          node.position,
          PLUGIN_NAME,
        );
      } catch (error) {
        vFile.message(`Unexpected error: ${error}`, node.position, PLUGIN_NAME);
      }
    }),
  );
}

async function getShare(slug) {
  const query = `
    query Share($slug: String!) {
      share: getCodePage(slug: $slug) {
        slug
        code
        lang
        description
        created
        visits
      }
    }
  `;

  const url =
    'https://y6776i4nfja2lnx3gbkbmlgr3i.appsync-api.us-east-1.amazonaws.com/graphql';

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ query, variables: { slug } }),
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'da2-srl2uzygsnhpdd2bban5gscnza',
    },
  });

  if (!response.ok) {
    throw new Error(`${response.statusText} from ${url}.`);
  }

  return response.json().then((answer) => answer.data);
}
