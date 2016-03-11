"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

(function defineMustache(global, factory) {
    if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === "object" && exports && typeof exports.nodeName !== "string") {
        factory(exports);
    } else if (typeof define === "function" && define.amd) {
        define(["exports"], factory);
    } else {
        global.Mustache = {};factory(global.Mustache);
    }
})(undefined, function mustacheFactory(mustache) {
    var objectToString = Object.prototype.toString;var isArray = Array.isArray || function isArrayPolyfill(object) {
        return objectToString.call(object) === "[object Array]";
    };function isFunction(object) {
        return typeof object === "function";
    }function typeStr(obj) {
        return isArray(obj) ? "array" : typeof obj === "undefined" ? "undefined" : _typeof(obj);
    }function escapeRegExp(string) {
        return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
    }function hasProperty(obj, propName) {
        return obj != null && (typeof obj === "undefined" ? "undefined" : _typeof(obj)) === "object" && propName in obj;
    }var regExpTest = RegExp.prototype.test;function testRegExp(re, string) {
        return regExpTest.call(re, string);
    }var nonSpaceRe = /\S/;function isWhitespace(string) {
        return !testRegExp(nonSpaceRe, string);
    }var entityMap = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "/": "&#x2F;", "`": "&#x60;", "=": "&#x3D;" };function escapeHtml(string) {
        return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap(s) {
            return entityMap[s];
        });
    }var whiteRe = /\s*/;var spaceRe = /\s+/;var equalsRe = /\s*=/;var curlyRe = /\s*\}/;var tagRe = /#|\^|\/|>|\{|&|=|!/;function parseTemplate(template, tags) {
        if (!template) return [];var sections = [];var tokens = [];var spaces = [];var hasTag = false;var nonSpace = false;function stripSpace() {
            if (hasTag && !nonSpace) {
                while (spaces.length) {
                    delete tokens[spaces.pop()];
                }
            } else {
                spaces = [];
            }hasTag = false;nonSpace = false;
        }var openingTagRe, closingTagRe, closingCurlyRe;function compileTags(tagsToCompile) {
            if (typeof tagsToCompile === "string") tagsToCompile = tagsToCompile.split(spaceRe, 2);if (!isArray(tagsToCompile) || tagsToCompile.length !== 2) throw new Error("Invalid tags: " + tagsToCompile);openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + "\\s*");closingTagRe = new RegExp("\\s*" + escapeRegExp(tagsToCompile[1]));closingCurlyRe = new RegExp("\\s*" + escapeRegExp("}" + tagsToCompile[1]));
        }compileTags(tags || mustache.tags);var scanner = new Scanner(template);var start, type, value, chr, token, openSection;while (!scanner.eos()) {
            start = scanner.pos;value = scanner.scanUntil(openingTagRe);if (value) {
                for (var i = 0, valueLength = value.length; i < valueLength; ++i) {
                    chr = value.charAt(i);if (isWhitespace(chr)) {
                        spaces.push(tokens.length);
                    } else {
                        nonSpace = true;
                    }tokens.push(["text", chr, start, start + 1]);start += 1;if (chr === "\n") stripSpace();
                }
            }if (!scanner.scan(openingTagRe)) break;hasTag = true;type = scanner.scan(tagRe) || "name";scanner.scan(whiteRe);if (type === "=") {
                value = scanner.scanUntil(equalsRe);scanner.scan(equalsRe);scanner.scanUntil(closingTagRe);
            } else if (type === "{") {
                value = scanner.scanUntil(closingCurlyRe);scanner.scan(curlyRe);scanner.scanUntil(closingTagRe);type = "&";
            } else {
                value = scanner.scanUntil(closingTagRe);
            }if (!scanner.scan(closingTagRe)) throw new Error("Unclosed tag at " + scanner.pos);token = [type, value, start, scanner.pos];tokens.push(token);if (type === "#" || type === "^") {
                sections.push(token);
            } else if (type === "/") {
                openSection = sections.pop();if (!openSection) throw new Error('Unopened section "' + value + '" at ' + start);if (openSection[1] !== value) throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
            } else if (type === "name" || type === "{" || type === "&") {
                nonSpace = true;
            } else if (type === "=") {
                compileTags(value);
            }
        }openSection = sections.pop();if (openSection) throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);return nestTokens(squashTokens(tokens));
    }function squashTokens(tokens) {
        var squashedTokens = [];var token, lastToken;for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
            token = tokens[i];if (token) {
                if (token[0] === "text" && lastToken && lastToken[0] === "text") {
                    lastToken[1] += token[1];lastToken[3] = token[3];
                } else {
                    squashedTokens.push(token);lastToken = token;
                }
            }
        }return squashedTokens;
    }function nestTokens(tokens) {
        var nestedTokens = [];var collector = nestedTokens;var sections = [];var token, section;for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
            token = tokens[i];switch (token[0]) {case "#":case "^":
                    collector.push(token);sections.push(token);collector = token[4] = [];break;case "/":
                    section = sections.pop();section[5] = token[2];collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;break;default:
                    collector.push(token);}
        }return nestedTokens;
    }function Scanner(string) {
        this.string = string;this.tail = string;this.pos = 0;
    }Scanner.prototype.eos = function eos() {
        return this.tail === "";
    };Scanner.prototype.scan = function scan(re) {
        var match = this.tail.match(re);if (!match || match.index !== 0) return "";var string = match[0];this.tail = this.tail.substring(string.length);this.pos += string.length;return string;
    };Scanner.prototype.scanUntil = function scanUntil(re) {
        var index = this.tail.search(re),
            match;switch (index) {case -1:
                match = this.tail;this.tail = "";break;case 0:
                match = "";break;default:
                match = this.tail.substring(0, index);this.tail = this.tail.substring(index);}this.pos += match.length;return match;
    };function Context(view, parentContext) {
        this.view = view;this.cache = { ".": this.view };this.parent = parentContext;
    }Context.prototype.push = function push(view) {
        return new Context(view, this);
    };Context.prototype.lookup = function lookup(name) {
        var cache = this.cache;var value;if (cache.hasOwnProperty(name)) {
            value = cache[name];
        } else {
            var context = this,
                names,
                index,
                lookupHit = false;while (context) {
                if (name.indexOf(".") > 0) {
                    value = context.view;names = name.split(".");index = 0;while (value != null && index < names.length) {
                        if (index === names.length - 1) lookupHit = hasProperty(value, names[index]);value = value[names[index++]];
                    }
                } else {
                    value = context.view[name];lookupHit = hasProperty(context.view, name);
                }if (lookupHit) break;context = context.parent;
            }cache[name] = value;
        }if (isFunction(value)) value = value.call(this.view);return value;
    };function Writer() {
        this.cache = {};
    }Writer.prototype.clearCache = function clearCache() {
        this.cache = {};
    };Writer.prototype.parse = function parse(template, tags) {
        var cache = this.cache;var tokens = cache[template];if (tokens == null) tokens = cache[template] = parseTemplate(template, tags);return tokens;
    };Writer.prototype.render = function render(template, view, partials) {
        var tokens = this.parse(template);var context = view instanceof Context ? view : new Context(view);return this.renderTokens(tokens, context, partials, template);
    };Writer.prototype.renderTokens = function renderTokens(tokens, context, partials, originalTemplate) {
        var buffer = "";var token, symbol, value;for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
            value = undefined;token = tokens[i];symbol = token[0];if (symbol === "#") value = this.renderSection(token, context, partials, originalTemplate);else if (symbol === "^") value = this.renderInverted(token, context, partials, originalTemplate);else if (symbol === ">") value = this.renderPartial(token, context, partials, originalTemplate);else if (symbol === "&") value = this.unescapedValue(token, context);else if (symbol === "name") value = this.escapedValue(token, context);else if (symbol === "text") value = this.rawValue(token);if (value !== undefined) buffer += value;
        }return buffer;
    };Writer.prototype.renderSection = function renderSection(token, context, partials, originalTemplate) {
        var self = this;var buffer = "";var value = context.lookup(token[1]);function subRender(template) {
            return self.render(template, context, partials);
        }if (!value) return;if (isArray(value)) {
            for (var j = 0, valueLength = value.length; j < valueLength; ++j) {
                buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate);
            }
        } else if ((typeof value === "undefined" ? "undefined" : _typeof(value)) === "object" || typeof value === "string" || typeof value === "number") {
            buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate);
        } else if (isFunction(value)) {
            if (typeof originalTemplate !== "string") throw new Error("Cannot use higher-order sections without the original template");value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);if (value != null) buffer += value;
        } else {
            buffer += this.renderTokens(token[4], context, partials, originalTemplate);
        }return buffer;
    };Writer.prototype.renderInverted = function renderInverted(token, context, partials, originalTemplate) {
        var value = context.lookup(token[1]);if (!value || isArray(value) && value.length === 0) return this.renderTokens(token[4], context, partials, originalTemplate);
    };Writer.prototype.renderPartial = function renderPartial(token, context, partials) {
        if (!partials) return;var value = isFunction(partials) ? partials(token[1]) : partials[token[1]];if (value != null) return this.renderTokens(this.parse(value), context, partials, value);
    };Writer.prototype.unescapedValue = function unescapedValue(token, context) {
        var value = context.lookup(token[1]);if (value != null) return value;
    };Writer.prototype.escapedValue = function escapedValue(token, context) {
        var value = context.lookup(token[1]);if (value != null) return mustache.escape(value);
    };Writer.prototype.rawValue = function rawValue(token) {
        return token[1];
    };mustache.name = "mustache.js";mustache.version = "2.2.1";mustache.tags = ["{{", "}}"];var defaultWriter = new Writer();mustache.clearCache = function clearCache() {
        return defaultWriter.clearCache();
    };mustache.parse = function parse(template, tags) {
        return defaultWriter.parse(template, tags);
    };mustache.render = function render(template, view, partials) {
        if (typeof template !== "string") {
            throw new TypeError('Invalid template! Template should be a "string" ' + 'but "' + typeStr(template) + '" was given as the first ' + "argument for mustache#render(template, view, partials)");
        }return defaultWriter.render(template, view, partials);
    };mustache.to_html = function to_html(template, view, partials, send) {
        var result = mustache.render(template, view, partials);if (isFunction(send)) {
            send(result);
        } else {
            return result;
        }
    };mustache.escape = escapeHtml;mustache.Scanner = Scanner;mustache.Context = Context;mustache.Writer = Writer;
});

