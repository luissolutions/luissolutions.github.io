/**
 * Create a reusable query engine.
 *
 * @param {Object} cfg
 * @param {Object} cfg.fields - Map of field name -> { type, resolver(record) -> value|value[] }
 *   type ∈ 'string' | 'number' | 'date'
 *   resolver returns a single value or an array of values from the record
 * @param {string[]} [cfg.defaultFields] - Fields used when a token has no "field:" prefix
 * @param {boolean}  [cfg.caseSensitive=false]
 * @param {(s:string)=>Date|null} [cfg.dateParser] - Optional custom date parser
 * @param {boolean}  [cfg.strictFields=false] - If true, unknown fields cause a token to be ignored
 */
export function createQueryEngine(cfg) {
    const caseSensitive = !!cfg.caseSensitive;
    const defaultFields = Array.isArray(cfg.defaultFields) && cfg.defaultFields.length
        ? cfg.defaultFields : Object.keys(cfg.fields || {});
    const fields = cfg.fields || {};
    const strictFields = !!cfg.strictFields;

    const parseDate = cfg.dateParser || ((s) => {
        // ISO-ish: YYYY, YYYY-MM, YYYY-MM-DD, or Date-parsable string
        if (!s) return null;
        // allow YYYY-MM (treat as 1st of month)
        const m = String(s).trim();
        if (/^\d{4}$/.test(m)) return new Date(Number(m), 0, 1);
        if (/^\d{4}-\d{2}$/.test(m)) {
            const [yy, mm] = m.split('-').map(Number);
            return new Date(yy, mm - 1, 1);
        }
        const d = new Date(m);
        return isNaN(d.getTime()) ? null : d;
    });

    const strNorm = (v) => {
        const s = String(v ?? '');
        return caseSensitive ? s : s.toLowerCase();
    };

    const valArray = (v) => Array.isArray(v) ? v : (v == null ? [] : [v]);

    function getFieldValues(record, fieldName) {
        const spec = fields[fieldName];
        if (!spec || typeof spec.resolver !== 'function') return [];
        const vals = valArray(spec.resolver(record));
        if (spec.type === 'string') return vals.map(strNorm);
        if (spec.type === 'number') return vals.map(Number).filter(n => !Number.isNaN(n));
        if (spec.type === 'date') return vals.map(parseDate).filter(Boolean);
        return vals;
    }

    // --- Parsing ---

    function splitTopLevel(str, sepChar) {
        const out = [];
        let buf = '';
        let inQuote = false;
        for (let i = 0; i < str.length; i++) {
            const ch = str[i];
            if (ch === '"') { inQuote = !inQuote; buf += ch; continue; }
            if (!inQuote && ch === sepChar) { out.push(buf.trim()); buf = ''; continue; }
            buf += ch;
        }
        if (buf.trim()) out.push(buf.trim());
        return out;
    }

    function tokenizeAND(str) {
        // split on & OR whitespace, but respect quotes
        const parts = [];
        let buf = '';
        let inQuote = false;
        const push = () => { if (buf.trim()) parts.push(buf.trim()); buf = ''; };
        for (let i = 0; i < str.length; i++) {
            const ch = str[i];
            if (ch === '"') { inQuote = !inQuote; buf += ch; continue; }
            const isAnd = (!inQuote && (ch === '&'));
            const isWS = (!inQuote && /\s/.test(ch));
            if (isAnd || isWS) { push(); continue; }
            buf += ch;
        }
        push();
        return parts;
    }

    function unquote(s) {
        const t = s.trim();
        if (t.startsWith('"') && t.endsWith('"') && t.length >= 2) {
            return t.slice(1, -1);
        }
        return t;
    }

    // Token -> {negate, field?, kind, value, value2, op}
    function parseToken(raw) {
        let token = raw.trim();
        let negate = false;
        if (token.startsWith('-')) { negate = true; token = token.slice(1).trim(); }
        const hasField = token.includes(':');
        let field = null;
        let expr = token;

        if (hasField) {
            const idx = token.indexOf(':');
            field = token.slice(0, idx).trim();
            expr = token.slice(idx + 1).trim();
        }

        expr = unquote(expr);

        // Numeric: range "a-b" or "a..b"
        const mNumRange = expr.match(/^\s*(-?\d+(?:\.\d+)?)\s*(?:\.{2}|-)\s*(-?\d+(?:\.\d+)?)\s*$/);
        const mNumCmp = expr.match(/^(<=|>=|<|>|=)?\s*(-?\d+(?:\.\d+)?)$/);

        // Date: YYYY, YYYY-MM, YYYY-MM-DD, range with '..'
        const mDateRange = expr.match(/^\s*([0-9]{4}(?:-[0-9]{2}(?:-[0-9]{2})?)?)\s*\.\.\s*([0-9]{4}(?:-[0-9]{2}(?:-[0-9]{2})?)?)\s*$/);
        const mDateCmp = expr.match(/^(<=|>=|<|>|=)?\s*([0-9]{4}(?:-[0-9]{2}(?:-[0-9]{2})?)?)$/);

        const tokenObj = { negate, field, kind: 'string', value: expr };

        // If field hints type, coerce to that; else try to infer by pattern
        const fieldType = fields[field]?.type;

        if (fieldType === 'number' || mNumRange || mNumCmp) {
            if (mNumRange) {
                return {
                    negate, field, kind: 'number', op: 'range',
                    value: Number(mNumRange[1]), value2: Number(mNumRange[2])
                };
            }
            if (mNumCmp) {
                return { negate, field, kind: 'number', op: mNumCmp[1] || '=', value: Number(mNumCmp[2]) };
            }
        }

        if (fieldType === 'date' || mDateRange || mDateCmp) {
            if (mDateRange) {
                return {
                    negate, field, kind: 'date', op: 'range',
                    value: parseDate(mDateRange[1]), value2: parseDate(mDateRange[2])
                };
            }
            if (mDateCmp) {
                return { negate, field, kind: 'date', op: mDateCmp[1] || '=', value: parseDate(mDateCmp[2]) };
            }
        }

        // Default: string contains
        return {
            negate, field, kind: 'string', op: 'contains',
            value: caseSensitive ? expr : expr.toLowerCase()
        };
    }

    function parseQuery(raw) {
        if (!raw || !raw.trim()) return [];
        const orGroups = splitTopLevel(raw, '|')
            .map(g => tokenizeAND(g).map(parseToken))
            .filter(g => g.length > 0);
        return orGroups; // OR-array of AND-arrays of token objects
    }

    // --- Matching ---

    function matchNumber(val, t) {
        if (typeof val !== 'number' || Number.isNaN(val)) return false;
        if (t.op === 'range') {
            const lo = Math.min(t.value, t.value2);
            const hi = Math.max(t.value, t.value2);
            return val >= lo && val <= hi;
        }
        if (t.op === '<') return val < t.value;
        if (t.op === '>') return val > t.value;
        if (t.op === '<=') return val <= t.value;
        if (t.op === '>=') return val >= t.value;
        return val === t.value; // '='
    }

    function matchDate(val, t) {
        if (!(val instanceof Date)) return false;
        const v = val.getTime();
        if (Number.isNaN(v)) return false;

        if (t.op === 'range') {
            const a = t.value ? t.value.getTime() : NaN;
            const b = t.value2 ? t.value2.getTime() : NaN;
            if (Number.isNaN(a) || Number.isNaN(b)) return false;
            const lo = Math.min(a, b), hi = Math.max(a, b);
            return v >= lo && v <= hi;
        }
        const tv = t.value ? t.value.getTime() : NaN;
        if (Number.isNaN(tv)) return false;
        if (t.op === '<') return v < tv;
        if (t.op === '>') return v > tv;
        if (t.op === '<=') return v <= tv;
        if (t.op === '>=') return v >= tv;
        // '=' : same day (not millisecond exact) -> compare YYYY-MM-DD
        const ymd = (d) => [d.getFullYear(), d.getMonth(), d.getDate()].join('-');
        return ymd(val) === ymd(t.value);
    }

    function matchString(val, t) {
        if (val == null) return false;
        const needle = t.value;
        const hay = caseSensitive ? String(val) : String(val).toLowerCase();
        return hay.includes(needle);
    }

    function tokenMatchesRecord(t, record) {
        // Which fields to test?
        let fieldsToCheck;
        if (t.field) {
            if (!fields[t.field]) return strictFields ? false : defaultFields.length ? defaultFields : Object.keys(fields);
            fieldsToCheck = [t.field];
        } else {
            fieldsToCheck = defaultFields;
        }

        // ANY value in ANY selected field satisfies the token
        let ok = false;
        for (const f of fieldsToCheck) {
            const spec = fields[f];
            if (!spec) continue;
            const values = getFieldValues(record, f);

            if (t.kind === 'number') {
                if (spec.type !== 'number') continue;
                if (values.some(v => matchNumber(v, t))) { ok = true; break; }
            } else if (t.kind === 'date') {
                if (spec.type !== 'date') continue;
                if (values.some(v => matchDate(v, t))) { ok = true; break; }
            } else {
                // string
                const pool = spec.type === 'string' ? values : values.map(String);
                if (pool.some(v => matchString(v, t))) { ok = true; break; }
            }
        }

        return t.negate ? !ok : ok;
    }

    function makePredicate(rawQuery) {
        const ast = parseQuery(rawQuery || '');
        if (ast.length === 0) return () => true;

        // OR-of-ANDs
        return (record) => {
            for (const andGroup of ast) {
                let all = true;
                for (const tok of andGroup) {
                    if (!tokenMatchesRecord(tok, record)) { all = false; break; }
                }
                if (all) return true;
            }
            return false;
        };
    }

    function filter(records, rawQueryOrPredicate) {
        const pred = typeof rawQueryOrPredicate === 'function'
            ? rawQueryOrPredicate
            : makePredicate(rawQueryOrPredicate);
        return records.filter(pred);
    }

    function operatorsHelp() {
        return [
            'AND: space or &   (rent & January)',
            'OR:  |           (coffee | tea)',
            'NOT: -term       (rent -late)',
            'Field: name:…, type:…, amount:…, date:…',
            'Numbers: amount:>100, amount:50-200',
            'Dates:   date:2025-01, date:>=2025-03-15, date:2025-01..2025-03',
            'Phrase:  "exact phrase"',
        ].join('\n');
    }

    return { makePredicate, filter, operatorsHelp };
}
