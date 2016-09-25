'use strict';

let should = require('should')
let assert = require('assert')
let SMHelper = require('../SMHelper')

describe('SMHelper.js', () => {

    it('SMHelper should export an object with helper methods', () => {
        SMHelper.should.be.type('object')
        Object.keys(SMHelper).should.have.lengthOf(14)

        SMHelper.buildQuerystring.should.be.type('function')
        SMHelper.buildUrl.should.be.type('function')
        SMHelper.cloneObject.should.be.type('function')
        SMHelper.compactObject.should.be.type('function')
        SMHelper.getDescendantProperty.should.be.type('function')
        SMHelper.isNumeric.should.be.type('function')
        SMHelper.isScalar.should.be.type('function')
        SMHelper.objectToDotNotation.should.be.type('function')
        SMHelper.pregQuote.should.be.type('function')
        SMHelper.strIs.should.be.type('function')
        SMHelper.stringToCamel.should.be.type('function')
        SMHelper.stripTags.should.be.type('function')
        SMHelper.toStringSafe.should.be.type('function')
        SMHelper.updatePropertyInObject.should.be.type('function')
    })

    it('buildQuerystring should return correctly formed query string', () => {
        SMHelper.buildQuerystring({}).should.be.equal('')
        SMHelper.buildQuerystring({ foo: 'bar' }).should.be.equal('foo=bar')
        SMHelper.buildQuerystring({ foo: '' }).should.be.equal('foo')
        SMHelper.buildQuerystring({ foo: 'bar', test: 'aa' }).should.be.equal('foo=bar&test=aa')
        SMHelper.buildQuerystring({ foo: 'bar a onda' }).should.be.equal('foo=bar%20a%20onda')
        SMHelper.buildQuerystring({ 'foo bar': 'bar+a' }).should.be.equal('foo%20bar=bar%2Ba')
        SMHelper.buildQuerystring({ unicode: '\uF8FF' }).should.be.equal('unicode=%EF%A3%BF')
        SMHelper.buildQuerystring({ array: ['a', 'b'] }).should.be.equal('array=a%2Cb')
        SMHelper.buildQuerystring({ foo: 1 }).should.be.equal('foo=1')
        SMHelper.buildQuerystring({ foo: 0 }).should.be.equal('foo=0')
        SMHelper.buildQuerystring({ foo: 0, test: undefined }).should.be.equal('foo=0')
    })

    it('buildUrl should build correct urls', () => {
        SMHelper.buildUrl('', '').should.be.equal('')
        SMHelper.buildUrl('http://example.com/', '').should.be.equal('http://example.com/')
        SMHelper.buildUrl('http://example.com', '').should.be.equal('http://example.com/')
        SMHelper.buildUrl('http://example.com/').should.be.equal('http://example.com/')
        SMHelper.buildUrl('http://example.com/', 'hello').should.be.equal('http://example.com/hello')
        SMHelper.buildUrl('http://example.com/', 'hello/world').should.be.equal('http://example.com/hello/world')
        SMHelper.buildUrl('http://example.com/', ['hello', 'world']).should.be.equal('http://example.com/hello/world')
        SMHelper.buildUrl('http://example.com/', ['he llo', 'world']).should.be.equal('http://example.com/he%20llo/world')
    })

    it('cloneObject should clone an object', () => {
        let startingObject = { a: 1, b: { x: 2, y: [3, 4] }, c: 'hello world!' }
        let clone = SMHelper.cloneObject(startingObject)

        // Check if objects are equal (deep)
        assert.deepStrictEqual(startingObject, clone)

        // Ensure it's not just a reference
        startingObject.b.y[0] = 99
        assert.notDeepStrictEqual(startingObject, clone)
    })

    it('compactObject should remove empty properties from an object', () => {
        let obj

        obj = { a: 'b' }
        SMHelper.compactObject(obj)
        assert.deepStrictEqual(obj, { a: 'b' })

        obj = { a: 'b', b: 0 }
        SMHelper.compactObject(obj)
        assert.deepStrictEqual(obj, { a: 'b' })

        obj = { a: 'b', b: null }
        SMHelper.compactObject(obj)
        assert.deepStrictEqual(obj, { a: 'b' })

        obj = { a: false }
        SMHelper.compactObject(obj)
        assert.deepStrictEqual(obj, {})

        obj = { a: {} }
        SMHelper.compactObject(obj)
        assert.deepStrictEqual(obj, {})

        obj = { a: 'b' }
        SMHelper.compactObject(obj)
        assert.deepStrictEqual(obj, { a: 'b' })

        obj = { a: { b: 1 } }
        SMHelper.compactObject(obj)
        assert.deepStrictEqual(obj, { a: { b: 1 } })

        obj = { a: { b: 0 } }
        SMHelper.compactObject(obj)
        assert.deepStrictEqual(obj, {})

        // Test with onlyNull
        obj = { a: 'a', b: null, c: { d: 'd', e: null, f: false, g: { h: undefined } }, m: {} }
        SMHelper.compactObject(obj, true)
        assert.deepStrictEqual(obj, { a: 'a', c: { d: 'd', f: false, g: { h: undefined } } })
    })

    it('getDescendantProperty should return the correct nested property from an object', () => {
        let obj
        let t = SMHelper.getDescendantProperty

        obj = {a: 1, b: {x1: 10, x2: 20, x3: {y1: 15, y2: 'Hello'}}, c: {x1: Infinity, x2: null, x3: false}, d: [100, 200, 300]}
        assert.strictEqual(t(obj, 'a'), 1)
        t(obj, 'b').should.be.an.type('object')
        Object.keys(t(obj, 'b')).should.have.lengthOf(3)
        assert.strictEqual(t(obj, 'b.x1'), 10)
        assert.strictEqual(t(obj, 'b.x2'), 20)
        t(obj, 'b.x3').should.be.an.type('object')
        Object.keys(t(obj, 'b.x3')).should.have.lengthOf(2)
        assert.strictEqual(t(obj, 'b.x3.y2'), 'Hello')
        t(obj, 'c').should.be.an.type('object')
        Object.keys(t(obj, 'c')).should.have.lengthOf(3)
        assert.strictEqual(t(obj, 'c.x1'), Infinity)
        assert.strictEqual(t(obj, 'c.x2'), null)
        assert.strictEqual(t(obj, 'c.x3'), false)
        t(obj, 'd').should.be.an.array
        t(obj, 'd').should.have.lengthOf(3)
        assert.strictEqual(t(obj, 'd.0'), 100)
        assert.strictEqual(t(obj, 'd.2'), 300)

        assert.strictEqual(t(obj, 'z'), undefined)
        assert.strictEqual(t(obj, 'z.a2'), undefined)
    })

    it('isNumeric should identify objects that are numeric', () => {
        // Tests from: https://github.com/jquery/jquery/blob/6acf4a79467a5aea5bc1eb7d552d72366718635d/test/unit/core.js#L497
        
        let t = SMHelper.isNumeric
        let ToString = (value) => {
            return String(value)
        }

        assert.ok(t("-10"), "Negative integer string")
        assert.ok(t("0"), "Zero string")
        assert.ok(t("5"), "Positive integer string")
        assert.ok(t(-16), "Negative integer number")
        assert.ok(t(0), "Zero integer number")
        assert.ok(t(32), "Positive integer number")
        assert.ok(t("-1.6"), "Negative floating point string")
        assert.ok(t("4.536"), "Positive floating point string")
        assert.ok(t(-2.6), "Negative floating point number")
        assert.ok(t(3.1415), "Positive floating point number")
        assert.ok(t(1.5999999999999999), "Very precise floating point number")
        assert.ok(t(8e5), "Exponential notation")
        assert.ok(t("123e-2"), "Exponential notation string")
        assert.ok(t("040"), "Legacy octal integer literal string")
        assert.ok(t("0xFF"), "Hexadecimal integer literal string (0x...)")
        assert.ok(t("0Xba"), "Hexadecimal integer literal string (0X...)")
        assert.ok(t(0xFFF), "Hexadecimal integer literal")

        if (+"0b1" === 1) {
            assert.ok(t("0b111110"), "Binary integer literal string (0b...)")
            assert.ok(t("0B111110"), "Binary integer literal string (0B...)")
        } else {
            assert.ok(true, "Browser does not support binary integer literal (0b...)")
            assert.ok(true, "Browser does not support binary integer literal (0B...)")
        }

        if (+"0o1" === 1) {
            assert.ok(t("0o76"), "Octal integer literal string (0o...)")
            assert.ok(t("0O76"), "Octal integer literal string (0O...)")
        } else {
            assert.ok(true, "Browser does not support octal integer literal (0o...)")
            assert.ok(true, "Browser does not support octal integer literal (0O...)")
        }

        assert.equal(t(new String("42")), false, "Only limited to strings and numbers")
        assert.equal(t(""), false, "Empty string")
        assert.equal(t("        "), false, "Whitespace characters string")
        assert.equal(t("\t\t"), false, "Tab characters string")
        assert.equal(t("abcdefghijklm1234567890"), false, "Alphanumeric character string")
        assert.equal(t("xabcdefx"), false, "Non-numeric character string")
        assert.equal(t(true), false, "Boolean true literal")
        assert.equal(t(false), false, "Boolean false literal")
        assert.equal(t("bcfed5.2"), false, "Number with preceding non-numeric characters")
        assert.equal(t("7.2acdgs"), false, "Number with trailing non-numeric characters")
        assert.equal(t(undefined), false, "Undefined value")
        assert.equal(t(null), false, "Null value")
        assert.equal(t(NaN), false, "NaN value")
        assert.equal(t(Infinity), false, "Infinity primitive")
        assert.equal(t(Number.POSITIVE_INFINITY), false, "Positive Infinity")
        assert.equal(t(Number.NEGATIVE_INFINITY), false, "Negative Infinity")
        assert.equal(t(new String("Devo")), false, "Custom String returning non-number")
        assert.equal(t({}), false, "Empty object")
        assert.equal(t([]), false, "Empty array")
        assert.equal(t([42]), false, "Array with one number")
        assert.equal(t(function () { }), false, "Instance of a function")
        assert.equal(t(new Date()), false, "Instance of a Date")
    })

    it('isScalar should identify scalar types', () => {
        let t = SMHelper.isScalar

        assert.equal(t(1), true, "Non-zero number")
        assert.equal(t(0), true, "Zero number")
        assert.equal(t("hello world"), true, "Non-empty string")
        assert.equal(t(""), true, "Empty string")
        assert.equal(t(0.4), true, "Float number")
        assert.equal(t(true), true, "Boolean true")
        assert.equal(t(false), true, "Boolean false")
        assert.equal(t(Infinity), true, "Infinity primitive")
        assert.equal(t(Number.POSITIVE_INFINITY), true, "Positive Infinity")
        assert.equal(t(Number.NEGATIVE_INFINITY), true, "Negative Infinity")

        assert.equal(t({}), false, "Empty object")
        assert.equal(t({a: 1}), false, "Object with one element")
        assert.equal(t([]), false, "Empty array")
        assert.equal(t([42]), false, "Array with one number")
        assert.equal(t(function () { }), false, "Instance of a function")
        assert.equal(t(new Date()), false, "Instance of a Date")
        assert.equal(t(new Number(10)), false, "Number object")
        assert.equal(t(new String("Devo")), false, "String object")
        assert.equal(t(undefined), false, "Undefined")
        assert.equal(t(null), false, "Null")
    })

    it('objectToDotNotation should convert deep object to dot notation', () => {
        let obj, result

        obj = { status: "success", auth: { code: 23123213, name: "John Black" } }
        result = SMHelper.objectToDotNotation(obj)
        assert.deepStrictEqual(result,
            { status: "success", "auth.code": 23123213, "auth.name": "John Black" }
        )

        // Test arrays
        obj = { status: "success", auth: { code: 23123213, name: "John Black", keys: [10, 11] } }
        result = SMHelper.objectToDotNotation(obj)
        assert.deepStrictEqual(result,
            { status: "success", "auth.code": 23123213, "auth.name": "John Black", "auth.keys.0": 10, "auth.keys.1": 11 }
        )

        // Same test, preserve array
        result = SMHelper.objectToDotNotation(obj, true)
        assert.deepStrictEqual(result,
            { status: "success", "auth.code": 23123213, "auth.name": "John Black", "auth.keys": [10, 11] }
        )
    })

    it('pregQuote should return correctly quoted regexp string', () => {
        SMHelper.pregQuote('$40').should.be.equal('\\$40')
        SMHelper.pregQuote('*RRRING* Hello?').should.be.equal('\\*RRRING\\* Hello\\?')
        SMHelper.pregQuote('\\.+*?[^]$(){}=!<>|:').should.be.equal('\\\\\\.\\+\\*\\?\\[\\^\\]\\$\\(\\)\\{\\}\\=\\!\\<\\>\\|\\:')
    })

    it('strIs should correctly match patterns', () => {
        SMHelper.strIs('*.dev', 'localhost.dev').should.be.true
        SMHelper.strIs('a', 'a').should.be.true
        SMHelper.strIs('/', '/').should.be.true
        SMHelper.strIs('*dev*', 'localhost.dev.aa').should.be.true
        SMHelper.strIs('foo?bar', 'foo?bar').should.be.true
        SMHelper.strIs('*', 'anything').should.be.true
        SMHelper.strIs('*', '').should.be.true
        SMHelper.strIs('foo/*', 'foo/bar/baz').should.be.true
        SMHelper.strIs('*/foo', 'blah/baz/foo').should.be.true

        SMHelper.strIs('/', ' /').should.be.false
        SMHelper.strIs('/', '/a').should.be.false
        SMHelper.strIs('*something', 'foobar').should.be.false
        SMHelper.strIs('foo', 'bar').should.be.false
        SMHelper.strIs('foo.*', 'foobar').should.be.false
        SMHelper.strIs('foo.ar', 'foobar').should.be.false
        SMHelper.strIs('foo?bar', 'foobar').should.be.false
        SMHelper.strIs('foo?bar', 'fobar').should.be.false
    })

    it('stringToCamel should convert dashed strings to camelCase', () => {
        SMHelper.stringToCamel('').should.be.equal('')
        SMHelper.stringToCamel('aa').should.be.equal('aa')
        SMHelper.stringToCamel('hello-world').should.be.equal('helloWorld')
        SMHelper.stringToCamel('helloWorld').should.be.equal('helloWorld')
        SMHelper.stringToCamel('hello world').should.be.equal('hello world')
    })

    it('stripTags should return a string with HTML tags stripped', () => {
        SMHelper.stripTags('<b>tag</b>').should.be.equal('tag')

        SMHelper.stripTags('<p>Kevin</p> <br /><b>van</b> <i>Zonneveld</i>', '<i><b>').should.be.equal('Kevin <b>van</b> <i>Zonneveld</i>')
        SMHelper.stripTags('<p>Kevin <img src="someimage.png" onmouseover="some()">van <i>Zonneveld</i></p>', '<p>').should.be.equal('<p>Kevin van Zonneveld</p>')
        SMHelper.stripTags("<a href='http://kevin.vanzonneveld.net'>Kevin van Zonneveld</a>", "<a>").should.be.equal("<a href='http://kevin.vanzonneveld.net'>Kevin van Zonneveld</a>")
        SMHelper.stripTags('1 < 5 5 > 1').should.be.equal('1 < 5 5 > 1')
        SMHelper.stripTags('1 <br/> 1').should.be.equal('1  1')
        SMHelper.stripTags('1 <br/> 1', '<br>').should.be.equal('1 <br/> 1')
        SMHelper.stripTags('1 <br/> 1', '<br><br/>').should.be.equal('1 <br/> 1')
    })

    it('toStringSafe should convert values to string', () => {
        SMHelper.toStringSafe('hello world').should.be.equal('hello world')
        SMHelper.toStringSafe(100).should.be.equal('100')
        SMHelper.toStringSafe(null).should.be.equal('')
        SMHelper.toStringSafe(0).should.be.equal('0')
        SMHelper.toStringSafe(false).should.be.equal('false')
        SMHelper.toStringSafe(true).should.be.equal('true')
        SMHelper.toStringSafe(undefined).should.be.equal('')
        SMHelper.toStringSafe(Infinity).should.be.equal('Infinity')
        SMHelper.toStringSafe(-Infinity).should.be.equal('-Infinity')
        SMHelper.toStringSafe(new Date('2016-02-29T11:55:00-05:00')).should.be.equal('Mon Feb 29 2016 11:55:00 GMT-0500 (EST)')
    })

    it('updatePropertyInObject should update the specified property in the object', () => {
        let obj

        obj = { hello: 'aa', test: { a: 'b', c: 0, d: { obj: 1 } } }
        SMHelper.updatePropertyInObject(obj, 'test.d.obj', 3)
        assert.deepStrictEqual(
            obj,
            { hello: 'aa', test: { a: 'b', c: 0, d: { obj: 3 } } }
        )

        obj = { hello: 'aa', test: { a: 'b', c: 0, d: { obj: 1 } } }
        SMHelper.updatePropertyInObject(obj, 'hello', 'world')
        assert.deepStrictEqual(
            obj,
            { hello: 'world', test: { a: 'b', c: 0, d: { obj: 1 } } }
        )

        // Add new property
        obj = { hello: 'aa', test: { a: 'b', c: 0, d: { obj: 1 } } }
        SMHelper.updatePropertyInObject(obj, 'test2.aa.bb', 'world')
        assert.deepStrictEqual(
            obj,
            { hello: 'aa', test: { a: 'b', c: 0, d: { obj: 1 } }, test2: { aa: { bb: 'world' } } }
        )
    })

})
