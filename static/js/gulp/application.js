(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/linoah/Documents/semesterly/node_modules/browserify/node_modules/buffer/index.js":[function(require,module,exports){
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

},{"base64-js":"/home/linoah/Documents/semesterly/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib/b64.js","ieee754":"/home/linoah/Documents/semesterly/node_modules/browserify/node_modules/buffer/node_modules/ieee754/index.js","isarray":"/home/linoah/Documents/semesterly/node_modules/browserify/node_modules/buffer/node_modules/isarray/index.js"}],"/home/linoah/Documents/semesterly/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib/b64.js":[function(require,module,exports){
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

},{}],"/home/linoah/Documents/semesterly/node_modules/browserify/node_modules/buffer/node_modules/ieee754/index.js":[function(require,module,exports){
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

},{}],"/home/linoah/Documents/semesterly/node_modules/browserify/node_modules/buffer/node_modules/isarray/index.js":[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/course_actions.js":[function(require,module,exports){
module.exports = Reflux.createActions(
  ["getCourseInfo"]
);

},{}],"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/toast_actions.js":[function(require,module,exports){
module.exports = Reflux.createActions(
  ["createToast"]
);

},{}],"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js":[function(require,module,exports){
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

},{}],"/home/linoah/Documents/semesterly/static/js/new_timetable/app.jsx":[function(require,module,exports){
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

},{"./actions/update_timetables":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js","./root":"/home/linoah/Documents/semesterly/static/js/new_timetable/root.jsx"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/control_bar.jsx":[function(require,module,exports){
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

},{"./preference_menu":"/home/linoah/Documents/semesterly/static/js/new_timetable/preference_menu.jsx","./search_bar":"/home/linoah/Documents/semesterly/static/js/new_timetable/search_bar.jsx"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/evaluations.jsx":[function(require,module,exports){
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

},{}],"/home/linoah/Documents/semesterly/static/js/new_timetable/loader.jsx":[function(require,module,exports){
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

},{}],"/home/linoah/Documents/semesterly/static/js/new_timetable/modal_content.jsx":[function(require,module,exports){
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

},{"./actions/course_actions":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/course_actions.js","./actions/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js","./evaluations.jsx":"/home/linoah/Documents/semesterly/static/js/new_timetable/evaluations.jsx","./loader":"/home/linoah/Documents/semesterly/static/js/new_timetable/loader.jsx","./section_slot.jsx":"/home/linoah/Documents/semesterly/static/js/new_timetable/section_slot.jsx","./stores/course_info":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/course_info.js","./stores/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/new_pagination.jsx":[function(require,module,exports){
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

},{}],"/home/linoah/Documents/semesterly/static/js/new_timetable/pagination.jsx":[function(require,module,exports){
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

},{}],"/home/linoah/Documents/semesterly/static/js/new_timetable/preference_menu.jsx":[function(require,module,exports){
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

},{"./actions/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/root.jsx":[function(require,module,exports){
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

},{"./actions/course_actions":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/course_actions.js","./control_bar":"/home/linoah/Documents/semesterly/static/js/new_timetable/control_bar.jsx","./modal_content":"/home/linoah/Documents/semesterly/static/js/new_timetable/modal_content.jsx","./school_list":"/home/linoah/Documents/semesterly/static/js/new_timetable/school_list.jsx","./side_bar":"/home/linoah/Documents/semesterly/static/js/new_timetable/side_bar.jsx","./simple_modal":"/home/linoah/Documents/semesterly/static/js/new_timetable/simple_modal.jsx","./stores/toast_store.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/toast_store.js","./stores/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/update_timetables.js","./timetable":"/home/linoah/Documents/semesterly/static/js/new_timetable/timetable.jsx"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/school_list.jsx":[function(require,module,exports){
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

},{"./actions/update_timetables":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/search_bar.jsx":[function(require,module,exports){
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

},{"./actions/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/section_slot.jsx":[function(require,module,exports){
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

},{"./actions/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/side_bar.jsx":[function(require,module,exports){
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
    var modal = null;
    if (this.state.show_modal) {
        modal = React.createElement(SimpleModal, {header: "Your Textbooks", 
                   styles: {backgroundColor: "#FDF5FF", color: "#000"}, 
                   content: null})
    }
    var see_all = null;
    if (tb_elements != null) {
      see_all = (React.createElement("div", {className: "view-tbs", onClick: this.toggle}, "View All Textbooks"))
    }
    var courses = this.state.timetables.length > 0 ? this.state.timetables[this.state.current_index].courses : null
    return (
      React.createElement("div", {className: "course-roster textbook-list"}, 
        React.createElement(SimpleModal, {header: "Your Textbooks", 
           key: "textbook", 
           ref: "tbs", 
           styles: {backgroundColor: "#FDF5FF", color: "#000"}, 
           allow_disable: true, 
           content: React.createElement(TextbookList, {courses: courses})}), 
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

})

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

},{"./actions/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js","./simple_modal":"/home/linoah/Documents/semesterly/static/js/new_timetable/simple_modal.jsx","./stores/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/update_timetables.js","./textbook_list":"/home/linoah/Documents/semesterly/static/js/new_timetable/textbook_list.jsx"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/simple_modal.jsx":[function(require,module,exports){
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

},{}],"/home/linoah/Documents/semesterly/static/js/new_timetable/slot_manager.jsx":[function(require,module,exports){
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

},{"./actions/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/course_info.js":[function(require,module,exports){
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

},{"../actions/course_actions.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/course_actions.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/toast_store.js":[function(require,module,exports){
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

},{"../actions/toast_actions.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/toast_actions.js","../toast":"/home/linoah/Documents/semesterly/static/js/new_timetable/toast.jsx"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/update_timetables.js":[function(require,module,exports){
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

},{"../actions/toast_actions.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/toast_actions.js","../actions/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js","../util/timetable_util":"/home/linoah/Documents/semesterly/static/js/new_timetable/util/timetable_util.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/textbook_list.jsx":[function(require,module,exports){
var TimetableActions = require('./actions/update_timetables.js');
var TimetableStore = require('./stores/update_timetables.js');
var SimpleModal = require('./simple_modal');

module.exports = React.createClass({displayName: "exports",
  mixins: [Reflux.connect(TimetableStore)],

  render: function() {
  	var html = this.props.courses.map(function(c) {
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
	  		return (
	  			React.createElement("div", {className: "textbook-list-entry"}, 
	  				React.createElement("h6", null, c.name), 
	  				 React.createElement("div", {className: "course-roster textbook-list"}, 
	  					inner_html
	  				)
	  			))
  		}
  		else {
  			return null
  		}
  	}.bind(this));
    return (React.createElement("div", {className: "textbook-list-wrapper"}, html))
  },

});

},{"./actions/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js","./simple_modal":"/home/linoah/Documents/semesterly/static/js/new_timetable/simple_modal.jsx","./stores/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/timetable.jsx":[function(require,module,exports){
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

},{"./actions/toast_actions":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/toast_actions.js","./actions/update_timetables":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js","./new_pagination":"/home/linoah/Documents/semesterly/static/js/new_timetable/new_pagination.jsx","./pagination":"/home/linoah/Documents/semesterly/static/js/new_timetable/pagination.jsx","./slot_manager":"/home/linoah/Documents/semesterly/static/js/new_timetable/slot_manager.jsx","./stores/update_timetables":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/update_timetables.js","./util/timetable_util":"/home/linoah/Documents/semesterly/static/js/new_timetable/util/timetable_util.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/toast.jsx":[function(require,module,exports){
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

},{}],"/home/linoah/Documents/semesterly/static/js/new_timetable/util/timetable_util.js":[function(require,module,exports){
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

}

}).call(this,require("buffer").Buffer)

},{"buffer":"/home/linoah/Documents/semesterly/node_modules/browserify/node_modules/buffer/index.js"}]},{},["/home/linoah/Documents/semesterly/static/js/new_timetable/app.jsx"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaXNhcnJheS9pbmRleC5qcyIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9hY3Rpb25zL2NvdXJzZV9hY3Rpb25zLmpzIiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL2FjdGlvbnMvdG9hc3RfYWN0aW9ucy5qcyIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzIiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL2FwcC5qc3giLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvY29udHJvbF9iYXIuanN4IiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL2V2YWx1YXRpb25zLmpzeCIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9sb2FkZXIuanN4IiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL21vZGFsX2NvbnRlbnQuanN4IiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL25ld19wYWdpbmF0aW9uLmpzeCIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9wYWdpbmF0aW9uLmpzeCIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9wcmVmZXJlbmNlX21lbnUuanN4IiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3Jvb3QuanN4IiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3NjaG9vbF9saXN0LmpzeCIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zZWFyY2hfYmFyLmpzeCIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zZWN0aW9uX3Nsb3QuanN4IiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3NpZGVfYmFyLmpzeCIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zaW1wbGVfbW9kYWwuanN4IiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3Nsb3RfbWFuYWdlci5qc3giLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc3RvcmVzL2NvdXJzZV9pbmZvLmpzIiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3N0b3Jlcy90b2FzdF9zdG9yZS5qcyIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMiLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvdGV4dGJvb2tfbGlzdC5qc3giLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvdGltZXRhYmxlLmpzeCIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS90b2FzdC5qc3giLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvdXRpbC90aW1ldGFibGVfdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVnREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQSxNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxhQUFhO0VBQ25DLENBQUMsZUFBZSxDQUFDO0NBQ2xCLENBQUM7OztBQ0ZGLE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLGFBQWE7RUFDbkMsQ0FBQyxhQUFhLENBQUM7Q0FDaEI7OztBQ0ZELE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLGFBQWE7RUFDbkM7RUFDQSxlQUFlO0VBQ2YsbUJBQW1CO0VBQ25CLHFCQUFxQjtFQUNyQixXQUFXO0VBQ1gsbUJBQW1CO0VBQ25CLHVCQUF1QjtFQUN2QixpQkFBaUI7R0FDaEI7Q0FDRixDQUFDOzs7QUNWRixJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDN0IsSUFBSSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsNkJBQTZCLENBQUMsQ0FBQztBQUM5RCxTQUFTLEdBQUcsR0FBRyxDQUFDOztBQUVoQixJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQ0FBa0M7QUFDcEYsSUFBSSxDQUFDLElBQUksSUFBSSxPQUFPLE9BQU8sQ0FBQyxLQUFLLFdBQVcsRUFBRTtJQUMxQyxJQUFJLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN4QyxDQUFDOztBQUVELFFBQVEsQ0FBQyxNQUFNO0VBQ2Isb0JBQUMsSUFBSSxFQUFBLENBQUEsQ0FBQyxJQUFBLEVBQUksQ0FBRSxJQUFLLENBQUUsQ0FBQTtFQUNuQixRQUFRLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQztBQUNqQyxDQUFDLENBQUM7QUFDRjtBQUNBO0FBQ0E7O0FBRUEsSUFBSSxJQUFJLEVBQUU7Q0FDVCxnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUMzQzs7O0FDbkJELElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUN4QyxJQUFJLGNBQWMsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQzs7QUFFbEQsb0NBQW9DLHVCQUFBOztFQUVsQyxNQUFNLEVBQUUsV0FBVztJQUNqQjtNQUNFLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMsYUFBYyxDQUFBLEVBQUE7UUFDcEIsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxzQkFBdUIsQ0FBQSxFQUFBO1VBQzdCLG9CQUFDLFNBQVMsRUFBQSxDQUFBLENBQUMsV0FBQSxFQUFXLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFZLENBQUEsQ0FBRyxDQUFBO1FBQzlDLENBQUEsRUFBQTtRQUNOLG9CQUFDLGNBQWMsRUFBQSxJQUFBLENBQUcsQ0FBQTtBQUMxQixNQUFZLENBQUE7O01BRU47R0FDSDtDQUNGLENBQUMsQ0FBQzs7O0FDaEJILElBQUksZ0NBQWdDLDBCQUFBO0NBQ25DLE1BQU0sRUFBRSxXQUFXO0VBQ2xCLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLG9CQUFvQixHQUFHLFdBQVc7RUFDdEUsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxJQUFJO0dBQ3hDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMsU0FBVSxDQUFBLEVBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFRLENBQUE7SUFDN0U7RUFDRixJQUFJLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLElBQUk7R0FDckMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxNQUFPLENBQUEsRUFBQSxhQUFBLEVBQVksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsU0FBZ0IsQ0FBQTtJQUMvRDtFQUNGO0VBQ0Esb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBRSxPQUFPLEVBQUMsQ0FBQyxPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFrQixDQUFFLENBQUEsRUFBQTtHQUNoRSxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLGNBQWUsQ0FBQSxFQUFBO0lBQ3RCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsTUFBTyxDQUFBLEVBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBVyxDQUFBLEVBQUE7SUFDdEQsSUFBSSxFQUFDO0lBQ04sb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxnQkFBaUIsQ0FBQSxFQUFBO0tBQy9CLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMscUJBQXNCLENBQUEsRUFBQTtNQUNwQyxvQkFBQSxNQUFLLEVBQUEsQ0FBQSxDQUFDLEtBQUEsRUFBSyxDQUFFLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxFQUFDLENBQUMsU0FBQSxFQUFTLENBQUMsUUFBUyxDQUFPLENBQUE7S0FDbkYsQ0FBQSxFQUFBO0tBQ04sb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxnQkFBaUIsQ0FBQSxFQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsR0FBVSxDQUFBO0lBQ3pFLENBQUE7R0FDRCxDQUFBLEVBQUE7R0FDTCxPQUFRO0VBQ0osQ0FBQSxFQUFFO0VBQ1I7QUFDRixDQUFDLENBQUMsQ0FBQzs7QUFFSCxvQ0FBb0MsdUJBQUE7O0NBRW5DLGVBQWUsRUFBRSxXQUFXO0VBQzNCLE9BQU87R0FDTixjQUFjLEVBQUUsSUFBSTtHQUNwQixDQUFDO0FBQ0osRUFBRTs7Q0FFRCxNQUFNLEVBQUUsV0FBVztFQUNsQixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDVixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUU7R0FDaEQsQ0FBQyxFQUFFLENBQUM7R0FDSixJQUFJLFFBQVEsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUM7R0FDOUMsUUFBUSxvQkFBQyxVQUFVLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFFLENBQUMsRUFBQyxDQUFDLEdBQUEsRUFBRyxDQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUMsQ0FBQyxpQkFBQSxFQUFpQixDQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxRQUFBLEVBQVEsQ0FBRSxRQUFTLENBQUEsQ0FBRyxDQUFBLEVBQUU7R0FDaEgsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztFQUNkLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxhQUFjLENBQUEsRUFBQSwyQ0FBK0MsQ0FBQSxLQUFLLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMsYUFBYyxDQUFBLEVBQUEscURBQXlELENBQUEsQ0FBQyxDQUFDO0VBQ2xOO0VBQ0Esb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxhQUFBLEVBQWEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxvQkFBcUIsQ0FBQSxFQUFBO0dBQ3BELG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUEscUJBQXdCLENBQUEsRUFBQTtHQUM1QixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGNBQWUsQ0FBQSxFQUFBO0lBQzVCLEtBQU07R0FDRixDQUFBLEVBQUE7R0FDTCxZQUFhO0VBQ1QsQ0FBQSxFQUFFO0FBQ1YsRUFBRTs7Q0FFRCxjQUFjLEVBQUUsU0FBUyxPQUFPLEVBQUU7RUFDakMsUUFBUSxXQUFXO0dBQ2xCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLElBQUksT0FBTztBQUMzQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzs7SUFFdEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0dBQzFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO0VBQ2Q7Q0FDRCxDQUFDOzs7QUM1REYsb0NBQW9DLHVCQUFBOztDQUVuQyxNQUFNLEVBQUUsV0FBVztFQUNsQjtZQUNVLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMsTUFBTyxDQUFBLEVBQUE7Z0JBQ1gsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxjQUFlLENBQUEsRUFBQTtpQkFDN0Isb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxrQkFBbUIsQ0FBTSxDQUFBLEVBQUE7aUJBQ3hDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsa0JBQW1CLENBQU0sQ0FBQSxFQUFBO2lCQUN4QyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGtCQUFtQixDQUFNLENBQUEsRUFBQTtpQkFDeEMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxrQkFBbUIsQ0FBTSxDQUFBLEVBQUE7aUJBQ3hDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsa0JBQW1CLENBQU0sQ0FBQSxFQUFBO2lCQUN4QyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGtCQUFtQixDQUFNLENBQUEsRUFBQTtpQkFDeEMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxrQkFBbUIsQ0FBTSxDQUFBLEVBQUE7aUJBQ3hDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsa0JBQW1CLENBQU0sQ0FBQSxFQUFBO2lCQUN4QyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGtCQUFtQixDQUFNLENBQUE7Z0JBQ25DLENBQUE7WUFDSixDQUFBLEVBQUU7RUFDbEI7QUFDRixDQUFDLENBQUMsQ0FBQzs7O0FDbEJILElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNqQyxJQUFJLGVBQWUsR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUN0RCxJQUFJLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQ3JELElBQUksZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7QUFDakUsSUFBSSxxQkFBcUIsR0FBRyxPQUFPLENBQUMsK0JBQStCLENBQUMsQ0FBQztBQUNyRSxJQUFJLGFBQWEsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUN4RCxJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsb0JBQW9CLENBQUM7O0FBRS9DLG9DQUFvQyx1QkFBQTtBQUNwQyxDQUFDLE1BQU0sRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7O0NBRXpDLE1BQU0sRUFBRSxXQUFXO0VBQ2xCLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDO0VBQ3RDLElBQUksTUFBTSxHQUFHLE9BQU8sR0FBRyxvQkFBQyxNQUFNLEVBQUEsSUFBQSxDQUFHLENBQUEsR0FBRyxJQUFJLENBQUM7RUFDekMsSUFBSSxNQUFNLEdBQUcsT0FBTyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7RUFDL0MsSUFBSSxXQUFXLEdBQUcsT0FBTyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7RUFDekQsSUFBSSxXQUFXLEdBQUcsT0FBTyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7RUFDekQsSUFBSSxjQUFjLEdBQUcsT0FBTyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztFQUMvRCxJQUFJLFNBQVMsR0FBRyxPQUFPLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztFQUNyRCxJQUFJLFFBQVEsR0FBRyxPQUFPLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztFQUNuRDtHQUNDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMsZUFBZ0IsQ0FBQSxFQUFBO0lBQ3ZCLG9CQUFBLEdBQUUsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsNENBQUEsRUFBNEMsQ0FBQyxPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQU0sQ0FBSSxDQUFBLEVBQUE7Z0JBQzNFLE1BQU0sRUFBQztnQkFDUCxNQUFNLEVBQUM7Z0JBQ1AsV0FBVyxFQUFDO2dCQUNaLFdBQVcsRUFBQztnQkFDWixRQUFRLEVBQUM7Z0JBQ1QsU0FBUyxFQUFDO2dCQUNWLGNBQWU7WUFDZCxDQUFBLEVBQUU7QUFDcEIsRUFBRTs7Q0FFRCxTQUFTLEVBQUUsV0FBVztFQUNyQixJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7RUFDMUMsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQztFQUM1QyxJQUFJLGFBQWEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7R0FDdEUsb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyx5QkFBQSxFQUF5QixDQUFDLE9BQUEsRUFBTyxDQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFFLENBQUUsQ0FBQTtHQUM3RSxvQkFBQSxNQUFLLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLHdCQUFBLEVBQXdCLENBQUMsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUUsQ0FBRSxDQUFBLENBQUMsQ0FBQztFQUNoRixJQUFJLE1BQU0sSUFBSSxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGNBQWUsQ0FBQSxFQUFBO0dBQzFDLGFBQWEsRUFBQztHQUNmLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMscUJBQXNCLENBQUEsRUFBQTtJQUM3QixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLE1BQU8sQ0FBQSxFQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLElBQVcsQ0FBQSxFQUFBO0lBQ2xELG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMsTUFBTyxDQUFBLEVBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBVyxDQUFBO0dBQzdDLENBQUE7RUFDRCxDQUFBLENBQUMsQ0FBQztFQUNSLE9BQU8sTUFBTSxDQUFDO0VBQ2Q7QUFDRixDQUFDLFlBQVksRUFBRSxTQUFTLFFBQVEsRUFBRTs7RUFFaEMsUUFBUSxZQUFZO0dBQ25CLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztHQUNqRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtFQUNkO0NBQ0QsaUJBQWlCLEVBQUUsU0FBUyxTQUFTLEVBQUU7RUFDdEMsUUFBUSxXQUFXO0dBQ2xCLGFBQWEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7R0FDMUQsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDaEIsRUFBRTs7Q0FFRCxjQUFjLEVBQUUsV0FBVztFQUMxQixJQUFJLFdBQVc7SUFDYixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGFBQUEsRUFBYSxDQUFDLEVBQUEsRUFBRSxDQUFDLG9CQUFxQixDQUFBLEVBQUE7SUFDckQsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQSxjQUFpQixDQUFBLEVBQUE7SUFDcEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsV0FBWTtHQUMvQixDQUFBLENBQUM7RUFDUixPQUFPLFdBQVcsQ0FBQztBQUNyQixFQUFFOztDQUVELGNBQWMsRUFBRSxXQUFXO0VBQzFCLE9BQU8sb0JBQUMsaUJBQWlCLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFNBQVUsQ0FBQSxDQUFHLENBQUE7QUFDM0UsRUFBRTs7Q0FFRCxpQkFBaUIsRUFBRSxXQUFXO0VBQzdCLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsRUFBRTtZQUN2RTthQUNDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsZ0JBQUEsRUFBZ0IsQ0FBQyxPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFDLENBQUMsR0FBQSxFQUFHLENBQUUsRUFBRSxDQUFDLEVBQUksQ0FBQSxFQUFBO2NBQ25GLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsZ0JBQWlCLENBQUEsRUFBQTtlQUMvQixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGFBQWMsQ0FBQSxFQUFBO2dCQUM1QixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLE1BQU8sQ0FBQSxFQUFDLEVBQUUsQ0FBQyxJQUFXLENBQUEsRUFBQTtnQkFDckMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxNQUFPLENBQUEsRUFBQyxFQUFFLENBQUMsSUFBVyxDQUFBO2VBQ2hDLENBQUE7Y0FDRCxDQUFBO2FBQ0QsQ0FBQSxDQUFDO1NBQ1gsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztFQUNwQixJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsTUFBTSxJQUFJLENBQUMsR0FBRyxJQUFJO0lBQzVFLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsYUFBYyxDQUFBLEVBQUE7SUFDN0Isb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQSx5QkFBNEIsQ0FBQSxFQUFBO0lBQ2hDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMsdUJBQXdCLENBQUEsRUFBQTtLQUM5QixPQUFRO0lBQ0osQ0FBQTtHQUNELENBQUEsQ0FBQztFQUNSLE9BQU8sY0FBYztBQUN2QixFQUFFOztBQUVGLENBQUMsb0JBQW9CLEVBQUUsV0FBVzs7QUFFbEMsRUFBRTs7Q0FFRCxZQUFZLEVBQUUsV0FBVztFQUN4QixJQUFJLGlCQUFpQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxFQUFFO1lBQ2pGO2FBQ0Msb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxVQUFBLEVBQVUsQ0FBQyxHQUFBLEVBQUcsQ0FBRSxFQUFFLENBQUMsRUFBSSxDQUFBLEVBQUE7Y0FDckMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxNQUFBLEVBQU0sQ0FBQyxJQUFBLEVBQUksQ0FBQyxHQUFBLEVBQUcsQ0FBRSxFQUFFLENBQUMsU0FBVSxDQUFFLENBQUEsRUFBQTtjQUNyQyxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFlBQWEsQ0FBQSxFQUFDLEVBQUUsQ0FBQyxLQUFXLENBQUEsRUFBQTtjQUMxQyxvQkFBQSxLQUFJLEVBQUEsSUFBQyxFQUFDLEVBQUUsQ0FBQyxNQUFhLENBQUEsRUFBQTtjQUN0QixvQkFBQSxLQUFJLEVBQUEsSUFBQyxFQUFBLE9BQUEsRUFBTSxFQUFFLENBQUMsSUFBVyxDQUFBLEVBQUE7Y0FDekIsb0JBQUEsR0FBRSxFQUFBLENBQUEsQ0FBQyxJQUFBLEVBQUksQ0FBRSxFQUFFLENBQUMsVUFBVSxFQUFDLENBQUMsTUFBQSxFQUFNLENBQUMsUUFBUyxDQUFBLEVBQUE7ZUFDdkMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxHQUFBLEVBQUcsQ0FBQyxxR0FBQSxFQUFxRyxDQUFDLEtBQUEsRUFBSyxDQUFDLEtBQUEsRUFBSyxDQUFDLE1BQUEsRUFBTSxDQUFDLElBQUEsRUFBSSxDQUFDLE1BQUEsRUFBTSxDQUFDLEdBQUcsQ0FBRSxDQUFBO2NBQ2hKLENBQUE7YUFDQyxDQUFBLEVBQUU7U0FDWixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLGFBQWMsQ0FBQSxFQUFBLG1DQUF1QyxDQUFBO0tBQzNJLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMsV0FBWSxDQUFBLEVBQUE7Y0FDVixpQkFBa0I7YUFDZCxDQUFBLENBQUMsQ0FBQztFQUNuQixJQUFJLEdBQUc7SUFDTCxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGFBQUEsRUFBYSxDQUFDLEVBQUEsRUFBRSxDQUFDLGtCQUFtQixDQUFBLEVBQUE7SUFDbkQsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQSxZQUFlLENBQUEsRUFBQTtJQUNsQixTQUFVO0dBQ04sQ0FBQSxDQUFDLENBQUM7RUFDVCxPQUFPLEdBQUcsQ0FBQztBQUNiLEVBQUU7O0NBRUQsV0FBVyxFQUFFLFdBQVc7RUFDdkIsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztHQUN4RCxRQUFRLG9CQUFDLFdBQVcsRUFBQSxDQUFBLENBQUMsR0FBQSxFQUFHLENBQUUsQ0FBQyxFQUFDLENBQUMsWUFBQSxFQUFZLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsZUFBZSxFQUFDLENBQUMsT0FBQSxFQUFPLENBQUUsQ0FBRSxDQUFFLENBQUEsQ0FBQztHQUNqRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0VBQ2QsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztHQUN4RCxRQUFRLG9CQUFDLFdBQVcsRUFBQSxDQUFBLENBQUMsR0FBQSxFQUFHLENBQUUsQ0FBQyxFQUFDLENBQUMsWUFBQSxFQUFZLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsZUFBZSxFQUFDLENBQUMsT0FBQSxFQUFPLENBQUUsQ0FBRSxDQUFFLENBQUEsQ0FBQztHQUNqRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0VBQ2QsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUU7R0FDN0QsSUFBSSxXQUFXO0lBQ2Qsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxzQkFBdUIsQ0FBQSxFQUFBO0tBQzdCLENBQUMsRUFBQztLQUNGLENBQUU7SUFDRSxDQUFBLENBQUMsQ0FBQztHQUNULE1BQU07R0FDTixJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7R0FDekcsSUFBSSxnQkFBZ0IsR0FBRyxjQUFjLEdBQUcsQ0FBQyxHQUFHLFVBQVUsR0FBRyxTQUFTLENBQUM7R0FDbkUsSUFBSSxXQUFXLElBQUksb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxhQUFBLEVBQWEsQ0FBQyxPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBRyxDQUFBLEVBQUEsa0JBQUEsRUFBZ0Isb0JBQUEsR0FBRSxFQUFBLElBQUMsRUFBQyxjQUFtQixDQUFBLEVBQUEsR0FBQSxFQUFFLGdCQUFnQixFQUFDLHVCQUEyQixDQUFBLENBQUM7R0FDM0w7RUFDRCxJQUFJLFFBQVE7SUFDVixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGFBQUEsRUFBYSxDQUFDLEVBQUEsRUFBRSxDQUFDLGlCQUFrQixDQUFBLEVBQUE7SUFDbEQsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQSxrQkFBcUIsQ0FBQSxFQUFBO0lBQ3hCLFdBQVk7R0FDUixDQUFBLENBQUMsQ0FBQztFQUNULE9BQU8sUUFBUSxDQUFDO0FBQ2xCLEVBQUU7O0NBRUQsZUFBZSxFQUFFLFdBQVc7RUFDM0IsT0FBTztHQUNOLGFBQWEsRUFBRSxDQUFDO0dBQ2hCLENBQUM7QUFDSixFQUFFOztDQUVELGVBQWUsRUFBRSxTQUFTLEVBQUUsRUFBRTtFQUM3QixRQUFRLFdBQVc7R0FDbEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0dBQ25DLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ2hCLEVBQUU7QUFDRjs7QUFFQSxDQUFDLENBQUMsQ0FBQzs7O0FDbktILG9DQUFvQyx1QkFBQTtFQUNsQyxlQUFlLEVBQUUsV0FBVztJQUMxQixPQUFPLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ2hDLEdBQUc7O0VBRUQsVUFBVSxFQUFFLFNBQVMsU0FBUyxFQUFFO01BQzVCLFFBQVEsU0FBUyxLQUFLLEVBQUU7T0FDdkIsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhO0FBQzdDLFdBQVcsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDOztPQUU3QixJQUFJLFNBQVMsR0FBRyxPQUFPLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQztPQUN4RCxJQUFJLFNBQVMsSUFBSSxDQUFDLElBQUksU0FBUyxHQUFHLEtBQUssRUFBRTtRQUN4QyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO1FBQ2pDO0tBQ0gsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDbEIsR0FBRztBQUNIOztDQUVDLE1BQU0sRUFBRSxXQUFXO0tBQ2YsSUFBSSxPQUFPLEdBQUcsRUFBRSxFQUFFLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUM7S0FDL0UsSUFBSSxLQUFLLElBQUksQ0FBQyxFQUFFLEVBQUUsT0FBTyxJQUFJLENBQUMsRUFBRTtLQUNoQyxJQUFJLEtBQUssR0FBRyxPQUFPLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO0tBQ3BDLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztLQUN2QyxLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO09BQ2xDLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxJQUFJLENBQUMsR0FBRyxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBQzdELE9BQU8sQ0FBQyxJQUFJO1VBQ1Ysb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxHQUFBLEVBQUcsQ0FBRSxDQUFDLEVBQUMsQ0FBQyxTQUFBLEVBQVMsQ0FBRSxXQUFXLEdBQUcsU0FBUyxFQUFDLENBQUMsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFHLENBQUEsRUFBQTtnQkFDMUUsQ0FBQyxHQUFHLENBQUU7VUFDUixDQUFBLENBQUMsQ0FBQztLQUNaO0VBQ0g7R0FDQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGdCQUFpQixDQUFBLEVBQUE7SUFDL0Isb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQywrQ0FBQSxFQUErQyxDQUFDLE9BQUEsRUFBTyxDQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUcsQ0FBQSxFQUFBO0tBQzVGLG9CQUFBLEdBQUUsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsaUVBQWlFLENBQUEsQ0FBRyxDQUFBO0lBQzVFLENBQUEsRUFBQTtJQUNOLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsb0JBQUEsRUFBb0IsQ0FBQyxPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQU0sQ0FBQSxFQUFBO0tBQzdELG9CQUFBLEdBQUUsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsMERBQTBELENBQUEsQ0FBRyxDQUFBO0lBQ3JFLENBQUEsRUFBQTtJQUNOLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsV0FBWSxDQUFBLEVBQUE7S0FDeEIsT0FBUTtJQUNMLENBQUEsRUFBQTtJQUNMLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsb0JBQUEsRUFBb0IsQ0FBQyxPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQU0sQ0FBQSxFQUFBO0tBQzdELG9CQUFBLEdBQUUsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsMkRBQTJELENBQUEsQ0FBRyxDQUFBO0lBQ3RFLENBQUEsRUFBQTtJQUNOLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsK0NBQUEsRUFBK0MsQ0FBQyxPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBRyxDQUFBLEVBQUE7S0FDM0Ysb0JBQUEsR0FBRSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxrRUFBa0UsQ0FBQSxDQUFHLENBQUE7SUFDN0UsQ0FBQTtHQUNELENBQUE7SUFDTDtFQUNGO0NBQ0QsQ0FBQzs7O0FDbERGLG9DQUFvQyx1QkFBQTtFQUNsQyxlQUFlLEVBQUUsV0FBVztJQUMxQixJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDdkMsT0FBTyxDQUFDLGVBQWUsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0dBQ3ZEO0VBQ0QsYUFBYSxFQUFFLFdBQVc7SUFDeEIsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzlDLE9BQU8sT0FBTyxDQUFDO0FBQ25CLEdBQUc7O0VBRUQsVUFBVSxFQUFFLFNBQVMsU0FBUyxFQUFFO01BQzVCLFFBQVEsU0FBUyxLQUFLLEVBQUU7T0FDdkIsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhO0FBQzdDLFdBQVcsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDOztPQUU3QixJQUFJLFNBQVMsR0FBRyxPQUFPLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7T0FDbEcsSUFBSSxTQUFTLElBQUksQ0FBQyxJQUFJLFNBQVMsR0FBRyxLQUFLLEVBQUU7UUFDeEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztRQUNqQztLQUNILENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ2xCLEdBQUc7O0VBRUQsTUFBTSxFQUFFLFdBQVc7SUFDakIsSUFBSSxPQUFPLEdBQUcsRUFBRSxFQUFFLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUM7SUFDL0UsSUFBSSxLQUFLLElBQUksQ0FBQyxFQUFFLEVBQUUsT0FBTyxJQUFJLENBQUMsRUFBRTtJQUNoQyxJQUFJLEtBQUssR0FBRyxPQUFPLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDekQsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDNUQsS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTtNQUNsQyxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsSUFBSSxDQUFDLEdBQUcsUUFBUSxHQUFHLEVBQUUsQ0FBQztNQUM5RCxPQUFPLENBQUMsSUFBSTtRQUNWLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsR0FBQSxFQUFHLENBQUUsQ0FBQyxFQUFDLENBQUMsU0FBQSxFQUFTLENBQUUsU0FBVyxDQUFBLEVBQUE7Y0FDNUIsb0JBQUEsR0FBRSxFQUFBLENBQUEsQ0FBQyxPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUcsQ0FBQSxFQUFDLENBQUMsR0FBRyxDQUFNLENBQUE7UUFDaEQsQ0FBQSxDQUFDLENBQUM7S0FDVjtJQUNELElBQUksV0FBVztNQUNiLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsYUFBQSxFQUFhLENBQUMsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBRyxDQUFBLEVBQUE7UUFDeEQsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxnQkFBaUIsQ0FBQSxFQUFBO1VBQzlCLG9CQUFBLE1BQUssRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMseUJBQTBCLENBQU8sQ0FBQTtRQUM3QyxDQUFBO01BQ0gsQ0FBQTtLQUNOLENBQUM7SUFDRixJQUFJLFdBQVc7TUFDYixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGFBQUEsRUFBYSxDQUFDLE9BQUEsRUFBTyxDQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFHLENBQUEsRUFBQTtRQUN2RCxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGdCQUFpQixDQUFBLEVBQUE7VUFDOUIsb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQywwQkFBMkIsQ0FBTyxDQUFBO1FBQzlDLENBQUE7TUFDSCxDQUFBO0tBQ04sQ0FBQztJQUNGLElBQUksS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxFQUFFO01BQ3hDLFdBQVcsR0FBRyxJQUFJLENBQUM7TUFDbkIsV0FBVyxHQUFHLElBQUksQ0FBQztBQUN6QixLQUFLOztJQUVEO1FBQ0ksb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQywrQkFBZ0MsQ0FBQSxFQUFBO1VBQzdDLG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUE7WUFDRCxXQUFXLEVBQUM7WUFDYixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO2NBQ3ZCLG9CQUFBLEdBQUUsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsK0JBQUEsRUFBK0I7Z0JBQzFDLE9BQUEsRUFBTyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBTSxDQUFJLENBQUE7QUFDOUMsWUFBaUIsQ0FBQSxFQUFBOztBQUVqQixZQUFhLE9BQU8sRUFBQzs7WUFFVCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLE1BQU8sQ0FBQSxFQUFBO2NBQ25CLG9CQUFBLEdBQUUsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsZ0NBQUEsRUFBZ0M7Z0JBQzNDLE9BQUEsRUFBTyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBTSxDQUFJLENBQUE7WUFDN0IsQ0FBQSxFQUFBO1lBQ0osV0FBWTtVQUNWLENBQUE7UUFDRCxDQUFBO01BQ1I7QUFDTixHQUFHOztFQUVELGlCQUFpQixFQUFFLFdBQVc7SUFDNUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxXQUFXO01BQzFCLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUNwRCxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLEdBQUc7QUFDSDs7Q0FFQyxDQUFDOzs7QUNqRkYsSUFBSSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztBQUNqRSxJQUFJLGNBQWMsR0FBRyxPQUFPLENBQUMsK0JBQStCLENBQUMsQ0FBQzs7QUFFOUQsSUFBSSxzQ0FBc0MsZ0NBQUE7QUFDMUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDOztFQUV4QyxNQUFNLEVBQUUsV0FBVztJQUNqQixJQUFJLFlBQVksR0FBRyxhQUFhLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUM7SUFDeEQ7TUFDRSxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGlCQUFrQixDQUFBLEVBQUE7UUFDL0Isb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxpQkFBa0IsQ0FBQSxFQUFBO1VBQy9CLG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUEsR0FBQSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFDLEdBQU0sQ0FBQTtRQUN4QixDQUFBLEVBQUE7UUFDTixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFBLEVBQUE7VUFDakMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxRQUFTLENBQUEsRUFBQTtZQUN0QixvQkFBQSxPQUFNLEVBQUEsQ0FBQSxDQUFDLEdBQUEsRUFBRyxDQUFDLGVBQUEsRUFBZSxDQUFDLEVBQUEsRUFBRSxDQUFFLFlBQVksRUFBQzttQkFDckMsU0FBQSxFQUFTLENBQUUsOEJBQThCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUM7bUJBQzVELElBQUEsRUFBSSxDQUFDLFVBQUEsRUFBVTttQkFDZixPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFDO21CQUNqRCxPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsZ0JBQWlCLENBQUUsQ0FBQSxFQUFBO1lBQ3hDLG9CQUFBLE9BQU0sRUFBQSxDQUFBLENBQUMsT0FBQSxFQUFPLENBQUUsWUFBYyxDQUFRLENBQUE7VUFDbEMsQ0FBQTtRQUNGLENBQUE7TUFDRixDQUFBO01BQ047QUFDTixHQUFHOztFQUVELGdCQUFnQixFQUFFLFdBQVc7SUFDM0IsSUFBSSxTQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3pELGdCQUFnQixDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0dBQ2hFO0FBQ0gsQ0FBQyxDQUFDLENBQUM7O0FBRUgsb0NBQW9DLHVCQUFBO0FBQ3BDLEVBQUUsaUJBQWlCLEVBQUUsQ0FBQzs7RUFFcEIsTUFBTSxFQUFFLFdBQVc7SUFDakI7TUFDRSxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLGdCQUFBLEVBQWdCLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7UUFDNUMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxpQkFBaUIsQ0FBRSxDQUFBLEVBQUE7VUFDaEMsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxnQkFBQSxFQUFnQixDQUFDLEVBQUEsRUFBRSxDQUFDLE1BQU8sQ0FBQSxFQUFBO1lBQ3ZDLG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUE7Y0FDRixvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO2dCQUNGLG9CQUFDLGdCQUFnQixFQUFBLENBQUEsQ0FBQyxJQUFBLEVBQUksQ0FBQyxxQkFBQSxFQUFxQjtrQ0FDMUIsSUFBQSxFQUFJLENBQUMsbUJBQUEsRUFBbUI7a0NBQ3hCLFNBQUEsRUFBUyxDQUFFLElBQUksQ0FBQyxrQkFBa0IsRUFBRyxDQUFBLENBQUcsQ0FBQSxFQUFBO2dCQUMxRCxvQkFBQyxnQkFBZ0IsRUFBQSxDQUFBLENBQUMsSUFBQSxFQUFJLENBQUMsb0JBQUEsRUFBb0I7a0NBQ3pCLElBQUEsRUFBSSxDQUFDLGtCQUFBLEVBQWtCO2tDQUN2QixTQUFBLEVBQVMsQ0FBRSxJQUFJLENBQUMsa0JBQWtCLEVBQUcsQ0FBQSxDQUFHLENBQUEsRUFBQTtnQkFDMUQsb0JBQUMsZ0JBQWdCLEVBQUEsQ0FBQSxDQUFDLElBQUEsRUFBSSxDQUFDLGlCQUFBLEVBQWlCO2tDQUN0QixJQUFBLEVBQUksQ0FBQyxvQkFBQSxFQUFvQjtrQ0FDekIsU0FBQSxFQUFTLENBQUUsSUFBSSxDQUFDLGtCQUFrQixFQUFHLENBQUEsQ0FBRyxDQUFBO2NBQ3ZELENBQUE7WUFDRixDQUFBO1VBQ0YsQ0FBQTtRQUNELENBQUE7TUFDRixDQUFBO01BQ047QUFDTixHQUFHOztFQUVELGtCQUFrQixFQUFFLFdBQVc7SUFDN0IsSUFBSSxDQUFDLGlCQUFpQixJQUFJLENBQUM7SUFDM0IsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUM7QUFDbEMsR0FBRzs7Q0FFRixDQUFDLENBQUM7OztBQ2pFSCxJQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDMUMsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ3ZDLElBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQzlDLElBQUksVUFBVSxHQUFHLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0FBQ3BELElBQUksY0FBYyxHQUFHLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO0FBQzlELElBQUksY0FBYyxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0FBQ3pELElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUNwQyxJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUM1QyxJQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7O0FBRTFDLG9DQUFvQyx1QkFBQTtFQUNsQyxNQUFNLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDdEUsRUFBRSxpQkFBaUIsRUFBRSxTQUFTO0FBQzlCOztFQUVFLE1BQU0sRUFBRSxXQUFXO0lBQ2pCLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUNsQyxJQUFJLE1BQU0sR0FBRyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLEdBQUcsSUFBSTtTQUNsRSxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFNBQVUsQ0FBQSxFQUFBO1lBQ3RCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsT0FBUSxDQUFNLENBQUEsRUFBQTtZQUM3QixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLE9BQVEsQ0FBTSxDQUFBLEVBQUE7WUFDN0Isb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxPQUFRLENBQU0sQ0FBQSxFQUFBO1lBQzdCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsT0FBUSxDQUFNLENBQUEsRUFBQTtZQUM3QixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLE9BQVEsQ0FBTSxDQUFBO1FBQzNCLENBQUEsQ0FBQyxDQUFDO0lBQ1osSUFBSSxlQUFlO01BQ2pCLG9CQUFDLFdBQVcsRUFBQSxDQUFBLENBQUMsTUFBQSxFQUFNLENBQUMsdUJBQUEsRUFBdUI7bUJBQzlCLEdBQUEsRUFBRyxDQUFDLFFBQUEsRUFBUTttQkFDWixHQUFBLEVBQUcsQ0FBQyxjQUFBLEVBQWM7bUJBQ2xCLGFBQUEsRUFBYSxDQUFFLEtBQUssRUFBQzttQkFDckIsTUFBQSxFQUFNLENBQUUsQ0FBQyxlQUFlLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsRUFBQztBQUN2RSxtQkFBbUIsT0FBQSxFQUFPLENBQUUsb0JBQUMsVUFBVSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBRSxJQUFJLENBQUMsU0FBVSxDQUFFLENBQUEsQ0FBRSxDQUFFLENBQUEsQ0FBQyxDQUFDOztJQUV0RTtNQUNFLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMsTUFBTyxDQUFBLEVBQUE7UUFDWixNQUFNLEVBQUM7UUFDUixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLGlCQUFrQixDQUFNLENBQUEsRUFBQTtRQUNoQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLHVCQUF3QixDQUFBLEVBQUE7VUFDOUIsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxpQkFBa0IsQ0FBQSxFQUFBLGFBQWlCLENBQUEsRUFBQTtVQUMzQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLGlCQUFBLEVBQWlCLENBQUMsR0FBQSxFQUFHLENBQUMseUJBQXlCLENBQUUsQ0FBQSxFQUFBO1VBQ3pELG9CQUFDLFVBQVUsRUFBQSxDQUFBLENBQUMsV0FBQSxFQUFXLENBQUUsSUFBSSxDQUFDLGlCQUFrQixDQUFFLENBQUE7UUFDOUMsQ0FBQSxFQUFBO1FBQ04sb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsZUFBaUIsQ0FBQSxFQUFBO1VBQy9DLG9CQUFBLE1BQUssRUFBQSxJQUFRLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBUSxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQVEsQ0FBQTtRQUNuQyxDQUFBLEVBQUE7UUFDTixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLGlCQUFrQixDQUFBLEVBQUE7VUFDeEIsb0JBQUMsS0FBSyxFQUFBLENBQUEsQ0FBQyxZQUFBLEVBQVksQ0FBRSxJQUFJLEVBQUMsQ0FBQyxHQUFBLEVBQUcsQ0FBQyxjQUFBLEVBQWMsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxjQUFlLENBQUEsRUFBQTtjQUNuRSxvQkFBQyxZQUFZLEVBQUEsQ0FBQSxDQUFDLE1BQUEsRUFBTSxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFDOzRCQUMxQixtQkFBQSxFQUFtQixDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEVBQUM7NEJBQ3BELElBQUEsRUFBSSxDQUFFLElBQUksQ0FBQyxlQUFnQixDQUFBLENBQUcsQ0FBQTtVQUN4QyxDQUFBO1FBQ0osQ0FBQSxFQUFBO1FBQ04sb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxvQkFBcUIsQ0FBQSxFQUFBO1VBQ2xDLG9CQUFDLE9BQU8sRUFBQSxDQUFBLENBQUMsV0FBQSxFQUFXLENBQUUsSUFBSSxDQUFDLGlCQUFrQixDQUFFLENBQUEsRUFBQTtVQUMvQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGVBQWdCLENBQUEsRUFBQTtZQUM3QixvQkFBQyxTQUFTLEVBQUEsQ0FBQSxDQUFDLFdBQUEsRUFBVyxDQUFFLElBQUksQ0FBQyxpQkFBa0IsQ0FBQSxDQUFHLENBQUE7VUFDOUMsQ0FBQTtRQUNGLENBQUEsRUFBQTtRQUNMLGVBQWdCO01BQ2IsQ0FBQTtNQUNOO0FBQ04sR0FBRzs7RUFFRCxpQkFBaUIsRUFBRSxXQUFXO0lBQzVCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksRUFBRSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLElBQUksRUFBRTtNQUN0RCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7S0FDeEI7QUFDTCxHQUFHOztFQUVELGtCQUFrQixFQUFFLFdBQVc7SUFDN0IsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxFQUFFLEVBQUU7TUFDM0IsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO0tBQ3hCO0FBQ0wsR0FBRzs7RUFFRCxpQkFBaUIsRUFBRSxTQUFTLFNBQVMsRUFBRTtJQUNyQyxPQUFPLFdBQVc7UUFDZCxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ25DLGNBQWMsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDOUQsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakIsR0FBRzs7RUFFRCxlQUFlLEVBQUUsV0FBVztJQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3JDLEdBQUc7O0VBRUQsZUFBZSxFQUFFLFdBQVc7TUFDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7R0FDakM7RUFDRCxlQUFlLEVBQUUsV0FBVztNQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNwQyxHQUFHOztFQUVELGVBQWUsRUFBRSxVQUFVO0lBQ3pCLElBQUksSUFBSSxDQUFDLGlCQUFpQixJQUFJLFNBQVMsRUFBRTtNQUN2QyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7TUFDOUIsSUFBSSxLQUFLLEdBQUcsR0FBRyxFQUFFO1FBQ2YsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDekIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLE1BQU0sQ0FBQztPQUNqQyxNQUFNO1FBQ0wsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxRQUFRLENBQUM7T0FDbkM7S0FDRjtJQUNELElBQUksSUFBSSxDQUFDLGlCQUFpQixJQUFJLFFBQVEsRUFBRTtNQUN0QyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7TUFDdkIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLE1BQU0sQ0FBQztLQUNqQyxNQUFNO01BQ0wsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7TUFDekIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFFBQVEsQ0FBQztLQUNuQztBQUNMLEdBQUc7O0VBRUQsZUFBZSxFQUFFLFdBQVc7SUFDMUIsQ0FBQyxDQUFDLGlDQUFpQyxDQUFDLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN0RixHQUFHOztFQUVELGlCQUFpQixFQUFFLFdBQVc7SUFDNUIsQ0FBQyxDQUFDLGlDQUFpQyxDQUFDLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN0RixHQUFHOztDQUVGLENBQUMsQ0FBQzs7O0FDekhILGdCQUFnQixHQUFHLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDOztBQUUxRCxvQ0FBb0MsdUJBQUE7O0NBRW5DLE1BQU0sRUFBRSxXQUFXO0VBQ2xCO0dBQ0Msb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxhQUFjLENBQUEsRUFBQTtJQUM1QixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLDBCQUFBLEVBQTBCO0tBQ3hDLE9BQUEsRUFBTyxDQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFHLENBQUEsRUFBQTtLQUNoQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEdBQUEsRUFBRyxDQUFDLHVDQUFBLEVBQXVDO01BQy9DLFNBQUEsRUFBUyxDQUFDLGFBQWEsQ0FBRSxDQUFBO0lBQ3JCLENBQUEsRUFBQTtJQUNOLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsMkJBQUEsRUFBMkI7S0FDekMsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUcsQ0FBQSxFQUFBO0tBQ2pDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsR0FBQSxFQUFHLENBQUMsd0NBQUEsRUFBd0M7TUFDaEQsU0FBQSxFQUFTLENBQUMsYUFBYSxDQUFFLENBQUE7SUFDckIsQ0FBQTtHQUNELENBQUEsRUFBRTtBQUNYLEVBQUU7O0NBRUQsU0FBUyxFQUFFLFNBQVMsVUFBVSxFQUFFO0VBQy9CLFFBQVEsV0FBVztHQUNsQixnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7R0FDdkMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDaEIsRUFBRTs7QUFFRixDQUFDLENBQUMsQ0FBQzs7O0FDMUJILElBQUksZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7QUFDakUsSUFBSSxjQUFjLEdBQUcsT0FBTyxDQUFDLCtCQUErQixDQUFDLENBQUM7O0FBRTlELElBQUksa0NBQWtDLDRCQUFBO0VBQ3BDLE1BQU0sRUFBRSxXQUFXO0lBQ2pCLElBQUksUUFBUSxHQUFHLGVBQWUsRUFBRSxVQUFVLEdBQUcsVUFBVSxDQUFDO0lBQ3hELElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUU7TUFDeEIsUUFBUSxJQUFJLFlBQVksQ0FBQztNQUN6QixVQUFVLEdBQUcsV0FBVyxDQUFDO0tBQzFCO0lBQ0Q7TUFDRSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFFLFFBQVEsRUFBQyxDQUFDLFdBQUEsRUFBVyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFHLENBQUEsRUFBQTtRQUMzRSxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGNBQWUsQ0FBQSxFQUFBO1VBQzVCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsV0FBWSxDQUFBLEVBQUE7WUFDdkIsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFLO1VBQ2QsQ0FBQSxFQUFBO1VBQ0osSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFLO1FBQ2IsQ0FBQSxFQUFBO1FBQ04sb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBRSx1QkFBdUIsR0FBRyxVQUFVLEVBQUM7VUFDcEQsV0FBQSxFQUFXLENBQUUsSUFBSSxDQUFDLFlBQWMsQ0FBQTtRQUMzQixDQUFBO01BQ0osQ0FBQTtNQUNMO0FBQ04sR0FBRzs7RUFFRCxZQUFZLEVBQUUsU0FBUyxDQUFDLEVBQUU7SUFDeEIsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUM7SUFDcEMsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDckYsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQ25CLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUN4QixHQUFHOztBQUVILENBQUMsQ0FBQyxDQUFDOztBQUVILG9DQUFvQyx1QkFBQTtBQUNwQyxFQUFFLE1BQU0sRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7O0VBRXhDLGVBQWUsRUFBRSxXQUFXO0lBQzFCLE9BQU87TUFDTCxPQUFPLENBQUMsRUFBRTtNQUNWLE9BQU8sRUFBRSxFQUFFO01BQ1gsT0FBTyxFQUFFLEtBQUs7S0FDZixDQUFDO0FBQ04sR0FBRzs7RUFFRCxtQkFBbUIsRUFBRSxTQUFTLFNBQVMsRUFBRSxTQUFTLEVBQUU7SUFDbEQsSUFBSSxTQUFTLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFO01BQ3pDLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3hDLEtBQUs7O0dBRUY7RUFDRCxVQUFVLEVBQUUsU0FBUyxNQUFNLEVBQUU7SUFDM0IsZ0JBQWdCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztJQUNyQyxDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsR0FBRyxNQUFNLEdBQUcsR0FBRyxHQUFHLFNBQVM7UUFDeEMsRUFBRTtRQUNGLFNBQVMsUUFBUSxFQUFFO1VBQ2pCLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUM3QyxVQUFVLGdCQUFnQixDQUFDLHFCQUFxQixFQUFFLENBQUM7O1NBRTFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztLQUNmLENBQUM7QUFDTixHQUFHOztFQUVELE1BQU0sRUFBRSxXQUFXO0lBQ2pCLElBQUksa0JBQWtCLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7SUFDMUQ7TUFDRSxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLFlBQWEsQ0FBQSxFQUFBO1FBQ25CLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsZUFBZ0IsQ0FBQSxFQUFBO1VBQzdCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsZUFBZ0IsQ0FBQSxFQUFBO1lBQzdCLG9CQUFBLE9BQU0sRUFBQSxDQUFBO2NBQ0osSUFBQSxFQUFJLENBQUMsTUFBQSxFQUFNO2NBQ1gsV0FBQSxFQUFXLENBQUMsNENBQUEsRUFBNEM7Y0FDeEQsRUFBQSxFQUFFLENBQUMsY0FBQSxFQUFjO2NBQ2pCLEdBQUEsRUFBRyxDQUFDLE9BQUEsRUFBTztjQUNYLE9BQUEsRUFBTyxDQUFFLElBQUksQ0FBQyxLQUFLLEVBQUMsQ0FBQyxNQUFBLEVBQU0sQ0FBRSxJQUFJLENBQUMsSUFBSSxFQUFDO2NBQ3ZDLE9BQUEsRUFBTyxDQUFFLElBQUksQ0FBQyxZQUFhLENBQUUsQ0FBQTtZQUN6QixDQUFBLEVBQUE7VUFDUixvQkFBQSxRQUFPLEVBQUEsQ0FBQSxDQUFDLGFBQUEsRUFBVyxDQUFDLFVBQUEsRUFBVSxDQUFDLGFBQUEsRUFBVyxDQUFDLGlCQUFBLEVBQWlCLENBQUMsRUFBQSxFQUFFLENBQUMsVUFBVyxDQUFBLEVBQUE7WUFDekUsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxTQUFVLENBQUEsRUFBQTtjQUNoQixvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBO2dCQUNKLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsS0FBTSxDQUFNLENBQUE7Y0FDdEIsQ0FBQSxFQUFBO2NBQ1Asb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQTtnQkFDSixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLEtBQU0sQ0FBTSxDQUFBO2NBQ3RCLENBQUEsRUFBQTtjQUNQLG9CQUFBLE1BQUssRUFBQSxJQUFDLEVBQUE7Z0JBQ0osb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxLQUFNLENBQU0sQ0FBQTtjQUN0QixDQUFBO1lBQ0gsQ0FBQTtVQUNDLENBQUEsRUFBQTtVQUNSLGtCQUFtQjtRQUNoQixDQUFBO01BQ0YsQ0FBQTtNQUNOO0FBQ04sR0FBRzs7RUFFRCx5QkFBeUIsRUFBRSxXQUFXO0lBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQztJQUN6RSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDVixJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUU7TUFDdEQsQ0FBQyxFQUFFLENBQUM7TUFDSixJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUM7TUFDN0Q7UUFDRSxvQkFBQyxZQUFZLEVBQUEsZ0JBQUEsR0FBQSxDQUFFLEdBQUcsQ0FBQyxFQUFDLENBQUMsQ0FBQSxHQUFBLEVBQUcsQ0FBRSxDQUFDLEVBQUMsQ0FBQyxTQUFBLEVBQVMsQ0FBRSxTQUFTLEVBQUMsQ0FBQyxXQUFBLEVBQVcsQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVksQ0FBQSxDQUFFLENBQUE7UUFDekY7S0FDSCxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ2Q7TUFDRSxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLDBCQUEyQixDQUFBLEVBQUE7UUFDakMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxVQUFXLENBQUEsRUFBQTtZQUN0QixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLGdCQUFpQixDQUFBLEVBQUE7Y0FDckIsY0FBZTtZQUNiLENBQUE7VUFDRCxDQUFBO01BQ0osQ0FBQTtNQUNOO0FBQ04sR0FBRzs7RUFFRCxLQUFLLEVBQUUsV0FBVztJQUNoQixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDbkMsR0FBRzs7RUFFRCxJQUFJLEVBQUUsV0FBVztJQUNmLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUNwQyxHQUFHOztFQUVELFlBQVksRUFBRSxTQUFTLEtBQUssRUFBRTtJQUM1QixJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUM3QyxJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUMsTUFBTSxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDdkMsR0FBRzs7RUFFRCxhQUFhLEVBQUUsU0FBUyxNQUFNLENBQUMsS0FBSyxFQUFFO01BQ2xDLE1BQU0sR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBRTtVQUN4QyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7WUFDMUIsT0FBTyxJQUFJLENBQUM7V0FDYixNQUFNO1lBQ0wsT0FBTyxLQUFLLENBQUM7V0FDZDtPQUNKLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7TUFDZCxPQUFPLE1BQU0sQ0FBQztBQUNwQixHQUFHOztFQUVELGFBQWEsRUFBRSxTQUFTLEtBQUssRUFBRTtJQUM3QixJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUN0RCxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ1osSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFO01BQ2xELFFBQVEsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssQ0FBQzthQUMvQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsU0FBUyxDQUFDO2FBQ2xELENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUM1QyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDNUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7S0FDbEQsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxPQUFPLENBQUM7QUFDbkIsR0FBRztBQUNIO0FBQ0E7O0NBRUMsQ0FBQyxDQUFDOzs7QUM3SkgsSUFBSSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztBQUNqRSxJQUFJLGNBQWMsR0FBRyxPQUFPLENBQUMsK0JBQStCLENBQUMsQ0FBQztBQUM5RDs7QUFFQSxJQUFJLGFBQWEsR0FBRztJQUNoQixHQUFHLEdBQUcsR0FBRztJQUNULEdBQUcsR0FBRyxHQUFHO0lBQ1QsR0FBRyxHQUFHLEdBQUc7SUFDVCxHQUFHLEVBQUUsSUFBSTtJQUNULEdBQUcsR0FBRyxHQUFHO0lBQ1QsR0FBRyxFQUFFLElBQUk7SUFDVCxHQUFHLEVBQUUsR0FBRztBQUNaLENBQUMsQ0FBQzs7QUFFRixvQ0FBb0MsdUJBQUE7SUFDaEMsTUFBTSxFQUFFLFdBQVc7UUFDZixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztRQUMzQyxJQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlDLElBQUksZ0JBQWdCO1lBQ2hCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsV0FBWSxDQUFBLEVBQUE7Z0JBQ3ZCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsYUFBYyxDQUFBLEVBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQXNCLENBQUEsRUFBQTtnQkFDM0Qsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxPQUFRLENBQUEsRUFBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBa0IsQ0FBQTtZQUMvQyxDQUFBO1NBQ1QsQ0FBQztRQUNGO1lBQ0ksb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxpQkFBa0IsQ0FBQSxFQUFBO2dCQUM1QixnQkFBZ0IsRUFBQztnQkFDakIsYUFBYztZQUNiLENBQUEsRUFBRTtBQUNwQixLQUFLOztJQUVELHlCQUF5QixFQUFFLFdBQVc7UUFDbEMsVUFBVSxHQUFHLEVBQUU7UUFDZixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3JELElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxDQUFDLGVBQWUsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRTtnQkFDekMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUN0QjtTQUNKO1FBQ0QsT0FBTyxVQUFVLENBQUM7QUFDMUIsS0FBSzs7SUFFRCxlQUFlLEVBQUUsU0FBUyxHQUFHLEVBQUU7UUFDM0IsSUFBSSxXQUFXLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRTtZQUNsQyxRQUFRLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsR0FBQSxFQUFHLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUMsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxVQUFBLEVBQVUsQ0FBQyxHQUFBLEVBQUcsQ0FBRSxDQUFDLENBQUMsRUFBSSxDQUFBLEVBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLFVBQVUsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLFFBQWUsQ0FBQSxFQUFFO1NBQ3BJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDZCxTQUFTLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsR0FBQSxFQUFHLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUMsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxjQUFlLENBQUEsRUFBQTtnQkFDbkQsV0FBWTtZQUNYLENBQUEsRUFBRTtLQUNmO0NBQ0osQ0FBQyxDQUFDOzs7QUNsREgsSUFBSSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztBQUNqRSxJQUFJLGNBQWMsR0FBRyxPQUFPLENBQUMsK0JBQStCLENBQUMsQ0FBQztBQUM5RCxJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUM1QyxJQUFJLFlBQVksR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUM7O0FBRTdDLElBQUksZ0NBQWdDLDBCQUFBO0VBQ2xDLE1BQU0sRUFBRSxXQUFXO0lBQ2pCLElBQUksTUFBTSxDQUFDLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2hGO01BQ0Usb0JBQUEsS0FBSSxFQUFBLENBQUE7UUFDRixPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxFQUFDO1FBQy9DLEtBQUEsRUFBSyxDQUFFLE1BQU0sRUFBQztRQUNkLFlBQUEsRUFBWSxDQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFBQztRQUNyQyxZQUFBLEVBQVksQ0FBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUM7QUFDL0MsUUFBUSxTQUFBLEVBQVMsQ0FBRSxtREFBbUQsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUksQ0FBQSxFQUFBOztBQUV4RixRQUFRLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsWUFBYSxDQUFBLEVBQUE7O1VBRTFCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsd0JBQXlCLENBQUEsRUFBQTtZQUN0QyxvQkFBQSxHQUFFLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLHNDQUFBLEVBQXNDLENBQUMsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLFlBQWMsQ0FBSSxDQUFBLEVBQUE7WUFDbkYsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFLO1VBQ2IsQ0FBQTtRQUNGLENBQUE7TUFDRixDQUFBO01BQ047QUFDTixHQUFHOztFQUVELGlCQUFpQixFQUFFLFdBQVc7R0FDN0I7RUFDRCxpQkFBaUIsRUFBRSxXQUFXO01BQzFCLElBQUksQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0dBQzlEO0VBQ0QsbUJBQW1CLEVBQUUsV0FBVztNQUM1QixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7R0FDekM7RUFDRCxhQUFhLEVBQUUsU0FBUyxNQUFNLEVBQUU7SUFDOUIsQ0FBQyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztPQUN4QixHQUFHLENBQUMsa0JBQWtCLEVBQUUsTUFBTSxDQUFDO09BQy9CLEdBQUcsQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLENBQUM7R0FDaEM7RUFDRCxZQUFZLEVBQUUsU0FBUyxDQUFDLEVBQUU7SUFDeEIsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUN6QyxPQUFPLEVBQUUsRUFBRTtZQUNYLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3pCLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUN4QixHQUFHOztBQUVILENBQUMsQ0FBQyxDQUFDOztBQUVILElBQUksa0NBQWtDLDRCQUFBOztBQUV0QyxFQUFFLE1BQU0sRUFBRSxXQUFXOztJQUVqQixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7TUFDcEMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLE1BQU0sRUFBRTtBQUN4RSxRQUFRLElBQUksTUFBTSxJQUFJLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQzs7UUFFNUMsT0FBTyxvQkFBQyxVQUFVLEVBQUEsZ0JBQUEsR0FBQSxDQUFFLEdBQUcsTUFBTSxFQUFDLENBQUMsQ0FBQSxXQUFBLEVBQVcsQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBQyxDQUFDLEdBQUEsRUFBRyxDQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUMsQ0FBQyxNQUFBLEVBQU0sQ0FBRSxNQUFPLENBQUEsQ0FBRSxDQUFBO09BQ3hHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7S0FDZixNQUFNO01BQ0wsS0FBSyxHQUFHLElBQUksQ0FBQztLQUNkO0lBQ0QsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDNUUsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO0lBQ25CLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQztJQUNuQixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUc7TUFDcEYsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxFQUFFO1VBQ3BELEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEVBQUU7WUFDckUsVUFBVSxFQUFFLENBQUM7WUFDYixVQUFVLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7V0FDeEU7T0FDSjtLQUNGO0lBQ0QsSUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxVQUFVLEdBQUcsQ0FBQztNQUN0RSxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGdCQUFpQixDQUFBLEVBQUE7VUFDNUIsb0JBQUEsR0FBRSxFQUFBLElBQUMsRUFBQSx3QkFBMEIsQ0FBQSxFQUFBO1VBQzdCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsb0JBQXFCLENBQUEsRUFBQTtZQUNsQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLHFCQUFzQixDQUFBLEVBQUE7Y0FDbkMsb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxLQUFBLEVBQUssQ0FBRSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxHQUFHLENBQUMsRUFBQyxDQUFDLFNBQUEsRUFBUyxDQUFDLFFBQVMsQ0FBTyxDQUFBO1lBQ2pGLENBQUE7VUFDRixDQUFBO1FBQ0YsQ0FBQSxJQUFJLElBQUksQ0FBQztJQUNuQjtNQUNFLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsMkJBQTRCLENBQUEsRUFBQTtRQUN6QyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO1VBQ3ZCLEtBQUssRUFBQztVQUNOLGVBQWdCO1FBQ2IsQ0FBQTtNQUNGLENBQUE7S0FDUDtHQUNGO0FBQ0gsQ0FBQyxDQUFDOztBQUVGLElBQUksb0NBQW9DLDhCQUFBO0FBQ3hDLEVBQUUsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQzs7RUFFeEMsTUFBTSxFQUFFLFdBQVc7S0FDaEIsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO01BQ3JDLFNBQVMsR0FBRyxFQUFFO09BQ2IsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEdBQUc7VUFDakYsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzdGLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1dBQ3hGO1FBQ0g7T0FDRCxJQUFJLFdBQVcsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxFQUFFO1VBQzFDLElBQUksRUFBRSxDQUFDLFdBQVcsQ0FBQyxLQUFLLGlCQUFpQixFQUFFO1lBQ3pDLElBQUksR0FBRyxHQUFHLCtCQUErQjtXQUMxQyxNQUFNO1lBQ0wsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQztXQUMxQjtVQUNELElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLGlCQUFpQixFQUFFO1lBQ3BDLElBQUksS0FBSyxHQUFHLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDO1dBQzlCLE1BQU07WUFDTCxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDO1dBQ3hCO1VBQ0Q7WUFDRSxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQUEsRUFBVSxDQUFDLEdBQUEsRUFBRyxDQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUcsQ0FBQSxFQUFBO2dCQUNyQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLE1BQUEsRUFBTSxDQUFDLEtBQUEsRUFBSyxDQUFDLEdBQUEsRUFBRyxDQUFFLEdBQUksQ0FBRSxDQUFBLEVBQUE7Z0JBQzdCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsUUFBUyxDQUFBLEVBQUE7a0JBQ3RCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsWUFBYSxDQUFBLEVBQUMsS0FBVyxDQUFBO2tCQUNqQyxDQUFBLEVBQUE7Z0JBQ1Isb0JBQUEsR0FBRSxFQUFBLENBQUEsQ0FBQyxJQUFBLEVBQUksQ0FBRSxFQUFFLENBQUMsWUFBWSxDQUFDLEVBQUMsQ0FBQyxNQUFBLEVBQU0sQ0FBQyxRQUFTLENBQUEsRUFBQTtrQkFDekMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxHQUFBLEVBQUcsQ0FBQyxxR0FBQSxFQUFxRyxDQUFDLEtBQUEsRUFBSyxDQUFDLEtBQUEsRUFBSyxDQUFDLE1BQUEsRUFBTSxDQUFDLElBQUEsRUFBSSxDQUFDLE1BQUEsRUFBTSxDQUFDLEdBQUcsQ0FBRSxDQUFBO2dCQUNqSixDQUFBO1lBQ0YsQ0FBQSxFQUFFO1FBQ1osQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztLQUNoQixNQUFNO01BQ0wsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDO0tBQ3hCO0lBQ0QsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQ2pCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUU7UUFDdkIsS0FBSyxHQUFHLG9CQUFDLFdBQVcsRUFBQSxDQUFBLENBQUMsTUFBQSxFQUFNLENBQUUsZ0JBQWdCLEVBQUM7bUJBQ25DLE1BQUEsRUFBTSxDQUFFLENBQUMsZUFBZSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEVBQUM7bUJBQ3BELE9BQUEsRUFBTyxDQUFFLElBQUssQ0FBRSxDQUFBO0tBQzlCO0lBQ0QsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDO0lBQ25CLElBQUksV0FBVyxJQUFJLElBQUksRUFBRTtNQUN2QixPQUFPLElBQUksb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxVQUFBLEVBQVUsQ0FBQyxPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsTUFBUSxDQUFBLEVBQUEsb0JBQXdCLENBQUEsQ0FBQztLQUNyRjtJQUNELElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLEdBQUcsSUFBSTtJQUMvRztNQUNFLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsNkJBQThCLENBQUEsRUFBQTtRQUMzQyxvQkFBQyxXQUFXLEVBQUEsQ0FBQSxDQUFDLE1BQUEsRUFBTSxDQUFFLGdCQUFnQixFQUFDO1dBQ25DLEdBQUEsRUFBRyxDQUFDLFVBQUEsRUFBVTtXQUNkLEdBQUEsRUFBRyxDQUFDLEtBQUEsRUFBSztXQUNULE1BQUEsRUFBTSxDQUFFLENBQUMsZUFBZSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEVBQUM7V0FDcEQsYUFBQSxFQUFhLENBQUUsSUFBSSxFQUFDO1dBQ3BCLE9BQUEsRUFBTyxDQUFFLG9CQUFDLFlBQVksRUFBQSxDQUFBLENBQUMsT0FBQSxFQUFPLENBQUUsT0FBUSxDQUFFLENBQUMsQ0FBRSxDQUFBLEVBQUE7UUFDL0MsS0FBSyxFQUFDO1FBQ1Asb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxVQUFXLENBQUEsRUFBQTtVQUN2QixPQUFPLEVBQUM7VUFDUixXQUFZO1FBQ1QsQ0FBQTtNQUNGLENBQUE7S0FDUDtBQUNMLEdBQUc7O0VBRUQsTUFBTSxFQUFFLFdBQVc7SUFDakIsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDM0IsR0FBRzs7QUFFSCxDQUFDLENBQUM7O0FBRUYsb0NBQW9DLHVCQUFBO0VBQ2xDLE1BQU0sRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7RUFDeEMsZUFBZSxFQUFFLFdBQVc7SUFDMUIsT0FBTyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztHQUN0QjtFQUNELE1BQU0sRUFBRSxXQUFXO0FBQ3JCLElBQUk7O01BRUUsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxHQUFBLEVBQUcsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxnQkFBaUIsQ0FBQSxFQUFBO1FBQzVDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsZUFBZ0IsQ0FBQSxFQUFBO1VBQzdCLG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUEsZUFBa0IsQ0FBQTtRQUNsQixDQUFBLEVBQUE7UUFDTixvQkFBQyxZQUFZLEVBQUEsQ0FBQSxDQUFDLFdBQUEsRUFBVyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFDLENBQUMsVUFBQSxFQUFVLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFXLENBQUUsQ0FBQSxFQUFBO1FBQ3ZGLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsZUFBZ0IsQ0FBQSxFQUFBO1VBQzdCLG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUEsZ0JBQW1CLENBQUE7UUFDbkIsQ0FBQSxFQUFBO1FBQ04sb0JBQUMsY0FBYyxFQUFBLElBQUEsQ0FBRyxDQUFBO01BQ2QsQ0FBQTtLQUNQO0dBQ0Y7Q0FDRixDQUFDLENBQUM7OztBQ3ZMSCxvQ0FBb0MsdUJBQUE7Q0FDbkMsZUFBZSxFQUFFLFdBQVc7RUFDM0IsT0FBTyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztFQUN0QjtDQUNELE1BQU0sRUFBRSxXQUFXO0VBQ2xCO0dBQ0Msb0JBQUEsS0FBSSxFQUFBLElBQU8sQ0FBQTtJQUNWO0FBQ0osRUFBRTs7Q0FFRCxNQUFNLEVBQUUsV0FBVztFQUNsQixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFO0dBQ3JCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztHQUNaO09BQ0k7R0FDSixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7R0FDWjtBQUNILEVBQUU7O0NBRUQsSUFBSSxFQUFFLFdBQVc7RUFDaEIsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhO0dBQzFDLG9CQUFBLEdBQUUsRUFBQSxDQUFBLENBQUMsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLElBQUksRUFBQyxDQUFDLFNBQUEsRUFBUyxDQUFDLHNDQUFzQyxDQUFBLENBQUcsQ0FBQSxJQUFJLElBQUk7QUFDckYsRUFBRSxRQUFRLENBQUMsTUFBTTs7R0FFZCxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFFLHVCQUF1QixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBSyxDQUFBLEVBQUE7SUFDekQsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxZQUFBLEVBQVksQ0FBQyxPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsU0FBVyxDQUFNLENBQUEsRUFBQTtJQUNwRCxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGNBQUEsRUFBYyxDQUFDLEtBQUEsRUFBSyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBUSxDQUFBLEVBQUE7S0FDdkQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxxQkFBc0IsQ0FBQSxFQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFDLEdBQUEsRUFBRSxZQUFrQixDQUFBLEVBQUE7S0FDM0Usb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyx3QkFBd0IsQ0FBRSxDQUFBLEVBQUE7S0FDeEMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxzQkFBdUIsQ0FBQSxFQUFBO01BQ3BDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBUTtLQUNmLENBQUE7SUFDRCxDQUFBO0dBQ0QsQ0FBQTtLQUNKLFFBQVEsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUM7R0FDN0MsQ0FBQztFQUNGLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUMvQixFQUFFOztDQUVELFNBQVMsRUFBRSxXQUFXO0VBQ3JCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUU7R0FDN0IsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0dBQ1o7QUFDSCxFQUFFOztDQUVELElBQUksRUFBRSxXQUFXO0VBQ2hCLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUM7RUFDbEQsSUFBSSxTQUFTLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0VBQzVELENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLFdBQVc7U0FDbEMsUUFBUSxDQUFDLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxDQUFDO0dBQ2pELENBQUMsQ0FBQztBQUNMLEVBQUUsSUFBSSxHQUFHLEdBQUcsZUFBZSxDQUFDOztFQUUxQixJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxFQUFFO1lBQ3BCLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUNqRCxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDO2dCQUNYLElBQUksRUFBRSxLQUFLO2FBQ2QsRUFBRSxHQUFHLEVBQUUsQ0FBQztTQUNaLE1BQU07WUFDSCxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDO2dCQUNYLElBQUksRUFBRSxPQUFPO2FBQ2hCLEVBQUUsR0FBRyxFQUFFLENBQUM7U0FDWjtBQUNULEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDOztBQUVoQyxFQUFFO0FBQ0Y7QUFDQTs7Q0FFQyxDQUFDLENBQUM7OztBQ3RFSCxJQUFJLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0FBQ2pFLElBQUksY0FBYyxHQUFHLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO0FBQzlEOztBQUVBLGtEQUFrRDtBQUNsRCxtQkFBbUIsR0FBRztJQUNsQixTQUFTLEdBQUcsU0FBUztJQUNyQixTQUFTLEdBQUcsU0FBUztJQUNyQixTQUFTLEdBQUcsU0FBUztJQUNyQixTQUFTLEdBQUcsU0FBUztJQUNyQixTQUFTLEdBQUcsU0FBUztJQUNyQixTQUFTLEdBQUcsU0FBUztJQUNyQixTQUFTLEdBQUcsU0FBUztJQUNyQixTQUFTLEdBQUcsU0FBUztJQUNyQixTQUFTLEdBQUcsU0FBUztDQUN4QixDQUFDLDRCQUE0QjtBQUM5QixnQkFBZ0IsR0FBRyxFQUFFO0FBQ3JCLHFEQUFxRDtBQUNyRCxJQUFJLGdCQUFnQixHQUFHLEVBQUUsQ0FBQzs7QUFFMUIsSUFBSSwwQkFBMEIsb0JBQUE7SUFDMUIsZUFBZSxFQUFFLFdBQVc7UUFDeEIsT0FBTyxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNyQyxLQUFLOztJQUVELE1BQU0sRUFBRSxXQUFXO1FBQ2YsSUFBSSxHQUFHLEdBQUcsSUFBSSxFQUFFLGFBQWEsR0FBRyxJQUFJLENBQUM7QUFDN0MsUUFBUSxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7O1FBRXJDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUU7WUFDekIsR0FBRztZQUNILG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUEsRUFBQTtnQkFDL0Isb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxpQkFBQSxFQUFpQixDQUFDLE9BQUEsRUFBTyxDQUFFLElBQUksQ0FBQyxnQkFBaUIsQ0FBRSxDQUFBLEVBQUE7b0JBQzlELG9CQUFBLE1BQUssRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsWUFBYSxDQUFPLENBQUE7ZUFDbkMsQ0FBQTtZQUNILENBQUEsQ0FBQyxDQUFDO1lBQ1IsYUFBYSxLQUFLLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsWUFBYSxDQUFBLEVBQUE7Z0JBQzFDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsaUJBQUEsRUFBaUIsQ0FBQyxPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsWUFBYSxDQUFFLENBQUEsRUFBQTtvQkFDMUQsb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxvQkFBcUIsQ0FBTyxDQUFBO2VBQzNDLENBQUE7WUFDSCxDQUFBLENBQUMsQ0FBQztTQUNYO1FBQ0QsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtZQUNuQixHQUFHO1lBQ0gsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBQSxFQUFBO2dCQUMvQixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLHdCQUFBLEVBQXdCLENBQUMsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLGdCQUFpQixDQUFFLENBQUEsRUFBQTtvQkFDckUsb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxZQUFhLENBQU8sQ0FBQTtlQUNuQyxDQUFBO1lBQ0gsQ0FBQSxDQUFDLENBQUM7U0FDWDtJQUNMO1FBQ0ksb0JBQUEsS0FBSSxFQUFBLENBQUE7WUFDQSxPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFDO1lBQ25ELFlBQUEsRUFBWSxDQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFBQztZQUNyQyxZQUFBLEVBQVksQ0FBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUM7WUFDdkMsU0FBQSxFQUFTLENBQUUsbURBQW1ELEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUM7WUFDbkYsS0FBQSxFQUFLLENBQUUsVUFBWSxDQUFBLEVBQUE7WUFDbEIsYUFBYSxFQUFDO1lBQ2Ysb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxZQUFhLENBQUEsRUFBQTtjQUMxQixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFNBQVUsQ0FBQSxFQUFBO2dCQUN2QixvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFDLEtBQUEsRUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQWdCLENBQUE7Y0FDeEQsQ0FBQSxFQUFBO2NBQ04sb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyx3QkFBeUIsQ0FBQSxFQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQXNCLENBQUEsRUFBQTtjQUNsRyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLHdCQUF5QixDQUFBLEVBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFXLENBQUE7WUFDM0QsQ0FBQSxFQUFBO1lBQ0wsR0FBSTtRQUNILENBQUE7VUFDSjtBQUNWLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztJQUVJLFlBQVksRUFBRSxXQUFXO1FBQ3JCLElBQUksVUFBVSxLQUFLLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUQsWUFBWSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUQsUUFBUSxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEUsWUFBWSxVQUFVLEtBQUssUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOztRQUUvRCxJQUFJLEdBQUcsR0FBRyxDQUFDLFVBQVUsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN2RCxJQUFJLE1BQU0sR0FBRyxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDbEUsUUFBUSxJQUFJLE1BQU0sR0FBRyxNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQzs7QUFFdEMsUUFBUSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLENBQUMsRUFBRTs7QUFFMUMsU0FBUzs7QUFFVCxRQUFRLElBQUksaUJBQWlCLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDOztBQUVsRSxRQUFRLElBQUkscUJBQXFCLEdBQUcsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUM7O0FBRWpGLFFBQVEsSUFBSSxTQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsR0FBRyxxQkFBcUIsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUM7O1FBRTlGLE9BQU87WUFDSCxLQUFLLEVBQUUscUJBQXFCLEdBQUcsR0FBRztZQUNsQyxHQUFHLEVBQUUsR0FBRztZQUNSLE1BQU0sRUFBRSxNQUFNO1lBQ2QsZUFBZSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTTtZQUNsQyxNQUFNLEVBQUUsWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTTtZQUN4QyxJQUFJLEVBQUUsU0FBUyxHQUFHLEdBQUc7WUFDckIsTUFBTSxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVc7U0FDdkMsQ0FBQztBQUNWLEtBQUs7O0lBRUQsaUJBQWlCLEVBQUUsV0FBVztRQUMxQixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDcEMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7S0FDOUQ7SUFDRCxtQkFBbUIsRUFBRSxXQUFXO1FBQzVCLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNyQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDekM7SUFDRCxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsRUFBRTtRQUMxQixnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNO1lBQ2pELE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWU7WUFDbkMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDdEIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0tBQ3ZCO0lBQ0QsWUFBWSxFQUFFLFNBQVMsQ0FBQyxFQUFFO1FBQ3RCLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU07WUFDakQsT0FBTyxFQUFFLEVBQUU7WUFDWCxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNyQixDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDNUIsS0FBSzs7SUFFRCxhQUFhLEVBQUUsU0FBUyxNQUFNLEVBQUU7UUFDNUIsQ0FBQyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztXQUM1QixHQUFHLENBQUMsa0JBQWtCLEVBQUUsTUFBTSxDQUFDO1dBQy9CLEdBQUcsQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDdkMsS0FBSzs7QUFFTCxDQUFDLENBQUMsQ0FBQzs7QUFFSCxvQ0FBb0MsdUJBQUE7O0lBRWhDLE1BQU0sRUFBRSxXQUFXO1FBQ2YsSUFBSSxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDckMsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3hDLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxHQUFHLEVBQUU7WUFDbkMsSUFBSSxTQUFTLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLElBQUksRUFBRTtnQkFDakQsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDNUIsT0FBTyxvQkFBQyxJQUFJLEVBQUEsZ0JBQUEsR0FBQSxDQUFFLEdBQUcsSUFBSSxFQUFDLENBQUMsQ0FBQSxXQUFBLEVBQVcsQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBQyxDQUFDLEdBQUEsRUFBRyxDQUFFLElBQUksQ0FBQyxFQUFFLEVBQUMsQ0FBQyxNQUFBLEVBQU0sQ0FBRSxDQUFFLENBQUEsQ0FBRSxDQUFBO2FBQ3pGLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDZDtvQkFDUSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLEdBQUEsRUFBRyxDQUFFLEdBQUssQ0FBQSxFQUFBO3dCQUNWLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsb0JBQXFCLENBQUEsRUFBQTs0QkFDL0IsU0FBVTt3QkFDVCxDQUFBO29CQUNMLENBQUE7Y0FDWDtTQUNMLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDZDtZQUNJLG9CQUFBLE9BQU0sRUFBQSxJQUFDLEVBQUE7Y0FDTCxvQkFBQSxPQUFNLEVBQUEsSUFBQyxFQUFBO2dCQUNMLG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUE7a0JBQ0Ysb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxTQUFVLENBQUssQ0FBQSxFQUFBO2tCQUM1QixTQUFVO2dCQUNSLENBQUE7Y0FDQyxDQUFBO0FBQ3RCLFlBQW9CLENBQUE7O1VBRVY7QUFDVixLQUFLOztJQUVELGlCQUFpQixFQUFFLFdBQVc7UUFDMUIsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM5RCxJQUFJLENBQUMsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO0FBQzNCLFFBQVEsSUFBSSxRQUFRLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQzs7QUFFakQsS0FBSzs7SUFFRCxRQUFRLEVBQUUsU0FBUyxJQUFJLEVBQUU7UUFDckIsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbEUsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxNQUFNLEVBQUU7WUFDN0IsVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNyRjtRQUNELE9BQU8sVUFBVSxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUM7QUFDbEQsS0FBSzs7SUFFRCxhQUFhLEVBQUUsV0FBVztRQUN0QixJQUFJLFlBQVksR0FBRztZQUNmLEdBQUcsRUFBRSxFQUFFO1lBQ1AsR0FBRyxFQUFFLEVBQUU7WUFDUCxHQUFHLEVBQUUsRUFBRTtZQUNQLEdBQUcsRUFBRSxFQUFFO1lBQ1AsR0FBRyxFQUFFLEVBQUU7U0FDVixDQUFDO1FBQ0YsZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO1FBQ3RCLEtBQUssSUFBSSxNQUFNLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFO1lBQzdDLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvQyxLQUFLLElBQUksT0FBTyxJQUFJLEdBQUcsQ0FBQyxLQUFLLEVBQUU7Z0JBQzNCLElBQUksSUFBSSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzlCLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDdEQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLE1BQU0sQ0FBQztnQkFDeEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDO2dCQUN4QixZQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDbEMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQzthQUN2QztTQUNKO1FBQ0QsT0FBTyxZQUFZLENBQUM7QUFDNUIsS0FBSzs7Q0FFSixDQUFDLENBQUM7OztBQzdNSCxJQUFJLGNBQWMsR0FBRyxPQUFPLENBQUMsOEJBQThCLENBQUMsQ0FBQzs7QUFFN0QsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDO0FBQ3BDLEVBQUUsV0FBVyxFQUFFLENBQUMsY0FBYyxDQUFDOztFQUU3QixhQUFhLEVBQUUsU0FBUyxNQUFNLEVBQUUsU0FBUyxFQUFFO0lBQ3pDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUM5QixDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxNQUFNLEdBQUcsTUFBTSxHQUFHLFNBQVM7U0FDekMsRUFBRTtTQUNGLFNBQVMsUUFBUSxFQUFFO1lBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxZQUFZLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1VBQzdELENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztBQUNyQixLQUFLLENBQUM7O0FBRU4sR0FBRzs7RUFFRCxlQUFlLEVBQUUsV0FBVztJQUMxQixPQUFPLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7R0FDaEQ7Q0FDRixDQUFDLENBQUM7OztBQ25CSCxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDaEMsSUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDLDZCQUE2QixDQUFDLENBQUM7O0FBRTFELE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQztBQUNwQyxFQUFFLFdBQVcsRUFBRSxDQUFDLFlBQVksQ0FBQzs7RUFFM0IsV0FBVyxFQUFFLFNBQVMsT0FBTyxFQUFFO0lBQzdCLElBQUksU0FBUyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUMzRCxRQUFRLENBQUMsc0JBQXNCLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDM0MsUUFBUSxDQUFDLE1BQU07TUFDYixvQkFBQyxLQUFLLEVBQUEsQ0FBQSxDQUFDLE9BQUEsRUFBTyxDQUFFLE9BQVEsQ0FBQSxDQUFHLENBQUE7TUFDM0IsU0FBUztLQUNWLENBQUM7QUFDTixHQUFHO0FBQ0g7O0NBRUMsQ0FBQyxDQUFDOzs7QUNoQkgsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7QUFDekQsSUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDLDZCQUE2QixDQUFDLENBQUM7QUFDMUQsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLHdCQUF3QixDQUFDLENBQUM7O0FBRTdDLFNBQVMsWUFBWSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUU7SUFDakMsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ2hCLEtBQUssSUFBSSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUMzRixPQUFPLE1BQU0sQ0FBQztBQUNsQixDQUFDOztBQUVELEdBQUcsR0FBRyxZQUFZLENBQUMsRUFBRSxFQUFFLDhFQUE4RSxDQUFDLENBQUM7O0FBRXZHLFFBQVEsR0FBRztFQUNULE1BQU0sRUFBRSxLQUFLO0VBQ2IsUUFBUSxFQUFFLEdBQUc7RUFDYixtQkFBbUIsRUFBRSxFQUFFO0VBQ3ZCLFdBQVcsRUFBRTtJQUNYLG1CQUFtQixFQUFFLEtBQUs7SUFDMUIsa0JBQWtCLEVBQUUsS0FBSztJQUN6QixjQUFjLEVBQUUsS0FBSztJQUNyQixTQUFTLEVBQUUsS0FBSztJQUNoQixZQUFZLEVBQUUsS0FBSztJQUNuQixvQkFBb0IsRUFBRSxLQUFLO0dBQzVCO0VBQ0QsR0FBRyxFQUFFLEdBQUc7QUFDVixDQUFDOztBQUVELFdBQVcsR0FBRyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQzs7QUFFOUIsc0RBQXNEO0FBQ3RELFlBQVksR0FBRyxLQUFLLENBQUM7O0FBRXJCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQztFQUNsQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUM7RUFDdEIsbUJBQW1CLEVBQUUsRUFBRTtBQUN6QixFQUFFLE9BQU8sRUFBRSxLQUFLOztFQUVkLGVBQWUsRUFBRSxXQUFXO0lBQzFCLE9BQU87TUFDTCxVQUFVLEVBQUUsRUFBRTtNQUNkLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVztNQUNqQyxtQkFBbUIsRUFBRSxFQUFFO01BQ3ZCLGFBQWEsRUFBRSxDQUFDLENBQUM7TUFDakIsY0FBYyxFQUFFLEtBQUs7TUFDckIsT0FBTyxFQUFFLEtBQUs7TUFDZCxlQUFlLEVBQUUsS0FBSztNQUN0QixNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDbEIsR0FBRzs7RUFFRCxTQUFTLEVBQUUsU0FBUyxVQUFVLEVBQUU7SUFDOUIsSUFBSSxNQUFNLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxVQUFVLEdBQUcsRUFBRSxDQUFDO0lBQ3BFLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUN2QyxRQUFRLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUN6QixTQUFTLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUMxQixJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzVCLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTs7RUFFRSxhQUFhLEVBQUUsU0FBUyx1QkFBdUIsRUFBRTtJQUMvQyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUM7SUFDM0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDeEIsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7O0lBRTdCLElBQUksUUFBUSxHQUFHLHVCQUF1QixDQUFDLFFBQVEsQ0FBQztJQUNoRCxJQUFJLGFBQWEsR0FBRyx1QkFBdUIsQ0FBQyxFQUFFLENBQUM7SUFDL0MsSUFBSSxPQUFPLEdBQUcsdUJBQXVCLENBQUMsT0FBTyxDQUFDO0lBQzlDLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUM3QyxJQUFJLE1BQU0sR0FBRyxTQUFTLENBQUMsbUJBQW1CLENBQUM7SUFDM0MsSUFBSSxDQUFDLFFBQVEsRUFBRTtNQUNiLElBQUksUUFBUSxDQUFDLE1BQU0sSUFBSSxLQUFLLEVBQUU7UUFDNUIsSUFBSSxNQUFNLENBQUMsYUFBYSxDQUFDLEVBQUU7VUFDekIsSUFBSSxXQUFXLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsT0FBTyxDQUFDO1VBQ2xFLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxXQUFXLENBQUM7U0FDMUM7YUFDSTtVQUNILE1BQU0sQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUNuRTtPQUNGO1dBQ0ksSUFBSSxRQUFRLENBQUMsTUFBTSxJQUFJLE1BQU0sRUFBRTtRQUNsQyxJQUFJLGVBQWUsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQztVQUN4RixNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDeEIsSUFBSSxPQUFPLElBQUksT0FBTyxJQUFJLEVBQUUsRUFBRTtVQUM1QixJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUM7VUFDMUIsSUFBSSxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1VBQ2hFLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUM7U0FDM0M7UUFDRCxNQUFNLENBQUMsYUFBYSxDQUFDLEdBQUcsZUFBZSxDQUFDO09BQ3pDO0tBQ0Y7U0FDSTtNQUNILE9BQU8sTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO01BQzdCLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO1VBQ2pDLFFBQVEsQ0FBQyxtQkFBbUIsR0FBRyxFQUFFLENBQUM7VUFDbEMsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1VBQ3RDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztVQUNsQyxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztVQUNyQixJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1VBQ3ZCLE9BQU87T0FDVjtLQUNGO0lBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNoQyxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztFQUVFLGlCQUFpQixFQUFFLFNBQVMsVUFBVSxFQUFFLFNBQVMsRUFBRTtJQUNqRCxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDN0MsSUFBSSxVQUFVLElBQUksb0JBQW9CLElBQUksU0FBUyxJQUFJLEtBQUssRUFBRTtNQUM1RCxZQUFZLEdBQUcsSUFBSSxDQUFDO0tBQ3JCO0lBQ0QsU0FBUyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FBRyxTQUFTLENBQUM7SUFDOUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUNuRCxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2hDLEdBQUc7QUFDSDs7RUFFRSxXQUFXLEVBQUUsU0FBUyxTQUFTLEVBQUU7SUFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzlCLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUUsU0FBUyxRQUFRLEVBQUU7UUFDdEQsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDckIsSUFBSSxRQUFRLENBQUMsS0FBSyxFQUFFO1VBQ2xCLEdBQUcsT0FBTyxPQUFPLENBQUMsS0FBSyxXQUFXLEVBQUU7WUFDbEMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztXQUNqQztVQUNELFFBQVEsQ0FBQyxtQkFBbUIsR0FBRyxFQUFFLENBQUM7VUFDbEMsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1VBQ3RDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztVQUNsQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1VBQ3ZCLE9BQU87U0FDUjtRQUNELElBQUksUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7VUFDdkIsUUFBUSxHQUFHLFNBQVMsQ0FBQztVQUNyQixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7VUFDZCxJQUFJLFNBQVMsQ0FBQyxLQUFLLElBQUksU0FBUyxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFO1lBQ3hELEtBQUssR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDO1lBQ3hCLE9BQU8sU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1dBQzNCO1VBQ0QsSUFBSSxDQUFDLE9BQU8sQ0FBQztjQUNULFVBQVUsRUFBRSxRQUFRO2NBQ3BCLG1CQUFtQixFQUFFLFFBQVEsQ0FBQyxtQkFBbUI7Y0FDakQsYUFBYSxFQUFFLEtBQUs7Y0FDcEIsT0FBTyxFQUFFLEtBQUs7Y0FDZCxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVc7V0FDcEMsQ0FBQyxDQUFDO0FBQ2IsU0FBUyxNQUFNLElBQUksUUFBUSxDQUFDLG1CQUFtQixJQUFJLEVBQUUsRUFBRTs7VUFFN0MsSUFBSSxZQUFZLEVBQUU7WUFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQztjQUNYLE9BQU8sRUFBRSxLQUFLO2NBQ2QsY0FBYyxFQUFFLEtBQUs7Y0FDckIsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXO2FBQ2xDLENBQUM7WUFDRixZQUFZLENBQUMsV0FBVyxDQUFDLCtEQUErRCxDQUFDLENBQUM7V0FDM0YsTUFBTTtZQUNMLElBQUksQ0FBQyxPQUFPLENBQUM7Y0FDWCxPQUFPLEVBQUUsS0FBSztjQUNkLGNBQWMsRUFBRSxJQUFJO2FBQ3JCLENBQUMsQ0FBQztZQUNILFlBQVksQ0FBQyxXQUFXLENBQUMseUZBQXlGLENBQUMsQ0FBQztXQUNySDtTQUNGLE1BQU07VUFDTCxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDaEM7UUFDRCxZQUFZLEdBQUcsS0FBSyxDQUFDO0tBQ3hCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDbEIsR0FBRztBQUNIOztFQUVFLG1CQUFtQixFQUFFLFNBQVMsUUFBUSxFQUFFO0lBQ3RDLElBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDbEMsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ3JELElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUM1QixJQUFJLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDekMsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO0lBQ2xCLEtBQUssSUFBSSxDQUFDLElBQUksaUJBQWlCLEVBQUU7TUFDL0IsSUFBSSxhQUFhLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO01BQ3BELElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxRCxNQUFNLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssTUFBTSxDQUFDLENBQUM7O01BRXZFLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztLQUN4QjtJQUNELElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDcEUsUUFBUSxDQUFDLFdBQVcsR0FBRyxRQUFRLENBQUM7SUFDaEMsUUFBUSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDekIsUUFBUSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDbkUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7TUFDdkMsSUFBSSxXQUFXLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM5QyxNQUFNLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQzs7TUFFOUQsUUFBUSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO01BQ3ZFLElBQUksV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDMUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7VUFDM0MsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1VBQ3JELElBQUksTUFBTSxJQUFJLE1BQU0sRUFBRTtZQUNwQixRQUFRLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDO1dBQ3ZEO2VBQ0ksSUFBSSxNQUFNLElBQUksS0FBSyxFQUFFO1lBQ3hCLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUM7V0FDaEQ7U0FDRjtPQUNGO0tBQ0Y7SUFDRCxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQy9CLEdBQUc7O0VBRUQsaUJBQWlCLEVBQUUsV0FBVztJQUM1QixJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7R0FDdkM7RUFDRCxxQkFBcUIsRUFBRSxXQUFXO0lBQ2hDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztHQUN4QztFQUNELGVBQWUsRUFBRSxTQUFTLFNBQVMsRUFBRTtJQUNuQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDN0MsR0FBRzs7QUFFSCxDQUFDLENBQUMsQ0FBQzs7QUFFSCxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxXQUFXO0VBQ3RDLENBQUMsQ0FBQyxJQUFJLENBQUM7TUFDSCxJQUFJLEVBQUUsTUFBTTtNQUNaLEtBQUssRUFBRSxLQUFLO01BQ1osR0FBRyxFQUFFLE9BQU87TUFDWixJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO0dBQ25CLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDOzs7QUN2T0gsSUFBSSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztBQUNqRSxJQUFJLGNBQWMsR0FBRyxPQUFPLENBQUMsK0JBQStCLENBQUMsQ0FBQztBQUM5RCxJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzs7QUFFNUMsb0NBQW9DLHVCQUFBO0FBQ3BDLEVBQUUsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQzs7RUFFeEMsTUFBTSxFQUFFLFdBQVc7R0FDbEIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFO0lBQzdDLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHO01BQzVCLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxFQUFFO09BQzdDLElBQUksRUFBRSxDQUFDLFdBQVcsQ0FBQyxLQUFLLGlCQUFpQixFQUFFO2FBQ3JDLElBQUksR0FBRyxHQUFHLCtCQUErQjtZQUMxQyxNQUFNO2FBQ0wsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQztZQUMxQjtXQUNELElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLGlCQUFpQixFQUFFO2FBQ3BDLElBQUksS0FBSyxHQUFHLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDO1lBQzlCLE1BQU07YUFDTCxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDO1lBQ3hCO1dBQ0Q7YUFDRSxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQUEsRUFBVSxDQUFDLEdBQUEsRUFBRyxDQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUcsQ0FBQSxFQUFBO2lCQUNyQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLE1BQUEsRUFBTSxDQUFDLEtBQUEsRUFBSyxDQUFDLEdBQUEsRUFBRyxDQUFFLEdBQUksQ0FBRSxDQUFBLEVBQUE7aUJBQzdCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsUUFBUyxDQUFBLEVBQUE7bUJBQ3RCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsWUFBYSxDQUFBLEVBQUMsS0FBVyxDQUFBO21CQUNqQyxDQUFBLEVBQUE7aUJBQ1Isb0JBQUEsR0FBRSxFQUFBLENBQUEsQ0FBQyxJQUFBLEVBQUksQ0FBRSxFQUFFLENBQUMsWUFBWSxDQUFDLEVBQUMsQ0FBQyxNQUFBLEVBQU0sQ0FBQyxRQUFTLENBQUEsRUFBQTttQkFDekMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxHQUFBLEVBQUcsQ0FBQyxxR0FBQSxFQUFxRyxDQUFDLEtBQUEsRUFBSyxDQUFDLEtBQUEsRUFBSyxDQUFDLE1BQUEsRUFBTSxDQUFDLElBQUEsRUFBSSxDQUFDLE1BQUEsRUFBTSxDQUFDLEdBQUcsQ0FBRSxDQUFBO2lCQUNqSixDQUFBO2FBQ0YsQ0FBQSxFQUFFO01BQ2YsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztLQUNkO01BQ0Msb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxxQkFBc0IsQ0FBQSxFQUFBO09BQ3BDLG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUMsQ0FBQyxDQUFDLElBQVUsQ0FBQSxFQUFBO1FBQ2hCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsNkJBQThCLENBQUEsRUFBQTtRQUM1QyxVQUFXO09BQ1AsQ0FBQTtNQUNELENBQUEsQ0FBQztLQUNSO1NBQ0k7S0FDSixPQUFPLElBQUk7S0FDWDtJQUNELENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDYixRQUFRLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsdUJBQXdCLENBQUEsRUFBQyxJQUFXLENBQUEsQ0FBQztBQUNoRSxHQUFHOztDQUVGLENBQUM7OztBQy9DRixJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUM1QyxJQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDekMsSUFBSSxxQkFBcUIsR0FBRyxPQUFPLENBQUMsNEJBQTRCLENBQUMsQ0FBQztBQUNsRSxJQUFJLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0FBQzlELElBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0FBQ3RELElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0FBQzVDLElBQUksYUFBYSxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDOztBQUVoRCxvQ0FBb0MsdUJBQUE7QUFDcEMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7O0VBRS9DLFFBQVEsRUFBRSxTQUFTLFNBQVMsRUFBRTtJQUM1QixPQUFPLFlBQVk7TUFDakIsSUFBSSxTQUFTLElBQUksQ0FBQyxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUU7UUFDOUQsZ0JBQWdCLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO09BQzdDO0tBQ0YsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDbEIsR0FBRzs7RUFFRCxZQUFZLEVBQUUsV0FBVztJQUN2QixJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7SUFDdEMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzFCLE9BQU8sSUFBSSxHQUFHLElBQUksQ0FBQztHQUNwQjtFQUNELE9BQU8sRUFBRSxXQUFXO0VBQ3BCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU07TUFDckMsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBbUI7TUFDOUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztHQUNyRDtBQUNILEVBQUUsVUFBVSxFQUFFLFdBQVc7O0lBRXJCLElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQztJQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFFO01BQ3pCLE9BQU8sWUFBWSxDQUFDO0tBQ3JCO0lBQ0QsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUM7SUFDdEUsS0FBSyxJQUFJLFlBQVksSUFBSSxPQUFPLEVBQUU7TUFDaEMsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO01BQ25DLEtBQUssSUFBSSxVQUFVLElBQUksTUFBTSxDQUFDLEtBQUssRUFBRTtRQUNuQyxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3BDLElBQUksUUFBUSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JELFlBQVksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztPQUNqRDtLQUNGO0FBQ0wsSUFBSSxPQUFPLFlBQVksQ0FBQzs7QUFFeEIsR0FBRzs7RUFFRCxXQUFXLEVBQUUsV0FBVztJQUN0QixJQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDckMsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQ2QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLFlBQVksRUFBRSxDQUFDLEVBQUUsRUFBRTtNQUN0QyxJQUFJLElBQUksR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDO01BQ3BCLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRTtRQUNYLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDckMsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUM7T0FDcEI7TUFDRCxJQUFJLENBQUMsSUFBSTtXQUNKLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsR0FBQSxFQUFHLENBQUUsSUFBTSxDQUFBLEVBQUE7Y0FDWixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQyxJQUFZLENBQUssQ0FBQSxFQUFBO2NBQzFFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtVQUN0QyxDQUFBO0FBQ2YsT0FBTyxDQUFDOztNQUVGLElBQUksQ0FBQyxJQUFJO1dBQ0osb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxVQUFBLEVBQVUsQ0FBQyxHQUFBLEVBQUcsQ0FBRSxJQUFJLEdBQUcsT0FBUyxDQUFBLEVBQUE7Y0FDM0Msb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQ0FBb0MsQ0FBSyxDQUFBLEVBQUE7Y0FDdkQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO1VBQ3RDLENBQUE7QUFDZixPQUFPLENBQUM7O0FBRVIsS0FBSzs7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNoQixHQUFHO0FBQ0g7O0VBRUUsYUFBYSxFQUFFLFdBQVc7SUFDeEIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQzVDLEdBQUc7O0VBRUQsTUFBTSxFQUFFLFdBQVc7TUFDZixJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7TUFDMUMsSUFBSSxZQUFZLEdBQUcsQ0FBQyxjQUFjLEdBQUcsSUFBSTtRQUN2QyxvQkFBQyxXQUFXLEVBQUEsQ0FBQSxDQUFDLFdBQUEsRUFBVyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFDO3FCQUNwQyxTQUFBLEVBQVMsQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxFQUFDO3FCQUMzRCxtQkFBQSxFQUFtQixDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEVBQUM7QUFDekUscUJBQXFCLE1BQUEsRUFBTSxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTyxDQUFFLENBQUEsQ0FBQyxDQUFDOztNQUU3QyxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7TUFDL0IsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO01BQ3pELElBQUksTUFBTSxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLElBQUksSUFBSSxDQUFDO0FBQzlELE1BQU07O1VBRUksb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxVQUFBLEVBQVUsQ0FBQyxTQUFBLEVBQVMsQ0FBQyx1QkFBQSxFQUF1QixDQUFDLEtBQUEsRUFBSyxDQUFFLE9BQVMsQ0FBQSxFQUFBO2NBQ2pFLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsWUFBYSxDQUFBLEVBQUE7Z0JBQzFCLG9CQUFDLFVBQVUsRUFBQSxDQUFBO2tCQUNULEtBQUEsRUFBSyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBQztrQkFDcEMsSUFBQSxFQUFJLENBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsRUFBQztrQkFDbEQsSUFBQSxFQUFJLENBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsRUFBQztrQkFDbEQsUUFBQSxFQUFRLENBQUUsSUFBSSxDQUFDLFFBQVEsRUFBQztrQkFDeEIsYUFBQSxFQUFhLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFjLENBQUUsQ0FBQSxFQUFBO2dCQUM1QyxvQkFBQSxHQUFFLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLHlDQUFBLEVBQXlDO21CQUNuRCxxQkFBQSxFQUFtQixDQUFFLElBQUksQ0FBQyxZQUFZLEVBQUksQ0FBQSxFQUFBO2tCQUMzQyxvQkFBQSxNQUFLLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBTyxDQUFBO2dCQUNoQyxDQUFBLEVBQUE7QUFDcEIsZ0JBQWdCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFNLENBQUE7QUFDaEQ7O0FBRUEsY0FBb0IsQ0FBQSxFQUFBOztjQUVOLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUEsRUFBQTtnQkFDakMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQywyQ0FBNEMsQ0FBQSxFQUFBO2tCQUN6RCxvQkFBQSxPQUFNLEVBQUEsSUFBQyxFQUFBO29CQUNMLG9CQUFBLE9BQU0sRUFBQSxJQUFDLEVBQUE7c0JBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTt3QkFDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGtCQUFtQixDQUFBLEVBQUE7MEJBQy9CLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMseUJBQUEsRUFBeUIsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxzQkFBdUIsQ0FBQSxFQUFBOzRCQUNqRSxvQkFBQSxPQUFNLEVBQUEsSUFBQyxFQUFBOzhCQUNMLG9CQUFBLE9BQU0sRUFBQSxJQUFDLEVBQUE7Z0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtrQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLDBCQUEyQixDQUFLLENBQUEsRUFBQTtrQ0FDOUMsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyx1Q0FBd0MsQ0FBQSxFQUFBLE1BQVMsQ0FBQSxFQUFBO2tDQUMvRCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLHVDQUF3QyxDQUFBLEVBQUEsTUFBUyxDQUFBLEVBQUE7a0NBQy9ELG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsdUNBQXdDLENBQUEsRUFBQSxNQUFTLENBQUEsRUFBQTtrQ0FDL0Qsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyx1Q0FBd0MsQ0FBQSxFQUFBLE1BQVMsQ0FBQSxFQUFBO2tDQUMvRCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLHVDQUF3QyxDQUFBLEVBQUEsTUFBUyxDQUFBO2dDQUM1RCxDQUFBOzhCQUNDLENBQUE7NEJBQ0YsQ0FBQTswQkFDSixDQUFBO3dCQUNILENBQUE7c0JBQ0YsQ0FBQTtBQUMzQixvQkFBNEIsQ0FBQSxFQUFBOztvQkFFUixvQkFBQSxPQUFNLEVBQUEsSUFBQyxFQUFBO3NCQUNMLG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUE7d0JBQ0Ysb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBQSxFQUFBO0FBQzFELDBCQUEwQixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGFBQWMsQ0FBQSxFQUFBOzs4QkFFekIsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxxQkFBc0IsQ0FBQSxFQUFBO2dDQUNuQyxvQkFBQSxPQUFNLEVBQUEsSUFBQyxFQUFBO2tDQUNMLG9CQUFBLE9BQU0sRUFBQSxJQUFDLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFNBQVUsQ0FBSyxDQUFBLEVBQUE7c0NBQzdCLG9CQUFBLElBQUcsRUFBQSxJQUFNLENBQUEsRUFBQTtzQ0FDVCxvQkFBQSxJQUFHLEVBQUEsSUFBTSxDQUFBLEVBQUE7c0NBQ1Qsb0JBQUEsSUFBRyxFQUFBLElBQU0sQ0FBQSxFQUFBO3NDQUNULG9CQUFBLElBQUcsRUFBQSxJQUFNLENBQUEsRUFBQTtzQ0FDVCxvQkFBQSxJQUFHLEVBQUEsSUFBTSxDQUFBO29DQUNOLENBQUE7a0NBQ0MsQ0FBQTtnQ0FDRixDQUFBOzhCQUNKLENBQUE7NEJBQ0YsQ0FBQSxFQUFBOzBCQUNSLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsb0NBQUEsRUFBb0MsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxnQkFBQSxFQUFnQixDQUFDLEtBQUEsRUFBSyxDQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBRyxDQUFBLEVBQUE7NEJBQy9GLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsY0FBZSxDQUFBLEVBQUE7OEJBQzVCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsT0FBUSxDQUFBLEVBQUE7Z0NBQ3JCLG9CQUFBLE9BQU0sRUFBQSxJQUFDLEVBQUE7a0NBQ0wsb0JBQUEsT0FBTSxFQUFBLElBQUMsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsMkJBQTRCLENBQUssQ0FBQSxFQUFBO3NDQUMvQyxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGlDQUFrQyxDQUFLLENBQUEsRUFBQTtzQ0FDckQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxpQ0FBa0MsQ0FBSyxDQUFBLEVBQUE7c0NBQ3JELG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsaUNBQWtDLENBQUssQ0FBQSxFQUFBO3NDQUNyRCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGlDQUFrQyxDQUFLLENBQUEsRUFBQTtzQ0FDckQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxpQ0FBa0MsQ0FBSyxDQUFBO29DQUNsRCxDQUFBO2tDQUNDLENBQUE7Z0NBQ0YsQ0FBQTs4QkFDSixDQUFBLEVBQUE7OEJBQ04sb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxVQUFXLENBQUEsRUFBQTtnQ0FDeEIsb0JBQUEsT0FBTSxFQUFBLElBQUMsRUFBQTtrQ0FDTCxvQkFBQSxPQUFNLEVBQUEsSUFBQyxFQUFBO29DQUNKLEtBQU07a0NBQ0QsQ0FBQTtnQ0FDRixDQUFBOzhCQUNKLENBQUEsRUFBQTs4QkFDTixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGtCQUFBLEVBQWtCLENBQUMsRUFBQSxFQUFFLENBQUMsV0FBVyxDQUFBLENBQUcsQ0FBQSxFQUFBOzhCQUNsRCxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLHFCQUFBLEVBQXFCLENBQUMsRUFBQSxFQUFFLENBQUMsY0FBZSxDQUFBLEVBQUE7Z0NBQ3BELFlBQWE7OEJBQ1YsQ0FBQTs0QkFDRixDQUFBOzBCQUNGLENBQUE7d0JBQ0gsQ0FBQTtzQkFDRixDQUFBO29CQUNDLENBQUE7a0JBQ0YsQ0FBQTtnQkFDSixDQUFBO2NBQ0YsQ0FBQTtZQUNGLENBQUE7UUFDVjtBQUNSLEdBQUc7O0VBRUQsaUJBQWlCLEVBQUUsV0FBVztJQUM1QixJQUFJLElBQUksR0FBRyxJQUFJLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQy9DLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFO01BQzdCLFlBQVksQ0FBQyxXQUFXLENBQUMsMkJBQTJCLENBQUMsQ0FBQztLQUN2RCxDQUFDLENBQUM7QUFDUCxHQUFHOztFQUVELGtCQUFrQixFQUFFLFdBQVc7SUFDN0IsR0FBRyxPQUFPLE9BQU8sQ0FBQyxLQUFLLFdBQVcsRUFBRTtBQUN4QyxNQUFNLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTs7UUFFcEMsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzlCLFlBQVksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO09BQ3hDLE1BQU07UUFDTCxZQUFZLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO09BQ2pDO0FBQ1AsS0FBSzs7QUFFTCxHQUFHO0FBQ0g7O0NBRUMsQ0FBQyxDQUFDOzs7QUN2Tkgsb0NBQW9DLHVCQUFBO0NBQ25DLGVBQWUsRUFBRSxXQUFXO0VBQzNCLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7RUFDdkI7Q0FDRCxNQUFNLEVBQUUsV0FBVztFQUNsQixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDO0VBQ3ZDO0VBQ0Esb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyw0QkFBNkIsQ0FBQSxFQUFBO0dBQzNDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsV0FBWSxDQUFBLEVBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFjLENBQUE7RUFDaEQsQ0FBQTtJQUNKO0VBQ0Y7Q0FDRCxpQkFBaUIsRUFBRSxXQUFXO0VBQzdCLFVBQVUsQ0FBQyxXQUFXO0dBQ3JCLElBQUksSUFBSSxDQUFDLHNCQUFzQixFQUFFO0lBQ2hDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNoQztHQUNELENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3RCLEVBQUU7O0NBRUQsQ0FBQyxDQUFDOzs7O0FDcEJILElBQUksT0FBTyxHQUFHLElBQUksT0FBTyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7QUFDNUQsTUFBTSxDQUFDLE9BQU8sR0FBRztDQUNoQixXQUFXLEVBQUUsU0FBUyxNQUFNLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRTtFQUN0RSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztLQUMzRCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQztLQUM5QyxLQUFLLElBQUksSUFBSSxJQUFJLFdBQVcsRUFBRTtNQUM3QixJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO01BQzNDLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7TUFDMUQsSUFBSSxJQUFJLFNBQVMsR0FBRyxHQUFHLEdBQUcsV0FBVyxHQUFHLEdBQUcsQ0FBQztNQUM1QztLQUNELElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3pCLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLENBQUM7S0FDaEQsSUFBSSxNQUFNLEdBQUcsbUJBQW1CLENBQUM7S0FDakMsS0FBSyxJQUFJLFNBQVMsSUFBSSxNQUFNLEVBQUU7T0FDNUIsSUFBSSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQy9ELE9BQU8sSUFBSSxJQUFJLGlCQUFpQixDQUFDOztPQUUxQixJQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7T0FDaEMsS0FBSyxJQUFJLGVBQWUsSUFBSSxPQUFPLEVBQUU7U0FDbkMsSUFBSSxPQUFPLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxFQUFFO1dBQ2xDLElBQUksZUFBZSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7V0FDckUsSUFBSSxJQUFJLEdBQUcsR0FBRyxlQUFlLENBQUM7VUFDL0I7UUFDRjtPQUNELElBQUksSUFBSSxHQUFHLENBQUM7TUFDYjtLQUNELElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlCLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQzs7S0FFakMsT0FBTyxJQUFJLENBQUM7QUFDakIsRUFBRTs7Q0FFRCxlQUFlLEVBQUUsU0FBUyxDQUFDLEVBQUU7RUFDNUIsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNkLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDbkMsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUN6QyxJQUFJLENBQUMsU0FBUyxJQUFJLFNBQVMsSUFBSSxFQUFFLEVBQUU7TUFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNmO0tBQ0QsT0FBTyxTQUFTLENBQUM7QUFDdEIsRUFBRTs7Q0FFRCxpQkFBaUIsRUFBRSxTQUFTLENBQUMsRUFBRTtFQUM5QixJQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3RDLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0VBQ3hELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLEVBQUU7O0NBRUQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8ZmVyb3NzQGZlcm9zcy5vcmc+IDxodHRwOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuLyogZXNsaW50LWRpc2FibGUgbm8tcHJvdG8gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbnZhciBiYXNlNjQgPSByZXF1aXJlKCdiYXNlNjQtanMnKVxudmFyIGllZWU3NTQgPSByZXF1aXJlKCdpZWVlNzU0JylcbnZhciBpc0FycmF5ID0gcmVxdWlyZSgnaXNhcnJheScpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTIgLy8gbm90IHVzZWQgYnkgdGhpcyBpbXBsZW1lbnRhdGlvblxuXG52YXIgcm9vdFBhcmVudCA9IHt9XG5cbi8qKlxuICogSWYgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYDpcbiAqICAgPT09IHRydWUgICAgVXNlIFVpbnQ4QXJyYXkgaW1wbGVtZW50YXRpb24gKGZhc3Rlc3QpXG4gKiAgID09PSBmYWxzZSAgIFVzZSBPYmplY3QgaW1wbGVtZW50YXRpb24gKG1vc3QgY29tcGF0aWJsZSwgZXZlbiBJRTYpXG4gKlxuICogQnJvd3NlcnMgdGhhdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBhcmUgSUUgMTArLCBGaXJlZm94IDQrLCBDaHJvbWUgNyssIFNhZmFyaSA1LjErLFxuICogT3BlcmEgMTEuNissIGlPUyA0LjIrLlxuICpcbiAqIER1ZSB0byB2YXJpb3VzIGJyb3dzZXIgYnVncywgc29tZXRpbWVzIHRoZSBPYmplY3QgaW1wbGVtZW50YXRpb24gd2lsbCBiZSB1c2VkIGV2ZW5cbiAqIHdoZW4gdGhlIGJyb3dzZXIgc3VwcG9ydHMgdHlwZWQgYXJyYXlzLlxuICpcbiAqIE5vdGU6XG4gKlxuICogICAtIEZpcmVmb3ggNC0yOSBsYWNrcyBzdXBwb3J0IGZvciBhZGRpbmcgbmV3IHByb3BlcnRpZXMgdG8gYFVpbnQ4QXJyYXlgIGluc3RhbmNlcyxcbiAqICAgICBTZWU6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NTQzOC5cbiAqXG4gKiAgIC0gU2FmYXJpIDUtNyBsYWNrcyBzdXBwb3J0IGZvciBjaGFuZ2luZyB0aGUgYE9iamVjdC5wcm90b3R5cGUuY29uc3RydWN0b3JgIHByb3BlcnR5XG4gKiAgICAgb24gb2JqZWN0cy5cbiAqXG4gKiAgIC0gQ2hyb21lIDktMTAgaXMgbWlzc2luZyB0aGUgYFR5cGVkQXJyYXkucHJvdG90eXBlLnN1YmFycmF5YCBmdW5jdGlvbi5cbiAqXG4gKiAgIC0gSUUxMCBoYXMgYSBicm9rZW4gYFR5cGVkQXJyYXkucHJvdG90eXBlLnN1YmFycmF5YCBmdW5jdGlvbiB3aGljaCByZXR1cm5zIGFycmF5cyBvZlxuICogICAgIGluY29ycmVjdCBsZW5ndGggaW4gc29tZSBzaXR1YXRpb25zLlxuXG4gKiBXZSBkZXRlY3QgdGhlc2UgYnVnZ3kgYnJvd3NlcnMgYW5kIHNldCBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgIHRvIGBmYWxzZWAgc28gdGhleVxuICogZ2V0IHRoZSBPYmplY3QgaW1wbGVtZW50YXRpb24sIHdoaWNoIGlzIHNsb3dlciBidXQgYmVoYXZlcyBjb3JyZWN0bHkuXG4gKi9cbkJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUID0gZ2xvYmFsLlRZUEVEX0FSUkFZX1NVUFBPUlQgIT09IHVuZGVmaW5lZFxuICA/IGdsb2JhbC5UWVBFRF9BUlJBWV9TVVBQT1JUXG4gIDogdHlwZWRBcnJheVN1cHBvcnQoKVxuXG5mdW5jdGlvbiB0eXBlZEFycmF5U3VwcG9ydCAoKSB7XG4gIGZ1bmN0aW9uIEJhciAoKSB7fVxuICB0cnkge1xuICAgIHZhciBhcnIgPSBuZXcgVWludDhBcnJheSgxKVxuICAgIGFyci5mb28gPSBmdW5jdGlvbiAoKSB7IHJldHVybiA0MiB9XG4gICAgYXJyLmNvbnN0cnVjdG9yID0gQmFyXG4gICAgcmV0dXJuIGFyci5mb28oKSA9PT0gNDIgJiYgLy8gdHlwZWQgYXJyYXkgaW5zdGFuY2VzIGNhbiBiZSBhdWdtZW50ZWRcbiAgICAgICAgYXJyLmNvbnN0cnVjdG9yID09PSBCYXIgJiYgLy8gY29uc3RydWN0b3IgY2FuIGJlIHNldFxuICAgICAgICB0eXBlb2YgYXJyLnN1YmFycmF5ID09PSAnZnVuY3Rpb24nICYmIC8vIGNocm9tZSA5LTEwIGxhY2sgYHN1YmFycmF5YFxuICAgICAgICBhcnIuc3ViYXJyYXkoMSwgMSkuYnl0ZUxlbmd0aCA9PT0gMCAvLyBpZTEwIGhhcyBicm9rZW4gYHN1YmFycmF5YFxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuZnVuY3Rpb24ga01heExlbmd0aCAoKSB7XG4gIHJldHVybiBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVFxuICAgID8gMHg3ZmZmZmZmZlxuICAgIDogMHgzZmZmZmZmZlxufVxuXG4vKipcbiAqIENsYXNzOiBCdWZmZXJcbiAqID09PT09PT09PT09PT1cbiAqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGFyZSBhdWdtZW50ZWRcbiAqIHdpdGggZnVuY3Rpb24gcHJvcGVydGllcyBmb3IgYWxsIHRoZSBub2RlIGBCdWZmZXJgIEFQSSBmdW5jdGlvbnMuIFdlIHVzZVxuICogYFVpbnQ4QXJyYXlgIHNvIHRoYXQgc3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXQgcmV0dXJuc1xuICogYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogQnkgYXVnbWVudGluZyB0aGUgaW5zdGFuY2VzLCB3ZSBjYW4gYXZvaWQgbW9kaWZ5aW5nIHRoZSBgVWludDhBcnJheWBcbiAqIHByb3RvdHlwZS5cbiAqL1xuZnVuY3Rpb24gQnVmZmVyIChhcmcpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICAvLyBBdm9pZCBnb2luZyB0aHJvdWdoIGFuIEFyZ3VtZW50c0FkYXB0b3JUcmFtcG9saW5lIGluIHRoZSBjb21tb24gY2FzZS5cbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHJldHVybiBuZXcgQnVmZmVyKGFyZywgYXJndW1lbnRzWzFdKVxuICAgIHJldHVybiBuZXcgQnVmZmVyKGFyZylcbiAgfVxuXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzLmxlbmd0aCA9IDBcbiAgICB0aGlzLnBhcmVudCA9IHVuZGVmaW5lZFxuICB9XG5cbiAgLy8gQ29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykge1xuICAgIHJldHVybiBmcm9tTnVtYmVyKHRoaXMsIGFyZylcbiAgfVxuXG4gIC8vIFNsaWdodGx5IGxlc3MgY29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBmcm9tU3RyaW5nKHRoaXMsIGFyZywgYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiAndXRmOCcpXG4gIH1cblxuICAvLyBVbnVzdWFsLlxuICByZXR1cm4gZnJvbU9iamVjdCh0aGlzLCBhcmcpXG59XG5cbmZ1bmN0aW9uIGZyb21OdW1iZXIgKHRoYXQsIGxlbmd0aCkge1xuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoIDwgMCA/IDAgOiBjaGVja2VkKGxlbmd0aCkgfCAwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdGhhdFtpXSA9IDBcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbVN0cmluZyAodGhhdCwgc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJyB8fCBlbmNvZGluZyA9PT0gJycpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgLy8gQXNzdW1wdGlvbjogYnl0ZUxlbmd0aCgpIHJldHVybiB2YWx1ZSBpcyBhbHdheXMgPCBrTWF4TGVuZ3RoLlxuICB2YXIgbGVuZ3RoID0gYnl0ZUxlbmd0aChzdHJpbmcsIGVuY29kaW5nKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcblxuICB0aGF0LndyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21PYmplY3QgKHRoYXQsIG9iamVjdCkge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKG9iamVjdCkpIHJldHVybiBmcm9tQnVmZmVyKHRoYXQsIG9iamVjdClcblxuICBpZiAoaXNBcnJheShvYmplY3QpKSByZXR1cm4gZnJvbUFycmF5KHRoYXQsIG9iamVjdClcblxuICBpZiAob2JqZWN0ID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdtdXN0IHN0YXJ0IHdpdGggbnVtYmVyLCBidWZmZXIsIGFycmF5IG9yIHN0cmluZycpXG4gIH1cblxuICBpZiAodHlwZW9mIEFycmF5QnVmZmVyICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmIChvYmplY3QuYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgIHJldHVybiBmcm9tVHlwZWRBcnJheSh0aGF0LCBvYmplY3QpXG4gICAgfVxuICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgcmV0dXJuIGZyb21BcnJheUJ1ZmZlcih0aGF0LCBvYmplY3QpXG4gICAgfVxuICB9XG5cbiAgaWYgKG9iamVjdC5sZW5ndGgpIHJldHVybiBmcm9tQXJyYXlMaWtlKHRoYXQsIG9iamVjdClcblxuICByZXR1cm4gZnJvbUpzb25PYmplY3QodGhhdCwgb2JqZWN0KVxufVxuXG5mdW5jdGlvbiBmcm9tQnVmZmVyICh0aGF0LCBidWZmZXIpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYnVmZmVyLmxlbmd0aCkgfCAwXG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG4gIGJ1ZmZlci5jb3B5KHRoYXQsIDAsIDAsIGxlbmd0aClcbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5ICh0aGF0LCBhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuLy8gRHVwbGljYXRlIG9mIGZyb21BcnJheSgpIHRvIGtlZXAgZnJvbUFycmF5KCkgbW9ub21vcnBoaWMuXG5mdW5jdGlvbiBmcm9tVHlwZWRBcnJheSAodGhhdCwgYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcbiAgLy8gVHJ1bmNhdGluZyB0aGUgZWxlbWVudHMgaXMgcHJvYmFibHkgbm90IHdoYXQgcGVvcGxlIGV4cGVjdCBmcm9tIHR5cGVkXG4gIC8vIGFycmF5cyB3aXRoIEJZVEVTX1BFUl9FTEVNRU5UID4gMSBidXQgaXQncyBjb21wYXRpYmxlIHdpdGggdGhlIGJlaGF2aW9yXG4gIC8vIG9mIHRoZSBvbGQgQnVmZmVyIGNvbnN0cnVjdG9yLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5QnVmZmVyICh0aGF0LCBhcnJheSkge1xuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSwgZm9yIGJlc3QgcGVyZm9ybWFuY2VcbiAgICBhcnJheS5ieXRlTGVuZ3RoXG4gICAgdGhhdCA9IEJ1ZmZlci5fYXVnbWVudChuZXcgVWludDhBcnJheShhcnJheSkpXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBhbiBvYmplY3QgaW5zdGFuY2Ugb2YgdGhlIEJ1ZmZlciBjbGFzc1xuICAgIHRoYXQgPSBmcm9tVHlwZWRBcnJheSh0aGF0LCBuZXcgVWludDhBcnJheShhcnJheSkpXG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5TGlrZSAodGhhdCwgYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIHRoYXRbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbi8vIERlc2VyaWFsaXplIHsgdHlwZTogJ0J1ZmZlcicsIGRhdGE6IFsxLDIsMywuLi5dIH0gaW50byBhIEJ1ZmZlciBvYmplY3QuXG4vLyBSZXR1cm5zIGEgemVyby1sZW5ndGggYnVmZmVyIGZvciBpbnB1dHMgdGhhdCBkb24ndCBjb25mb3JtIHRvIHRoZSBzcGVjLlxuZnVuY3Rpb24gZnJvbUpzb25PYmplY3QgKHRoYXQsIG9iamVjdCkge1xuICB2YXIgYXJyYXlcbiAgdmFyIGxlbmd0aCA9IDBcblxuICBpZiAob2JqZWN0LnR5cGUgPT09ICdCdWZmZXInICYmIGlzQXJyYXkob2JqZWN0LmRhdGEpKSB7XG4gICAgYXJyYXkgPSBvYmplY3QuZGF0YVxuICAgIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgfVxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICB0aGF0W2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5pZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgQnVmZmVyLnByb3RvdHlwZS5fX3Byb3RvX18gPSBVaW50OEFycmF5LnByb3RvdHlwZVxuICBCdWZmZXIuX19wcm90b19fID0gVWludDhBcnJheVxufSBlbHNlIHtcbiAgLy8gcHJlLXNldCBmb3IgdmFsdWVzIHRoYXQgbWF5IGV4aXN0IGluIHRoZSBmdXR1cmVcbiAgQnVmZmVyLnByb3RvdHlwZS5sZW5ndGggPSB1bmRlZmluZWRcbiAgQnVmZmVyLnByb3RvdHlwZS5wYXJlbnQgPSB1bmRlZmluZWRcbn1cblxuZnVuY3Rpb24gYWxsb2NhdGUgKHRoYXQsIGxlbmd0aCkge1xuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSwgZm9yIGJlc3QgcGVyZm9ybWFuY2VcbiAgICB0aGF0ID0gQnVmZmVyLl9hdWdtZW50KG5ldyBVaW50OEFycmF5KGxlbmd0aCkpXG4gICAgdGhhdC5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBhbiBvYmplY3QgaW5zdGFuY2Ugb2YgdGhlIEJ1ZmZlciBjbGFzc1xuICAgIHRoYXQubGVuZ3RoID0gbGVuZ3RoXG4gICAgdGhhdC5faXNCdWZmZXIgPSB0cnVlXG4gIH1cblxuICB2YXIgZnJvbVBvb2wgPSBsZW5ndGggIT09IDAgJiYgbGVuZ3RoIDw9IEJ1ZmZlci5wb29sU2l6ZSA+Pj4gMVxuICBpZiAoZnJvbVBvb2wpIHRoYXQucGFyZW50ID0gcm9vdFBhcmVudFxuXG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGNoZWNrZWQgKGxlbmd0aCkge1xuICAvLyBOb3RlOiBjYW5ub3QgdXNlIGBsZW5ndGggPCBrTWF4TGVuZ3RoYCBoZXJlIGJlY2F1c2UgdGhhdCBmYWlscyB3aGVuXG4gIC8vIGxlbmd0aCBpcyBOYU4gKHdoaWNoIGlzIG90aGVyd2lzZSBjb2VyY2VkIHRvIHplcm8uKVxuICBpZiAobGVuZ3RoID49IGtNYXhMZW5ndGgoKSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIGFsbG9jYXRlIEJ1ZmZlciBsYXJnZXIgdGhhbiBtYXhpbXVtICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICdzaXplOiAweCcgKyBrTWF4TGVuZ3RoKCkudG9TdHJpbmcoMTYpICsgJyBieXRlcycpXG4gIH1cbiAgcmV0dXJuIGxlbmd0aCB8IDBcbn1cblxuZnVuY3Rpb24gU2xvd0J1ZmZlciAoc3ViamVjdCwgZW5jb2RpbmcpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFNsb3dCdWZmZXIpKSByZXR1cm4gbmV3IFNsb3dCdWZmZXIoc3ViamVjdCwgZW5jb2RpbmcpXG5cbiAgdmFyIGJ1ZiA9IG5ldyBCdWZmZXIoc3ViamVjdCwgZW5jb2RpbmcpXG4gIGRlbGV0ZSBidWYucGFyZW50XG4gIHJldHVybiBidWZcbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gaXNCdWZmZXIgKGIpIHtcbiAgcmV0dXJuICEhKGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlcilcbn1cblxuQnVmZmVyLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlIChhLCBiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGEpIHx8ICFCdWZmZXIuaXNCdWZmZXIoYikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgbXVzdCBiZSBCdWZmZXJzJylcbiAgfVxuXG4gIGlmIChhID09PSBiKSByZXR1cm4gMFxuXG4gIHZhciB4ID0gYS5sZW5ndGhcbiAgdmFyIHkgPSBiLmxlbmd0aFxuXG4gIHZhciBpID0gMFxuICB2YXIgbGVuID0gTWF0aC5taW4oeCwgeSlcbiAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkgYnJlYWtcblxuICAgICsraVxuICB9XG5cbiAgaWYgKGkgIT09IGxlbikge1xuICAgIHggPSBhW2ldXG4gICAgeSA9IGJbaV1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuQnVmZmVyLmlzRW5jb2RpbmcgPSBmdW5jdGlvbiBpc0VuY29kaW5nIChlbmNvZGluZykge1xuICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAncmF3JzpcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIGNvbmNhdCAobGlzdCwgbGVuZ3RoKSB7XG4gIGlmICghaXNBcnJheShsaXN0KSkgdGhyb3cgbmV3IFR5cGVFcnJvcignbGlzdCBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMuJylcblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcigwKVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmID0gbmV3IEJ1ZmZlcihsZW5ndGgpXG4gIHZhciBwb3MgPSAwXG4gIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBsaXN0W2ldXG4gICAgaXRlbS5jb3B5KGJ1ZiwgcG9zKVxuICAgIHBvcyArPSBpdGVtLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIHN0cmluZyAhPT0gJ3N0cmluZycpIHN0cmluZyA9ICcnICsgc3RyaW5nXG5cbiAgdmFyIGxlbiA9IHN0cmluZy5sZW5ndGhcbiAgaWYgKGxlbiA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBVc2UgYSBmb3IgbG9vcCB0byBhdm9pZCByZWN1cnNpb25cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAvLyBEZXByZWNhdGVkXG4gICAgICBjYXNlICdyYXcnOlxuICAgICAgY2FzZSAncmF3cyc6XG4gICAgICAgIHJldHVybiBsZW5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiBsZW4gKiAyXG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gbGVuID4+PiAxXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGggLy8gYXNzdW1lIHV0ZjhcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cbkJ1ZmZlci5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuXG5mdW5jdGlvbiBzbG93VG9TdHJpbmcgKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG5cbiAgc3RhcnQgPSBzdGFydCB8IDBcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgfHwgZW5kID09PSBJbmZpbml0eSA/IHRoaXMubGVuZ3RoIDogZW5kIHwgMFxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG4gIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmIChlbmQgPD0gc3RhcnQpIHJldHVybiAnJ1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGJpbmFyeVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdXRmMTZsZVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9IChlbmNvZGluZyArICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGggfCAwXG4gIGlmIChsZW5ndGggPT09IDApIHJldHVybiAnJ1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCAwLCBsZW5ndGgpXG4gIHJldHVybiBzbG93VG9TdHJpbmcuYXBwbHkodGhpcywgYXJndW1lbnRzKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIGVxdWFscyAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYikgPT09IDBcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gaW5zcGVjdCAoKSB7XG4gIHZhciBzdHIgPSAnJ1xuICB2YXIgbWF4ID0gZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFU1xuICBpZiAodGhpcy5sZW5ndGggPiAwKSB7XG4gICAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5tYXRjaCgvLnsyfS9nKS5qb2luKCcgJylcbiAgICBpZiAodGhpcy5sZW5ndGggPiBtYXgpIHN0ciArPSAnIC4uLiAnXG4gIH1cbiAgcmV0dXJuICc8QnVmZmVyICcgKyBzdHIgKyAnPidcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gMFxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYilcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gaW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0KSB7XG4gIGlmIChieXRlT2Zmc2V0ID4gMHg3ZmZmZmZmZikgYnl0ZU9mZnNldCA9IDB4N2ZmZmZmZmZcbiAgZWxzZSBpZiAoYnl0ZU9mZnNldCA8IC0weDgwMDAwMDAwKSBieXRlT2Zmc2V0ID0gLTB4ODAwMDAwMDBcbiAgYnl0ZU9mZnNldCA+Pj0gMFxuXG4gIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xXG4gIGlmIChieXRlT2Zmc2V0ID49IHRoaXMubGVuZ3RoKSByZXR1cm4gLTFcblxuICAvLyBOZWdhdGl2ZSBvZmZzZXRzIHN0YXJ0IGZyb20gdGhlIGVuZCBvZiB0aGUgYnVmZmVyXG4gIGlmIChieXRlT2Zmc2V0IDwgMCkgYnl0ZU9mZnNldCA9IE1hdGgubWF4KHRoaXMubGVuZ3RoICsgYnl0ZU9mZnNldCwgMClcblxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xIC8vIHNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nIGFsd2F5cyBmYWlsc1xuICAgIHJldHVybiBTdHJpbmcucHJvdG90eXBlLmluZGV4T2YuY2FsbCh0aGlzLCB2YWwsIGJ5dGVPZmZzZXQpXG4gIH1cbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcih2YWwpKSB7XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQpXG4gIH1cbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwodGhpcywgdmFsLCBieXRlT2Zmc2V0KVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKHRoaXMsIFsgdmFsIF0sIGJ5dGVPZmZzZXQpXG4gIH1cblxuICBmdW5jdGlvbiBhcnJheUluZGV4T2YgKGFyciwgdmFsLCBieXRlT2Zmc2V0KSB7XG4gICAgdmFyIGZvdW5kSW5kZXggPSAtMVxuICAgIGZvciAodmFyIGkgPSAwOyBieXRlT2Zmc2V0ICsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFycltieXRlT2Zmc2V0ICsgaV0gPT09IHZhbFtmb3VuZEluZGV4ID09PSAtMSA/IDAgOiBpIC0gZm91bmRJbmRleF0pIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggPT09IC0xKSBmb3VuZEluZGV4ID0gaVxuICAgICAgICBpZiAoaSAtIGZvdW5kSW5kZXggKyAxID09PSB2YWwubGVuZ3RoKSByZXR1cm4gYnl0ZU9mZnNldCArIGZvdW5kSW5kZXhcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvdW5kSW5kZXggPSAtMVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLTFcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbCBtdXN0IGJlIHN0cmluZywgbnVtYmVyIG9yIEJ1ZmZlcicpXG59XG5cbi8vIGBnZXRgIGlzIGRlcHJlY2F0ZWRcbkJ1ZmZlci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0IChvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5nZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLnJlYWRVSW50OChvZmZzZXQpXG59XG5cbi8vIGBzZXRgIGlzIGRlcHJlY2F0ZWRcbkJ1ZmZlci5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0ICh2LCBvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5zZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLndyaXRlVUludDgodiwgb2Zmc2V0KVxufVxuXG5mdW5jdGlvbiBoZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIC8vIG11c3QgYmUgYW4gZXZlbiBudW1iZXIgb2YgZGlnaXRzXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGlmIChzdHJMZW4gJSAyICE9PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaGV4IHN0cmluZycpXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHZhciBwYXJzZWQgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgaWYgKGlzTmFOKHBhcnNlZCkpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBoZXggc3RyaW5nJylcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSBwYXJzZWRcbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiB1dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBhc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYXNjaWlUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJpbmFyeVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGFzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGJhc2U2NFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gdWNzMldyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIHdyaXRlIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZykge1xuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nKVxuICBpZiAob2Zmc2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIG9mZnNldFssIGxlbmd0aF1bLCBlbmNvZGluZ10pXG4gIH0gZWxzZSBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgICBpZiAoaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgbGVuZ3RoID0gbGVuZ3RoIHwgMFxuICAgICAgaWYgKGVuY29kaW5nID09PSB1bmRlZmluZWQpIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgfSBlbHNlIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIC8vIGxlZ2FjeSB3cml0ZShzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXQsIGxlbmd0aCkgLSByZW1vdmUgaW4gdjAuMTNcbiAgfSBlbHNlIHtcbiAgICB2YXIgc3dhcCA9IGVuY29kaW5nXG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBvZmZzZXQgPSBsZW5ndGggfCAwXG4gICAgbGVuZ3RoID0gc3dhcFxuICB9XG5cbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPiByZW1haW5pbmcpIGxlbmd0aCA9IHJlbWFpbmluZ1xuXG4gIGlmICgoc3RyaW5nLmxlbmd0aCA+IDAgJiYgKGxlbmd0aCA8IDAgfHwgb2Zmc2V0IDwgMCkpIHx8IG9mZnNldCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2F0dGVtcHQgdG8gd3JpdGUgb3V0c2lkZSBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBiaW5hcnlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICAvLyBXYXJuaW5nOiBtYXhMZW5ndGggbm90IHRha2VuIGludG8gYWNjb3VudCBpbiBiYXNlNjRXcml0ZVxuICAgICAgICByZXR1cm4gYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHVjczJXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gYnVmLmxlbmd0aCkge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1Zi5zbGljZShzdGFydCwgZW5kKSlcbiAgfVxufVxuXG5mdW5jdGlvbiB1dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG4gIHZhciByZXMgPSBbXVxuXG4gIHZhciBpID0gc3RhcnRcbiAgd2hpbGUgKGkgPCBlbmQpIHtcbiAgICB2YXIgZmlyc3RCeXRlID0gYnVmW2ldXG4gICAgdmFyIGNvZGVQb2ludCA9IG51bGxcbiAgICB2YXIgYnl0ZXNQZXJTZXF1ZW5jZSA9IChmaXJzdEJ5dGUgPiAweEVGKSA/IDRcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4REYpID8gM1xuICAgICAgOiAoZmlyc3RCeXRlID4gMHhCRikgPyAyXG4gICAgICA6IDFcblxuICAgIGlmIChpICsgYnl0ZXNQZXJTZXF1ZW5jZSA8PSBlbmQpIHtcbiAgICAgIHZhciBzZWNvbmRCeXRlLCB0aGlyZEJ5dGUsIGZvdXJ0aEJ5dGUsIHRlbXBDb2RlUG9pbnRcblxuICAgICAgc3dpdGNoIChieXRlc1BlclNlcXVlbmNlKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBpZiAoZmlyc3RCeXRlIDwgMHg4MCkge1xuICAgICAgICAgICAgY29kZVBvaW50ID0gZmlyc3RCeXRlXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4MUYpIDw8IDB4NiB8IChzZWNvbmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3Rikge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweEMgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4NiB8ICh0aGlyZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGRiAmJiAodGVtcENvZGVQb2ludCA8IDB4RDgwMCB8fCB0ZW1wQ29kZVBvaW50ID4gMHhERkZGKSkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBmb3VydGhCeXRlID0gYnVmW2kgKyAzXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAoZm91cnRoQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHgxMiB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHhDIHwgKHRoaXJkQnl0ZSAmIDB4M0YpIDw8IDB4NiB8IChmb3VydGhCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHhGRkZGICYmIHRlbXBDb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb2RlUG9pbnQgPT09IG51bGwpIHtcbiAgICAgIC8vIHdlIGRpZCBub3QgZ2VuZXJhdGUgYSB2YWxpZCBjb2RlUG9pbnQgc28gaW5zZXJ0IGFcbiAgICAgIC8vIHJlcGxhY2VtZW50IGNoYXIgKFUrRkZGRCkgYW5kIGFkdmFuY2Ugb25seSAxIGJ5dGVcbiAgICAgIGNvZGVQb2ludCA9IDB4RkZGRFxuICAgICAgYnl0ZXNQZXJTZXF1ZW5jZSA9IDFcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA+IDB4RkZGRikge1xuICAgICAgLy8gZW5jb2RlIHRvIHV0ZjE2IChzdXJyb2dhdGUgcGFpciBkYW5jZSlcbiAgICAgIGNvZGVQb2ludCAtPSAweDEwMDAwXG4gICAgICByZXMucHVzaChjb2RlUG9pbnQgPj4+IDEwICYgMHgzRkYgfCAweEQ4MDApXG4gICAgICBjb2RlUG9pbnQgPSAweERDMDAgfCBjb2RlUG9pbnQgJiAweDNGRlxuICAgIH1cblxuICAgIHJlcy5wdXNoKGNvZGVQb2ludClcbiAgICBpICs9IGJ5dGVzUGVyU2VxdWVuY2VcbiAgfVxuXG4gIHJldHVybiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkocmVzKVxufVxuXG4vLyBCYXNlZCBvbiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMjc0NzI3Mi82ODA3NDIsIHRoZSBicm93c2VyIHdpdGhcbi8vIHRoZSBsb3dlc3QgbGltaXQgaXMgQ2hyb21lLCB3aXRoIDB4MTAwMDAgYXJncy5cbi8vIFdlIGdvIDEgbWFnbml0dWRlIGxlc3MsIGZvciBzYWZldHlcbnZhciBNQVhfQVJHVU1FTlRTX0xFTkdUSCA9IDB4MTAwMFxuXG5mdW5jdGlvbiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkgKGNvZGVQb2ludHMpIHtcbiAgdmFyIGxlbiA9IGNvZGVQb2ludHMubGVuZ3RoXG4gIGlmIChsZW4gPD0gTUFYX0FSR1VNRU5UU19MRU5HVEgpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNvZGVQb2ludHMpIC8vIGF2b2lkIGV4dHJhIHNsaWNlKClcbiAgfVxuXG4gIC8vIERlY29kZSBpbiBjaHVua3MgdG8gYXZvaWQgXCJjYWxsIHN0YWNrIHNpemUgZXhjZWVkZWRcIi5cbiAgdmFyIHJlcyA9ICcnXG4gIHZhciBpID0gMFxuICB3aGlsZSAoaSA8IGxlbikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFxuICAgICAgU3RyaW5nLFxuICAgICAgY29kZVBvaW50cy5zbGljZShpLCBpICs9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKVxuICAgIClcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldICYgMHg3RilcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGJpbmFyeVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGhleFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcblxuICBpZiAoIXN0YXJ0IHx8IHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmICghZW5kIHx8IGVuZCA8IDAgfHwgZW5kID4gbGVuKSBlbmQgPSBsZW5cblxuICB2YXIgb3V0ID0gJydcbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBvdXQgKz0gdG9IZXgoYnVmW2ldKVxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyBieXRlc1tpICsgMV0gKiAyNTYpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZlxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICBuZXdCdWYgPSBCdWZmZXIuX2F1Z21lbnQodGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSlcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2xpY2VMZW4gPSBlbmQgLSBzdGFydFxuICAgIG5ld0J1ZiA9IG5ldyBCdWZmZXIoc2xpY2VMZW4sIHVuZGVmaW5lZClcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWNlTGVuOyBpKyspIHtcbiAgICAgIG5ld0J1ZltpXSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfVxuXG4gIGlmIChuZXdCdWYubGVuZ3RoKSBuZXdCdWYucGFyZW50ID0gdGhpcy5wYXJlbnQgfHwgdGhpc1xuXG4gIHJldHVybiBuZXdCdWZcbn1cblxuLypcbiAqIE5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgYnVmZmVyIGlzbid0IHRyeWluZyB0byB3cml0ZSBvdXQgb2YgYm91bmRzLlxuICovXG5mdW5jdGlvbiBjaGVja09mZnNldCAob2Zmc2V0LCBleHQsIGxlbmd0aCkge1xuICBpZiAoKG9mZnNldCAlIDEpICE9PSAwIHx8IG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdvZmZzZXQgaXMgbm90IHVpbnQnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gbGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVHJ5aW5nIHRvIGFjY2VzcyBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRMRSA9IGZ1bmN0aW9uIHJlYWRVSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRCRSA9IGZ1bmN0aW9uIHJlYWRVSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG4gIH1cblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdXG4gIHZhciBtdWwgPSAxXG4gIHdoaWxlIChieXRlTGVuZ3RoID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiByZWFkVUludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiByZWFkVUludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgOCkgfCB0aGlzW29mZnNldCArIDFdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICgodGhpc1tvZmZzZXRdKSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikpICtcbiAgICAgICh0aGlzW29mZnNldCArIDNdICogMHgxMDAwMDAwKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdICogMHgxMDAwMDAwKSArXG4gICAgKCh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgIHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludExFID0gZnVuY3Rpb24gcmVhZEludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludEJFID0gZnVuY3Rpb24gcmVhZEludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoXG4gIHZhciBtdWwgPSAxXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0taV1cbiAgd2hpbGUgKGkgPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1pXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiByZWFkSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICBpZiAoISh0aGlzW29mZnNldF0gJiAweDgwKSkgcmV0dXJuICh0aGlzW29mZnNldF0pXG4gIHJldHVybiAoKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gcmVhZEludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIDFdIHwgKHRoaXNbb2Zmc2V0XSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbiByZWFkSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdKSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10gPDwgMjQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiByZWFkSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDI0KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiByZWFkRmxvYXRMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0QkUgPSBmdW5jdGlvbiByZWFkRmxvYXRCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gcmVhZERvdWJsZUJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgNTIsIDgpXG59XG5cbmZ1bmN0aW9uIGNoZWNrSW50IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignYnVmZmVyIG11c3QgYmUgYSBCdWZmZXIgaW5zdGFuY2UnKVxuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCd2YWx1ZSBpcyBvdXQgb2YgYm91bmRzJylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdpbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludExFID0gZnVuY3Rpb24gd3JpdGVVSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSwgMClcblxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludEJFID0gZnVuY3Rpb24gd3JpdGVVSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSwgMClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiB3cml0ZVVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4ZmYsIDApXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHZhbHVlID0gTWF0aC5mbG9vcih2YWx1ZSlcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuZnVuY3Rpb24gb2JqZWN0V3JpdGVVSW50MTYgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuKSB7XG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmICsgdmFsdWUgKyAxXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4oYnVmLmxlbmd0aCAtIG9mZnNldCwgMik7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSAodmFsdWUgJiAoMHhmZiA8PCAoOCAqIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpKSkpID4+PlxuICAgICAgKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkgKiA4XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuZnVuY3Rpb24gb2JqZWN0V3JpdGVVSW50MzIgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuKSB7XG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGJ1Zi5sZW5ndGggLSBvZmZzZXQsIDQpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID0gKHZhbHVlID4+PiAobGl0dGxlRW5kaWFuID8gaSA6IDMgLSBpKSAqIDgpICYgMHhmZlxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludExFID0gZnVuY3Rpb24gd3JpdGVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGggLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IDBcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IHZhbHVlIDwgMCA/IDEgOiAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gdmFsdWUgPCAwID8gMSA6IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uIHdyaXRlSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweDdmLCAtMHg4MClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkgdmFsdWUgPSBNYXRoLmZsb29yKHZhbHVlKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuZnVuY3Rpb24gY2hlY2tJRUVFNzU0IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndmFsdWUgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdpbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5mdW5jdGlvbiB3cml0ZUZsb2F0IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDQsIDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgsIC0zLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gd3JpdGVGbG9hdEJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDgsIDEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4LCAtMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG4gIHJldHVybiBvZmZzZXQgKyA4XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVMRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUJFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuLy8gY29weSh0YXJnZXRCdWZmZXIsIHRhcmdldFN0YXJ0PTAsIHNvdXJjZVN0YXJ0PTAsIHNvdXJjZUVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gY29weSAodGFyZ2V0LCB0YXJnZXRTdGFydCwgc3RhcnQsIGVuZCkge1xuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0U3RhcnQgPj0gdGFyZ2V0Lmxlbmd0aCkgdGFyZ2V0U3RhcnQgPSB0YXJnZXQubGVuZ3RoXG4gIGlmICghdGFyZ2V0U3RhcnQpIHRhcmdldFN0YXJ0ID0gMFxuICBpZiAoZW5kID4gMCAmJiBlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICAvLyBDb3B5IDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVybiAwXG4gIGlmICh0YXJnZXQubGVuZ3RoID09PSAwIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIEZhdGFsIGVycm9yIGNvbmRpdGlvbnNcbiAgaWYgKHRhcmdldFN0YXJ0IDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgfVxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlU3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChlbmQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlRW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIC8vIEFyZSB3ZSBvb2I/XG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCA8IGVuZCAtIHN0YXJ0KSB7XG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0ICsgc3RhcnRcbiAgfVxuXG4gIHZhciBsZW4gPSBlbmQgLSBzdGFydFxuICB2YXIgaVxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQgJiYgc3RhcnQgPCB0YXJnZXRTdGFydCAmJiB0YXJnZXRTdGFydCA8IGVuZCkge1xuICAgIC8vIGRlc2NlbmRpbmcgY29weSBmcm9tIGVuZFxuICAgIGZvciAoaSA9IGxlbiAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIGlmIChsZW4gPCAxMDAwIHx8ICFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIC8vIGFzY2VuZGluZyBjb3B5IGZyb20gc3RhcnRcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0U3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRhcmdldC5fc2V0KHRoaXMuc3ViYXJyYXkoc3RhcnQsIHN0YXJ0ICsgbGVuKSwgdGFyZ2V0U3RhcnQpXG4gIH1cblxuICByZXR1cm4gbGVuXG59XG5cbi8vIGZpbGwodmFsdWUsIHN0YXJ0PTAsIGVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gZmlsbCAodmFsdWUsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCF2YWx1ZSkgdmFsdWUgPSAwXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCkgZW5kID0gdGhpcy5sZW5ndGhcblxuICBpZiAoZW5kIDwgc3RhcnQpIHRocm93IG5ldyBSYW5nZUVycm9yKCdlbmQgPCBzdGFydCcpXG5cbiAgLy8gRmlsbCAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm5cbiAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChlbmQgPCAwIHx8IGVuZCA+IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignZW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIHZhciBpXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgdGhpc1tpXSA9IHZhbHVlXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBieXRlcyA9IHV0ZjhUb0J5dGVzKHZhbHVlLnRvU3RyaW5nKCkpXG4gICAgdmFyIGxlbiA9IGJ5dGVzLmxlbmd0aFxuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIHRoaXNbaV0gPSBieXRlc1tpICUgbGVuXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBgQXJyYXlCdWZmZXJgIHdpdGggdGhlICpjb3BpZWQqIG1lbW9yeSBvZiB0aGUgYnVmZmVyIGluc3RhbmNlLlxuICogQWRkZWQgaW4gTm9kZSAwLjEyLiBPbmx5IGF2YWlsYWJsZSBpbiBicm93c2VycyB0aGF0IHN1cHBvcnQgQXJyYXlCdWZmZXIuXG4gKi9cbkJ1ZmZlci5wcm90b3R5cGUudG9BcnJheUJ1ZmZlciA9IGZ1bmN0aW9uIHRvQXJyYXlCdWZmZXIgKCkge1xuICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgICByZXR1cm4gKG5ldyBCdWZmZXIodGhpcykpLmJ1ZmZlclxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5sZW5ndGgpXG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYnVmLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgIGJ1ZltpXSA9IHRoaXNbaV1cbiAgICAgIH1cbiAgICAgIHJldHVybiBidWYuYnVmZmVyXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0J1ZmZlci50b0FycmF5QnVmZmVyIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyJylcbiAgfVxufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbnZhciBCUCA9IEJ1ZmZlci5wcm90b3R5cGVcblxuLyoqXG4gKiBBdWdtZW50IGEgVWludDhBcnJheSAqaW5zdGFuY2UqIChub3QgdGhlIFVpbnQ4QXJyYXkgY2xhc3MhKSB3aXRoIEJ1ZmZlciBtZXRob2RzXG4gKi9cbkJ1ZmZlci5fYXVnbWVudCA9IGZ1bmN0aW9uIF9hdWdtZW50IChhcnIpIHtcbiAgYXJyLmNvbnN0cnVjdG9yID0gQnVmZmVyXG4gIGFyci5faXNCdWZmZXIgPSB0cnVlXG5cbiAgLy8gc2F2ZSByZWZlcmVuY2UgdG8gb3JpZ2luYWwgVWludDhBcnJheSBzZXQgbWV0aG9kIGJlZm9yZSBvdmVyd3JpdGluZ1xuICBhcnIuX3NldCA9IGFyci5zZXRcblxuICAvLyBkZXByZWNhdGVkXG4gIGFyci5nZXQgPSBCUC5nZXRcbiAgYXJyLnNldCA9IEJQLnNldFxuXG4gIGFyci53cml0ZSA9IEJQLndyaXRlXG4gIGFyci50b1N0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0xvY2FsZVN0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0pTT04gPSBCUC50b0pTT05cbiAgYXJyLmVxdWFscyA9IEJQLmVxdWFsc1xuICBhcnIuY29tcGFyZSA9IEJQLmNvbXBhcmVcbiAgYXJyLmluZGV4T2YgPSBCUC5pbmRleE9mXG4gIGFyci5jb3B5ID0gQlAuY29weVxuICBhcnIuc2xpY2UgPSBCUC5zbGljZVxuICBhcnIucmVhZFVJbnRMRSA9IEJQLnJlYWRVSW50TEVcbiAgYXJyLnJlYWRVSW50QkUgPSBCUC5yZWFkVUludEJFXG4gIGFyci5yZWFkVUludDggPSBCUC5yZWFkVUludDhcbiAgYXJyLnJlYWRVSW50MTZMRSA9IEJQLnJlYWRVSW50MTZMRVxuICBhcnIucmVhZFVJbnQxNkJFID0gQlAucmVhZFVJbnQxNkJFXG4gIGFyci5yZWFkVUludDMyTEUgPSBCUC5yZWFkVUludDMyTEVcbiAgYXJyLnJlYWRVSW50MzJCRSA9IEJQLnJlYWRVSW50MzJCRVxuICBhcnIucmVhZEludExFID0gQlAucmVhZEludExFXG4gIGFyci5yZWFkSW50QkUgPSBCUC5yZWFkSW50QkVcbiAgYXJyLnJlYWRJbnQ4ID0gQlAucmVhZEludDhcbiAgYXJyLnJlYWRJbnQxNkxFID0gQlAucmVhZEludDE2TEVcbiAgYXJyLnJlYWRJbnQxNkJFID0gQlAucmVhZEludDE2QkVcbiAgYXJyLnJlYWRJbnQzMkxFID0gQlAucmVhZEludDMyTEVcbiAgYXJyLnJlYWRJbnQzMkJFID0gQlAucmVhZEludDMyQkVcbiAgYXJyLnJlYWRGbG9hdExFID0gQlAucmVhZEZsb2F0TEVcbiAgYXJyLnJlYWRGbG9hdEJFID0gQlAucmVhZEZsb2F0QkVcbiAgYXJyLnJlYWREb3VibGVMRSA9IEJQLnJlYWREb3VibGVMRVxuICBhcnIucmVhZERvdWJsZUJFID0gQlAucmVhZERvdWJsZUJFXG4gIGFyci53cml0ZVVJbnQ4ID0gQlAud3JpdGVVSW50OFxuICBhcnIud3JpdGVVSW50TEUgPSBCUC53cml0ZVVJbnRMRVxuICBhcnIud3JpdGVVSW50QkUgPSBCUC53cml0ZVVJbnRCRVxuICBhcnIud3JpdGVVSW50MTZMRSA9IEJQLndyaXRlVUludDE2TEVcbiAgYXJyLndyaXRlVUludDE2QkUgPSBCUC53cml0ZVVJbnQxNkJFXG4gIGFyci53cml0ZVVJbnQzMkxFID0gQlAud3JpdGVVSW50MzJMRVxuICBhcnIud3JpdGVVSW50MzJCRSA9IEJQLndyaXRlVUludDMyQkVcbiAgYXJyLndyaXRlSW50TEUgPSBCUC53cml0ZUludExFXG4gIGFyci53cml0ZUludEJFID0gQlAud3JpdGVJbnRCRVxuICBhcnIud3JpdGVJbnQ4ID0gQlAud3JpdGVJbnQ4XG4gIGFyci53cml0ZUludDE2TEUgPSBCUC53cml0ZUludDE2TEVcbiAgYXJyLndyaXRlSW50MTZCRSA9IEJQLndyaXRlSW50MTZCRVxuICBhcnIud3JpdGVJbnQzMkxFID0gQlAud3JpdGVJbnQzMkxFXG4gIGFyci53cml0ZUludDMyQkUgPSBCUC53cml0ZUludDMyQkVcbiAgYXJyLndyaXRlRmxvYXRMRSA9IEJQLndyaXRlRmxvYXRMRVxuICBhcnIud3JpdGVGbG9hdEJFID0gQlAud3JpdGVGbG9hdEJFXG4gIGFyci53cml0ZURvdWJsZUxFID0gQlAud3JpdGVEb3VibGVMRVxuICBhcnIud3JpdGVEb3VibGVCRSA9IEJQLndyaXRlRG91YmxlQkVcbiAgYXJyLmZpbGwgPSBCUC5maWxsXG4gIGFyci5pbnNwZWN0ID0gQlAuaW5zcGVjdFxuICBhcnIudG9BcnJheUJ1ZmZlciA9IEJQLnRvQXJyYXlCdWZmZXJcblxuICByZXR1cm4gYXJyXG59XG5cbnZhciBJTlZBTElEX0JBU0U2NF9SRSA9IC9bXitcXC8wLTlBLVphLXotX10vZ1xuXG5mdW5jdGlvbiBiYXNlNjRjbGVhbiAoc3RyKSB7XG4gIC8vIE5vZGUgc3RyaXBzIG91dCBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSBcXG4gYW5kIFxcdCBmcm9tIHRoZSBzdHJpbmcsIGJhc2U2NC1qcyBkb2VzIG5vdFxuICBzdHIgPSBzdHJpbmd0cmltKHN0cikucmVwbGFjZShJTlZBTElEX0JBU0U2NF9SRSwgJycpXG4gIC8vIE5vZGUgY29udmVydHMgc3RyaW5ncyB3aXRoIGxlbmd0aCA8IDIgdG8gJydcbiAgaWYgKHN0ci5sZW5ndGggPCAyKSByZXR1cm4gJydcbiAgLy8gTm9kZSBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgYmFzZTY0IHN0cmluZ3MgKG1pc3NpbmcgdHJhaWxpbmcgPT09KSwgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHdoaWxlIChzdHIubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgIHN0ciA9IHN0ciArICc9J1xuICB9XG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gc3RyaW5ndHJpbSAoc3RyKSB7XG4gIGlmIChzdHIudHJpbSkgcmV0dXJuIHN0ci50cmltKClcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJylcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyaW5nLCB1bml0cykge1xuICB1bml0cyA9IHVuaXRzIHx8IEluZmluaXR5XG4gIHZhciBjb2RlUG9pbnRcbiAgdmFyIGxlbmd0aCA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIGxlYWRTdXJyb2dhdGUgPSBudWxsXG4gIHZhciBieXRlcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGNvZGVQb2ludCA9IHN0cmluZy5jaGFyQ29kZUF0KGkpXG5cbiAgICAvLyBpcyBzdXJyb2dhdGUgY29tcG9uZW50XG4gICAgaWYgKGNvZGVQb2ludCA+IDB4RDdGRiAmJiBjb2RlUG9pbnQgPCAweEUwMDApIHtcbiAgICAgIC8vIGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoIWxlYWRTdXJyb2dhdGUpIHtcbiAgICAgICAgLy8gbm8gbGVhZCB5ZXRcbiAgICAgICAgaWYgKGNvZGVQb2ludCA+IDB4REJGRikge1xuICAgICAgICAgIC8vIHVuZXhwZWN0ZWQgdHJhaWxcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKGkgKyAxID09PSBsZW5ndGgpIHtcbiAgICAgICAgICAvLyB1bnBhaXJlZCBsZWFkXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhbGlkIGxlYWRcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIDIgbGVhZHMgaW4gYSByb3dcbiAgICAgIGlmIChjb2RlUG9pbnQgPCAweERDMDApIHtcbiAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gdmFsaWQgc3Vycm9nYXRlIHBhaXJcbiAgICAgIGNvZGVQb2ludCA9IChsZWFkU3Vycm9nYXRlIC0gMHhEODAwIDw8IDEwIHwgY29kZVBvaW50IC0gMHhEQzAwKSArIDB4MTAwMDBcbiAgICB9IGVsc2UgaWYgKGxlYWRTdXJyb2dhdGUpIHtcbiAgICAgIC8vIHZhbGlkIGJtcCBjaGFyLCBidXQgbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgIH1cblxuICAgIGxlYWRTdXJyb2dhdGUgPSBudWxsXG5cbiAgICAvLyBlbmNvZGUgdXRmOFxuICAgIGlmIChjb2RlUG9pbnQgPCAweDgwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDEpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goY29kZVBvaW50KVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHg4MDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiB8IDB4QzAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDMpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgfCAweEUwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSA0KSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHgxMiB8IDB4RjAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29kZSBwb2ludCcpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIC8vIE5vZGUncyBjb2RlIHNlZW1zIHRvIGJlIGRvaW5nIHRoaXMgYW5kIG5vdCAmIDB4N0YuLlxuICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpICYgMHhGRilcbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVUb0J5dGVzIChzdHIsIHVuaXRzKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG5cbiAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBoaSA9IGMgPj4gOFxuICAgIGxvID0gYyAlIDI1NlxuICAgIGJ5dGVBcnJheS5wdXNoKGxvKVxuICAgIGJ5dGVBcnJheS5wdXNoKGhpKVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBiYXNlNjRUb0J5dGVzIChzdHIpIHtcbiAgcmV0dXJuIGJhc2U2NC50b0J5dGVBcnJheShiYXNlNjRjbGVhbihzdHIpKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSkgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuIiwidmFyIGxvb2t1cCA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJztcblxuOyhmdW5jdGlvbiAoZXhwb3J0cykge1xuXHQndXNlIHN0cmljdCc7XG5cbiAgdmFyIEFyciA9ICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgPyBVaW50OEFycmF5XG4gICAgOiBBcnJheVxuXG5cdHZhciBQTFVTICAgPSAnKycuY2hhckNvZGVBdCgwKVxuXHR2YXIgU0xBU0ggID0gJy8nLmNoYXJDb2RlQXQoMClcblx0dmFyIE5VTUJFUiA9ICcwJy5jaGFyQ29kZUF0KDApXG5cdHZhciBMT1dFUiAgPSAnYScuY2hhckNvZGVBdCgwKVxuXHR2YXIgVVBQRVIgID0gJ0EnLmNoYXJDb2RlQXQoMClcblx0dmFyIFBMVVNfVVJMX1NBRkUgPSAnLScuY2hhckNvZGVBdCgwKVxuXHR2YXIgU0xBU0hfVVJMX1NBRkUgPSAnXycuY2hhckNvZGVBdCgwKVxuXG5cdGZ1bmN0aW9uIGRlY29kZSAoZWx0KSB7XG5cdFx0dmFyIGNvZGUgPSBlbHQuY2hhckNvZGVBdCgwKVxuXHRcdGlmIChjb2RlID09PSBQTFVTIHx8XG5cdFx0ICAgIGNvZGUgPT09IFBMVVNfVVJMX1NBRkUpXG5cdFx0XHRyZXR1cm4gNjIgLy8gJysnXG5cdFx0aWYgKGNvZGUgPT09IFNMQVNIIHx8XG5cdFx0ICAgIGNvZGUgPT09IFNMQVNIX1VSTF9TQUZFKVxuXHRcdFx0cmV0dXJuIDYzIC8vICcvJ1xuXHRcdGlmIChjb2RlIDwgTlVNQkVSKVxuXHRcdFx0cmV0dXJuIC0xIC8vbm8gbWF0Y2hcblx0XHRpZiAoY29kZSA8IE5VTUJFUiArIDEwKVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBOVU1CRVIgKyAyNiArIDI2XG5cdFx0aWYgKGNvZGUgPCBVUFBFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBVUFBFUlxuXHRcdGlmIChjb2RlIDwgTE9XRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gTE9XRVIgKyAyNlxuXHR9XG5cblx0ZnVuY3Rpb24gYjY0VG9CeXRlQXJyYXkgKGI2NCkge1xuXHRcdHZhciBpLCBqLCBsLCB0bXAsIHBsYWNlSG9sZGVycywgYXJyXG5cblx0XHRpZiAoYjY0Lmxlbmd0aCAlIDQgPiAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuXHRcdH1cblxuXHRcdC8vIHRoZSBudW1iZXIgb2YgZXF1YWwgc2lnbnMgKHBsYWNlIGhvbGRlcnMpXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHR3byBwbGFjZWhvbGRlcnMsIHRoYW4gdGhlIHR3byBjaGFyYWN0ZXJzIGJlZm9yZSBpdFxuXHRcdC8vIHJlcHJlc2VudCBvbmUgYnl0ZVxuXHRcdC8vIGlmIHRoZXJlIGlzIG9ubHkgb25lLCB0aGVuIHRoZSB0aHJlZSBjaGFyYWN0ZXJzIGJlZm9yZSBpdCByZXByZXNlbnQgMiBieXRlc1xuXHRcdC8vIHRoaXMgaXMganVzdCBhIGNoZWFwIGhhY2sgdG8gbm90IGRvIGluZGV4T2YgdHdpY2Vcblx0XHR2YXIgbGVuID0gYjY0Lmxlbmd0aFxuXHRcdHBsYWNlSG9sZGVycyA9ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAyKSA/IDIgOiAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMSkgPyAxIDogMFxuXG5cdFx0Ly8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5cdFx0YXJyID0gbmV3IEFycihiNjQubGVuZ3RoICogMyAvIDQgLSBwbGFjZUhvbGRlcnMpXG5cblx0XHQvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG5cdFx0bCA9IHBsYWNlSG9sZGVycyA+IDAgPyBiNjQubGVuZ3RoIC0gNCA6IGI2NC5sZW5ndGhcblxuXHRcdHZhciBMID0gMFxuXG5cdFx0ZnVuY3Rpb24gcHVzaCAodikge1xuXHRcdFx0YXJyW0wrK10gPSB2XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gMCwgaiA9IDA7IGkgPCBsOyBpICs9IDQsIGogKz0gMykge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxOCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCAxMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA8PCA2KSB8IGRlY29kZShiNjQuY2hhckF0KGkgKyAzKSlcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMDAwKSA+PiAxNilcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMCkgPj4gOClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRpZiAocGxhY2VIb2xkZXJzID09PSAyKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPj4gNClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9IGVsc2UgaWYgKHBsYWNlSG9sZGVycyA9PT0gMSkge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxMCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCA0KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpID4+IDIpXG5cdFx0XHRwdXNoKCh0bXAgPj4gOCkgJiAweEZGKVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdHJldHVybiBhcnJcblx0fVxuXG5cdGZ1bmN0aW9uIHVpbnQ4VG9CYXNlNjQgKHVpbnQ4KSB7XG5cdFx0dmFyIGksXG5cdFx0XHRleHRyYUJ5dGVzID0gdWludDgubGVuZ3RoICUgMywgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcblx0XHRcdG91dHB1dCA9IFwiXCIsXG5cdFx0XHR0ZW1wLCBsZW5ndGhcblxuXHRcdGZ1bmN0aW9uIGVuY29kZSAobnVtKSB7XG5cdFx0XHRyZXR1cm4gbG9va3VwLmNoYXJBdChudW0pXG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcblx0XHRcdHJldHVybiBlbmNvZGUobnVtID4+IDE4ICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDEyICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDYgJiAweDNGKSArIGVuY29kZShudW0gJiAweDNGKVxuXHRcdH1cblxuXHRcdC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcblx0XHRmb3IgKGkgPSAwLCBsZW5ndGggPSB1aW50OC5sZW5ndGggLSBleHRyYUJ5dGVzOyBpIDwgbGVuZ3RoOyBpICs9IDMpIHtcblx0XHRcdHRlbXAgPSAodWludDhbaV0gPDwgMTYpICsgKHVpbnQ4W2kgKyAxXSA8PCA4KSArICh1aW50OFtpICsgMl0pXG5cdFx0XHRvdXRwdXQgKz0gdHJpcGxldFRvQmFzZTY0KHRlbXApXG5cdFx0fVxuXG5cdFx0Ly8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuXHRcdHN3aXRjaCAoZXh0cmFCeXRlcykge1xuXHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHR0ZW1wID0gdWludDhbdWludDgubGVuZ3RoIC0gMV1cblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDIpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz09J1xuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSAyOlxuXHRcdFx0XHR0ZW1wID0gKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDJdIDw8IDgpICsgKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMTApXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPj4gNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDIpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9J1xuXHRcdFx0XHRicmVha1xuXHRcdH1cblxuXHRcdHJldHVybiBvdXRwdXRcblx0fVxuXG5cdGV4cG9ydHMudG9CeXRlQXJyYXkgPSBiNjRUb0J5dGVBcnJheVxuXHRleHBvcnRzLmZyb21CeXRlQXJyYXkgPSB1aW50OFRvQmFzZTY0XG59KHR5cGVvZiBleHBvcnRzID09PSAndW5kZWZpbmVkJyA/ICh0aGlzLmJhc2U2NGpzID0ge30pIDogZXhwb3J0cykpXG4iLCJleHBvcnRzLnJlYWQgPSBmdW5jdGlvbiAoYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbVxuICB2YXIgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIG5CaXRzID0gLTdcbiAgdmFyIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMFxuICB2YXIgZCA9IGlzTEUgPyAtMSA6IDFcbiAgdmFyIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV1cblxuICBpICs9IGRcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBzID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBlTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSBlICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgZSA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gbUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gbSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhc1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSlcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pXG4gICAgZSA9IGUgLSBlQmlhc1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pXG59XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbiAoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGNcbiAgdmFyIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMClcbiAgdmFyIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKVxuICB2YXIgZCA9IGlzTEUgPyAxIDogLTFcbiAgdmFyIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDBcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKVxuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwXG4gICAgZSA9IGVNYXhcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMilcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS1cbiAgICAgIGMgKj0gMlxuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gY1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcylcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKytcbiAgICAgIGMgLz0gMlxuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDBcbiAgICAgIGUgPSBlTWF4XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICh2YWx1ZSAqIGMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gZSArIGVCaWFzXG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IDBcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KSB7fVxuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG1cbiAgZUxlbiArPSBtTGVuXG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCkge31cblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjhcbn1cbiIsInZhciB0b1N0cmluZyA9IHt9LnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKGFycikge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChhcnIpID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBSZWZsdXguY3JlYXRlQWN0aW9ucyhcbiAgW1wiZ2V0Q291cnNlSW5mb1wiXVxuKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZUFjdGlvbnMoXG4gIFtcImNyZWF0ZVRvYXN0XCJdXG4pOyIsIm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZUFjdGlvbnMoXG4gIFtcbiAgXCJ1cGRhdGVDb3Vyc2VzXCIsXG4gIFwidXBkYXRlUHJlZmVyZW5jZXNcIixcbiAgXCJsb2FkUHJlc2V0VGltZXRhYmxlXCIsXG4gIFwic2V0U2Nob29sXCIsXG4gIFwic2V0Q291cnNlc0xvYWRpbmdcIixcbiAgXCJzZXRDb3Vyc2VzRG9uZUxvYWRpbmdcIixcbiAgXCJzZXRDdXJyZW50SW5kZXhcIixcbiAgXVxuKTtcbiIsInZhciBSb290ID0gcmVxdWlyZSgnLi9yb290Jyk7XG52YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcycpO1xuX1NFTUVTVEVSID0gXCJTXCI7XG5cbnZhciBkYXRhID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnN1YnN0cmluZygxKTsgLy8gbG9hZGluZyB0aW1ldGFibGUgZGF0YSBmcm9tIHVybFxuaWYgKCFkYXRhICYmIHR5cGVvZihTdG9yYWdlKSAhPT0gXCJ1bmRlZmluZWRcIikgeyAvLyBkaWRuJ3QgZmluZCBpbiBVUkwsIHRyeSBsb2NhbCBzdG9yYWdlXG4gICAgZGF0YSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdkYXRhJyk7XG59IFxuXG5SZWFjdERPTS5yZW5kZXIoXG4gIDxSb290IGRhdGE9e2RhdGF9Lz4sXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlJylcbik7XG5cblxuXG5cbmlmIChkYXRhKSB7XG5cdFRpbWV0YWJsZUFjdGlvbnMubG9hZFByZXNldFRpbWV0YWJsZShkYXRhKTtcbn1cbiIsInZhciBTZWFyY2hCYXIgPSByZXF1aXJlKCcuL3NlYXJjaF9iYXInKTtcbnZhciBQcmVmZXJlbmNlTWVudSA9IHJlcXVpcmUoJy4vcHJlZmVyZW5jZV9tZW51Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJjb250cm9sLWJhclwiPlxuICAgICAgICA8ZGl2IGlkPVwic2VhcmNoLWJhci1jb250YWluZXJcIj5cbiAgICAgICAgICA8U2VhcmNoQmFyIHRvZ2dsZU1vZGFsPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsfSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPFByZWZlcmVuY2VNZW51IC8+XG4gICAgICA8L2Rpdj5cblxuICAgICk7XG4gIH0sXG59KTtcbiIsInZhciBFdmFsdWF0aW9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjbGFzc2VzID0gdGhpcy5wcm9wcy5zZWxlY3RlZCA/IFwiZXZhbC1pdGVtIHNlbGVjdGVkXCIgOiBcImV2YWwtaXRlbVwiXG5cdFx0dmFyIGRldGFpbHMgPSAhdGhpcy5wcm9wcy5zZWxlY3RlZCA/IG51bGwgOiAoXG5cdFx0XHQ8ZGl2IGlkPVwiZGV0YWlsc1wiPnt0aGlzLnByb3BzLmV2YWxfZGF0YS5zdW1tYXJ5LnJlcGxhY2UoL1xcdTAwYTAvZywgXCIgXCIpfTwvZGl2PlxuXHRcdFx0KVxuXHRcdHZhciBwcm9mID0gIXRoaXMucHJvcHMuc2VsZWN0ZWQgPyBudWxsIDogKFxuXHRcdFx0PGRpdiBpZD1cInByb2ZcIj5Qcm9mZXNzb3I6IHt0aGlzLnByb3BzLmV2YWxfZGF0YS5wcm9mZXNzb3J9PC9kaXY+XG5cdFx0XHQpXG5cdFx0cmV0dXJuIChcblx0XHQ8ZGl2IGNsYXNzTmFtZT17Y2xhc3Nlc30gb25DbGljaz17dGhpcy5wcm9wcy5zZWxlY3Rpb25DYWxsYmFja30gPlxuXHRcdFx0PGRpdiBpZD1cImV2YWwtd3JhcHBlclwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInllYXJcIj57dGhpcy5wcm9wcy5ldmFsX2RhdGEueWVhcn08L2Rpdj5cblx0XHRcdFx0e3Byb2Z9XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicmF0aW5nLXdyYXBwZXJcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInN0YXItcmF0aW5ncy1zcHJpdGVcIj5cblx0XHRcdFx0XHRcdDxzcGFuIHN0eWxlPXt7d2lkdGg6IDEwMCp0aGlzLnByb3BzLmV2YWxfZGF0YS5zY29yZS81ICsgXCIlXCJ9fSBjbGFzc05hbWU9XCJyYXRpbmdcIj48L3NwYW4+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJudW1lcmljLXJhdGluZ1wiPntcIihcIiArIHRoaXMucHJvcHMuZXZhbF9kYXRhLnNjb3JlICsgXCIpXCJ9PC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0XHR7ZGV0YWlsc31cblx0XHQ8L2Rpdj4pO1xuXHR9LFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0aW5kZXhfc2VsZWN0ZWQ6IG51bGxcblx0XHR9O1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGkgPSAwO1xuXHRcdHZhciBldmFscyA9IHRoaXMucHJvcHMuZXZhbF9pbmZvLm1hcChmdW5jdGlvbihlKSB7XG5cdFx0XHRpKys7XG5cdFx0XHR2YXIgc2VsZWN0ZWQgPSBpID09IHRoaXMuc3RhdGUuaW5kZXhfc2VsZWN0ZWQ7XG5cdFx0XHRyZXR1cm4gKDxFdmFsdWF0aW9uIGV2YWxfZGF0YT17ZX0ga2V5PXtlLmlkfSBzZWxlY3Rpb25DYWxsYmFjaz17dGhpcy5jaGFuZ2VTZWxlY3RlZChpKX0gc2VsZWN0ZWQ9e3NlbGVjdGVkfSAvPik7XG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0XHR2YXIgY2xpY2tfbm90aWNlID0gdGhpcy5wcm9wcy5ldmFsX2luZm8ubGVuZ3RoID09IDAgPyAoPGRpdiBpZD1cImVtcHR5LWludHJvXCI+Tm8gY291cnNlIGV2YWx1YXRpb25zIGZvciB0aGlzIGNvdXJzZSB5ZXQ8L2Rpdj4pIDogKDxkaXYgaWQ9XCJjbGljay1pbnRyb1wiPkNsaWNrIGFuIGV2YWx1YXRpb24gaXRlbSBhYm92ZSB0byByZWFkIHRoZSBjb21tZW50czwvZGl2Pik7XG5cdFx0cmV0dXJuIChcblx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWVudHJ5XCIgaWQ9XCJjb3Vyc2UtZXZhbHVhdGlvbnNcIj5cblx0XHRcdDxoNj5Db3Vyc2UgRXZhbHVhdGlvbnM6PC9oNj5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZXZhbC13cmFwcGVyXCI+XG5cdFx0XHRcdHtldmFsc31cblx0XHRcdDwvZGl2PlxuXHRcdFx0e2NsaWNrX25vdGljZX1cblx0XHQ8L2Rpdj4pO1xuXHR9LFxuXG5cdGNoYW5nZVNlbGVjdGVkOiBmdW5jdGlvbihlX2luZGV4KSB7XG5cdFx0cmV0dXJuIChmdW5jdGlvbigpIHtcblx0XHRcdGlmICh0aGlzLnN0YXRlLmluZGV4X3NlbGVjdGVkID09IGVfaW5kZXgpIFxuXHRcdFx0XHR0aGlzLnNldFN0YXRlKHtpbmRleF9zZWxlY3RlZDogbnVsbH0pO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHR0aGlzLnNldFN0YXRlKHtpbmRleF9zZWxlY3RlZDogZV9pbmRleH0pO1xuXHRcdH0uYmluZCh0aGlzKSk7XG5cdH1cbn0pOyIsIm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgaWQ9XCJsb2FkXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlLWdyaWRcIj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlMVwiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmUyXCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTNcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlNFwiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmU1XCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTZcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlN1wiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmU4XCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTlcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2Pik7XG5cdH0sXG59KTtcblxuIiwidmFyIExvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyJyk7XG52YXIgQ291cnNlSW5mb1N0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvY291cnNlX2luZm8nKTtcbnZhciBFdmFsdWF0aW9uTWFuYWdlciA9IHJlcXVpcmUoJy4vZXZhbHVhdGlvbnMuanN4Jyk7XG52YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFVwZGF0ZVRpbWV0YWJsZXNTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgQ291cnNlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy9jb3Vyc2VfYWN0aW9ucycpO1xudmFyIFNlY3Rpb25TbG90ID0gcmVxdWlyZSgnLi9zZWN0aW9uX3Nsb3QuanN4JylcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdG1peGluczogW1JlZmx1eC5jb25uZWN0KENvdXJzZUluZm9TdG9yZSldLFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGxvYWRpbmcgPSB0aGlzLnN0YXRlLmluZm9fbG9hZGluZztcblx0XHR2YXIgbG9hZGVyID0gbG9hZGluZyA/IDxMb2FkZXIgLz4gOiBudWxsO1xuXHRcdHZhciBoZWFkZXIgPSBsb2FkaW5nID8gbnVsbCA6IHRoaXMuZ2V0SGVhZGVyKCk7XG5cdFx0dmFyIGRlc2NyaXB0aW9uID0gbG9hZGluZyA/IG51bGwgOiB0aGlzLmdldERlc2NyaXB0aW9uKCk7XG5cdFx0dmFyIGV2YWx1YXRpb25zID0gbG9hZGluZyA/IG51bGwgOiB0aGlzLmdldEV2YWx1YXRpb25zKCk7XG5cdFx0dmFyIHJlY29tZW5kYXRpb25zID0gbG9hZGluZyA/IG51bGwgOiB0aGlzLmdldFJlY29tZW5kYXRpb25zKCk7XG5cdFx0dmFyIHRleHRib29rcyA9IGxvYWRpbmcgPyBudWxsIDogdGhpcy5nZXRUZXh0Ym9va3MoKTtcblx0XHR2YXIgc2VjdGlvbnMgPSBsb2FkaW5nID8gbnVsbCA6IHRoaXMuZ2V0U2VjdGlvbnMoKTtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBpZD1cIm1vZGFsLWNvbnRlbnRcIj5cblx0XHRcdFx0PGkgY2xhc3NOYW1lPVwicmlnaHQgZmEgZmEtMnggZmEtdGltZXMgY2xvc2UtY291cnNlLW1vZGFsXCIgb25DbGljaz17dGhpcy5wcm9wcy5oaWRlfT48L2k+XG4gICAgICAgICAgICAgICAge2xvYWRlcn1cbiAgICAgICAgICAgICAgICB7aGVhZGVyfVxuICAgICAgICAgICAgICAgIHtkZXNjcmlwdGlvbn1cbiAgICAgICAgICAgICAgICB7ZXZhbHVhdGlvbnN9XG4gICAgICAgICAgICAgICAge3NlY3Rpb25zfVxuICAgICAgICAgICAgICAgIHt0ZXh0Ym9va3N9XG4gICAgICAgICAgICAgICAge3JlY29tZW5kYXRpb25zfVxuICAgICAgICAgICAgPC9kaXY+KTtcblx0fSxcblxuXHRnZXRIZWFkZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjb3Vyc2VfaWQgPSB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLmlkO1xuXHRcdHZhciBjX3RvX3MgPSB0aGlzLnByb3BzLmNvdXJzZXNfdG9fc2VjdGlvbnM7XG5cdFx0dmFyIGFkZF9vcl9yZW1vdmUgPSBPYmplY3Qua2V5cyhjX3RvX3MpLmluZGV4T2YoU3RyaW5nKGNvdXJzZV9pZCkpID4gLTEgP1xuXHRcdCg8c3BhbiBjbGFzc05hbWU9XCJjb3Vyc2UtYWN0aW9uIGZ1aS1jaGVja1wiIG9uQ2xpY2s9e3RoaXMudG9nZ2xlQ291cnNlKHRydWUpfS8+KSA6IFxuXHRcdCg8c3BhbiBjbGFzc05hbWU9XCJjb3Vyc2UtYWN0aW9uIGZ1aS1wbHVzXCIgb25DbGljaz17dGhpcy50b2dnbGVDb3Vyc2UoZmFsc2UpfS8+KTtcblx0XHR2YXIgaGVhZGVyID0gKDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtaGVhZGVyXCI+XG5cdFx0XHR7YWRkX29yX3JlbW92ZX1cblx0XHRcdDxkaXYgaWQ9XCJjb3Vyc2UtaW5mby13cmFwcGVyXCI+XG5cdFx0XHRcdDxkaXYgaWQ9XCJuYW1lXCI+e3RoaXMuc3RhdGUuY291cnNlX2luZm8ubmFtZX08L2Rpdj5cblx0XHRcdFx0PGRpdiBpZD1cImNvZGVcIj57dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5jb2RlfTwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0PC9kaXY+KTtcblx0XHRyZXR1cm4gaGVhZGVyO1xuXHR9LFxuXHR0b2dnbGVDb3Vyc2U6IGZ1bmN0aW9uKHJlbW92aW5nKSB7XG5cdFx0Ly8gaWYgcmVtb3ZpbmcgaXMgdHJ1ZSwgd2UncmUgcmVtb3ZpbmcgdGhlIGNvdXJzZSwgaWYgZmFsc2UsIHdlJ3JlIGFkZGluZyBpdFxuXHRcdHJldHVybiAoZnVuY3Rpb24gKCkge1xuXHRcdFx0VGltZXRhYmxlQWN0aW9ucy51cGRhdGVDb3Vyc2VzKHtpZDogdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5pZCwgc2VjdGlvbjogJycsIHJlbW92aW5nOiByZW1vdmluZ30pO1xuXHRcdH0uYmluZCh0aGlzKSk7XG5cdH0sXG5cdG9wZW5SZWNvbWVuZGF0aW9uOiBmdW5jdGlvbihjb3Vyc2VfaWQpIHtcblx0XHRyZXR1cm4gKGZ1bmN0aW9uKCkge1xuXHRcdFx0Q291cnNlQWN0aW9ucy5nZXRDb3Vyc2VJbmZvKHRoaXMucHJvcHMuc2Nob29sLCBjb3Vyc2VfaWQpO1xuXHRcdH0uYmluZCh0aGlzKSk7XG5cdH0sXG5cblx0Z2V0RGVzY3JpcHRpb246IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBkZXNjcmlwdGlvbiA9IFxuXHRcdFx0KDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZW50cnlcIiBpZD1cImNvdXJzZS1kZXNjcmlwdGlvblwiPlxuXHRcdFx0XHQ8aDY+RGVzY3JpcHRpb246PC9oNj5cblx0XHRcdFx0e3RoaXMuc3RhdGUuY291cnNlX2luZm8uZGVzY3JpcHRpb259XG5cdFx0XHQ8L2Rpdj4pXG5cdFx0cmV0dXJuIGRlc2NyaXB0aW9uO1xuXHR9LFxuXG5cdGdldEV2YWx1YXRpb25zOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gPEV2YWx1YXRpb25NYW5hZ2VyIGV2YWxfaW5mbz17dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5ldmFsX2luZm99IC8+XG5cdH0sXG5cblx0Z2V0UmVjb21lbmRhdGlvbnM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciByZWxhdGVkID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5yZWxhdGVkX2NvdXJzZXMuc2xpY2UoMCwzKS5tYXAoZnVuY3Rpb24ocmMpIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBcdDxkaXYgY2xhc3NOYW1lPVwicmVjb21tZW5kYXRpb25cIiBvbkNsaWNrPXt0aGlzLm9wZW5SZWNvbWVuZGF0aW9uKHJjLmlkKX0ga2V5PXtyYy5pZH0+XG4gICAgICAgICAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJjZW50ZXItd3JhcHBlclwiPlxuXHQgICAgICAgICAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJyZWMtd3JhcHBlclwiPlxuXHRcdCAgICAgICAgICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm5hbWVcIj57cmMubmFtZX08L2Rpdj5cblx0XHQgICAgICAgICAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2RlXCI+e3JjLmNvZGV9PC9kaXY+XG5cdFx0ICAgICAgICAgICAgXHQ8L2Rpdj5cblx0XHQgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIFx0PC9kaXY+KVxuICAgICAgICB9LmJpbmQodGhpcykpO1xuXHRcdHZhciByZWNvbWVuZGF0aW9ucyA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8ucmVsYXRlZF9jb3Vyc2VzLmxlbmd0aCA9PSAwID8gbnVsbCA6XG5cdFx0XHQoPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1lbnRyeVwiPlxuXHRcdFx0XHQ8aDY+Q291cnNlcyBZb3UgTWlnaHQgTGlrZTo8L2g2PlxuXHRcdFx0XHQ8ZGl2IGlkPVwiY291cnNlLXJlY29tZW5kYXRpb25zXCI+XG5cdFx0XHRcdFx0e3JlbGF0ZWR9XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+KVxuXHRcdHJldHVybiByZWNvbWVuZGF0aW9uc1xuXHR9LFxuXG5cdGV4cGFuZFJlY29tZW5kYXRpb25zOiBmdW5jdGlvbigpIHtcblxuXHR9LFxuXG5cdGdldFRleHRib29rczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHRleHRib29rX2VsZW1lbnRzID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby50ZXh0Ym9va19pbmZvWzBdLnRleHRib29rcy5tYXAoZnVuY3Rpb24odGIpIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBcdDxkaXYgY2xhc3NOYW1lPVwidGV4dGJvb2tcIiBrZXk9e3RiLmlkfT5cbiAgICAgICAgICAgIFx0XHQ8aW1nIGhlaWdodD1cIjk1XCIgc3JjPXt0Yi5pbWFnZV91cmx9Lz5cbiAgICAgICAgICAgIFx0XHQ8aDYgY2xhc3NOYW1lPVwibGluZS1jbGFtcFwiPnt0Yi50aXRsZX08L2g2PlxuICAgICAgICAgICAgXHRcdDxkaXY+e3RiLmF1dGhvcn08L2Rpdj5cbiAgICAgICAgICAgIFx0XHQ8ZGl2PklTQk46e3RiLmlzYm59PC9kaXY+XG4gICAgICAgICAgICBcdFx0PGEgaHJlZj17dGIuZGV0YWlsX3VybH0gdGFyZ2V0PVwiX2JsYW5rXCI+XG4gICAgICAgICAgICBcdFx0XHQ8aW1nIHNyYz1cImh0dHBzOi8vaW1hZ2VzLW5hLnNzbC1pbWFnZXMtYW1hem9uLmNvbS9pbWFnZXMvRy8wMS9hc3NvY2lhdGVzL3JlbW90ZS1idXktYm94L2J1eTUuX1YxOTIyMDc3MzlfLmdpZlwiIHdpZHRoPVwiMTIwXCIgaGVpZ2h0PVwiMjhcIiBib3JkZXI9XCIwXCIvPlxuICAgICAgICAgICAgXHRcdDwvYT5cbiAgICAgICAgICAgIFx0PC9kaXY+KTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcblx0XHR2YXIgdGV4dGJvb2tzID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby50ZXh0Ym9va19pbmZvWzBdLnRleHRib29rcy5sZW5ndGggPT0gMCA/ICg8ZGl2IGlkPVwiZW1wdHktaW50cm9cIj5ObyB0ZXh0Ym9va3MgZm9yIHRoaXMgY291cnNlIHlldC48L2Rpdj4pIDpcblx0XHRcdFx0KDxkaXYgaWQ9XCJ0ZXh0Ym9va3NcIj5cblx0ICAgICAgICAgICAgXHR7dGV4dGJvb2tfZWxlbWVudHN9XG5cdCAgICAgICAgICAgIDwvZGl2Pik7XG5cdFx0dmFyIHJldCA9IFxuXHRcdFx0KDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZW50cnlcIiBpZD1cImNvdXJzZS10ZXh0Ym9va3NcIj5cblx0XHRcdFx0PGg2PlRleHRib29rczo8L2g2PlxuXHRcdFx0XHR7dGV4dGJvb2tzfVxuXHRcdFx0PC9kaXY+KTtcblx0XHRyZXR1cm4gcmV0O1xuXHR9LFxuXG5cdGdldFNlY3Rpb25zOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgRiA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8uc2VjdGlvbnNfRi5tYXAoZnVuY3Rpb24ocyl7XG5cdFx0XHRyZXR1cm4gKDxTZWN0aW9uU2xvdCBrZXk9e3N9IGFsbF9zZWN0aW9ucz17dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5zZWN0aW9uc19GX29ianN9IHNlY3Rpb249e3N9Lz4pXG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0XHR2YXIgUyA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8uc2VjdGlvbnNfUy5tYXAoZnVuY3Rpb24ocyl7XG5cdFx0XHRyZXR1cm4gKDxTZWN0aW9uU2xvdCBrZXk9e3N9IGFsbF9zZWN0aW9ucz17dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5zZWN0aW9uc19TX29ianN9IHNlY3Rpb249e3N9Lz4pXG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0XHRpZiAodGhpcy5zdGF0ZS5zaG93X3NlY3Rpb25zID09PSB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLmNvZGUpIHtcblx0XHRcdHZhciBzZWNfZGlzcGxheSA9IChcblx0XHRcdFx0PGRpdiBpZD1cImFsbC1zZWN0aW9ucy13cmFwcGVyXCI+XG5cdFx0XHRcdFx0e0Z9XG5cdFx0XHRcdFx0e1N9XG5cdFx0XHRcdDwvZGl2Pik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBzZWN0aW9uc19jb3VudCA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8uc2VjdGlvbnNfUy5sZW5ndGggKyB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnNlY3Rpb25zX0YubGVuZ3RoO1xuXHRcdFx0dmFyIHNlY3Rpb25zX2dyYW1tYXIgPSBzZWN0aW9uc19jb3VudCA+IDEgPyBcInNlY3Rpb25zXCIgOiBcInNlY3Rpb25cIjtcblx0XHRcdHZhciBzZWNfZGlzcGxheSA9ICg8ZGl2IGlkPVwibnVtU2VjdGlvbnNcIiBvbkNsaWNrPXt0aGlzLnNldFNob3dTZWN0aW9ucyh0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLmNvZGUpfT5UaGlzIGNvdXJzZSBoYXMgPGI+e3NlY3Rpb25zX2NvdW50fTwvYj4ge3NlY3Rpb25zX2dyYW1tYXJ9LiBDbGljayBoZXJlIHRvIHZpZXcuPC9kaXY+KVxuXHRcdH1cblx0XHR2YXIgc2VjdGlvbnMgPSBcblx0XHRcdCg8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWVudHJ5XCIgaWQ9XCJjb3Vyc2Utc2VjdGlvbnNcIj5cblx0XHRcdFx0PGg2PkNvdXJzZSBTZWN0aW9uczo8L2g2PlxuXHRcdFx0XHR7c2VjX2Rpc3BsYXl9XG5cdFx0XHQ8L2Rpdj4pO1xuXHRcdHJldHVybiBzZWN0aW9ucztcblx0fSxcblxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzaG93X3NlY3Rpb25zOiAwXG5cdFx0fTtcblx0fSxcblxuXHRzZXRTaG93U2VjdGlvbnM6IGZ1bmN0aW9uKGlkKSB7XG5cdFx0cmV0dXJuIChmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMuc2V0U3RhdGUoe3Nob3dfc2VjdGlvbnM6IGlkfSk7XG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0fSxcblxuXG59KTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtmaXJzdF9kaXNwbGF5ZWQ6IDB9O1xuICB9LFxuXG4gIGNoYW5nZVBhZ2U6IGZ1bmN0aW9uKGRpcmVjdGlvbikge1xuICAgICAgcmV0dXJuIChmdW5jdGlvbihldmVudCkge1xuICAgICAgIHZhciBjdXJyZW50ID0gdGhpcy5wcm9wcy5jdXJyZW50X2luZGV4LFxuICAgICAgICAgICBjb3VudCA9IHRoaXMucHJvcHMuY291bnQ7XG4gICAgICAgLy8gY2FsY3VsYXRlIHRoZSBuZXcgZmlyc3RfZGlzcGxheWVkIGJ1dHRvbiAodGltZXRhYmxlKVxuICAgICAgIHZhciBuZXdfZmlyc3QgPSBjdXJyZW50ICsgKDkqZGlyZWN0aW9uKSAtIChjdXJyZW50ICUgOSk7XG4gICAgICAgaWYgKG5ld19maXJzdCA+PSAwICYmIG5ld19maXJzdCA8IGNvdW50KSB7XG4gICAgICAgIHRoaXMucHJvcHMuc2V0SW5kZXgobmV3X2ZpcnN0KSgpO1xuICAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuICB9LFxuXG4gICAgXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgXHR2YXIgb3B0aW9ucyA9IFtdLCBjb3VudCA9IHRoaXMucHJvcHMuY291bnQsIGN1cnJlbnQgPSB0aGlzLnByb3BzLmN1cnJlbnRfaW5kZXg7XG4gICAgXHRpZiAoY291bnQgPD0gMSkgeyByZXR1cm4gbnVsbDsgfSAvLyBkb24ndCBkaXNwbGF5IGlmIHRoZXJlIGFyZW4ndCBlbm91Z2ggc2NoZWR1bGVzXG4gICAgXHR2YXIgZmlyc3QgPSBjdXJyZW50IC0gKGN1cnJlbnQgJSA5KTsgLy8gcm91bmQgZG93biB0byBuZWFyZXN0IG11bHRpcGxlIG9mIDlcbiAgICBcdHZhciBsaW1pdCA9IE1hdGgubWluKGZpcnN0ICsgOSwgY291bnQpO1xuICAgIFx0Zm9yICh2YXIgaSA9IGZpcnN0OyBpIDwgbGltaXQ7IGkrKykge1xuICAgICBcdCB2YXIgY2xhc3NOYW1lID0gdGhpcy5wcm9wcy5jdXJyZW50X2luZGV4ID09IGkgPyBcImFjdGl2ZVwiIDogXCJcIjtcbiAgICAgIFx0XHRvcHRpb25zLnB1c2goXG4gICAgICAgIFx0XHQ8bGkga2V5PXtpfSBjbGFzc05hbWU9e1wic2VtLXBhZ2UgXCIgKyBjbGFzc05hbWV9IG9uQ2xpY2s9e3RoaXMucHJvcHMuc2V0SW5kZXgoaSl9PlxuICAgICAgICAgICAgIFx0XHQge2kgKyAxfVxuICAgICAgIFx0XHRcdDwvbGk+KTtcbiAgXHRcdH1cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZW0tcGFnaW5hdGlvblwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlbS1wYWdpbmF0aW9uLW5hdiBuYXYtZG91YmxlIG5hdi1kb3VibGUtcHJldlwiIG9uQ2xpY2s9e3RoaXMuY2hhbmdlUGFnZSgtMSl9PlxuXHRcdFx0XHRcdDxpIGNsYXNzTmFtZT1cImZhIGZhLWFuZ2xlLWRvdWJsZS1sZWZ0IHNlbS1wYWdpbmF0aW9uLXByZXYgc2VtLXBhZ2luYXRpb24taWNvblwiIC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlbS1wYWdpbmF0aW9uLW5hdlwiIG9uQ2xpY2s9e3RoaXMucHJvcHMucHJldn0+XG5cdFx0XHRcdFx0PGkgY2xhc3NOYW1lPVwiZmEgZmEtYW5nbGUtbGVmdCBzZW0tcGFnaW5hdGlvbi1wcmV2IHNlbS1wYWdpbmF0aW9uLWljb25cIiAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PG9sIGNsYXNzTmFtZT1cInNlbS1wYWdlc1wiPlxuXHRcdFx0XHRcdHtvcHRpb25zfVxuXHRcdFx0XHQ8L29sPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlbS1wYWdpbmF0aW9uLW5hdlwiIG9uQ2xpY2s9e3RoaXMucHJvcHMubmV4dH0+XG5cdFx0XHRcdFx0PGkgY2xhc3NOYW1lPVwiZmEgZmEtYW5nbGUtcmlnaHQgc2VtLXBhZ2luYXRpb24tbmV4dCBzZW0tcGFnaW5hdGlvbi1pY29uXCIgLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2VtLXBhZ2luYXRpb24tbmF2IG5hdi1kb3VibGUgbmF2LWRvdWJsZS1uZXh0XCIgb25DbGljaz17dGhpcy5jaGFuZ2VQYWdlKDEpfT5cblx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9XCJmYSBmYS1hbmdsZS1kb3VibGUtcmlnaHQgc2VtLXBhZ2luYXRpb24tbmV4dCBzZW0tcGFnaW5hdGlvbi1pY29uXCIgLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9LFxufSk7IiwibW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG51bV9idWJibGVzID0gdGhpcy5nZXROdW1CdWJibGVzKCk7XG4gICAgcmV0dXJuIHtmaXJzdF9kaXNwbGF5ZWQ6IDAsIG51bV9idWJibGVzOiBudW1fYnViYmxlc307XG4gIH0sXG4gIGdldE51bUJ1YmJsZXM6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBidWJibGVzID0gJCh3aW5kb3cpLndpZHRoKCkgPiA3MDAgPyA5IDogNDtcbiAgICByZXR1cm4gYnViYmxlcztcbiAgfSxcblxuICBjaGFuZ2VQYWdlOiBmdW5jdGlvbihkaXJlY3Rpb24pIHtcbiAgICAgIHJldHVybiAoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICB2YXIgY3VycmVudCA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleCxcbiAgICAgICAgICAgY291bnQgPSB0aGlzLnByb3BzLmNvdW50O1xuICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgbmV3IGZpcnN0X2Rpc3BsYXllZCBidXR0b24gKHRpbWV0YWJsZSlcbiAgICAgICB2YXIgbmV3X2ZpcnN0ID0gY3VycmVudCArICh0aGlzLnN0YXRlLm51bV9idWJibGVzKmRpcmVjdGlvbikgLSAoY3VycmVudCAlIHRoaXMuc3RhdGUubnVtX2J1YmJsZXMpO1xuICAgICAgIGlmIChuZXdfZmlyc3QgPj0gMCAmJiBuZXdfZmlyc3QgPCBjb3VudCkge1xuICAgICAgICB0aGlzLnByb3BzLnNldEluZGV4KG5ld19maXJzdCkoKTtcbiAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvcHRpb25zID0gW10sIGNvdW50ID0gdGhpcy5wcm9wcy5jb3VudCwgY3VycmVudCA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleDtcbiAgICBpZiAoY291bnQgPD0gMSkgeyByZXR1cm4gbnVsbDsgfSAvLyBkb24ndCBkaXNwbGF5IGlmIHRoZXJlIGFyZW4ndCBlbm91Z2ggc2NoZWR1bGVzXG4gICAgdmFyIGZpcnN0ID0gY3VycmVudCAtIChjdXJyZW50ICUgdGhpcy5zdGF0ZS5udW1fYnViYmxlcyk7IC8vIHJvdW5kIGRvd24gdG8gbmVhcmVzdCBtdWx0aXBsZSBvZiB0aGlzLnByb3BzLm51bUJ1YmJsZXNcbiAgICB2YXIgbGltaXQgPSBNYXRoLm1pbihmaXJzdCArIHRoaXMuc3RhdGUubnVtX2J1YmJsZXMsIGNvdW50KTtcbiAgICBmb3IgKHZhciBpID0gZmlyc3Q7IGkgPCBsaW1pdDsgaSsrKSB7XG4gICAgICB2YXIgY2xhc3NOYW1lID0gdGhpcy5wcm9wcy5jdXJyZW50X2luZGV4ID09IGkgPyBcImFjdGl2ZVwiIDogXCJcIjtcbiAgICAgIG9wdGlvbnMucHVzaChcbiAgICAgICAgPGxpIGtleT17aX0gY2xhc3NOYW1lPXtjbGFzc05hbWV9PlxuICAgICAgICAgICAgICA8YSBvbkNsaWNrPXt0aGlzLnByb3BzLnNldEluZGV4KGkpfT57aSArIDF9PC9hPlxuICAgICAgICA8L2xpPik7XG4gICAgfVxuICAgIHZhciBwcmV2X2RvdWJsZSA9IChcbiAgICAgIDxsaSBjbGFzc05hbWU9XCJwcmV2LWRvdWJsZVwiIG9uQ2xpY2s9e3RoaXMuY2hhbmdlUGFnZSgtMSl9PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2luYXRpb24tYnRuXCI+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtYW5nbGUtZG91YmxlLWxlZnRcIj48L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9saT5cbiAgICApO1xuICAgIHZhciBuZXh0X2RvdWJsZSA9IChcbiAgICAgIDxsaSBjbGFzc05hbWU9XCJuZXh0LWRvdWJsZVwiIG9uQ2xpY2s9e3RoaXMuY2hhbmdlUGFnZSgxKX0+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicGFnaW5hdGlvbi1idG5cIj5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1hbmdsZS1kb3VibGUtcmlnaHRcIj48L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9saT5cbiAgICApO1xuICAgIGlmIChjb3VudCA8ICh0aGlzLnN0YXRlLm51bV9idWJibGVzICsgMSkpIHtcbiAgICAgIHByZXZfZG91YmxlID0gbnVsbDtcbiAgICAgIG5leHRfZG91YmxlID0gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2luYXRpb24gcGFnaW5hdGlvbi1taW5pbWFsXCI+XG4gICAgICAgICAgPHVsPlxuICAgICAgICAgICAge3ByZXZfZG91YmxlfVxuICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cInByZXZpb3VzXCI+XG4gICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImZ1aS1hcnJvdy1sZWZ0IHBhZ2luYXRpb24tYnRuXCIgXG4gICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5wcm9wcy5wcmV2fT48L2E+XG4gICAgICAgICAgICA8L2xpPlxuXG4gICAgICAgICAgICB7b3B0aW9uc31cbiAgICAgICAgICBcbiAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJuZXh0XCI+XG4gICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImZ1aS1hcnJvdy1yaWdodCBwYWdpbmF0aW9uLWJ0blwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5wcm9wcy5uZXh0fT48L2E+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAge25leHRfZG91YmxlfVxuICAgICAgICAgIDwvdWw+XG4gICAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICQod2luZG93KS5yZXNpemUoZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtudW1fYnViYmxlczogdGhpcy5nZXROdW1CdWJibGVzKCl9KTtcbiAgICB9LmJpbmQodGhpcykpO1xuICB9LFxuICBcblxufSk7IiwidmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBUaW1ldGFibGVTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG5cbnZhciBCaW5hcnlQcmVmZXJlbmNlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBtaXhpbnM6IFtSZWZsdXguY29ubmVjdChUaW1ldGFibGVTdG9yZSldLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRvZ2dsZV9sYWJlbCA9IFwiY21uLXRvZ2dsZS1cIiArIHRoaXMucHJvcHMudG9nZ2xlX2lkO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInByZWZlcmVuY2UtaXRlbVwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInByZWZlcmVuY2UtdGV4dFwiPlxuICAgICAgICAgIDxsaT4ge3RoaXMucHJvcHMudGV4dH0gPC9saT5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHJlZmVyZW5jZS10b2dnbGVcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInN3aXRjaFwiPlxuICAgICAgICAgICAgPGlucHV0IHJlZj1cImNoZWNrYm94X2VsZW1cIiBpZD17dG9nZ2xlX2xhYmVsfSBcbiAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e1wiY21uLXRvZ2dsZSBjbW4tdG9nZ2xlLXJvdW5kIFwiICsgdGhpcy5wcm9wcy5uYW1lfSBcbiAgICAgICAgICAgICAgICAgICB0eXBlPVwiY2hlY2tib3hcIiBcbiAgICAgICAgICAgICAgICAgICBjaGVja2VkPXt0aGlzLnN0YXRlLnByZWZlcmVuY2VzW3RoaXMucHJvcHMubmFtZV19XG4gICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy50b2dnbGVQcmVmZXJlbmNlfS8+XG4gICAgICAgICAgICA8bGFiZWwgaHRtbEZvcj17dG9nZ2xlX2xhYmVsfT48L2xhYmVsPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgdG9nZ2xlUHJlZmVyZW5jZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG5ld192YWx1ZSA9ICF0aGlzLnN0YXRlLnByZWZlcmVuY2VzW3RoaXMucHJvcHMubmFtZV07XG4gICAgVGltZXRhYmxlQWN0aW9ucy51cGRhdGVQcmVmZXJlbmNlcyh0aGlzLnByb3BzLm5hbWUsIG5ld192YWx1ZSk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgY3VycmVudF90b2dnbGVfaWQ6IDAsXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBpZD1cIm1lbnUtY29udGFpbmVyXCIgY2xhc3NOYW1lPVwiY29sbGFwc2VcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJuYXZiYXItY29sbGFwc2VcIiA+XG4gICAgICAgICAgPHVsIGNsYXNzTmFtZT1cIm5hdiBuYXZiYXItbmF2XCIgaWQ9XCJtZW51XCI+XG4gICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICA8QmluYXJ5UHJlZmVyZW5jZSB0ZXh0PVwiQXZvaWQgZWFybHkgY2xhc3Nlc1wiIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU9XCJub19jbGFzc2VzX2JlZm9yZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9nZ2xlX2lkPXt0aGlzLmdldF9uZXh0X3RvZ2dsZV9pZCgpfSAvPlxuICAgICAgICAgICAgICAgIDxCaW5hcnlQcmVmZXJlbmNlIHRleHQ9XCJBdm9pZCBsYXRlIGNsYXNzZXNcIiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lPVwibm9fY2xhc3Nlc19hZnRlclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9nZ2xlX2lkPXt0aGlzLmdldF9uZXh0X3RvZ2dsZV9pZCgpfSAvPlxuICAgICAgICAgICAgICAgIDxCaW5hcnlQcmVmZXJlbmNlIHRleHQ9XCJBbGxvdyBjb25mbGljdHNcIiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lPVwidHJ5X3dpdGhfY29uZmxpY3RzXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2dnbGVfaWQ9e3RoaXMuZ2V0X25leHRfdG9nZ2xlX2lkKCl9IC8+XG4gICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgIDwvdWw+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICBnZXRfbmV4dF90b2dnbGVfaWQ6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY3VycmVudF90b2dnbGVfaWQgKz0gMVxuICAgIHJldHVybiB0aGlzLmN1cnJlbnRfdG9nZ2xlX2lkO1xuICB9XG5cbn0pO1xuIiwidmFyIENvbnRyb2xCYXIgPSByZXF1aXJlKCcuL2NvbnRyb2xfYmFyJyk7XG52YXIgVGltZXRhYmxlID0gcmVxdWlyZSgnLi90aW1ldGFibGUnKTtcbnZhciBNb2RhbENvbnRlbnQgPSByZXF1aXJlKCcuL21vZGFsX2NvbnRlbnQnKTtcbnZhciBUb2FzdFN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdG9hc3Rfc3RvcmUuanMnKTtcbnZhciBUaW1ldGFibGVTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgY291cnNlX2FjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvY291cnNlX2FjdGlvbnMnKTtcbnZhciBTaWRlYmFyID0gcmVxdWlyZSgnLi9zaWRlX2JhcicpO1xudmFyIFNpbXBsZU1vZGFsID0gcmVxdWlyZSgnLi9zaW1wbGVfbW9kYWwnKTtcbnZhciBTY2hvb2xMaXN0ID0gcmVxdWlyZSgnLi9zY2hvb2xfbGlzdCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgbWl4aW5zOiBbUmVmbHV4LmNvbm5lY3QoVGltZXRhYmxlU3RvcmUpLCBSZWZsdXguY29ubmVjdChUb2FzdFN0b3JlKV0sXG4gIHNpZGViYXJfY29sbGFwc2VkOiAnbmV1dHJhbCcsXG5cblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBNb2RhbCA9IEJvcm9uWydPdXRsaW5lTW9kYWwnXTtcbiAgICB2YXIgbG9hZGVyID0gISh0aGlzLnN0YXRlLmxvYWRpbmcgfHwgdGhpcy5zdGF0ZS5jb3Vyc2VzX2xvYWRpbmcpID8gbnVsbCA6XG4gICAgICAoICA8ZGl2IGNsYXNzTmFtZT1cInNwaW5uZXJcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVjdDFcIj48L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVjdDJcIj48L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVjdDNcIj48L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVjdDRcIj48L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVjdDVcIj48L2Rpdj5cbiAgICAgICAgPC9kaXY+KTtcbiAgICB2YXIgc2Nob29sX3NlbGVjdG9yID0gKFxuICAgICAgPFNpbXBsZU1vZGFsIGhlYWRlcj1cIlNlbWVzdGVyLmx5IHwgV2VsY29tZVwiXG4gICAgICAgICAgICAgICAgICAga2V5PVwic2Nob29sXCJcbiAgICAgICAgICAgICAgICAgICByZWY9XCJzY2hvb2xfbW9kYWxcIlxuICAgICAgICAgICAgICAgICAgIGFsbG93X2Rpc2FibGU9e2ZhbHNlfVxuICAgICAgICAgICAgICAgICAgIHN0eWxlcz17e2JhY2tncm91bmRDb2xvcjogXCIjRkRGNUZGXCIsIGNvbG9yOiBcIiMwMDBcIn19IFxuICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ9ezxTY2hvb2xMaXN0IHNldFNjaG9vbD17dGhpcy5zZXRTY2hvb2x9Lz4gfS8+KTtcbiAgICAgIFxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGlkPVwicm9vdFwiPlxuICAgICAgICB7bG9hZGVyfVxuICAgICAgICA8ZGl2IGlkPVwidG9hc3QtY29udGFpbmVyXCI+PC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJjb250cm9sLWJhci1jb250YWluZXJcIj5cbiAgICAgICAgICA8ZGl2IGlkPVwic2VtZXN0ZXJseS1uYW1lXCI+U2VtZXN0ZXIubHk8L2Rpdj5cbiAgICAgICAgICA8aW1nIGlkPVwic2VtZXN0ZXJseS1sb2dvXCIgc3JjPVwiL3N0YXRpYy9pbWcvbG9nbzIuMC5wbmdcIi8+XG4gICAgICAgICAgPENvbnRyb2xCYXIgdG9nZ2xlTW9kYWw9e3RoaXMudG9nZ2xlQ291cnNlTW9kYWx9Lz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJuYXZpY29uXCIgb25DbGljaz17dGhpcy50b2dnbGVTaWRlTW9kYWx9PlxuICAgICAgICAgIDxzcGFuPjwvc3Bhbj48c3Bhbj48L3NwYW4+PHNwYW4+PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBpZD1cIm1vZGFsLWNvbnRhaW5lclwiPlxuICAgICAgICAgIDxNb2RhbCBjbG9zZU9uQ2xpY2s9e3RydWV9IHJlZj0nT3V0bGluZU1vZGFsJyBjbGFzc05hbWU9XCJjb3Vyc2UtbW9kYWxcIj5cbiAgICAgICAgICAgICAgPE1vZGFsQ29udGVudCBzY2hvb2w9e3RoaXMuc3RhdGUuc2Nob29sfSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3Vyc2VzX3RvX3NlY3Rpb25zPXt0aGlzLnN0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnN9IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpZGU9e3RoaXMuaGlkZUNvdXJzZU1vZGFsfSAvPlxuICAgICAgICAgIDwvTW9kYWw+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFsbC1jb2xzLWNvbnRhaW5lclwiPlxuICAgICAgICAgIDxTaWRlYmFyIHRvZ2dsZU1vZGFsPXt0aGlzLnRvZ2dsZUNvdXJzZU1vZGFsfS8+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjYWwtY29udGFpbmVyXCI+XG4gICAgICAgICAgICA8VGltZXRhYmxlIHRvZ2dsZU1vZGFsPXt0aGlzLnRvZ2dsZUNvdXJzZU1vZGFsfSAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAge3NjaG9vbF9zZWxlY3Rvcn1cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnN0YXRlLnNjaG9vbCA9PSBcIlwiICYmIHRoaXMucHJvcHMuZGF0YSA9PSBudWxsKSB7XG4gICAgICB0aGlzLnNob3dTY2hvb2xNb2RhbCgpO1xuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnN0YXRlLnNjaG9vbCAhPSBcIlwiKSB7XG4gICAgICB0aGlzLmhpZGVTY2hvb2xNb2RhbCgpO1xuICAgIH1cbiAgfSxcblxuICB0b2dnbGVDb3Vyc2VNb2RhbDogZnVuY3Rpb24oY291cnNlX2lkKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnJlZnNbJ091dGxpbmVNb2RhbCddLnRvZ2dsZSgpO1xuICAgICAgICBjb3Vyc2VfYWN0aW9ucy5nZXRDb3Vyc2VJbmZvKHRoaXMuc3RhdGUuc2Nob29sLCBjb3Vyc2VfaWQpO1xuICAgIH0uYmluZCh0aGlzKTsgXG4gIH0sXG5cbiAgaGlkZUNvdXJzZU1vZGFsOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnJlZnNbJ091dGxpbmVNb2RhbCddLmhpZGUoKTtcbiAgfSxcblxuICBzaG93U2Nob29sTW9kYWw6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5yZWZzLnNjaG9vbF9tb2RhbC5zaG93KCk7XG4gIH0sXG4gIGhpZGVTY2hvb2xNb2RhbDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnJlZnMuc2Nob29sX21vZGFsLmhpZGUoKTtcbiAgfSxcblxuICB0b2dnbGVTaWRlTW9kYWw6IGZ1bmN0aW9uKCl7XG4gICAgaWYgKHRoaXMuc2lkZWJhcl9jb2xsYXBzZWQgPT0gJ25ldXRyYWwnKSB7XG4gICAgICB2YXIgYm9keXcgPSAkKHdpbmRvdykud2lkdGgoKTtcbiAgICAgIGlmIChib2R5dyA+IDk5OSkge1xuICAgICAgICB0aGlzLmNvbGxhcHNlU2lkZU1vZGFsKCk7XG4gICAgICAgIHRoaXMuc2lkZWJhcl9jb2xsYXBzZWQgPSAnb3Blbic7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmV4cGFuZFNpZGVNb2RhbCgpO1xuICAgICAgICB0aGlzLnNpZGViYXJfY29sbGFwc2VkID0gJ2Nsb3NlZCc7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLnNpZGViYXJfY29sbGFwc2VkID09ICdjbG9zZWQnKSB7XG4gICAgICB0aGlzLmV4cGFuZFNpZGVNb2RhbCgpO1xuICAgICAgdGhpcy5zaWRlYmFyX2NvbGxhcHNlZCA9ICdvcGVuJztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jb2xsYXBzZVNpZGVNb2RhbCgpO1xuICAgICAgdGhpcy5zaWRlYmFyX2NvbGxhcHNlZCA9ICdjbG9zZWQnO1xuICAgIH1cbiAgfSxcblxuICBleHBhbmRTaWRlTW9kYWw6IGZ1bmN0aW9uKCkge1xuICAgICQoJy5jYWwtY29udGFpbmVyLCAuc2lkZS1jb250YWluZXInKS5yZW1vdmVDbGFzcygnZnVsbC1jYWwnKS5hZGRDbGFzcygnbGVzcy1jYWwnKTtcbiAgfSxcblxuICBjb2xsYXBzZVNpZGVNb2RhbDogZnVuY3Rpb24oKSB7XG4gICAgJCgnLmNhbC1jb250YWluZXIsIC5zaWRlLWNvbnRhaW5lcicpLnJlbW92ZUNsYXNzKCdsZXNzLWNhbCcpLmFkZENsYXNzKCdmdWxsLWNhbCcpO1xuICB9XG5cbn0pO1xuIiwiVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBcdChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2Nob29sLWxpc3RcIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzY2hvb2wtcGlja2VyIHNjaG9vbC1qaHVcIiBcblx0XHRcdFx0XHRvbkNsaWNrPXt0aGlzLnNldFNjaG9vbChcImpodVwiKX0+XG5cdFx0XHRcdFx0PGltZyBzcmM9XCIvc3RhdGljL2ltZy9zY2hvb2xfbG9nb3Mvamh1X2xvZ28ucG5nXCIgXG5cdFx0XHRcdFx0XHRjbGFzc05hbWU9XCJzY2hvb2wtbG9nb1wiLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2Nob29sLXBpY2tlciBzY2hvb2wtdW9mdFwiIFxuXHRcdFx0XHRcdG9uQ2xpY2s9e3RoaXMuc2V0U2Nob29sKFwidW9mdFwiKX0+XG5cdFx0XHRcdFx0PGltZyBzcmM9XCIvc3RhdGljL2ltZy9zY2hvb2xfbG9nb3MvdW9mdF9sb2dvLnBuZ1wiIFxuXHRcdFx0XHRcdFx0Y2xhc3NOYW1lPVwic2Nob29sLWxvZ29cIi8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+KTtcblx0fSxcblxuXHRzZXRTY2hvb2w6IGZ1bmN0aW9uKG5ld19zY2hvb2wpIHtcblx0XHRyZXR1cm4gKGZ1bmN0aW9uKCkge1xuXHRcdFx0VGltZXRhYmxlQWN0aW9ucy5zZXRTY2hvb2wobmV3X3NjaG9vbCk7XG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0fSxcblxufSk7XG5cbiIsInZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgVGltZXRhYmxlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xuXG52YXIgU2VhcmNoUmVzdWx0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsaV9jbGFzcyA9IFwic2VhcmNoLXJlc3VsdFwiLCBpY29uX2NsYXNzID0gXCJmdWktcGx1c1wiO1xuICAgIGlmICh0aGlzLnByb3BzLmluX3Jvc3Rlcikge1xuICAgICAgbGlfY2xhc3MgKz0gXCIgdG9kby1kb25lXCI7XG4gICAgICBpY29uX2NsYXNzID0gXCJmdWktY2hlY2tcIjtcbiAgICB9XG4gICAgcmV0dXJuIChcbiAgICAgIDxsaSBjbGFzc05hbWU9e2xpX2NsYXNzfSBvbk1vdXNlRG93bj17dGhpcy5wcm9wcy50b2dnbGVNb2RhbCh0aGlzLnByb3BzLmlkKX0+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidG9kby1jb250ZW50XCI+XG4gICAgICAgICAgPGg0IGNsYXNzTmFtZT1cInRvZG8tbmFtZVwiPlxuICAgICAgICAgICAge3RoaXMucHJvcHMuY29kZX1cbiAgICAgICAgICA8L2g0PlxuICAgICAgICAgIHt0aGlzLnByb3BzLm5hbWV9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9e1wic2VhcmNoLXJlc3VsdC1hY3Rpb24gXCIgKyBpY29uX2NsYXNzfSBcbiAgICAgICAgICBvbk1vdXNlRG93bj17dGhpcy50b2dnbGVDb3Vyc2V9PlxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2xpPlxuICAgICk7XG4gIH0sXG5cbiAgdG9nZ2xlQ291cnNlOiBmdW5jdGlvbihlKSB7XG4gICAgdmFyIHJlbW92aW5nID0gdGhpcy5wcm9wcy5pbl9yb3N0ZXI7XG4gICAgVGltZXRhYmxlQWN0aW9ucy51cGRhdGVDb3Vyc2VzKHtpZDogdGhpcy5wcm9wcy5pZCwgc2VjdGlvbjogJycsIHJlbW92aW5nOiByZW1vdmluZ30pO1xuICAgIGUucHJldmVudERlZmF1bHQoKTsgIC8vIHN0b3AgaW5wdXQgZnJvbSB0cmlnZ2VyaW5nIG9uQmx1ciBhbmQgdGh1cyBoaWRpbmcgcmVzdWx0c1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7IC8vIHN0b3AgcGFyZW50IGZyb20gb3BlbmluZyBtb2RhbFxuICB9LFxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIG1peGluczogW1JlZmx1eC5jb25uZWN0KFRpbWV0YWJsZVN0b3JlKV0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY291cnNlczpbXSxcbiAgICAgIHJlc3VsdHM6IFtdLFxuICAgICAgZm9jdXNlZDogZmFsc2UsXG4gICAgfTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsVXBkYXRlOiBmdW5jdGlvbihuZXdfcHJvcHMsIG5ld19zdGF0ZSkge1xuICAgIGlmIChuZXdfc3RhdGUuc2Nob29sICE9IHRoaXMuc3RhdGUuc2Nob29sKSB7XG4gICAgICB0aGlzLmdldENvdXJzZXMobmV3X3N0YXRlLnNjaG9vbCk7XG4gICAgfVxuXG4gIH0sXG4gIGdldENvdXJzZXM6IGZ1bmN0aW9uKHNjaG9vbCkge1xuICAgIFRpbWV0YWJsZUFjdGlvbnMuc2V0Q291cnNlc0xvYWRpbmcoKTtcbiAgICAkLmdldChcIi9jb3Vyc2VzL1wiICsgc2Nob29sICsgXCIvXCIgKyBfU0VNRVNURVIsIFxuICAgICAgICB7fSwgXG4gICAgICAgIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7Y291cnNlczogcmVzcG9uc2V9KTtcbiAgICAgICAgICBUaW1ldGFibGVBY3Rpb25zLnNldENvdXJzZXNEb25lTG9hZGluZygpO1xuXG4gICAgICAgIH0uYmluZCh0aGlzKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VhcmNoX3Jlc3VsdHNfZGl2ID0gdGhpcy5nZXRTZWFyY2hSZXN1bHRzQ29tcG9uZW50KCk7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJzZWFyY2gtYmFyXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaW5wdXQtY29tYmluZVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaW5wdXQtd3JhcHBlclwiPlxuICAgICAgICAgICAgPGlucHV0IFxuICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiIFxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlNlYXJjaCBieSBjb2RlLCB0aXRsZSwgZGVzY3JpcHRpb24sIGRlZ3JlZVwiIFxuICAgICAgICAgICAgICBpZD1cInNlYXJjaC1pbnB1dFwiIFxuICAgICAgICAgICAgICByZWY9XCJpbnB1dFwiIFxuICAgICAgICAgICAgICBvbkZvY3VzPXt0aGlzLmZvY3VzfSBvbkJsdXI9e3RoaXMuYmx1cn0gXG4gICAgICAgICAgICAgIG9uSW5wdXQ9e3RoaXMucXVlcnlDaGFuZ2VkfS8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8YnV0dG9uIGRhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIiBkYXRhLXRhcmdldD1cIiNtZW51LWNvbnRhaW5lclwiIGlkPVwibWVudS1idG5cIj5cbiAgICAgICAgICAgIDxkaXYgaWQ9XCJzbGlkZXJzXCI+XG4gICAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYm94XCI+PC9kaXY+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJib3hcIj48L2Rpdj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJveFwiPjwvZGl2PlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICB7c2VhcmNoX3Jlc3VsdHNfZGl2fVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgZ2V0U2VhcmNoUmVzdWx0c0NvbXBvbmVudDogZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLnN0YXRlLmZvY3VzZWQgfHwgdGhpcy5zdGF0ZS5yZXN1bHRzLmxlbmd0aCA9PSAwKSB7cmV0dXJuIG51bGw7fVxuICAgIHZhciBpID0gMDtcbiAgICB2YXIgc2VhcmNoX3Jlc3VsdHMgPSB0aGlzLnN0YXRlLnJlc3VsdHMubWFwKGZ1bmN0aW9uKHIpIHtcbiAgICAgIGkrKztcbiAgICAgIHZhciBpbl9yb3N0ZXIgPSB0aGlzLnN0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnNbci5pZF0gIT0gbnVsbDtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxTZWFyY2hSZXN1bHQgey4uLnJ9IGtleT17aX0gaW5fcm9zdGVyPXtpbl9yb3N0ZXJ9IHRvZ2dsZU1vZGFsPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsfS8+XG4gICAgICApO1xuICAgIH0uYmluZCh0aGlzKSk7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJzZWFyY2gtcmVzdWx0cy1jb250YWluZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0b2RvIG1ybVwiPlxuICAgICAgICAgICAgPHVsIGlkPVwic2VhcmNoLXJlc3VsdHNcIj5cbiAgICAgICAgICAgICAge3NlYXJjaF9yZXN1bHRzfVxuICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgZm9jdXM6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe2ZvY3VzZWQ6IHRydWV9KTtcbiAgfSxcblxuICBibHVyOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtmb2N1c2VkOiBmYWxzZX0pO1xuICB9LFxuXG4gIHF1ZXJ5Q2hhbmdlZDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICB2YXIgcXVlcnkgPSBldmVudC50YXJnZXQudmFsdWUudG9Mb3dlckNhc2UoKTtcbiAgICB2YXIgZmlsdGVyZWQgPSBxdWVyeS5sZW5ndGggPD0gMSA/IFtdIDogdGhpcy5maWx0ZXJDb3Vyc2VzKHF1ZXJ5KTtcbiAgICB0aGlzLnNldFN0YXRlKHtyZXN1bHRzOiBmaWx0ZXJlZH0pO1xuICB9LFxuXG4gIGlzU3Vic2VxdWVuY2U6IGZ1bmN0aW9uKHJlc3VsdCxxdWVyeSkge1xuICAgICAgcmVzdWx0ID0gcXVlcnkuc3BsaXQoXCIgXCIpLmV2ZXJ5KGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgICBpZiAocmVzdWx0LmluZGV4T2YocykgPiAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcblxuICBmaWx0ZXJDb3Vyc2VzOiBmdW5jdGlvbihxdWVyeSkge1xuICAgIHZhciBvcHRfcXVlcnkgPSBxdWVyeS5yZXBsYWNlKFwiaW50cm9cIixcImludHJvZHVjdGlvblwiKTtcbiAgICB0aGF0ID0gdGhpcztcbiAgICB2YXIgcmVzdWx0cyA9IHRoaXMuc3RhdGUuY291cnNlcy5maWx0ZXIoZnVuY3Rpb24oYykge1xuICAgICAgcmV0dXJuICh0aGF0LmlzU3Vic2VxdWVuY2UoYy5uYW1lLnRvTG93ZXJDYXNlKCkscXVlcnkpIHx8IFxuICAgICAgICAgICAgIHRoYXQuaXNTdWJzZXF1ZW5jZShjLm5hbWUudG9Mb3dlckNhc2UoKSxvcHRfcXVlcnkpIHx8XG4gICAgICAgICAgICAgYy5jb2RlLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihvcHRfcXVlcnkpID4gLTEgfHxcbiAgICAgICAgICAgICBjLm5hbWUudG9Mb3dlckNhc2UoKS5pbmRleE9mKG9wdF9xdWVyeSkgPiAtMSB8fFxuICAgICAgICAgICAgIGMubmFtZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YocXVlcnkpID4gLTEpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9LFxuXG5cblxufSk7XG4iLCJ2YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFRpbWV0YWJsZVN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcblxuXG52YXIgZGF5X3RvX2xldHRlciA9IHtcbiAgICAnTSc6ICAnTScsIFxuICAgICdUJzogICdUJywgXG4gICAgJ1cnOiAgJ1cnLFxuICAgICdSJzogJ1RoJyxcbiAgICAnRic6ICAnRicsXG4gICAgJ1MnOiAnU2EnLFxuICAgICdVJzogJ1MnXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY29zID0gdGhpcy5nZXRSZWxhdGVkQ291cnNlT2ZmZXJpbmdzKCk7XG4gICAgICAgIHZhciBkYXlfYW5kX3RpbWVzID0gdGhpcy5nZXREYXlzQW5kVGltZXMoY29zKTtcbiAgICAgICAgdmFyIHNlY3Rpb25fYW5kX3Byb2YgPSAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNlY3QtcHJvZlwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2VjdGlvbi1udW1cIj57Y29zWzBdLm1lZXRpbmdfc2VjdGlvbn08L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInByb2ZzXCI+e2Nvc1swXS5pbnN0cnVjdG9yc308L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzZWN0aW9uLXdyYXBwZXJcIj5cbiAgICAgICAgICAgICAgICB7c2VjdGlvbl9hbmRfcHJvZn1cbiAgICAgICAgICAgICAgICB7ZGF5X2FuZF90aW1lc31cbiAgICAgICAgICAgIDwvZGl2Pik7XG4gICAgfSxcblxuICAgIGdldFJlbGF0ZWRDb3Vyc2VPZmZlcmluZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb19vYmplY3RzID0gW11cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnByb3BzLmFsbF9zZWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG8gPSB0aGlzLnByb3BzLmFsbF9zZWN0aW9uc1tpXTtcbiAgICAgICAgICAgIGlmIChvLm1lZXRpbmdfc2VjdGlvbiA9PSB0aGlzLnByb3BzLnNlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBjb19vYmplY3RzLnB1c2gobyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvX29iamVjdHM7XG4gICAgfSxcblxuICAgIGdldERheXNBbmRUaW1lczogZnVuY3Rpb24oY29zKSB7XG4gICAgICAgIHZhciBkYXlBbmRUaW1lcyA9IGNvcy5tYXAoZnVuY3Rpb24obykge1xuICAgICAgICAgICAgcmV0dXJuICg8ZGl2IGtleT17dGhpcy5wcm9wcy5rZXl9IGlkPVwiZGF5LXRpbWVcIiBrZXk9e28uaWR9PntkYXlfdG9fbGV0dGVyW28uZGF5XSArIFwiIFwiICsgby50aW1lX3N0YXJ0ICsgXCItXCIgKyBvLnRpbWVfZW5kfTwvZGl2Pik7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIHJldHVybiAoIDxkaXYga2V5PXt0aGlzLnByb3BzLmtleX0gY2xhc3NOYW1lPVwiZHQtY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAge2RheUFuZFRpbWVzfVxuICAgICAgICAgICAgPC9kaXY+IClcbiAgICB9XG59KTtcbiIsInZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgVGltZXRhYmxlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFNpbXBsZU1vZGFsID0gcmVxdWlyZSgnLi9zaW1wbGVfbW9kYWwnKTtcbnZhciBUZXh0Ym9va0xpc3QgPSByZXF1aXJlKCcuL3RleHRib29rX2xpc3QnKVxuXG52YXIgUm9zdGVyU2xvdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3R5bGVzPXtiYWNrZ3JvdW5kQ29sb3I6IHRoaXMucHJvcHMuY29sb3VyLCBib3JkZXJDb2xvcjogdGhpcy5wcm9wcy5jb2xvdXJ9O1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2XG4gICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWwodGhpcy5wcm9wcy5pZCl9XG4gICAgICAgIHN0eWxlPXtzdHlsZXN9XG4gICAgICAgIG9uTW91c2VFbnRlcj17dGhpcy5oaWdobGlnaHRTaWJsaW5nc31cbiAgICAgICAgb25Nb3VzZUxlYXZlPXt0aGlzLnVuaGlnaGxpZ2h0U2libGluZ3N9XG4gICAgICAgIGNsYXNzTmFtZT17XCJzbG90LW91dGVyIGZjLXRpbWUtZ3JpZC1ldmVudCBmYy1ldmVudCBzbG90IHNsb3QtXCIgKyB0aGlzLnByb3BzLmlkfT5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWNvbnRlbnRcIj5cblxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdGl0bGUgc2xvdC10ZXh0LXJvd1wiPlxuICAgICAgICAgICAgPGkgY2xhc3NOYW1lPVwicmlnaHQgZmEgZmEtdGltZXMgcmVtb3ZlLWNvdXJzZS1pY29uXCIgb25DbGljaz17dGhpcy5yZW1vdmVDb3Vyc2V9PjwvaT5cbiAgICAgICAgICAgIHt0aGlzLnByb3BzLm5hbWV9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gIH0sXG4gIGhpZ2hsaWdodFNpYmxpbmdzOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMudXBkYXRlQ29sb3VycyhDT0xPVVJfVE9fSElHSExJR0hUW3RoaXMucHJvcHMuY29sb3VyXSk7XG4gIH0sXG4gIHVuaGlnaGxpZ2h0U2libGluZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy51cGRhdGVDb2xvdXJzKHRoaXMucHJvcHMuY29sb3VyKTtcbiAgfSxcbiAgdXBkYXRlQ29sb3VyczogZnVuY3Rpb24oY29sb3VyKSB7XG4gICAgJChcIi5zbG90LVwiICsgdGhpcy5wcm9wcy5pZClcbiAgICAgIC5jc3MoJ2JhY2tncm91bmQtY29sb3InLCBjb2xvdXIpXG4gICAgICAuY3NzKCdib3JkZXItY29sb3InLCBjb2xvdXIpO1xuICB9LFxuICByZW1vdmVDb3Vyc2U6IGZ1bmN0aW9uKGUpIHtcbiAgICBUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZUNvdXJzZXMoe2lkOiB0aGlzLnByb3BzLmlkLCBcbiAgICAgICAgICAgIHNlY3Rpb246ICcnLCBcbiAgICAgICAgICAgIHJlbW92aW5nOiB0cnVlfSk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgfSxcblxufSk7XG5cbnZhciBDb3Vyc2VSb3N0ZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAvLyB1c2UgdGhlIHRpbWV0YWJsZSBmb3Igc2xvdHMgYmVjYXVzZSBpdCBjb250YWlucyB0aGUgbW9zdCBpbmZvcm1hdGlvblxuICAgIGlmICh0aGlzLnByb3BzLnRpbWV0YWJsZXMubGVuZ3RoID4gMCkge1xuICAgICAgdmFyIHNsb3RzID0gdGhpcy5wcm9wcy50aW1ldGFibGVzWzBdLmNvdXJzZXMubWFwKGZ1bmN0aW9uKGNvdXJzZSkge1xuICAgICAgICB2YXIgY29sb3VyID0gIENPVVJTRV9UT19DT0xPVVJbY291cnNlLmNvZGVdO1xuXG4gICAgICAgIHJldHVybiA8Um9zdGVyU2xvdCB7Li4uY291cnNlfSB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0ga2V5PXtjb3Vyc2UuY29kZX0gY29sb3VyPXtjb2xvdXJ9Lz5cbiAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNsb3RzID0gbnVsbDtcbiAgICB9XG4gICAgdmFyIHR0ID0gdGhpcy5wcm9wcy50aW1ldGFibGVzLmxlbmd0aCA+IDAgPyB0aGlzLnByb3BzLnRpbWV0YWJsZXNbMF0gOiBudWxsO1xuICAgIHZhciBudW1Db3Vyc2VzID0gMDtcbiAgICB2YXIgdG90YWxTY29yZSA9IDA7XG4gICAgaWYgKHRoaXMucHJvcHMudGltZXRhYmxlcy5sZW5ndGggPiAwICYmIHRoaXMucHJvcHMudGltZXRhYmxlc1swXS5jb3Vyc2VzLmxlbmd0aCA+IDAgKSB7XG4gICAgICBmb3IgKGo9MDtqPHRoaXMucHJvcHMudGltZXRhYmxlc1swXS5jb3Vyc2VzLmxlbmd0aDtqKyspIHtcbiAgICAgICAgICBmb3IgKGs9MDtrPHRoaXMucHJvcHMudGltZXRhYmxlc1swXS5jb3Vyc2VzW2pdLmV2YWx1YXRpb25zLmxlbmd0aDtrKyspIHtcbiAgICAgICAgICAgIG51bUNvdXJzZXMrKztcbiAgICAgICAgICAgIHRvdGFsU2NvcmUgKz0gdGhpcy5wcm9wcy50aW1ldGFibGVzWzBdLmNvdXJzZXNbal0uZXZhbHVhdGlvbnNba10uc2NvcmU7XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB2YXIgYXZnU2NvcmVDb250ZW50ID0gdGhpcy5wcm9wcy50aW1ldGFibGVzLmxlbmd0aCA+IDAgJiYgdG90YWxTY29yZSA+IDAgID8gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJyYXRpbmctd3JhcHBlclwiPlxuICAgICAgICAgIDxwPkF2ZXJhZ2UgQ291cnNlIFJhdGluZzo8L3A+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzdWItcmF0aW5nLXdyYXBwZXJcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3Rhci1yYXRpbmdzLXNwcml0ZVwiPlxuICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17e3dpZHRoOiAxMDAqdG90YWxTY29yZS8oNSpudW1Db3Vyc2VzKSArIFwiJVwifX0gY2xhc3NOYW1lPVwicmF0aW5nXCI+PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PikgOiBudWxsO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvdXJzZS1yb3N0ZXIgY291cnNlLWxpc3RcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjbGVhcmZpeFwiPlxuICAgICAgICAgIHtzbG90c31cbiAgICAgICAgICB7YXZnU2NvcmVDb250ZW50fVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufSlcblxudmFyIFRleHRib29rUm9zdGVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBtaXhpbnM6IFtSZWZsdXguY29ubmVjdChUaW1ldGFibGVTdG9yZSldLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgIGlmICh0aGlzLnN0YXRlLnRpbWV0YWJsZXMubGVuZ3RoID4gMCkge1xuICAgICAgdGV4dGJvb2tzID0gW11cbiAgICAgICBmb3IgKGk9MDsgaSA8IHRoaXMuc3RhdGUudGltZXRhYmxlc1t0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXhdLmNvdXJzZXMubGVuZ3RoOyBpKyspICB7XG4gICAgICAgICAgZm9yKGo9MDsgaiA8IHRoaXMuc3RhdGUudGltZXRhYmxlc1t0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXhdLmNvdXJzZXNbaV0udGV4dGJvb2tzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB0ZXh0Ym9va3MucHVzaCh0aGlzLnN0YXRlLnRpbWV0YWJsZXNbdGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4XS5jb3Vyc2VzW2ldLnRleHRib29rc1tqXSlcbiAgICAgICAgICB9XG4gICAgICAgfVxuICAgICAgIHZhciB0Yl9lbGVtZW50cyA9IHRleHRib29rcy5tYXAoZnVuY3Rpb24odGIpIHtcbiAgICAgICAgICBpZiAodGJbJ2ltYWdlX3VybCddID09PSBcIkNhbm5vdCBiZSBmb3VuZFwiKSB7XG4gICAgICAgICAgICB2YXIgaW1nID0gJy9zdGF0aWMvaW1nL2RlZmF1bHRfY292ZXIuanBnJ1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgaW1nID0gdGJbJ2ltYWdlX3VybCddXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0YlsndGl0bGUnXSA9PSBcIkNhbm5vdCBiZSBmb3VuZFwiKSB7XG4gICAgICAgICAgICB2YXIgdGl0bGUgPSBcIiNcIiArICB0YlsnaXNibiddXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB0aXRsZSA9IHRiWyd0aXRsZSddXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAoIFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0Ym9va1wiIGtleT17dGJbJ2lkJ119PlxuICAgICAgICAgICAgICAgIDxpbWcgaGVpZ2h0PVwiMTI1XCIgc3JjPXtpbWd9Lz5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1vZHVsZVwiPlxuICAgICAgICAgICAgICAgICAgPGg2IGNsYXNzTmFtZT1cImxpbmUtY2xhbXBcIj57dGl0bGV9PC9oNj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxhIGhyZWY9e3RiWydkZXRhaWxfdXJsJ119IHRhcmdldD1cIl9ibGFua1wiPlxuICAgICAgICAgICAgICAgICAgPGltZyBzcmM9XCJodHRwczovL2ltYWdlcy1uYS5zc2wtaW1hZ2VzLWFtYXpvbi5jb20vaW1hZ2VzL0cvMDEvYXNzb2NpYXRlcy9yZW1vdGUtYnV5LWJveC9idXk1Ll9WMTkyMjA3NzM5Xy5naWZcIiB3aWR0aD1cIjEyMFwiIGhlaWdodD1cIjI4XCIgYm9yZGVyPVwiMFwiLz5cbiAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB0Yl9lbGVtZW50cyA9IG51bGw7XG4gICAgfVxuICAgIHZhciBtb2RhbCA9IG51bGw7XG4gICAgaWYgKHRoaXMuc3RhdGUuc2hvd19tb2RhbCkge1xuICAgICAgICBtb2RhbCA9IDxTaW1wbGVNb2RhbCBoZWFkZXI9e1wiWW91ciBUZXh0Ym9va3NcIn1cbiAgICAgICAgICAgICAgICAgICBzdHlsZXM9e3tiYWNrZ3JvdW5kQ29sb3I6IFwiI0ZERjVGRlwiLCBjb2xvcjogXCIjMDAwXCJ9fSBcbiAgICAgICAgICAgICAgICAgICBjb250ZW50PXtudWxsfS8+XG4gICAgfVxuICAgIHZhciBzZWVfYWxsID0gbnVsbDtcbiAgICBpZiAodGJfZWxlbWVudHMgIT0gbnVsbCkge1xuICAgICAgc2VlX2FsbCA9ICg8ZGl2IGNsYXNzTmFtZT1cInZpZXctdGJzXCIgb25DbGljaz17dGhpcy50b2dnbGV9PlZpZXcgQWxsIFRleHRib29rczwvZGl2PilcbiAgICB9XG4gICAgdmFyIGNvdXJzZXMgPSB0aGlzLnN0YXRlLnRpbWV0YWJsZXMubGVuZ3RoID4gMCA/IHRoaXMuc3RhdGUudGltZXRhYmxlc1t0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXhdLmNvdXJzZXMgOiBudWxsXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY291cnNlLXJvc3RlciB0ZXh0Ym9vay1saXN0XCI+XG4gICAgICAgIDxTaW1wbGVNb2RhbCBoZWFkZXI9e1wiWW91ciBUZXh0Ym9va3NcIn1cbiAgICAgICAgICAga2V5PVwidGV4dGJvb2tcIlxuICAgICAgICAgICByZWY9XCJ0YnNcIlxuICAgICAgICAgICBzdHlsZXM9e3tiYWNrZ3JvdW5kQ29sb3I6IFwiI0ZERjVGRlwiLCBjb2xvcjogXCIjMDAwXCJ9fSBcbiAgICAgICAgICAgYWxsb3dfZGlzYWJsZT17dHJ1ZX1cbiAgICAgICAgICAgY29udGVudD17PFRleHRib29rTGlzdCBjb3Vyc2VzPXtjb3Vyc2VzfS8+fS8+XG4gICAgICAgIHttb2RhbH1cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjbGVhcmZpeFwiPlxuICAgICAgICAgIHtzZWVfYWxsfVxuICAgICAgICAgIHt0Yl9lbGVtZW50c31cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH0sXG5cbiAgdG9nZ2xlOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnJlZnMudGJzLnRvZ2dsZSgpO1xuICB9LFxuXG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgbWl4aW5zOiBbUmVmbHV4LmNvbm5lY3QoVGltZXRhYmxlU3RvcmUpXSxcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge3Nob3c6IGZhbHNlfTtcbiAgfSxcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKFxuXG4gICAgICA8ZGl2IHJlZj1cInNpZGViYXJcIiBjbGFzc05hbWU9XCJzaWRlLWNvbnRhaW5lclwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvc3Rlci1oZWFkZXJcIj5cbiAgICAgICAgICA8aDQ+WW91ciBTZW1lc3RlcjwvaDQ+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8Q291cnNlUm9zdGVyIHRvZ2dsZU1vZGFsPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsfSB0aW1ldGFibGVzPXt0aGlzLnN0YXRlLnRpbWV0YWJsZXN9Lz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3N0ZXItaGVhZGVyXCI+XG4gICAgICAgICAgPGg0PllvdXIgVGV4dGJvb2tzPC9oND5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxUZXh0Ym9va1Jvc3RlciAvPlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9LFxufSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge3Nob3duOiBmYWxzZX07XG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXY+PC9kaXY+XG5cdFx0KTtcblx0fSxcblxuXHR0b2dnbGU6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLnN0YXRlLnNob3duKSB7XG5cdFx0XHR0aGlzLmhpZGUoKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHR0aGlzLnNob3coKTtcblx0XHR9XG5cdH0sXG5cblx0c2hvdzogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNsb3NlX2J1dHRvbiA9IHRoaXMucHJvcHMuYWxsb3dfZGlzYWJsZSA/IFxuXHRcdCg8aSBvbkNsaWNrPXt0aGlzLmhpZGV9IGNsYXNzTmFtZT1cInJpZ2h0IGZhIGZhLXRpbWVzIGNsb3NlLWNvdXJzZS1tb2RhbFwiIC8+KSA6IG51bGxcblx0XHRSZWFjdERPTS5yZW5kZXIoXG4gIFx0XHRcdChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPXtcInNpbXBsZS1tb2RhbC13cmFwcGVyIFwiICsgdGhpcy5wcm9wcy5rZXl9PlxuXHRcdFx0XHQ8ZGl2IGlkPVwiZGltLXNjcmVlblwiIG9uQ2xpY2s9e3RoaXMubWF5YmVIaWRlfT48L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzaW1wbGUtbW9kYWxcIiBzdHlsZT17dGhpcy5wcm9wcy5zdHlsZXN9PlxuXHRcdFx0XHRcdDxoNiBjbGFzc05hbWU9XCJzaW1wbGUtbW9kYWwtaGVhZGVyXCI+e3RoaXMucHJvcHMuaGVhZGVyfSB7Y2xvc2VfYnV0dG9ufTwvaDY+XG5cdFx0XHRcdFx0PGhyIGNsYXNzTmFtZT1cInNpbXBsZS1tb2RhbC1zZXBhcmF0b3JcIi8+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzaW1wbGUtbW9kYWwtY29udGVudFwiPlxuXHRcdFx0XHRcdFx0e3RoaXMucHJvcHMuY29udGVudH1cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj4pLFxuICBcdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VtZXN0ZXJseS1tb2RhbCcpXG5cdFx0KTtcblx0XHR0aGlzLnNldFN0YXRlKHtzaG93bjogdHJ1ZX0pO1xuXHR9LFxuXG5cdG1heWJlSGlkZTogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMucHJvcHMuYWxsb3dfZGlzYWJsZSkge1xuXHRcdFx0dGhpcy5oaWRlKCk7XG5cdFx0fVx0XG5cdH0sXG5cblx0aGlkZTogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCQoXCIuXCIgKyB0aGlzLnByb3BzLmtleSkubGVuZ3RoID09IDApIHtyZXR1cm47fVxuXHRcdHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VtZXN0ZXJseS1tb2RhbCcpO1xuXHRcdCQoXCIjZGltLXNjcmVlblwiKS5mYWRlT3V0KDgwMCwgZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgUmVhY3RET00udW5tb3VudENvbXBvbmVudEF0Tm9kZShjb250YWluZXIpO1xuXHRcdH0pO1xuXHRcdHZhciBzZWwgPSBcIi5zaW1wbGUtbW9kYWxcIjtcblxuXHRcdGlmICgkKHNlbCkub2Zmc2V0KCkubGVmdCA8IDApIHtcbiAgICAgICAgICAgICQoc2VsKS5jc3MoXCJsZWZ0XCIsIFwiMTUwJVwiKTtcbiAgICAgICAgfSBlbHNlIGlmICgkKHNlbCkub2Zmc2V0KCkubGVmdCA+ICQoJ2JvZHknKS53aWR0aCgpKSB7XG4gICAgICAgICAgICAkKHNlbCkuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgbGVmdDogJzUwJScsXG4gICAgICAgICAgICB9LCA4MDAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoc2VsKS5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICBsZWZ0OiAnLTE1MCUnLFxuICAgICAgICAgICAgfSwgODAwICk7XG4gICAgICAgIH1cblx0XHR0aGlzLnNldFN0YXRlKHtzaG93bjogZmFsc2V9KTtcblxuXHR9LFxuXG5cblxufSk7XG4iLCJ2YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFRpbWV0YWJsZVN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcblxuXG4vLyBtYXBzIGJhc2UgY29sb3VyIG9mIHNsb3QgdG8gY29sb3VyIG9uIGhpZ2hsaWdodFxuQ09MT1VSX1RPX0hJR0hMSUdIVCA9IHtcbiAgICBcIiNGRDc0NzNcIiA6IFwiI0UyNkE2QVwiLFxuICAgIFwiIzQ0QkJGRlwiIDogXCIjMjhBNEVBXCIsXG4gICAgXCIjNENENEIwXCIgOiBcIiMzREJCOUFcIixcbiAgICBcIiM4ODcwRkZcIiA6IFwiIzcwNTlFNlwiLFxuICAgIFwiI0Y5QUU3NFwiIDogXCIjRjc5NTRBXCIsXG4gICAgXCIjRDREQkM4XCIgOiBcIiNCNUJGQTNcIixcbiAgICBcIiNGMTgyQjRcIiA6IFwiI0RFNjk5RFwiLFxuICAgIFwiIzc0OTlBMlwiIDogXCIjNjY4Qjk0XCIsXG4gICAgXCIjRTdGNzZEXCIgOiBcIiNDNEQ0NERcIixcbn0gLy8gY29uc2lkZXIgI0NGMDAwRiwgI2U4ZmFjM1xuQ09VUlNFX1RPX0NPTE9VUiA9IHt9XG4vLyBob3cgYmlnIGEgc2xvdCBvZiBoYWxmIGFuIGhvdXIgd291bGQgYmUsIGluIHBpeGVsc1xudmFyIEhBTEZfSE9VUl9IRUlHSFQgPSAzMDtcblxudmFyIFNsb3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtzaG93X2J1dHRvbnM6IGZhbHNlfTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHBpbiA9IG51bGwsIHJlbW92ZV9idXR0b24gPSBudWxsO1xuICAgICAgICB2YXIgc2xvdF9zdHlsZSA9IHRoaXMuZ2V0U2xvdFN0eWxlKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuc2hvd19idXR0b25zKSB7XG4gICAgICAgICAgICBwaW4gPSAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNsb3QtaW5uZXIgYm90dG9tXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJidXR0b24tc3Vycm91bmRcIiBvbkNsaWNrPXt0aGlzLnBpbk9yVW5waW5Db3Vyc2V9ID5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtbG9ja1wiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+KTtcbiAgICAgICAgICAgIHJlbW92ZV9idXR0b24gPSAoIDxkaXYgY2xhc3NOYW1lPVwic2xvdC1pbm5lclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnV0dG9uLXN1cnJvdW5kXCIgb25DbGljaz17dGhpcy5yZW1vdmVDb3Vyc2V9ID5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtdGltZXMgcmVtb3ZlXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnByb3BzLnBpbm5lZCkge1xuICAgICAgICAgICAgcGluID0gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzbG90LWlubmVyIGJvdHRvbVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnV0dG9uLXN1cnJvdW5kIHBpbm5lZFwiIG9uQ2xpY2s9e3RoaXMucGluT3JVbnBpbkNvdXJzZX0gPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1sb2NrXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgICB9XG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBcbiAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWwodGhpcy5wcm9wcy5jb3Vyc2UpfVxuICAgICAgICAgICAgb25Nb3VzZUVudGVyPXt0aGlzLmhpZ2hsaWdodFNpYmxpbmdzfVxuICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXt0aGlzLnVuaGlnaGxpZ2h0U2libGluZ3N9XG4gICAgICAgICAgICBjbGFzc05hbWU9e1wic2xvdC1vdXRlciBmYy10aW1lLWdyaWQtZXZlbnQgZmMtZXZlbnQgc2xvdCBzbG90LVwiICsgdGhpcy5wcm9wcy5jb3Vyc2V9IFxuICAgICAgICAgICAgc3R5bGU9e3Nsb3Rfc3R5bGV9PlxuICAgICAgICAgICAge3JlbW92ZV9idXR0b259XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10aW1lXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+e3RoaXMucHJvcHMudGltZV9zdGFydH0g4oCTIHt0aGlzLnByb3BzLnRpbWVfZW5kfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdGl0bGUgc2xvdC10ZXh0LXJvd1wiPnt0aGlzLnByb3BzLmNvZGUgKyBcIiBcIiArIHRoaXMucHJvcHMubWVldGluZ19zZWN0aW9ufTwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRpdGxlIHNsb3QtdGV4dC1yb3dcIj57dGhpcy5wcm9wcy5uYW1lfTwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICB7cGlufSAgICAgICAgICAgIFxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAvKipcbiAgICAqIFJldHVybiBhbiBvYmplY3QgY29udGFpbmluZyBzdHlsZSBvZiBhIHNwZWNpZmljIHNsb3QuIFNob3VsZCBzcGVjaWZ5IGF0XG4gICAgKiBsZWFzdCB0aGUgdG9wIHktY29vcmRpbmF0ZSBhbmQgaGVpZ2h0IG9mIHRoZSBzbG90LCBhcyB3ZWxsIGFzIGJhY2tncm91bmRDb2xvclxuICAgICogd2hpbGUgdGFraW5nIGludG8gYWNjb3VudCBpZiB0aGVyZSdzIGFuIG92ZXJsYXBwaW5nIGNvbmZsaWN0XG4gICAgKi9cbiAgICBnZXRTbG90U3R5bGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc3RhcnRfaG91ciAgID0gcGFyc2VJbnQodGhpcy5wcm9wcy50aW1lX3N0YXJ0LnNwbGl0KFwiOlwiKVswXSksXG4gICAgICAgICAgICBzdGFydF9taW51dGUgPSBwYXJzZUludCh0aGlzLnByb3BzLnRpbWVfc3RhcnQuc3BsaXQoXCI6XCIpWzFdKSxcbiAgICAgICAgICAgIGVuZF9ob3VyICAgICA9IHBhcnNlSW50KHRoaXMucHJvcHMudGltZV9lbmQuc3BsaXQoXCI6XCIpWzBdKSxcbiAgICAgICAgICAgIGVuZF9taW51dGUgICA9IHBhcnNlSW50KHRoaXMucHJvcHMudGltZV9lbmQuc3BsaXQoXCI6XCIpWzFdKTtcblxuICAgICAgICB2YXIgdG9wID0gKHN0YXJ0X2hvdXIgLSA4KSo1MiArIChzdGFydF9taW51dGUpKigyNi8zMCk7XG4gICAgICAgIHZhciBib3R0b20gPSAoZW5kX2hvdXIgLSA4KSo1MiArIChlbmRfbWludXRlKSooMjYvMzApIC0gMTtcbiAgICAgICAgdmFyIGhlaWdodCA9IGJvdHRvbSAtIHRvcCAtIDI7XG5cbiAgICAgICAgaWYgKHRoaXMucHJvcHMubnVtX2NvbmZsaWN0cyA+IDEpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMucHJvcHMudGltZV9zdGFydCwgdGhpcy5wcm9wcy50aW1lX2VuZCwgdGhpcy5wcm9wcy5udW1fY29uZmxpY3RzKVxuICAgICAgICB9XG4gICAgICAgIC8vIHRoZSBjdW11bGF0aXZlIHdpZHRoIG9mIHRoaXMgc2xvdCBhbmQgYWxsIG9mIHRoZSBzbG90cyBpdCBpcyBjb25mbGljdGluZyB3aXRoXG4gICAgICAgIHZhciB0b3RhbF9zbG90X3dpZHRocyA9IDk5IC0gKDUgKiB0aGlzLnByb3BzLmRlcHRoX2xldmVsKTtcbiAgICAgICAgLy8gdGhlIHdpZHRoIG9mIHRoaXMgcGFydGljdWxhciBzbG90XG4gICAgICAgIHZhciBzbG90X3dpZHRoX3BlcmNlbnRhZ2UgPSB0b3RhbF9zbG90X3dpZHRocyAvIHRoaXMucHJvcHMubnVtX2NvbmZsaWN0cztcbiAgICAgICAgLy8gdGhlIGFtb3VudCBvZiBsZWZ0IG1hcmdpbiBvZiB0aGlzIHBhcnRpY3VsYXIgc2xvdCwgaW4gcGVyY2VudGFnZVxuICAgICAgICB2YXIgcHVzaF9sZWZ0ID0gKHRoaXMucHJvcHMuc2hpZnRfaW5kZXggKiBzbG90X3dpZHRoX3BlcmNlbnRhZ2UpICsgNSAqIHRoaXMucHJvcHMuZGVwdGhfbGV2ZWw7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdpZHRoOiBzbG90X3dpZHRoX3BlcmNlbnRhZ2UgKyBcIiVcIixcbiAgICAgICAgICAgIHRvcDogdG9wLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMucHJvcHMuY29sb3VyLFxuICAgICAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIiArIHRoaXMucHJvcHMuY29sb3VyLFxuICAgICAgICAgICAgbGVmdDogcHVzaF9sZWZ0ICsgXCIlXCIsXG4gICAgICAgICAgICB6SW5kZXg6IDEwMCAqIHRoaXMucHJvcHMuZGVwdGhfbGV2ZWxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgaGlnaGxpZ2h0U2libGluZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtzaG93X2J1dHRvbnM6IHRydWV9KTtcbiAgICAgICAgdGhpcy51cGRhdGVDb2xvdXJzKENPTE9VUl9UT19ISUdITElHSFRbdGhpcy5wcm9wcy5jb2xvdXJdKTtcbiAgICB9LFxuICAgIHVuaGlnaGxpZ2h0U2libGluZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtzaG93X2J1dHRvbnM6IGZhbHNlfSk7XG4gICAgICAgIHRoaXMudXBkYXRlQ29sb3Vycyh0aGlzLnByb3BzLmNvbG91cik7XG4gICAgfSxcbiAgICBwaW5PclVucGluQ291cnNlOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIFRpbWV0YWJsZUFjdGlvbnMudXBkYXRlQ291cnNlcyh7aWQ6IHRoaXMucHJvcHMuY291cnNlLCBcbiAgICAgICAgICAgIHNlY3Rpb246IHRoaXMucHJvcHMubWVldGluZ19zZWN0aW9uLCBcbiAgICAgICAgICAgIHJlbW92aW5nOiBmYWxzZX0pO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0sXG4gICAgcmVtb3ZlQ291cnNlOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIFRpbWV0YWJsZUFjdGlvbnMudXBkYXRlQ291cnNlcyh7aWQ6IHRoaXMucHJvcHMuY291cnNlLCBcbiAgICAgICAgICAgIHNlY3Rpb246ICcnLCBcbiAgICAgICAgICAgIHJlbW92aW5nOiB0cnVlfSk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSxcblxuICAgIHVwZGF0ZUNvbG91cnM6IGZ1bmN0aW9uKGNvbG91cikge1xuICAgICAgICAkKFwiLnNsb3QtXCIgKyB0aGlzLnByb3BzLmNvdXJzZSlcbiAgICAgICAgICAuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgY29sb3VyKVxuICAgICAgICAgIC5jc3MoJ2JvcmRlci1jb2xvcicsIGNvbG91cik7XG4gICAgfSxcblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRheXMgPSBbXCJNXCIsIFwiVFwiLCBcIldcIiwgXCJSXCIsIFwiRlwiXTtcbiAgICAgICAgdmFyIHNsb3RzX2J5X2RheSA9IHRoaXMuZ2V0U2xvdHNCeURheSgpO1xuICAgICAgICB2YXIgYWxsX3Nsb3RzID0gZGF5cy5tYXAoZnVuY3Rpb24oZGF5KSB7XG4gICAgICAgICAgICB2YXIgZGF5X3Nsb3RzID0gc2xvdHNfYnlfZGF5W2RheV0ubWFwKGZ1bmN0aW9uKHNsb3QpIHtcbiAgICAgICAgICAgICAgICB2YXIgcCA9IHRoaXMuaXNQaW5uZWQoc2xvdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxTbG90IHsuLi5zbG90fSB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0ga2V5PXtzbG90LmlkfSBwaW5uZWQ9e3B9Lz5cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8dGQga2V5PXtkYXl9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1ldmVudC1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZGF5X3Nsb3RzfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICApO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXNcIj48L3RkPlxuICAgICAgICAgICAgICAgICAge2FsbF9zbG90c31cbiAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgPC90YWJsZT5cblxuICAgICAgICApO1xuICAgIH0sXG4gICBcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXlzID0gezE6ICdtb24nLCAyOiAndHVlJywgMzogJ3dlZCcsIDQ6ICd0aHUnLCA1OiAnZnJpJ307XG4gICAgICAgIHZhciBkID0gbmV3IERhdGUoKTtcbiAgICAgICAgdmFyIHNlbGVjdG9yID0gXCIuZmMtXCIgKyBkYXlzW2QuZ2V0RGF5KCldO1xuICAgICAgICAvLyAkKHNlbGVjdG9yKS5hZGRDbGFzcyhcImZjLXRvZGF5XCIpO1xuICAgIH0sXG5cbiAgICBpc1Bpbm5lZDogZnVuY3Rpb24oc2xvdCkge1xuICAgICAgICB2YXIgY29tcGFyYXRvciA9IHRoaXMucHJvcHMuY291cnNlc190b19zZWN0aW9uc1tzbG90LmNvdXJzZV1bJ0MnXTtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuc2Nob29sID09IFwidW9mdFwiKSB7XG4gICAgICAgICAgICBjb21wYXJhdG9yID0gdGhpcy5wcm9wcy5jb3Vyc2VzX3RvX3NlY3Rpb25zW3Nsb3QuY291cnNlXVtzbG90Lm1lZXRpbmdfc2VjdGlvblswXV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbXBhcmF0b3IgPT0gc2xvdC5tZWV0aW5nX3NlY3Rpb247XG4gICAgfSxcblxuICAgIGdldFNsb3RzQnlEYXk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2xvdHNfYnlfZGF5ID0ge1xuICAgICAgICAgICAgJ00nOiBbXSxcbiAgICAgICAgICAgICdUJzogW10sXG4gICAgICAgICAgICAnVyc6IFtdLFxuICAgICAgICAgICAgJ1InOiBbXSxcbiAgICAgICAgICAgICdGJzogW11cbiAgICAgICAgfTtcbiAgICAgICAgQ09VUlNFX1RPX0NPTE9VUiA9IHt9O1xuICAgICAgICBmb3IgKHZhciBjb3Vyc2UgaW4gdGhpcy5wcm9wcy50aW1ldGFibGUuY291cnNlcykge1xuICAgICAgICAgICAgdmFyIGNycyA9IHRoaXMucHJvcHMudGltZXRhYmxlLmNvdXJzZXNbY291cnNlXTtcbiAgICAgICAgICAgIGZvciAodmFyIHNsb3RfaWQgaW4gY3JzLnNsb3RzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNsb3QgPSBjcnMuc2xvdHNbc2xvdF9pZF07XG4gICAgICAgICAgICAgICAgdmFyIGNvbG91ciA9IE9iamVjdC5rZXlzKENPTE9VUl9UT19ISUdITElHSFQpW2NvdXJzZV07XG4gICAgICAgICAgICAgICAgc2xvdFtcImNvbG91clwiXSA9IGNvbG91cjtcbiAgICAgICAgICAgICAgICBzbG90W1wiY29kZVwiXSA9IGNycy5jb2RlLnRyaW0oKTtcbiAgICAgICAgICAgICAgICBzbG90W1wibmFtZVwiXSA9IGNycy5uYW1lO1xuICAgICAgICAgICAgICAgIHNsb3RzX2J5X2RheVtzbG90LmRheV0ucHVzaChzbG90KTtcbiAgICAgICAgICAgICAgICBDT1VSU0VfVE9fQ09MT1VSW2Nycy5jb2RlXSA9IGNvbG91cjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2xvdHNfYnlfZGF5O1xuICAgIH0sXG5cbn0pO1xuIiwidmFyIGNvdXJzZV9hY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9jb3Vyc2VfYWN0aW9ucy5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlZmx1eC5jcmVhdGVTdG9yZSh7XG4gIGxpc3RlbmFibGVzOiBbY291cnNlX2FjdGlvbnNdLFxuXG4gIGdldENvdXJzZUluZm86IGZ1bmN0aW9uKHNjaG9vbCwgY291cnNlX2lkKSB7XG4gICAgdGhpcy50cmlnZ2VyKHtsb2FkaW5nOiB0cnVlfSk7XG4gICAgJC5nZXQoXCIvY291cnNlcy9cIisgc2Nob29sICsgXCIvaWQvXCIgKyBjb3Vyc2VfaWQsIFxuICAgICAgICAge30sIFxuICAgICAgICAgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcih7aW5mb19sb2FkaW5nOiBmYWxzZSwgY291cnNlX2luZm86IHJlc3BvbnNlfSk7XG4gICAgICAgICB9LmJpbmQodGhpcylcbiAgICApO1xuXG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge2NvdXJzZV9pbmZvOiBudWxsLCBpbmZvX2xvYWRpbmc6IHRydWV9O1xuICB9XG59KTtcbiIsInZhciBUb2FzdCA9IHJlcXVpcmUoJy4uL3RvYXN0Jyk7XG52YXIgVG9hc3RBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy90b2FzdF9hY3Rpb25zLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZVN0b3JlKHtcbiAgbGlzdGVuYWJsZXM6IFtUb2FzdEFjdGlvbnNdLFxuXG4gIGNyZWF0ZVRvYXN0OiBmdW5jdGlvbihjb250ZW50KSB7XG4gICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2FzdC1jb250YWluZXInKTtcbiAgICBSZWFjdERPTS51bm1vdW50Q29tcG9uZW50QXROb2RlKGNvbnRhaW5lcik7XG4gICAgUmVhY3RET00ucmVuZGVyKFxuICAgICAgPFRvYXN0IGNvbnRlbnQ9e2NvbnRlbnR9IC8+LFxuICAgICAgY29udGFpbmVyXG4gICAgKTtcbiAgfSxcblxuXG59KTtcbiIsInZhciBhY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFRvYXN0QWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvdG9hc3RfYWN0aW9ucy5qcycpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3RpbWV0YWJsZV91dGlsJyk7XG5cbmZ1bmN0aW9uIHJhbmRvbVN0cmluZyhsZW5ndGgsIGNoYXJzKSB7XG4gICAgdmFyIHJlc3VsdCA9ICcnO1xuICAgIGZvciAodmFyIGkgPSBsZW5ndGg7IGkgPiAwOyAtLWkpIHJlc3VsdCArPSBjaGFyc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjaGFycy5sZW5ndGgpXTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5TSUQgPSByYW5kb21TdHJpbmcoMzAsICchPygpKiZeJSQjQCFbXTAxMjM0NTY3ODlhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ekFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaJyk7XG5cblRUX1NUQVRFID0ge1xuICBzY2hvb2w6IFwiamh1XCIsXG4gIHNlbWVzdGVyOiBcIlNcIixcbiAgY291cnNlc190b19zZWN0aW9uczoge30sXG4gIHByZWZlcmVuY2VzOiB7XG4gICAgJ25vX2NsYXNzZXNfYmVmb3JlJzogZmFsc2UsXG4gICAgJ25vX2NsYXNzZXNfYWZ0ZXInOiBmYWxzZSxcbiAgICAnbG9uZ193ZWVrZW5kJzogZmFsc2UsXG4gICAgJ2dyb3VwZWQnOiBmYWxzZSxcbiAgICAnZG9fcmFua2luZyc6IGZhbHNlLFxuICAgICd0cnlfd2l0aF9jb25mbGljdHMnOiBmYWxzZVxuICB9LFxuICBzaWQ6IFNJRCxcbn1cblxuU0NIT09MX0xJU1QgPSBbXCJqaHVcIiwgXCJ1b2Z0XCJdO1xuXG4vLyBmbGFnIHRvIGNoZWNrIGlmIHRoZSB1c2VyIGp1c3QgdHVybmVkIGNvbmZsaWN0cyBvZmZcbkNPTkZMSUNUX09GRiA9IGZhbHNlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlZmx1eC5jcmVhdGVTdG9yZSh7XG4gIGxpc3RlbmFibGVzOiBbYWN0aW9uc10sXG4gIGNvdXJzZXNfdG9fc2VjdGlvbnM6IHt9LFxuICBsb2FkaW5nOiBmYWxzZSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0aW1ldGFibGVzOiBbXSwgXG4gICAgICBwcmVmZXJlbmNlczogVFRfU1RBVEUucHJlZmVyZW5jZXMsXG4gICAgICBjb3Vyc2VzX3RvX3NlY3Rpb25zOiB7fSwgXG4gICAgICBjdXJyZW50X2luZGV4OiAtMSwgXG4gICAgICBjb25mbGljdF9lcnJvcjogZmFsc2UsXG4gICAgICBsb2FkaW5nOiBmYWxzZSwgLy8gdGltZXRhYmxlcyBsb2FkaW5nXG4gICAgICBjb3Vyc2VzX2xvYWRpbmc6IGZhbHNlLFxuICAgICAgc2Nob29sOiBcIlwifTtcbiAgfSxcblxuICBzZXRTY2hvb2w6IGZ1bmN0aW9uKG5ld19zY2hvb2wpIHtcbiAgICB2YXIgc2Nob29sID0gU0NIT09MX0xJU1QuaW5kZXhPZihuZXdfc2Nob29sKSA+IC0xID8gbmV3X3NjaG9vbCA6IFwiXCI7XG4gICAgdmFyIG5ld19zdGF0ZSA9IHRoaXMuZ2V0SW5pdGlhbFN0YXRlKCk7XG4gICAgVFRfU1RBVEUuc2Nob29sID0gc2Nob29sO1xuICAgIG5ld19zdGF0ZS5zY2hvb2wgPSBzY2hvb2w7XG4gICAgdGhpcy50cmlnZ2VyKG5ld19zdGF0ZSk7XG4gIH0sXG4gLyoqXG4gICogVXBkYXRlIFRUX1NUQVRFIHdpdGggbmV3IGNvdXJzZSByb3N0ZXJcbiAgKiBAcGFyYW0ge29iamVjdH0gbmV3X2NvdXJzZV93aXRoX3NlY3Rpb24gY29udGFpbnMgYXR0cmlidXRlZCBpZCwgc2VjdGlvbiwgcmVtb3ZpbmdcbiAgKiBAcmV0dXJuIHt2b2lkfSBkb2VzIG5vdCByZXR1cm4gYW55dGhpbmcsIGp1c3QgdXBkYXRlcyBUVF9TVEFURVxuICAqL1xuICB1cGRhdGVDb3Vyc2VzOiBmdW5jdGlvbihuZXdfY291cnNlX3dpdGhfc2VjdGlvbikge1xuICAgIGlmICh0aGlzLmxvYWRpbmcpIHtyZXR1cm47fSAvLyBpZiBsb2FkaW5nLCBkb24ndCBwcm9jZXNzLlxuICAgIHRoaXMubG9hZGluZyA9IHRydWU7XG4gICAgdGhpcy50cmlnZ2VyKHtsb2FkaW5nOnRydWV9KTtcblxuICAgIHZhciByZW1vdmluZyA9IG5ld19jb3Vyc2Vfd2l0aF9zZWN0aW9uLnJlbW92aW5nO1xuICAgIHZhciBuZXdfY291cnNlX2lkID0gbmV3X2NvdXJzZV93aXRoX3NlY3Rpb24uaWQ7XG4gICAgdmFyIHNlY3Rpb24gPSBuZXdfY291cnNlX3dpdGhfc2VjdGlvbi5zZWN0aW9uO1xuICAgIHZhciBuZXdfc3RhdGUgPSAkLmV4dGVuZCh0cnVlLCB7fSwgVFRfU1RBVEUpOyAvLyBkZWVwIGNvcHkgb2YgVFRfU1RBVEVcbiAgICB2YXIgY190b19zID0gbmV3X3N0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnM7XG4gICAgaWYgKCFyZW1vdmluZykgeyAvLyBhZGRpbmcgY291cnNlXG4gICAgICBpZiAoVFRfU1RBVEUuc2Nob29sID09IFwiamh1XCIpIHtcbiAgICAgICAgaWYgKGNfdG9fc1tuZXdfY291cnNlX2lkXSkge1xuICAgICAgICAgIHZhciBuZXdfc2VjdGlvbiA9IGNfdG9fc1tuZXdfY291cnNlX2lkXVsnQyddICE9IFwiXCIgPyBcIlwiIDogc2VjdGlvbjtcbiAgICAgICAgICBjX3RvX3NbbmV3X2NvdXJzZV9pZF1bJ0MnXSA9IG5ld19zZWN0aW9uO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNfdG9fc1tuZXdfY291cnNlX2lkXSA9IHsnTCc6ICcnLCAnVCc6ICcnLCAnUCc6ICcnLCAnQyc6IHNlY3Rpb259O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChUVF9TVEFURS5zY2hvb2wgPT0gXCJ1b2Z0XCIpIHtcbiAgICAgICAgdmFyIGxvY2tlZF9zZWN0aW9ucyA9IGNfdG9fc1tuZXdfY291cnNlX2lkXSA9PSBudWxsID8geydMJzogJycsICdUJzogJycsICdQJzogJycsICdDJzogJyd9IDogLy8gdGhpcyBpcyB3aGF0IHdlIHdhbnQgdG8gc2VuZCBpZiBub3QgbG9ja2luZ1xuICAgICAgICAgIGNfdG9fc1tuZXdfY291cnNlX2lkXTtcbiAgICAgICAgaWYgKHNlY3Rpb24gJiYgc2VjdGlvbiAhPSBcIlwiKSB7XG4gICAgICAgICAgdmFyIG5ld19zZWN0aW9uID0gc2VjdGlvbjtcbiAgICAgICAgICBpZiAoY190b19zW25ld19jb3Vyc2VfaWRdW3NlY3Rpb25bMF1dICE9IFwiXCIpIHtuZXdfc2VjdGlvbiA9IFwiXCI7fSAvLyB1bmxvY2tpbmcgc2luY2Ugc2VjdGlvbiBwcmV2aW91c2x5IGV4aXN0ZWRcbiAgICAgICAgICBsb2NrZWRfc2VjdGlvbnNbc2VjdGlvblswXV0gPSBuZXdfc2VjdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBjX3RvX3NbbmV3X2NvdXJzZV9pZF0gPSBsb2NrZWRfc2VjdGlvbnM7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgeyAvLyByZW1vdmluZyBjb3Vyc2VcbiAgICAgIGRlbGV0ZSBjX3RvX3NbbmV3X2NvdXJzZV9pZF07XG4gICAgICBpZiAoT2JqZWN0LmtleXMoY190b19zKS5sZW5ndGggPT0gMCkgeyAvLyByZW1vdmVkIGxhc3QgY291cnNlXG4gICAgICAgICAgVFRfU1RBVEUuY291cnNlc190b19zZWN0aW9ucyA9IHt9O1xuICAgICAgICAgIHZhciByZXBsYWNlZCA9IHRoaXMuZ2V0SW5pdGlhbFN0YXRlKCk7XG4gICAgICAgICAgcmVwbGFjZWQuc2Nob29sID0gVFRfU1RBVEUuc2Nob29sO1xuICAgICAgICAgIHRoaXMubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMudHJpZ2dlcihyZXBsYWNlZCk7XG4gICAgICAgICAgcmV0dXJuOyAgXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMubWFrZVJlcXVlc3QobmV3X3N0YXRlKTtcbiAgfSxcblxuIC8qKlxuICAqIFVwZGF0ZSBUVF9TVEFURSB3aXRoIG5ldyBwcmVmZXJlbmNlc1xuICAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmZXJlbmNlOiB0aGUgcHJlZmVyZW5jZSB0aGF0IGlzIGJlaW5nIHVwZGF0ZWRcbiAgKiBAcGFyYW0gbmV3X3ZhbHVlOiB0aGUgbmV3IHZhbHVlIG9mIHRoZSBzcGVjaWZpZWQgcHJlZmVyZW5jZVxuICAqIEByZXR1cm4ge3ZvaWR9IGRvZXNuJ3QgcmV0dXJuIGFueXRoaW5nLCBqdXN0IHVwZGF0ZXMgVFRfU1RBVEVcbiAgKi9cbiAgdXBkYXRlUHJlZmVyZW5jZXM6IGZ1bmN0aW9uKHByZWZlcmVuY2UsIG5ld192YWx1ZSkge1xuICAgIHZhciBuZXdfc3RhdGUgPSAkLmV4dGVuZCh0cnVlLCB7fSwgVFRfU1RBVEUpOyAvLyBkZWVwIGNvcHkgb2YgVFRfU1RBVEVcbiAgICBpZiAocHJlZmVyZW5jZSA9PSAndHJ5X3dpdGhfY29uZmxpY3RzJyAmJiBuZXdfdmFsdWUgPT0gZmFsc2UpIHtcbiAgICAgIENPTkZMSUNUX09GRiA9IHRydWU7XG4gICAgfVxuICAgIG5ld19zdGF0ZS5wcmVmZXJlbmNlc1twcmVmZXJlbmNlXSA9IG5ld192YWx1ZTtcbiAgICB0aGlzLnRyaWdnZXIoe3ByZWZlcmVuY2VzOiBuZXdfc3RhdGUucHJlZmVyZW5jZXN9KTtcbiAgICB0aGlzLm1ha2VSZXF1ZXN0KG5ld19zdGF0ZSk7XG4gIH0sXG5cbiAgLy8gTWFrZXMgYSBQT1NUIHJlcXVlc3QgdG8gdGhlIGJhY2tlbmQgd2l0aCBUVF9TVEFURVxuICBtYWtlUmVxdWVzdDogZnVuY3Rpb24obmV3X3N0YXRlKSB7XG4gICAgdGhpcy50cmlnZ2VyKHtsb2FkaW5nOiB0cnVlfSk7XG4gICAgJC5wb3N0KCcvJywgSlNPTi5zdHJpbmdpZnkobmV3X3N0YXRlKSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgdGhpcy5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIGlmIChyZXNwb25zZS5lcnJvcikgeyAvLyBlcnJvciBmcm9tIFVSTCBvciBsb2NhbCBzdG9yYWdlXG4gICAgICAgICAgaWYodHlwZW9mKFN0b3JhZ2UpICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnZGF0YScpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBUVF9TVEFURS5jb3Vyc2VzX3RvX3NlY3Rpb25zID0ge307XG4gICAgICAgICAgdmFyIHJlcGxhY2VkID0gdGhpcy5nZXRJbml0aWFsU3RhdGUoKTtcbiAgICAgICAgICByZXBsYWNlZC5zY2hvb2wgPSBUVF9TVEFURS5zY2hvb2w7XG4gICAgICAgICAgdGhpcy50cmlnZ2VyKHJlcGxhY2VkKTtcbiAgICAgICAgICByZXR1cm47IC8vIHN0b3AgcHJvY2Vzc2luZyBoZXJlXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc3BvbnNlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBUVF9TVEFURSA9IG5ld19zdGF0ZTsgLy9vbmx5IHVwZGF0ZSBzdGF0ZSBpZiBzdWNjZXNzZnVsXG4gICAgICAgICAgdmFyIGluZGV4ID0gMDtcbiAgICAgICAgICBpZiAobmV3X3N0YXRlLmluZGV4ICYmIG5ld19zdGF0ZS5pbmRleCA8IHJlc3BvbnNlLmxlbmd0aCkge1xuICAgICAgICAgICAgaW5kZXggPSBuZXdfc3RhdGUuaW5kZXg7XG4gICAgICAgICAgICBkZWxldGUgbmV3X3N0YXRlWydpbmRleCddO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnRyaWdnZXIoe1xuICAgICAgICAgICAgICB0aW1ldGFibGVzOiByZXNwb25zZSxcbiAgICAgICAgICAgICAgY291cnNlc190b19zZWN0aW9uczogVFRfU1RBVEUuY291cnNlc190b19zZWN0aW9ucyxcbiAgICAgICAgICAgICAgY3VycmVudF9pbmRleDogaW5kZXgsXG4gICAgICAgICAgICAgIGxvYWRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgICBwcmVmZXJlbmNlczogVFRfU1RBVEUucHJlZmVyZW5jZXNcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChUVF9TVEFURS5jb3Vyc2VzX3RvX3NlY3Rpb25zICE9IHt9KSB7IC8vIGNvbmZsaWN0XG4gICAgICAgICAgLy8gaWYgdHVybmluZyBjb25mbGljdHMgb2ZmIGxlZCB0byBhIGNvbmZsaWN0LCByZXByb21wdCB1c2VyXG4gICAgICAgICAgaWYgKENPTkZMSUNUX09GRikge1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHtcbiAgICAgICAgICAgICAgbG9hZGluZzogZmFsc2UsXG4gICAgICAgICAgICAgIGNvbmZsaWN0X2Vycm9yOiBmYWxzZSxcbiAgICAgICAgICAgICAgcHJlZmVyZW5jZXM6IFRUX1NUQVRFLnByZWZlcmVuY2VzXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgVG9hc3RBY3Rpb25zLmNyZWF0ZVRvYXN0KFwiUGxlYXNlIHJlbW92ZSBzb21lIGNvdXJzZXMgYmVmb3JlIHR1cm5pbmcgb2ZmIEFsbG93IENvbmZsaWN0c1wiKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHtcbiAgICAgICAgICAgICAgbG9hZGluZzogZmFsc2UsXG4gICAgICAgICAgICAgIGNvbmZsaWN0X2Vycm9yOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFRvYXN0QWN0aW9ucy5jcmVhdGVUb2FzdChcIlRoYXQgY291cnNlIGNhdXNlZCBhIGNvbmZsaWN0ISBUcnkgYWdhaW4gd2l0aCB0aGUgQWxsb3cgQ29uZmxpY3RzIHByZWZlcmVuY2UgdHVybmVkIG9uLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy50cmlnZ2VyKHtsb2FkaW5nOiBmYWxzZX0pO1xuICAgICAgICB9XG4gICAgICAgIENPTkZMSUNUX09GRiA9IGZhbHNlO1xuICAgIH0uYmluZCh0aGlzKSk7XG4gIH0sXG5cblxuICBsb2FkUHJlc2V0VGltZXRhYmxlOiBmdW5jdGlvbih1cmxfZGF0YSkge1xuICAgIHZhciBjb3Vyc2VzID0gdXJsX2RhdGEuc3BsaXQoXCImXCIpO1xuICAgIHZhciBzY2hvb2wgPSBVdGlsLmdldFVuaGFzaGVkU3RyaW5nKGNvdXJzZXMuc2hpZnQoKSk7XG4gICAgdmFyIHByZWZzID0gY291cnNlcy5zaGlmdCgpO1xuICAgIHZhciBwcmVmZXJlbmNlc19hcnJheSA9IHByZWZzLnNwbGl0KFwiO1wiKTtcbiAgICB2YXIgcHJlZl9vYmogPSB7fTtcbiAgICBmb3IgKHZhciBrIGluIHByZWZlcmVuY2VzX2FycmF5KSB7XG4gICAgICB2YXIgcHJlZl93aXRoX3ZhbCA9IHByZWZlcmVuY2VzX2FycmF5W2tdLnNwbGl0KFwiPVwiKTsgLy9lLmcuIFtcImFsbG93X2NvbmZsaWN0c1wiLCBcImZhbHNlXCJdXG4gICAgICB2YXIgcHJlZiA9IFV0aWwuZ2V0VW5oYXNoZWRTdHJpbmcocHJlZl93aXRoX3ZhbFswXSk7XG4gICAgICB2YXIgdmFsID0gQm9vbGVhbihVdGlsLmdldFVuaGFzaGVkU3RyaW5nKHByZWZfd2l0aF92YWxbMV0pID09PSBcInRydWVcIik7XG5cbiAgICAgIHByZWZfb2JqW3ByZWZdID0gKHZhbCk7XG4gICAgfVxuICAgIHRoaXMudHJpZ2dlcih7bG9hZGluZzogdHJ1ZSwgc2Nob29sOiBzY2hvb2wsIHByZWZlcmVuY2VzOnByZWZfb2JqfSk7XG4gICAgVFRfU1RBVEUucHJlZmVyZW5jZXMgPSBwcmVmX29iajtcbiAgICBUVF9TVEFURS5zY2hvb2wgPSBzY2hvb2w7XG4gICAgVFRfU1RBVEUuaW5kZXggPSBwYXJzZUludChVdGlsLmdldFVuaGFzaGVkU3RyaW5nKGNvdXJzZXMuc2hpZnQoKSkpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291cnNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNvdXJzZV9pbmZvID0gY291cnNlc1tpXS5zcGxpdChcIitcIik7XG4gICAgICB2YXIgYyA9IHBhcnNlSW50KFV0aWwuZ2V0VW5oYXNoZWRTdHJpbmcoY291cnNlX2luZm8uc2hpZnQoKSkpO1xuXG4gICAgICBUVF9TVEFURS5jb3Vyc2VzX3RvX3NlY3Rpb25zW2NdID0geydMJzogJycsICdUJzogJycsICdQJzogJycsICdDJzogJyd9O1xuICAgICAgaWYgKGNvdXJzZV9pbmZvLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjb3Vyc2VfaW5mby5sZW5ndGg7IGorKykge1xuICAgICAgICAgIHZhciBzZWN0aW9uID0gVXRpbC5nZXRVbmhhc2hlZFN0cmluZyhjb3Vyc2VfaW5mb1tqXSk7XG4gICAgICAgICAgaWYgKHNjaG9vbCA9PSBcInVvZnRcIikge1xuICAgICAgICAgICAgVFRfU1RBVEUuY291cnNlc190b19zZWN0aW9uc1tjXVtzZWN0aW9uWzBdXSA9IHNlY3Rpb247XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKHNjaG9vbCA9PSBcImpodVwiKSB7XG4gICAgICAgICAgICBUVF9TVEFURS5jb3Vyc2VzX3RvX3NlY3Rpb25zW2NdWydDJ10gPSBzZWN0aW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLm1ha2VSZXF1ZXN0KFRUX1NUQVRFKTtcbiAgfSxcblxuICBzZXRDb3Vyc2VzTG9hZGluZzogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy50cmlnZ2VyKHtjb3Vyc2VzX2xvYWRpbmc6IHRydWV9KTtcbiAgfSxcbiAgc2V0Q291cnNlc0RvbmVMb2FkaW5nOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnRyaWdnZXIoe2NvdXJzZXNfbG9hZGluZzogZmFsc2V9KTtcbiAgfSxcbiAgc2V0Q3VycmVudEluZGV4OiBmdW5jdGlvbihuZXdfaW5kZXgpIHtcbiAgICB0aGlzLnRyaWdnZXIoe2N1cnJlbnRfaW5kZXg6IG5ld19pbmRleH0pO1xuICB9LFxuXG59KTtcblxuJCh3aW5kb3cpLm9uKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbigpIHtcbiAgJC5hamF4KHtcbiAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgIGFzeW5jOiBmYWxzZSxcbiAgICAgIHVybDogJy9leGl0JyxcbiAgICAgIGRhdGE6IHtzaWQ6IFNJRH1cbiAgfSk7XG59KTtcblxuIiwidmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBUaW1ldGFibGVTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgU2ltcGxlTW9kYWwgPSByZXF1aXJlKCcuL3NpbXBsZV9tb2RhbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgbWl4aW5zOiBbUmVmbHV4LmNvbm5lY3QoVGltZXRhYmxlU3RvcmUpXSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICBcdHZhciBodG1sID0gdGhpcy5wcm9wcy5jb3Vyc2VzLm1hcChmdW5jdGlvbihjKSB7XG4gIFx0XHRpZiAoIGMudGV4dGJvb2tzLmxlbmd0aCA+IDAgKSB7XG4gIFx0XHQgIHZhciBpbm5lcl9odG1sID0gYy50ZXh0Ym9va3MubWFwKGZ1bmN0aW9uKHRiKSB7XG5cdCAgXHRcdCAgaWYgKHRiWydpbWFnZV91cmwnXSA9PT0gXCJDYW5ub3QgYmUgZm91bmRcIikge1xuXHQgICAgICAgICAgICB2YXIgaW1nID0gJy9zdGF0aWMvaW1nL2RlZmF1bHRfY292ZXIuanBnJ1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgdmFyIGltZyA9IHRiWydpbWFnZV91cmwnXVxuXHQgICAgICAgICAgfVxuXHQgICAgICAgICAgaWYgKHRiWyd0aXRsZSddID09IFwiQ2Fubm90IGJlIGZvdW5kXCIpIHtcblx0ICAgICAgICAgICAgdmFyIHRpdGxlID0gXCIjXCIgKyAgdGJbJ2lzYm4nXVxuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgdmFyIHRpdGxlID0gdGJbJ3RpdGxlJ11cblx0ICAgICAgICAgIH1cblx0ICAgICAgICAgIHJldHVybiAoIFxuXHQgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHRib29rXCIga2V5PXt0YlsnaWQnXX0+XG5cdCAgICAgICAgICAgICAgICA8aW1nIGhlaWdodD1cIjEyNVwiIHNyYz17aW1nfS8+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1vZHVsZVwiPlxuXHQgICAgICAgICAgICAgICAgICA8aDYgY2xhc3NOYW1lPVwibGluZS1jbGFtcFwiPnt0aXRsZX08L2g2PlxuXHQgICAgICAgICAgICAgICAgICA8L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxhIGhyZWY9e3RiWydkZXRhaWxfdXJsJ119IHRhcmdldD1cIl9ibGFua1wiPlxuXHQgICAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImh0dHBzOi8vaW1hZ2VzLW5hLnNzbC1pbWFnZXMtYW1hem9uLmNvbS9pbWFnZXMvRy8wMS9hc3NvY2lhdGVzL3JlbW90ZS1idXktYm94L2J1eTUuX1YxOTIyMDc3MzlfLmdpZlwiIHdpZHRoPVwiMTIwXCIgaGVpZ2h0PVwiMjhcIiBib3JkZXI9XCIwXCIvPlxuXHQgICAgICAgICAgICAgICAgPC9hPlxuXHQgICAgICAgICAgICA8L2Rpdj4pO1xuICBcdFx0XHR9LmJpbmQodGhpcykpO1xuXHQgIFx0XHRyZXR1cm4gKFxuXHQgIFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwidGV4dGJvb2stbGlzdC1lbnRyeVwiPlxuXHQgIFx0XHRcdFx0PGg2PntjLm5hbWV9PC9oNj5cblx0ICBcdFx0XHRcdCA8ZGl2IGNsYXNzTmFtZT1cImNvdXJzZS1yb3N0ZXIgdGV4dGJvb2stbGlzdFwiPlxuXHQgIFx0XHRcdFx0XHR7aW5uZXJfaHRtbH1cblx0ICBcdFx0XHRcdDwvZGl2PlxuXHQgIFx0XHRcdDwvZGl2PilcbiAgXHRcdH1cbiAgXHRcdGVsc2Uge1xuICBcdFx0XHRyZXR1cm4gbnVsbFxuICBcdFx0fVxuICBcdH0uYmluZCh0aGlzKSk7XG4gICAgcmV0dXJuICg8ZGl2IGNsYXNzTmFtZT1cInRleHRib29rLWxpc3Qtd3JhcHBlclwiPntodG1sfTwvZGl2PilcbiAgfSxcblxufSk7IiwidmFyIFNsb3RNYW5hZ2VyID0gcmVxdWlyZSgnLi9zbG90X21hbmFnZXInKTtcbnZhciBQYWdpbmF0aW9uID0gcmVxdWlyZSgnLi9wYWdpbmF0aW9uJyk7XG52YXIgVXBkYXRlVGltZXRhYmxlc1N0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMnKTtcbnZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzJyk7XG52YXIgVG9hc3RBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3RvYXN0X2FjdGlvbnMnKTtcbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsL3RpbWV0YWJsZV91dGlsJyk7XG52YXIgTmV3UGFnaW5hdGlvbiA9IHJlcXVpcmUoJy4vbmV3X3BhZ2luYXRpb24nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIG1peGluczogW1JlZmx1eC5jb25uZWN0KFVwZGF0ZVRpbWV0YWJsZXNTdG9yZSldLFxuXG4gIHNldEluZGV4OiBmdW5jdGlvbihuZXdfaW5kZXgpIHtcbiAgICByZXR1cm4oZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKG5ld19pbmRleCA+PSAwICYmIG5ld19pbmRleCA8IHRoaXMuc3RhdGUudGltZXRhYmxlcy5sZW5ndGgpIHtcbiAgICAgICAgVGltZXRhYmxlQWN0aW9ucy5zZXRDdXJyZW50SW5kZXgobmV3X2luZGV4KTtcbiAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuICB9LFxuXG4gIGdldFNoYXJlTGluazogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxpbmsgPSB3aW5kb3cubG9jYXRpb24uaG9zdCArIFwiL1wiO1xuICAgIHZhciBkYXRhID0gdGhpcy5nZXREYXRhKCk7XG4gICAgcmV0dXJuIGxpbmsgKyBkYXRhO1xuICB9LFxuICBnZXREYXRhOiBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIFV0aWwuZ2V0TGlua0RhdGEodGhpcy5zdGF0ZS5zY2hvb2wsXG4gICAgICB0aGlzLnN0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnMsXG4gICAgICB0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXgsIHRoaXMuc3RhdGUucHJlZmVyZW5jZXMpO1xuICB9LFxuICBnZXRFbmRIb3VyOiBmdW5jdGlvbigpIHtcbiAgICAvLyBnZXRzIHRoZSBlbmQgaG91ciBvZiB0aGUgY3VycmVudCB0aW1ldGFibGVcbiAgICB2YXIgbWF4X2VuZF9ob3VyID0gMTg7XG4gICAgaWYgKCF0aGlzLmhhc1RpbWV0YWJsZXMoKSkge1xuICAgICAgcmV0dXJuIG1heF9lbmRfaG91cjtcbiAgICB9XG4gICAgdmFyIGNvdXJzZXMgPSB0aGlzLnN0YXRlLnRpbWV0YWJsZXNbdGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4XS5jb3Vyc2VzO1xuICAgIGZvciAodmFyIGNvdXJzZV9pbmRleCBpbiBjb3Vyc2VzKSB7XG4gICAgICB2YXIgY291cnNlID0gY291cnNlc1tjb3Vyc2VfaW5kZXhdO1xuICAgICAgZm9yICh2YXIgc2xvdF9pbmRleCBpbiBjb3Vyc2Uuc2xvdHMpIHtcbiAgICAgICAgdmFyIHNsb3QgPSBjb3Vyc2Uuc2xvdHNbc2xvdF9pbmRleF07XG4gICAgICAgIHZhciBlbmRfaG91ciA9IHBhcnNlSW50KHNsb3QudGltZV9lbmQuc3BsaXQoXCI6XCIpWzBdKTtcbiAgICAgICAgbWF4X2VuZF9ob3VyID0gTWF0aC5tYXgobWF4X2VuZF9ob3VyLCBlbmRfaG91cik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtYXhfZW5kX2hvdXI7XG5cbiAgfSxcblxuICBnZXRIb3VyUm93czogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1heF9lbmRfaG91ciA9IHRoaXMuZ2V0RW5kSG91cigpO1xuICAgIHZhciByb3dzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDg7IGkgPD0gbWF4X2VuZF9ob3VyOyBpKyspIHsgLy8gb25lIHJvdyBmb3IgZWFjaCBob3VyLCBzdGFydGluZyBmcm9tIDhhbVxuICAgICAgdmFyIHRpbWUgPSBpICsgXCJhbVwiO1xuICAgICAgaWYgKGkgPj0gMTIpIHsgLy8gdGhlIHBtIGhvdXJzXG4gICAgICAgIHZhciBob3VyID0gKGkgLSAxMikgPiAwID8gaSAtIDEyIDogaTtcbiAgICAgICAgdGltZSA9IGhvdXIgKyBcInBtXCI7XG4gICAgICB9XG4gICAgICByb3dzLnB1c2goXG4gICAgICAgICAgKDx0ciBrZXk9e3RpbWV9PlxuICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+e3RpbWV9PC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgPC90cj4pXG4gICAgICApOyAgXG4gICAgICAvLyBmb3IgdGhlIGhhbGYgaG91ciByb3dcbiAgICAgIHJvd3MucHVzaChcbiAgICAgICAgICAoPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCIga2V5PXt0aW1lICsgXCItaGFsZlwifT5cbiAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgPC90cj4pXG4gICAgICApO1xuXG4gICAgfVxuXG4gICAgcmV0dXJuIHJvd3M7XG4gIH0sXG5cblxuICBoYXNUaW1ldGFibGVzOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZS50aW1ldGFibGVzLmxlbmd0aCA+IDA7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBoYXNfdGltZXRhYmxlcyA9IHRoaXMuaGFzVGltZXRhYmxlcygpO1xuICAgICAgdmFyIHNsb3RfbWFuYWdlciA9ICFoYXNfdGltZXRhYmxlcyA/IG51bGwgOlxuICAgICAgICg8U2xvdE1hbmFnZXIgdG9nZ2xlTW9kYWw9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWx9IFxuICAgICAgICAgICAgICAgICAgICAgdGltZXRhYmxlPXt0aGlzLnN0YXRlLnRpbWV0YWJsZXNbdGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4XX1cbiAgICAgICAgICAgICAgICAgICAgIGNvdXJzZXNfdG9fc2VjdGlvbnM9e3RoaXMuc3RhdGUuY291cnNlc190b19zZWN0aW9uc31cbiAgICAgICAgICAgICAgICAgICAgIHNjaG9vbD17dGhpcy5zdGF0ZS5zY2hvb2x9Lz4pO1xuXG4gICAgICB2YXIgaG91cnMgPSB0aGlzLmdldEhvdXJSb3dzKCk7XG4gICAgICB2YXIgb3BhY2l0eSA9IHRoaXMuc3RhdGUubG9hZGluZyA/IHtvcGFjaXR5OiBcIjAuNVwifSA6IHt9O1xuICAgICAgdmFyIGhlaWdodCA9ICg1NzIgKyAodGhpcy5nZXRFbmRIb3VyKCkgLSAxOCkqNTIpICsgXCJweFwiO1xuICAgICAgcmV0dXJuIChcblxuICAgICAgICAgIDxkaXYgaWQ9XCJjYWxlbmRhclwiIGNsYXNzTmFtZT1cImZjIGZjLWx0ciBmYy11bnRoZW1lZFwiIHN0eWxlPXtvcGFjaXR5fT5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10b29sYmFyXCI+XG4gICAgICAgICAgICAgICAgPFBhZ2luYXRpb24gXG4gICAgICAgICAgICAgICAgICBjb3VudD17dGhpcy5zdGF0ZS50aW1ldGFibGVzLmxlbmd0aH0gXG4gICAgICAgICAgICAgICAgICBuZXh0PXt0aGlzLnNldEluZGV4KHRoaXMuc3RhdGUuY3VycmVudF9pbmRleCArIDEpfSBcbiAgICAgICAgICAgICAgICAgIHByZXY9e3RoaXMuc2V0SW5kZXgodGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4IC0gMSl9XG4gICAgICAgICAgICAgICAgICBzZXRJbmRleD17dGhpcy5zZXRJbmRleH1cbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRfaW5kZXg9e3RoaXMuc3RhdGUuY3VycmVudF9pbmRleH0vPlxuICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeSByaWdodCBjYWxlbmRhci1mdW5jdGlvblwiXG4gICAgICAgICAgICAgICAgICAgZGF0YS1jbGlwYm9hcmQtdGV4dD17dGhpcy5nZXRTaGFyZUxpbmsoKX0+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmdWktY2xpcFwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1jbGVhclwiPjwvZGl2PlxuXG5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy12aWV3LWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdmlldyBmYy1hZ2VuZGFXZWVrLXZpZXcgZmMtYWdlbmRhLXZpZXdcIj5cbiAgICAgICAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtcm93IGZjLXdpZGdldC1oZWFkZXJcIiBpZD1cImN1c3RvbS13aWRnZXQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtd2lkZ2V0LWhlYWRlclwiPjwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWRheS1oZWFkZXIgZmMtd2lkZ2V0LWhlYWRlciBmYy1tb25cIj5Nb24gPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwiZmMtZGF5LWhlYWRlciBmYy13aWRnZXQtaGVhZGVyIGZjLXR1ZVwiPlR1ZSA8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJmYy1kYXktaGVhZGVyIGZjLXdpZGdldC1oZWFkZXIgZmMtd2VkXCI+V2VkIDwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWRheS1oZWFkZXIgZmMtd2lkZ2V0LWhlYWRlciBmYy10aHVcIj5UaHUgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwiZmMtZGF5LWhlYWRlciBmYy13aWRnZXQtaGVhZGVyIGZjLWZyaVwiPkZyaSA8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90aGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgPC90aGVhZD5cblxuICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtZGF5LWdyaWRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtY29udGVudC1za2VsZXRvblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpc1wiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRpbWUtZ3JpZC1jb250YWluZXIgZmMtc2Nyb2xsZXJcIiBpZD1cImNhbGVuZGFyLWlubmVyXCIgc3R5bGU9e3toZWlnaHQ6IGhlaWdodH19PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdGltZS1ncmlkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWJnXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWRheSBmYy13aWRnZXQtY29udGVudCBmYy1tb25cIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtZGF5IGZjLXdpZGdldC1jb250ZW50IGZjLXR1ZVwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1kYXkgZmMtd2lkZ2V0LWNvbnRlbnQgZmMtd2VkXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWRheSBmYy13aWRnZXQtY29udGVudCBmYy10aHVcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtZGF5IGZjLXdpZGdldC1jb250ZW50IGZjLWZyaVwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtc2xhdHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtob3Vyc31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aHIgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWhlYWRlclwiIGlkPVwid2lkZ2V0LWhyXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtY29udGVudC1za2VsZXRvblwiIGlkPVwic2xvdC1tYW5hZ2VyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtzbG90X21hbmFnZXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgKTtcbiAgfSxcblxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNsaXAgPSBuZXcgQ2xpcGJvYXJkKCcuY2FsZW5kYXItZnVuY3Rpb24nKTtcbiAgICBjbGlwLm9uKCdzdWNjZXNzJywgZnVuY3Rpb24oZSkge1xuICAgICAgVG9hc3RBY3Rpb25zLmNyZWF0ZVRvYXN0KFwiTGluayBjb3BpZWQgdG8gY2xpcGJvYXJkIVwiKTtcbiAgICB9KTtcbiAgfSxcblxuICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgIGlmKHR5cGVvZihTdG9yYWdlKSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaWYgKHRoaXMuc3RhdGUudGltZXRhYmxlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vIHNhdmUgbmV3bHkgZ2VuZXJhdGVkIGNvdXJzZXMgdG8gbG9jYWwgc3RvcmFnZVxuICAgICAgICB2YXIgbmV3X2RhdGEgPSB0aGlzLmdldERhdGEoKTtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2RhdGEnLCBuZXdfZGF0YSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnZGF0YScpO1xuICAgICAgfVxuICAgIH0gXG5cbiAgfSxcblxuXG59KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7dmlzaWJsZTogdHJ1ZX07XG5cdH0sXHRcdFxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICghdGhpcy5zdGF0ZS52aXNpYmxlKSB7cmV0dXJuIG51bGw7fVxuXHRcdHJldHVybiAoXG5cdFx0PGRpdiBjbGFzc05hbWU9XCJzZW0tdG9hc3Qtd3JhcHBlciB0b2FzdGluZ1wiPlxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZW0tdG9hc3RcIj57dGhpcy5wcm9wcy5jb250ZW50fTwvZGl2PlxuXHRcdDwvZGl2PlxuXHRcdCk7XG5cdH0sXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKHRoaXMuX3JlYWN0SW50ZXJuYWxJbnN0YW5jZSkgeyAvLyBpZiBtb3VudGVkIHN0aWxsXG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe3Zpc2libGU6IGZhbHNlfSk7XG5cdFx0XHR9XG5cdFx0fS5iaW5kKHRoaXMpLCA0MDAwKTtcblx0fSxcblxufSk7XG4iLCJ2YXIgaGFzaGlkcyA9IG5ldyBIYXNoaWRzKFwieDk4YXM3ZGhnJmgqYXNrZGpeaGFzIWtqP3h6PCE5XCIpO1xubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGdldExpbmtEYXRhOiBmdW5jdGlvbihzY2hvb2wsIGNvdXJzZXNfdG9fc2VjdGlvbnMsIGluZGV4LCBwcmVmZXJlbmNlcykge1xuXHRcdGlmIChPYmplY3Qua2V5cyhjb3Vyc2VzX3RvX3NlY3Rpb25zKS5sZW5ndGggPT0gMCkge3JldHVybiBcIlwiO31cblx0ICAgIHZhciBkYXRhID0gdGhpcy5nZXRIYXNoZWRTdHJpbmcoc2Nob29sKSArIFwiJlwiO1xuXHQgICAgZm9yICh2YXIgcHJlZiBpbiBwcmVmZXJlbmNlcykge1xuXHQgICAgXHR2YXIgZW5jb2RlZF9wID0gdGhpcy5nZXRIYXNoZWRTdHJpbmcocHJlZik7XG5cdCAgICBcdHZhciBlbmNvZGVkX3ZhbCA9IHRoaXMuZ2V0SGFzaGVkU3RyaW5nKHByZWZlcmVuY2VzW3ByZWZdKTtcblx0ICAgIFx0ZGF0YSArPSBlbmNvZGVkX3AgKyBcIj1cIiArIGVuY29kZWRfdmFsICsgXCI7XCI7XG5cdCAgICB9XG5cdCAgICBkYXRhID0gZGF0YS5zbGljZSgwLCAtMSk7XG5cdCAgICBkYXRhICs9IFwiJlwiICsgdGhpcy5nZXRIYXNoZWRTdHJpbmcoaW5kZXgpICsgXCImXCI7XG5cdCAgICB2YXIgY190b19zID0gY291cnNlc190b19zZWN0aW9ucztcblx0ICAgIGZvciAodmFyIGNvdXJzZV9pZCBpbiBjX3RvX3MpIHtcblx0ICAgICAgdmFyIGVuY29kZWRfY291cnNlX2lkID0gdGhpcy5nZXRIYXNoZWRTdHJpbmcoY291cnNlX2lkKTtcblx0ICAgICAgZGF0YSArPSBlbmNvZGVkX2NvdXJzZV9pZDtcblxuXHQgICAgICB2YXIgbWFwcGluZyA9IGNfdG9fc1tjb3Vyc2VfaWRdO1xuXHQgICAgICBmb3IgKHZhciBzZWN0aW9uX2hlYWRpbmcgaW4gbWFwcGluZykgeyAvLyBpLmUgJ0wnLCAnVCcsICdQJywgJ1MnXG5cdCAgICAgICAgaWYgKG1hcHBpbmdbc2VjdGlvbl9oZWFkaW5nXSAhPSBcIlwiKSB7XG5cdCAgICAgICAgICB2YXIgZW5jb2RlZF9zZWN0aW9uID0gdGhpcy5nZXRIYXNoZWRTdHJpbmcobWFwcGluZ1tzZWN0aW9uX2hlYWRpbmddKTtcblx0ICAgICAgICAgIGRhdGEgKz0gXCIrXCIgKyBlbmNvZGVkX3NlY3Rpb247IC8vIGRlbGltaXRlciBmb3Igc2VjdGlvbnMgbG9ja2VkXG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICAgIGRhdGEgKz0gXCImXCI7IC8vIGRlbGltaXRlciBmb3IgY291cnNlc1xuXHQgICAgfVxuXHQgICAgZGF0YSA9IGRhdGEuc2xpY2UoMCwgLTEpO1xuXHQgICAgaWYgKGRhdGEubGVuZ3RoIDwgMykge2RhdGEgPSBcIlwiO31cblxuXHQgICAgcmV0dXJuIGRhdGE7XG5cdH0sXG5cblx0Z2V0SGFzaGVkU3RyaW5nOiBmdW5jdGlvbih4KSB7XG5cdFx0eCA9IFN0cmluZyh4KTtcblx0XHR2YXIgaGV4ZWQgPSBCdWZmZXIoeCkudG9TdHJpbmcoJ2hleCcpO1xuICAgIFx0dmFyIGVuY29kZWRfeCA9IGhhc2hpZHMuZW5jb2RlSGV4KGhleGVkKTtcbiAgICBcdGlmICghZW5jb2RlZF94IHx8IGVuY29kZWRfeCA9PSBcIlwiKSB7XG4gICAgXHRcdGNvbnNvbGUubG9nKHgpO1xuICAgIFx0fVxuICAgIFx0cmV0dXJuIGVuY29kZWRfeDtcblx0fSxcblxuXHRnZXRVbmhhc2hlZFN0cmluZzogZnVuY3Rpb24oeCkge1xuXHRcdHZhciBkZWNvZGVkSGV4ID0gaGFzaGlkcy5kZWNvZGVIZXgoeCk7XG5cdFx0dmFyIHN0cmluZyA9IEJ1ZmZlcihkZWNvZGVkSGV4LCAnaGV4JykudG9TdHJpbmcoJ3V0ZjgnKTtcblx0XHRyZXR1cm4gc3RyaW5nO1xuXHR9LFxuXG59XG4iXX0=
