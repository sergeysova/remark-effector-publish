# remark-effector-share

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](http://prettier.io)

A [remark](https://github.com/wooorm/remark) plugin that downloads source code of the [effector])(https://effector.now.sh) [repl sharing](https://share.effector.dev).

## Installation

```sh
npm add -D remark-effector-share
# or
yarn add -D remark-effector-share
```

## Usage

1.  First of all create a new share at https://share.effector.dev.
2.  Save it and get actual link to it. Example: https://share.effector.dev/FASHhHwG
3.  Create code block and add link to block metadata. Like this:

        ```js https://share.effector.dev/FASHhHwG
        ```

## Messages

Messages are added to the vFile's as they are processed and can be accessed using `file.messages`.

### `info`

Added when link correct and source code downloaded successfully:

```
example.md:1:1-1:2: Downloaded share https://share.effector.dev/FASHhHwG
```

### `error`

Added when something went wrong. Ex.: link is incorrect

```
example.md:1:1-1:2: Share https://share.effector.dev/FASHhHw1 not found
```

```
example.md:1:1-1:2: Unexpected error
```

## Example

```js
var vfile = require('to-vfile');
var remark = require('remark');
var effectorShare = require('remark-effector-share');

var example = vfile.readSync('example.md');

remark()
  .use(effectorShare)
  .process(example, function (err, file) {
    if (err) throw err;

    console.log(String(file));
  });
```
