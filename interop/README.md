These tests are meant to be run via CLI.

They take an argv path to your wrapper implementation.
Your wrapper implementation should create a **GLOBAL** `wrap(exports, cache)` function.

`lookup` - a key in the cache that your module should wrap.
`cache` - a Map of `string => `module`.

The test will then call `wrap` in various ways and exit with a non-zero value upon test failure.

```sh
> node test.js /absolute/path/to/interop.js
```