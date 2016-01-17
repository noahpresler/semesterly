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

ReactDOM.render(
  React.createElement(Root, null),
  document.getElementById('page')
);

var data = window.location.pathname.substring(1); // loading timetable data from url
if (!data && typeof(Storage) !== "undefined") { // didn't find in URL, try local storage
    data = localStorage.getItem('data');
} 
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
		var click_notice = this.props.eval_info.length == 0 ? (React.createElement("div", {id: "empty-intro"}, "No course evaluations for this course yet")) : (React.createElement("div", {id: "click-intro"}, "Click an evaluation item above to read the comments"));
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
		return recomendations
	},

	expandRecomendations: function() {

	},

	getTextbooks: function() {
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
    return {first_displayed: 0};
  },

  changePage: function(direction) {
      return (function(event) {
       var current = this.props.current_index,
           count = this.props.count;
       // calculate the new first_displayed button (timetable)
       var new_first = current + (9*direction) - (current % 9);
       if (new_first >= 0 && new_first < count) {
        this.props.setIndex(new_first)();
       }
    }.bind(this));
  },

    
	render: function() {
    	var options = [], count = this.props.count, current = this.props.current_index;
    	if (count <= 1) { return null; } // don't display if there aren't enough schedules
    	var first = current - (current % 9); // round down to nearest multiple of 9
    	var limit = Math.min(first + 9, count);
    	for (var i = first; i < limit; i++) {
     	 var className = this.props.current_index == i ? "active" : "";
      		options.push(
        		React.createElement("li", {key: i, className: "sem-page " + className, onClick: this.props.setIndex(i)}, 
             		 i + 1
       			));
  		}
		return (
			React.createElement("div", {className: "sem-pagination"}, 
				React.createElement("div", {className: "sem-pagination-nav nav-double nav-double-prev", onClick: this.changePage(-1)}, 
					React.createElement("i", {className: "fa fa-angle-double-left sem-pagination-prev sem-pagination-icon"})
				), 
				React.createElement("div", {className: "sem-pagination-nav", onClick: this.props.prev}, 
					React.createElement("i", {className: "fa fa-angle-left sem-pagination-prev sem-pagination-icon"})
				), 
				React.createElement("ol", {className: "sem-pages"}, 
					options
				), 
				React.createElement("div", {className: "sem-pagination-nav", onClick: this.props.next}, 
					React.createElement("i", {className: "fa fa-angle-right sem-pagination-next sem-pagination-icon"})
				), 
				React.createElement("div", {className: "sem-pagination-nav nav-double nav-double-next", onClick: this.changePage(1)}, 
					React.createElement("i", {className: "fa fa-angle-double-right sem-pagination-next sem-pagination-icon"})
				)
			)
		);
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
    var school_selector = null;
    var loader = !(this.state.loading || this.state.courses_loading) ? null :
      (  React.createElement("div", {className: "spinner"}, 
            React.createElement("div", {className: "rect1"}), 
            React.createElement("div", {className: "rect2"}), 
            React.createElement("div", {className: "rect3"}), 
            React.createElement("div", {className: "rect4"}), 
            React.createElement("div", {className: "rect5"})
        ));
    if (this.state.school == "") {
      school_selector = (
      React.createElement(SimpleModal, {header: "Semester.ly | Welcome", 
                   styles: {backgroundColor: "#FDF5FF", color: "#000"}, 
                   content: React.createElement(SchoolList, {setSchool: this.setSchool})})
      );}
    return (
      React.createElement("div", {id: "root"}, 
        school_selector, 
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
        )
      )
    );
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
    that = this;
    var results = this.state.courses.filter(function(c) {
      return (that.isSubsequence(c.name.toLowerCase(),query) || 
             that.isSubsequence(c.name.toLowerCase(),opt_query) ||
             c.code.toLowerCase().indexOf(opt_query) > -1 ||
             c.name.toLowerCase().indexOf(opt_query) > -1 ||
             c.name.toLowerCase().indexOf(query) > -1);
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
var TimetableStore = require('./stores/update_timetables.js')

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
          React.createElement("div", {className: "fc-title slot-text-row"}, this.props.name)
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

})

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
            React.createElement("div", {className: "textbook", key: tb['id']}, 
                React.createElement("img", {height: "125", src: img}), 
                React.createElement("div", {className: "module"}, 
                  React.createElement("h6", {className: "line-clamp"}, title)
                  ), 
                React.createElement("a", {href: tb['detail_url'], target: "_blank"}, 
                  React.createElement("img", {src: "https://images-na.ssl-images-amazon.com/images/G/01/associates/remote-buy-box/buy5._V192207739_.gif", width: "120", height: "28", border: "0"})
                )
            ));
       }.bind(this));
    } else {
      var tb_elements = null;
    }
    return (
      React.createElement("div", {className: "course-roster textbook-list"}, 
        React.createElement("div", {className: "clearfix"}, 
          tb_elements
        )
      )
    )
  }
})