//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.
(function () {
    function n(n) {
        function t(t, r, e, u, i, o) {
            for (; i >= 0 && o > i; i += n) {
                var a = u ? u[i] : i;e = r(e, t[a], a, t);
            }return e;
        }return function (r, e, u, i) {
            e = b(e, i, 4);var o = !k(r) && m.keys(r),
                a = (o || r).length,
                c = n > 0 ? 0 : a - 1;return arguments.length < 3 && (u = r[o ? o[c] : c], c += n), t(r, e, u, o, c, a);
        };
    }function t(n) {
        return function (t, r, e) {
            r = x(r, e);for (var u = O(t), i = n > 0 ? 0 : u - 1; i >= 0 && u > i; i += n) {
                if (r(t[i], i, t)) return i;
            }return -1;
        };
    }function r(n, t, r) {
        return function (e, u, i) {
            var o = 0,
                a = O(e);if ("number" == typeof i) n > 0 ? o = i >= 0 ? i : Math.max(i + a, o) : a = i >= 0 ? Math.min(i + 1, a) : i + a + 1;else if (r && i && a) return i = r(e, u), e[i] === u ? i : -1;if (u !== u) return i = t(l.call(e, o, a), m.isNaN), i >= 0 ? i + o : -1;for (i = n > 0 ? o : a - 1; i >= 0 && a > i; i += n) {
                if (e[i] === u) return i;
            }return -1;
        };
    }function e(n, t) {
        var r = I.length,
            e = n.constructor,
            u = m.isFunction(e) && e.prototype || a,
            i = "constructor";for (m.has(n, i) && !m.contains(t, i) && t.push(i); r--;) {
            i = I[r], i in n && n[i] !== u[i] && !m.contains(t, i) && t.push(i);
        }
    }var u = this,
        i = u._,
        o = Array.prototype,
        a = Object.prototype,
        c = Function.prototype,
        f = o.push,
        l = o.slice,
        s = a.toString,
        p = a.hasOwnProperty,
        h = Array.isArray,
        v = Object.keys,
        g = c.bind,
        y = Object.create,
        d = function d() {},
        m = function m(n) {
        return n instanceof m ? n : this instanceof m ? void (this._wrapped = n) : new m(n);
    };"undefined" != typeof exports ? ("undefined" != typeof module && module.exports && (exports = module.exports = m), exports._ = m) : u._ = m, m.VERSION = "1.8.3";var b = function b(n, t, r) {
        if (t === void 0) return n;switch (null == r ? 3 : r) {case 1:
                return function (r) {
                    return n.call(t, r);
                };case 2:
                return function (r, e) {
                    return n.call(t, r, e);
                };case 3:
                return function (r, e, u) {
                    return n.call(t, r, e, u);
                };case 4:
                return function (r, e, u, i) {
                    return n.call(t, r, e, u, i);
                };}return function () {
            return n.apply(t, arguments);
        };
    },
        x = function x(n, t, r) {
        return null == n ? m.identity : m.isFunction(n) ? b(n, t, r) : m.isObject(n) ? m.matcher(n) : m.property(n);
    };m.iteratee = function (n, t) {
        return x(n, t, 1 / 0);
    };var _ = function _(n, t) {
        return function (r) {
            var e = arguments.length;if (2 > e || null == r) return r;for (var u = 1; e > u; u++) {
                for (var i = arguments[u], o = n(i), a = o.length, c = 0; a > c; c++) {
                    var f = o[c];t && r[f] !== void 0 || (r[f] = i[f]);
                }
            }return r;
        };
    },
        j = function j(n) {
        if (!m.isObject(n)) return {};if (y) return y(n);d.prototype = n;var t = new d();return d.prototype = null, t;
    },
        w = function w(n) {
        return function (t) {
            return null == t ? void 0 : t[n];
        };
    },
        A = Math.pow(2, 53) - 1,
        O = w("length"),
        k = function k(n) {
        var t = O(n);return "number" == typeof t && t >= 0 && A >= t;
    };m.each = m.forEach = function (n, t, r) {
        t = b(t, r);var e, u;if (k(n)) for (e = 0, u = n.length; u > e; e++) {
            t(n[e], e, n);
        } else {
            var i = m.keys(n);for (e = 0, u = i.length; u > e; e++) {
                t(n[i[e]], i[e], n);
            }
        }return n;
    }, m.map = m.collect = function (n, t, r) {
        t = x(t, r);for (var e = !k(n) && m.keys(n), u = (e || n).length, i = Array(u), o = 0; u > o; o++) {
            var a = e ? e[o] : o;i[o] = t(n[a], a, n);
        }return i;
    }, m.reduce = m.foldl = m.inject = n(1), m.reduceRight = m.foldr = n(-1), m.find = m.detect = function (n, t, r) {
        var e;return e = k(n) ? m.findIndex(n, t, r) : m.findKey(n, t, r), e !== void 0 && e !== -1 ? n[e] : void 0;
    }, m.filter = m.select = function (n, t, r) {
        var e = [];return t = x(t, r), m.each(n, function (n, r, u) {
            t(n, r, u) && e.push(n);
        }), e;
    }, m.reject = function (n, t, r) {
        return m.filter(n, m.negate(x(t)), r);
    }, m.every = m.all = function (n, t, r) {
        t = x(t, r);for (var e = !k(n) && m.keys(n), u = (e || n).length, i = 0; u > i; i++) {
            var o = e ? e[i] : i;if (!t(n[o], o, n)) return !1;
        }return !0;
    }, m.some = m.any = function (n, t, r) {
        t = x(t, r);for (var e = !k(n) && m.keys(n), u = (e || n).length, i = 0; u > i; i++) {
            var o = e ? e[i] : i;if (t(n[o], o, n)) return !0;
        }return !1;
    }, m.contains = m.includes = m.include = function (n, t, r, e) {
        return k(n) || (n = m.values(n)), ("number" != typeof r || e) && (r = 0), m.indexOf(n, t, r) >= 0;
    }, m.invoke = function (n, t) {
        var r = l.call(arguments, 2),
            e = m.isFunction(t);return m.map(n, function (n) {
            var u = e ? t : n[t];return null == u ? u : u.apply(n, r);
        });
    }, m.pluck = function (n, t) {
        return m.map(n, m.property(t));
    }, m.where = function (n, t) {
        return m.filter(n, m.matcher(t));
    }, m.findWhere = function (n, t) {
        return m.find(n, m.matcher(t));
    }, m.max = function (n, t, r) {
        var e,
            u,
            i = -1 / 0,
            o = -1 / 0;if (null == t && null != n) {
            n = k(n) ? n : m.values(n);for (var a = 0, c = n.length; c > a; a++) {
                e = n[a], e > i && (i = e);
            }
        } else t = x(t, r), m.each(n, function (n, r, e) {
            u = t(n, r, e), (u > o || u === -1 / 0 && i === -1 / 0) && (i = n, o = u);
        });return i;
    }, m.min = function (n, t, r) {
        var e,
            u,
            i = 1 / 0,
            o = 1 / 0;if (null == t && null != n) {
            n = k(n) ? n : m.values(n);for (var a = 0, c = n.length; c > a; a++) {
                e = n[a], i > e && (i = e);
            }
        } else t = x(t, r), m.each(n, function (n, r, e) {
            u = t(n, r, e), (o > u || 1 / 0 === u && 1 / 0 === i) && (i = n, o = u);
        });return i;
    }, m.shuffle = function (n) {
        for (var t, r = k(n) ? n : m.values(n), e = r.length, u = Array(e), i = 0; e > i; i++) {
            t = m.random(0, i), t !== i && (u[i] = u[t]), u[t] = r[i];
        }return u;
    }, m.sample = function (n, t, r) {
        return null == t || r ? (k(n) || (n = m.values(n)), n[m.random(n.length - 1)]) : m.shuffle(n).slice(0, Math.max(0, t));
    }, m.sortBy = function (n, t, r) {
        return t = x(t, r), m.pluck(m.map(n, function (n, r, e) {
            return { value: n, index: r, criteria: t(n, r, e) };
        }).sort(function (n, t) {
            var r = n.criteria,
                e = t.criteria;if (r !== e) {
                if (r > e || r === void 0) return 1;if (e > r || e === void 0) return -1;
            }return n.index - t.index;
        }), "value");
    };var F = function F(n) {
        return function (t, r, e) {
            var u = {};return r = x(r, e), m.each(t, function (e, i) {
                var o = r(e, i, t);n(u, e, o);
            }), u;
        };
    };m.groupBy = F(function (n, t, r) {
        m.has(n, r) ? n[r].push(t) : n[r] = [t];
    }), m.indexBy = F(function (n, t, r) {
        n[r] = t;
    }), m.countBy = F(function (n, t, r) {
        m.has(n, r) ? n[r]++ : n[r] = 1;
    }), m.toArray = function (n) {
        return n ? m.isArray(n) ? l.call(n) : k(n) ? m.map(n, m.identity) : m.values(n) : [];
    }, m.size = function (n) {
        return null == n ? 0 : k(n) ? n.length : m.keys(n).length;
    }, m.partition = function (n, t, r) {
        t = x(t, r);var e = [],
            u = [];return m.each(n, function (n, r, i) {
            (t(n, r, i) ? e : u).push(n);
        }), [e, u];
    }, m.first = m.head = m.take = function (n, t, r) {
        return null == n ? void 0 : null == t || r ? n[0] : m.initial(n, n.length - t);
    }, m.initial = function (n, t, r) {
        return l.call(n, 0, Math.max(0, n.length - (null == t || r ? 1 : t)));
    }, m.last = function (n, t, r) {
        return null == n ? void 0 : null == t || r ? n[n.length - 1] : m.rest(n, Math.max(0, n.length - t));
    }, m.rest = m.tail = m.drop = function (n, t, r) {
        return l.call(n, null == t || r ? 1 : t);
    }, m.compact = function (n) {
        return m.filter(n, m.identity);
    };var S = function S(n, t, r, e) {
        for (var u = [], i = 0, o = e || 0, a = O(n); a > o; o++) {
            var c = n[o];if (k(c) && (m.isArray(c) || m.isArguments(c))) {
                t || (c = S(c, t, r));var f = 0,
                    l = c.length;for (u.length += l; l > f;) {
                    u[i++] = c[f++];
                }
            } else r || (u[i++] = c);
        }return u;
    };m.flatten = function (n, t) {
        return S(n, t, !1);
    }, m.without = function (n) {
        return m.difference(n, l.call(arguments, 1));
    }, m.uniq = m.unique = function (n, t, r, e) {
        m.isBoolean(t) || (e = r, r = t, t = !1), null != r && (r = x(r, e));for (var u = [], i = [], o = 0, a = O(n); a > o; o++) {
            var c = n[o],
                f = r ? r(c, o, n) : c;t ? (o && i === f || u.push(c), i = f) : r ? m.contains(i, f) || (i.push(f), u.push(c)) : m.contains(u, c) || u.push(c);
        }return u;
    }, m.union = function () {
        return m.uniq(S(arguments, !0, !0));
    }, m.intersection = function (n) {
        for (var t = [], r = arguments.length, e = 0, u = O(n); u > e; e++) {
            var i = n[e];if (!m.contains(t, i)) {
                for (var o = 1; r > o && m.contains(arguments[o], i); o++) {}o === r && t.push(i);
            }
        }return t;
    }, m.difference = function (n) {
        var t = S(arguments, !0, !0, 1);return m.filter(n, function (n) {
            return !m.contains(t, n);
        });
    }, m.zip = function () {
        return m.unzip(arguments);
    }, m.unzip = function (n) {
        for (var t = n && m.max(n, O).length || 0, r = Array(t), e = 0; t > e; e++) {
            r[e] = m.pluck(n, e);
        }return r;
    }, m.object = function (n, t) {
        for (var r = {}, e = 0, u = O(n); u > e; e++) {
            t ? r[n[e]] = t[e] : r[n[e][0]] = n[e][1];
        }return r;
    }, m.findIndex = t(1), m.findLastIndex = t(-1), m.sortedIndex = function (n, t, r, e) {
        r = x(r, e, 1);for (var u = r(t), i = 0, o = O(n); o > i;) {
            var a = Math.floor((i + o) / 2);r(n[a]) < u ? i = a + 1 : o = a;
        }return i;
    }, m.indexOf = r(1, m.findIndex, m.sortedIndex), m.lastIndexOf = r(-1, m.findLastIndex), m.range = function (n, t, r) {
        null == t && (t = n || 0, n = 0), r = r || 1;for (var e = Math.max(Math.ceil((t - n) / r), 0), u = Array(e), i = 0; e > i; i++, n += r) {
            u[i] = n;
        }return u;
    };var E = function E(n, t, r, e, u) {
        if (!(e instanceof t)) return n.apply(r, u);var i = j(n.prototype),
            o = n.apply(i, u);return m.isObject(o) ? o : i;
    };m.bind = function (n, t) {
        if (g && n.bind === g) return g.apply(n, l.call(arguments, 1));if (!m.isFunction(n)) throw new TypeError("Bind must be called on a function");var r = l.call(arguments, 2),
            e = function e() {
            return E(n, e, t, this, r.concat(l.call(arguments)));
        };return e;
    }, m.partial = function (n) {
        var t = l.call(arguments, 1),
            r = function r() {
            for (var e = 0, u = t.length, i = Array(u), o = 0; u > o; o++) {
                i[o] = t[o] === m ? arguments[e++] : t[o];
            }for (; e < arguments.length;) {
                i.push(arguments[e++]);
            }return E(n, r, this, this, i);
        };return r;
    }, m.bindAll = function (n) {
        var t,
            r,
            e = arguments.length;if (1 >= e) throw new Error("bindAll must be passed function names");for (t = 1; e > t; t++) {
            r = arguments[t], n[r] = m.bind(n[r], n);
        }return n;
    }, m.memoize = function (n, t) {
        var r = function r(e) {
            var u = r.cache,
                i = "" + (t ? t.apply(this, arguments) : e);return m.has(u, i) || (u[i] = n.apply(this, arguments)), u[i];
        };return r.cache = {}, r;
    }, m.delay = function (n, t) {
        var r = l.call(arguments, 2);return setTimeout(function () {
            return n.apply(null, r);
        }, t);
    }, m.defer = m.partial(m.delay, m, 1), m.throttle = function (n, t, r) {
        var e,
            u,
            i,
            o = null,
            a = 0;r || (r = {});var c = function c() {
            a = r.leading === !1 ? 0 : m.now(), o = null, i = n.apply(e, u), o || (e = u = null);
        };return function () {
            var f = m.now();a || r.leading !== !1 || (a = f);var l = t - (f - a);return e = this, u = arguments, 0 >= l || l > t ? (o && (clearTimeout(o), o = null), a = f, i = n.apply(e, u), o || (e = u = null)) : o || r.trailing === !1 || (o = setTimeout(c, l)), i;
        };
    }, m.debounce = function (n, t, r) {
        var e,
            u,
            i,
            o,
            a,
            c = function c() {
            var f = m.now() - o;t > f && f >= 0 ? e = setTimeout(c, t - f) : (e = null, r || (a = n.apply(i, u), e || (i = u = null)));
        };return function () {
            i = this, u = arguments, o = m.now();var f = r && !e;return e || (e = setTimeout(c, t)), f && (a = n.apply(i, u), i = u = null), a;
        };
    }, m.wrap = function (n, t) {
        return m.partial(t, n);
    }, m.negate = function (n) {
        return function () {
            return !n.apply(this, arguments);
        };
    }, m.compose = function () {
        var n = arguments,
            t = n.length - 1;return function () {
            for (var r = t, e = n[t].apply(this, arguments); r--;) {
                e = n[r].call(this, e);
            }return e;
        };
    }, m.after = function (n, t) {
        return function () {
            return --n < 1 ? t.apply(this, arguments) : void 0;
        };
    }, m.before = function (n, t) {
        var r;return function () {
            return --n > 0 && (r = t.apply(this, arguments)), 1 >= n && (t = null), r;
        };
    }, m.once = m.partial(m.before, 2);var M = !{ toString: null }.propertyIsEnumerable("toString"),
        I = ["valueOf", "isPrototypeOf", "toString", "propertyIsEnumerable", "hasOwnProperty", "toLocaleString"];m.keys = function (n) {
        if (!m.isObject(n)) return [];if (v) return v(n);var t = [];for (var r in n) {
            m.has(n, r) && t.push(r);
        }return M && e(n, t), t;
    }, m.allKeys = function (n) {
        if (!m.isObject(n)) return [];var t = [];for (var r in n) {
            t.push(r);
        }return M && e(n, t), t;
    }, m.values = function (n) {
        for (var t = m.keys(n), r = t.length, e = Array(r), u = 0; r > u; u++) {
            e[u] = n[t[u]];
        }return e;
    }, m.mapObject = function (n, t, r) {
        t = x(t, r);for (var e, u = m.keys(n), i = u.length, o = {}, a = 0; i > a; a++) {
            e = u[a], o[e] = t(n[e], e, n);
        }return o;
    }, m.pairs = function (n) {
        for (var t = m.keys(n), r = t.length, e = Array(r), u = 0; r > u; u++) {
            e[u] = [t[u], n[t[u]]];
        }return e;
    }, m.invert = function (n) {
        for (var t = {}, r = m.keys(n), e = 0, u = r.length; u > e; e++) {
            t[n[r[e]]] = r[e];
        }return t;
    }, m.functions = m.methods = function (n) {
        var t = [];for (var r in n) {
            m.isFunction(n[r]) && t.push(r);
        }return t.sort();
    }, m.extend = _(m.allKeys), m.extendOwn = m.assign = _(m.keys), m.findKey = function (n, t, r) {
        t = x(t, r);for (var e, u = m.keys(n), i = 0, o = u.length; o > i; i++) {
            if (e = u[i], t(n[e], e, n)) return e;
        }
    }, m.pick = function (n, t, r) {
        var e,
            u,
            i = {},
            o = n;if (null == o) return i;m.isFunction(t) ? (u = m.allKeys(o), e = b(t, r)) : (u = S(arguments, !1, !1, 1), e = function e(n, t, r) {
            return t in r;
        }, o = Object(o));for (var a = 0, c = u.length; c > a; a++) {
            var f = u[a],
                l = o[f];e(l, f, o) && (i[f] = l);
        }return i;
    }, m.omit = function (n, t, r) {
        if (m.isFunction(t)) t = m.negate(t);else {
            var e = m.map(S(arguments, !1, !1, 1), String);t = function t(n, _t) {
                return !m.contains(e, _t);
            };
        }return m.pick(n, t, r);
    }, m.defaults = _(m.allKeys, !0), m.create = function (n, t) {
        var r = j(n);return t && m.extendOwn(r, t), r;
    }, m.clone = function (n) {
        return m.isObject(n) ? m.isArray(n) ? n.slice() : m.extend({}, n) : n;
    }, m.tap = function (n, t) {
        return t(n), n;
    }, m.isMatch = function (n, t) {
        var r = m.keys(t),
            e = r.length;if (null == n) return !e;for (var u = Object(n), i = 0; e > i; i++) {
            var o = r[i];if (t[o] !== u[o] || !(o in u)) return !1;
        }return !0;
    };var N = function N(n, t, r, e) {
        if (n === t) return 0 !== n || 1 / n === 1 / t;if (null == n || null == t) return n === t;n instanceof m && (n = n._wrapped), t instanceof m && (t = t._wrapped);var u = s.call(n);if (u !== s.call(t)) return !1;switch (u) {case "[object RegExp]":case "[object String]":
                return "" + n == "" + t;case "[object Number]":
                return +n !== +n ? +t !== +t : 0 === +n ? 1 / +n === 1 / t : +n === +t;case "[object Date]":case "[object Boolean]":
                return +n === +t;}var i = "[object Array]" === u;if (!i) {
            if ("object" != (typeof n === "undefined" ? "undefined" : _typeof(n)) || "object" != (typeof t === "undefined" ? "undefined" : _typeof(t))) return !1;var o = n.constructor,
                a = t.constructor;if (o !== a && !(m.isFunction(o) && o instanceof o && m.isFunction(a) && a instanceof a) && "constructor" in n && "constructor" in t) return !1;
        }r = r || [], e = e || [];for (var c = r.length; c--;) {
            if (r[c] === n) return e[c] === t;
        }if (r.push(n), e.push(t), i) {
            if (c = n.length, c !== t.length) return !1;for (; c--;) {
                if (!N(n[c], t[c], r, e)) return !1;
            }
        } else {
            var f,
                l = m.keys(n);if (c = l.length, m.keys(t).length !== c) return !1;for (; c--;) {
                if (f = l[c], !m.has(t, f) || !N(n[f], t[f], r, e)) return !1;
            }
        }return r.pop(), e.pop(), !0;
    };m.isEqual = function (n, t) {
        return N(n, t);
    }, m.isEmpty = function (n) {
        return null == n ? !0 : k(n) && (m.isArray(n) || m.isString(n) || m.isArguments(n)) ? 0 === n.length : 0 === m.keys(n).length;
    }, m.isElement = function (n) {
        return !(!n || 1 !== n.nodeType);
    }, m.isArray = h || function (n) {
        return "[object Array]" === s.call(n);
    }, m.isObject = function (n) {
        var t = typeof n === "undefined" ? "undefined" : _typeof(n);return "function" === t || "object" === t && !!n;
    }, m.each(["Arguments", "Function", "String", "Number", "Date", "RegExp", "Error"], function (n) {
        m["is" + n] = function (t) {
            return s.call(t) === "[object " + n + "]";
        };
    }), m.isArguments(arguments) || (m.isArguments = function (n) {
        return m.has(n, "callee");
    }), "function" != typeof /./ && "object" != (typeof Int8Array === "undefined" ? "undefined" : _typeof(Int8Array)) && (m.isFunction = function (n) {
        return "function" == typeof n || !1;
    }), m.isFinite = function (n) {
        return isFinite(n) && !isNaN(parseFloat(n));
    }, m.isNaN = function (n) {
        return m.isNumber(n) && n !== +n;
    }, m.isBoolean = function (n) {
        return n === !0 || n === !1 || "[object Boolean]" === s.call(n);
    }, m.isNull = function (n) {
        return null === n;
    }, m.isUndefined = function (n) {
        return n === void 0;
    }, m.has = function (n, t) {
        return null != n && p.call(n, t);
    }, m.noConflict = function () {
        return u._ = i, this;
    }, m.identity = function (n) {
        return n;
    }, m.constant = function (n) {
        return function () {
            return n;
        };
    }, m.noop = function () {}, m.property = w, m.propertyOf = function (n) {
        return null == n ? function () {} : function (t) {
            return n[t];
        };
    }, m.matcher = m.matches = function (n) {
        return n = m.extendOwn({}, n), function (t) {
            return m.isMatch(t, n);
        };
    }, m.times = function (n, t, r) {
        var e = Array(Math.max(0, n));t = b(t, r, 1);for (var u = 0; n > u; u++) {
            e[u] = t(u);
        }return e;
    }, m.random = function (n, t) {
        return null == t && (t = n, n = 0), n + Math.floor(Math.random() * (t - n + 1));
    }, m.now = Date.now || function () {
        return new Date().getTime();
    };var B = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;", "`": "&#x60;" },
        T = m.invert(B),
        R = function R(n) {
        var t = function t(_t2) {
            return n[_t2];
        },
            r = "(?:" + m.keys(n).join("|") + ")",
            e = RegExp(r),
            u = RegExp(r, "g");return function (n) {
            return n = null == n ? "" : "" + n, e.test(n) ? n.replace(u, t) : n;
        };
    };m.escape = R(B), m.unescape = R(T), m.result = function (n, t, r) {
        var e = null == n ? void 0 : n[t];return e === void 0 && (e = r), m.isFunction(e) ? e.call(n) : e;
    };var q = 0;m.uniqueId = function (n) {
        var t = ++q + "";return n ? n + t : t;
    }, m.templateSettings = { evaluate: /<%([\s\S]+?)%>/g, interpolate: /<%=([\s\S]+?)%>/g, escape: /<%-([\s\S]+?)%>/g };var K = /(.)^/,
        z = { "'": "'", "\\": "\\", "\r": "r", "\n": "n", "\u2028": "u2028", "\u2029": "u2029" },
        D = /\\|'|\r|\n|\u2028|\u2029/g,
        L = function L(n) {
        return "\\" + z[n];
    };m.template = function (n, t, r) {
        !t && r && (t = r), t = m.defaults({}, t, m.templateSettings);var e = RegExp([(t.escape || K).source, (t.interpolate || K).source, (t.evaluate || K).source].join("|") + "|$", "g"),
            u = 0,
            i = "__p+='";n.replace(e, function (t, r, e, o, a) {
            return i += n.slice(u, a).replace(D, L), u = a + t.length, r ? i += "'+\n((__t=(" + r + "))==null?'':_.escape(__t))+\n'" : e ? i += "'+\n((__t=(" + e + "))==null?'':__t)+\n'" : o && (i += "';\n" + o + "\n__p+='"), t;
        }), i += "';\n", t.variable || (i = "with(obj||{}){\n" + i + "}\n"), i = "var __t,__p='',__j=Array.prototype.join," + "print=function(){__p+=__j.call(arguments,'');};\n" + i + "return __p;\n";try {
            var o = new Function(t.variable || "obj", "_", i);
        } catch (a) {
            throw a.source = i, a;
        }var c = function c(n) {
            return o.call(this, n, m);
        },
            f = t.variable || "obj";return c.source = "function(" + f + "){\n" + i + "}", c;
    }, m.chain = function (n) {
        var t = m(n);return t._chain = !0, t;
    };var P = function P(n, t) {
        return n._chain ? m(t).chain() : t;
    };m.mixin = function (n) {
        m.each(m.functions(n), function (t) {
            var r = m[t] = n[t];m.prototype[t] = function () {
                var n = [this._wrapped];return f.apply(n, arguments), P(this, r.apply(m, n));
            };
        });
    }, m.mixin(m), m.each(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function (n) {
        var t = o[n];m.prototype[n] = function () {
            var r = this._wrapped;return t.apply(r, arguments), "shift" !== n && "splice" !== n || 0 !== r.length || delete r[0], P(this, r);
        };
    }), m.each(["concat", "join", "slice"], function (n) {
        var t = o[n];m.prototype[n] = function () {
            return P(this, t.apply(this._wrapped, arguments));
        };
    }), m.prototype.value = function () {
        return this._wrapped;
    }, m.prototype.valueOf = m.prototype.toJSON = m.prototype.value, m.prototype.toString = function () {
        return "" + this._wrapped;
    }, "function" == typeof define && define.amd && define("underscore", [], function () {
        return m;
    });
}).call(undefined);
//# sourceMappingURL=underscore-min.map
// Source https://stackoverflow.com/questions/247483/http-get-request-in-javascript

var HttpClient = function () {
    // this is a constructor

    this.get = function (url) {
        return new Promise(function (resolve, reject) {

            var request = new XMLHttpRequest();

            // Open an get request
            request.open('GET', url);

            request.onloadstart = function () {

                // Toggle animation
                document.querySelector('main').classList.remove('grow');
            };

            // If the request is done
            request.onload = function () {

                // Only if request is done
                if (request.status == 200) {

                    document.querySelector('main').classList.add('grow');

                    // Send text form request
                    resolve(request.responseText);
                } else {
                    // Reject the promise if there is a err
                    reject(new Error('Request failed!'));
                }
            };

            // Send the request
            request.send();
        });
    };
}(function () {
    "use strict";

    var config = {
        "apiKey": "9db42680b12e928d7f15d264928414ab:16:74324547",
        "url": "http://api.nytimes.com/svc/books/v2/lists/2010-10-01/trade-fiction-paperback.json?api-key=",
        "fullUrl": function fullUrl() {
            return this.url + this.apiKey;
        }
    };

    var API = {

        init: function init() {

            // Check if localstorage is set

            if (localStorage.getItem('data') === null) {
                this.getData();
            } else {

                // Get localstorage data

                var data = localStorage.getItem('data');
            }

            // Add active class to #home at first visit

            if (!window.location.hash) {
                document.querySelector('#home').classList.add('active');
            } else {
                this.toggleClass();
            }

            // If hash changes toggleClass

            window.onhashchange = this.toggleClass;
        },

        getData: function getData() {

            // Initialize new client (http-server required)

            var nyClient = new HttpClient();

            // Get API data

            nyClient.get(config.fullUrl()).then(function (response) {
                localStorage.setItem('data', response);
            }).catch(function (e) {
                console.error(e);
            });
        },

        toggleClass: function toggleClass() {

            // Get all menu items

            var links = Array.prototype.slice.call(document.querySelectorAll('nav li')),
                hash = window.location.hash.substring(1).split('/'),
                link = document.querySelector('#' + hash[0]),
                main = document.querySelector('main');

            // Remove active class

            links.forEach(function (item) {
                item.classList.remove("active");
            });

            // Add active class to new hash

            link.classList.add('active');

            // Main animation

            main.classList.add('grow');
        }
    };

    API.init();
})();
/*!
 * routie - a tiny hash router
 * v0.3.2
 * http://projects.jga.me/routie
 * copyright Greg Allen 2013
 * MIT License
*/
(function (n) {
    var e = [],
        t = {},
        r = "routie",
        o = n[r],
        i = function i(n, e) {
        this.name = e, this.path = n, this.keys = [], this.fns = [], this.params = {}, this.regex = a(this.path, this.keys, !1, !1);
    };i.prototype.addHandler = function (n) {
        this.fns.push(n);
    }, i.prototype.removeHandler = function (n) {
        for (var e = 0, t = this.fns.length; t > e; e++) {
            var r = this.fns[e];if (n == r) return this.fns.splice(e, 1), void 0;
        }
    }, i.prototype.run = function (n) {
        for (var e = 0, t = this.fns.length; t > e; e++) {
            this.fns[e].apply(this, n);
        }
    }, i.prototype.match = function (n, e) {
        var t = this.regex.exec(n);if (!t) return !1;for (var r = 1, o = t.length; o > r; ++r) {
            var i = this.keys[r - 1],
                a = "string" == typeof t[r] ? decodeURIComponent(t[r]) : t[r];i && (this.params[i.name] = a), e.push(a);
        }return !0;
    }, i.prototype.toURL = function (n) {
        var e = this.path;for (var t in n) {
            e = e.replace("/:" + t, "/" + n[t]);
        }if (e = e.replace(/\/:.*\?/g, "/").replace(/\?/g, ""), -1 != e.indexOf(":")) throw Error("missing parameters for url: " + e);return e;
    };var a = function a(n, e, t, r) {
        return n instanceof RegExp ? n : (n instanceof Array && (n = "(" + n.join("|") + ")"), n = n.concat(r ? "" : "/?").replace(/\/\(/g, "(?:/").replace(/\+/g, "__plus__").replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function (n, t, r, o, i, a) {
            return e.push({ name: o, optional: !!a }), t = t || "", "" + (a ? "" : t) + "(?:" + (a ? t : "") + (r || "") + (i || r && "([^/.]+?)" || "([^/]+?)") + ")" + (a || "");
        }).replace(/([\/.])/g, "\\$1").replace(/__plus__/g, "(.+)").replace(/\*/g, "(.*)"), RegExp("^" + n + "$", t ? "" : "i"));
    },
        s = function s(n, r) {
        var o = n.split(" "),
            a = 2 == o.length ? o[0] : null;n = 2 == o.length ? o[1] : o[0], t[n] || (t[n] = new i(n, a), e.push(t[n])), t[n].addHandler(r);
    },
        h = function h(n, e) {
        if ("function" == typeof e) s(n, e), h.reload();else if ("object" == (typeof n === "undefined" ? "undefined" : _typeof(n))) {
            for (var t in n) {
                s(t, n[t]);
            }h.reload();
        } else e === void 0 && h.navigate(n);
    };h.lookup = function (n, t) {
        for (var r = 0, o = e.length; o > r; r++) {
            var i = e[r];if (i.name == n) return i.toURL(t);
        }
    }, h.remove = function (n, e) {
        var r = t[n];r && r.removeHandler(e);
    }, h.removeAll = function () {
        t = {}, e = [];
    }, h.navigate = function (n, e) {
        e = e || {};var t = e.silent || !1;t && l(), setTimeout(function () {
            window.location.hash = n, t && setTimeout(function () {
                p();
            }, 1);
        }, 1);
    }, h.noConflict = function () {
        return n[r] = o, h;
    };var f = function f() {
        return window.location.hash.substring(1);
    },
        c = function c(n, e) {
        var t = [];return e.match(n, t) ? (e.run(t), !0) : !1;
    },
        u = h.reload = function () {
        for (var n = f(), t = 0, r = e.length; r > t; t++) {
            var o = e[t];if (c(n, o)) return;
        }
    },
        p = function p() {
        n.addEventListener ? n.addEventListener("hashchange", u, !1) : n.attachEvent("onhashchange", u);
    },
        l = function l() {
        n.removeEventListener ? n.removeEventListener("hashchange", u) : n.detachEvent("onhashchange", u);
    };p(), n[r] = h;
})(window);
(function () {
    "use strict";

    routie({

        'home': function home() {

            // Get home template from templates folder

            var template = new HttpClient();

            template.get('./static/templates/home.mst').then(function (response) {
                document.querySelector('main').innerHTML = Mustache.render(response);
            }).catch(function (e) {
                console.error(e);
            });
        },

        'pullrefresh': function pullrefresh() {

            // Get local storage items

            var data = JSON.parse(localStorage.getItem('data')),
                booksArray = [],
                template = new HttpClient();

            // Loop through data and get information

            data.results.forEach(function (book, index) {
                var books = {
                    id: Math.floor(Math.random() * 10) + 1,
                    author: book.book_details[0].author,
                    title: book.book_details[0].title,
                    description: book.book_details[0].description,
                    image: book.book_details[0].book_image,
                    price: book.book_details[0].price
                };
                booksArray.push(books);
            });

            // Get pull refresh template from templates folder

            template.get('./static/templates/pullrefresh.mst').then(function (response) {
                document.querySelector('main').innerHTML = Mustache.render(response);

                // Pull to refresh function                                       

                WebPullToRefresh.init({
                    loadingFunction: function loadingFunction() {
                        return new Promise(function (resolve, reject) {
                            // Run some async loading code here                               
                            if (1 === 1) {

                                var request = new XMLHttpRequest();

                                // Open an get request
                                request.open('GET', './static/templates/books.mst');

                                request.onloadstart = function () {
                                    document.querySelector('#content').classList.remove('grow');
                                };

                                // If the request is done
                                request.onload = function () {

                                    // Only if request is done
                                    if (request.status == 200) {
                                        document.querySelector('#content').innerHTML = Mustache.render(request.response, {
                                            "books": booksArray
                                        });
                                        document.querySelector('#content').classList.add('grow');
                                    } else {
                                        alert("Error");
                                    }
                                };

                                // Send the request
                                request.send();
                            } else {
                                reject();
                            }
                        });
                    }
                });
            }).catch(function (e) {
                console.error(e);
            });
        },

        'books': function books() {

            // Get local storage items

            var data = JSON.parse(localStorage.getItem('data')),
                booksArray = [],
                template = new HttpClient();

            // Loop through data and get information

            data.results.forEach(function (book, index) {
                var books = {
                    id: index,
                    author: book.book_details[0].author,
                    title: book.book_details[0].title,
                    description: book.book_details[0].description,
                    image: book.book_details[0].book_image,
                    price: book.book_details[0].price
                };
                booksArray.push(books);
            });

            // Get books template from templates folder

            template.get('./static/templates/books.mst').then(function (response) {
                document.querySelector('main').innerHTML = Mustache.render(response, {
                    "books": booksArray
                });
            }).catch(function (e) {
                console.error(e);
            });
        },

        'books/:id': function booksId(id) {

            // Get local storage items

            var data = JSON.parse(localStorage.getItem('data')),
                template = new HttpClient();

            template.get('./static/templates/book.mst').then(function (response) {
                document.querySelector('main').innerHTML = Mustache.render(response, {
                    "book": {
                        author: data.results[id].book_details[0].author,
                        title: data.results[id].book_details[0].title,
                        description: data.results[id].book_details[0].description,
                        image: data.results[id].book_details[0].book_image,
                        price: data.results[id].book_details[0].price,
                        publisher: data.results[id].book_details[0].publisher,
                        link: data.results[id].book_details[0].amazon_product_url
                    }
                });
            }).catch(function (e) {
                console.error(e);
            });
        },

        'search': function search() {

            // Get books template from templates folder

            var data = JSON.parse(localStorage.getItem('data')),
                template = new HttpClient();

            template.get('./static/templates/search.mst').then(function (response) {
                document.querySelector('main').innerHTML = Mustache.render(response);
                document.querySelector('#search-box').addEventListener('keyup', function (e) {
                    if (e.keyCode == 13) {
                        //window.location.assign(router.baseUrl + '#search/' + document.querySelector('#search-box').value);
                        window.location.hash = '#search/' + document.querySelector('#search-box').value;
                    }
                });
            }).catch(function (e) {
                console.error(e);
            });
        },

        'search/:query': function searchQuery(query) {

            // Get local storage items

            var data = JSON.parse(localStorage.getItem('data')),
                template = new HttpClient(),
                laBoek = _.find(data.results, function (result) {
                return result.book_details[0].title.toLowerCase() === query.toLowerCase();
            }),
                top5 = _.filter(data.results, function (result) {
                return result.rank < 6;
            });

            // Top 5 boeken op basis van ranking
            console.log(top5);

            if (laBoek) {

                // Get search-detail template from templates folder

                template.get('./static/templates/search-detail.mst').then(function (response) {
                    document.querySelector('main').innerHTML = Mustache.render(response, {
                        "book": {
                            author: laBoek.book_details[0].author,
                            title: laBoek.book_details[0].title,
                            description: laBoek.book_details[0].description,
                            image: laBoek.book_details[0].book_image,
                            price: laBoek.book_details[0].price,
                            publisher: laBoek.book_details[0].publisher,
                            link: laBoek.book_details[0].amazon_product_url
                        }
                    });
                    document.querySelector('#search-box').addEventListener('keyup', function (e) {
                        if (e.keyCode == 13) {
                            window.location.hash = '#search/' + document.querySelector('#search-box').value;
                        }
                    });
                }).catch(function (e) {
                    console.error(e);
                });
            } else {

                // Get search template from templates folder

                template.get('./static/templates/search.mst').then(function (response) {
                    document.querySelector('main').innerHTML = Mustache.render(response);
                    document.querySelector('#error').style.display = "block";
                    document.querySelector('#search-box').addEventListener('keyup', function (e) {
                        if (e.keyCode == 13) {
                            window.location.hash = '#search/' + document.querySelector('#search-box').value;
                        }
                    });
                }).catch(function (e) {
                    console.error(e);
                });
            }
        },

        '': function _() {

            // Get home template from templates folder

            var template = new HttpClient();

            template.get('./static/templates/home.mst').then(function (response) {
                document.querySelector('main').innerHTML = Mustache.render(response);
            }).catch(function (e) {
                console.error(e);
            });
        },

        '*': function _() {
            alert("404 page not found.");
        }

    });
})();
/*! Hammer.JS - v2.0.4 - 2014-09-28
 * http://hammerjs.github.io/
 *
 * Copyright (c) 2014 Jorik Tangelder;
 * Licensed under the MIT license */
!function (a, b, c, d) {
    "use strict";
    function e(a, b, c) {
        return setTimeout(k(a, c), b);
    }function f(a, b, c) {
        return Array.isArray(a) ? (g(a, c[b], c), !0) : !1;
    }function g(a, b, c) {
        var e;if (a) if (a.forEach) a.forEach(b, c);else if (a.length !== d) for (e = 0; e < a.length;) {
            b.call(c, a[e], e, a), e++;
        } else for (e in a) {
            a.hasOwnProperty(e) && b.call(c, a[e], e, a);
        }
    }function h(a, b, c) {
        for (var e = Object.keys(b), f = 0; f < e.length;) {
            (!c || c && a[e[f]] === d) && (a[e[f]] = b[e[f]]), f++;
        }return a;
    }function i(a, b) {
        return h(a, b, !0);
    }function j(a, b, c) {
        var d,
            e = b.prototype;d = a.prototype = Object.create(e), d.constructor = a, d._super = e, c && h(d, c);
    }function k(a, b) {
        return function () {
            return a.apply(b, arguments);
        };
    }function l(a, b) {
        return (typeof a === "undefined" ? "undefined" : _typeof(a)) == kb ? a.apply(b ? b[0] || d : d, b) : a;
    }function m(a, b) {
        return a === d ? b : a;
    }function n(a, b, c) {
        g(r(b), function (b) {
            a.addEventListener(b, c, !1);
        });
    }function o(a, b, c) {
        g(r(b), function (b) {
            a.removeEventListener(b, c, !1);
        });
    }function p(a, b) {
        for (; a;) {
            if (a == b) return !0;a = a.parentNode;
        }return !1;
    }function q(a, b) {
        return a.indexOf(b) > -1;
    }function r(a) {
        return a.trim().split(/\s+/g);
    }function s(a, b, c) {
        if (a.indexOf && !c) return a.indexOf(b);for (var d = 0; d < a.length;) {
            if (c && a[d][c] == b || !c && a[d] === b) return d;d++;
        }return -1;
    }function t(a) {
        return Array.prototype.slice.call(a, 0);
    }function u(a, b, c) {
        for (var d = [], e = [], f = 0; f < a.length;) {
            var g = b ? a[f][b] : a[f];s(e, g) < 0 && d.push(a[f]), e[f] = g, f++;
        }return c && (d = b ? d.sort(function (a, c) {
            return a[b] > c[b];
        }) : d.sort()), d;
    }function v(a, b) {
        for (var c, e, f = b[0].toUpperCase() + b.slice(1), g = 0; g < ib.length;) {
            if (c = ib[g], e = c ? c + f : b, e in a) return e;g++;
        }return d;
    }function w() {
        return ob++;
    }function x(a) {
        var b = a.ownerDocument;return b.defaultView || b.parentWindow;
    }function y(a, b) {
        var c = this;this.manager = a, this.callback = b, this.element = a.element, this.target = a.options.inputTarget, this.domHandler = function (b) {
            l(a.options.enable, [a]) && c.handler(b);
        }, this.init();
    }function z(a) {
        var b,
            c = a.options.inputClass;return new (b = c ? c : rb ? N : sb ? Q : qb ? S : M)(a, A);
    }function A(a, b, c) {
        var d = c.pointers.length,
            e = c.changedPointers.length,
            f = b & yb && d - e === 0,
            g = b & (Ab | Bb) && d - e === 0;c.isFirst = !!f, c.isFinal = !!g, f && (a.session = {}), c.eventType = b, B(a, c), a.emit("hammer.input", c), a.recognize(c), a.session.prevInput = c;
    }function B(a, b) {
        var c = a.session,
            d = b.pointers,
            e = d.length;c.firstInput || (c.firstInput = E(b)), e > 1 && !c.firstMultiple ? c.firstMultiple = E(b) : 1 === e && (c.firstMultiple = !1);var f = c.firstInput,
            g = c.firstMultiple,
            h = g ? g.center : f.center,
            i = b.center = F(d);b.timeStamp = nb(), b.deltaTime = b.timeStamp - f.timeStamp, b.angle = J(h, i), b.distance = I(h, i), C(c, b), b.offsetDirection = H(b.deltaX, b.deltaY), b.scale = g ? L(g.pointers, d) : 1, b.rotation = g ? K(g.pointers, d) : 0, D(c, b);var j = a.element;p(b.srcEvent.target, j) && (j = b.srcEvent.target), b.target = j;
    }function C(a, b) {
        var c = b.center,
            d = a.offsetDelta || {},
            e = a.prevDelta || {},
            f = a.prevInput || {};(b.eventType === yb || f.eventType === Ab) && (e = a.prevDelta = { x: f.deltaX || 0, y: f.deltaY || 0 }, d = a.offsetDelta = { x: c.x, y: c.y }), b.deltaX = e.x + (c.x - d.x), b.deltaY = e.y + (c.y - d.y);
    }function D(a, b) {
        var c,
            e,
            f,
            g,
            h = a.lastInterval || b,
            i = b.timeStamp - h.timeStamp;if (b.eventType != Bb && (i > xb || h.velocity === d)) {
            var j = h.deltaX - b.deltaX,
                k = h.deltaY - b.deltaY,
                l = G(i, j, k);e = l.x, f = l.y, c = mb(l.x) > mb(l.y) ? l.x : l.y, g = H(j, k), a.lastInterval = b;
        } else c = h.velocity, e = h.velocityX, f = h.velocityY, g = h.direction;b.velocity = c, b.velocityX = e, b.velocityY = f, b.direction = g;
    }function E(a) {
        for (var b = [], c = 0; c < a.pointers.length;) {
            b[c] = { clientX: lb(a.pointers[c].clientX), clientY: lb(a.pointers[c].clientY) }, c++;
        }return { timeStamp: nb(), pointers: b, center: F(b), deltaX: a.deltaX, deltaY: a.deltaY };
    }function F(a) {
        var b = a.length;if (1 === b) return { x: lb(a[0].clientX), y: lb(a[0].clientY) };for (var c = 0, d = 0, e = 0; b > e;) {
            c += a[e].clientX, d += a[e].clientY, e++;
        }return { x: lb(c / b), y: lb(d / b) };
    }function G(a, b, c) {
        return { x: b / a || 0, y: c / a || 0 };
    }function H(a, b) {
        return a === b ? Cb : mb(a) >= mb(b) ? a > 0 ? Db : Eb : b > 0 ? Fb : Gb;
    }function I(a, b, c) {
        c || (c = Kb);var d = b[c[0]] - a[c[0]],
            e = b[c[1]] - a[c[1]];return Math.sqrt(d * d + e * e);
    }function J(a, b, c) {
        c || (c = Kb);var d = b[c[0]] - a[c[0]],
            e = b[c[1]] - a[c[1]];return 180 * Math.atan2(e, d) / Math.PI;
    }function K(a, b) {
        return J(b[1], b[0], Lb) - J(a[1], a[0], Lb);
    }function L(a, b) {
        return I(b[0], b[1], Lb) / I(a[0], a[1], Lb);
    }function M() {
        this.evEl = Nb, this.evWin = Ob, this.allow = !0, this.pressed = !1, y.apply(this, arguments);
    }function N() {
        this.evEl = Rb, this.evWin = Sb, y.apply(this, arguments), this.store = this.manager.session.pointerEvents = [];
    }function O() {
        this.evTarget = Ub, this.evWin = Vb, this.started = !1, y.apply(this, arguments);
    }function P(a, b) {
        var c = t(a.touches),
            d = t(a.changedTouches);return b & (Ab | Bb) && (c = u(c.concat(d), "identifier", !0)), [c, d];
    }function Q() {
        this.evTarget = Xb, this.targetIds = {}, y.apply(this, arguments);
    }function R(a, b) {
        var c = t(a.touches),
            d = this.targetIds;if (b & (yb | zb) && 1 === c.length) return d[c[0].identifier] = !0, [c, c];var e,
            f,
            g = t(a.changedTouches),
            h = [],
            i = this.target;if (f = c.filter(function (a) {
            return p(a.target, i);
        }), b === yb) for (e = 0; e < f.length;) {
            d[f[e].identifier] = !0, e++;
        }for (e = 0; e < g.length;) {
            d[g[e].identifier] && h.push(g[e]), b & (Ab | Bb) && delete d[g[e].identifier], e++;
        }return h.length ? [u(f.concat(h), "identifier", !0), h] : void 0;
    }function S() {
        y.apply(this, arguments);var a = k(this.handler, this);this.touch = new Q(this.manager, a), this.mouse = new M(this.manager, a);
    }function T(a, b) {
        this.manager = a, this.set(b);
    }function U(a) {
        if (q(a, bc)) return bc;var b = q(a, cc),
            c = q(a, dc);return b && c ? cc + " " + dc : b || c ? b ? cc : dc : q(a, ac) ? ac : _b;
    }function V(a) {
        this.id = w(), this.manager = null, this.options = i(a || {}, this.defaults), this.options.enable = m(this.options.enable, !0), this.state = ec, this.simultaneous = {}, this.requireFail = [];
    }function W(a) {
        return a & jc ? "cancel" : a & hc ? "end" : a & gc ? "move" : a & fc ? "start" : "";
    }function X(a) {
        return a == Gb ? "down" : a == Fb ? "up" : a == Db ? "left" : a == Eb ? "right" : "";
    }function Y(a, b) {
        var c = b.manager;return c ? c.get(a) : a;
    }function Z() {
        V.apply(this, arguments);
    }function $() {
        Z.apply(this, arguments), this.pX = null, this.pY = null;
    }function _() {
        Z.apply(this, arguments);
    }function ab() {
        V.apply(this, arguments), this._timer = null, this._input = null;
    }function bb() {
        Z.apply(this, arguments);
    }function cb() {
        Z.apply(this, arguments);
    }function db() {
        V.apply(this, arguments), this.pTime = !1, this.pCenter = !1, this._timer = null, this._input = null, this.count = 0;
    }function eb(a, b) {
        return b = b || {}, b.recognizers = m(b.recognizers, eb.defaults.preset), new fb(a, b);
    }function fb(a, b) {
        b = b || {}, this.options = i(b, eb.defaults), this.options.inputTarget = this.options.inputTarget || a, this.handlers = {}, this.session = {}, this.recognizers = [], this.element = a, this.input = z(this), this.touchAction = new T(this, this.options.touchAction), gb(this, !0), g(b.recognizers, function (a) {
            var b = this.add(new a[0](a[1]));a[2] && b.recognizeWith(a[2]), a[3] && b.requireFailure(a[3]);
        }, this);
    }function gb(a, b) {
        var c = a.element;g(a.options.cssProps, function (a, d) {
            c.style[v(c.style, d)] = b ? a : "";
        });
    }function hb(a, c) {
        var d = b.createEvent("Event");d.initEvent(a, !0, !0), d.gesture = c, c.target.dispatchEvent(d);
    }var ib = ["", "webkit", "moz", "MS", "ms", "o"],
        jb = b.createElement("div"),
        kb = "function",
        lb = Math.round,
        mb = Math.abs,
        nb = Date.now,
        ob = 1,
        pb = /mobile|tablet|ip(ad|hone|od)|android/i,
        qb = "ontouchstart" in a,
        rb = v(a, "PointerEvent") !== d,
        sb = qb && pb.test(navigator.userAgent),
        tb = "touch",
        ub = "pen",
        vb = "mouse",
        wb = "kinect",
        xb = 25,
        yb = 1,
        zb = 2,
        Ab = 4,
        Bb = 8,
        Cb = 1,
        Db = 2,
        Eb = 4,
        Fb = 8,
        Gb = 16,
        Hb = Db | Eb,
        Ib = Fb | Gb,
        Jb = Hb | Ib,
        Kb = ["x", "y"],
        Lb = ["clientX", "clientY"];y.prototype = { handler: function handler() {}, init: function init() {
            this.evEl && n(this.element, this.evEl, this.domHandler), this.evTarget && n(this.target, this.evTarget, this.domHandler), this.evWin && n(x(this.element), this.evWin, this.domHandler);
        }, destroy: function destroy() {
            this.evEl && o(this.element, this.evEl, this.domHandler), this.evTarget && o(this.target, this.evTarget, this.domHandler), this.evWin && o(x(this.element), this.evWin, this.domHandler);
        } };var Mb = { mousedown: yb, mousemove: zb, mouseup: Ab },
        Nb = "mousedown",
        Ob = "mousemove mouseup";j(M, y, { handler: function handler(a) {
            var b = Mb[a.type];b & yb && 0 === a.button && (this.pressed = !0), b & zb && 1 !== a.which && (b = Ab), this.pressed && this.allow && (b & Ab && (this.pressed = !1), this.callback(this.manager, b, { pointers: [a], changedPointers: [a], pointerType: vb, srcEvent: a }));
        } });var Pb = { pointerdown: yb, pointermove: zb, pointerup: Ab, pointercancel: Bb, pointerout: Bb },
        Qb = { 2: tb, 3: ub, 4: vb, 5: wb },
        Rb = "pointerdown",
        Sb = "pointermove pointerup pointercancel";a.MSPointerEvent && (Rb = "MSPointerDown", Sb = "MSPointerMove MSPointerUp MSPointerCancel"), j(N, y, { handler: function handler(a) {
            var b = this.store,
                c = !1,
                d = a.type.toLowerCase().replace("ms", ""),
                e = Pb[d],
                f = Qb[a.pointerType] || a.pointerType,
                g = f == tb,
                h = s(b, a.pointerId, "pointerId");e & yb && (0 === a.button || g) ? 0 > h && (b.push(a), h = b.length - 1) : e & (Ab | Bb) && (c = !0), 0 > h || (b[h] = a, this.callback(this.manager, e, { pointers: b, changedPointers: [a], pointerType: f, srcEvent: a }), c && b.splice(h, 1));
        } });var Tb = { touchstart: yb, touchmove: zb, touchend: Ab, touchcancel: Bb },
        Ub = "touchstart",
        Vb = "touchstart touchmove touchend touchcancel";j(O, y, { handler: function handler(a) {
            var b = Tb[a.type];if (b === yb && (this.started = !0), this.started) {
                var c = P.call(this, a, b);b & (Ab | Bb) && c[0].length - c[1].length === 0 && (this.started = !1), this.callback(this.manager, b, { pointers: c[0], changedPointers: c[1], pointerType: tb, srcEvent: a });
            }
        } });var Wb = { touchstart: yb, touchmove: zb, touchend: Ab, touchcancel: Bb },
        Xb = "touchstart touchmove touchend touchcancel";j(Q, y, { handler: function handler(a) {
            var b = Wb[a.type],
                c = R.call(this, a, b);c && this.callback(this.manager, b, { pointers: c[0], changedPointers: c[1], pointerType: tb, srcEvent: a });
        } }), j(S, y, { handler: function handler(a, b, c) {
            var d = c.pointerType == tb,
                e = c.pointerType == vb;if (d) this.mouse.allow = !1;else if (e && !this.mouse.allow) return;b & (Ab | Bb) && (this.mouse.allow = !0), this.callback(a, b, c);
        }, destroy: function destroy() {
            this.touch.destroy(), this.mouse.destroy();
        } });var Yb = v(jb.style, "touchAction"),
        Zb = Yb !== d,
        $b = "compute",
        _b = "auto",
        ac = "manipulation",
        bc = "none",
        cc = "pan-x",
        dc = "pan-y";T.prototype = { set: function set(a) {
            a == $b && (a = this.compute()), Zb && (this.manager.element.style[Yb] = a), this.actions = a.toLowerCase().trim();
        }, update: function update() {
            this.set(this.manager.options.touchAction);
        }, compute: function compute() {
            var a = [];return g(this.manager.recognizers, function (b) {
                l(b.options.enable, [b]) && (a = a.concat(b.getTouchAction()));
            }), U(a.join(" "));
        }, preventDefaults: function preventDefaults(a) {
            if (!Zb) {
                var b = a.srcEvent,
                    c = a.offsetDirection;if (this.manager.session.prevented) return void b.preventDefault();var d = this.actions,
                    e = q(d, bc),
                    f = q(d, dc),
                    g = q(d, cc);return e || f && c & Hb || g && c & Ib ? this.preventSrc(b) : void 0;
            }
        }, preventSrc: function preventSrc(a) {
            this.manager.session.prevented = !0, a.preventDefault();
        } };var ec = 1,
        fc = 2,
        gc = 4,
        hc = 8,
        ic = hc,
        jc = 16,
        kc = 32;V.prototype = { defaults: {}, set: function set(a) {
            return h(this.options, a), this.manager && this.manager.touchAction.update(), this;
        }, recognizeWith: function recognizeWith(a) {
            if (f(a, "recognizeWith", this)) return this;var b = this.simultaneous;return a = Y(a, this), b[a.id] || (b[a.id] = a, a.recognizeWith(this)), this;
        }, dropRecognizeWith: function dropRecognizeWith(a) {
            return f(a, "dropRecognizeWith", this) ? this : (a = Y(a, this), delete this.simultaneous[a.id], this);
        }, requireFailure: function requireFailure(a) {
            if (f(a, "requireFailure", this)) return this;var b = this.requireFail;return a = Y(a, this), -1 === s(b, a) && (b.push(a), a.requireFailure(this)), this;
        }, dropRequireFailure: function dropRequireFailure(a) {
            if (f(a, "dropRequireFailure", this)) return this;a = Y(a, this);var b = s(this.requireFail, a);return b > -1 && this.requireFail.splice(b, 1), this;
        }, hasRequireFailures: function hasRequireFailures() {
            return this.requireFail.length > 0;
        }, canRecognizeWith: function canRecognizeWith(a) {
            return !!this.simultaneous[a.id];
        }, emit: function emit(a) {
            function b(b) {
                c.manager.emit(c.options.event + (b ? W(d) : ""), a);
            }var c = this,
                d = this.state;hc > d && b(!0), b(), d >= hc && b(!0);
        }, tryEmit: function tryEmit(a) {
            return this.canEmit() ? this.emit(a) : void (this.state = kc);
        }, canEmit: function canEmit() {
            for (var a = 0; a < this.requireFail.length;) {
                if (!(this.requireFail[a].state & (kc | ec))) return !1;a++;
            }return !0;
        }, recognize: function recognize(a) {
            var b = h({}, a);return l(this.options.enable, [this, b]) ? (this.state & (ic | jc | kc) && (this.state = ec), this.state = this.process(b), void (this.state & (fc | gc | hc | jc) && this.tryEmit(b))) : (this.reset(), void (this.state = kc));
        }, process: function process() {}, getTouchAction: function getTouchAction() {}, reset: function reset() {} }, j(Z, V, { defaults: { pointers: 1 }, attrTest: function attrTest(a) {
            var b = this.options.pointers;return 0 === b || a.pointers.length === b;
        }, process: function process(a) {
            var b = this.state,
                c = a.eventType,
                d = b & (fc | gc),
                e = this.attrTest(a);return d && (c & Bb || !e) ? b | jc : d || e ? c & Ab ? b | hc : b & fc ? b | gc : fc : kc;
        } }), j($, Z, { defaults: { event: "pan", threshold: 10, pointers: 1, direction: Jb }, getTouchAction: function getTouchAction() {
            var a = this.options.direction,
                b = [];return a & Hb && b.push(dc), a & Ib && b.push(cc), b;
        }, directionTest: function directionTest(a) {
            var b = this.options,
                c = !0,
                d = a.distance,
                e = a.direction,
                f = a.deltaX,
                g = a.deltaY;return e & b.direction || (b.direction & Hb ? (e = 0 === f ? Cb : 0 > f ? Db : Eb, c = f != this.pX, d = Math.abs(a.deltaX)) : (e = 0 === g ? Cb : 0 > g ? Fb : Gb, c = g != this.pY, d = Math.abs(a.deltaY))), a.direction = e, c && d > b.threshold && e & b.direction;
        }, attrTest: function attrTest(a) {
            return Z.prototype.attrTest.call(this, a) && (this.state & fc || !(this.state & fc) && this.directionTest(a));
        }, emit: function emit(a) {
            this.pX = a.deltaX, this.pY = a.deltaY;var b = X(a.direction);b && this.manager.emit(this.options.event + b, a), this._super.emit.call(this, a);
        } }), j(_, Z, { defaults: { event: "pinch", threshold: 0, pointers: 2 }, getTouchAction: function getTouchAction() {
            return [bc];
        }, attrTest: function attrTest(a) {
            return this._super.attrTest.call(this, a) && (Math.abs(a.scale - 1) > this.options.threshold || this.state & fc);
        }, emit: function emit(a) {
            if (this._super.emit.call(this, a), 1 !== a.scale) {
                var b = a.scale < 1 ? "in" : "out";this.manager.emit(this.options.event + b, a);
            }
        } }), j(ab, V, { defaults: { event: "press", pointers: 1, time: 500, threshold: 5 }, getTouchAction: function getTouchAction() {
            return [_b];
        }, process: function process(a) {
            var b = this.options,
                c = a.pointers.length === b.pointers,
                d = a.distance < b.threshold,
                f = a.deltaTime > b.time;if (this._input = a, !d || !c || a.eventType & (Ab | Bb) && !f) this.reset();else if (a.eventType & yb) this.reset(), this._timer = e(function () {
                this.state = ic, this.tryEmit();
            }, b.time, this);else if (a.eventType & Ab) return ic;return kc;
        }, reset: function reset() {
            clearTimeout(this._timer);
        }, emit: function emit(a) {
            this.state === ic && (a && a.eventType & Ab ? this.manager.emit(this.options.event + "up", a) : (this._input.timeStamp = nb(), this.manager.emit(this.options.event, this._input)));
        } }), j(bb, Z, { defaults: { event: "rotate", threshold: 0, pointers: 2 }, getTouchAction: function getTouchAction() {
            return [bc];
        }, attrTest: function attrTest(a) {
            return this._super.attrTest.call(this, a) && (Math.abs(a.rotation) > this.options.threshold || this.state & fc);
        } }), j(cb, Z, { defaults: { event: "swipe", threshold: 10, velocity: .65, direction: Hb | Ib, pointers: 1 }, getTouchAction: function getTouchAction() {
            return $.prototype.getTouchAction.call(this);
        }, attrTest: function attrTest(a) {
            var b,
                c = this.options.direction;return c & (Hb | Ib) ? b = a.velocity : c & Hb ? b = a.velocityX : c & Ib && (b = a.velocityY), this._super.attrTest.call(this, a) && c & a.direction && a.distance > this.options.threshold && mb(b) > this.options.velocity && a.eventType & Ab;
        }, emit: function emit(a) {
            var b = X(a.direction);b && this.manager.emit(this.options.event + b, a), this.manager.emit(this.options.event, a);
        } }), j(db, V, { defaults: { event: "tap", pointers: 1, taps: 1, interval: 300, time: 250, threshold: 2, posThreshold: 10 }, getTouchAction: function getTouchAction() {
            return [ac];
        }, process: function process(a) {
            var b = this.options,
                c = a.pointers.length === b.pointers,
                d = a.distance < b.threshold,
                f = a.deltaTime < b.time;if (this.reset(), a.eventType & yb && 0 === this.count) return this.failTimeout();if (d && f && c) {
                if (a.eventType != Ab) return this.failTimeout();var g = this.pTime ? a.timeStamp - this.pTime < b.interval : !0,
                    h = !this.pCenter || I(this.pCenter, a.center) < b.posThreshold;this.pTime = a.timeStamp, this.pCenter = a.center, h && g ? this.count += 1 : this.count = 1, this._input = a;var i = this.count % b.taps;if (0 === i) return this.hasRequireFailures() ? (this._timer = e(function () {
                    this.state = ic, this.tryEmit();
                }, b.interval, this), fc) : ic;
            }return kc;
        }, failTimeout: function failTimeout() {
            return this._timer = e(function () {
                this.state = kc;
            }, this.options.interval, this), kc;
        }, reset: function reset() {
            clearTimeout(this._timer);
        }, emit: function emit() {
            this.state == ic && (this._input.tapCount = this.count, this.manager.emit(this.options.event, this._input));
        } }), eb.VERSION = "2.0.4", eb.defaults = { domEvents: !1, touchAction: $b, enable: !0, inputTarget: null, inputClass: null, preset: [[bb, { enable: !1 }], [_, { enable: !1 }, ["rotate"]], [cb, { direction: Hb }], [$, { direction: Hb }, ["swipe"]], [db], [db, { event: "doubletap", taps: 2 }, ["tap"]], [ab]], cssProps: { userSelect: "none", touchSelect: "none", touchCallout: "none", contentZooming: "none", userDrag: "none", tapHighlightColor: "rgba(0,0,0,0)" } };var lc = 1,
        mc = 2;fb.prototype = { set: function set(a) {
            return h(this.options, a), a.touchAction && this.touchAction.update(), a.inputTarget && (this.input.destroy(), this.input.target = a.inputTarget, this.input.init()), this;
        }, stop: function stop(a) {
            this.session.stopped = a ? mc : lc;
        }, recognize: function recognize(a) {
            var b = this.session;if (!b.stopped) {
                this.touchAction.preventDefaults(a);var c,
                    d = this.recognizers,
                    e = b.curRecognizer;(!e || e && e.state & ic) && (e = b.curRecognizer = null);for (var f = 0; f < d.length;) {
                    c = d[f], b.stopped === mc || e && c != e && !c.canRecognizeWith(e) ? c.reset() : c.recognize(a), !e && c.state & (fc | gc | hc) && (e = b.curRecognizer = c), f++;
                }
            }
        }, get: function get(a) {
            if (a instanceof V) return a;for (var b = this.recognizers, c = 0; c < b.length; c++) {
                if (b[c].options.event == a) return b[c];
            }return null;
        }, add: function add(a) {
            if (f(a, "add", this)) return this;var b = this.get(a.options.event);return b && this.remove(b), this.recognizers.push(a), a.manager = this, this.touchAction.update(), a;
        }, remove: function remove(a) {
            if (f(a, "remove", this)) return this;var b = this.recognizers;return a = this.get(a), b.splice(s(b, a), 1), this.touchAction.update(), this;
        }, on: function on(a, b) {
            var c = this.handlers;return g(r(a), function (a) {
                c[a] = c[a] || [], c[a].push(b);
            }), this;
        }, off: function off(a, b) {
            var c = this.handlers;return g(r(a), function (a) {
                b ? c[a].splice(s(c[a], b), 1) : delete c[a];
            }), this;
        }, emit: function emit(a, b) {
            this.options.domEvents && hb(a, b);var c = this.handlers[a] && this.handlers[a].slice();if (c && c.length) {
                b.type = a, b.preventDefault = function () {
                    b.srcEvent.preventDefault();
                };for (var d = 0; d < c.length;) {
                    c[d](b), d++;
                }
            }
        }, destroy: function destroy() {
            this.element && gb(this, !1), this.handlers = {}, this.session = {}, this.input.destroy(), this.element = null;
        } }, h(eb, { INPUT_START: yb, INPUT_MOVE: zb, INPUT_END: Ab, INPUT_CANCEL: Bb, STATE_POSSIBLE: ec, STATE_BEGAN: fc, STATE_CHANGED: gc, STATE_ENDED: hc, STATE_RECOGNIZED: ic, STATE_CANCELLED: jc, STATE_FAILED: kc, DIRECTION_NONE: Cb, DIRECTION_LEFT: Db, DIRECTION_RIGHT: Eb, DIRECTION_UP: Fb, DIRECTION_DOWN: Gb, DIRECTION_HORIZONTAL: Hb, DIRECTION_VERTICAL: Ib, DIRECTION_ALL: Jb, Manager: fb, Input: y, TouchAction: T, TouchInput: Q, MouseInput: M, PointerEventInput: N, TouchMouseInput: S, SingleTouchInput: O, Recognizer: V, AttrRecognizer: Z, Tap: db, Pan: $, Swipe: cb, Pinch: _, Rotate: bb, Press: ab, on: n, off: o, each: g, merge: i, extend: h, inherit: j, bindFn: k, prefixed: v }), (typeof define === "undefined" ? "undefined" : _typeof(define)) == kb && define.amd ? define(function () {
        return eb;
    }) : "undefined" != typeof module && module.exports ? module.exports = eb : a[c] = eb;
}(window, document, "Hammer");
var WebPullToRefresh = function () {
    'use strict';

    /**
     * Hold all of the default parameters for the module
     * @type {object}
     */

    var defaults = {
        // ID of the element holding pannable content area
        contentEl: 'content',

        // ID of the element holding pull to refresh loading area
        ptrEl: 'ptr',

        // Number of pixels of panning until refresh
        distanceToRefresh: 70,

        // Pointer to function that does the loading and returns a promise
        loadingFunction: false,

        // Dragging resistance level
        resistance: 2.5
    };

    /**
     * Hold all of the merged parameter and default module options
     * @type {object}
     */
    var options = {};

    /**
     * Pan event parameters
     * @type {object}
     */
    var pan = {
        enabled: false,
        distance: 0,
        startingPositionY: 0
    };

    /**
     * Easy shortener for handling adding and removing body classes.
     */
    var bodyClass = document.body.classList;

    /**
     * Initialize pull to refresh, hammer, and bind pan events.
     * 
     * @param {object=} params - Setup parameters for pull to refresh
     */
    var init = function init(params) {
        params = params || {};
        options = {
            contentEl: params.contentEl || document.getElementById(defaults.contentEl),
            ptrEl: params.ptrEl || document.getElementById(defaults.ptrEl),
            distanceToRefresh: params.distanceToRefresh || defaults.distanceToRefresh,
            loadingFunction: params.loadingFunction || defaults.loadingFunction,
            resistance: params.resistance || defaults.resistance
        };

        if (!options.contentEl || !options.ptrEl) {
            return false;
        }

        var h = new Hammer(options.contentEl);

        h.get('pan').set({ direction: Hammer.DIRECTION_VERTICAL });

        h.on('panstart', _panStart);
        h.on('pandown', _panDown);
        h.on('panup', _panUp);
        h.on('panend', _panEnd);
    };

    /**
     * Determine whether pan events should apply based on scroll position on panstart
     * 
     * @param {object} e - Event object
     */
    var _panStart = function _panStart(e) {
        pan.startingPositionY = document.body.scrollTop;

        if (pan.startingPositionY === 0) {
            pan.enabled = true;
        }
    };

    /**
     * Handle element on screen movement when the pandown events is firing.
     * 
     * @param {object} e - Event object
     */
    var _panDown = function _panDown(e) {
        if (!pan.enabled) {
            return;
        }

        e.preventDefault();
        pan.distance = e.distance / options.resistance;

        _setContentPan();
        _setBodyClass();
    };

    /**
     * Handle element on screen movement when the pandown events is firing.
     * 
     * @param {object} e - Event object
     */
    var _panUp = function _panUp(e) {
        if (!pan.enabled || pan.distance === 0) {
            return;
        }

        e.preventDefault();

        if (pan.distance < e.distance / options.resistance) {
            pan.distance = 0;
        } else {
            pan.distance = e.distance / options.resistance;
        }

        _setContentPan();
        _setBodyClass();
    };

    /**
     * Set the CSS transform on the content element to move it on the screen.
     */
    var _setContentPan = function _setContentPan() {
        // Use transforms to smoothly animate elements on desktop and mobile devices
        options.contentEl.style.transform = options.contentEl.style.webkitTransform = 'translate3d( 0, ' + pan.distance + 'px, 0 )';
        options.ptrEl.style.transform = options.ptrEl.style.webkitTransform = 'translate3d( 0, ' + (pan.distance - options.ptrEl.offsetHeight) + 'px, 0 )';
    };

    /**
     * Set/remove the loading body class to show or hide the loading indicator after pull down.
     */
    var _setBodyClass = function _setBodyClass() {
        if (pan.distance > options.distanceToRefresh) {
            bodyClass.add('ptr-refresh');
        } else {
            bodyClass.remove('ptr-refresh');
        }
    };

    /**
     * Determine how to animate and position elements when the panend event fires.
     * 
     * @param {object} e - Event object
     */
    var _panEnd = function _panEnd(e) {
        if (!pan.enabled) {
            return;
        }

        e.preventDefault();

        options.contentEl.style.transform = options.contentEl.style.webkitTransform = '';
        options.ptrEl.style.transform = options.ptrEl.style.webkitTransform = '';

        if (document.body.classList.contains('ptr-refresh')) {
            _doLoading();
        } else {
            _doReset();
        }

        pan.distance = 0;
        pan.enabled = false;
    };

    /**
     * Position content and refresh elements to show that loading is taking place.
     */
    var _doLoading = function _doLoading() {
        bodyClass.add('ptr-loading');

        // If no valid loading function exists, just reset elements
        if (!options.loadingFunction) {
            return _doReset();
        }

        // The loading function should return a promise
        var loadingPromise = options.loadingFunction();

        // For UX continuity, make sure we show loading for at least one second before resetting
        setTimeout(function () {
            // Once actual loading is complete, reset pull to refresh
            loadingPromise.then(_doReset);
        }, 1000);
    };

    /**
     * Reset all elements to their starting positions before any paning took place.
     */
    var _doReset = function _doReset() {
        bodyClass.remove('ptr-loading');
        bodyClass.remove('ptr-refresh');
        bodyClass.add('ptr-reset');

        var bodyClassRemove = function bodyClassRemove() {
            bodyClass.remove('ptr-reset');
            document.body.removeEventListener('transitionend', bodyClassRemove, false);
        };

        document.body.addEventListener('transitionend', bodyClassRemove, false);
    };

    return {
        init: init
    };
}();
/**
	 Source: http://codepen.io/berkin/full/jyfHq/
    * pull to refresh
    * @type {*}
    */
var PullToRefresh = function () {
    function Main(container, slidebox, slidebox_icon, handler) {
        var self = this;

        this.breakpoint = 80;

        this.container = container;
        this.slidebox = slidebox;
        this.slidebox_icon = slidebox_icon;
        this.handler = handler;

        this._slidedown_height = 0;
        this._anim = null;
        this._dragged_down = false;

        this.hammertime = Hammer(this.container).on("touch dragdown release", function (ev) {
            self.handleHammer(ev);
        });
    }

    /**
     * Handle HammerJS callback
     * @param ev
     */
    Main.prototype.handleHammer = function (ev) {
        var self = this;

        switch (ev.type) {
            // reset element on start
            case 'touch':
                this.hide();
                break;

            // on release we check how far we dragged
            case 'release':
                if (!this._dragged_down) {
                    return;
                }

                // cancel animation
                cancelAnimationFrame(this._anim);

                // over the breakpoint, trigger the callback
                if (ev.gesture.deltaY >= this.breakpoint) {
                    container_el.className = 'pullrefresh-loading';
                    pullrefresh_icon_el.className = 'icon loading';

                    this.setHeight(60);
                    this.handler.call(this);
                }
                // just hide it
                else {
                        pullrefresh_el.className = 'slideup';
                        container_el.className = 'pullrefresh-slideup';

                        this.hide();
                    }
                break;

            // when we dragdown
            case 'dragdown':
                // if we are not at the top move down
                var scrollY = window.scrollY;
                if (scrollY > 5) {
                    return;
                } else if (scrollY !== 0) {
                    window.scrollTo(0, 0);
                }

                this._dragged_down = true;

                // no requestAnimationFrame instance is running, start one
                if (!this._anim) {
                    this.updateHeight();
                }

                // stop browser scrolling
                ev.gesture.preventDefault();

                // update slidedown height
                // it will be updated when requestAnimationFrame is called
                this._slidedown_height = ev.gesture.deltaY * 0.4;
                break;
        }
    };

    /**
     * when we set the height, we just change the container y
     * @param   {Number}    height
     */
    Main.prototype.setHeight = function (height) {
        if (Modernizr.csstransforms3d) {
            this.container.style.transform = 'translate3d(0,' + height + 'px,0) ';
            this.container.style.oTransform = 'translate3d(0,' + height + 'px,0)';
            this.container.style.msTransform = 'translate3d(0,' + height + 'px,0)';
            this.container.style.mozTransform = 'translate3d(0,' + height + 'px,0)';
            this.container.style.webkitTransform = 'translate3d(0,' + height + 'px,0) scale3d(1,1,1)';
        } else if (Modernizr.csstransforms) {
            this.container.style.transform = 'translate(0,' + height + 'px) ';
            this.container.style.oTransform = 'translate(0,' + height + 'px)';
            this.container.style.msTransform = 'translate(0,' + height + 'px)';
            this.container.style.mozTransform = 'translate(0,' + height + 'px)';
            this.container.style.webkitTransform = 'translate(0,' + height + 'px)';
        } else {
            this.container.style.top = height + "px";
        }
    };

    /**
     * hide the pullrefresh message and reset the vars
     */
    Main.prototype.hide = function () {
        container_el.className = '';
        this._slidedown_height = 0;
        this.setHeight(0);
        cancelAnimationFrame(this._anim);
        this._anim = null;
        this._dragged_down = false;
    };

    /**
     * hide the pullrefresh message and reset the vars
     */
    Main.prototype.slideUp = function () {
        var self = this;
        cancelAnimationFrame(this._anim);

        pullrefresh_el.className = 'slideup';
        container_el.className = 'pullrefresh-slideup';

        this.setHeight(0);

        setTimeout(function () {
            self.hide();
        }, 500);
    };

    /**
     * update the height of the slidedown message
     */
    Main.prototype.updateHeight = function () {
        var self = this;

        this.setHeight(this._slidedown_height);

        if (this._slidedown_height >= this.breakpoint) {
            this.slidebox.className = 'breakpoint';
            this.slidebox_icon.className = 'icon arrow arrow-up';
        } else {
            this.slidebox.className = '';
            this.slidebox_icon.className = 'icon arrow';
        }

        this._anim = requestAnimationFrame(function () {
            self.updateHeight();
        });
    };

    return Main;
}();

function getEl(id) {
    return document.getElementById(id);
}

var container_el = getEl('container');
var pullrefresh_el = getEl('pullrefresh');
var pullrefresh_icon_el = getEl('pullrefresh-icon');
var image_el = getEl('random-image');

var refresh = new PullToRefresh(container_el, pullrefresh_el, pullrefresh_icon_el);

// update image onrefresh
refresh.handler = function () {
    var self = this;
    // a small timeout to demo the loading state
    setTimeout(function () {
        var preload = new Image();
        preload.onload = function () {
            image_el.src = this.src;
            self.slideUp();
        };
        preload.src = 'http://lorempixel.com/800/600/?' + new Date().getTime();
    }, 1000);
};