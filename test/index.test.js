jest.mock('node-fetch', () => require('fetch-mock-jest').sandbox());
const fetchMock = require('node-fetch');
const { Response } = fetchMock;

import parse from 'remark-parse';
import stringify from 'remark-stringify';
import unified from 'unified';

import effectorShare from './../src/';

const remark = unified().use(parse).use(stringify).freeze();

describe('remark-effector-share', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockClear();
  });

  it('ignores markdown that does not have code block', async () => {
    const source = `# hello world`;

    const result = await remark().use(effectorShare).process(source);

    expect(fetchMock.called()).toBe(false);
    expect(result.contents.trim()).toEqual(source);
    expect(result.messages).toHaveLength(0);
  });

  it('can handle errors when retrieveing shares from effector backend', async () => {
    const source = `
  # Hello world
  Some text
  \`\`\`js https://share.effector.dev/KC3MBolg
  \`\`\`
`;

    const response = new Response(
      JSON.stringify({ message: '404 Not found' }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      },
    );
    fetchMock.post('*', response);

    const result = await remark().use(effectorShare).process(source);

    expect(result.toString()).not.toMatch(/import/i);
    expect(result.messages[0].message).toContain('Unexpected error');
  });

  it('can handle unexisted share link', async () => {
    const source = `
  # Hello world
  Some text
  \`\`\`js https://share.effector.dev/KC3MBolg
  \`\`\`
`;

    const response = new Response(JSON.stringify({ data: { share: null } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    fetchMock.post('*', response);

    const result = await remark().use(effectorShare).process(source);

    expect(fetchMock.called()).toBe(true);
    expect(result.toString()).not.toMatch(/import/i);
    expect(result.messages[0].message).toContain(
      'Share https://share.effector.dev/KC3MBolg not found',
    );
  });

  it('can download source code of the share', async () => {
    const source = `
  # Hello world
  Some text
  \`\`\`js https://share.effector.dev/KC3MBolg
  \`\`\`
`;

    const response = new Response(
      JSON.stringify({
        data: {
          share: {
            slug: 'KC3MBolg',
            code: 'console.log("hello, world");',
            lang: 'js',
            description: null,
            created: 1595286982,
            visits: 500,
          },
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
    fetchMock.post('*', response);

    const result = await remark().use(effectorShare).process(source);

    expect(fetchMock.called()).toBe(true);
    expect(result.toString()).toMatch(/console\.log/gi);
    expect(result.messages[0].message).toContain(
      'Downloaded share https://share.effector.dev/KC3MBolg',
    );
  });
});