module.exports = React.createClass({displayName: "exports",
  mixins: [Reflux.connect(TimetableStore)],

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
  }
});

},{"./stores/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/simple_modal.jsx":[function(require,module,exports){
module.exports = React.createClass({displayName: "exports",
	
	render: function() {
		return (
			React.createElement("div", null, 
			 	React.createElement("div", {id: "dim-screen"}), 
				React.createElement("div", {className: "simple-modal", style: this.props.styles}, 
					React.createElement("h6", {className: "simple-modal-header"}, this.props.header), 
					React.createElement("hr", {className: "simple-modal-separator"}), 
					React.createElement("div", {className: "simple-modal-content"}, 
						this.props.content
					)
				)
			)

		);
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
          if(typeof(Storage) !== "undefined") {
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
        } else if (TT_STATE.courses_to_sections != {}) { // conflict
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

},{"../actions/toast_actions.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/toast_actions.js","../actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","../util/timetable_util":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/util/timetable_util.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/timetable.jsx":[function(require,module,exports){
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
                React.createElement(Pagination, {
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
    if(typeof(Storage) !== "undefined") {
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

}

}).call(this,require("buffer").Buffer)

},{"buffer":"/Users/rohandas/Desktop/semesterly/node_modules/browserify/node_modules/buffer/index.js"}]},{},["/Users/rohandas/Desktop/semesterly/static/js/new_timetable/app.jsx"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaXNhcnJheS9pbmRleC5qcyIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvYWN0aW9ucy9jb3Vyc2VfYWN0aW9ucy5qcyIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvYWN0aW9ucy90b2FzdF9hY3Rpb25zLmpzIiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzIiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9hcHAuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9jb250cm9sX2Jhci5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL2V2YWx1YXRpb25zLmpzeCIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvbG9hZGVyLmpzeCIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvbW9kYWxfY29udGVudC5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL25ld19wYWdpbmF0aW9uLmpzeCIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvcGFnaW5hdGlvbi5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3ByZWZlcmVuY2VfbWVudS5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3Jvb3QuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zY2hvb2xfbGlzdC5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3NlYXJjaF9iYXIuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zZWN0aW9uX3Nsb3QuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zaWRlX2Jhci5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3NpbXBsZV9tb2RhbC5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3Nsb3RfbWFuYWdlci5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3N0b3Jlcy9jb3Vyc2VfaW5mby5qcyIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc3RvcmVzL3RvYXN0X3N0b3JlLmpzIiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMiLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3RpbWV0YWJsZS5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3RvYXN0LmpzeCIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvdXRpbC90aW1ldGFibGVfdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVnREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDekMsSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTLElBQUksRUFBRSxFQUFFO01BQ2xDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDZjtLQUNELE9BQU8sU0FBUyxDQUFDO0FBQ3RCLEVBQUU7O0NBRUQsaUJBQWlCLEVBQUUsU0FBUyxDQUFDLEVBQUU7RUFDOUIsSUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUN0QyxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztFQUN4RCxPQUFPLE1BQU0sQ0FBQztBQUNoQixFQUFFOztDQUVEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLXByb3RvICovXG5cbid1c2Ugc3RyaWN0J1xuXG52YXIgYmFzZTY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJylcbnZhciBpZWVlNzU0ID0gcmVxdWlyZSgnaWVlZTc1NCcpXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoJ2lzYXJyYXknKVxuXG5leHBvcnRzLkJ1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5TbG93QnVmZmVyID0gU2xvd0J1ZmZlclxuZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFUyA9IDUwXG5CdWZmZXIucG9vbFNpemUgPSA4MTkyIC8vIG5vdCB1c2VkIGJ5IHRoaXMgaW1wbGVtZW50YXRpb25cblxudmFyIHJvb3RQYXJlbnQgPSB7fVxuXG4vKipcbiAqIElmIGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGA6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBVc2UgT2JqZWN0IGltcGxlbWVudGF0aW9uIChtb3N0IGNvbXBhdGlibGUsIGV2ZW4gSUU2KVxuICpcbiAqIEJyb3dzZXJzIHRoYXQgc3VwcG9ydCB0eXBlZCBhcnJheXMgYXJlIElFIDEwKywgRmlyZWZveCA0KywgQ2hyb21lIDcrLCBTYWZhcmkgNS4xKyxcbiAqIE9wZXJhIDExLjYrLCBpT1MgNC4yKy5cbiAqXG4gKiBEdWUgdG8gdmFyaW91cyBicm93c2VyIGJ1Z3MsIHNvbWV0aW1lcyB0aGUgT2JqZWN0IGltcGxlbWVudGF0aW9uIHdpbGwgYmUgdXNlZCBldmVuXG4gKiB3aGVuIHRoZSBicm93c2VyIHN1cHBvcnRzIHR5cGVkIGFycmF5cy5cbiAqXG4gKiBOb3RlOlxuICpcbiAqICAgLSBGaXJlZm94IDQtMjkgbGFja3Mgc3VwcG9ydCBmb3IgYWRkaW5nIG5ldyBwcm9wZXJ0aWVzIHRvIGBVaW50OEFycmF5YCBpbnN0YW5jZXMsXG4gKiAgICAgU2VlOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTU0MzguXG4gKlxuICogICAtIFNhZmFyaSA1LTcgbGFja3Mgc3VwcG9ydCBmb3IgY2hhbmdpbmcgdGhlIGBPYmplY3QucHJvdG90eXBlLmNvbnN0cnVjdG9yYCBwcm9wZXJ0eVxuICogICAgIG9uIG9iamVjdHMuXG4gKlxuICogICAtIENocm9tZSA5LTEwIGlzIG1pc3NpbmcgdGhlIGBUeXBlZEFycmF5LnByb3RvdHlwZS5zdWJhcnJheWAgZnVuY3Rpb24uXG4gKlxuICogICAtIElFMTAgaGFzIGEgYnJva2VuIGBUeXBlZEFycmF5LnByb3RvdHlwZS5zdWJhcnJheWAgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBhcnJheXMgb2ZcbiAqICAgICBpbmNvcnJlY3QgbGVuZ3RoIGluIHNvbWUgc2l0dWF0aW9ucy5cblxuICogV2UgZGV0ZWN0IHRoZXNlIGJ1Z2d5IGJyb3dzZXJzIGFuZCBzZXQgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYCB0byBgZmFsc2VgIHNvIHRoZXlcbiAqIGdldCB0aGUgT2JqZWN0IGltcGxlbWVudGF0aW9uLCB3aGljaCBpcyBzbG93ZXIgYnV0IGJlaGF2ZXMgY29ycmVjdGx5LlxuICovXG5CdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCA9IGdsb2JhbC5UWVBFRF9BUlJBWV9TVVBQT1JUICE9PSB1bmRlZmluZWRcbiAgPyBnbG9iYWwuVFlQRURfQVJSQVlfU1VQUE9SVFxuICA6IHR5cGVkQXJyYXlTdXBwb3J0KClcblxuZnVuY3Rpb24gdHlwZWRBcnJheVN1cHBvcnQgKCkge1xuICBmdW5jdGlvbiBCYXIgKCkge31cbiAgdHJ5IHtcbiAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkoMSlcbiAgICBhcnIuZm9vID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfVxuICAgIGFyci5jb25zdHJ1Y3RvciA9IEJhclxuICAgIHJldHVybiBhcnIuZm9vKCkgPT09IDQyICYmIC8vIHR5cGVkIGFycmF5IGluc3RhbmNlcyBjYW4gYmUgYXVnbWVudGVkXG4gICAgICAgIGFyci5jb25zdHJ1Y3RvciA9PT0gQmFyICYmIC8vIGNvbnN0cnVjdG9yIGNhbiBiZSBzZXRcbiAgICAgICAgdHlwZW9mIGFyci5zdWJhcnJheSA9PT0gJ2Z1bmN0aW9uJyAmJiAvLyBjaHJvbWUgOS0xMCBsYWNrIGBzdWJhcnJheWBcbiAgICAgICAgYXJyLnN1YmFycmF5KDEsIDEpLmJ5dGVMZW5ndGggPT09IDAgLy8gaWUxMCBoYXMgYnJva2VuIGBzdWJhcnJheWBcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbmZ1bmN0aW9uIGtNYXhMZW5ndGggKCkge1xuICByZXR1cm4gQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRcbiAgICA/IDB4N2ZmZmZmZmZcbiAgICA6IDB4M2ZmZmZmZmZcbn1cblxuLyoqXG4gKiBDbGFzczogQnVmZmVyXG4gKiA9PT09PT09PT09PT09XG4gKlxuICogVGhlIEJ1ZmZlciBjb25zdHJ1Y3RvciByZXR1cm5zIGluc3RhbmNlcyBvZiBgVWludDhBcnJheWAgdGhhdCBhcmUgYXVnbWVudGVkXG4gKiB3aXRoIGZ1bmN0aW9uIHByb3BlcnRpZXMgZm9yIGFsbCB0aGUgbm9kZSBgQnVmZmVyYCBBUEkgZnVuY3Rpb25zLiBXZSB1c2VcbiAqIGBVaW50OEFycmF5YCBzbyB0aGF0IHNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0IHJldHVybnNcbiAqIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIEJ5IGF1Z21lbnRpbmcgdGhlIGluc3RhbmNlcywgd2UgY2FuIGF2b2lkIG1vZGlmeWluZyB0aGUgYFVpbnQ4QXJyYXlgXG4gKiBwcm90b3R5cGUuXG4gKi9cbmZ1bmN0aW9uIEJ1ZmZlciAoYXJnKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBCdWZmZXIpKSB7XG4gICAgLy8gQXZvaWQgZ29pbmcgdGhyb3VnaCBhbiBBcmd1bWVudHNBZGFwdG9yVHJhbXBvbGluZSBpbiB0aGUgY29tbW9uIGNhc2UuXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSByZXR1cm4gbmV3IEJ1ZmZlcihhcmcsIGFyZ3VtZW50c1sxXSlcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcihhcmcpXG4gIH1cblxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpcy5sZW5ndGggPSAwXG4gICAgdGhpcy5wYXJlbnQgPSB1bmRlZmluZWRcbiAgfVxuXG4gIC8vIENvbW1vbiBjYXNlLlxuICBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIHtcbiAgICByZXR1cm4gZnJvbU51bWJlcih0aGlzLCBhcmcpXG4gIH1cblxuICAvLyBTbGlnaHRseSBsZXNzIGNvbW1vbiBjYXNlLlxuICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZnJvbVN0cmluZyh0aGlzLCBhcmcsIGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogJ3V0ZjgnKVxuICB9XG5cbiAgLy8gVW51c3VhbC5cbiAgcmV0dXJuIGZyb21PYmplY3QodGhpcywgYXJnKVxufVxuXG5mdW5jdGlvbiBmcm9tTnVtYmVyICh0aGF0LCBsZW5ndGgpIHtcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aCA8IDAgPyAwIDogY2hlY2tlZChsZW5ndGgpIHwgMClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoYXRbaV0gPSAwXG4gICAgfVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21TdHJpbmcgKHRoYXQsIHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycgfHwgZW5jb2RpbmcgPT09ICcnKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIC8vIEFzc3VtcHRpb246IGJ5dGVMZW5ndGgoKSByZXR1cm4gdmFsdWUgaXMgYWx3YXlzIDwga01heExlbmd0aC5cbiAgdmFyIGxlbmd0aCA9IGJ5dGVMZW5ndGgoc3RyaW5nLCBlbmNvZGluZykgfCAwXG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG5cbiAgdGhhdC53cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tT2JqZWN0ICh0aGF0LCBvYmplY3QpIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihvYmplY3QpKSByZXR1cm4gZnJvbUJ1ZmZlcih0aGF0LCBvYmplY3QpXG5cbiAgaWYgKGlzQXJyYXkob2JqZWN0KSkgcmV0dXJuIGZyb21BcnJheSh0aGF0LCBvYmplY3QpXG5cbiAgaWYgKG9iamVjdCA9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignbXVzdCBzdGFydCB3aXRoIG51bWJlciwgYnVmZmVyLCBhcnJheSBvciBzdHJpbmcnKVxuICB9XG5cbiAgaWYgKHR5cGVvZiBBcnJheUJ1ZmZlciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAob2JqZWN0LmJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICByZXR1cm4gZnJvbVR5cGVkQXJyYXkodGhhdCwgb2JqZWN0KVxuICAgIH1cbiAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgIHJldHVybiBmcm9tQXJyYXlCdWZmZXIodGhhdCwgb2JqZWN0KVxuICAgIH1cbiAgfVxuXG4gIGlmIChvYmplY3QubGVuZ3RoKSByZXR1cm4gZnJvbUFycmF5TGlrZSh0aGF0LCBvYmplY3QpXG5cbiAgcmV0dXJuIGZyb21Kc29uT2JqZWN0KHRoYXQsIG9iamVjdClcbn1cblxuZnVuY3Rpb24gZnJvbUJ1ZmZlciAodGhhdCwgYnVmZmVyKSB7XG4gIHZhciBsZW5ndGggPSBjaGVja2VkKGJ1ZmZlci5sZW5ndGgpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuICBidWZmZXIuY29weSh0aGF0LCAwLCAwLCBsZW5ndGgpXG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheSAodGhhdCwgYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIHRoYXRbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbi8vIER1cGxpY2F0ZSBvZiBmcm9tQXJyYXkoKSB0byBrZWVwIGZyb21BcnJheSgpIG1vbm9tb3JwaGljLlxuZnVuY3Rpb24gZnJvbVR5cGVkQXJyYXkgKHRoYXQsIGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG4gIC8vIFRydW5jYXRpbmcgdGhlIGVsZW1lbnRzIGlzIHByb2JhYmx5IG5vdCB3aGF0IHBlb3BsZSBleHBlY3QgZnJvbSB0eXBlZFxuICAvLyBhcnJheXMgd2l0aCBCWVRFU19QRVJfRUxFTUVOVCA+IDEgYnV0IGl0J3MgY29tcGF0aWJsZSB3aXRoIHRoZSBiZWhhdmlvclxuICAvLyBvZiB0aGUgb2xkIEJ1ZmZlciBjb25zdHJ1Y3Rvci5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIHRoYXRbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUJ1ZmZlciAodGhhdCwgYXJyYXkpIHtcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2UsIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgYXJyYXkuYnl0ZUxlbmd0aFxuICAgIHRoYXQgPSBCdWZmZXIuX2F1Z21lbnQobmV3IFVpbnQ4QXJyYXkoYXJyYXkpKVxuICB9IGVsc2Uge1xuICAgIC8vIEZhbGxiYWNrOiBSZXR1cm4gYW4gb2JqZWN0IGluc3RhbmNlIG9mIHRoZSBCdWZmZXIgY2xhc3NcbiAgICB0aGF0ID0gZnJvbVR5cGVkQXJyYXkodGhhdCwgbmV3IFVpbnQ4QXJyYXkoYXJyYXkpKVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUxpa2UgKHRoYXQsIGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICB0aGF0W2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG4vLyBEZXNlcmlhbGl6ZSB7IHR5cGU6ICdCdWZmZXInLCBkYXRhOiBbMSwyLDMsLi4uXSB9IGludG8gYSBCdWZmZXIgb2JqZWN0LlxuLy8gUmV0dXJucyBhIHplcm8tbGVuZ3RoIGJ1ZmZlciBmb3IgaW5wdXRzIHRoYXQgZG9uJ3QgY29uZm9ybSB0byB0aGUgc3BlYy5cbmZ1bmN0aW9uIGZyb21Kc29uT2JqZWN0ICh0aGF0LCBvYmplY3QpIHtcbiAgdmFyIGFycmF5XG4gIHZhciBsZW5ndGggPSAwXG5cbiAgaWYgKG9iamVjdC50eXBlID09PSAnQnVmZmVyJyAmJiBpc0FycmF5KG9iamVjdC5kYXRhKSkge1xuICAgIGFycmF5ID0gb2JqZWN0LmRhdGFcbiAgICBsZW5ndGggPSBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIH1cbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gIEJ1ZmZlci5wcm90b3R5cGUuX19wcm90b19fID0gVWludDhBcnJheS5wcm90b3R5cGVcbiAgQnVmZmVyLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXlcbn0gZWxzZSB7XG4gIC8vIHByZS1zZXQgZm9yIHZhbHVlcyB0aGF0IG1heSBleGlzdCBpbiB0aGUgZnV0dXJlXG4gIEJ1ZmZlci5wcm90b3R5cGUubGVuZ3RoID0gdW5kZWZpbmVkXG4gIEJ1ZmZlci5wcm90b3R5cGUucGFyZW50ID0gdW5kZWZpbmVkXG59XG5cbmZ1bmN0aW9uIGFsbG9jYXRlICh0aGF0LCBsZW5ndGgpIHtcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2UsIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgdGhhdCA9IEJ1ZmZlci5fYXVnbWVudChuZXcgVWludDhBcnJheShsZW5ndGgpKVxuICAgIHRoYXQuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICB9IGVsc2Uge1xuICAgIC8vIEZhbGxiYWNrOiBSZXR1cm4gYW4gb2JqZWN0IGluc3RhbmNlIG9mIHRoZSBCdWZmZXIgY2xhc3NcbiAgICB0aGF0Lmxlbmd0aCA9IGxlbmd0aFxuICAgIHRoYXQuX2lzQnVmZmVyID0gdHJ1ZVxuICB9XG5cbiAgdmFyIGZyb21Qb29sID0gbGVuZ3RoICE9PSAwICYmIGxlbmd0aCA8PSBCdWZmZXIucG9vbFNpemUgPj4+IDFcbiAgaWYgKGZyb21Qb29sKSB0aGF0LnBhcmVudCA9IHJvb3RQYXJlbnRcblxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBjaGVja2VkIChsZW5ndGgpIHtcbiAgLy8gTm90ZTogY2Fubm90IHVzZSBgbGVuZ3RoIDwga01heExlbmd0aGAgaGVyZSBiZWNhdXNlIHRoYXQgZmFpbHMgd2hlblxuICAvLyBsZW5ndGggaXMgTmFOICh3aGljaCBpcyBvdGhlcndpc2UgY29lcmNlZCB0byB6ZXJvLilcbiAgaWYgKGxlbmd0aCA+PSBrTWF4TGVuZ3RoKCkpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byBhbGxvY2F0ZSBCdWZmZXIgbGFyZ2VyIHRoYW4gbWF4aW11bSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAnc2l6ZTogMHgnICsga01heExlbmd0aCgpLnRvU3RyaW5nKDE2KSArICcgYnl0ZXMnKVxuICB9XG4gIHJldHVybiBsZW5ndGggfCAwXG59XG5cbmZ1bmN0aW9uIFNsb3dCdWZmZXIgKHN1YmplY3QsIGVuY29kaW5nKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBTbG93QnVmZmVyKSkgcmV0dXJuIG5ldyBTbG93QnVmZmVyKHN1YmplY3QsIGVuY29kaW5nKVxuXG4gIHZhciBidWYgPSBuZXcgQnVmZmVyKHN1YmplY3QsIGVuY29kaW5nKVxuICBkZWxldGUgYnVmLnBhcmVudFxuICByZXR1cm4gYnVmXG59XG5cbkJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uIGlzQnVmZmVyIChiKSB7XG4gIHJldHVybiAhIShiICE9IG51bGwgJiYgYi5faXNCdWZmZXIpXG59XG5cbkJ1ZmZlci5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAoYSwgYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihhKSB8fCAhQnVmZmVyLmlzQnVmZmVyKGIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIG11c3QgYmUgQnVmZmVycycpXG4gIH1cblxuICBpZiAoYSA9PT0gYikgcmV0dXJuIDBcblxuICB2YXIgeCA9IGEubGVuZ3RoXG4gIHZhciB5ID0gYi5sZW5ndGhcblxuICB2YXIgaSA9IDBcbiAgdmFyIGxlbiA9IE1hdGgubWluKHgsIHkpXG4gIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIGJyZWFrXG5cbiAgICArK2lcbiAgfVxuXG4gIGlmIChpICE9PSBsZW4pIHtcbiAgICB4ID0gYVtpXVxuICAgIHkgPSBiW2ldXG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gaXNFbmNvZGluZyAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgIGNhc2UgJ3Jhdyc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQgKGxpc3QsIGxlbmd0aCkge1xuICBpZiAoIWlzQXJyYXkobGlzdCkpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2xpc3QgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzLicpXG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoMClcbiAgfVxuXG4gIHZhciBpXG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGxlbmd0aCA9IDBcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgbGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1ZiA9IG5ldyBCdWZmZXIobGVuZ3RoKVxuICB2YXIgcG9zID0gMFxuICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBpdGVtID0gbGlzdFtpXVxuICAgIGl0ZW0uY29weShidWYsIHBvcylcbiAgICBwb3MgKz0gaXRlbS5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKSBzdHJpbmcgPSAnJyArIHN0cmluZ1xuXG4gIHZhciBsZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGlmIChsZW4gPT09IDApIHJldHVybiAwXG5cbiAgLy8gVXNlIGEgZm9yIGxvb3AgdG8gYXZvaWQgcmVjdXJzaW9uXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgLy8gRGVwcmVjYXRlZFxuICAgICAgY2FzZSAncmF3JzpcbiAgICAgIGNhc2UgJ3Jhd3MnOlxuICAgICAgICByZXR1cm4gbGVuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gbGVuICogMlxuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGxlbiA+Pj4gMVxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgcmV0dXJuIHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoIC8vIGFzc3VtZSB1dGY4XG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhcblxuZnVuY3Rpb24gc2xvd1RvU3RyaW5nIChlbmNvZGluZywgc3RhcnQsIGVuZCkge1xuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuXG4gIHN0YXJ0ID0gc3RhcnQgfCAwXG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkIHx8IGVuZCA9PT0gSW5maW5pdHkgPyB0aGlzLmxlbmd0aCA6IGVuZCB8IDBcblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAoZW5kIDw9IHN0YXJ0KSByZXR1cm4gJydcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBiaW5hcnlTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHV0ZjE2bGVTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoZW5jb2RpbmcgKyAnJykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoIHwgMFxuICBpZiAobGVuZ3RoID09PSAwKSByZXR1cm4gJydcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiB1dGY4U2xpY2UodGhpcywgMCwgbGVuZ3RoKVxuICByZXR1cm4gc2xvd1RvU3RyaW5nLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiBlcXVhbHMgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIHRydWVcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpID09PSAwXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uIGluc3BlY3QgKCkge1xuICB2YXIgc3RyID0gJydcbiAgdmFyIG1heCA9IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVNcbiAgaWYgKHRoaXMubGVuZ3RoID4gMCkge1xuICAgIHN0ciA9IHRoaXMudG9TdHJpbmcoJ2hleCcsIDAsIG1heCkubWF0Y2goLy57Mn0vZykuam9pbignICcpXG4gICAgaWYgKHRoaXMubGVuZ3RoID4gbWF4KSBzdHIgKz0gJyAuLi4gJ1xuICB9XG4gIHJldHVybiAnPEJ1ZmZlciAnICsgc3RyICsgJz4nXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIDBcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIGluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCkge1xuICBpZiAoYnl0ZU9mZnNldCA+IDB4N2ZmZmZmZmYpIGJ5dGVPZmZzZXQgPSAweDdmZmZmZmZmXG4gIGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAtMHg4MDAwMDAwMCkgYnl0ZU9mZnNldCA9IC0weDgwMDAwMDAwXG4gIGJ5dGVPZmZzZXQgPj49IDBcblxuICBpZiAodGhpcy5sZW5ndGggPT09IDApIHJldHVybiAtMVxuICBpZiAoYnl0ZU9mZnNldCA+PSB0aGlzLmxlbmd0aCkgcmV0dXJuIC0xXG5cbiAgLy8gTmVnYXRpdmUgb2Zmc2V0cyBzdGFydCBmcm9tIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlclxuICBpZiAoYnl0ZU9mZnNldCA8IDApIGJ5dGVPZmZzZXQgPSBNYXRoLm1heCh0aGlzLmxlbmd0aCArIGJ5dGVPZmZzZXQsIDApXG5cbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgaWYgKHZhbC5sZW5ndGggPT09IDApIHJldHVybiAtMSAvLyBzcGVjaWFsIGNhc2U6IGxvb2tpbmcgZm9yIGVtcHR5IHN0cmluZyBhbHdheXMgZmFpbHNcbiAgICByZXR1cm4gU3RyaW5nLnByb3RvdHlwZS5pbmRleE9mLmNhbGwodGhpcywgdmFsLCBieXRlT2Zmc2V0KVxuICB9XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsKSkge1xuICAgIHJldHVybiBhcnJheUluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0KVxuICB9XG4gIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCAmJiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKHRoaXMsIHZhbCwgYnl0ZU9mZnNldClcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZih0aGlzLCBbIHZhbCBdLCBieXRlT2Zmc2V0KVxuICB9XG5cbiAgZnVuY3Rpb24gYXJyYXlJbmRleE9mIChhcnIsIHZhbCwgYnl0ZU9mZnNldCkge1xuICAgIHZhciBmb3VuZEluZGV4ID0gLTFcbiAgICBmb3IgKHZhciBpID0gMDsgYnl0ZU9mZnNldCArIGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhcnJbYnl0ZU9mZnNldCArIGldID09PSB2YWxbZm91bmRJbmRleCA9PT0gLTEgPyAwIDogaSAtIGZvdW5kSW5kZXhdKSB7XG4gICAgICAgIGlmIChmb3VuZEluZGV4ID09PSAtMSkgZm91bmRJbmRleCA9IGlcbiAgICAgICAgaWYgKGkgLSBmb3VuZEluZGV4ICsgMSA9PT0gdmFsLmxlbmd0aCkgcmV0dXJuIGJ5dGVPZmZzZXQgKyBmb3VuZEluZGV4XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3VuZEluZGV4ID0gLTFcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xXG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKCd2YWwgbXVzdCBiZSBzdHJpbmcsIG51bWJlciBvciBCdWZmZXInKVxufVxuXG4vLyBgZ2V0YCBpcyBkZXByZWNhdGVkXG5CdWZmZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCAob2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuZ2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy5yZWFkVUludDgob2Zmc2V0KVxufVxuXG4vLyBgc2V0YCBpcyBkZXByZWNhdGVkXG5CdWZmZXIucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldCAodiwgb2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuc2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy53cml0ZVVJbnQ4KHYsIG9mZnNldClcbn1cblxuZnVuY3Rpb24gaGV4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSBidWYubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cblxuICAvLyBtdXN0IGJlIGFuIGV2ZW4gbnVtYmVyIG9mIGRpZ2l0c1xuICB2YXIgc3RyTGVuID0gc3RyaW5nLmxlbmd0aFxuICBpZiAoc3RyTGVuICUgMiAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGhleCBzdHJpbmcnKVxuXG4gIGlmIChsZW5ndGggPiBzdHJMZW4gLyAyKSB7XG4gICAgbGVuZ3RoID0gc3RyTGVuIC8gMlxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgcGFyc2VkID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGlmIChpc05hTihwYXJzZWQpKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaGV4IHN0cmluZycpXG4gICAgYnVmW29mZnNldCArIGldID0gcGFyc2VkXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gdXRmOFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiaW5hcnlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBhc2NpaVdyaXRlKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIHVjczJXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjE2bGVUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiB3cml0ZSAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZylcbiAgaWYgKG9mZnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBvZmZzZXRbLCBsZW5ndGhdWywgZW5jb2RpbmddKVxuICB9IGVsc2UgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gICAgaWYgKGlzRmluaXRlKGxlbmd0aCkpIHtcbiAgICAgIGxlbmd0aCA9IGxlbmd0aCB8IDBcbiAgICAgIGlmIChlbmNvZGluZyA9PT0gdW5kZWZpbmVkKSBlbmNvZGluZyA9ICd1dGY4J1xuICAgIH0gZWxzZSB7XG4gICAgICBlbmNvZGluZyA9IGxlbmd0aFxuICAgICAgbGVuZ3RoID0gdW5kZWZpbmVkXG4gICAgfVxuICAvLyBsZWdhY3kgd3JpdGUoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0LCBsZW5ndGgpIC0gcmVtb3ZlIGluIHYwLjEzXG4gIH0gZWxzZSB7XG4gICAgdmFyIHN3YXAgPSBlbmNvZGluZ1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgb2Zmc2V0ID0gbGVuZ3RoIHwgMFxuICAgIGxlbmd0aCA9IHN3YXBcbiAgfVxuXG4gIHZhciByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldFxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbGVuZ3RoID4gcmVtYWluaW5nKSBsZW5ndGggPSByZW1haW5pbmdcblxuICBpZiAoKHN0cmluZy5sZW5ndGggPiAwICYmIChsZW5ndGggPCAwIHx8IG9mZnNldCA8IDApKSB8fCBvZmZzZXQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdhdHRlbXB0IHRvIHdyaXRlIG91dHNpZGUgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gYmluYXJ5V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgLy8gV2FybmluZzogbWF4TGVuZ3RoIG5vdCB0YWtlbiBpbnRvIGFjY291bnQgaW4gYmFzZTY0V3JpdGVcbiAgICAgICAgcmV0dXJuIGJhc2U2NFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1Y3MyV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gdG9KU09OICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG5mdW5jdGlvbiBiYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gdXRmOFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuICB2YXIgcmVzID0gW11cblxuICB2YXIgaSA9IHN0YXJ0XG4gIHdoaWxlIChpIDwgZW5kKSB7XG4gICAgdmFyIGZpcnN0Qnl0ZSA9IGJ1ZltpXVxuICAgIHZhciBjb2RlUG9pbnQgPSBudWxsXG4gICAgdmFyIGJ5dGVzUGVyU2VxdWVuY2UgPSAoZmlyc3RCeXRlID4gMHhFRikgPyA0XG4gICAgICA6IChmaXJzdEJ5dGUgPiAweERGKSA/IDNcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4QkYpID8gMlxuICAgICAgOiAxXG5cbiAgICBpZiAoaSArIGJ5dGVzUGVyU2VxdWVuY2UgPD0gZW5kKSB7XG4gICAgICB2YXIgc2Vjb25kQnl0ZSwgdGhpcmRCeXRlLCBmb3VydGhCeXRlLCB0ZW1wQ29kZVBvaW50XG5cbiAgICAgIHN3aXRjaCAoYnl0ZXNQZXJTZXF1ZW5jZSkge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgaWYgKGZpcnN0Qnl0ZSA8IDB4ODApIHtcbiAgICAgICAgICAgIGNvZGVQb2ludCA9IGZpcnN0Qnl0ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweDFGKSA8PCAweDYgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0YpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHhDIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAodGhpcmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3RkYgJiYgKHRlbXBDb2RlUG9pbnQgPCAweEQ4MDAgfHwgdGVtcENvZGVQb2ludCA+IDB4REZGRikpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgZm91cnRoQnl0ZSA9IGJ1ZltpICsgM11cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKGZvdXJ0aEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4MTIgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4QyB8ICh0aGlyZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAoZm91cnRoQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4RkZGRiAmJiB0ZW1wQ29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29kZVBvaW50ID09PSBudWxsKSB7XG4gICAgICAvLyB3ZSBkaWQgbm90IGdlbmVyYXRlIGEgdmFsaWQgY29kZVBvaW50IHNvIGluc2VydCBhXG4gICAgICAvLyByZXBsYWNlbWVudCBjaGFyIChVK0ZGRkQpIGFuZCBhZHZhbmNlIG9ubHkgMSBieXRlXG4gICAgICBjb2RlUG9pbnQgPSAweEZGRkRcbiAgICAgIGJ5dGVzUGVyU2VxdWVuY2UgPSAxXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPiAweEZGRkYpIHtcbiAgICAgIC8vIGVuY29kZSB0byB1dGYxNiAoc3Vycm9nYXRlIHBhaXIgZGFuY2UpXG4gICAgICBjb2RlUG9pbnQgLT0gMHgxMDAwMFxuICAgICAgcmVzLnB1c2goY29kZVBvaW50ID4+PiAxMCAmIDB4M0ZGIHwgMHhEODAwKVxuICAgICAgY29kZVBvaW50ID0gMHhEQzAwIHwgY29kZVBvaW50ICYgMHgzRkZcbiAgICB9XG5cbiAgICByZXMucHVzaChjb2RlUG9pbnQpXG4gICAgaSArPSBieXRlc1BlclNlcXVlbmNlXG4gIH1cblxuICByZXR1cm4gZGVjb2RlQ29kZVBvaW50c0FycmF5KHJlcylcbn1cblxuLy8gQmFzZWQgb24gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjI3NDcyNzIvNjgwNzQyLCB0aGUgYnJvd3NlciB3aXRoXG4vLyB0aGUgbG93ZXN0IGxpbWl0IGlzIENocm9tZSwgd2l0aCAweDEwMDAwIGFyZ3MuXG4vLyBXZSBnbyAxIG1hZ25pdHVkZSBsZXNzLCBmb3Igc2FmZXR5XG52YXIgTUFYX0FSR1VNRU5UU19MRU5HVEggPSAweDEwMDBcblxuZnVuY3Rpb24gZGVjb2RlQ29kZVBvaW50c0FycmF5IChjb2RlUG9pbnRzKSB7XG4gIHZhciBsZW4gPSBjb2RlUG9pbnRzLmxlbmd0aFxuICBpZiAobGVuIDw9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjb2RlUG9pbnRzKSAvLyBhdm9pZCBleHRyYSBzbGljZSgpXG4gIH1cblxuICAvLyBEZWNvZGUgaW4gY2h1bmtzIHRvIGF2b2lkIFwiY2FsbCBzdGFjayBzaXplIGV4Y2VlZGVkXCIuXG4gIHZhciByZXMgPSAnJ1xuICB2YXIgaSA9IDBcbiAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShcbiAgICAgIFN0cmluZyxcbiAgICAgIGNvZGVQb2ludHMuc2xpY2UoaSwgaSArPSBNQVhfQVJHVU1FTlRTX0xFTkdUSClcbiAgICApXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSAmIDB4N0YpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBiaW5hcnlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBoZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBieXRlcyA9IGJ1Zi5zbGljZShzdGFydCwgZW5kKVxuICB2YXIgcmVzID0gJydcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgYnl0ZXNbaSArIDFdICogMjU2KVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uIHNsaWNlIChzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBzdGFydCA9IH5+c3RhcnRcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyBsZW4gOiB+fmVuZFxuXG4gIGlmIChzdGFydCA8IDApIHtcbiAgICBzdGFydCArPSBsZW5cbiAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgfSBlbHNlIGlmIChzdGFydCA+IGxlbikge1xuICAgIHN0YXJ0ID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgMCkge1xuICAgIGVuZCArPSBsZW5cbiAgICBpZiAoZW5kIDwgMCkgZW5kID0gMFxuICB9IGVsc2UgaWYgKGVuZCA+IGxlbikge1xuICAgIGVuZCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIHZhciBuZXdCdWZcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgbmV3QnVmID0gQnVmZmVyLl9hdWdtZW50KHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZCkpXG4gIH0gZWxzZSB7XG4gICAgdmFyIHNsaWNlTGVuID0gZW5kIC0gc3RhcnRcbiAgICBuZXdCdWYgPSBuZXcgQnVmZmVyKHNsaWNlTGVuLCB1bmRlZmluZWQpXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzbGljZUxlbjsgaSsrKSB7XG4gICAgICBuZXdCdWZbaV0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH1cblxuICBpZiAobmV3QnVmLmxlbmd0aCkgbmV3QnVmLnBhcmVudCA9IHRoaXMucGFyZW50IHx8IHRoaXNcblxuICByZXR1cm4gbmV3QnVmXG59XG5cbi8qXG4gKiBOZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IGJ1ZmZlciBpc24ndCB0cnlpbmcgdG8gd3JpdGUgb3V0IG9mIGJvdW5kcy5cbiAqL1xuZnVuY3Rpb24gY2hlY2tPZmZzZXQgKG9mZnNldCwgZXh0LCBsZW5ndGgpIHtcbiAgaWYgKChvZmZzZXQgJSAxKSAhPT0gMCB8fCBvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb2Zmc2V0IGlzIG5vdCB1aW50JylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RyeWluZyB0byBhY2Nlc3MgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50TEUgPSBmdW5jdGlvbiByZWFkVUludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50QkUgPSBmdW5jdGlvbiByZWFkVUludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuICB9XG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXVxuICB2YXIgbXVsID0gMVxuICB3aGlsZSAoYnl0ZUxlbmd0aCA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQ4ID0gZnVuY3Rpb24gcmVhZFVJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbiByZWFkVUludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkJFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDgpIHwgdGhpc1tvZmZzZXQgKyAxXVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAoKHRoaXNbb2Zmc2V0XSkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpKSArXG4gICAgICAodGhpc1tvZmZzZXQgKyAzXSAqIDB4MTAwMDAwMClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyQkUgPSBmdW5jdGlvbiByZWFkVUludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSAqIDB4MTAwMDAwMCkgK1xuICAgICgodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICB0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRMRSA9IGZ1bmN0aW9uIHJlYWRJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRCRSA9IGZ1bmN0aW9uIHJlYWRJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aFxuICB2YXIgbXVsID0gMVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWldXG4gIHdoaWxlIChpID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0taV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQ4ID0gZnVuY3Rpb24gcmVhZEludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgaWYgKCEodGhpc1tvZmZzZXRdICYgMHg4MCkpIHJldHVybiAodGhpc1tvZmZzZXRdKVxuICByZXR1cm4gKCgweGZmIC0gdGhpc1tvZmZzZXRdICsgMSkgKiAtMSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiByZWFkSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAxXSB8ICh0aGlzW29mZnNldF0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gcmVhZEludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDNdIDw8IDI0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkJFID0gZnVuY3Rpb24gcmVhZEludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCAyNCkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gcmVhZEZsb2F0TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gcmVhZEZsb2F0QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlTEUgPSBmdW5jdGlvbiByZWFkRG91YmxlTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDUyLCA4KVxufVxuXG5mdW5jdGlvbiBjaGVja0ludCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2J1ZmZlciBtdXN0IGJlIGEgQnVmZmVyIGluc3RhbmNlJylcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndmFsdWUgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlVUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCksIDApXG5cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlVUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCksIDApXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVVSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweGZmLCAwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB2YWx1ZSA9IE1hdGguZmxvb3IodmFsdWUpXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbmZ1bmN0aW9uIG9iamVjdFdyaXRlVUludDE2IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbikge1xuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZiArIHZhbHVlICsgMVxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGJ1Zi5sZW5ndGggLSBvZmZzZXQsIDIpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID0gKHZhbHVlICYgKDB4ZmYgPDwgKDggKiAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSkpKSA+Pj5cbiAgICAgIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpICogOFxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbmZ1bmN0aW9uIG9iamVjdFdyaXRlVUludDMyIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbikge1xuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihidWYubGVuZ3RoIC0gb2Zmc2V0LCA0KTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9ICh2YWx1ZSA+Pj4gKGxpdHRsZUVuZGlhbiA/IGkgOiAzIC0gaSkgKiA4KSAmIDB4ZmZcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgJiAweGZmKVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSAwXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSB2YWx1ZSA8IDAgPyAxIDogMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50QkUgPSBmdW5jdGlvbiB3cml0ZUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IHZhbHVlIDwgMCA/IDEgOiAwXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDggPSBmdW5jdGlvbiB3cml0ZUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHg3ZiwgLTB4ODApXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHZhbHVlID0gTWF0aC5mbG9vcih2YWx1ZSlcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmICsgdmFsdWUgKyAxXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgJiAweGZmKVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbmZ1bmN0aW9uIGNoZWNrSUVFRTc1NCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICh2YWx1ZSA+IG1heCB8fCB2YWx1ZSA8IG1pbikgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3ZhbHVlIGlzIG91dCBvZiBib3VuZHMnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuZnVuY3Rpb24gd3JpdGVGbG9hdCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA0LCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA4LCAxLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCwgLTEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxuICByZXR1cm4gb2Zmc2V0ICsgOFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIGNvcHkgKHRhcmdldCwgdGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kICYmIGVuZCAhPT0gMCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldFN0YXJ0ID49IHRhcmdldC5sZW5ndGgpIHRhcmdldFN0YXJ0ID0gdGFyZ2V0Lmxlbmd0aFxuICBpZiAoIXRhcmdldFN0YXJ0KSB0YXJnZXRTdGFydCA9IDBcbiAgaWYgKGVuZCA+IDAgJiYgZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm4gMFxuICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBGYXRhbCBlcnJvciBjb25kaXRpb25zXG4gIGlmICh0YXJnZXRTdGFydCA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIH1cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZVN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBpZiAoZW5kIDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgPCBlbmQgLSBzdGFydCkge1xuICAgIGVuZCA9IHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCArIHN0YXJ0XG4gIH1cblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcbiAgdmFyIGlcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHN0YXJ0IDwgdGFyZ2V0U3RhcnQgJiYgdGFyZ2V0U3RhcnQgPCBlbmQpIHtcbiAgICAvLyBkZXNjZW5kaW5nIGNvcHkgZnJvbSBlbmRcbiAgICBmb3IgKGkgPSBsZW4gLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSBpZiAobGVuIDwgMTAwMCB8fCAhQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBhc2NlbmRpbmcgY29weSBmcm9tIHN0YXJ0XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0YXJnZXQuX3NldCh0aGlzLnN1YmFycmF5KHN0YXJ0LCBzdGFydCArIGxlbiksIHRhcmdldFN0YXJ0KVxuICB9XG5cbiAgcmV0dXJuIGxlblxufVxuXG4vLyBmaWxsKHZhbHVlLCBzdGFydD0wLCBlbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uIGZpbGwgKHZhbHVlLCBzdGFydCwgZW5kKSB7XG4gIGlmICghdmFsdWUpIHZhbHVlID0gMFxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQpIGVuZCA9IHRoaXMubGVuZ3RoXG5cbiAgaWYgKGVuZCA8IHN0YXJ0KSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignZW5kIDwgc3RhcnQnKVxuXG4gIC8vIEZpbGwgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuXG4gIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3N0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBpZiAoZW5kIDwgMCB8fCBlbmQgPiB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2VuZCBvdXQgb2YgYm91bmRzJylcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIHRoaXNbaV0gPSB2YWx1ZVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgYnl0ZXMgPSB1dGY4VG9CeXRlcyh2YWx1ZS50b1N0cmluZygpKVxuICAgIHZhciBsZW4gPSBieXRlcy5sZW5ndGhcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gYnl0ZXNbaSAlIGxlbl1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgYEFycmF5QnVmZmVyYCB3aXRoIHRoZSAqY29waWVkKiBtZW1vcnkgb2YgdGhlIGJ1ZmZlciBpbnN0YW5jZS5cbiAqIEFkZGVkIGluIE5vZGUgMC4xMi4gT25seSBhdmFpbGFibGUgaW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0IEFycmF5QnVmZmVyLlxuICovXG5CdWZmZXIucHJvdG90eXBlLnRvQXJyYXlCdWZmZXIgPSBmdW5jdGlvbiB0b0FycmF5QnVmZmVyICgpIHtcbiAgaWYgKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgICAgcmV0dXJuIChuZXcgQnVmZmVyKHRoaXMpKS5idWZmZXJcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGJ1ZiA9IG5ldyBVaW50OEFycmF5KHRoaXMubGVuZ3RoKVxuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGJ1Zi5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgICBidWZbaV0gPSB0aGlzW2ldXG4gICAgICB9XG4gICAgICByZXR1cm4gYnVmLmJ1ZmZlclxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdCdWZmZXIudG9BcnJheUJ1ZmZlciBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlcicpXG4gIH1cbn1cblxuLy8gSEVMUEVSIEZVTkNUSU9OU1xuLy8gPT09PT09PT09PT09PT09PVxuXG52YXIgQlAgPSBCdWZmZXIucHJvdG90eXBlXG5cbi8qKlxuICogQXVnbWVudCBhIFVpbnQ4QXJyYXkgKmluc3RhbmNlKiAobm90IHRoZSBVaW50OEFycmF5IGNsYXNzISkgd2l0aCBCdWZmZXIgbWV0aG9kc1xuICovXG5CdWZmZXIuX2F1Z21lbnQgPSBmdW5jdGlvbiBfYXVnbWVudCAoYXJyKSB7XG4gIGFyci5jb25zdHJ1Y3RvciA9IEJ1ZmZlclxuICBhcnIuX2lzQnVmZmVyID0gdHJ1ZVxuXG4gIC8vIHNhdmUgcmVmZXJlbmNlIHRvIG9yaWdpbmFsIFVpbnQ4QXJyYXkgc2V0IG1ldGhvZCBiZWZvcmUgb3ZlcndyaXRpbmdcbiAgYXJyLl9zZXQgPSBhcnIuc2V0XG5cbiAgLy8gZGVwcmVjYXRlZFxuICBhcnIuZ2V0ID0gQlAuZ2V0XG4gIGFyci5zZXQgPSBCUC5zZXRcblxuICBhcnIud3JpdGUgPSBCUC53cml0ZVxuICBhcnIudG9TdHJpbmcgPSBCUC50b1N0cmluZ1xuICBhcnIudG9Mb2NhbGVTdHJpbmcgPSBCUC50b1N0cmluZ1xuICBhcnIudG9KU09OID0gQlAudG9KU09OXG4gIGFyci5lcXVhbHMgPSBCUC5lcXVhbHNcbiAgYXJyLmNvbXBhcmUgPSBCUC5jb21wYXJlXG4gIGFyci5pbmRleE9mID0gQlAuaW5kZXhPZlxuICBhcnIuY29weSA9IEJQLmNvcHlcbiAgYXJyLnNsaWNlID0gQlAuc2xpY2VcbiAgYXJyLnJlYWRVSW50TEUgPSBCUC5yZWFkVUludExFXG4gIGFyci5yZWFkVUludEJFID0gQlAucmVhZFVJbnRCRVxuICBhcnIucmVhZFVJbnQ4ID0gQlAucmVhZFVJbnQ4XG4gIGFyci5yZWFkVUludDE2TEUgPSBCUC5yZWFkVUludDE2TEVcbiAgYXJyLnJlYWRVSW50MTZCRSA9IEJQLnJlYWRVSW50MTZCRVxuICBhcnIucmVhZFVJbnQzMkxFID0gQlAucmVhZFVJbnQzMkxFXG4gIGFyci5yZWFkVUludDMyQkUgPSBCUC5yZWFkVUludDMyQkVcbiAgYXJyLnJlYWRJbnRMRSA9IEJQLnJlYWRJbnRMRVxuICBhcnIucmVhZEludEJFID0gQlAucmVhZEludEJFXG4gIGFyci5yZWFkSW50OCA9IEJQLnJlYWRJbnQ4XG4gIGFyci5yZWFkSW50MTZMRSA9IEJQLnJlYWRJbnQxNkxFXG4gIGFyci5yZWFkSW50MTZCRSA9IEJQLnJlYWRJbnQxNkJFXG4gIGFyci5yZWFkSW50MzJMRSA9IEJQLnJlYWRJbnQzMkxFXG4gIGFyci5yZWFkSW50MzJCRSA9IEJQLnJlYWRJbnQzMkJFXG4gIGFyci5yZWFkRmxvYXRMRSA9IEJQLnJlYWRGbG9hdExFXG4gIGFyci5yZWFkRmxvYXRCRSA9IEJQLnJlYWRGbG9hdEJFXG4gIGFyci5yZWFkRG91YmxlTEUgPSBCUC5yZWFkRG91YmxlTEVcbiAgYXJyLnJlYWREb3VibGVCRSA9IEJQLnJlYWREb3VibGVCRVxuICBhcnIud3JpdGVVSW50OCA9IEJQLndyaXRlVUludDhcbiAgYXJyLndyaXRlVUludExFID0gQlAud3JpdGVVSW50TEVcbiAgYXJyLndyaXRlVUludEJFID0gQlAud3JpdGVVSW50QkVcbiAgYXJyLndyaXRlVUludDE2TEUgPSBCUC53cml0ZVVJbnQxNkxFXG4gIGFyci53cml0ZVVJbnQxNkJFID0gQlAud3JpdGVVSW50MTZCRVxuICBhcnIud3JpdGVVSW50MzJMRSA9IEJQLndyaXRlVUludDMyTEVcbiAgYXJyLndyaXRlVUludDMyQkUgPSBCUC53cml0ZVVJbnQzMkJFXG4gIGFyci53cml0ZUludExFID0gQlAud3JpdGVJbnRMRVxuICBhcnIud3JpdGVJbnRCRSA9IEJQLndyaXRlSW50QkVcbiAgYXJyLndyaXRlSW50OCA9IEJQLndyaXRlSW50OFxuICBhcnIud3JpdGVJbnQxNkxFID0gQlAud3JpdGVJbnQxNkxFXG4gIGFyci53cml0ZUludDE2QkUgPSBCUC53cml0ZUludDE2QkVcbiAgYXJyLndyaXRlSW50MzJMRSA9IEJQLndyaXRlSW50MzJMRVxuICBhcnIud3JpdGVJbnQzMkJFID0gQlAud3JpdGVJbnQzMkJFXG4gIGFyci53cml0ZUZsb2F0TEUgPSBCUC53cml0ZUZsb2F0TEVcbiAgYXJyLndyaXRlRmxvYXRCRSA9IEJQLndyaXRlRmxvYXRCRVxuICBhcnIud3JpdGVEb3VibGVMRSA9IEJQLndyaXRlRG91YmxlTEVcbiAgYXJyLndyaXRlRG91YmxlQkUgPSBCUC53cml0ZURvdWJsZUJFXG4gIGFyci5maWxsID0gQlAuZmlsbFxuICBhcnIuaW5zcGVjdCA9IEJQLmluc3BlY3RcbiAgYXJyLnRvQXJyYXlCdWZmZXIgPSBCUC50b0FycmF5QnVmZmVyXG5cbiAgcmV0dXJuIGFyclxufVxuXG52YXIgSU5WQUxJRF9CQVNFNjRfUkUgPSAvW14rXFwvMC05QS1aYS16LV9dL2dcblxuZnVuY3Rpb24gYmFzZTY0Y2xlYW4gKHN0cikge1xuICAvLyBOb2RlIHN0cmlwcyBvdXQgaW52YWxpZCBjaGFyYWN0ZXJzIGxpa2UgXFxuIGFuZCBcXHQgZnJvbSB0aGUgc3RyaW5nLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgc3RyID0gc3RyaW5ndHJpbShzdHIpLnJlcGxhY2UoSU5WQUxJRF9CQVNFNjRfUkUsICcnKVxuICAvLyBOb2RlIGNvbnZlcnRzIHN0cmluZ3Mgd2l0aCBsZW5ndGggPCAyIHRvICcnXG4gIGlmIChzdHIubGVuZ3RoIDwgMikgcmV0dXJuICcnXG4gIC8vIE5vZGUgYWxsb3dzIGZvciBub24tcGFkZGVkIGJhc2U2NCBzdHJpbmdzIChtaXNzaW5nIHRyYWlsaW5nID09PSksIGJhc2U2NC1qcyBkb2VzIG5vdFxuICB3aGlsZSAoc3RyLmxlbmd0aCAlIDQgIT09IDApIHtcbiAgICBzdHIgPSBzdHIgKyAnPSdcbiAgfVxuICByZXR1cm4gc3RyXG59XG5cbmZ1bmN0aW9uIHN0cmluZ3RyaW0gKHN0cikge1xuICBpZiAoc3RyLnRyaW0pIHJldHVybiBzdHIudHJpbSgpXG4gIHJldHVybiBzdHIucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpXG59XG5cbmZ1bmN0aW9uIHRvSGV4IChuKSB7XG4gIGlmIChuIDwgMTYpIHJldHVybiAnMCcgKyBuLnRvU3RyaW5nKDE2KVxuICByZXR1cm4gbi50b1N0cmluZygxNilcbn1cblxuZnVuY3Rpb24gdXRmOFRvQnl0ZXMgKHN0cmluZywgdW5pdHMpIHtcbiAgdW5pdHMgPSB1bml0cyB8fCBJbmZpbml0eVxuICB2YXIgY29kZVBvaW50XG4gIHZhciBsZW5ndGggPSBzdHJpbmcubGVuZ3RoXG4gIHZhciBsZWFkU3Vycm9nYXRlID0gbnVsbFxuICB2YXIgYnl0ZXMgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBjb2RlUG9pbnQgPSBzdHJpbmcuY2hhckNvZGVBdChpKVxuXG4gICAgLy8gaXMgc3Vycm9nYXRlIGNvbXBvbmVudFxuICAgIGlmIChjb2RlUG9pbnQgPiAweEQ3RkYgJiYgY29kZVBvaW50IDwgMHhFMDAwKSB7XG4gICAgICAvLyBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCFsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAgIC8vIG5vIGxlYWQgeWV0XG4gICAgICAgIGlmIChjb2RlUG9pbnQgPiAweERCRkYpIHtcbiAgICAgICAgICAvLyB1bmV4cGVjdGVkIHRyYWlsXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfSBlbHNlIGlmIChpICsgMSA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgLy8gdW5wYWlyZWQgbGVhZFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YWxpZCBsZWFkXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyAyIGxlYWRzIGluIGEgcm93XG4gICAgICBpZiAoY29kZVBvaW50IDwgMHhEQzAwKSB7XG4gICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIHZhbGlkIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICBjb2RlUG9pbnQgPSAobGVhZFN1cnJvZ2F0ZSAtIDB4RDgwMCA8PCAxMCB8IGNvZGVQb2ludCAtIDB4REMwMCkgKyAweDEwMDAwXG4gICAgfSBlbHNlIGlmIChsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAvLyB2YWxpZCBibXAgY2hhciwgYnV0IGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICB9XG5cbiAgICBsZWFkU3Vycm9nYXRlID0gbnVsbFxuXG4gICAgLy8gZW5jb2RlIHV0ZjhcbiAgICBpZiAoY29kZVBvaW50IDwgMHg4MCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAxKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKGNvZGVQb2ludClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4ODAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgfCAweEMwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAzKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDIHwgMHhFMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gNCkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4MTIgfCAweEYwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvZGUgcG9pbnQnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBieXRlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyLCB1bml0cykge1xuICB2YXIgYywgaGksIGxvXG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuXG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIHJldHVybiBiYXNlNjQudG9CeXRlQXJyYXkoYmFzZTY0Y2xlYW4oc3RyKSlcbn1cblxuZnVuY3Rpb24gYmxpdEJ1ZmZlciAoc3JjLCBkc3QsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoKGkgKyBvZmZzZXQgPj0gZHN0Lmxlbmd0aCkgfHwgKGkgPj0gc3JjLmxlbmd0aCkpIGJyZWFrXG4gICAgZHN0W2kgKyBvZmZzZXRdID0gc3JjW2ldXG4gIH1cbiAgcmV0dXJuIGlcbn1cbiIsInZhciBsb29rdXAgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLyc7XG5cbjsoZnVuY3Rpb24gKGV4cG9ydHMpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG4gIHZhciBBcnIgPSAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnKVxuICAgID8gVWludDhBcnJheVxuICAgIDogQXJyYXlcblxuXHR2YXIgUExVUyAgID0gJysnLmNoYXJDb2RlQXQoMClcblx0dmFyIFNMQVNIICA9ICcvJy5jaGFyQ29kZUF0KDApXG5cdHZhciBOVU1CRVIgPSAnMCcuY2hhckNvZGVBdCgwKVxuXHR2YXIgTE9XRVIgID0gJ2EnLmNoYXJDb2RlQXQoMClcblx0dmFyIFVQUEVSICA9ICdBJy5jaGFyQ29kZUF0KDApXG5cdHZhciBQTFVTX1VSTF9TQUZFID0gJy0nLmNoYXJDb2RlQXQoMClcblx0dmFyIFNMQVNIX1VSTF9TQUZFID0gJ18nLmNoYXJDb2RlQXQoMClcblxuXHRmdW5jdGlvbiBkZWNvZGUgKGVsdCkge1xuXHRcdHZhciBjb2RlID0gZWx0LmNoYXJDb2RlQXQoMClcblx0XHRpZiAoY29kZSA9PT0gUExVUyB8fFxuXHRcdCAgICBjb2RlID09PSBQTFVTX1VSTF9TQUZFKVxuXHRcdFx0cmV0dXJuIDYyIC8vICcrJ1xuXHRcdGlmIChjb2RlID09PSBTTEFTSCB8fFxuXHRcdCAgICBjb2RlID09PSBTTEFTSF9VUkxfU0FGRSlcblx0XHRcdHJldHVybiA2MyAvLyAnLydcblx0XHRpZiAoY29kZSA8IE5VTUJFUilcblx0XHRcdHJldHVybiAtMSAvL25vIG1hdGNoXG5cdFx0aWYgKGNvZGUgPCBOVU1CRVIgKyAxMClcblx0XHRcdHJldHVybiBjb2RlIC0gTlVNQkVSICsgMjYgKyAyNlxuXHRcdGlmIChjb2RlIDwgVVBQRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gVVBQRVJcblx0XHRpZiAoY29kZSA8IExPV0VSICsgMjYpXG5cdFx0XHRyZXR1cm4gY29kZSAtIExPV0VSICsgMjZcblx0fVxuXG5cdGZ1bmN0aW9uIGI2NFRvQnl0ZUFycmF5IChiNjQpIHtcblx0XHR2YXIgaSwgaiwgbCwgdG1wLCBwbGFjZUhvbGRlcnMsIGFyclxuXG5cdFx0aWYgKGI2NC5sZW5ndGggJSA0ID4gMCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0Jylcblx0XHR9XG5cblx0XHQvLyB0aGUgbnVtYmVyIG9mIGVxdWFsIHNpZ25zIChwbGFjZSBob2xkZXJzKVxuXHRcdC8vIGlmIHRoZXJlIGFyZSB0d28gcGxhY2Vob2xkZXJzLCB0aGFuIHRoZSB0d28gY2hhcmFjdGVycyBiZWZvcmUgaXRcblx0XHQvLyByZXByZXNlbnQgb25lIGJ5dGVcblx0XHQvLyBpZiB0aGVyZSBpcyBvbmx5IG9uZSwgdGhlbiB0aGUgdGhyZWUgY2hhcmFjdGVycyBiZWZvcmUgaXQgcmVwcmVzZW50IDIgYnl0ZXNcblx0XHQvLyB0aGlzIGlzIGp1c3QgYSBjaGVhcCBoYWNrIHRvIG5vdCBkbyBpbmRleE9mIHR3aWNlXG5cdFx0dmFyIGxlbiA9IGI2NC5sZW5ndGhcblx0XHRwbGFjZUhvbGRlcnMgPSAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMikgPyAyIDogJz0nID09PSBiNjQuY2hhckF0KGxlbiAtIDEpID8gMSA6IDBcblxuXHRcdC8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuXHRcdGFyciA9IG5ldyBBcnIoYjY0Lmxlbmd0aCAqIDMgLyA0IC0gcGxhY2VIb2xkZXJzKVxuXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuXHRcdGwgPSBwbGFjZUhvbGRlcnMgPiAwID8gYjY0Lmxlbmd0aCAtIDQgOiBiNjQubGVuZ3RoXG5cblx0XHR2YXIgTCA9IDBcblxuXHRcdGZ1bmN0aW9uIHB1c2ggKHYpIHtcblx0XHRcdGFycltMKytdID0gdlxuXHRcdH1cblxuXHRcdGZvciAoaSA9IDAsIGogPSAwOyBpIDwgbDsgaSArPSA0LCBqICs9IDMpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTgpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgMTIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPDwgNikgfCBkZWNvZGUoYjY0LmNoYXJBdChpICsgMykpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDAwMCkgPj4gMTYpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDApID4+IDgpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fVxuXG5cdFx0aWYgKHBsYWNlSG9sZGVycyA9PT0gMikge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAyKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpID4+IDQpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fSBlbHNlIGlmIChwbGFjZUhvbGRlcnMgPT09IDEpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTApIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgNCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA+PiAyKVxuXHRcdFx0cHVzaCgodG1wID4+IDgpICYgMHhGRilcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRyZXR1cm4gYXJyXG5cdH1cblxuXHRmdW5jdGlvbiB1aW50OFRvQmFzZTY0ICh1aW50OCkge1xuXHRcdHZhciBpLFxuXHRcdFx0ZXh0cmFCeXRlcyA9IHVpbnQ4Lmxlbmd0aCAlIDMsIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG5cdFx0XHRvdXRwdXQgPSBcIlwiLFxuXHRcdFx0dGVtcCwgbGVuZ3RoXG5cblx0XHRmdW5jdGlvbiBlbmNvZGUgKG51bSkge1xuXHRcdFx0cmV0dXJuIGxvb2t1cC5jaGFyQXQobnVtKVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG5cdFx0XHRyZXR1cm4gZW5jb2RlKG51bSA+PiAxOCAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiAxMiAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiA2ICYgMHgzRikgKyBlbmNvZGUobnVtICYgMHgzRilcblx0XHR9XG5cblx0XHQvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG5cdFx0Zm9yIChpID0gMCwgbGVuZ3RoID0gdWludDgubGVuZ3RoIC0gZXh0cmFCeXRlczsgaSA8IGxlbmd0aDsgaSArPSAzKSB7XG5cdFx0XHR0ZW1wID0gKHVpbnQ4W2ldIDw8IDE2KSArICh1aW50OFtpICsgMV0gPDwgOCkgKyAodWludDhbaSArIDJdKVxuXHRcdFx0b3V0cHV0ICs9IHRyaXBsZXRUb0Jhc2U2NCh0ZW1wKVxuXHRcdH1cblxuXHRcdC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcblx0XHRzd2l0Y2ggKGV4dHJhQnl0ZXMpIHtcblx0XHRcdGNhc2UgMTpcblx0XHRcdFx0dGVtcCA9IHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUodGVtcCA+PiAyKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9PSdcblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgMjpcblx0XHRcdFx0dGVtcCA9ICh1aW50OFt1aW50OC5sZW5ndGggLSAyXSA8PCA4KSArICh1aW50OFt1aW50OC5sZW5ndGggLSAxXSlcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDEwKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wID4+IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA8PCAyKSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSAnPSdcblx0XHRcdFx0YnJlYWtcblx0XHR9XG5cblx0XHRyZXR1cm4gb3V0cHV0XG5cdH1cblxuXHRleHBvcnRzLnRvQnl0ZUFycmF5ID0gYjY0VG9CeXRlQXJyYXlcblx0ZXhwb3J0cy5mcm9tQnl0ZUFycmF5ID0gdWludDhUb0Jhc2U2NFxufSh0eXBlb2YgZXhwb3J0cyA9PT0gJ3VuZGVmaW5lZCcgPyAodGhpcy5iYXNlNjRqcyA9IHt9KSA6IGV4cG9ydHMpKVxuIiwiZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24gKGJ1ZmZlciwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG1cbiAgdmFyIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBuQml0cyA9IC03XG4gIHZhciBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDBcbiAgdmFyIGQgPSBpc0xFID8gLTEgOiAxXG4gIHZhciBzID0gYnVmZmVyW29mZnNldCArIGldXG5cbiAgaSArPSBkXG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgcyA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gZUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gZSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIG0gPSBlICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIGUgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IG1MZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgbSA9IG0gKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBpZiAoZSA9PT0gMCkge1xuICAgIGUgPSAxIC0gZUJpYXNcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpXG4gIH0gZWxzZSB7XG4gICAgbSA9IG0gKyBNYXRoLnBvdygyLCBtTGVuKVxuICAgIGUgPSBlIC0gZUJpYXNcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKVxufVxuXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24gKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLCBjXG4gIHZhciBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApXG4gIHZhciBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSlcbiAgdmFyIGQgPSBpc0xFID8gMSA6IC0xXG4gIHZhciBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwXG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSlcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMFxuICAgIGUgPSBlTWF4XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpXG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tXG4gICAgICBjICo9IDJcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGNcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpXG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrXG4gICAgICBjIC89IDJcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwXG4gICAgICBlID0gZU1heFxuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAodmFsdWUgKiBjIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IGUgKyBlQmlhc1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSAwXG4gICAgfVxuICB9XG5cbiAgZm9yICg7IG1MZW4gPj0gODsgYnVmZmVyW29mZnNldCArIGldID0gbSAmIDB4ZmYsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCkge31cblxuICBlID0gKGUgPDwgbUxlbikgfCBtXG4gIGVMZW4gKz0gbUxlblxuICBmb3IgKDsgZUxlbiA+IDA7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGUgJiAweGZmLCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpIHt9XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4XG59XG4iLCJ2YXIgdG9TdHJpbmcgPSB7fS50b1N0cmluZztcblxubW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChhcnIpIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwoYXJyKSA9PSAnW29iamVjdCBBcnJheV0nO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZUFjdGlvbnMoXG4gIFtcImdldENvdXJzZUluZm9cIl1cbik7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFJlZmx1eC5jcmVhdGVBY3Rpb25zKFxuICBbXCJjcmVhdGVUb2FzdFwiXVxuKTsiLCJtb2R1bGUuZXhwb3J0cyA9IFJlZmx1eC5jcmVhdGVBY3Rpb25zKFxuICBbXG4gIFwidXBkYXRlQ291cnNlc1wiLFxuICBcInVwZGF0ZVByZWZlcmVuY2VzXCIsXG4gIFwibG9hZFByZXNldFRpbWV0YWJsZVwiLFxuICBcInNldFNjaG9vbFwiLFxuICBcInNldENvdXJzZXNMb2FkaW5nXCIsXG4gIFwic2V0Q291cnNlc0RvbmVMb2FkaW5nXCIsXG4gIFwic2V0Q3VycmVudEluZGV4XCIsXG4gIF1cbik7XG4iLCJ2YXIgUm9vdCA9IHJlcXVpcmUoJy4vcm9vdCcpO1xudmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMnKTtcbl9TRU1FU1RFUiA9IFwiU1wiO1xuXG5SZWFjdERPTS5yZW5kZXIoXG4gIDxSb290IC8+LFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFnZScpXG4pO1xuXG52YXIgZGF0YSA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zdWJzdHJpbmcoMSk7IC8vIGxvYWRpbmcgdGltZXRhYmxlIGRhdGEgZnJvbSB1cmxcbmlmICghZGF0YSAmJiB0eXBlb2YoU3RvcmFnZSkgIT09IFwidW5kZWZpbmVkXCIpIHsgLy8gZGlkbid0IGZpbmQgaW4gVVJMLCB0cnkgbG9jYWwgc3RvcmFnZVxuICAgIGRhdGEgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnZGF0YScpO1xufSBcbmlmIChkYXRhKSB7XG5cdFRpbWV0YWJsZUFjdGlvbnMubG9hZFByZXNldFRpbWV0YWJsZShkYXRhKTtcbn1cbiIsInZhciBTZWFyY2hCYXIgPSByZXF1aXJlKCcuL3NlYXJjaF9iYXInKTtcbnZhciBQcmVmZXJlbmNlTWVudSA9IHJlcXVpcmUoJy4vcHJlZmVyZW5jZV9tZW51Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJjb250cm9sLWJhclwiPlxuICAgICAgICA8ZGl2IGlkPVwic2VhcmNoLWJhci1jb250YWluZXJcIj5cbiAgICAgICAgICA8U2VhcmNoQmFyIHRvZ2dsZU1vZGFsPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsfSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPFByZWZlcmVuY2VNZW51IC8+XG4gICAgICA8L2Rpdj5cblxuICAgICk7XG4gIH0sXG59KTtcbiIsInZhciBFdmFsdWF0aW9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjbGFzc2VzID0gdGhpcy5wcm9wcy5zZWxlY3RlZCA/IFwiZXZhbC1pdGVtIHNlbGVjdGVkXCIgOiBcImV2YWwtaXRlbVwiXG5cdFx0dmFyIGRldGFpbHMgPSAhdGhpcy5wcm9wcy5zZWxlY3RlZCA/IG51bGwgOiAoXG5cdFx0XHQ8ZGl2IGlkPVwiZGV0YWlsc1wiPnt0aGlzLnByb3BzLmV2YWxfZGF0YS5zdW1tYXJ5LnJlcGxhY2UoL1xcdTAwYTAvZywgXCIgXCIpfTwvZGl2PlxuXHRcdFx0KVxuXHRcdHZhciBwcm9mID0gIXRoaXMucHJvcHMuc2VsZWN0ZWQgPyBudWxsIDogKFxuXHRcdFx0PGRpdiBpZD1cInByb2ZcIj5Qcm9mZXNzb3I6IHt0aGlzLnByb3BzLmV2YWxfZGF0YS5wcm9mZXNzb3J9PC9kaXY+XG5cdFx0XHQpXG5cdFx0cmV0dXJuIChcblx0XHQ8ZGl2IGNsYXNzTmFtZT17Y2xhc3Nlc30gb25DbGljaz17dGhpcy5wcm9wcy5zZWxlY3Rpb25DYWxsYmFja30gPlxuXHRcdFx0PGRpdiBpZD1cImV2YWwtd3JhcHBlclwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInllYXJcIj57dGhpcy5wcm9wcy5ldmFsX2RhdGEueWVhcn08L2Rpdj5cblx0XHRcdFx0e3Byb2Z9XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicmF0aW5nLXdyYXBwZXJcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInN0YXItcmF0aW5ncy1zcHJpdGVcIj5cblx0XHRcdFx0XHRcdDxzcGFuIHN0eWxlPXt7d2lkdGg6IDEwMCp0aGlzLnByb3BzLmV2YWxfZGF0YS5zY29yZS81ICsgXCIlXCJ9fSBjbGFzc05hbWU9XCJyYXRpbmdcIj48L3NwYW4+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJudW1lcmljLXJhdGluZ1wiPntcIihcIiArIHRoaXMucHJvcHMuZXZhbF9kYXRhLnNjb3JlICsgXCIpXCJ9PC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0XHR7ZGV0YWlsc31cblx0XHQ8L2Rpdj4pO1xuXHR9LFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0aW5kZXhfc2VsZWN0ZWQ6IG51bGxcblx0XHR9O1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGkgPSAwO1xuXHRcdHZhciBldmFscyA9IHRoaXMucHJvcHMuZXZhbF9pbmZvLm1hcChmdW5jdGlvbihlKSB7XG5cdFx0XHRpKys7XG5cdFx0XHR2YXIgc2VsZWN0ZWQgPSBpID09IHRoaXMuc3RhdGUuaW5kZXhfc2VsZWN0ZWQ7XG5cdFx0XHRyZXR1cm4gKDxFdmFsdWF0aW9uIGV2YWxfZGF0YT17ZX0ga2V5PXtlLmlkfSBzZWxlY3Rpb25DYWxsYmFjaz17dGhpcy5jaGFuZ2VTZWxlY3RlZChpKX0gc2VsZWN0ZWQ9e3NlbGVjdGVkfSAvPik7XG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0XHR2YXIgY2xpY2tfbm90aWNlID0gdGhpcy5wcm9wcy5ldmFsX2luZm8ubGVuZ3RoID09IDAgPyAoPGRpdiBpZD1cImVtcHR5LWludHJvXCI+Tm8gY291cnNlIGV2YWx1YXRpb25zIGZvciB0aGlzIGNvdXJzZSB5ZXQ8L2Rpdj4pIDogKDxkaXYgaWQ9XCJjbGljay1pbnRyb1wiPkNsaWNrIGFuIGV2YWx1YXRpb24gaXRlbSBhYm92ZSB0byByZWFkIHRoZSBjb21tZW50czwvZGl2Pik7XG5cdFx0cmV0dXJuIChcblx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWVudHJ5XCIgaWQ9XCJjb3Vyc2UtZXZhbHVhdGlvbnNcIj5cblx0XHRcdDxoNj5Db3Vyc2UgRXZhbHVhdGlvbnM6PC9oNj5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZXZhbC13cmFwcGVyXCI+XG5cdFx0XHRcdHtldmFsc31cblx0XHRcdDwvZGl2PlxuXHRcdFx0e2NsaWNrX25vdGljZX1cblx0XHQ8L2Rpdj4pO1xuXHR9LFxuXG5cdGNoYW5nZVNlbGVjdGVkOiBmdW5jdGlvbihlX2luZGV4KSB7XG5cdFx0cmV0dXJuIChmdW5jdGlvbigpIHtcblx0XHRcdGlmICh0aGlzLnN0YXRlLmluZGV4X3NlbGVjdGVkID09IGVfaW5kZXgpIFxuXHRcdFx0XHR0aGlzLnNldFN0YXRlKHtpbmRleF9zZWxlY3RlZDogbnVsbH0pO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHR0aGlzLnNldFN0YXRlKHtpbmRleF9zZWxlY3RlZDogZV9pbmRleH0pO1xuXHRcdH0uYmluZCh0aGlzKSk7XG5cdH1cbn0pOyIsIm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgaWQ9XCJsb2FkXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlLWdyaWRcIj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlMVwiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmUyXCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTNcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlNFwiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmU1XCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTZcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlN1wiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmU4XCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTlcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2Pik7XG5cdH0sXG59KTtcblxuIiwidmFyIExvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyJyk7XG52YXIgQ291cnNlSW5mb1N0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvY291cnNlX2luZm8nKTtcbnZhciBFdmFsdWF0aW9uTWFuYWdlciA9IHJlcXVpcmUoJy4vZXZhbHVhdGlvbnMuanN4Jyk7XG52YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFVwZGF0ZVRpbWV0YWJsZXNTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgQ291cnNlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy9jb3Vyc2VfYWN0aW9ucycpO1xudmFyIFNlY3Rpb25TbG90ID0gcmVxdWlyZSgnLi9zZWN0aW9uX3Nsb3QuanN4JylcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdG1peGluczogW1JlZmx1eC5jb25uZWN0KENvdXJzZUluZm9TdG9yZSldLFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGxvYWRpbmcgPSB0aGlzLnN0YXRlLmluZm9fbG9hZGluZztcblx0XHR2YXIgbG9hZGVyID0gbG9hZGluZyA/IDxMb2FkZXIgLz4gOiBudWxsO1xuXHRcdHZhciBoZWFkZXIgPSBsb2FkaW5nID8gbnVsbCA6IHRoaXMuZ2V0SGVhZGVyKCk7XG5cdFx0dmFyIGRlc2NyaXB0aW9uID0gbG9hZGluZyA/IG51bGwgOiB0aGlzLmdldERlc2NyaXB0aW9uKCk7XG5cdFx0dmFyIGV2YWx1YXRpb25zID0gbG9hZGluZyA/IG51bGwgOiB0aGlzLmdldEV2YWx1YXRpb25zKCk7XG5cdFx0dmFyIHJlY29tZW5kYXRpb25zID0gbG9hZGluZyA/IG51bGwgOiB0aGlzLmdldFJlY29tZW5kYXRpb25zKCk7XG5cdFx0dmFyIHRleHRib29rcyA9IGxvYWRpbmcgPyBudWxsIDogdGhpcy5nZXRUZXh0Ym9va3MoKTtcblx0XHR2YXIgc2VjdGlvbnMgPSBsb2FkaW5nID8gbnVsbCA6IHRoaXMuZ2V0U2VjdGlvbnMoKTtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBpZD1cIm1vZGFsLWNvbnRlbnRcIj5cblx0XHRcdFx0PGkgY2xhc3NOYW1lPVwicmlnaHQgZmEgZmEtMnggZmEtdGltZXMgY2xvc2UtY291cnNlLW1vZGFsXCIgb25DbGljaz17dGhpcy5wcm9wcy5oaWRlfT48L2k+XG4gICAgICAgICAgICAgICAge2xvYWRlcn1cbiAgICAgICAgICAgICAgICB7aGVhZGVyfVxuICAgICAgICAgICAgICAgIHtkZXNjcmlwdGlvbn1cbiAgICAgICAgICAgICAgICB7ZXZhbHVhdGlvbnN9XG4gICAgICAgICAgICAgICAge3NlY3Rpb25zfVxuICAgICAgICAgICAgICAgIHt0ZXh0Ym9va3N9XG4gICAgICAgICAgICAgICAge3JlY29tZW5kYXRpb25zfVxuICAgICAgICAgICAgPC9kaXY+KTtcblx0fSxcblxuXHRnZXRIZWFkZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjb3Vyc2VfaWQgPSB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLmlkO1xuXHRcdHZhciBjX3RvX3MgPSB0aGlzLnByb3BzLmNvdXJzZXNfdG9fc2VjdGlvbnM7XG5cdFx0dmFyIGFkZF9vcl9yZW1vdmUgPSBPYmplY3Qua2V5cyhjX3RvX3MpLmluZGV4T2YoU3RyaW5nKGNvdXJzZV9pZCkpID4gLTEgP1xuXHRcdCg8c3BhbiBjbGFzc05hbWU9XCJjb3Vyc2UtYWN0aW9uIGZ1aS1jaGVja1wiIG9uQ2xpY2s9e3RoaXMudG9nZ2xlQ291cnNlKHRydWUpfS8+KSA6IFxuXHRcdCg8c3BhbiBjbGFzc05hbWU9XCJjb3Vyc2UtYWN0aW9uIGZ1aS1wbHVzXCIgb25DbGljaz17dGhpcy50b2dnbGVDb3Vyc2UoZmFsc2UpfS8+KTtcblx0XHR2YXIgaGVhZGVyID0gKDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtaGVhZGVyXCI+XG5cdFx0XHR7YWRkX29yX3JlbW92ZX1cblx0XHRcdDxkaXYgaWQ9XCJjb3Vyc2UtaW5mby13cmFwcGVyXCI+XG5cdFx0XHRcdDxkaXYgaWQ9XCJuYW1lXCI+e3RoaXMuc3RhdGUuY291cnNlX2luZm8ubmFtZX08L2Rpdj5cblx0XHRcdFx0PGRpdiBpZD1cImNvZGVcIj57dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5jb2RlfTwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0PC9kaXY+KTtcblx0XHRyZXR1cm4gaGVhZGVyO1xuXHR9LFxuXHR0b2dnbGVDb3Vyc2U6IGZ1bmN0aW9uKHJlbW92aW5nKSB7XG5cdFx0Ly8gaWYgcmVtb3ZpbmcgaXMgdHJ1ZSwgd2UncmUgcmVtb3ZpbmcgdGhlIGNvdXJzZSwgaWYgZmFsc2UsIHdlJ3JlIGFkZGluZyBpdFxuXHRcdHJldHVybiAoZnVuY3Rpb24gKCkge1xuXHRcdFx0VGltZXRhYmxlQWN0aW9ucy51cGRhdGVDb3Vyc2VzKHtpZDogdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5pZCwgc2VjdGlvbjogJycsIHJlbW92aW5nOiByZW1vdmluZ30pO1xuXHRcdH0uYmluZCh0aGlzKSk7XG5cdH0sXG5cdG9wZW5SZWNvbWVuZGF0aW9uOiBmdW5jdGlvbihjb3Vyc2VfaWQpIHtcblx0XHRyZXR1cm4gKGZ1bmN0aW9uKCkge1xuXHRcdFx0Q291cnNlQWN0aW9ucy5nZXRDb3Vyc2VJbmZvKHRoaXMucHJvcHMuc2Nob29sLCBjb3Vyc2VfaWQpO1xuXHRcdH0uYmluZCh0aGlzKSk7XG5cdH0sXG5cblx0Z2V0RGVzY3JpcHRpb246IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBkZXNjcmlwdGlvbiA9IFxuXHRcdFx0KDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZW50cnlcIiBpZD1cImNvdXJzZS1kZXNjcmlwdGlvblwiPlxuXHRcdFx0XHQ8aDY+RGVzY3JpcHRpb246PC9oNj5cblx0XHRcdFx0e3RoaXMuc3RhdGUuY291cnNlX2luZm8uZGVzY3JpcHRpb259XG5cdFx0XHQ8L2Rpdj4pXG5cdFx0cmV0dXJuIGRlc2NyaXB0aW9uO1xuXHR9LFxuXG5cdGdldEV2YWx1YXRpb25zOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gPEV2YWx1YXRpb25NYW5hZ2VyIGV2YWxfaW5mbz17dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5ldmFsX2luZm99IC8+XG5cdH0sXG5cblx0Z2V0UmVjb21lbmRhdGlvbnM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciByZWxhdGVkID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5yZWxhdGVkX2NvdXJzZXMuc2xpY2UoMCwzKS5tYXAoZnVuY3Rpb24ocmMpIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBcdDxkaXYgY2xhc3NOYW1lPVwicmVjb21tZW5kYXRpb25cIiBvbkNsaWNrPXt0aGlzLm9wZW5SZWNvbWVuZGF0aW9uKHJjLmlkKX0ga2V5PXtyYy5pZH0+XG4gICAgICAgICAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJjZW50ZXItd3JhcHBlclwiPlxuXHQgICAgICAgICAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJyZWMtd3JhcHBlclwiPlxuXHRcdCAgICAgICAgICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm5hbWVcIj57cmMubmFtZX08L2Rpdj5cblx0XHQgICAgICAgICAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2RlXCI+e3JjLmNvZGV9PC9kaXY+XG5cdFx0ICAgICAgICAgICAgXHQ8L2Rpdj5cblx0XHQgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIFx0PC9kaXY+KVxuICAgICAgICB9LmJpbmQodGhpcykpO1xuXHRcdHZhciByZWNvbWVuZGF0aW9ucyA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8ucmVsYXRlZF9jb3Vyc2VzLmxlbmd0aCA9PSAwID8gbnVsbCA6XG5cdFx0XHQoPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1lbnRyeVwiPlxuXHRcdFx0XHQ8aDY+Q291cnNlcyBZb3UgTWlnaHQgTGlrZTo8L2g2PlxuXHRcdFx0XHQ8ZGl2IGlkPVwiY291cnNlLXJlY29tZW5kYXRpb25zXCI+XG5cdFx0XHRcdFx0e3JlbGF0ZWR9XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+KVxuXHRcdHJldHVybiByZWNvbWVuZGF0aW9uc1xuXHR9LFxuXG5cdGV4cGFuZFJlY29tZW5kYXRpb25zOiBmdW5jdGlvbigpIHtcblxuXHR9LFxuXG5cdGdldFRleHRib29rczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHRleHRib29rX2VsZW1lbnRzID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby50ZXh0Ym9va19pbmZvWzBdLnRleHRib29rcy5tYXAoZnVuY3Rpb24odGIpIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBcdDxkaXYgY2xhc3NOYW1lPVwidGV4dGJvb2tcIiBrZXk9e3RiLmlkfT5cbiAgICAgICAgICAgIFx0XHQ8aW1nIGhlaWdodD1cIjk1XCIgc3JjPXt0Yi5pbWFnZV91cmx9Lz5cbiAgICAgICAgICAgIFx0XHQ8aDYgY2xhc3NOYW1lPVwibGluZS1jbGFtcFwiPnt0Yi50aXRsZX08L2g2PlxuICAgICAgICAgICAgXHRcdDxkaXY+e3RiLmF1dGhvcn08L2Rpdj5cbiAgICAgICAgICAgIFx0XHQ8ZGl2PklTQk46e3RiLmlzYm59PC9kaXY+XG4gICAgICAgICAgICBcdFx0PGEgaHJlZj17dGIuZGV0YWlsX3VybH0gdGFyZ2V0PVwiX2JsYW5rXCI+XG4gICAgICAgICAgICBcdFx0XHQ8aW1nIHNyYz1cImh0dHBzOi8vaW1hZ2VzLW5hLnNzbC1pbWFnZXMtYW1hem9uLmNvbS9pbWFnZXMvRy8wMS9hc3NvY2lhdGVzL3JlbW90ZS1idXktYm94L2J1eTUuX1YxOTIyMDc3MzlfLmdpZlwiIHdpZHRoPVwiMTIwXCIgaGVpZ2h0PVwiMjhcIiBib3JkZXI9XCIwXCIvPlxuICAgICAgICAgICAgXHRcdDwvYT5cbiAgICAgICAgICAgIFx0PC9kaXY+KTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcblx0XHR2YXIgdGV4dGJvb2tzID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby50ZXh0Ym9va19pbmZvWzBdLnRleHRib29rcy5sZW5ndGggPT0gMCA/ICg8ZGl2IGlkPVwiZW1wdHktaW50cm9cIj5ObyB0ZXh0Ym9va3MgZm9yIHRoaXMgY291cnNlIHlldC48L2Rpdj4pIDpcblx0XHRcdFx0KDxkaXYgaWQ9XCJ0ZXh0Ym9va3NcIj5cblx0ICAgICAgICAgICAgXHR7dGV4dGJvb2tfZWxlbWVudHN9XG5cdCAgICAgICAgICAgIDwvZGl2Pik7XG5cdFx0dmFyIHJldCA9IFxuXHRcdFx0KDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZW50cnlcIiBpZD1cImNvdXJzZS10ZXh0Ym9va3NcIj5cblx0XHRcdFx0PGg2PlRleHRib29rczo8L2g2PlxuXHRcdFx0XHR7dGV4dGJvb2tzfVxuXHRcdFx0PC9kaXY+KTtcblx0XHRyZXR1cm4gcmV0O1xuXHR9LFxuXG5cdGdldFNlY3Rpb25zOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgRiA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8uc2VjdGlvbnNfRi5tYXAoZnVuY3Rpb24ocyl7XG5cdFx0XHRyZXR1cm4gKDxTZWN0aW9uU2xvdCBrZXk9e3N9IGFsbF9zZWN0aW9ucz17dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5zZWN0aW9uc19GX29ianN9IHNlY3Rpb249e3N9Lz4pXG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0XHR2YXIgUyA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8uc2VjdGlvbnNfUy5tYXAoZnVuY3Rpb24ocyl7XG5cdFx0XHRyZXR1cm4gKDxTZWN0aW9uU2xvdCBrZXk9e3N9IGFsbF9zZWN0aW9ucz17dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5zZWN0aW9uc19TX29ianN9IHNlY3Rpb249e3N9Lz4pXG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0XHRpZiAodGhpcy5zdGF0ZS5zaG93X3NlY3Rpb25zID09PSB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLmNvZGUpIHtcblx0XHRcdHZhciBzZWNfZGlzcGxheSA9IChcblx0XHRcdFx0PGRpdiBpZD1cImFsbC1zZWN0aW9ucy13cmFwcGVyXCI+XG5cdFx0XHRcdFx0e0Z9XG5cdFx0XHRcdFx0e1N9XG5cdFx0XHRcdDwvZGl2Pik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBzZWN0aW9uc19jb3VudCA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8uc2VjdGlvbnNfUy5sZW5ndGggKyB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnNlY3Rpb25zX0YubGVuZ3RoO1xuXHRcdFx0dmFyIHNlY3Rpb25zX2dyYW1tYXIgPSBzZWN0aW9uc19jb3VudCA+IDEgPyBcInNlY3Rpb25zXCIgOiBcInNlY3Rpb25cIjtcblx0XHRcdHZhciBzZWNfZGlzcGxheSA9ICg8ZGl2IGlkPVwibnVtU2VjdGlvbnNcIiBvbkNsaWNrPXt0aGlzLnNldFNob3dTZWN0aW9ucyh0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLmNvZGUpfT5UaGlzIGNvdXJzZSBoYXMgPGI+e3NlY3Rpb25zX2NvdW50fTwvYj4ge3NlY3Rpb25zX2dyYW1tYXJ9LiBDbGljayBoZXJlIHRvIHZpZXcuPC9kaXY+KVxuXHRcdH1cblx0XHR2YXIgc2VjdGlvbnMgPSBcblx0XHRcdCg8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWVudHJ5XCIgaWQ9XCJjb3Vyc2Utc2VjdGlvbnNcIj5cblx0XHRcdFx0PGg2PkNvdXJzZSBTZWN0aW9uczo8L2g2PlxuXHRcdFx0XHR7c2VjX2Rpc3BsYXl9XG5cdFx0XHQ8L2Rpdj4pO1xuXHRcdHJldHVybiBzZWN0aW9ucztcblx0fSxcblxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzaG93X3NlY3Rpb25zOiAwXG5cdFx0fTtcblx0fSxcblxuXHRzZXRTaG93U2VjdGlvbnM6IGZ1bmN0aW9uKGlkKSB7XG5cdFx0cmV0dXJuIChmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMuc2V0U3RhdGUoe3Nob3dfc2VjdGlvbnM6IGlkfSk7XG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0fSxcblxuXG59KTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtmaXJzdF9kaXNwbGF5ZWQ6IDB9O1xuICB9LFxuXG4gIGNoYW5nZVBhZ2U6IGZ1bmN0aW9uKGRpcmVjdGlvbikge1xuICAgICAgcmV0dXJuIChmdW5jdGlvbihldmVudCkge1xuICAgICAgIHZhciBjdXJyZW50ID0gdGhpcy5wcm9wcy5jdXJyZW50X2luZGV4LFxuICAgICAgICAgICBjb3VudCA9IHRoaXMucHJvcHMuY291bnQ7XG4gICAgICAgLy8gY2FsY3VsYXRlIHRoZSBuZXcgZmlyc3RfZGlzcGxheWVkIGJ1dHRvbiAodGltZXRhYmxlKVxuICAgICAgIHZhciBuZXdfZmlyc3QgPSBjdXJyZW50ICsgKDkqZGlyZWN0aW9uKSAtIChjdXJyZW50ICUgOSk7XG4gICAgICAgaWYgKG5ld19maXJzdCA+PSAwICYmIG5ld19maXJzdCA8IGNvdW50KSB7XG4gICAgICAgIHRoaXMucHJvcHMuc2V0SW5kZXgobmV3X2ZpcnN0KSgpO1xuICAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuICB9LFxuXG4gICAgXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgXHR2YXIgb3B0aW9ucyA9IFtdLCBjb3VudCA9IHRoaXMucHJvcHMuY291bnQsIGN1cnJlbnQgPSB0aGlzLnByb3BzLmN1cnJlbnRfaW5kZXg7XG4gICAgXHRpZiAoY291bnQgPD0gMSkgeyByZXR1cm4gbnVsbDsgfSAvLyBkb24ndCBkaXNwbGF5IGlmIHRoZXJlIGFyZW4ndCBlbm91Z2ggc2NoZWR1bGVzXG4gICAgXHR2YXIgZmlyc3QgPSBjdXJyZW50IC0gKGN1cnJlbnQgJSA5KTsgLy8gcm91bmQgZG93biB0byBuZWFyZXN0IG11bHRpcGxlIG9mIDlcbiAgICBcdHZhciBsaW1pdCA9IE1hdGgubWluKGZpcnN0ICsgOSwgY291bnQpO1xuICAgIFx0Zm9yICh2YXIgaSA9IGZpcnN0OyBpIDwgbGltaXQ7IGkrKykge1xuICAgICBcdCB2YXIgY2xhc3NOYW1lID0gdGhpcy5wcm9wcy5jdXJyZW50X2luZGV4ID09IGkgPyBcImFjdGl2ZVwiIDogXCJcIjtcbiAgICAgIFx0XHRvcHRpb25zLnB1c2goXG4gICAgICAgIFx0XHQ8bGkga2V5PXtpfSBjbGFzc05hbWU9e1wic2VtLXBhZ2UgXCIgKyBjbGFzc05hbWV9IG9uQ2xpY2s9e3RoaXMucHJvcHMuc2V0SW5kZXgoaSl9PlxuICAgICAgICAgICAgIFx0XHQge2kgKyAxfVxuICAgICAgIFx0XHRcdDwvbGk+KTtcbiAgXHRcdH1cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZW0tcGFnaW5hdGlvblwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlbS1wYWdpbmF0aW9uLW5hdiBuYXYtZG91YmxlIG5hdi1kb3VibGUtcHJldlwiIG9uQ2xpY2s9e3RoaXMuY2hhbmdlUGFnZSgtMSl9PlxuXHRcdFx0XHRcdDxpIGNsYXNzTmFtZT1cImZhIGZhLWFuZ2xlLWRvdWJsZS1sZWZ0IHNlbS1wYWdpbmF0aW9uLXByZXYgc2VtLXBhZ2luYXRpb24taWNvblwiIC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlbS1wYWdpbmF0aW9uLW5hdlwiIG9uQ2xpY2s9e3RoaXMucHJvcHMucHJldn0+XG5cdFx0XHRcdFx0PGkgY2xhc3NOYW1lPVwiZmEgZmEtYW5nbGUtbGVmdCBzZW0tcGFnaW5hdGlvbi1wcmV2IHNlbS1wYWdpbmF0aW9uLWljb25cIiAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PG9sIGNsYXNzTmFtZT1cInNlbS1wYWdlc1wiPlxuXHRcdFx0XHRcdHtvcHRpb25zfVxuXHRcdFx0XHQ8L29sPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlbS1wYWdpbmF0aW9uLW5hdlwiIG9uQ2xpY2s9e3RoaXMucHJvcHMubmV4dH0+XG5cdFx0XHRcdFx0PGkgY2xhc3NOYW1lPVwiZmEgZmEtYW5nbGUtcmlnaHQgc2VtLXBhZ2luYXRpb24tbmV4dCBzZW0tcGFnaW5hdGlvbi1pY29uXCIgLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2VtLXBhZ2luYXRpb24tbmF2IG5hdi1kb3VibGUgbmF2LWRvdWJsZS1uZXh0XCIgb25DbGljaz17dGhpcy5jaGFuZ2VQYWdlKDEpfT5cblx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9XCJmYSBmYS1hbmdsZS1kb3VibGUtcmlnaHQgc2VtLXBhZ2luYXRpb24tbmV4dCBzZW0tcGFnaW5hdGlvbi1pY29uXCIgLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9LFxufSk7IiwibW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG51bV9idWJibGVzID0gdGhpcy5nZXROdW1CdWJibGVzKCk7XG4gICAgcmV0dXJuIHtmaXJzdF9kaXNwbGF5ZWQ6IDAsIG51bV9idWJibGVzOiBudW1fYnViYmxlc307XG4gIH0sXG4gIGdldE51bUJ1YmJsZXM6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBidWJibGVzID0gJCh3aW5kb3cpLndpZHRoKCkgPiA3MDAgPyA5IDogNDtcbiAgICByZXR1cm4gYnViYmxlcztcbiAgfSxcblxuICBjaGFuZ2VQYWdlOiBmdW5jdGlvbihkaXJlY3Rpb24pIHtcbiAgICAgIHJldHVybiAoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICB2YXIgY3VycmVudCA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleCxcbiAgICAgICAgICAgY291bnQgPSB0aGlzLnByb3BzLmNvdW50O1xuICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgbmV3IGZpcnN0X2Rpc3BsYXllZCBidXR0b24gKHRpbWV0YWJsZSlcbiAgICAgICB2YXIgbmV3X2ZpcnN0ID0gY3VycmVudCArICh0aGlzLnN0YXRlLm51bV9idWJibGVzKmRpcmVjdGlvbikgLSAoY3VycmVudCAlIHRoaXMuc3RhdGUubnVtX2J1YmJsZXMpO1xuICAgICAgIGlmIChuZXdfZmlyc3QgPj0gMCAmJiBuZXdfZmlyc3QgPCBjb3VudCkge1xuICAgICAgICB0aGlzLnByb3BzLnNldEluZGV4KG5ld19maXJzdCkoKTtcbiAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvcHRpb25zID0gW10sIGNvdW50ID0gdGhpcy5wcm9wcy5jb3VudCwgY3VycmVudCA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleDtcbiAgICBpZiAoY291bnQgPD0gMSkgeyByZXR1cm4gbnVsbDsgfSAvLyBkb24ndCBkaXNwbGF5IGlmIHRoZXJlIGFyZW4ndCBlbm91Z2ggc2NoZWR1bGVzXG4gICAgdmFyIGZpcnN0ID0gY3VycmVudCAtIChjdXJyZW50ICUgdGhpcy5zdGF0ZS5udW1fYnViYmxlcyk7IC8vIHJvdW5kIGRvd24gdG8gbmVhcmVzdCBtdWx0aXBsZSBvZiB0aGlzLnByb3BzLm51bUJ1YmJsZXNcbiAgICB2YXIgbGltaXQgPSBNYXRoLm1pbihmaXJzdCArIHRoaXMuc3RhdGUubnVtX2J1YmJsZXMsIGNvdW50KTtcbiAgICBmb3IgKHZhciBpID0gZmlyc3Q7IGkgPCBsaW1pdDsgaSsrKSB7XG4gICAgICB2YXIgY2xhc3NOYW1lID0gdGhpcy5wcm9wcy5jdXJyZW50X2luZGV4ID09IGkgPyBcImFjdGl2ZVwiIDogXCJcIjtcbiAgICAgIG9wdGlvbnMucHVzaChcbiAgICAgICAgPGxpIGtleT17aX0gY2xhc3NOYW1lPXtjbGFzc05hbWV9PlxuICAgICAgICAgICAgICA8YSBvbkNsaWNrPXt0aGlzLnByb3BzLnNldEluZGV4KGkpfT57aSArIDF9PC9hPlxuICAgICAgICA8L2xpPik7XG4gICAgfVxuICAgIHZhciBwcmV2X2RvdWJsZSA9IChcbiAgICAgIDxsaSBjbGFzc05hbWU9XCJwcmV2LWRvdWJsZVwiIG9uQ2xpY2s9e3RoaXMuY2hhbmdlUGFnZSgtMSl9PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2luYXRpb24tYnRuXCI+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtYW5nbGUtZG91YmxlLWxlZnRcIj48L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9saT5cbiAgICApO1xuICAgIHZhciBuZXh0X2RvdWJsZSA9IChcbiAgICAgIDxsaSBjbGFzc05hbWU9XCJuZXh0LWRvdWJsZVwiIG9uQ2xpY2s9e3RoaXMuY2hhbmdlUGFnZSgxKX0+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicGFnaW5hdGlvbi1idG5cIj5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1hbmdsZS1kb3VibGUtcmlnaHRcIj48L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9saT5cbiAgICApO1xuICAgIGlmIChjb3VudCA8ICh0aGlzLnN0YXRlLm51bV9idWJibGVzICsgMSkpIHtcbiAgICAgIHByZXZfZG91YmxlID0gbnVsbDtcbiAgICAgIG5leHRfZG91YmxlID0gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2luYXRpb24gcGFnaW5hdGlvbi1taW5pbWFsXCI+XG4gICAgICAgICAgPHVsPlxuICAgICAgICAgICAge3ByZXZfZG91YmxlfVxuICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cInByZXZpb3VzXCI+XG4gICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImZ1aS1hcnJvdy1sZWZ0IHBhZ2luYXRpb24tYnRuXCIgXG4gICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5wcm9wcy5wcmV2fT48L2E+XG4gICAgICAgICAgICA8L2xpPlxuXG4gICAgICAgICAgICB7b3B0aW9uc31cbiAgICAgICAgICBcbiAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJuZXh0XCI+XG4gICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImZ1aS1hcnJvdy1yaWdodCBwYWdpbmF0aW9uLWJ0blwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5wcm9wcy5uZXh0fT48L2E+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAge25leHRfZG91YmxlfVxuICAgICAgICAgIDwvdWw+XG4gICAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICQod2luZG93KS5yZXNpemUoZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtudW1fYnViYmxlczogdGhpcy5nZXROdW1CdWJibGVzKCl9KTtcbiAgICB9LmJpbmQodGhpcykpO1xuICB9LFxuICBcblxufSk7IiwidmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBUaW1ldGFibGVTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG5cbnZhciBCaW5hcnlQcmVmZXJlbmNlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBtaXhpbnM6IFtSZWZsdXguY29ubmVjdChUaW1ldGFibGVTdG9yZSldLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRvZ2dsZV9sYWJlbCA9IFwiY21uLXRvZ2dsZS1cIiArIHRoaXMucHJvcHMudG9nZ2xlX2lkO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInByZWZlcmVuY2UtaXRlbVwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInByZWZlcmVuY2UtdGV4dFwiPlxuICAgICAgICAgIDxsaT4ge3RoaXMucHJvcHMudGV4dH0gPC9saT5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHJlZmVyZW5jZS10b2dnbGVcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInN3aXRjaFwiPlxuICAgICAgICAgICAgPGlucHV0IHJlZj1cImNoZWNrYm94X2VsZW1cIiBpZD17dG9nZ2xlX2xhYmVsfSBcbiAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e1wiY21uLXRvZ2dsZSBjbW4tdG9nZ2xlLXJvdW5kIFwiICsgdGhpcy5wcm9wcy5uYW1lfSBcbiAgICAgICAgICAgICAgICAgICB0eXBlPVwiY2hlY2tib3hcIiBcbiAgICAgICAgICAgICAgICAgICBjaGVja2VkPXt0aGlzLnN0YXRlLnByZWZlcmVuY2VzW3RoaXMucHJvcHMubmFtZV19XG4gICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy50b2dnbGVQcmVmZXJlbmNlfS8+XG4gICAgICAgICAgICA8bGFiZWwgaHRtbEZvcj17dG9nZ2xlX2xhYmVsfT48L2xhYmVsPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgdG9nZ2xlUHJlZmVyZW5jZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG5ld192YWx1ZSA9ICF0aGlzLnN0YXRlLnByZWZlcmVuY2VzW3RoaXMucHJvcHMubmFtZV07XG4gICAgVGltZXRhYmxlQWN0aW9ucy51cGRhdGVQcmVmZXJlbmNlcyh0aGlzLnByb3BzLm5hbWUsIG5ld192YWx1ZSk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgY3VycmVudF90b2dnbGVfaWQ6IDAsXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBpZD1cIm1lbnUtY29udGFpbmVyXCIgY2xhc3NOYW1lPVwiY29sbGFwc2VcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJuYXZiYXItY29sbGFwc2VcIiA+XG4gICAgICAgICAgPHVsIGNsYXNzTmFtZT1cIm5hdiBuYXZiYXItbmF2XCIgaWQ9XCJtZW51XCI+XG4gICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICA8QmluYXJ5UHJlZmVyZW5jZSB0ZXh0PVwiQXZvaWQgZWFybHkgY2xhc3Nlc1wiIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU9XCJub19jbGFzc2VzX2JlZm9yZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9nZ2xlX2lkPXt0aGlzLmdldF9uZXh0X3RvZ2dsZV9pZCgpfSAvPlxuICAgICAgICAgICAgICAgIDxCaW5hcnlQcmVmZXJlbmNlIHRleHQ9XCJBdm9pZCBsYXRlIGNsYXNzZXNcIiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lPVwibm9fY2xhc3Nlc19hZnRlclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9nZ2xlX2lkPXt0aGlzLmdldF9uZXh0X3RvZ2dsZV9pZCgpfSAvPlxuICAgICAgICAgICAgICAgIDxCaW5hcnlQcmVmZXJlbmNlIHRleHQ9XCJBbGxvdyBjb25mbGljdHNcIiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lPVwidHJ5X3dpdGhfY29uZmxpY3RzXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2dnbGVfaWQ9e3RoaXMuZ2V0X25leHRfdG9nZ2xlX2lkKCl9IC8+XG4gICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgIDwvdWw+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICBnZXRfbmV4dF90b2dnbGVfaWQ6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY3VycmVudF90b2dnbGVfaWQgKz0gMVxuICAgIHJldHVybiB0aGlzLmN1cnJlbnRfdG9nZ2xlX2lkO1xuICB9XG5cbn0pO1xuIiwidmFyIENvbnRyb2xCYXIgPSByZXF1aXJlKCcuL2NvbnRyb2xfYmFyJyk7XG52YXIgVGltZXRhYmxlID0gcmVxdWlyZSgnLi90aW1ldGFibGUnKTtcbnZhciBNb2RhbENvbnRlbnQgPSByZXF1aXJlKCcuL21vZGFsX2NvbnRlbnQnKTtcbnZhciBUb2FzdFN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdG9hc3Rfc3RvcmUuanMnKTtcbnZhciBUaW1ldGFibGVTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgY291cnNlX2FjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvY291cnNlX2FjdGlvbnMnKTtcbnZhciBTaWRlYmFyID0gcmVxdWlyZSgnLi9zaWRlX2JhcicpO1xudmFyIFNpbXBsZU1vZGFsID0gcmVxdWlyZSgnLi9zaW1wbGVfbW9kYWwnKTtcbnZhciBTY2hvb2xMaXN0ID0gcmVxdWlyZSgnLi9zY2hvb2xfbGlzdCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgbWl4aW5zOiBbUmVmbHV4LmNvbm5lY3QoVGltZXRhYmxlU3RvcmUpLCBSZWZsdXguY29ubmVjdChUb2FzdFN0b3JlKV0sXG4gIHNpZGViYXJfY29sbGFwc2VkOiAnbmV1dHJhbCcsXG5cblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBNb2RhbCA9IEJvcm9uWydPdXRsaW5lTW9kYWwnXTtcbiAgICB2YXIgc2Nob29sX3NlbGVjdG9yID0gbnVsbDtcbiAgICB2YXIgbG9hZGVyID0gISh0aGlzLnN0YXRlLmxvYWRpbmcgfHwgdGhpcy5zdGF0ZS5jb3Vyc2VzX2xvYWRpbmcpID8gbnVsbCA6XG4gICAgICAoICA8ZGl2IGNsYXNzTmFtZT1cInNwaW5uZXJcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVjdDFcIj48L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVjdDJcIj48L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVjdDNcIj48L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVjdDRcIj48L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVjdDVcIj48L2Rpdj5cbiAgICAgICAgPC9kaXY+KTtcbiAgICBpZiAodGhpcy5zdGF0ZS5zY2hvb2wgPT0gXCJcIikge1xuICAgICAgc2Nob29sX3NlbGVjdG9yID0gKFxuICAgICAgPFNpbXBsZU1vZGFsIGhlYWRlcj17XCJTZW1lc3Rlci5seSB8IFdlbGNvbWVcIn1cbiAgICAgICAgICAgICAgICAgICBzdHlsZXM9e3tiYWNrZ3JvdW5kQ29sb3I6IFwiI0ZERjVGRlwiLCBjb2xvcjogXCIjMDAwXCJ9fSBcbiAgICAgICAgICAgICAgICAgICBjb250ZW50PXs8U2Nob29sTGlzdCBzZXRTY2hvb2w9e3RoaXMuc2V0U2Nob29sfS8+IH0vPlxuICAgICAgKTt9XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJyb290XCI+XG4gICAgICAgIHtzY2hvb2xfc2VsZWN0b3J9XG4gICAgICAgIHtsb2FkZXJ9XG4gICAgICAgIDxkaXYgaWQ9XCJ0b2FzdC1jb250YWluZXJcIj48L2Rpdj5cbiAgICAgICAgPGRpdiBpZD1cImNvbnRyb2wtYmFyLWNvbnRhaW5lclwiPlxuICAgICAgICAgIDxkaXYgaWQ9XCJzZW1lc3Rlcmx5LW5hbWVcIj5TZW1lc3Rlci5seTwvZGl2PlxuICAgICAgICAgIDxpbWcgaWQ9XCJzZW1lc3Rlcmx5LWxvZ29cIiBzcmM9XCIvc3RhdGljL2ltZy9sb2dvMi4wLnBuZ1wiLz5cbiAgICAgICAgICA8Q29udHJvbEJhciB0b2dnbGVNb2RhbD17dGhpcy50b2dnbGVDb3Vyc2VNb2RhbH0vPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBpZD1cIm5hdmljb25cIiBvbkNsaWNrPXt0aGlzLnRvZ2dsZVNpZGVNb2RhbH0+XG4gICAgICAgICAgPHNwYW4+PC9zcGFuPjxzcGFuPjwvc3Bhbj48c3Bhbj48L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGlkPVwibW9kYWwtY29udGFpbmVyXCI+XG4gICAgICAgICAgPE1vZGFsIGNsb3NlT25DbGljaz17dHJ1ZX0gcmVmPSdPdXRsaW5lTW9kYWwnIGNsYXNzTmFtZT1cImNvdXJzZS1tb2RhbFwiPlxuICAgICAgICAgICAgICA8TW9kYWxDb250ZW50IHNjaG9vbD17dGhpcy5zdGF0ZS5zY2hvb2x9IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdXJzZXNfdG9fc2VjdGlvbnM9e3RoaXMuc3RhdGUuY291cnNlc190b19zZWN0aW9uc30gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGlkZT17dGhpcy5oaWRlQ291cnNlTW9kYWx9IC8+XG4gICAgICAgICAgPC9Nb2RhbD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWxsLWNvbHMtY29udGFpbmVyXCI+XG4gICAgICAgICAgPFNpZGViYXIgdG9nZ2xlTW9kYWw9e3RoaXMudG9nZ2xlQ291cnNlTW9kYWx9Lz5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNhbC1jb250YWluZXJcIj5cbiAgICAgICAgICAgIDxUaW1ldGFibGUgdG9nZ2xlTW9kYWw9e3RoaXMudG9nZ2xlQ291cnNlTW9kYWx9IC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICB0b2dnbGVDb3Vyc2VNb2RhbDogZnVuY3Rpb24oY291cnNlX2lkKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnJlZnNbJ091dGxpbmVNb2RhbCddLnRvZ2dsZSgpO1xuICAgICAgICBjb3Vyc2VfYWN0aW9ucy5nZXRDb3Vyc2VJbmZvKHRoaXMuc3RhdGUuc2Nob29sLCBjb3Vyc2VfaWQpO1xuICAgIH0uYmluZCh0aGlzKTsgXG4gIH0sXG5cbiAgaGlkZUNvdXJzZU1vZGFsOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnJlZnNbJ091dGxpbmVNb2RhbCddLmhpZGUoKTtcbiAgfSxcblxuXG4gIHRvZ2dsZVNpZGVNb2RhbDogZnVuY3Rpb24oKXtcbiAgICBpZiAodGhpcy5zaWRlYmFyX2NvbGxhcHNlZCA9PSAnbmV1dHJhbCcpIHtcbiAgICAgIHZhciBib2R5dyA9ICQod2luZG93KS53aWR0aCgpO1xuICAgICAgaWYgKGJvZHl3ID4gOTk5KSB7XG4gICAgICAgIHRoaXMuY29sbGFwc2VTaWRlTW9kYWwoKTtcbiAgICAgICAgdGhpcy5zaWRlYmFyX2NvbGxhcHNlZCA9ICdvcGVuJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZXhwYW5kU2lkZU1vZGFsKCk7XG4gICAgICAgIHRoaXMuc2lkZWJhcl9jb2xsYXBzZWQgPSAnY2xvc2VkJztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMuc2lkZWJhcl9jb2xsYXBzZWQgPT0gJ2Nsb3NlZCcpIHtcbiAgICAgIHRoaXMuZXhwYW5kU2lkZU1vZGFsKCk7XG4gICAgICB0aGlzLnNpZGViYXJfY29sbGFwc2VkID0gJ29wZW4nO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNvbGxhcHNlU2lkZU1vZGFsKCk7XG4gICAgICB0aGlzLnNpZGViYXJfY29sbGFwc2VkID0gJ2Nsb3NlZCc7XG4gICAgfVxuICB9LFxuXG4gIGV4cGFuZFNpZGVNb2RhbDogZnVuY3Rpb24oKSB7XG4gICAgJCgnLmNhbC1jb250YWluZXIsIC5zaWRlLWNvbnRhaW5lcicpLnJlbW92ZUNsYXNzKCdmdWxsLWNhbCcpLmFkZENsYXNzKCdsZXNzLWNhbCcpO1xuICB9LFxuXG4gIGNvbGxhcHNlU2lkZU1vZGFsOiBmdW5jdGlvbigpIHtcbiAgICAkKCcuY2FsLWNvbnRhaW5lciwgLnNpZGUtY29udGFpbmVyJykucmVtb3ZlQ2xhc3MoJ2xlc3MtY2FsJykuYWRkQ2xhc3MoJ2Z1bGwtY2FsJyk7XG4gIH1cblxufSk7XG4iLCJUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIFx0KFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzY2hvb2wtbGlzdFwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNjaG9vbC1waWNrZXIgc2Nob29sLWpodVwiIFxuXHRcdFx0XHRcdG9uQ2xpY2s9e3RoaXMuc2V0U2Nob29sKFwiamh1XCIpfT5cblx0XHRcdFx0XHQ8aW1nIHNyYz1cIi9zdGF0aWMvaW1nL3NjaG9vbF9sb2dvcy9qaHVfbG9nby5wbmdcIiBcblx0XHRcdFx0XHRcdGNsYXNzTmFtZT1cInNjaG9vbC1sb2dvXCIvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzY2hvb2wtcGlja2VyIHNjaG9vbC11b2Z0XCIgXG5cdFx0XHRcdFx0b25DbGljaz17dGhpcy5zZXRTY2hvb2woXCJ1b2Z0XCIpfT5cblx0XHRcdFx0XHQ8aW1nIHNyYz1cIi9zdGF0aWMvaW1nL3NjaG9vbF9sb2dvcy91b2Z0X2xvZ28ucG5nXCIgXG5cdFx0XHRcdFx0XHRjbGFzc05hbWU9XCJzY2hvb2wtbG9nb1wiLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj4pO1xuXHR9LFxuXG5cdHNldFNjaG9vbDogZnVuY3Rpb24obmV3X3NjaG9vbCkge1xuXHRcdHJldHVybiAoZnVuY3Rpb24oKSB7XG5cdFx0XHRUaW1ldGFibGVBY3Rpb25zLnNldFNjaG9vbChuZXdfc2Nob29sKTtcblx0XHR9LmJpbmQodGhpcykpO1xuXHR9LFxuXG59KTtcblxuIiwidmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBUaW1ldGFibGVTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG5cbnZhciBTZWFyY2hSZXN1bHQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxpX2NsYXNzID0gXCJzZWFyY2gtcmVzdWx0XCIsIGljb25fY2xhc3MgPSBcImZ1aS1wbHVzXCI7XG4gICAgaWYgKHRoaXMucHJvcHMuaW5fcm9zdGVyKSB7XG4gICAgICBsaV9jbGFzcyArPSBcIiB0b2RvLWRvbmVcIjtcbiAgICAgIGljb25fY2xhc3MgPSBcImZ1aS1jaGVja1wiO1xuICAgIH1cbiAgICByZXR1cm4gKFxuICAgICAgPGxpIGNsYXNzTmFtZT17bGlfY2xhc3N9IG9uTW91c2VEb3duPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsKHRoaXMucHJvcHMuaWQpfT5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0b2RvLWNvbnRlbnRcIj5cbiAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidG9kby1uYW1lXCI+XG4gICAgICAgICAgICB7dGhpcy5wcm9wcy5jb2RlfVxuICAgICAgICAgIDwvaDQ+XG4gICAgICAgICAge3RoaXMucHJvcHMubmFtZX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT17XCJzZWFyY2gtcmVzdWx0LWFjdGlvbiBcIiArIGljb25fY2xhc3N9IFxuICAgICAgICAgIG9uTW91c2VEb3duPXt0aGlzLnRvZ2dsZUNvdXJzZX0+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgIDwvbGk+XG4gICAgKTtcbiAgfSxcblxuICB0b2dnbGVDb3Vyc2U6IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgcmVtb3ZpbmcgPSB0aGlzLnByb3BzLmluX3Jvc3RlcjtcbiAgICBUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZUNvdXJzZXMoe2lkOiB0aGlzLnByb3BzLmlkLCBzZWN0aW9uOiAnJywgcmVtb3Zpbmc6IHJlbW92aW5nfSk7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpOyAgLy8gc3RvcCBpbnB1dCBmcm9tIHRyaWdnZXJpbmcgb25CbHVyIGFuZCB0aHVzIGhpZGluZyByZXN1bHRzXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTsgLy8gc3RvcCBwYXJlbnQgZnJvbSBvcGVuaW5nIG1vZGFsXG4gIH0sXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgbWl4aW5zOiBbUmVmbHV4LmNvbm5lY3QoVGltZXRhYmxlU3RvcmUpXSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBjb3Vyc2VzOltdLFxuICAgICAgcmVzdWx0czogW10sXG4gICAgICBmb2N1c2VkOiBmYWxzZSxcbiAgICB9O1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVcGRhdGU6IGZ1bmN0aW9uKG5ld19wcm9wcywgbmV3X3N0YXRlKSB7XG4gICAgaWYgKG5ld19zdGF0ZS5zY2hvb2wgIT0gdGhpcy5zdGF0ZS5zY2hvb2wpIHtcbiAgICAgIHRoaXMuZ2V0Q291cnNlcyhuZXdfc3RhdGUuc2Nob29sKTtcbiAgICB9XG5cbiAgfSxcbiAgZ2V0Q291cnNlczogZnVuY3Rpb24oc2Nob29sKSB7XG4gICAgVGltZXRhYmxlQWN0aW9ucy5zZXRDb3Vyc2VzTG9hZGluZygpO1xuICAgICQuZ2V0KFwiL2NvdXJzZXMvXCIgKyBzY2hvb2wgKyBcIi9cIiArIF9TRU1FU1RFUiwgXG4gICAgICAgIHt9LCBcbiAgICAgICAgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICB0aGlzLnNldFN0YXRlKHtjb3Vyc2VzOiByZXNwb25zZX0pO1xuICAgICAgICAgIFRpbWV0YWJsZUFjdGlvbnMuc2V0Q291cnNlc0RvbmVMb2FkaW5nKCk7XG5cbiAgICAgICAgfS5iaW5kKHRoaXMpXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWFyY2hfcmVzdWx0c19kaXYgPSB0aGlzLmdldFNlYXJjaFJlc3VsdHNDb21wb25lbnQoKTtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBpZD1cInNlYXJjaC1iYXJcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJpbnB1dC1jb21iaW5lXCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJpbnB1dC13cmFwcGVyXCI+XG4gICAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCIgXG4gICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiU2VhcmNoIGJ5IGNvZGUsIHRpdGxlLCBkZXNjcmlwdGlvbiwgZGVncmVlXCIgXG4gICAgICAgICAgICAgIGlkPVwic2VhcmNoLWlucHV0XCIgXG4gICAgICAgICAgICAgIHJlZj1cImlucHV0XCIgXG4gICAgICAgICAgICAgIG9uRm9jdXM9e3RoaXMuZm9jdXN9IG9uQmx1cj17dGhpcy5ibHVyfSBcbiAgICAgICAgICAgICAgb25JbnB1dD17dGhpcy5xdWVyeUNoYW5nZWR9Lz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxidXR0b24gZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiIGRhdGEtdGFyZ2V0PVwiI21lbnUtY29udGFpbmVyXCIgaWQ9XCJtZW51LWJ0blwiPlxuICAgICAgICAgICAgPGRpdiBpZD1cInNsaWRlcnNcIj5cbiAgICAgICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJib3hcIj48L2Rpdj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJveFwiPjwvZGl2PlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYm94XCI+PC9kaXY+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIHtzZWFyY2hfcmVzdWx0c19kaXZ9XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICBnZXRTZWFyY2hSZXN1bHRzQ29tcG9uZW50OiBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuc3RhdGUuZm9jdXNlZCB8fCB0aGlzLnN0YXRlLnJlc3VsdHMubGVuZ3RoID09IDApIHtyZXR1cm4gbnVsbDt9XG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBzZWFyY2hfcmVzdWx0cyA9IHRoaXMuc3RhdGUucmVzdWx0cy5tYXAoZnVuY3Rpb24ocikge1xuICAgICAgaSsrO1xuICAgICAgdmFyIGluX3Jvc3RlciA9IHRoaXMuc3RhdGUuY291cnNlc190b19zZWN0aW9uc1tyLmlkXSAhPSBudWxsO1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPFNlYXJjaFJlc3VsdCB7Li4ucn0ga2V5PXtpfSBpbl9yb3N0ZXI9e2luX3Jvc3Rlcn0gdG9nZ2xlTW9kYWw9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWx9Lz5cbiAgICAgICk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBpZD1cInNlYXJjaC1yZXN1bHRzLWNvbnRhaW5lclwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRvZG8gbXJtXCI+XG4gICAgICAgICAgICA8dWwgaWQ9XCJzZWFyY2gtcmVzdWx0c1wiPlxuICAgICAgICAgICAgICB7c2VhcmNoX3Jlc3VsdHN9XG4gICAgICAgICAgICA8L3VsPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICBmb2N1czogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7Zm9jdXNlZDogdHJ1ZX0pO1xuICB9LFxuXG4gIGJsdXI6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe2ZvY3VzZWQ6IGZhbHNlfSk7XG4gIH0sXG5cbiAgcXVlcnlDaGFuZ2VkOiBmdW5jdGlvbihldmVudCkge1xuICAgIHZhciBxdWVyeSA9IGV2ZW50LnRhcmdldC52YWx1ZS50b0xvd2VyQ2FzZSgpO1xuICAgIHZhciBmaWx0ZXJlZCA9IHF1ZXJ5Lmxlbmd0aCA8PSAxID8gW10gOiB0aGlzLmZpbHRlckNvdXJzZXMocXVlcnkpO1xuICAgIHRoaXMuc2V0U3RhdGUoe3Jlc3VsdHM6IGZpbHRlcmVkfSk7XG4gIH0sXG5cbiAgaXNTdWJzZXF1ZW5jZTogZnVuY3Rpb24ocmVzdWx0LHF1ZXJ5KSB7XG4gICAgICByZXN1bHQgPSBxdWVyeS5zcGxpdChcIiBcIikuZXZlcnkoZnVuY3Rpb24ocykge1xuICAgICAgICAgIGlmIChyZXN1bHQuaW5kZXhPZihzKSA+IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICB9LFxuXG4gIGZpbHRlckNvdXJzZXM6IGZ1bmN0aW9uKHF1ZXJ5KSB7XG4gICAgdmFyIG9wdF9xdWVyeSA9IHF1ZXJ5LnJlcGxhY2UoXCJpbnRyb1wiLFwiaW50cm9kdWN0aW9uXCIpO1xuICAgIHRoYXQgPSB0aGlzO1xuICAgIHZhciByZXN1bHRzID0gdGhpcy5zdGF0ZS5jb3Vyc2VzLmZpbHRlcihmdW5jdGlvbihjKSB7XG4gICAgICByZXR1cm4gKHRoYXQuaXNTdWJzZXF1ZW5jZShjLm5hbWUudG9Mb3dlckNhc2UoKSxxdWVyeSkgfHwgXG4gICAgICAgICAgICAgdGhhdC5pc1N1YnNlcXVlbmNlKGMubmFtZS50b0xvd2VyQ2FzZSgpLG9wdF9xdWVyeSkgfHxcbiAgICAgICAgICAgICBjLmNvZGUudG9Mb3dlckNhc2UoKS5pbmRleE9mKG9wdF9xdWVyeSkgPiAtMSB8fFxuICAgICAgICAgICAgIGMubmFtZS50b0xvd2VyQ2FzZSgpLmluZGV4T2Yob3B0X3F1ZXJ5KSA+IC0xIHx8XG4gICAgICAgICAgICAgYy5uYW1lLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihxdWVyeSkgPiAtMSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH0sXG5cblxuXG59KTtcbiIsInZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgVGltZXRhYmxlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xuXG5cbnZhciBkYXlfdG9fbGV0dGVyID0ge1xuICAgICdNJzogICdNJywgXG4gICAgJ1QnOiAgJ1QnLCBcbiAgICAnVyc6ICAnVycsXG4gICAgJ1InOiAnVGgnLFxuICAgICdGJzogICdGJyxcbiAgICAnUyc6ICdTYScsXG4gICAgJ1UnOiAnUydcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjb3MgPSB0aGlzLmdldFJlbGF0ZWRDb3Vyc2VPZmZlcmluZ3MoKTtcbiAgICAgICAgdmFyIGRheV9hbmRfdGltZXMgPSB0aGlzLmdldERheXNBbmRUaW1lcyhjb3MpO1xuICAgICAgICB2YXIgc2VjdGlvbl9hbmRfcHJvZiA9IChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2VjdC1wcm9mXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzZWN0aW9uLW51bVwiPntjb3NbMF0ubWVldGluZ19zZWN0aW9ufTwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHJvZnNcIj57Y29zWzBdLmluc3RydWN0b3JzfTwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNlY3Rpb24td3JhcHBlclwiPlxuICAgICAgICAgICAgICAgIHtzZWN0aW9uX2FuZF9wcm9mfVxuICAgICAgICAgICAgICAgIHtkYXlfYW5kX3RpbWVzfVxuICAgICAgICAgICAgPC9kaXY+KTtcbiAgICB9LFxuXG4gICAgZ2V0UmVsYXRlZENvdXJzZU9mZmVyaW5nczogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvX29iamVjdHMgPSBbXVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucHJvcHMuYWxsX3NlY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbyA9IHRoaXMucHJvcHMuYWxsX3NlY3Rpb25zW2ldO1xuICAgICAgICAgICAgaWYgKG8ubWVldGluZ19zZWN0aW9uID09IHRoaXMucHJvcHMuc2VjdGlvbikge1xuICAgICAgICAgICAgICAgIGNvX29iamVjdHMucHVzaChvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29fb2JqZWN0cztcbiAgICB9LFxuXG4gICAgZ2V0RGF5c0FuZFRpbWVzOiBmdW5jdGlvbihjb3MpIHtcbiAgICAgICAgdmFyIGRheUFuZFRpbWVzID0gY29zLm1hcChmdW5jdGlvbihvKSB7XG4gICAgICAgICAgICByZXR1cm4gKDxkaXYga2V5PXt0aGlzLnByb3BzLmtleX0gaWQ9XCJkYXktdGltZVwiIGtleT17by5pZH0+e2RheV90b19sZXR0ZXJbby5kYXldICsgXCIgXCIgKyBvLnRpbWVfc3RhcnQgKyBcIi1cIiArIG8udGltZV9lbmR9PC9kaXY+KTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgcmV0dXJuICggPGRpdiBrZXk9e3RoaXMucHJvcHMua2V5fSBjbGFzc05hbWU9XCJkdC1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICB7ZGF5QW5kVGltZXN9XG4gICAgICAgICAgICA8L2Rpdj4gKVxuICAgIH1cbn0pO1xuIiwidmFyIFRpbWV0YWJsZVN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKVxuXG52YXIgUm9zdGVyU2xvdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3R5bGVzPXtiYWNrZ3JvdW5kQ29sb3I6IHRoaXMucHJvcHMuY29sb3VyLCBib3JkZXJDb2xvcjogdGhpcy5wcm9wcy5jb2xvdXJ9O1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2XG4gICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWwodGhpcy5wcm9wcy5pZCl9XG4gICAgICAgIHN0eWxlPXtzdHlsZXN9XG4gICAgICAgIG9uTW91c2VFbnRlcj17dGhpcy5oaWdobGlnaHRTaWJsaW5nc31cbiAgICAgICAgb25Nb3VzZUxlYXZlPXt0aGlzLnVuaGlnaGxpZ2h0U2libGluZ3N9XG4gICAgICAgIGNsYXNzTmFtZT17XCJzbG90LW91dGVyIGZjLXRpbWUtZ3JpZC1ldmVudCBmYy1ldmVudCBzbG90IHNsb3QtXCIgKyB0aGlzLnByb3BzLmlkfT5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1jb250ZW50XCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10aXRsZSBzbG90LXRleHQtcm93XCI+e3RoaXMucHJvcHMubmFtZX08L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgfSxcbiAgaGlnaGxpZ2h0U2libGluZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy51cGRhdGVDb2xvdXJzKENPTE9VUl9UT19ISUdITElHSFRbdGhpcy5wcm9wcy5jb2xvdXJdKTtcbiAgfSxcbiAgdW5oaWdobGlnaHRTaWJsaW5nczogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnVwZGF0ZUNvbG91cnModGhpcy5wcm9wcy5jb2xvdXIpO1xuICB9LFxuICB1cGRhdGVDb2xvdXJzOiBmdW5jdGlvbihjb2xvdXIpIHtcbiAgICAkKFwiLnNsb3QtXCIgKyB0aGlzLnByb3BzLmlkKVxuICAgICAgLmNzcygnYmFja2dyb3VuZC1jb2xvcicsIGNvbG91cilcbiAgICAgIC5jc3MoJ2JvcmRlci1jb2xvcicsIGNvbG91cik7XG4gIH0sXG5cbn0pXG5cbnZhciBDb3Vyc2VSb3N0ZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAvLyB1c2UgdGhlIHRpbWV0YWJsZSBmb3Igc2xvdHMgYmVjYXVzZSBpdCBjb250YWlucyB0aGUgbW9zdCBpbmZvcm1hdGlvblxuICAgIGlmICh0aGlzLnByb3BzLnRpbWV0YWJsZXMubGVuZ3RoID4gMCkge1xuICAgICAgdmFyIHNsb3RzID0gdGhpcy5wcm9wcy50aW1ldGFibGVzWzBdLmNvdXJzZXMubWFwKGZ1bmN0aW9uKGNvdXJzZSkge1xuICAgICAgICB2YXIgY29sb3VyID0gIENPVVJTRV9UT19DT0xPVVJbY291cnNlLmNvZGVdO1xuXG4gICAgICAgIHJldHVybiA8Um9zdGVyU2xvdCB7Li4uY291cnNlfSB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0ga2V5PXtjb3Vyc2UuY29kZX0gY29sb3VyPXtjb2xvdXJ9Lz5cbiAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNsb3RzID0gbnVsbDtcbiAgICB9XG4gICAgdmFyIHR0ID0gdGhpcy5wcm9wcy50aW1ldGFibGVzLmxlbmd0aCA+IDAgPyB0aGlzLnByb3BzLnRpbWV0YWJsZXNbMF0gOiBudWxsO1xuICAgIHZhciBudW1Db3Vyc2VzID0gMDtcbiAgICB2YXIgdG90YWxTY29yZSA9IDA7XG4gICAgaWYgKHRoaXMucHJvcHMudGltZXRhYmxlcy5sZW5ndGggPiAwICYmIHRoaXMucHJvcHMudGltZXRhYmxlc1swXS5jb3Vyc2VzLmxlbmd0aCA+IDAgKSB7XG4gICAgICBmb3IgKGo9MDtqPHRoaXMucHJvcHMudGltZXRhYmxlc1swXS5jb3Vyc2VzLmxlbmd0aDtqKyspIHtcbiAgICAgICAgICBmb3IgKGs9MDtrPHRoaXMucHJvcHMudGltZXRhYmxlc1swXS5jb3Vyc2VzW2pdLmV2YWx1YXRpb25zLmxlbmd0aDtrKyspIHtcbiAgICAgICAgICAgIG51bUNvdXJzZXMrKztcbiAgICAgICAgICAgIHRvdGFsU2NvcmUgKz0gdGhpcy5wcm9wcy50aW1ldGFibGVzWzBdLmNvdXJzZXNbal0uZXZhbHVhdGlvbnNba10uc2NvcmU7XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB2YXIgYXZnU2NvcmVDb250ZW50ID0gdGhpcy5wcm9wcy50aW1ldGFibGVzLmxlbmd0aCA+IDAgJiYgdG90YWxTY29yZSA+IDAgID8gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJyYXRpbmctd3JhcHBlclwiPlxuICAgICAgICAgIDxwPkF2ZXJhZ2UgQ291cnNlIFJhdGluZzo8L3A+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzdWItcmF0aW5nLXdyYXBwZXJcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3Rhci1yYXRpbmdzLXNwcml0ZVwiPlxuICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17e3dpZHRoOiAxMDAqdG90YWxTY29yZS8oNSpudW1Db3Vyc2VzKSArIFwiJVwifX0gY2xhc3NOYW1lPVwicmF0aW5nXCI+PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PikgOiBudWxsO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvdXJzZS1yb3N0ZXIgY291cnNlLWxpc3RcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjbGVhcmZpeFwiPlxuICAgICAgICAgIHtzbG90c31cbiAgICAgICAgICB7YXZnU2NvcmVDb250ZW50fVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufSlcblxudmFyIFRleHRib29rUm9zdGVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBtaXhpbnM6IFtSZWZsdXguY29ubmVjdChUaW1ldGFibGVTdG9yZSldLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgIGlmICh0aGlzLnN0YXRlLnRpbWV0YWJsZXMubGVuZ3RoID4gMCkge1xuICAgICAgdGV4dGJvb2tzID0gW11cbiAgICAgICBmb3IgKGk9MDsgaSA8IHRoaXMuc3RhdGUudGltZXRhYmxlc1t0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXhdLmNvdXJzZXMubGVuZ3RoOyBpKyspICB7XG4gICAgICAgICAgZm9yKGo9MDsgaiA8IHRoaXMuc3RhdGUudGltZXRhYmxlc1t0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXhdLmNvdXJzZXNbaV0udGV4dGJvb2tzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB0ZXh0Ym9va3MucHVzaCh0aGlzLnN0YXRlLnRpbWV0YWJsZXNbdGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4XS5jb3Vyc2VzW2ldLnRleHRib29rc1tqXSlcbiAgICAgICAgICB9XG4gICAgICAgfVxuICAgICAgIHZhciB0Yl9lbGVtZW50cyA9IHRleHRib29rcy5tYXAoZnVuY3Rpb24odGIpIHtcbiAgICAgICAgICBpZiAodGJbJ2ltYWdlX3VybCddID09PSBcIkNhbm5vdCBiZSBmb3VuZFwiKSB7XG4gICAgICAgICAgICB2YXIgaW1nID0gJy9zdGF0aWMvaW1nL2RlZmF1bHRfY292ZXIuanBnJ1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgaW1nID0gdGJbJ2ltYWdlX3VybCddXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0YlsndGl0bGUnXSA9PSBcIkNhbm5vdCBiZSBmb3VuZFwiKSB7XG4gICAgICAgICAgICB2YXIgdGl0bGUgPSBcIiNcIiArICB0YlsnaXNibiddXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB0aXRsZSA9IHRiWyd0aXRsZSddXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAoIFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0Ym9va1wiIGtleT17dGJbJ2lkJ119PlxuICAgICAgICAgICAgICAgIDxpbWcgaGVpZ2h0PVwiMTI1XCIgc3JjPXtpbWd9Lz5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1vZHVsZVwiPlxuICAgICAgICAgICAgICAgICAgPGg2IGNsYXNzTmFtZT1cImxpbmUtY2xhbXBcIj57dGl0bGV9PC9oNj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxhIGhyZWY9e3RiWydkZXRhaWxfdXJsJ119IHRhcmdldD1cIl9ibGFua1wiPlxuICAgICAgICAgICAgICAgICAgPGltZyBzcmM9XCJodHRwczovL2ltYWdlcy1uYS5zc2wtaW1hZ2VzLWFtYXpvbi5jb20vaW1hZ2VzL0cvMDEvYXNzb2NpYXRlcy9yZW1vdGUtYnV5LWJveC9idXk1Ll9WMTkyMjA3NzM5Xy5naWZcIiB3aWR0aD1cIjEyMFwiIGhlaWdodD1cIjI4XCIgYm9yZGVyPVwiMFwiLz5cbiAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB0Yl9lbGVtZW50cyA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvdXJzZS1yb3N0ZXIgdGV4dGJvb2stbGlzdFwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNsZWFyZml4XCI+XG4gICAgICAgICAge3RiX2VsZW1lbnRzfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIG1peGluczogW1JlZmx1eC5jb25uZWN0KFRpbWV0YWJsZVN0b3JlKV0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiByZWY9XCJzaWRlYmFyXCIgY2xhc3NOYW1lPVwic2lkZS1jb250YWluZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3N0ZXItaGVhZGVyXCI+XG4gICAgICAgICAgPGg0PllvdXIgU2VtZXN0ZXI8L2g0PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPENvdXJzZVJvc3RlciB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0gdGltZXRhYmxlcz17dGhpcy5zdGF0ZS50aW1ldGFibGVzfS8+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm9zdGVyLWhlYWRlclwiPlxuICAgICAgICAgIDxoND5Zb3VyIFRleHRib29rczwvaDQ+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8VGV4dGJvb2tSb3N0ZXIgLz5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufSk7IiwibW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdFxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2PlxuXHRcdFx0IFx0PGRpdiBpZD1cImRpbS1zY3JlZW5cIj48L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzaW1wbGUtbW9kYWxcIiBzdHlsZT17dGhpcy5wcm9wcy5zdHlsZXN9PlxuXHRcdFx0XHRcdDxoNiBjbGFzc05hbWU9XCJzaW1wbGUtbW9kYWwtaGVhZGVyXCI+e3RoaXMucHJvcHMuaGVhZGVyfTwvaDY+XG5cdFx0XHRcdFx0PGhyIGNsYXNzTmFtZT1cInNpbXBsZS1tb2RhbC1zZXBhcmF0b3JcIi8+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzaW1wbGUtbW9kYWwtY29udGVudFwiPlxuXHRcdFx0XHRcdFx0e3RoaXMucHJvcHMuY29udGVudH1cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblxuXHRcdCk7XG5cdH0sXG5cbn0pO1xuIiwidmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBUaW1ldGFibGVTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG5cblxuLy8gbWFwcyBiYXNlIGNvbG91ciBvZiBzbG90IHRvIGNvbG91ciBvbiBoaWdobGlnaHRcbkNPTE9VUl9UT19ISUdITElHSFQgPSB7XG4gICAgXCIjRkQ3NDczXCIgOiBcIiNFMjZBNkFcIixcbiAgICBcIiM0NEJCRkZcIiA6IFwiIzI4QTRFQVwiLFxuICAgIFwiIzRDRDRCMFwiIDogXCIjM0RCQjlBXCIsXG4gICAgXCIjODg3MEZGXCIgOiBcIiM3MDU5RTZcIixcbiAgICBcIiNGOUFFNzRcIiA6IFwiI0Y3OTU0QVwiLFxuICAgIFwiI0Q0REJDOFwiIDogXCIjQjVCRkEzXCIsXG4gICAgXCIjRjE4MkI0XCIgOiBcIiNERTY5OURcIixcbiAgICBcIiM3NDk5QTJcIiA6IFwiIzY2OEI5NFwiLFxuICAgIFwiI0U3Rjc2RFwiIDogXCIjQzRENDREXCIsXG59IC8vIGNvbnNpZGVyICNDRjAwMEYsICNlOGZhYzNcbkNPVVJTRV9UT19DT0xPVVIgPSB7fVxuLy8gaG93IGJpZyBhIHNsb3Qgb2YgaGFsZiBhbiBob3VyIHdvdWxkIGJlLCBpbiBwaXhlbHNcbnZhciBIQUxGX0hPVVJfSEVJR0hUID0gMzA7XG5cbnZhciBTbG90ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7c2hvd19idXR0b25zOiBmYWxzZX07XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBwaW4gPSBudWxsLCByZW1vdmVfYnV0dG9uID0gbnVsbDtcbiAgICAgICAgdmFyIHNsb3Rfc3R5bGUgPSB0aGlzLmdldFNsb3RTdHlsZSgpO1xuXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnNob3dfYnV0dG9ucykge1xuICAgICAgICAgICAgcGluID0gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzbG90LWlubmVyIGJvdHRvbVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnV0dG9uLXN1cnJvdW5kXCIgb25DbGljaz17dGhpcy5waW5PclVucGluQ291cnNlfSA+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLWxvY2tcIj48L3NwYW4+XG4gICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2Pik7XG4gICAgICAgICAgICByZW1vdmVfYnV0dG9uID0gKCA8ZGl2IGNsYXNzTmFtZT1cInNsb3QtaW5uZXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJ1dHRvbi1zdXJyb3VuZFwiIG9uQ2xpY2s9e3RoaXMucmVtb3ZlQ291cnNlfSA+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXRpbWVzIHJlbW92ZVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5wcm9wcy5waW5uZWQpIHtcbiAgICAgICAgICAgIHBpbiA9IChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2xvdC1pbm5lciBib3R0b21cIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJ1dHRvbi1zdXJyb3VuZCBwaW5uZWRcIiBvbkNsaWNrPXt0aGlzLnBpbk9yVW5waW5Db3Vyc2V9ID5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtbG9ja1wiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+KTtcbiAgICAgICAgfVxuICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgXG4gICAgICAgICAgICBvbkNsaWNrPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsKHRoaXMucHJvcHMuY291cnNlKX1cbiAgICAgICAgICAgIG9uTW91c2VFbnRlcj17dGhpcy5oaWdobGlnaHRTaWJsaW5nc31cbiAgICAgICAgICAgIG9uTW91c2VMZWF2ZT17dGhpcy51bmhpZ2hsaWdodFNpYmxpbmdzfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtcInNsb3Qtb3V0ZXIgZmMtdGltZS1ncmlkLWV2ZW50IGZjLWV2ZW50IHNsb3Qgc2xvdC1cIiArIHRoaXMucHJvcHMuY291cnNlfSBcbiAgICAgICAgICAgIHN0eWxlPXtzbG90X3N0eWxlfT5cbiAgICAgICAgICAgIHtyZW1vdmVfYnV0dG9ufVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1jb250ZW50XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdGltZVwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPnt0aGlzLnByb3BzLnRpbWVfc3RhcnR9IOKAkyB7dGhpcy5wcm9wcy50aW1lX2VuZH08L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRpdGxlIHNsb3QtdGV4dC1yb3dcIj57dGhpcy5wcm9wcy5jb2RlICsgXCIgXCIgKyB0aGlzLnByb3BzLm1lZXRpbmdfc2VjdGlvbn08L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10aXRsZSBzbG90LXRleHQtcm93XCI+e3RoaXMucHJvcHMubmFtZX08L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAge3Bpbn0gICAgICAgICAgICBcbiAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcblxuICAgLyoqXG4gICAgKiBSZXR1cm4gYW4gb2JqZWN0IGNvbnRhaW5pbmcgc3R5bGUgb2YgYSBzcGVjaWZpYyBzbG90LiBTaG91bGQgc3BlY2lmeSBhdFxuICAgICogbGVhc3QgdGhlIHRvcCB5LWNvb3JkaW5hdGUgYW5kIGhlaWdodCBvZiB0aGUgc2xvdCwgYXMgd2VsbCBhcyBiYWNrZ3JvdW5kQ29sb3JcbiAgICAqIHdoaWxlIHRha2luZyBpbnRvIGFjY291bnQgaWYgdGhlcmUncyBhbiBvdmVybGFwcGluZyBjb25mbGljdFxuICAgICovXG4gICAgZ2V0U2xvdFN0eWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHN0YXJ0X2hvdXIgICA9IHBhcnNlSW50KHRoaXMucHJvcHMudGltZV9zdGFydC5zcGxpdChcIjpcIilbMF0pLFxuICAgICAgICAgICAgc3RhcnRfbWludXRlID0gcGFyc2VJbnQodGhpcy5wcm9wcy50aW1lX3N0YXJ0LnNwbGl0KFwiOlwiKVsxXSksXG4gICAgICAgICAgICBlbmRfaG91ciAgICAgPSBwYXJzZUludCh0aGlzLnByb3BzLnRpbWVfZW5kLnNwbGl0KFwiOlwiKVswXSksXG4gICAgICAgICAgICBlbmRfbWludXRlICAgPSBwYXJzZUludCh0aGlzLnByb3BzLnRpbWVfZW5kLnNwbGl0KFwiOlwiKVsxXSk7XG5cbiAgICAgICAgdmFyIHRvcCA9IChzdGFydF9ob3VyIC0gOCkqNTIgKyAoc3RhcnRfbWludXRlKSooMjYvMzApO1xuICAgICAgICB2YXIgYm90dG9tID0gKGVuZF9ob3VyIC0gOCkqNTIgKyAoZW5kX21pbnV0ZSkqKDI2LzMwKSAtIDE7XG4gICAgICAgIHZhciBoZWlnaHQgPSBib3R0b20gLSB0b3AgLSAyO1xuXG4gICAgICAgIGlmICh0aGlzLnByb3BzLm51bV9jb25mbGljdHMgPiAxKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLnByb3BzLnRpbWVfc3RhcnQsIHRoaXMucHJvcHMudGltZV9lbmQsIHRoaXMucHJvcHMubnVtX2NvbmZsaWN0cylcbiAgICAgICAgfVxuICAgICAgICAvLyB0aGUgY3VtdWxhdGl2ZSB3aWR0aCBvZiB0aGlzIHNsb3QgYW5kIGFsbCBvZiB0aGUgc2xvdHMgaXQgaXMgY29uZmxpY3Rpbmcgd2l0aFxuICAgICAgICB2YXIgdG90YWxfc2xvdF93aWR0aHMgPSA5OSAtICg1ICogdGhpcy5wcm9wcy5kZXB0aF9sZXZlbCk7XG4gICAgICAgIC8vIHRoZSB3aWR0aCBvZiB0aGlzIHBhcnRpY3VsYXIgc2xvdFxuICAgICAgICB2YXIgc2xvdF93aWR0aF9wZXJjZW50YWdlID0gdG90YWxfc2xvdF93aWR0aHMgLyB0aGlzLnByb3BzLm51bV9jb25mbGljdHM7XG4gICAgICAgIC8vIHRoZSBhbW91bnQgb2YgbGVmdCBtYXJnaW4gb2YgdGhpcyBwYXJ0aWN1bGFyIHNsb3QsIGluIHBlcmNlbnRhZ2VcbiAgICAgICAgdmFyIHB1c2hfbGVmdCA9ICh0aGlzLnByb3BzLnNoaWZ0X2luZGV4ICogc2xvdF93aWR0aF9wZXJjZW50YWdlKSArIDUgKiB0aGlzLnByb3BzLmRlcHRoX2xldmVsO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3aWR0aDogc2xvdF93aWR0aF9wZXJjZW50YWdlICsgXCIlXCIsXG4gICAgICAgICAgICB0b3A6IHRvcCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnByb3BzLmNvbG91cixcbiAgICAgICAgICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIgKyB0aGlzLnByb3BzLmNvbG91cixcbiAgICAgICAgICAgIGxlZnQ6IHB1c2hfbGVmdCArIFwiJVwiLFxuICAgICAgICAgICAgekluZGV4OiAxMDAgKiB0aGlzLnByb3BzLmRlcHRoX2xldmVsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGhpZ2hsaWdodFNpYmxpbmdzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c2hvd19idXR0b25zOiB0cnVlfSk7XG4gICAgICAgIHRoaXMudXBkYXRlQ29sb3VycyhDT0xPVVJfVE9fSElHSExJR0hUW3RoaXMucHJvcHMuY29sb3VyXSk7XG4gICAgfSxcbiAgICB1bmhpZ2hsaWdodFNpYmxpbmdzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c2hvd19idXR0b25zOiBmYWxzZX0pO1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbG91cnModGhpcy5wcm9wcy5jb2xvdXIpO1xuICAgIH0sXG4gICAgcGluT3JVbnBpbkNvdXJzZTogZnVuY3Rpb24oZSkge1xuICAgICAgICBUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZUNvdXJzZXMoe2lkOiB0aGlzLnByb3BzLmNvdXJzZSwgXG4gICAgICAgICAgICBzZWN0aW9uOiB0aGlzLnByb3BzLm1lZXRpbmdfc2VjdGlvbiwgXG4gICAgICAgICAgICByZW1vdmluZzogZmFsc2V9KTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9LFxuICAgIHJlbW92ZUNvdXJzZTogZnVuY3Rpb24oZSkge1xuICAgICAgICBUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZUNvdXJzZXMoe2lkOiB0aGlzLnByb3BzLmNvdXJzZSwgXG4gICAgICAgICAgICBzZWN0aW9uOiAnJywgXG4gICAgICAgICAgICByZW1vdmluZzogdHJ1ZX0pO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVDb2xvdXJzOiBmdW5jdGlvbihjb2xvdXIpIHtcbiAgICAgICAgJChcIi5zbG90LVwiICsgdGhpcy5wcm9wcy5jb3Vyc2UpXG4gICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1jb2xvcicsIGNvbG91cilcbiAgICAgICAgICAuY3NzKCdib3JkZXItY29sb3InLCBjb2xvdXIpO1xuICAgIH0sXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXlzID0gW1wiTVwiLCBcIlRcIiwgXCJXXCIsIFwiUlwiLCBcIkZcIl07XG4gICAgICAgIHZhciBzbG90c19ieV9kYXkgPSB0aGlzLmdldFNsb3RzQnlEYXkoKTtcbiAgICAgICAgdmFyIGFsbF9zbG90cyA9IGRheXMubWFwKGZ1bmN0aW9uKGRheSkge1xuICAgICAgICAgICAgdmFyIGRheV9zbG90cyA9IHNsb3RzX2J5X2RheVtkYXldLm1hcChmdW5jdGlvbihzbG90KSB7XG4gICAgICAgICAgICAgICAgdmFyIHAgPSB0aGlzLmlzUGlubmVkKHNsb3QpO1xuICAgICAgICAgICAgICAgIHJldHVybiA8U2xvdCB7Li4uc2xvdH0gdG9nZ2xlTW9kYWw9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWx9IGtleT17c2xvdC5pZH0gcGlubmVkPXtwfS8+XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPHRkIGtleT17ZGF5fT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtZXZlbnQtY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2RheV9zbG90c31cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgIHthbGxfc2xvdHN9XG4gICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgIDwvdGFibGU+XG5cbiAgICAgICAgKTtcbiAgICB9LFxuICAgXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF5cyA9IHsxOiAnbW9uJywgMjogJ3R1ZScsIDM6ICd3ZWQnLCA0OiAndGh1JywgNTogJ2ZyaSd9O1xuICAgICAgICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gICAgICAgIHZhciBzZWxlY3RvciA9IFwiLmZjLVwiICsgZGF5c1tkLmdldERheSgpXTtcbiAgICAgICAgLy8gJChzZWxlY3RvcikuYWRkQ2xhc3MoXCJmYy10b2RheVwiKTtcbiAgICB9LFxuXG4gICAgaXNQaW5uZWQ6IGZ1bmN0aW9uKHNsb3QpIHtcbiAgICAgICAgdmFyIGNvbXBhcmF0b3IgPSB0aGlzLnByb3BzLmNvdXJzZXNfdG9fc2VjdGlvbnNbc2xvdC5jb3Vyc2VdWydDJ107XG4gICAgICAgIGlmICh0aGlzLnByb3BzLnNjaG9vbCA9PSBcInVvZnRcIikge1xuICAgICAgICAgICAgY29tcGFyYXRvciA9IHRoaXMucHJvcHMuY291cnNlc190b19zZWN0aW9uc1tzbG90LmNvdXJzZV1bc2xvdC5tZWV0aW5nX3NlY3Rpb25bMF1dO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb21wYXJhdG9yID09IHNsb3QubWVldGluZ19zZWN0aW9uO1xuICAgIH0sXG5cbiAgICBnZXRTbG90c0J5RGF5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNsb3RzX2J5X2RheSA9IHtcbiAgICAgICAgICAgICdNJzogW10sXG4gICAgICAgICAgICAnVCc6IFtdLFxuICAgICAgICAgICAgJ1cnOiBbXSxcbiAgICAgICAgICAgICdSJzogW10sXG4gICAgICAgICAgICAnRic6IFtdXG4gICAgICAgIH07XG4gICAgICAgIENPVVJTRV9UT19DT0xPVVIgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgY291cnNlIGluIHRoaXMucHJvcHMudGltZXRhYmxlLmNvdXJzZXMpIHtcbiAgICAgICAgICAgIHZhciBjcnMgPSB0aGlzLnByb3BzLnRpbWV0YWJsZS5jb3Vyc2VzW2NvdXJzZV07XG4gICAgICAgICAgICBmb3IgKHZhciBzbG90X2lkIGluIGNycy5zbG90cykge1xuICAgICAgICAgICAgICAgIHZhciBzbG90ID0gY3JzLnNsb3RzW3Nsb3RfaWRdO1xuICAgICAgICAgICAgICAgIHZhciBjb2xvdXIgPSBPYmplY3Qua2V5cyhDT0xPVVJfVE9fSElHSExJR0hUKVtjb3Vyc2VdO1xuICAgICAgICAgICAgICAgIHNsb3RbXCJjb2xvdXJcIl0gPSBjb2xvdXI7XG4gICAgICAgICAgICAgICAgc2xvdFtcImNvZGVcIl0gPSBjcnMuY29kZS50cmltKCk7XG4gICAgICAgICAgICAgICAgc2xvdFtcIm5hbWVcIl0gPSBjcnMubmFtZTtcbiAgICAgICAgICAgICAgICBzbG90c19ieV9kYXlbc2xvdC5kYXldLnB1c2goc2xvdCk7XG4gICAgICAgICAgICAgICAgQ09VUlNFX1RPX0NPTE9VUltjcnMuY29kZV0gPSBjb2xvdXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNsb3RzX2J5X2RheTtcbiAgICB9LFxuXG59KTtcbiIsInZhciBjb3Vyc2VfYWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvY291cnNlX2FjdGlvbnMuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWZsdXguY3JlYXRlU3RvcmUoe1xuICBsaXN0ZW5hYmxlczogW2NvdXJzZV9hY3Rpb25zXSxcblxuICBnZXRDb3Vyc2VJbmZvOiBmdW5jdGlvbihzY2hvb2wsIGNvdXJzZV9pZCkge1xuICAgIHRoaXMudHJpZ2dlcih7bG9hZGluZzogdHJ1ZX0pO1xuICAgICQuZ2V0KFwiL2NvdXJzZXMvXCIrIHNjaG9vbCArIFwiL2lkL1wiICsgY291cnNlX2lkLCBcbiAgICAgICAgIHt9LCBcbiAgICAgICAgIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIoe2luZm9fbG9hZGluZzogZmFsc2UsIGNvdXJzZV9pbmZvOiByZXNwb25zZX0pO1xuICAgICAgICAgfS5iaW5kKHRoaXMpXG4gICAgKTtcblxuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtjb3Vyc2VfaW5mbzogbnVsbCwgaW5mb19sb2FkaW5nOiB0cnVlfTtcbiAgfVxufSk7XG4iLCJ2YXIgVG9hc3QgPSByZXF1aXJlKCcuLi90b2FzdCcpO1xudmFyIFRvYXN0QWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvdG9hc3RfYWN0aW9ucy5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlZmx1eC5jcmVhdGVTdG9yZSh7XG4gIGxpc3RlbmFibGVzOiBbVG9hc3RBY3Rpb25zXSxcblxuICBjcmVhdGVUb2FzdDogZnVuY3Rpb24oY29udGVudCkge1xuICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9hc3QtY29udGFpbmVyJyk7XG4gICAgUmVhY3RET00udW5tb3VudENvbXBvbmVudEF0Tm9kZShjb250YWluZXIpO1xuICAgIFJlYWN0RE9NLnJlbmRlcihcbiAgICAgIDxUb2FzdCBjb250ZW50PXtjb250ZW50fSAvPixcbiAgICAgIGNvbnRhaW5lclxuICAgICk7XG4gIH0sXG5cblxufSk7XG4iLCJ2YXIgYWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBUb2FzdEFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL3RvYXN0X2FjdGlvbnMuanMnKTtcbnZhciBVdGlsID0gcmVxdWlyZSgnLi4vdXRpbC90aW1ldGFibGVfdXRpbCcpO1xuXG5mdW5jdGlvbiByYW5kb21TdHJpbmcobGVuZ3RoLCBjaGFycykge1xuICAgIHZhciByZXN1bHQgPSAnJztcbiAgICBmb3IgKHZhciBpID0gbGVuZ3RoOyBpID4gMDsgLS1pKSByZXN1bHQgKz0gY2hhcnNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2hhcnMubGVuZ3RoKV07XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuU0lEID0gcmFuZG9tU3RyaW5nKDMwLCAnIT8oKSomXiUkI0AhW10wMTIzNDU2Nzg5YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXpBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWicpO1xuXG5UVF9TVEFURSA9IHtcbiAgc2Nob29sOiBcImpodVwiLFxuICBzZW1lc3RlcjogXCJTXCIsXG4gIGNvdXJzZXNfdG9fc2VjdGlvbnM6IHt9LFxuICBwcmVmZXJlbmNlczoge1xuICAgICdub19jbGFzc2VzX2JlZm9yZSc6IGZhbHNlLFxuICAgICdub19jbGFzc2VzX2FmdGVyJzogZmFsc2UsXG4gICAgJ2xvbmdfd2Vla2VuZCc6IGZhbHNlLFxuICAgICdncm91cGVkJzogZmFsc2UsXG4gICAgJ2RvX3JhbmtpbmcnOiBmYWxzZSxcbiAgICAndHJ5X3dpdGhfY29uZmxpY3RzJzogZmFsc2VcbiAgfSxcbiAgc2lkOiBTSUQsXG59XG5cblNDSE9PTF9MSVNUID0gW1wiamh1XCIsIFwidW9mdFwiXTtcblxuLy8gZmxhZyB0byBjaGVjayBpZiB0aGUgdXNlciBqdXN0IHR1cm5lZCBjb25mbGljdHMgb2ZmXG5DT05GTElDVF9PRkYgPSBmYWxzZTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWZsdXguY3JlYXRlU3RvcmUoe1xuICBsaXN0ZW5hYmxlczogW2FjdGlvbnNdLFxuICBjb3Vyc2VzX3RvX3NlY3Rpb25zOiB7fSxcbiAgbG9hZGluZzogZmFsc2UsXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGltZXRhYmxlczogW10sIFxuICAgICAgcHJlZmVyZW5jZXM6IFRUX1NUQVRFLnByZWZlcmVuY2VzLFxuICAgICAgY291cnNlc190b19zZWN0aW9uczoge30sIFxuICAgICAgY3VycmVudF9pbmRleDogLTEsIFxuICAgICAgY29uZmxpY3RfZXJyb3I6IGZhbHNlLFxuICAgICAgbG9hZGluZzogZmFsc2UsIC8vIHRpbWV0YWJsZXMgbG9hZGluZ1xuICAgICAgY291cnNlc19sb2FkaW5nOiBmYWxzZSxcbiAgICAgIHNjaG9vbDogXCJcIn07XG4gIH0sXG5cbiAgc2V0U2Nob29sOiBmdW5jdGlvbihuZXdfc2Nob29sKSB7XG4gICAgdmFyIHNjaG9vbCA9IFNDSE9PTF9MSVNULmluZGV4T2YobmV3X3NjaG9vbCkgPiAtMSA/IG5ld19zY2hvb2wgOiBcIlwiO1xuICAgIHZhciBuZXdfc3RhdGUgPSB0aGlzLmdldEluaXRpYWxTdGF0ZSgpO1xuICAgIFRUX1NUQVRFLnNjaG9vbCA9IHNjaG9vbDtcbiAgICBuZXdfc3RhdGUuc2Nob29sID0gc2Nob29sO1xuICAgIHRoaXMudHJpZ2dlcihuZXdfc3RhdGUpO1xuICB9LFxuIC8qKlxuICAqIFVwZGF0ZSBUVF9TVEFURSB3aXRoIG5ldyBjb3Vyc2Ugcm9zdGVyXG4gICogQHBhcmFtIHtvYmplY3R9IG5ld19jb3Vyc2Vfd2l0aF9zZWN0aW9uIGNvbnRhaW5zIGF0dHJpYnV0ZWQgaWQsIHNlY3Rpb24sIHJlbW92aW5nXG4gICogQHJldHVybiB7dm9pZH0gZG9lcyBub3QgcmV0dXJuIGFueXRoaW5nLCBqdXN0IHVwZGF0ZXMgVFRfU1RBVEVcbiAgKi9cbiAgdXBkYXRlQ291cnNlczogZnVuY3Rpb24obmV3X2NvdXJzZV93aXRoX3NlY3Rpb24pIHtcbiAgICBpZiAodGhpcy5sb2FkaW5nKSB7cmV0dXJuO30gLy8gaWYgbG9hZGluZywgZG9uJ3QgcHJvY2Vzcy5cbiAgICB0aGlzLmxvYWRpbmcgPSB0cnVlO1xuICAgIHRoaXMudHJpZ2dlcih7bG9hZGluZzp0cnVlfSk7XG5cbiAgICB2YXIgcmVtb3ZpbmcgPSBuZXdfY291cnNlX3dpdGhfc2VjdGlvbi5yZW1vdmluZztcbiAgICB2YXIgbmV3X2NvdXJzZV9pZCA9IG5ld19jb3Vyc2Vfd2l0aF9zZWN0aW9uLmlkO1xuICAgIHZhciBzZWN0aW9uID0gbmV3X2NvdXJzZV93aXRoX3NlY3Rpb24uc2VjdGlvbjtcbiAgICB2YXIgbmV3X3N0YXRlID0gJC5leHRlbmQodHJ1ZSwge30sIFRUX1NUQVRFKTsgLy8gZGVlcCBjb3B5IG9mIFRUX1NUQVRFXG4gICAgdmFyIGNfdG9fcyA9IG5ld19zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zO1xuICAgIGlmICghcmVtb3ZpbmcpIHsgLy8gYWRkaW5nIGNvdXJzZVxuICAgICAgaWYgKFRUX1NUQVRFLnNjaG9vbCA9PSBcImpodVwiKSB7XG4gICAgICAgIGlmIChjX3RvX3NbbmV3X2NvdXJzZV9pZF0pIHtcbiAgICAgICAgICB2YXIgbmV3X3NlY3Rpb24gPSBjX3RvX3NbbmV3X2NvdXJzZV9pZF1bJ0MnXSAhPSBcIlwiID8gXCJcIiA6IHNlY3Rpb247XG4gICAgICAgICAgY190b19zW25ld19jb3Vyc2VfaWRdWydDJ10gPSBuZXdfc2VjdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjX3RvX3NbbmV3X2NvdXJzZV9pZF0gPSB7J0wnOiAnJywgJ1QnOiAnJywgJ1AnOiAnJywgJ0MnOiBzZWN0aW9ufTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoVFRfU1RBVEUuc2Nob29sID09IFwidW9mdFwiKSB7XG4gICAgICAgIHZhciBsb2NrZWRfc2VjdGlvbnMgPSBjX3RvX3NbbmV3X2NvdXJzZV9pZF0gPT0gbnVsbCA/IHsnTCc6ICcnLCAnVCc6ICcnLCAnUCc6ICcnLCAnQyc6ICcnfSA6IC8vIHRoaXMgaXMgd2hhdCB3ZSB3YW50IHRvIHNlbmQgaWYgbm90IGxvY2tpbmdcbiAgICAgICAgICBjX3RvX3NbbmV3X2NvdXJzZV9pZF07XG4gICAgICAgIGlmIChzZWN0aW9uICYmIHNlY3Rpb24gIT0gXCJcIikge1xuICAgICAgICAgIHZhciBuZXdfc2VjdGlvbiA9IHNlY3Rpb247XG4gICAgICAgICAgaWYgKGNfdG9fc1tuZXdfY291cnNlX2lkXVtzZWN0aW9uWzBdXSAhPSBcIlwiKSB7bmV3X3NlY3Rpb24gPSBcIlwiO30gLy8gdW5sb2NraW5nIHNpbmNlIHNlY3Rpb24gcHJldmlvdXNseSBleGlzdGVkXG4gICAgICAgICAgbG9ja2VkX3NlY3Rpb25zW3NlY3Rpb25bMF1dID0gbmV3X3NlY3Rpb247XG4gICAgICAgIH1cbiAgICAgICAgY190b19zW25ld19jb3Vyc2VfaWRdID0gbG9ja2VkX3NlY3Rpb25zO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHsgLy8gcmVtb3ZpbmcgY291cnNlXG4gICAgICBkZWxldGUgY190b19zW25ld19jb3Vyc2VfaWRdO1xuICAgICAgaWYgKE9iamVjdC5rZXlzKGNfdG9fcykubGVuZ3RoID09IDApIHsgLy8gcmVtb3ZlZCBsYXN0IGNvdXJzZVxuICAgICAgICAgIFRUX1NUQVRFLmNvdXJzZXNfdG9fc2VjdGlvbnMgPSB7fTtcbiAgICAgICAgICB2YXIgcmVwbGFjZWQgPSB0aGlzLmdldEluaXRpYWxTdGF0ZSgpO1xuICAgICAgICAgIHJlcGxhY2VkLnNjaG9vbCA9IFRUX1NUQVRFLnNjaG9vbDtcbiAgICAgICAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnRyaWdnZXIocmVwbGFjZWQpO1xuICAgICAgICAgIHJldHVybjsgIFxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLm1ha2VSZXF1ZXN0KG5ld19zdGF0ZSk7XG4gIH0sXG5cbiAvKipcbiAgKiBVcGRhdGUgVFRfU1RBVEUgd2l0aCBuZXcgcHJlZmVyZW5jZXNcbiAgKiBAcGFyYW0ge3N0cmluZ30gcHJlZmVyZW5jZTogdGhlIHByZWZlcmVuY2UgdGhhdCBpcyBiZWluZyB1cGRhdGVkXG4gICogQHBhcmFtIG5ld192YWx1ZTogdGhlIG5ldyB2YWx1ZSBvZiB0aGUgc3BlY2lmaWVkIHByZWZlcmVuY2VcbiAgKiBAcmV0dXJuIHt2b2lkfSBkb2Vzbid0IHJldHVybiBhbnl0aGluZywganVzdCB1cGRhdGVzIFRUX1NUQVRFXG4gICovXG4gIHVwZGF0ZVByZWZlcmVuY2VzOiBmdW5jdGlvbihwcmVmZXJlbmNlLCBuZXdfdmFsdWUpIHtcbiAgICB2YXIgbmV3X3N0YXRlID0gJC5leHRlbmQodHJ1ZSwge30sIFRUX1NUQVRFKTsgLy8gZGVlcCBjb3B5IG9mIFRUX1NUQVRFXG4gICAgaWYgKHByZWZlcmVuY2UgPT0gJ3RyeV93aXRoX2NvbmZsaWN0cycgJiYgbmV3X3ZhbHVlID09IGZhbHNlKSB7XG4gICAgICBDT05GTElDVF9PRkYgPSB0cnVlO1xuICAgIH1cbiAgICBuZXdfc3RhdGUucHJlZmVyZW5jZXNbcHJlZmVyZW5jZV0gPSBuZXdfdmFsdWU7XG4gICAgdGhpcy50cmlnZ2VyKHtwcmVmZXJlbmNlczogbmV3X3N0YXRlLnByZWZlcmVuY2VzfSk7XG4gICAgdGhpcy5tYWtlUmVxdWVzdChuZXdfc3RhdGUpO1xuICB9LFxuXG4gIC8vIE1ha2VzIGEgUE9TVCByZXF1ZXN0IHRvIHRoZSBiYWNrZW5kIHdpdGggVFRfU1RBVEVcbiAgbWFrZVJlcXVlc3Q6IGZ1bmN0aW9uKG5ld19zdGF0ZSkge1xuICAgIHRoaXMudHJpZ2dlcih7bG9hZGluZzogdHJ1ZX0pO1xuICAgICQucG9zdCgnLycsIEpTT04uc3RyaW5naWZ5KG5ld19zdGF0ZSksIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIHRoaXMubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICBpZiAocmVzcG9uc2UuZXJyb3IpIHsgLy8gZXJyb3IgZnJvbSBVUkwgb3IgbG9jYWwgc3RvcmFnZVxuICAgICAgICAgIGlmKHR5cGVvZihTdG9yYWdlKSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2RhdGEnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgVFRfU1RBVEUuY291cnNlc190b19zZWN0aW9ucyA9IHt9O1xuICAgICAgICAgIHZhciByZXBsYWNlZCA9IHRoaXMuZ2V0SW5pdGlhbFN0YXRlKCk7XG4gICAgICAgICAgcmVwbGFjZWQuc2Nob29sID0gVFRfU1RBVEUuc2Nob29sO1xuICAgICAgICAgIHRoaXMudHJpZ2dlcihyZXBsYWNlZCk7XG4gICAgICAgICAgcmV0dXJuOyAvLyBzdG9wIHByb2Nlc3NpbmcgaGVyZVxuICAgICAgICB9XG4gICAgICAgIGlmIChyZXNwb25zZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgVFRfU1RBVEUgPSBuZXdfc3RhdGU7IC8vb25seSB1cGRhdGUgc3RhdGUgaWYgc3VjY2Vzc2Z1bFxuICAgICAgICAgIHZhciBpbmRleCA9IDA7XG4gICAgICAgICAgaWYgKG5ld19zdGF0ZS5pbmRleCAmJiBuZXdfc3RhdGUuaW5kZXggPCByZXNwb25zZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGluZGV4ID0gbmV3X3N0YXRlLmluZGV4O1xuICAgICAgICAgICAgZGVsZXRlIG5ld19zdGF0ZVsnaW5kZXgnXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy50cmlnZ2VyKHtcbiAgICAgICAgICAgICAgdGltZXRhYmxlczogcmVzcG9uc2UsXG4gICAgICAgICAgICAgIGNvdXJzZXNfdG9fc2VjdGlvbnM6IFRUX1NUQVRFLmNvdXJzZXNfdG9fc2VjdGlvbnMsXG4gICAgICAgICAgICAgIGN1cnJlbnRfaW5kZXg6IGluZGV4LFxuICAgICAgICAgICAgICBsb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgICAgICAgcHJlZmVyZW5jZXM6IFRUX1NUQVRFLnByZWZlcmVuY2VzXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoVFRfU1RBVEUuY291cnNlc190b19zZWN0aW9ucyAhPSB7fSkgeyAvLyBjb25mbGljdFxuICAgICAgICAgIC8vIGlmIHR1cm5pbmcgY29uZmxpY3RzIG9mZiBsZWQgdG8gYSBjb25mbGljdCwgcmVwcm9tcHQgdXNlclxuICAgICAgICAgIGlmIChDT05GTElDVF9PRkYpIHtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcih7XG4gICAgICAgICAgICAgIGxvYWRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgICBjb25mbGljdF9lcnJvcjogZmFsc2UsXG4gICAgICAgICAgICAgIHByZWZlcmVuY2VzOiBUVF9TVEFURS5wcmVmZXJlbmNlc1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIFRvYXN0QWN0aW9ucy5jcmVhdGVUb2FzdChcIlBsZWFzZSByZW1vdmUgc29tZSBjb3Vyc2VzIGJlZm9yZSB0dXJuaW5nIG9mZiBBbGxvdyBDb25mbGljdHNcIik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcih7XG4gICAgICAgICAgICAgIGxvYWRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgICBjb25mbGljdF9lcnJvcjogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBUb2FzdEFjdGlvbnMuY3JlYXRlVG9hc3QoXCJUaGF0IGNvdXJzZSBjYXVzZWQgYSBjb25mbGljdCEgVHJ5IGFnYWluIHdpdGggdGhlIEFsbG93IENvbmZsaWN0cyBwcmVmZXJlbmNlIHR1cm5lZCBvbi5cIik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudHJpZ2dlcih7bG9hZGluZzogZmFsc2V9KTtcbiAgICAgICAgfVxuICAgICAgICBDT05GTElDVF9PRkYgPSBmYWxzZTtcbiAgICB9LmJpbmQodGhpcykpO1xuICB9LFxuXG5cbiAgbG9hZFByZXNldFRpbWV0YWJsZTogZnVuY3Rpb24odXJsX2RhdGEpIHtcbiAgICB2YXIgY291cnNlcyA9IHVybF9kYXRhLnNwbGl0KFwiJlwiKTtcbiAgICB2YXIgc2Nob29sID0gVXRpbC5nZXRVbmhhc2hlZFN0cmluZyhjb3Vyc2VzLnNoaWZ0KCkpO1xuICAgIHZhciBwcmVmcyA9IGNvdXJzZXMuc2hpZnQoKTtcbiAgICB2YXIgcHJlZmVyZW5jZXNfYXJyYXkgPSBwcmVmcy5zcGxpdChcIjtcIik7XG4gICAgdmFyIHByZWZfb2JqID0ge307XG4gICAgZm9yICh2YXIgayBpbiBwcmVmZXJlbmNlc19hcnJheSkge1xuICAgICAgdmFyIHByZWZfd2l0aF92YWwgPSBwcmVmZXJlbmNlc19hcnJheVtrXS5zcGxpdChcIj1cIik7IC8vZS5nLiBbXCJhbGxvd19jb25mbGljdHNcIiwgXCJmYWxzZVwiXVxuICAgICAgdmFyIHByZWYgPSBVdGlsLmdldFVuaGFzaGVkU3RyaW5nKHByZWZfd2l0aF92YWxbMF0pO1xuICAgICAgdmFyIHZhbCA9IEJvb2xlYW4oVXRpbC5nZXRVbmhhc2hlZFN0cmluZyhwcmVmX3dpdGhfdmFsWzFdKSA9PT0gXCJ0cnVlXCIpO1xuXG4gICAgICBwcmVmX29ialtwcmVmXSA9ICh2YWwpO1xuICAgIH1cbiAgICB0aGlzLnRyaWdnZXIoe2xvYWRpbmc6IHRydWUsIHNjaG9vbDogc2Nob29sLCBwcmVmZXJlbmNlczpwcmVmX29ian0pO1xuICAgIFRUX1NUQVRFLnByZWZlcmVuY2VzID0gcHJlZl9vYmo7XG4gICAgVFRfU1RBVEUuc2Nob29sID0gc2Nob29sO1xuICAgIFRUX1NUQVRFLmluZGV4ID0gcGFyc2VJbnQoVXRpbC5nZXRVbmhhc2hlZFN0cmluZyhjb3Vyc2VzLnNoaWZ0KCkpKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdXJzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjb3Vyc2VfaW5mbyA9IGNvdXJzZXNbaV0uc3BsaXQoXCIrXCIpO1xuICAgICAgdmFyIGMgPSBwYXJzZUludChVdGlsLmdldFVuaGFzaGVkU3RyaW5nKGNvdXJzZV9pbmZvLnNoaWZ0KCkpKTtcblxuICAgICAgVFRfU1RBVEUuY291cnNlc190b19zZWN0aW9uc1tjXSA9IHsnTCc6ICcnLCAnVCc6ICcnLCAnUCc6ICcnLCAnQyc6ICcnfTtcbiAgICAgIGlmIChjb3Vyc2VfaW5mby5sZW5ndGggPiAwKSB7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY291cnNlX2luZm8ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICB2YXIgc2VjdGlvbiA9IFV0aWwuZ2V0VW5oYXNoZWRTdHJpbmcoY291cnNlX2luZm9bal0pO1xuICAgICAgICAgIGlmIChzY2hvb2wgPT0gXCJ1b2Z0XCIpIHtcbiAgICAgICAgICAgIFRUX1NUQVRFLmNvdXJzZXNfdG9fc2VjdGlvbnNbY11bc2VjdGlvblswXV0gPSBzZWN0aW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmIChzY2hvb2wgPT0gXCJqaHVcIikge1xuICAgICAgICAgICAgVFRfU1RBVEUuY291cnNlc190b19zZWN0aW9uc1tjXVsnQyddID0gc2VjdGlvbjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5tYWtlUmVxdWVzdChUVF9TVEFURSk7XG4gIH0sXG5cbiAgc2V0Q291cnNlc0xvYWRpbmc6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMudHJpZ2dlcih7Y291cnNlc19sb2FkaW5nOiB0cnVlfSk7XG4gIH0sXG4gIHNldENvdXJzZXNEb25lTG9hZGluZzogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy50cmlnZ2VyKHtjb3Vyc2VzX2xvYWRpbmc6IGZhbHNlfSk7XG4gIH0sXG4gIHNldEN1cnJlbnRJbmRleDogZnVuY3Rpb24obmV3X2luZGV4KSB7XG4gICAgdGhpcy50cmlnZ2VyKHtjdXJyZW50X2luZGV4OiBuZXdfaW5kZXh9KTtcbiAgfSxcblxufSk7XG5cbiQod2luZG93KS5vbignYmVmb3JldW5sb2FkJywgZnVuY3Rpb24oKSB7XG4gICQuYWpheCh7XG4gICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICBhc3luYzogZmFsc2UsXG4gICAgICB1cmw6ICcvZXhpdCcsXG4gICAgICBkYXRhOiB7c2lkOiBTSUR9XG4gIH0pO1xufSk7XG5cbiIsInZhciBTbG90TWFuYWdlciA9IHJlcXVpcmUoJy4vc2xvdF9tYW5hZ2VyJyk7XG52YXIgUGFnaW5hdGlvbiA9IHJlcXVpcmUoJy4vcGFnaW5hdGlvbicpO1xudmFyIFVwZGF0ZVRpbWV0YWJsZXNTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzJyk7XG52YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcycpO1xudmFyIFRvYXN0QWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy90b2FzdF9hY3Rpb25zJyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC90aW1ldGFibGVfdXRpbCcpO1xudmFyIE5ld1BhZ2luYXRpb24gPSByZXF1aXJlKCcuL25ld19wYWdpbmF0aW9uJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBtaXhpbnM6IFtSZWZsdXguY29ubmVjdChVcGRhdGVUaW1ldGFibGVzU3RvcmUpXSxcblxuICBzZXRJbmRleDogZnVuY3Rpb24obmV3X2luZGV4KSB7XG4gICAgcmV0dXJuKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChuZXdfaW5kZXggPj0gMCAmJiBuZXdfaW5kZXggPCB0aGlzLnN0YXRlLnRpbWV0YWJsZXMubGVuZ3RoKSB7XG4gICAgICAgIFRpbWV0YWJsZUFjdGlvbnMuc2V0Q3VycmVudEluZGV4KG5ld19pbmRleCk7XG4gICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICBnZXRTaGFyZUxpbms6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsaW5rID0gd2luZG93LmxvY2F0aW9uLmhvc3QgKyBcIi9cIjtcbiAgICB2YXIgZGF0YSA9IHRoaXMuZ2V0RGF0YSgpO1xuICAgIHJldHVybiBsaW5rICsgZGF0YTtcbiAgfSxcbiAgZ2V0RGF0YTogZnVuY3Rpb24oKSB7XG4gIHJldHVybiBVdGlsLmdldExpbmtEYXRhKHRoaXMuc3RhdGUuc2Nob29sLFxuICAgICAgdGhpcy5zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zLFxuICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4LCB0aGlzLnN0YXRlLnByZWZlcmVuY2VzKTtcbiAgfSxcbiAgZ2V0RW5kSG91cjogZnVuY3Rpb24oKSB7XG4gICAgLy8gZ2V0cyB0aGUgZW5kIGhvdXIgb2YgdGhlIGN1cnJlbnQgdGltZXRhYmxlXG4gICAgdmFyIG1heF9lbmRfaG91ciA9IDE4O1xuICAgIGlmICghdGhpcy5oYXNUaW1ldGFibGVzKCkpIHtcbiAgICAgIHJldHVybiBtYXhfZW5kX2hvdXI7XG4gICAgfVxuICAgIHZhciBjb3Vyc2VzID0gdGhpcy5zdGF0ZS50aW1ldGFibGVzW3RoaXMuc3RhdGUuY3VycmVudF9pbmRleF0uY291cnNlcztcbiAgICBmb3IgKHZhciBjb3Vyc2VfaW5kZXggaW4gY291cnNlcykge1xuICAgICAgdmFyIGNvdXJzZSA9IGNvdXJzZXNbY291cnNlX2luZGV4XTtcbiAgICAgIGZvciAodmFyIHNsb3RfaW5kZXggaW4gY291cnNlLnNsb3RzKSB7XG4gICAgICAgIHZhciBzbG90ID0gY291cnNlLnNsb3RzW3Nsb3RfaW5kZXhdO1xuICAgICAgICB2YXIgZW5kX2hvdXIgPSBwYXJzZUludChzbG90LnRpbWVfZW5kLnNwbGl0KFwiOlwiKVswXSk7XG4gICAgICAgIG1heF9lbmRfaG91ciA9IE1hdGgubWF4KG1heF9lbmRfaG91ciwgZW5kX2hvdXIpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWF4X2VuZF9ob3VyO1xuXG4gIH0sXG5cbiAgZ2V0SG91clJvd3M6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBtYXhfZW5kX2hvdXIgPSB0aGlzLmdldEVuZEhvdXIoKTtcbiAgICB2YXIgcm93cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSA4OyBpIDw9IG1heF9lbmRfaG91cjsgaSsrKSB7IC8vIG9uZSByb3cgZm9yIGVhY2ggaG91ciwgc3RhcnRpbmcgZnJvbSA4YW1cbiAgICAgIHZhciB0aW1lID0gaSArIFwiYW1cIjtcbiAgICAgIGlmIChpID49IDEyKSB7IC8vIHRoZSBwbSBob3Vyc1xuICAgICAgICB2YXIgaG91ciA9IChpIC0gMTIpID4gMCA/IGkgLSAxMiA6IGk7XG4gICAgICAgIHRpbWUgPSBob3VyICsgXCJwbVwiO1xuICAgICAgfVxuICAgICAgcm93cy5wdXNoKFxuICAgICAgICAgICg8dHIga2V5PXt0aW1lfT5cbiAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPnt0aW1lfTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgIDwvdHI+KVxuICAgICAgKTsgIFxuICAgICAgLy8gZm9yIHRoZSBoYWxmIGhvdXIgcm93XG4gICAgICByb3dzLnB1c2goXG4gICAgICAgICAgKDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiIGtleT17dGltZSArIFwiLWhhbGZcIn0+XG4gICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgIDwvdHI+KVxuICAgICAgKTtcblxuICAgIH1cblxuICAgIHJldHVybiByb3dzO1xuICB9LFxuXG5cbiAgaGFzVGltZXRhYmxlczogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGUudGltZXRhYmxlcy5sZW5ndGggPiAwO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaGFzX3RpbWV0YWJsZXMgPSB0aGlzLmhhc1RpbWV0YWJsZXMoKTtcbiAgICAgIHZhciBzbG90X21hbmFnZXIgPSAhaGFzX3RpbWV0YWJsZXMgPyBudWxsIDpcbiAgICAgICAoPFNsb3RNYW5hZ2VyIHRvZ2dsZU1vZGFsPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsfSBcbiAgICAgICAgICAgICAgICAgICAgIHRpbWV0YWJsZT17dGhpcy5zdGF0ZS50aW1ldGFibGVzW3RoaXMuc3RhdGUuY3VycmVudF9pbmRleF19XG4gICAgICAgICAgICAgICAgICAgICBjb3Vyc2VzX3RvX3NlY3Rpb25zPXt0aGlzLnN0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnN9XG4gICAgICAgICAgICAgICAgICAgICBzY2hvb2w9e3RoaXMuc3RhdGUuc2Nob29sfS8+KTtcblxuICAgICAgdmFyIGhvdXJzID0gdGhpcy5nZXRIb3VyUm93cygpO1xuICAgICAgdmFyIG9wYWNpdHkgPSB0aGlzLnN0YXRlLmxvYWRpbmcgPyB7b3BhY2l0eTogXCIwLjVcIn0gOiB7fTtcbiAgICAgIHZhciBoZWlnaHQgPSAoNTcyICsgKHRoaXMuZ2V0RW5kSG91cigpIC0gMTgpKjUyKSArIFwicHhcIjtcbiAgICAgIHJldHVybiAoXG5cbiAgICAgICAgICA8ZGl2IGlkPVwiY2FsZW5kYXJcIiBjbGFzc05hbWU9XCJmYyBmYy1sdHIgZmMtdW50aGVtZWRcIiBzdHlsZT17b3BhY2l0eX0+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdG9vbGJhclwiPlxuICAgICAgICAgICAgICAgIDxQYWdpbmF0aW9uIFxuICAgICAgICAgICAgICAgICAgY291bnQ9e3RoaXMuc3RhdGUudGltZXRhYmxlcy5sZW5ndGh9IFxuICAgICAgICAgICAgICAgICAgbmV4dD17dGhpcy5zZXRJbmRleCh0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXggKyAxKX0gXG4gICAgICAgICAgICAgICAgICBwcmV2PXt0aGlzLnNldEluZGV4KHRoaXMuc3RhdGUuY3VycmVudF9pbmRleCAtIDEpfVxuICAgICAgICAgICAgICAgICAgc2V0SW5kZXg9e3RoaXMuc2V0SW5kZXh9XG4gICAgICAgICAgICAgICAgICBjdXJyZW50X2luZGV4PXt0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXh9Lz5cbiAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnkgcmlnaHQgY2FsZW5kYXItZnVuY3Rpb25cIlxuICAgICAgICAgICAgICAgICAgIGRhdGEtY2xpcGJvYXJkLXRleHQ9e3RoaXMuZ2V0U2hhcmVMaW5rKCl9PlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZnVpLWNsaXBcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtY2xlYXJcIj48L2Rpdj5cblxuXG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdmlldy1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXZpZXcgZmMtYWdlbmRhV2Vlay12aWV3IGZjLWFnZW5kYS12aWV3XCI+XG4gICAgICAgICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgICAgIDx0aGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXJvdyBmYy13aWRnZXQtaGVhZGVyXCIgaWQ9XCJjdXN0b20td2lkZ2V0LWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXdpZGdldC1oZWFkZXJcIj48L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJmYy1kYXktaGVhZGVyIGZjLXdpZGdldC1oZWFkZXIgZmMtbW9uXCI+TW9uIDwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWRheS1oZWFkZXIgZmMtd2lkZ2V0LWhlYWRlciBmYy10dWVcIj5UdWUgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwiZmMtZGF5LWhlYWRlciBmYy13aWRnZXQtaGVhZGVyIGZjLXdlZFwiPldlZCA8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJmYy1kYXktaGVhZGVyIGZjLXdpZGdldC1oZWFkZXIgZmMtdGh1XCI+VGh1IDwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWRheS1oZWFkZXIgZmMtd2lkZ2V0LWhlYWRlciBmYy1mcmlcIj5GcmkgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGhlYWQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDwvdGhlYWQ+XG5cbiAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWRheS1ncmlkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWNvbnRlbnQtc2tlbGV0b25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXNcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10aW1lLWdyaWQtY29udGFpbmVyIGZjLXNjcm9sbGVyXCIgaWQ9XCJjYWxlbmRhci1pbm5lclwiIHN0eWxlPXt7aGVpZ2h0OiBoZWlnaHR9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRpbWUtZ3JpZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1iZ1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1kYXkgZmMtd2lkZ2V0LWNvbnRlbnQgZmMtbW9uXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWRheSBmYy13aWRnZXQtY29udGVudCBmYy10dWVcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtZGF5IGZjLXdpZGdldC1jb250ZW50IGZjLXdlZFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1kYXkgZmMtd2lkZ2V0LWNvbnRlbnQgZmMtdGh1XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWRheSBmYy13aWRnZXQtY29udGVudCBmYy1mcmlcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXNsYXRzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aG91cnN9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGhyIGNsYXNzTmFtZT1cImZjLXdpZGdldC1oZWFkZXJcIiBpZD1cIndpZGdldC1oclwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWNvbnRlbnQtc2tlbGV0b25cIiBpZD1cInNsb3QtbWFuYWdlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7c2xvdF9tYW5hZ2VyfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICk7XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjbGlwID0gbmV3IENsaXBib2FyZCgnLmNhbGVuZGFyLWZ1bmN0aW9uJyk7XG4gICAgY2xpcC5vbignc3VjY2VzcycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIFRvYXN0QWN0aW9ucy5jcmVhdGVUb2FzdChcIkxpbmsgY29waWVkIHRvIGNsaXBib2FyZCFcIik7XG4gICAgfSk7XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICBpZih0eXBlb2YoU3RvcmFnZSkgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGlmICh0aGlzLnN0YXRlLnRpbWV0YWJsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyBzYXZlIG5ld2x5IGdlbmVyYXRlZCBjb3Vyc2VzIHRvIGxvY2FsIHN0b3JhZ2VcbiAgICAgICAgdmFyIG5ld19kYXRhID0gdGhpcy5nZXREYXRhKCk7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdkYXRhJywgbmV3X2RhdGEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2RhdGEnKTtcbiAgICAgIH1cbiAgICB9IFxuXG4gIH0sXG5cblxufSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge3Zpc2libGU6IHRydWV9O1xuXHR9LFx0XHRcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIXRoaXMuc3RhdGUudmlzaWJsZSkge3JldHVybiBudWxsO31cblx0XHRyZXR1cm4gKFxuXHRcdDxkaXYgY2xhc3NOYW1lPVwic2VtLXRvYXN0LXdyYXBwZXIgdG9hc3RpbmdcIj5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2VtLXRvYXN0XCI+e3RoaXMucHJvcHMuY29udGVudH08L2Rpdj5cblx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9LFxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdGlmICh0aGlzLl9yZWFjdEludGVybmFsSW5zdGFuY2UpIHsgLy8gaWYgbW91bnRlZCBzdGlsbFxuXHRcdFx0XHR0aGlzLnNldFN0YXRlKHt2aXNpYmxlOiBmYWxzZX0pO1xuXHRcdFx0fVxuXHRcdH0uYmluZCh0aGlzKSwgNDAwMCk7XG5cdH0sXG5cbn0pO1xuIiwidmFyIGhhc2hpZHMgPSBuZXcgSGFzaGlkcyhcIng5OGFzN2RoZyZoKmFza2RqXmhhcyFraj94ejwhOVwiKTtcbm1vZHVsZS5leHBvcnRzID0ge1xuXHRnZXRMaW5rRGF0YTogZnVuY3Rpb24oc2Nob29sLCBjb3Vyc2VzX3RvX3NlY3Rpb25zLCBpbmRleCwgcHJlZmVyZW5jZXMpIHtcblx0XHRpZiAoT2JqZWN0LmtleXMoY291cnNlc190b19zZWN0aW9ucykubGVuZ3RoID09IDApIHtyZXR1cm4gXCJcIjt9XG5cdCAgICB2YXIgZGF0YSA9IHRoaXMuZ2V0SGFzaGVkU3RyaW5nKHNjaG9vbCkgKyBcIiZcIjtcblx0ICAgIGZvciAodmFyIHByZWYgaW4gcHJlZmVyZW5jZXMpIHtcblx0ICAgIFx0dmFyIGVuY29kZWRfcCA9IHRoaXMuZ2V0SGFzaGVkU3RyaW5nKHByZWYpO1xuXHQgICAgXHR2YXIgZW5jb2RlZF92YWwgPSB0aGlzLmdldEhhc2hlZFN0cmluZyhwcmVmZXJlbmNlc1twcmVmXSk7XG5cdCAgICBcdGRhdGEgKz0gZW5jb2RlZF9wICsgXCI9XCIgKyBlbmNvZGVkX3ZhbCArIFwiO1wiO1xuXHQgICAgfVxuXHQgICAgZGF0YSA9IGRhdGEuc2xpY2UoMCwgLTEpO1xuXHQgICAgZGF0YSArPSBcIiZcIiArIHRoaXMuZ2V0SGFzaGVkU3RyaW5nKGluZGV4KSArIFwiJlwiO1xuXHQgICAgdmFyIGNfdG9fcyA9IGNvdXJzZXNfdG9fc2VjdGlvbnM7XG5cdCAgICBmb3IgKHZhciBjb3Vyc2VfaWQgaW4gY190b19zKSB7XG5cdCAgICAgIHZhciBlbmNvZGVkX2NvdXJzZV9pZCA9IHRoaXMuZ2V0SGFzaGVkU3RyaW5nKGNvdXJzZV9pZCk7XG5cdCAgICAgIGRhdGEgKz0gZW5jb2RlZF9jb3Vyc2VfaWQ7XG5cblx0ICAgICAgdmFyIG1hcHBpbmcgPSBjX3RvX3NbY291cnNlX2lkXTtcblx0ICAgICAgZm9yICh2YXIgc2VjdGlvbl9oZWFkaW5nIGluIG1hcHBpbmcpIHsgLy8gaS5lICdMJywgJ1QnLCAnUCcsICdTJ1xuXHQgICAgICAgIGlmIChtYXBwaW5nW3NlY3Rpb25faGVhZGluZ10gIT0gXCJcIikge1xuXHQgICAgICAgICAgdmFyIGVuY29kZWRfc2VjdGlvbiA9IHRoaXMuZ2V0SGFzaGVkU3RyaW5nKG1hcHBpbmdbc2VjdGlvbl9oZWFkaW5nXSk7XG5cdCAgICAgICAgICBkYXRhICs9IFwiK1wiICsgZW5jb2RlZF9zZWN0aW9uOyAvLyBkZWxpbWl0ZXIgZm9yIHNlY3Rpb25zIGxvY2tlZFxuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXHQgICAgICBkYXRhICs9IFwiJlwiOyAvLyBkZWxpbWl0ZXIgZm9yIGNvdXJzZXNcblx0ICAgIH1cblx0ICAgIGRhdGEgPSBkYXRhLnNsaWNlKDAsIC0xKTtcblx0ICAgIGlmIChkYXRhLmxlbmd0aCA8IDMpIHtkYXRhID0gXCJcIjt9XG5cblx0ICAgIHJldHVybiBkYXRhO1xuXHR9LFxuXG5cdGdldEhhc2hlZFN0cmluZzogZnVuY3Rpb24oeCkge1xuXHRcdHggPSBTdHJpbmcoeCk7XG5cdFx0dmFyIGhleGVkID0gQnVmZmVyKHgpLnRvU3RyaW5nKCdoZXgnKTtcbiAgICBcdHZhciBlbmNvZGVkX3ggPSBoYXNoaWRzLmVuY29kZUhleChoZXhlZCk7XG4gICAgXHRpZiAoIWVuY29kZWRfeCB8fCBlbmNvZGVkX3ggPT0gXCJcIikge1xuICAgIFx0XHRjb25zb2xlLmxvZyh4KTtcbiAgICBcdH1cbiAgICBcdHJldHVybiBlbmNvZGVkX3g7XG5cdH0sXG5cblx0Z2V0VW5oYXNoZWRTdHJpbmc6IGZ1bmN0aW9uKHgpIHtcblx0XHR2YXIgZGVjb2RlZEhleCA9IGhhc2hpZHMuZGVjb2RlSGV4KHgpO1xuXHRcdHZhciBzdHJpbmcgPSBCdWZmZXIoZGVjb2RlZEhleCwgJ2hleCcpLnRvU3RyaW5nKCd1dGY4Jyk7XG5cdFx0cmV0dXJuIHN0cmluZztcblx0fSxcblxufVxuIl19
