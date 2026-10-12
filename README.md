# MultiHasherJS

Browser and Node.js port of the C++ Multi-Hash SHA3-512 implementation. It includes a dependency-free SHA3-512 implementation, SHA-256 parity with the included C++ utility, and the iterative Multi-Hash algorithm.<br>
It hashes hashes to energize them, like a laser's lens. However, this implementation may be very slow and hang tabs.<br>Also, please do not use truncate to 64 bits, it's useless.

A possible guidance could be 88 repeats @88 levels but we did much more in the native era.

```js
const MultiHasher = require('./multihasher.js');
MultiHasher.multiHash('hello', { repeats: 1, levels: 1 });
// => uppercase SHA3-512 digest
```

For a CDN or plain browser page, load `multihasher.js`; it creates `globalThis.MultiHasher`:

```html
<script src="https://your-cdn.example/multihasher.js"></script>
<script>
  MultiHasher.multiHash('hello', { repeats: 2, levels: 5, truncate: true });
</script>
```

API: `sha3_512(input)`, `sha256(input)`, `sha512(input)`, `multiHash(text, options)`, `multiHashLine(line, options)`, `multiHashLines(lines, options)`, `truncateTo64(digest)`, and `hashFile(fileOrArrayBuffer, algorithm)`. `sha512` is asynchronous and uses the optimized native Web Crypto `SHA-512` implementation; use `await MultiHasher.sha512("text")`. `hashFile(file, "sha-512")` uses the same fast path. The line methods reproduce the main C++ program's filename-mode behavior without filesystem-path guessing. Hash primitives return lowercase hexadecimal to match the C++ internals; higher-level methods return uppercase just like the C++ tools. `demo.html` is an optional standalone interactive interface.

Run `npm test` (no dependencies required) to verify SHA-256 and SHA3-512 against Node's crypto implementation.
