/* MultiHasherJS 1.0.0 | Browser and Node.js compatible | CC0 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof define === "function" && define.amd) define(function () { return api; });
  root.MultiHasher = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var MASK_64 = 0xffffffffffffffffn;
  var ROUND_CONSTANTS = [
    0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an,
    0x8000000080008000n, 0x000000000000808bn, 0x0000000080000001n,
    0x8000000080008081n, 0x8000000000008009n, 0x000000000000008an,
    0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
    0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n,
    0x8000000000008003n, 0x8000000000008002n, 0x8000000000000080n,
    0x000000000000800an, 0x800000008000000an, 0x8000000080008081n,
    0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n
  ];
  var ROTATION = [
    0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43,
    25, 39, 41, 45, 15, 21, 8, 18, 2, 61, 56, 14
  ];
  var encoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;

  function toBytes(value) {
    if (value instanceof Uint8Array) return value;
    if (value instanceof ArrayBuffer) return new Uint8Array(value);
    if (typeof value !== "string") throw new TypeError("Expected a string, Uint8Array, or ArrayBuffer.");
    if (encoder) return encoder.encode(value);
    // UTF-8 fallback for older JavaScript engines.
    var encoded = unescape(encodeURIComponent(value)), out = new Uint8Array(encoded.length);
    for (var i = 0; i < encoded.length; i++) out[i] = encoded.charCodeAt(i);
    return out;
  }

  function hex(bytes, upperCase) {
    var result = "";
    for (var i = 0; i < bytes.length; i++) result += bytes[i].toString(16).padStart(2, "0");
    return upperCase ? result.toUpperCase() : result;
  }

  function rotl64(value, bits) {
    if (bits === 0) return value;
    var b = BigInt(bits);
    return ((value << b) | (value >> (64n - b))) & MASK_64;
  }

  function keccakF(state) {
    for (var round = 0; round < 24; round++) {
      var c = new Array(5), d = new Array(5), b = new Array(25);
      for (var x = 0; x < 5; x++) c[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
      for (var x2 = 0; x2 < 5; x2++) d[x2] = c[(x2 + 4) % 5] ^ rotl64(c[(x2 + 1) % 5], 1);
      for (var y = 0; y < 5; y++) for (var x3 = 0; x3 < 5; x3++) state[x3 + 5 * y] ^= d[x3];
      for (var y2 = 0; y2 < 5; y2++) for (var x4 = 0; x4 < 5; x4++) {
        var index = x4 + 5 * y2;
        b[y2 + 5 * ((2 * x4 + 3 * y2) % 5)] = rotl64(state[index], ROTATION[index]);
      }
      for (var y3 = 0; y3 < 5; y3++) for (var x5 = 0; x5 < 5; x5++) {
        state[x5 + 5 * y3] = b[x5 + 5 * y3] ^ ((~b[(x5 + 1) % 5 + 5 * y3]) & b[(x5 + 2) % 5 + 5 * y3]);
      }
      state[0] ^= ROUND_CONSTANTS[round];
    }
  }

  /** Returns a lowercase SHA3-512 digest. */
  function sha3_512(input) {
    var message = toBytes(input), rate = 72, paddedLength = Math.ceil((message.length + 1) / rate) * rate;
    var padded = new Uint8Array(paddedLength), state = new Array(25).fill(0n);
    padded.set(message); padded[message.length] = 0x06; padded[padded.length - 1] |= 0x80;
    for (var offset = 0; offset < padded.length; offset += rate) {
      for (var lane = 0; lane < rate / 8; lane++) {
        var word = 0n;
        for (var byte = 0; byte < 8; byte++) word |= BigInt(padded[offset + lane * 8 + byte]) << BigInt(byte * 8);
        state[lane] ^= word;
      }
      keccakF(state);
    }
    var digest = new Uint8Array(64);
    for (var i = 0; i < 64; i++) digest[i] = Number((state[Math.floor(i / 8)] >> BigInt((i % 8) * 8)) & 0xffn);
    return hex(digest, false);
  }

  // Compact synchronous SHA-256 implementation, for parity with sha256.cpp.
  var K256 = [1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];
  function sha256(input) {
    var bytes = toBytes(input), bitLength = bytes.length * 8, length = bytes.length + 1;
    while (length % 64 !== 56) length++;
    var data = new Uint8Array(length + 8); data.set(bytes); data[bytes.length] = 0x80;
    var high = Math.floor(bitLength / 0x100000000), low = bitLength >>> 0;
    data[length] = high >>> 24; data[length + 1] = high >>> 16; data[length + 2] = high >>> 8; data[length + 3] = high;
    data[length + 4] = low >>> 24; data[length + 5] = low >>> 16; data[length + 6] = low >>> 8; data[length + 7] = low;
    var h = [1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225], w = new Uint32Array(64);
    for (var offset = 0; offset < data.length; offset += 64) {
      var t, a, b, c, d, e, f, g, hh;
      for (t = 0; t < 16; t++) w[t] = (data[offset + 4*t] << 24) | (data[offset + 4*t+1] << 16) | (data[offset + 4*t+2] << 8) | data[offset + 4*t+3];
      for (t = 16; t < 64; t++) { var s0 = ((w[t-15]>>>7)|(w[t-15]<<25)) ^ ((w[t-15]>>>18)|(w[t-15]<<14)) ^ (w[t-15]>>>3); var s1 = ((w[t-2]>>>17)|(w[t-2]<<15)) ^ ((w[t-2]>>>19)|(w[t-2]<<13)) ^ (w[t-2]>>>10); w[t] = (w[t-16] + s0 + w[t-7] + s1) >>> 0; }
      a=h[0];b=h[1];c=h[2];d=h[3];e=h[4];f=h[5];g=h[6];hh=h[7];
      for (t = 0; t < 64; t++) { var S1=((e>>>6)|(e<<26))^((e>>>11)|(e<<21))^((e>>>25)|(e<<7)), ch=(e&f)^((~e)&g), temp1=(hh+S1+ch+K256[t]+w[t])>>>0, S2=((a>>>2)|(a<<30))^((a>>>13)|(a<<19))^((a>>>22)|(a<<10)), maj=(a&b)^(a&c)^(b&c), temp2=(S2+maj)>>>0; hh=g;g=f;f=e;e=(d+temp1)>>>0;d=c;c=b;b=a;a=(temp1+temp2)>>>0; }
      h[0]=(h[0]+a)>>>0;h[1]=(h[1]+b)>>>0;h[2]=(h[2]+c)>>>0;h[3]=(h[3]+d)>>>0;h[4]=(h[4]+e)>>>0;h[5]=(h[5]+f)>>>0;h[6]=(h[6]+g)>>>0;h[7]=(h[7]+hh)>>>0;
    }
    var output = new Uint8Array(32); for (var j=0;j<8;j++) { output[4*j]=h[j]>>>24;output[4*j+1]=h[j]>>>16;output[4*j+2]=h[j]>>>8;output[4*j+3]=h[j]; } return hex(output, false);
  }

  function positiveInteger(value, name) { if (!Number.isSafeInteger(value) || value < 1) throw new RangeError(name + " must be a positive safe integer."); }
  function truncateTo64(digest) {
    if (typeof digest !== "string" || !/^[0-9a-f]{128}$/i.test(digest)) throw new TypeError("Expected a 128-character SHA3-512 hexadecimal digest.");
    var total = 0n; for (var i = 0; i < 8; i++) total = (total + BigInt("0x" + digest.slice(i * 16, i * 16 + 16))) & MASK_64;
    return total.toString(16).toUpperCase();
  }
  function multiHash(text, options) {
    options = options || {}; if (typeof text !== "string") throw new TypeError("multiHash input must be a string.");
    var repeats = options.repeats === undefined ? 1 : options.repeats, levels = options.levels === undefined ? 1 : options.levels;
    positiveInteger(repeats, "repeats"); positiveInteger(levels, "levels");
    var repeated = (text + "\n").repeat(repeats), digest = sha3_512(repeated + ": " + text);
    for (var level = 0; level < levels; level++) digest = sha3_512((digest + "\n").repeat(repeats) + ": " + text);
    return options.truncate ? truncateTo64(digest) : digest.toUpperCase();
  }
  /**
   * Implements the C++ filename-mode calculation for one line. Unlike
   * multiHash(), its first digest does not include the `": " + line` suffix.
   */
  function multiHashLine(line, options) {
    options = options || {}; if (typeof line !== "string") throw new TypeError("multiHashLine input must be a string.");
    var repeats = options.repeats === undefined ? 1 : options.repeats, levels = options.levels === undefined ? 1 : options.levels;
    positiveInteger(repeats, "repeats"); positiveInteger(levels, "levels");
    var digest = sha3_512((line + "\n").repeat(repeats));
    for (var level = 0; level < levels; level++) digest = sha3_512((digest + "\n").repeat(repeats) + ": " + line);
    return options.truncate ? truncateTo64(digest) : digest.toUpperCase();
  }
  /** Hash every line from a string or array, returning C++ codes.txt-style rows. */
  function multiHashLines(lines, options) {
    var values = Array.isArray(lines) ? lines : typeof lines === "string" ? lines.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n") : null;
    if (!values) throw new TypeError("Expected a string or an array of lines.");
    if (typeof lines === "string" && values[values.length - 1] === "") values.pop();
    return values.map(function (line) { return line + ": " + multiHashLine(line, options); });
  }
  async function hashFile(file, algorithm) { var bytes = file instanceof ArrayBuffer ? file : await file.arrayBuffer(); return (algorithm || "sha3-512").toLowerCase() === "sha256" ? sha256(bytes).toUpperCase() : sha3_512(bytes).toUpperCase(); }

  return { sha3_512: sha3_512, sha256: sha256, multiHash: multiHash, multiHashLine: multiHashLine, multiHashLines: multiHashLines, truncateTo64: truncateTo64, hashFile: hashFile };
}));
