(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/rohandas/Desktop/semesterly/node_modules/browserify/node_modules/buffer/index.js":[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
 *     on objects.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

function typedArraySupport () {
  function Bar () {}
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    arr.constructor = Bar
    return arr.foo() === 42 && // typed array instances can be augmented
        arr.constructor === Bar && // constructor can be set
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    this.length = 0
    this.parent = undefined
  }

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (object.buffer instanceof ArrayBuffer) {
      return fromTypedArray(that, object)
    }
    if (object instanceof ArrayBuffer) {
      return fromArrayBuffer(that, object)
    }
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    array.byteLength
    that = Buffer._augment(new Uint8Array(array))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromTypedArray(that, new Uint8Array(array))
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
} else {
  // pre-set for values that may exist in the future
  Buffer.prototype.length = undefined
  Buffer.prototype.parent = undefined
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` is deprecated
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` is deprecated
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"base64-js":"/Users/rohandas/Desktop/semesterly/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib/b64.js","ieee754":"/Users/rohandas/Desktop/semesterly/node_modules/browserify/node_modules/buffer/node_modules/ieee754/index.js","isarray":"/Users/rohandas/Desktop/semesterly/node_modules/browserify/node_modules/buffer/node_modules/isarray/index.js"}],"/Users/rohandas/Desktop/semesterly/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib/b64.js":[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],"/Users/rohandas/Desktop/semesterly/node_modules/browserify/node_modules/buffer/node_modules/ieee754/index.js":[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],"/Users/rohandas/Desktop/semesterly/node_modules/browserify/node_modules/buffer/node_modules/isarray/index.js":[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/course_actions.js":[function(require,module,exports){
module.exports = Reflux.createActions(
  ["getCourseInfo"]
);

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/toast_actions.js":[function(require,module,exports){
module.exports = Reflux.createActions(
  ["createToast"]
);

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js":[function(require,module,exports){
module.exports = Reflux.createActions(
  [
  "updateCourses",
  "updatePreferences",
  "loadPresetTimetable",
  "setSchool",
  "setCoursesLoading",
  "setCoursesDoneLoading",
  "setCurrentIndex",
  ]
);

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/app.jsx":[function(require,module,exports){
var Root = require('./root');
var TimetableActions = require('./actions/update_timetables');
_SEMESTER = "S";

var data = window.location.pathname.substring(1); // loading timetable data from url
if (!data && typeof(Storage) !== "undefined") { // didn't find in URL, try local storage
    data = localStorage.getItem('data');
} 

ReactDOM.render(
  React.createElement(Root, {data: data}),
  document.getElementById('page')
);




if (data) {
	TimetableActions.loadPresetTimetable(data);
}

},{"./actions/update_timetables":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./root":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/root.jsx"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/control_bar.jsx":[function(require,module,exports){
var SearchBar = require('./search_bar');
var PreferenceMenu = require('./preference_menu');

module.exports = React.createClass({displayName: "exports",

  render: function() {
    return (
      React.createElement("div", {id: "control-bar"}, 
        React.createElement("div", {id: "search-bar-container"}, 
          React.createElement(SearchBar, {toggleModal: this.props.toggleModal})
        ), 
        React.createElement(PreferenceMenu, null)
      )

    );
  },
});

},{"./preference_menu":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/preference_menu.jsx","./search_bar":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/search_bar.jsx"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/copy_button.jsx":[function(require,module,exports){
module.exports = React.createClass({displayName: "exports",

	getInitialState: function() {
		return {show_link_popover: false};
	},

  	getShareLink: function() {
    	var link = window.location.host + "/";
    	var data = this.props.getData();
    	return link + data;
  	},

  	toggleLinkPopover: function(event) {
		this.setState({show_link_popover: !this.state.show_link_popover});
  	},

	render: function() {
		var pop = this.state.show_link_popover ? 
		(React.createElement("div", null, 
            React.createElement("div", {className: "copy-arrow-up"}), 
			React.createElement("div", {className: "copy-content"}, 
				"The link for this timetable is below. Copy it to easily share your schedule with friends.", 
				React.createElement("input", {onClick: this.highlightAll, 
				ref: "link", className: "copy-text", 
				value: this.getShareLink()})
			)
		)) :
		null;
		return (
			React.createElement("div", {className: "right copy-button"}, 
			React.createElement("a", {className: "btn btn-primary calendar-function", onClick: this.toggleLinkPopover}, 
              React.createElement("span", {className: "fui-clip"})
            ), 
            pop

            )
		);
	},
	highlightAll: function(e) {
		this.refs.link.select();
	},
	componentDidUpdate: function() {
		if (!this.state.show_link_popover) {return;}
		this.highlightAll();
	},

	componentDidMount: function() {
		$(document).on("click", function(e) {
			e.stopPropagation();
			var target = $(e.target);
			if ((target).is('.copy-button *, .copy-button')) {
				return;
			}
			if (this.state.show_link_popover) {
				this.setState({show_link_popover: false});
			}

		}.bind(this));
	},

});

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/evaluations.jsx":[function(require,module,exports){
var SideScroller = require('./side_scroller.jsx');


var Evaluation = React.createClass({displayName: "Evaluation",
	render: function() {
		var classes = this.props.mini ? "eval-item eval-mini" : "eval-item selected";
		var details = prof = null;

		if (!this.props.mini) { // only show extra information if this eval isn't mini
			// (i.e. full evaluation, not nav item for full evaluations)
			var details = (
				React.createElement("div", {id: "details"}, this.props.eval_data.summary.replace(/\u00a0/g, " "))
			);
			var prof = (
				React.createElement("div", {id: "prof"}, React.createElement("b", null, "Professor: ", this.props.eval_data.professor))
			);
		}	
 		
		var year = this.props.eval_data.year.indexOf(":") > -1 ? 
		(this.props.eval_data.year.replace(":", " ")) :
		(this.props.eval_data.year);
		return (
		React.createElement("div", {className: classes}, 
			React.createElement("div", {className: "eval-wrapper"}, 
				React.createElement("div", {className: "year"}, React.createElement("b", null, year)), 
				prof, 
				React.createElement("div", {className: "rating-wrapper"}, 
					React.createElement("div", {className: "star-ratings-sprite eval-stars"}, 
						React.createElement("span", {style: {width: 100*this.props.eval_data.score/5 + "%"}, className: "rating"})
					), 
					React.createElement("div", {className: "numeric-rating"}, React.createElement("b", null, "(" + this.props.eval_data.score + ")"))
				)
			), 
			details
		));
	},
});



module.exports = React.createClass({displayName: "exports",
	

	render: function() {

		var navs = this.props.eval_info.map(function(e) {
			return (React.createElement(Evaluation, {eval_data: e, key: e.id, mini: true}));
		}.bind(this));

		var evals = this.props.eval_info.map(function(e) {
			return (React.createElement(Evaluation, {eval_data: e, key: e.id}));
		}.bind(this));

		var click_notice = this.props.eval_info.length == 0 ? (React.createElement("div", {id: "empty-intro"}, "No course evaluations for this course yet.")) 
		: (React.createElement("div", {id: "click-intro"}, "Click an evaluation item above to read the comments."));
		

		var evaluation_scroller = (React.createElement("div", {className: "empty-intro"}, "No course evaluations for this course yet."));
		var custom_class = "";
		if (evals.length > 0) {
			evaluation_scroller = (React.createElement(SideScroller, {
			nav_items: navs, 
			content: evals, 
			id: "evaluations-carousel"}));
			custom_class = "spacious-entry";
		}

		return (
		React.createElement("div", {className: "modal-entry " + custom_class, id: "course-evaluations"}, 
			React.createElement("h6", null, "Course Evaluations:"), 
			evaluation_scroller
		));
	},

});

},{"./side_scroller.jsx":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/side_scroller.jsx"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/loader.jsx":[function(require,module,exports){
module.exports = React.createClass({displayName: "exports",

	render: function() {
		return (
            React.createElement("div", {id: "load"}, 
                React.createElement("div", {className: "sk-cube-grid"}, 
	                React.createElement("div", {className: "sk-cube sk-cube1"}), 
	                React.createElement("div", {className: "sk-cube sk-cube2"}), 
	                React.createElement("div", {className: "sk-cube sk-cube3"}), 
	                React.createElement("div", {className: "sk-cube sk-cube4"}), 
	                React.createElement("div", {className: "sk-cube sk-cube5"}), 
	                React.createElement("div", {className: "sk-cube sk-cube6"}), 
	                React.createElement("div", {className: "sk-cube sk-cube7"}), 
	                React.createElement("div", {className: "sk-cube sk-cube8"}), 
	                React.createElement("div", {className: "sk-cube sk-cube9"})
                )
            ));
	},
});

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/modal_content.jsx":[function(require,module,exports){
var Loader = require('./loader');
var CourseInfoStore = require('./stores/course_info');
var EvaluationManager = require('./evaluations.jsx');
var TimetableActions = require('./actions/update_timetables.js');
var UpdateTimetablesStore = require('./stores/update_timetables.js');
var CourseActions = require('./actions/course_actions');
var SectionSlot = require('./section_slot.jsx');
var SideScroller = require('./side_scroller.jsx');


module.exports = React.createClass({displayName: "exports",
	mixins: [Reflux.connect(CourseInfoStore)],

	render: function() {
		var loading = this.state.info_loading;
		var loader = loading ? React.createElement(Loader, null) : null;
		var header = loading ? null : this.getHeader();
		var description = loading ? null : this.getDescription();
		var evaluations = loading ? null : this.getEvaluations();

		var recomendations = loading ? null : this.getRecomendations();
		var textbooks = loading ? null : this.getTextbooks();
		var sections = loading ? null : this.getSections();
		return (
			React.createElement("div", {id: "modal-content"}, 
				React.createElement("i", {className: "right fa fa-2x fa-times close-course-modal", onClick: this.props.hide}), 
                loader, 
                header, 
                description, 
                sections, 
                evaluations, 
                textbooks, 
                recomendations
            ));
	},

	getHeader: function() {
		var course_id = this.state.course_info.id;
		var c_to_s = this.props.courses_to_sections;
		var add_or_remove = Object.keys(c_to_s).indexOf(String(course_id)) > -1 ?
		(React.createElement("span", {className: "course-action fui-check", onClick: this.toggleCourse(true)})) : 
		(React.createElement("span", {className: "course-action fui-plus", onClick: this.toggleCourse(false)}));
		var header = (React.createElement("div", {className: "modal-header"}, 
			add_or_remove, 
			React.createElement("div", {id: "course-info-wrapper"}, 
				React.createElement("div", {id: "name"}, this.state.course_info.name), 
				React.createElement("div", {id: "code"}, this.state.course_info.code)
			)
		));
		return header;
	},
	toggleCourse: function(removing) {
		// if removing is true, we're removing the course, if false, we're adding it
		return (function () {
			TimetableActions.updateCourses({id: this.state.course_info.id, section: '', removing: removing});
			if (!removing) {
				this.props.hide();
			}
		}.bind(this));

	},
	openRecomendation: function(course_id) {
		return (function() {
			CourseActions.getCourseInfo(this.props.school, course_id);
		}.bind(this));
	},

	getDescription: function() {
		var description = 
			(React.createElement("div", {className: "modal-entry", id: "course-description"}, 
				React.createElement("h6", null, "Description:"), 
				this.state.course_info.description
			))
		return description;
	},

	getEvaluations: function() {
		return React.createElement(EvaluationManager, {eval_info: this.state.course_info.eval_info})
	},

	getRecomendations: function() {
		var related = this.state.course_info.related_courses.slice(0,3).map(function(rc) {
            return (
            	React.createElement("div", {className: "recommendation", onClick: this.openRecomendation(rc.id), key: rc.id}, 
            		React.createElement("div", {className: "center-wrapper"}, 
	            		React.createElement("div", {className: "rec-wrapper"}, 
		            		React.createElement("div", {className: "name"}, rc.name), 
		            		React.createElement("div", {className: "code"}, rc.code)
		            	)
		            )
            	))
        }.bind(this));
		var recomendations = this.state.course_info.related_courses.length == 0 ? null :
			(React.createElement("div", {className: "modal-entry"}, 
				React.createElement("h6", null, "Courses You Might Like:"), 
				React.createElement("div", {id: "course-recomendations"}, 
					related
				)
			))
		return recomendations;
	},

	expandRecomendations: function() {

	},

	getTextbooks: function() {

		if(this.state.course_info.textbook_info[0] == undefined) {return null;}
		
		var textbook_elements = this.state.course_info.textbook_info[0].textbooks.map(function(tb) {
           
           	return (
				React.createElement("a", {className: "textbook", href: tb.detail_url, target: "_blank", key: tb.id}, 
	                React.createElement("img", {height: "125", src: tb.image_url}), 
	                React.createElement("div", {className: "module"}, 
	                  React.createElement("h6", {className: "line-clamp"}, tb.title)
                  ), 
                  React.createElement("img", {src: "https://images-na.ssl-images-amazon.com/images/G/01/associates/remote-buy-box/buy5._V192207739_.gif", width: "120", height: "28", border: "0"})
	            ));

        }.bind(this));
		var textbooks = this.state.course_info.textbook_info[0].textbooks.length == 0 ? (React.createElement("div", {id: "empty-intro"}, "No textbooks for this course yet.")) :
				(React.createElement("div", {id: "textbooks"}, 
	            	textbook_elements
	            ));
		var ret = 
			(React.createElement("div", {className: "modal-entry", id: "course-textbooks"}, 
				React.createElement("h6", null, "Textbooks:"), 
				textbooks
			));
		return ret;
	},

	getSections: function() {
		var count = this.state.course_info.sections_S.length;
		var S = this.state.course_info.sections_S.map(function(s, i){
			return (React.createElement(SectionSlot, {key: i, 
				unique: i, 
				all_sections: this.state.course_info.sections_S_objs, 
				section: s}))
		}.bind(this));
		var section_scroller = (React.createElement("div", {className: "empty-intro"}, "No sections found for this course."));
		if (S.length > 0) {
			section_scroller = (React.createElement(SideScroller, {
			slidesToShow: 2, 
			content: S, 
			id: "sections-carousel"}));
		}
		var sections = 
			(React.createElement("div", {className: "modal-entry spacious-entry", id: "course-sections"}, 
				React.createElement("h6", null, "Course Sections:"), 
				section_scroller
			));
		return sections;
	},

	getInitialState: function() {
		return {
			show_sections: 0
		};
	},

	setShowSections: function(id) {
		return (function() {
			this.setState({show_sections: id});
		}.bind(this));
	},


});

},{"./actions/course_actions":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/course_actions.js","./actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./evaluations.jsx":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/evaluations.jsx","./loader":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/loader.jsx","./section_slot.jsx":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/section_slot.jsx","./side_scroller.jsx":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/side_scroller.jsx","./stores/course_info":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/course_info.js","./stores/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/modules/nuka-carousel/carousel.jsx":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = React;

var _react2 = _interopRequireDefault(_react);

var _reactDom = ReactDOM;

var _reactDom2 = _interopRequireDefault(_reactDom);

var _reactTweenState = require('./react-tween-state');

var _reactTweenState2 = _interopRequireDefault(_reactTweenState);

var _decorators = require('./decorators');

var _decorators2 = _interopRequireDefault(_decorators);

var _objectAssign = require('./object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _exenv = require('./exenv');

var _exenv2 = _interopRequireDefault(_exenv);

var addEvent = function addEvent(elem, type, eventHandle) {
  if (elem === null || typeof elem === 'undefined') {
    return;
  }
  if (elem.addEventListener) {
    elem.addEventListener(type, eventHandle, false);
  } else if (elem.attachEvent) {
    elem.attachEvent('on' + type, eventHandle);
  } else {
    elem['on' + type] = eventHandle;
  }
};

var removeEvent = function removeEvent(elem, type, eventHandle) {
  if (elem === null || typeof elem === 'undefined') {
    return;
  }
  if (elem.removeEventListener) {
    elem.removeEventListener(type, eventHandle, false);
  } else if (elem.detachEvent) {
    elem.detachEvent('on' + type, eventHandle);
  } else {
    elem['on' + type] = null;
  }
};

var Carousel = _react2['default'].createClass({
  displayName: 'Carousel',

  mixins: [_reactTweenState2['default'].Mixin],

  propTypes: {
    cellAlign: _react2['default'].PropTypes.oneOf(['left', 'center', 'right']),
    cellSpacing: _react2['default'].PropTypes.number,
    data: _react2['default'].PropTypes.func,
    decorators: _react2['default'].PropTypes.array,
    dragging: _react2['default'].PropTypes.bool,
    easing: _react2['default'].PropTypes.string,
    edgeEasing: _react2['default'].PropTypes.string,
    framePadding: _react2['default'].PropTypes.string,
    initialSlideHeight: _react2['default'].PropTypes.number,
    initialSlideWidth: _react2['default'].PropTypes.number,
    slidesToShow: _react2['default'].PropTypes.number,
    slidesToScroll: _react2['default'].PropTypes.oneOfType([_react2['default'].PropTypes.number, _react2['default'].PropTypes.oneOf(['auto'])]),
    slideWidth: _react2['default'].PropTypes.oneOfType([_react2['default'].PropTypes.string, _react2['default'].PropTypes.number]),
    speed: _react2['default'].PropTypes.number,
    vertical: _react2['default'].PropTypes.bool,
    width: _react2['default'].PropTypes.string
  },

  getDefaultProps: function getDefaultProps() {
    return {
      cellAlign: 'left',
      cellSpacing: 0,
      data: function data() {},
      decorators: _decorators2['default'],
      dragging: true,
      easing: 'easeOutCirc',
      edgeEasing: 'easeOutElastic',
      framePadding: '0px',
      slidesToShow: 1,
      slidesToScroll: 1,
      slideWidth: 1,
      speed: 500,
      vertical: false,
      width: '100%'
    };
  },

  getInitialState: function getInitialState() {
    return {
      currentSlide: 0,
      dragging: false,
      frameWidth: 0,
      left: 0,
      top: 0,
      slideCount: 0,
      slideWidth: 0,
      slidesToScroll: this.props.slidesToScroll
    };
  },

  componentWillMount: function componentWillMount() {
    this.setInitialDimensions();
  },

  componentDidMount: function componentDidMount() {
    this.setDimensions();
    this.bindEvents();
    this.setExternalData();
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    this.setDimensions();
  },

  componentWillUnmount: function componentWillUnmount() {
    this.unbindEvents();
  },

  render: function render() {
    var self = this;
    var children = _react2['default'].Children.count(this.props.children) > 1 ? this.formatChildren(this.props.children) : this.props.children;
    return _react2['default'].createElement(
      'div',
      { className: ['slider', this.props.className || ''].join(' '), ref: 'slider', style: (0, _objectAssign2['default'])(this.getSliderStyles(), this.props.style || {}) },
      _react2['default'].createElement(
        'div',
        _extends({ className: 'slider-frame',
          ref: 'frame',
          style: this.getFrameStyles()
        }, this.getTouchEvents(), this.getMouseEvents(), {
          onClick: this.handleClick }),
        _react2['default'].createElement(
          'ul',
          { className: 'slider-list', ref: 'list', style: this.getListStyles() },
          children
        )
      ),
      this.props.decorators ? this.props.decorators.map(function (Decorator, index) {
        return _react2['default'].createElement(
          'div',
          {
            style: (0, _objectAssign2['default'])(self.getDecoratorStyles(Decorator.position), Decorator.style || {}),
            className: 'slider-decorator-' + index,
            key: index },
          _react2['default'].createElement(Decorator.component, {
            currentSlide: self.state.currentSlide,
            slideCount: self.state.slideCount,
            frameWidth: self.state.frameWidth,
            slideWidth: self.state.slideWidth,
            slidesToScroll: self.state.slidesToScroll,
            cellSpacing: self.props.cellSpacing,
            slidesToShow: self.props.slidesToShow,
            nextSlide: self.nextSlide,
            previousSlide: self.previousSlide,
            goToSlide: self.goToSlide,
            id: self.props.id })
        );
      }) : null,
      _react2['default'].createElement('style', { type: 'text/css', dangerouslySetInnerHTML: { __html: self.getStyleTagStyles() } })
    );
  },

  // Touch Events

  touchObject: {},

  getTouchEvents: function getTouchEvents() {
    var self = this;

    return {
      onTouchStart: function onTouchStart(e) {
        self.touchObject = {
          startX: e.touches[0].pageX,
          startY: e.touches[0].pageY
        };
      },
      onTouchMove: function onTouchMove(e) {
        var direction = self.swipeDirection(self.touchObject.startX, e.touches[0].pageX, self.touchObject.startY, e.touches[0].pageY);

        if (direction !== 0) {
          e.preventDefault();
        }

        self.touchObject = {
          startX: self.touchObject.startX,
          startY: self.touchObject.startY,
          endX: e.touches[0].pageX,
          endY: e.touches[0].pageY,
          length: Math.round(Math.sqrt(Math.pow(e.touches[0].pageX - self.touchObject.startX, 2))),
          direction: direction
        };

        self.setState({
          left: self.props.vertical ? 0 : (self.state.slideWidth * self.state.currentSlide + self.touchObject.length * self.touchObject.direction) * -1,
          top: self.props.vertical ? (self.state.slideWidth * self.state.currentSlide + self.touchObject.length * self.touchObject.direction) * -1 : 0
        });
      },
      onTouchEnd: function onTouchEnd(e) {
        self.handleSwipe(e);
      },
      onTouchCancel: function onTouchCancel(e) {
        self.handleSwipe(e);
      }
    };
  },

  clickSafe: true,

  getMouseEvents: function getMouseEvents() {
    var self = this;

    if (this.props.dragging === false) {
      return null;
    }

    return {
      onMouseDown: function onMouseDown(e) {
        self.touchObject = {
          startX: e.clientX,
          startY: e.clientY
        };

        self.setState({
          dragging: true
        });
      },
      onMouseMove: function onMouseMove(e) {
        if (!self.state.dragging) {
          return;
        }

        var direction = self.swipeDirection(self.touchObject.startX, e.clientX, self.touchObject.startY, e.clientY);

        if (direction !== 0) {
          e.preventDefault();
        }

        var length = self.props.vertical ? Math.round(Math.sqrt(Math.pow(e.clientY - self.touchObject.startY, 2))) : Math.round(Math.sqrt(Math.pow(e.clientX - self.touchObject.startX, 2)));

        self.touchObject = {
          startX: self.touchObject.startX,
          startY: self.touchObject.startY,
          endX: e.clientX,
          endY: e.clientY,
          length: length,
          direction: direction
        };

        self.setState({
          left: self.props.vertical ? 0 : self.getTargetLeft(self.touchObject.length * self.touchObject.direction),
          top: self.props.vertical ? self.getTargetLeft(self.touchObject.length * self.touchObject.direction) : 0
        });
      },
      onMouseUp: function onMouseUp(e) {
        if (!self.state.dragging) {
          return;
        }

        self.handleSwipe(e);
      },
      onMouseLeave: function onMouseLeave(e) {
        if (!self.state.dragging) {
          return;
        }

        self.handleSwipe(e);
      }
    };
  },

  handleClick: function handleClick(e) {
    if (this.clickSafe === true) {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopPropagation();
    }
  },

  handleSwipe: function handleSwipe(e) {
    if (typeof this.touchObject.length !== 'undefined' && this.touchObject.length > 44) {
      this.clickSafe = true;
    } else {
      this.clickSafe = false;
    }

    if (this.touchObject.length > this.state.slideWidth / this.props.slidesToShow / 5) {
      if (this.touchObject.direction === 1) {
        if (this.state.currentSlide >= _react2['default'].Children.count(this.props.children) - this.state.slidesToScroll) {
          this.animateSlide(_reactTweenState2['default'].easingTypes[this.props.edgeEasing]);
        } else {
          this.nextSlide();
        }
      } else if (this.touchObject.direction === -1) {
        if (this.state.currentSlide <= 0) {
          this.animateSlide(_reactTweenState2['default'].easingTypes[this.props.edgeEasing]);
        } else {
          this.previousSlide();
        }
      }
    } else {
      this.goToSlide(this.state.currentSlide);
    }

    this.touchObject = {};

    this.setState({
      dragging: false
    });
  },

  swipeDirection: function swipeDirection(x1, x2, y1, y2) {

    var xDist, yDist, r, swipeAngle;

    xDist = x1 - x2;
    yDist = y1 - y2;
    r = Math.atan2(yDist, xDist);

    swipeAngle = Math.round(r * 180 / Math.PI);
    if (swipeAngle < 0) {
      swipeAngle = 360 - Math.abs(swipeAngle);
    }
    if (swipeAngle <= 45 && swipeAngle >= 0) {
      return 1;
    }
    if (swipeAngle <= 360 && swipeAngle >= 315) {
      return 1;
    }
    if (swipeAngle >= 135 && swipeAngle <= 225) {
      return -1;
    }
    if (this.props.vertical === true) {
      if (swipeAngle >= 35 && swipeAngle <= 135) {
        return 1;
      } else {
        return -1;
      }
    }
    return 0;
  },

  // Action Methods

  goToSlide: function goToSlide(index) {
    var self = this;
    if (index >= _react2['default'].Children.count(this.props.children) || index < 0) {
      return;
    }
    this.setState({
      currentSlide: index
    }, function () {
      self.animateSlide();
      self.setExternalData();
    });
  },

  nextSlide: function nextSlide() {
    var self = this;
    if (this.state.currentSlide + this.state.slidesToScroll >= _react2['default'].Children.count(this.props.children)) {
      return;
    }
    this.setState({
      currentSlide: this.state.currentSlide + this.state.slidesToScroll
    }, function () {
      self.animateSlide();
      self.setExternalData();
    });
  },

  previousSlide: function previousSlide() {
    var self = this;
    if (this.state.currentSlide - this.state.slidesToScroll < 0) {
      return;
    }
    this.setState({
      currentSlide: this.state.currentSlide - this.state.slidesToScroll
    }, function () {
      self.animateSlide();
      self.setExternalData();
    });
  },

  // Animation

  animateSlide: function animateSlide(easing, duration, endValue) {
    this.tweenState(this.props.vertical ? 'top' : 'left', {
      easing: easing || _reactTweenState2['default'].easingTypes[this.props.easing],
      duration: duration || this.props.speed,
      endValue: endValue || this.getTargetLeft()
    });
  },

  getTargetLeft: function getTargetLeft(touchOffset) {
    var offset;
    switch (this.props.cellAlign) {
      case 'left':
        {
          offset = 0;
          offset -= this.props.cellSpacing * this.state.currentSlide;
          break;
        }
      case 'center':
        {
          offset = (this.state.frameWidth - this.state.slideWidth) / 2;
          offset -= this.props.cellSpacing * this.state.currentSlide;
          break;
        }
      case 'right':
        {
          offset = this.state.frameWidth - this.state.slideWidth;
          offset -= this.props.cellSpacing * this.state.currentSlide;
          break;
        }
    }

    if (this.props.vertical) {
      offset = offset / 2;
    }

    offset -= touchOffset || 0;

    return (this.state.slideWidth * this.state.currentSlide - offset) * -1;
  },

  // Bootstrapping

  bindEvents: function bindEvents() {
    var self = this;
    if (_exenv2['default'].canUseDOM) {
      addEvent(window, 'resize', self.onResize);
      addEvent(document, 'readystatechange', self.onReadyStateChange);
    }
  },

  onResize: function onResize() {
    this.setDimensions();
  },

  onReadyStateChange: function onReadyStateChange() {
    this.setDimensions();
  },

  unbindEvents: function unbindEvents() {
    var self = this;
    if (_exenv2['default'].canUseDOM) {
      removeEvent(window, 'resize', self.onResize);
      removeEvent(document, 'readystatechange', self.onReadyStateChange);
    }
  },

  formatChildren: function formatChildren(children) {
    var self = this;
    return _react2['default'].Children.map(children, function (child, index) {
      return _react2['default'].createElement(
        'li',
        { className: 'slider-slide', style: self.getSlideStyles(), key: index },
        child
      );
    });
  },

  setInitialDimensions: function setInitialDimensions() {
    var self = this,
        slideWidth,
        frameHeight,
        slideHeight;

    slideWidth = this.props.vertical ? this.props.initialSlideHeight || 0 : this.props.initialSlideWidth || 0;
    slideHeight = this.props.initialSlideHeight ? this.props.initialSlideHeight * this.props.slidesToShow : 0;

    frameHeight = slideHeight + this.props.cellSpacing / 2 * (this.props.slidesToShow - 1);

    this.setState({
      frameWidth: this.props.vertical ? frameHeight : '100%',
      slideCount: _react2['default'].Children.count(this.props.children),
      slideWidth: slideWidth
    }, function () {
      self.setLeft();
      self.setExternalData();
    });
  },

  setDimensions: function setDimensions() {
    var self = this,
        slideWidth,
        slidesToScroll,
        firstSlide,
        frame,
        frameWidth,
        frameHeight,
        slideHeight;

    slidesToScroll = this.props.slidesToScroll;
    frame = _reactDom2['default'].findDOMNode(this.refs.frame);
    firstSlide = frame.childNodes[0].childNodes[0];
    if (firstSlide) {
      firstSlide.style.height = 'auto';
      slideHeight = firstSlide.offsetHeight * this.props.slidesToShow;
    } else {
      slideHeight = 100;
    }

    if (typeof this.props.slideWidth !== 'number') {
      slideWidth = parseInt(this.props.slideWidth);
    } else {
      if (this.props.vertical) {
        slideWidth = slideHeight / this.props.slidesToShow * this.props.slideWidth;
      } else {
        slideWidth = frame.offsetWidth / this.props.slidesToShow * this.props.slideWidth;
      }
    }

    if (!this.props.vertical) {
      slideWidth -= this.props.cellSpacing * ((100 - 100 / this.props.slidesToShow) / 100);
    }

    frameHeight = slideHeight + this.props.cellSpacing / 2 * (this.props.slidesToShow - 1);
    frameWidth = this.props.vertical ? frameHeight : frame.offsetWidth;

    if (this.props.slidesToScroll === 'auto') {
      slidesToScroll = Math.floor(frameWidth / (slideWidth + this.props.cellSpacing));
    }

    this.setState({
      frameWidth: frameWidth,
      slideCount: _react2['default'].Children.count(this.props.children),
      slideWidth: slideWidth,
      slidesToScroll: slidesToScroll,
      left: this.props.vertical ? 0 : this.getTargetLeft(),
      top: this.props.vertical ? this.getTargetLeft() : 0
    }, function () {
      self.setLeft();
    });
  },

  setLeft: function setLeft() {
    this.setState({
      left: this.props.vertical ? 0 : this.getTargetLeft(),
      top: this.props.vertical ? this.getTargetLeft() : 0
    });
  },

  // Data

  setExternalData: function setExternalData() {
    if (this.props.data) {
      this.props.data();
    }
  },

  // Styles

  getListStyles: function getListStyles() {
    var listWidth = this.state.slideWidth * _react2['default'].Children.count(this.props.children);
    var spacingOffset = this.props.cellSpacing * _react2['default'].Children.count(this.props.children);
    return {
      position: 'relative',
      display: 'block',
      top: this.getTweeningValue('top'),
      left: this.getTweeningValue('left'),
      margin: this.props.vertical ? this.props.cellSpacing / 2 * -1 + 'px 0px' : '0px ' + this.props.cellSpacing / 2 * -1 + 'px',
      padding: 0,
      height: this.props.vertical ? listWidth + spacingOffset : 'auto',
      width: this.props.vertical ? 'auto' : listWidth + spacingOffset,
      cursor: this.state.dragging === true ? 'pointer' : 'inherit',
      transform: 'translate3d(0, 0, 0)',
      WebkitTransform: 'translate3d(0, 0, 0)',
      boxSizing: 'border-box',
      MozBoxSizing: 'border-box'
    };
  },

  getFrameStyles: function getFrameStyles() {
    return {
      position: 'relative',
      display: 'block',
      overflow: 'hidden',
      height: this.props.vertical ? this.state.frameWidth || 'initial' : 'auto',
      margin: this.props.framePadding,
      padding: 0,
      transform: 'translate3d(0, 0, 0)',
      WebkitTransform: 'translate3d(0, 0, 0)',
      boxSizing: 'border-box',
      MozBoxSizing: 'border-box'
    };
  },

  getSlideStyles: function getSlideStyles() {
    return {
      display: this.props.vertical ? 'block' : 'inline-block',
      listStyleType: 'none',
      verticalAlign: 'top',
      width: this.props.vertical ? '100%' : this.state.slideWidth,
      height: 'auto',
      boxSizing: 'border-box',
      MozBoxSizing: 'border-box',
      marginLeft: this.props.vertical ? 'auto' : this.props.cellSpacing / 2,
      marginRight: this.props.vertical ? 'auto' : this.props.cellSpacing / 2,
      marginTop: this.props.vertical ? this.props.cellSpacing / 2 : 'auto',
      marginBottom: this.props.vertical ? this.props.cellSpacing / 2 : 'auto'
    };
  },

  getSliderStyles: function getSliderStyles() {
    return {
      position: 'relative',
      display: 'block',
      width: this.props.width,
      height: 'auto',
      boxSizing: 'border-box',
      MozBoxSizing: 'border-box',
      visibility: this.state.slideWidth ? 'visible' : 'hidden'
    };
  },

  getStyleTagStyles: function getStyleTagStyles() {
    return '.slider-slide > img {width: 100%; display: block;}';
  },

  getDecoratorStyles: function getDecoratorStyles(position) {
    switch (position) {
      case 'TopLeft':
        {
          return {
            position: 'absolute',
            top: 0,
            left: 0
          };
        }
      case 'TopCenter':
        {
          return {
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            WebkitTransform: 'translateX(-50%)'
          };
        }
      case 'TopRight':
        {
          return {
            position: 'absolute',
            top: 0,
            right: 0
          };
        }
      case 'CenterLeft':
        {
          return {
            position: 'absolute',
            top: '50%',
            left: 0,
            transform: 'translateY(-50%)',
            WebkitTransform: 'translateY(-50%)'
          };
        }
      case 'CenterCenter':
        {
          return {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            WebkitTransform: 'translate(-50%, -50%)'
          };
        }
      case 'CenterRight':
        {
          return {
            position: 'absolute',
            top: '50%',
            right: 0,
            transform: 'translateY(-50%)',
            WebkitTransform: 'translateY(-50%)'
          };
        }
      case 'BottomLeft':
        {
          return {
            position: 'absolute',
            bottom: 0,
            left: 0
          };
        }
      case 'BottomCenter':
        {
          return {
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            WebkitTransform: 'translateX(-50%)'
          };
        }
      case 'BottomRight':
        {
          return {
            position: 'absolute',
            bottom: 0,
            right: 0
          };
        }
      default:
        {
          return {
            position: 'absolute',
            top: 0,
            left: 0
          };
        }
    }
  }

});

Carousel.ControllerMixin = {
  getInitialState: function getInitialState() {
    return {
      carousels: {}
    };
  },
  setCarouselData: function setCarouselData(carousel) {
    var data = this.state.carousels;
    data[carousel] = this.refs[carousel];
    this.setState({
      carousels: data
    });
  }
};

exports['default'] = Carousel;
module.exports = exports['default'];

},{"./decorators":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/modules/nuka-carousel/decorators.jsx","./exenv":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/modules/nuka-carousel/exenv.jsx","./object-assign":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/modules/nuka-carousel/object-assign.jsx","./react-tween-state":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/modules/nuka-carousel/react-tween-state.jsx"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/modules/nuka-carousel/decorators.jsx":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = React;

var _react2 = _interopRequireDefault(_react);

var DefaultDecorators = [{
  component: _react2['default'].createClass({
    displayName: 'component',

    render: function render() {
      return _react2['default'].createElement(
        'button',
        {
          style: this.getButtonStyles(this.props.currentSlide === 0),
          onClick: this.props.previousSlide,
          className: this.props.id },
        '<'
      );
    },
    getButtonStyles: function getButtonStyles(disabled) {
      return {
        border: 0,
        background: '#34495E',
        color: 'white',
        padding: 10,
        outline: 0,
        opacity: disabled ? 0.3 : 1,
        cursor: 'pointer'
      };
    }
  }),
  position: 'CenterLeft'
}, {
  component: _react2['default'].createClass({
    displayName: 'component',

    render: function render() {
      return _react2['default'].createElement(
        'button',
        {
          style: this.getButtonStyles(this.props.currentSlide + this.props.slidesToScroll >= this.props.slideCount),
          onClick: this.props.nextSlide,
          className: this.props.id},
        '>'
      );
    },
    getButtonStyles: function getButtonStyles(disabled) {
      return {
        border: 0,
        background: '#34495E',
        color: 'white',
        padding: 10,
        outline: 0,
        opacity: disabled ? 0.3 : 1,
        cursor: 'pointer'
      };
    }
  }),
  position: 'CenterRight'
}, {
  component: _react2['default'].createClass({
    displayName: 'component',

    render: function render() {
      var self = this;
      var indexes = this.getIndexes(self.props.slideCount, self.props.slidesToScroll);
      return _react2['default'].createElement(
        'ul',
        { style: self.getListStyles() },
        indexes.map(function (index) {
          return _react2['default'].createElement(
            'li',
            { style: self.getListItemStyles(), key: index },
            _react2['default'].createElement(
              'button',
              {
                style: self.getButtonStyles(self.props.currentSlide === index),
                onClick: self.props.goToSlide.bind(null, index) },
              '•'
            )
          );
        })
      );
    },
    getIndexes: function getIndexes(count, inc) {
      var arr = [];
      for (var i = 0; i < count; i += inc) {
        arr.push(i);
      }
      return arr;
    },
    getListStyles: function getListStyles() {
      return {
        position: 'relative',
        margin: 0,
        top: -10,
        padding: 0
      };
    },
    getListItemStyles: function getListItemStyles() {
      return {
        listStyleType: 'none',
        display: 'inline-block'
      };
    },
    getButtonStyles: function getButtonStyles(active) {
      return {
        border: 0,
        background: 'transparent',
        color: 'black',
        cursor: 'pointer',
        padding: 10,
        outline: 0,
        fontSize: 24,
        opacity: active ? 1 : 0.5
      };
    }
  }),
  position: 'BottomCenter'
}];

exports['default'] = DefaultDecorators;
module.exports = exports['default'];

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/modules/nuka-carousel/exenv.jsx":[function(require,module,exports){
/*!
  Copyright (c) 2015 Jed Watson.
  Based on code that is Copyright 2013-2015, Facebook, Inc.
  All rights reserved.
*/

(function () {
	'use strict';

	var canUseDOM = !!(
		typeof window !== 'undefined' &&
		window.document &&
		window.document.createElement
	);

	var ExecutionEnvironment = {

		canUseDOM: canUseDOM,

		canUseWorkers: typeof Worker !== 'undefined',

		canUseEventListeners:
			canUseDOM && !!(window.addEventListener || window.attachEvent),

		canUseViewport: canUseDOM && !!window.screen

	};

	if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
		define(function () {
			return ExecutionEnvironment;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = ExecutionEnvironment;
	} else {
		window.ExecutionEnvironment = ExecutionEnvironment;
	}

}());

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/modules/nuka-carousel/object-assign.jsx":[function(require,module,exports){
/* eslint-disable no-unused-vars */
'use strict';
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

module.exports = Object.assign || function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (Object.getOwnPropertySymbols) {
			symbols = Object.getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/modules/nuka-carousel/react-tween-state.jsx":[function(require,module,exports){
!function(e,n){"object"==typeof exports&&"object"==typeof module?module.exports=n():"function"==typeof define&&define.amd?define([],n):"object"==typeof exports?exports.tweenState=n():e.tweenState=n()}(this,function(){return function(e){function n(r){if(t[r])return t[r].exports;var a=t[r]={exports:{},id:r,loaded:!1};return e[r].call(a.exports,a,a.exports,n),a.loaded=!0,a.exports}var t={};return n.m=e,n.c=t,n.p="",n(0)}({0:function(e,n,t){e.exports=t(90)},1:function(e,n){function t(){c=!1,o.length?s=o.concat(s):f=-1,s.length&&r()}function r(){if(!c){var e=setTimeout(t);c=!0;for(var n=s.length;n;){for(o=s,s=[];++f<n;)o&&o[f].run();f=-1,n=s.length}o=null,c=!1,clearTimeout(e)}}function a(e,n){this.fun=e,this.array=n}function u(){}var o,i=e.exports={},s=[],c=!1,f=-1;i.nextTick=function(e){var n=new Array(arguments.length-1);if(arguments.length>1)for(var t=1;t<arguments.length;t++)n[t-1]=arguments[t];s.push(new a(e,n)),1!==s.length||c||setTimeout(r,0)},a.prototype.run=function(){this.fun.apply(null,this.array)},i.title="browser",i.browser=!0,i.env={},i.argv=[],i.version="",i.versions={},i.on=u,i.addListener=u,i.once=u,i.off=u,i.removeListener=u,i.removeAllListeners=u,i.emit=u,i.binding=function(e){throw new Error("process.binding is not supported")},i.cwd=function(){return"/"},i.chdir=function(e){throw new Error("process.chdir is not supported")},i.umask=function(){return 0}},90:function(e,n,t){"use strict";function r(e){return e&&e.__esModule?e:{"default":e}}Object.defineProperty(n,"__esModule",{value:!0});var a=t(165),u=r(a),o=t(91),i=r(o),s="ADDITIVE",c=a.easeInOutQuad,f=300,l=0,h={ADDITIVE:"ADDITIVE",DESTRUCTIVE:"DESTRUCTIVE"},v={_rafID:null,getInitialState:function(){return{tweenQueue:[]}},componentWillUnmount:function(){i["default"].cancel(this._rafID),this._rafID=-1},tweenState:function(e,n){var t=this,r=n.easing,a=n.duration,u=n.delay,o=n.beginValue,v=n.endValue,d=n.onEnd,p=n.stackBehavior;this.setState(function(n){var I=n,w=void 0,g=void 0;if("string"==typeof e)w=e,g=e;else{for(var M=0;M<e.length-1;M++)I=I[e[M]];w=e[e.length-1],g=e.join("|")}var m={easing:r||c,duration:null==a?f:a,delay:null==u?l:u,beginValue:null==o?I[w]:o,endValue:v,onEnd:d,stackBehavior:p||s},x=n.tweenQueue;return m.stackBehavior===h.DESTRUCTIVE&&(x=n.tweenQueue.filter(function(e){return e.pathHash!==g})),x.push({pathHash:g,config:m,initTime:Date.now()+m.delay}),I[w]=m.endValue,1===x.length&&(t._rafID=(0,i["default"])(t._rafCb)),{tweenQueue:x}})},getTweeningValue:function(e){var n=this.state,t=void 0,r=void 0;if("string"==typeof e)t=n[e],r=e;else{t=n;for(var a=0;a<e.length;a++)t=t[e[a]];r=e.join("|")}for(var u=Date.now(),a=0;a<n.tweenQueue.length;a++){var o=n.tweenQueue[a],i=o.pathHash,s=o.initTime,c=o.config;if(i===r){var f=u-s>c.duration?c.duration:Math.max(0,u-s),l=0===c.duration?c.endValue:c.easing(f,c.beginValue,c.endValue,c.duration),h=l-c.endValue;t+=h}}return t},_rafCb:function(){var e=this.state;if(0!==e.tweenQueue.length){for(var n=Date.now(),t=[],r=0;r<e.tweenQueue.length;r++){var a=e.tweenQueue[r],u=a.initTime,o=a.config;n-u<o.duration?t.push(a):o.onEnd&&o.onEnd()}-1!==this._rafID&&(this.setState({tweenQueue:t}),this._rafID=(0,i["default"])(this._rafCb))}}};n["default"]={Mixin:v,easingTypes:u["default"],stackBehavior:h},e.exports=n["default"]},91:function(e,n,t){for(var r=t(92),a="undefined"==typeof window?{}:window,u=["moz","webkit"],o="AnimationFrame",i=a["request"+o],s=a["cancel"+o]||a["cancelRequest"+o],c=0;c<u.length&&!i;c++)i=a[u[c]+"Request"+o],s=a[u[c]+"Cancel"+o]||a[u[c]+"CancelRequest"+o];if(!i||!s){var f=0,l=0,h=[],v=1e3/60;i=function(e){if(0===h.length){var n=r(),t=Math.max(0,v-(n-f));f=t+n,setTimeout(function(){var e=h.slice(0);h.length=0;for(var n=0;n<e.length;n++)if(!e[n].cancelled)try{e[n].callback(f)}catch(t){setTimeout(function(){throw t},0)}},Math.round(t))}return h.push({handle:++l,callback:e,cancelled:!1}),l},s=function(e){for(var n=0;n<h.length;n++)h[n].handle===e&&(h[n].cancelled=!0)}}e.exports=function(e){return i.call(a,e)},e.exports.cancel=function(){s.apply(a,arguments)}},92:function(e,n,t){(function(n){(function(){var t,r,a;"undefined"!=typeof performance&&null!==performance&&performance.now?e.exports=function(){return performance.now()}:"undefined"!=typeof n&&null!==n&&n.hrtime?(e.exports=function(){return(t()-a)/1e6},r=n.hrtime,t=function(){var e;return e=r(),1e9*e[0]+e[1]},a=t()):Date.now?(e.exports=function(){return Date.now()-a},a=Date.now()):(e.exports=function(){return(new Date).getTime()-a},a=(new Date).getTime())}).call(this)}).call(n,t(1))},165:function(e,n){"use strict";var t={linear:function(e,n,t,r){var a=t-n;return a*e/r+n},easeInQuad:function(e,n,t,r){var a=t-n;return a*(e/=r)*e+n},easeOutQuad:function(e,n,t,r){var a=t-n;return-a*(e/=r)*(e-2)+n},easeInOutQuad:function(e,n,t,r){var a=t-n;return(e/=r/2)<1?a/2*e*e+n:-a/2*(--e*(e-2)-1)+n},easeInCubic:function(e,n,t,r){var a=t-n;return a*(e/=r)*e*e+n},easeOutCubic:function(e,n,t,r){var a=t-n;return a*((e=e/r-1)*e*e+1)+n},easeInOutCubic:function(e,n,t,r){var a=t-n;return(e/=r/2)<1?a/2*e*e*e+n:a/2*((e-=2)*e*e+2)+n},easeInQuart:function(e,n,t,r){var a=t-n;return a*(e/=r)*e*e*e+n},easeOutQuart:function(e,n,t,r){var a=t-n;return-a*((e=e/r-1)*e*e*e-1)+n},easeInOutQuart:function(e,n,t,r){var a=t-n;return(e/=r/2)<1?a/2*e*e*e*e+n:-a/2*((e-=2)*e*e*e-2)+n},easeInQuint:function(e,n,t,r){var a=t-n;return a*(e/=r)*e*e*e*e+n},easeOutQuint:function(e,n,t,r){var a=t-n;return a*((e=e/r-1)*e*e*e*e+1)+n},easeInOutQuint:function(e,n,t,r){var a=t-n;return(e/=r/2)<1?a/2*e*e*e*e*e+n:a/2*((e-=2)*e*e*e*e+2)+n},easeInSine:function(e,n,t,r){var a=t-n;return-a*Math.cos(e/r*(Math.PI/2))+a+n},easeOutSine:function(e,n,t,r){var a=t-n;return a*Math.sin(e/r*(Math.PI/2))+n},easeInOutSine:function(e,n,t,r){var a=t-n;return-a/2*(Math.cos(Math.PI*e/r)-1)+n},easeInExpo:function(e,n,t,r){var a=t-n;return 0==e?n:a*Math.pow(2,10*(e/r-1))+n},easeOutExpo:function(e,n,t,r){var a=t-n;return e==r?n+a:a*(-Math.pow(2,-10*e/r)+1)+n},easeInOutExpo:function(e,n,t,r){var a=t-n;return 0===e?n:e===r?n+a:(e/=r/2)<1?a/2*Math.pow(2,10*(e-1))+n:a/2*(-Math.pow(2,-10*--e)+2)+n},easeInCirc:function(e,n,t,r){var a=t-n;return-a*(Math.sqrt(1-(e/=r)*e)-1)+n},easeOutCirc:function(e,n,t,r){var a=t-n;return a*Math.sqrt(1-(e=e/r-1)*e)+n},easeInOutCirc:function(e,n,t,r){var a=t-n;return(e/=r/2)<1?-a/2*(Math.sqrt(1-e*e)-1)+n:a/2*(Math.sqrt(1-(e-=2)*e)+1)+n},easeInElastic:function(e,n,t,r){var a,u,o,i=t-n;return o=1.70158,u=0,a=i,0===e?n:1===(e/=r)?n+i:(u||(u=.3*r),a<Math.abs(i)?(a=i,o=u/4):o=u/(2*Math.PI)*Math.asin(i/a),-(a*Math.pow(2,10*(e-=1))*Math.sin((e*r-o)*(2*Math.PI)/u))+n)},easeOutElastic:function(e,n,t,r){var a,u,o,i=t-n;return o=1.70158,u=0,a=i,0===e?n:1===(e/=r)?n+i:(u||(u=.3*r),a<Math.abs(i)?(a=i,o=u/4):o=u/(2*Math.PI)*Math.asin(i/a),a*Math.pow(2,-10*e)*Math.sin((e*r-o)*(2*Math.PI)/u)+i+n)},easeInOutElastic:function(e,n,t,r){var a,u,o,i=t-n;return o=1.70158,u=0,a=i,0===e?n:2===(e/=r/2)?n+i:(u||(u=r*(.3*1.5)),a<Math.abs(i)?(a=i,o=u/4):o=u/(2*Math.PI)*Math.asin(i/a),1>e?-.5*(a*Math.pow(2,10*(e-=1))*Math.sin((e*r-o)*(2*Math.PI)/u))+n:a*Math.pow(2,-10*(e-=1))*Math.sin((e*r-o)*(2*Math.PI)/u)*.5+i+n)},easeInBack:function(e,n,t,r,a){var u=t-n;return void 0===a&&(a=1.70158),u*(e/=r)*e*((a+1)*e-a)+n},easeOutBack:function(e,n,t,r,a){var u=t-n;return void 0===a&&(a=1.70158),u*((e=e/r-1)*e*((a+1)*e+a)+1)+n},easeInOutBack:function(e,n,t,r,a){var u=t-n;return void 0===a&&(a=1.70158),(e/=r/2)<1?u/2*(e*e*(((a*=1.525)+1)*e-a))+n:u/2*((e-=2)*e*(((a*=1.525)+1)*e+a)+2)+n},easeInBounce:function(e,n,r,a){var u,o=r-n;return u=t.easeOutBounce(a-e,0,o,a),o-u+n},easeOutBounce:function(e,n,t,r){var a=t-n;return(e/=r)<1/2.75?a*(7.5625*e*e)+n:2/2.75>e?a*(7.5625*(e-=1.5/2.75)*e+.75)+n:2.5/2.75>e?a*(7.5625*(e-=2.25/2.75)*e+.9375)+n:a*(7.5625*(e-=2.625/2.75)*e+.984375)+n},easeInOutBounce:function(e,n,r,a){var u,o=r-n;return a/2>e?(u=t.easeInBounce(2*e,0,o,a),.5*u+n):(u=t.easeOutBounce(2*e-a,0,o,a),.5*u+.5*o+n)}};e.exports=t}})});

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/new_pagination.jsx":[function(require,module,exports){
module.exports = React.createClass({displayName: "exports",
  getInitialState: function() {
    var num_bubbles = this.getNumBubbles();
    return {num_bubbles: num_bubbles};
  },
  getNumBubbles: function() {
    var width = $(window).width();
    var bubbles = width > 700 ? 10 : 4;
    if (width < 400) {
      bubbles = 2;
    }
    return bubbles;
  },

  changePage: function(direction) {
      return (function(event) {
       var current = this.props.current_index,
           count = this.props.count;
       // calculate the new first displayed button (timetable)
       var new_first = current + (this.state.num_bubbles*direction) - (current % this.state.num_bubbles);
       if (new_first >= 0 && new_first < count) {
        this.props.setIndex(new_first)();
       }
    }.bind(this));
  },

    
	render: function() {
    var options = [], count = this.props.count, current = this.props.current_index;
    if (count <= 1) { return null; } // don't display if there aren't enough schedules
    var first = current - (current % this.state.num_bubbles); // round down to nearest multiple of this.props.numBubbles
    var limit = Math.min(first + this.state.num_bubbles, count);
    for (var i = first; i < limit; i++) {
      var className = this.props.current_index == i ? "sem-page active" : "sem-page";
      options.push(
        React.createElement("li", {key: i, className: className, onClick: this.props.setIndex(i)}, 
              React.createElement("a", null, i + 1)
        ));
    }
    var prev_double = (
      React.createElement("div", {className: "sem-pagination-nav nav-double nav-double-prev", onClick: this.changePage(-1)}, 
        React.createElement("i", {className: "fa fa-angle-double-left sem-pagination-prev sem-pagination-icon"})
      )
    );
    var next_double = (
      React.createElement("div", {className: "sem-pagination-nav nav-double nav-double-next", onClick: this.changePage(1)}, 
        React.createElement("i", {className: "fa fa-angle-double-right sem-pagination-next sem-pagination-icon"})
      )
    );
    if (count < (this.state.num_bubbles + 1)) {
      prev_double = null;
      next_double = null;
    }
		return (
			React.createElement("div", {className: "sem-pagination"}, 
				prev_double, 
				React.createElement("div", {className: "sem-pagination-nav", onClick: this.props.prev}, 
					React.createElement("i", {className: "fa fa-angle-left sem-pagination-prev sem-pagination-icon"})
				), 
				React.createElement("ol", {className: "sem-pages"}, 
					options
				), 
				React.createElement("div", {className: "sem-pagination-nav", onClick: this.props.next}, 
					React.createElement("i", {className: "fa fa-angle-right sem-pagination-next sem-pagination-icon"})
				), 
				next_double
			)
		);
	},
  componentDidMount: function() {
    $(window).resize(function() {
      this.setState({num_bubbles: this.getNumBubbles()});
    }.bind(this));
  },


});

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/pagination.jsx":[function(require,module,exports){
module.exports = React.createClass({displayName: "exports",
  getInitialState: function() {
    var num_bubbles = this.getNumBubbles();
    return {first_displayed: 0, num_bubbles: num_bubbles};
  },
  getNumBubbles: function() {
    var bubbles = $(window).width() > 700 ? 9 : 4;
    return bubbles;
  },

  changePage: function(direction) {
      return (function(event) {
       var current = this.props.current_index,
           count = this.props.count;
       // calculate the new first_displayed button (timetable)
       var new_first = current + (this.state.num_bubbles*direction) - (current % this.state.num_bubbles);
       if (new_first >= 0 && new_first < count) {
        this.props.setIndex(new_first)();
       }
    }.bind(this));
  },

  render: function() {
    var options = [], count = this.props.count, current = this.props.current_index;
    if (count <= 1) { return null; } // don't display if there aren't enough schedules
    var first = current - (current % this.state.num_bubbles); // round down to nearest multiple of this.props.numBubbles
    var limit = Math.min(first + this.state.num_bubbles, count);
    for (var i = first; i < limit; i++) {
      var className = this.props.current_index == i ? "active" : "";
      options.push(
        React.createElement("li", {key: i, className: className}, 
              React.createElement("a", {onClick: this.props.setIndex(i)}, i + 1)
        ));
    }
    var prev_double = (
      React.createElement("li", {className: "prev-double", onClick: this.changePage(-1)}, 
        React.createElement("div", {className: "pagination-btn"}, 
          React.createElement("span", {className: "fa fa-angle-double-left"})
        )
      )
    );
    var next_double = (
      React.createElement("li", {className: "next-double", onClick: this.changePage(1)}, 
        React.createElement("div", {className: "pagination-btn"}, 
          React.createElement("span", {className: "fa fa-angle-double-right"})
        )
      )
    );
    if (count < (this.state.num_bubbles + 1)) {
      prev_double = null;
      next_double = null;
    }

    return (
        React.createElement("div", {className: "pagination pagination-minimal"}, 
          React.createElement("ul", null, 
            prev_double, 
            React.createElement("li", {className: "previous"}, 
              React.createElement("a", {className: "fui-arrow-left pagination-btn", 
                onClick: this.props.prev})
            ), 

            options, 
          
            React.createElement("li", {className: "next"}, 
              React.createElement("a", {className: "fui-arrow-right pagination-btn", 
                onClick: this.props.next})
            ), 
            next_double
          )
        )
    );
  },

  componentDidMount: function() {
    $(window).resize(function() {
      this.setState({num_bubbles: this.getNumBubbles()});
    }.bind(this));
  },
  

});

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/preference_menu.jsx":[function(require,module,exports){
var TimetableActions = require('./actions/update_timetables.js');
var TimetableStore = require('./stores/update_timetables.js');

var BinaryPreference = React.createClass({displayName: "BinaryPreference",
  mixins: [Reflux.connect(TimetableStore)],

  render: function() {
    var toggle_label = "cmn-toggle-" + this.props.toggle_id;
    return (
      React.createElement("div", {className: "preference-item"}, 
        React.createElement("div", {className: "preference-text"}, 
          React.createElement("li", null, " ", this.props.text, " ")
        ), 
        React.createElement("div", {className: "preference-toggle"}, 
          React.createElement("div", {className: "switch"}, 
            React.createElement("input", {ref: "checkbox_elem", id: toggle_label, 
                   className: "cmn-toggle cmn-toggle-round " + this.props.name, 
                   type: "checkbox", 
                   checked: this.state.preferences[this.props.name], 
                   onClick: this.togglePreference}), 
            React.createElement("label", {htmlFor: toggle_label})
          )
        )
      )
    );
  },

  togglePreference: function() {
    var new_value = !this.state.preferences[this.props.name];
    TimetableActions.updatePreferences(this.props.name, new_value);
  }
});

module.exports = React.createClass({displayName: "exports",
  current_toggle_id: 0,

  render: function() {
    return (
      React.createElement("div", {id: "menu-container", className: "collapse"}, 
        React.createElement("div", {className: "navbar-collapse"}, 
          React.createElement("ul", {className: "nav navbar-nav", id: "menu"}, 
            React.createElement("li", null, 
              React.createElement("ul", null, 
                React.createElement(BinaryPreference, {text: "Avoid early classes", 
                                  name: "no_classes_before", 
                                  toggle_id: this.get_next_toggle_id()}), 
                React.createElement(BinaryPreference, {text: "Avoid late classes", 
                                  name: "no_classes_after", 
                                  toggle_id: this.get_next_toggle_id()}), 
                React.createElement(BinaryPreference, {text: "Allow conflicts", 
                                  name: "try_with_conflicts", 
                                  toggle_id: this.get_next_toggle_id()})
              )
            )
          )
        )
      )
    );
  },

  get_next_toggle_id: function() {
    this.current_toggle_id += 1
    return this.current_toggle_id;
  }

});

},{"./actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/root.jsx":[function(require,module,exports){
var ControlBar = require('./control_bar');
var Timetable = require('./timetable');
var ModalContent = require('./modal_content');
var ToastStore = require('./stores/toast_store.js');
var TimetableStore = require('./stores/update_timetables.js');
var course_actions = require('./actions/course_actions');
var Sidebar = require('./side_bar');
var SimpleModal = require('./simple_modal');
var SchoolList = require('./school_list');

module.exports = React.createClass({displayName: "exports",
  mixins: [Reflux.connect(TimetableStore), Reflux.connect(ToastStore)],
  sidebar_collapsed: 'neutral',


  render: function() {
    var Modal = Boron['OutlineModal'];
    var loader = !(this.state.loading || this.state.courses_loading) ? null :
      (  React.createElement("div", {className: "spinner"}, 
            React.createElement("div", {className: "rect1"}), 
            React.createElement("div", {className: "rect2"}), 
            React.createElement("div", {className: "rect3"}), 
            React.createElement("div", {className: "rect4"}), 
            React.createElement("div", {className: "rect5"})
        ));
    var school_selector = (
      React.createElement(SimpleModal, {header: "Semester.ly | Welcome", 
                   key: "school", 
                   ref: "school_modal", 
                   allow_disable: false, 
                   styles: {backgroundColor: "#FDF5FF", color: "#000"}, 
                   content: React.createElement(SchoolList, {setSchool: this.setSchool})}));
      
    return (
      React.createElement("div", {id: "root"}, 
        loader, 
        React.createElement("div", {id: "toast-container"}), 
        React.createElement("div", {id: "control-bar-container"}, 
          React.createElement("div", {id: "semesterly-name"}, "Semester.ly"), 
          React.createElement("img", {id: "semesterly-logo", src: "/static/img/logo2.0.png"}), 
          React.createElement(ControlBar, {toggleModal: this.toggleCourseModal})
        ), 
        React.createElement("div", {id: "navicon", onClick: this.toggleSideModal}, 
          React.createElement("span", null), React.createElement("span", null), React.createElement("span", null)
        ), 
        React.createElement("div", {id: "modal-container"}, 
          React.createElement(Modal, {closeOnClick: true, ref: "OutlineModal", className: "course-modal"}, 
              React.createElement(ModalContent, {school: this.state.school, 
                            courses_to_sections: this.state.courses_to_sections, 
                            hide: this.hideCourseModal})
          )
        ), 
        React.createElement("div", {className: "all-cols-container"}, 
          React.createElement(Sidebar, {toggleModal: this.toggleCourseModal}), 
          React.createElement("div", {className: "cal-container"}, 
            React.createElement(Timetable, {toggleModal: this.toggleCourseModal})
          )
        ), 
        school_selector
      )
    );
  },

  componentDidMount: function() {
    if (this.state.school == "" && this.props.data == null) {
      this.showSchoolModal();
    }
  },

  componentDidUpdate: function() {
    if (this.state.school != "") {
      this.hideSchoolModal();
    }
  },

  toggleCourseModal: function(course_id) {
    return function() {
        this.refs['OutlineModal'].toggle();
        course_actions.getCourseInfo(this.state.school, course_id);
    }.bind(this); 
  },

  hideCourseModal: function() {
    this.refs['OutlineModal'].hide();
  },

  showSchoolModal: function() {
      this.refs.school_modal.show();
  },
  hideSchoolModal: function() {
      this.refs.school_modal.hide();
  },

  toggleSideModal: function(){
    if (this.sidebar_collapsed == 'neutral') {
      var bodyw = $(window).width();
      if (bodyw > 999) {
        this.collapseSideModal();
        this.sidebar_collapsed = 'open';
      } else {
        this.expandSideModal();
        this.sidebar_collapsed = 'closed';
      }
    }
    if (this.sidebar_collapsed == 'closed') {
      this.expandSideModal();
      this.sidebar_collapsed = 'open';
    } else {
      this.collapseSideModal();
      this.sidebar_collapsed = 'closed';
    }
  },

  expandSideModal: function() {
    $('.cal-container, .side-container').removeClass('full-cal').addClass('less-cal');
  },

  collapseSideModal: function() {
    $('.cal-container, .side-container').removeClass('less-cal').addClass('full-cal');
  }

});

},{"./actions/course_actions":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/course_actions.js","./control_bar":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/control_bar.jsx","./modal_content":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/modal_content.jsx","./school_list":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/school_list.jsx","./side_bar":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/side_bar.jsx","./simple_modal":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/simple_modal.jsx","./stores/toast_store.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/toast_store.js","./stores/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js","./timetable":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/timetable.jsx"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/school_list.jsx":[function(require,module,exports){
TimetableActions = require('./actions/update_timetables');

module.exports = React.createClass({displayName: "exports",

	render: function() {
		return 	(
			React.createElement("div", {className: "school-list"}, 
				React.createElement("div", {className: "school-picker school-jhu", 
					onClick: this.setSchool("jhu")}, 
					React.createElement("img", {src: "/static/img/school_logos/jhu_logo.png", 
						className: "school-logo"})
				), 
				React.createElement("div", {className: "school-picker school-uoft", 
					onClick: this.setSchool("uoft")}, 
					React.createElement("img", {src: "/static/img/school_logos/uoft_logo.png", 
						className: "school-logo"})
				)
			));
	},

	setSchool: function(new_school) {
		return (function() {
			TimetableActions.setSchool(new_school);
		}.bind(this));
	},

});

},{"./actions/update_timetables":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/search_bar.jsx":[function(require,module,exports){
var TimetableActions = require('./actions/update_timetables.js');
var TimetableStore = require('./stores/update_timetables.js');

var SearchResult = React.createClass({displayName: "SearchResult",
  render: function() {
    var li_class = "search-result", icon_class = "fui-plus";
    if (this.props.in_roster) {
      li_class += " todo-done";
      icon_class = "fui-check";
    }
    return (
      React.createElement("li", {className: li_class, onMouseDown: this.props.toggleModal(this.props.id)}, 
        React.createElement("div", {className: "todo-content"}, 
          React.createElement("h4", {className: "todo-name"}, 
            this.props.code
          ), 
          this.props.name
        ), 
        React.createElement("span", {className: "search-result-action " + icon_class, 
          onMouseDown: this.toggleCourse}
        )
      )
    );
  },

  toggleCourse: function(e) {
    var removing = this.props.in_roster;
    TimetableActions.updateCourses({id: this.props.id, section: '', removing: removing});
    e.preventDefault();  // stop input from triggering onBlur and thus hiding results
    e.stopPropagation(); // stop parent from opening modal
  },

});

module.exports = React.createClass({displayName: "exports",
  mixins: [Reflux.connect(TimetableStore)],

  getInitialState: function() {
    return {
      courses:[],
      results: [],
      focused: false,
    };
  },

  componentWillUpdate: function(new_props, new_state) {
    if (new_state.school != this.state.school) {
      this.getCourses(new_state.school);
    }

  },
  getCourses: function(school) {
    TimetableActions.setCoursesLoading();
    $.get("/courses/" + school + "/" + _SEMESTER, 
        {}, 
        function(response) {
          this.setState({courses: response});
          TimetableActions.setCoursesDoneLoading();

        }.bind(this)
    );
  },

  render: function() {
    var search_results_div = this.getSearchResultsComponent();
    return (
      React.createElement("div", {id: "search-bar"}, 
        React.createElement("div", {className: "input-combine"}, 
          React.createElement("div", {className: "input-wrapper"}, 
            React.createElement("input", {
              type: "text", 
              placeholder: "Search by code, title, description, degree", 
              id: "search-input", 
              ref: "input", 
              onFocus: this.focus, onBlur: this.blur, 
              onInput: this.queryChanged})
            ), 
          React.createElement("button", {"data-toggle": "collapse", "data-target": "#menu-container", id: "menu-btn"}, 
            React.createElement("div", {id: "sliders"}, 
              React.createElement("span", null, 
                React.createElement("div", {className: "box"})
              ), 
              React.createElement("span", null, 
                React.createElement("div", {className: "box"})
              ), 
              React.createElement("span", null, 
                React.createElement("div", {className: "box"})
              )
            )
          ), 
          search_results_div
        )
      )
    );
  },

  getSearchResultsComponent: function() {
    if (!this.state.focused || this.state.results.length == 0) {return null;}
    var i = 0;
    var search_results = this.state.results.map(function(r) {
      i++;
      var in_roster = this.state.courses_to_sections[r.id] != null;
      return (
        React.createElement(SearchResult, React.__spread({},  r, {key: i, in_roster: in_roster, toggleModal: this.props.toggleModal}))
      );
    }.bind(this));
    return (
      React.createElement("div", {id: "search-results-container"}, 
        React.createElement("div", {className: "todo mrm"}, 
            React.createElement("ul", {id: "search-results"}, 
              search_results
            )
          )
      )
    );
  },

  focus: function() {
    this.setState({focused: true});
  },

  blur: function() {
    this.setState({focused: false});
  },

  queryChanged: function(event) {
    var query = event.target.value.toLowerCase();
    var filtered = query.length <= 1 ? [] : this.filterCourses(query);
    this.setState({results: filtered});
  },

  isSubsequence: function(result,query) {
      result = query.split(" ").every(function(s) {
          if (result.indexOf(s) > -1) {
            return true;
          } else {
            return false;
          }
      }.bind(this));
      return result;
  },

  filterCourses: function(query) {
    var opt_query = query.replace("intro","introduction");
    var and_query = query.replace("&","and");
    that = this;
    var results = this.state.courses.filter(function(c) {
      return (that.isSubsequence(c.name.toLowerCase(),query) || 
             that.isSubsequence(c.name.toLowerCase(),opt_query) ||
             c.name.toLowerCase().indexOf(opt_query) > -1 ||
             that.isSubsequence(c.name.toLowerCase(),and_query) ||
             c.name.toLowerCase().indexOf(and_query) > -1 ||
             c.name.toLowerCase().indexOf(query) > -1 || 
             c.code.toLowerCase().indexOf(query) > -1);
    });
    return results;
  },



});

},{"./actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/section_slot.jsx":[function(require,module,exports){
var TimetableActions = require('./actions/update_timetables.js');
var TimetableStore = require('./stores/update_timetables.js');


var day_to_letter = {
    'M':  'M', 
    'T':  'T', 
    'W':  'W',
    'R': 'Th',
    'F':  'F',
    'S': 'Sa',
    'U': 'S'
};

module.exports = React.createClass({displayName: "exports",
    render: function() {
        var cos = this.getRelatedCourseOfferings();
        var day_and_times = this.getDaysAndTimes(cos);
        var profs_text = cos[0].instructors ? "Prof: " + cos[0].instructors : "-";

        var section_and_prof = (
            React.createElement("div", {className: "sect-prof"}, 
                React.createElement("div", {className: "section-num"}, cos[0].meeting_section), 
                React.createElement("div", {className: "profs"}, profs_text)
            )
        );

        return (
            React.createElement("div", {className: "section-wrapper sec-" + this.props.unique, ref: "main_slot"}, 
                section_and_prof, 
                day_and_times
            ));
    },

    getRelatedCourseOfferings: function() {
        co_objects = [];
        for (var i = 0; i < this.props.all_sections.length; i++) {
            var o = this.props.all_sections[i];
            if (o.meeting_section == this.props.section) {
                co_objects.push(o);
            }
        }
        return co_objects;
    },

    getDaysAndTimes: function(cos) {
        var dayAndTimes = cos.map(function(o, j) {
            return (React.createElement("div", {key: j, className: "day-time", key: o.id}, day_to_letter[o.day] + " " + o.time_start + " - " + o.time_end));
        }.bind(this));
        return ( React.createElement("div", {className: "dt-container"}, 
                dayAndTimes
            ) );
    }
});

},{"./actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/side_bar.jsx":[function(require,module,exports){
var TimetableActions = require('./actions/update_timetables.js');
var TimetableStore = require('./stores/update_timetables.js');
var SimpleModal = require('./simple_modal');
var TextbookList = require('./textbook_list')

var RosterSlot = React.createClass({displayName: "RosterSlot",
  render: function() {
    var styles={backgroundColor: this.props.colour, borderColor: this.props.colour};
    return (
      React.createElement("div", {
        onClick: this.props.toggleModal(this.props.id), 
        style: styles, 
        onMouseEnter: this.highlightSiblings, 
        onMouseLeave: this.unhighlightSiblings, 
        className: "slot-outer fc-time-grid-event fc-event slot slot-" + this.props.id}, 

        React.createElement("div", {className: "fc-content"}, 

          React.createElement("div", {className: "fc-title slot-text-row"}, 
            React.createElement("i", {className: "right fa fa-times remove-course-icon", onClick: this.removeCourse}), 
            this.props.name
          )
        )
      )
    );
  },

  componentDidMount: function() {
  },
  highlightSiblings: function() {
      this.updateColours(COLOUR_TO_HIGHLIGHT[this.props.colour]);
  },
  unhighlightSiblings: function() {
      this.updateColours(this.props.colour);
  },
  updateColours: function(colour) {
    $(".slot-" + this.props.id)
      .css('background-color', colour)
      .css('border-color', colour);
  },
  removeCourse: function(e) {
    TimetableActions.updateCourses({id: this.props.id, 
            section: '', 
            removing: true});
    e.stopPropagation();
  },

});

var CourseRoster = React.createClass({displayName: "CourseRoster",

  render: function() {
    // use the timetable for slots because it contains the most information
    if (this.props.timetables.length > 0) {
      var slots = this.props.timetables[0].courses.map(function(course) {
        var colour =  COURSE_TO_COLOUR[course.code];

        return React.createElement(RosterSlot, React.__spread({},  course, {toggleModal: this.props.toggleModal, key: course.code, colour: colour}))
      }.bind(this));
    } else {
      slots = null;
    }
    var tt = this.props.timetables.length > 0 ? this.props.timetables[0] : null;
    var numCourses = 0;
    var totalScore = 0;
    if (this.props.timetables.length > 0 && this.props.timetables[0].courses.length > 0 ) {
      for (j=0;j<this.props.timetables[0].courses.length;j++) {
          for (k=0;k<this.props.timetables[0].courses[j].evaluations.length;k++) {
            numCourses++;
            totalScore += this.props.timetables[0].courses[j].evaluations[k].score;
          }
      }
    }
    var avgScoreContent = this.props.timetables.length > 0 && totalScore > 0  ? (
      React.createElement("div", {className: "rating-wrapper"}, 
          React.createElement("p", null, "Average Course Rating:"), 
          React.createElement("div", {className: "sub-rating-wrapper"}, 
            React.createElement("div", {className: "star-ratings-sprite"}, 
              React.createElement("span", {style: {width: 100*totalScore/(5*numCourses) + "%"}, className: "rating"})
            )
          )
        )) : null;
    return (
      React.createElement("div", {className: "course-roster course-list"}, 
        React.createElement("div", {className: "clearfix"}, 
          slots, 
          avgScoreContent
        )
      )
    )
  }
})

var TextbookRoster = React.createClass({displayName: "TextbookRoster",
  mixins: [Reflux.connect(TimetableStore)],

  render: function() {
     if (this.state.timetables.length > 0) {
      textbooks = []
       for (i=0; i < this.state.timetables[this.state.current_index].courses.length; i++)  {
          for(j=0; j < this.state.timetables[this.state.current_index].courses[i].textbooks.length; j++) {
            textbooks.push(this.state.timetables[this.state.current_index].courses[i].textbooks[j])
          }
       }
       var tb_elements = textbooks.map(function(tb) {
          if (tb['image_url'] === "Cannot be found") {
            var img = '/static/img/default_cover.jpg'
          } else {
            var img = tb['image_url']
          }
          if (tb['title'] == "Cannot be found") {
            var title = "#" +  tb['isbn']
          } else {
            var title = tb['title']
          }
          return ( 
            React.createElement("a", {className: "textbook", key: tb['id'], href: tb['detail_url'], target: "_blank"}, 
                React.createElement("img", {height: "125", src: img}), 
                React.createElement("div", {className: "module"}, 
                  React.createElement("h6", {className: "line-clamp"}, title)
                  ), 
                React.createElement("img", {src: "https://images-na.ssl-images-amazon.com/images/G/01/associates/remote-buy-box/buy5._V192207739_.gif", width: "120", height: "28", border: "0"})
            ));
       }.bind(this));
       var addToCart = this.getAddButton(textbooks)
    } else {
      var tb_elements = null;
      var addToCart = null
    }
    var modal = null;
    if (this.state.show_modal) {
        modal = React.createElement(SimpleModal, {header: "Your Textbooks", 
                   styles: {backgroundColor: "#FDF5FF", color: "#000"}, 
                   content: null})
    }
    var see_all = null;
    if (tb_elements != null && tb_elements.length > 0) {
      see_all = (React.createElement("div", {className: "view-tbs", onClick: this.toggle}, "View By Course"))
    }
    var courses = this.state.timetables.length > 0 ? this.state.timetables[this.state.current_index].courses : null
    return (
      React.createElement("div", {className: "course-roster textbook-list"}, 
        React.createElement(SimpleModal, {header: "Your Textbooks", 
           key: "textbook", 
           ref: "tbs", 
           styles: {backgroundColor: "#FDF5FF", color: "#000", maxHeight:"90%", maxWidth:"650px", overflowY: "scroll"}, 
           allow_disable: true, 
           content: React.createElement(TextbookList, {
            addToCart: addToCart, 
            courses: courses, 
            school: this.state.school})}), 
        modal, 
        React.createElement("div", {className: "clearfix"}, 
          see_all, 
          tb_elements
        )
      )
    )
  },

  toggle: function() {
    this.refs.tbs.toggle();
  },

  getAddButton: function(textbooks) {
    var entries = textbooks.map(function(tb,i) {
      var asin = (/.*ASIN%3D(.*)/.exec(tb['detail_url']))[1]
      return (React.createElement("div", {key: i}, 
      React.createElement("input", {type: "hidden", name: "ASIN." + i + 1, value: asin}), 
      React.createElement("input", {type: "hidden", name: "Quantity."+ i + 1, value: "1"})))
    }.bind(this));
    var ret = (
    React.createElement("form", {method: "GET", action: "http://www.amazon.com/gp/aws/cart/add.html", target: "_blank"}, 
      React.createElement("input", {type: "hidden", name: "AWSAccessKeyId", value: "AKIAJGUOXN3COOYBPTHQ"}), 
      React.createElement("input", {type: "hidden", name: "AssociateTag", value: "semesterly-20"}), 
      React.createElement("button", {className: "view-tbs", type: "submit"}, 
        React.createElement("i", {className: "fa fa-shopping-cart"}), " Add All to Cart"
      ), 
      entries
    ))
    return ret;
  },
});

module.exports = React.createClass({displayName: "exports",
  mixins: [Reflux.connect(TimetableStore)],
  getInitialState: function() {
    return {show: false};
  },
  render: function() {
    return (

      React.createElement("div", {ref: "sidebar", className: "side-container"}, 
        React.createElement("div", {className: "roster-header"}, 
          React.createElement("h4", null, "Your Semester")
        ), 
        React.createElement(CourseRoster, {toggleModal: this.props.toggleModal, timetables: this.state.timetables}), 
        React.createElement("div", {className: "roster-header"}, 
          React.createElement("h4", null, "Your Textbooks")
        ), 
        React.createElement(TextbookRoster, null)
      )
    )
  },
});

},{"./actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./simple_modal":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/simple_modal.jsx","./stores/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js","./textbook_list":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/textbook_list.jsx"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/side_scroller.jsx":[function(require,module,exports){
var Carousel = require('./modules/nuka-carousel/carousel');

module.exports = React.createClass({displayName: "exports",
  mixins: [Carousel.ControllerMixin],

  getInitialState: function() {
    return {slides_shown_count: 1};
  },
  updateNumItems: function() {

    if (!this.props.slidesToShow || $(".slider").length == 0 || !this.isMounted()) {
      return;
    }
    var width = $(".slider").width();
    var section_width = $(".section-wrapper").width() + 15;
    var count = Math.max(2, parseInt(width/section_width));
    this.setState({slides_shown_count: count});

    // move slider list left (so that first item is centered).
    // currently only done for sections: (".sec-0").parent().parent()
    // so any other items using a slider element are ignored
    var slider_list_left = "35";
    if ($(window).width() < 540) {
      slider_list_left = "20";
    }
    $(".sec-0").parent().parent()
              .css("margin-left", slider_list_left + "%");
    return count;
  },


  render: function() {
  	if (this.props.content.length <= 2) {
  		return React.createElement("div", {style: {marginBottom: "-30px !important"}}, this.props.content);
  	}
    var nav_items = null;
    if (this.props.nav_items && this.state.carousels.carousel) {
      var navs = [];

      for (var i = 0; i < this.props.nav_items.length; i++) {
        var cls = this.state.carousels.carousel.state.currentSlide == i ? " nav-item-active" : "";
        navs.push(
          React.createElement("span", {key: i, className: "nav-item" + cls, onClick: this.changeSlide(i)}, this.props.nav_items[i])
        );
      }
      nav_items = React.createElement("div", {className: "scroll-nav"}, navs);
    }

    return (
      React.createElement("div", null, 
        nav_items, 
        React.createElement(Carousel, {ref: "carousel", data: this.setCarouselData.bind(this, 'carousel'), 
          slidesToShow: this.state.slides_shown_count, 
          dragging: true, 
          cellSpacing: 30, 
          id: this.props.id}, 
          this.props.content
        )
      )
    )
  },
  // changes the currently selected slide to slide i (indexed starting at 0)
  changeSlide: function(i) {
    return function() {
      this.state.carousels.carousel.goToSlide(i);
    }.bind(this);

  },

  componentDidMount: function() {
    var length = this.props.content.length;
    if (length > 1) {
      this.updateNumItems();
      if (length > 2 && this.props.id == "sections-carousel") {
        $(".slider-decorator-1 > .sections-carousel").click() // make third section default to middle of slider
      }
    }

    $(window).resize(function() {
      if (length <= 1) {return;}
      this.updateNumItems();
    }.bind(this));
  },


});

},{"./modules/nuka-carousel/carousel":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/modules/nuka-carousel/carousel.jsx"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/simple_modal.jsx":[function(require,module,exports){
module.exports = React.createClass({displayName: "exports",
	getInitialState: function() {
		return {shown: false};
	},
	render: function() {
		return (
			React.createElement("div", null)
		);
	},

	toggle: function() {
		if (this.state.shown) {
			this.hide();
		}
		else {
			this.show();
		}
	},

	show: function() {
		var close_button = this.props.allow_disable ? 
		(React.createElement("i", {onClick: this.hide, className: "right fa fa-times close-course-modal"})) : null
		ReactDOM.render(
  			(
			React.createElement("div", {className: "simple-modal-wrapper " + this.props.key}, 
				React.createElement("div", {id: "dim-screen", onClick: this.maybeHide}), 
				React.createElement("div", {className: "simple-modal", style: this.props.styles}, 
					React.createElement("h6", {className: "simple-modal-header"}, this.props.header, " ", close_button), 
					React.createElement("hr", {className: "simple-modal-separator"}), 
					React.createElement("div", {className: "simple-modal-content"}, 
						this.props.content
					)
				)
			)),
  			document.getElementById('semesterly-modal')
		);
		$("#dim-screen").height($(window).height())
		this.setState({shown: true});
	},

	maybeHide: function() {
		if (this.props.allow_disable) {
			this.hide();
		}	
	},

	hide: function() {
		if ($("." + this.props.key).length == 0) {return;}
		var container = document.getElementById('semesterly-modal');
		$("#dim-screen").fadeOut(800, function() {
	        ReactDOM.unmountComponentAtNode(container);
		});
		var sel = ".simple-modal";

		if ($(sel).offset().left < 0) {
            $(sel).css("left", "150%");
        } else if ($(sel).offset().left > $('body').width()) {
            $(sel).animate({
                left: '50%',
            }, 800 );
        } else {
            $(sel).animate({
                left: '-150%',
            }, 800 );
        }
		this.setState({shown: false});

	},



});

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/slot_manager.jsx":[function(require,module,exports){
var TimetableActions = require('./actions/update_timetables.js');
var TimetableStore = require('./stores/update_timetables.js');


// maps base colour of slot to colour on highlight
COLOUR_TO_HIGHLIGHT = {
    "#FD7473" : "#E26A6A",
    "#44BBFF" : "#28A4EA",
    "#4CD4B0" : "#3DBB9A",
    "#8870FF" : "#7059E6",
    "#F9AE74" : "#F7954A",
    "#D4DBC8" : "#B5BFA3",
    "#F182B4" : "#DE699D",
    "#7499A2" : "#668B94",
    "#E7F76D" : "#C4D44D",
} // consider #CF000F, #e8fac3
COURSE_TO_COLOUR = {}
// how big a slot of half an hour would be, in pixels
var HALF_HOUR_HEIGHT = 30;

var Slot = React.createClass({displayName: "Slot",
    getInitialState: function() {
        return {show_buttons: false};
    },

    render: function() {
        var pin = null, remove_button = null;
        var slot_style = this.getSlotStyle();

        if (this.state.show_buttons) {
            pin = (
            React.createElement("div", {className: "slot-inner bottom"}, 
                React.createElement("div", {className: "button-surround", onClick: this.pinOrUnpinCourse}, 
                    React.createElement("span", {className: "fa fa-lock"})
               )
            ));
            remove_button = ( React.createElement("div", {className: "slot-inner"}, 
                React.createElement("div", {className: "button-surround", onClick: this.removeCourse}, 
                    React.createElement("span", {className: "fa fa-times remove"})
               )
            ));
        }
        if (this.props.pinned) {
            pin = (
            React.createElement("div", {className: "slot-inner bottom"}, 
                React.createElement("div", {className: "button-surround pinned", onClick: this.pinOrUnpinCourse}, 
                    React.createElement("span", {className: "fa fa-lock"})
               )
            ));
        }
    return (
        React.createElement("div", {
            onClick: this.props.toggleModal(this.props.course), 
            onMouseEnter: this.highlightSiblings, 
            onMouseLeave: this.unhighlightSiblings, 
            className: "slot-outer fc-time-grid-event fc-event slot slot-" + this.props.course, 
            style: slot_style}, 
            remove_button, 
            React.createElement("div", {className: "fc-content"}, 
              React.createElement("div", {className: "fc-time"}, 
                React.createElement("span", null, this.props.time_start, " – ", this.props.time_end)
              ), 
              React.createElement("div", {className: "fc-title slot-text-row"}, this.props.code + " " + this.props.meeting_section), 
              React.createElement("div", {className: "fc-title slot-text-row"}, this.props.name)
            ), 
            pin
        )
        );
    },

   /**
    * Return an object containing style of a specific slot. Should specify at
    * least the top y-coordinate and height of the slot, as well as backgroundColor
    * while taking into account if there's an overlapping conflict
    */
    getSlotStyle: function() {
        var start_hour   = parseInt(this.props.time_start.split(":")[0]),
            start_minute = parseInt(this.props.time_start.split(":")[1]),
            end_hour     = parseInt(this.props.time_end.split(":")[0]),
            end_minute   = parseInt(this.props.time_end.split(":")[1]);

        var top = (start_hour - 8)*52 + (start_minute)*(26/30);
        var bottom = (end_hour - 8)*52 + (end_minute)*(26/30) - 1;
        var height = bottom - top - 2;

        if (this.props.num_conflicts > 1) {
            // console.log(this.props.time_start, this.props.time_end, this.props.num_conflicts)
        }
        // the cumulative width of this slot and all of the slots it is conflicting with
        var total_slot_widths = 99 - (5 * this.props.depth_level);
        // the width of this particular slot
        var slot_width_percentage = total_slot_widths / this.props.num_conflicts;
        // the amount of left margin of this particular slot, in percentage
        var push_left = (this.props.shift_index * slot_width_percentage) + 5 * this.props.depth_level;

        return {
            width: slot_width_percentage + "%",
            top: top,
            height: height,
            backgroundColor: this.props.colour,
            border: "1px solid " + this.props.colour,
            left: push_left + "%",
            zIndex: 100 * this.props.depth_level
        };
    },

    highlightSiblings: function() {
        this.setState({show_buttons: true});
        this.updateColours(COLOUR_TO_HIGHLIGHT[this.props.colour]);
    },
    unhighlightSiblings: function() {
        this.setState({show_buttons: false});
        this.updateColours(this.props.colour);
    },
    pinOrUnpinCourse: function(e) {
        TimetableActions.updateCourses({id: this.props.course, 
            section: this.props.meeting_section, 
            removing: false});
        e.stopPropagation();
    },
    removeCourse: function(e) {
        TimetableActions.updateCourses({id: this.props.course, 
            section: '', 
            removing: true});
        e.stopPropagation();
    },

    updateColours: function(colour) {
        $(".slot-" + this.props.course)
          .css('background-color', colour)
          .css('border-color', colour);
    },

});

module.exports = React.createClass({displayName: "exports",

    render: function() {
        var days = ["M", "T", "W", "R", "F"];
        var slots_by_day = this.getSlotsByDay();
        var all_slots = days.map(function(day) {
            var day_slots = slots_by_day[day].map(function(slot) {
                var p = this.isPinned(slot);
                return React.createElement(Slot, React.__spread({},  slot, {toggleModal: this.props.toggleModal, key: slot.id, pinned: p}))
            }.bind(this));
            return (
                    React.createElement("td", {key: day}, 
                        React.createElement("div", {className: "fc-event-container"}, 
                            day_slots
                        )
                    )
            );
        }.bind(this));
        return (
            React.createElement("table", null, 
              React.createElement("tbody", null, 
                React.createElement("tr", null, 
                  React.createElement("td", {className: "fc-axis"}), 
                  all_slots
                )
              )
            )

        );
    },
   
    componentDidMount: function() {
        var days = {1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri'};
        var d = new Date();
        var selector = ".fc-" + days[d.getDay()];
        // $(selector).addClass("fc-today");
    },

    isPinned: function(slot) {
        var comparator = this.props.courses_to_sections[slot.course]['C'];
        if (this.props.school == "uoft") {
            comparator = this.props.courses_to_sections[slot.course][slot.meeting_section[0]];
        }
        return comparator == slot.meeting_section;
    },

    getSlotsByDay: function() {
        var slots_by_day = {
            'M': [],
            'T': [],
            'W': [],
            'R': [],
            'F': []
        };
        COURSE_TO_COLOUR = {};
        for (var course in this.props.timetable.courses) {
            var crs = this.props.timetable.courses[course];
            for (var slot_id in crs.slots) {
                var slot = crs.slots[slot_id];
                var colour = Object.keys(COLOUR_TO_HIGHLIGHT)[course];
                slot["colour"] = colour;
                slot["code"] = crs.code.trim();
                slot["name"] = crs.name;
                slots_by_day[slot.day].push(slot);
                COURSE_TO_COLOUR[crs.code] = colour;
            }
        }
        return slots_by_day;
    },

});

},{"./actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/course_info.js":[function(require,module,exports){
var course_actions = require('../actions/course_actions.js');

module.exports = Reflux.createStore({
  listenables: [course_actions],

  getCourseInfo: function(school, course_id) {
    this.trigger({loading: true});
    $.get("/courses/"+ school + "/id/" + course_id, 
         {}, 
         function(response) {
            this.trigger({info_loading: false, course_info: response});
         }.bind(this)
    );

  },

  getInitialState: function() {
    return {course_info: null, info_loading: true};
  }
});

},{"../actions/course_actions.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/course_actions.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/toast_store.js":[function(require,module,exports){
var Toast = require('../toast');
var ToastActions = require('../actions/toast_actions.js');

module.exports = Reflux.createStore({
  listenables: [ToastActions],

  createToast: function(content) {
    var container = document.getElementById('toast-container');
    ReactDOM.unmountComponentAtNode(container);
    ReactDOM.render(
      React.createElement(Toast, {content: content}),
      container
    );
  },


});

},{"../actions/toast_actions.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/toast_actions.js","../toast":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/toast.jsx"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js":[function(require,module,exports){
var actions = require('../actions/update_timetables.js');
var ToastActions = require('../actions/toast_actions.js');
var Util = require('../util/timetable_util');

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

SID = randomString(30, '!?()*&^%$#@![]0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

TT_STATE = {
  school: "jhu",
  semester: "S",
  courses_to_sections: {},
  preferences: {
    'no_classes_before': false,
    'no_classes_after': false,
    'long_weekend': false,
    'grouped': false,
    'do_ranking': false,
    'try_with_conflicts': false
  },
  sid: SID,
}

SCHOOL_LIST = ["jhu", "uoft"];

// flag to check if the user just turned conflicts off
CONFLICT_OFF = false;

module.exports = Reflux.createStore({
  listenables: [actions],
  courses_to_sections: {},
  loading: false,

  getInitialState: function() {
    return {
      timetables: [], 
      preferences: TT_STATE.preferences,
      courses_to_sections: {}, 
      current_index: -1, 
      conflict_error: false,
      loading: false, // timetables loading
      courses_loading: false,
      school: ""};
  },

  setSchool: function(new_school) {
    var school = SCHOOL_LIST.indexOf(new_school) > -1 ? new_school : "";
    var new_state = this.getInitialState();
    TT_STATE.school = school;
    new_state.school = school;
    this.trigger(new_state);
  },
 /**
  * Update TT_STATE with new course roster
  * @param {object} new_course_with_section contains attributed id, section, removing
  * @return {void} does not return anything, just updates TT_STATE
  */
  updateCourses: function(new_course_with_section) {
    if (this.loading) {return;} // if loading, don't process.
    this.loading = true;
    this.trigger({loading:true});

    var removing = new_course_with_section.removing;
    var new_course_id = new_course_with_section.id;
    var section = new_course_with_section.section;
    var new_state = $.extend(true, {}, TT_STATE); // deep copy of TT_STATE
    var c_to_s = new_state.courses_to_sections;
    if (!removing) { // adding course
      if (TT_STATE.school == "jhu") {
        if (c_to_s[new_course_id]) {
          var new_section = c_to_s[new_course_id]['C'] != "" ? "" : section;
          c_to_s[new_course_id]['C'] = new_section;
        }
        else {
          c_to_s[new_course_id] = {'L': '', 'T': '', 'P': '', 'C': section};
        }
      }
      else if (TT_STATE.school == "uoft") {
        var locked_sections = c_to_s[new_course_id] == null ? {'L': '', 'T': '', 'P': '', 'C': ''} : // this is what we want to send if not locking
          c_to_s[new_course_id];
        if (section && section != "") {
          var new_section = section;
          if (c_to_s[new_course_id][section[0]] != "") {new_section = "";} // unlocking since section previously existed
          locked_sections[section[0]] = new_section;
        }
        c_to_s[new_course_id] = locked_sections;
      }
    }
    else { // removing course
      delete c_to_s[new_course_id];
      if (Object.keys(c_to_s).length == 0) { // removed last course
          TT_STATE.courses_to_sections = {};
          var replaced = this.getInitialState();
          replaced.school = TT_STATE.school;
          this.loading = false;
          this.trigger(replaced);
          return;  
      }
    }
    this.makeRequest(new_state);
  },

 /**
  * Update TT_STATE with new preferences
  * @param {string} preference: the preference that is being updated
  * @param new_value: the new value of the specified preference
  * @return {void} doesn't return anything, just updates TT_STATE
  */
  updatePreferences: function(preference, new_value) {
    var new_state = $.extend(true, {}, TT_STATE); // deep copy of TT_STATE
    if (preference == 'try_with_conflicts' && new_value == false) {
      CONFLICT_OFF = true;
    }
    new_state.preferences[preference] = new_value;
    this.trigger({preferences: new_state.preferences});
    this.makeRequest(new_state);
  },

  // Makes a POST request to the backend with TT_STATE
  makeRequest: function(new_state) {
    this.trigger({loading: true});
    $.post('/', JSON.stringify(new_state), function(response) {
        this.loading = false;
        if (response.error) { // error from URL or local storage
          if(Util.browserSupportsLocalStorage()) {
            localStorage.removeItem('data');
          }
          TT_STATE.courses_to_sections = {};
          var replaced = this.getInitialState();
          replaced.school = TT_STATE.school;
          this.trigger(replaced);
          return; // stop processing here
        }
        if (response.length > 0) {
          TT_STATE = new_state; //only update state if successful
          var index = 0;
          if (new_state.index && new_state.index < response.length) {
            index = new_state.index;
            delete new_state['index'];
          }
          this.trigger({
              timetables: response,
              courses_to_sections: TT_STATE.courses_to_sections,
              current_index: index,
              loading: false,
              preferences: TT_STATE.preferences
          });
        } else if (!$.isEmptyObject(TT_STATE.courses_to_sections)) { // conflict
          // if turning conflicts off led to a conflict, reprompt user
          if (CONFLICT_OFF) {
            this.trigger({
              loading: false,
              conflict_error: false,
              preferences: TT_STATE.preferences
            })
            ToastActions.createToast("Please remove some courses before turning off Allow Conflicts");
          } else {
            this.trigger({
              loading: false,
              conflict_error: true
            });
            ToastActions.createToast("That course caused a conflict! Try again with the Allow Conflicts preference turned on.");
          }
        } else {
          this.trigger({loading: false});
        }
        CONFLICT_OFF = false;
    }.bind(this));
  },


  loadPresetTimetable: function(url_data) {
    var courses = url_data.split("&");
    var school = Util.getUnhashedString(courses.shift());
    var prefs = courses.shift();
    var preferences_array = prefs.split(";");
    var pref_obj = {};
    for (var k in preferences_array) {
      var pref_with_val = preferences_array[k].split("="); //e.g. ["allow_conflicts", "false"]
      var pref = Util.getUnhashedString(pref_with_val[0]);
      var val = Boolean(Util.getUnhashedString(pref_with_val[1]) === "true");

      pref_obj[pref] = (val);
    }
    this.trigger({loading: true, school: school, preferences:pref_obj});
    TT_STATE.preferences = pref_obj;
    TT_STATE.school = school;
    TT_STATE.index = parseInt(Util.getUnhashedString(courses.shift()));
    for (var i = 0; i < courses.length; i++) {
      var course_info = courses[i].split("+");
      var c = parseInt(Util.getUnhashedString(course_info.shift()));

      TT_STATE.courses_to_sections[c] = {'L': '', 'T': '', 'P': '', 'C': ''};
      if (course_info.length > 0) {
        for (var j = 0; j < course_info.length; j++) {
          var section = Util.getUnhashedString(course_info[j]);
          if (school == "uoft") {
            TT_STATE.courses_to_sections[c][section[0]] = section;
          }
          else if (school == "jhu") {
            TT_STATE.courses_to_sections[c]['C'] = section;
          }
        }
      }
    }
    this.makeRequest(TT_STATE);
  },

  setCoursesLoading: function() {
    this.trigger({courses_loading: true});
  },
  setCoursesDoneLoading: function() {
    this.trigger({courses_loading: false});
  },
  setCurrentIndex: function(new_index) {
    this.trigger({current_index: new_index});
  },

});

$(window).on('beforeunload', function() {
  $.ajax({
      type: 'POST',
      async: false,
      url: '/exit',
      data: {sid: SID}
  });
});

},{"../actions/toast_actions.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/toast_actions.js","../actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","../util/timetable_util":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/util/timetable_util.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/textbook_list.jsx":[function(require,module,exports){
var TimetableActions = require('./actions/update_timetables.js');
var TimetableStore = require('./stores/update_timetables.js');
var SimpleModal = require('./simple_modal');

module.exports = React.createClass({displayName: "exports",
  mixins: [Reflux.connect(TimetableStore)],

  getAddons: function() {
  	var addons = [
  		{
  			link: "http://amzn.to/1OzFaOQ",
  			img: "http://ecx.images-amazon.com/images/I/71508stXp7L._SX522_.jpg",
  			title: "Mead Spiral Notebook",
  			price: "$8.98",
  			prime_eligible: true
  		},
  		{
  			link: "http://amzn.to/1ZuQRLT",
  			img: "http://ecx.images-amazon.com/images/I/61V6woEdngL._SY679_.jpg",
  			title: "BIC Highlighters",
  			price: "$4.04",
  			prime_eligible: true
  		},
  		{
  			link: "http://amzn.to/1ZuR3dY",
  			img: "http://ecx.images-amazon.com/images/I/81qjewvKndL._SX522_.jpg",
  			title: "25 Pocket Folders",
  			price: "$6.98",
  			prime_eligible: true
  		}
  	]
  	var addonsHTML = addons.map(function(item, i) {
  		var img = React.createElement("img", {height: "125", src: item.img})
  		var title = React.createElement("h6", {className: "line-clamp title"}, item.title)
  		var price = React.createElement("h6", {className: "price"}, item.price)
  		var prime_logo = item.prime_eligible ? React.createElement("img", {className: "prime", height: "15px", src: "/static/img/prime.png"}) : null
  		return (
  			React.createElement("div", {className: "addon custom-addon", key: i}, 
  				React.createElement("a", {href: item.link, target: "_blank"}, 
	  				img, 
	  				title, 
	  				React.createElement("div", {className: "price-prime-container"}, 
		  				price, 
		  				prime_logo
		  			)
	  			)
  			))
  	}.bind(this));
  	return (React.createElement("div", {className: "addon-wrapper"}, addonsHTML))
  },

  render: function() {
  	var html = this.props.courses.map(function(c, i) {
  		if ( c.textbooks.length > 0 ) {
  		  var inner_html = c.textbooks.map(function(tb) {
	  		  if (tb['image_url'] === "Cannot be found") {
	            var img = '/static/img/default_cover.jpg'
	          } else {
	            var img = tb['image_url']
	          }
	          if (tb['title'] == "Cannot be found") {
	            var title = "#" +  tb['isbn']
	          } else {
	            var title = tb['title']
	          }
	          return ( 
	            React.createElement("a", {className: "textbook", href: tb['detail_url'], target: "_blank", key: tb['id']}, 
	                React.createElement("img", {height: "125", src: img}), 
	                React.createElement("div", {className: "module"}, 
	                  React.createElement("h6", {className: "line-clamp"}, title)
                  ), 
                  React.createElement("img", {src: "https://images-na.ssl-images-amazon.com/images/G/01/associates/remote-buy-box/buy5._V192207739_.gif", width: "120", height: "28", border: "0"})
	            ));
  			}.bind(this));
        var header = this.props.school == "uoft" ? (
              React.createElement("h6", null, c.code, ": ", c.name) ) : 
             (React.createElement("h6", null, c.name));
	  		return (
	  			React.createElement("div", {className: "textbook-list-entry", key: i}, 
	  				header, 
	  				 React.createElement("div", {className: "course-roster textbook-list"}, 
	  					inner_html
	  				)
	  			))
  		}
  		else {
  			return null
  		}
  	}.bind(this));
    return (
    	React.createElement("div", {className: "textbook-list-wrapper"}, 
        this.props.addToCart, 
    		html, 
    		React.createElement("div", {className: "textbook-list-entry"}, 
  				React.createElement("h6", null, "Popular Addons"), 
    			this.getAddons()
    		)
    	))
  },

});

},{"./actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./simple_modal":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/simple_modal.jsx","./stores/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/timetable.jsx":[function(require,module,exports){
var SlotManager = require('./slot_manager');
var Pagination = require('./pagination');
var UpdateTimetablesStore = require('./stores/update_timetables');
var TimetableActions = require('./actions/update_timetables');
var ToastActions = require('./actions/toast_actions');
var Util = require('./util/timetable_util');
var NewPagination = require('./new_pagination');
var CopyButton = require('./copy_button');

module.exports = React.createClass({displayName: "exports",
  mixins: [Reflux.connect(UpdateTimetablesStore)],

  setIndex: function(new_index) {
    return(function () {
      if (new_index >= 0 && new_index < this.state.timetables.length) {
        TimetableActions.setCurrentIndex(new_index);
      }
    }.bind(this));
  },

  getData: function() {
  return Util.getLinkData(this.state.school,
      this.state.courses_to_sections,
      this.state.current_index, this.state.preferences);
  },
  getEndHour: function() {
    // gets the end hour of the current timetable
    var max_end_hour = 17;
    if (!this.hasTimetables()) {
      return max_end_hour;
    }
    var courses = this.state.timetables[this.state.current_index].courses;
    for (var course_index in courses) {
      var course = courses[course_index];
      for (var slot_index in course.slots) {
        var slot = course.slots[slot_index];
        var end_hour = parseInt(slot.time_end.split(":")[0]);
        max_end_hour = Math.max(max_end_hour, end_hour);
      }
    }
    return max_end_hour;

  },

  getHourRows: function() {
    var max_end_hour = this.getEndHour();
    var rows = [];
    var row_style = {borderColor: "#E0DFDF"};
    for (var i = 8; i <= max_end_hour; i++) { // one row for each hour, starting from 8am
      var time = i + "am";
      if (i >= 12) { // the pm hours
        var hour = (i - 12) > 0 ? i - 12 : i;
        time = hour + "pm";
      }
      rows.push(
          (React.createElement("tr", {key: time}, 
              React.createElement("td", {className: "fc-axis fc-time fc-widget-content", style: row_style}, React.createElement("span", null, time)), 
              React.createElement("td", {className: "fc-widget-content", style: row_style})
          ))
      );  
      // for the half hour row
      rows.push(
          (React.createElement("tr", {className: "fc-minor", key: time + "-half"}, 
              React.createElement("td", {className: "fc-axis fc-time fc-widget-content", style: row_style}), 
              React.createElement("td", {className: "fc-widget-content", style: row_style})
          ))
      );

    }

    return rows;
  },


  hasTimetables: function() {
    return this.state.timetables.length > 0;
  },

  render: function() {
      var has_timetables = this.hasTimetables();
      var slot_manager = !has_timetables ? null :
       (React.createElement(SlotManager, {toggleModal: this.props.toggleModal, 
                     timetable: this.state.timetables[this.state.current_index], 
                     courses_to_sections: this.state.courses_to_sections, 
                     school: this.state.school}));

      var hours = this.getHourRows();
      var opacity = this.state.loading ? {opacity: "0.5"} : {};
      var height = (572 + (this.getEndHour() - 18)*52) + "px";
      return (

          React.createElement("div", {id: "calendar", className: "fc fc-ltr fc-unthemed", style: opacity}, 
              React.createElement("div", {className: "fc-toolbar"}, 
                React.createElement(NewPagination, {
                  count: this.state.timetables.length, 
                  next: this.setIndex(this.state.current_index + 1), 
                  prev: this.setIndex(this.state.current_index - 1), 
                  setIndex: this.setIndex, 
                  current_index: this.state.current_index}), 
                React.createElement(CopyButton, {getData: this.getData}), 
                React.createElement("div", {className: "fc-clear"})


              ), 

              React.createElement("div", {className: "fc-view-container"}, 
                React.createElement("div", {className: "fc-view fc-agendaWeek-view fc-agenda-view"}, 
                  React.createElement("table", null, 
                    React.createElement("thead", null, 
                      React.createElement("tr", null, 
                        React.createElement("td", {className: "fc-widget-header"}, 
                          React.createElement("div", {className: "fc-row fc-widget-header", id: "custom-widget-header"}, 
                            React.createElement("table", null, 
                              React.createElement("thead", null, 
                                React.createElement("tr", null, 
                                  React.createElement("th", {className: "fc-axis fc-widget-header"}), 
                                  React.createElement("th", {className: "fc-day-header fc-widget-header fc-mon"}, "Mon "), 
                                  React.createElement("th", {className: "fc-day-header fc-widget-header fc-tue"}, "Tue "), 
                                  React.createElement("th", {className: "fc-day-header fc-widget-header fc-wed"}, "Wed "), 
                                  React.createElement("th", {className: "fc-day-header fc-widget-header fc-thu"}, "Thu "), 
                                  React.createElement("th", {className: "fc-day-header fc-widget-header fc-fri"}, "Fri ")
                                )
                              )
                            )
                          )
                        )
                      )
                    ), 

                    React.createElement("tbody", null, 
                      React.createElement("tr", null, 
                        React.createElement("td", {className: "fc-widget-content"}, 
                          React.createElement("div", {className: "fc-day-grid"}, 
                            
                              React.createElement("div", {className: "fc-content-skeleton"}, 
                                React.createElement("table", null, 
                                  React.createElement("tbody", null, 
                                    React.createElement("tr", null, 
                                      React.createElement("td", {className: "fc-axis"}), 
                                      React.createElement("td", null), 
                                      React.createElement("td", null), 
                                      React.createElement("td", null), 
                                      React.createElement("td", null), 
                                      React.createElement("td", null)
                                    )
                                  )
                                )
                              )
                            ), 
                          React.createElement("div", {className: "fc-time-grid-container fc-scroller", id: "calendar-inner", style: {height: height}}, 
                            React.createElement("div", {className: "fc-time-grid"}, 
                              React.createElement("div", {className: "fc-bg"}, 
                                React.createElement("table", null, 
                                  React.createElement("tbody", null, 
                                    React.createElement("tr", null, 
                                      React.createElement("td", {className: "fc-axis fc-widget-content"}), 
                                      React.createElement("td", {className: "fc-day fc-widget-content fc-mon"}), 
                                      React.createElement("td", {className: "fc-day fc-widget-content fc-tue"}), 
                                      React.createElement("td", {className: "fc-day fc-widget-content fc-wed"}), 
                                      React.createElement("td", {className: "fc-day fc-widget-content fc-thu"}), 
                                      React.createElement("td", {className: "fc-day fc-widget-content fc-fri"})
                                    )
                                  )
                                )
                              ), 
                              React.createElement("div", {className: "fc-slats"}, 
                                React.createElement("table", null, 
                                  React.createElement("tbody", null, 
                                    hours
                                  )
                                )
                              ), 
                              React.createElement("hr", {className: "fc-widget-header", id: "widget-hr"}), 
                              React.createElement("div", {className: "fc-content-skeleton", id: "slot-manager"}, 
                                slot_manager
                              )
                            )
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
      );
  },

  componentDidUpdate: function() {
    if(Util.browserSupportsLocalStorage()) {
      if (this.state.timetables.length > 0) {
        // save newly generated courses to local storage
        var new_data = this.getData();
        localStorage.setItem('data', new_data);
      } else {
        localStorage.removeItem('data');
      }
    } 

  },


});

},{"./actions/toast_actions":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/toast_actions.js","./actions/update_timetables":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./copy_button":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/copy_button.jsx","./new_pagination":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/new_pagination.jsx","./pagination":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/pagination.jsx","./slot_manager":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/slot_manager.jsx","./stores/update_timetables":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js","./util/timetable_util":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/util/timetable_util.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/toast.jsx":[function(require,module,exports){
module.exports = React.createClass({displayName: "exports",
	getInitialState: function() {
		return {visible: true};
	},		
	render: function() {
		if (!this.state.visible) {return null;}
		return (
		React.createElement("div", {className: "sem-toast-wrapper toasting"}, 
			React.createElement("div", {className: "sem-toast"}, this.props.content)
		)
		);
	},
	componentDidMount: function() {
		setTimeout(function() {
			if (this._reactInternalInstance) { // if mounted still
				this.setState({visible: false});
			}
		}.bind(this), 4000);
	},

});

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/util/timetable_util.js":[function(require,module,exports){
(function (Buffer){
var hashids = new Hashids("***REMOVED***");
module.exports = {
	getLinkData: function(school, courses_to_sections, index, preferences) {
		if (Object.keys(courses_to_sections).length == 0) {return "";}
	    var data = this.getHashedString(school) + "&";
	    for (var pref in preferences) {
	    	var encoded_p = this.getHashedString(pref);
	    	var encoded_val = this.getHashedString(preferences[pref]);
	    	data += encoded_p + "=" + encoded_val + ";";
	    }
	    data = data.slice(0, -1);
	    data += "&" + this.getHashedString(index) + "&";
	    var c_to_s = courses_to_sections;
	    for (var course_id in c_to_s) {
	      var encoded_course_id = this.getHashedString(course_id);
	      data += encoded_course_id;

	      var mapping = c_to_s[course_id];
	      for (var section_heading in mapping) { // i.e 'L', 'T', 'P', 'S'
	        if (mapping[section_heading] != "") {
	          var encoded_section = this.getHashedString(mapping[section_heading]);
	          data += "+" + encoded_section; // delimiter for sections locked
	        }
	      }
	      data += "&"; // delimiter for courses
	    }
	    data = data.slice(0, -1);
	    if (data.length < 3) {data = "";}

	    return data;
	},

	getHashedString: function(x) {
		x = String(x);
		var hexed = Buffer(x).toString('hex');
    	var encoded_x = hashids.encodeHex(hexed);
    	if (!encoded_x || encoded_x == "") {
    		console.log(x);
    	}
    	return encoded_x;
	},

	getUnhashedString: function(x) {
		var decodedHex = hashids.decodeHex(x);
		var string = Buffer(decodedHex, 'hex').toString('utf8');
		return string;
	},

	browserSupportsLocalStorage: function() {
		try {
   			localStorage.setItem("test", "test");
   			localStorage.removeItem("test");
   			return true;
  		} catch (exception) {
   			return false;
 		}
	},

}

}).call(this,require("buffer").Buffer)

},{"buffer":"/Users/rohandas/Desktop/semesterly/node_modules/browserify/node_modules/buffer/index.js"}]},{},["/Users/rohandas/Desktop/semesterly/static/js/new_timetable/app.jsx"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaXNhcnJheS9pbmRleC5qcyIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvYWN0aW9ucy9jb3Vyc2VfYWN0aW9ucy5qcyIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvYWN0aW9ucy90b2FzdF9hY3Rpb25zLmpzIiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzIiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9hcHAuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9jb250cm9sX2Jhci5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL2NvcHlfYnV0dG9uLmpzeCIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvZXZhbHVhdGlvbnMuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9sb2FkZXIuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9tb2RhbF9jb250ZW50LmpzeCIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvbW9kdWxlcy9udWthLWNhcm91c2VsL2Nhcm91c2VsLmpzeCIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvbW9kdWxlcy9udWthLWNhcm91c2VsL2RlY29yYXRvcnMuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9tb2R1bGVzL251a2EtY2Fyb3VzZWwvZXhlbnYuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9tb2R1bGVzL251a2EtY2Fyb3VzZWwvb2JqZWN0LWFzc2lnbi5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL21vZHVsZXMvbnVrYS1jYXJvdXNlbC9yZWFjdC10d2Vlbi1zdGF0ZS5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL25ld19wYWdpbmF0aW9uLmpzeCIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvcGFnaW5hdGlvbi5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3ByZWZlcmVuY2VfbWVudS5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3Jvb3QuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zY2hvb2xfbGlzdC5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3NlYXJjaF9iYXIuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zZWN0aW9uX3Nsb3QuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zaWRlX2Jhci5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3NpZGVfc2Nyb2xsZXIuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zaW1wbGVfbW9kYWwuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zbG90X21hbmFnZXIuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zdG9yZXMvY291cnNlX2luZm8uanMiLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3N0b3Jlcy90b2FzdF9zdG9yZS5qcyIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzIiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS90ZXh0Ym9va19saXN0LmpzeCIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvdGltZXRhYmxlLmpzeCIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvdG9hc3QuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS91dGlsL3RpbWV0YWJsZV91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNWdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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LENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxPQUFPLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsT0FBTyxXQUFXLEVBQUUsSUFBSSxHQUFHLFdBQVcsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLE9BQU8sV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxFQUFFLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxPQUFPLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7QUNBdnhQLG9DQUFvQyx1QkFBQTtFQUNsQyxlQUFlLEVBQUUsV0FBVztJQUMxQixJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDdkMsT0FBTyxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMs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b250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8ZmVyb3NzQGZlcm9zcy5vcmc+IDxodHRwOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuLyogZXNsaW50LWRpc2FibGUgbm8tcHJvdG8gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbnZhciBiYXNlNjQgPSByZXF1aXJlKCdiYXNlNjQtanMnKVxudmFyIGllZWU3NTQgPSByZXF1aXJlKCdpZWVlNzU0JylcbnZhciBpc0FycmF5ID0gcmVxdWlyZSgnaXNhcnJheScpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTIgLy8gbm90IHVzZWQgYnkgdGhpcyBpbXBsZW1lbnRhdGlvblxuXG52YXIgcm9vdFBhcmVudCA9IHt9XG5cbi8qKlxuICogSWYgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYDpcbiAqICAgPT09IHRydWUgICAgVXNlIFVpbnQ4QXJyYXkgaW1wbGVtZW50YXRpb24gKGZhc3Rlc3QpXG4gKiAgID09PSBmYWxzZSAgIFVzZSBPYmplY3QgaW1wbGVtZW50YXRpb24gKG1vc3QgY29tcGF0aWJsZSwgZXZlbiBJRTYpXG4gKlxuICogQnJvd3NlcnMgdGhhdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBhcmUgSUUgMTArLCBGaXJlZm94IDQrLCBDaHJvbWUgNyssIFNhZmFyaSA1LjErLFxuICogT3BlcmEgMTEuNissIGlPUyA0LjIrLlxuICpcbiAqIER1ZSB0byB2YXJpb3VzIGJyb3dzZXIgYnVncywgc29tZXRpbWVzIHRoZSBPYmplY3QgaW1wbGVtZW50YXRpb24gd2lsbCBiZSB1c2VkIGV2ZW5cbiAqIHdoZW4gdGhlIGJyb3dzZXIgc3VwcG9ydHMgdHlwZWQgYXJyYXlzLlxuICpcbiAqIE5vdGU6XG4gKlxuICogICAtIEZpcmVmb3ggNC0yOSBsYWNrcyBzdXBwb3J0IGZvciBhZGRpbmcgbmV3IHByb3BlcnRpZXMgdG8gYFVpbnQ4QXJyYXlgIGluc3RhbmNlcyxcbiAqICAgICBTZWU6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NTQzOC5cbiAqXG4gKiAgIC0gU2FmYXJpIDUtNyBsYWNrcyBzdXBwb3J0IGZvciBjaGFuZ2luZyB0aGUgYE9iamVjdC5wcm90b3R5cGUuY29uc3RydWN0b3JgIHByb3BlcnR5XG4gKiAgICAgb24gb2JqZWN0cy5cbiAqXG4gKiAgIC0gQ2hyb21lIDktMTAgaXMgbWlzc2luZyB0aGUgYFR5cGVkQXJyYXkucHJvdG90eXBlLnN1YmFycmF5YCBmdW5jdGlvbi5cbiAqXG4gKiAgIC0gSUUxMCBoYXMgYSBicm9rZW4gYFR5cGVkQXJyYXkucHJvdG90eXBlLnN1YmFycmF5YCBmdW5jdGlvbiB3aGljaCByZXR1cm5zIGFycmF5cyBvZlxuICogICAgIGluY29ycmVjdCBsZW5ndGggaW4gc29tZSBzaXR1YXRpb25zLlxuXG4gKiBXZSBkZXRlY3QgdGhlc2UgYnVnZ3kgYnJvd3NlcnMgYW5kIHNldCBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgIHRvIGBmYWxzZWAgc28gdGhleVxuICogZ2V0IHRoZSBPYmplY3QgaW1wbGVtZW50YXRpb24sIHdoaWNoIGlzIHNsb3dlciBidXQgYmVoYXZlcyBjb3JyZWN0bHkuXG4gKi9cbkJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUID0gZ2xvYmFsLlRZUEVEX0FSUkFZX1NVUFBPUlQgIT09IHVuZGVmaW5lZFxuICA/IGdsb2JhbC5UWVBFRF9BUlJBWV9TVVBQT1JUXG4gIDogdHlwZWRBcnJheVN1cHBvcnQoKVxuXG5mdW5jdGlvbiB0eXBlZEFycmF5U3VwcG9ydCAoKSB7XG4gIGZ1bmN0aW9uIEJhciAoKSB7fVxuICB0cnkge1xuICAgIHZhciBhcnIgPSBuZXcgVWludDhBcnJheSgxKVxuICAgIGFyci5mb28gPSBmdW5jdGlvbiAoKSB7IHJldHVybiA0MiB9XG4gICAgYXJyLmNvbnN0cnVjdG9yID0gQmFyXG4gICAgcmV0dXJuIGFyci5mb28oKSA9PT0gNDIgJiYgLy8gdHlwZWQgYXJyYXkgaW5zdGFuY2VzIGNhbiBiZSBhdWdtZW50ZWRcbiAgICAgICAgYXJyLmNvbnN0cnVjdG9yID09PSBCYXIgJiYgLy8gY29uc3RydWN0b3IgY2FuIGJlIHNldFxuICAgICAgICB0eXBlb2YgYXJyLnN1YmFycmF5ID09PSAnZnVuY3Rpb24nICYmIC8vIGNocm9tZSA5LTEwIGxhY2sgYHN1YmFycmF5YFxuICAgICAgICBhcnIuc3ViYXJyYXkoMSwgMSkuYnl0ZUxlbmd0aCA9PT0gMCAvLyBpZTEwIGhhcyBicm9rZW4gYHN1YmFycmF5YFxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuZnVuY3Rpb24ga01heExlbmd0aCAoKSB7XG4gIHJldHVybiBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVFxuICAgID8gMHg3ZmZmZmZmZlxuICAgIDogMHgzZmZmZmZmZlxufVxuXG4vKipcbiAqIENsYXNzOiBCdWZmZXJcbiAqID09PT09PT09PT09PT1cbiAqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGFyZSBhdWdtZW50ZWRcbiAqIHdpdGggZnVuY3Rpb24gcHJvcGVydGllcyBmb3IgYWxsIHRoZSBub2RlIGBCdWZmZXJgIEFQSSBmdW5jdGlvbnMuIFdlIHVzZVxuICogYFVpbnQ4QXJyYXlgIHNvIHRoYXQgc3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXQgcmV0dXJuc1xuICogYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogQnkgYXVnbWVudGluZyB0aGUgaW5zdGFuY2VzLCB3ZSBjYW4gYXZvaWQgbW9kaWZ5aW5nIHRoZSBgVWludDhBcnJheWBcbiAqIHByb3RvdHlwZS5cbiAqL1xuZnVuY3Rpb24gQnVmZmVyIChhcmcpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICAvLyBBdm9pZCBnb2luZyB0aHJvdWdoIGFuIEFyZ3VtZW50c0FkYXB0b3JUcmFtcG9saW5lIGluIHRoZSBjb21tb24gY2FzZS5cbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHJldHVybiBuZXcgQnVmZmVyKGFyZywgYXJndW1lbnRzWzFdKVxuICAgIHJldHVybiBuZXcgQnVmZmVyKGFyZylcbiAgfVxuXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzLmxlbmd0aCA9IDBcbiAgICB0aGlzLnBhcmVudCA9IHVuZGVmaW5lZFxuICB9XG5cbiAgLy8gQ29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykge1xuICAgIHJldHVybiBmcm9tTnVtYmVyKHRoaXMsIGFyZylcbiAgfVxuXG4gIC8vIFNsaWdodGx5IGxlc3MgY29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBmcm9tU3RyaW5nKHRoaXMsIGFyZywgYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiAndXRmOCcpXG4gIH1cblxuICAvLyBVbnVzdWFsLlxuICByZXR1cm4gZnJvbU9iamVjdCh0aGlzLCBhcmcpXG59XG5cbmZ1bmN0aW9uIGZyb21OdW1iZXIgKHRoYXQsIGxlbmd0aCkge1xuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoIDwgMCA/IDAgOiBjaGVja2VkKGxlbmd0aCkgfCAwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdGhhdFtpXSA9IDBcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbVN0cmluZyAodGhhdCwgc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJyB8fCBlbmNvZGluZyA9PT0gJycpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgLy8gQXNzdW1wdGlvbjogYnl0ZUxlbmd0aCgpIHJldHVybiB2YWx1ZSBpcyBhbHdheXMgPCBrTWF4TGVuZ3RoLlxuICB2YXIgbGVuZ3RoID0gYnl0ZUxlbmd0aChzdHJpbmcsIGVuY29kaW5nKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcblxuICB0aGF0LndyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21PYmplY3QgKHRoYXQsIG9iamVjdCkge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKG9iamVjdCkpIHJldHVybiBmcm9tQnVmZmVyKHRoYXQsIG9iamVjdClcblxuICBpZiAoaXNBcnJheShvYmplY3QpKSByZXR1cm4gZnJvbUFycmF5KHRoYXQsIG9iamVjdClcblxuICBpZiAob2JqZWN0ID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdtdXN0IHN0YXJ0IHdpdGggbnVtYmVyLCBidWZmZXIsIGFycmF5IG9yIHN0cmluZycpXG4gIH1cblxuICBpZiAodHlwZW9mIEFycmF5QnVmZmVyICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmIChvYmplY3QuYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgIHJldHVybiBmcm9tVHlwZWRBcnJheSh0aGF0LCBvYmplY3QpXG4gICAgfVxuICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgcmV0dXJuIGZyb21BcnJheUJ1ZmZlcih0aGF0LCBvYmplY3QpXG4gICAgfVxuICB9XG5cbiAgaWYgKG9iamVjdC5sZW5ndGgpIHJldHVybiBmcm9tQXJyYXlMaWtlKHRoYXQsIG9iamVjdClcblxuICByZXR1cm4gZnJvbUpzb25PYmplY3QodGhhdCwgb2JqZWN0KVxufVxuXG5mdW5jdGlvbiBmcm9tQnVmZmVyICh0aGF0LCBidWZmZXIpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYnVmZmVyLmxlbmd0aCkgfCAwXG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG4gIGJ1ZmZlci5jb3B5KHRoYXQsIDAsIDAsIGxlbmd0aClcbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5ICh0aGF0LCBhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuLy8gRHVwbGljYXRlIG9mIGZyb21BcnJheSgpIHRvIGtlZXAgZnJvbUFycmF5KCkgbW9ub21vcnBoaWMuXG5mdW5jdGlvbiBmcm9tVHlwZWRBcnJheSAodGhhdCwgYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcbiAgLy8gVHJ1bmNhdGluZyB0aGUgZWxlbWVudHMgaXMgcHJvYmFibHkgbm90IHdoYXQgcGVvcGxlIGV4cGVjdCBmcm9tIHR5cGVkXG4gIC8vIGFycmF5cyB3aXRoIEJZVEVTX1BFUl9FTEVNRU5UID4gMSBidXQgaXQncyBjb21wYXRpYmxlIHdpdGggdGhlIGJlaGF2aW9yXG4gIC8vIG9mIHRoZSBvbGQgQnVmZmVyIGNvbnN0cnVjdG9yLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5QnVmZmVyICh0aGF0LCBhcnJheSkge1xuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSwgZm9yIGJlc3QgcGVyZm9ybWFuY2VcbiAgICBhcnJheS5ieXRlTGVuZ3RoXG4gICAgdGhhdCA9IEJ1ZmZlci5fYXVnbWVudChuZXcgVWludDhBcnJheShhcnJheSkpXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBhbiBvYmplY3QgaW5zdGFuY2Ugb2YgdGhlIEJ1ZmZlciBjbGFzc1xuICAgIHRoYXQgPSBmcm9tVHlwZWRBcnJheSh0aGF0LCBuZXcgVWludDhBcnJheShhcnJheSkpXG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5TGlrZSAodGhhdCwgYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIHRoYXRbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbi8vIERlc2VyaWFsaXplIHsgdHlwZTogJ0J1ZmZlcicsIGRhdGE6IFsxLDIsMywuLi5dIH0gaW50byBhIEJ1ZmZlciBvYmplY3QuXG4vLyBSZXR1cm5zIGEgemVyby1sZW5ndGggYnVmZmVyIGZvciBpbnB1dHMgdGhhdCBkb24ndCBjb25mb3JtIHRvIHRoZSBzcGVjLlxuZnVuY3Rpb24gZnJvbUpzb25PYmplY3QgKHRoYXQsIG9iamVjdCkge1xuICB2YXIgYXJyYXlcbiAgdmFyIGxlbmd0aCA9IDBcblxuICBpZiAob2JqZWN0LnR5cGUgPT09ICdCdWZmZXInICYmIGlzQXJyYXkob2JqZWN0LmRhdGEpKSB7XG4gICAgYXJyYXkgPSBvYmplY3QuZGF0YVxuICAgIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgfVxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICB0aGF0W2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5pZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgQnVmZmVyLnByb3RvdHlwZS5fX3Byb3RvX18gPSBVaW50OEFycmF5LnByb3RvdHlwZVxuICBCdWZmZXIuX19wcm90b19fID0gVWludDhBcnJheVxufSBlbHNlIHtcbiAgLy8gcHJlLXNldCBmb3IgdmFsdWVzIHRoYXQgbWF5IGV4aXN0IGluIHRoZSBmdXR1cmVcbiAgQnVmZmVyLnByb3RvdHlwZS5sZW5ndGggPSB1bmRlZmluZWRcbiAgQnVmZmVyLnByb3RvdHlwZS5wYXJlbnQgPSB1bmRlZmluZWRcbn1cblxuZnVuY3Rpb24gYWxsb2NhdGUgKHRoYXQsIGxlbmd0aCkge1xuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSwgZm9yIGJlc3QgcGVyZm9ybWFuY2VcbiAgICB0aGF0ID0gQnVmZmVyLl9hdWdtZW50KG5ldyBVaW50OEFycmF5KGxlbmd0aCkpXG4gICAgdGhhdC5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBhbiBvYmplY3QgaW5zdGFuY2Ugb2YgdGhlIEJ1ZmZlciBjbGFzc1xuICAgIHRoYXQubGVuZ3RoID0gbGVuZ3RoXG4gICAgdGhhdC5faXNCdWZmZXIgPSB0cnVlXG4gIH1cblxuICB2YXIgZnJvbVBvb2wgPSBsZW5ndGggIT09IDAgJiYgbGVuZ3RoIDw9IEJ1ZmZlci5wb29sU2l6ZSA+Pj4gMVxuICBpZiAoZnJvbVBvb2wpIHRoYXQucGFyZW50ID0gcm9vdFBhcmVudFxuXG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGNoZWNrZWQgKGxlbmd0aCkge1xuICAvLyBOb3RlOiBjYW5ub3QgdXNlIGBsZW5ndGggPCBrTWF4TGVuZ3RoYCBoZXJlIGJlY2F1c2UgdGhhdCBmYWlscyB3aGVuXG4gIC8vIGxlbmd0aCBpcyBOYU4gKHdoaWNoIGlzIG90aGVyd2lzZSBjb2VyY2VkIHRvIHplcm8uKVxuICBpZiAobGVuZ3RoID49IGtNYXhMZW5ndGgoKSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIGFsbG9jYXRlIEJ1ZmZlciBsYXJnZXIgdGhhbiBtYXhpbXVtICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICdzaXplOiAweCcgKyBrTWF4TGVuZ3RoKCkudG9TdHJpbmcoMTYpICsgJyBieXRlcycpXG4gIH1cbiAgcmV0dXJuIGxlbmd0aCB8IDBcbn1cblxuZnVuY3Rpb24gU2xvd0J1ZmZlciAoc3ViamVjdCwgZW5jb2RpbmcpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFNsb3dCdWZmZXIpKSByZXR1cm4gbmV3IFNsb3dCdWZmZXIoc3ViamVjdCwgZW5jb2RpbmcpXG5cbiAgdmFyIGJ1ZiA9IG5ldyBCdWZmZXIoc3ViamVjdCwgZW5jb2RpbmcpXG4gIGRlbGV0ZSBidWYucGFyZW50XG4gIHJldHVybiBidWZcbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gaXNCdWZmZXIgKGIpIHtcbiAgcmV0dXJuICEhKGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlcilcbn1cblxuQnVmZmVyLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlIChhLCBiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGEpIHx8ICFCdWZmZXIuaXNCdWZmZXIoYikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgbXVzdCBiZSBCdWZmZXJzJylcbiAgfVxuXG4gIGlmIChhID09PSBiKSByZXR1cm4gMFxuXG4gIHZhciB4ID0gYS5sZW5ndGhcbiAgdmFyIHkgPSBiLmxlbmd0aFxuXG4gIHZhciBpID0gMFxuICB2YXIgbGVuID0gTWF0aC5taW4oeCwgeSlcbiAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkgYnJlYWtcblxuICAgICsraVxuICB9XG5cbiAgaWYgKGkgIT09IGxlbikge1xuICAgIHggPSBhW2ldXG4gICAgeSA9IGJbaV1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuQnVmZmVyLmlzRW5jb2RpbmcgPSBmdW5jdGlvbiBpc0VuY29kaW5nIChlbmNvZGluZykge1xuICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAncmF3JzpcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIGNvbmNhdCAobGlzdCwgbGVuZ3RoKSB7XG4gIGlmICghaXNBcnJheShsaXN0KSkgdGhyb3cgbmV3IFR5cGVFcnJvcignbGlzdCBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMuJylcblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcigwKVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmID0gbmV3IEJ1ZmZlcihsZW5ndGgpXG4gIHZhciBwb3MgPSAwXG4gIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBsaXN0W2ldXG4gICAgaXRlbS5jb3B5KGJ1ZiwgcG9zKVxuICAgIHBvcyArPSBpdGVtLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIHN0cmluZyAhPT0gJ3N0cmluZycpIHN0cmluZyA9ICcnICsgc3RyaW5nXG5cbiAgdmFyIGxlbiA9IHN0cmluZy5sZW5ndGhcbiAgaWYgKGxlbiA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBVc2UgYSBmb3IgbG9vcCB0byBhdm9pZCByZWN1cnNpb25cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAvLyBEZXByZWNhdGVkXG4gICAgICBjYXNlICdyYXcnOlxuICAgICAgY2FzZSAncmF3cyc6XG4gICAgICAgIHJldHVybiBsZW5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiBsZW4gKiAyXG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gbGVuID4+PiAxXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGggLy8gYXNzdW1lIHV0ZjhcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cbkJ1ZmZlci5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuXG5mdW5jdGlvbiBzbG93VG9TdHJpbmcgKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG5cbiAgc3RhcnQgPSBzdGFydCB8IDBcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgfHwgZW5kID09PSBJbmZpbml0eSA/IHRoaXMubGVuZ3RoIDogZW5kIHwgMFxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG4gIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmIChlbmQgPD0gc3RhcnQpIHJldHVybiAnJ1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGJpbmFyeVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdXRmMTZsZVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9IChlbmNvZGluZyArICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGggfCAwXG4gIGlmIChsZW5ndGggPT09IDApIHJldHVybiAnJ1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCAwLCBsZW5ndGgpXG4gIHJldHVybiBzbG93VG9TdHJpbmcuYXBwbHkodGhpcywgYXJndW1lbnRzKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIGVxdWFscyAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYikgPT09IDBcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gaW5zcGVjdCAoKSB7XG4gIHZhciBzdHIgPSAnJ1xuICB2YXIgbWF4ID0gZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFU1xuICBpZiAodGhpcy5sZW5ndGggPiAwKSB7XG4gICAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5tYXRjaCgvLnsyfS9nKS5qb2luKCcgJylcbiAgICBpZiAodGhpcy5sZW5ndGggPiBtYXgpIHN0ciArPSAnIC4uLiAnXG4gIH1cbiAgcmV0dXJuICc8QnVmZmVyICcgKyBzdHIgKyAnPidcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gMFxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYilcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gaW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0KSB7XG4gIGlmIChieXRlT2Zmc2V0ID4gMHg3ZmZmZmZmZikgYnl0ZU9mZnNldCA9IDB4N2ZmZmZmZmZcbiAgZWxzZSBpZiAoYnl0ZU9mZnNldCA8IC0weDgwMDAwMDAwKSBieXRlT2Zmc2V0ID0gLTB4ODAwMDAwMDBcbiAgYnl0ZU9mZnNldCA+Pj0gMFxuXG4gIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xXG4gIGlmIChieXRlT2Zmc2V0ID49IHRoaXMubGVuZ3RoKSByZXR1cm4gLTFcblxuICAvLyBOZWdhdGl2ZSBvZmZzZXRzIHN0YXJ0IGZyb20gdGhlIGVuZCBvZiB0aGUgYnVmZmVyXG4gIGlmIChieXRlT2Zmc2V0IDwgMCkgYnl0ZU9mZnNldCA9IE1hdGgubWF4KHRoaXMubGVuZ3RoICsgYnl0ZU9mZnNldCwgMClcblxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xIC8vIHNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nIGFsd2F5cyBmYWlsc1xuICAgIHJldHVybiBTdHJpbmcucHJvdG90eXBlLmluZGV4T2YuY2FsbCh0aGlzLCB2YWwsIGJ5dGVPZmZzZXQpXG4gIH1cbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcih2YWwpKSB7XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQpXG4gIH1cbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwodGhpcywgdmFsLCBieXRlT2Zmc2V0KVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKHRoaXMsIFsgdmFsIF0sIGJ5dGVPZmZzZXQpXG4gIH1cblxuICBmdW5jdGlvbiBhcnJheUluZGV4T2YgKGFyciwgdmFsLCBieXRlT2Zmc2V0KSB7XG4gICAgdmFyIGZvdW5kSW5kZXggPSAtMVxuICAgIGZvciAodmFyIGkgPSAwOyBieXRlT2Zmc2V0ICsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFycltieXRlT2Zmc2V0ICsgaV0gPT09IHZhbFtmb3VuZEluZGV4ID09PSAtMSA/IDAgOiBpIC0gZm91bmRJbmRleF0pIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggPT09IC0xKSBmb3VuZEluZGV4ID0gaVxuICAgICAgICBpZiAoaSAtIGZvdW5kSW5kZXggKyAxID09PSB2YWwubGVuZ3RoKSByZXR1cm4gYnl0ZU9mZnNldCArIGZvdW5kSW5kZXhcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvdW5kSW5kZXggPSAtMVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLTFcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbCBtdXN0IGJlIHN0cmluZywgbnVtYmVyIG9yIEJ1ZmZlcicpXG59XG5cbi8vIGBnZXRgIGlzIGRlcHJlY2F0ZWRcbkJ1ZmZlci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0IChvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5nZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLnJlYWRVSW50OChvZmZzZXQpXG59XG5cbi8vIGBzZXRgIGlzIGRlcHJlY2F0ZWRcbkJ1ZmZlci5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0ICh2LCBvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5zZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLndyaXRlVUludDgodiwgb2Zmc2V0KVxufVxuXG5mdW5jdGlvbiBoZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIC8vIG11c3QgYmUgYW4gZXZlbiBudW1iZXIgb2YgZGlnaXRzXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGlmIChzdHJMZW4gJSAyICE9PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaGV4IHN0cmluZycpXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHZhciBwYXJzZWQgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgaWYgKGlzTmFOKHBhcnNlZCkpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBoZXggc3RyaW5nJylcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSBwYXJzZWRcbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiB1dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBhc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYXNjaWlUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJpbmFyeVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGFzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGJhc2U2NFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gdWNzMldyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIHdyaXRlIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZykge1xuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nKVxuICBpZiAob2Zmc2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIG9mZnNldFssIGxlbmd0aF1bLCBlbmNvZGluZ10pXG4gIH0gZWxzZSBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgICBpZiAoaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgbGVuZ3RoID0gbGVuZ3RoIHwgMFxuICAgICAgaWYgKGVuY29kaW5nID09PSB1bmRlZmluZWQpIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgfSBlbHNlIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIC8vIGxlZ2FjeSB3cml0ZShzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXQsIGxlbmd0aCkgLSByZW1vdmUgaW4gdjAuMTNcbiAgfSBlbHNlIHtcbiAgICB2YXIgc3dhcCA9IGVuY29kaW5nXG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBvZmZzZXQgPSBsZW5ndGggfCAwXG4gICAgbGVuZ3RoID0gc3dhcFxuICB9XG5cbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPiByZW1haW5pbmcpIGxlbmd0aCA9IHJlbWFpbmluZ1xuXG4gIGlmICgoc3RyaW5nLmxlbmd0aCA+IDAgJiYgKGxlbmd0aCA8IDAgfHwgb2Zmc2V0IDwgMCkpIHx8IG9mZnNldCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2F0dGVtcHQgdG8gd3JpdGUgb3V0c2lkZSBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBiaW5hcnlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICAvLyBXYXJuaW5nOiBtYXhMZW5ndGggbm90IHRha2VuIGludG8gYWNjb3VudCBpbiBiYXNlNjRXcml0ZVxuICAgICAgICByZXR1cm4gYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHVjczJXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gYnVmLmxlbmd0aCkge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1Zi5zbGljZShzdGFydCwgZW5kKSlcbiAgfVxufVxuXG5mdW5jdGlvbiB1dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG4gIHZhciByZXMgPSBbXVxuXG4gIHZhciBpID0gc3RhcnRcbiAgd2hpbGUgKGkgPCBlbmQpIHtcbiAgICB2YXIgZmlyc3RCeXRlID0gYnVmW2ldXG4gICAgdmFyIGNvZGVQb2ludCA9IG51bGxcbiAgICB2YXIgYnl0ZXNQZXJTZXF1ZW5jZSA9IChmaXJzdEJ5dGUgPiAweEVGKSA/IDRcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4REYpID8gM1xuICAgICAgOiAoZmlyc3RCeXRlID4gMHhCRikgPyAyXG4gICAgICA6IDFcblxuICAgIGlmIChpICsgYnl0ZXNQZXJTZXF1ZW5jZSA8PSBlbmQpIHtcbiAgICAgIHZhciBzZWNvbmRCeXRlLCB0aGlyZEJ5dGUsIGZvdXJ0aEJ5dGUsIHRlbXBDb2RlUG9pbnRcblxuICAgICAgc3dpdGNoIChieXRlc1BlclNlcXVlbmNlKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBpZiAoZmlyc3RCeXRlIDwgMHg4MCkge1xuICAgICAgICAgICAgY29kZVBvaW50ID0gZmlyc3RCeXRlXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4MUYpIDw8IDB4NiB8IChzZWNvbmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3Rikge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweEMgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4NiB8ICh0aGlyZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGRiAmJiAodGVtcENvZGVQb2ludCA8IDB4RDgwMCB8fCB0ZW1wQ29kZVBvaW50ID4gMHhERkZGKSkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBmb3VydGhCeXRlID0gYnVmW2kgKyAzXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAoZm91cnRoQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHgxMiB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHhDIHwgKHRoaXJkQnl0ZSAmIDB4M0YpIDw8IDB4NiB8IChmb3VydGhCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHhGRkZGICYmIHRlbXBDb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb2RlUG9pbnQgPT09IG51bGwpIHtcbiAgICAgIC8vIHdlIGRpZCBub3QgZ2VuZXJhdGUgYSB2YWxpZCBjb2RlUG9pbnQgc28gaW5zZXJ0IGFcbiAgICAgIC8vIHJlcGxhY2VtZW50IGNoYXIgKFUrRkZGRCkgYW5kIGFkdmFuY2Ugb25seSAxIGJ5dGVcbiAgICAgIGNvZGVQb2ludCA9IDB4RkZGRFxuICAgICAgYnl0ZXNQZXJTZXF1ZW5jZSA9IDFcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA+IDB4RkZGRikge1xuICAgICAgLy8gZW5jb2RlIHRvIHV0ZjE2IChzdXJyb2dhdGUgcGFpciBkYW5jZSlcbiAgICAgIGNvZGVQb2ludCAtPSAweDEwMDAwXG4gICAgICByZXMucHVzaChjb2RlUG9pbnQgPj4+IDEwICYgMHgzRkYgfCAweEQ4MDApXG4gICAgICBjb2RlUG9pbnQgPSAweERDMDAgfCBjb2RlUG9pbnQgJiAweDNGRlxuICAgIH1cblxuICAgIHJlcy5wdXNoKGNvZGVQb2ludClcbiAgICBpICs9IGJ5dGVzUGVyU2VxdWVuY2VcbiAgfVxuXG4gIHJldHVybiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkocmVzKVxufVxuXG4vLyBCYXNlZCBvbiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMjc0NzI3Mi82ODA3NDIsIHRoZSBicm93c2VyIHdpdGhcbi8vIHRoZSBsb3dlc3QgbGltaXQgaXMgQ2hyb21lLCB3aXRoIDB4MTAwMDAgYXJncy5cbi8vIFdlIGdvIDEgbWFnbml0dWRlIGxlc3MsIGZvciBzYWZldHlcbnZhciBNQVhfQVJHVU1FTlRTX0xFTkdUSCA9IDB4MTAwMFxuXG5mdW5jdGlvbiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkgKGNvZGVQb2ludHMpIHtcbiAgdmFyIGxlbiA9IGNvZGVQb2ludHMubGVuZ3RoXG4gIGlmIChsZW4gPD0gTUFYX0FSR1VNRU5UU19MRU5HVEgpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNvZGVQb2ludHMpIC8vIGF2b2lkIGV4dHJhIHNsaWNlKClcbiAgfVxuXG4gIC8vIERlY29kZSBpbiBjaHVua3MgdG8gYXZvaWQgXCJjYWxsIHN0YWNrIHNpemUgZXhjZWVkZWRcIi5cbiAgdmFyIHJlcyA9ICcnXG4gIHZhciBpID0gMFxuICB3aGlsZSAoaSA8IGxlbikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFxuICAgICAgU3RyaW5nLFxuICAgICAgY29kZVBvaW50cy5zbGljZShpLCBpICs9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKVxuICAgIClcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldICYgMHg3RilcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGJpbmFyeVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGhleFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcblxuICBpZiAoIXN0YXJ0IHx8IHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmICghZW5kIHx8IGVuZCA8IDAgfHwgZW5kID4gbGVuKSBlbmQgPSBsZW5cblxuICB2YXIgb3V0ID0gJydcbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBvdXQgKz0gdG9IZXgoYnVmW2ldKVxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyBieXRlc1tpICsgMV0gKiAyNTYpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZlxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICBuZXdCdWYgPSBCdWZmZXIuX2F1Z21lbnQodGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSlcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2xpY2VMZW4gPSBlbmQgLSBzdGFydFxuICAgIG5ld0J1ZiA9IG5ldyBCdWZmZXIoc2xpY2VMZW4sIHVuZGVmaW5lZClcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWNlTGVuOyBpKyspIHtcbiAgICAgIG5ld0J1ZltpXSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfVxuXG4gIGlmIChuZXdCdWYubGVuZ3RoKSBuZXdCdWYucGFyZW50ID0gdGhpcy5wYXJlbnQgfHwgdGhpc1xuXG4gIHJldHVybiBuZXdCdWZcbn1cblxuLypcbiAqIE5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgYnVmZmVyIGlzbid0IHRyeWluZyB0byB3cml0ZSBvdXQgb2YgYm91bmRzLlxuICovXG5mdW5jdGlvbiBjaGVja09mZnNldCAob2Zmc2V0LCBleHQsIGxlbmd0aCkge1xuICBpZiAoKG9mZnNldCAlIDEpICE9PSAwIHx8IG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdvZmZzZXQgaXMgbm90IHVpbnQnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gbGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVHJ5aW5nIHRvIGFjY2VzcyBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRMRSA9IGZ1bmN0aW9uIHJlYWRVSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRCRSA9IGZ1bmN0aW9uIHJlYWRVSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG4gIH1cblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdXG4gIHZhciBtdWwgPSAxXG4gIHdoaWxlIChieXRlTGVuZ3RoID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiByZWFkVUludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiByZWFkVUludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgOCkgfCB0aGlzW29mZnNldCArIDFdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICgodGhpc1tvZmZzZXRdKSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikpICtcbiAgICAgICh0aGlzW29mZnNldCArIDNdICogMHgxMDAwMDAwKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdICogMHgxMDAwMDAwKSArXG4gICAgKCh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgIHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludExFID0gZnVuY3Rpb24gcmVhZEludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludEJFID0gZnVuY3Rpb24gcmVhZEludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoXG4gIHZhciBtdWwgPSAxXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0taV1cbiAgd2hpbGUgKGkgPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1pXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiByZWFkSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICBpZiAoISh0aGlzW29mZnNldF0gJiAweDgwKSkgcmV0dXJuICh0aGlzW29mZnNldF0pXG4gIHJldHVybiAoKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gcmVhZEludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIDFdIHwgKHRoaXNbb2Zmc2V0XSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbiByZWFkSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdKSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10gPDwgMjQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiByZWFkSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDI0KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiByZWFkRmxvYXRMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0QkUgPSBmdW5jdGlvbiByZWFkRmxvYXRCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gcmVhZERvdWJsZUJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgNTIsIDgpXG59XG5cbmZ1bmN0aW9uIGNoZWNrSW50IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignYnVmZmVyIG11c3QgYmUgYSBCdWZmZXIgaW5zdGFuY2UnKVxuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCd2YWx1ZSBpcyBvdXQgb2YgYm91bmRzJylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdpbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludExFID0gZnVuY3Rpb24gd3JpdGVVSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSwgMClcblxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludEJFID0gZnVuY3Rpb24gd3JpdGVVSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSwgMClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiB3cml0ZVVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4ZmYsIDApXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHZhbHVlID0gTWF0aC5mbG9vcih2YWx1ZSlcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuZnVuY3Rpb24gb2JqZWN0V3JpdGVVSW50MTYgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuKSB7XG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmICsgdmFsdWUgKyAxXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4oYnVmLmxlbmd0aCAtIG9mZnNldCwgMik7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSAodmFsdWUgJiAoMHhmZiA8PCAoOCAqIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpKSkpID4+PlxuICAgICAgKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkgKiA4XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuZnVuY3Rpb24gb2JqZWN0V3JpdGVVSW50MzIgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuKSB7XG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGJ1Zi5sZW5ndGggLSBvZmZzZXQsIDQpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID0gKHZhbHVlID4+PiAobGl0dGxlRW5kaWFuID8gaSA6IDMgLSBpKSAqIDgpICYgMHhmZlxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludExFID0gZnVuY3Rpb24gd3JpdGVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGggLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IDBcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IHZhbHVlIDwgMCA/IDEgOiAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gdmFsdWUgPCAwID8gMSA6IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uIHdyaXRlSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweDdmLCAtMHg4MClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkgdmFsdWUgPSBNYXRoLmZsb29yKHZhbHVlKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuZnVuY3Rpb24gY2hlY2tJRUVFNzU0IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndmFsdWUgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdpbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5mdW5jdGlvbiB3cml0ZUZsb2F0IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDQsIDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgsIC0zLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gd3JpdGVGbG9hdEJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDgsIDEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4LCAtMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG4gIHJldHVybiBvZmZzZXQgKyA4XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVMRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUJFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuLy8gY29weSh0YXJnZXRCdWZmZXIsIHRhcmdldFN0YXJ0PTAsIHNvdXJjZVN0YXJ0PTAsIHNvdXJjZUVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gY29weSAodGFyZ2V0LCB0YXJnZXRTdGFydCwgc3RhcnQsIGVuZCkge1xuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0U3RhcnQgPj0gdGFyZ2V0Lmxlbmd0aCkgdGFyZ2V0U3RhcnQgPSB0YXJnZXQubGVuZ3RoXG4gIGlmICghdGFyZ2V0U3RhcnQpIHRhcmdldFN0YXJ0ID0gMFxuICBpZiAoZW5kID4gMCAmJiBlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICAvLyBDb3B5IDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVybiAwXG4gIGlmICh0YXJnZXQubGVuZ3RoID09PSAwIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIEZhdGFsIGVycm9yIGNvbmRpdGlvbnNcbiAgaWYgKHRhcmdldFN0YXJ0IDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgfVxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlU3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChlbmQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlRW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIC8vIEFyZSB3ZSBvb2I/XG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCA8IGVuZCAtIHN0YXJ0KSB7XG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0ICsgc3RhcnRcbiAgfVxuXG4gIHZhciBsZW4gPSBlbmQgLSBzdGFydFxuICB2YXIgaVxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQgJiYgc3RhcnQgPCB0YXJnZXRTdGFydCAmJiB0YXJnZXRTdGFydCA8IGVuZCkge1xuICAgIC8vIGRlc2NlbmRpbmcgY29weSBmcm9tIGVuZFxuICAgIGZvciAoaSA9IGxlbiAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIGlmIChsZW4gPCAxMDAwIHx8ICFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIC8vIGFzY2VuZGluZyBjb3B5IGZyb20gc3RhcnRcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0U3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRhcmdldC5fc2V0KHRoaXMuc3ViYXJyYXkoc3RhcnQsIHN0YXJ0ICsgbGVuKSwgdGFyZ2V0U3RhcnQpXG4gIH1cblxuICByZXR1cm4gbGVuXG59XG5cbi8vIGZpbGwodmFsdWUsIHN0YXJ0PTAsIGVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gZmlsbCAodmFsdWUsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCF2YWx1ZSkgdmFsdWUgPSAwXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCkgZW5kID0gdGhpcy5sZW5ndGhcblxuICBpZiAoZW5kIDwgc3RhcnQpIHRocm93IG5ldyBSYW5nZUVycm9yKCdlbmQgPCBzdGFydCcpXG5cbiAgLy8gRmlsbCAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm5cbiAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChlbmQgPCAwIHx8IGVuZCA+IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignZW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIHZhciBpXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgdGhpc1tpXSA9IHZhbHVlXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBieXRlcyA9IHV0ZjhUb0J5dGVzKHZhbHVlLnRvU3RyaW5nKCkpXG4gICAgdmFyIGxlbiA9IGJ5dGVzLmxlbmd0aFxuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIHRoaXNbaV0gPSBieXRlc1tpICUgbGVuXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBgQXJyYXlCdWZmZXJgIHdpdGggdGhlICpjb3BpZWQqIG1lbW9yeSBvZiB0aGUgYnVmZmVyIGluc3RhbmNlLlxuICogQWRkZWQgaW4gTm9kZSAwLjEyLiBPbmx5IGF2YWlsYWJsZSBpbiBicm93c2VycyB0aGF0IHN1cHBvcnQgQXJyYXlCdWZmZXIuXG4gKi9cbkJ1ZmZlci5wcm90b3R5cGUudG9BcnJheUJ1ZmZlciA9IGZ1bmN0aW9uIHRvQXJyYXlCdWZmZXIgKCkge1xuICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgICByZXR1cm4gKG5ldyBCdWZmZXIodGhpcykpLmJ1ZmZlclxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5sZW5ndGgpXG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYnVmLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgIGJ1ZltpXSA9IHRoaXNbaV1cbiAgICAgIH1cbiAgICAgIHJldHVybiBidWYuYnVmZmVyXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0J1ZmZlci50b0FycmF5QnVmZmVyIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyJylcbiAgfVxufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbnZhciBCUCA9IEJ1ZmZlci5wcm90b3R5cGVcblxuLyoqXG4gKiBBdWdtZW50IGEgVWludDhBcnJheSAqaW5zdGFuY2UqIChub3QgdGhlIFVpbnQ4QXJyYXkgY2xhc3MhKSB3aXRoIEJ1ZmZlciBtZXRob2RzXG4gKi9cbkJ1ZmZlci5fYXVnbWVudCA9IGZ1bmN0aW9uIF9hdWdtZW50IChhcnIpIHtcbiAgYXJyLmNvbnN0cnVjdG9yID0gQnVmZmVyXG4gIGFyci5faXNCdWZmZXIgPSB0cnVlXG5cbiAgLy8gc2F2ZSByZWZlcmVuY2UgdG8gb3JpZ2luYWwgVWludDhBcnJheSBzZXQgbWV0aG9kIGJlZm9yZSBvdmVyd3JpdGluZ1xuICBhcnIuX3NldCA9IGFyci5zZXRcblxuICAvLyBkZXByZWNhdGVkXG4gIGFyci5nZXQgPSBCUC5nZXRcbiAgYXJyLnNldCA9IEJQLnNldFxuXG4gIGFyci53cml0ZSA9IEJQLndyaXRlXG4gIGFyci50b1N0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0xvY2FsZVN0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0pTT04gPSBCUC50b0pTT05cbiAgYXJyLmVxdWFscyA9IEJQLmVxdWFsc1xuICBhcnIuY29tcGFyZSA9IEJQLmNvbXBhcmVcbiAgYXJyLmluZGV4T2YgPSBCUC5pbmRleE9mXG4gIGFyci5jb3B5ID0gQlAuY29weVxuICBhcnIuc2xpY2UgPSBCUC5zbGljZVxuICBhcnIucmVhZFVJbnRMRSA9IEJQLnJlYWRVSW50TEVcbiAgYXJyLnJlYWRVSW50QkUgPSBCUC5yZWFkVUludEJFXG4gIGFyci5yZWFkVUludDggPSBCUC5yZWFkVUludDhcbiAgYXJyLnJlYWRVSW50MTZMRSA9IEJQLnJlYWRVSW50MTZMRVxuICBhcnIucmVhZFVJbnQxNkJFID0gQlAucmVhZFVJbnQxNkJFXG4gIGFyci5yZWFkVUludDMyTEUgPSBCUC5yZWFkVUludDMyTEVcbiAgYXJyLnJlYWRVSW50MzJCRSA9IEJQLnJlYWRVSW50MzJCRVxuICBhcnIucmVhZEludExFID0gQlAucmVhZEludExFXG4gIGFyci5yZWFkSW50QkUgPSBCUC5yZWFkSW50QkVcbiAgYXJyLnJlYWRJbnQ4ID0gQlAucmVhZEludDhcbiAgYXJyLnJlYWRJbnQxNkxFID0gQlAucmVhZEludDE2TEVcbiAgYXJyLnJlYWRJbnQxNkJFID0gQlAucmVhZEludDE2QkVcbiAgYXJyLnJlYWRJbnQzMkxFID0gQlAucmVhZEludDMyTEVcbiAgYXJyLnJlYWRJbnQzMkJFID0gQlAucmVhZEludDMyQkVcbiAgYXJyLnJlYWRGbG9hdExFID0gQlAucmVhZEZsb2F0TEVcbiAgYXJyLnJlYWRGbG9hdEJFID0gQlAucmVhZEZsb2F0QkVcbiAgYXJyLnJlYWREb3VibGVMRSA9IEJQLnJlYWREb3VibGVMRVxuICBhcnIucmVhZERvdWJsZUJFID0gQlAucmVhZERvdWJsZUJFXG4gIGFyci53cml0ZVVJbnQ4ID0gQlAud3JpdGVVSW50OFxuICBhcnIud3JpdGVVSW50TEUgPSBCUC53cml0ZVVJbnRMRVxuICBhcnIud3JpdGVVSW50QkUgPSBCUC53cml0ZVVJbnRCRVxuICBhcnIud3JpdGVVSW50MTZMRSA9IEJQLndyaXRlVUludDE2TEVcbiAgYXJyLndyaXRlVUludDE2QkUgPSBCUC53cml0ZVVJbnQxNkJFXG4gIGFyci53cml0ZVVJbnQzMkxFID0gQlAud3JpdGVVSW50MzJMRVxuICBhcnIud3JpdGVVSW50MzJCRSA9IEJQLndyaXRlVUludDMyQkVcbiAgYXJyLndyaXRlSW50TEUgPSBCUC53cml0ZUludExFXG4gIGFyci53cml0ZUludEJFID0gQlAud3JpdGVJbnRCRVxuICBhcnIud3JpdGVJbnQ4ID0gQlAud3JpdGVJbnQ4XG4gIGFyci53cml0ZUludDE2TEUgPSBCUC53cml0ZUludDE2TEVcbiAgYXJyLndyaXRlSW50MTZCRSA9IEJQLndyaXRlSW50MTZCRVxuICBhcnIud3JpdGVJbnQzMkxFID0gQlAud3JpdGVJbnQzMkxFXG4gIGFyci53cml0ZUludDMyQkUgPSBCUC53cml0ZUludDMyQkVcbiAgYXJyLndyaXRlRmxvYXRMRSA9IEJQLndyaXRlRmxvYXRMRVxuICBhcnIud3JpdGVGbG9hdEJFID0gQlAud3JpdGVGbG9hdEJFXG4gIGFyci53cml0ZURvdWJsZUxFID0gQlAud3JpdGVEb3VibGVMRVxuICBhcnIud3JpdGVEb3VibGVCRSA9IEJQLndyaXRlRG91YmxlQkVcbiAgYXJyLmZpbGwgPSBCUC5maWxsXG4gIGFyci5pbnNwZWN0ID0gQlAuaW5zcGVjdFxuICBhcnIudG9BcnJheUJ1ZmZlciA9IEJQLnRvQXJyYXlCdWZmZXJcblxuICByZXR1cm4gYXJyXG59XG5cbnZhciBJTlZBTElEX0JBU0U2NF9SRSA9IC9bXitcXC8wLTlBLVphLXotX10vZ1xuXG5mdW5jdGlvbiBiYXNlNjRjbGVhbiAoc3RyKSB7XG4gIC8vIE5vZGUgc3RyaXBzIG91dCBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSBcXG4gYW5kIFxcdCBmcm9tIHRoZSBzdHJpbmcsIGJhc2U2NC1qcyBkb2VzIG5vdFxuICBzdHIgPSBzdHJpbmd0cmltKHN0cikucmVwbGFjZShJTlZBTElEX0JBU0U2NF9SRSwgJycpXG4gIC8vIE5vZGUgY29udmVydHMgc3RyaW5ncyB3aXRoIGxlbmd0aCA8IDIgdG8gJydcbiAgaWYgKHN0ci5sZW5ndGggPCAyKSByZXR1cm4gJydcbiAgLy8gTm9kZSBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgYmFzZTY0IHN0cmluZ3MgKG1pc3NpbmcgdHJhaWxpbmcgPT09KSwgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHdoaWxlIChzdHIubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgIHN0ciA9IHN0ciArICc9J1xuICB9XG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gc3RyaW5ndHJpbSAoc3RyKSB7XG4gIGlmIChzdHIudHJpbSkgcmV0dXJuIHN0ci50cmltKClcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJylcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyaW5nLCB1bml0cykge1xuICB1bml0cyA9IHVuaXRzIHx8IEluZmluaXR5XG4gIHZhciBjb2RlUG9pbnRcbiAgdmFyIGxlbmd0aCA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIGxlYWRTdXJyb2dhdGUgPSBudWxsXG4gIHZhciBieXRlcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGNvZGVQb2ludCA9IHN0cmluZy5jaGFyQ29kZUF0KGkpXG5cbiAgICAvLyBpcyBzdXJyb2dhdGUgY29tcG9uZW50XG4gICAgaWYgKGNvZGVQb2ludCA+IDB4RDdGRiAmJiBjb2RlUG9pbnQgPCAweEUwMDApIHtcbiAgICAgIC8vIGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoIWxlYWRTdXJyb2dhdGUpIHtcbiAgICAgICAgLy8gbm8gbGVhZCB5ZXRcbiAgICAgICAgaWYgKGNvZGVQb2ludCA+IDB4REJGRikge1xuICAgICAgICAgIC8vIHVuZXhwZWN0ZWQgdHJhaWxcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKGkgKyAxID09PSBsZW5ndGgpIHtcbiAgICAgICAgICAvLyB1bnBhaXJlZCBsZWFkXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhbGlkIGxlYWRcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIDIgbGVhZHMgaW4gYSByb3dcbiAgICAgIGlmIChjb2RlUG9pbnQgPCAweERDMDApIHtcbiAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gdmFsaWQgc3Vycm9nYXRlIHBhaXJcbiAgICAgIGNvZGVQb2ludCA9IChsZWFkU3Vycm9nYXRlIC0gMHhEODAwIDw8IDEwIHwgY29kZVBvaW50IC0gMHhEQzAwKSArIDB4MTAwMDBcbiAgICB9IGVsc2UgaWYgKGxlYWRTdXJyb2dhdGUpIHtcbiAgICAgIC8vIHZhbGlkIGJtcCBjaGFyLCBidXQgbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgIH1cblxuICAgIGxlYWRTdXJyb2dhdGUgPSBudWxsXG5cbiAgICAvLyBlbmNvZGUgdXRmOFxuICAgIGlmIChjb2RlUG9pbnQgPCAweDgwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDEpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goY29kZVBvaW50KVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHg4MDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiB8IDB4QzAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDMpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgfCAweEUwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSA0KSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHgxMiB8IDB4RjAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29kZSBwb2ludCcpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIC8vIE5vZGUncyBjb2RlIHNlZW1zIHRvIGJlIGRvaW5nIHRoaXMgYW5kIG5vdCAmIDB4N0YuLlxuICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpICYgMHhGRilcbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVUb0J5dGVzIChzdHIsIHVuaXRzKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG5cbiAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBoaSA9IGMgPj4gOFxuICAgIGxvID0gYyAlIDI1NlxuICAgIGJ5dGVBcnJheS5wdXNoKGxvKVxuICAgIGJ5dGVBcnJheS5wdXNoKGhpKVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBiYXNlNjRUb0J5dGVzIChzdHIpIHtcbiAgcmV0dXJuIGJhc2U2NC50b0J5dGVBcnJheShiYXNlNjRjbGVhbihzdHIpKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSkgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuIiwidmFyIGxvb2t1cCA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJztcblxuOyhmdW5jdGlvbiAoZXhwb3J0cykge1xuXHQndXNlIHN0cmljdCc7XG5cbiAgdmFyIEFyciA9ICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgPyBVaW50OEFycmF5XG4gICAgOiBBcnJheVxuXG5cdHZhciBQTFVTICAgPSAnKycuY2hhckNvZGVBdCgwKVxuXHR2YXIgU0xBU0ggID0gJy8nLmNoYXJDb2RlQXQoMClcblx0dmFyIE5VTUJFUiA9ICcwJy5jaGFyQ29kZUF0KDApXG5cdHZhciBMT1dFUiAgPSAnYScuY2hhckNvZGVBdCgwKVxuXHR2YXIgVVBQRVIgID0gJ0EnLmNoYXJDb2RlQXQoMClcblx0dmFyIFBMVVNfVVJMX1NBRkUgPSAnLScuY2hhckNvZGVBdCgwKVxuXHR2YXIgU0xBU0hfVVJMX1NBRkUgPSAnXycuY2hhckNvZGVBdCgwKVxuXG5cdGZ1bmN0aW9uIGRlY29kZSAoZWx0KSB7XG5cdFx0dmFyIGNvZGUgPSBlbHQuY2hhckNvZGVBdCgwKVxuXHRcdGlmIChjb2RlID09PSBQTFVTIHx8XG5cdFx0ICAgIGNvZGUgPT09IFBMVVNfVVJMX1NBRkUpXG5cdFx0XHRyZXR1cm4gNjIgLy8gJysnXG5cdFx0aWYgKGNvZGUgPT09IFNMQVNIIHx8XG5cdFx0ICAgIGNvZGUgPT09IFNMQVNIX1VSTF9TQUZFKVxuXHRcdFx0cmV0dXJuIDYzIC8vICcvJ1xuXHRcdGlmIChjb2RlIDwgTlVNQkVSKVxuXHRcdFx0cmV0dXJuIC0xIC8vbm8gbWF0Y2hcblx0XHRpZiAoY29kZSA8IE5VTUJFUiArIDEwKVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBOVU1CRVIgKyAyNiArIDI2XG5cdFx0aWYgKGNvZGUgPCBVUFBFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBVUFBFUlxuXHRcdGlmIChjb2RlIDwgTE9XRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gTE9XRVIgKyAyNlxuXHR9XG5cblx0ZnVuY3Rpb24gYjY0VG9CeXRlQXJyYXkgKGI2NCkge1xuXHRcdHZhciBpLCBqLCBsLCB0bXAsIHBsYWNlSG9sZGVycywgYXJyXG5cblx0XHRpZiAoYjY0Lmxlbmd0aCAlIDQgPiAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuXHRcdH1cblxuXHRcdC8vIHRoZSBudW1iZXIgb2YgZXF1YWwgc2lnbnMgKHBsYWNlIGhvbGRlcnMpXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHR3byBwbGFjZWhvbGRlcnMsIHRoYW4gdGhlIHR3byBjaGFyYWN0ZXJzIGJlZm9yZSBpdFxuXHRcdC8vIHJlcHJlc2VudCBvbmUgYnl0ZVxuXHRcdC8vIGlmIHRoZXJlIGlzIG9ubHkgb25lLCB0aGVuIHRoZSB0aHJlZSBjaGFyYWN0ZXJzIGJlZm9yZSBpdCByZXByZXNlbnQgMiBieXRlc1xuXHRcdC8vIHRoaXMgaXMganVzdCBhIGNoZWFwIGhhY2sgdG8gbm90IGRvIGluZGV4T2YgdHdpY2Vcblx0XHR2YXIgbGVuID0gYjY0Lmxlbmd0aFxuXHRcdHBsYWNlSG9sZGVycyA9ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAyKSA/IDIgOiAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMSkgPyAxIDogMFxuXG5cdFx0Ly8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5cdFx0YXJyID0gbmV3IEFycihiNjQubGVuZ3RoICogMyAvIDQgLSBwbGFjZUhvbGRlcnMpXG5cblx0XHQvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG5cdFx0bCA9IHBsYWNlSG9sZGVycyA+IDAgPyBiNjQubGVuZ3RoIC0gNCA6IGI2NC5sZW5ndGhcblxuXHRcdHZhciBMID0gMFxuXG5cdFx0ZnVuY3Rpb24gcHVzaCAodikge1xuXHRcdFx0YXJyW0wrK10gPSB2XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gMCwgaiA9IDA7IGkgPCBsOyBpICs9IDQsIGogKz0gMykge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxOCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCAxMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA8PCA2KSB8IGRlY29kZShiNjQuY2hhckF0KGkgKyAzKSlcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMDAwKSA+PiAxNilcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMCkgPj4gOClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRpZiAocGxhY2VIb2xkZXJzID09PSAyKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPj4gNClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9IGVsc2UgaWYgKHBsYWNlSG9sZGVycyA9PT0gMSkge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxMCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCA0KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpID4+IDIpXG5cdFx0XHRwdXNoKCh0bXAgPj4gOCkgJiAweEZGKVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdHJldHVybiBhcnJcblx0fVxuXG5cdGZ1bmN0aW9uIHVpbnQ4VG9CYXNlNjQgKHVpbnQ4KSB7XG5cdFx0dmFyIGksXG5cdFx0XHRleHRyYUJ5dGVzID0gdWludDgubGVuZ3RoICUgMywgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcblx0XHRcdG91dHB1dCA9IFwiXCIsXG5cdFx0XHR0ZW1wLCBsZW5ndGhcblxuXHRcdGZ1bmN0aW9uIGVuY29kZSAobnVtKSB7XG5cdFx0XHRyZXR1cm4gbG9va3VwLmNoYXJBdChudW0pXG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcblx0XHRcdHJldHVybiBlbmNvZGUobnVtID4+IDE4ICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDEyICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDYgJiAweDNGKSArIGVuY29kZShudW0gJiAweDNGKVxuXHRcdH1cblxuXHRcdC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcblx0XHRmb3IgKGkgPSAwLCBsZW5ndGggPSB1aW50OC5sZW5ndGggLSBleHRyYUJ5dGVzOyBpIDwgbGVuZ3RoOyBpICs9IDMpIHtcblx0XHRcdHRlbXAgPSAodWludDhbaV0gPDwgMTYpICsgKHVpbnQ4W2kgKyAxXSA8PCA4KSArICh1aW50OFtpICsgMl0pXG5cdFx0XHRvdXRwdXQgKz0gdHJpcGxldFRvQmFzZTY0KHRlbXApXG5cdFx0fVxuXG5cdFx0Ly8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuXHRcdHN3aXRjaCAoZXh0cmFCeXRlcykge1xuXHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHR0ZW1wID0gdWludDhbdWludDgubGVuZ3RoIC0gMV1cblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDIpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz09J1xuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSAyOlxuXHRcdFx0XHR0ZW1wID0gKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDJdIDw8IDgpICsgKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMTApXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPj4gNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDIpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9J1xuXHRcdFx0XHRicmVha1xuXHRcdH1cblxuXHRcdHJldHVybiBvdXRwdXRcblx0fVxuXG5cdGV4cG9ydHMudG9CeXRlQXJyYXkgPSBiNjRUb0J5dGVBcnJheVxuXHRleHBvcnRzLmZyb21CeXRlQXJyYXkgPSB1aW50OFRvQmFzZTY0XG59KHR5cGVvZiBleHBvcnRzID09PSAndW5kZWZpbmVkJyA/ICh0aGlzLmJhc2U2NGpzID0ge30pIDogZXhwb3J0cykpXG4iLCJleHBvcnRzLnJlYWQgPSBmdW5jdGlvbiAoYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbVxuICB2YXIgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIG5CaXRzID0gLTdcbiAgdmFyIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMFxuICB2YXIgZCA9IGlzTEUgPyAtMSA6IDFcbiAgdmFyIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV1cblxuICBpICs9IGRcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBzID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBlTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSBlICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgZSA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gbUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gbSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhc1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSlcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pXG4gICAgZSA9IGUgLSBlQmlhc1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pXG59XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbiAoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGNcbiAgdmFyIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMClcbiAgdmFyIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKVxuICB2YXIgZCA9IGlzTEUgPyAxIDogLTFcbiAgdmFyIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDBcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKVxuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwXG4gICAgZSA9IGVNYXhcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMilcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS1cbiAgICAgIGMgKj0gMlxuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gY1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcylcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKytcbiAgICAgIGMgLz0gMlxuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDBcbiAgICAgIGUgPSBlTWF4XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICh2YWx1ZSAqIGMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gZSArIGVCaWFzXG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IDBcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KSB7fVxuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG1cbiAgZUxlbiArPSBtTGVuXG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCkge31cblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjhcbn1cbiIsInZhciB0b1N0cmluZyA9IHt9LnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKGFycikge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChhcnIpID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBSZWZsdXguY3JlYXRlQWN0aW9ucyhcbiAgW1wiZ2V0Q291cnNlSW5mb1wiXVxuKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZUFjdGlvbnMoXG4gIFtcImNyZWF0ZVRvYXN0XCJdXG4pOyIsIm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZUFjdGlvbnMoXG4gIFtcbiAgXCJ1cGRhdGVDb3Vyc2VzXCIsXG4gIFwidXBkYXRlUHJlZmVyZW5jZXNcIixcbiAgXCJsb2FkUHJlc2V0VGltZXRhYmxlXCIsXG4gIFwic2V0U2Nob29sXCIsXG4gIFwic2V0Q291cnNlc0xvYWRpbmdcIixcbiAgXCJzZXRDb3Vyc2VzRG9uZUxvYWRpbmdcIixcbiAgXCJzZXRDdXJyZW50SW5kZXhcIixcbiAgXVxuKTtcbiIsInZhciBSb290ID0gcmVxdWlyZSgnLi9yb290Jyk7XG52YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcycpO1xuX1NFTUVTVEVSID0gXCJTXCI7XG5cbnZhciBkYXRhID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnN1YnN0cmluZygxKTsgLy8gbG9hZGluZyB0aW1ldGFibGUgZGF0YSBmcm9tIHVybFxuaWYgKCFkYXRhICYmIHR5cGVvZihTdG9yYWdlKSAhPT0gXCJ1bmRlZmluZWRcIikgeyAvLyBkaWRuJ3QgZmluZCBpbiBVUkwsIHRyeSBsb2NhbCBzdG9yYWdlXG4gICAgZGF0YSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdkYXRhJyk7XG59IFxuXG5SZWFjdERPTS5yZW5kZXIoXG4gIDxSb290IGRhdGE9e2RhdGF9Lz4sXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlJylcbik7XG5cblxuXG5cbmlmIChkYXRhKSB7XG5cdFRpbWV0YWJsZUFjdGlvbnMubG9hZFByZXNldFRpbWV0YWJsZShkYXRhKTtcbn1cbiIsInZhciBTZWFyY2hCYXIgPSByZXF1aXJlKCcuL3NlYXJjaF9iYXInKTtcbnZhciBQcmVmZXJlbmNlTWVudSA9IHJlcXVpcmUoJy4vcHJlZmVyZW5jZV9tZW51Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJjb250cm9sLWJhclwiPlxuICAgICAgICA8ZGl2IGlkPVwic2VhcmNoLWJhci1jb250YWluZXJcIj5cbiAgICAgICAgICA8U2VhcmNoQmFyIHRvZ2dsZU1vZGFsPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsfSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPFByZWZlcmVuY2VNZW51IC8+XG4gICAgICA8L2Rpdj5cblxuICAgICk7XG4gIH0sXG59KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtzaG93X2xpbmtfcG9wb3ZlcjogZmFsc2V9O1xuXHR9LFxuXG4gIFx0Z2V0U2hhcmVMaW5rOiBmdW5jdGlvbigpIHtcbiAgICBcdHZhciBsaW5rID0gd2luZG93LmxvY2F0aW9uLmhvc3QgKyBcIi9cIjtcbiAgICBcdHZhciBkYXRhID0gdGhpcy5wcm9wcy5nZXREYXRhKCk7XG4gICAgXHRyZXR1cm4gbGluayArIGRhdGE7XG4gIFx0fSxcblxuICBcdHRvZ2dsZUxpbmtQb3BvdmVyOiBmdW5jdGlvbihldmVudCkge1xuXHRcdHRoaXMuc2V0U3RhdGUoe3Nob3dfbGlua19wb3BvdmVyOiAhdGhpcy5zdGF0ZS5zaG93X2xpbmtfcG9wb3Zlcn0pO1xuICBcdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgcG9wID0gdGhpcy5zdGF0ZS5zaG93X2xpbmtfcG9wb3ZlciA/IFxuXHRcdCg8ZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb3B5LWFycm93LXVwXCI+PC9kaXY+XG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvcHktY29udGVudFwiPlxuXHRcdFx0XHRUaGUgbGluayBmb3IgdGhpcyB0aW1ldGFibGUgaXMgYmVsb3cuIENvcHkgaXQgdG8gZWFzaWx5IHNoYXJlIHlvdXIgc2NoZWR1bGUgd2l0aCBmcmllbmRzLlxuXHRcdFx0XHQ8aW5wdXQgb25DbGljaz17dGhpcy5oaWdobGlnaHRBbGx9IFxuXHRcdFx0XHRyZWY9XCJsaW5rXCIgY2xhc3NOYW1lPVwiY29weS10ZXh0XCIgXG5cdFx0XHRcdHZhbHVlPXt0aGlzLmdldFNoYXJlTGluaygpfT48L2lucHV0PlxuXHRcdFx0PC9kaXY+XG5cdFx0PC9kaXY+KSA6XG5cdFx0bnVsbDtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyaWdodCBjb3B5LWJ1dHRvblwiPlxuXHRcdFx0PGEgY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5IGNhbGVuZGFyLWZ1bmN0aW9uXCIgb25DbGljaz17dGhpcy50b2dnbGVMaW5rUG9wb3Zlcn0+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZ1aS1jbGlwXCI+PC9zcGFuPlxuICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAge3BvcH1cblxuICAgICAgICAgICAgPC9kaXY+XG5cdFx0KTtcblx0fSxcblx0aGlnaGxpZ2h0QWxsOiBmdW5jdGlvbihlKSB7XG5cdFx0dGhpcy5yZWZzLmxpbmsuc2VsZWN0KCk7XG5cdH0sXG5cdGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCF0aGlzLnN0YXRlLnNob3dfbGlua19wb3BvdmVyKSB7cmV0dXJuO31cblx0XHR0aGlzLmhpZ2hsaWdodEFsbCgpO1xuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHQkKGRvY3VtZW50KS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHR2YXIgdGFyZ2V0ID0gJChlLnRhcmdldCk7XG5cdFx0XHRpZiAoKHRhcmdldCkuaXMoJy5jb3B5LWJ1dHRvbiAqLCAuY29weS1idXR0b24nKSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRpZiAodGhpcy5zdGF0ZS5zaG93X2xpbmtfcG9wb3Zlcikge1xuXHRcdFx0XHR0aGlzLnNldFN0YXRlKHtzaG93X2xpbmtfcG9wb3ZlcjogZmFsc2V9KTtcblx0XHRcdH1cblxuXHRcdH0uYmluZCh0aGlzKSk7XG5cdH0sXG5cbn0pOyIsInZhciBTaWRlU2Nyb2xsZXIgPSByZXF1aXJlKCcuL3NpZGVfc2Nyb2xsZXIuanN4Jyk7XG5cblxudmFyIEV2YWx1YXRpb24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNsYXNzZXMgPSB0aGlzLnByb3BzLm1pbmkgPyBcImV2YWwtaXRlbSBldmFsLW1pbmlcIiA6IFwiZXZhbC1pdGVtIHNlbGVjdGVkXCI7XG5cdFx0dmFyIGRldGFpbHMgPSBwcm9mID0gbnVsbDtcblxuXHRcdGlmICghdGhpcy5wcm9wcy5taW5pKSB7IC8vIG9ubHkgc2hvdyBleHRyYSBpbmZvcm1hdGlvbiBpZiB0aGlzIGV2YWwgaXNuJ3QgbWluaVxuXHRcdFx0Ly8gKGkuZS4gZnVsbCBldmFsdWF0aW9uLCBub3QgbmF2IGl0ZW0gZm9yIGZ1bGwgZXZhbHVhdGlvbnMpXG5cdFx0XHR2YXIgZGV0YWlscyA9IChcblx0XHRcdFx0PGRpdiBpZD1cImRldGFpbHNcIj57dGhpcy5wcm9wcy5ldmFsX2RhdGEuc3VtbWFyeS5yZXBsYWNlKC9cXHUwMGEwL2csIFwiIFwiKX08L2Rpdj5cblx0XHRcdCk7XG5cdFx0XHR2YXIgcHJvZiA9IChcblx0XHRcdFx0PGRpdiBpZD1cInByb2ZcIj48Yj5Qcm9mZXNzb3I6IHt0aGlzLnByb3BzLmV2YWxfZGF0YS5wcm9mZXNzb3J9PC9iPjwvZGl2PlxuXHRcdFx0KTtcblx0XHR9XHRcbiBcdFx0XG5cdFx0dmFyIHllYXIgPSB0aGlzLnByb3BzLmV2YWxfZGF0YS55ZWFyLmluZGV4T2YoXCI6XCIpID4gLTEgPyBcblx0XHQodGhpcy5wcm9wcy5ldmFsX2RhdGEueWVhci5yZXBsYWNlKFwiOlwiLCBcIiBcIikpIDpcblx0XHQodGhpcy5wcm9wcy5ldmFsX2RhdGEueWVhcik7XG5cdFx0cmV0dXJuIChcblx0XHQ8ZGl2IGNsYXNzTmFtZT17Y2xhc3Nlc30+XG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImV2YWwtd3JhcHBlclwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInllYXJcIj48Yj57eWVhcn08L2I+PC9kaXY+XG5cdFx0XHRcdHtwcm9mfVxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJhdGluZy13cmFwcGVyXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzdGFyLXJhdGluZ3Mtc3ByaXRlIGV2YWwtc3RhcnNcIj5cblx0XHRcdFx0XHRcdDxzcGFuIHN0eWxlPXt7d2lkdGg6IDEwMCp0aGlzLnByb3BzLmV2YWxfZGF0YS5zY29yZS81ICsgXCIlXCJ9fSBjbGFzc05hbWU9XCJyYXRpbmdcIj48L3NwYW4+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJudW1lcmljLXJhdGluZ1wiPjxiPntcIihcIiArIHRoaXMucHJvcHMuZXZhbF9kYXRhLnNjb3JlICsgXCIpXCJ9PC9iPjwvZGl2PlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdFx0e2RldGFpbHN9XG5cdFx0PC9kaXY+KTtcblx0fSxcbn0pO1xuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cblx0XHR2YXIgbmF2cyA9IHRoaXMucHJvcHMuZXZhbF9pbmZvLm1hcChmdW5jdGlvbihlKSB7XG5cdFx0XHRyZXR1cm4gKDxFdmFsdWF0aW9uIGV2YWxfZGF0YT17ZX0ga2V5PXtlLmlkfSBtaW5pPXt0cnVlfSAvPik7XG5cdFx0fS5iaW5kKHRoaXMpKTtcblxuXHRcdHZhciBldmFscyA9IHRoaXMucHJvcHMuZXZhbF9pbmZvLm1hcChmdW5jdGlvbihlKSB7XG5cdFx0XHRyZXR1cm4gKDxFdmFsdWF0aW9uIGV2YWxfZGF0YT17ZX0ga2V5PXtlLmlkfSAvPik7XG5cdFx0fS5iaW5kKHRoaXMpKTtcblxuXHRcdHZhciBjbGlja19ub3RpY2UgPSB0aGlzLnByb3BzLmV2YWxfaW5mby5sZW5ndGggPT0gMCA/ICg8ZGl2IGlkPVwiZW1wdHktaW50cm9cIj5ObyBjb3Vyc2UgZXZhbHVhdGlvbnMgZm9yIHRoaXMgY291cnNlIHlldC48L2Rpdj4pIFxuXHRcdDogKDxkaXYgaWQ9XCJjbGljay1pbnRyb1wiPkNsaWNrIGFuIGV2YWx1YXRpb24gaXRlbSBhYm92ZSB0byByZWFkIHRoZSBjb21tZW50cy48L2Rpdj4pO1xuXHRcdFxuXG5cdFx0dmFyIGV2YWx1YXRpb25fc2Nyb2xsZXIgPSAoPGRpdiBjbGFzc05hbWU9XCJlbXB0eS1pbnRyb1wiPk5vIGNvdXJzZSBldmFsdWF0aW9ucyBmb3IgdGhpcyBjb3Vyc2UgeWV0LjwvZGl2Pik7XG5cdFx0dmFyIGN1c3RvbV9jbGFzcyA9IFwiXCI7XG5cdFx0aWYgKGV2YWxzLmxlbmd0aCA+IDApIHtcblx0XHRcdGV2YWx1YXRpb25fc2Nyb2xsZXIgPSAoPFNpZGVTY3JvbGxlciBcblx0XHRcdG5hdl9pdGVtcz17bmF2c31cblx0XHRcdGNvbnRlbnQ9e2V2YWxzfVxuXHRcdFx0aWQ9e1wiZXZhbHVhdGlvbnMtY2Fyb3VzZWxcIn0vPik7XG5cdFx0XHRjdXN0b21fY2xhc3MgPSBcInNwYWNpb3VzLWVudHJ5XCI7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIChcblx0XHQ8ZGl2IGNsYXNzTmFtZT17XCJtb2RhbC1lbnRyeSBcIiArIGN1c3RvbV9jbGFzc30gaWQ9XCJjb3Vyc2UtZXZhbHVhdGlvbnNcIj5cblx0XHRcdDxoNj5Db3Vyc2UgRXZhbHVhdGlvbnM6PC9oNj5cblx0XHRcdHtldmFsdWF0aW9uX3Njcm9sbGVyfVxuXHRcdDwvZGl2Pik7XG5cdH0sXG5cbn0pOyIsIm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgaWQ9XCJsb2FkXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlLWdyaWRcIj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlMVwiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmUyXCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTNcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlNFwiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmU1XCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTZcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlN1wiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmU4XCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTlcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2Pik7XG5cdH0sXG59KTtcblxuIiwidmFyIExvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyJyk7XG52YXIgQ291cnNlSW5mb1N0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvY291cnNlX2luZm8nKTtcbnZhciBFdmFsdWF0aW9uTWFuYWdlciA9IHJlcXVpcmUoJy4vZXZhbHVhdGlvbnMuanN4Jyk7XG52YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFVwZGF0ZVRpbWV0YWJsZXNTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgQ291cnNlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy9jb3Vyc2VfYWN0aW9ucycpO1xudmFyIFNlY3Rpb25TbG90ID0gcmVxdWlyZSgnLi9zZWN0aW9uX3Nsb3QuanN4Jyk7XG52YXIgU2lkZVNjcm9sbGVyID0gcmVxdWlyZSgnLi9zaWRlX3Njcm9sbGVyLmpzeCcpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRtaXhpbnM6IFtSZWZsdXguY29ubmVjdChDb3Vyc2VJbmZvU3RvcmUpXSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBsb2FkaW5nID0gdGhpcy5zdGF0ZS5pbmZvX2xvYWRpbmc7XG5cdFx0dmFyIGxvYWRlciA9IGxvYWRpbmcgPyA8TG9hZGVyIC8+IDogbnVsbDtcblx0XHR2YXIgaGVhZGVyID0gbG9hZGluZyA/IG51bGwgOiB0aGlzLmdldEhlYWRlcigpO1xuXHRcdHZhciBkZXNjcmlwdGlvbiA9IGxvYWRpbmcgPyBudWxsIDogdGhpcy5nZXREZXNjcmlwdGlvbigpO1xuXHRcdHZhciBldmFsdWF0aW9ucyA9IGxvYWRpbmcgPyBudWxsIDogdGhpcy5nZXRFdmFsdWF0aW9ucygpO1xuXG5cdFx0dmFyIHJlY29tZW5kYXRpb25zID0gbG9hZGluZyA/IG51bGwgOiB0aGlzLmdldFJlY29tZW5kYXRpb25zKCk7XG5cdFx0dmFyIHRleHRib29rcyA9IGxvYWRpbmcgPyBudWxsIDogdGhpcy5nZXRUZXh0Ym9va3MoKTtcblx0XHR2YXIgc2VjdGlvbnMgPSBsb2FkaW5nID8gbnVsbCA6IHRoaXMuZ2V0U2VjdGlvbnMoKTtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBpZD1cIm1vZGFsLWNvbnRlbnRcIj5cblx0XHRcdFx0PGkgY2xhc3NOYW1lPVwicmlnaHQgZmEgZmEtMnggZmEtdGltZXMgY2xvc2UtY291cnNlLW1vZGFsXCIgb25DbGljaz17dGhpcy5wcm9wcy5oaWRlfT48L2k+XG4gICAgICAgICAgICAgICAge2xvYWRlcn1cbiAgICAgICAgICAgICAgICB7aGVhZGVyfVxuICAgICAgICAgICAgICAgIHtkZXNjcmlwdGlvbn1cbiAgICAgICAgICAgICAgICB7c2VjdGlvbnN9XG4gICAgICAgICAgICAgICAge2V2YWx1YXRpb25zfVxuICAgICAgICAgICAgICAgIHt0ZXh0Ym9va3N9XG4gICAgICAgICAgICAgICAge3JlY29tZW5kYXRpb25zfVxuICAgICAgICAgICAgPC9kaXY+KTtcblx0fSxcblxuXHRnZXRIZWFkZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjb3Vyc2VfaWQgPSB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLmlkO1xuXHRcdHZhciBjX3RvX3MgPSB0aGlzLnByb3BzLmNvdXJzZXNfdG9fc2VjdGlvbnM7XG5cdFx0dmFyIGFkZF9vcl9yZW1vdmUgPSBPYmplY3Qua2V5cyhjX3RvX3MpLmluZGV4T2YoU3RyaW5nKGNvdXJzZV9pZCkpID4gLTEgP1xuXHRcdCg8c3BhbiBjbGFzc05hbWU9XCJjb3Vyc2UtYWN0aW9uIGZ1aS1jaGVja1wiIG9uQ2xpY2s9e3RoaXMudG9nZ2xlQ291cnNlKHRydWUpfS8+KSA6IFxuXHRcdCg8c3BhbiBjbGFzc05hbWU9XCJjb3Vyc2UtYWN0aW9uIGZ1aS1wbHVzXCIgb25DbGljaz17dGhpcy50b2dnbGVDb3Vyc2UoZmFsc2UpfS8+KTtcblx0XHR2YXIgaGVhZGVyID0gKDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtaGVhZGVyXCI+XG5cdFx0XHR7YWRkX29yX3JlbW92ZX1cblx0XHRcdDxkaXYgaWQ9XCJjb3Vyc2UtaW5mby13cmFwcGVyXCI+XG5cdFx0XHRcdDxkaXYgaWQ9XCJuYW1lXCI+e3RoaXMuc3RhdGUuY291cnNlX2luZm8ubmFtZX08L2Rpdj5cblx0XHRcdFx0PGRpdiBpZD1cImNvZGVcIj57dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5jb2RlfTwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0PC9kaXY+KTtcblx0XHRyZXR1cm4gaGVhZGVyO1xuXHR9LFxuXHR0b2dnbGVDb3Vyc2U6IGZ1bmN0aW9uKHJlbW92aW5nKSB7XG5cdFx0Ly8gaWYgcmVtb3ZpbmcgaXMgdHJ1ZSwgd2UncmUgcmVtb3ZpbmcgdGhlIGNvdXJzZSwgaWYgZmFsc2UsIHdlJ3JlIGFkZGluZyBpdFxuXHRcdHJldHVybiAoZnVuY3Rpb24gKCkge1xuXHRcdFx0VGltZXRhYmxlQWN0aW9ucy51cGRhdGVDb3Vyc2VzKHtpZDogdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5pZCwgc2VjdGlvbjogJycsIHJlbW92aW5nOiByZW1vdmluZ30pO1xuXHRcdFx0aWYgKCFyZW1vdmluZykge1xuXHRcdFx0XHR0aGlzLnByb3BzLmhpZGUoKTtcblx0XHRcdH1cblx0XHR9LmJpbmQodGhpcykpO1xuXG5cdH0sXG5cdG9wZW5SZWNvbWVuZGF0aW9uOiBmdW5jdGlvbihjb3Vyc2VfaWQpIHtcblx0XHRyZXR1cm4gKGZ1bmN0aW9uKCkge1xuXHRcdFx0Q291cnNlQWN0aW9ucy5nZXRDb3Vyc2VJbmZvKHRoaXMucHJvcHMuc2Nob29sLCBjb3Vyc2VfaWQpO1xuXHRcdH0uYmluZCh0aGlzKSk7XG5cdH0sXG5cblx0Z2V0RGVzY3JpcHRpb246IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBkZXNjcmlwdGlvbiA9IFxuXHRcdFx0KDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZW50cnlcIiBpZD1cImNvdXJzZS1kZXNjcmlwdGlvblwiPlxuXHRcdFx0XHQ8aDY+RGVzY3JpcHRpb246PC9oNj5cblx0XHRcdFx0e3RoaXMuc3RhdGUuY291cnNlX2luZm8uZGVzY3JpcHRpb259XG5cdFx0XHQ8L2Rpdj4pXG5cdFx0cmV0dXJuIGRlc2NyaXB0aW9uO1xuXHR9LFxuXG5cdGdldEV2YWx1YXRpb25zOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gPEV2YWx1YXRpb25NYW5hZ2VyIGV2YWxfaW5mbz17dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5ldmFsX2luZm99IC8+XG5cdH0sXG5cblx0Z2V0UmVjb21lbmRhdGlvbnM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciByZWxhdGVkID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5yZWxhdGVkX2NvdXJzZXMuc2xpY2UoMCwzKS5tYXAoZnVuY3Rpb24ocmMpIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBcdDxkaXYgY2xhc3NOYW1lPVwicmVjb21tZW5kYXRpb25cIiBvbkNsaWNrPXt0aGlzLm9wZW5SZWNvbWVuZGF0aW9uKHJjLmlkKX0ga2V5PXtyYy5pZH0+XG4gICAgICAgICAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJjZW50ZXItd3JhcHBlclwiPlxuXHQgICAgICAgICAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJyZWMtd3JhcHBlclwiPlxuXHRcdCAgICAgICAgICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm5hbWVcIj57cmMubmFtZX08L2Rpdj5cblx0XHQgICAgICAgICAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2RlXCI+e3JjLmNvZGV9PC9kaXY+XG5cdFx0ICAgICAgICAgICAgXHQ8L2Rpdj5cblx0XHQgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIFx0PC9kaXY+KVxuICAgICAgICB9LmJpbmQodGhpcykpO1xuXHRcdHZhciByZWNvbWVuZGF0aW9ucyA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8ucmVsYXRlZF9jb3Vyc2VzLmxlbmd0aCA9PSAwID8gbnVsbCA6XG5cdFx0XHQoPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1lbnRyeVwiPlxuXHRcdFx0XHQ8aDY+Q291cnNlcyBZb3UgTWlnaHQgTGlrZTo8L2g2PlxuXHRcdFx0XHQ8ZGl2IGlkPVwiY291cnNlLXJlY29tZW5kYXRpb25zXCI+XG5cdFx0XHRcdFx0e3JlbGF0ZWR9XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+KVxuXHRcdHJldHVybiByZWNvbWVuZGF0aW9ucztcblx0fSxcblxuXHRleHBhbmRSZWNvbWVuZGF0aW9uczogZnVuY3Rpb24oKSB7XG5cblx0fSxcblxuXHRnZXRUZXh0Ym9va3M6IGZ1bmN0aW9uKCkge1xuXG5cdFx0aWYodGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby50ZXh0Ym9va19pbmZvWzBdID09IHVuZGVmaW5lZCkge3JldHVybiBudWxsO31cblx0XHRcblx0XHR2YXIgdGV4dGJvb2tfZWxlbWVudHMgPSB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnRleHRib29rX2luZm9bMF0udGV4dGJvb2tzLm1hcChmdW5jdGlvbih0Yikge1xuICAgICAgICAgICBcbiAgICAgICAgICAgXHRyZXR1cm4gKFxuXHRcdFx0XHQ8YSBjbGFzc05hbWU9XCJ0ZXh0Ym9va1wiIGhyZWY9e3RiLmRldGFpbF91cmx9IHRhcmdldD1cIl9ibGFua1wiIGtleT17dGIuaWR9PlxuXHQgICAgICAgICAgICAgICAgPGltZyBoZWlnaHQ9XCIxMjVcIiBzcmM9e3RiLmltYWdlX3VybH0vPlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtb2R1bGVcIj5cblx0ICAgICAgICAgICAgICAgICAgPGg2IGNsYXNzTmFtZT1cImxpbmUtY2xhbXBcIj57dGIudGl0bGV9PC9oNj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGltZyBzcmM9XCJodHRwczovL2ltYWdlcy1uYS5zc2wtaW1hZ2VzLWFtYXpvbi5jb20vaW1hZ2VzL0cvMDEvYXNzb2NpYXRlcy9yZW1vdGUtYnV5LWJveC9idXk1Ll9WMTkyMjA3NzM5Xy5naWZcIiB3aWR0aD1cIjEyMFwiIGhlaWdodD1cIjI4XCIgYm9yZGVyPVwiMFwiLz5cblx0ICAgICAgICAgICAgPC9hPik7XG5cbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcblx0XHR2YXIgdGV4dGJvb2tzID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby50ZXh0Ym9va19pbmZvWzBdLnRleHRib29rcy5sZW5ndGggPT0gMCA/ICg8ZGl2IGlkPVwiZW1wdHktaW50cm9cIj5ObyB0ZXh0Ym9va3MgZm9yIHRoaXMgY291cnNlIHlldC48L2Rpdj4pIDpcblx0XHRcdFx0KDxkaXYgaWQ9XCJ0ZXh0Ym9va3NcIj5cblx0ICAgICAgICAgICAgXHR7dGV4dGJvb2tfZWxlbWVudHN9XG5cdCAgICAgICAgICAgIDwvZGl2Pik7XG5cdFx0dmFyIHJldCA9IFxuXHRcdFx0KDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZW50cnlcIiBpZD1cImNvdXJzZS10ZXh0Ym9va3NcIj5cblx0XHRcdFx0PGg2PlRleHRib29rczo8L2g2PlxuXHRcdFx0XHR7dGV4dGJvb2tzfVxuXHRcdFx0PC9kaXY+KTtcblx0XHRyZXR1cm4gcmV0O1xuXHR9LFxuXG5cdGdldFNlY3Rpb25zOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY291bnQgPSB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnNlY3Rpb25zX1MubGVuZ3RoO1xuXHRcdHZhciBTID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5zZWN0aW9uc19TLm1hcChmdW5jdGlvbihzLCBpKXtcblx0XHRcdHJldHVybiAoPFNlY3Rpb25TbG90IGtleT17aX1cblx0XHRcdFx0dW5pcXVlPXtpfVxuXHRcdFx0XHRhbGxfc2VjdGlvbnM9e3RoaXMuc3RhdGUuY291cnNlX2luZm8uc2VjdGlvbnNfU19vYmpzfSBcblx0XHRcdFx0c2VjdGlvbj17c30vPilcblx0XHR9LmJpbmQodGhpcykpO1xuXHRcdHZhciBzZWN0aW9uX3Njcm9sbGVyID0gKDxkaXYgY2xhc3NOYW1lPVwiZW1wdHktaW50cm9cIj5ObyBzZWN0aW9ucyBmb3VuZCBmb3IgdGhpcyBjb3Vyc2UuPC9kaXY+KTtcblx0XHRpZiAoUy5sZW5ndGggPiAwKSB7XG5cdFx0XHRzZWN0aW9uX3Njcm9sbGVyID0gKDxTaWRlU2Nyb2xsZXIgXG5cdFx0XHRzbGlkZXNUb1Nob3c9ezJ9XG5cdFx0XHRjb250ZW50PXtTfVxuXHRcdFx0aWQ9e1wic2VjdGlvbnMtY2Fyb3VzZWxcIn0vPik7XG5cdFx0fVxuXHRcdHZhciBzZWN0aW9ucyA9IFxuXHRcdFx0KDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZW50cnkgc3BhY2lvdXMtZW50cnlcIiBpZD1cImNvdXJzZS1zZWN0aW9uc1wiPlxuXHRcdFx0XHQ8aDY+Q291cnNlIFNlY3Rpb25zOjwvaDY+XG5cdFx0XHRcdHtzZWN0aW9uX3Njcm9sbGVyfVxuXHRcdFx0PC9kaXY+KTtcblx0XHRyZXR1cm4gc2VjdGlvbnM7XG5cdH0sXG5cblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2hvd19zZWN0aW9uczogMFxuXHRcdH07XG5cdH0sXG5cblx0c2V0U2hvd1NlY3Rpb25zOiBmdW5jdGlvbihpZCkge1xuXHRcdHJldHVybiAoZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLnNldFN0YXRlKHtzaG93X3NlY3Rpb25zOiBpZH0pO1xuXHRcdH0uYmluZCh0aGlzKSk7XG5cdH0sXG5cblxufSk7XG5cbiIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9yZWFjdCA9IFJlYWN0O1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9yZWFjdERvbSA9IFJlYWN0RE9NO1xuXG52YXIgX3JlYWN0RG9tMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0RG9tKTtcblxudmFyIF9yZWFjdFR3ZWVuU3RhdGUgPSByZXF1aXJlKCcuL3JlYWN0LXR3ZWVuLXN0YXRlJyk7XG5cbnZhciBfcmVhY3RUd2VlblN0YXRlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0VHdlZW5TdGF0ZSk7XG5cbnZhciBfZGVjb3JhdG9ycyA9IHJlcXVpcmUoJy4vZGVjb3JhdG9ycycpO1xuXG52YXIgX2RlY29yYXRvcnMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZGVjb3JhdG9ycyk7XG5cbnZhciBfb2JqZWN0QXNzaWduID0gcmVxdWlyZSgnLi9vYmplY3QtYXNzaWduJyk7XG5cbnZhciBfb2JqZWN0QXNzaWduMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX29iamVjdEFzc2lnbik7XG5cbnZhciBfZXhlbnYgPSByZXF1aXJlKCcuL2V4ZW52Jyk7XG5cbnZhciBfZXhlbnYyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZXhlbnYpO1xuXG52YXIgYWRkRXZlbnQgPSBmdW5jdGlvbiBhZGRFdmVudChlbGVtLCB0eXBlLCBldmVudEhhbmRsZSkge1xuICBpZiAoZWxlbSA9PT0gbnVsbCB8fCB0eXBlb2YgZWxlbSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGVsZW0uYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgIGVsZW0uYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBldmVudEhhbmRsZSwgZmFsc2UpO1xuICB9IGVsc2UgaWYgKGVsZW0uYXR0YWNoRXZlbnQpIHtcbiAgICBlbGVtLmF0dGFjaEV2ZW50KCdvbicgKyB0eXBlLCBldmVudEhhbmRsZSk7XG4gIH0gZWxzZSB7XG4gICAgZWxlbVsnb24nICsgdHlwZV0gPSBldmVudEhhbmRsZTtcbiAgfVxufTtcblxudmFyIHJlbW92ZUV2ZW50ID0gZnVuY3Rpb24gcmVtb3ZlRXZlbnQoZWxlbSwgdHlwZSwgZXZlbnRIYW5kbGUpIHtcbiAgaWYgKGVsZW0gPT09IG51bGwgfHwgdHlwZW9mIGVsZW0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChlbGVtLnJlbW92ZUV2ZW50TGlzdGVuZXIpIHtcbiAgICBlbGVtLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgZXZlbnRIYW5kbGUsIGZhbHNlKTtcbiAgfSBlbHNlIGlmIChlbGVtLmRldGFjaEV2ZW50KSB7XG4gICAgZWxlbS5kZXRhY2hFdmVudCgnb24nICsgdHlwZSwgZXZlbnRIYW5kbGUpO1xuICB9IGVsc2Uge1xuICAgIGVsZW1bJ29uJyArIHR5cGVdID0gbnVsbDtcbiAgfVxufTtcblxudmFyIENhcm91c2VsID0gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUNsYXNzKHtcbiAgZGlzcGxheU5hbWU6ICdDYXJvdXNlbCcsXG5cbiAgbWl4aW5zOiBbX3JlYWN0VHdlZW5TdGF0ZTJbJ2RlZmF1bHQnXS5NaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgY2VsbEFsaWduOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm9uZU9mKFsnbGVmdCcsICdjZW50ZXInLCAncmlnaHQnXSksXG4gICAgY2VsbFNwYWNpbmc6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGRhdGE6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuZnVuYyxcbiAgICBkZWNvcmF0b3JzOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLmFycmF5LFxuICAgIGRyYWdnaW5nOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLmJvb2wsXG4gICAgZWFzaW5nOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLnN0cmluZyxcbiAgICBlZGdlRWFzaW5nOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLnN0cmluZyxcbiAgICBmcmFtZVBhZGRpbmc6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nLFxuICAgIGluaXRpYWxTbGlkZUhlaWdodDogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5udW1iZXIsXG4gICAgaW5pdGlhbFNsaWRlV2lkdGg6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIHNsaWRlc1RvU2hvdzogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5udW1iZXIsXG4gICAgc2xpZGVzVG9TY3JvbGw6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMub25lT2ZUeXBlKFtfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm51bWJlciwgX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5vbmVPZihbJ2F1dG8nXSldKSxcbiAgICBzbGlkZVdpZHRoOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm9uZU9mVHlwZShbX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmcsIF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMubnVtYmVyXSksXG4gICAgc3BlZWQ6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIHZlcnRpY2FsOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLmJvb2wsXG4gICAgd2lkdGg6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiBnZXREZWZhdWx0UHJvcHMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNlbGxBbGlnbjogJ2xlZnQnLFxuICAgICAgY2VsbFNwYWNpbmc6IDAsXG4gICAgICBkYXRhOiBmdW5jdGlvbiBkYXRhKCkge30sXG4gICAgICBkZWNvcmF0b3JzOiBfZGVjb3JhdG9yczJbJ2RlZmF1bHQnXSxcbiAgICAgIGRyYWdnaW5nOiB0cnVlLFxuICAgICAgZWFzaW5nOiAnZWFzZU91dENpcmMnLFxuICAgICAgZWRnZUVhc2luZzogJ2Vhc2VPdXRFbGFzdGljJyxcbiAgICAgIGZyYW1lUGFkZGluZzogJzBweCcsXG4gICAgICBzbGlkZXNUb1Nob3c6IDEsXG4gICAgICBzbGlkZXNUb1Njcm9sbDogMSxcbiAgICAgIHNsaWRlV2lkdGg6IDEsXG4gICAgICBzcGVlZDogNTAwLFxuICAgICAgdmVydGljYWw6IGZhbHNlLFxuICAgICAgd2lkdGg6ICcxMDAlJ1xuICAgIH07XG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiBnZXRJbml0aWFsU3RhdGUoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGN1cnJlbnRTbGlkZTogMCxcbiAgICAgIGRyYWdnaW5nOiBmYWxzZSxcbiAgICAgIGZyYW1lV2lkdGg6IDAsXG4gICAgICBsZWZ0OiAwLFxuICAgICAgdG9wOiAwLFxuICAgICAgc2xpZGVDb3VudDogMCxcbiAgICAgIHNsaWRlV2lkdGg6IDAsXG4gICAgICBzbGlkZXNUb1Njcm9sbDogdGhpcy5wcm9wcy5zbGlkZXNUb1Njcm9sbFxuICAgIH07XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbiBjb21wb25lbnRXaWxsTW91bnQoKSB7XG4gICAgdGhpcy5zZXRJbml0aWFsRGltZW5zaW9ucygpO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICB0aGlzLnNldERpbWVuc2lvbnMoKTtcbiAgICB0aGlzLmJpbmRFdmVudHMoKTtcbiAgICB0aGlzLnNldEV4dGVybmFsRGF0YSgpO1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHM6IGZ1bmN0aW9uIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMobmV4dFByb3BzKSB7XG4gICAgdGhpcy5zZXREaW1lbnNpb25zKCk7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgIHRoaXMudW5iaW5kRXZlbnRzKCk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBjaGlsZHJlbiA9IF9yZWFjdDJbJ2RlZmF1bHQnXS5DaGlsZHJlbi5jb3VudCh0aGlzLnByb3BzLmNoaWxkcmVuKSA+IDEgPyB0aGlzLmZvcm1hdENoaWxkcmVuKHRoaXMucHJvcHMuY2hpbGRyZW4pIDogdGhpcy5wcm9wcy5jaGlsZHJlbjtcbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAnZGl2JyxcbiAgICAgIHsgY2xhc3NOYW1lOiBbJ3NsaWRlcicsIHRoaXMucHJvcHMuY2xhc3NOYW1lIHx8ICcnXS5qb2luKCcgJyksIHJlZjogJ3NsaWRlcicsIHN0eWxlOiAoMCwgX29iamVjdEFzc2lnbjJbJ2RlZmF1bHQnXSkodGhpcy5nZXRTbGlkZXJTdHlsZXMoKSwgdGhpcy5wcm9wcy5zdHlsZSB8fCB7fSkgfSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnZGl2JyxcbiAgICAgICAgX2V4dGVuZHMoeyBjbGFzc05hbWU6ICdzbGlkZXItZnJhbWUnLFxuICAgICAgICAgIHJlZjogJ2ZyYW1lJyxcbiAgICAgICAgICBzdHlsZTogdGhpcy5nZXRGcmFtZVN0eWxlcygpXG4gICAgICAgIH0sIHRoaXMuZ2V0VG91Y2hFdmVudHMoKSwgdGhpcy5nZXRNb3VzZUV2ZW50cygpLCB7XG4gICAgICAgICAgb25DbGljazogdGhpcy5oYW5kbGVDbGljayB9KSxcbiAgICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgJ3VsJyxcbiAgICAgICAgICB7IGNsYXNzTmFtZTogJ3NsaWRlci1saXN0JywgcmVmOiAnbGlzdCcsIHN0eWxlOiB0aGlzLmdldExpc3RTdHlsZXMoKSB9LFxuICAgICAgICAgIGNoaWxkcmVuXG4gICAgICAgIClcbiAgICAgICksXG4gICAgICB0aGlzLnByb3BzLmRlY29yYXRvcnMgPyB0aGlzLnByb3BzLmRlY29yYXRvcnMubWFwKGZ1bmN0aW9uIChEZWNvcmF0b3IsIGluZGV4KSB7XG4gICAgICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAnZGl2JyxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdHlsZTogKDAsIF9vYmplY3RBc3NpZ24yWydkZWZhdWx0J10pKHNlbGYuZ2V0RGVjb3JhdG9yU3R5bGVzKERlY29yYXRvci5wb3NpdGlvbiksIERlY29yYXRvci5zdHlsZSB8fCB7fSksXG4gICAgICAgICAgICBjbGFzc05hbWU6ICdzbGlkZXItZGVjb3JhdG9yLScgKyBpbmRleCxcbiAgICAgICAgICAgIGtleTogaW5kZXggfSxcbiAgICAgICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChEZWNvcmF0b3IuY29tcG9uZW50LCB7XG4gICAgICAgICAgICBjdXJyZW50U2xpZGU6IHNlbGYuc3RhdGUuY3VycmVudFNsaWRlLFxuICAgICAgICAgICAgc2xpZGVDb3VudDogc2VsZi5zdGF0ZS5zbGlkZUNvdW50LFxuICAgICAgICAgICAgZnJhbWVXaWR0aDogc2VsZi5zdGF0ZS5mcmFtZVdpZHRoLFxuICAgICAgICAgICAgc2xpZGVXaWR0aDogc2VsZi5zdGF0ZS5zbGlkZVdpZHRoLFxuICAgICAgICAgICAgc2xpZGVzVG9TY3JvbGw6IHNlbGYuc3RhdGUuc2xpZGVzVG9TY3JvbGwsXG4gICAgICAgICAgICBjZWxsU3BhY2luZzogc2VsZi5wcm9wcy5jZWxsU3BhY2luZyxcbiAgICAgICAgICAgIHNsaWRlc1RvU2hvdzogc2VsZi5wcm9wcy5zbGlkZXNUb1Nob3csXG4gICAgICAgICAgICBuZXh0U2xpZGU6IHNlbGYubmV4dFNsaWRlLFxuICAgICAgICAgICAgcHJldmlvdXNTbGlkZTogc2VsZi5wcmV2aW91c1NsaWRlLFxuICAgICAgICAgICAgZ29Ub1NsaWRlOiBzZWxmLmdvVG9TbGlkZSxcbiAgICAgICAgICAgIGlkOiBzZWxmLnByb3BzLmlkIH0pXG4gICAgICAgICk7XG4gICAgICB9KSA6IG51bGwsXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudCgnc3R5bGUnLCB7IHR5cGU6ICd0ZXh0L2NzcycsIGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MOiB7IF9faHRtbDogc2VsZi5nZXRTdHlsZVRhZ1N0eWxlcygpIH0gfSlcbiAgICApO1xuICB9LFxuXG4gIC8vIFRvdWNoIEV2ZW50c1xuXG4gIHRvdWNoT2JqZWN0OiB7fSxcblxuICBnZXRUb3VjaEV2ZW50czogZnVuY3Rpb24gZ2V0VG91Y2hFdmVudHMoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG9uVG91Y2hTdGFydDogZnVuY3Rpb24gb25Ub3VjaFN0YXJ0KGUpIHtcbiAgICAgICAgc2VsZi50b3VjaE9iamVjdCA9IHtcbiAgICAgICAgICBzdGFydFg6IGUudG91Y2hlc1swXS5wYWdlWCxcbiAgICAgICAgICBzdGFydFk6IGUudG91Y2hlc1swXS5wYWdlWVxuICAgICAgICB9O1xuICAgICAgfSxcbiAgICAgIG9uVG91Y2hNb3ZlOiBmdW5jdGlvbiBvblRvdWNoTW92ZShlKSB7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSBzZWxmLnN3aXBlRGlyZWN0aW9uKHNlbGYudG91Y2hPYmplY3Quc3RhcnRYLCBlLnRvdWNoZXNbMF0ucGFnZVgsIHNlbGYudG91Y2hPYmplY3Quc3RhcnRZLCBlLnRvdWNoZXNbMF0ucGFnZVkpO1xuXG4gICAgICAgIGlmIChkaXJlY3Rpb24gIT09IDApIHtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLnRvdWNoT2JqZWN0ID0ge1xuICAgICAgICAgIHN0YXJ0WDogc2VsZi50b3VjaE9iamVjdC5zdGFydFgsXG4gICAgICAgICAgc3RhcnRZOiBzZWxmLnRvdWNoT2JqZWN0LnN0YXJ0WSxcbiAgICAgICAgICBlbmRYOiBlLnRvdWNoZXNbMF0ucGFnZVgsXG4gICAgICAgICAgZW5kWTogZS50b3VjaGVzWzBdLnBhZ2VZLFxuICAgICAgICAgIGxlbmd0aDogTWF0aC5yb3VuZChNYXRoLnNxcnQoTWF0aC5wb3coZS50b3VjaGVzWzBdLnBhZ2VYIC0gc2VsZi50b3VjaE9iamVjdC5zdGFydFgsIDIpKSksXG4gICAgICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb25cbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLnNldFN0YXRlKHtcbiAgICAgICAgICBsZWZ0OiBzZWxmLnByb3BzLnZlcnRpY2FsID8gMCA6IChzZWxmLnN0YXRlLnNsaWRlV2lkdGggKiBzZWxmLnN0YXRlLmN1cnJlbnRTbGlkZSArIHNlbGYudG91Y2hPYmplY3QubGVuZ3RoICogc2VsZi50b3VjaE9iamVjdC5kaXJlY3Rpb24pICogLTEsXG4gICAgICAgICAgdG9wOiBzZWxmLnByb3BzLnZlcnRpY2FsID8gKHNlbGYuc3RhdGUuc2xpZGVXaWR0aCAqIHNlbGYuc3RhdGUuY3VycmVudFNsaWRlICsgc2VsZi50b3VjaE9iamVjdC5sZW5ndGggKiBzZWxmLnRvdWNoT2JqZWN0LmRpcmVjdGlvbikgKiAtMSA6IDBcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICAgb25Ub3VjaEVuZDogZnVuY3Rpb24gb25Ub3VjaEVuZChlKSB7XG4gICAgICAgIHNlbGYuaGFuZGxlU3dpcGUoZSk7XG4gICAgICB9LFxuICAgICAgb25Ub3VjaENhbmNlbDogZnVuY3Rpb24gb25Ub3VjaENhbmNlbChlKSB7XG4gICAgICAgIHNlbGYuaGFuZGxlU3dpcGUoZSk7XG4gICAgICB9XG4gICAgfTtcbiAgfSxcblxuICBjbGlja1NhZmU6IHRydWUsXG5cbiAgZ2V0TW91c2VFdmVudHM6IGZ1bmN0aW9uIGdldE1vdXNlRXZlbnRzKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGlmICh0aGlzLnByb3BzLmRyYWdnaW5nID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIG9uTW91c2VEb3duOiBmdW5jdGlvbiBvbk1vdXNlRG93bihlKSB7XG4gICAgICAgIHNlbGYudG91Y2hPYmplY3QgPSB7XG4gICAgICAgICAgc3RhcnRYOiBlLmNsaWVudFgsXG4gICAgICAgICAgc3RhcnRZOiBlLmNsaWVudFlcbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLnNldFN0YXRlKHtcbiAgICAgICAgICBkcmFnZ2luZzogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICBvbk1vdXNlTW92ZTogZnVuY3Rpb24gb25Nb3VzZU1vdmUoZSkge1xuICAgICAgICBpZiAoIXNlbGYuc3RhdGUuZHJhZ2dpbmcpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZGlyZWN0aW9uID0gc2VsZi5zd2lwZURpcmVjdGlvbihzZWxmLnRvdWNoT2JqZWN0LnN0YXJ0WCwgZS5jbGllbnRYLCBzZWxmLnRvdWNoT2JqZWN0LnN0YXJ0WSwgZS5jbGllbnRZKTtcblxuICAgICAgICBpZiAoZGlyZWN0aW9uICE9PSAwKSB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxlbmd0aCA9IHNlbGYucHJvcHMudmVydGljYWwgPyBNYXRoLnJvdW5kKE1hdGguc3FydChNYXRoLnBvdyhlLmNsaWVudFkgLSBzZWxmLnRvdWNoT2JqZWN0LnN0YXJ0WSwgMikpKSA6IE1hdGgucm91bmQoTWF0aC5zcXJ0KE1hdGgucG93KGUuY2xpZW50WCAtIHNlbGYudG91Y2hPYmplY3Quc3RhcnRYLCAyKSkpO1xuXG4gICAgICAgIHNlbGYudG91Y2hPYmplY3QgPSB7XG4gICAgICAgICAgc3RhcnRYOiBzZWxmLnRvdWNoT2JqZWN0LnN0YXJ0WCxcbiAgICAgICAgICBzdGFydFk6IHNlbGYudG91Y2hPYmplY3Quc3RhcnRZLFxuICAgICAgICAgIGVuZFg6IGUuY2xpZW50WCxcbiAgICAgICAgICBlbmRZOiBlLmNsaWVudFksXG4gICAgICAgICAgbGVuZ3RoOiBsZW5ndGgsXG4gICAgICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb25cbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLnNldFN0YXRlKHtcbiAgICAgICAgICBsZWZ0OiBzZWxmLnByb3BzLnZlcnRpY2FsID8gMCA6IHNlbGYuZ2V0VGFyZ2V0TGVmdChzZWxmLnRvdWNoT2JqZWN0Lmxlbmd0aCAqIHNlbGYudG91Y2hPYmplY3QuZGlyZWN0aW9uKSxcbiAgICAgICAgICB0b3A6IHNlbGYucHJvcHMudmVydGljYWwgPyBzZWxmLmdldFRhcmdldExlZnQoc2VsZi50b3VjaE9iamVjdC5sZW5ndGggKiBzZWxmLnRvdWNoT2JqZWN0LmRpcmVjdGlvbikgOiAwXG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICAgIG9uTW91c2VVcDogZnVuY3Rpb24gb25Nb3VzZVVwKGUpIHtcbiAgICAgICAgaWYgKCFzZWxmLnN0YXRlLmRyYWdnaW5nKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5oYW5kbGVTd2lwZShlKTtcbiAgICAgIH0sXG4gICAgICBvbk1vdXNlTGVhdmU6IGZ1bmN0aW9uIG9uTW91c2VMZWF2ZShlKSB7XG4gICAgICAgIGlmICghc2VsZi5zdGF0ZS5kcmFnZ2luZykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuaGFuZGxlU3dpcGUoZSk7XG4gICAgICB9XG4gICAgfTtcbiAgfSxcblxuICBoYW5kbGVDbGljazogZnVuY3Rpb24gaGFuZGxlQ2xpY2soZSkge1xuICAgIGlmICh0aGlzLmNsaWNrU2FmZSA9PT0gdHJ1ZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGUubmF0aXZlRXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfVxuICB9LFxuXG4gIGhhbmRsZVN3aXBlOiBmdW5jdGlvbiBoYW5kbGVTd2lwZShlKSB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLnRvdWNoT2JqZWN0Lmxlbmd0aCAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy50b3VjaE9iamVjdC5sZW5ndGggPiA0NCkge1xuICAgICAgdGhpcy5jbGlja1NhZmUgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNsaWNrU2FmZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnRvdWNoT2JqZWN0Lmxlbmd0aCA+IHRoaXMuc3RhdGUuc2xpZGVXaWR0aCAvIHRoaXMucHJvcHMuc2xpZGVzVG9TaG93IC8gNSkge1xuICAgICAgaWYgKHRoaXMudG91Y2hPYmplY3QuZGlyZWN0aW9uID09PSAxKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmN1cnJlbnRTbGlkZSA+PSBfcmVhY3QyWydkZWZhdWx0J10uQ2hpbGRyZW4uY291bnQodGhpcy5wcm9wcy5jaGlsZHJlbikgLSB0aGlzLnN0YXRlLnNsaWRlc1RvU2Nyb2xsKSB7XG4gICAgICAgICAgdGhpcy5hbmltYXRlU2xpZGUoX3JlYWN0VHdlZW5TdGF0ZTJbJ2RlZmF1bHQnXS5lYXNpbmdUeXBlc1t0aGlzLnByb3BzLmVkZ2VFYXNpbmddKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLm5leHRTbGlkZSgpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRoaXMudG91Y2hPYmplY3QuZGlyZWN0aW9uID09PSAtMSkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5jdXJyZW50U2xpZGUgPD0gMCkge1xuICAgICAgICAgIHRoaXMuYW5pbWF0ZVNsaWRlKF9yZWFjdFR3ZWVuU3RhdGUyWydkZWZhdWx0J10uZWFzaW5nVHlwZXNbdGhpcy5wcm9wcy5lZGdlRWFzaW5nXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5wcmV2aW91c1NsaWRlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5nb1RvU2xpZGUodGhpcy5zdGF0ZS5jdXJyZW50U2xpZGUpO1xuICAgIH1cblxuICAgIHRoaXMudG91Y2hPYmplY3QgPSB7fTtcblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgZHJhZ2dpbmc6IGZhbHNlXG4gICAgfSk7XG4gIH0sXG5cbiAgc3dpcGVEaXJlY3Rpb246IGZ1bmN0aW9uIHN3aXBlRGlyZWN0aW9uKHgxLCB4MiwgeTEsIHkyKSB7XG5cbiAgICB2YXIgeERpc3QsIHlEaXN0LCByLCBzd2lwZUFuZ2xlO1xuXG4gICAgeERpc3QgPSB4MSAtIHgyO1xuICAgIHlEaXN0ID0geTEgLSB5MjtcbiAgICByID0gTWF0aC5hdGFuMih5RGlzdCwgeERpc3QpO1xuXG4gICAgc3dpcGVBbmdsZSA9IE1hdGgucm91bmQociAqIDE4MCAvIE1hdGguUEkpO1xuICAgIGlmIChzd2lwZUFuZ2xlIDwgMCkge1xuICAgICAgc3dpcGVBbmdsZSA9IDM2MCAtIE1hdGguYWJzKHN3aXBlQW5nbGUpO1xuICAgIH1cbiAgICBpZiAoc3dpcGVBbmdsZSA8PSA0NSAmJiBzd2lwZUFuZ2xlID49IDApIHtcbiAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICBpZiAoc3dpcGVBbmdsZSA8PSAzNjAgJiYgc3dpcGVBbmdsZSA+PSAzMTUpIHtcbiAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICBpZiAoc3dpcGVBbmdsZSA+PSAxMzUgJiYgc3dpcGVBbmdsZSA8PSAyMjUpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgaWYgKHRoaXMucHJvcHMudmVydGljYWwgPT09IHRydWUpIHtcbiAgICAgIGlmIChzd2lwZUFuZ2xlID49IDM1ICYmIHN3aXBlQW5nbGUgPD0gMTM1KSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gMDtcbiAgfSxcblxuICAvLyBBY3Rpb24gTWV0aG9kc1xuXG4gIGdvVG9TbGlkZTogZnVuY3Rpb24gZ29Ub1NsaWRlKGluZGV4KSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmIChpbmRleCA+PSBfcmVhY3QyWydkZWZhdWx0J10uQ2hpbGRyZW4uY291bnQodGhpcy5wcm9wcy5jaGlsZHJlbikgfHwgaW5kZXggPCAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgY3VycmVudFNsaWRlOiBpbmRleFxuICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuYW5pbWF0ZVNsaWRlKCk7XG4gICAgICBzZWxmLnNldEV4dGVybmFsRGF0YSgpO1xuICAgIH0pO1xuICB9LFxuXG4gIG5leHRTbGlkZTogZnVuY3Rpb24gbmV4dFNsaWRlKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAodGhpcy5zdGF0ZS5jdXJyZW50U2xpZGUgKyB0aGlzLnN0YXRlLnNsaWRlc1RvU2Nyb2xsID49IF9yZWFjdDJbJ2RlZmF1bHQnXS5DaGlsZHJlbi5jb3VudCh0aGlzLnByb3BzLmNoaWxkcmVuKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGN1cnJlbnRTbGlkZTogdGhpcy5zdGF0ZS5jdXJyZW50U2xpZGUgKyB0aGlzLnN0YXRlLnNsaWRlc1RvU2Nyb2xsXG4gICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi5hbmltYXRlU2xpZGUoKTtcbiAgICAgIHNlbGYuc2V0RXh0ZXJuYWxEYXRhKCk7XG4gICAgfSk7XG4gIH0sXG5cbiAgcHJldmlvdXNTbGlkZTogZnVuY3Rpb24gcHJldmlvdXNTbGlkZSgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHRoaXMuc3RhdGUuY3VycmVudFNsaWRlIC0gdGhpcy5zdGF0ZS5zbGlkZXNUb1Njcm9sbCA8IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBjdXJyZW50U2xpZGU6IHRoaXMuc3RhdGUuY3VycmVudFNsaWRlIC0gdGhpcy5zdGF0ZS5zbGlkZXNUb1Njcm9sbFxuICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuYW5pbWF0ZVNsaWRlKCk7XG4gICAgICBzZWxmLnNldEV4dGVybmFsRGF0YSgpO1xuICAgIH0pO1xuICB9LFxuXG4gIC8vIEFuaW1hdGlvblxuXG4gIGFuaW1hdGVTbGlkZTogZnVuY3Rpb24gYW5pbWF0ZVNsaWRlKGVhc2luZywgZHVyYXRpb24sIGVuZFZhbHVlKSB7XG4gICAgdGhpcy50d2VlblN0YXRlKHRoaXMucHJvcHMudmVydGljYWwgPyAndG9wJyA6ICdsZWZ0Jywge1xuICAgICAgZWFzaW5nOiBlYXNpbmcgfHwgX3JlYWN0VHdlZW5TdGF0ZTJbJ2RlZmF1bHQnXS5lYXNpbmdUeXBlc1t0aGlzLnByb3BzLmVhc2luZ10sXG4gICAgICBkdXJhdGlvbjogZHVyYXRpb24gfHwgdGhpcy5wcm9wcy5zcGVlZCxcbiAgICAgIGVuZFZhbHVlOiBlbmRWYWx1ZSB8fCB0aGlzLmdldFRhcmdldExlZnQoKVxuICAgIH0pO1xuICB9LFxuXG4gIGdldFRhcmdldExlZnQ6IGZ1bmN0aW9uIGdldFRhcmdldExlZnQodG91Y2hPZmZzZXQpIHtcbiAgICB2YXIgb2Zmc2V0O1xuICAgIHN3aXRjaCAodGhpcy5wcm9wcy5jZWxsQWxpZ24pIHtcbiAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICB7XG4gICAgICAgICAgb2Zmc2V0ID0gMDtcbiAgICAgICAgICBvZmZzZXQgLT0gdGhpcy5wcm9wcy5jZWxsU3BhY2luZyAqIHRoaXMuc3RhdGUuY3VycmVudFNsaWRlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICBjYXNlICdjZW50ZXInOlxuICAgICAgICB7XG4gICAgICAgICAgb2Zmc2V0ID0gKHRoaXMuc3RhdGUuZnJhbWVXaWR0aCAtIHRoaXMuc3RhdGUuc2xpZGVXaWR0aCkgLyAyO1xuICAgICAgICAgIG9mZnNldCAtPSB0aGlzLnByb3BzLmNlbGxTcGFjaW5nICogdGhpcy5zdGF0ZS5jdXJyZW50U2xpZGU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAge1xuICAgICAgICAgIG9mZnNldCA9IHRoaXMuc3RhdGUuZnJhbWVXaWR0aCAtIHRoaXMuc3RhdGUuc2xpZGVXaWR0aDtcbiAgICAgICAgICBvZmZzZXQgLT0gdGhpcy5wcm9wcy5jZWxsU3BhY2luZyAqIHRoaXMuc3RhdGUuY3VycmVudFNsaWRlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucHJvcHMudmVydGljYWwpIHtcbiAgICAgIG9mZnNldCA9IG9mZnNldCAvIDI7XG4gICAgfVxuXG4gICAgb2Zmc2V0IC09IHRvdWNoT2Zmc2V0IHx8IDA7XG5cbiAgICByZXR1cm4gKHRoaXMuc3RhdGUuc2xpZGVXaWR0aCAqIHRoaXMuc3RhdGUuY3VycmVudFNsaWRlIC0gb2Zmc2V0KSAqIC0xO1xuICB9LFxuXG4gIC8vIEJvb3RzdHJhcHBpbmdcblxuICBiaW5kRXZlbnRzOiBmdW5jdGlvbiBiaW5kRXZlbnRzKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoX2V4ZW52MlsnZGVmYXVsdCddLmNhblVzZURPTSkge1xuICAgICAgYWRkRXZlbnQod2luZG93LCAncmVzaXplJywgc2VsZi5vblJlc2l6ZSk7XG4gICAgICBhZGRFdmVudChkb2N1bWVudCwgJ3JlYWR5c3RhdGVjaGFuZ2UnLCBzZWxmLm9uUmVhZHlTdGF0ZUNoYW5nZSk7XG4gICAgfVxuICB9LFxuXG4gIG9uUmVzaXplOiBmdW5jdGlvbiBvblJlc2l6ZSgpIHtcbiAgICB0aGlzLnNldERpbWVuc2lvbnMoKTtcbiAgfSxcblxuICBvblJlYWR5U3RhdGVDaGFuZ2U6IGZ1bmN0aW9uIG9uUmVhZHlTdGF0ZUNoYW5nZSgpIHtcbiAgICB0aGlzLnNldERpbWVuc2lvbnMoKTtcbiAgfSxcblxuICB1bmJpbmRFdmVudHM6IGZ1bmN0aW9uIHVuYmluZEV2ZW50cygpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKF9leGVudjJbJ2RlZmF1bHQnXS5jYW5Vc2VET00pIHtcbiAgICAgIHJlbW92ZUV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScsIHNlbGYub25SZXNpemUpO1xuICAgICAgcmVtb3ZlRXZlbnQoZG9jdW1lbnQsICdyZWFkeXN0YXRlY2hhbmdlJywgc2VsZi5vblJlYWR5U3RhdGVDaGFuZ2UpO1xuICAgIH1cbiAgfSxcblxuICBmb3JtYXRDaGlsZHJlbjogZnVuY3Rpb24gZm9ybWF0Q2hpbGRyZW4oY2hpbGRyZW4pIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5DaGlsZHJlbi5tYXAoY2hpbGRyZW4sIGZ1bmN0aW9uIChjaGlsZCwgaW5kZXgpIHtcbiAgICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ2xpJyxcbiAgICAgICAgeyBjbGFzc05hbWU6ICdzbGlkZXItc2xpZGUnLCBzdHlsZTogc2VsZi5nZXRTbGlkZVN0eWxlcygpLCBrZXk6IGluZGV4IH0sXG4gICAgICAgIGNoaWxkXG4gICAgICApO1xuICAgIH0pO1xuICB9LFxuXG4gIHNldEluaXRpYWxEaW1lbnNpb25zOiBmdW5jdGlvbiBzZXRJbml0aWFsRGltZW5zaW9ucygpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgIHNsaWRlV2lkdGgsXG4gICAgICAgIGZyYW1lSGVpZ2h0LFxuICAgICAgICBzbGlkZUhlaWdodDtcblxuICAgIHNsaWRlV2lkdGggPSB0aGlzLnByb3BzLnZlcnRpY2FsID8gdGhpcy5wcm9wcy5pbml0aWFsU2xpZGVIZWlnaHQgfHwgMCA6IHRoaXMucHJvcHMuaW5pdGlhbFNsaWRlV2lkdGggfHwgMDtcbiAgICBzbGlkZUhlaWdodCA9IHRoaXMucHJvcHMuaW5pdGlhbFNsaWRlSGVpZ2h0ID8gdGhpcy5wcm9wcy5pbml0aWFsU2xpZGVIZWlnaHQgKiB0aGlzLnByb3BzLnNsaWRlc1RvU2hvdyA6IDA7XG5cbiAgICBmcmFtZUhlaWdodCA9IHNsaWRlSGVpZ2h0ICsgdGhpcy5wcm9wcy5jZWxsU3BhY2luZyAvIDIgKiAodGhpcy5wcm9wcy5zbGlkZXNUb1Nob3cgLSAxKTtcblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgZnJhbWVXaWR0aDogdGhpcy5wcm9wcy52ZXJ0aWNhbCA/IGZyYW1lSGVpZ2h0IDogJzEwMCUnLFxuICAgICAgc2xpZGVDb3VudDogX3JlYWN0MlsnZGVmYXVsdCddLkNoaWxkcmVuLmNvdW50KHRoaXMucHJvcHMuY2hpbGRyZW4pLFxuICAgICAgc2xpZGVXaWR0aDogc2xpZGVXaWR0aFxuICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuc2V0TGVmdCgpO1xuICAgICAgc2VsZi5zZXRFeHRlcm5hbERhdGEoKTtcbiAgICB9KTtcbiAgfSxcblxuICBzZXREaW1lbnNpb25zOiBmdW5jdGlvbiBzZXREaW1lbnNpb25zKCkge1xuICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgc2xpZGVXaWR0aCxcbiAgICAgICAgc2xpZGVzVG9TY3JvbGwsXG4gICAgICAgIGZpcnN0U2xpZGUsXG4gICAgICAgIGZyYW1lLFxuICAgICAgICBmcmFtZVdpZHRoLFxuICAgICAgICBmcmFtZUhlaWdodCxcbiAgICAgICAgc2xpZGVIZWlnaHQ7XG5cbiAgICBzbGlkZXNUb1Njcm9sbCA9IHRoaXMucHJvcHMuc2xpZGVzVG9TY3JvbGw7XG4gICAgZnJhbWUgPSBfcmVhY3REb20yWydkZWZhdWx0J10uZmluZERPTU5vZGUodGhpcy5yZWZzLmZyYW1lKTtcbiAgICBmaXJzdFNsaWRlID0gZnJhbWUuY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdO1xuICAgIGlmIChmaXJzdFNsaWRlKSB7XG4gICAgICBmaXJzdFNsaWRlLnN0eWxlLmhlaWdodCA9ICdhdXRvJztcbiAgICAgIHNsaWRlSGVpZ2h0ID0gZmlyc3RTbGlkZS5vZmZzZXRIZWlnaHQgKiB0aGlzLnByb3BzLnNsaWRlc1RvU2hvdztcbiAgICB9IGVsc2Uge1xuICAgICAgc2xpZGVIZWlnaHQgPSAxMDA7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB0aGlzLnByb3BzLnNsaWRlV2lkdGggIT09ICdudW1iZXInKSB7XG4gICAgICBzbGlkZVdpZHRoID0gcGFyc2VJbnQodGhpcy5wcm9wcy5zbGlkZVdpZHRoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMucHJvcHMudmVydGljYWwpIHtcbiAgICAgICAgc2xpZGVXaWR0aCA9IHNsaWRlSGVpZ2h0IC8gdGhpcy5wcm9wcy5zbGlkZXNUb1Nob3cgKiB0aGlzLnByb3BzLnNsaWRlV2lkdGg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzbGlkZVdpZHRoID0gZnJhbWUub2Zmc2V0V2lkdGggLyB0aGlzLnByb3BzLnNsaWRlc1RvU2hvdyAqIHRoaXMucHJvcHMuc2xpZGVXaWR0aDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXRoaXMucHJvcHMudmVydGljYWwpIHtcbiAgICAgIHNsaWRlV2lkdGggLT0gdGhpcy5wcm9wcy5jZWxsU3BhY2luZyAqICgoMTAwIC0gMTAwIC8gdGhpcy5wcm9wcy5zbGlkZXNUb1Nob3cpIC8gMTAwKTtcbiAgICB9XG5cbiAgICBmcmFtZUhlaWdodCA9IHNsaWRlSGVpZ2h0ICsgdGhpcy5wcm9wcy5jZWxsU3BhY2luZyAvIDIgKiAodGhpcy5wcm9wcy5zbGlkZXNUb1Nob3cgLSAxKTtcbiAgICBmcmFtZVdpZHRoID0gdGhpcy5wcm9wcy52ZXJ0aWNhbCA/IGZyYW1lSGVpZ2h0IDogZnJhbWUub2Zmc2V0V2lkdGg7XG5cbiAgICBpZiAodGhpcy5wcm9wcy5zbGlkZXNUb1Njcm9sbCA9PT0gJ2F1dG8nKSB7XG4gICAgICBzbGlkZXNUb1Njcm9sbCA9IE1hdGguZmxvb3IoZnJhbWVXaWR0aCAvIChzbGlkZVdpZHRoICsgdGhpcy5wcm9wcy5jZWxsU3BhY2luZykpO1xuICAgIH1cblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgZnJhbWVXaWR0aDogZnJhbWVXaWR0aCxcbiAgICAgIHNsaWRlQ291bnQ6IF9yZWFjdDJbJ2RlZmF1bHQnXS5DaGlsZHJlbi5jb3VudCh0aGlzLnByb3BzLmNoaWxkcmVuKSxcbiAgICAgIHNsaWRlV2lkdGg6IHNsaWRlV2lkdGgsXG4gICAgICBzbGlkZXNUb1Njcm9sbDogc2xpZGVzVG9TY3JvbGwsXG4gICAgICBsZWZ0OiB0aGlzLnByb3BzLnZlcnRpY2FsID8gMCA6IHRoaXMuZ2V0VGFyZ2V0TGVmdCgpLFxuICAgICAgdG9wOiB0aGlzLnByb3BzLnZlcnRpY2FsID8gdGhpcy5nZXRUYXJnZXRMZWZ0KCkgOiAwXG4gICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi5zZXRMZWZ0KCk7XG4gICAgfSk7XG4gIH0sXG5cbiAgc2V0TGVmdDogZnVuY3Rpb24gc2V0TGVmdCgpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGxlZnQ6IHRoaXMucHJvcHMudmVydGljYWwgPyAwIDogdGhpcy5nZXRUYXJnZXRMZWZ0KCksXG4gICAgICB0b3A6IHRoaXMucHJvcHMudmVydGljYWwgPyB0aGlzLmdldFRhcmdldExlZnQoKSA6IDBcbiAgICB9KTtcbiAgfSxcblxuICAvLyBEYXRhXG5cbiAgc2V0RXh0ZXJuYWxEYXRhOiBmdW5jdGlvbiBzZXRFeHRlcm5hbERhdGEoKSB7XG4gICAgaWYgKHRoaXMucHJvcHMuZGF0YSkge1xuICAgICAgdGhpcy5wcm9wcy5kYXRhKCk7XG4gICAgfVxuICB9LFxuXG4gIC8vIFN0eWxlc1xuXG4gIGdldExpc3RTdHlsZXM6IGZ1bmN0aW9uIGdldExpc3RTdHlsZXMoKSB7XG4gICAgdmFyIGxpc3RXaWR0aCA9IHRoaXMuc3RhdGUuc2xpZGVXaWR0aCAqIF9yZWFjdDJbJ2RlZmF1bHQnXS5DaGlsZHJlbi5jb3VudCh0aGlzLnByb3BzLmNoaWxkcmVuKTtcbiAgICB2YXIgc3BhY2luZ09mZnNldCA9IHRoaXMucHJvcHMuY2VsbFNwYWNpbmcgKiBfcmVhY3QyWydkZWZhdWx0J10uQ2hpbGRyZW4uY291bnQodGhpcy5wcm9wcy5jaGlsZHJlbik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgICAgZGlzcGxheTogJ2Jsb2NrJyxcbiAgICAgIHRvcDogdGhpcy5nZXRUd2VlbmluZ1ZhbHVlKCd0b3AnKSxcbiAgICAgIGxlZnQ6IHRoaXMuZ2V0VHdlZW5pbmdWYWx1ZSgnbGVmdCcpLFxuICAgICAgbWFyZ2luOiB0aGlzLnByb3BzLnZlcnRpY2FsID8gdGhpcy5wcm9wcy5jZWxsU3BhY2luZyAvIDIgKiAtMSArICdweCAwcHgnIDogJzBweCAnICsgdGhpcy5wcm9wcy5jZWxsU3BhY2luZyAvIDIgKiAtMSArICdweCcsXG4gICAgICBwYWRkaW5nOiAwLFxuICAgICAgaGVpZ2h0OiB0aGlzLnByb3BzLnZlcnRpY2FsID8gbGlzdFdpZHRoICsgc3BhY2luZ09mZnNldCA6ICdhdXRvJyxcbiAgICAgIHdpZHRoOiB0aGlzLnByb3BzLnZlcnRpY2FsID8gJ2F1dG8nIDogbGlzdFdpZHRoICsgc3BhY2luZ09mZnNldCxcbiAgICAgIGN1cnNvcjogdGhpcy5zdGF0ZS5kcmFnZ2luZyA9PT0gdHJ1ZSA/ICdwb2ludGVyJyA6ICdpbmhlcml0JyxcbiAgICAgIHRyYW5zZm9ybTogJ3RyYW5zbGF0ZTNkKDAsIDAsIDApJyxcbiAgICAgIFdlYmtpdFRyYW5zZm9ybTogJ3RyYW5zbGF0ZTNkKDAsIDAsIDApJyxcbiAgICAgIGJveFNpemluZzogJ2JvcmRlci1ib3gnLFxuICAgICAgTW96Qm94U2l6aW5nOiAnYm9yZGVyLWJveCdcbiAgICB9O1xuICB9LFxuXG4gIGdldEZyYW1lU3R5bGVzOiBmdW5jdGlvbiBnZXRGcmFtZVN0eWxlcygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgICBkaXNwbGF5OiAnYmxvY2snLFxuICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICAgICAgaGVpZ2h0OiB0aGlzLnByb3BzLnZlcnRpY2FsID8gdGhpcy5zdGF0ZS5mcmFtZVdpZHRoIHx8ICdpbml0aWFsJyA6ICdhdXRvJyxcbiAgICAgIG1hcmdpbjogdGhpcy5wcm9wcy5mcmFtZVBhZGRpbmcsXG4gICAgICBwYWRkaW5nOiAwLFxuICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoMCwgMCwgMCknLFxuICAgICAgV2Via2l0VHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoMCwgMCwgMCknLFxuICAgICAgYm94U2l6aW5nOiAnYm9yZGVyLWJveCcsXG4gICAgICBNb3pCb3hTaXppbmc6ICdib3JkZXItYm94J1xuICAgIH07XG4gIH0sXG5cbiAgZ2V0U2xpZGVTdHlsZXM6IGZ1bmN0aW9uIGdldFNsaWRlU3R5bGVzKCkge1xuICAgIHJldHVybiB7XG4gICAgICBkaXNwbGF5OiB0aGlzLnByb3BzLnZlcnRpY2FsID8gJ2Jsb2NrJyA6ICdpbmxpbmUtYmxvY2snLFxuICAgICAgbGlzdFN0eWxlVHlwZTogJ25vbmUnLFxuICAgICAgdmVydGljYWxBbGlnbjogJ3RvcCcsXG4gICAgICB3aWR0aDogdGhpcy5wcm9wcy52ZXJ0aWNhbCA/ICcxMDAlJyA6IHRoaXMuc3RhdGUuc2xpZGVXaWR0aCxcbiAgICAgIGhlaWdodDogJ2F1dG8nLFxuICAgICAgYm94U2l6aW5nOiAnYm9yZGVyLWJveCcsXG4gICAgICBNb3pCb3hTaXppbmc6ICdib3JkZXItYm94JyxcbiAgICAgIG1hcmdpbkxlZnQ6IHRoaXMucHJvcHMudmVydGljYWwgPyAnYXV0bycgOiB0aGlzLnByb3BzLmNlbGxTcGFjaW5nIC8gMixcbiAgICAgIG1hcmdpblJpZ2h0OiB0aGlzLnByb3BzLnZlcnRpY2FsID8gJ2F1dG8nIDogdGhpcy5wcm9wcy5jZWxsU3BhY2luZyAvIDIsXG4gICAgICBtYXJnaW5Ub3A6IHRoaXMucHJvcHMudmVydGljYWwgPyB0aGlzLnByb3BzLmNlbGxTcGFjaW5nIC8gMiA6ICdhdXRvJyxcbiAgICAgIG1hcmdpbkJvdHRvbTogdGhpcy5wcm9wcy52ZXJ0aWNhbCA/IHRoaXMucHJvcHMuY2VsbFNwYWNpbmcgLyAyIDogJ2F1dG8nXG4gICAgfTtcbiAgfSxcblxuICBnZXRTbGlkZXJTdHlsZXM6IGZ1bmN0aW9uIGdldFNsaWRlclN0eWxlcygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgICBkaXNwbGF5OiAnYmxvY2snLFxuICAgICAgd2lkdGg6IHRoaXMucHJvcHMud2lkdGgsXG4gICAgICBoZWlnaHQ6ICdhdXRvJyxcbiAgICAgIGJveFNpemluZzogJ2JvcmRlci1ib3gnLFxuICAgICAgTW96Qm94U2l6aW5nOiAnYm9yZGVyLWJveCcsXG4gICAgICB2aXNpYmlsaXR5OiB0aGlzLnN0YXRlLnNsaWRlV2lkdGggPyAndmlzaWJsZScgOiAnaGlkZGVuJ1xuICAgIH07XG4gIH0sXG5cbiAgZ2V0U3R5bGVUYWdTdHlsZXM6IGZ1bmN0aW9uIGdldFN0eWxlVGFnU3R5bGVzKCkge1xuICAgIHJldHVybiAnLnNsaWRlci1zbGlkZSA+IGltZyB7d2lkdGg6IDEwMCU7IGRpc3BsYXk6IGJsb2NrO30nO1xuICB9LFxuXG4gIGdldERlY29yYXRvclN0eWxlczogZnVuY3Rpb24gZ2V0RGVjb3JhdG9yU3R5bGVzKHBvc2l0aW9uKSB7XG4gICAgc3dpdGNoIChwb3NpdGlvbikge1xuICAgICAgY2FzZSAnVG9wTGVmdCc6XG4gICAgICAgIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICBsZWZ0OiAwXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgY2FzZSAnVG9wQ2VudGVyJzpcbiAgICAgICAge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgIGxlZnQ6ICc1MCUnLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlWCgtNTAlKScsXG4gICAgICAgICAgICBXZWJraXRUcmFuc2Zvcm06ICd0cmFuc2xhdGVYKC01MCUpJ1xuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIGNhc2UgJ1RvcFJpZ2h0JzpcbiAgICAgICAge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgIHJpZ2h0OiAwXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgY2FzZSAnQ2VudGVyTGVmdCc6XG4gICAgICAgIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgICB0b3A6ICc1MCUnLFxuICAgICAgICAgICAgbGVmdDogMCxcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ3RyYW5zbGF0ZVkoLTUwJSknLFxuICAgICAgICAgICAgV2Via2l0VHJhbnNmb3JtOiAndHJhbnNsYXRlWSgtNTAlKSdcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICBjYXNlICdDZW50ZXJDZW50ZXInOlxuICAgICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgICAgdG9wOiAnNTAlJyxcbiAgICAgICAgICAgIGxlZnQ6ICc1MCUnLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlKC01MCUsLTUwJSknLFxuICAgICAgICAgICAgV2Via2l0VHJhbnNmb3JtOiAndHJhbnNsYXRlKC01MCUsIC01MCUpJ1xuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIGNhc2UgJ0NlbnRlclJpZ2h0JzpcbiAgICAgICAge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICAgIHRvcDogJzUwJScsXG4gICAgICAgICAgICByaWdodDogMCxcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ3RyYW5zbGF0ZVkoLTUwJSknLFxuICAgICAgICAgICAgV2Via2l0VHJhbnNmb3JtOiAndHJhbnNsYXRlWSgtNTAlKSdcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICBjYXNlICdCb3R0b21MZWZ0JzpcbiAgICAgICAge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgICAgIGxlZnQ6IDBcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICBjYXNlICdCb3R0b21DZW50ZXInOlxuICAgICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgICAgYm90dG9tOiAwLFxuICAgICAgICAgICAgbGVmdDogJzUwJScsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGVYKC01MCUpJyxcbiAgICAgICAgICAgIFdlYmtpdFRyYW5zZm9ybTogJ3RyYW5zbGF0ZVgoLTUwJSknXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgY2FzZSAnQm90dG9tUmlnaHQnOlxuICAgICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgICAgYm90dG9tOiAwLFxuICAgICAgICAgICAgcmlnaHQ6IDBcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgICAgdG9wOiAwLFxuICAgICAgICAgICAgbGVmdDogMFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG4gIH1cblxufSk7XG5cbkNhcm91c2VsLkNvbnRyb2xsZXJNaXhpbiA9IHtcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiBnZXRJbml0aWFsU3RhdGUoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNhcm91c2Vsczoge31cbiAgICB9O1xuICB9LFxuICBzZXRDYXJvdXNlbERhdGE6IGZ1bmN0aW9uIHNldENhcm91c2VsRGF0YShjYXJvdXNlbCkge1xuICAgIHZhciBkYXRhID0gdGhpcy5zdGF0ZS5jYXJvdXNlbHM7XG4gICAgZGF0YVtjYXJvdXNlbF0gPSB0aGlzLnJlZnNbY2Fyb3VzZWxdO1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgY2Fyb3VzZWxzOiBkYXRhXG4gICAgfSk7XG4gIH1cbn07XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IENhcm91c2VsO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX3JlYWN0ID0gUmVhY3Q7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgRGVmYXVsdERlY29yYXRvcnMgPSBbe1xuICBjb21wb25lbnQ6IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdjb21wb25lbnQnLFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdidXR0b24nLFxuICAgICAgICB7XG4gICAgICAgICAgc3R5bGU6IHRoaXMuZ2V0QnV0dG9uU3R5bGVzKHRoaXMucHJvcHMuY3VycmVudFNsaWRlID09PSAwKSxcbiAgICAgICAgICBvbkNsaWNrOiB0aGlzLnByb3BzLnByZXZpb3VzU2xpZGUsXG4gICAgICAgICAgY2xhc3NOYW1lOiB0aGlzLnByb3BzLmlkIH0sXG4gICAgICAgICc8J1xuICAgICAgKTtcbiAgICB9LFxuICAgIGdldEJ1dHRvblN0eWxlczogZnVuY3Rpb24gZ2V0QnV0dG9uU3R5bGVzKGRpc2FibGVkKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBib3JkZXI6IDAsXG4gICAgICAgIGJhY2tncm91bmQ6ICcjMzQ0OTVFJyxcbiAgICAgICAgY29sb3I6ICd3aGl0ZScsXG4gICAgICAgIHBhZGRpbmc6IDEwLFxuICAgICAgICBvdXRsaW5lOiAwLFxuICAgICAgICBvcGFjaXR5OiBkaXNhYmxlZCA/IDAuMyA6IDEsXG4gICAgICAgIGN1cnNvcjogJ3BvaW50ZXInXG4gICAgICB9O1xuICAgIH1cbiAgfSksXG4gIHBvc2l0aW9uOiAnQ2VudGVyTGVmdCdcbn0sIHtcbiAgY29tcG9uZW50OiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlQ2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnY29tcG9uZW50JyxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnYnV0dG9uJyxcbiAgICAgICAge1xuICAgICAgICAgIHN0eWxlOiB0aGlzLmdldEJ1dHRvblN0eWxlcyh0aGlzLnByb3BzLmN1cnJlbnRTbGlkZSArIHRoaXMucHJvcHMuc2xpZGVzVG9TY3JvbGwgPj0gdGhpcy5wcm9wcy5zbGlkZUNvdW50KSxcbiAgICAgICAgICBvbkNsaWNrOiB0aGlzLnByb3BzLm5leHRTbGlkZSxcbiAgICAgICAgICBjbGFzc05hbWU6IHRoaXMucHJvcHMuaWR9LFxuICAgICAgICAnPidcbiAgICAgICk7XG4gICAgfSxcbiAgICBnZXRCdXR0b25TdHlsZXM6IGZ1bmN0aW9uIGdldEJ1dHRvblN0eWxlcyhkaXNhYmxlZCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYm9yZGVyOiAwLFxuICAgICAgICBiYWNrZ3JvdW5kOiAnIzM0NDk1RScsXG4gICAgICAgIGNvbG9yOiAnd2hpdGUnLFxuICAgICAgICBwYWRkaW5nOiAxMCxcbiAgICAgICAgb3V0bGluZTogMCxcbiAgICAgICAgb3BhY2l0eTogZGlzYWJsZWQgPyAwLjMgOiAxLFxuICAgICAgICBjdXJzb3I6ICdwb2ludGVyJ1xuICAgICAgfTtcbiAgICB9XG4gIH0pLFxuICBwb3NpdGlvbjogJ0NlbnRlclJpZ2h0J1xufSwge1xuICBjb21wb25lbnQ6IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdjb21wb25lbnQnLFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgaW5kZXhlcyA9IHRoaXMuZ2V0SW5kZXhlcyhzZWxmLnByb3BzLnNsaWRlQ291bnQsIHNlbGYucHJvcHMuc2xpZGVzVG9TY3JvbGwpO1xuICAgICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAndWwnLFxuICAgICAgICB7IHN0eWxlOiBzZWxmLmdldExpc3RTdHlsZXMoKSB9LFxuICAgICAgICBpbmRleGVzLm1hcChmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAnbGknLFxuICAgICAgICAgICAgeyBzdHlsZTogc2VsZi5nZXRMaXN0SXRlbVN0eWxlcygpLCBrZXk6IGluZGV4IH0sXG4gICAgICAgICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAgICAgJ2J1dHRvbicsXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzdHlsZTogc2VsZi5nZXRCdXR0b25TdHlsZXMoc2VsZi5wcm9wcy5jdXJyZW50U2xpZGUgPT09IGluZGV4KSxcbiAgICAgICAgICAgICAgICBvbkNsaWNrOiBzZWxmLnByb3BzLmdvVG9TbGlkZS5iaW5kKG51bGwsIGluZGV4KSB9LFxuICAgICAgICAgICAgICAn4oCiJ1xuICAgICAgICAgICAgKVxuICAgICAgICAgICk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0sXG4gICAgZ2V0SW5kZXhlczogZnVuY3Rpb24gZ2V0SW5kZXhlcyhjb3VudCwgaW5jKSB7XG4gICAgICB2YXIgYXJyID0gW107XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpICs9IGluYykge1xuICAgICAgICBhcnIucHVzaChpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcnI7XG4gICAgfSxcbiAgICBnZXRMaXN0U3R5bGVzOiBmdW5jdGlvbiBnZXRMaXN0U3R5bGVzKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgICAgIG1hcmdpbjogMCxcbiAgICAgICAgdG9wOiAtMTAsXG4gICAgICAgIHBhZGRpbmc6IDBcbiAgICAgIH07XG4gICAgfSxcbiAgICBnZXRMaXN0SXRlbVN0eWxlczogZnVuY3Rpb24gZ2V0TGlzdEl0ZW1TdHlsZXMoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsaXN0U3R5bGVUeXBlOiAnbm9uZScsXG4gICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snXG4gICAgICB9O1xuICAgIH0sXG4gICAgZ2V0QnV0dG9uU3R5bGVzOiBmdW5jdGlvbiBnZXRCdXR0b25TdHlsZXMoYWN0aXZlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBib3JkZXI6IDAsXG4gICAgICAgIGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgIGNvbG9yOiAnYmxhY2snLFxuICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgcGFkZGluZzogMTAsXG4gICAgICAgIG91dGxpbmU6IDAsXG4gICAgICAgIGZvbnRTaXplOiAyNCxcbiAgICAgICAgb3BhY2l0eTogYWN0aXZlID8gMSA6IDAuNVxuICAgICAgfTtcbiAgICB9XG4gIH0pLFxuICBwb3NpdGlvbjogJ0JvdHRvbUNlbnRlcidcbn1dO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBEZWZhdWx0RGVjb3JhdG9ycztcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIi8qIVxuICBDb3B5cmlnaHQgKGMpIDIwMTUgSmVkIFdhdHNvbi5cbiAgQmFzZWQgb24gY29kZSB0aGF0IGlzIENvcHlyaWdodCAyMDEzLTIwMTUsIEZhY2Vib29rLCBJbmMuXG4gIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4qL1xuXG4oZnVuY3Rpb24gKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIGNhblVzZURPTSA9ICEhKFxuXHRcdHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmXG5cdFx0d2luZG93LmRvY3VtZW50ICYmXG5cdFx0d2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnRcblx0KTtcblxuXHR2YXIgRXhlY3V0aW9uRW52aXJvbm1lbnQgPSB7XG5cblx0XHRjYW5Vc2VET006IGNhblVzZURPTSxcblxuXHRcdGNhblVzZVdvcmtlcnM6IHR5cGVvZiBXb3JrZXIgIT09ICd1bmRlZmluZWQnLFxuXG5cdFx0Y2FuVXNlRXZlbnRMaXN0ZW5lcnM6XG5cdFx0XHRjYW5Vc2VET00gJiYgISEod2luZG93LmFkZEV2ZW50TGlzdGVuZXIgfHwgd2luZG93LmF0dGFjaEV2ZW50KSxcblxuXHRcdGNhblVzZVZpZXdwb3J0OiBjYW5Vc2VET00gJiYgISF3aW5kb3cuc2NyZWVuXG5cblx0fTtcblxuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PT0gJ29iamVjdCcgJiYgZGVmaW5lLmFtZCkge1xuXHRcdGRlZmluZShmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gRXhlY3V0aW9uRW52aXJvbm1lbnQ7XG5cdFx0fSk7XG5cdH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IEV4ZWN1dGlvbkVudmlyb25tZW50O1xuXHR9IGVsc2Uge1xuXHRcdHdpbmRvdy5FeGVjdXRpb25FbnZpcm9ubWVudCA9IEV4ZWN1dGlvbkVudmlyb25tZW50O1xuXHR9XG5cbn0oKSk7XG4iLCIvKiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtdmFycyAqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciBwcm9wSXNFbnVtZXJhYmxlID0gT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZTtcblxuZnVuY3Rpb24gdG9PYmplY3QodmFsKSB7XG5cdGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdPYmplY3QuYXNzaWduIGNhbm5vdCBiZSBjYWxsZWQgd2l0aCBudWxsIG9yIHVuZGVmaW5lZCcpO1xuXHR9XG5cblx0cmV0dXJuIE9iamVjdCh2YWwpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCwgc291cmNlKSB7XG5cdHZhciBmcm9tO1xuXHR2YXIgdG8gPSB0b09iamVjdCh0YXJnZXQpO1xuXHR2YXIgc3ltYm9scztcblxuXHRmb3IgKHZhciBzID0gMTsgcyA8IGFyZ3VtZW50cy5sZW5ndGg7IHMrKykge1xuXHRcdGZyb20gPSBPYmplY3QoYXJndW1lbnRzW3NdKTtcblxuXHRcdGZvciAodmFyIGtleSBpbiBmcm9tKSB7XG5cdFx0XHRpZiAoaGFzT3duUHJvcGVydHkuY2FsbChmcm9tLCBrZXkpKSB7XG5cdFx0XHRcdHRvW2tleV0gPSBmcm9tW2tleV07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcblx0XHRcdHN5bWJvbHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGZyb20pO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzeW1ib2xzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmIChwcm9wSXNFbnVtZXJhYmxlLmNhbGwoZnJvbSwgc3ltYm9sc1tpXSkpIHtcblx0XHRcdFx0XHR0b1tzeW1ib2xzW2ldXSA9IGZyb21bc3ltYm9sc1tpXV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdG87XG59O1xuIiwiIWZ1bmN0aW9uKGUsbil7XCJvYmplY3RcIj09dHlwZW9mIGV4cG9ydHMmJlwib2JqZWN0XCI9PXR5cGVvZiBtb2R1bGU/bW9kdWxlLmV4cG9ydHM9bigpOlwiZnVuY3Rpb25cIj09dHlwZW9mIGRlZmluZSYmZGVmaW5lLmFtZD9kZWZpbmUoW10sbik6XCJvYmplY3RcIj09dHlwZW9mIGV4cG9ydHM/ZXhwb3J0cy50d2VlblN0YXRlPW4oKTplLnR3ZWVuU3RhdGU9bigpfSh0aGlzLGZ1bmN0aW9uKCl7cmV0dXJuIGZ1bmN0aW9uKGUpe2Z1bmN0aW9uIG4ocil7aWYodFtyXSlyZXR1cm4gdFtyXS5leHBvcnRzO3ZhciBhPXRbcl09e2V4cG9ydHM6e30saWQ6cixsb2FkZWQ6ITF9O3JldHVybiBlW3JdLmNhbGwoYS5leHBvcnRzLGEsYS5leHBvcnRzLG4pLGEubG9hZGVkPSEwLGEuZXhwb3J0c312YXIgdD17fTtyZXR1cm4gbi5tPWUsbi5jPXQsbi5wPVwiXCIsbigwKX0oezA6ZnVuY3Rpb24oZSxuLHQpe2UuZXhwb3J0cz10KDkwKX0sMTpmdW5jdGlvbihlLG4pe2Z1bmN0aW9uIHQoKXtjPSExLG8ubGVuZ3RoP3M9by5jb25jYXQocyk6Zj0tMSxzLmxlbmd0aCYmcigpfWZ1bmN0aW9uIHIoKXtpZighYyl7dmFyIGU9c2V0VGltZW91dCh0KTtjPSEwO2Zvcih2YXIgbj1zLmxlbmd0aDtuOyl7Zm9yKG89cyxzPVtdOysrZjxuOylvJiZvW2ZdLnJ1bigpO2Y9LTEsbj1zLmxlbmd0aH1vPW51bGwsYz0hMSxjbGVhclRpbWVvdXQoZSl9fWZ1bmN0aW9uIGEoZSxuKXt0aGlzLmZ1bj1lLHRoaXMuYXJyYXk9bn1mdW5jdGlvbiB1KCl7fXZhciBvLGk9ZS5leHBvcnRzPXt9LHM9W10sYz0hMSxmPS0xO2kubmV4dFRpY2s9ZnVuY3Rpb24oZSl7dmFyIG49bmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGgtMSk7aWYoYXJndW1lbnRzLmxlbmd0aD4xKWZvcih2YXIgdD0xO3Q8YXJndW1lbnRzLmxlbmd0aDt0Kyspblt0LTFdPWFyZ3VtZW50c1t0XTtzLnB1c2gobmV3IGEoZSxuKSksMSE9PXMubGVuZ3RofHxjfHxzZXRUaW1lb3V0KHIsMCl9LGEucHJvdG90eXBlLnJ1bj1mdW5jdGlvbigpe3RoaXMuZnVuLmFwcGx5KG51bGwsdGhpcy5hcnJheSl9LGkudGl0bGU9XCJicm93c2VyXCIsaS5icm93c2VyPSEwLGkuZW52PXt9LGkuYXJndj1bXSxpLnZlcnNpb249XCJcIixpLnZlcnNpb25zPXt9LGkub249dSxpLmFkZExpc3RlbmVyPXUsaS5vbmNlPXUsaS5vZmY9dSxpLnJlbW92ZUxpc3RlbmVyPXUsaS5yZW1vdmVBbGxMaXN0ZW5lcnM9dSxpLmVtaXQ9dSxpLmJpbmRpbmc9ZnVuY3Rpb24oZSl7dGhyb3cgbmV3IEVycm9yKFwicHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWRcIil9LGkuY3dkPWZ1bmN0aW9uKCl7cmV0dXJuXCIvXCJ9LGkuY2hkaXI9ZnVuY3Rpb24oZSl7dGhyb3cgbmV3IEVycm9yKFwicHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkXCIpfSxpLnVtYXNrPWZ1bmN0aW9uKCl7cmV0dXJuIDB9fSw5MDpmdW5jdGlvbihlLG4sdCl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcihlKXtyZXR1cm4gZSYmZS5fX2VzTW9kdWxlP2U6e1wiZGVmYXVsdFwiOmV9fU9iamVjdC5kZWZpbmVQcm9wZXJ0eShuLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pO3ZhciBhPXQoMTY1KSx1PXIoYSksbz10KDkxKSxpPXIobykscz1cIkFERElUSVZFXCIsYz1hLmVhc2VJbk91dFF1YWQsZj0zMDAsbD0wLGg9e0FERElUSVZFOlwiQURESVRJVkVcIixERVNUUlVDVElWRTpcIkRFU1RSVUNUSVZFXCJ9LHY9e19yYWZJRDpudWxsLGdldEluaXRpYWxTdGF0ZTpmdW5jdGlvbigpe3JldHVybnt0d2VlblF1ZXVlOltdfX0sY29tcG9uZW50V2lsbFVubW91bnQ6ZnVuY3Rpb24oKXtpW1wiZGVmYXVsdFwiXS5jYW5jZWwodGhpcy5fcmFmSUQpLHRoaXMuX3JhZklEPS0xfSx0d2VlblN0YXRlOmZ1bmN0aW9uKGUsbil7dmFyIHQ9dGhpcyxyPW4uZWFzaW5nLGE9bi5kdXJhdGlvbix1PW4uZGVsYXksbz1uLmJlZ2luVmFsdWUsdj1uLmVuZFZhbHVlLGQ9bi5vbkVuZCxwPW4uc3RhY2tCZWhhdmlvcjt0aGlzLnNldFN0YXRlKGZ1bmN0aW9uKG4pe3ZhciBJPW4sdz12b2lkIDAsZz12b2lkIDA7aWYoXCJzdHJpbmdcIj09dHlwZW9mIGUpdz1lLGc9ZTtlbHNle2Zvcih2YXIgTT0wO008ZS5sZW5ndGgtMTtNKyspST1JW2VbTV1dO3c9ZVtlLmxlbmd0aC0xXSxnPWUuam9pbihcInxcIil9dmFyIG09e2Vhc2luZzpyfHxjLGR1cmF0aW9uOm51bGw9PWE/ZjphLGRlbGF5Om51bGw9PXU/bDp1LGJlZ2luVmFsdWU6bnVsbD09bz9JW3ddOm8sZW5kVmFsdWU6dixvbkVuZDpkLHN0YWNrQmVoYXZpb3I6cHx8c30seD1uLnR3ZWVuUXVldWU7cmV0dXJuIG0uc3RhY2tCZWhhdmlvcj09PWguREVTVFJVQ1RJVkUmJih4PW4udHdlZW5RdWV1ZS5maWx0ZXIoZnVuY3Rpb24oZSl7cmV0dXJuIGUucGF0aEhhc2ghPT1nfSkpLHgucHVzaCh7cGF0aEhhc2g6Zyxjb25maWc6bSxpbml0VGltZTpEYXRlLm5vdygpK20uZGVsYXl9KSxJW3ddPW0uZW5kVmFsdWUsMT09PXgubGVuZ3RoJiYodC5fcmFmSUQ9KDAsaVtcImRlZmF1bHRcIl0pKHQuX3JhZkNiKSkse3R3ZWVuUXVldWU6eH19KX0sZ2V0VHdlZW5pbmdWYWx1ZTpmdW5jdGlvbihlKXt2YXIgbj10aGlzLnN0YXRlLHQ9dm9pZCAwLHI9dm9pZCAwO2lmKFwic3RyaW5nXCI9PXR5cGVvZiBlKXQ9bltlXSxyPWU7ZWxzZXt0PW47Zm9yKHZhciBhPTA7YTxlLmxlbmd0aDthKyspdD10W2VbYV1dO3I9ZS5qb2luKFwifFwiKX1mb3IodmFyIHU9RGF0ZS5ub3coKSxhPTA7YTxuLnR3ZWVuUXVldWUubGVuZ3RoO2ErKyl7dmFyIG89bi50d2VlblF1ZXVlW2FdLGk9by5wYXRoSGFzaCxzPW8uaW5pdFRpbWUsYz1vLmNvbmZpZztpZihpPT09cil7dmFyIGY9dS1zPmMuZHVyYXRpb24/Yy5kdXJhdGlvbjpNYXRoLm1heCgwLHUtcyksbD0wPT09Yy5kdXJhdGlvbj9jLmVuZFZhbHVlOmMuZWFzaW5nKGYsYy5iZWdpblZhbHVlLGMuZW5kVmFsdWUsYy5kdXJhdGlvbiksaD1sLWMuZW5kVmFsdWU7dCs9aH19cmV0dXJuIHR9LF9yYWZDYjpmdW5jdGlvbigpe3ZhciBlPXRoaXMuc3RhdGU7aWYoMCE9PWUudHdlZW5RdWV1ZS5sZW5ndGgpe2Zvcih2YXIgbj1EYXRlLm5vdygpLHQ9W10scj0wO3I8ZS50d2VlblF1ZXVlLmxlbmd0aDtyKyspe3ZhciBhPWUudHdlZW5RdWV1ZVtyXSx1PWEuaW5pdFRpbWUsbz1hLmNvbmZpZztuLXU8by5kdXJhdGlvbj90LnB1c2goYSk6by5vbkVuZCYmby5vbkVuZCgpfS0xIT09dGhpcy5fcmFmSUQmJih0aGlzLnNldFN0YXRlKHt0d2VlblF1ZXVlOnR9KSx0aGlzLl9yYWZJRD0oMCxpW1wiZGVmYXVsdFwiXSkodGhpcy5fcmFmQ2IpKX19fTtuW1wiZGVmYXVsdFwiXT17TWl4aW46dixlYXNpbmdUeXBlczp1W1wiZGVmYXVsdFwiXSxzdGFja0JlaGF2aW9yOmh9LGUuZXhwb3J0cz1uW1wiZGVmYXVsdFwiXX0sOTE6ZnVuY3Rpb24oZSxuLHQpe2Zvcih2YXIgcj10KDkyKSxhPVwidW5kZWZpbmVkXCI9PXR5cGVvZiB3aW5kb3c/e306d2luZG93LHU9W1wibW96XCIsXCJ3ZWJraXRcIl0sbz1cIkFuaW1hdGlvbkZyYW1lXCIsaT1hW1wicmVxdWVzdFwiK29dLHM9YVtcImNhbmNlbFwiK29dfHxhW1wiY2FuY2VsUmVxdWVzdFwiK29dLGM9MDtjPHUubGVuZ3RoJiYhaTtjKyspaT1hW3VbY10rXCJSZXF1ZXN0XCIrb10scz1hW3VbY10rXCJDYW5jZWxcIitvXXx8YVt1W2NdK1wiQ2FuY2VsUmVxdWVzdFwiK29dO2lmKCFpfHwhcyl7dmFyIGY9MCxsPTAsaD1bXSx2PTFlMy82MDtpPWZ1bmN0aW9uKGUpe2lmKDA9PT1oLmxlbmd0aCl7dmFyIG49cigpLHQ9TWF0aC5tYXgoMCx2LShuLWYpKTtmPXQrbixzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7dmFyIGU9aC5zbGljZSgwKTtoLmxlbmd0aD0wO2Zvcih2YXIgbj0wO248ZS5sZW5ndGg7bisrKWlmKCFlW25dLmNhbmNlbGxlZCl0cnl7ZVtuXS5jYWxsYmFjayhmKX1jYXRjaCh0KXtzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7dGhyb3cgdH0sMCl9fSxNYXRoLnJvdW5kKHQpKX1yZXR1cm4gaC5wdXNoKHtoYW5kbGU6KytsLGNhbGxiYWNrOmUsY2FuY2VsbGVkOiExfSksbH0scz1mdW5jdGlvbihlKXtmb3IodmFyIG49MDtuPGgubGVuZ3RoO24rKyloW25dLmhhbmRsZT09PWUmJihoW25dLmNhbmNlbGxlZD0hMCl9fWUuZXhwb3J0cz1mdW5jdGlvbihlKXtyZXR1cm4gaS5jYWxsKGEsZSl9LGUuZXhwb3J0cy5jYW5jZWw9ZnVuY3Rpb24oKXtzLmFwcGx5KGEsYXJndW1lbnRzKX19LDkyOmZ1bmN0aW9uKGUsbix0KXsoZnVuY3Rpb24obil7KGZ1bmN0aW9uKCl7dmFyIHQscixhO1widW5kZWZpbmVkXCIhPXR5cGVvZiBwZXJmb3JtYW5jZSYmbnVsbCE9PXBlcmZvcm1hbmNlJiZwZXJmb3JtYW5jZS5ub3c/ZS5leHBvcnRzPWZ1bmN0aW9uKCl7cmV0dXJuIHBlcmZvcm1hbmNlLm5vdygpfTpcInVuZGVmaW5lZFwiIT10eXBlb2YgbiYmbnVsbCE9PW4mJm4uaHJ0aW1lPyhlLmV4cG9ydHM9ZnVuY3Rpb24oKXtyZXR1cm4odCgpLWEpLzFlNn0scj1uLmhydGltZSx0PWZ1bmN0aW9uKCl7dmFyIGU7cmV0dXJuIGU9cigpLDFlOSplWzBdK2VbMV19LGE9dCgpKTpEYXRlLm5vdz8oZS5leHBvcnRzPWZ1bmN0aW9uKCl7cmV0dXJuIERhdGUubm93KCktYX0sYT1EYXRlLm5vdygpKTooZS5leHBvcnRzPWZ1bmN0aW9uKCl7cmV0dXJuKG5ldyBEYXRlKS5nZXRUaW1lKCktYX0sYT0obmV3IERhdGUpLmdldFRpbWUoKSl9KS5jYWxsKHRoaXMpfSkuY2FsbChuLHQoMSkpfSwxNjU6ZnVuY3Rpb24oZSxuKXtcInVzZSBzdHJpY3RcIjt2YXIgdD17bGluZWFyOmZ1bmN0aW9uKGUsbix0LHIpe3ZhciBhPXQtbjtyZXR1cm4gYSplL3Irbn0sZWFzZUluUXVhZDpmdW5jdGlvbihlLG4sdCxyKXt2YXIgYT10LW47cmV0dXJuIGEqKGUvPXIpKmUrbn0sZWFzZU91dFF1YWQ6ZnVuY3Rpb24oZSxuLHQscil7dmFyIGE9dC1uO3JldHVybi1hKihlLz1yKSooZS0yKStufSxlYXNlSW5PdXRRdWFkOmZ1bmN0aW9uKGUsbix0LHIpe3ZhciBhPXQtbjtyZXR1cm4oZS89ci8yKTwxP2EvMiplKmUrbjotYS8yKigtLWUqKGUtMiktMSkrbn0sZWFzZUluQ3ViaWM6ZnVuY3Rpb24oZSxuLHQscil7dmFyIGE9dC1uO3JldHVybiBhKihlLz1yKSplKmUrbn0sZWFzZU91dEN1YmljOmZ1bmN0aW9uKGUsbix0LHIpe3ZhciBhPXQtbjtyZXR1cm4gYSooKGU9ZS9yLTEpKmUqZSsxKStufSxlYXNlSW5PdXRDdWJpYzpmdW5jdGlvbihlLG4sdCxyKXt2YXIgYT10LW47cmV0dXJuKGUvPXIvMik8MT9hLzIqZSplKmUrbjphLzIqKChlLT0yKSplKmUrMikrbn0sZWFzZUluUXVhcnQ6ZnVuY3Rpb24oZSxuLHQscil7dmFyIGE9dC1uO3JldHVybiBhKihlLz1yKSplKmUqZStufSxlYXNlT3V0UXVhcnQ6ZnVuY3Rpb24oZSxuLHQscil7dmFyIGE9dC1uO3JldHVybi1hKigoZT1lL3ItMSkqZSplKmUtMSkrbn0sZWFzZUluT3V0UXVhcnQ6ZnVuY3Rpb24oZSxuLHQscil7dmFyIGE9dC1uO3JldHVybihlLz1yLzIpPDE/YS8yKmUqZSplKmUrbjotYS8yKigoZS09MikqZSplKmUtMikrbn0sZWFzZUluUXVpbnQ6ZnVuY3Rpb24oZSxuLHQscil7dmFyIGE9dC1uO3JldHVybiBhKihlLz1yKSplKmUqZSplK259LGVhc2VPdXRRdWludDpmdW5jdGlvbihlLG4sdCxyKXt2YXIgYT10LW47cmV0dXJuIGEqKChlPWUvci0xKSplKmUqZSplKzEpK259LGVhc2VJbk91dFF1aW50OmZ1bmN0aW9uKGUsbix0LHIpe3ZhciBhPXQtbjtyZXR1cm4oZS89ci8yKTwxP2EvMiplKmUqZSplKmUrbjphLzIqKChlLT0yKSplKmUqZSplKzIpK259LGVhc2VJblNpbmU6ZnVuY3Rpb24oZSxuLHQscil7dmFyIGE9dC1uO3JldHVybi1hKk1hdGguY29zKGUvciooTWF0aC5QSS8yKSkrYStufSxlYXNlT3V0U2luZTpmdW5jdGlvbihlLG4sdCxyKXt2YXIgYT10LW47cmV0dXJuIGEqTWF0aC5zaW4oZS9yKihNYXRoLlBJLzIpKStufSxlYXNlSW5PdXRTaW5lOmZ1bmN0aW9uKGUsbix0LHIpe3ZhciBhPXQtbjtyZXR1cm4tYS8yKihNYXRoLmNvcyhNYXRoLlBJKmUvciktMSkrbn0sZWFzZUluRXhwbzpmdW5jdGlvbihlLG4sdCxyKXt2YXIgYT10LW47cmV0dXJuIDA9PWU/bjphKk1hdGgucG93KDIsMTAqKGUvci0xKSkrbn0sZWFzZU91dEV4cG86ZnVuY3Rpb24oZSxuLHQscil7dmFyIGE9dC1uO3JldHVybiBlPT1yP24rYTphKigtTWF0aC5wb3coMiwtMTAqZS9yKSsxKStufSxlYXNlSW5PdXRFeHBvOmZ1bmN0aW9uKGUsbix0LHIpe3ZhciBhPXQtbjtyZXR1cm4gMD09PWU/bjplPT09cj9uK2E6KGUvPXIvMik8MT9hLzIqTWF0aC5wb3coMiwxMCooZS0xKSkrbjphLzIqKC1NYXRoLnBvdygyLC0xMCotLWUpKzIpK259LGVhc2VJbkNpcmM6ZnVuY3Rpb24oZSxuLHQscil7dmFyIGE9dC1uO3JldHVybi1hKihNYXRoLnNxcnQoMS0oZS89cikqZSktMSkrbn0sZWFzZU91dENpcmM6ZnVuY3Rpb24oZSxuLHQscil7dmFyIGE9dC1uO3JldHVybiBhKk1hdGguc3FydCgxLShlPWUvci0xKSplKStufSxlYXNlSW5PdXRDaXJjOmZ1bmN0aW9uKGUsbix0LHIpe3ZhciBhPXQtbjtyZXR1cm4oZS89ci8yKTwxPy1hLzIqKE1hdGguc3FydCgxLWUqZSktMSkrbjphLzIqKE1hdGguc3FydCgxLShlLT0yKSplKSsxKStufSxlYXNlSW5FbGFzdGljOmZ1bmN0aW9uKGUsbix0LHIpe3ZhciBhLHUsbyxpPXQtbjtyZXR1cm4gbz0xLjcwMTU4LHU9MCxhPWksMD09PWU/bjoxPT09KGUvPXIpP24raToodXx8KHU9LjMqciksYTxNYXRoLmFicyhpKT8oYT1pLG89dS80KTpvPXUvKDIqTWF0aC5QSSkqTWF0aC5hc2luKGkvYSksLShhKk1hdGgucG93KDIsMTAqKGUtPTEpKSpNYXRoLnNpbigoZSpyLW8pKigyKk1hdGguUEkpL3UpKStuKX0sZWFzZU91dEVsYXN0aWM6ZnVuY3Rpb24oZSxuLHQscil7dmFyIGEsdSxvLGk9dC1uO3JldHVybiBvPTEuNzAxNTgsdT0wLGE9aSwwPT09ZT9uOjE9PT0oZS89cik/bitpOih1fHwodT0uMypyKSxhPE1hdGguYWJzKGkpPyhhPWksbz11LzQpOm89dS8oMipNYXRoLlBJKSpNYXRoLmFzaW4oaS9hKSxhKk1hdGgucG93KDIsLTEwKmUpKk1hdGguc2luKChlKnItbykqKDIqTWF0aC5QSSkvdSkraStuKX0sZWFzZUluT3V0RWxhc3RpYzpmdW5jdGlvbihlLG4sdCxyKXt2YXIgYSx1LG8saT10LW47cmV0dXJuIG89MS43MDE1OCx1PTAsYT1pLDA9PT1lP246Mj09PShlLz1yLzIpP24raToodXx8KHU9ciooLjMqMS41KSksYTxNYXRoLmFicyhpKT8oYT1pLG89dS80KTpvPXUvKDIqTWF0aC5QSSkqTWF0aC5hc2luKGkvYSksMT5lPy0uNSooYSpNYXRoLnBvdygyLDEwKihlLT0xKSkqTWF0aC5zaW4oKGUqci1vKSooMipNYXRoLlBJKS91KSkrbjphKk1hdGgucG93KDIsLTEwKihlLT0xKSkqTWF0aC5zaW4oKGUqci1vKSooMipNYXRoLlBJKS91KSouNStpK24pfSxlYXNlSW5CYWNrOmZ1bmN0aW9uKGUsbix0LHIsYSl7dmFyIHU9dC1uO3JldHVybiB2b2lkIDA9PT1hJiYoYT0xLjcwMTU4KSx1KihlLz1yKSplKigoYSsxKSplLWEpK259LGVhc2VPdXRCYWNrOmZ1bmN0aW9uKGUsbix0LHIsYSl7dmFyIHU9dC1uO3JldHVybiB2b2lkIDA9PT1hJiYoYT0xLjcwMTU4KSx1KigoZT1lL3ItMSkqZSooKGErMSkqZSthKSsxKStufSxlYXNlSW5PdXRCYWNrOmZ1bmN0aW9uKGUsbix0LHIsYSl7dmFyIHU9dC1uO3JldHVybiB2b2lkIDA9PT1hJiYoYT0xLjcwMTU4KSwoZS89ci8yKTwxP3UvMiooZSplKigoKGEqPTEuNTI1KSsxKSplLWEpKStuOnUvMiooKGUtPTIpKmUqKCgoYSo9MS41MjUpKzEpKmUrYSkrMikrbn0sZWFzZUluQm91bmNlOmZ1bmN0aW9uKGUsbixyLGEpe3ZhciB1LG89ci1uO3JldHVybiB1PXQuZWFzZU91dEJvdW5jZShhLWUsMCxvLGEpLG8tdStufSxlYXNlT3V0Qm91bmNlOmZ1bmN0aW9uKGUsbix0LHIpe3ZhciBhPXQtbjtyZXR1cm4oZS89cik8MS8yLjc1P2EqKDcuNTYyNSplKmUpK246Mi8yLjc1PmU/YSooNy41NjI1KihlLT0xLjUvMi43NSkqZSsuNzUpK246Mi41LzIuNzU+ZT9hKig3LjU2MjUqKGUtPTIuMjUvMi43NSkqZSsuOTM3NSkrbjphKig3LjU2MjUqKGUtPTIuNjI1LzIuNzUpKmUrLjk4NDM3NSkrbn0sZWFzZUluT3V0Qm91bmNlOmZ1bmN0aW9uKGUsbixyLGEpe3ZhciB1LG89ci1uO3JldHVybiBhLzI+ZT8odT10LmVhc2VJbkJvdW5jZSgyKmUsMCxvLGEpLC41KnUrbik6KHU9dC5lYXNlT3V0Qm91bmNlKDIqZS1hLDAsbyxhKSwuNSp1Ky41Km8rbil9fTtlLmV4cG9ydHM9dH19KX0pOyIsIm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBudW1fYnViYmxlcyA9IHRoaXMuZ2V0TnVtQnViYmxlcygpO1xuICAgIHJldHVybiB7bnVtX2J1YmJsZXM6IG51bV9idWJibGVzfTtcbiAgfSxcbiAgZ2V0TnVtQnViYmxlczogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHdpZHRoID0gJCh3aW5kb3cpLndpZHRoKCk7XG4gICAgdmFyIGJ1YmJsZXMgPSB3aWR0aCA+IDcwMCA/IDEwIDogNDtcbiAgICBpZiAod2lkdGggPCA0MDApIHtcbiAgICAgIGJ1YmJsZXMgPSAyO1xuICAgIH1cbiAgICByZXR1cm4gYnViYmxlcztcbiAgfSxcblxuICBjaGFuZ2VQYWdlOiBmdW5jdGlvbihkaXJlY3Rpb24pIHtcbiAgICAgIHJldHVybiAoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICB2YXIgY3VycmVudCA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleCxcbiAgICAgICAgICAgY291bnQgPSB0aGlzLnByb3BzLmNvdW50O1xuICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgbmV3IGZpcnN0IGRpc3BsYXllZCBidXR0b24gKHRpbWV0YWJsZSlcbiAgICAgICB2YXIgbmV3X2ZpcnN0ID0gY3VycmVudCArICh0aGlzLnN0YXRlLm51bV9idWJibGVzKmRpcmVjdGlvbikgLSAoY3VycmVudCAlIHRoaXMuc3RhdGUubnVtX2J1YmJsZXMpO1xuICAgICAgIGlmIChuZXdfZmlyc3QgPj0gMCAmJiBuZXdfZmlyc3QgPCBjb3VudCkge1xuICAgICAgICB0aGlzLnByb3BzLnNldEluZGV4KG5ld19maXJzdCkoKTtcbiAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICAgIFxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvcHRpb25zID0gW10sIGNvdW50ID0gdGhpcy5wcm9wcy5jb3VudCwgY3VycmVudCA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleDtcbiAgICBpZiAoY291bnQgPD0gMSkgeyByZXR1cm4gbnVsbDsgfSAvLyBkb24ndCBkaXNwbGF5IGlmIHRoZXJlIGFyZW4ndCBlbm91Z2ggc2NoZWR1bGVzXG4gICAgdmFyIGZpcnN0ID0gY3VycmVudCAtIChjdXJyZW50ICUgdGhpcy5zdGF0ZS5udW1fYnViYmxlcyk7IC8vIHJvdW5kIGRvd24gdG8gbmVhcmVzdCBtdWx0aXBsZSBvZiB0aGlzLnByb3BzLm51bUJ1YmJsZXNcbiAgICB2YXIgbGltaXQgPSBNYXRoLm1pbihmaXJzdCArIHRoaXMuc3RhdGUubnVtX2J1YmJsZXMsIGNvdW50KTtcbiAgICBmb3IgKHZhciBpID0gZmlyc3Q7IGkgPCBsaW1pdDsgaSsrKSB7XG4gICAgICB2YXIgY2xhc3NOYW1lID0gdGhpcy5wcm9wcy5jdXJyZW50X2luZGV4ID09IGkgPyBcInNlbS1wYWdlIGFjdGl2ZVwiIDogXCJzZW0tcGFnZVwiO1xuICAgICAgb3B0aW9ucy5wdXNoKFxuICAgICAgICA8bGkga2V5PXtpfSBjbGFzc05hbWU9e2NsYXNzTmFtZX0gb25DbGljaz17dGhpcy5wcm9wcy5zZXRJbmRleChpKX0+XG4gICAgICAgICAgICAgIDxhPntpICsgMX08L2E+XG4gICAgICAgIDwvbGk+KTtcbiAgICB9XG4gICAgdmFyIHByZXZfZG91YmxlID0gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJzZW0tcGFnaW5hdGlvbi1uYXYgbmF2LWRvdWJsZSBuYXYtZG91YmxlLXByZXZcIiBvbkNsaWNrPXt0aGlzLmNoYW5nZVBhZ2UoLTEpfT5cbiAgICAgICAgPGkgY2xhc3NOYW1lPVwiZmEgZmEtYW5nbGUtZG91YmxlLWxlZnQgc2VtLXBhZ2luYXRpb24tcHJldiBzZW0tcGFnaW5hdGlvbi1pY29uXCIgLz5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gICAgdmFyIG5leHRfZG91YmxlID0gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJzZW0tcGFnaW5hdGlvbi1uYXYgbmF2LWRvdWJsZSBuYXYtZG91YmxlLW5leHRcIiBvbkNsaWNrPXt0aGlzLmNoYW5nZVBhZ2UoMSl9PlxuICAgICAgICA8aSBjbGFzc05hbWU9XCJmYSBmYS1hbmdsZS1kb3VibGUtcmlnaHQgc2VtLXBhZ2luYXRpb24tbmV4dCBzZW0tcGFnaW5hdGlvbi1pY29uXCIgLz5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gICAgaWYgKGNvdW50IDwgKHRoaXMuc3RhdGUubnVtX2J1YmJsZXMgKyAxKSkge1xuICAgICAgcHJldl9kb3VibGUgPSBudWxsO1xuICAgICAgbmV4dF9kb3VibGUgPSBudWxsO1xuICAgIH1cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZW0tcGFnaW5hdGlvblwiPlxuXHRcdFx0XHR7cHJldl9kb3VibGV9XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2VtLXBhZ2luYXRpb24tbmF2XCIgb25DbGljaz17dGhpcy5wcm9wcy5wcmV2fT5cblx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9XCJmYSBmYS1hbmdsZS1sZWZ0IHNlbS1wYWdpbmF0aW9uLXByZXYgc2VtLXBhZ2luYXRpb24taWNvblwiIC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8b2wgY2xhc3NOYW1lPVwic2VtLXBhZ2VzXCI+XG5cdFx0XHRcdFx0e29wdGlvbnN9XG5cdFx0XHRcdDwvb2w+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2VtLXBhZ2luYXRpb24tbmF2XCIgb25DbGljaz17dGhpcy5wcm9wcy5uZXh0fT5cblx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9XCJmYSBmYS1hbmdsZS1yaWdodCBzZW0tcGFnaW5hdGlvbi1uZXh0IHNlbS1wYWdpbmF0aW9uLWljb25cIiAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0e25leHRfZG91YmxlfVxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fSxcbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICQod2luZG93KS5yZXNpemUoZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtudW1fYnViYmxlczogdGhpcy5nZXROdW1CdWJibGVzKCl9KTtcbiAgICB9LmJpbmQodGhpcykpO1xuICB9LFxuXG5cbn0pOyIsIm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBudW1fYnViYmxlcyA9IHRoaXMuZ2V0TnVtQnViYmxlcygpO1xuICAgIHJldHVybiB7Zmlyc3RfZGlzcGxheWVkOiAwLCBudW1fYnViYmxlczogbnVtX2J1YmJsZXN9O1xuICB9LFxuICBnZXROdW1CdWJibGVzOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgYnViYmxlcyA9ICQod2luZG93KS53aWR0aCgpID4gNzAwID8gOSA6IDQ7XG4gICAgcmV0dXJuIGJ1YmJsZXM7XG4gIH0sXG5cbiAgY2hhbmdlUGFnZTogZnVuY3Rpb24oZGlyZWN0aW9uKSB7XG4gICAgICByZXR1cm4gKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgdmFyIGN1cnJlbnQgPSB0aGlzLnByb3BzLmN1cnJlbnRfaW5kZXgsXG4gICAgICAgICAgIGNvdW50ID0gdGhpcy5wcm9wcy5jb3VudDtcbiAgICAgICAvLyBjYWxjdWxhdGUgdGhlIG5ldyBmaXJzdF9kaXNwbGF5ZWQgYnV0dG9uICh0aW1ldGFibGUpXG4gICAgICAgdmFyIG5ld19maXJzdCA9IGN1cnJlbnQgKyAodGhpcy5zdGF0ZS5udW1fYnViYmxlcypkaXJlY3Rpb24pIC0gKGN1cnJlbnQgJSB0aGlzLnN0YXRlLm51bV9idWJibGVzKTtcbiAgICAgICBpZiAobmV3X2ZpcnN0ID49IDAgJiYgbmV3X2ZpcnN0IDwgY291bnQpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5zZXRJbmRleChuZXdfZmlyc3QpKCk7XG4gICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgb3B0aW9ucyA9IFtdLCBjb3VudCA9IHRoaXMucHJvcHMuY291bnQsIGN1cnJlbnQgPSB0aGlzLnByb3BzLmN1cnJlbnRfaW5kZXg7XG4gICAgaWYgKGNvdW50IDw9IDEpIHsgcmV0dXJuIG51bGw7IH0gLy8gZG9uJ3QgZGlzcGxheSBpZiB0aGVyZSBhcmVuJ3QgZW5vdWdoIHNjaGVkdWxlc1xuICAgIHZhciBmaXJzdCA9IGN1cnJlbnQgLSAoY3VycmVudCAlIHRoaXMuc3RhdGUubnVtX2J1YmJsZXMpOyAvLyByb3VuZCBkb3duIHRvIG5lYXJlc3QgbXVsdGlwbGUgb2YgdGhpcy5wcm9wcy5udW1CdWJibGVzXG4gICAgdmFyIGxpbWl0ID0gTWF0aC5taW4oZmlyc3QgKyB0aGlzLnN0YXRlLm51bV9idWJibGVzLCBjb3VudCk7XG4gICAgZm9yICh2YXIgaSA9IGZpcnN0OyBpIDwgbGltaXQ7IGkrKykge1xuICAgICAgdmFyIGNsYXNzTmFtZSA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleCA9PSBpID8gXCJhY3RpdmVcIiA6IFwiXCI7XG4gICAgICBvcHRpb25zLnB1c2goXG4gICAgICAgIDxsaSBrZXk9e2l9IGNsYXNzTmFtZT17Y2xhc3NOYW1lfT5cbiAgICAgICAgICAgICAgPGEgb25DbGljaz17dGhpcy5wcm9wcy5zZXRJbmRleChpKX0+e2kgKyAxfTwvYT5cbiAgICAgICAgPC9saT4pO1xuICAgIH1cbiAgICB2YXIgcHJldl9kb3VibGUgPSAoXG4gICAgICA8bGkgY2xhc3NOYW1lPVwicHJldi1kb3VibGVcIiBvbkNsaWNrPXt0aGlzLmNoYW5nZVBhZ2UoLTEpfT5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYWdpbmF0aW9uLWJ0blwiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLWFuZ2xlLWRvdWJsZS1sZWZ0XCI+PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvbGk+XG4gICAgKTtcbiAgICB2YXIgbmV4dF9kb3VibGUgPSAoXG4gICAgICA8bGkgY2xhc3NOYW1lPVwibmV4dC1kb3VibGVcIiBvbkNsaWNrPXt0aGlzLmNoYW5nZVBhZ2UoMSl9PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2luYXRpb24tYnRuXCI+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtYW5nbGUtZG91YmxlLXJpZ2h0XCI+PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvbGk+XG4gICAgKTtcbiAgICBpZiAoY291bnQgPCAodGhpcy5zdGF0ZS5udW1fYnViYmxlcyArIDEpKSB7XG4gICAgICBwcmV2X2RvdWJsZSA9IG51bGw7XG4gICAgICBuZXh0X2RvdWJsZSA9IG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYWdpbmF0aW9uIHBhZ2luYXRpb24tbWluaW1hbFwiPlxuICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgIHtwcmV2X2RvdWJsZX1cbiAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJwcmV2aW91c1wiPlxuICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJmdWktYXJyb3ctbGVmdCBwYWdpbmF0aW9uLWJ0blwiIFxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMucHJldn0+PC9hPlxuICAgICAgICAgICAgPC9saT5cblxuICAgICAgICAgICAge29wdGlvbnN9XG4gICAgICAgICAgXG4gICAgICAgICAgICA8bGkgY2xhc3NOYW1lPVwibmV4dFwiPlxuICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJmdWktYXJyb3ctcmlnaHQgcGFnaW5hdGlvbi1idG5cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMubmV4dH0+PC9hPlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgIHtuZXh0X2RvdWJsZX1cbiAgICAgICAgICA8L3VsPlxuICAgICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAkKHdpbmRvdykucmVzaXplKGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7bnVtX2J1YmJsZXM6IHRoaXMuZ2V0TnVtQnViYmxlcygpfSk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcbiAgXG5cbn0pOyIsInZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgVGltZXRhYmxlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xuXG52YXIgQmluYXJ5UHJlZmVyZW5jZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgbWl4aW5zOiBbUmVmbHV4LmNvbm5lY3QoVGltZXRhYmxlU3RvcmUpXSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0b2dnbGVfbGFiZWwgPSBcImNtbi10b2dnbGUtXCIgKyB0aGlzLnByb3BzLnRvZ2dsZV9pZDtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcmVmZXJlbmNlLWl0ZW1cIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcmVmZXJlbmNlLXRleHRcIj5cbiAgICAgICAgICA8bGk+IHt0aGlzLnByb3BzLnRleHR9IDwvbGk+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInByZWZlcmVuY2UtdG9nZ2xlXCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzd2l0Y2hcIj5cbiAgICAgICAgICAgIDxpbnB1dCByZWY9XCJjaGVja2JveF9lbGVtXCIgaWQ9e3RvZ2dsZV9sYWJlbH0gXG4gICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtcImNtbi10b2dnbGUgY21uLXRvZ2dsZS1yb3VuZCBcIiArIHRoaXMucHJvcHMubmFtZX0gXG4gICAgICAgICAgICAgICAgICAgdHlwZT1cImNoZWNrYm94XCIgXG4gICAgICAgICAgICAgICAgICAgY2hlY2tlZD17dGhpcy5zdGF0ZS5wcmVmZXJlbmNlc1t0aGlzLnByb3BzLm5hbWVdfVxuICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMudG9nZ2xlUHJlZmVyZW5jZX0vPlxuICAgICAgICAgICAgPGxhYmVsIGh0bWxGb3I9e3RvZ2dsZV9sYWJlbH0+PC9sYWJlbD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIHRvZ2dsZVByZWZlcmVuY2U6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBuZXdfdmFsdWUgPSAhdGhpcy5zdGF0ZS5wcmVmZXJlbmNlc1t0aGlzLnByb3BzLm5hbWVdO1xuICAgIFRpbWV0YWJsZUFjdGlvbnMudXBkYXRlUHJlZmVyZW5jZXModGhpcy5wcm9wcy5uYW1lLCBuZXdfdmFsdWUpO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIGN1cnJlbnRfdG9nZ2xlX2lkOiAwLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJtZW51LWNvbnRhaW5lclwiIGNsYXNzTmFtZT1cImNvbGxhcHNlXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibmF2YmFyLWNvbGxhcHNlXCIgPlxuICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJuYXYgbmF2YmFyLW5hdlwiIGlkPVwibWVudVwiPlxuICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgPEJpbmFyeVByZWZlcmVuY2UgdGV4dD1cIkF2b2lkIGVhcmx5IGNsYXNzZXNcIiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lPVwibm9fY2xhc3Nlc19iZWZvcmVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZV9pZD17dGhpcy5nZXRfbmV4dF90b2dnbGVfaWQoKX0gLz5cbiAgICAgICAgICAgICAgICA8QmluYXJ5UHJlZmVyZW5jZSB0ZXh0PVwiQXZvaWQgbGF0ZSBjbGFzc2VzXCIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZT1cIm5vX2NsYXNzZXNfYWZ0ZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZV9pZD17dGhpcy5nZXRfbmV4dF90b2dnbGVfaWQoKX0gLz5cbiAgICAgICAgICAgICAgICA8QmluYXJ5UHJlZmVyZW5jZSB0ZXh0PVwiQWxsb3cgY29uZmxpY3RzXCIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZT1cInRyeV93aXRoX2NvbmZsaWN0c1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9nZ2xlX2lkPXt0aGlzLmdldF9uZXh0X3RvZ2dsZV9pZCgpfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICA8L3VsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgZ2V0X25leHRfdG9nZ2xlX2lkOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmN1cnJlbnRfdG9nZ2xlX2lkICs9IDFcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50X3RvZ2dsZV9pZDtcbiAgfVxuXG59KTtcbiIsInZhciBDb250cm9sQmFyID0gcmVxdWlyZSgnLi9jb250cm9sX2JhcicpO1xudmFyIFRpbWV0YWJsZSA9IHJlcXVpcmUoJy4vdGltZXRhYmxlJyk7XG52YXIgTW9kYWxDb250ZW50ID0gcmVxdWlyZSgnLi9tb2RhbF9jb250ZW50Jyk7XG52YXIgVG9hc3RTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3RvYXN0X3N0b3JlLmpzJyk7XG52YXIgVGltZXRhYmxlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIGNvdXJzZV9hY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL2NvdXJzZV9hY3Rpb25zJyk7XG52YXIgU2lkZWJhciA9IHJlcXVpcmUoJy4vc2lkZV9iYXInKTtcbnZhciBTaW1wbGVNb2RhbCA9IHJlcXVpcmUoJy4vc2ltcGxlX21vZGFsJyk7XG52YXIgU2Nob29sTGlzdCA9IHJlcXVpcmUoJy4vc2Nob29sX2xpc3QnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIG1peGluczogW1JlZmx1eC5jb25uZWN0KFRpbWV0YWJsZVN0b3JlKSwgUmVmbHV4LmNvbm5lY3QoVG9hc3RTdG9yZSldLFxuICBzaWRlYmFyX2NvbGxhcHNlZDogJ25ldXRyYWwnLFxuXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgTW9kYWwgPSBCb3JvblsnT3V0bGluZU1vZGFsJ107XG4gICAgdmFyIGxvYWRlciA9ICEodGhpcy5zdGF0ZS5sb2FkaW5nIHx8IHRoaXMuc3RhdGUuY291cnNlc19sb2FkaW5nKSA/IG51bGwgOlxuICAgICAgKCAgPGRpdiBjbGFzc05hbWU9XCJzcGlubmVyXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QxXCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QyXCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QzXCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3Q0XCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3Q1XCI+PC9kaXY+XG4gICAgICAgIDwvZGl2Pik7XG4gICAgdmFyIHNjaG9vbF9zZWxlY3RvciA9IChcbiAgICAgIDxTaW1wbGVNb2RhbCBoZWFkZXI9XCJTZW1lc3Rlci5seSB8IFdlbGNvbWVcIlxuICAgICAgICAgICAgICAgICAgIGtleT1cInNjaG9vbFwiXG4gICAgICAgICAgICAgICAgICAgcmVmPVwic2Nob29sX21vZGFsXCJcbiAgICAgICAgICAgICAgICAgICBhbGxvd19kaXNhYmxlPXtmYWxzZX1cbiAgICAgICAgICAgICAgICAgICBzdHlsZXM9e3tiYWNrZ3JvdW5kQ29sb3I6IFwiI0ZERjVGRlwiLCBjb2xvcjogXCIjMDAwXCJ9fSBcbiAgICAgICAgICAgICAgICAgICBjb250ZW50PXs8U2Nob29sTGlzdCBzZXRTY2hvb2w9e3RoaXMuc2V0U2Nob29sfS8+IH0vPik7XG4gICAgICBcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBpZD1cInJvb3RcIj5cbiAgICAgICAge2xvYWRlcn1cbiAgICAgICAgPGRpdiBpZD1cInRvYXN0LWNvbnRhaW5lclwiPjwvZGl2PlxuICAgICAgICA8ZGl2IGlkPVwiY29udHJvbC1iYXItY29udGFpbmVyXCI+XG4gICAgICAgICAgPGRpdiBpZD1cInNlbWVzdGVybHktbmFtZVwiPlNlbWVzdGVyLmx5PC9kaXY+XG4gICAgICAgICAgPGltZyBpZD1cInNlbWVzdGVybHktbG9nb1wiIHNyYz1cIi9zdGF0aWMvaW1nL2xvZ28yLjAucG5nXCIvPlxuICAgICAgICAgIDxDb250cm9sQmFyIHRvZ2dsZU1vZGFsPXt0aGlzLnRvZ2dsZUNvdXJzZU1vZGFsfS8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGlkPVwibmF2aWNvblwiIG9uQ2xpY2s9e3RoaXMudG9nZ2xlU2lkZU1vZGFsfT5cbiAgICAgICAgICA8c3Bhbj48L3NwYW4+PHNwYW4+PC9zcGFuPjxzcGFuPjwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJtb2RhbC1jb250YWluZXJcIj5cbiAgICAgICAgICA8TW9kYWwgY2xvc2VPbkNsaWNrPXt0cnVlfSByZWY9J091dGxpbmVNb2RhbCcgY2xhc3NOYW1lPVwiY291cnNlLW1vZGFsXCI+XG4gICAgICAgICAgICAgIDxNb2RhbENvbnRlbnQgc2Nob29sPXt0aGlzLnN0YXRlLnNjaG9vbH0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY291cnNlc190b19zZWN0aW9ucz17dGhpcy5zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zfSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaWRlPXt0aGlzLmhpZGVDb3Vyc2VNb2RhbH0gLz5cbiAgICAgICAgICA8L01vZGFsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhbGwtY29scy1jb250YWluZXJcIj5cbiAgICAgICAgICA8U2lkZWJhciB0b2dnbGVNb2RhbD17dGhpcy50b2dnbGVDb3Vyc2VNb2RhbH0vPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY2FsLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgPFRpbWV0YWJsZSB0b2dnbGVNb2RhbD17dGhpcy50b2dnbGVDb3Vyc2VNb2RhbH0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtzY2hvb2xfc2VsZWN0b3J9XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5zY2hvb2wgPT0gXCJcIiAmJiB0aGlzLnByb3BzLmRhdGEgPT0gbnVsbCkge1xuICAgICAgdGhpcy5zaG93U2Nob29sTW9kYWwoKTtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5zY2hvb2wgIT0gXCJcIikge1xuICAgICAgdGhpcy5oaWRlU2Nob29sTW9kYWwoKTtcbiAgICB9XG4gIH0sXG5cbiAgdG9nZ2xlQ291cnNlTW9kYWw6IGZ1bmN0aW9uKGNvdXJzZV9pZCkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5yZWZzWydPdXRsaW5lTW9kYWwnXS50b2dnbGUoKTtcbiAgICAgICAgY291cnNlX2FjdGlvbnMuZ2V0Q291cnNlSW5mbyh0aGlzLnN0YXRlLnNjaG9vbCwgY291cnNlX2lkKTtcbiAgICB9LmJpbmQodGhpcyk7IFxuICB9LFxuXG4gIGhpZGVDb3Vyc2VNb2RhbDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5yZWZzWydPdXRsaW5lTW9kYWwnXS5oaWRlKCk7XG4gIH0sXG5cbiAgc2hvd1NjaG9vbE1vZGFsOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMucmVmcy5zY2hvb2xfbW9kYWwuc2hvdygpO1xuICB9LFxuICBoaWRlU2Nob29sTW9kYWw6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5yZWZzLnNjaG9vbF9tb2RhbC5oaWRlKCk7XG4gIH0sXG5cbiAgdG9nZ2xlU2lkZU1vZGFsOiBmdW5jdGlvbigpe1xuICAgIGlmICh0aGlzLnNpZGViYXJfY29sbGFwc2VkID09ICduZXV0cmFsJykge1xuICAgICAgdmFyIGJvZHl3ID0gJCh3aW5kb3cpLndpZHRoKCk7XG4gICAgICBpZiAoYm9keXcgPiA5OTkpIHtcbiAgICAgICAgdGhpcy5jb2xsYXBzZVNpZGVNb2RhbCgpO1xuICAgICAgICB0aGlzLnNpZGViYXJfY29sbGFwc2VkID0gJ29wZW4nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5leHBhbmRTaWRlTW9kYWwoKTtcbiAgICAgICAgdGhpcy5zaWRlYmFyX2NvbGxhcHNlZCA9ICdjbG9zZWQnO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5zaWRlYmFyX2NvbGxhcHNlZCA9PSAnY2xvc2VkJykge1xuICAgICAgdGhpcy5leHBhbmRTaWRlTW9kYWwoKTtcbiAgICAgIHRoaXMuc2lkZWJhcl9jb2xsYXBzZWQgPSAnb3Blbic7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY29sbGFwc2VTaWRlTW9kYWwoKTtcbiAgICAgIHRoaXMuc2lkZWJhcl9jb2xsYXBzZWQgPSAnY2xvc2VkJztcbiAgICB9XG4gIH0sXG5cbiAgZXhwYW5kU2lkZU1vZGFsOiBmdW5jdGlvbigpIHtcbiAgICAkKCcuY2FsLWNvbnRhaW5lciwgLnNpZGUtY29udGFpbmVyJykucmVtb3ZlQ2xhc3MoJ2Z1bGwtY2FsJykuYWRkQ2xhc3MoJ2xlc3MtY2FsJyk7XG4gIH0sXG5cbiAgY29sbGFwc2VTaWRlTW9kYWw6IGZ1bmN0aW9uKCkge1xuICAgICQoJy5jYWwtY29udGFpbmVyLCAuc2lkZS1jb250YWluZXInKS5yZW1vdmVDbGFzcygnbGVzcy1jYWwnKS5hZGRDbGFzcygnZnVsbC1jYWwnKTtcbiAgfVxuXG59KTtcbiIsIlRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gXHQoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNjaG9vbC1saXN0XCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2Nob29sLXBpY2tlciBzY2hvb2wtamh1XCIgXG5cdFx0XHRcdFx0b25DbGljaz17dGhpcy5zZXRTY2hvb2woXCJqaHVcIil9PlxuXHRcdFx0XHRcdDxpbWcgc3JjPVwiL3N0YXRpYy9pbWcvc2Nob29sX2xvZ29zL2podV9sb2dvLnBuZ1wiIFxuXHRcdFx0XHRcdFx0Y2xhc3NOYW1lPVwic2Nob29sLWxvZ29cIi8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNjaG9vbC1waWNrZXIgc2Nob29sLXVvZnRcIiBcblx0XHRcdFx0XHRvbkNsaWNrPXt0aGlzLnNldFNjaG9vbChcInVvZnRcIil9PlxuXHRcdFx0XHRcdDxpbWcgc3JjPVwiL3N0YXRpYy9pbWcvc2Nob29sX2xvZ29zL3VvZnRfbG9nby5wbmdcIiBcblx0XHRcdFx0XHRcdGNsYXNzTmFtZT1cInNjaG9vbC1sb2dvXCIvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2Pik7XG5cdH0sXG5cblx0c2V0U2Nob29sOiBmdW5jdGlvbihuZXdfc2Nob29sKSB7XG5cdFx0cmV0dXJuIChmdW5jdGlvbigpIHtcblx0XHRcdFRpbWV0YWJsZUFjdGlvbnMuc2V0U2Nob29sKG5ld19zY2hvb2wpO1xuXHRcdH0uYmluZCh0aGlzKSk7XG5cdH0sXG5cbn0pO1xuXG4iLCJ2YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFRpbWV0YWJsZVN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcblxudmFyIFNlYXJjaFJlc3VsdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGlfY2xhc3MgPSBcInNlYXJjaC1yZXN1bHRcIiwgaWNvbl9jbGFzcyA9IFwiZnVpLXBsdXNcIjtcbiAgICBpZiAodGhpcy5wcm9wcy5pbl9yb3N0ZXIpIHtcbiAgICAgIGxpX2NsYXNzICs9IFwiIHRvZG8tZG9uZVwiO1xuICAgICAgaWNvbl9jbGFzcyA9IFwiZnVpLWNoZWNrXCI7XG4gICAgfVxuICAgIHJldHVybiAoXG4gICAgICA8bGkgY2xhc3NOYW1lPXtsaV9jbGFzc30gb25Nb3VzZURvd249e3RoaXMucHJvcHMudG9nZ2xlTW9kYWwodGhpcy5wcm9wcy5pZCl9PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRvZG8tY29udGVudFwiPlxuICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJ0b2RvLW5hbWVcIj5cbiAgICAgICAgICAgIHt0aGlzLnByb3BzLmNvZGV9XG4gICAgICAgICAgPC9oND5cbiAgICAgICAgICB7dGhpcy5wcm9wcy5uYW1lfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtcInNlYXJjaC1yZXN1bHQtYWN0aW9uIFwiICsgaWNvbl9jbGFzc30gXG4gICAgICAgICAgb25Nb3VzZURvd249e3RoaXMudG9nZ2xlQ291cnNlfT5cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9saT5cbiAgICApO1xuICB9LFxuXG4gIHRvZ2dsZUNvdXJzZTogZnVuY3Rpb24oZSkge1xuICAgIHZhciByZW1vdmluZyA9IHRoaXMucHJvcHMuaW5fcm9zdGVyO1xuICAgIFRpbWV0YWJsZUFjdGlvbnMudXBkYXRlQ291cnNlcyh7aWQ6IHRoaXMucHJvcHMuaWQsIHNlY3Rpb246ICcnLCByZW1vdmluZzogcmVtb3Zpbmd9KTtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7ICAvLyBzdG9wIGlucHV0IGZyb20gdHJpZ2dlcmluZyBvbkJsdXIgYW5kIHRodXMgaGlkaW5nIHJlc3VsdHNcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpOyAvLyBzdG9wIHBhcmVudCBmcm9tIG9wZW5pbmcgbW9kYWxcbiAgfSxcblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBtaXhpbnM6IFtSZWZsdXguY29ubmVjdChUaW1ldGFibGVTdG9yZSldLFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvdXJzZXM6W10sXG4gICAgICByZXN1bHRzOiBbXSxcbiAgICAgIGZvY3VzZWQ6IGZhbHNlLFxuICAgIH07XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVwZGF0ZTogZnVuY3Rpb24obmV3X3Byb3BzLCBuZXdfc3RhdGUpIHtcbiAgICBpZiAobmV3X3N0YXRlLnNjaG9vbCAhPSB0aGlzLnN0YXRlLnNjaG9vbCkge1xuICAgICAgdGhpcy5nZXRDb3Vyc2VzKG5ld19zdGF0ZS5zY2hvb2wpO1xuICAgIH1cblxuICB9LFxuICBnZXRDb3Vyc2VzOiBmdW5jdGlvbihzY2hvb2wpIHtcbiAgICBUaW1ldGFibGVBY3Rpb25zLnNldENvdXJzZXNMb2FkaW5nKCk7XG4gICAgJC5nZXQoXCIvY291cnNlcy9cIiArIHNjaG9vbCArIFwiL1wiICsgX1NFTUVTVEVSLCBcbiAgICAgICAge30sIFxuICAgICAgICBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2NvdXJzZXM6IHJlc3BvbnNlfSk7XG4gICAgICAgICAgVGltZXRhYmxlQWN0aW9ucy5zZXRDb3Vyc2VzRG9uZUxvYWRpbmcoKTtcblxuICAgICAgICB9LmJpbmQodGhpcylcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlYXJjaF9yZXN1bHRzX2RpdiA9IHRoaXMuZ2V0U2VhcmNoUmVzdWx0c0NvbXBvbmVudCgpO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGlkPVwic2VhcmNoLWJhclwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImlucHV0LWNvbWJpbmVcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImlucHV0LXdyYXBwZXJcIj5cbiAgICAgICAgICAgIDxpbnB1dCBcbiAgICAgICAgICAgICAgdHlwZT1cInRleHRcIiBcbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJTZWFyY2ggYnkgY29kZSwgdGl0bGUsIGRlc2NyaXB0aW9uLCBkZWdyZWVcIiBcbiAgICAgICAgICAgICAgaWQ9XCJzZWFyY2gtaW5wdXRcIiBcbiAgICAgICAgICAgICAgcmVmPVwiaW5wdXRcIiBcbiAgICAgICAgICAgICAgb25Gb2N1cz17dGhpcy5mb2N1c30gb25CbHVyPXt0aGlzLmJsdXJ9IFxuICAgICAgICAgICAgICBvbklucHV0PXt0aGlzLnF1ZXJ5Q2hhbmdlZH0vPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGJ1dHRvbiBkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCIgZGF0YS10YXJnZXQ9XCIjbWVudS1jb250YWluZXJcIiBpZD1cIm1lbnUtYnRuXCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwic2xpZGVyc1wiPlxuICAgICAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJveFwiPjwvZGl2PlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYm94XCI+PC9kaXY+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJib3hcIj48L2Rpdj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAge3NlYXJjaF9yZXN1bHRzX2Rpdn1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIGdldFNlYXJjaFJlc3VsdHNDb21wb25lbnQ6IGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGhpcy5zdGF0ZS5mb2N1c2VkIHx8IHRoaXMuc3RhdGUucmVzdWx0cy5sZW5ndGggPT0gMCkge3JldHVybiBudWxsO31cbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIHNlYXJjaF9yZXN1bHRzID0gdGhpcy5zdGF0ZS5yZXN1bHRzLm1hcChmdW5jdGlvbihyKSB7XG4gICAgICBpKys7XG4gICAgICB2YXIgaW5fcm9zdGVyID0gdGhpcy5zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zW3IuaWRdICE9IG51bGw7XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8U2VhcmNoUmVzdWx0IHsuLi5yfSBrZXk9e2l9IGluX3Jvc3Rlcj17aW5fcm9zdGVyfSB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0vPlxuICAgICAgKTtcbiAgICB9LmJpbmQodGhpcykpO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGlkPVwic2VhcmNoLXJlc3VsdHMtY29udGFpbmVyXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidG9kbyBtcm1cIj5cbiAgICAgICAgICAgIDx1bCBpZD1cInNlYXJjaC1yZXN1bHRzXCI+XG4gICAgICAgICAgICAgIHtzZWFyY2hfcmVzdWx0c31cbiAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIGZvY3VzOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtmb2N1c2VkOiB0cnVlfSk7XG4gIH0sXG5cbiAgYmx1cjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7Zm9jdXNlZDogZmFsc2V9KTtcbiAgfSxcblxuICBxdWVyeUNoYW5nZWQ6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdmFyIHF1ZXJ5ID0gZXZlbnQudGFyZ2V0LnZhbHVlLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFyIGZpbHRlcmVkID0gcXVlcnkubGVuZ3RoIDw9IDEgPyBbXSA6IHRoaXMuZmlsdGVyQ291cnNlcyhxdWVyeSk7XG4gICAgdGhpcy5zZXRTdGF0ZSh7cmVzdWx0czogZmlsdGVyZWR9KTtcbiAgfSxcblxuICBpc1N1YnNlcXVlbmNlOiBmdW5jdGlvbihyZXN1bHQscXVlcnkpIHtcbiAgICAgIHJlc3VsdCA9IHF1ZXJ5LnNwbGl0KFwiIFwiKS5ldmVyeShmdW5jdGlvbihzKSB7XG4gICAgICAgICAgaWYgKHJlc3VsdC5pbmRleE9mKHMpID4gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gIH0sXG5cbiAgZmlsdGVyQ291cnNlczogZnVuY3Rpb24ocXVlcnkpIHtcbiAgICB2YXIgb3B0X3F1ZXJ5ID0gcXVlcnkucmVwbGFjZShcImludHJvXCIsXCJpbnRyb2R1Y3Rpb25cIik7XG4gICAgdmFyIGFuZF9xdWVyeSA9IHF1ZXJ5LnJlcGxhY2UoXCImXCIsXCJhbmRcIik7XG4gICAgdGhhdCA9IHRoaXM7XG4gICAgdmFyIHJlc3VsdHMgPSB0aGlzLnN0YXRlLmNvdXJzZXMuZmlsdGVyKGZ1bmN0aW9uKGMpIHtcbiAgICAgIHJldHVybiAodGhhdC5pc1N1YnNlcXVlbmNlKGMubmFtZS50b0xvd2VyQ2FzZSgpLHF1ZXJ5KSB8fCBcbiAgICAgICAgICAgICB0aGF0LmlzU3Vic2VxdWVuY2UoYy5uYW1lLnRvTG93ZXJDYXNlKCksb3B0X3F1ZXJ5KSB8fFxuICAgICAgICAgICAgIGMubmFtZS50b0xvd2VyQ2FzZSgpLmluZGV4T2Yob3B0X3F1ZXJ5KSA+IC0xIHx8XG4gICAgICAgICAgICAgdGhhdC5pc1N1YnNlcXVlbmNlKGMubmFtZS50b0xvd2VyQ2FzZSgpLGFuZF9xdWVyeSkgfHxcbiAgICAgICAgICAgICBjLm5hbWUudG9Mb3dlckNhc2UoKS5pbmRleE9mKGFuZF9xdWVyeSkgPiAtMSB8fFxuICAgICAgICAgICAgIGMubmFtZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YocXVlcnkpID4gLTEgfHwgXG4gICAgICAgICAgICAgYy5jb2RlLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihxdWVyeSkgPiAtMSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH0sXG5cblxuXG59KTtcbiIsInZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgVGltZXRhYmxlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xuXG5cbnZhciBkYXlfdG9fbGV0dGVyID0ge1xuICAgICdNJzogICdNJywgXG4gICAgJ1QnOiAgJ1QnLCBcbiAgICAnVyc6ICAnVycsXG4gICAgJ1InOiAnVGgnLFxuICAgICdGJzogICdGJyxcbiAgICAnUyc6ICdTYScsXG4gICAgJ1UnOiAnUydcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjb3MgPSB0aGlzLmdldFJlbGF0ZWRDb3Vyc2VPZmZlcmluZ3MoKTtcbiAgICAgICAgdmFyIGRheV9hbmRfdGltZXMgPSB0aGlzLmdldERheXNBbmRUaW1lcyhjb3MpO1xuICAgICAgICB2YXIgcHJvZnNfdGV4dCA9IGNvc1swXS5pbnN0cnVjdG9ycyA/IFwiUHJvZjogXCIgKyBjb3NbMF0uaW5zdHJ1Y3RvcnMgOiBcIi1cIjtcblxuICAgICAgICB2YXIgc2VjdGlvbl9hbmRfcHJvZiA9IChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2VjdC1wcm9mXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzZWN0aW9uLW51bVwiPntjb3NbMF0ubWVldGluZ19zZWN0aW9ufTwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHJvZnNcIj57cHJvZnNfdGV4dH08L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17XCJzZWN0aW9uLXdyYXBwZXIgc2VjLVwiICsgdGhpcy5wcm9wcy51bmlxdWV9IHJlZj1cIm1haW5fc2xvdFwiPlxuICAgICAgICAgICAgICAgIHtzZWN0aW9uX2FuZF9wcm9mfVxuICAgICAgICAgICAgICAgIHtkYXlfYW5kX3RpbWVzfVxuICAgICAgICAgICAgPC9kaXY+KTtcbiAgICB9LFxuXG4gICAgZ2V0UmVsYXRlZENvdXJzZU9mZmVyaW5nczogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvX29iamVjdHMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnByb3BzLmFsbF9zZWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG8gPSB0aGlzLnByb3BzLmFsbF9zZWN0aW9uc1tpXTtcbiAgICAgICAgICAgIGlmIChvLm1lZXRpbmdfc2VjdGlvbiA9PSB0aGlzLnByb3BzLnNlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBjb19vYmplY3RzLnB1c2gobyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvX29iamVjdHM7XG4gICAgfSxcblxuICAgIGdldERheXNBbmRUaW1lczogZnVuY3Rpb24oY29zKSB7XG4gICAgICAgIHZhciBkYXlBbmRUaW1lcyA9IGNvcy5tYXAoZnVuY3Rpb24obywgaikge1xuICAgICAgICAgICAgcmV0dXJuICg8ZGl2IGtleT17an0gY2xhc3NOYW1lPVwiZGF5LXRpbWVcIiBrZXk9e28uaWR9PntkYXlfdG9fbGV0dGVyW28uZGF5XSArIFwiIFwiICsgby50aW1lX3N0YXJ0ICsgXCIgLSBcIiArIG8udGltZV9lbmR9PC9kaXY+KTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgcmV0dXJuICggPGRpdiBjbGFzc05hbWU9XCJkdC1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICB7ZGF5QW5kVGltZXN9XG4gICAgICAgICAgICA8L2Rpdj4gKTtcbiAgICB9XG59KTtcbiIsInZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgVGltZXRhYmxlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFNpbXBsZU1vZGFsID0gcmVxdWlyZSgnLi9zaW1wbGVfbW9kYWwnKTtcbnZhciBUZXh0Ym9va0xpc3QgPSByZXF1aXJlKCcuL3RleHRib29rX2xpc3QnKVxuXG52YXIgUm9zdGVyU2xvdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3R5bGVzPXtiYWNrZ3JvdW5kQ29sb3I6IHRoaXMucHJvcHMuY29sb3VyLCBib3JkZXJDb2xvcjogdGhpcy5wcm9wcy5jb2xvdXJ9O1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2XG4gICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWwodGhpcy5wcm9wcy5pZCl9XG4gICAgICAgIHN0eWxlPXtzdHlsZXN9XG4gICAgICAgIG9uTW91c2VFbnRlcj17dGhpcy5oaWdobGlnaHRTaWJsaW5nc31cbiAgICAgICAgb25Nb3VzZUxlYXZlPXt0aGlzLnVuaGlnaGxpZ2h0U2libGluZ3N9XG4gICAgICAgIGNsYXNzTmFtZT17XCJzbG90LW91dGVyIGZjLXRpbWUtZ3JpZC1ldmVudCBmYy1ldmVudCBzbG90IHNsb3QtXCIgKyB0aGlzLnByb3BzLmlkfT5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWNvbnRlbnRcIj5cblxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdGl0bGUgc2xvdC10ZXh0LXJvd1wiPlxuICAgICAgICAgICAgPGkgY2xhc3NOYW1lPVwicmlnaHQgZmEgZmEtdGltZXMgcmVtb3ZlLWNvdXJzZS1pY29uXCIgb25DbGljaz17dGhpcy5yZW1vdmVDb3Vyc2V9PjwvaT5cbiAgICAgICAgICAgIHt0aGlzLnByb3BzLm5hbWV9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gIH0sXG4gIGhpZ2hsaWdodFNpYmxpbmdzOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMudXBkYXRlQ29sb3VycyhDT0xPVVJfVE9fSElHSExJR0hUW3RoaXMucHJvcHMuY29sb3VyXSk7XG4gIH0sXG4gIHVuaGlnaGxpZ2h0U2libGluZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy51cGRhdGVDb2xvdXJzKHRoaXMucHJvcHMuY29sb3VyKTtcbiAgfSxcbiAgdXBkYXRlQ29sb3VyczogZnVuY3Rpb24oY29sb3VyKSB7XG4gICAgJChcIi5zbG90LVwiICsgdGhpcy5wcm9wcy5pZClcbiAgICAgIC5jc3MoJ2JhY2tncm91bmQtY29sb3InLCBjb2xvdXIpXG4gICAgICAuY3NzKCdib3JkZXItY29sb3InLCBjb2xvdXIpO1xuICB9LFxuICByZW1vdmVDb3Vyc2U6IGZ1bmN0aW9uKGUpIHtcbiAgICBUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZUNvdXJzZXMoe2lkOiB0aGlzLnByb3BzLmlkLCBcbiAgICAgICAgICAgIHNlY3Rpb246ICcnLCBcbiAgICAgICAgICAgIHJlbW92aW5nOiB0cnVlfSk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgfSxcblxufSk7XG5cbnZhciBDb3Vyc2VSb3N0ZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAvLyB1c2UgdGhlIHRpbWV0YWJsZSBmb3Igc2xvdHMgYmVjYXVzZSBpdCBjb250YWlucyB0aGUgbW9zdCBpbmZvcm1hdGlvblxuICAgIGlmICh0aGlzLnByb3BzLnRpbWV0YWJsZXMubGVuZ3RoID4gMCkge1xuICAgICAgdmFyIHNsb3RzID0gdGhpcy5wcm9wcy50aW1ldGFibGVzWzBdLmNvdXJzZXMubWFwKGZ1bmN0aW9uKGNvdXJzZSkge1xuICAgICAgICB2YXIgY29sb3VyID0gIENPVVJTRV9UT19DT0xPVVJbY291cnNlLmNvZGVdO1xuXG4gICAgICAgIHJldHVybiA8Um9zdGVyU2xvdCB7Li4uY291cnNlfSB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0ga2V5PXtjb3Vyc2UuY29kZX0gY29sb3VyPXtjb2xvdXJ9Lz5cbiAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNsb3RzID0gbnVsbDtcbiAgICB9XG4gICAgdmFyIHR0ID0gdGhpcy5wcm9wcy50aW1ldGFibGVzLmxlbmd0aCA+IDAgPyB0aGlzLnByb3BzLnRpbWV0YWJsZXNbMF0gOiBudWxsO1xuICAgIHZhciBudW1Db3Vyc2VzID0gMDtcbiAgICB2YXIgdG90YWxTY29yZSA9IDA7XG4gICAgaWYgKHRoaXMucHJvcHMudGltZXRhYmxlcy5sZW5ndGggPiAwICYmIHRoaXMucHJvcHMudGltZXRhYmxlc1swXS5jb3Vyc2VzLmxlbmd0aCA+IDAgKSB7XG4gICAgICBmb3IgKGo9MDtqPHRoaXMucHJvcHMudGltZXRhYmxlc1swXS5jb3Vyc2VzLmxlbmd0aDtqKyspIHtcbiAgICAgICAgICBmb3IgKGs9MDtrPHRoaXMucHJvcHMudGltZXRhYmxlc1swXS5jb3Vyc2VzW2pdLmV2YWx1YXRpb25zLmxlbmd0aDtrKyspIHtcbiAgICAgICAgICAgIG51bUNvdXJzZXMrKztcbiAgICAgICAgICAgIHRvdGFsU2NvcmUgKz0gdGhpcy5wcm9wcy50aW1ldGFibGVzWzBdLmNvdXJzZXNbal0uZXZhbHVhdGlvbnNba10uc2NvcmU7XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB2YXIgYXZnU2NvcmVDb250ZW50ID0gdGhpcy5wcm9wcy50aW1ldGFibGVzLmxlbmd0aCA+IDAgJiYgdG90YWxTY29yZSA+IDAgID8gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJyYXRpbmctd3JhcHBlclwiPlxuICAgICAgICAgIDxwPkF2ZXJhZ2UgQ291cnNlIFJhdGluZzo8L3A+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzdWItcmF0aW5nLXdyYXBwZXJcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3Rhci1yYXRpbmdzLXNwcml0ZVwiPlxuICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17e3dpZHRoOiAxMDAqdG90YWxTY29yZS8oNSpudW1Db3Vyc2VzKSArIFwiJVwifX0gY2xhc3NOYW1lPVwicmF0aW5nXCI+PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PikgOiBudWxsO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvdXJzZS1yb3N0ZXIgY291cnNlLWxpc3RcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjbGVhcmZpeFwiPlxuICAgICAgICAgIHtzbG90c31cbiAgICAgICAgICB7YXZnU2NvcmVDb250ZW50fVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufSlcblxudmFyIFRleHRib29rUm9zdGVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBtaXhpbnM6IFtSZWZsdXguY29ubmVjdChUaW1ldGFibGVTdG9yZSldLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgIGlmICh0aGlzLnN0YXRlLnRpbWV0YWJsZXMubGVuZ3RoID4gMCkge1xuICAgICAgdGV4dGJvb2tzID0gW11cbiAgICAgICBmb3IgKGk9MDsgaSA8IHRoaXMuc3RhdGUudGltZXRhYmxlc1t0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXhdLmNvdXJzZXMubGVuZ3RoOyBpKyspICB7XG4gICAgICAgICAgZm9yKGo9MDsgaiA8IHRoaXMuc3RhdGUudGltZXRhYmxlc1t0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXhdLmNvdXJzZXNbaV0udGV4dGJvb2tzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB0ZXh0Ym9va3MucHVzaCh0aGlzLnN0YXRlLnRpbWV0YWJsZXNbdGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4XS5jb3Vyc2VzW2ldLnRleHRib29rc1tqXSlcbiAgICAgICAgICB9XG4gICAgICAgfVxuICAgICAgIHZhciB0Yl9lbGVtZW50cyA9IHRleHRib29rcy5tYXAoZnVuY3Rpb24odGIpIHtcbiAgICAgICAgICBpZiAodGJbJ2ltYWdlX3VybCddID09PSBcIkNhbm5vdCBiZSBmb3VuZFwiKSB7XG4gICAgICAgICAgICB2YXIgaW1nID0gJy9zdGF0aWMvaW1nL2RlZmF1bHRfY292ZXIuanBnJ1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgaW1nID0gdGJbJ2ltYWdlX3VybCddXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0YlsndGl0bGUnXSA9PSBcIkNhbm5vdCBiZSBmb3VuZFwiKSB7XG4gICAgICAgICAgICB2YXIgdGl0bGUgPSBcIiNcIiArICB0YlsnaXNibiddXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB0aXRsZSA9IHRiWyd0aXRsZSddXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAoIFxuICAgICAgICAgICAgPGEgY2xhc3NOYW1lPVwidGV4dGJvb2tcIiBrZXk9e3RiWydpZCddfSBocmVmPXt0YlsnZGV0YWlsX3VybCddfSB0YXJnZXQ9XCJfYmxhbmtcIj5cbiAgICAgICAgICAgICAgICA8aW1nIGhlaWdodD1cIjEyNVwiIHNyYz17aW1nfS8+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtb2R1bGVcIj5cbiAgICAgICAgICAgICAgICAgIDxoNiBjbGFzc05hbWU9XCJsaW5lLWNsYW1wXCI+e3RpdGxlfTwvaDY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImh0dHBzOi8vaW1hZ2VzLW5hLnNzbC1pbWFnZXMtYW1hem9uLmNvbS9pbWFnZXMvRy8wMS9hc3NvY2lhdGVzL3JlbW90ZS1idXktYm94L2J1eTUuX1YxOTIyMDc3MzlfLmdpZlwiIHdpZHRoPVwiMTIwXCIgaGVpZ2h0PVwiMjhcIiBib3JkZXI9XCIwXCIvPlxuICAgICAgICAgICAgPC9hPik7XG4gICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICB2YXIgYWRkVG9DYXJ0ID0gdGhpcy5nZXRBZGRCdXR0b24odGV4dGJvb2tzKVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgdGJfZWxlbWVudHMgPSBudWxsO1xuICAgICAgdmFyIGFkZFRvQ2FydCA9IG51bGxcbiAgICB9XG4gICAgdmFyIG1vZGFsID0gbnVsbDtcbiAgICBpZiAodGhpcy5zdGF0ZS5zaG93X21vZGFsKSB7XG4gICAgICAgIG1vZGFsID0gPFNpbXBsZU1vZGFsIGhlYWRlcj17XCJZb3VyIFRleHRib29rc1wifVxuICAgICAgICAgICAgICAgICAgIHN0eWxlcz17e2JhY2tncm91bmRDb2xvcjogXCIjRkRGNUZGXCIsIGNvbG9yOiBcIiMwMDBcIn19IFxuICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ9e251bGx9Lz5cbiAgICB9XG4gICAgdmFyIHNlZV9hbGwgPSBudWxsO1xuICAgIGlmICh0Yl9lbGVtZW50cyAhPSBudWxsICYmIHRiX2VsZW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIHNlZV9hbGwgPSAoPGRpdiBjbGFzc05hbWU9XCJ2aWV3LXRic1wiIG9uQ2xpY2s9e3RoaXMudG9nZ2xlfT5WaWV3IEJ5IENvdXJzZTwvZGl2PilcbiAgICB9XG4gICAgdmFyIGNvdXJzZXMgPSB0aGlzLnN0YXRlLnRpbWV0YWJsZXMubGVuZ3RoID4gMCA/IHRoaXMuc3RhdGUudGltZXRhYmxlc1t0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXhdLmNvdXJzZXMgOiBudWxsXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY291cnNlLXJvc3RlciB0ZXh0Ym9vay1saXN0XCI+XG4gICAgICAgIDxTaW1wbGVNb2RhbCBoZWFkZXI9e1wiWW91ciBUZXh0Ym9va3NcIn1cbiAgICAgICAgICAga2V5PVwidGV4dGJvb2tcIlxuICAgICAgICAgICByZWY9XCJ0YnNcIlxuICAgICAgICAgICBzdHlsZXM9e3tiYWNrZ3JvdW5kQ29sb3I6IFwiI0ZERjVGRlwiLCBjb2xvcjogXCIjMDAwXCIsIG1heEhlaWdodDpcIjkwJVwiLCBtYXhXaWR0aDpcIjY1MHB4XCIsIG92ZXJmbG93WTogXCJzY3JvbGxcIn19IFxuICAgICAgICAgICBhbGxvd19kaXNhYmxlPXt0cnVlfVxuICAgICAgICAgICBjb250ZW50PXs8VGV4dGJvb2tMaXN0IFxuICAgICAgICAgICAgYWRkVG9DYXJ0PXthZGRUb0NhcnR9IFxuICAgICAgICAgICAgY291cnNlcz17Y291cnNlc30gXG4gICAgICAgICAgICBzY2hvb2w9e3RoaXMuc3RhdGUuc2Nob29sfS8+fS8+XG4gICAgICAgIHttb2RhbH1cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjbGVhcmZpeFwiPlxuICAgICAgICAgIHtzZWVfYWxsfVxuICAgICAgICAgIHt0Yl9lbGVtZW50c31cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH0sXG5cbiAgdG9nZ2xlOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnJlZnMudGJzLnRvZ2dsZSgpO1xuICB9LFxuXG4gIGdldEFkZEJ1dHRvbjogZnVuY3Rpb24odGV4dGJvb2tzKSB7XG4gICAgdmFyIGVudHJpZXMgPSB0ZXh0Ym9va3MubWFwKGZ1bmN0aW9uKHRiLGkpIHtcbiAgICAgIHZhciBhc2luID0gKC8uKkFTSU4lM0QoLiopLy5leGVjKHRiWydkZXRhaWxfdXJsJ10pKVsxXVxuICAgICAgcmV0dXJuICg8ZGl2IGtleT17aX0+XG4gICAgICA8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9e1wiQVNJTi5cIiArIGkgKyAxfSB2YWx1ZT17YXNpbn0vPlxuICAgICAgPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPXtcIlF1YW50aXR5LlwiKyBpICsgMX0gdmFsdWU9XCIxXCIvPjwvZGl2PilcbiAgICB9LmJpbmQodGhpcykpO1xuICAgIHZhciByZXQgPSAoXG4gICAgPGZvcm0gbWV0aG9kPVwiR0VUXCIgYWN0aW9uPVwiaHR0cDovL3d3dy5hbWF6b24uY29tL2dwL2F3cy9jYXJ0L2FkZC5odG1sXCIgdGFyZ2V0PVwiX2JsYW5rXCI+IFxuICAgICAgPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwiQVdTQWNjZXNzS2V5SWRcIiB2YWx1ZT1cIkFLSUFKR1VPWE4zQ09PWUJQVEhRXCIgLz4gXG4gICAgICA8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJBc3NvY2lhdGVUYWdcIiB2YWx1ZT1cInNlbWVzdGVybHktMjBcIiAvPlxuICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJ2aWV3LXRic1wiIHR5cGU9XCJzdWJtaXRcIj5cbiAgICAgICAgPGkgY2xhc3NOYW1lPVwiZmEgZmEtc2hvcHBpbmctY2FydFwiPjwvaT4gQWRkIEFsbCB0byBDYXJ0XG4gICAgICA8L2J1dHRvbj5cbiAgICAgIHtlbnRyaWVzfVxuICAgIDwvZm9ybT4pXG4gICAgcmV0dXJuIHJldDtcbiAgfSxcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgbWl4aW5zOiBbUmVmbHV4LmNvbm5lY3QoVGltZXRhYmxlU3RvcmUpXSxcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge3Nob3c6IGZhbHNlfTtcbiAgfSxcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKFxuXG4gICAgICA8ZGl2IHJlZj1cInNpZGViYXJcIiBjbGFzc05hbWU9XCJzaWRlLWNvbnRhaW5lclwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvc3Rlci1oZWFkZXJcIj5cbiAgICAgICAgICA8aDQ+WW91ciBTZW1lc3RlcjwvaDQ+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8Q291cnNlUm9zdGVyIHRvZ2dsZU1vZGFsPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsfSB0aW1ldGFibGVzPXt0aGlzLnN0YXRlLnRpbWV0YWJsZXN9Lz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3N0ZXItaGVhZGVyXCI+XG4gICAgICAgICAgPGg0PllvdXIgVGV4dGJvb2tzPC9oND5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxUZXh0Ym9va1Jvc3RlciAvPlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9LFxufSk7XG4iLCJ2YXIgQ2Fyb3VzZWwgPSByZXF1aXJlKCcuL21vZHVsZXMvbnVrYS1jYXJvdXNlbC9jYXJvdXNlbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgbWl4aW5zOiBbQ2Fyb3VzZWwuQ29udHJvbGxlck1peGluXSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7c2xpZGVzX3Nob3duX2NvdW50OiAxfTtcbiAgfSxcbiAgdXBkYXRlTnVtSXRlbXM6IGZ1bmN0aW9uKCkge1xuXG4gICAgaWYgKCF0aGlzLnByb3BzLnNsaWRlc1RvU2hvdyB8fCAkKFwiLnNsaWRlclwiKS5sZW5ndGggPT0gMCB8fCAhdGhpcy5pc01vdW50ZWQoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgd2lkdGggPSAkKFwiLnNsaWRlclwiKS53aWR0aCgpO1xuICAgIHZhciBzZWN0aW9uX3dpZHRoID0gJChcIi5zZWN0aW9uLXdyYXBwZXJcIikud2lkdGgoKSArIDE1O1xuICAgIHZhciBjb3VudCA9IE1hdGgubWF4KDIsIHBhcnNlSW50KHdpZHRoL3NlY3Rpb25fd2lkdGgpKTtcbiAgICB0aGlzLnNldFN0YXRlKHtzbGlkZXNfc2hvd25fY291bnQ6IGNvdW50fSk7XG5cbiAgICAvLyBtb3ZlIHNsaWRlciBsaXN0IGxlZnQgKHNvIHRoYXQgZmlyc3QgaXRlbSBpcyBjZW50ZXJlZCkuXG4gICAgLy8gY3VycmVudGx5IG9ubHkgZG9uZSBmb3Igc2VjdGlvbnM6IChcIi5zZWMtMFwiKS5wYXJlbnQoKS5wYXJlbnQoKVxuICAgIC8vIHNvIGFueSBvdGhlciBpdGVtcyB1c2luZyBhIHNsaWRlciBlbGVtZW50IGFyZSBpZ25vcmVkXG4gICAgdmFyIHNsaWRlcl9saXN0X2xlZnQgPSBcIjM1XCI7XG4gICAgaWYgKCQod2luZG93KS53aWR0aCgpIDwgNTQwKSB7XG4gICAgICBzbGlkZXJfbGlzdF9sZWZ0ID0gXCIyMFwiO1xuICAgIH1cbiAgICAkKFwiLnNlYy0wXCIpLnBhcmVudCgpLnBhcmVudCgpXG4gICAgICAgICAgICAgIC5jc3MoXCJtYXJnaW4tbGVmdFwiLCBzbGlkZXJfbGlzdF9sZWZ0ICsgXCIlXCIpO1xuICAgIHJldHVybiBjb3VudDtcbiAgfSxcblxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gIFx0aWYgKHRoaXMucHJvcHMuY29udGVudC5sZW5ndGggPD0gMikge1xuICBcdFx0cmV0dXJuIDxkaXYgc3R5bGU9e3ttYXJnaW5Cb3R0b206IFwiLTMwcHggIWltcG9ydGFudFwifX0+e3RoaXMucHJvcHMuY29udGVudH08L2Rpdj47XG4gIFx0fVxuICAgIHZhciBuYXZfaXRlbXMgPSBudWxsO1xuICAgIGlmICh0aGlzLnByb3BzLm5hdl9pdGVtcyAmJiB0aGlzLnN0YXRlLmNhcm91c2Vscy5jYXJvdXNlbCkge1xuICAgICAgdmFyIG5hdnMgPSBbXTtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnByb3BzLm5hdl9pdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2xzID0gdGhpcy5zdGF0ZS5jYXJvdXNlbHMuY2Fyb3VzZWwuc3RhdGUuY3VycmVudFNsaWRlID09IGkgPyBcIiBuYXYtaXRlbS1hY3RpdmVcIiA6IFwiXCI7XG4gICAgICAgIG5hdnMucHVzaChcbiAgICAgICAgICA8c3BhbiBrZXk9e2l9IGNsYXNzTmFtZT17XCJuYXYtaXRlbVwiICsgY2xzfSBvbkNsaWNrPXt0aGlzLmNoYW5nZVNsaWRlKGkpfT57dGhpcy5wcm9wcy5uYXZfaXRlbXNbaV19PC9zcGFuPlxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgbmF2X2l0ZW1zID0gPGRpdiBjbGFzc05hbWU9XCJzY3JvbGwtbmF2XCI+e25hdnN9PC9kaXY+O1xuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICB7bmF2X2l0ZW1zfVxuICAgICAgICA8Q2Fyb3VzZWwgcmVmPVwiY2Fyb3VzZWxcIiBkYXRhPXt0aGlzLnNldENhcm91c2VsRGF0YS5iaW5kKHRoaXMsICdjYXJvdXNlbCcpfVxuICAgICAgICAgIHNsaWRlc1RvU2hvdz17dGhpcy5zdGF0ZS5zbGlkZXNfc2hvd25fY291bnR9IFxuICAgICAgICAgIGRyYWdnaW5nPXt0cnVlfVxuICAgICAgICAgIGNlbGxTcGFjaW5nPXszMH1cbiAgICAgICAgICBpZD17dGhpcy5wcm9wcy5pZH0+XG4gICAgICAgICAge3RoaXMucHJvcHMuY29udGVudH1cbiAgICAgICAgPC9DYXJvdXNlbD5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfSxcbiAgLy8gY2hhbmdlcyB0aGUgY3VycmVudGx5IHNlbGVjdGVkIHNsaWRlIHRvIHNsaWRlIGkgKGluZGV4ZWQgc3RhcnRpbmcgYXQgMClcbiAgY2hhbmdlU2xpZGU6IGZ1bmN0aW9uKGkpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnN0YXRlLmNhcm91c2Vscy5jYXJvdXNlbC5nb1RvU2xpZGUoaSk7XG4gICAgfS5iaW5kKHRoaXMpO1xuXG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsZW5ndGggPSB0aGlzLnByb3BzLmNvbnRlbnQubGVuZ3RoO1xuICAgIGlmIChsZW5ndGggPiAxKSB7XG4gICAgICB0aGlzLnVwZGF0ZU51bUl0ZW1zKCk7XG4gICAgICBpZiAobGVuZ3RoID4gMiAmJiB0aGlzLnByb3BzLmlkID09IFwic2VjdGlvbnMtY2Fyb3VzZWxcIikge1xuICAgICAgICAkKFwiLnNsaWRlci1kZWNvcmF0b3ItMSA+IC5zZWN0aW9ucy1jYXJvdXNlbFwiKS5jbGljaygpIC8vIG1ha2UgdGhpcmQgc2VjdGlvbiBkZWZhdWx0IHRvIG1pZGRsZSBvZiBzbGlkZXJcbiAgICAgIH1cbiAgICB9XG5cbiAgICAkKHdpbmRvdykucmVzaXplKGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKGxlbmd0aCA8PSAxKSB7cmV0dXJuO31cbiAgICAgIHRoaXMudXBkYXRlTnVtSXRlbXMoKTtcbiAgICB9LmJpbmQodGhpcykpO1xuICB9LFxuXG5cbn0pO1xuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge3Nob3duOiBmYWxzZX07XG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXY+PC9kaXY+XG5cdFx0KTtcblx0fSxcblxuXHR0b2dnbGU6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLnN0YXRlLnNob3duKSB7XG5cdFx0XHR0aGlzLmhpZGUoKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHR0aGlzLnNob3coKTtcblx0XHR9XG5cdH0sXG5cblx0c2hvdzogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNsb3NlX2J1dHRvbiA9IHRoaXMucHJvcHMuYWxsb3dfZGlzYWJsZSA/IFxuXHRcdCg8aSBvbkNsaWNrPXt0aGlzLmhpZGV9IGNsYXNzTmFtZT1cInJpZ2h0IGZhIGZhLXRpbWVzIGNsb3NlLWNvdXJzZS1tb2RhbFwiIC8+KSA6IG51bGxcblx0XHRSZWFjdERPTS5yZW5kZXIoXG4gIFx0XHRcdChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPXtcInNpbXBsZS1tb2RhbC13cmFwcGVyIFwiICsgdGhpcy5wcm9wcy5rZXl9PlxuXHRcdFx0XHQ8ZGl2IGlkPVwiZGltLXNjcmVlblwiIG9uQ2xpY2s9e3RoaXMubWF5YmVIaWRlfT48L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzaW1wbGUtbW9kYWxcIiBzdHlsZT17dGhpcy5wcm9wcy5zdHlsZXN9PlxuXHRcdFx0XHRcdDxoNiBjbGFzc05hbWU9XCJzaW1wbGUtbW9kYWwtaGVhZGVyXCI+e3RoaXMucHJvcHMuaGVhZGVyfSB7Y2xvc2VfYnV0dG9ufTwvaDY+XG5cdFx0XHRcdFx0PGhyIGNsYXNzTmFtZT1cInNpbXBsZS1tb2RhbC1zZXBhcmF0b3JcIi8+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzaW1wbGUtbW9kYWwtY29udGVudFwiPlxuXHRcdFx0XHRcdFx0e3RoaXMucHJvcHMuY29udGVudH1cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj4pLFxuICBcdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VtZXN0ZXJseS1tb2RhbCcpXG5cdFx0KTtcblx0XHQkKFwiI2RpbS1zY3JlZW5cIikuaGVpZ2h0KCQod2luZG93KS5oZWlnaHQoKSlcblx0XHR0aGlzLnNldFN0YXRlKHtzaG93bjogdHJ1ZX0pO1xuXHR9LFxuXG5cdG1heWJlSGlkZTogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMucHJvcHMuYWxsb3dfZGlzYWJsZSkge1xuXHRcdFx0dGhpcy5oaWRlKCk7XG5cdFx0fVx0XG5cdH0sXG5cblx0aGlkZTogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCQoXCIuXCIgKyB0aGlzLnByb3BzLmtleSkubGVuZ3RoID09IDApIHtyZXR1cm47fVxuXHRcdHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VtZXN0ZXJseS1tb2RhbCcpO1xuXHRcdCQoXCIjZGltLXNjcmVlblwiKS5mYWRlT3V0KDgwMCwgZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgUmVhY3RET00udW5tb3VudENvbXBvbmVudEF0Tm9kZShjb250YWluZXIpO1xuXHRcdH0pO1xuXHRcdHZhciBzZWwgPSBcIi5zaW1wbGUtbW9kYWxcIjtcblxuXHRcdGlmICgkKHNlbCkub2Zmc2V0KCkubGVmdCA8IDApIHtcbiAgICAgICAgICAgICQoc2VsKS5jc3MoXCJsZWZ0XCIsIFwiMTUwJVwiKTtcbiAgICAgICAgfSBlbHNlIGlmICgkKHNlbCkub2Zmc2V0KCkubGVmdCA+ICQoJ2JvZHknKS53aWR0aCgpKSB7XG4gICAgICAgICAgICAkKHNlbCkuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgbGVmdDogJzUwJScsXG4gICAgICAgICAgICB9LCA4MDAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoc2VsKS5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICBsZWZ0OiAnLTE1MCUnLFxuICAgICAgICAgICAgfSwgODAwICk7XG4gICAgICAgIH1cblx0XHR0aGlzLnNldFN0YXRlKHtzaG93bjogZmFsc2V9KTtcblxuXHR9LFxuXG5cblxufSk7XG4iLCJ2YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFRpbWV0YWJsZVN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcblxuXG4vLyBtYXBzIGJhc2UgY29sb3VyIG9mIHNsb3QgdG8gY29sb3VyIG9uIGhpZ2hsaWdodFxuQ09MT1VSX1RPX0hJR0hMSUdIVCA9IHtcbiAgICBcIiNGRDc0NzNcIiA6IFwiI0UyNkE2QVwiLFxuICAgIFwiIzQ0QkJGRlwiIDogXCIjMjhBNEVBXCIsXG4gICAgXCIjNENENEIwXCIgOiBcIiMzREJCOUFcIixcbiAgICBcIiM4ODcwRkZcIiA6IFwiIzcwNTlFNlwiLFxuICAgIFwiI0Y5QUU3NFwiIDogXCIjRjc5NTRBXCIsXG4gICAgXCIjRDREQkM4XCIgOiBcIiNCNUJGQTNcIixcbiAgICBcIiNGMTgyQjRcIiA6IFwiI0RFNjk5RFwiLFxuICAgIFwiIzc0OTlBMlwiIDogXCIjNjY4Qjk0XCIsXG4gICAgXCIjRTdGNzZEXCIgOiBcIiNDNEQ0NERcIixcbn0gLy8gY29uc2lkZXIgI0NGMDAwRiwgI2U4ZmFjM1xuQ09VUlNFX1RPX0NPTE9VUiA9IHt9XG4vLyBob3cgYmlnIGEgc2xvdCBvZiBoYWxmIGFuIGhvdXIgd291bGQgYmUsIGluIHBpeGVsc1xudmFyIEhBTEZfSE9VUl9IRUlHSFQgPSAzMDtcblxudmFyIFNsb3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtzaG93X2J1dHRvbnM6IGZhbHNlfTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHBpbiA9IG51bGwsIHJlbW92ZV9idXR0b24gPSBudWxsO1xuICAgICAgICB2YXIgc2xvdF9zdHlsZSA9IHRoaXMuZ2V0U2xvdFN0eWxlKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuc2hvd19idXR0b25zKSB7XG4gICAgICAgICAgICBwaW4gPSAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNsb3QtaW5uZXIgYm90dG9tXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJidXR0b24tc3Vycm91bmRcIiBvbkNsaWNrPXt0aGlzLnBpbk9yVW5waW5Db3Vyc2V9ID5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtbG9ja1wiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+KTtcbiAgICAgICAgICAgIHJlbW92ZV9idXR0b24gPSAoIDxkaXYgY2xhc3NOYW1lPVwic2xvdC1pbm5lclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnV0dG9uLXN1cnJvdW5kXCIgb25DbGljaz17dGhpcy5yZW1vdmVDb3Vyc2V9ID5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtdGltZXMgcmVtb3ZlXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnByb3BzLnBpbm5lZCkge1xuICAgICAgICAgICAgcGluID0gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzbG90LWlubmVyIGJvdHRvbVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnV0dG9uLXN1cnJvdW5kIHBpbm5lZFwiIG9uQ2xpY2s9e3RoaXMucGluT3JVbnBpbkNvdXJzZX0gPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1sb2NrXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgICB9XG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBcbiAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWwodGhpcy5wcm9wcy5jb3Vyc2UpfVxuICAgICAgICAgICAgb25Nb3VzZUVudGVyPXt0aGlzLmhpZ2hsaWdodFNpYmxpbmdzfVxuICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXt0aGlzLnVuaGlnaGxpZ2h0U2libGluZ3N9XG4gICAgICAgICAgICBjbGFzc05hbWU9e1wic2xvdC1vdXRlciBmYy10aW1lLWdyaWQtZXZlbnQgZmMtZXZlbnQgc2xvdCBzbG90LVwiICsgdGhpcy5wcm9wcy5jb3Vyc2V9IFxuICAgICAgICAgICAgc3R5bGU9e3Nsb3Rfc3R5bGV9PlxuICAgICAgICAgICAge3JlbW92ZV9idXR0b259XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10aW1lXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+e3RoaXMucHJvcHMudGltZV9zdGFydH0g4oCTIHt0aGlzLnByb3BzLnRpbWVfZW5kfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdGl0bGUgc2xvdC10ZXh0LXJvd1wiPnt0aGlzLnByb3BzLmNvZGUgKyBcIiBcIiArIHRoaXMucHJvcHMubWVldGluZ19zZWN0aW9ufTwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRpdGxlIHNsb3QtdGV4dC1yb3dcIj57dGhpcy5wcm9wcy5uYW1lfTwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICB7cGlufSAgICAgICAgICAgIFxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAvKipcbiAgICAqIFJldHVybiBhbiBvYmplY3QgY29udGFpbmluZyBzdHlsZSBvZiBhIHNwZWNpZmljIHNsb3QuIFNob3VsZCBzcGVjaWZ5IGF0XG4gICAgKiBsZWFzdCB0aGUgdG9wIHktY29vcmRpbmF0ZSBhbmQgaGVpZ2h0IG9mIHRoZSBzbG90LCBhcyB3ZWxsIGFzIGJhY2tncm91bmRDb2xvclxuICAgICogd2hpbGUgdGFraW5nIGludG8gYWNjb3VudCBpZiB0aGVyZSdzIGFuIG92ZXJsYXBwaW5nIGNvbmZsaWN0XG4gICAgKi9cbiAgICBnZXRTbG90U3R5bGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc3RhcnRfaG91ciAgID0gcGFyc2VJbnQodGhpcy5wcm9wcy50aW1lX3N0YXJ0LnNwbGl0KFwiOlwiKVswXSksXG4gICAgICAgICAgICBzdGFydF9taW51dGUgPSBwYXJzZUludCh0aGlzLnByb3BzLnRpbWVfc3RhcnQuc3BsaXQoXCI6XCIpWzFdKSxcbiAgICAgICAgICAgIGVuZF9ob3VyICAgICA9IHBhcnNlSW50KHRoaXMucHJvcHMudGltZV9lbmQuc3BsaXQoXCI6XCIpWzBdKSxcbiAgICAgICAgICAgIGVuZF9taW51dGUgICA9IHBhcnNlSW50KHRoaXMucHJvcHMudGltZV9lbmQuc3BsaXQoXCI6XCIpWzFdKTtcblxuICAgICAgICB2YXIgdG9wID0gKHN0YXJ0X2hvdXIgLSA4KSo1MiArIChzdGFydF9taW51dGUpKigyNi8zMCk7XG4gICAgICAgIHZhciBib3R0b20gPSAoZW5kX2hvdXIgLSA4KSo1MiArIChlbmRfbWludXRlKSooMjYvMzApIC0gMTtcbiAgICAgICAgdmFyIGhlaWdodCA9IGJvdHRvbSAtIHRvcCAtIDI7XG5cbiAgICAgICAgaWYgKHRoaXMucHJvcHMubnVtX2NvbmZsaWN0cyA+IDEpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMucHJvcHMudGltZV9zdGFydCwgdGhpcy5wcm9wcy50aW1lX2VuZCwgdGhpcy5wcm9wcy5udW1fY29uZmxpY3RzKVxuICAgICAgICB9XG4gICAgICAgIC8vIHRoZSBjdW11bGF0aXZlIHdpZHRoIG9mIHRoaXMgc2xvdCBhbmQgYWxsIG9mIHRoZSBzbG90cyBpdCBpcyBjb25mbGljdGluZyB3aXRoXG4gICAgICAgIHZhciB0b3RhbF9zbG90X3dpZHRocyA9IDk5IC0gKDUgKiB0aGlzLnByb3BzLmRlcHRoX2xldmVsKTtcbiAgICAgICAgLy8gdGhlIHdpZHRoIG9mIHRoaXMgcGFydGljdWxhciBzbG90XG4gICAgICAgIHZhciBzbG90X3dpZHRoX3BlcmNlbnRhZ2UgPSB0b3RhbF9zbG90X3dpZHRocyAvIHRoaXMucHJvcHMubnVtX2NvbmZsaWN0cztcbiAgICAgICAgLy8gdGhlIGFtb3VudCBvZiBsZWZ0IG1hcmdpbiBvZiB0aGlzIHBhcnRpY3VsYXIgc2xvdCwgaW4gcGVyY2VudGFnZVxuICAgICAgICB2YXIgcHVzaF9sZWZ0ID0gKHRoaXMucHJvcHMuc2hpZnRfaW5kZXggKiBzbG90X3dpZHRoX3BlcmNlbnRhZ2UpICsgNSAqIHRoaXMucHJvcHMuZGVwdGhfbGV2ZWw7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdpZHRoOiBzbG90X3dpZHRoX3BlcmNlbnRhZ2UgKyBcIiVcIixcbiAgICAgICAgICAgIHRvcDogdG9wLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMucHJvcHMuY29sb3VyLFxuICAgICAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIiArIHRoaXMucHJvcHMuY29sb3VyLFxuICAgICAgICAgICAgbGVmdDogcHVzaF9sZWZ0ICsgXCIlXCIsXG4gICAgICAgICAgICB6SW5kZXg6IDEwMCAqIHRoaXMucHJvcHMuZGVwdGhfbGV2ZWxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgaGlnaGxpZ2h0U2libGluZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtzaG93X2J1dHRvbnM6IHRydWV9KTtcbiAgICAgICAgdGhpcy51cGRhdGVDb2xvdXJzKENPTE9VUl9UT19ISUdITElHSFRbdGhpcy5wcm9wcy5jb2xvdXJdKTtcbiAgICB9LFxuICAgIHVuaGlnaGxpZ2h0U2libGluZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtzaG93X2J1dHRvbnM6IGZhbHNlfSk7XG4gICAgICAgIHRoaXMudXBkYXRlQ29sb3Vycyh0aGlzLnByb3BzLmNvbG91cik7XG4gICAgfSxcbiAgICBwaW5PclVucGluQ291cnNlOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIFRpbWV0YWJsZUFjdGlvbnMudXBkYXRlQ291cnNlcyh7aWQ6IHRoaXMucHJvcHMuY291cnNlLCBcbiAgICAgICAgICAgIHNlY3Rpb246IHRoaXMucHJvcHMubWVldGluZ19zZWN0aW9uLCBcbiAgICAgICAgICAgIHJlbW92aW5nOiBmYWxzZX0pO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0sXG4gICAgcmVtb3ZlQ291cnNlOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIFRpbWV0YWJsZUFjdGlvbnMudXBkYXRlQ291cnNlcyh7aWQ6IHRoaXMucHJvcHMuY291cnNlLCBcbiAgICAgICAgICAgIHNlY3Rpb246ICcnLCBcbiAgICAgICAgICAgIHJlbW92aW5nOiB0cnVlfSk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSxcblxuICAgIHVwZGF0ZUNvbG91cnM6IGZ1bmN0aW9uKGNvbG91cikge1xuICAgICAgICAkKFwiLnNsb3QtXCIgKyB0aGlzLnByb3BzLmNvdXJzZSlcbiAgICAgICAgICAuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgY29sb3VyKVxuICAgICAgICAgIC5jc3MoJ2JvcmRlci1jb2xvcicsIGNvbG91cik7XG4gICAgfSxcblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRheXMgPSBbXCJNXCIsIFwiVFwiLCBcIldcIiwgXCJSXCIsIFwiRlwiXTtcbiAgICAgICAgdmFyIHNsb3RzX2J5X2RheSA9IHRoaXMuZ2V0U2xvdHNCeURheSgpO1xuICAgICAgICB2YXIgYWxsX3Nsb3RzID0gZGF5cy5tYXAoZnVuY3Rpb24oZGF5KSB7XG4gICAgICAgICAgICB2YXIgZGF5X3Nsb3RzID0gc2xvdHNfYnlfZGF5W2RheV0ubWFwKGZ1bmN0aW9uKHNsb3QpIHtcbiAgICAgICAgICAgICAgICB2YXIgcCA9IHRoaXMuaXNQaW5uZWQoc2xvdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxTbG90IHsuLi5zbG90fSB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0ga2V5PXtzbG90LmlkfSBwaW5uZWQ9e3B9Lz5cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8dGQga2V5PXtkYXl9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1ldmVudC1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZGF5X3Nsb3RzfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICApO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXNcIj48L3RkPlxuICAgICAgICAgICAgICAgICAge2FsbF9zbG90c31cbiAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgPC90YWJsZT5cblxuICAgICAgICApO1xuICAgIH0sXG4gICBcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXlzID0gezE6ICdtb24nLCAyOiAndHVlJywgMzogJ3dlZCcsIDQ6ICd0aHUnLCA1OiAnZnJpJ307XG4gICAgICAgIHZhciBkID0gbmV3IERhdGUoKTtcbiAgICAgICAgdmFyIHNlbGVjdG9yID0gXCIuZmMtXCIgKyBkYXlzW2QuZ2V0RGF5KCldO1xuICAgICAgICAvLyAkKHNlbGVjdG9yKS5hZGRDbGFzcyhcImZjLXRvZGF5XCIpO1xuICAgIH0sXG5cbiAgICBpc1Bpbm5lZDogZnVuY3Rpb24oc2xvdCkge1xuICAgICAgICB2YXIgY29tcGFyYXRvciA9IHRoaXMucHJvcHMuY291cnNlc190b19zZWN0aW9uc1tzbG90LmNvdXJzZV1bJ0MnXTtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuc2Nob29sID09IFwidW9mdFwiKSB7XG4gICAgICAgICAgICBjb21wYXJhdG9yID0gdGhpcy5wcm9wcy5jb3Vyc2VzX3RvX3NlY3Rpb25zW3Nsb3QuY291cnNlXVtzbG90Lm1lZXRpbmdfc2VjdGlvblswXV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbXBhcmF0b3IgPT0gc2xvdC5tZWV0aW5nX3NlY3Rpb247XG4gICAgfSxcblxuICAgIGdldFNsb3RzQnlEYXk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2xvdHNfYnlfZGF5ID0ge1xuICAgICAgICAgICAgJ00nOiBbXSxcbiAgICAgICAgICAgICdUJzogW10sXG4gICAgICAgICAgICAnVyc6IFtdLFxuICAgICAgICAgICAgJ1InOiBbXSxcbiAgICAgICAgICAgICdGJzogW11cbiAgICAgICAgfTtcbiAgICAgICAgQ09VUlNFX1RPX0NPTE9VUiA9IHt9O1xuICAgICAgICBmb3IgKHZhciBjb3Vyc2UgaW4gdGhpcy5wcm9wcy50aW1ldGFibGUuY291cnNlcykge1xuICAgICAgICAgICAgdmFyIGNycyA9IHRoaXMucHJvcHMudGltZXRhYmxlLmNvdXJzZXNbY291cnNlXTtcbiAgICAgICAgICAgIGZvciAodmFyIHNsb3RfaWQgaW4gY3JzLnNsb3RzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNsb3QgPSBjcnMuc2xvdHNbc2xvdF9pZF07XG4gICAgICAgICAgICAgICAgdmFyIGNvbG91ciA9IE9iamVjdC5rZXlzKENPTE9VUl9UT19ISUdITElHSFQpW2NvdXJzZV07XG4gICAgICAgICAgICAgICAgc2xvdFtcImNvbG91clwiXSA9IGNvbG91cjtcbiAgICAgICAgICAgICAgICBzbG90W1wiY29kZVwiXSA9IGNycy5jb2RlLnRyaW0oKTtcbiAgICAgICAgICAgICAgICBzbG90W1wibmFtZVwiXSA9IGNycy5uYW1lO1xuICAgICAgICAgICAgICAgIHNsb3RzX2J5X2RheVtzbG90LmRheV0ucHVzaChzbG90KTtcbiAgICAgICAgICAgICAgICBDT1VSU0VfVE9fQ09MT1VSW2Nycy5jb2RlXSA9IGNvbG91cjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2xvdHNfYnlfZGF5O1xuICAgIH0sXG5cbn0pO1xuIiwidmFyIGNvdXJzZV9hY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9jb3Vyc2VfYWN0aW9ucy5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlZmx1eC5jcmVhdGVTdG9yZSh7XG4gIGxpc3RlbmFibGVzOiBbY291cnNlX2FjdGlvbnNdLFxuXG4gIGdldENvdXJzZUluZm86IGZ1bmN0aW9uKHNjaG9vbCwgY291cnNlX2lkKSB7XG4gICAgdGhpcy50cmlnZ2VyKHtsb2FkaW5nOiB0cnVlfSk7XG4gICAgJC5nZXQoXCIvY291cnNlcy9cIisgc2Nob29sICsgXCIvaWQvXCIgKyBjb3Vyc2VfaWQsIFxuICAgICAgICAge30sIFxuICAgICAgICAgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcih7aW5mb19sb2FkaW5nOiBmYWxzZSwgY291cnNlX2luZm86IHJlc3BvbnNlfSk7XG4gICAgICAgICB9LmJpbmQodGhpcylcbiAgICApO1xuXG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge2NvdXJzZV9pbmZvOiBudWxsLCBpbmZvX2xvYWRpbmc6IHRydWV9O1xuICB9XG59KTtcbiIsInZhciBUb2FzdCA9IHJlcXVpcmUoJy4uL3RvYXN0Jyk7XG52YXIgVG9hc3RBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy90b2FzdF9hY3Rpb25zLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZVN0b3JlKHtcbiAgbGlzdGVuYWJsZXM6IFtUb2FzdEFjdGlvbnNdLFxuXG4gIGNyZWF0ZVRvYXN0OiBmdW5jdGlvbihjb250ZW50KSB7XG4gICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2FzdC1jb250YWluZXInKTtcbiAgICBSZWFjdERPTS51bm1vdW50Q29tcG9uZW50QXROb2RlKGNvbnRhaW5lcik7XG4gICAgUmVhY3RET00ucmVuZGVyKFxuICAgICAgPFRvYXN0IGNvbnRlbnQ9e2NvbnRlbnR9IC8+LFxuICAgICAgY29udGFpbmVyXG4gICAgKTtcbiAgfSxcblxuXG59KTtcbiIsInZhciBhY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFRvYXN0QWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvdG9hc3RfYWN0aW9ucy5qcycpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3RpbWV0YWJsZV91dGlsJyk7XG5cbmZ1bmN0aW9uIHJhbmRvbVN0cmluZyhsZW5ndGgsIGNoYXJzKSB7XG4gICAgdmFyIHJlc3VsdCA9ICcnO1xuICAgIGZvciAodmFyIGkgPSBsZW5ndGg7IGkgPiAwOyAtLWkpIHJlc3VsdCArPSBjaGFyc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjaGFycy5sZW5ndGgpXTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5TSUQgPSByYW5kb21TdHJpbmcoMzAsICchPygpKiZeJSQjQCFbXTAxMjM0NTY3ODlhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ekFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaJyk7XG5cblRUX1NUQVRFID0ge1xuICBzY2hvb2w6IFwiamh1XCIsXG4gIHNlbWVzdGVyOiBcIlNcIixcbiAgY291cnNlc190b19zZWN0aW9uczoge30sXG4gIHByZWZlcmVuY2VzOiB7XG4gICAgJ25vX2NsYXNzZXNfYmVmb3JlJzogZmFsc2UsXG4gICAgJ25vX2NsYXNzZXNfYWZ0ZXInOiBmYWxzZSxcbiAgICAnbG9uZ193ZWVrZW5kJzogZmFsc2UsXG4gICAgJ2dyb3VwZWQnOiBmYWxzZSxcbiAgICAnZG9fcmFua2luZyc6IGZhbHNlLFxuICAgICd0cnlfd2l0aF9jb25mbGljdHMnOiBmYWxzZVxuICB9LFxuICBzaWQ6IFNJRCxcbn1cblxuU0NIT09MX0xJU1QgPSBbXCJqaHVcIiwgXCJ1b2Z0XCJdO1xuXG4vLyBmbGFnIHRvIGNoZWNrIGlmIHRoZSB1c2VyIGp1c3QgdHVybmVkIGNvbmZsaWN0cyBvZmZcbkNPTkZMSUNUX09GRiA9IGZhbHNlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlZmx1eC5jcmVhdGVTdG9yZSh7XG4gIGxpc3RlbmFibGVzOiBbYWN0aW9uc10sXG4gIGNvdXJzZXNfdG9fc2VjdGlvbnM6IHt9LFxuICBsb2FkaW5nOiBmYWxzZSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0aW1ldGFibGVzOiBbXSwgXG4gICAgICBwcmVmZXJlbmNlczogVFRfU1RBVEUucHJlZmVyZW5jZXMsXG4gICAgICBjb3Vyc2VzX3RvX3NlY3Rpb25zOiB7fSwgXG4gICAgICBjdXJyZW50X2luZGV4OiAtMSwgXG4gICAgICBjb25mbGljdF9lcnJvcjogZmFsc2UsXG4gICAgICBsb2FkaW5nOiBmYWxzZSwgLy8gdGltZXRhYmxlcyBsb2FkaW5nXG4gICAgICBjb3Vyc2VzX2xvYWRpbmc6IGZhbHNlLFxuICAgICAgc2Nob29sOiBcIlwifTtcbiAgfSxcblxuICBzZXRTY2hvb2w6IGZ1bmN0aW9uKG5ld19zY2hvb2wpIHtcbiAgICB2YXIgc2Nob29sID0gU0NIT09MX0xJU1QuaW5kZXhPZihuZXdfc2Nob29sKSA+IC0xID8gbmV3X3NjaG9vbCA6IFwiXCI7XG4gICAgdmFyIG5ld19zdGF0ZSA9IHRoaXMuZ2V0SW5pdGlhbFN0YXRlKCk7XG4gICAgVFRfU1RBVEUuc2Nob29sID0gc2Nob29sO1xuICAgIG5ld19zdGF0ZS5zY2hvb2wgPSBzY2hvb2w7XG4gICAgdGhpcy50cmlnZ2VyKG5ld19zdGF0ZSk7XG4gIH0sXG4gLyoqXG4gICogVXBkYXRlIFRUX1NUQVRFIHdpdGggbmV3IGNvdXJzZSByb3N0ZXJcbiAgKiBAcGFyYW0ge29iamVjdH0gbmV3X2NvdXJzZV93aXRoX3NlY3Rpb24gY29udGFpbnMgYXR0cmlidXRlZCBpZCwgc2VjdGlvbiwgcmVtb3ZpbmdcbiAgKiBAcmV0dXJuIHt2b2lkfSBkb2VzIG5vdCByZXR1cm4gYW55dGhpbmcsIGp1c3QgdXBkYXRlcyBUVF9TVEFURVxuICAqL1xuICB1cGRhdGVDb3Vyc2VzOiBmdW5jdGlvbihuZXdfY291cnNlX3dpdGhfc2VjdGlvbikge1xuICAgIGlmICh0aGlzLmxvYWRpbmcpIHtyZXR1cm47fSAvLyBpZiBsb2FkaW5nLCBkb24ndCBwcm9jZXNzLlxuICAgIHRoaXMubG9hZGluZyA9IHRydWU7XG4gICAgdGhpcy50cmlnZ2VyKHtsb2FkaW5nOnRydWV9KTtcblxuICAgIHZhciByZW1vdmluZyA9IG5ld19jb3Vyc2Vfd2l0aF9zZWN0aW9uLnJlbW92aW5nO1xuICAgIHZhciBuZXdfY291cnNlX2lkID0gbmV3X2NvdXJzZV93aXRoX3NlY3Rpb24uaWQ7XG4gICAgdmFyIHNlY3Rpb24gPSBuZXdfY291cnNlX3dpdGhfc2VjdGlvbi5zZWN0aW9uO1xuICAgIHZhciBuZXdfc3RhdGUgPSAkLmV4dGVuZCh0cnVlLCB7fSwgVFRfU1RBVEUpOyAvLyBkZWVwIGNvcHkgb2YgVFRfU1RBVEVcbiAgICB2YXIgY190b19zID0gbmV3X3N0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnM7XG4gICAgaWYgKCFyZW1vdmluZykgeyAvLyBhZGRpbmcgY291cnNlXG4gICAgICBpZiAoVFRfU1RBVEUuc2Nob29sID09IFwiamh1XCIpIHtcbiAgICAgICAgaWYgKGNfdG9fc1tuZXdfY291cnNlX2lkXSkge1xuICAgICAgICAgIHZhciBuZXdfc2VjdGlvbiA9IGNfdG9fc1tuZXdfY291cnNlX2lkXVsnQyddICE9IFwiXCIgPyBcIlwiIDogc2VjdGlvbjtcbiAgICAgICAgICBjX3RvX3NbbmV3X2NvdXJzZV9pZF1bJ0MnXSA9IG5ld19zZWN0aW9uO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNfdG9fc1tuZXdfY291cnNlX2lkXSA9IHsnTCc6ICcnLCAnVCc6ICcnLCAnUCc6ICcnLCAnQyc6IHNlY3Rpb259O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChUVF9TVEFURS5zY2hvb2wgPT0gXCJ1b2Z0XCIpIHtcbiAgICAgICAgdmFyIGxvY2tlZF9zZWN0aW9ucyA9IGNfdG9fc1tuZXdfY291cnNlX2lkXSA9PSBudWxsID8geydMJzogJycsICdUJzogJycsICdQJzogJycsICdDJzogJyd9IDogLy8gdGhpcyBpcyB3aGF0IHdlIHdhbnQgdG8gc2VuZCBpZiBub3QgbG9ja2luZ1xuICAgICAgICAgIGNfdG9fc1tuZXdfY291cnNlX2lkXTtcbiAgICAgICAgaWYgKHNlY3Rpb24gJiYgc2VjdGlvbiAhPSBcIlwiKSB7XG4gICAgICAgICAgdmFyIG5ld19zZWN0aW9uID0gc2VjdGlvbjtcbiAgICAgICAgICBpZiAoY190b19zW25ld19jb3Vyc2VfaWRdW3NlY3Rpb25bMF1dICE9IFwiXCIpIHtuZXdfc2VjdGlvbiA9IFwiXCI7fSAvLyB1bmxvY2tpbmcgc2luY2Ugc2VjdGlvbiBwcmV2aW91c2x5IGV4aXN0ZWRcbiAgICAgICAgICBsb2NrZWRfc2VjdGlvbnNbc2VjdGlvblswXV0gPSBuZXdfc2VjdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBjX3RvX3NbbmV3X2NvdXJzZV9pZF0gPSBsb2NrZWRfc2VjdGlvbnM7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgeyAvLyByZW1vdmluZyBjb3Vyc2VcbiAgICAgIGRlbGV0ZSBjX3RvX3NbbmV3X2NvdXJzZV9pZF07XG4gICAgICBpZiAoT2JqZWN0LmtleXMoY190b19zKS5sZW5ndGggPT0gMCkgeyAvLyByZW1vdmVkIGxhc3QgY291cnNlXG4gICAgICAgICAgVFRfU1RBVEUuY291cnNlc190b19zZWN0aW9ucyA9IHt9O1xuICAgICAgICAgIHZhciByZXBsYWNlZCA9IHRoaXMuZ2V0SW5pdGlhbFN0YXRlKCk7XG4gICAgICAgICAgcmVwbGFjZWQuc2Nob29sID0gVFRfU1RBVEUuc2Nob29sO1xuICAgICAgICAgIHRoaXMubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMudHJpZ2dlcihyZXBsYWNlZCk7XG4gICAgICAgICAgcmV0dXJuOyAgXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMubWFrZVJlcXVlc3QobmV3X3N0YXRlKTtcbiAgfSxcblxuIC8qKlxuICAqIFVwZGF0ZSBUVF9TVEFURSB3aXRoIG5ldyBwcmVmZXJlbmNlc1xuICAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmZXJlbmNlOiB0aGUgcHJlZmVyZW5jZSB0aGF0IGlzIGJlaW5nIHVwZGF0ZWRcbiAgKiBAcGFyYW0gbmV3X3ZhbHVlOiB0aGUgbmV3IHZhbHVlIG9mIHRoZSBzcGVjaWZpZWQgcHJlZmVyZW5jZVxuICAqIEByZXR1cm4ge3ZvaWR9IGRvZXNuJ3QgcmV0dXJuIGFueXRoaW5nLCBqdXN0IHVwZGF0ZXMgVFRfU1RBVEVcbiAgKi9cbiAgdXBkYXRlUHJlZmVyZW5jZXM6IGZ1bmN0aW9uKHByZWZlcmVuY2UsIG5ld192YWx1ZSkge1xuICAgIHZhciBuZXdfc3RhdGUgPSAkLmV4dGVuZCh0cnVlLCB7fSwgVFRfU1RBVEUpOyAvLyBkZWVwIGNvcHkgb2YgVFRfU1RBVEVcbiAgICBpZiAocHJlZmVyZW5jZSA9PSAndHJ5X3dpdGhfY29uZmxpY3RzJyAmJiBuZXdfdmFsdWUgPT0gZmFsc2UpIHtcbiAgICAgIENPTkZMSUNUX09GRiA9IHRydWU7XG4gICAgfVxuICAgIG5ld19zdGF0ZS5wcmVmZXJlbmNlc1twcmVmZXJlbmNlXSA9IG5ld192YWx1ZTtcbiAgICB0aGlzLnRyaWdnZXIoe3ByZWZlcmVuY2VzOiBuZXdfc3RhdGUucHJlZmVyZW5jZXN9KTtcbiAgICB0aGlzLm1ha2VSZXF1ZXN0KG5ld19zdGF0ZSk7XG4gIH0sXG5cbiAgLy8gTWFrZXMgYSBQT1NUIHJlcXVlc3QgdG8gdGhlIGJhY2tlbmQgd2l0aCBUVF9TVEFURVxuICBtYWtlUmVxdWVzdDogZnVuY3Rpb24obmV3X3N0YXRlKSB7XG4gICAgdGhpcy50cmlnZ2VyKHtsb2FkaW5nOiB0cnVlfSk7XG4gICAgJC5wb3N0KCcvJywgSlNPTi5zdHJpbmdpZnkobmV3X3N0YXRlKSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgdGhpcy5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIGlmIChyZXNwb25zZS5lcnJvcikgeyAvLyBlcnJvciBmcm9tIFVSTCBvciBsb2NhbCBzdG9yYWdlXG4gICAgICAgICAgaWYoVXRpbC5icm93c2VyU3VwcG9ydHNMb2NhbFN0b3JhZ2UoKSkge1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2RhdGEnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgVFRfU1RBVEUuY291cnNlc190b19zZWN0aW9ucyA9IHt9O1xuICAgICAgICAgIHZhciByZXBsYWNlZCA9IHRoaXMuZ2V0SW5pdGlhbFN0YXRlKCk7XG4gICAgICAgICAgcmVwbGFjZWQuc2Nob29sID0gVFRfU1RBVEUuc2Nob29sO1xuICAgICAgICAgIHRoaXMudHJpZ2dlcihyZXBsYWNlZCk7XG4gICAgICAgICAgcmV0dXJuOyAvLyBzdG9wIHByb2Nlc3NpbmcgaGVyZVxuICAgICAgICB9XG4gICAgICAgIGlmIChyZXNwb25zZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgVFRfU1RBVEUgPSBuZXdfc3RhdGU7IC8vb25seSB1cGRhdGUgc3RhdGUgaWYgc3VjY2Vzc2Z1bFxuICAgICAgICAgIHZhciBpbmRleCA9IDA7XG4gICAgICAgICAgaWYgKG5ld19zdGF0ZS5pbmRleCAmJiBuZXdfc3RhdGUuaW5kZXggPCByZXNwb25zZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGluZGV4ID0gbmV3X3N0YXRlLmluZGV4O1xuICAgICAgICAgICAgZGVsZXRlIG5ld19zdGF0ZVsnaW5kZXgnXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy50cmlnZ2VyKHtcbiAgICAgICAgICAgICAgdGltZXRhYmxlczogcmVzcG9uc2UsXG4gICAgICAgICAgICAgIGNvdXJzZXNfdG9fc2VjdGlvbnM6IFRUX1NUQVRFLmNvdXJzZXNfdG9fc2VjdGlvbnMsXG4gICAgICAgICAgICAgIGN1cnJlbnRfaW5kZXg6IGluZGV4LFxuICAgICAgICAgICAgICBsb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgICAgICAgcHJlZmVyZW5jZXM6IFRUX1NUQVRFLnByZWZlcmVuY2VzXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoISQuaXNFbXB0eU9iamVjdChUVF9TVEFURS5jb3Vyc2VzX3RvX3NlY3Rpb25zKSkgeyAvLyBjb25mbGljdFxuICAgICAgICAgIC8vIGlmIHR1cm5pbmcgY29uZmxpY3RzIG9mZiBsZWQgdG8gYSBjb25mbGljdCwgcmVwcm9tcHQgdXNlclxuICAgICAgICAgIGlmIChDT05GTElDVF9PRkYpIHtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcih7XG4gICAgICAgICAgICAgIGxvYWRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgICBjb25mbGljdF9lcnJvcjogZmFsc2UsXG4gICAgICAgICAgICAgIHByZWZlcmVuY2VzOiBUVF9TVEFURS5wcmVmZXJlbmNlc1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIFRvYXN0QWN0aW9ucy5jcmVhdGVUb2FzdChcIlBsZWFzZSByZW1vdmUgc29tZSBjb3Vyc2VzIGJlZm9yZSB0dXJuaW5nIG9mZiBBbGxvdyBDb25mbGljdHNcIik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcih7XG4gICAgICAgICAgICAgIGxvYWRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgICBjb25mbGljdF9lcnJvcjogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBUb2FzdEFjdGlvbnMuY3JlYXRlVG9hc3QoXCJUaGF0IGNvdXJzZSBjYXVzZWQgYSBjb25mbGljdCEgVHJ5IGFnYWluIHdpdGggdGhlIEFsbG93IENvbmZsaWN0cyBwcmVmZXJlbmNlIHR1cm5lZCBvbi5cIik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudHJpZ2dlcih7bG9hZGluZzogZmFsc2V9KTtcbiAgICAgICAgfVxuICAgICAgICBDT05GTElDVF9PRkYgPSBmYWxzZTtcbiAgICB9LmJpbmQodGhpcykpO1xuICB9LFxuXG5cbiAgbG9hZFByZXNldFRpbWV0YWJsZTogZnVuY3Rpb24odXJsX2RhdGEpIHtcbiAgICB2YXIgY291cnNlcyA9IHVybF9kYXRhLnNwbGl0KFwiJlwiKTtcbiAgICB2YXIgc2Nob29sID0gVXRpbC5nZXRVbmhhc2hlZFN0cmluZyhjb3Vyc2VzLnNoaWZ0KCkpO1xuICAgIHZhciBwcmVmcyA9IGNvdXJzZXMuc2hpZnQoKTtcbiAgICB2YXIgcHJlZmVyZW5jZXNfYXJyYXkgPSBwcmVmcy5zcGxpdChcIjtcIik7XG4gICAgdmFyIHByZWZfb2JqID0ge307XG4gICAgZm9yICh2YXIgayBpbiBwcmVmZXJlbmNlc19hcnJheSkge1xuICAgICAgdmFyIHByZWZfd2l0aF92YWwgPSBwcmVmZXJlbmNlc19hcnJheVtrXS5zcGxpdChcIj1cIik7IC8vZS5nLiBbXCJhbGxvd19jb25mbGljdHNcIiwgXCJmYWxzZVwiXVxuICAgICAgdmFyIHByZWYgPSBVdGlsLmdldFVuaGFzaGVkU3RyaW5nKHByZWZfd2l0aF92YWxbMF0pO1xuICAgICAgdmFyIHZhbCA9IEJvb2xlYW4oVXRpbC5nZXRVbmhhc2hlZFN0cmluZyhwcmVmX3dpdGhfdmFsWzFdKSA9PT0gXCJ0cnVlXCIpO1xuXG4gICAgICBwcmVmX29ialtwcmVmXSA9ICh2YWwpO1xuICAgIH1cbiAgICB0aGlzLnRyaWdnZXIoe2xvYWRpbmc6IHRydWUsIHNjaG9vbDogc2Nob29sLCBwcmVmZXJlbmNlczpwcmVmX29ian0pO1xuICAgIFRUX1NUQVRFLnByZWZlcmVuY2VzID0gcHJlZl9vYmo7XG4gICAgVFRfU1RBVEUuc2Nob29sID0gc2Nob29sO1xuICAgIFRUX1NUQVRFLmluZGV4ID0gcGFyc2VJbnQoVXRpbC5nZXRVbmhhc2hlZFN0cmluZyhjb3Vyc2VzLnNoaWZ0KCkpKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdXJzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjb3Vyc2VfaW5mbyA9IGNvdXJzZXNbaV0uc3BsaXQoXCIrXCIpO1xuICAgICAgdmFyIGMgPSBwYXJzZUludChVdGlsLmdldFVuaGFzaGVkU3RyaW5nKGNvdXJzZV9pbmZvLnNoaWZ0KCkpKTtcblxuICAgICAgVFRfU1RBVEUuY291cnNlc190b19zZWN0aW9uc1tjXSA9IHsnTCc6ICcnLCAnVCc6ICcnLCAnUCc6ICcnLCAnQyc6ICcnfTtcbiAgICAgIGlmIChjb3Vyc2VfaW5mby5sZW5ndGggPiAwKSB7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY291cnNlX2luZm8ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICB2YXIgc2VjdGlvbiA9IFV0aWwuZ2V0VW5oYXNoZWRTdHJpbmcoY291cnNlX2luZm9bal0pO1xuICAgICAgICAgIGlmIChzY2hvb2wgPT0gXCJ1b2Z0XCIpIHtcbiAgICAgICAgICAgIFRUX1NUQVRFLmNvdXJzZXNfdG9fc2VjdGlvbnNbY11bc2VjdGlvblswXV0gPSBzZWN0aW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmIChzY2hvb2wgPT0gXCJqaHVcIikge1xuICAgICAgICAgICAgVFRfU1RBVEUuY291cnNlc190b19zZWN0aW9uc1tjXVsnQyddID0gc2VjdGlvbjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5tYWtlUmVxdWVzdChUVF9TVEFURSk7XG4gIH0sXG5cbiAgc2V0Q291cnNlc0xvYWRpbmc6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMudHJpZ2dlcih7Y291cnNlc19sb2FkaW5nOiB0cnVlfSk7XG4gIH0sXG4gIHNldENvdXJzZXNEb25lTG9hZGluZzogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy50cmlnZ2VyKHtjb3Vyc2VzX2xvYWRpbmc6IGZhbHNlfSk7XG4gIH0sXG4gIHNldEN1cnJlbnRJbmRleDogZnVuY3Rpb24obmV3X2luZGV4KSB7XG4gICAgdGhpcy50cmlnZ2VyKHtjdXJyZW50X2luZGV4OiBuZXdfaW5kZXh9KTtcbiAgfSxcblxufSk7XG5cbiQod2luZG93KS5vbignYmVmb3JldW5sb2FkJywgZnVuY3Rpb24oKSB7XG4gICQuYWpheCh7XG4gICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICBhc3luYzogZmFsc2UsXG4gICAgICB1cmw6ICcvZXhpdCcsXG4gICAgICBkYXRhOiB7c2lkOiBTSUR9XG4gIH0pO1xufSk7XG5cbiIsInZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgVGltZXRhYmxlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFNpbXBsZU1vZGFsID0gcmVxdWlyZSgnLi9zaW1wbGVfbW9kYWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIG1peGluczogW1JlZmx1eC5jb25uZWN0KFRpbWV0YWJsZVN0b3JlKV0sXG5cbiAgZ2V0QWRkb25zOiBmdW5jdGlvbigpIHtcbiAgXHR2YXIgYWRkb25zID0gW1xuICBcdFx0e1xuICBcdFx0XHRsaW5rOiBcImh0dHA6Ly9hbXpuLnRvLzFPekZhT1FcIixcbiAgXHRcdFx0aW1nOiBcImh0dHA6Ly9lY3guaW1hZ2VzLWFtYXpvbi5jb20vaW1hZ2VzL0kvNzE1MDhzdFhwN0wuX1NYNTIyXy5qcGdcIixcbiAgXHRcdFx0dGl0bGU6IFwiTWVhZCBTcGlyYWwgTm90ZWJvb2tcIixcbiAgXHRcdFx0cHJpY2U6IFwiJDguOThcIixcbiAgXHRcdFx0cHJpbWVfZWxpZ2libGU6IHRydWVcbiAgXHRcdH0sXG4gIFx0XHR7XG4gIFx0XHRcdGxpbms6IFwiaHR0cDovL2Ftem4udG8vMVp1UVJMVFwiLFxuICBcdFx0XHRpbWc6IFwiaHR0cDovL2VjeC5pbWFnZXMtYW1hem9uLmNvbS9pbWFnZXMvSS82MVY2d29FZG5nTC5fU1k2NzlfLmpwZ1wiLFxuICBcdFx0XHR0aXRsZTogXCJCSUMgSGlnaGxpZ2h0ZXJzXCIsXG4gIFx0XHRcdHByaWNlOiBcIiQ0LjA0XCIsXG4gIFx0XHRcdHByaW1lX2VsaWdpYmxlOiB0cnVlXG4gIFx0XHR9LFxuICBcdFx0e1xuICBcdFx0XHRsaW5rOiBcImh0dHA6Ly9hbXpuLnRvLzFadVIzZFlcIixcbiAgXHRcdFx0aW1nOiBcImh0dHA6Ly9lY3guaW1hZ2VzLWFtYXpvbi5jb20vaW1hZ2VzL0kvODFxamV3dktuZEwuX1NYNTIyXy5qcGdcIixcbiAgXHRcdFx0dGl0bGU6IFwiMjUgUG9ja2V0IEZvbGRlcnNcIixcbiAgXHRcdFx0cHJpY2U6IFwiJDYuOThcIixcbiAgXHRcdFx0cHJpbWVfZWxpZ2libGU6IHRydWVcbiAgXHRcdH1cbiAgXHRdXG4gIFx0dmFyIGFkZG9uc0hUTUwgPSBhZGRvbnMubWFwKGZ1bmN0aW9uKGl0ZW0sIGkpIHtcbiAgXHRcdHZhciBpbWcgPSA8aW1nIGhlaWdodD1cIjEyNVwiIHNyYz17aXRlbS5pbWd9Lz5cbiAgXHRcdHZhciB0aXRsZSA9IDxoNiBjbGFzc05hbWU9XCJsaW5lLWNsYW1wIHRpdGxlXCI+e2l0ZW0udGl0bGV9PC9oNj5cbiAgXHRcdHZhciBwcmljZSA9IDxoNiBjbGFzc05hbWU9XCJwcmljZVwiPntpdGVtLnByaWNlfTwvaDY+XG4gIFx0XHR2YXIgcHJpbWVfbG9nbyA9IGl0ZW0ucHJpbWVfZWxpZ2libGUgPyA8aW1nIGNsYXNzTmFtZT1cInByaW1lXCIgaGVpZ2h0PVwiMTVweFwiIHNyYz1cIi9zdGF0aWMvaW1nL3ByaW1lLnBuZ1wiLz4gOiBudWxsXG4gIFx0XHRyZXR1cm4gKFxuICBcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImFkZG9uIGN1c3RvbS1hZGRvblwiIGtleT17aX0+XG4gIFx0XHRcdFx0PGEgaHJlZj17aXRlbS5saW5rfSB0YXJnZXQ9XCJfYmxhbmtcIj4gXG5cdCAgXHRcdFx0XHR7aW1nfVxuXHQgIFx0XHRcdFx0e3RpdGxlfVxuXHQgIFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJwcmljZS1wcmltZS1jb250YWluZXJcIj5cblx0XHQgIFx0XHRcdFx0e3ByaWNlfVxuXHRcdCAgXHRcdFx0XHR7cHJpbWVfbG9nb31cblx0XHQgIFx0XHRcdDwvZGl2PlxuXHQgIFx0XHRcdDwvYT5cbiAgXHRcdFx0PC9kaXY+KVxuICBcdH0uYmluZCh0aGlzKSk7XG4gIFx0cmV0dXJuICg8ZGl2IGNsYXNzTmFtZT1cImFkZG9uLXdyYXBwZXJcIj57YWRkb25zSFRNTH08L2Rpdj4pXG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgXHR2YXIgaHRtbCA9IHRoaXMucHJvcHMuY291cnNlcy5tYXAoZnVuY3Rpb24oYywgaSkge1xuICBcdFx0aWYgKCBjLnRleHRib29rcy5sZW5ndGggPiAwICkge1xuICBcdFx0ICB2YXIgaW5uZXJfaHRtbCA9IGMudGV4dGJvb2tzLm1hcChmdW5jdGlvbih0Yikge1xuXHQgIFx0XHQgIGlmICh0YlsnaW1hZ2VfdXJsJ10gPT09IFwiQ2Fubm90IGJlIGZvdW5kXCIpIHtcblx0ICAgICAgICAgICAgdmFyIGltZyA9ICcvc3RhdGljL2ltZy9kZWZhdWx0X2NvdmVyLmpwZydcblx0ICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHZhciBpbWcgPSB0YlsnaW1hZ2VfdXJsJ11cblx0ICAgICAgICAgIH1cblx0ICAgICAgICAgIGlmICh0YlsndGl0bGUnXSA9PSBcIkNhbm5vdCBiZSBmb3VuZFwiKSB7XG5cdCAgICAgICAgICAgIHZhciB0aXRsZSA9IFwiI1wiICsgIHRiWydpc2JuJ11cblx0ICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHZhciB0aXRsZSA9IHRiWyd0aXRsZSddXG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgICByZXR1cm4gKCBcblx0ICAgICAgICAgICAgPGEgY2xhc3NOYW1lPVwidGV4dGJvb2tcIiBocmVmPXt0YlsnZGV0YWlsX3VybCddfSB0YXJnZXQ9XCJfYmxhbmtcIiBrZXk9e3RiWydpZCddfT5cblx0ICAgICAgICAgICAgICAgIDxpbWcgaGVpZ2h0PVwiMTI1XCIgc3JjPXtpbWd9Lz5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibW9kdWxlXCI+XG5cdCAgICAgICAgICAgICAgICAgIDxoNiBjbGFzc05hbWU9XCJsaW5lLWNsYW1wXCI+e3RpdGxlfTwvaDY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiaHR0cHM6Ly9pbWFnZXMtbmEuc3NsLWltYWdlcy1hbWF6b24uY29tL2ltYWdlcy9HLzAxL2Fzc29jaWF0ZXMvcmVtb3RlLWJ1eS1ib3gvYnV5NS5fVjE5MjIwNzczOV8uZ2lmXCIgd2lkdGg9XCIxMjBcIiBoZWlnaHQ9XCIyOFwiIGJvcmRlcj1cIjBcIi8+XG5cdCAgICAgICAgICAgIDwvYT4pO1xuICBcdFx0XHR9LmJpbmQodGhpcykpO1xuICAgICAgICB2YXIgaGVhZGVyID0gdGhpcy5wcm9wcy5zY2hvb2wgPT0gXCJ1b2Z0XCIgPyAoXG4gICAgICAgICAgICAgIDxoNj57Yy5jb2RlfToge2MubmFtZX08L2g2PiApIDogXG4gICAgICAgICAgICAgKDxoNj57Yy5uYW1lfTwvaDY+KTtcblx0ICBcdFx0cmV0dXJuIChcblx0ICBcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInRleHRib29rLWxpc3QtZW50cnlcIiBrZXk9e2l9PlxuXHQgIFx0XHRcdFx0e2hlYWRlcn1cblx0ICBcdFx0XHRcdCA8ZGl2IGNsYXNzTmFtZT1cImNvdXJzZS1yb3N0ZXIgdGV4dGJvb2stbGlzdFwiPlxuXHQgIFx0XHRcdFx0XHR7aW5uZXJfaHRtbH1cblx0ICBcdFx0XHRcdDwvZGl2PlxuXHQgIFx0XHRcdDwvZGl2PilcbiAgXHRcdH1cbiAgXHRcdGVsc2Uge1xuICBcdFx0XHRyZXR1cm4gbnVsbFxuICBcdFx0fVxuICBcdH0uYmluZCh0aGlzKSk7XG4gICAgcmV0dXJuIChcbiAgICBcdDxkaXYgY2xhc3NOYW1lPVwidGV4dGJvb2stbGlzdC13cmFwcGVyXCI+XG4gICAgICAgIHt0aGlzLnByb3BzLmFkZFRvQ2FydH1cbiAgICBcdFx0e2h0bWx9XG4gICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwidGV4dGJvb2stbGlzdC1lbnRyeVwiPlxuICBcdFx0XHRcdDxoNj5Qb3B1bGFyIEFkZG9uczwvaDY+XG4gICAgXHRcdFx0e3RoaXMuZ2V0QWRkb25zKCl9XG4gICAgXHRcdDwvZGl2PlxuICAgIFx0PC9kaXY+KVxuICB9LFxuXG59KTsiLCJ2YXIgU2xvdE1hbmFnZXIgPSByZXF1aXJlKCcuL3Nsb3RfbWFuYWdlcicpO1xudmFyIFBhZ2luYXRpb24gPSByZXF1aXJlKCcuL3BhZ2luYXRpb24nKTtcbnZhciBVcGRhdGVUaW1ldGFibGVzU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcycpO1xudmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMnKTtcbnZhciBUb2FzdEFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdG9hc3RfYWN0aW9ucycpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwvdGltZXRhYmxlX3V0aWwnKTtcbnZhciBOZXdQYWdpbmF0aW9uID0gcmVxdWlyZSgnLi9uZXdfcGFnaW5hdGlvbicpO1xudmFyIENvcHlCdXR0b24gPSByZXF1aXJlKCcuL2NvcHlfYnV0dG9uJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBtaXhpbnM6IFtSZWZsdXguY29ubmVjdChVcGRhdGVUaW1ldGFibGVzU3RvcmUpXSxcblxuICBzZXRJbmRleDogZnVuY3Rpb24obmV3X2luZGV4KSB7XG4gICAgcmV0dXJuKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChuZXdfaW5kZXggPj0gMCAmJiBuZXdfaW5kZXggPCB0aGlzLnN0YXRlLnRpbWV0YWJsZXMubGVuZ3RoKSB7XG4gICAgICAgIFRpbWV0YWJsZUFjdGlvbnMuc2V0Q3VycmVudEluZGV4KG5ld19pbmRleCk7XG4gICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICBnZXREYXRhOiBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIFV0aWwuZ2V0TGlua0RhdGEodGhpcy5zdGF0ZS5zY2hvb2wsXG4gICAgICB0aGlzLnN0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnMsXG4gICAgICB0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXgsIHRoaXMuc3RhdGUucHJlZmVyZW5jZXMpO1xuICB9LFxuICBnZXRFbmRIb3VyOiBmdW5jdGlvbigpIHtcbiAgICAvLyBnZXRzIHRoZSBlbmQgaG91ciBvZiB0aGUgY3VycmVudCB0aW1ldGFibGVcbiAgICB2YXIgbWF4X2VuZF9ob3VyID0gMTc7XG4gICAgaWYgKCF0aGlzLmhhc1RpbWV0YWJsZXMoKSkge1xuICAgICAgcmV0dXJuIG1heF9lbmRfaG91cjtcbiAgICB9XG4gICAgdmFyIGNvdXJzZXMgPSB0aGlzLnN0YXRlLnRpbWV0YWJsZXNbdGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4XS5jb3Vyc2VzO1xuICAgIGZvciAodmFyIGNvdXJzZV9pbmRleCBpbiBjb3Vyc2VzKSB7XG4gICAgICB2YXIgY291cnNlID0gY291cnNlc1tjb3Vyc2VfaW5kZXhdO1xuICAgICAgZm9yICh2YXIgc2xvdF9pbmRleCBpbiBjb3Vyc2Uuc2xvdHMpIHtcbiAgICAgICAgdmFyIHNsb3QgPSBjb3Vyc2Uuc2xvdHNbc2xvdF9pbmRleF07XG4gICAgICAgIHZhciBlbmRfaG91ciA9IHBhcnNlSW50KHNsb3QudGltZV9lbmQuc3BsaXQoXCI6XCIpWzBdKTtcbiAgICAgICAgbWF4X2VuZF9ob3VyID0gTWF0aC5tYXgobWF4X2VuZF9ob3VyLCBlbmRfaG91cik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtYXhfZW5kX2hvdXI7XG5cbiAgfSxcblxuICBnZXRIb3VyUm93czogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1heF9lbmRfaG91ciA9IHRoaXMuZ2V0RW5kSG91cigpO1xuICAgIHZhciByb3dzID0gW107XG4gICAgdmFyIHJvd19zdHlsZSA9IHtib3JkZXJDb2xvcjogXCIjRTBERkRGXCJ9O1xuICAgIGZvciAodmFyIGkgPSA4OyBpIDw9IG1heF9lbmRfaG91cjsgaSsrKSB7IC8vIG9uZSByb3cgZm9yIGVhY2ggaG91ciwgc3RhcnRpbmcgZnJvbSA4YW1cbiAgICAgIHZhciB0aW1lID0gaSArIFwiYW1cIjtcbiAgICAgIGlmIChpID49IDEyKSB7IC8vIHRoZSBwbSBob3Vyc1xuICAgICAgICB2YXIgaG91ciA9IChpIC0gMTIpID4gMCA/IGkgLSAxMiA6IGk7XG4gICAgICAgIHRpbWUgPSBob3VyICsgXCJwbVwiO1xuICAgICAgfVxuICAgICAgcm93cy5wdXNoKFxuICAgICAgICAgICg8dHIga2V5PXt0aW1lfT5cbiAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiIHN0eWxlPXtyb3dfc3R5bGV9PjxzcGFuPnt0aW1lfTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIiBzdHlsZT17cm93X3N0eWxlfT48L3RkPlxuICAgICAgICAgIDwvdHI+KVxuICAgICAgKTsgIFxuICAgICAgLy8gZm9yIHRoZSBoYWxmIGhvdXIgcm93XG4gICAgICByb3dzLnB1c2goXG4gICAgICAgICAgKDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiIGtleT17dGltZSArIFwiLWhhbGZcIn0+XG4gICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIiBzdHlsZT17cm93X3N0eWxlfT48L3RkPlxuICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIiBzdHlsZT17cm93X3N0eWxlfT48L3RkPlxuICAgICAgICAgIDwvdHI+KVxuICAgICAgKTtcblxuICAgIH1cblxuICAgIHJldHVybiByb3dzO1xuICB9LFxuXG5cbiAgaGFzVGltZXRhYmxlczogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGUudGltZXRhYmxlcy5sZW5ndGggPiAwO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaGFzX3RpbWV0YWJsZXMgPSB0aGlzLmhhc1RpbWV0YWJsZXMoKTtcbiAgICAgIHZhciBzbG90X21hbmFnZXIgPSAhaGFzX3RpbWV0YWJsZXMgPyBudWxsIDpcbiAgICAgICAoPFNsb3RNYW5hZ2VyIHRvZ2dsZU1vZGFsPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsfSBcbiAgICAgICAgICAgICAgICAgICAgIHRpbWV0YWJsZT17dGhpcy5zdGF0ZS50aW1ldGFibGVzW3RoaXMuc3RhdGUuY3VycmVudF9pbmRleF19XG4gICAgICAgICAgICAgICAgICAgICBjb3Vyc2VzX3RvX3NlY3Rpb25zPXt0aGlzLnN0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnN9XG4gICAgICAgICAgICAgICAgICAgICBzY2hvb2w9e3RoaXMuc3RhdGUuc2Nob29sfS8+KTtcblxuICAgICAgdmFyIGhvdXJzID0gdGhpcy5nZXRIb3VyUm93cygpO1xuICAgICAgdmFyIG9wYWNpdHkgPSB0aGlzLnN0YXRlLmxvYWRpbmcgPyB7b3BhY2l0eTogXCIwLjVcIn0gOiB7fTtcbiAgICAgIHZhciBoZWlnaHQgPSAoNTcyICsgKHRoaXMuZ2V0RW5kSG91cigpIC0gMTgpKjUyKSArIFwicHhcIjtcbiAgICAgIHJldHVybiAoXG5cbiAgICAgICAgICA8ZGl2IGlkPVwiY2FsZW5kYXJcIiBjbGFzc05hbWU9XCJmYyBmYy1sdHIgZmMtdW50aGVtZWRcIiBzdHlsZT17b3BhY2l0eX0+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdG9vbGJhclwiPlxuICAgICAgICAgICAgICAgIDxOZXdQYWdpbmF0aW9uIFxuICAgICAgICAgICAgICAgICAgY291bnQ9e3RoaXMuc3RhdGUudGltZXRhYmxlcy5sZW5ndGh9IFxuICAgICAgICAgICAgICAgICAgbmV4dD17dGhpcy5zZXRJbmRleCh0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXggKyAxKX0gXG4gICAgICAgICAgICAgICAgICBwcmV2PXt0aGlzLnNldEluZGV4KHRoaXMuc3RhdGUuY3VycmVudF9pbmRleCAtIDEpfVxuICAgICAgICAgICAgICAgICAgc2V0SW5kZXg9e3RoaXMuc2V0SW5kZXh9XG4gICAgICAgICAgICAgICAgICBjdXJyZW50X2luZGV4PXt0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXh9Lz5cbiAgICAgICAgICAgICAgICA8Q29weUJ1dHRvbiBnZXREYXRhPXt0aGlzLmdldERhdGF9IC8+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1jbGVhclwiPjwvZGl2PlxuXG5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy12aWV3LWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdmlldyBmYy1hZ2VuZGFXZWVrLXZpZXcgZmMtYWdlbmRhLXZpZXdcIj5cbiAgICAgICAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtcm93IGZjLXdpZGdldC1oZWFkZXJcIiBpZD1cImN1c3RvbS13aWRnZXQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtd2lkZ2V0LWhlYWRlclwiPjwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWRheS1oZWFkZXIgZmMtd2lkZ2V0LWhlYWRlciBmYy1tb25cIj5Nb24gPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwiZmMtZGF5LWhlYWRlciBmYy13aWRnZXQtaGVhZGVyIGZjLXR1ZVwiPlR1ZSA8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJmYy1kYXktaGVhZGVyIGZjLXdpZGdldC1oZWFkZXIgZmMtd2VkXCI+V2VkIDwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWRheS1oZWFkZXIgZmMtd2lkZ2V0LWhlYWRlciBmYy10aHVcIj5UaHUgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwiZmMtZGF5LWhlYWRlciBmYy13aWRnZXQtaGVhZGVyIGZjLWZyaVwiPkZyaSA8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90aGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgPC90aGVhZD5cblxuICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtZGF5LWdyaWRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtY29udGVudC1za2VsZXRvblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpc1wiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRpbWUtZ3JpZC1jb250YWluZXIgZmMtc2Nyb2xsZXJcIiBpZD1cImNhbGVuZGFyLWlubmVyXCIgc3R5bGU9e3toZWlnaHQ6IGhlaWdodH19PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdGltZS1ncmlkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWJnXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWRheSBmYy13aWRnZXQtY29udGVudCBmYy1tb25cIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtZGF5IGZjLXdpZGdldC1jb250ZW50IGZjLXR1ZVwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1kYXkgZmMtd2lkZ2V0LWNvbnRlbnQgZmMtd2VkXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWRheSBmYy13aWRnZXQtY29udGVudCBmYy10aHVcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtZGF5IGZjLXdpZGdldC1jb250ZW50IGZjLWZyaVwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtc2xhdHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtob3Vyc31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aHIgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWhlYWRlclwiIGlkPVwid2lkZ2V0LWhyXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtY29udGVudC1za2VsZXRvblwiIGlkPVwic2xvdC1tYW5hZ2VyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtzbG90X21hbmFnZXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgKTtcbiAgfSxcblxuICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgIGlmKFV0aWwuYnJvd3NlclN1cHBvcnRzTG9jYWxTdG9yYWdlKCkpIHtcbiAgICAgIGlmICh0aGlzLnN0YXRlLnRpbWV0YWJsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyBzYXZlIG5ld2x5IGdlbmVyYXRlZCBjb3Vyc2VzIHRvIGxvY2FsIHN0b3JhZ2VcbiAgICAgICAgdmFyIG5ld19kYXRhID0gdGhpcy5nZXREYXRhKCk7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdkYXRhJywgbmV3X2RhdGEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2RhdGEnKTtcbiAgICAgIH1cbiAgICB9IFxuXG4gIH0sXG5cblxufSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge3Zpc2libGU6IHRydWV9O1xuXHR9LFx0XHRcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIXRoaXMuc3RhdGUudmlzaWJsZSkge3JldHVybiBudWxsO31cblx0XHRyZXR1cm4gKFxuXHRcdDxkaXYgY2xhc3NOYW1lPVwic2VtLXRvYXN0LXdyYXBwZXIgdG9hc3RpbmdcIj5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2VtLXRvYXN0XCI+e3RoaXMucHJvcHMuY29udGVudH08L2Rpdj5cblx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9LFxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdGlmICh0aGlzLl9yZWFjdEludGVybmFsSW5zdGFuY2UpIHsgLy8gaWYgbW91bnRlZCBzdGlsbFxuXHRcdFx0XHR0aGlzLnNldFN0YXRlKHt2aXNpYmxlOiBmYWxzZX0pO1xuXHRcdFx0fVxuXHRcdH0uYmluZCh0aGlzKSwgNDAwMCk7XG5cdH0sXG5cbn0pO1xuIiwidmFyIGhhc2hpZHMgPSBuZXcgSGFzaGlkcyhcIng5OGFzN2RoZyZoKmFza2RqXmhhcyFraj94ejwhOVwiKTtcbm1vZHVsZS5leHBvcnRzID0ge1xuXHRnZXRMaW5rRGF0YTogZnVuY3Rpb24oc2Nob29sLCBjb3Vyc2VzX3RvX3NlY3Rpb25zLCBpbmRleCwgcHJlZmVyZW5jZXMpIHtcblx0XHRpZiAoT2JqZWN0LmtleXMoY291cnNlc190b19zZWN0aW9ucykubGVuZ3RoID09IDApIHtyZXR1cm4gXCJcIjt9XG5cdCAgICB2YXIgZGF0YSA9IHRoaXMuZ2V0SGFzaGVkU3RyaW5nKHNjaG9vbCkgKyBcIiZcIjtcblx0ICAgIGZvciAodmFyIHByZWYgaW4gcHJlZmVyZW5jZXMpIHtcblx0ICAgIFx0dmFyIGVuY29kZWRfcCA9IHRoaXMuZ2V0SGFzaGVkU3RyaW5nKHByZWYpO1xuXHQgICAgXHR2YXIgZW5jb2RlZF92YWwgPSB0aGlzLmdldEhhc2hlZFN0cmluZyhwcmVmZXJlbmNlc1twcmVmXSk7XG5cdCAgICBcdGRhdGEgKz0gZW5jb2RlZF9wICsgXCI9XCIgKyBlbmNvZGVkX3ZhbCArIFwiO1wiO1xuXHQgICAgfVxuXHQgICAgZGF0YSA9IGRhdGEuc2xpY2UoMCwgLTEpO1xuXHQgICAgZGF0YSArPSBcIiZcIiArIHRoaXMuZ2V0SGFzaGVkU3RyaW5nKGluZGV4KSArIFwiJlwiO1xuXHQgICAgdmFyIGNfdG9fcyA9IGNvdXJzZXNfdG9fc2VjdGlvbnM7XG5cdCAgICBmb3IgKHZhciBjb3Vyc2VfaWQgaW4gY190b19zKSB7XG5cdCAgICAgIHZhciBlbmNvZGVkX2NvdXJzZV9pZCA9IHRoaXMuZ2V0SGFzaGVkU3RyaW5nKGNvdXJzZV9pZCk7XG5cdCAgICAgIGRhdGEgKz0gZW5jb2RlZF9jb3Vyc2VfaWQ7XG5cblx0ICAgICAgdmFyIG1hcHBpbmcgPSBjX3RvX3NbY291cnNlX2lkXTtcblx0ICAgICAgZm9yICh2YXIgc2VjdGlvbl9oZWFkaW5nIGluIG1hcHBpbmcpIHsgLy8gaS5lICdMJywgJ1QnLCAnUCcsICdTJ1xuXHQgICAgICAgIGlmIChtYXBwaW5nW3NlY3Rpb25faGVhZGluZ10gIT0gXCJcIikge1xuXHQgICAgICAgICAgdmFyIGVuY29kZWRfc2VjdGlvbiA9IHRoaXMuZ2V0SGFzaGVkU3RyaW5nKG1hcHBpbmdbc2VjdGlvbl9oZWFkaW5nXSk7XG5cdCAgICAgICAgICBkYXRhICs9IFwiK1wiICsgZW5jb2RlZF9zZWN0aW9uOyAvLyBkZWxpbWl0ZXIgZm9yIHNlY3Rpb25zIGxvY2tlZFxuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXHQgICAgICBkYXRhICs9IFwiJlwiOyAvLyBkZWxpbWl0ZXIgZm9yIGNvdXJzZXNcblx0ICAgIH1cblx0ICAgIGRhdGEgPSBkYXRhLnNsaWNlKDAsIC0xKTtcblx0ICAgIGlmIChkYXRhLmxlbmd0aCA8IDMpIHtkYXRhID0gXCJcIjt9XG5cblx0ICAgIHJldHVybiBkYXRhO1xuXHR9LFxuXG5cdGdldEhhc2hlZFN0cmluZzogZnVuY3Rpb24oeCkge1xuXHRcdHggPSBTdHJpbmcoeCk7XG5cdFx0dmFyIGhleGVkID0gQnVmZmVyKHgpLnRvU3RyaW5nKCdoZXgnKTtcbiAgICBcdHZhciBlbmNvZGVkX3ggPSBoYXNoaWRzLmVuY29kZUhleChoZXhlZCk7XG4gICAgXHRpZiAoIWVuY29kZWRfeCB8fCBlbmNvZGVkX3ggPT0gXCJcIikge1xuICAgIFx0XHRjb25zb2xlLmxvZyh4KTtcbiAgICBcdH1cbiAgICBcdHJldHVybiBlbmNvZGVkX3g7XG5cdH0sXG5cblx0Z2V0VW5oYXNoZWRTdHJpbmc6IGZ1bmN0aW9uKHgpIHtcblx0XHR2YXIgZGVjb2RlZEhleCA9IGhhc2hpZHMuZGVjb2RlSGV4KHgpO1xuXHRcdHZhciBzdHJpbmcgPSBCdWZmZXIoZGVjb2RlZEhleCwgJ2hleCcpLnRvU3RyaW5nKCd1dGY4Jyk7XG5cdFx0cmV0dXJuIHN0cmluZztcblx0fSxcblxuXHRicm93c2VyU3VwcG9ydHNMb2NhbFN0b3JhZ2U6IGZ1bmN0aW9uKCkge1xuXHRcdHRyeSB7XG4gICBcdFx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcInRlc3RcIiwgXCJ0ZXN0XCIpO1xuICAgXHRcdFx0bG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oXCJ0ZXN0XCIpO1xuICAgXHRcdFx0cmV0dXJuIHRydWU7XG4gIFx0XHR9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgIFx0XHRcdHJldHVybiBmYWxzZTtcbiBcdFx0fVxuXHR9LFxuXG59XG4iXX0=
