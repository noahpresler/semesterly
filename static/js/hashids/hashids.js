/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

/* eslint-disable prefer-spread */
/* eslint-disable no-underscore-dangle */

/*

	Hashids
	http://hashids.org/javascript
	(c) 2013 Ivan Akimov

	https://github.com/ivanakimov/hashids.js
	hashids may be freely distributed under the MIT license.

*/

/* jslint plusplus: true, nomen: true, browser: true */
/* global define */

// eslint-disable-next-line no-unused-vars
const Hashids = (() => {

  // eslint-disable-next-line no-shadow
  function Hashids(salt, minHashLength, alphabet) {
    let uniqueAlphabet;
    let i;
    let j;
    let len;
    let sepsLength;
    let diff;

    this.version = "1.0.1";

    /* internal settings */

    this.minAlphabetLength = 16;
    this.sepDiv = 3.5;
    this.guardDiv = 12;

    /* error messages */

    this.errorAlphabetLength =
      "error: alphabet must contain at least X unique characters";
    this.errorAlphabetSpace = "error: alphabet cannot contain spaces";

    /* alphabet consts */

    this.alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    this.seps = "cfhistuCFHISTU";
    this.minHashLength = parseInt(minHashLength, 10) > 0 ? minHashLength : 0;
    this.salt = typeof salt === "string" ? salt : "";

    if (typeof alphabet === "string") {
      this.alphabet = alphabet;
    }

    for (uniqueAlphabet = "", i = 0, len = this.alphabet.length; i !== len; i++) {
      if (uniqueAlphabet.indexOf(this.alphabet[i]) === -1) {
        uniqueAlphabet += this.alphabet[i];
      }
    }

    this.alphabet = uniqueAlphabet;

    if (this.alphabet.length < this.minAlphabetLength) {
      throw this.errorAlphabetLength.replace("X", this.minAlphabetLength);
    }

    if (this.alphabet.search(" ") !== -1) {
      throw this.errorAlphabetSpace;
    }

    /* seps should contain only characters present in alphabet; alphabet should not contains seps */

    for (i = 0, len = this.seps.length; i !== len; i++) {
      j = this.alphabet.indexOf(this.seps[i]);
      if (j === -1) {
        this.seps = `${this.seps.substr(0, i)  } ${  this.seps.substr(i + 1)}`;
      } else {
        this.alphabet = `${this.alphabet.substr(0, j)  } ${  this.alphabet.substr(j + 1)}`;
      }
    }

    this.alphabet = this.alphabet.replace(/ /g, "");

    this.seps = this.seps.replace(/ /g, "");
    this.seps = this.consistentShuffle(this.seps, this.salt);

    if (!this.seps.length || this.alphabet.length / this.seps.length > this.sepDiv) {
      sepsLength = Math.ceil(this.alphabet.length / this.sepDiv);

      if (sepsLength === 1) {
        sepsLength++;
      }

      if (sepsLength > this.seps.length) {
        diff = sepsLength - this.seps.length;
        this.seps += this.alphabet.substr(0, diff);
        this.alphabet = this.alphabet.substr(diff);
      } else {
        this.seps = this.seps.substr(0, sepsLength);
      }
    }

    this.alphabet = this.consistentShuffle(this.alphabet, this.salt);
    const guardCount = Math.ceil(this.alphabet.length / this.guardDiv);

    if (this.alphabet.length < 3) {
      this.guards = this.seps.substr(0, guardCount);
      this.seps = this.seps.substr(guardCount);
    } else {
      this.guards = this.alphabet.substr(0, guardCount);
      this.alphabet = this.alphabet.substr(guardCount);
    }
  }

  Hashids.prototype.encode = () => {
    const ret = "";
    let i;
    let len;
    // eslint-disable-next-line no-undef
    let numbers = Array.prototype.slice.call(arguments);

    if (!numbers.length) {
      return ret;
    }

    if (numbers[0] instanceof Array) {
      numbers = numbers[0];
    }

    for (i = 0, len = numbers.length; i !== len; i++) {
      if (typeof numbers[i] !== "number" || numbers[i] % 1 !== 0 || numbers[i] < 0) {
        return ret;
      }
    }

    return this._encode(numbers);
  };

  Hashids.prototype.decode = (hash) => {
    const ret = [];

    if (!hash.length || typeof hash !== "string") {
      return ret;
    }

    return this._decode(hash, this.alphabet);
  };

  Hashids.prototype.encodeHex = (str) => {
    let i;
    let len;

    str = str.toString();
    if (!/^[0-9a-fA-F]+$/.test(str)) {
      return "";
    }

    const numbers = str.match(/[\w\W]{1,12}/g);

    for (i = 0, len = numbers.length; i !== len; i++) {
      numbers[i] = parseInt(`1${  numbers[i]}`, 16);
    }

    return this.encode.apply(this, numbers);
  };

  Hashids.prototype.decodeHex = (hash) => {
    let ret = [];
    let i;
    let len;
    const numbers = this.decode(hash);

    for (i = 0, len = numbers.length; i !== len; i++) {
      ret += numbers[i].toString(16).substr(1);
    }

    return ret;
  };

  Hashids.prototype._encode = (numbers) => {
    let ret;
    let i;
    let len;
    let number;
    let buffer;
    let last;
    let sepsIndex;
    let guardIndex;
    let guard;
    let excess;
    let alphabet = this.alphabet;
    const numbersSize = numbers.length;
    let numbersHashInt = 0;

    for (i = 0, len = numbers.length; i !== len; i++) {
      numbersHashInt += numbers[i] % (i + 100);
    }

    const lottery = alphabet[numbersHashInt % alphabet.length];
    ret = alphabet[numbersHashInt % alphabet.length];
    for (i = 0, len = numbers.length; i !== len; i++) {
      number = numbers[i];
      buffer = lottery + this.salt + alphabet;

      alphabet = this.consistentShuffle(alphabet, buffer.substr(0, alphabet.length));
      last = this.hash(number, alphabet);

      ret += last;

      if (i + 1 < numbersSize) {
        number %= last.charCodeAt(0) + i;
        sepsIndex = number % this.seps.length;
        ret += this.seps[sepsIndex];
      }
    }

    if (ret.length < this.minHashLength) {
      guardIndex = (numbersHashInt + ret[0].charCodeAt(0)) % this.guards.length;
      guard = this.guards[guardIndex];

      ret = guard + ret;

      if (ret.length < this.minHashLength) {
        guardIndex = (numbersHashInt + ret[2].charCodeAt(0)) % this.guards.length;
        guard = this.guards[guardIndex];

        ret += guard;
      }
    }

    const halfLength = parseInt(alphabet.length / 2, 10);
    while (ret.length < this.minHashLength) {
      alphabet = this.consistentShuffle(alphabet, alphabet);
      ret = alphabet.substr(halfLength) + ret + alphabet.substr(0, halfLength);

      excess = ret.length - this.minHashLength;
      if (excess > 0) {
        ret = ret.substr(excess / 2, this.minHashLength);
      }
    }

    return ret;
  };

  // eslint-disable-next-line no-underscore-dangle
  Hashids.prototype._decode = (hash, alphabet) => {
    let ret = [];
    let i = 0;
    let lottery;
    let len;
    let subHash;
    let buffer;
    let r = new RegExp(`[${  this.guards  }]`, "g");
    let hashBreakdown = hash.replace(r, " ");
    let hashArray = hashBreakdown.split(" ");

    if (hashArray.length === 3 || hashArray.length === 2) {
      i = 1;
    }

    hashBreakdown = hashArray[i];
    if (typeof hashBreakdown[0] !== "undefined") {
      lottery = hashBreakdown[0];
      hashBreakdown = hashBreakdown.substr(1);

      r = new RegExp(`[${  this.seps  }]`, "g");
      hashBreakdown = hashBreakdown.replace(r, " ");
      hashArray = hashBreakdown.split(" ");

      for (i = 0, len = hashArray.length; i !== len; i++) {
        subHash = hashArray[i];
        buffer = lottery + this.salt + alphabet;

        alphabet = this.consistentShuffle(alphabet, buffer.substr(0, alphabet.length));
        ret.push(this.unhash(subHash, alphabet));
      }

      // eslint-disable-next-line no-underscore-dangle
      if (this._encode(ret) !== hash) {
        ret = [];
      }
    }

    return ret;
  };

  Hashids.prototype.consistentShuffle = (alphabet, salt) => {
    let integer;
    let j;
    let temp;
    let i;
    let v;
    let p;

    if (!salt.length) {
      return alphabet;
    }

    for (i = alphabet.length - 1, v = 0, p = 0; i > 0; i--, v++) {
      v %= salt.length;
      // eslint-disable-next-line no-multi-assign
      p += integer = salt[v].charCodeAt(0);
      j = (integer + v + p) % i;

      temp = alphabet[j];
      alphabet = alphabet.substr(0, j) + alphabet[i] + alphabet.substr(j + 1);
      alphabet = alphabet.substr(0, i) + temp + alphabet.substr(i + 1);
    }

    return alphabet;
  };

  Hashids.prototype.hash = (input, alphabet) => {
    let hash = "";
    const alphabetLength = alphabet.length;

    do {
      hash = alphabet[input % alphabetLength] + hash;
      input = parseInt(input / alphabetLength, 10);
    } while (input);

    return hash;
  };

  Hashids.prototype.unhash = (input, alphabet) => {
    let number = 0;
    let pos;
    let i;

    for (i = 0; i < input.length; i++) {
      pos = alphabet.indexOf(input[i]);
      // eslint-disable-next-line no-restricted-properties
      number += pos * Math.pow(alphabet.length, input.length - i - 1);
    }

    return number;
  };

  /* require.js bit */

  if (typeof define === "function" && typeof define.amd === "object" && define.amd) {
    define(() => Hashids);
  }

  return Hashids;
})();
