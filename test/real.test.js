import parse from 'remark-parse';
import stringify from 'remark-stringify';
import unified from 'unified';

import effectorShare from './../src/';

const remark = unified().use(parse).use(stringify).freeze();

describe('real test', () => {
  it('can really download source code of the share', async () => {
    const source = `
  # Hello world
  Some text
  \`\`\`js https://share.effector.dev/KC3MBolg
  \`\`\`
`;

    const result = await remark().use(effectorShare).process(source);

    expect(result.toString()).toMatchInlineSnapshot(`
      "# Hello world

        Some text

      \`\`\`js https&#x3A;//share.effector.dev/KC3MBolg
      const {
        default: {throttle},
      } = await import('https://dev.jspm.io/patronum@0.100.1/throttle')

      const fx = createEffect().use(
        x => new Promise(resolve => setTimeout(resolve, 200, x))
      )

      const source = createEvent()
      throttle({source, timeout: 300, target: fx})

      fx.doneData.watch(x => console.log('fx done', x))

      let count = 0
      setInterval(() => {
        source(count++)
      }, 200)

      \`\`\`
      "
    `);
    expect(result.messages[0].message).toContain(
      'Downloaded share https://share.effector.dev/KC3MBolg',
    );
  });
});
