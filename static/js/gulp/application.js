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

},{"./preference_menu":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/preference_menu.jsx","./search_bar":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/search_bar.jsx"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/evaluations.jsx":[function(require,module,exports){
var Evaluation = React.createClass({displayName: "Evaluation",
	render: function() {
		var classes = this.props.selected ? "eval-item selected" : "eval-item"
		var details = !this.props.selected ? null : (
			React.createElement("div", {id: "details"}, this.props.eval_data.summary.replace(/\u00a0/g, " "))
			)
		var prof = !this.props.selected ? null : (
			React.createElement("div", {id: "prof"}, "Professor: ", this.props.eval_data.professor)
			)
		return (
		React.createElement("div", {className: classes, onClick: this.props.selectionCallback}, 
			React.createElement("div", {id: "eval-wrapper"}, 
				React.createElement("div", {className: "year"}, this.props.eval_data.year), 
				prof, 
				React.createElement("div", {className: "rating-wrapper"}, 
					React.createElement("div", {className: "star-ratings-sprite"}, 
						React.createElement("span", {style: {width: 100*this.props.eval_data.score/5 + "%"}, className: "rating"})
					), 
					React.createElement("div", {className: "numeric-rating"}, "(" + this.props.eval_data.score + ")")
				)
			), 
			details
		));
	},
});

module.exports = React.createClass({displayName: "exports",
	
	getInitialState: function() {
		return {
			index_selected: null
		};
	},

	render: function() {
		var i = 0;
		var evals = this.props.eval_info.map(function(e) {
			i++;
			var selected = i == this.state.index_selected;
			return (React.createElement(Evaluation, {eval_data: e, key: e.id, selectionCallback: this.changeSelected(i), selected: selected}));
		}.bind(this));
		var click_notice = this.props.eval_info.length == 0 ? (React.createElement("div", {id: "empty-intro"}, "No course evaluations for this course yet.")) 
		: (React.createElement("div", {id: "click-intro"}, "Click an evaluation item above to read the comments."));
		return (
		React.createElement("div", {className: "modal-entry", id: "course-evaluations"}, 
			React.createElement("h6", null, "Course Evaluations:"), 
			React.createElement("div", {className: "eval-wrapper"}, 
				evals
			), 
			click_notice
		));
	},

	changeSelected: function(e_index) {
		return (function() {
			if (this.state.index_selected == e_index) 
				this.setState({index_selected: null});
			else
				this.setState({index_selected: e_index});
		}.bind(this));
	}
});

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/loader.jsx":[function(require,module,exports){
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
var SectionSlot = require('./section_slot.jsx')

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
                evaluations, 
                sections, 
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
            	React.createElement("div", {className: "textbook", key: tb.id}, 
            		React.createElement("img", {height: "95", src: tb.image_url}), 
            		React.createElement("h6", {className: "line-clamp"}, tb.title), 
            		React.createElement("div", null, tb.author), 
            		React.createElement("div", null, "ISBN:", tb.isbn), 
            		React.createElement("a", {href: tb.detail_url, target: "_blank"}, 
            			React.createElement("img", {src: "https://images-na.ssl-images-amazon.com/images/G/01/associates/remote-buy-box/buy5._V192207739_.gif", width: "120", height: "28", border: "0"})
            		)
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
		var F = this.state.course_info.sections_F.map(function(s){
			return (React.createElement(SectionSlot, {key: s, all_sections: this.state.course_info.sections_F_objs, section: s}))
		}.bind(this));
		var S = this.state.course_info.sections_S.map(function(s){
			return (React.createElement(SectionSlot, {key: s, all_sections: this.state.course_info.sections_S_objs, section: s}))
		}.bind(this));
		if (this.state.show_sections === this.state.course_info.code) {
			var sec_display = (
				React.createElement("div", {id: "all-sections-wrapper"}, 
					F, 
					S
				));
		} else {
			var sections_count = this.state.course_info.sections_S.length + this.state.course_info.sections_F.length;
			var sections_grammar = sections_count > 1 ? "sections" : "section";
			var sec_display = (React.createElement("div", {id: "numSections", onClick: this.setShowSections(this.state.course_info.code)}, "This course has ", React.createElement("b", null, sections_count), " ", sections_grammar, ". Click here to view."))
		}
		var sections = 
			(React.createElement("div", {className: "modal-entry", id: "course-sections"}, 
				React.createElement("h6", null, "Course Sections:"), 
				sec_display
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

},{"./actions/course_actions":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/course_actions.js","./actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./evaluations.jsx":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/evaluations.jsx","./loader":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/loader.jsx","./section_slot.jsx":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/section_slot.jsx","./stores/course_info":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/course_info.js","./stores/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/new_pagination.jsx":[function(require,module,exports){
module.exports = React.createClass({displayName: "exports",
  getInitialState: function() {
    var num_bubbles = this.getNumBubbles();
    return {num_bubbles: num_bubbles};
  },
  getNumBubbles: function() {
    var width = $(window).width();
    var bubbles = width > 700 ? 9 : 4;
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
        var section_and_prof = (
            React.createElement("div", {className: "sect-prof"}, 
                React.createElement("div", {className: "section-num"}, cos[0].meeting_section), 
                React.createElement("div", {className: "profs"}, cos[0].instructors)
            )
        );
        return (
            React.createElement("div", {className: "section-wrapper"}, 
                section_and_prof, 
                day_and_times
            ));
    },

    getRelatedCourseOfferings: function() {
        co_objects = []
        for (var i = 0; i < this.props.all_sections.length; i++) {
            var o = this.props.all_sections[i];
            if (o.meeting_section == this.props.section) {
                co_objects.push(o);
            }
        }
        return co_objects;
    },

    getDaysAndTimes: function(cos) {
        var dayAndTimes = cos.map(function(o) {
            return (React.createElement("div", {key: this.props.key, id: "day-time", key: o.id}, day_to_letter[o.day] + " " + o.time_start + "-" + o.time_end));
        }.bind(this));
        return ( React.createElement("div", {key: this.props.key, className: "dt-container"}, 
                dayAndTimes
            ) )
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
      see_all = (React.createElement("div", {className: "view-tbs", onClick: this.toggle}, "View All Textbooks"))
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

},{"./actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./simple_modal":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/simple_modal.jsx","./stores/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js","./textbook_list":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/textbook_list.jsx"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/simple_modal.jsx":[function(require,module,exports){
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
		$("#dim-screen").height($(document).height())
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

module.exports = React.createClass({displayName: "exports",
  mixins: [Reflux.connect(UpdateTimetablesStore)],

  setIndex: function(new_index) {
    return(function () {
      if (new_index >= 0 && new_index < this.state.timetables.length) {
        TimetableActions.setCurrentIndex(new_index);
      }
    }.bind(this));
  },

  getShareLink: function() {
    var link = window.location.host + "/";
    var data = this.getData();
    return link + data;
  },
  getData: function() {
  return Util.getLinkData(this.state.school,
      this.state.courses_to_sections,
      this.state.current_index, this.state.preferences);
  },
  getEndHour: function() {
    // gets the end hour of the current timetable
    var max_end_hour = 18;
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
    for (var i = 8; i <= max_end_hour; i++) { // one row for each hour, starting from 8am
      var time = i + "am";
      if (i >= 12) { // the pm hours
        var hour = (i - 12) > 0 ? i - 12 : i;
        time = hour + "pm";
      }
      rows.push(
          (React.createElement("tr", {key: time}, 
              React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}, React.createElement("span", null, time)), 
              React.createElement("td", {className: "fc-widget-content"})
          ))
      );  
      // for the half hour row
      rows.push(
          (React.createElement("tr", {className: "fc-minor", key: time + "-half"}, 
              React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}), 
              React.createElement("td", {className: "fc-widget-content"})
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
                React.createElement("a", {className: "btn btn-primary right calendar-function", 
                   "data-clipboard-text": this.getShareLink()}, 
                  React.createElement("span", {className: "fui-clip"})
                ), 
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

  componentDidMount: function() {
    var clip = new Clipboard('.calendar-function');
    clip.on('success', function(e) {
      ToastActions.createToast("Link copied to clipboard!");
    });
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

},{"./actions/toast_actions":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/toast_actions.js","./actions/update_timetables":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./new_pagination":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/new_pagination.jsx","./pagination":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/pagination.jsx","./slot_manager":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/slot_manager.jsx","./stores/update_timetables":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js","./util/timetable_util":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/util/timetable_util.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/toast.jsx":[function(require,module,exports){
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
var hashids = new Hashids("x98as7dhg&h*askdj^has!kj?xz<!9");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaXNhcnJheS9pbmRleC5qcyIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvYWN0aW9ucy9jb3Vyc2VfYWN0aW9ucy5qcyIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvYWN0aW9ucy90b2FzdF9hY3Rpb25zLmpzIiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzIiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9hcHAuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9jb250cm9sX2Jhci5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL2V2YWx1YXRpb25zLmpzeCIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvbG9hZGVyLmpzeCIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvbW9kYWxfY29udGVudC5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL25ld19wYWdpbmF0aW9uLmpzeCIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvcGFnaW5hdGlvbi5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3ByZWZlcmVuY2VfbWVudS5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3Jvb3QuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zY2hvb2xfbGlzdC5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3NlYXJjaF9iYXIuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zZWN0aW9uX3Nsb3QuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zaWRlX2Jhci5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3NpbXBsZV9tb2RhbC5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3Nsb3RfbWFuYWdlci5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3N0b3Jlcy9jb3Vyc2VfaW5mby5qcyIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc3RvcmVzL3RvYXN0X3N0b3JlLmpzIiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMiLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3RleHRib29rX2xpc3QuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS90aW1ldGFibGUuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS90b2FzdC5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3V0aWwvdGltZXRhYmxlX3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM1Z0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQzs7S0FFakMsT0FBTyxJQUFJLENBQUM7QUFDakIsRUFBRTs7Q0FFRCxlQUFlLEVBQUUsU0FBUyxDQUFDLEVBQUU7RUFDNUIsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNkLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDbkMsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUN6QyxJQUFJLENBQUMsU0FBUyxJQUFJLFNBQVMsSUFBSSxFQUFFLEVBQUU7TUFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNmO0tBQ0QsT0FBTyxTQUFTLENBQUM7QUFDdEIsRUFBRTs7Q0FFRCxpQkFBaUIsRUFBRSxTQUFTLENBQUMsRUFBRTtFQUM5QixJQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3RDLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0VBQ3hELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLEVBQUU7O0NBRUQsMkJBQTJCLEVBQUUsV0FBVztFQUN2QyxJQUFJO01BQ0EsWUFBWSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7TUFDckMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztNQUNoQyxPQUFPLElBQUksQ0FBQztLQUNiLENBQUMsT0FBTyxTQUFTLEVBQUU7TUFDbEIsT0FBTyxLQUFLLENBQUM7SUFDZjtBQUNKLEVBQUU7O0NBRUQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8ZmVyb3NzQGZlcm9zcy5vcmc+IDxodHRwOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuLyogZXNsaW50LWRpc2FibGUgbm8tcHJvdG8gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbnZhciBiYXNlNjQgPSByZXF1aXJlKCdiYXNlNjQtanMnKVxudmFyIGllZWU3NTQgPSByZXF1aXJlKCdpZWVlNzU0JylcbnZhciBpc0FycmF5ID0gcmVxdWlyZSgnaXNhcnJheScpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTIgLy8gbm90IHVzZWQgYnkgdGhpcyBpbXBsZW1lbnRhdGlvblxuXG52YXIgcm9vdFBhcmVudCA9IHt9XG5cbi8qKlxuICogSWYgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYDpcbiAqICAgPT09IHRydWUgICAgVXNlIFVpbnQ4QXJyYXkgaW1wbGVtZW50YXRpb24gKGZhc3Rlc3QpXG4gKiAgID09PSBmYWxzZSAgIFVzZSBPYmplY3QgaW1wbGVtZW50YXRpb24gKG1vc3QgY29tcGF0aWJsZSwgZXZlbiBJRTYpXG4gKlxuICogQnJvd3NlcnMgdGhhdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBhcmUgSUUgMTArLCBGaXJlZm94IDQrLCBDaHJvbWUgNyssIFNhZmFyaSA1LjErLFxuICogT3BlcmEgMTEuNissIGlPUyA0LjIrLlxuICpcbiAqIER1ZSB0byB2YXJpb3VzIGJyb3dzZXIgYnVncywgc29tZXRpbWVzIHRoZSBPYmplY3QgaW1wbGVtZW50YXRpb24gd2lsbCBiZSB1c2VkIGV2ZW5cbiAqIHdoZW4gdGhlIGJyb3dzZXIgc3VwcG9ydHMgdHlwZWQgYXJyYXlzLlxuICpcbiAqIE5vdGU6XG4gKlxuICogICAtIEZpcmVmb3ggNC0yOSBsYWNrcyBzdXBwb3J0IGZvciBhZGRpbmcgbmV3IHByb3BlcnRpZXMgdG8gYFVpbnQ4QXJyYXlgIGluc3RhbmNlcyxcbiAqICAgICBTZWU6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NTQzOC5cbiAqXG4gKiAgIC0gU2FmYXJpIDUtNyBsYWNrcyBzdXBwb3J0IGZvciBjaGFuZ2luZyB0aGUgYE9iamVjdC5wcm90b3R5cGUuY29uc3RydWN0b3JgIHByb3BlcnR5XG4gKiAgICAgb24gb2JqZWN0cy5cbiAqXG4gKiAgIC0gQ2hyb21lIDktMTAgaXMgbWlzc2luZyB0aGUgYFR5cGVkQXJyYXkucHJvdG90eXBlLnN1YmFycmF5YCBmdW5jdGlvbi5cbiAqXG4gKiAgIC0gSUUxMCBoYXMgYSBicm9rZW4gYFR5cGVkQXJyYXkucHJvdG90eXBlLnN1YmFycmF5YCBmdW5jdGlvbiB3aGljaCByZXR1cm5zIGFycmF5cyBvZlxuICogICAgIGluY29ycmVjdCBsZW5ndGggaW4gc29tZSBzaXR1YXRpb25zLlxuXG4gKiBXZSBkZXRlY3QgdGhlc2UgYnVnZ3kgYnJvd3NlcnMgYW5kIHNldCBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgIHRvIGBmYWxzZWAgc28gdGhleVxuICogZ2V0IHRoZSBPYmplY3QgaW1wbGVtZW50YXRpb24sIHdoaWNoIGlzIHNsb3dlciBidXQgYmVoYXZlcyBjb3JyZWN0bHkuXG4gKi9cbkJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUID0gZ2xvYmFsLlRZUEVEX0FSUkFZX1NVUFBPUlQgIT09IHVuZGVmaW5lZFxuICA/IGdsb2JhbC5UWVBFRF9BUlJBWV9TVVBQT1JUXG4gIDogdHlwZWRBcnJheVN1cHBvcnQoKVxuXG5mdW5jdGlvbiB0eXBlZEFycmF5U3VwcG9ydCAoKSB7XG4gIGZ1bmN0aW9uIEJhciAoKSB7fVxuICB0cnkge1xuICAgIHZhciBhcnIgPSBuZXcgVWludDhBcnJheSgxKVxuICAgIGFyci5mb28gPSBmdW5jdGlvbiAoKSB7IHJldHVybiA0MiB9XG4gICAgYXJyLmNvbnN0cnVjdG9yID0gQmFyXG4gICAgcmV0dXJuIGFyci5mb28oKSA9PT0gNDIgJiYgLy8gdHlwZWQgYXJyYXkgaW5zdGFuY2VzIGNhbiBiZSBhdWdtZW50ZWRcbiAgICAgICAgYXJyLmNvbnN0cnVjdG9yID09PSBCYXIgJiYgLy8gY29uc3RydWN0b3IgY2FuIGJlIHNldFxuICAgICAgICB0eXBlb2YgYXJyLnN1YmFycmF5ID09PSAnZnVuY3Rpb24nICYmIC8vIGNocm9tZSA5LTEwIGxhY2sgYHN1YmFycmF5YFxuICAgICAgICBhcnIuc3ViYXJyYXkoMSwgMSkuYnl0ZUxlbmd0aCA9PT0gMCAvLyBpZTEwIGhhcyBicm9rZW4gYHN1YmFycmF5YFxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuZnVuY3Rpb24ga01heExlbmd0aCAoKSB7XG4gIHJldHVybiBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVFxuICAgID8gMHg3ZmZmZmZmZlxuICAgIDogMHgzZmZmZmZmZlxufVxuXG4vKipcbiAqIENsYXNzOiBCdWZmZXJcbiAqID09PT09PT09PT09PT1cbiAqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGFyZSBhdWdtZW50ZWRcbiAqIHdpdGggZnVuY3Rpb24gcHJvcGVydGllcyBmb3IgYWxsIHRoZSBub2RlIGBCdWZmZXJgIEFQSSBmdW5jdGlvbnMuIFdlIHVzZVxuICogYFVpbnQ4QXJyYXlgIHNvIHRoYXQgc3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXQgcmV0dXJuc1xuICogYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogQnkgYXVnbWVudGluZyB0aGUgaW5zdGFuY2VzLCB3ZSBjYW4gYXZvaWQgbW9kaWZ5aW5nIHRoZSBgVWludDhBcnJheWBcbiAqIHByb3RvdHlwZS5cbiAqL1xuZnVuY3Rpb24gQnVmZmVyIChhcmcpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICAvLyBBdm9pZCBnb2luZyB0aHJvdWdoIGFuIEFyZ3VtZW50c0FkYXB0b3JUcmFtcG9saW5lIGluIHRoZSBjb21tb24gY2FzZS5cbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHJldHVybiBuZXcgQnVmZmVyKGFyZywgYXJndW1lbnRzWzFdKVxuICAgIHJldHVybiBuZXcgQnVmZmVyKGFyZylcbiAgfVxuXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzLmxlbmd0aCA9IDBcbiAgICB0aGlzLnBhcmVudCA9IHVuZGVmaW5lZFxuICB9XG5cbiAgLy8gQ29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykge1xuICAgIHJldHVybiBmcm9tTnVtYmVyKHRoaXMsIGFyZylcbiAgfVxuXG4gIC8vIFNsaWdodGx5IGxlc3MgY29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBmcm9tU3RyaW5nKHRoaXMsIGFyZywgYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiAndXRmOCcpXG4gIH1cblxuICAvLyBVbnVzdWFsLlxuICByZXR1cm4gZnJvbU9iamVjdCh0aGlzLCBhcmcpXG59XG5cbmZ1bmN0aW9uIGZyb21OdW1iZXIgKHRoYXQsIGxlbmd0aCkge1xuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoIDwgMCA/IDAgOiBjaGVja2VkKGxlbmd0aCkgfCAwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdGhhdFtpXSA9IDBcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbVN0cmluZyAodGhhdCwgc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJyB8fCBlbmNvZGluZyA9PT0gJycpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgLy8gQXNzdW1wdGlvbjogYnl0ZUxlbmd0aCgpIHJldHVybiB2YWx1ZSBpcyBhbHdheXMgPCBrTWF4TGVuZ3RoLlxuICB2YXIgbGVuZ3RoID0gYnl0ZUxlbmd0aChzdHJpbmcsIGVuY29kaW5nKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcblxuICB0aGF0LndyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21PYmplY3QgKHRoYXQsIG9iamVjdCkge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKG9iamVjdCkpIHJldHVybiBmcm9tQnVmZmVyKHRoYXQsIG9iamVjdClcblxuICBpZiAoaXNBcnJheShvYmplY3QpKSByZXR1cm4gZnJvbUFycmF5KHRoYXQsIG9iamVjdClcblxuICBpZiAob2JqZWN0ID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdtdXN0IHN0YXJ0IHdpdGggbnVtYmVyLCBidWZmZXIsIGFycmF5IG9yIHN0cmluZycpXG4gIH1cblxuICBpZiAodHlwZW9mIEFycmF5QnVmZmVyICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmIChvYmplY3QuYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgIHJldHVybiBmcm9tVHlwZWRBcnJheSh0aGF0LCBvYmplY3QpXG4gICAgfVxuICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgcmV0dXJuIGZyb21BcnJheUJ1ZmZlcih0aGF0LCBvYmplY3QpXG4gICAgfVxuICB9XG5cbiAgaWYgKG9iamVjdC5sZW5ndGgpIHJldHVybiBmcm9tQXJyYXlMaWtlKHRoYXQsIG9iamVjdClcblxuICByZXR1cm4gZnJvbUpzb25PYmplY3QodGhhdCwgb2JqZWN0KVxufVxuXG5mdW5jdGlvbiBmcm9tQnVmZmVyICh0aGF0LCBidWZmZXIpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYnVmZmVyLmxlbmd0aCkgfCAwXG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG4gIGJ1ZmZlci5jb3B5KHRoYXQsIDAsIDAsIGxlbmd0aClcbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5ICh0aGF0LCBhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuLy8gRHVwbGljYXRlIG9mIGZyb21BcnJheSgpIHRvIGtlZXAgZnJvbUFycmF5KCkgbW9ub21vcnBoaWMuXG5mdW5jdGlvbiBmcm9tVHlwZWRBcnJheSAodGhhdCwgYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcbiAgLy8gVHJ1bmNhdGluZyB0aGUgZWxlbWVudHMgaXMgcHJvYmFibHkgbm90IHdoYXQgcGVvcGxlIGV4cGVjdCBmcm9tIHR5cGVkXG4gIC8vIGFycmF5cyB3aXRoIEJZVEVTX1BFUl9FTEVNRU5UID4gMSBidXQgaXQncyBjb21wYXRpYmxlIHdpdGggdGhlIGJlaGF2aW9yXG4gIC8vIG9mIHRoZSBvbGQgQnVmZmVyIGNvbnN0cnVjdG9yLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5QnVmZmVyICh0aGF0LCBhcnJheSkge1xuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSwgZm9yIGJlc3QgcGVyZm9ybWFuY2VcbiAgICBhcnJheS5ieXRlTGVuZ3RoXG4gICAgdGhhdCA9IEJ1ZmZlci5fYXVnbWVudChuZXcgVWludDhBcnJheShhcnJheSkpXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBhbiBvYmplY3QgaW5zdGFuY2Ugb2YgdGhlIEJ1ZmZlciBjbGFzc1xuICAgIHRoYXQgPSBmcm9tVHlwZWRBcnJheSh0aGF0LCBuZXcgVWludDhBcnJheShhcnJheSkpXG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5TGlrZSAodGhhdCwgYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIHRoYXRbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbi8vIERlc2VyaWFsaXplIHsgdHlwZTogJ0J1ZmZlcicsIGRhdGE6IFsxLDIsMywuLi5dIH0gaW50byBhIEJ1ZmZlciBvYmplY3QuXG4vLyBSZXR1cm5zIGEgemVyby1sZW5ndGggYnVmZmVyIGZvciBpbnB1dHMgdGhhdCBkb24ndCBjb25mb3JtIHRvIHRoZSBzcGVjLlxuZnVuY3Rpb24gZnJvbUpzb25PYmplY3QgKHRoYXQsIG9iamVjdCkge1xuICB2YXIgYXJyYXlcbiAgdmFyIGxlbmd0aCA9IDBcblxuICBpZiAob2JqZWN0LnR5cGUgPT09ICdCdWZmZXInICYmIGlzQXJyYXkob2JqZWN0LmRhdGEpKSB7XG4gICAgYXJyYXkgPSBvYmplY3QuZGF0YVxuICAgIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgfVxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICB0aGF0W2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5pZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgQnVmZmVyLnByb3RvdHlwZS5fX3Byb3RvX18gPSBVaW50OEFycmF5LnByb3RvdHlwZVxuICBCdWZmZXIuX19wcm90b19fID0gVWludDhBcnJheVxufSBlbHNlIHtcbiAgLy8gcHJlLXNldCBmb3IgdmFsdWVzIHRoYXQgbWF5IGV4aXN0IGluIHRoZSBmdXR1cmVcbiAgQnVmZmVyLnByb3RvdHlwZS5sZW5ndGggPSB1bmRlZmluZWRcbiAgQnVmZmVyLnByb3RvdHlwZS5wYXJlbnQgPSB1bmRlZmluZWRcbn1cblxuZnVuY3Rpb24gYWxsb2NhdGUgKHRoYXQsIGxlbmd0aCkge1xuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSwgZm9yIGJlc3QgcGVyZm9ybWFuY2VcbiAgICB0aGF0ID0gQnVmZmVyLl9hdWdtZW50KG5ldyBVaW50OEFycmF5KGxlbmd0aCkpXG4gICAgdGhhdC5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBhbiBvYmplY3QgaW5zdGFuY2Ugb2YgdGhlIEJ1ZmZlciBjbGFzc1xuICAgIHRoYXQubGVuZ3RoID0gbGVuZ3RoXG4gICAgdGhhdC5faXNCdWZmZXIgPSB0cnVlXG4gIH1cblxuICB2YXIgZnJvbVBvb2wgPSBsZW5ndGggIT09IDAgJiYgbGVuZ3RoIDw9IEJ1ZmZlci5wb29sU2l6ZSA+Pj4gMVxuICBpZiAoZnJvbVBvb2wpIHRoYXQucGFyZW50ID0gcm9vdFBhcmVudFxuXG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGNoZWNrZWQgKGxlbmd0aCkge1xuICAvLyBOb3RlOiBjYW5ub3QgdXNlIGBsZW5ndGggPCBrTWF4TGVuZ3RoYCBoZXJlIGJlY2F1c2UgdGhhdCBmYWlscyB3aGVuXG4gIC8vIGxlbmd0aCBpcyBOYU4gKHdoaWNoIGlzIG90aGVyd2lzZSBjb2VyY2VkIHRvIHplcm8uKVxuICBpZiAobGVuZ3RoID49IGtNYXhMZW5ndGgoKSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIGFsbG9jYXRlIEJ1ZmZlciBsYXJnZXIgdGhhbiBtYXhpbXVtICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICdzaXplOiAweCcgKyBrTWF4TGVuZ3RoKCkudG9TdHJpbmcoMTYpICsgJyBieXRlcycpXG4gIH1cbiAgcmV0dXJuIGxlbmd0aCB8IDBcbn1cblxuZnVuY3Rpb24gU2xvd0J1ZmZlciAoc3ViamVjdCwgZW5jb2RpbmcpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFNsb3dCdWZmZXIpKSByZXR1cm4gbmV3IFNsb3dCdWZmZXIoc3ViamVjdCwgZW5jb2RpbmcpXG5cbiAgdmFyIGJ1ZiA9IG5ldyBCdWZmZXIoc3ViamVjdCwgZW5jb2RpbmcpXG4gIGRlbGV0ZSBidWYucGFyZW50XG4gIHJldHVybiBidWZcbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gaXNCdWZmZXIgKGIpIHtcbiAgcmV0dXJuICEhKGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlcilcbn1cblxuQnVmZmVyLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlIChhLCBiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGEpIHx8ICFCdWZmZXIuaXNCdWZmZXIoYikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgbXVzdCBiZSBCdWZmZXJzJylcbiAgfVxuXG4gIGlmIChhID09PSBiKSByZXR1cm4gMFxuXG4gIHZhciB4ID0gYS5sZW5ndGhcbiAgdmFyIHkgPSBiLmxlbmd0aFxuXG4gIHZhciBpID0gMFxuICB2YXIgbGVuID0gTWF0aC5taW4oeCwgeSlcbiAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkgYnJlYWtcblxuICAgICsraVxuICB9XG5cbiAgaWYgKGkgIT09IGxlbikge1xuICAgIHggPSBhW2ldXG4gICAgeSA9IGJbaV1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuQnVmZmVyLmlzRW5jb2RpbmcgPSBmdW5jdGlvbiBpc0VuY29kaW5nIChlbmNvZGluZykge1xuICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAncmF3JzpcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIGNvbmNhdCAobGlzdCwgbGVuZ3RoKSB7XG4gIGlmICghaXNBcnJheShsaXN0KSkgdGhyb3cgbmV3IFR5cGVFcnJvcignbGlzdCBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMuJylcblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcigwKVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmID0gbmV3IEJ1ZmZlcihsZW5ndGgpXG4gIHZhciBwb3MgPSAwXG4gIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBsaXN0W2ldXG4gICAgaXRlbS5jb3B5KGJ1ZiwgcG9zKVxuICAgIHBvcyArPSBpdGVtLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIHN0cmluZyAhPT0gJ3N0cmluZycpIHN0cmluZyA9ICcnICsgc3RyaW5nXG5cbiAgdmFyIGxlbiA9IHN0cmluZy5sZW5ndGhcbiAgaWYgKGxlbiA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBVc2UgYSBmb3IgbG9vcCB0byBhdm9pZCByZWN1cnNpb25cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAvLyBEZXByZWNhdGVkXG4gICAgICBjYXNlICdyYXcnOlxuICAgICAgY2FzZSAncmF3cyc6XG4gICAgICAgIHJldHVybiBsZW5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiBsZW4gKiAyXG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gbGVuID4+PiAxXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGggLy8gYXNzdW1lIHV0ZjhcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cbkJ1ZmZlci5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuXG5mdW5jdGlvbiBzbG93VG9TdHJpbmcgKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG5cbiAgc3RhcnQgPSBzdGFydCB8IDBcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgfHwgZW5kID09PSBJbmZpbml0eSA/IHRoaXMubGVuZ3RoIDogZW5kIHwgMFxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG4gIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmIChlbmQgPD0gc3RhcnQpIHJldHVybiAnJ1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGJpbmFyeVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdXRmMTZsZVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9IChlbmNvZGluZyArICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGggfCAwXG4gIGlmIChsZW5ndGggPT09IDApIHJldHVybiAnJ1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCAwLCBsZW5ndGgpXG4gIHJldHVybiBzbG93VG9TdHJpbmcuYXBwbHkodGhpcywgYXJndW1lbnRzKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIGVxdWFscyAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYikgPT09IDBcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gaW5zcGVjdCAoKSB7XG4gIHZhciBzdHIgPSAnJ1xuICB2YXIgbWF4ID0gZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFU1xuICBpZiAodGhpcy5sZW5ndGggPiAwKSB7XG4gICAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5tYXRjaCgvLnsyfS9nKS5qb2luKCcgJylcbiAgICBpZiAodGhpcy5sZW5ndGggPiBtYXgpIHN0ciArPSAnIC4uLiAnXG4gIH1cbiAgcmV0dXJuICc8QnVmZmVyICcgKyBzdHIgKyAnPidcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gMFxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYilcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gaW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0KSB7XG4gIGlmIChieXRlT2Zmc2V0ID4gMHg3ZmZmZmZmZikgYnl0ZU9mZnNldCA9IDB4N2ZmZmZmZmZcbiAgZWxzZSBpZiAoYnl0ZU9mZnNldCA8IC0weDgwMDAwMDAwKSBieXRlT2Zmc2V0ID0gLTB4ODAwMDAwMDBcbiAgYnl0ZU9mZnNldCA+Pj0gMFxuXG4gIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xXG4gIGlmIChieXRlT2Zmc2V0ID49IHRoaXMubGVuZ3RoKSByZXR1cm4gLTFcblxuICAvLyBOZWdhdGl2ZSBvZmZzZXRzIHN0YXJ0IGZyb20gdGhlIGVuZCBvZiB0aGUgYnVmZmVyXG4gIGlmIChieXRlT2Zmc2V0IDwgMCkgYnl0ZU9mZnNldCA9IE1hdGgubWF4KHRoaXMubGVuZ3RoICsgYnl0ZU9mZnNldCwgMClcblxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xIC8vIHNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nIGFsd2F5cyBmYWlsc1xuICAgIHJldHVybiBTdHJpbmcucHJvdG90eXBlLmluZGV4T2YuY2FsbCh0aGlzLCB2YWwsIGJ5dGVPZmZzZXQpXG4gIH1cbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcih2YWwpKSB7XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQpXG4gIH1cbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwodGhpcywgdmFsLCBieXRlT2Zmc2V0KVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKHRoaXMsIFsgdmFsIF0sIGJ5dGVPZmZzZXQpXG4gIH1cblxuICBmdW5jdGlvbiBhcnJheUluZGV4T2YgKGFyciwgdmFsLCBieXRlT2Zmc2V0KSB7XG4gICAgdmFyIGZvdW5kSW5kZXggPSAtMVxuICAgIGZvciAodmFyIGkgPSAwOyBieXRlT2Zmc2V0ICsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFycltieXRlT2Zmc2V0ICsgaV0gPT09IHZhbFtmb3VuZEluZGV4ID09PSAtMSA/IDAgOiBpIC0gZm91bmRJbmRleF0pIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggPT09IC0xKSBmb3VuZEluZGV4ID0gaVxuICAgICAgICBpZiAoaSAtIGZvdW5kSW5kZXggKyAxID09PSB2YWwubGVuZ3RoKSByZXR1cm4gYnl0ZU9mZnNldCArIGZvdW5kSW5kZXhcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvdW5kSW5kZXggPSAtMVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLTFcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbCBtdXN0IGJlIHN0cmluZywgbnVtYmVyIG9yIEJ1ZmZlcicpXG59XG5cbi8vIGBnZXRgIGlzIGRlcHJlY2F0ZWRcbkJ1ZmZlci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0IChvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5nZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLnJlYWRVSW50OChvZmZzZXQpXG59XG5cbi8vIGBzZXRgIGlzIGRlcHJlY2F0ZWRcbkJ1ZmZlci5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0ICh2LCBvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5zZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLndyaXRlVUludDgodiwgb2Zmc2V0KVxufVxuXG5mdW5jdGlvbiBoZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIC8vIG11c3QgYmUgYW4gZXZlbiBudW1iZXIgb2YgZGlnaXRzXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGlmIChzdHJMZW4gJSAyICE9PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaGV4IHN0cmluZycpXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHZhciBwYXJzZWQgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgaWYgKGlzTmFOKHBhcnNlZCkpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBoZXggc3RyaW5nJylcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSBwYXJzZWRcbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiB1dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBhc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYXNjaWlUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJpbmFyeVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGFzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGJhc2U2NFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gdWNzMldyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIHdyaXRlIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZykge1xuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nKVxuICBpZiAob2Zmc2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIG9mZnNldFssIGxlbmd0aF1bLCBlbmNvZGluZ10pXG4gIH0gZWxzZSBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgICBpZiAoaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgbGVuZ3RoID0gbGVuZ3RoIHwgMFxuICAgICAgaWYgKGVuY29kaW5nID09PSB1bmRlZmluZWQpIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgfSBlbHNlIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIC8vIGxlZ2FjeSB3cml0ZShzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXQsIGxlbmd0aCkgLSByZW1vdmUgaW4gdjAuMTNcbiAgfSBlbHNlIHtcbiAgICB2YXIgc3dhcCA9IGVuY29kaW5nXG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBvZmZzZXQgPSBsZW5ndGggfCAwXG4gICAgbGVuZ3RoID0gc3dhcFxuICB9XG5cbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPiByZW1haW5pbmcpIGxlbmd0aCA9IHJlbWFpbmluZ1xuXG4gIGlmICgoc3RyaW5nLmxlbmd0aCA+IDAgJiYgKGxlbmd0aCA8IDAgfHwgb2Zmc2V0IDwgMCkpIHx8IG9mZnNldCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2F0dGVtcHQgdG8gd3JpdGUgb3V0c2lkZSBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBiaW5hcnlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICAvLyBXYXJuaW5nOiBtYXhMZW5ndGggbm90IHRha2VuIGludG8gYWNjb3VudCBpbiBiYXNlNjRXcml0ZVxuICAgICAgICByZXR1cm4gYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHVjczJXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gYnVmLmxlbmd0aCkge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1Zi5zbGljZShzdGFydCwgZW5kKSlcbiAgfVxufVxuXG5mdW5jdGlvbiB1dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG4gIHZhciByZXMgPSBbXVxuXG4gIHZhciBpID0gc3RhcnRcbiAgd2hpbGUgKGkgPCBlbmQpIHtcbiAgICB2YXIgZmlyc3RCeXRlID0gYnVmW2ldXG4gICAgdmFyIGNvZGVQb2ludCA9IG51bGxcbiAgICB2YXIgYnl0ZXNQZXJTZXF1ZW5jZSA9IChmaXJzdEJ5dGUgPiAweEVGKSA/IDRcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4REYpID8gM1xuICAgICAgOiAoZmlyc3RCeXRlID4gMHhCRikgPyAyXG4gICAgICA6IDFcblxuICAgIGlmIChpICsgYnl0ZXNQZXJTZXF1ZW5jZSA8PSBlbmQpIHtcbiAgICAgIHZhciBzZWNvbmRCeXRlLCB0aGlyZEJ5dGUsIGZvdXJ0aEJ5dGUsIHRlbXBDb2RlUG9pbnRcblxuICAgICAgc3dpdGNoIChieXRlc1BlclNlcXVlbmNlKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBpZiAoZmlyc3RCeXRlIDwgMHg4MCkge1xuICAgICAgICAgICAgY29kZVBvaW50ID0gZmlyc3RCeXRlXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4MUYpIDw8IDB4NiB8IChzZWNvbmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3Rikge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweEMgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4NiB8ICh0aGlyZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGRiAmJiAodGVtcENvZGVQb2ludCA8IDB4RDgwMCB8fCB0ZW1wQ29kZVBvaW50ID4gMHhERkZGKSkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBmb3VydGhCeXRlID0gYnVmW2kgKyAzXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAoZm91cnRoQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHgxMiB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHhDIHwgKHRoaXJkQnl0ZSAmIDB4M0YpIDw8IDB4NiB8IChmb3VydGhCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHhGRkZGICYmIHRlbXBDb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb2RlUG9pbnQgPT09IG51bGwpIHtcbiAgICAgIC8vIHdlIGRpZCBub3QgZ2VuZXJhdGUgYSB2YWxpZCBjb2RlUG9pbnQgc28gaW5zZXJ0IGFcbiAgICAgIC8vIHJlcGxhY2VtZW50IGNoYXIgKFUrRkZGRCkgYW5kIGFkdmFuY2Ugb25seSAxIGJ5dGVcbiAgICAgIGNvZGVQb2ludCA9IDB4RkZGRFxuICAgICAgYnl0ZXNQZXJTZXF1ZW5jZSA9IDFcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA+IDB4RkZGRikge1xuICAgICAgLy8gZW5jb2RlIHRvIHV0ZjE2IChzdXJyb2dhdGUgcGFpciBkYW5jZSlcbiAgICAgIGNvZGVQb2ludCAtPSAweDEwMDAwXG4gICAgICByZXMucHVzaChjb2RlUG9pbnQgPj4+IDEwICYgMHgzRkYgfCAweEQ4MDApXG4gICAgICBjb2RlUG9pbnQgPSAweERDMDAgfCBjb2RlUG9pbnQgJiAweDNGRlxuICAgIH1cblxuICAgIHJlcy5wdXNoKGNvZGVQb2ludClcbiAgICBpICs9IGJ5dGVzUGVyU2VxdWVuY2VcbiAgfVxuXG4gIHJldHVybiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkocmVzKVxufVxuXG4vLyBCYXNlZCBvbiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMjc0NzI3Mi82ODA3NDIsIHRoZSBicm93c2VyIHdpdGhcbi8vIHRoZSBsb3dlc3QgbGltaXQgaXMgQ2hyb21lLCB3aXRoIDB4MTAwMDAgYXJncy5cbi8vIFdlIGdvIDEgbWFnbml0dWRlIGxlc3MsIGZvciBzYWZldHlcbnZhciBNQVhfQVJHVU1FTlRTX0xFTkdUSCA9IDB4MTAwMFxuXG5mdW5jdGlvbiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkgKGNvZGVQb2ludHMpIHtcbiAgdmFyIGxlbiA9IGNvZGVQb2ludHMubGVuZ3RoXG4gIGlmIChsZW4gPD0gTUFYX0FSR1VNRU5UU19MRU5HVEgpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNvZGVQb2ludHMpIC8vIGF2b2lkIGV4dHJhIHNsaWNlKClcbiAgfVxuXG4gIC8vIERlY29kZSBpbiBjaHVua3MgdG8gYXZvaWQgXCJjYWxsIHN0YWNrIHNpemUgZXhjZWVkZWRcIi5cbiAgdmFyIHJlcyA9ICcnXG4gIHZhciBpID0gMFxuICB3aGlsZSAoaSA8IGxlbikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFxuICAgICAgU3RyaW5nLFxuICAgICAgY29kZVBvaW50cy5zbGljZShpLCBpICs9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKVxuICAgIClcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldICYgMHg3RilcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGJpbmFyeVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGhleFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcblxuICBpZiAoIXN0YXJ0IHx8IHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmICghZW5kIHx8IGVuZCA8IDAgfHwgZW5kID4gbGVuKSBlbmQgPSBsZW5cblxuICB2YXIgb3V0ID0gJydcbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBvdXQgKz0gdG9IZXgoYnVmW2ldKVxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyBieXRlc1tpICsgMV0gKiAyNTYpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZlxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICBuZXdCdWYgPSBCdWZmZXIuX2F1Z21lbnQodGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSlcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2xpY2VMZW4gPSBlbmQgLSBzdGFydFxuICAgIG5ld0J1ZiA9IG5ldyBCdWZmZXIoc2xpY2VMZW4sIHVuZGVmaW5lZClcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWNlTGVuOyBpKyspIHtcbiAgICAgIG5ld0J1ZltpXSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfVxuXG4gIGlmIChuZXdCdWYubGVuZ3RoKSBuZXdCdWYucGFyZW50ID0gdGhpcy5wYXJlbnQgfHwgdGhpc1xuXG4gIHJldHVybiBuZXdCdWZcbn1cblxuLypcbiAqIE5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgYnVmZmVyIGlzbid0IHRyeWluZyB0byB3cml0ZSBvdXQgb2YgYm91bmRzLlxuICovXG5mdW5jdGlvbiBjaGVja09mZnNldCAob2Zmc2V0LCBleHQsIGxlbmd0aCkge1xuICBpZiAoKG9mZnNldCAlIDEpICE9PSAwIHx8IG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdvZmZzZXQgaXMgbm90IHVpbnQnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gbGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVHJ5aW5nIHRvIGFjY2VzcyBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRMRSA9IGZ1bmN0aW9uIHJlYWRVSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRCRSA9IGZ1bmN0aW9uIHJlYWRVSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG4gIH1cblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdXG4gIHZhciBtdWwgPSAxXG4gIHdoaWxlIChieXRlTGVuZ3RoID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiByZWFkVUludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiByZWFkVUludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgOCkgfCB0aGlzW29mZnNldCArIDFdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICgodGhpc1tvZmZzZXRdKSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikpICtcbiAgICAgICh0aGlzW29mZnNldCArIDNdICogMHgxMDAwMDAwKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdICogMHgxMDAwMDAwKSArXG4gICAgKCh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgIHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludExFID0gZnVuY3Rpb24gcmVhZEludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludEJFID0gZnVuY3Rpb24gcmVhZEludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoXG4gIHZhciBtdWwgPSAxXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0taV1cbiAgd2hpbGUgKGkgPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1pXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiByZWFkSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICBpZiAoISh0aGlzW29mZnNldF0gJiAweDgwKSkgcmV0dXJuICh0aGlzW29mZnNldF0pXG4gIHJldHVybiAoKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gcmVhZEludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIDFdIHwgKHRoaXNbb2Zmc2V0XSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbiByZWFkSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdKSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10gPDwgMjQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiByZWFkSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDI0KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiByZWFkRmxvYXRMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0QkUgPSBmdW5jdGlvbiByZWFkRmxvYXRCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gcmVhZERvdWJsZUJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgNTIsIDgpXG59XG5cbmZ1bmN0aW9uIGNoZWNrSW50IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignYnVmZmVyIG11c3QgYmUgYSBCdWZmZXIgaW5zdGFuY2UnKVxuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCd2YWx1ZSBpcyBvdXQgb2YgYm91bmRzJylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdpbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludExFID0gZnVuY3Rpb24gd3JpdGVVSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSwgMClcblxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludEJFID0gZnVuY3Rpb24gd3JpdGVVSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSwgMClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiB3cml0ZVVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4ZmYsIDApXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHZhbHVlID0gTWF0aC5mbG9vcih2YWx1ZSlcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuZnVuY3Rpb24gb2JqZWN0V3JpdGVVSW50MTYgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuKSB7XG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmICsgdmFsdWUgKyAxXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4oYnVmLmxlbmd0aCAtIG9mZnNldCwgMik7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSAodmFsdWUgJiAoMHhmZiA8PCAoOCAqIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpKSkpID4+PlxuICAgICAgKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkgKiA4XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuZnVuY3Rpb24gb2JqZWN0V3JpdGVVSW50MzIgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuKSB7XG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGJ1Zi5sZW5ndGggLSBvZmZzZXQsIDQpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID0gKHZhbHVlID4+PiAobGl0dGxlRW5kaWFuID8gaSA6IDMgLSBpKSAqIDgpICYgMHhmZlxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludExFID0gZnVuY3Rpb24gd3JpdGVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGggLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IDBcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IHZhbHVlIDwgMCA/IDEgOiAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gdmFsdWUgPCAwID8gMSA6IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uIHdyaXRlSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweDdmLCAtMHg4MClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkgdmFsdWUgPSBNYXRoLmZsb29yKHZhbHVlKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuZnVuY3Rpb24gY2hlY2tJRUVFNzU0IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndmFsdWUgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdpbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5mdW5jdGlvbiB3cml0ZUZsb2F0IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDQsIDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgsIC0zLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gd3JpdGVGbG9hdEJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDgsIDEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4LCAtMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG4gIHJldHVybiBvZmZzZXQgKyA4XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVMRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUJFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuLy8gY29weSh0YXJnZXRCdWZmZXIsIHRhcmdldFN0YXJ0PTAsIHNvdXJjZVN0YXJ0PTAsIHNvdXJjZUVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gY29weSAodGFyZ2V0LCB0YXJnZXRTdGFydCwgc3RhcnQsIGVuZCkge1xuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0U3RhcnQgPj0gdGFyZ2V0Lmxlbmd0aCkgdGFyZ2V0U3RhcnQgPSB0YXJnZXQubGVuZ3RoXG4gIGlmICghdGFyZ2V0U3RhcnQpIHRhcmdldFN0YXJ0ID0gMFxuICBpZiAoZW5kID4gMCAmJiBlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICAvLyBDb3B5IDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVybiAwXG4gIGlmICh0YXJnZXQubGVuZ3RoID09PSAwIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIEZhdGFsIGVycm9yIGNvbmRpdGlvbnNcbiAgaWYgKHRhcmdldFN0YXJ0IDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgfVxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlU3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChlbmQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlRW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIC8vIEFyZSB3ZSBvb2I/XG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCA8IGVuZCAtIHN0YXJ0KSB7XG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0ICsgc3RhcnRcbiAgfVxuXG4gIHZhciBsZW4gPSBlbmQgLSBzdGFydFxuICB2YXIgaVxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQgJiYgc3RhcnQgPCB0YXJnZXRTdGFydCAmJiB0YXJnZXRTdGFydCA8IGVuZCkge1xuICAgIC8vIGRlc2NlbmRpbmcgY29weSBmcm9tIGVuZFxuICAgIGZvciAoaSA9IGxlbiAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIGlmIChsZW4gPCAxMDAwIHx8ICFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIC8vIGFzY2VuZGluZyBjb3B5IGZyb20gc3RhcnRcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0U3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRhcmdldC5fc2V0KHRoaXMuc3ViYXJyYXkoc3RhcnQsIHN0YXJ0ICsgbGVuKSwgdGFyZ2V0U3RhcnQpXG4gIH1cblxuICByZXR1cm4gbGVuXG59XG5cbi8vIGZpbGwodmFsdWUsIHN0YXJ0PTAsIGVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gZmlsbCAodmFsdWUsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCF2YWx1ZSkgdmFsdWUgPSAwXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCkgZW5kID0gdGhpcy5sZW5ndGhcblxuICBpZiAoZW5kIDwgc3RhcnQpIHRocm93IG5ldyBSYW5nZUVycm9yKCdlbmQgPCBzdGFydCcpXG5cbiAgLy8gRmlsbCAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm5cbiAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChlbmQgPCAwIHx8IGVuZCA+IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignZW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIHZhciBpXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgdGhpc1tpXSA9IHZhbHVlXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBieXRlcyA9IHV0ZjhUb0J5dGVzKHZhbHVlLnRvU3RyaW5nKCkpXG4gICAgdmFyIGxlbiA9IGJ5dGVzLmxlbmd0aFxuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIHRoaXNbaV0gPSBieXRlc1tpICUgbGVuXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBgQXJyYXlCdWZmZXJgIHdpdGggdGhlICpjb3BpZWQqIG1lbW9yeSBvZiB0aGUgYnVmZmVyIGluc3RhbmNlLlxuICogQWRkZWQgaW4gTm9kZSAwLjEyLiBPbmx5IGF2YWlsYWJsZSBpbiBicm93c2VycyB0aGF0IHN1cHBvcnQgQXJyYXlCdWZmZXIuXG4gKi9cbkJ1ZmZlci5wcm90b3R5cGUudG9BcnJheUJ1ZmZlciA9IGZ1bmN0aW9uIHRvQXJyYXlCdWZmZXIgKCkge1xuICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgICByZXR1cm4gKG5ldyBCdWZmZXIodGhpcykpLmJ1ZmZlclxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5sZW5ndGgpXG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYnVmLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgIGJ1ZltpXSA9IHRoaXNbaV1cbiAgICAgIH1cbiAgICAgIHJldHVybiBidWYuYnVmZmVyXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0J1ZmZlci50b0FycmF5QnVmZmVyIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyJylcbiAgfVxufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbnZhciBCUCA9IEJ1ZmZlci5wcm90b3R5cGVcblxuLyoqXG4gKiBBdWdtZW50IGEgVWludDhBcnJheSAqaW5zdGFuY2UqIChub3QgdGhlIFVpbnQ4QXJyYXkgY2xhc3MhKSB3aXRoIEJ1ZmZlciBtZXRob2RzXG4gKi9cbkJ1ZmZlci5fYXVnbWVudCA9IGZ1bmN0aW9uIF9hdWdtZW50IChhcnIpIHtcbiAgYXJyLmNvbnN0cnVjdG9yID0gQnVmZmVyXG4gIGFyci5faXNCdWZmZXIgPSB0cnVlXG5cbiAgLy8gc2F2ZSByZWZlcmVuY2UgdG8gb3JpZ2luYWwgVWludDhBcnJheSBzZXQgbWV0aG9kIGJlZm9yZSBvdmVyd3JpdGluZ1xuICBhcnIuX3NldCA9IGFyci5zZXRcblxuICAvLyBkZXByZWNhdGVkXG4gIGFyci5nZXQgPSBCUC5nZXRcbiAgYXJyLnNldCA9IEJQLnNldFxuXG4gIGFyci53cml0ZSA9IEJQLndyaXRlXG4gIGFyci50b1N0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0xvY2FsZVN0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0pTT04gPSBCUC50b0pTT05cbiAgYXJyLmVxdWFscyA9IEJQLmVxdWFsc1xuICBhcnIuY29tcGFyZSA9IEJQLmNvbXBhcmVcbiAgYXJyLmluZGV4T2YgPSBCUC5pbmRleE9mXG4gIGFyci5jb3B5ID0gQlAuY29weVxuICBhcnIuc2xpY2UgPSBCUC5zbGljZVxuICBhcnIucmVhZFVJbnRMRSA9IEJQLnJlYWRVSW50TEVcbiAgYXJyLnJlYWRVSW50QkUgPSBCUC5yZWFkVUludEJFXG4gIGFyci5yZWFkVUludDggPSBCUC5yZWFkVUludDhcbiAgYXJyLnJlYWRVSW50MTZMRSA9IEJQLnJlYWRVSW50MTZMRVxuICBhcnIucmVhZFVJbnQxNkJFID0gQlAucmVhZFVJbnQxNkJFXG4gIGFyci5yZWFkVUludDMyTEUgPSBCUC5yZWFkVUludDMyTEVcbiAgYXJyLnJlYWRVSW50MzJCRSA9IEJQLnJlYWRVSW50MzJCRVxuICBhcnIucmVhZEludExFID0gQlAucmVhZEludExFXG4gIGFyci5yZWFkSW50QkUgPSBCUC5yZWFkSW50QkVcbiAgYXJyLnJlYWRJbnQ4ID0gQlAucmVhZEludDhcbiAgYXJyLnJlYWRJbnQxNkxFID0gQlAucmVhZEludDE2TEVcbiAgYXJyLnJlYWRJbnQxNkJFID0gQlAucmVhZEludDE2QkVcbiAgYXJyLnJlYWRJbnQzMkxFID0gQlAucmVhZEludDMyTEVcbiAgYXJyLnJlYWRJbnQzMkJFID0gQlAucmVhZEludDMyQkVcbiAgYXJyLnJlYWRGbG9hdExFID0gQlAucmVhZEZsb2F0TEVcbiAgYXJyLnJlYWRGbG9hdEJFID0gQlAucmVhZEZsb2F0QkVcbiAgYXJyLnJlYWREb3VibGVMRSA9IEJQLnJlYWREb3VibGVMRVxuICBhcnIucmVhZERvdWJsZUJFID0gQlAucmVhZERvdWJsZUJFXG4gIGFyci53cml0ZVVJbnQ4ID0gQlAud3JpdGVVSW50OFxuICBhcnIud3JpdGVVSW50TEUgPSBCUC53cml0ZVVJbnRMRVxuICBhcnIud3JpdGVVSW50QkUgPSBCUC53cml0ZVVJbnRCRVxuICBhcnIud3JpdGVVSW50MTZMRSA9IEJQLndyaXRlVUludDE2TEVcbiAgYXJyLndyaXRlVUludDE2QkUgPSBCUC53cml0ZVVJbnQxNkJFXG4gIGFyci53cml0ZVVJbnQzMkxFID0gQlAud3JpdGVVSW50MzJMRVxuICBhcnIud3JpdGVVSW50MzJCRSA9IEJQLndyaXRlVUludDMyQkVcbiAgYXJyLndyaXRlSW50TEUgPSBCUC53cml0ZUludExFXG4gIGFyci53cml0ZUludEJFID0gQlAud3JpdGVJbnRCRVxuICBhcnIud3JpdGVJbnQ4ID0gQlAud3JpdGVJbnQ4XG4gIGFyci53cml0ZUludDE2TEUgPSBCUC53cml0ZUludDE2TEVcbiAgYXJyLndyaXRlSW50MTZCRSA9IEJQLndyaXRlSW50MTZCRVxuICBhcnIud3JpdGVJbnQzMkxFID0gQlAud3JpdGVJbnQzMkxFXG4gIGFyci53cml0ZUludDMyQkUgPSBCUC53cml0ZUludDMyQkVcbiAgYXJyLndyaXRlRmxvYXRMRSA9IEJQLndyaXRlRmxvYXRMRVxuICBhcnIud3JpdGVGbG9hdEJFID0gQlAud3JpdGVGbG9hdEJFXG4gIGFyci53cml0ZURvdWJsZUxFID0gQlAud3JpdGVEb3VibGVMRVxuICBhcnIud3JpdGVEb3VibGVCRSA9IEJQLndyaXRlRG91YmxlQkVcbiAgYXJyLmZpbGwgPSBCUC5maWxsXG4gIGFyci5pbnNwZWN0ID0gQlAuaW5zcGVjdFxuICBhcnIudG9BcnJheUJ1ZmZlciA9IEJQLnRvQXJyYXlCdWZmZXJcblxuICByZXR1cm4gYXJyXG59XG5cbnZhciBJTlZBTElEX0JBU0U2NF9SRSA9IC9bXitcXC8wLTlBLVphLXotX10vZ1xuXG5mdW5jdGlvbiBiYXNlNjRjbGVhbiAoc3RyKSB7XG4gIC8vIE5vZGUgc3RyaXBzIG91dCBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSBcXG4gYW5kIFxcdCBmcm9tIHRoZSBzdHJpbmcsIGJhc2U2NC1qcyBkb2VzIG5vdFxuICBzdHIgPSBzdHJpbmd0cmltKHN0cikucmVwbGFjZShJTlZBTElEX0JBU0U2NF9SRSwgJycpXG4gIC8vIE5vZGUgY29udmVydHMgc3RyaW5ncyB3aXRoIGxlbmd0aCA8IDIgdG8gJydcbiAgaWYgKHN0ci5sZW5ndGggPCAyKSByZXR1cm4gJydcbiAgLy8gTm9kZSBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgYmFzZTY0IHN0cmluZ3MgKG1pc3NpbmcgdHJhaWxpbmcgPT09KSwgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHdoaWxlIChzdHIubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgIHN0ciA9IHN0ciArICc9J1xuICB9XG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gc3RyaW5ndHJpbSAoc3RyKSB7XG4gIGlmIChzdHIudHJpbSkgcmV0dXJuIHN0ci50cmltKClcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJylcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyaW5nLCB1bml0cykge1xuICB1bml0cyA9IHVuaXRzIHx8IEluZmluaXR5XG4gIHZhciBjb2RlUG9pbnRcbiAgdmFyIGxlbmd0aCA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIGxlYWRTdXJyb2dhdGUgPSBudWxsXG4gIHZhciBieXRlcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGNvZGVQb2ludCA9IHN0cmluZy5jaGFyQ29kZUF0KGkpXG5cbiAgICAvLyBpcyBzdXJyb2dhdGUgY29tcG9uZW50XG4gICAgaWYgKGNvZGVQb2ludCA+IDB4RDdGRiAmJiBjb2RlUG9pbnQgPCAweEUwMDApIHtcbiAgICAgIC8vIGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoIWxlYWRTdXJyb2dhdGUpIHtcbiAgICAgICAgLy8gbm8gbGVhZCB5ZXRcbiAgICAgICAgaWYgKGNvZGVQb2ludCA+IDB4REJGRikge1xuICAgICAgICAgIC8vIHVuZXhwZWN0ZWQgdHJhaWxcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKGkgKyAxID09PSBsZW5ndGgpIHtcbiAgICAgICAgICAvLyB1bnBhaXJlZCBsZWFkXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhbGlkIGxlYWRcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIDIgbGVhZHMgaW4gYSByb3dcbiAgICAgIGlmIChjb2RlUG9pbnQgPCAweERDMDApIHtcbiAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gdmFsaWQgc3Vycm9nYXRlIHBhaXJcbiAgICAgIGNvZGVQb2ludCA9IChsZWFkU3Vycm9nYXRlIC0gMHhEODAwIDw8IDEwIHwgY29kZVBvaW50IC0gMHhEQzAwKSArIDB4MTAwMDBcbiAgICB9IGVsc2UgaWYgKGxlYWRTdXJyb2dhdGUpIHtcbiAgICAgIC8vIHZhbGlkIGJtcCBjaGFyLCBidXQgbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgIH1cblxuICAgIGxlYWRTdXJyb2dhdGUgPSBudWxsXG5cbiAgICAvLyBlbmNvZGUgdXRmOFxuICAgIGlmIChjb2RlUG9pbnQgPCAweDgwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDEpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goY29kZVBvaW50KVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHg4MDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiB8IDB4QzAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDMpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgfCAweEUwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSA0KSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHgxMiB8IDB4RjAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29kZSBwb2ludCcpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIC8vIE5vZGUncyBjb2RlIHNlZW1zIHRvIGJlIGRvaW5nIHRoaXMgYW5kIG5vdCAmIDB4N0YuLlxuICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpICYgMHhGRilcbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVUb0J5dGVzIChzdHIsIHVuaXRzKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG5cbiAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBoaSA9IGMgPj4gOFxuICAgIGxvID0gYyAlIDI1NlxuICAgIGJ5dGVBcnJheS5wdXNoKGxvKVxuICAgIGJ5dGVBcnJheS5wdXNoKGhpKVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBiYXNlNjRUb0J5dGVzIChzdHIpIHtcbiAgcmV0dXJuIGJhc2U2NC50b0J5dGVBcnJheShiYXNlNjRjbGVhbihzdHIpKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSkgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuIiwidmFyIGxvb2t1cCA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJztcblxuOyhmdW5jdGlvbiAoZXhwb3J0cykge1xuXHQndXNlIHN0cmljdCc7XG5cbiAgdmFyIEFyciA9ICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgPyBVaW50OEFycmF5XG4gICAgOiBBcnJheVxuXG5cdHZhciBQTFVTICAgPSAnKycuY2hhckNvZGVBdCgwKVxuXHR2YXIgU0xBU0ggID0gJy8nLmNoYXJDb2RlQXQoMClcblx0dmFyIE5VTUJFUiA9ICcwJy5jaGFyQ29kZUF0KDApXG5cdHZhciBMT1dFUiAgPSAnYScuY2hhckNvZGVBdCgwKVxuXHR2YXIgVVBQRVIgID0gJ0EnLmNoYXJDb2RlQXQoMClcblx0dmFyIFBMVVNfVVJMX1NBRkUgPSAnLScuY2hhckNvZGVBdCgwKVxuXHR2YXIgU0xBU0hfVVJMX1NBRkUgPSAnXycuY2hhckNvZGVBdCgwKVxuXG5cdGZ1bmN0aW9uIGRlY29kZSAoZWx0KSB7XG5cdFx0dmFyIGNvZGUgPSBlbHQuY2hhckNvZGVBdCgwKVxuXHRcdGlmIChjb2RlID09PSBQTFVTIHx8XG5cdFx0ICAgIGNvZGUgPT09IFBMVVNfVVJMX1NBRkUpXG5cdFx0XHRyZXR1cm4gNjIgLy8gJysnXG5cdFx0aWYgKGNvZGUgPT09IFNMQVNIIHx8XG5cdFx0ICAgIGNvZGUgPT09IFNMQVNIX1VSTF9TQUZFKVxuXHRcdFx0cmV0dXJuIDYzIC8vICcvJ1xuXHRcdGlmIChjb2RlIDwgTlVNQkVSKVxuXHRcdFx0cmV0dXJuIC0xIC8vbm8gbWF0Y2hcblx0XHRpZiAoY29kZSA8IE5VTUJFUiArIDEwKVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBOVU1CRVIgKyAyNiArIDI2XG5cdFx0aWYgKGNvZGUgPCBVUFBFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBVUFBFUlxuXHRcdGlmIChjb2RlIDwgTE9XRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gTE9XRVIgKyAyNlxuXHR9XG5cblx0ZnVuY3Rpb24gYjY0VG9CeXRlQXJyYXkgKGI2NCkge1xuXHRcdHZhciBpLCBqLCBsLCB0bXAsIHBsYWNlSG9sZGVycywgYXJyXG5cblx0XHRpZiAoYjY0Lmxlbmd0aCAlIDQgPiAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuXHRcdH1cblxuXHRcdC8vIHRoZSBudW1iZXIgb2YgZXF1YWwgc2lnbnMgKHBsYWNlIGhvbGRlcnMpXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHR3byBwbGFjZWhvbGRlcnMsIHRoYW4gdGhlIHR3byBjaGFyYWN0ZXJzIGJlZm9yZSBpdFxuXHRcdC8vIHJlcHJlc2VudCBvbmUgYnl0ZVxuXHRcdC8vIGlmIHRoZXJlIGlzIG9ubHkgb25lLCB0aGVuIHRoZSB0aHJlZSBjaGFyYWN0ZXJzIGJlZm9yZSBpdCByZXByZXNlbnQgMiBieXRlc1xuXHRcdC8vIHRoaXMgaXMganVzdCBhIGNoZWFwIGhhY2sgdG8gbm90IGRvIGluZGV4T2YgdHdpY2Vcblx0XHR2YXIgbGVuID0gYjY0Lmxlbmd0aFxuXHRcdHBsYWNlSG9sZGVycyA9ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAyKSA/IDIgOiAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMSkgPyAxIDogMFxuXG5cdFx0Ly8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5cdFx0YXJyID0gbmV3IEFycihiNjQubGVuZ3RoICogMyAvIDQgLSBwbGFjZUhvbGRlcnMpXG5cblx0XHQvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG5cdFx0bCA9IHBsYWNlSG9sZGVycyA+IDAgPyBiNjQubGVuZ3RoIC0gNCA6IGI2NC5sZW5ndGhcblxuXHRcdHZhciBMID0gMFxuXG5cdFx0ZnVuY3Rpb24gcHVzaCAodikge1xuXHRcdFx0YXJyW0wrK10gPSB2XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gMCwgaiA9IDA7IGkgPCBsOyBpICs9IDQsIGogKz0gMykge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxOCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCAxMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA8PCA2KSB8IGRlY29kZShiNjQuY2hhckF0KGkgKyAzKSlcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMDAwKSA+PiAxNilcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMCkgPj4gOClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRpZiAocGxhY2VIb2xkZXJzID09PSAyKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPj4gNClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9IGVsc2UgaWYgKHBsYWNlSG9sZGVycyA9PT0gMSkge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxMCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCA0KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpID4+IDIpXG5cdFx0XHRwdXNoKCh0bXAgPj4gOCkgJiAweEZGKVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdHJldHVybiBhcnJcblx0fVxuXG5cdGZ1bmN0aW9uIHVpbnQ4VG9CYXNlNjQgKHVpbnQ4KSB7XG5cdFx0dmFyIGksXG5cdFx0XHRleHRyYUJ5dGVzID0gdWludDgubGVuZ3RoICUgMywgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcblx0XHRcdG91dHB1dCA9IFwiXCIsXG5cdFx0XHR0ZW1wLCBsZW5ndGhcblxuXHRcdGZ1bmN0aW9uIGVuY29kZSAobnVtKSB7XG5cdFx0XHRyZXR1cm4gbG9va3VwLmNoYXJBdChudW0pXG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcblx0XHRcdHJldHVybiBlbmNvZGUobnVtID4+IDE4ICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDEyICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDYgJiAweDNGKSArIGVuY29kZShudW0gJiAweDNGKVxuXHRcdH1cblxuXHRcdC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcblx0XHRmb3IgKGkgPSAwLCBsZW5ndGggPSB1aW50OC5sZW5ndGggLSBleHRyYUJ5dGVzOyBpIDwgbGVuZ3RoOyBpICs9IDMpIHtcblx0XHRcdHRlbXAgPSAodWludDhbaV0gPDwgMTYpICsgKHVpbnQ4W2kgKyAxXSA8PCA4KSArICh1aW50OFtpICsgMl0pXG5cdFx0XHRvdXRwdXQgKz0gdHJpcGxldFRvQmFzZTY0KHRlbXApXG5cdFx0fVxuXG5cdFx0Ly8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuXHRcdHN3aXRjaCAoZXh0cmFCeXRlcykge1xuXHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHR0ZW1wID0gdWludDhbdWludDgubGVuZ3RoIC0gMV1cblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDIpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz09J1xuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSAyOlxuXHRcdFx0XHR0ZW1wID0gKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDJdIDw8IDgpICsgKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMTApXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPj4gNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDIpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9J1xuXHRcdFx0XHRicmVha1xuXHRcdH1cblxuXHRcdHJldHVybiBvdXRwdXRcblx0fVxuXG5cdGV4cG9ydHMudG9CeXRlQXJyYXkgPSBiNjRUb0J5dGVBcnJheVxuXHRleHBvcnRzLmZyb21CeXRlQXJyYXkgPSB1aW50OFRvQmFzZTY0XG59KHR5cGVvZiBleHBvcnRzID09PSAndW5kZWZpbmVkJyA/ICh0aGlzLmJhc2U2NGpzID0ge30pIDogZXhwb3J0cykpXG4iLCJleHBvcnRzLnJlYWQgPSBmdW5jdGlvbiAoYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbVxuICB2YXIgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIG5CaXRzID0gLTdcbiAgdmFyIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMFxuICB2YXIgZCA9IGlzTEUgPyAtMSA6IDFcbiAgdmFyIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV1cblxuICBpICs9IGRcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBzID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBlTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSBlICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgZSA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gbUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gbSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhc1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSlcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pXG4gICAgZSA9IGUgLSBlQmlhc1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pXG59XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbiAoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGNcbiAgdmFyIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMClcbiAgdmFyIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKVxuICB2YXIgZCA9IGlzTEUgPyAxIDogLTFcbiAgdmFyIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDBcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKVxuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwXG4gICAgZSA9IGVNYXhcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMilcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS1cbiAgICAgIGMgKj0gMlxuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gY1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcylcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKytcbiAgICAgIGMgLz0gMlxuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDBcbiAgICAgIGUgPSBlTWF4XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICh2YWx1ZSAqIGMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gZSArIGVCaWFzXG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IDBcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KSB7fVxuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG1cbiAgZUxlbiArPSBtTGVuXG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCkge31cblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjhcbn1cbiIsInZhciB0b1N0cmluZyA9IHt9LnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKGFycikge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChhcnIpID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBSZWZsdXguY3JlYXRlQWN0aW9ucyhcbiAgW1wiZ2V0Q291cnNlSW5mb1wiXVxuKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZUFjdGlvbnMoXG4gIFtcImNyZWF0ZVRvYXN0XCJdXG4pOyIsIm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZUFjdGlvbnMoXG4gIFtcbiAgXCJ1cGRhdGVDb3Vyc2VzXCIsXG4gIFwidXBkYXRlUHJlZmVyZW5jZXNcIixcbiAgXCJsb2FkUHJlc2V0VGltZXRhYmxlXCIsXG4gIFwic2V0U2Nob29sXCIsXG4gIFwic2V0Q291cnNlc0xvYWRpbmdcIixcbiAgXCJzZXRDb3Vyc2VzRG9uZUxvYWRpbmdcIixcbiAgXCJzZXRDdXJyZW50SW5kZXhcIixcbiAgXVxuKTtcbiIsInZhciBSb290ID0gcmVxdWlyZSgnLi9yb290Jyk7XG52YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcycpO1xuX1NFTUVTVEVSID0gXCJTXCI7XG5cbnZhciBkYXRhID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnN1YnN0cmluZygxKTsgLy8gbG9hZGluZyB0aW1ldGFibGUgZGF0YSBmcm9tIHVybFxuaWYgKCFkYXRhICYmIHR5cGVvZihTdG9yYWdlKSAhPT0gXCJ1bmRlZmluZWRcIikgeyAvLyBkaWRuJ3QgZmluZCBpbiBVUkwsIHRyeSBsb2NhbCBzdG9yYWdlXG4gICAgZGF0YSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdkYXRhJyk7XG59IFxuXG5SZWFjdERPTS5yZW5kZXIoXG4gIDxSb290IGRhdGE9e2RhdGF9Lz4sXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlJylcbik7XG5cblxuXG5cbmlmIChkYXRhKSB7XG5cdFRpbWV0YWJsZUFjdGlvbnMubG9hZFByZXNldFRpbWV0YWJsZShkYXRhKTtcbn1cbiIsInZhciBTZWFyY2hCYXIgPSByZXF1aXJlKCcuL3NlYXJjaF9iYXInKTtcbnZhciBQcmVmZXJlbmNlTWVudSA9IHJlcXVpcmUoJy4vcHJlZmVyZW5jZV9tZW51Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJjb250cm9sLWJhclwiPlxuICAgICAgICA8ZGl2IGlkPVwic2VhcmNoLWJhci1jb250YWluZXJcIj5cbiAgICAgICAgICA8U2VhcmNoQmFyIHRvZ2dsZU1vZGFsPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsfSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPFByZWZlcmVuY2VNZW51IC8+XG4gICAgICA8L2Rpdj5cblxuICAgICk7XG4gIH0sXG59KTtcbiIsInZhciBFdmFsdWF0aW9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjbGFzc2VzID0gdGhpcy5wcm9wcy5zZWxlY3RlZCA/IFwiZXZhbC1pdGVtIHNlbGVjdGVkXCIgOiBcImV2YWwtaXRlbVwiXG5cdFx0dmFyIGRldGFpbHMgPSAhdGhpcy5wcm9wcy5zZWxlY3RlZCA/IG51bGwgOiAoXG5cdFx0XHQ8ZGl2IGlkPVwiZGV0YWlsc1wiPnt0aGlzLnByb3BzLmV2YWxfZGF0YS5zdW1tYXJ5LnJlcGxhY2UoL1xcdTAwYTAvZywgXCIgXCIpfTwvZGl2PlxuXHRcdFx0KVxuXHRcdHZhciBwcm9mID0gIXRoaXMucHJvcHMuc2VsZWN0ZWQgPyBudWxsIDogKFxuXHRcdFx0PGRpdiBpZD1cInByb2ZcIj5Qcm9mZXNzb3I6IHt0aGlzLnByb3BzLmV2YWxfZGF0YS5wcm9mZXNzb3J9PC9kaXY+XG5cdFx0XHQpXG5cdFx0cmV0dXJuIChcblx0XHQ8ZGl2IGNsYXNzTmFtZT17Y2xhc3Nlc30gb25DbGljaz17dGhpcy5wcm9wcy5zZWxlY3Rpb25DYWxsYmFja30gPlxuXHRcdFx0PGRpdiBpZD1cImV2YWwtd3JhcHBlclwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInllYXJcIj57dGhpcy5wcm9wcy5ldmFsX2RhdGEueWVhcn08L2Rpdj5cblx0XHRcdFx0e3Byb2Z9XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicmF0aW5nLXdyYXBwZXJcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInN0YXItcmF0aW5ncy1zcHJpdGVcIj5cblx0XHRcdFx0XHRcdDxzcGFuIHN0eWxlPXt7d2lkdGg6IDEwMCp0aGlzLnByb3BzLmV2YWxfZGF0YS5zY29yZS81ICsgXCIlXCJ9fSBjbGFzc05hbWU9XCJyYXRpbmdcIj48L3NwYW4+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJudW1lcmljLXJhdGluZ1wiPntcIihcIiArIHRoaXMucHJvcHMuZXZhbF9kYXRhLnNjb3JlICsgXCIpXCJ9PC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0XHR7ZGV0YWlsc31cblx0XHQ8L2Rpdj4pO1xuXHR9LFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0aW5kZXhfc2VsZWN0ZWQ6IG51bGxcblx0XHR9O1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGkgPSAwO1xuXHRcdHZhciBldmFscyA9IHRoaXMucHJvcHMuZXZhbF9pbmZvLm1hcChmdW5jdGlvbihlKSB7XG5cdFx0XHRpKys7XG5cdFx0XHR2YXIgc2VsZWN0ZWQgPSBpID09IHRoaXMuc3RhdGUuaW5kZXhfc2VsZWN0ZWQ7XG5cdFx0XHRyZXR1cm4gKDxFdmFsdWF0aW9uIGV2YWxfZGF0YT17ZX0ga2V5PXtlLmlkfSBzZWxlY3Rpb25DYWxsYmFjaz17dGhpcy5jaGFuZ2VTZWxlY3RlZChpKX0gc2VsZWN0ZWQ9e3NlbGVjdGVkfSAvPik7XG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0XHR2YXIgY2xpY2tfbm90aWNlID0gdGhpcy5wcm9wcy5ldmFsX2luZm8ubGVuZ3RoID09IDAgPyAoPGRpdiBpZD1cImVtcHR5LWludHJvXCI+Tm8gY291cnNlIGV2YWx1YXRpb25zIGZvciB0aGlzIGNvdXJzZSB5ZXQuPC9kaXY+KSBcblx0XHQ6ICg8ZGl2IGlkPVwiY2xpY2staW50cm9cIj5DbGljayBhbiBldmFsdWF0aW9uIGl0ZW0gYWJvdmUgdG8gcmVhZCB0aGUgY29tbWVudHMuPC9kaXY+KTtcblx0XHRyZXR1cm4gKFxuXHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZW50cnlcIiBpZD1cImNvdXJzZS1ldmFsdWF0aW9uc1wiPlxuXHRcdFx0PGg2PkNvdXJzZSBFdmFsdWF0aW9uczo8L2g2PlxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJldmFsLXdyYXBwZXJcIj5cblx0XHRcdFx0e2V2YWxzfVxuXHRcdFx0PC9kaXY+XG5cdFx0XHR7Y2xpY2tfbm90aWNlfVxuXHRcdDwvZGl2Pik7XG5cdH0sXG5cblx0Y2hhbmdlU2VsZWN0ZWQ6IGZ1bmN0aW9uKGVfaW5kZXgpIHtcblx0XHRyZXR1cm4gKGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKHRoaXMuc3RhdGUuaW5kZXhfc2VsZWN0ZWQgPT0gZV9pbmRleCkgXG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe2luZGV4X3NlbGVjdGVkOiBudWxsfSk7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe2luZGV4X3NlbGVjdGVkOiBlX2luZGV4fSk7XG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0fVxufSk7IiwibW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBpZD1cImxvYWRcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUtZ3JpZFwiPlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmUxXCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTJcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlM1wiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmU0XCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTVcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlNlwiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmU3XCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZThcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlOVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+KTtcblx0fSxcbn0pO1xuXG4iLCJ2YXIgTG9hZGVyID0gcmVxdWlyZSgnLi9sb2FkZXInKTtcbnZhciBDb3Vyc2VJbmZvU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy9jb3Vyc2VfaW5mbycpO1xudmFyIEV2YWx1YXRpb25NYW5hZ2VyID0gcmVxdWlyZSgnLi9ldmFsdWF0aW9ucy5qc3gnKTtcbnZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgVXBkYXRlVGltZXRhYmxlc1N0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBDb3Vyc2VBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL2NvdXJzZV9hY3Rpb25zJyk7XG52YXIgU2VjdGlvblNsb3QgPSByZXF1aXJlKCcuL3NlY3Rpb25fc2xvdC5qc3gnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0bWl4aW5zOiBbUmVmbHV4LmNvbm5lY3QoQ291cnNlSW5mb1N0b3JlKV0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbG9hZGluZyA9IHRoaXMuc3RhdGUuaW5mb19sb2FkaW5nO1xuXHRcdHZhciBsb2FkZXIgPSBsb2FkaW5nID8gPExvYWRlciAvPiA6IG51bGw7XG5cdFx0dmFyIGhlYWRlciA9IGxvYWRpbmcgPyBudWxsIDogdGhpcy5nZXRIZWFkZXIoKTtcblx0XHR2YXIgZGVzY3JpcHRpb24gPSBsb2FkaW5nID8gbnVsbCA6IHRoaXMuZ2V0RGVzY3JpcHRpb24oKTtcblx0XHR2YXIgZXZhbHVhdGlvbnMgPSBsb2FkaW5nID8gbnVsbCA6IHRoaXMuZ2V0RXZhbHVhdGlvbnMoKTtcblx0XHR2YXIgcmVjb21lbmRhdGlvbnMgPSBsb2FkaW5nID8gbnVsbCA6IHRoaXMuZ2V0UmVjb21lbmRhdGlvbnMoKTtcblx0XHR2YXIgdGV4dGJvb2tzID0gbG9hZGluZyA/IG51bGwgOiB0aGlzLmdldFRleHRib29rcygpO1xuXHRcdHZhciBzZWN0aW9ucyA9IGxvYWRpbmcgPyBudWxsIDogdGhpcy5nZXRTZWN0aW9ucygpO1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGlkPVwibW9kYWwtY29udGVudFwiPlxuXHRcdFx0XHQ8aSBjbGFzc05hbWU9XCJyaWdodCBmYSBmYS0yeCBmYS10aW1lcyBjbG9zZS1jb3Vyc2UtbW9kYWxcIiBvbkNsaWNrPXt0aGlzLnByb3BzLmhpZGV9PjwvaT5cbiAgICAgICAgICAgICAgICB7bG9hZGVyfVxuICAgICAgICAgICAgICAgIHtoZWFkZXJ9XG4gICAgICAgICAgICAgICAge2Rlc2NyaXB0aW9ufVxuICAgICAgICAgICAgICAgIHtldmFsdWF0aW9uc31cbiAgICAgICAgICAgICAgICB7c2VjdGlvbnN9XG4gICAgICAgICAgICAgICAge3RleHRib29rc31cbiAgICAgICAgICAgICAgICB7cmVjb21lbmRhdGlvbnN9XG4gICAgICAgICAgICA8L2Rpdj4pO1xuXHR9LFxuXG5cdGdldEhlYWRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNvdXJzZV9pZCA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8uaWQ7XG5cdFx0dmFyIGNfdG9fcyA9IHRoaXMucHJvcHMuY291cnNlc190b19zZWN0aW9ucztcblx0XHR2YXIgYWRkX29yX3JlbW92ZSA9IE9iamVjdC5rZXlzKGNfdG9fcykuaW5kZXhPZihTdHJpbmcoY291cnNlX2lkKSkgPiAtMSA/XG5cdFx0KDxzcGFuIGNsYXNzTmFtZT1cImNvdXJzZS1hY3Rpb24gZnVpLWNoZWNrXCIgb25DbGljaz17dGhpcy50b2dnbGVDb3Vyc2UodHJ1ZSl9Lz4pIDogXG5cdFx0KDxzcGFuIGNsYXNzTmFtZT1cImNvdXJzZS1hY3Rpb24gZnVpLXBsdXNcIiBvbkNsaWNrPXt0aGlzLnRvZ2dsZUNvdXJzZShmYWxzZSl9Lz4pO1xuXHRcdHZhciBoZWFkZXIgPSAoPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1oZWFkZXJcIj5cblx0XHRcdHthZGRfb3JfcmVtb3ZlfVxuXHRcdFx0PGRpdiBpZD1cImNvdXJzZS1pbmZvLXdyYXBwZXJcIj5cblx0XHRcdFx0PGRpdiBpZD1cIm5hbWVcIj57dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5uYW1lfTwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGlkPVwiY29kZVwiPnt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLmNvZGV9PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQ8L2Rpdj4pO1xuXHRcdHJldHVybiBoZWFkZXI7XG5cdH0sXG5cdHRvZ2dsZUNvdXJzZTogZnVuY3Rpb24ocmVtb3ZpbmcpIHtcblx0XHQvLyBpZiByZW1vdmluZyBpcyB0cnVlLCB3ZSdyZSByZW1vdmluZyB0aGUgY291cnNlLCBpZiBmYWxzZSwgd2UncmUgYWRkaW5nIGl0XG5cdFx0cmV0dXJuIChmdW5jdGlvbiAoKSB7XG5cdFx0XHRUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZUNvdXJzZXMoe2lkOiB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLmlkLCBzZWN0aW9uOiAnJywgcmVtb3Zpbmc6IHJlbW92aW5nfSk7XG5cdFx0XHRpZiAoIXJlbW92aW5nKSB7XG5cdFx0XHRcdHRoaXMucHJvcHMuaGlkZSgpO1xuXHRcdFx0fVxuXHRcdH0uYmluZCh0aGlzKSk7XG5cblx0fSxcblx0b3BlblJlY29tZW5kYXRpb246IGZ1bmN0aW9uKGNvdXJzZV9pZCkge1xuXHRcdHJldHVybiAoZnVuY3Rpb24oKSB7XG5cdFx0XHRDb3Vyc2VBY3Rpb25zLmdldENvdXJzZUluZm8odGhpcy5wcm9wcy5zY2hvb2wsIGNvdXJzZV9pZCk7XG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0fSxcblxuXHRnZXREZXNjcmlwdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGRlc2NyaXB0aW9uID0gXG5cdFx0XHQoPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1lbnRyeVwiIGlkPVwiY291cnNlLWRlc2NyaXB0aW9uXCI+XG5cdFx0XHRcdDxoNj5EZXNjcmlwdGlvbjo8L2g2PlxuXHRcdFx0XHR7dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5kZXNjcmlwdGlvbn1cblx0XHRcdDwvZGl2Pilcblx0XHRyZXR1cm4gZGVzY3JpcHRpb247XG5cdH0sXG5cblx0Z2V0RXZhbHVhdGlvbnM6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiA8RXZhbHVhdGlvbk1hbmFnZXIgZXZhbF9pbmZvPXt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLmV2YWxfaW5mb30gLz5cblx0fSxcblxuXHRnZXRSZWNvbWVuZGF0aW9uczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHJlbGF0ZWQgPSB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnJlbGF0ZWRfY291cnNlcy5zbGljZSgwLDMpLm1hcChmdW5jdGlvbihyYykge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIFx0PGRpdiBjbGFzc05hbWU9XCJyZWNvbW1lbmRhdGlvblwiIG9uQ2xpY2s9e3RoaXMub3BlblJlY29tZW5kYXRpb24ocmMuaWQpfSBrZXk9e3JjLmlkfT5cbiAgICAgICAgICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNlbnRlci13cmFwcGVyXCI+XG5cdCAgICAgICAgICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJlYy13cmFwcGVyXCI+XG5cdFx0ICAgICAgICAgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwibmFtZVwiPntyYy5uYW1lfTwvZGl2PlxuXHRcdCAgICAgICAgICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvZGVcIj57cmMuY29kZX08L2Rpdj5cblx0XHQgICAgICAgICAgICBcdDwvZGl2PlxuXHRcdCAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgXHQ8L2Rpdj4pXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG5cdFx0dmFyIHJlY29tZW5kYXRpb25zID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5yZWxhdGVkX2NvdXJzZXMubGVuZ3RoID09IDAgPyBudWxsIDpcblx0XHRcdCg8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWVudHJ5XCI+XG5cdFx0XHRcdDxoNj5Db3Vyc2VzIFlvdSBNaWdodCBMaWtlOjwvaDY+XG5cdFx0XHRcdDxkaXYgaWQ9XCJjb3Vyc2UtcmVjb21lbmRhdGlvbnNcIj5cblx0XHRcdFx0XHR7cmVsYXRlZH1cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj4pXG5cdFx0cmV0dXJuIHJlY29tZW5kYXRpb25zO1xuXHR9LFxuXG5cdGV4cGFuZFJlY29tZW5kYXRpb25zOiBmdW5jdGlvbigpIHtcblxuXHR9LFxuXG5cdGdldFRleHRib29rczogZnVuY3Rpb24oKSB7XG5cdFx0aWYodGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby50ZXh0Ym9va19pbmZvWzBdID09IHVuZGVmaW5lZCkge3JldHVybiBudWxsO31cblx0XHR2YXIgdGV4dGJvb2tfZWxlbWVudHMgPSB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnRleHRib29rX2luZm9bMF0udGV4dGJvb2tzLm1hcChmdW5jdGlvbih0Yikge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIFx0PGRpdiBjbGFzc05hbWU9XCJ0ZXh0Ym9va1wiIGtleT17dGIuaWR9PlxuICAgICAgICAgICAgXHRcdDxpbWcgaGVpZ2h0PVwiOTVcIiBzcmM9e3RiLmltYWdlX3VybH0vPlxuICAgICAgICAgICAgXHRcdDxoNiBjbGFzc05hbWU9XCJsaW5lLWNsYW1wXCI+e3RiLnRpdGxlfTwvaDY+XG4gICAgICAgICAgICBcdFx0PGRpdj57dGIuYXV0aG9yfTwvZGl2PlxuICAgICAgICAgICAgXHRcdDxkaXY+SVNCTjp7dGIuaXNibn08L2Rpdj5cbiAgICAgICAgICAgIFx0XHQ8YSBocmVmPXt0Yi5kZXRhaWxfdXJsfSB0YXJnZXQ9XCJfYmxhbmtcIj5cbiAgICAgICAgICAgIFx0XHRcdDxpbWcgc3JjPVwiaHR0cHM6Ly9pbWFnZXMtbmEuc3NsLWltYWdlcy1hbWF6b24uY29tL2ltYWdlcy9HLzAxL2Fzc29jaWF0ZXMvcmVtb3RlLWJ1eS1ib3gvYnV5NS5fVjE5MjIwNzczOV8uZ2lmXCIgd2lkdGg9XCIxMjBcIiBoZWlnaHQ9XCIyOFwiIGJvcmRlcj1cIjBcIi8+XG4gICAgICAgICAgICBcdFx0PC9hPlxuICAgICAgICAgICAgXHQ8L2Rpdj4pO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuXHRcdHZhciB0ZXh0Ym9va3MgPSB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnRleHRib29rX2luZm9bMF0udGV4dGJvb2tzLmxlbmd0aCA9PSAwID8gKDxkaXYgaWQ9XCJlbXB0eS1pbnRyb1wiPk5vIHRleHRib29rcyBmb3IgdGhpcyBjb3Vyc2UgeWV0LjwvZGl2PikgOlxuXHRcdFx0XHQoPGRpdiBpZD1cInRleHRib29rc1wiPlxuXHQgICAgICAgICAgICBcdHt0ZXh0Ym9va19lbGVtZW50c31cblx0ICAgICAgICAgICAgPC9kaXY+KTtcblx0XHR2YXIgcmV0ID0gXG5cdFx0XHQoPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1lbnRyeVwiIGlkPVwiY291cnNlLXRleHRib29rc1wiPlxuXHRcdFx0XHQ8aDY+VGV4dGJvb2tzOjwvaDY+XG5cdFx0XHRcdHt0ZXh0Ym9va3N9XG5cdFx0XHQ8L2Rpdj4pO1xuXHRcdHJldHVybiByZXQ7XG5cdH0sXG5cblx0Z2V0U2VjdGlvbnM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBGID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5zZWN0aW9uc19GLm1hcChmdW5jdGlvbihzKXtcblx0XHRcdHJldHVybiAoPFNlY3Rpb25TbG90IGtleT17c30gYWxsX3NlY3Rpb25zPXt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnNlY3Rpb25zX0Zfb2Jqc30gc2VjdGlvbj17c30vPilcblx0XHR9LmJpbmQodGhpcykpO1xuXHRcdHZhciBTID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5zZWN0aW9uc19TLm1hcChmdW5jdGlvbihzKXtcblx0XHRcdHJldHVybiAoPFNlY3Rpb25TbG90IGtleT17c30gYWxsX3NlY3Rpb25zPXt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnNlY3Rpb25zX1Nfb2Jqc30gc2VjdGlvbj17c30vPilcblx0XHR9LmJpbmQodGhpcykpO1xuXHRcdGlmICh0aGlzLnN0YXRlLnNob3dfc2VjdGlvbnMgPT09IHRoaXMuc3RhdGUuY291cnNlX2luZm8uY29kZSkge1xuXHRcdFx0dmFyIHNlY19kaXNwbGF5ID0gKFxuXHRcdFx0XHQ8ZGl2IGlkPVwiYWxsLXNlY3Rpb25zLXdyYXBwZXJcIj5cblx0XHRcdFx0XHR7Rn1cblx0XHRcdFx0XHR7U31cblx0XHRcdFx0PC9kaXY+KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dmFyIHNlY3Rpb25zX2NvdW50ID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5zZWN0aW9uc19TLmxlbmd0aCArIHRoaXMuc3RhdGUuY291cnNlX2luZm8uc2VjdGlvbnNfRi5sZW5ndGg7XG5cdFx0XHR2YXIgc2VjdGlvbnNfZ3JhbW1hciA9IHNlY3Rpb25zX2NvdW50ID4gMSA/IFwic2VjdGlvbnNcIiA6IFwic2VjdGlvblwiO1xuXHRcdFx0dmFyIHNlY19kaXNwbGF5ID0gKDxkaXYgaWQ9XCJudW1TZWN0aW9uc1wiIG9uQ2xpY2s9e3RoaXMuc2V0U2hvd1NlY3Rpb25zKHRoaXMuc3RhdGUuY291cnNlX2luZm8uY29kZSl9PlRoaXMgY291cnNlIGhhcyA8Yj57c2VjdGlvbnNfY291bnR9PC9iPiB7c2VjdGlvbnNfZ3JhbW1hcn0uIENsaWNrIGhlcmUgdG8gdmlldy48L2Rpdj4pXG5cdFx0fVxuXHRcdHZhciBzZWN0aW9ucyA9IFxuXHRcdFx0KDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZW50cnlcIiBpZD1cImNvdXJzZS1zZWN0aW9uc1wiPlxuXHRcdFx0XHQ8aDY+Q291cnNlIFNlY3Rpb25zOjwvaDY+XG5cdFx0XHRcdHtzZWNfZGlzcGxheX1cblx0XHRcdDwvZGl2Pik7XG5cdFx0cmV0dXJuIHNlY3Rpb25zO1xuXHR9LFxuXG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHNob3dfc2VjdGlvbnM6IDBcblx0XHR9O1xuXHR9LFxuXG5cdHNldFNob3dTZWN0aW9uczogZnVuY3Rpb24oaWQpIHtcblx0XHRyZXR1cm4gKGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7c2hvd19zZWN0aW9uczogaWR9KTtcblx0XHR9LmJpbmQodGhpcykpO1xuXHR9LFxuXG5cbn0pO1xuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbnVtX2J1YmJsZXMgPSB0aGlzLmdldE51bUJ1YmJsZXMoKTtcbiAgICByZXR1cm4ge251bV9idWJibGVzOiBudW1fYnViYmxlc307XG4gIH0sXG4gIGdldE51bUJ1YmJsZXM6IGZ1bmN0aW9uKCkge1xuICAgIHZhciB3aWR0aCA9ICQod2luZG93KS53aWR0aCgpO1xuICAgIHZhciBidWJibGVzID0gd2lkdGggPiA3MDAgPyA5IDogNDtcbiAgICBpZiAod2lkdGggPCA0MDApIHtcbiAgICAgIGJ1YmJsZXMgPSAyO1xuICAgIH1cbiAgICByZXR1cm4gYnViYmxlcztcbiAgfSxcblxuICBjaGFuZ2VQYWdlOiBmdW5jdGlvbihkaXJlY3Rpb24pIHtcbiAgICAgIHJldHVybiAoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICB2YXIgY3VycmVudCA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleCxcbiAgICAgICAgICAgY291bnQgPSB0aGlzLnByb3BzLmNvdW50O1xuICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgbmV3IGZpcnN0IGRpc3BsYXllZCBidXR0b24gKHRpbWV0YWJsZSlcbiAgICAgICB2YXIgbmV3X2ZpcnN0ID0gY3VycmVudCArICh0aGlzLnN0YXRlLm51bV9idWJibGVzKmRpcmVjdGlvbikgLSAoY3VycmVudCAlIHRoaXMuc3RhdGUubnVtX2J1YmJsZXMpO1xuICAgICAgIGlmIChuZXdfZmlyc3QgPj0gMCAmJiBuZXdfZmlyc3QgPCBjb3VudCkge1xuICAgICAgICB0aGlzLnByb3BzLnNldEluZGV4KG5ld19maXJzdCkoKTtcbiAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICAgIFxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvcHRpb25zID0gW10sIGNvdW50ID0gdGhpcy5wcm9wcy5jb3VudCwgY3VycmVudCA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleDtcbiAgICBpZiAoY291bnQgPD0gMSkgeyByZXR1cm4gbnVsbDsgfSAvLyBkb24ndCBkaXNwbGF5IGlmIHRoZXJlIGFyZW4ndCBlbm91Z2ggc2NoZWR1bGVzXG4gICAgdmFyIGZpcnN0ID0gY3VycmVudCAtIChjdXJyZW50ICUgdGhpcy5zdGF0ZS5udW1fYnViYmxlcyk7IC8vIHJvdW5kIGRvd24gdG8gbmVhcmVzdCBtdWx0aXBsZSBvZiB0aGlzLnByb3BzLm51bUJ1YmJsZXNcbiAgICB2YXIgbGltaXQgPSBNYXRoLm1pbihmaXJzdCArIHRoaXMuc3RhdGUubnVtX2J1YmJsZXMsIGNvdW50KTtcbiAgICBmb3IgKHZhciBpID0gZmlyc3Q7IGkgPCBsaW1pdDsgaSsrKSB7XG4gICAgICB2YXIgY2xhc3NOYW1lID0gdGhpcy5wcm9wcy5jdXJyZW50X2luZGV4ID09IGkgPyBcInNlbS1wYWdlIGFjdGl2ZVwiIDogXCJzZW0tcGFnZVwiO1xuICAgICAgb3B0aW9ucy5wdXNoKFxuICAgICAgICA8bGkga2V5PXtpfSBjbGFzc05hbWU9e2NsYXNzTmFtZX0gb25DbGljaz17dGhpcy5wcm9wcy5zZXRJbmRleChpKX0+XG4gICAgICAgICAgICAgIDxhPntpICsgMX08L2E+XG4gICAgICAgIDwvbGk+KTtcbiAgICB9XG4gICAgdmFyIHByZXZfZG91YmxlID0gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJzZW0tcGFnaW5hdGlvbi1uYXYgbmF2LWRvdWJsZSBuYXYtZG91YmxlLXByZXZcIiBvbkNsaWNrPXt0aGlzLmNoYW5nZVBhZ2UoLTEpfT5cbiAgICAgICAgPGkgY2xhc3NOYW1lPVwiZmEgZmEtYW5nbGUtZG91YmxlLWxlZnQgc2VtLXBhZ2luYXRpb24tcHJldiBzZW0tcGFnaW5hdGlvbi1pY29uXCIgLz5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gICAgdmFyIG5leHRfZG91YmxlID0gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJzZW0tcGFnaW5hdGlvbi1uYXYgbmF2LWRvdWJsZSBuYXYtZG91YmxlLW5leHRcIiBvbkNsaWNrPXt0aGlzLmNoYW5nZVBhZ2UoMSl9PlxuICAgICAgICA8aSBjbGFzc05hbWU9XCJmYSBmYS1hbmdsZS1kb3VibGUtcmlnaHQgc2VtLXBhZ2luYXRpb24tbmV4dCBzZW0tcGFnaW5hdGlvbi1pY29uXCIgLz5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gICAgaWYgKGNvdW50IDwgKHRoaXMuc3RhdGUubnVtX2J1YmJsZXMgKyAxKSkge1xuICAgICAgcHJldl9kb3VibGUgPSBudWxsO1xuICAgICAgbmV4dF9kb3VibGUgPSBudWxsO1xuICAgIH1cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZW0tcGFnaW5hdGlvblwiPlxuXHRcdFx0XHR7cHJldl9kb3VibGV9XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2VtLXBhZ2luYXRpb24tbmF2XCIgb25DbGljaz17dGhpcy5wcm9wcy5wcmV2fT5cblx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9XCJmYSBmYS1hbmdsZS1sZWZ0IHNlbS1wYWdpbmF0aW9uLXByZXYgc2VtLXBhZ2luYXRpb24taWNvblwiIC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8b2wgY2xhc3NOYW1lPVwic2VtLXBhZ2VzXCI+XG5cdFx0XHRcdFx0e29wdGlvbnN9XG5cdFx0XHRcdDwvb2w+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2VtLXBhZ2luYXRpb24tbmF2XCIgb25DbGljaz17dGhpcy5wcm9wcy5uZXh0fT5cblx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9XCJmYSBmYS1hbmdsZS1yaWdodCBzZW0tcGFnaW5hdGlvbi1uZXh0IHNlbS1wYWdpbmF0aW9uLWljb25cIiAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0e25leHRfZG91YmxlfVxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fSxcbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICQod2luZG93KS5yZXNpemUoZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtudW1fYnViYmxlczogdGhpcy5nZXROdW1CdWJibGVzKCl9KTtcbiAgICB9LmJpbmQodGhpcykpO1xuICB9LFxuXG5cbn0pOyIsIm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBudW1fYnViYmxlcyA9IHRoaXMuZ2V0TnVtQnViYmxlcygpO1xuICAgIHJldHVybiB7Zmlyc3RfZGlzcGxheWVkOiAwLCBudW1fYnViYmxlczogbnVtX2J1YmJsZXN9O1xuICB9LFxuICBnZXROdW1CdWJibGVzOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgYnViYmxlcyA9ICQod2luZG93KS53aWR0aCgpID4gNzAwID8gOSA6IDQ7XG4gICAgcmV0dXJuIGJ1YmJsZXM7XG4gIH0sXG5cbiAgY2hhbmdlUGFnZTogZnVuY3Rpb24oZGlyZWN0aW9uKSB7XG4gICAgICByZXR1cm4gKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgdmFyIGN1cnJlbnQgPSB0aGlzLnByb3BzLmN1cnJlbnRfaW5kZXgsXG4gICAgICAgICAgIGNvdW50ID0gdGhpcy5wcm9wcy5jb3VudDtcbiAgICAgICAvLyBjYWxjdWxhdGUgdGhlIG5ldyBmaXJzdF9kaXNwbGF5ZWQgYnV0dG9uICh0aW1ldGFibGUpXG4gICAgICAgdmFyIG5ld19maXJzdCA9IGN1cnJlbnQgKyAodGhpcy5zdGF0ZS5udW1fYnViYmxlcypkaXJlY3Rpb24pIC0gKGN1cnJlbnQgJSB0aGlzLnN0YXRlLm51bV9idWJibGVzKTtcbiAgICAgICBpZiAobmV3X2ZpcnN0ID49IDAgJiYgbmV3X2ZpcnN0IDwgY291bnQpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5zZXRJbmRleChuZXdfZmlyc3QpKCk7XG4gICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgb3B0aW9ucyA9IFtdLCBjb3VudCA9IHRoaXMucHJvcHMuY291bnQsIGN1cnJlbnQgPSB0aGlzLnByb3BzLmN1cnJlbnRfaW5kZXg7XG4gICAgaWYgKGNvdW50IDw9IDEpIHsgcmV0dXJuIG51bGw7IH0gLy8gZG9uJ3QgZGlzcGxheSBpZiB0aGVyZSBhcmVuJ3QgZW5vdWdoIHNjaGVkdWxlc1xuICAgIHZhciBmaXJzdCA9IGN1cnJlbnQgLSAoY3VycmVudCAlIHRoaXMuc3RhdGUubnVtX2J1YmJsZXMpOyAvLyByb3VuZCBkb3duIHRvIG5lYXJlc3QgbXVsdGlwbGUgb2YgdGhpcy5wcm9wcy5udW1CdWJibGVzXG4gICAgdmFyIGxpbWl0ID0gTWF0aC5taW4oZmlyc3QgKyB0aGlzLnN0YXRlLm51bV9idWJibGVzLCBjb3VudCk7XG4gICAgZm9yICh2YXIgaSA9IGZpcnN0OyBpIDwgbGltaXQ7IGkrKykge1xuICAgICAgdmFyIGNsYXNzTmFtZSA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleCA9PSBpID8gXCJhY3RpdmVcIiA6IFwiXCI7XG4gICAgICBvcHRpb25zLnB1c2goXG4gICAgICAgIDxsaSBrZXk9e2l9IGNsYXNzTmFtZT17Y2xhc3NOYW1lfT5cbiAgICAgICAgICAgICAgPGEgb25DbGljaz17dGhpcy5wcm9wcy5zZXRJbmRleChpKX0+e2kgKyAxfTwvYT5cbiAgICAgICAgPC9saT4pO1xuICAgIH1cbiAgICB2YXIgcHJldl9kb3VibGUgPSAoXG4gICAgICA8bGkgY2xhc3NOYW1lPVwicHJldi1kb3VibGVcIiBvbkNsaWNrPXt0aGlzLmNoYW5nZVBhZ2UoLTEpfT5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYWdpbmF0aW9uLWJ0blwiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLWFuZ2xlLWRvdWJsZS1sZWZ0XCI+PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvbGk+XG4gICAgKTtcbiAgICB2YXIgbmV4dF9kb3VibGUgPSAoXG4gICAgICA8bGkgY2xhc3NOYW1lPVwibmV4dC1kb3VibGVcIiBvbkNsaWNrPXt0aGlzLmNoYW5nZVBhZ2UoMSl9PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2luYXRpb24tYnRuXCI+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtYW5nbGUtZG91YmxlLXJpZ2h0XCI+PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvbGk+XG4gICAgKTtcbiAgICBpZiAoY291bnQgPCAodGhpcy5zdGF0ZS5udW1fYnViYmxlcyArIDEpKSB7XG4gICAgICBwcmV2X2RvdWJsZSA9IG51bGw7XG4gICAgICBuZXh0X2RvdWJsZSA9IG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYWdpbmF0aW9uIHBhZ2luYXRpb24tbWluaW1hbFwiPlxuICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgIHtwcmV2X2RvdWJsZX1cbiAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJwcmV2aW91c1wiPlxuICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJmdWktYXJyb3ctbGVmdCBwYWdpbmF0aW9uLWJ0blwiIFxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMucHJldn0+PC9hPlxuICAgICAgICAgICAgPC9saT5cblxuICAgICAgICAgICAge29wdGlvbnN9XG4gICAgICAgICAgXG4gICAgICAgICAgICA8bGkgY2xhc3NOYW1lPVwibmV4dFwiPlxuICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJmdWktYXJyb3ctcmlnaHQgcGFnaW5hdGlvbi1idG5cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMubmV4dH0+PC9hPlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgIHtuZXh0X2RvdWJsZX1cbiAgICAgICAgICA8L3VsPlxuICAgICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAkKHdpbmRvdykucmVzaXplKGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7bnVtX2J1YmJsZXM6IHRoaXMuZ2V0TnVtQnViYmxlcygpfSk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcbiAgXG5cbn0pOyIsInZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgVGltZXRhYmxlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xuXG52YXIgQmluYXJ5UHJlZmVyZW5jZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgbWl4aW5zOiBbUmVmbHV4LmNvbm5lY3QoVGltZXRhYmxlU3RvcmUpXSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0b2dnbGVfbGFiZWwgPSBcImNtbi10b2dnbGUtXCIgKyB0aGlzLnByb3BzLnRvZ2dsZV9pZDtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcmVmZXJlbmNlLWl0ZW1cIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcmVmZXJlbmNlLXRleHRcIj5cbiAgICAgICAgICA8bGk+IHt0aGlzLnByb3BzLnRleHR9IDwvbGk+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInByZWZlcmVuY2UtdG9nZ2xlXCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzd2l0Y2hcIj5cbiAgICAgICAgICAgIDxpbnB1dCByZWY9XCJjaGVja2JveF9lbGVtXCIgaWQ9e3RvZ2dsZV9sYWJlbH0gXG4gICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtcImNtbi10b2dnbGUgY21uLXRvZ2dsZS1yb3VuZCBcIiArIHRoaXMucHJvcHMubmFtZX0gXG4gICAgICAgICAgICAgICAgICAgdHlwZT1cImNoZWNrYm94XCIgXG4gICAgICAgICAgICAgICAgICAgY2hlY2tlZD17dGhpcy5zdGF0ZS5wcmVmZXJlbmNlc1t0aGlzLnByb3BzLm5hbWVdfVxuICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMudG9nZ2xlUHJlZmVyZW5jZX0vPlxuICAgICAgICAgICAgPGxhYmVsIGh0bWxGb3I9e3RvZ2dsZV9sYWJlbH0+PC9sYWJlbD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIHRvZ2dsZVByZWZlcmVuY2U6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBuZXdfdmFsdWUgPSAhdGhpcy5zdGF0ZS5wcmVmZXJlbmNlc1t0aGlzLnByb3BzLm5hbWVdO1xuICAgIFRpbWV0YWJsZUFjdGlvbnMudXBkYXRlUHJlZmVyZW5jZXModGhpcy5wcm9wcy5uYW1lLCBuZXdfdmFsdWUpO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIGN1cnJlbnRfdG9nZ2xlX2lkOiAwLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJtZW51LWNvbnRhaW5lclwiIGNsYXNzTmFtZT1cImNvbGxhcHNlXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibmF2YmFyLWNvbGxhcHNlXCIgPlxuICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJuYXYgbmF2YmFyLW5hdlwiIGlkPVwibWVudVwiPlxuICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgPEJpbmFyeVByZWZlcmVuY2UgdGV4dD1cIkF2b2lkIGVhcmx5IGNsYXNzZXNcIiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lPVwibm9fY2xhc3Nlc19iZWZvcmVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZV9pZD17dGhpcy5nZXRfbmV4dF90b2dnbGVfaWQoKX0gLz5cbiAgICAgICAgICAgICAgICA8QmluYXJ5UHJlZmVyZW5jZSB0ZXh0PVwiQXZvaWQgbGF0ZSBjbGFzc2VzXCIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZT1cIm5vX2NsYXNzZXNfYWZ0ZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZV9pZD17dGhpcy5nZXRfbmV4dF90b2dnbGVfaWQoKX0gLz5cbiAgICAgICAgICAgICAgICA8QmluYXJ5UHJlZmVyZW5jZSB0ZXh0PVwiQWxsb3cgY29uZmxpY3RzXCIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZT1cInRyeV93aXRoX2NvbmZsaWN0c1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9nZ2xlX2lkPXt0aGlzLmdldF9uZXh0X3RvZ2dsZV9pZCgpfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICA8L3VsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgZ2V0X25leHRfdG9nZ2xlX2lkOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmN1cnJlbnRfdG9nZ2xlX2lkICs9IDFcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50X3RvZ2dsZV9pZDtcbiAgfVxuXG59KTtcbiIsInZhciBDb250cm9sQmFyID0gcmVxdWlyZSgnLi9jb250cm9sX2JhcicpO1xudmFyIFRpbWV0YWJsZSA9IHJlcXVpcmUoJy4vdGltZXRhYmxlJyk7XG52YXIgTW9kYWxDb250ZW50ID0gcmVxdWlyZSgnLi9tb2RhbF9jb250ZW50Jyk7XG52YXIgVG9hc3RTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3RvYXN0X3N0b3JlLmpzJyk7XG52YXIgVGltZXRhYmxlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIGNvdXJzZV9hY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL2NvdXJzZV9hY3Rpb25zJyk7XG52YXIgU2lkZWJhciA9IHJlcXVpcmUoJy4vc2lkZV9iYXInKTtcbnZhciBTaW1wbGVNb2RhbCA9IHJlcXVpcmUoJy4vc2ltcGxlX21vZGFsJyk7XG52YXIgU2Nob29sTGlzdCA9IHJlcXVpcmUoJy4vc2Nob29sX2xpc3QnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIG1peGluczogW1JlZmx1eC5jb25uZWN0KFRpbWV0YWJsZVN0b3JlKSwgUmVmbHV4LmNvbm5lY3QoVG9hc3RTdG9yZSldLFxuICBzaWRlYmFyX2NvbGxhcHNlZDogJ25ldXRyYWwnLFxuXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgTW9kYWwgPSBCb3JvblsnT3V0bGluZU1vZGFsJ107XG4gICAgdmFyIGxvYWRlciA9ICEodGhpcy5zdGF0ZS5sb2FkaW5nIHx8IHRoaXMuc3RhdGUuY291cnNlc19sb2FkaW5nKSA/IG51bGwgOlxuICAgICAgKCAgPGRpdiBjbGFzc05hbWU9XCJzcGlubmVyXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QxXCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QyXCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QzXCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3Q0XCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3Q1XCI+PC9kaXY+XG4gICAgICAgIDwvZGl2Pik7XG4gICAgdmFyIHNjaG9vbF9zZWxlY3RvciA9IChcbiAgICAgIDxTaW1wbGVNb2RhbCBoZWFkZXI9XCJTZW1lc3Rlci5seSB8IFdlbGNvbWVcIlxuICAgICAgICAgICAgICAgICAgIGtleT1cInNjaG9vbFwiXG4gICAgICAgICAgICAgICAgICAgcmVmPVwic2Nob29sX21vZGFsXCJcbiAgICAgICAgICAgICAgICAgICBhbGxvd19kaXNhYmxlPXtmYWxzZX1cbiAgICAgICAgICAgICAgICAgICBzdHlsZXM9e3tiYWNrZ3JvdW5kQ29sb3I6IFwiI0ZERjVGRlwiLCBjb2xvcjogXCIjMDAwXCJ9fSBcbiAgICAgICAgICAgICAgICAgICBjb250ZW50PXs8U2Nob29sTGlzdCBzZXRTY2hvb2w9e3RoaXMuc2V0U2Nob29sfS8+IH0vPik7XG4gICAgICBcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBpZD1cInJvb3RcIj5cbiAgICAgICAge2xvYWRlcn1cbiAgICAgICAgPGRpdiBpZD1cInRvYXN0LWNvbnRhaW5lclwiPjwvZGl2PlxuICAgICAgICA8ZGl2IGlkPVwiY29udHJvbC1iYXItY29udGFpbmVyXCI+XG4gICAgICAgICAgPGRpdiBpZD1cInNlbWVzdGVybHktbmFtZVwiPlNlbWVzdGVyLmx5PC9kaXY+XG4gICAgICAgICAgPGltZyBpZD1cInNlbWVzdGVybHktbG9nb1wiIHNyYz1cIi9zdGF0aWMvaW1nL2xvZ28yLjAucG5nXCIvPlxuICAgICAgICAgIDxDb250cm9sQmFyIHRvZ2dsZU1vZGFsPXt0aGlzLnRvZ2dsZUNvdXJzZU1vZGFsfS8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGlkPVwibmF2aWNvblwiIG9uQ2xpY2s9e3RoaXMudG9nZ2xlU2lkZU1vZGFsfT5cbiAgICAgICAgICA8c3Bhbj48L3NwYW4+PHNwYW4+PC9zcGFuPjxzcGFuPjwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJtb2RhbC1jb250YWluZXJcIj5cbiAgICAgICAgICA8TW9kYWwgY2xvc2VPbkNsaWNrPXt0cnVlfSByZWY9J091dGxpbmVNb2RhbCcgY2xhc3NOYW1lPVwiY291cnNlLW1vZGFsXCI+XG4gICAgICAgICAgICAgIDxNb2RhbENvbnRlbnQgc2Nob29sPXt0aGlzLnN0YXRlLnNjaG9vbH0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY291cnNlc190b19zZWN0aW9ucz17dGhpcy5zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zfSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaWRlPXt0aGlzLmhpZGVDb3Vyc2VNb2RhbH0gLz5cbiAgICAgICAgICA8L01vZGFsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhbGwtY29scy1jb250YWluZXJcIj5cbiAgICAgICAgICA8U2lkZWJhciB0b2dnbGVNb2RhbD17dGhpcy50b2dnbGVDb3Vyc2VNb2RhbH0vPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY2FsLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgPFRpbWV0YWJsZSB0b2dnbGVNb2RhbD17dGhpcy50b2dnbGVDb3Vyc2VNb2RhbH0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtzY2hvb2xfc2VsZWN0b3J9XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5zY2hvb2wgPT0gXCJcIiAmJiB0aGlzLnByb3BzLmRhdGEgPT0gbnVsbCkge1xuICAgICAgdGhpcy5zaG93U2Nob29sTW9kYWwoKTtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5zY2hvb2wgIT0gXCJcIikge1xuICAgICAgdGhpcy5oaWRlU2Nob29sTW9kYWwoKTtcbiAgICB9XG4gIH0sXG5cbiAgdG9nZ2xlQ291cnNlTW9kYWw6IGZ1bmN0aW9uKGNvdXJzZV9pZCkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5yZWZzWydPdXRsaW5lTW9kYWwnXS50b2dnbGUoKTtcbiAgICAgICAgY291cnNlX2FjdGlvbnMuZ2V0Q291cnNlSW5mbyh0aGlzLnN0YXRlLnNjaG9vbCwgY291cnNlX2lkKTtcbiAgICB9LmJpbmQodGhpcyk7IFxuICB9LFxuXG4gIGhpZGVDb3Vyc2VNb2RhbDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5yZWZzWydPdXRsaW5lTW9kYWwnXS5oaWRlKCk7XG4gIH0sXG5cbiAgc2hvd1NjaG9vbE1vZGFsOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMucmVmcy5zY2hvb2xfbW9kYWwuc2hvdygpO1xuICB9LFxuICBoaWRlU2Nob29sTW9kYWw6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5yZWZzLnNjaG9vbF9tb2RhbC5oaWRlKCk7XG4gIH0sXG5cbiAgdG9nZ2xlU2lkZU1vZGFsOiBmdW5jdGlvbigpe1xuICAgIGlmICh0aGlzLnNpZGViYXJfY29sbGFwc2VkID09ICduZXV0cmFsJykge1xuICAgICAgdmFyIGJvZHl3ID0gJCh3aW5kb3cpLndpZHRoKCk7XG4gICAgICBpZiAoYm9keXcgPiA5OTkpIHtcbiAgICAgICAgdGhpcy5jb2xsYXBzZVNpZGVNb2RhbCgpO1xuICAgICAgICB0aGlzLnNpZGViYXJfY29sbGFwc2VkID0gJ29wZW4nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5leHBhbmRTaWRlTW9kYWwoKTtcbiAgICAgICAgdGhpcy5zaWRlYmFyX2NvbGxhcHNlZCA9ICdjbG9zZWQnO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5zaWRlYmFyX2NvbGxhcHNlZCA9PSAnY2xvc2VkJykge1xuICAgICAgdGhpcy5leHBhbmRTaWRlTW9kYWwoKTtcbiAgICAgIHRoaXMuc2lkZWJhcl9jb2xsYXBzZWQgPSAnb3Blbic7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY29sbGFwc2VTaWRlTW9kYWwoKTtcbiAgICAgIHRoaXMuc2lkZWJhcl9jb2xsYXBzZWQgPSAnY2xvc2VkJztcbiAgICB9XG4gIH0sXG5cbiAgZXhwYW5kU2lkZU1vZGFsOiBmdW5jdGlvbigpIHtcbiAgICAkKCcuY2FsLWNvbnRhaW5lciwgLnNpZGUtY29udGFpbmVyJykucmVtb3ZlQ2xhc3MoJ2Z1bGwtY2FsJykuYWRkQ2xhc3MoJ2xlc3MtY2FsJyk7XG4gIH0sXG5cbiAgY29sbGFwc2VTaWRlTW9kYWw6IGZ1bmN0aW9uKCkge1xuICAgICQoJy5jYWwtY29udGFpbmVyLCAuc2lkZS1jb250YWluZXInKS5yZW1vdmVDbGFzcygnbGVzcy1jYWwnKS5hZGRDbGFzcygnZnVsbC1jYWwnKTtcbiAgfVxuXG59KTtcbiIsIlRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gXHQoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNjaG9vbC1saXN0XCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2Nob29sLXBpY2tlciBzY2hvb2wtamh1XCIgXG5cdFx0XHRcdFx0b25DbGljaz17dGhpcy5zZXRTY2hvb2woXCJqaHVcIil9PlxuXHRcdFx0XHRcdDxpbWcgc3JjPVwiL3N0YXRpYy9pbWcvc2Nob29sX2xvZ29zL2podV9sb2dvLnBuZ1wiIFxuXHRcdFx0XHRcdFx0Y2xhc3NOYW1lPVwic2Nob29sLWxvZ29cIi8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNjaG9vbC1waWNrZXIgc2Nob29sLXVvZnRcIiBcblx0XHRcdFx0XHRvbkNsaWNrPXt0aGlzLnNldFNjaG9vbChcInVvZnRcIil9PlxuXHRcdFx0XHRcdDxpbWcgc3JjPVwiL3N0YXRpYy9pbWcvc2Nob29sX2xvZ29zL3VvZnRfbG9nby5wbmdcIiBcblx0XHRcdFx0XHRcdGNsYXNzTmFtZT1cInNjaG9vbC1sb2dvXCIvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2Pik7XG5cdH0sXG5cblx0c2V0U2Nob29sOiBmdW5jdGlvbihuZXdfc2Nob29sKSB7XG5cdFx0cmV0dXJuIChmdW5jdGlvbigpIHtcblx0XHRcdFRpbWV0YWJsZUFjdGlvbnMuc2V0U2Nob29sKG5ld19zY2hvb2wpO1xuXHRcdH0uYmluZCh0aGlzKSk7XG5cdH0sXG5cbn0pO1xuXG4iLCJ2YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFRpbWV0YWJsZVN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcblxudmFyIFNlYXJjaFJlc3VsdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGlfY2xhc3MgPSBcInNlYXJjaC1yZXN1bHRcIiwgaWNvbl9jbGFzcyA9IFwiZnVpLXBsdXNcIjtcbiAgICBpZiAodGhpcy5wcm9wcy5pbl9yb3N0ZXIpIHtcbiAgICAgIGxpX2NsYXNzICs9IFwiIHRvZG8tZG9uZVwiO1xuICAgICAgaWNvbl9jbGFzcyA9IFwiZnVpLWNoZWNrXCI7XG4gICAgfVxuICAgIHJldHVybiAoXG4gICAgICA8bGkgY2xhc3NOYW1lPXtsaV9jbGFzc30gb25Nb3VzZURvd249e3RoaXMucHJvcHMudG9nZ2xlTW9kYWwodGhpcy5wcm9wcy5pZCl9PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRvZG8tY29udGVudFwiPlxuICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJ0b2RvLW5hbWVcIj5cbiAgICAgICAgICAgIHt0aGlzLnByb3BzLmNvZGV9XG4gICAgICAgICAgPC9oND5cbiAgICAgICAgICB7dGhpcy5wcm9wcy5uYW1lfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtcInNlYXJjaC1yZXN1bHQtYWN0aW9uIFwiICsgaWNvbl9jbGFzc30gXG4gICAgICAgICAgb25Nb3VzZURvd249e3RoaXMudG9nZ2xlQ291cnNlfT5cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9saT5cbiAgICApO1xuICB9LFxuXG4gIHRvZ2dsZUNvdXJzZTogZnVuY3Rpb24oZSkge1xuICAgIHZhciByZW1vdmluZyA9IHRoaXMucHJvcHMuaW5fcm9zdGVyO1xuICAgIFRpbWV0YWJsZUFjdGlvbnMudXBkYXRlQ291cnNlcyh7aWQ6IHRoaXMucHJvcHMuaWQsIHNlY3Rpb246ICcnLCByZW1vdmluZzogcmVtb3Zpbmd9KTtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7ICAvLyBzdG9wIGlucHV0IGZyb20gdHJpZ2dlcmluZyBvbkJsdXIgYW5kIHRodXMgaGlkaW5nIHJlc3VsdHNcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpOyAvLyBzdG9wIHBhcmVudCBmcm9tIG9wZW5pbmcgbW9kYWxcbiAgfSxcblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBtaXhpbnM6IFtSZWZsdXguY29ubmVjdChUaW1ldGFibGVTdG9yZSldLFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvdXJzZXM6W10sXG4gICAgICByZXN1bHRzOiBbXSxcbiAgICAgIGZvY3VzZWQ6IGZhbHNlLFxuICAgIH07XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVwZGF0ZTogZnVuY3Rpb24obmV3X3Byb3BzLCBuZXdfc3RhdGUpIHtcbiAgICBpZiAobmV3X3N0YXRlLnNjaG9vbCAhPSB0aGlzLnN0YXRlLnNjaG9vbCkge1xuICAgICAgdGhpcy5nZXRDb3Vyc2VzKG5ld19zdGF0ZS5zY2hvb2wpO1xuICAgIH1cblxuICB9LFxuICBnZXRDb3Vyc2VzOiBmdW5jdGlvbihzY2hvb2wpIHtcbiAgICBUaW1ldGFibGVBY3Rpb25zLnNldENvdXJzZXNMb2FkaW5nKCk7XG4gICAgJC5nZXQoXCIvY291cnNlcy9cIiArIHNjaG9vbCArIFwiL1wiICsgX1NFTUVTVEVSLCBcbiAgICAgICAge30sIFxuICAgICAgICBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2NvdXJzZXM6IHJlc3BvbnNlfSk7XG4gICAgICAgICAgVGltZXRhYmxlQWN0aW9ucy5zZXRDb3Vyc2VzRG9uZUxvYWRpbmcoKTtcblxuICAgICAgICB9LmJpbmQodGhpcylcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlYXJjaF9yZXN1bHRzX2RpdiA9IHRoaXMuZ2V0U2VhcmNoUmVzdWx0c0NvbXBvbmVudCgpO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGlkPVwic2VhcmNoLWJhclwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImlucHV0LWNvbWJpbmVcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImlucHV0LXdyYXBwZXJcIj5cbiAgICAgICAgICAgIDxpbnB1dCBcbiAgICAgICAgICAgICAgdHlwZT1cInRleHRcIiBcbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJTZWFyY2ggYnkgY29kZSwgdGl0bGUsIGRlc2NyaXB0aW9uLCBkZWdyZWVcIiBcbiAgICAgICAgICAgICAgaWQ9XCJzZWFyY2gtaW5wdXRcIiBcbiAgICAgICAgICAgICAgcmVmPVwiaW5wdXRcIiBcbiAgICAgICAgICAgICAgb25Gb2N1cz17dGhpcy5mb2N1c30gb25CbHVyPXt0aGlzLmJsdXJ9IFxuICAgICAgICAgICAgICBvbklucHV0PXt0aGlzLnF1ZXJ5Q2hhbmdlZH0vPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGJ1dHRvbiBkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCIgZGF0YS10YXJnZXQ9XCIjbWVudS1jb250YWluZXJcIiBpZD1cIm1lbnUtYnRuXCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwic2xpZGVyc1wiPlxuICAgICAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJveFwiPjwvZGl2PlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYm94XCI+PC9kaXY+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJib3hcIj48L2Rpdj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAge3NlYXJjaF9yZXN1bHRzX2Rpdn1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIGdldFNlYXJjaFJlc3VsdHNDb21wb25lbnQ6IGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGhpcy5zdGF0ZS5mb2N1c2VkIHx8IHRoaXMuc3RhdGUucmVzdWx0cy5sZW5ndGggPT0gMCkge3JldHVybiBudWxsO31cbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIHNlYXJjaF9yZXN1bHRzID0gdGhpcy5zdGF0ZS5yZXN1bHRzLm1hcChmdW5jdGlvbihyKSB7XG4gICAgICBpKys7XG4gICAgICB2YXIgaW5fcm9zdGVyID0gdGhpcy5zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zW3IuaWRdICE9IG51bGw7XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8U2VhcmNoUmVzdWx0IHsuLi5yfSBrZXk9e2l9IGluX3Jvc3Rlcj17aW5fcm9zdGVyfSB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0vPlxuICAgICAgKTtcbiAgICB9LmJpbmQodGhpcykpO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGlkPVwic2VhcmNoLXJlc3VsdHMtY29udGFpbmVyXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidG9kbyBtcm1cIj5cbiAgICAgICAgICAgIDx1bCBpZD1cInNlYXJjaC1yZXN1bHRzXCI+XG4gICAgICAgICAgICAgIHtzZWFyY2hfcmVzdWx0c31cbiAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIGZvY3VzOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtmb2N1c2VkOiB0cnVlfSk7XG4gIH0sXG5cbiAgYmx1cjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7Zm9jdXNlZDogZmFsc2V9KTtcbiAgfSxcblxuICBxdWVyeUNoYW5nZWQ6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdmFyIHF1ZXJ5ID0gZXZlbnQudGFyZ2V0LnZhbHVlLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFyIGZpbHRlcmVkID0gcXVlcnkubGVuZ3RoIDw9IDEgPyBbXSA6IHRoaXMuZmlsdGVyQ291cnNlcyhxdWVyeSk7XG4gICAgdGhpcy5zZXRTdGF0ZSh7cmVzdWx0czogZmlsdGVyZWR9KTtcbiAgfSxcblxuICBpc1N1YnNlcXVlbmNlOiBmdW5jdGlvbihyZXN1bHQscXVlcnkpIHtcbiAgICAgIHJlc3VsdCA9IHF1ZXJ5LnNwbGl0KFwiIFwiKS5ldmVyeShmdW5jdGlvbihzKSB7XG4gICAgICAgICAgaWYgKHJlc3VsdC5pbmRleE9mKHMpID4gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gIH0sXG5cbiAgZmlsdGVyQ291cnNlczogZnVuY3Rpb24ocXVlcnkpIHtcbiAgICB2YXIgb3B0X3F1ZXJ5ID0gcXVlcnkucmVwbGFjZShcImludHJvXCIsXCJpbnRyb2R1Y3Rpb25cIik7XG4gICAgdmFyIGFuZF9xdWVyeSA9IHF1ZXJ5LnJlcGxhY2UoXCImXCIsXCJhbmRcIik7XG4gICAgdGhhdCA9IHRoaXM7XG4gICAgdmFyIHJlc3VsdHMgPSB0aGlzLnN0YXRlLmNvdXJzZXMuZmlsdGVyKGZ1bmN0aW9uKGMpIHtcbiAgICAgIHJldHVybiAodGhhdC5pc1N1YnNlcXVlbmNlKGMubmFtZS50b0xvd2VyQ2FzZSgpLHF1ZXJ5KSB8fCBcbiAgICAgICAgICAgICB0aGF0LmlzU3Vic2VxdWVuY2UoYy5uYW1lLnRvTG93ZXJDYXNlKCksb3B0X3F1ZXJ5KSB8fFxuICAgICAgICAgICAgIGMubmFtZS50b0xvd2VyQ2FzZSgpLmluZGV4T2Yob3B0X3F1ZXJ5KSA+IC0xIHx8XG4gICAgICAgICAgICAgdGhhdC5pc1N1YnNlcXVlbmNlKGMubmFtZS50b0xvd2VyQ2FzZSgpLGFuZF9xdWVyeSkgfHxcbiAgICAgICAgICAgICBjLm5hbWUudG9Mb3dlckNhc2UoKS5pbmRleE9mKGFuZF9xdWVyeSkgPiAtMSB8fFxuICAgICAgICAgICAgIGMubmFtZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YocXVlcnkpID4gLTEgfHwgXG4gICAgICAgICAgICAgYy5jb2RlLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihxdWVyeSkgPiAtMSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH0sXG5cblxuXG59KTtcbiIsInZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgVGltZXRhYmxlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xuXG5cbnZhciBkYXlfdG9fbGV0dGVyID0ge1xuICAgICdNJzogICdNJywgXG4gICAgJ1QnOiAgJ1QnLCBcbiAgICAnVyc6ICAnVycsXG4gICAgJ1InOiAnVGgnLFxuICAgICdGJzogICdGJyxcbiAgICAnUyc6ICdTYScsXG4gICAgJ1UnOiAnUydcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjb3MgPSB0aGlzLmdldFJlbGF0ZWRDb3Vyc2VPZmZlcmluZ3MoKTtcbiAgICAgICAgdmFyIGRheV9hbmRfdGltZXMgPSB0aGlzLmdldERheXNBbmRUaW1lcyhjb3MpO1xuICAgICAgICB2YXIgc2VjdGlvbl9hbmRfcHJvZiA9IChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2VjdC1wcm9mXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzZWN0aW9uLW51bVwiPntjb3NbMF0ubWVldGluZ19zZWN0aW9ufTwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHJvZnNcIj57Y29zWzBdLmluc3RydWN0b3JzfTwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNlY3Rpb24td3JhcHBlclwiPlxuICAgICAgICAgICAgICAgIHtzZWN0aW9uX2FuZF9wcm9mfVxuICAgICAgICAgICAgICAgIHtkYXlfYW5kX3RpbWVzfVxuICAgICAgICAgICAgPC9kaXY+KTtcbiAgICB9LFxuXG4gICAgZ2V0UmVsYXRlZENvdXJzZU9mZmVyaW5nczogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvX29iamVjdHMgPSBbXVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucHJvcHMuYWxsX3NlY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbyA9IHRoaXMucHJvcHMuYWxsX3NlY3Rpb25zW2ldO1xuICAgICAgICAgICAgaWYgKG8ubWVldGluZ19zZWN0aW9uID09IHRoaXMucHJvcHMuc2VjdGlvbikge1xuICAgICAgICAgICAgICAgIGNvX29iamVjdHMucHVzaChvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29fb2JqZWN0cztcbiAgICB9LFxuXG4gICAgZ2V0RGF5c0FuZFRpbWVzOiBmdW5jdGlvbihjb3MpIHtcbiAgICAgICAgdmFyIGRheUFuZFRpbWVzID0gY29zLm1hcChmdW5jdGlvbihvKSB7XG4gICAgICAgICAgICByZXR1cm4gKDxkaXYga2V5PXt0aGlzLnByb3BzLmtleX0gaWQ9XCJkYXktdGltZVwiIGtleT17by5pZH0+e2RheV90b19sZXR0ZXJbby5kYXldICsgXCIgXCIgKyBvLnRpbWVfc3RhcnQgKyBcIi1cIiArIG8udGltZV9lbmR9PC9kaXY+KTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgcmV0dXJuICggPGRpdiBrZXk9e3RoaXMucHJvcHMua2V5fSBjbGFzc05hbWU9XCJkdC1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICB7ZGF5QW5kVGltZXN9XG4gICAgICAgICAgICA8L2Rpdj4gKVxuICAgIH1cbn0pO1xuIiwidmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBUaW1ldGFibGVTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgU2ltcGxlTW9kYWwgPSByZXF1aXJlKCcuL3NpbXBsZV9tb2RhbCcpO1xudmFyIFRleHRib29rTGlzdCA9IHJlcXVpcmUoJy4vdGV4dGJvb2tfbGlzdCcpXG5cbnZhciBSb3N0ZXJTbG90ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdHlsZXM9e2JhY2tncm91bmRDb2xvcjogdGhpcy5wcm9wcy5jb2xvdXIsIGJvcmRlckNvbG9yOiB0aGlzLnByb3BzLmNvbG91cn07XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXZcbiAgICAgICAgb25DbGljaz17dGhpcy5wcm9wcy50b2dnbGVNb2RhbCh0aGlzLnByb3BzLmlkKX1cbiAgICAgICAgc3R5bGU9e3N0eWxlc31cbiAgICAgICAgb25Nb3VzZUVudGVyPXt0aGlzLmhpZ2hsaWdodFNpYmxpbmdzfVxuICAgICAgICBvbk1vdXNlTGVhdmU9e3RoaXMudW5oaWdobGlnaHRTaWJsaW5nc31cbiAgICAgICAgY2xhc3NOYW1lPXtcInNsb3Qtb3V0ZXIgZmMtdGltZS1ncmlkLWV2ZW50IGZjLWV2ZW50IHNsb3Qgc2xvdC1cIiArIHRoaXMucHJvcHMuaWR9PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtY29udGVudFwiPlxuXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10aXRsZSBzbG90LXRleHQtcm93XCI+XG4gICAgICAgICAgICA8aSBjbGFzc05hbWU9XCJyaWdodCBmYSBmYS10aW1lcyByZW1vdmUtY291cnNlLWljb25cIiBvbkNsaWNrPXt0aGlzLnJlbW92ZUNvdXJzZX0+PC9pPlxuICAgICAgICAgICAge3RoaXMucHJvcHMubmFtZX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgfSxcbiAgaGlnaGxpZ2h0U2libGluZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy51cGRhdGVDb2xvdXJzKENPTE9VUl9UT19ISUdITElHSFRbdGhpcy5wcm9wcy5jb2xvdXJdKTtcbiAgfSxcbiAgdW5oaWdobGlnaHRTaWJsaW5nczogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnVwZGF0ZUNvbG91cnModGhpcy5wcm9wcy5jb2xvdXIpO1xuICB9LFxuICB1cGRhdGVDb2xvdXJzOiBmdW5jdGlvbihjb2xvdXIpIHtcbiAgICAkKFwiLnNsb3QtXCIgKyB0aGlzLnByb3BzLmlkKVxuICAgICAgLmNzcygnYmFja2dyb3VuZC1jb2xvcicsIGNvbG91cilcbiAgICAgIC5jc3MoJ2JvcmRlci1jb2xvcicsIGNvbG91cik7XG4gIH0sXG4gIHJlbW92ZUNvdXJzZTogZnVuY3Rpb24oZSkge1xuICAgIFRpbWV0YWJsZUFjdGlvbnMudXBkYXRlQ291cnNlcyh7aWQ6IHRoaXMucHJvcHMuaWQsIFxuICAgICAgICAgICAgc2VjdGlvbjogJycsIFxuICAgICAgICAgICAgcmVtb3Zpbmc6IHRydWV9KTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICB9LFxuXG59KTtcblxudmFyIENvdXJzZVJvc3RlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIC8vIHVzZSB0aGUgdGltZXRhYmxlIGZvciBzbG90cyBiZWNhdXNlIGl0IGNvbnRhaW5zIHRoZSBtb3N0IGluZm9ybWF0aW9uXG4gICAgaWYgKHRoaXMucHJvcHMudGltZXRhYmxlcy5sZW5ndGggPiAwKSB7XG4gICAgICB2YXIgc2xvdHMgPSB0aGlzLnByb3BzLnRpbWV0YWJsZXNbMF0uY291cnNlcy5tYXAoZnVuY3Rpb24oY291cnNlKSB7XG4gICAgICAgIHZhciBjb2xvdXIgPSAgQ09VUlNFX1RPX0NPTE9VUltjb3Vyc2UuY29kZV07XG5cbiAgICAgICAgcmV0dXJuIDxSb3N0ZXJTbG90IHsuLi5jb3Vyc2V9IHRvZ2dsZU1vZGFsPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsfSBrZXk9e2NvdXJzZS5jb2RlfSBjb2xvdXI9e2NvbG91cn0vPlxuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2xvdHMgPSBudWxsO1xuICAgIH1cbiAgICB2YXIgdHQgPSB0aGlzLnByb3BzLnRpbWV0YWJsZXMubGVuZ3RoID4gMCA/IHRoaXMucHJvcHMudGltZXRhYmxlc1swXSA6IG51bGw7XG4gICAgdmFyIG51bUNvdXJzZXMgPSAwO1xuICAgIHZhciB0b3RhbFNjb3JlID0gMDtcbiAgICBpZiAodGhpcy5wcm9wcy50aW1ldGFibGVzLmxlbmd0aCA+IDAgJiYgdGhpcy5wcm9wcy50aW1ldGFibGVzWzBdLmNvdXJzZXMubGVuZ3RoID4gMCApIHtcbiAgICAgIGZvciAoaj0wO2o8dGhpcy5wcm9wcy50aW1ldGFibGVzWzBdLmNvdXJzZXMubGVuZ3RoO2orKykge1xuICAgICAgICAgIGZvciAoaz0wO2s8dGhpcy5wcm9wcy50aW1ldGFibGVzWzBdLmNvdXJzZXNbal0uZXZhbHVhdGlvbnMubGVuZ3RoO2srKykge1xuICAgICAgICAgICAgbnVtQ291cnNlcysrO1xuICAgICAgICAgICAgdG90YWxTY29yZSArPSB0aGlzLnByb3BzLnRpbWV0YWJsZXNbMF0uY291cnNlc1tqXS5ldmFsdWF0aW9uc1trXS5zY29yZTtcbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBhdmdTY29yZUNvbnRlbnQgPSB0aGlzLnByb3BzLnRpbWV0YWJsZXMubGVuZ3RoID4gMCAmJiB0b3RhbFNjb3JlID4gMCAgPyAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInJhdGluZy13cmFwcGVyXCI+XG4gICAgICAgICAgPHA+QXZlcmFnZSBDb3Vyc2UgUmF0aW5nOjwvcD5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInN1Yi1yYXRpbmctd3JhcHBlclwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzdGFyLXJhdGluZ3Mtc3ByaXRlXCI+XG4gICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7d2lkdGg6IDEwMCp0b3RhbFNjb3JlLyg1Km51bUNvdXJzZXMpICsgXCIlXCJ9fSBjbGFzc05hbWU9XCJyYXRpbmdcIj48L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+KSA6IG51bGw7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY291cnNlLXJvc3RlciBjb3Vyc2UtbGlzdFwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNsZWFyZml4XCI+XG4gICAgICAgICAge3Nsb3RzfVxuICAgICAgICAgIHthdmdTY29yZUNvbnRlbnR9XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59KVxuXG52YXIgVGV4dGJvb2tSb3N0ZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIG1peGluczogW1JlZmx1eC5jb25uZWN0KFRpbWV0YWJsZVN0b3JlKV0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgaWYgKHRoaXMuc3RhdGUudGltZXRhYmxlcy5sZW5ndGggPiAwKSB7XG4gICAgICB0ZXh0Ym9va3MgPSBbXVxuICAgICAgIGZvciAoaT0wOyBpIDwgdGhpcy5zdGF0ZS50aW1ldGFibGVzW3RoaXMuc3RhdGUuY3VycmVudF9pbmRleF0uY291cnNlcy5sZW5ndGg7IGkrKykgIHtcbiAgICAgICAgICBmb3Ioaj0wOyBqIDwgdGhpcy5zdGF0ZS50aW1ldGFibGVzW3RoaXMuc3RhdGUuY3VycmVudF9pbmRleF0uY291cnNlc1tpXS50ZXh0Ym9va3MubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHRleHRib29rcy5wdXNoKHRoaXMuc3RhdGUudGltZXRhYmxlc1t0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXhdLmNvdXJzZXNbaV0udGV4dGJvb2tzW2pdKVxuICAgICAgICAgIH1cbiAgICAgICB9XG4gICAgICAgdmFyIHRiX2VsZW1lbnRzID0gdGV4dGJvb2tzLm1hcChmdW5jdGlvbih0Yikge1xuICAgICAgICAgIGlmICh0YlsnaW1hZ2VfdXJsJ10gPT09IFwiQ2Fubm90IGJlIGZvdW5kXCIpIHtcbiAgICAgICAgICAgIHZhciBpbWcgPSAnL3N0YXRpYy9pbWcvZGVmYXVsdF9jb3Zlci5qcGcnXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBpbWcgPSB0YlsnaW1hZ2VfdXJsJ11cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRiWyd0aXRsZSddID09IFwiQ2Fubm90IGJlIGZvdW5kXCIpIHtcbiAgICAgICAgICAgIHZhciB0aXRsZSA9IFwiI1wiICsgIHRiWydpc2JuJ11cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHRpdGxlID0gdGJbJ3RpdGxlJ11cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuICggXG4gICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJ0ZXh0Ym9va1wiIGtleT17dGJbJ2lkJ119IGhyZWY9e3RiWydkZXRhaWxfdXJsJ119IHRhcmdldD1cIl9ibGFua1wiPlxuICAgICAgICAgICAgICAgIDxpbWcgaGVpZ2h0PVwiMTI1XCIgc3JjPXtpbWd9Lz5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1vZHVsZVwiPlxuICAgICAgICAgICAgICAgICAgPGg2IGNsYXNzTmFtZT1cImxpbmUtY2xhbXBcIj57dGl0bGV9PC9oNj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiaHR0cHM6Ly9pbWFnZXMtbmEuc3NsLWltYWdlcy1hbWF6b24uY29tL2ltYWdlcy9HLzAxL2Fzc29jaWF0ZXMvcmVtb3RlLWJ1eS1ib3gvYnV5NS5fVjE5MjIwNzczOV8uZ2lmXCIgd2lkdGg9XCIxMjBcIiBoZWlnaHQ9XCIyOFwiIGJvcmRlcj1cIjBcIi8+XG4gICAgICAgICAgICA8L2E+KTtcbiAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgIHZhciBhZGRUb0NhcnQgPSB0aGlzLmdldEFkZEJ1dHRvbih0ZXh0Ym9va3MpXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB0Yl9lbGVtZW50cyA9IG51bGw7XG4gICAgICB2YXIgYWRkVG9DYXJ0ID0gbnVsbFxuICAgIH1cbiAgICB2YXIgbW9kYWwgPSBudWxsO1xuICAgIGlmICh0aGlzLnN0YXRlLnNob3dfbW9kYWwpIHtcbiAgICAgICAgbW9kYWwgPSA8U2ltcGxlTW9kYWwgaGVhZGVyPXtcIllvdXIgVGV4dGJvb2tzXCJ9XG4gICAgICAgICAgICAgICAgICAgc3R5bGVzPXt7YmFja2dyb3VuZENvbG9yOiBcIiNGREY1RkZcIiwgY29sb3I6IFwiIzAwMFwifX0gXG4gICAgICAgICAgICAgICAgICAgY29udGVudD17bnVsbH0vPlxuICAgIH1cbiAgICB2YXIgc2VlX2FsbCA9IG51bGw7XG4gICAgaWYgKHRiX2VsZW1lbnRzICE9IG51bGwgJiYgdGJfZWxlbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgc2VlX2FsbCA9ICg8ZGl2IGNsYXNzTmFtZT1cInZpZXctdGJzXCIgb25DbGljaz17dGhpcy50b2dnbGV9PlZpZXcgQWxsIFRleHRib29rczwvZGl2PilcbiAgICB9XG4gICAgdmFyIGNvdXJzZXMgPSB0aGlzLnN0YXRlLnRpbWV0YWJsZXMubGVuZ3RoID4gMCA/IHRoaXMuc3RhdGUudGltZXRhYmxlc1t0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXhdLmNvdXJzZXMgOiBudWxsXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY291cnNlLXJvc3RlciB0ZXh0Ym9vay1saXN0XCI+XG4gICAgICAgIDxTaW1wbGVNb2RhbCBoZWFkZXI9e1wiWW91ciBUZXh0Ym9va3NcIn1cbiAgICAgICAgICAga2V5PVwidGV4dGJvb2tcIlxuICAgICAgICAgICByZWY9XCJ0YnNcIlxuICAgICAgICAgICBzdHlsZXM9e3tiYWNrZ3JvdW5kQ29sb3I6IFwiI0ZERjVGRlwiLCBjb2xvcjogXCIjMDAwXCIsIG1heEhlaWdodDpcIjkwJVwiLCBtYXhXaWR0aDpcIjY1MHB4XCIsIG92ZXJmbG93WTogXCJzY3JvbGxcIn19IFxuICAgICAgICAgICBhbGxvd19kaXNhYmxlPXt0cnVlfVxuICAgICAgICAgICBjb250ZW50PXs8VGV4dGJvb2tMaXN0IFxuICAgICAgICAgICAgYWRkVG9DYXJ0PXthZGRUb0NhcnR9IFxuICAgICAgICAgICAgY291cnNlcz17Y291cnNlc30gXG4gICAgICAgICAgICBzY2hvb2w9e3RoaXMuc3RhdGUuc2Nob29sfS8+fS8+XG4gICAgICAgIHttb2RhbH1cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjbGVhcmZpeFwiPlxuICAgICAgICAgIHtzZWVfYWxsfVxuICAgICAgICAgIHt0Yl9lbGVtZW50c31cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH0sXG5cbiAgdG9nZ2xlOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnJlZnMudGJzLnRvZ2dsZSgpO1xuICB9LFxuXG4gIGdldEFkZEJ1dHRvbjogZnVuY3Rpb24odGV4dGJvb2tzKSB7XG4gICAgdmFyIGVudHJpZXMgPSB0ZXh0Ym9va3MubWFwKGZ1bmN0aW9uKHRiLGkpIHtcbiAgICAgIHZhciBhc2luID0gKC8uKkFTSU4lM0QoLiopLy5leGVjKHRiWydkZXRhaWxfdXJsJ10pKVsxXVxuICAgICAgcmV0dXJuICg8ZGl2IGtleT17aX0+XG4gICAgICA8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9e1wiQVNJTi5cIiArIGkgKyAxfSB2YWx1ZT17YXNpbn0vPlxuICAgICAgPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPXtcIlF1YW50aXR5LlwiKyBpICsgMX0gdmFsdWU9XCIxXCIvPjwvZGl2PilcbiAgICB9LmJpbmQodGhpcykpO1xuICAgIHZhciByZXQgPSAoXG4gICAgPGZvcm0gbWV0aG9kPVwiR0VUXCIgYWN0aW9uPVwiaHR0cDovL3d3dy5hbWF6b24uY29tL2dwL2F3cy9jYXJ0L2FkZC5odG1sXCIgdGFyZ2V0PVwiX2JsYW5rXCI+IFxuICAgICAgPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwiQVdTQWNjZXNzS2V5SWRcIiB2YWx1ZT1cIkFLSUFKR1VPWE4zQ09PWUJQVEhRXCIgLz4gXG4gICAgICA8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJBc3NvY2lhdGVUYWdcIiB2YWx1ZT1cInNlbWVzdGVybHktMjBcIiAvPlxuICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJ2aWV3LXRic1wiIHR5cGU9XCJzdWJtaXRcIj5cbiAgICAgICAgPGkgY2xhc3NOYW1lPVwiZmEgZmEtc2hvcHBpbmctY2FydFwiPjwvaT4gQWRkIEFsbCB0byBDYXJ0XG4gICAgICA8L2J1dHRvbj5cbiAgICAgIHtlbnRyaWVzfVxuICAgIDwvZm9ybT4pXG4gICAgcmV0dXJuIHJldDtcbiAgfSxcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgbWl4aW5zOiBbUmVmbHV4LmNvbm5lY3QoVGltZXRhYmxlU3RvcmUpXSxcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge3Nob3c6IGZhbHNlfTtcbiAgfSxcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKFxuXG4gICAgICA8ZGl2IHJlZj1cInNpZGViYXJcIiBjbGFzc05hbWU9XCJzaWRlLWNvbnRhaW5lclwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvc3Rlci1oZWFkZXJcIj5cbiAgICAgICAgICA8aDQ+WW91ciBTZW1lc3RlcjwvaDQ+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8Q291cnNlUm9zdGVyIHRvZ2dsZU1vZGFsPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsfSB0aW1ldGFibGVzPXt0aGlzLnN0YXRlLnRpbWV0YWJsZXN9Lz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3N0ZXItaGVhZGVyXCI+XG4gICAgICAgICAgPGg0PllvdXIgVGV4dGJvb2tzPC9oND5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxUZXh0Ym9va1Jvc3RlciAvPlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9LFxufSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge3Nob3duOiBmYWxzZX07XG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXY+PC9kaXY+XG5cdFx0KTtcblx0fSxcblxuXHR0b2dnbGU6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLnN0YXRlLnNob3duKSB7XG5cdFx0XHR0aGlzLmhpZGUoKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHR0aGlzLnNob3coKTtcblx0XHR9XG5cdH0sXG5cblx0c2hvdzogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNsb3NlX2J1dHRvbiA9IHRoaXMucHJvcHMuYWxsb3dfZGlzYWJsZSA/IFxuXHRcdCg8aSBvbkNsaWNrPXt0aGlzLmhpZGV9IGNsYXNzTmFtZT1cInJpZ2h0IGZhIGZhLXRpbWVzIGNsb3NlLWNvdXJzZS1tb2RhbFwiIC8+KSA6IG51bGxcblx0XHRSZWFjdERPTS5yZW5kZXIoXG4gIFx0XHRcdChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPXtcInNpbXBsZS1tb2RhbC13cmFwcGVyIFwiICsgdGhpcy5wcm9wcy5rZXl9PlxuXHRcdFx0XHQ8ZGl2IGlkPVwiZGltLXNjcmVlblwiIG9uQ2xpY2s9e3RoaXMubWF5YmVIaWRlfT48L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzaW1wbGUtbW9kYWxcIiBzdHlsZT17dGhpcy5wcm9wcy5zdHlsZXN9PlxuXHRcdFx0XHRcdDxoNiBjbGFzc05hbWU9XCJzaW1wbGUtbW9kYWwtaGVhZGVyXCI+e3RoaXMucHJvcHMuaGVhZGVyfSB7Y2xvc2VfYnV0dG9ufTwvaDY+XG5cdFx0XHRcdFx0PGhyIGNsYXNzTmFtZT1cInNpbXBsZS1tb2RhbC1zZXBhcmF0b3JcIi8+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzaW1wbGUtbW9kYWwtY29udGVudFwiPlxuXHRcdFx0XHRcdFx0e3RoaXMucHJvcHMuY29udGVudH1cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj4pLFxuICBcdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VtZXN0ZXJseS1tb2RhbCcpXG5cdFx0KTtcblx0XHQkKFwiI2RpbS1zY3JlZW5cIikuaGVpZ2h0KCQoZG9jdW1lbnQpLmhlaWdodCgpKVxuXHRcdHRoaXMuc2V0U3RhdGUoe3Nob3duOiB0cnVlfSk7XG5cdH0sXG5cblx0bWF5YmVIaWRlOiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5wcm9wcy5hbGxvd19kaXNhYmxlKSB7XG5cdFx0XHR0aGlzLmhpZGUoKTtcblx0XHR9XHRcblx0fSxcblxuXHRoaWRlOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoJChcIi5cIiArIHRoaXMucHJvcHMua2V5KS5sZW5ndGggPT0gMCkge3JldHVybjt9XG5cdFx0dmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZW1lc3Rlcmx5LW1vZGFsJyk7XG5cdFx0JChcIiNkaW0tc2NyZWVuXCIpLmZhZGVPdXQoODAwLCBmdW5jdGlvbigpIHtcblx0ICAgICAgICBSZWFjdERPTS51bm1vdW50Q29tcG9uZW50QXROb2RlKGNvbnRhaW5lcik7XG5cdFx0fSk7XG5cdFx0dmFyIHNlbCA9IFwiLnNpbXBsZS1tb2RhbFwiO1xuXG5cdFx0aWYgKCQoc2VsKS5vZmZzZXQoKS5sZWZ0IDwgMCkge1xuICAgICAgICAgICAgJChzZWwpLmNzcyhcImxlZnRcIiwgXCIxNTAlXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKCQoc2VsKS5vZmZzZXQoKS5sZWZ0ID4gJCgnYm9keScpLndpZHRoKCkpIHtcbiAgICAgICAgICAgICQoc2VsKS5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICBsZWZ0OiAnNTAlJyxcbiAgICAgICAgICAgIH0sIDgwMCApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJChzZWwpLmFuaW1hdGUoe1xuICAgICAgICAgICAgICAgIGxlZnQ6ICctMTUwJScsXG4gICAgICAgICAgICB9LCA4MDAgKTtcbiAgICAgICAgfVxuXHRcdHRoaXMuc2V0U3RhdGUoe3Nob3duOiBmYWxzZX0pO1xuXG5cdH0sXG5cblxuXG59KTtcbiIsInZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgVGltZXRhYmxlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xuXG5cbi8vIG1hcHMgYmFzZSBjb2xvdXIgb2Ygc2xvdCB0byBjb2xvdXIgb24gaGlnaGxpZ2h0XG5DT0xPVVJfVE9fSElHSExJR0hUID0ge1xuICAgIFwiI0ZENzQ3M1wiIDogXCIjRTI2QTZBXCIsXG4gICAgXCIjNDRCQkZGXCIgOiBcIiMyOEE0RUFcIixcbiAgICBcIiM0Q0Q0QjBcIiA6IFwiIzNEQkI5QVwiLFxuICAgIFwiIzg4NzBGRlwiIDogXCIjNzA1OUU2XCIsXG4gICAgXCIjRjlBRTc0XCIgOiBcIiNGNzk1NEFcIixcbiAgICBcIiNENERCQzhcIiA6IFwiI0I1QkZBM1wiLFxuICAgIFwiI0YxODJCNFwiIDogXCIjREU2OTlEXCIsXG4gICAgXCIjNzQ5OUEyXCIgOiBcIiM2NjhCOTRcIixcbiAgICBcIiNFN0Y3NkRcIiA6IFwiI0M0RDQ0RFwiLFxufSAvLyBjb25zaWRlciAjQ0YwMDBGLCAjZThmYWMzXG5DT1VSU0VfVE9fQ09MT1VSID0ge31cbi8vIGhvdyBiaWcgYSBzbG90IG9mIGhhbGYgYW4gaG91ciB3b3VsZCBiZSwgaW4gcGl4ZWxzXG52YXIgSEFMRl9IT1VSX0hFSUdIVCA9IDMwO1xuXG52YXIgU2xvdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge3Nob3dfYnV0dG9uczogZmFsc2V9O1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcGluID0gbnVsbCwgcmVtb3ZlX2J1dHRvbiA9IG51bGw7XG4gICAgICAgIHZhciBzbG90X3N0eWxlID0gdGhpcy5nZXRTbG90U3R5bGUoKTtcblxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5zaG93X2J1dHRvbnMpIHtcbiAgICAgICAgICAgIHBpbiA9IChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2xvdC1pbm5lciBib3R0b21cIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJ1dHRvbi1zdXJyb3VuZFwiIG9uQ2xpY2s9e3RoaXMucGluT3JVbnBpbkNvdXJzZX0gPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1sb2NrXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgICAgICAgcmVtb3ZlX2J1dHRvbiA9ICggPGRpdiBjbGFzc05hbWU9XCJzbG90LWlubmVyXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJidXR0b24tc3Vycm91bmRcIiBvbkNsaWNrPXt0aGlzLnJlbW92ZUNvdXJzZX0gPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS10aW1lcyByZW1vdmVcIj48L3NwYW4+XG4gICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2Pik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucHJvcHMucGlubmVkKSB7XG4gICAgICAgICAgICBwaW4gPSAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNsb3QtaW5uZXIgYm90dG9tXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJidXR0b24tc3Vycm91bmQgcGlubmVkXCIgb25DbGljaz17dGhpcy5waW5PclVucGluQ291cnNlfSA+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLWxvY2tcIj48L3NwYW4+XG4gICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2Pik7XG4gICAgICAgIH1cbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IFxuICAgICAgICAgICAgb25DbGljaz17dGhpcy5wcm9wcy50b2dnbGVNb2RhbCh0aGlzLnByb3BzLmNvdXJzZSl9XG4gICAgICAgICAgICBvbk1vdXNlRW50ZXI9e3RoaXMuaGlnaGxpZ2h0U2libGluZ3N9XG4gICAgICAgICAgICBvbk1vdXNlTGVhdmU9e3RoaXMudW5oaWdobGlnaHRTaWJsaW5nc31cbiAgICAgICAgICAgIGNsYXNzTmFtZT17XCJzbG90LW91dGVyIGZjLXRpbWUtZ3JpZC1ldmVudCBmYy1ldmVudCBzbG90IHNsb3QtXCIgKyB0aGlzLnByb3BzLmNvdXJzZX0gXG4gICAgICAgICAgICBzdHlsZT17c2xvdF9zdHlsZX0+XG4gICAgICAgICAgICB7cmVtb3ZlX2J1dHRvbn1cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtY29udGVudFwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRpbWVcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dGhpcy5wcm9wcy50aW1lX3N0YXJ0fSDigJMge3RoaXMucHJvcHMudGltZV9lbmR9PC9zcGFuPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10aXRsZSBzbG90LXRleHQtcm93XCI+e3RoaXMucHJvcHMuY29kZSArIFwiIFwiICsgdGhpcy5wcm9wcy5tZWV0aW5nX3NlY3Rpb259PC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdGl0bGUgc2xvdC10ZXh0LXJvd1wiPnt0aGlzLnByb3BzLm5hbWV9PC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIHtwaW59ICAgICAgICAgICAgXG4gICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG5cbiAgIC8qKlxuICAgICogUmV0dXJuIGFuIG9iamVjdCBjb250YWluaW5nIHN0eWxlIG9mIGEgc3BlY2lmaWMgc2xvdC4gU2hvdWxkIHNwZWNpZnkgYXRcbiAgICAqIGxlYXN0IHRoZSB0b3AgeS1jb29yZGluYXRlIGFuZCBoZWlnaHQgb2YgdGhlIHNsb3QsIGFzIHdlbGwgYXMgYmFja2dyb3VuZENvbG9yXG4gICAgKiB3aGlsZSB0YWtpbmcgaW50byBhY2NvdW50IGlmIHRoZXJlJ3MgYW4gb3ZlcmxhcHBpbmcgY29uZmxpY3RcbiAgICAqL1xuICAgIGdldFNsb3RTdHlsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzdGFydF9ob3VyICAgPSBwYXJzZUludCh0aGlzLnByb3BzLnRpbWVfc3RhcnQuc3BsaXQoXCI6XCIpWzBdKSxcbiAgICAgICAgICAgIHN0YXJ0X21pbnV0ZSA9IHBhcnNlSW50KHRoaXMucHJvcHMudGltZV9zdGFydC5zcGxpdChcIjpcIilbMV0pLFxuICAgICAgICAgICAgZW5kX2hvdXIgICAgID0gcGFyc2VJbnQodGhpcy5wcm9wcy50aW1lX2VuZC5zcGxpdChcIjpcIilbMF0pLFxuICAgICAgICAgICAgZW5kX21pbnV0ZSAgID0gcGFyc2VJbnQodGhpcy5wcm9wcy50aW1lX2VuZC5zcGxpdChcIjpcIilbMV0pO1xuXG4gICAgICAgIHZhciB0b3AgPSAoc3RhcnRfaG91ciAtIDgpKjUyICsgKHN0YXJ0X21pbnV0ZSkqKDI2LzMwKTtcbiAgICAgICAgdmFyIGJvdHRvbSA9IChlbmRfaG91ciAtIDgpKjUyICsgKGVuZF9taW51dGUpKigyNi8zMCkgLSAxO1xuICAgICAgICB2YXIgaGVpZ2h0ID0gYm90dG9tIC0gdG9wIC0gMjtcblxuICAgICAgICBpZiAodGhpcy5wcm9wcy5udW1fY29uZmxpY3RzID4gMSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5wcm9wcy50aW1lX3N0YXJ0LCB0aGlzLnByb3BzLnRpbWVfZW5kLCB0aGlzLnByb3BzLm51bV9jb25mbGljdHMpXG4gICAgICAgIH1cbiAgICAgICAgLy8gdGhlIGN1bXVsYXRpdmUgd2lkdGggb2YgdGhpcyBzbG90IGFuZCBhbGwgb2YgdGhlIHNsb3RzIGl0IGlzIGNvbmZsaWN0aW5nIHdpdGhcbiAgICAgICAgdmFyIHRvdGFsX3Nsb3Rfd2lkdGhzID0gOTkgLSAoNSAqIHRoaXMucHJvcHMuZGVwdGhfbGV2ZWwpO1xuICAgICAgICAvLyB0aGUgd2lkdGggb2YgdGhpcyBwYXJ0aWN1bGFyIHNsb3RcbiAgICAgICAgdmFyIHNsb3Rfd2lkdGhfcGVyY2VudGFnZSA9IHRvdGFsX3Nsb3Rfd2lkdGhzIC8gdGhpcy5wcm9wcy5udW1fY29uZmxpY3RzO1xuICAgICAgICAvLyB0aGUgYW1vdW50IG9mIGxlZnQgbWFyZ2luIG9mIHRoaXMgcGFydGljdWxhciBzbG90LCBpbiBwZXJjZW50YWdlXG4gICAgICAgIHZhciBwdXNoX2xlZnQgPSAodGhpcy5wcm9wcy5zaGlmdF9pbmRleCAqIHNsb3Rfd2lkdGhfcGVyY2VudGFnZSkgKyA1ICogdGhpcy5wcm9wcy5kZXB0aF9sZXZlbDtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgd2lkdGg6IHNsb3Rfd2lkdGhfcGVyY2VudGFnZSArIFwiJVwiLFxuICAgICAgICAgICAgdG9wOiB0b3AsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy5wcm9wcy5jb2xvdXIsXG4gICAgICAgICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIFwiICsgdGhpcy5wcm9wcy5jb2xvdXIsXG4gICAgICAgICAgICBsZWZ0OiBwdXNoX2xlZnQgKyBcIiVcIixcbiAgICAgICAgICAgIHpJbmRleDogMTAwICogdGhpcy5wcm9wcy5kZXB0aF9sZXZlbFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBoaWdobGlnaHRTaWJsaW5nczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3Nob3dfYnV0dG9uczogdHJ1ZX0pO1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbG91cnMoQ09MT1VSX1RPX0hJR0hMSUdIVFt0aGlzLnByb3BzLmNvbG91cl0pO1xuICAgIH0sXG4gICAgdW5oaWdobGlnaHRTaWJsaW5nczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3Nob3dfYnV0dG9uczogZmFsc2V9KTtcbiAgICAgICAgdGhpcy51cGRhdGVDb2xvdXJzKHRoaXMucHJvcHMuY29sb3VyKTtcbiAgICB9LFxuICAgIHBpbk9yVW5waW5Db3Vyc2U6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgVGltZXRhYmxlQWN0aW9ucy51cGRhdGVDb3Vyc2VzKHtpZDogdGhpcy5wcm9wcy5jb3Vyc2UsIFxuICAgICAgICAgICAgc2VjdGlvbjogdGhpcy5wcm9wcy5tZWV0aW5nX3NlY3Rpb24sIFxuICAgICAgICAgICAgcmVtb3Zpbmc6IGZhbHNlfSk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSxcbiAgICByZW1vdmVDb3Vyc2U6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgVGltZXRhYmxlQWN0aW9ucy51cGRhdGVDb3Vyc2VzKHtpZDogdGhpcy5wcm9wcy5jb3Vyc2UsIFxuICAgICAgICAgICAgc2VjdGlvbjogJycsIFxuICAgICAgICAgICAgcmVtb3Zpbmc6IHRydWV9KTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlQ29sb3VyczogZnVuY3Rpb24oY29sb3VyKSB7XG4gICAgICAgICQoXCIuc2xvdC1cIiArIHRoaXMucHJvcHMuY291cnNlKVxuICAgICAgICAgIC5jc3MoJ2JhY2tncm91bmQtY29sb3InLCBjb2xvdXIpXG4gICAgICAgICAgLmNzcygnYm9yZGVyLWNvbG9yJywgY29sb3VyKTtcbiAgICB9LFxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF5cyA9IFtcIk1cIiwgXCJUXCIsIFwiV1wiLCBcIlJcIiwgXCJGXCJdO1xuICAgICAgICB2YXIgc2xvdHNfYnlfZGF5ID0gdGhpcy5nZXRTbG90c0J5RGF5KCk7XG4gICAgICAgIHZhciBhbGxfc2xvdHMgPSBkYXlzLm1hcChmdW5jdGlvbihkYXkpIHtcbiAgICAgICAgICAgIHZhciBkYXlfc2xvdHMgPSBzbG90c19ieV9kYXlbZGF5XS5tYXAoZnVuY3Rpb24oc2xvdCkge1xuICAgICAgICAgICAgICAgIHZhciBwID0gdGhpcy5pc1Bpbm5lZChzbG90KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gPFNsb3Qgey4uLnNsb3R9IHRvZ2dsZU1vZGFsPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsfSBrZXk9e3Nsb3QuaWR9IHBpbm5lZD17cH0vPlxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBrZXk9e2RheX0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWV2ZW50LWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtkYXlfc2xvdHN9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpc1wiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICB7YWxsX3Nsb3RzfVxuICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICA8L3RhYmxlPlxuXG4gICAgICAgICk7XG4gICAgfSxcbiAgIFxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRheXMgPSB7MTogJ21vbicsIDI6ICd0dWUnLCAzOiAnd2VkJywgNDogJ3RodScsIDU6ICdmcmknfTtcbiAgICAgICAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICB2YXIgc2VsZWN0b3IgPSBcIi5mYy1cIiArIGRheXNbZC5nZXREYXkoKV07XG4gICAgICAgIC8vICQoc2VsZWN0b3IpLmFkZENsYXNzKFwiZmMtdG9kYXlcIik7XG4gICAgfSxcblxuICAgIGlzUGlubmVkOiBmdW5jdGlvbihzbG90KSB7XG4gICAgICAgIHZhciBjb21wYXJhdG9yID0gdGhpcy5wcm9wcy5jb3Vyc2VzX3RvX3NlY3Rpb25zW3Nsb3QuY291cnNlXVsnQyddO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5zY2hvb2wgPT0gXCJ1b2Z0XCIpIHtcbiAgICAgICAgICAgIGNvbXBhcmF0b3IgPSB0aGlzLnByb3BzLmNvdXJzZXNfdG9fc2VjdGlvbnNbc2xvdC5jb3Vyc2VdW3Nsb3QubWVldGluZ19zZWN0aW9uWzBdXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29tcGFyYXRvciA9PSBzbG90Lm1lZXRpbmdfc2VjdGlvbjtcbiAgICB9LFxuXG4gICAgZ2V0U2xvdHNCeURheTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzbG90c19ieV9kYXkgPSB7XG4gICAgICAgICAgICAnTSc6IFtdLFxuICAgICAgICAgICAgJ1QnOiBbXSxcbiAgICAgICAgICAgICdXJzogW10sXG4gICAgICAgICAgICAnUic6IFtdLFxuICAgICAgICAgICAgJ0YnOiBbXVxuICAgICAgICB9O1xuICAgICAgICBDT1VSU0VfVE9fQ09MT1VSID0ge307XG4gICAgICAgIGZvciAodmFyIGNvdXJzZSBpbiB0aGlzLnByb3BzLnRpbWV0YWJsZS5jb3Vyc2VzKSB7XG4gICAgICAgICAgICB2YXIgY3JzID0gdGhpcy5wcm9wcy50aW1ldGFibGUuY291cnNlc1tjb3Vyc2VdO1xuICAgICAgICAgICAgZm9yICh2YXIgc2xvdF9pZCBpbiBjcnMuc2xvdHMpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2xvdCA9IGNycy5zbG90c1tzbG90X2lkXTtcbiAgICAgICAgICAgICAgICB2YXIgY29sb3VyID0gT2JqZWN0LmtleXMoQ09MT1VSX1RPX0hJR0hMSUdIVClbY291cnNlXTtcbiAgICAgICAgICAgICAgICBzbG90W1wiY29sb3VyXCJdID0gY29sb3VyO1xuICAgICAgICAgICAgICAgIHNsb3RbXCJjb2RlXCJdID0gY3JzLmNvZGUudHJpbSgpO1xuICAgICAgICAgICAgICAgIHNsb3RbXCJuYW1lXCJdID0gY3JzLm5hbWU7XG4gICAgICAgICAgICAgICAgc2xvdHNfYnlfZGF5W3Nsb3QuZGF5XS5wdXNoKHNsb3QpO1xuICAgICAgICAgICAgICAgIENPVVJTRV9UT19DT0xPVVJbY3JzLmNvZGVdID0gY29sb3VyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzbG90c19ieV9kYXk7XG4gICAgfSxcblxufSk7XG4iLCJ2YXIgY291cnNlX2FjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL2NvdXJzZV9hY3Rpb25zLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZVN0b3JlKHtcbiAgbGlzdGVuYWJsZXM6IFtjb3Vyc2VfYWN0aW9uc10sXG5cbiAgZ2V0Q291cnNlSW5mbzogZnVuY3Rpb24oc2Nob29sLCBjb3Vyc2VfaWQpIHtcbiAgICB0aGlzLnRyaWdnZXIoe2xvYWRpbmc6IHRydWV9KTtcbiAgICAkLmdldChcIi9jb3Vyc2VzL1wiKyBzY2hvb2wgKyBcIi9pZC9cIiArIGNvdXJzZV9pZCwgXG4gICAgICAgICB7fSwgXG4gICAgICAgICBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHtpbmZvX2xvYWRpbmc6IGZhbHNlLCBjb3Vyc2VfaW5mbzogcmVzcG9uc2V9KTtcbiAgICAgICAgIH0uYmluZCh0aGlzKVxuICAgICk7XG5cbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7Y291cnNlX2luZm86IG51bGwsIGluZm9fbG9hZGluZzogdHJ1ZX07XG4gIH1cbn0pO1xuIiwidmFyIFRvYXN0ID0gcmVxdWlyZSgnLi4vdG9hc3QnKTtcbnZhciBUb2FzdEFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL3RvYXN0X2FjdGlvbnMuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWZsdXguY3JlYXRlU3RvcmUoe1xuICBsaXN0ZW5hYmxlczogW1RvYXN0QWN0aW9uc10sXG5cbiAgY3JlYXRlVG9hc3Q6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcbiAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvYXN0LWNvbnRhaW5lcicpO1xuICAgIFJlYWN0RE9NLnVubW91bnRDb21wb25lbnRBdE5vZGUoY29udGFpbmVyKTtcbiAgICBSZWFjdERPTS5yZW5kZXIoXG4gICAgICA8VG9hc3QgY29udGVudD17Y29udGVudH0gLz4sXG4gICAgICBjb250YWluZXJcbiAgICApO1xuICB9LFxuXG5cbn0pO1xuIiwidmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgVG9hc3RBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy90b2FzdF9hY3Rpb25zLmpzJyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvdGltZXRhYmxlX3V0aWwnKTtcblxuZnVuY3Rpb24gcmFuZG9tU3RyaW5nKGxlbmd0aCwgY2hhcnMpIHtcbiAgICB2YXIgcmVzdWx0ID0gJyc7XG4gICAgZm9yICh2YXIgaSA9IGxlbmd0aDsgaSA+IDA7IC0taSkgcmVzdWx0ICs9IGNoYXJzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGNoYXJzLmxlbmd0aCldO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5cblNJRCA9IHJhbmRvbVN0cmluZygzMCwgJyE/KCkqJl4lJCNAIVtdMDEyMzQ1Njc4OWFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVonKTtcblxuVFRfU1RBVEUgPSB7XG4gIHNjaG9vbDogXCJqaHVcIixcbiAgc2VtZXN0ZXI6IFwiU1wiLFxuICBjb3Vyc2VzX3RvX3NlY3Rpb25zOiB7fSxcbiAgcHJlZmVyZW5jZXM6IHtcbiAgICAnbm9fY2xhc3Nlc19iZWZvcmUnOiBmYWxzZSxcbiAgICAnbm9fY2xhc3Nlc19hZnRlcic6IGZhbHNlLFxuICAgICdsb25nX3dlZWtlbmQnOiBmYWxzZSxcbiAgICAnZ3JvdXBlZCc6IGZhbHNlLFxuICAgICdkb19yYW5raW5nJzogZmFsc2UsXG4gICAgJ3RyeV93aXRoX2NvbmZsaWN0cyc6IGZhbHNlXG4gIH0sXG4gIHNpZDogU0lELFxufVxuXG5TQ0hPT0xfTElTVCA9IFtcImpodVwiLCBcInVvZnRcIl07XG5cbi8vIGZsYWcgdG8gY2hlY2sgaWYgdGhlIHVzZXIganVzdCB0dXJuZWQgY29uZmxpY3RzIG9mZlxuQ09ORkxJQ1RfT0ZGID0gZmFsc2U7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZVN0b3JlKHtcbiAgbGlzdGVuYWJsZXM6IFthY3Rpb25zXSxcbiAgY291cnNlc190b19zZWN0aW9uczoge30sXG4gIGxvYWRpbmc6IGZhbHNlLFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRpbWV0YWJsZXM6IFtdLCBcbiAgICAgIHByZWZlcmVuY2VzOiBUVF9TVEFURS5wcmVmZXJlbmNlcyxcbiAgICAgIGNvdXJzZXNfdG9fc2VjdGlvbnM6IHt9LCBcbiAgICAgIGN1cnJlbnRfaW5kZXg6IC0xLCBcbiAgICAgIGNvbmZsaWN0X2Vycm9yOiBmYWxzZSxcbiAgICAgIGxvYWRpbmc6IGZhbHNlLCAvLyB0aW1ldGFibGVzIGxvYWRpbmdcbiAgICAgIGNvdXJzZXNfbG9hZGluZzogZmFsc2UsXG4gICAgICBzY2hvb2w6IFwiXCJ9O1xuICB9LFxuXG4gIHNldFNjaG9vbDogZnVuY3Rpb24obmV3X3NjaG9vbCkge1xuICAgIHZhciBzY2hvb2wgPSBTQ0hPT0xfTElTVC5pbmRleE9mKG5ld19zY2hvb2wpID4gLTEgPyBuZXdfc2Nob29sIDogXCJcIjtcbiAgICB2YXIgbmV3X3N0YXRlID0gdGhpcy5nZXRJbml0aWFsU3RhdGUoKTtcbiAgICBUVF9TVEFURS5zY2hvb2wgPSBzY2hvb2w7XG4gICAgbmV3X3N0YXRlLnNjaG9vbCA9IHNjaG9vbDtcbiAgICB0aGlzLnRyaWdnZXIobmV3X3N0YXRlKTtcbiAgfSxcbiAvKipcbiAgKiBVcGRhdGUgVFRfU1RBVEUgd2l0aCBuZXcgY291cnNlIHJvc3RlclxuICAqIEBwYXJhbSB7b2JqZWN0fSBuZXdfY291cnNlX3dpdGhfc2VjdGlvbiBjb250YWlucyBhdHRyaWJ1dGVkIGlkLCBzZWN0aW9uLCByZW1vdmluZ1xuICAqIEByZXR1cm4ge3ZvaWR9IGRvZXMgbm90IHJldHVybiBhbnl0aGluZywganVzdCB1cGRhdGVzIFRUX1NUQVRFXG4gICovXG4gIHVwZGF0ZUNvdXJzZXM6IGZ1bmN0aW9uKG5ld19jb3Vyc2Vfd2l0aF9zZWN0aW9uKSB7XG4gICAgaWYgKHRoaXMubG9hZGluZykge3JldHVybjt9IC8vIGlmIGxvYWRpbmcsIGRvbid0IHByb2Nlc3MuXG4gICAgdGhpcy5sb2FkaW5nID0gdHJ1ZTtcbiAgICB0aGlzLnRyaWdnZXIoe2xvYWRpbmc6dHJ1ZX0pO1xuXG4gICAgdmFyIHJlbW92aW5nID0gbmV3X2NvdXJzZV93aXRoX3NlY3Rpb24ucmVtb3Zpbmc7XG4gICAgdmFyIG5ld19jb3Vyc2VfaWQgPSBuZXdfY291cnNlX3dpdGhfc2VjdGlvbi5pZDtcbiAgICB2YXIgc2VjdGlvbiA9IG5ld19jb3Vyc2Vfd2l0aF9zZWN0aW9uLnNlY3Rpb247XG4gICAgdmFyIG5ld19zdGF0ZSA9ICQuZXh0ZW5kKHRydWUsIHt9LCBUVF9TVEFURSk7IC8vIGRlZXAgY29weSBvZiBUVF9TVEFURVxuICAgIHZhciBjX3RvX3MgPSBuZXdfc3RhdGUuY291cnNlc190b19zZWN0aW9ucztcbiAgICBpZiAoIXJlbW92aW5nKSB7IC8vIGFkZGluZyBjb3Vyc2VcbiAgICAgIGlmIChUVF9TVEFURS5zY2hvb2wgPT0gXCJqaHVcIikge1xuICAgICAgICBpZiAoY190b19zW25ld19jb3Vyc2VfaWRdKSB7XG4gICAgICAgICAgdmFyIG5ld19zZWN0aW9uID0gY190b19zW25ld19jb3Vyc2VfaWRdWydDJ10gIT0gXCJcIiA/IFwiXCIgOiBzZWN0aW9uO1xuICAgICAgICAgIGNfdG9fc1tuZXdfY291cnNlX2lkXVsnQyddID0gbmV3X3NlY3Rpb247XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY190b19zW25ld19jb3Vyc2VfaWRdID0geydMJzogJycsICdUJzogJycsICdQJzogJycsICdDJzogc2VjdGlvbn07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKFRUX1NUQVRFLnNjaG9vbCA9PSBcInVvZnRcIikge1xuICAgICAgICB2YXIgbG9ja2VkX3NlY3Rpb25zID0gY190b19zW25ld19jb3Vyc2VfaWRdID09IG51bGwgPyB7J0wnOiAnJywgJ1QnOiAnJywgJ1AnOiAnJywgJ0MnOiAnJ30gOiAvLyB0aGlzIGlzIHdoYXQgd2Ugd2FudCB0byBzZW5kIGlmIG5vdCBsb2NraW5nXG4gICAgICAgICAgY190b19zW25ld19jb3Vyc2VfaWRdO1xuICAgICAgICBpZiAoc2VjdGlvbiAmJiBzZWN0aW9uICE9IFwiXCIpIHtcbiAgICAgICAgICB2YXIgbmV3X3NlY3Rpb24gPSBzZWN0aW9uO1xuICAgICAgICAgIGlmIChjX3RvX3NbbmV3X2NvdXJzZV9pZF1bc2VjdGlvblswXV0gIT0gXCJcIikge25ld19zZWN0aW9uID0gXCJcIjt9IC8vIHVubG9ja2luZyBzaW5jZSBzZWN0aW9uIHByZXZpb3VzbHkgZXhpc3RlZFxuICAgICAgICAgIGxvY2tlZF9zZWN0aW9uc1tzZWN0aW9uWzBdXSA9IG5ld19zZWN0aW9uO1xuICAgICAgICB9XG4gICAgICAgIGNfdG9fc1tuZXdfY291cnNlX2lkXSA9IGxvY2tlZF9zZWN0aW9ucztcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7IC8vIHJlbW92aW5nIGNvdXJzZVxuICAgICAgZGVsZXRlIGNfdG9fc1tuZXdfY291cnNlX2lkXTtcbiAgICAgIGlmIChPYmplY3Qua2V5cyhjX3RvX3MpLmxlbmd0aCA9PSAwKSB7IC8vIHJlbW92ZWQgbGFzdCBjb3Vyc2VcbiAgICAgICAgICBUVF9TVEFURS5jb3Vyc2VzX3RvX3NlY3Rpb25zID0ge307XG4gICAgICAgICAgdmFyIHJlcGxhY2VkID0gdGhpcy5nZXRJbml0aWFsU3RhdGUoKTtcbiAgICAgICAgICByZXBsYWNlZC5zY2hvb2wgPSBUVF9TVEFURS5zY2hvb2w7XG4gICAgICAgICAgdGhpcy5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgdGhpcy50cmlnZ2VyKHJlcGxhY2VkKTtcbiAgICAgICAgICByZXR1cm47ICBcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5tYWtlUmVxdWVzdChuZXdfc3RhdGUpO1xuICB9LFxuXG4gLyoqXG4gICogVXBkYXRlIFRUX1NUQVRFIHdpdGggbmV3IHByZWZlcmVuY2VzXG4gICogQHBhcmFtIHtzdHJpbmd9IHByZWZlcmVuY2U6IHRoZSBwcmVmZXJlbmNlIHRoYXQgaXMgYmVpbmcgdXBkYXRlZFxuICAqIEBwYXJhbSBuZXdfdmFsdWU6IHRoZSBuZXcgdmFsdWUgb2YgdGhlIHNwZWNpZmllZCBwcmVmZXJlbmNlXG4gICogQHJldHVybiB7dm9pZH0gZG9lc24ndCByZXR1cm4gYW55dGhpbmcsIGp1c3QgdXBkYXRlcyBUVF9TVEFURVxuICAqL1xuICB1cGRhdGVQcmVmZXJlbmNlczogZnVuY3Rpb24ocHJlZmVyZW5jZSwgbmV3X3ZhbHVlKSB7XG4gICAgdmFyIG5ld19zdGF0ZSA9ICQuZXh0ZW5kKHRydWUsIHt9LCBUVF9TVEFURSk7IC8vIGRlZXAgY29weSBvZiBUVF9TVEFURVxuICAgIGlmIChwcmVmZXJlbmNlID09ICd0cnlfd2l0aF9jb25mbGljdHMnICYmIG5ld192YWx1ZSA9PSBmYWxzZSkge1xuICAgICAgQ09ORkxJQ1RfT0ZGID0gdHJ1ZTtcbiAgICB9XG4gICAgbmV3X3N0YXRlLnByZWZlcmVuY2VzW3ByZWZlcmVuY2VdID0gbmV3X3ZhbHVlO1xuICAgIHRoaXMudHJpZ2dlcih7cHJlZmVyZW5jZXM6IG5ld19zdGF0ZS5wcmVmZXJlbmNlc30pO1xuICAgIHRoaXMubWFrZVJlcXVlc3QobmV3X3N0YXRlKTtcbiAgfSxcblxuICAvLyBNYWtlcyBhIFBPU1QgcmVxdWVzdCB0byB0aGUgYmFja2VuZCB3aXRoIFRUX1NUQVRFXG4gIG1ha2VSZXF1ZXN0OiBmdW5jdGlvbihuZXdfc3RhdGUpIHtcbiAgICB0aGlzLnRyaWdnZXIoe2xvYWRpbmc6IHRydWV9KTtcbiAgICAkLnBvc3QoJy8nLCBKU09OLnN0cmluZ2lmeShuZXdfc3RhdGUpLCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgaWYgKHJlc3BvbnNlLmVycm9yKSB7IC8vIGVycm9yIGZyb20gVVJMIG9yIGxvY2FsIHN0b3JhZ2VcbiAgICAgICAgICBpZihVdGlsLmJyb3dzZXJTdXBwb3J0c0xvY2FsU3RvcmFnZSgpKSB7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnZGF0YScpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBUVF9TVEFURS5jb3Vyc2VzX3RvX3NlY3Rpb25zID0ge307XG4gICAgICAgICAgdmFyIHJlcGxhY2VkID0gdGhpcy5nZXRJbml0aWFsU3RhdGUoKTtcbiAgICAgICAgICByZXBsYWNlZC5zY2hvb2wgPSBUVF9TVEFURS5zY2hvb2w7XG4gICAgICAgICAgdGhpcy50cmlnZ2VyKHJlcGxhY2VkKTtcbiAgICAgICAgICByZXR1cm47IC8vIHN0b3AgcHJvY2Vzc2luZyBoZXJlXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc3BvbnNlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBUVF9TVEFURSA9IG5ld19zdGF0ZTsgLy9vbmx5IHVwZGF0ZSBzdGF0ZSBpZiBzdWNjZXNzZnVsXG4gICAgICAgICAgdmFyIGluZGV4ID0gMDtcbiAgICAgICAgICBpZiAobmV3X3N0YXRlLmluZGV4ICYmIG5ld19zdGF0ZS5pbmRleCA8IHJlc3BvbnNlLmxlbmd0aCkge1xuICAgICAgICAgICAgaW5kZXggPSBuZXdfc3RhdGUuaW5kZXg7XG4gICAgICAgICAgICBkZWxldGUgbmV3X3N0YXRlWydpbmRleCddO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnRyaWdnZXIoe1xuICAgICAgICAgICAgICB0aW1ldGFibGVzOiByZXNwb25zZSxcbiAgICAgICAgICAgICAgY291cnNlc190b19zZWN0aW9uczogVFRfU1RBVEUuY291cnNlc190b19zZWN0aW9ucyxcbiAgICAgICAgICAgICAgY3VycmVudF9pbmRleDogaW5kZXgsXG4gICAgICAgICAgICAgIGxvYWRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgICBwcmVmZXJlbmNlczogVFRfU1RBVEUucHJlZmVyZW5jZXNcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmICghJC5pc0VtcHR5T2JqZWN0KFRUX1NUQVRFLmNvdXJzZXNfdG9fc2VjdGlvbnMpKSB7IC8vIGNvbmZsaWN0XG4gICAgICAgICAgLy8gaWYgdHVybmluZyBjb25mbGljdHMgb2ZmIGxlZCB0byBhIGNvbmZsaWN0LCByZXByb21wdCB1c2VyXG4gICAgICAgICAgaWYgKENPTkZMSUNUX09GRikge1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHtcbiAgICAgICAgICAgICAgbG9hZGluZzogZmFsc2UsXG4gICAgICAgICAgICAgIGNvbmZsaWN0X2Vycm9yOiBmYWxzZSxcbiAgICAgICAgICAgICAgcHJlZmVyZW5jZXM6IFRUX1NUQVRFLnByZWZlcmVuY2VzXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgVG9hc3RBY3Rpb25zLmNyZWF0ZVRvYXN0KFwiUGxlYXNlIHJlbW92ZSBzb21lIGNvdXJzZXMgYmVmb3JlIHR1cm5pbmcgb2ZmIEFsbG93IENvbmZsaWN0c1wiKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHtcbiAgICAgICAgICAgICAgbG9hZGluZzogZmFsc2UsXG4gICAgICAgICAgICAgIGNvbmZsaWN0X2Vycm9yOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFRvYXN0QWN0aW9ucy5jcmVhdGVUb2FzdChcIlRoYXQgY291cnNlIGNhdXNlZCBhIGNvbmZsaWN0ISBUcnkgYWdhaW4gd2l0aCB0aGUgQWxsb3cgQ29uZmxpY3RzIHByZWZlcmVuY2UgdHVybmVkIG9uLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy50cmlnZ2VyKHtsb2FkaW5nOiBmYWxzZX0pO1xuICAgICAgICB9XG4gICAgICAgIENPTkZMSUNUX09GRiA9IGZhbHNlO1xuICAgIH0uYmluZCh0aGlzKSk7XG4gIH0sXG5cblxuICBsb2FkUHJlc2V0VGltZXRhYmxlOiBmdW5jdGlvbih1cmxfZGF0YSkge1xuICAgIHZhciBjb3Vyc2VzID0gdXJsX2RhdGEuc3BsaXQoXCImXCIpO1xuICAgIHZhciBzY2hvb2wgPSBVdGlsLmdldFVuaGFzaGVkU3RyaW5nKGNvdXJzZXMuc2hpZnQoKSk7XG4gICAgdmFyIHByZWZzID0gY291cnNlcy5zaGlmdCgpO1xuICAgIHZhciBwcmVmZXJlbmNlc19hcnJheSA9IHByZWZzLnNwbGl0KFwiO1wiKTtcbiAgICB2YXIgcHJlZl9vYmogPSB7fTtcbiAgICBmb3IgKHZhciBrIGluIHByZWZlcmVuY2VzX2FycmF5KSB7XG4gICAgICB2YXIgcHJlZl93aXRoX3ZhbCA9IHByZWZlcmVuY2VzX2FycmF5W2tdLnNwbGl0KFwiPVwiKTsgLy9lLmcuIFtcImFsbG93X2NvbmZsaWN0c1wiLCBcImZhbHNlXCJdXG4gICAgICB2YXIgcHJlZiA9IFV0aWwuZ2V0VW5oYXNoZWRTdHJpbmcocHJlZl93aXRoX3ZhbFswXSk7XG4gICAgICB2YXIgdmFsID0gQm9vbGVhbihVdGlsLmdldFVuaGFzaGVkU3RyaW5nKHByZWZfd2l0aF92YWxbMV0pID09PSBcInRydWVcIik7XG5cbiAgICAgIHByZWZfb2JqW3ByZWZdID0gKHZhbCk7XG4gICAgfVxuICAgIHRoaXMudHJpZ2dlcih7bG9hZGluZzogdHJ1ZSwgc2Nob29sOiBzY2hvb2wsIHByZWZlcmVuY2VzOnByZWZfb2JqfSk7XG4gICAgVFRfU1RBVEUucHJlZmVyZW5jZXMgPSBwcmVmX29iajtcbiAgICBUVF9TVEFURS5zY2hvb2wgPSBzY2hvb2w7XG4gICAgVFRfU1RBVEUuaW5kZXggPSBwYXJzZUludChVdGlsLmdldFVuaGFzaGVkU3RyaW5nKGNvdXJzZXMuc2hpZnQoKSkpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291cnNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNvdXJzZV9pbmZvID0gY291cnNlc1tpXS5zcGxpdChcIitcIik7XG4gICAgICB2YXIgYyA9IHBhcnNlSW50KFV0aWwuZ2V0VW5oYXNoZWRTdHJpbmcoY291cnNlX2luZm8uc2hpZnQoKSkpO1xuXG4gICAgICBUVF9TVEFURS5jb3Vyc2VzX3RvX3NlY3Rpb25zW2NdID0geydMJzogJycsICdUJzogJycsICdQJzogJycsICdDJzogJyd9O1xuICAgICAgaWYgKGNvdXJzZV9pbmZvLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjb3Vyc2VfaW5mby5sZW5ndGg7IGorKykge1xuICAgICAgICAgIHZhciBzZWN0aW9uID0gVXRpbC5nZXRVbmhhc2hlZFN0cmluZyhjb3Vyc2VfaW5mb1tqXSk7XG4gICAgICAgICAgaWYgKHNjaG9vbCA9PSBcInVvZnRcIikge1xuICAgICAgICAgICAgVFRfU1RBVEUuY291cnNlc190b19zZWN0aW9uc1tjXVtzZWN0aW9uWzBdXSA9IHNlY3Rpb247XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKHNjaG9vbCA9PSBcImpodVwiKSB7XG4gICAgICAgICAgICBUVF9TVEFURS5jb3Vyc2VzX3RvX3NlY3Rpb25zW2NdWydDJ10gPSBzZWN0aW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLm1ha2VSZXF1ZXN0KFRUX1NUQVRFKTtcbiAgfSxcblxuICBzZXRDb3Vyc2VzTG9hZGluZzogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy50cmlnZ2VyKHtjb3Vyc2VzX2xvYWRpbmc6IHRydWV9KTtcbiAgfSxcbiAgc2V0Q291cnNlc0RvbmVMb2FkaW5nOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnRyaWdnZXIoe2NvdXJzZXNfbG9hZGluZzogZmFsc2V9KTtcbiAgfSxcbiAgc2V0Q3VycmVudEluZGV4OiBmdW5jdGlvbihuZXdfaW5kZXgpIHtcbiAgICB0aGlzLnRyaWdnZXIoe2N1cnJlbnRfaW5kZXg6IG5ld19pbmRleH0pO1xuICB9LFxuXG59KTtcblxuJCh3aW5kb3cpLm9uKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbigpIHtcbiAgJC5hamF4KHtcbiAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgIGFzeW5jOiBmYWxzZSxcbiAgICAgIHVybDogJy9leGl0JyxcbiAgICAgIGRhdGE6IHtzaWQ6IFNJRH1cbiAgfSk7XG59KTtcblxuIiwidmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBUaW1ldGFibGVTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgU2ltcGxlTW9kYWwgPSByZXF1aXJlKCcuL3NpbXBsZV9tb2RhbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgbWl4aW5zOiBbUmVmbHV4LmNvbm5lY3QoVGltZXRhYmxlU3RvcmUpXSxcblxuICBnZXRBZGRvbnM6IGZ1bmN0aW9uKCkge1xuICBcdHZhciBhZGRvbnMgPSBbXG4gIFx0XHR7XG4gIFx0XHRcdGxpbms6IFwiaHR0cDovL2Ftem4udG8vMU96RmFPUVwiLFxuICBcdFx0XHRpbWc6IFwiaHR0cDovL2VjeC5pbWFnZXMtYW1hem9uLmNvbS9pbWFnZXMvSS83MTUwOHN0WHA3TC5fU1g1MjJfLmpwZ1wiLFxuICBcdFx0XHR0aXRsZTogXCJNZWFkIFNwaXJhbCBOb3RlYm9va1wiLFxuICBcdFx0XHRwcmljZTogXCIkOC45OFwiLFxuICBcdFx0XHRwcmltZV9lbGlnaWJsZTogdHJ1ZVxuICBcdFx0fSxcbiAgXHRcdHtcbiAgXHRcdFx0bGluazogXCJodHRwOi8vYW16bi50by8xWnVRUkxUXCIsXG4gIFx0XHRcdGltZzogXCJodHRwOi8vZWN4LmltYWdlcy1hbWF6b24uY29tL2ltYWdlcy9JLzYxVjZ3b0VkbmdMLl9TWTY3OV8uanBnXCIsXG4gIFx0XHRcdHRpdGxlOiBcIkJJQyBIaWdobGlnaHRlcnNcIixcbiAgXHRcdFx0cHJpY2U6IFwiJDQuMDRcIixcbiAgXHRcdFx0cHJpbWVfZWxpZ2libGU6IHRydWVcbiAgXHRcdH0sXG4gIFx0XHR7XG4gIFx0XHRcdGxpbms6IFwiaHR0cDovL2Ftem4udG8vMVp1UjNkWVwiLFxuICBcdFx0XHRpbWc6IFwiaHR0cDovL2VjeC5pbWFnZXMtYW1hem9uLmNvbS9pbWFnZXMvSS84MXFqZXd2S25kTC5fU1g1MjJfLmpwZ1wiLFxuICBcdFx0XHR0aXRsZTogXCIyNSBQb2NrZXQgRm9sZGVyc1wiLFxuICBcdFx0XHRwcmljZTogXCIkNi45OFwiLFxuICBcdFx0XHRwcmltZV9lbGlnaWJsZTogdHJ1ZVxuICBcdFx0fVxuICBcdF1cbiAgXHR2YXIgYWRkb25zSFRNTCA9IGFkZG9ucy5tYXAoZnVuY3Rpb24oaXRlbSwgaSkge1xuICBcdFx0dmFyIGltZyA9IDxpbWcgaGVpZ2h0PVwiMTI1XCIgc3JjPXtpdGVtLmltZ30vPlxuICBcdFx0dmFyIHRpdGxlID0gPGg2IGNsYXNzTmFtZT1cImxpbmUtY2xhbXAgdGl0bGVcIj57aXRlbS50aXRsZX08L2g2PlxuICBcdFx0dmFyIHByaWNlID0gPGg2IGNsYXNzTmFtZT1cInByaWNlXCI+e2l0ZW0ucHJpY2V9PC9oNj5cbiAgXHRcdHZhciBwcmltZV9sb2dvID0gaXRlbS5wcmltZV9lbGlnaWJsZSA/IDxpbWcgY2xhc3NOYW1lPVwicHJpbWVcIiBoZWlnaHQ9XCIxNXB4XCIgc3JjPVwiL3N0YXRpYy9pbWcvcHJpbWUucG5nXCIvPiA6IG51bGxcbiAgXHRcdHJldHVybiAoXG4gIFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiYWRkb24gY3VzdG9tLWFkZG9uXCIga2V5PXtpfT5cbiAgXHRcdFx0XHQ8YSBocmVmPXtpdGVtLmxpbmt9IHRhcmdldD1cIl9ibGFua1wiPiBcblx0ICBcdFx0XHRcdHtpbWd9XG5cdCAgXHRcdFx0XHR7dGl0bGV9XG5cdCAgXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInByaWNlLXByaW1lLWNvbnRhaW5lclwiPlxuXHRcdCAgXHRcdFx0XHR7cHJpY2V9XG5cdFx0ICBcdFx0XHRcdHtwcmltZV9sb2dvfVxuXHRcdCAgXHRcdFx0PC9kaXY+XG5cdCAgXHRcdFx0PC9hPlxuICBcdFx0XHQ8L2Rpdj4pXG4gIFx0fS5iaW5kKHRoaXMpKTtcbiAgXHRyZXR1cm4gKDxkaXYgY2xhc3NOYW1lPVwiYWRkb24td3JhcHBlclwiPnthZGRvbnNIVE1MfTwvZGl2PilcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICBcdHZhciBodG1sID0gdGhpcy5wcm9wcy5jb3Vyc2VzLm1hcChmdW5jdGlvbihjLCBpKSB7XG4gIFx0XHRpZiAoIGMudGV4dGJvb2tzLmxlbmd0aCA+IDAgKSB7XG4gIFx0XHQgIHZhciBpbm5lcl9odG1sID0gYy50ZXh0Ym9va3MubWFwKGZ1bmN0aW9uKHRiKSB7XG5cdCAgXHRcdCAgaWYgKHRiWydpbWFnZV91cmwnXSA9PT0gXCJDYW5ub3QgYmUgZm91bmRcIikge1xuXHQgICAgICAgICAgICB2YXIgaW1nID0gJy9zdGF0aWMvaW1nL2RlZmF1bHRfY292ZXIuanBnJ1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgdmFyIGltZyA9IHRiWydpbWFnZV91cmwnXVxuXHQgICAgICAgICAgfVxuXHQgICAgICAgICAgaWYgKHRiWyd0aXRsZSddID09IFwiQ2Fubm90IGJlIGZvdW5kXCIpIHtcblx0ICAgICAgICAgICAgdmFyIHRpdGxlID0gXCIjXCIgKyAgdGJbJ2lzYm4nXVxuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgdmFyIHRpdGxlID0gdGJbJ3RpdGxlJ11cblx0ICAgICAgICAgIH1cblx0ICAgICAgICAgIHJldHVybiAoIFxuXHQgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJ0ZXh0Ym9va1wiIGhyZWY9e3RiWydkZXRhaWxfdXJsJ119IHRhcmdldD1cIl9ibGFua1wiIGtleT17dGJbJ2lkJ119PlxuXHQgICAgICAgICAgICAgICAgPGltZyBoZWlnaHQ9XCIxMjVcIiBzcmM9e2ltZ30vPlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtb2R1bGVcIj5cblx0ICAgICAgICAgICAgICAgICAgPGg2IGNsYXNzTmFtZT1cImxpbmUtY2xhbXBcIj57dGl0bGV9PC9oNj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGltZyBzcmM9XCJodHRwczovL2ltYWdlcy1uYS5zc2wtaW1hZ2VzLWFtYXpvbi5jb20vaW1hZ2VzL0cvMDEvYXNzb2NpYXRlcy9yZW1vdGUtYnV5LWJveC9idXk1Ll9WMTkyMjA3NzM5Xy5naWZcIiB3aWR0aD1cIjEyMFwiIGhlaWdodD1cIjI4XCIgYm9yZGVyPVwiMFwiLz5cblx0ICAgICAgICAgICAgPC9hPik7XG4gIFx0XHRcdH0uYmluZCh0aGlzKSk7XG4gICAgICAgIHZhciBoZWFkZXIgPSB0aGlzLnByb3BzLnNjaG9vbCA9PSBcInVvZnRcIiA/IChcbiAgICAgICAgICAgICAgPGg2PntjLmNvZGV9OiB7Yy5uYW1lfTwvaDY+ICkgOiBcbiAgICAgICAgICAgICAoPGg2PntjLm5hbWV9PC9oNj4pO1xuXHQgIFx0XHRyZXR1cm4gKFxuXHQgIFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwidGV4dGJvb2stbGlzdC1lbnRyeVwiIGtleT17aX0+XG5cdCAgXHRcdFx0XHR7aGVhZGVyfVxuXHQgIFx0XHRcdFx0IDxkaXYgY2xhc3NOYW1lPVwiY291cnNlLXJvc3RlciB0ZXh0Ym9vay1saXN0XCI+XG5cdCAgXHRcdFx0XHRcdHtpbm5lcl9odG1sfVxuXHQgIFx0XHRcdFx0PC9kaXY+XG5cdCAgXHRcdFx0PC9kaXY+KVxuICBcdFx0fVxuICBcdFx0ZWxzZSB7XG4gIFx0XHRcdHJldHVybiBudWxsXG4gIFx0XHR9XG4gIFx0fS5iaW5kKHRoaXMpKTtcbiAgICByZXR1cm4gKFxuICAgIFx0PGRpdiBjbGFzc05hbWU9XCJ0ZXh0Ym9vay1saXN0LXdyYXBwZXJcIj5cbiAgICAgICAge3RoaXMucHJvcHMuYWRkVG9DYXJ0fVxuICAgIFx0XHR7aHRtbH1cbiAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJ0ZXh0Ym9vay1saXN0LWVudHJ5XCI+XG4gIFx0XHRcdFx0PGg2PlBvcHVsYXIgQWRkb25zPC9oNj5cbiAgICBcdFx0XHR7dGhpcy5nZXRBZGRvbnMoKX1cbiAgICBcdFx0PC9kaXY+XG4gICAgXHQ8L2Rpdj4pXG4gIH0sXG5cbn0pOyIsInZhciBTbG90TWFuYWdlciA9IHJlcXVpcmUoJy4vc2xvdF9tYW5hZ2VyJyk7XG52YXIgUGFnaW5hdGlvbiA9IHJlcXVpcmUoJy4vcGFnaW5hdGlvbicpO1xudmFyIFVwZGF0ZVRpbWV0YWJsZXNTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzJyk7XG52YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcycpO1xudmFyIFRvYXN0QWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy90b2FzdF9hY3Rpb25zJyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC90aW1ldGFibGVfdXRpbCcpO1xudmFyIE5ld1BhZ2luYXRpb24gPSByZXF1aXJlKCcuL25ld19wYWdpbmF0aW9uJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBtaXhpbnM6IFtSZWZsdXguY29ubmVjdChVcGRhdGVUaW1ldGFibGVzU3RvcmUpXSxcblxuICBzZXRJbmRleDogZnVuY3Rpb24obmV3X2luZGV4KSB7XG4gICAgcmV0dXJuKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChuZXdfaW5kZXggPj0gMCAmJiBuZXdfaW5kZXggPCB0aGlzLnN0YXRlLnRpbWV0YWJsZXMubGVuZ3RoKSB7XG4gICAgICAgIFRpbWV0YWJsZUFjdGlvbnMuc2V0Q3VycmVudEluZGV4KG5ld19pbmRleCk7XG4gICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICBnZXRTaGFyZUxpbms6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsaW5rID0gd2luZG93LmxvY2F0aW9uLmhvc3QgKyBcIi9cIjtcbiAgICB2YXIgZGF0YSA9IHRoaXMuZ2V0RGF0YSgpO1xuICAgIHJldHVybiBsaW5rICsgZGF0YTtcbiAgfSxcbiAgZ2V0RGF0YTogZnVuY3Rpb24oKSB7XG4gIHJldHVybiBVdGlsLmdldExpbmtEYXRhKHRoaXMuc3RhdGUuc2Nob29sLFxuICAgICAgdGhpcy5zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zLFxuICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4LCB0aGlzLnN0YXRlLnByZWZlcmVuY2VzKTtcbiAgfSxcbiAgZ2V0RW5kSG91cjogZnVuY3Rpb24oKSB7XG4gICAgLy8gZ2V0cyB0aGUgZW5kIGhvdXIgb2YgdGhlIGN1cnJlbnQgdGltZXRhYmxlXG4gICAgdmFyIG1heF9lbmRfaG91ciA9IDE4O1xuICAgIGlmICghdGhpcy5oYXNUaW1ldGFibGVzKCkpIHtcbiAgICAgIHJldHVybiBtYXhfZW5kX2hvdXI7XG4gICAgfVxuICAgIHZhciBjb3Vyc2VzID0gdGhpcy5zdGF0ZS50aW1ldGFibGVzW3RoaXMuc3RhdGUuY3VycmVudF9pbmRleF0uY291cnNlcztcbiAgICBmb3IgKHZhciBjb3Vyc2VfaW5kZXggaW4gY291cnNlcykge1xuICAgICAgdmFyIGNvdXJzZSA9IGNvdXJzZXNbY291cnNlX2luZGV4XTtcbiAgICAgIGZvciAodmFyIHNsb3RfaW5kZXggaW4gY291cnNlLnNsb3RzKSB7XG4gICAgICAgIHZhciBzbG90ID0gY291cnNlLnNsb3RzW3Nsb3RfaW5kZXhdO1xuICAgICAgICB2YXIgZW5kX2hvdXIgPSBwYXJzZUludChzbG90LnRpbWVfZW5kLnNwbGl0KFwiOlwiKVswXSk7XG4gICAgICAgIG1heF9lbmRfaG91ciA9IE1hdGgubWF4KG1heF9lbmRfaG91ciwgZW5kX2hvdXIpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWF4X2VuZF9ob3VyO1xuXG4gIH0sXG5cbiAgZ2V0SG91clJvd3M6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBtYXhfZW5kX2hvdXIgPSB0aGlzLmdldEVuZEhvdXIoKTtcbiAgICB2YXIgcm93cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSA4OyBpIDw9IG1heF9lbmRfaG91cjsgaSsrKSB7IC8vIG9uZSByb3cgZm9yIGVhY2ggaG91ciwgc3RhcnRpbmcgZnJvbSA4YW1cbiAgICAgIHZhciB0aW1lID0gaSArIFwiYW1cIjtcbiAgICAgIGlmIChpID49IDEyKSB7IC8vIHRoZSBwbSBob3Vyc1xuICAgICAgICB2YXIgaG91ciA9IChpIC0gMTIpID4gMCA/IGkgLSAxMiA6IGk7XG4gICAgICAgIHRpbWUgPSBob3VyICsgXCJwbVwiO1xuICAgICAgfVxuICAgICAgcm93cy5wdXNoKFxuICAgICAgICAgICg8dHIga2V5PXt0aW1lfT5cbiAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPnt0aW1lfTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgIDwvdHI+KVxuICAgICAgKTsgIFxuICAgICAgLy8gZm9yIHRoZSBoYWxmIGhvdXIgcm93XG4gICAgICByb3dzLnB1c2goXG4gICAgICAgICAgKDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiIGtleT17dGltZSArIFwiLWhhbGZcIn0+XG4gICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgIDwvdHI+KVxuICAgICAgKTtcblxuICAgIH1cblxuICAgIHJldHVybiByb3dzO1xuICB9LFxuXG5cbiAgaGFzVGltZXRhYmxlczogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGUudGltZXRhYmxlcy5sZW5ndGggPiAwO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaGFzX3RpbWV0YWJsZXMgPSB0aGlzLmhhc1RpbWV0YWJsZXMoKTtcbiAgICAgIHZhciBzbG90X21hbmFnZXIgPSAhaGFzX3RpbWV0YWJsZXMgPyBudWxsIDpcbiAgICAgICAoPFNsb3RNYW5hZ2VyIHRvZ2dsZU1vZGFsPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsfSBcbiAgICAgICAgICAgICAgICAgICAgIHRpbWV0YWJsZT17dGhpcy5zdGF0ZS50aW1ldGFibGVzW3RoaXMuc3RhdGUuY3VycmVudF9pbmRleF19XG4gICAgICAgICAgICAgICAgICAgICBjb3Vyc2VzX3RvX3NlY3Rpb25zPXt0aGlzLnN0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnN9XG4gICAgICAgICAgICAgICAgICAgICBzY2hvb2w9e3RoaXMuc3RhdGUuc2Nob29sfS8+KTtcblxuICAgICAgdmFyIGhvdXJzID0gdGhpcy5nZXRIb3VyUm93cygpO1xuICAgICAgdmFyIG9wYWNpdHkgPSB0aGlzLnN0YXRlLmxvYWRpbmcgPyB7b3BhY2l0eTogXCIwLjVcIn0gOiB7fTtcbiAgICAgIHZhciBoZWlnaHQgPSAoNTcyICsgKHRoaXMuZ2V0RW5kSG91cigpIC0gMTgpKjUyKSArIFwicHhcIjtcbiAgICAgIHJldHVybiAoXG5cbiAgICAgICAgICA8ZGl2IGlkPVwiY2FsZW5kYXJcIiBjbGFzc05hbWU9XCJmYyBmYy1sdHIgZmMtdW50aGVtZWRcIiBzdHlsZT17b3BhY2l0eX0+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdG9vbGJhclwiPlxuICAgICAgICAgICAgICAgIDxOZXdQYWdpbmF0aW9uIFxuICAgICAgICAgICAgICAgICAgY291bnQ9e3RoaXMuc3RhdGUudGltZXRhYmxlcy5sZW5ndGh9IFxuICAgICAgICAgICAgICAgICAgbmV4dD17dGhpcy5zZXRJbmRleCh0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXggKyAxKX0gXG4gICAgICAgICAgICAgICAgICBwcmV2PXt0aGlzLnNldEluZGV4KHRoaXMuc3RhdGUuY3VycmVudF9pbmRleCAtIDEpfVxuICAgICAgICAgICAgICAgICAgc2V0SW5kZXg9e3RoaXMuc2V0SW5kZXh9XG4gICAgICAgICAgICAgICAgICBjdXJyZW50X2luZGV4PXt0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXh9Lz5cbiAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnkgcmlnaHQgY2FsZW5kYXItZnVuY3Rpb25cIlxuICAgICAgICAgICAgICAgICAgIGRhdGEtY2xpcGJvYXJkLXRleHQ9e3RoaXMuZ2V0U2hhcmVMaW5rKCl9PlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZnVpLWNsaXBcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtY2xlYXJcIj48L2Rpdj5cblxuXG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdmlldy1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXZpZXcgZmMtYWdlbmRhV2Vlay12aWV3IGZjLWFnZW5kYS12aWV3XCI+XG4gICAgICAgICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgICAgIDx0aGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXJvdyBmYy13aWRnZXQtaGVhZGVyXCIgaWQ9XCJjdXN0b20td2lkZ2V0LWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXdpZGdldC1oZWFkZXJcIj48L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJmYy1kYXktaGVhZGVyIGZjLXdpZGdldC1oZWFkZXIgZmMtbW9uXCI+TW9uIDwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWRheS1oZWFkZXIgZmMtd2lkZ2V0LWhlYWRlciBmYy10dWVcIj5UdWUgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwiZmMtZGF5LWhlYWRlciBmYy13aWRnZXQtaGVhZGVyIGZjLXdlZFwiPldlZCA8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJmYy1kYXktaGVhZGVyIGZjLXdpZGdldC1oZWFkZXIgZmMtdGh1XCI+VGh1IDwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWRheS1oZWFkZXIgZmMtd2lkZ2V0LWhlYWRlciBmYy1mcmlcIj5GcmkgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGhlYWQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDwvdGhlYWQ+XG5cbiAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWRheS1ncmlkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWNvbnRlbnQtc2tlbGV0b25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXNcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10aW1lLWdyaWQtY29udGFpbmVyIGZjLXNjcm9sbGVyXCIgaWQ9XCJjYWxlbmRhci1pbm5lclwiIHN0eWxlPXt7aGVpZ2h0OiBoZWlnaHR9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRpbWUtZ3JpZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1iZ1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1kYXkgZmMtd2lkZ2V0LWNvbnRlbnQgZmMtbW9uXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWRheSBmYy13aWRnZXQtY29udGVudCBmYy10dWVcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtZGF5IGZjLXdpZGdldC1jb250ZW50IGZjLXdlZFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1kYXkgZmMtd2lkZ2V0LWNvbnRlbnQgZmMtdGh1XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWRheSBmYy13aWRnZXQtY29udGVudCBmYy1mcmlcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXNsYXRzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aG91cnN9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGhyIGNsYXNzTmFtZT1cImZjLXdpZGdldC1oZWFkZXJcIiBpZD1cIndpZGdldC1oclwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWNvbnRlbnQtc2tlbGV0b25cIiBpZD1cInNsb3QtbWFuYWdlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7c2xvdF9tYW5hZ2VyfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICk7XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjbGlwID0gbmV3IENsaXBib2FyZCgnLmNhbGVuZGFyLWZ1bmN0aW9uJyk7XG4gICAgY2xpcC5vbignc3VjY2VzcycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIFRvYXN0QWN0aW9ucy5jcmVhdGVUb2FzdChcIkxpbmsgY29waWVkIHRvIGNsaXBib2FyZCFcIik7XG4gICAgfSk7XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICBpZihVdGlsLmJyb3dzZXJTdXBwb3J0c0xvY2FsU3RvcmFnZSgpKSB7XG4gICAgICBpZiAodGhpcy5zdGF0ZS50aW1ldGFibGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gc2F2ZSBuZXdseSBnZW5lcmF0ZWQgY291cnNlcyB0byBsb2NhbCBzdG9yYWdlXG4gICAgICAgIHZhciBuZXdfZGF0YSA9IHRoaXMuZ2V0RGF0YSgpO1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnZGF0YScsIG5ld19kYXRhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdkYXRhJyk7XG4gICAgICB9XG4gICAgfSBcblxuICB9LFxuXG5cbn0pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHt2aXNpYmxlOiB0cnVlfTtcblx0fSxcdFx0XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCF0aGlzLnN0YXRlLnZpc2libGUpIHtyZXR1cm4gbnVsbDt9XG5cdFx0cmV0dXJuIChcblx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlbS10b2FzdC13cmFwcGVyIHRvYXN0aW5nXCI+XG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlbS10b2FzdFwiPnt0aGlzLnByb3BzLmNvbnRlbnR9PC9kaXY+XG5cdFx0PC9kaXY+XG5cdFx0KTtcblx0fSxcblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAodGhpcy5fcmVhY3RJbnRlcm5hbEluc3RhbmNlKSB7IC8vIGlmIG1vdW50ZWQgc3RpbGxcblx0XHRcdFx0dGhpcy5zZXRTdGF0ZSh7dmlzaWJsZTogZmFsc2V9KTtcblx0XHRcdH1cblx0XHR9LmJpbmQodGhpcyksIDQwMDApO1xuXHR9LFxuXG59KTtcbiIsInZhciBoYXNoaWRzID0gbmV3IEhhc2hpZHMoXCJ4OThhczdkaGcmaCphc2tkal5oYXMha2o/eHo8ITlcIik7XG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0Z2V0TGlua0RhdGE6IGZ1bmN0aW9uKHNjaG9vbCwgY291cnNlc190b19zZWN0aW9ucywgaW5kZXgsIHByZWZlcmVuY2VzKSB7XG5cdFx0aWYgKE9iamVjdC5rZXlzKGNvdXJzZXNfdG9fc2VjdGlvbnMpLmxlbmd0aCA9PSAwKSB7cmV0dXJuIFwiXCI7fVxuXHQgICAgdmFyIGRhdGEgPSB0aGlzLmdldEhhc2hlZFN0cmluZyhzY2hvb2wpICsgXCImXCI7XG5cdCAgICBmb3IgKHZhciBwcmVmIGluIHByZWZlcmVuY2VzKSB7XG5cdCAgICBcdHZhciBlbmNvZGVkX3AgPSB0aGlzLmdldEhhc2hlZFN0cmluZyhwcmVmKTtcblx0ICAgIFx0dmFyIGVuY29kZWRfdmFsID0gdGhpcy5nZXRIYXNoZWRTdHJpbmcocHJlZmVyZW5jZXNbcHJlZl0pO1xuXHQgICAgXHRkYXRhICs9IGVuY29kZWRfcCArIFwiPVwiICsgZW5jb2RlZF92YWwgKyBcIjtcIjtcblx0ICAgIH1cblx0ICAgIGRhdGEgPSBkYXRhLnNsaWNlKDAsIC0xKTtcblx0ICAgIGRhdGEgKz0gXCImXCIgKyB0aGlzLmdldEhhc2hlZFN0cmluZyhpbmRleCkgKyBcIiZcIjtcblx0ICAgIHZhciBjX3RvX3MgPSBjb3Vyc2VzX3RvX3NlY3Rpb25zO1xuXHQgICAgZm9yICh2YXIgY291cnNlX2lkIGluIGNfdG9fcykge1xuXHQgICAgICB2YXIgZW5jb2RlZF9jb3Vyc2VfaWQgPSB0aGlzLmdldEhhc2hlZFN0cmluZyhjb3Vyc2VfaWQpO1xuXHQgICAgICBkYXRhICs9IGVuY29kZWRfY291cnNlX2lkO1xuXG5cdCAgICAgIHZhciBtYXBwaW5nID0gY190b19zW2NvdXJzZV9pZF07XG5cdCAgICAgIGZvciAodmFyIHNlY3Rpb25faGVhZGluZyBpbiBtYXBwaW5nKSB7IC8vIGkuZSAnTCcsICdUJywgJ1AnLCAnUydcblx0ICAgICAgICBpZiAobWFwcGluZ1tzZWN0aW9uX2hlYWRpbmddICE9IFwiXCIpIHtcblx0ICAgICAgICAgIHZhciBlbmNvZGVkX3NlY3Rpb24gPSB0aGlzLmdldEhhc2hlZFN0cmluZyhtYXBwaW5nW3NlY3Rpb25faGVhZGluZ10pO1xuXHQgICAgICAgICAgZGF0YSArPSBcIitcIiArIGVuY29kZWRfc2VjdGlvbjsgLy8gZGVsaW1pdGVyIGZvciBzZWN0aW9ucyBsb2NrZWRcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblx0ICAgICAgZGF0YSArPSBcIiZcIjsgLy8gZGVsaW1pdGVyIGZvciBjb3Vyc2VzXG5cdCAgICB9XG5cdCAgICBkYXRhID0gZGF0YS5zbGljZSgwLCAtMSk7XG5cdCAgICBpZiAoZGF0YS5sZW5ndGggPCAzKSB7ZGF0YSA9IFwiXCI7fVxuXG5cdCAgICByZXR1cm4gZGF0YTtcblx0fSxcblxuXHRnZXRIYXNoZWRTdHJpbmc6IGZ1bmN0aW9uKHgpIHtcblx0XHR4ID0gU3RyaW5nKHgpO1xuXHRcdHZhciBoZXhlZCA9IEJ1ZmZlcih4KS50b1N0cmluZygnaGV4Jyk7XG4gICAgXHR2YXIgZW5jb2RlZF94ID0gaGFzaGlkcy5lbmNvZGVIZXgoaGV4ZWQpO1xuICAgIFx0aWYgKCFlbmNvZGVkX3ggfHwgZW5jb2RlZF94ID09IFwiXCIpIHtcbiAgICBcdFx0Y29uc29sZS5sb2coeCk7XG4gICAgXHR9XG4gICAgXHRyZXR1cm4gZW5jb2RlZF94O1xuXHR9LFxuXG5cdGdldFVuaGFzaGVkU3RyaW5nOiBmdW5jdGlvbih4KSB7XG5cdFx0dmFyIGRlY29kZWRIZXggPSBoYXNoaWRzLmRlY29kZUhleCh4KTtcblx0XHR2YXIgc3RyaW5nID0gQnVmZmVyKGRlY29kZWRIZXgsICdoZXgnKS50b1N0cmluZygndXRmOCcpO1xuXHRcdHJldHVybiBzdHJpbmc7XG5cdH0sXG5cblx0YnJvd3NlclN1cHBvcnRzTG9jYWxTdG9yYWdlOiBmdW5jdGlvbigpIHtcblx0XHR0cnkge1xuICAgXHRcdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJ0ZXN0XCIsIFwidGVzdFwiKTtcbiAgIFx0XHRcdGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKFwidGVzdFwiKTtcbiAgIFx0XHRcdHJldHVybiB0cnVlO1xuICBcdFx0fSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICBcdFx0XHRyZXR1cm4gZmFsc2U7XG4gXHRcdH1cblx0fSxcblxufVxuIl19
