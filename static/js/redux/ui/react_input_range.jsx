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

import PropTypes from "prop-types";
/* eslint-disable */
import React from "react";

!(function (e) {
  if (typeof exports === "object" && typeof module !== "undefined")
    module.exports = e();
  else if (typeof define === "function" && define.amd) define([], e);
  else {
    let t;
    (t =
      typeof window !== "undefined"
        ? window
        : typeof global !== "undefined"
        ? global
        : typeof self !== "undefined"
        ? self
        : this),
      (t.InputRange = e());
  }
})(() =>
  (function e(t, n, a) {
    function r(u, i) {
      if (!n[u]) {
        if (!t[u]) {
          const l = typeof require === "function" && require;
          if (!i && l) return l(u, !0);
          if (o) return o(u, !0);
          const s = new Error(`Cannot find module '${u}'`);
          throw ((s.code = "MODULE_NOT_FOUND"), s);
        }
        const p = (n[u] = { exports: {} });
        t[u][0].call(
          p.exports,
          (e) => {
            const n = t[u][1][e];
            return r(n || e);
          },
          p,
          p.exports,
          e,
          t,
          n,
          a
        );
      }
      return n[u].exports;
    }

    for (var o = typeof require === "function" && require, u = 0; u < a.length; u++)
      r(a[u]);
    return r;
  })(
    {
      1: [
        function (e, t, n) {
          (function (a) {
            function r(e) {
              return e && e.__esModule ? e : { default: e };
            }

            function o(e, t) {
              if (!(e instanceof t))
                throw new TypeError("Cannot call a class as a function");
            }

            function u(e, t) {
              if (typeof t !== "function" && t !== null)
                throw new TypeError(
                  `Super expression must either be null or a function, not ${typeof t}`
                );
              (e.prototype = Object.create(t && t.prototype, {
                constructor: {
                  value: e,
                  enumerable: !1,
                  writable: !0,
                  configurable: !0,
                },
              })),
                t &&
                  (Object.setPrototypeOf
                    ? Object.setPrototypeOf(e, t)
                    : (e.__proto__ = t));
            }

            function i(e, t) {
              const n = e.props;
              return e.isMultiValue
                ? t.min >= n.minValue && t.max <= n.maxValue && t.min < t.max
                : t.max >= n.minValue && t.max <= n.maxValue;
            }

            function l(e, t) {
              let n = e.props,
                a = j.default.valuesFromProps(e);
              return (
                (0, _.length)(t.min, a.min) >= n.step ||
                (0, _.length)(t.max, a.max) >= n.step
              );
            }

            function s(e, t) {
              return i(e, t) && l(e, t);
            }

            function p(e) {
              const t = e.refs.inputRange.ownerDocument;
              return t;
            }

            function f(e) {
              const t = e.props;
              return t.disabled
                ? `${t.classNames.component} is-disabled`
                : t.classNames.component;
            }

            function c(e, t) {
              return t === e.refs.sliderMin ? "min" : "max";
            }

            function d(e) {
              return e.isMultiValue ? ["min", "max"] : ["max"];
            }

            function h(e, t) {
              let n = j.default.valuesFromProps(e),
                a = j.default.positionsFromValues(e, n);
              if (e.isMultiValue) {
                let r = (0, _.distanceTo)(t, a.min),
                  o = (0, _.distanceTo)(t, a.max);
                if (o > r) return "min";
              }
              return "max";
            }

            function v(e) {
              let t = e.props.classNames,
                n = [],
                a = d(e),
                r = j.default.valuesFromProps(e),
                o = j.default.percentagesFromValues(e, r),
                u = !0,
                i = !1,
                l = void 0;
              try {
                for (
                  var s, p = a[Symbol.iterator]();
                  !(u = (s = p.next()).done);
                  u = !0
                ) {
                  let f = s.value,
                    c = r[f],
                    h = o[f],
                    v = `slider${(0, _.captialize)(f)}`,
                    m = e.props,
                    y = m.maxValue,
                    b = m.minValue;
                  f === "min" ? (y = r.max) : (b = r.min);
                  const w = React.createElement(T.default, {
                    ariaLabelledby: e.props.ariaLabelledby,
                    ariaControls: e.props.ariaControls,
                    classNames: t,
                    key: f,
                    maxValue: y,
                    minValue: b,
                    onSliderKeyDown: e.handleSliderKeyDown,
                    onSliderMouseMove: e.handleSliderMouseMove,
                    percentage: h,
                    ref: v,
                    type: f,
                    value: c,
                  });
                  n.push(w);
                }
              } catch (M) {
                (i = !0), (l = M);
              } finally {
                try {
                  !u && p.return && p.return();
                } finally {
                  if (i) throw l;
                }
              }
              return n;
            }

            function m(e) {
              let t = [],
                n = d(e),
                a = !0,
                r = !1,
                o = void 0;
              try {
                for (
                  var u, i = n[Symbol.iterator]();
                  !(a = (u = i.next()).done);
                  a = !0
                ) {
                  let l = u.value,
                    s = e.isMultiValue
                      ? `${e.props.name}${(0, _.captialize)(l)}`
                      : e.props.name;
                  React.createElement("input", { type: "hidden", name: s });
                }
              } catch (p) {
                (r = !0), (o = p);
              } finally {
                try {
                  !a && i.return && i.return();
                } finally {
                  if (r) throw o;
                }
              }
              return t;
            }

            Object.defineProperty(n, "__esModule", { value: !0 });
            var y = (function () {
                function e(e, t) {
                  for (let n = 0; n < t.length; n++) {
                    const a = t[n];
                    (a.enumerable = a.enumerable || !1),
                      (a.configurable = !0),
                      "value" in a && (a.writable = !0),
                      Object.defineProperty(e, a.key, a);
                  }
                }

                return function (t, n, a) {
                  return n && e(t.prototype, n), a && e(t, a), t;
                };
              })(),
              b = function (e, t, n) {
                for (let a = !0; a; ) {
                  let r = e,
                    o = t,
                    u = n;
                  (a = !1), r === null && (r = Function.prototype);
                  let i = Object.getOwnPropertyDescriptor(r, o);
                  if (void 0 !== i) {
                    if ("value" in i) return i.value;
                    const l = i.get;
                    if (void 0 === l) return;
                    return l.call(u);
                  }
                  let s = Object.getPrototypeOf(r);
                  if (s === null) return;
                  (e = s), (t = o), (n = u), (a = !0), (i = s = void 0);
                }
              },
              w =
                typeof window !== "undefined"
                  ? window.React
                  : typeof a !== "undefined"
                  ? a.React
                  : null,
              g = r(w),
              M = e("./Slider"),
              T = r(M),
              O = e("./Track"),
              P = r(O),
              V = e("./Label"),
              x = r(V),
              k = e("./defaultClassNames"),
              E = r(k),
              R = e("./valueTransformer"),
              j = r(R),
              _ = e("./util"),
              C = e("./propTypes"),
              D = new WeakMap(),
              N = { DOWN_ARROW: 40, LEFT_ARROW: 37, RIGHT_ARROW: 39, UP_ARROW: 38 },
              S = (function (e) {
                function t(e) {
                  o(this, t),
                    b(Object.getPrototypeOf(t.prototype), "constructor", this).call(
                      this,
                      e
                    ),
                    D.set(this, {}),
                    (0, _.autobind)(
                      [
                        "handleInteractionEnd",
                        "handleInteractionStart",
                        "handleKeyDown",
                        "handleKeyUp",
                        "handleMouseDown",
                        "handleMouseUp",
                        "handleSliderKeyDown",
                        "handleSliderMouseMove",
                        "handleTouchStart",
                        "handleTouchEnd",
                        "handleTrackMouseDown",
                      ],
                      this
                    );
                }

                return (
                  u(t, e),
                  y(t, [
                    {
                      key: "updatePosition",
                      value(e, t) {
                        let n = j.default.valuesFromProps(this),
                          a = j.default.positionsFromValues(this, n);
                        (a[e] = t), this.updatePositions(a);
                      },
                    },
                    {
                      key: "updatePositions",
                      value(e) {
                        let t = {
                            min: j.default.valueFromPosition(this, e.min),
                            max: j.default.valueFromPosition(this, e.max),
                          },
                          n = {
                            min: j.default.stepValueFromValue(this, t.min),
                            max: j.default.stepValueFromValue(this, t.max),
                          };
                        this.updateValues(n);
                      },
                    },
                    {
                      key: "updateValue",
                      value(e, t) {
                        const n = j.default.valuesFromProps(this);
                        (n[e] = t), this.updateValues(n);
                      },
                    },
                    {
                      key: "updateValues",
                      value(e) {
                        s(this, e) &&
                          (this.isMultiValue
                            ? this.props.onChange(this, e)
                            : this.props.onChange(this, e.max));
                      },
                    },
                    {
                      key: "incrementValue",
                      value(e) {
                        let t = j.default.valuesFromProps(this),
                          n = t[e] + this.props.step;
                        this.updateValue(e, n);
                      },
                    },
                    {
                      key: "decrementValue",
                      value(e) {
                        let t = j.default.valuesFromProps(this),
                          n = t[e] - this.props.step;
                        this.updateValue(e, n);
                      },
                    },
                    {
                      key: "handleSliderMouseMove",
                      value(e, t) {
                        if (!this.props.disabled) {
                          let n = c(this, t),
                            a = j.default.positionFromEvent(this, e);
                          this.updatePosition(n, a);
                        }
                      },
                    },
                    {
                      key: "handleSliderKeyDown",
                      value(e, t) {
                        if (!this.props.disabled) {
                          const n = c(this, t);
                          switch (e.keyCode) {
                            case N.LEFT_ARROW:
                            case N.DOWN_ARROW:
                              e.preventDefault(), this.decrementValue(n);
                              break;
                            case N.RIGHT_ARROW:
                            case N.UP_ARROW:
                              e.preventDefault(), this.incrementValue(n);
                          }
                        }
                      },
                    },
                    {
                      key: "handleTrackMouseDown",
                      value(e, t, n) {
                        if (!this.props.disabled) {
                          e.preventDefault();
                          const a = h(this, n);
                          this.updatePosition(a, n);
                        }
                      },
                    },
                    {
                      key: "handleInteractionStart",
                      value() {
                        const e = D.get(this);
                        this.props.onChangeComplete &&
                          !(0, _.isDefined)(e.startValue) &&
                          (e.startValue = this.props.value);
                      },
                    },
                    {
                      key: "handleInteractionEnd",
                      value() {
                        const e = D.get(this);
                        this.props.onChangeComplete &&
                          (0, _.isDefined)(e.startValue) &&
                          (e.startValue !== this.props.value &&
                            this.props.onChangeComplete(this, this.props.value),
                          (e.startValue = null));
                      },
                    },
                    {
                      key: "handleKeyDown",
                      value(e) {
                        this.handleInteractionStart(e);
                      },
                    },
                    {
                      key: "handleKeyUp",
                      value(e) {
                        this.handleInteractionEnd(e);
                      },
                    },
                    {
                      key: "handleMouseDown",
                      value(e) {
                        const t = p(this);
                        this.handleInteractionStart(e),
                          t.addEventListener("mouseup", this.handleMouseUp);
                      },
                    },
                    {
                      key: "handleMouseUp",
                      value(e) {
                        const t = p(this);
                        this.handleInteractionEnd(e),
                          t.removeEventListener("mouseup", this.handleMouseUp);
                      },
                    },
                    {
                      key: "handleTouchStart",
                      value(e) {
                        const t = p(this);
                        this.handleInteractionStart(e),
                          t.addEventListener("touchend", this.handleTouchEnd);
                      },
                    },
                    {
                      key: "handleTouchEnd",
                      value(e) {
                        const t = p(this);
                        this.handleInteractionEnd(e),
                          t.removeEventListener("touchend", this.handleTouchEnd);
                      },
                    },
                    {
                      key: "render",
                      value() {
                        let e = this.props.classNames,
                          t = f(this),
                          n = j.default.valuesFromProps(this),
                          a = j.default.percentagesFromValues(this, n);
                        return React.createElement(
                          "div",
                          {
                            "aria-disabled": this.props.disabled,
                            ref: "inputRange",
                            className: t,
                            onKeyDown: this.handleKeyDown,
                            onKeyUp: this.handleKeyUp,
                            onMouseDown: this.handleMouseDown,
                            onTouchStart: this.handleTouchStart,
                          },
                          React.createElement(
                            x.default,
                            {
                              className: e.labelMin,
                              containerClassName: e.labelContainer,
                            },
                            this.props.minValue
                          ),
                          React.createElement(
                            P.default,
                            {
                              classNames: e,
                              ref: "track",
                              percentages: a,
                              onTrackMouseDown: this.handleTrackMouseDown,
                            },
                            v(this)
                          ),
                          React.createElement(
                            x.default,
                            {
                              className: e.labelMax,
                              containerClassName: e.labelContainer,
                            },
                            this.props.maxValue
                          ),
                          m(this)
                        );
                      },
                    },
                    {
                      key: "trackClientRect",
                      get() {
                        const e = this.refs.track;
                        return e
                          ? e.clientRect
                          : { height: 0, left: 0, top: 0, width: 0 };
                      },
                    },
                    {
                      key: "isMultiValue",
                      get() {
                        return (
                          (0, _.isObject)(this.props.value) ||
                          (0, _.isObject)(this.props.defaultValue)
                        );
                      },
                    },
                  ]),
                  t
                );
              })(React.Component);
            (n.default = S),
              (S.propTypes = {
                ariaLabelledby: PropTypes.string,
                ariaControls: PropTypes.string,
                classNames: PropTypes.objectOf(PropTypes.string),
                defaultValue: C.maxMinValuePropType,
                disabled: PropTypes.bool,
                maxValue: C.maxMinValuePropType,
                minValue: C.maxMinValuePropType,
                name: PropTypes.string,
                onChange: PropTypes.func.isRequired,
                onChangeComplete: PropTypes.func,
                step: PropTypes.number,
                value: C.maxMinValuePropType,
              }),
              (S.defaultProps = {
                classNames: E.default,
                defaultValue: 0,
                disabled: !1,
                maxValue: 10,
                minValue: 0,
                step: 1,
                value: null,
              }),
              (t.exports = n.default);
          }.call(
            this,
            typeof global !== "undefined"
              ? global
              : typeof self !== "undefined"
              ? self
              : typeof window !== "undefined"
              ? window
              : {}
          ));
        },
        {
          "./Label": 2,
          "./Slider": 3,
          "./Track": 4,
          "./defaultClassNames": 5,
          "./propTypes": 6,
          "./util": 7,
          "./valueTransformer": 8,
        },
      ],
      2: [
        function (e, t, n) {
          (function (e) {
            function a(e) {
              return e && e.__esModule ? e : { default: e };
            }

            function r(e, t) {
              if (!(e instanceof t))
                throw new TypeError("Cannot call a class as a function");
            }

            function o(e, t) {
              if (typeof t !== "function" && t !== null)
                throw new TypeError(
                  `Super expression must either be null or a function, not ${typeof t}`
                );
              (e.prototype = Object.create(t && t.prototype, {
                constructor: {
                  value: e,
                  enumerable: !1,
                  writable: !0,
                  configurable: !0,
                },
              })),
                t &&
                  (Object.setPrototypeOf
                    ? Object.setPrototypeOf(e, t)
                    : (e.__proto__ = t));
            }

            Object.defineProperty(n, "__esModule", { value: !0 });
            let u = (function () {
                function e(e, t) {
                  for (let n = 0; n < t.length; n++) {
                    const a = t[n];
                    (a.enumerable = a.enumerable || !1),
                      (a.configurable = !0),
                      "value" in a && (a.writable = !0),
                      Object.defineProperty(e, a.key, a);
                  }
                }

                return function (t, n, a) {
                  return n && e(t.prototype, n), a && e(t, a), t;
                };
              })(),
              i = function (e, t, n) {
                for (let a = !0; a; ) {
                  let r = e,
                    o = t,
                    u = n;
                  (a = !1), r === null && (r = Function.prototype);
                  let i = Object.getOwnPropertyDescriptor(r, o);
                  if (void 0 !== i) {
                    if ("value" in i) return i.value;
                    const l = i.get;
                    if (void 0 === l) return;
                    return l.call(u);
                  }
                  let s = Object.getPrototypeOf(r);
                  if (s === null) return;
                  (e = s), (t = o), (n = u), (a = !0), (i = s = void 0);
                }
              },
              l =
                typeof window !== "undefined"
                  ? window.React
                  : typeof e !== "undefined"
                  ? e.React
                  : null,
              s = a(l),
              p = (function (e) {
                function t() {
                  r(this, t),
                    i(Object.getPrototypeOf(t.prototype), "constructor", this).apply(
                      this,
                      arguments
                    );
                }

                return (
                  o(t, e),
                  u(t, [
                    {
                      key: "render",
                      value() {
                        let e = this.props,
                          t = e.className,
                          n = e.containerClassName;
                        return React.createElement(
                          "span",
                          { className: t },
                          React.createElement(
                            "span",
                            { className: n },
                            this.props.children
                          )
                        );
                      },
                    },
                  ]),
                  t
                );
              })(React.Component);
            (n.default = p),
              (p.propTypes = {
                children: PropTypes.node,
                className: PropTypes.string,
                containerClassName: PropTypes.string,
              }),
              (t.exports = n.default);
          }.call(
            this,
            typeof global !== "undefined"
              ? global
              : typeof self !== "undefined"
              ? self
              : typeof window !== "undefined"
              ? window
              : {}
          ));
        },
        {},
      ],
      3: [
        function (e, t, n) {
          (function (a) {
            function r(e) {
              return e && e.__esModule ? e : { default: e };
            }

            function o(e, t) {
              if (!(e instanceof t))
                throw new TypeError("Cannot call a class as a function");
            }

            function u(e, t) {
              if (typeof t !== "function" && t !== null)
                throw new TypeError(
                  `Super expression must either be null or a function, not ${typeof t}`
                );
              (e.prototype = Object.create(t && t.prototype, {
                constructor: {
                  value: e,
                  enumerable: !1,
                  writable: !0,
                  configurable: !0,
                },
              })),
                t &&
                  (Object.setPrototypeOf
                    ? Object.setPrototypeOf(e, t)
                    : (e.__proto__ = t));
            }

            function i(e) {
              const t = e.refs.slider.ownerDocument;
              return t;
            }

            function l(e) {
              let t = 100 * (e.props.percentage || 0),
                n = { position: "absolute", left: `${t}%` };
              return n;
            }

            Object.defineProperty(n, "__esModule", { value: !0 });
            let s = (function () {
                function e(e, t) {
                  for (let n = 0; n < t.length; n++) {
                    const a = t[n];
                    (a.enumerable = a.enumerable || !1),
                      (a.configurable = !0),
                      "value" in a && (a.writable = !0),
                      Object.defineProperty(e, a.key, a);
                  }
                }

                return function (t, n, a) {
                  return n && e(t.prototype, n), a && e(t, a), t;
                };
              })(),
              p = function (e, t, n) {
                for (let a = !0; a; ) {
                  let r = e,
                    o = t,
                    u = n;
                  (a = !1), r === null && (r = Function.prototype);
                  let i = Object.getOwnPropertyDescriptor(r, o);
                  if (void 0 !== i) {
                    if ("value" in i) return i.value;
                    const l = i.get;
                    if (void 0 === l) return;
                    return l.call(u);
                  }
                  let s = Object.getPrototypeOf(r);
                  if (s === null) return;
                  (e = s), (t = o), (n = u), (a = !0), (i = s = void 0);
                }
              },
              f =
                typeof window !== "undefined"
                  ? window.React
                  : typeof a !== "undefined"
                  ? a.React
                  : null,
              c = r(f),
              d = e("./Label"),
              h = r(d),
              v = e("./util"),
              m = (function (e) {
                function t(e) {
                  o(this, t),
                    p(Object.getPrototypeOf(t.prototype), "constructor", this).call(
                      this,
                      e
                    ),
                    (0, v.autobind)(
                      [
                        "handleClick",
                        "handleMouseDown",
                        "handleMouseUp",
                        "handleMouseMove",
                        "handleTouchStart",
                        "handleTouchEnd",
                        "handleTouchMove",
                        "handleKeyDown",
                      ],
                      this
                    );
                }

                return (
                  u(t, e),
                  s(t, [
                    {
                      key: "handleClick",
                      value(e) {
                        e.preventDefault();
                      },
                    },
                    {
                      key: "handleMouseDown",
                      value() {
                        const e = i(this);
                        e.addEventListener("mousemove", this.handleMouseMove),
                          e.addEventListener("mouseup", this.handleMouseUp);
                      },
                    },
                    {
                      key: "handleMouseUp",
                      value() {
                        const e = i(this);
                        e.removeEventListener("mousemove", this.handleMouseMove),
                          e.removeEventListener("mouseup", this.handleMouseUp);
                      },
                    },
                    {
                      key: "handleMouseMove",
                      value(e) {
                        this.props.onSliderMouseMove(e, this);
                      },
                    },
                    {
                      key: "handleTouchStart",
                      value(e) {
                        const t = i(this);
                        e.preventDefault(),
                          t.addEventListener("touchmove", this.handleTouchMove),
                          t.addEventListener("touchend", this.handleTouchEnd);
                      },
                    },
                    {
                      key: "handleTouchMove",
                      value(e) {
                        this.props.onSliderMouseMove(e, this);
                      },
                    },
                    {
                      key: "handleTouchEnd",
                      value() {
                        const e = i(this);
                        event.preventDefault(),
                          e.removeEventListener("touchmove", this.handleTouchMove),
                          e.removeEventListener("touchend", this.handleTouchEnd);
                      },
                    },
                    {
                      key: "handleKeyDown",
                      value(e) {
                        this.props.onSliderKeyDown(e, this);
                      },
                    },
                    {
                      key: "render",
                      value() {
                        let e = this.props.classNames,
                          t = l(this);
                        return React.createElement(
                          "span",
                          {
                            className: e.sliderContainer,
                            ref: "slider",
                            style: t,
                          },
                          React.createElement(
                            h.default,
                            {
                              className: e.labelValue,
                              containerClassName: e.labelContainer,
                            },
                            this.props.value
                          ),
                          React.createElement("a", {
                            "aria-labelledby": this.props.ariaLabelledby,
                            "aria-controls": this.props.ariaControls,
                            "aria-valuemax": this.props.maxValue,
                            "aria-valuemin": this.props.minValue,
                            "aria-valuenow": this.props.value,
                            className: e.slider,
                            draggable: "false",
                            href: "#",
                            onClick: this.handleClick,
                            onKeyDown: this.handleKeyDown,
                            onMouseDown: this.handleMouseDown,
                            onTouchStart: this.handleTouchStart,
                            role: "slider",
                          })
                        );
                      },
                    },
                  ]),
                  t
                );
              })(React.Component);
            (n.default = m),
              (m.propTypes = {
                ariaLabelledby: PropTypes.string,
                ariaControls: PropTypes.string,
                classNames: PropTypes.objectOf(PropTypes.string),
                maxValue: PropTypes.number,
                minValue: PropTypes.number,
                onSliderKeyDown: PropTypes.func.isRequired,
                onSliderMouseMove: PropTypes.func.isRequired,
                percentage: PropTypes.number.isRequired,
                type: PropTypes.string.isRequired,
                value: PropTypes.number.isRequired,
              }),
              (t.exports = n.default);
          }.call(
            this,
            typeof global !== "undefined"
              ? global
              : typeof self !== "undefined"
              ? self
              : typeof window !== "undefined"
              ? window
              : {}
          ));
        },
        { "./Label": 2, "./util": 7 },
      ],
      4: [
        function (e, t, n) {
          (function (a) {
            function r(e) {
              return e && e.__esModule ? e : { default: e };
            }

            function o(e, t) {
              if (!(e instanceof t))
                throw new TypeError("Cannot call a class as a function");
            }

            function u(e, t) {
              if (typeof t !== "function" && t !== null)
                throw new TypeError(
                  `Super expression must either be null or a function, not ${typeof t}`
                );
              (e.prototype = Object.create(t && t.prototype, {
                constructor: {
                  value: e,
                  enumerable: !1,
                  writable: !0,
                  configurable: !0,
                },
              })),
                t &&
                  (Object.setPrototypeOf
                    ? Object.setPrototypeOf(e, t)
                    : (e.__proto__ = t));
            }

            function i(e) {
              let t = e.props,
                n = `${100 * (t.percentages.max - t.percentages.min)}%`,
                a = `${100 * t.percentages.min}%`,
                r = { left: a, width: n };
              return r;
            }

            Object.defineProperty(n, "__esModule", { value: !0 });
            let l = (function () {
                function e(e, t) {
                  for (let n = 0; n < t.length; n++) {
                    const a = t[n];
                    (a.enumerable = a.enumerable || !1),
                      (a.configurable = !0),
                      "value" in a && (a.writable = !0),
                      Object.defineProperty(e, a.key, a);
                  }
                }

                return function (t, n, a) {
                  return n && e(t.prototype, n), a && e(t, a), t;
                };
              })(),
              s = function (e, t, n) {
                for (let a = !0; a; ) {
                  let r = e,
                    o = t,
                    u = n;
                  (a = !1), r === null && (r = Function.prototype);
                  let i = Object.getOwnPropertyDescriptor(r, o);
                  if (void 0 !== i) {
                    if ("value" in i) return i.value;
                    const l = i.get;
                    if (void 0 === l) return;
                    return l.call(u);
                  }
                  let s = Object.getPrototypeOf(r);
                  if (s === null) return;
                  (e = s), (t = o), (n = u), (a = !0), (i = s = void 0);
                }
              },
              p =
                typeof window !== "undefined"
                  ? window.React
                  : typeof a !== "undefined"
                  ? a.React
                  : null,
              f = r(p),
              c = e("./util"),
              d = (function (e) {
                function t(e) {
                  o(this, t),
                    s(Object.getPrototypeOf(t.prototype), "constructor", this).call(
                      this,
                      e
                    ),
                    (0, c.autobind)(["handleMouseDown", "handleTouchStart"], this);
                }

                return (
                  u(t, e),
                  l(t, [
                    {
                      key: "handleMouseDown",
                      value(e) {
                        let t = this.clientRect,
                          n = e.touches ? e.touches[0] : e,
                          a = n.clientX,
                          r = { x: a - t.left, y: 0 };
                        this.props.onTrackMouseDown(e, this, r);
                      },
                    },
                    {
                      key: "handleTouchStart",
                      value(e) {
                        e.preventDefault(), this.handleMouseDown(e);
                      },
                    },
                    {
                      key: "render",
                      value() {
                        let e = i(this),
                          t = this.props.classNames;
                        return React.createElement(
                          "div",
                          {
                            className: t.trackContainer,
                            onMouseDown: this.handleMouseDown,
                            onTouchStart: this.handleTouchStart,
                            ref: "track",
                          },
                          React.createElement("div", {
                            style: e,
                            className: t.trackActive,
                          }),
                          this.props.children
                        );
                      },
                    },
                    {
                      key: "clientRect",
                      get() {
                        let e = this.refs.track,
                          t = e.getBoundingClientRect();
                        return t;
                      },
                    },
                  ]),
                  t
                );
              })(React.Component);
            (n.default = d),
              (d.propTypes = {
                children: PropTypes.node,
                classNames: PropTypes.objectOf(PropTypes.string),
                onTrackMouseDown: PropTypes.func.isRequired,
                percentages: PropTypes.objectOf(PropTypes.number).isRequired,
              }),
              (t.exports = n.default);
          }.call(
            this,
            typeof global !== "undefined"
              ? global
              : typeof self !== "undefined"
              ? self
              : typeof window !== "undefined"
              ? window
              : {}
          ));
        },
        { "./util": 7 },
      ],
      5: [
        function (e, t, n) {
          Object.defineProperty(n, "__esModule", { value: !0 }),
            (n.default = {
              component: "InputRange",
              labelContainer: "InputRange-labelContainer",
              labelMax: "InputRange-label InputRange-label--max",
              labelMin: "InputRange-label InputRange-label--min",
              labelValue: "InputRange-label InputRange-label--value",
              slider: "InputRange-slider",
              sliderContainer: "InputRange-sliderContainer",
              trackActive: "InputRange-track InputRange-track--active",
              trackContainer: "InputRange-track InputRange-track--container",
            }),
            (t.exports = n.default);
        },
        {},
      ],
      6: [
        function (e, t, n) {
          function a(e) {
            let t = e.maxValue,
              n = e.minValue,
              a = e.value,
              o = e.defaultValue,
              u = (0, r.isNumber)(a),
              i = (0, r.isNumber)(o),
              l = (0, r.objectOf)(a, r.isNumber),
              s = (0, r.objectOf)(o, r.isNumber);
            return void 0 === a
              ? new Error("`value` must be defined")
              : u || i || l || s
              ? n >= t
                ? new Error("`minValue` must be smaller than `maxValue`")
                : n >= t
                ? new Error("`maxValue` must be larger than `minValue`")
                : n > a || a > t
                ? new Error("`value` must be within `minValue` and `maxValue`")
                : void 0
              : new Error("`value` or `defaultValue` must be a number or an array");
          }

          Object.defineProperty(n, "__esModule", { value: !0 }),
            (n.maxMinValuePropType = a);
          var r = e("./util");
        },
        { "./util": 7 },
      ],
      7: [
        function (e, t, n) {
          function a(e, t, n) {
            return Math.min(Math.max(e, t), n);
          }

          function r() {
            return Object.assign(...arguments);
          }

          function o(e, t) {
            return e.indexOf(t) > -1;
          }

          function u(e, t) {
            let n = Object.keys(e),
              a = {};
            return (
              n.forEach((n) => {
                o(t, n) || (a[n] = e[n]);
              }),
              a
            );
          }

          function i(e) {
            return e.charAt(0).toUpperCase() + e.slice(1);
          }

          function l(e, t) {
            return Math.sqrt(Math.pow(t.x - e.x, 2) + Math.pow(t.y - e.y, 2));
          }

          function s(e, t) {
            return Math.abs(e - t);
          }

          function p(e) {
            return typeof e === "number";
          }

          function f(e) {
            return e !== null && typeof e === "object";
          }

          function c(e) {
            return void 0 !== e && e !== null;
          }

          function d(e) {
            return e
              ? Array.isArray(e)
                ? e.length === 0
                : Object.keys(e).length === 0
              : !0;
          }

          function h(e, t) {
            if (!Array.isArray(e)) return !1;
            for (let n = 0, a = e.length; a > n; n++) if (!t(e[n])) return !1;
            return !0;
          }

          function v(e, t, n) {
            if (!f(e)) return !1;
            for (let a = n || Object.keys(e), r = 0, o = a.length; o > r; r++) {
              const u = a[r];
              if (!t(e[u])) return !1;
            }
            return !0;
          }

          function m(e, t) {
            e.forEach((e) => {
              t[e] = t[e].bind(t);
            });
          }

          Object.defineProperty(n, "__esModule", { value: !0 }),
            (n.default = {
              arrayOf: h,
              autobind: m,
              captialize: i,
              clamp: a,
              distanceTo: l,
              extend: r,
              isDefined: c,
              isEmpty: d,
              isNumber: p,
              isObject: f,
              length: s,
              objectOf: v,
              omit: u,
            }),
            (t.exports = n.default);
        },
        {},
      ],
      8: [
        function (e, t, n) {
          function a(e, t) {
            let n = e.trackClientRect.width,
              a = t.x / n;
            return a || 0;
          }

          function r(e, t) {
            let n = a(e, t),
              r = e.props.maxValue - e.props.minValue,
              o = e.props.minValue + r * n;
            return o;
          }

          function o(e) {
            let t = arguments.length <= 1 || void 0 === arguments[1] ? e : arguments[1],
              n = t.props;
            return (function () {
              if (e.isMultiValue) {
                let t = n.value;
                return (
                  (!(0, c.isEmpty)(t) && (0, c.objectOf)(t, c.isNumber)) ||
                    (t = n.defaultValue),
                  Object.create(t)
                );
              }
              const a = (0, c.isNumber)(n.value) ? n.value : n.defaultValue;
              return { min: n.minValue, max: a };
            })();
          }

          function u(e, t) {
            let n = (0, c.clamp)(t, e.props.minValue, e.props.maxValue),
              a = e.props.maxValue - e.props.minValue,
              r = (n - e.props.minValue) / a;
            return r || 0;
          }

          function i(e, t) {
            const n = { min: u(e, t.min), max: u(e, t.max) };
            return n;
          }

          function l(e, t) {
            let n = e.trackClientRect.width,
              a = u(e, t),
              r = a * n;
            return { x: r, y: 0 };
          }

          function s(e, t) {
            const n = { min: l(e, t.min), max: l(e, t.max) };
            return n;
          }

          function p(e, t) {
            let n = e.trackClientRect,
              a = n.width,
              r = t.touches ? t.touches[0] : t,
              o = r.clientX,
              u = { x: (0, c.clamp)(o - n.left, 0, a), y: 0 };
            return u;
          }

          function f(e, t) {
            return Math.round(t / e.props.step) * e.props.step;
          }

          Object.defineProperty(n, "__esModule", { value: !0 });
          var c = e("./util");
          (n.default = {
            percentageFromPosition: a,
            percentageFromValue: u,
            percentagesFromValues: i,
            positionFromEvent: p,
            positionFromValue: l,
            positionsFromValues: s,
            stepValueFromValue: f,
            valueFromPosition: r,
            valuesFromProps: o,
          }),
            (t.exports = n.default);
        },
        { "./util": 7 },
      ],
      9: [
        function (e, t, n) {
          function a(e) {
            return e && e.__esModule ? e : { default: e };
          }

          Object.defineProperty(n, "__esModule", { value: !0 });
          let r = e("./InputRange"),
            o = a(r);
          (n.default = o.default), (t.exports = n.default);
        },
        { "./InputRange": 1 },
      ],
    },
    {},
    [9]
  )(9)
);
/* eslint-enable */
