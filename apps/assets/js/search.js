(function (global) {
    'use strict';

    // ---- helpers ----
    function parseDate(v) {
        if (v instanceof Date) return isNaN(v) ? null : v;
        if (typeof v !== 'string') return null;
        const s = v.trim();
        // Try native parse first
        const d = new Date(s);
        if (!isNaN(d)) return d;
        // YYYY-MM
        let m = s.match(/^(\d{4})-(\d{2})$/);
        if (m) return new Date(+m[1], +m[2] - 1, 1);
        // YYYY
        m = s.match(/^(\d{4})$/);
        if (m) return new Date(+m[1], 0, 1);
        return null;
    }

    function tokenise(q) {
        const s = q || '';
        const out = [];
        let i = 0;
        while (i < s.length) {
            const ch = s[i];
            if (/\s/.test(ch)) { i++; continue; }
            if (ch === '"' || ch === "'") {
                const quote = ch; i++;
                let buf = '';
                while (i < s.length && s[i] !== quote) {
                    if (s[i] === '\\' && i + 1 < s.length) { buf += s[i + 1]; i += 2; continue; }
                    buf += s[i++];
                }
                if (i < s.length && s[i] === quote) i++;
                out.push({ type: 'TERM', value: buf });
                continue;
            }
            if (ch === '&') { out.push({ type: 'AND' }); i++; continue; }
            if (ch === '|') { out.push({ type: 'OR' }); i++; continue; }
            if (ch === '-') { out.push({ type: 'NOT' }); i++; continue; }
            let start = i;
            while (i < s.length && !/\s/.test(s[i]) && !['&', '|', '-', '"', "'"].includes(s[i])) i++;
            out.push({ type: 'TERM', value: s.slice(start, i) });
        }
        return out;
    }

    function create({ fields = {}, defaultFields = [], caseSensitive = false } = {}) {

        function buildTermPredicate(raw) {
            let fieldName = null, expr = raw;
            const idx = raw.indexOf(':');
            if (idx > 0) { fieldName = raw.slice(0, idx).trim(); expr = raw.slice(idx + 1).trim(); }

            const ops = ['>=', '<=', '!=', '>', '<', '='];
            let op = null;
            for (const o of ops) {
                if (expr.startsWith(o)) { op = o; expr = expr.slice(o.length).trim(); break; }
            }

            let range = null;
            if (!op && expr.includes('..')) {
                const [a, b] = expr.split('..').map(s => s.trim());
                range = [a, b];
            }

            const targets = fieldName
                ? (fields[fieldName] ? [{ name: fieldName, ...fields[fieldName] }] : [])
                : defaultFields.map(n => ({ name: n, ...(fields[n] || { type: 'string', resolver: r => r[n] }) }));

            if (!targets.length) return () => false;

            function cmpString(recStr) {
                const hay = caseSensitive ? String(recStr ?? '') : String(recStr ?? '').toLowerCase();
                const needle = caseSensitive ? expr : expr.toLowerCase();
                return hay.includes(needle);
            }

            function cmpNumber(recVal) {
                const num = Number(recVal);
                if (Number.isNaN(num)) return false;
                if (range) {
                    const a = parseFloat(range[0]), b = parseFloat(range[1]);
                    if (Number.isNaN(a) || Number.isNaN(b)) return false;
                    return num >= a && num <= b;
                }
                if (op) {
                    const v = parseFloat(expr);
                    if (Number.isNaN(v)) return false;
                    switch (op) {
                        case '>': return num > v;
                        case '<': return num < v;
                        case '>=': return num >= v;
                        case '<=': return num <= v;
                        case '=': return num === v;
                        case '!=': return num !== v;
                    }
                }
                return cmpString(String(recVal));
            }

            function cmpDate(recVal) {
                const d = recVal instanceof Date ? recVal : parseDate(recVal);
                if (!d) return false;
                if (range) {
                    const a = parseDate(range[0]), b = parseDate(range[1]);
                    if (!a || !b) return false;
                    const t = d.getTime();
                    return t >= a.getTime() && t <= b.getTime();
                }
                if (op) {
                    const v = parseDate(expr);
                    if (!v) return false;
                    const t = d.getTime(), u = v.getTime();
                    switch (op) {
                        case '>': return t > u;
                        case '<': return t < u;
                        case '>=': return t >= u;
                        case '<=': return t <= u;
                        case '=': return t === u;
                        case '!=': return t !== u;
                    }
                }
                const iso = (d.toISOString ? d.toISOString().slice(0, 10) : String(recVal));
                return cmpString(iso);
            }

            function matchesTarget(t, rec) {
                const type = t.type || 'string';
                const val = t.resolver ? t.resolver(rec) : rec[t.name];
                if (type === 'number') return cmpNumber(val);
                if (type === 'date') return cmpDate(val);
                return cmpString(val);
            }

            return rec => {
                for (const t of targets) {
                    if (matchesTarget(t, rec)) return true;
                }
                return false;
            };
        }

        function compile(q) {
            const text = (q || '').trim();
            if (!text) return () => true;

            const toks = tokenise(text);
            const items = [];
            let negateNext = false;

            for (const t of toks) {
                if (t.type === 'NOT') { negateNext = !negateNext; continue; }
                if (t.type === 'AND' || t.type === 'OR') { items.push({ op: t.type }); continue; }
                if (t.type === 'TERM') {
                    items.push({ term: buildTermPredicate(t.value), negate: negateNext });
                    negateNext = false;
                }
            }

            // split by OR, AND has higher precedence (implicit AND by adjacency)
            const groups = [];
            let buf = [];
            for (const it of items) {
                if (it.op === 'OR') { groups.push(buf); buf = []; }
                else if (it.op === 'AND') { /* separator only */ }
                else { buf.push(it); }
            }
            if (buf.length) groups.push(buf);

            function evalAND(rec, arr) {
                for (const it of arr) {
                    if (!it.term) continue;
                    const ok = it.term(rec);
                    if (it.negate ? ok : !ok) return false; // xor style
                }
                return true;
            }
            return rec => groups.some(g => evalAND(rec, g));
        }

        return {
            filter(records, raw) {
                const pred = compile(raw);
                return (records || []).filter(pred);
            },
            operatorsHelp() {
                return [
                    'Operators: AND=& or space, OR=|, NOT=-',
                    'Fields: name:, type:, amount:, date:, dateKey:',
                    'Comparators: >, >=, <, <=, =, !=',
                    'Ranges: amount:10..50   date:2025-01..2025-03',
                    'Quotes: name:"big store"'
                ].join('\n');
            }
        };
    }

    global.SearchEngine = { create };
})(window);
