/**
 * nanomarkdown - a minimal markdown to html converter
 * Copyright (c) 2015, Vladimir Antonov. (MIT Licensed)
 * https://github.com/Holixus/nanomarkdown
 */

(function (root, factory) {
	/* istanbul ignore if */
	if (typeof define === 'function' && /* istanbul ignore next */ define.amd) {
		// AMD
		define([ ], factory);
	} else 
		/* istanbul ignore else */
		if (typeof exports === 'object') {
			// Node, CommonJS-like
			module.exports = factory();
		} else {
			// Browser globals (root is window)
			root.returnExports = factory();
		}
}(this, function () {
"use strict";

function lex(a) {
	return a.replace(/(\*\*|__|~~)(\S(?:[\s\S]*?\S)?)\1/g, function (m, delim, text) {
		return (delim === '~~') ? '<del>'+text+'</del>' : '<b>'+text+'</b>';
	}).replace(/(\n|^|\W)([_\*])(\S(?:[\s\S]*?\S)?)\2(\W|$|\n)/g, function (m, l, di, ital, r) {
		return l+'<i>'+ital+'</i>'+r;
	}).replace(/(!?)\[([^\]<>]+)\]\((\+?)([^ \)<>]+)(?: "([^\(\)\"]+)")?\)/g, function (match, is_img, text, new_tab, ref, title) {
		var attrs = title ? ' title="' + title + '"' : '';
		if (is_img)
			return '<img src="' + nmd.href(ref) + '" alt="' + text + '"' + attrs + '/>';
		if (new_tab)
			attrs += ' target="_blank"';
		return '<a href="' + nmd.href(ref) + '"' + attrs + '>' + text + '</a>';
	});
}

var nmd = function (md) {
	return md.replace(/.+(?:\n.+)*/g, function (m) {
		var code = /^\s{4}([^]*)$/.exec(m);
		if (code)
			return '<pre><code>' + code[1].replace(/\n    /g, '\n') + '</code></pre>';
		var ps = [],
		    rows = lex(m).split('\n');
		for (var cur, i = 0, l = rows.length; i < l; ++i) {
			var row = rows[i],
			    head = /^\s{0,3}(\#{1,6})\s+(.*?)\s*#*\s*$/.exec(row);
			if (head) { // heading
				ps.push(cur = [ head[2], 'h', head[1].length ]); // cur = [ text, type, level ]
				continue;
			}
			var list = /^(\s*)(?:[-*]|(\d[.)])) (.+)$/.exec(row);
			if (list) {
				ps.push(cur = [ list[3], list[2] ? 'ol' : 'ul', list[1].length ]); // cur = [ text, type, level ]
				continue;
			}
			var hr = /^\s{0,3}([-])(\s*\1){2,}\s*$/.exec(row);
			if (hr)
				ps.push(cur = [ '', 'hr' ]);
			else
				if (cur && cur[1] !== 'hr' && cur[1] !== 'h')
					cur[0] += '\n' + row;
				else
					ps.push(cur = [ row, 'p', '' ]);
		}
		var out = '', lists = [];
		for (var i = 0, l = ps.length; i < l; ++i) {
			var cur = ps[i], text = cur[0], tag = cur[1], lvl = cur[2];
			if (tag === 'ul' || tag === 'ol') {
				if (!lists.length || lvl > lists[0][1]) {
					lists.unshift([ tag, lvl ]);
					out += '<'+lists[0][0]+'><li>'+text;
				} else
					if (lists.length > 1 && lvl <= lists[1][1]) {
						out += '</li></'+lists.shift()[0]+'>';
						--i;
					} else
						out += '</li><li>'+text;
			} else {
				while (lists.length)
					out += '</li></'+lists.shift()[0]+'>';
				out += (tag === 'hr') ? '<hr/>' : '<'+tag+lvl+nmd.headAttrs(lvl, text)+'>'+text+'</'+tag+lvl+'>';
			}
		}
		while (lists.length)
			out += '</li></'+lists.shift()[0]+'>';
		return out;
	});
};

nmd.href = function (ref) {
	return ref;
};

nmd.headAttrs = function (level, text) {
	return ''; // return ' id=\''+text.replace(/[^a-z0-9]/g, '_').replace(/_{2,}/g, '_').replace(/^_*(.*?)_*$/, '$1').toLowerCase()+'\'';
};

return nmd;
}));
