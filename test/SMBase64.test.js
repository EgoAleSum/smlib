'use strict';

const should = require('should')
const assert = require('assert')
const SMBase64 = require('../SMBase64')

describe('SMBase64.js', () => {

    it('SMBase64 should export a class', () => {
        SMBase64.should.be.type('function')
        SMBase64.prototype.should.be.type('object')

        let b64 = new SMBase64()
        assert.ok(b64)

        b64.fromNumber.should.be.type('function')
        b64.toNumber.should.be.type('function')
    })

    it('SMBase64 should allow getting and setting list of characters', () => {
        let b64 = new SMBase64()
        assert.ok(b64)

        // Get the list of characters
        let chars = b64.chars
        assert(typeof chars == 'string')
        assert(chars.length == 64)

        // Update the list
        let update = 'ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ①②③④⑤⑥⑦⑧⑨⑩⑪⑫'
        b64.chars = update
        assert.strictEqual(update, b64.chars)

        // Since the property is set to an instance of the object, another object should have the original list
        let t = new SMBase64()
        assert.strictEqual(t.chars, chars)

        // Setting to an invalid value should throw an exception
        let fails = [
            'ABCD', // Not 64 chars
            '', // Empty string
            false, // Not a string
            null,
            1234567890
        ]
        for (let i = 0; i < fails.length; i++) {
            assert.throws(() => {
                b64.chars = fails[i]
            }, Error)
        }
    })

    it('fromNumber should convert the number to base 64', () => {
        let tests = [
            [1, 'B'],
            [0, 'A'],
            [10, 'K'],
            ['10', 'K'], // Will be converted to number
            [61, '9'],
            [62, '-'],
            [63, '_'],
            [120, 'B4'],
            [123890, 'ePy'],
            [1238900, 'Eud0'],

            // Decimal parts should be stripped
            [1.1, 'B'],
            [0.8334, 'A'],
            ['0.8334', 'A'],
            [123890.99991, 'ePy']
        ]

        // Negative integers and values that are not finite numbers should throw an exception
        let fails = [
            -1,
            Infinity,
            -20,
            'hello world'
        ]

        let b64 = new SMBase64()
        assert.ok(b64)

        // Test conversion
        for (let i = 0; i < tests.length; i++) {
            let t = b64.fromNumber(tests[i][0])
            assert.strictEqual(t, tests[i][1])
        }

        // Test failures
        for (let i = 0; i < fails.length; i++) {
            assert.throws(() => {
                b64.fromNumber(fails[i])
            }, Error)
        }
    })

    it('toNumber should convert the base64-encoded string to a number', () => {
        let tests = [
            ['B', 1],
            ['A', 0],
            ['K', 10],
            ['9', 61],
            ['-', 62],
            ['_', 63],
            ['B4', 120],
            ['ePy', 123890],
            ['Eud0', 1238900],

            // Invalid characters should be ignored
            ['=Eud0', 1238900],
            ['/. =Eud0', 1238900]
        ]

        // Non strings should throw an exception
        let fails = [
            10,
            0,
            false,
            true,
            null,
            undefined,
            -10.5,
            Infinity,
            ['hello'],
            { a: 'bb' }
        ]

        let b64 = new SMBase64()
        assert.ok(b64)

        for (let i = 0; i < tests.length; i++) {
            let t = b64.toNumber(tests[i][0])
            assert.strictEqual(t, tests[i][1])
        }

        // Test failures
        for (let i = 0; i < fails.length; i++) {
            assert.throws(() => {
                b64.toNumber(fails[i])
            }, Error)
        }
    })
})
