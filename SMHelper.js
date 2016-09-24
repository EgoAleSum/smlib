'use strict';

const LDString = require('./SMString')
const SMTransliterator = require('./SMTransliterator')
const moment = require('moment-timezone')
const crypto = require('crypto')

const SMHelper = {
    /**
     * From a dictionary, builds the querystring part of a URL.
     * Resulting string can be appended to URLs after the `?` character.
     * 
     * Source: http://stackoverflow.com/a/1714899/192024
     * 
     * @param {object} obj - Dictionary with keys and values
     * @returns {string} The querystring that can be appended to URLs
     */
    buildQuerystring: (obj) => {
        let str = []
        for (let p in obj) {
            if (obj.hasOwnProperty(p)) {
                // Skip undefined
                if (typeof obj[p] === 'undefined') {
                    continue
                }

                // Special case: handle the integer 0
                if (obj[p] === 0) {
                    obj[p] = '0'
                }

                str.push(encodeURIComponent(p) + ((obj[p]) ? ('=' + encodeURIComponent(obj[p])) : ''))
            }
        }
        return str.join('&')
    },

    /**
     * Builds a full HTTP/S URL from the various fragments.
     * 
     * @param {string} base - Base of the URL, including the protocol (e.g. `http://foo.bar/`)
     * @param {string|array} parts - Path, either as string or array (e.g. 'api/create' or ['api', 'create'])
     * @param {object} [args] - Dictionary with GET parameters
     * @returns {string} The full URL
     */
    buildUrl: (base, parts, args) => {
        base = base || ''
        parts = parts || []

        if (typeof parts === 'string') {
            parts = parts.split('/')
        }

        let append = parts.map(encodeURIComponent).join('/')

        if (args) {
            append += '?' + SMHelper.buildQuerystring(args)
        }

        if (base.length > 1 && base.slice(-1) != '/') {
            base += '/'
        }

        return base + append
    },

    /**
     * Clones a JS object, deeply.
     * 
     * @param {*} obj - The object to clone (any scalar or non-scalar type)
     * @returns {*} The cloned object
     */
    cloneObject: (obj) => {
        // Return 'obj' itself if it's a scalar type or 'undefined'
        if (obj === undefined || SMHelper.isScalar(obj)) {
            return obj
        }
        // According to http://jsperf.com/cloning-an-object/13 this is the fastest way
        return JSON.parse(JSON.stringify(obj))
    },

    /**
     * Removes all empty properties from an object.
     * If "onlyNull", remove all `null` value only.
     * The object, which is passed by reference, is modified.
     * 
     * @param {object} obj - Object to compact
     * @param {boolean} [onlyNull=false] - If true, remove only values that are strictly `null`
     */
    compactObject: (obj, onlyNull) => {
        let recursive = (obj) => {
            for (let key in obj) {
                // Exclude non-own properties
                if (!obj.hasOwnProperty(key)) {
                    continue
                }

                if (obj[key] === null || (!onlyNull && !obj[key])) {
                    delete obj[key]
                }
                else if (typeof obj[key] === 'object') {
                    recursive(obj[key])

                    if (!Object.keys(obj[key]).length) {
                        // Delete empty objects
                        delete obj[key]
                    }
                }
            }
        }
        recursive(obj)
    },

    /**
     * Gets a nested property from a dictionary or array, referenced by a string in "dot notation".
     * For example: "key1.key2.0"
     * 
     * Source: http://stackoverflow.com/a/8052100/192024
     * 
     * @param {object} obj - Object containing the property
     * @param {string} desc - Name of the nested property 
     * @returns {*} Value of the referenced property or `undefined`
     */
    getDescendantProperty: (obj, desc) => {
        let arr = desc.split('.')
        while (arr.length && (obj = obj[arr.shift()])); // Leave the ; here!
        return obj
    },

    /**
     * Checks if a value is numeric.
     * 
     * Sources:
     * https://github.com/jquery/jquery/blob/6acf4a79467a5aea5bc1eb7d552d72366718635d/src/core.js#L224
     * https://github.com/jquery/jquery/blob/6acf4a79467a5aea5bc1eb7d552d72366718635d/src/core.js#L271
     * 
     * @param {*} obj - Value to analyze
     * @returns {boolean} True if value is numeric 
     */
    isNumeric: (obj) => {
        let type
        if (obj == null) {
            type = obj + ""
        }
        else {
            type = typeof obj === "object" || typeof obj === "function" ?
                "object" : typeof obj
        }

        return (type === "number" || type === "string") &&
            // parseFloat NaNs numeric-cast false positives ("")
            // ...but misinterprets leading-number strings, particularly hex literals ("0x...")
            // subtraction forces infinities to NaN
            !isNaN(obj - parseFloat(obj))
    },

    /**
     * Checks if a value is of a scalar type (string, number, boolean).
     * 
     * Source: http://www.jsoneliners.com/function/is-scalar/
     * 
     * @param {*} obj - Value to analyze
     * @returns {boolean} True if value is of a scalar type
     */
    isScalar: (obj) => {
        return (/string|number|boolean/).test(typeof obj)
    },

    /**
     * Flattens a dictionary to the "dot notation", as used by MongoDB.
     * If preserveArrays is true, arrays are not transformed to the "dot notation".
     * 
     * Adapted from http://stackoverflow.com/questions/13218745/convert-complex-json-object-to-dot-notation-json-object
     * 
     * @param {object} obj - Dictionary to convert
     * @param {boolean} [preserveArrays=false] - If true, arrays are not transformed to the "dot notation"
     * @returns {object} Flattened dictionary in "dot notation"
     */
    objectToDotNotation: (obj, preserveArrays) => {
        let res = {}

        let recursive = (obj, current) => {
            for (let key in obj) {
                let value = obj[key]
                let newKey = (current ? current + '.' + key : key)
                if (value && typeof value === 'object') {
                    if (preserveArrays && Array.isArray(value)) {
                        res[newKey] = value
                    }
                    else {
                        recursive(value, newKey)
                    }
                }
                else {
                    res[newKey] = value
                }
            }
        }
        recursive(obj)

        return res
    },

    /**
     * Takes `str` and puts a backslash in front of every character that is part of the regular expression syntax.
     * Port of the PHP function "preg_quote". See also: http://php.net/preg_quote
     * 
     * Source: https://github.com/kvz/locutus/blob/9aea421087656a4cf42decf9b032f28b145f0fdb/src/php/pcre/preg_quote.js
     * 
     * @param {string} str - String to escape
     * @param {string} [delimiter] - If the optional delimiter is specified, it will also be escaped. This is useful for escaping the delimiter that is required by the regular expressions. The / is the most commonly used delimiter. 
     * @returns {string} Quoted (escaped) string
     */
    pregQuote: (str, delimiter) => {
        //  discuss at: http://locutus.io/php/preg_quote/
        // original by: booeyOH
        // improved by: Ates Goral (http://magnetiq.com)
        // improved by: Kevin van Zonneveld (http://kvz.io)
        // improved by: Brett Zamir (http://brett-zamir.me)
        // bugfixed by: Onno Marsman (https://twitter.com/onnomarsman)
        //   example 1: preg_quote("$40")
        //   returns 1: '\\$40'
        //   example 2: preg_quote("*RRRING* Hello?")
        //   returns 2: '\\*RRRING\\* Hello\\?'
        //   example 3: preg_quote("\\.+*?[^]$(){}=!<>|:")
        //   returns 3: '\\\\\\.\\+\\*\\?\\[\\^\\]\\$\\(\\)\\{\\}\\=\\!\\<\\>\\|\\:'

        return (str + '')
            .replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&')
    },

    /**
     * Determines if a given string matches a pattern, allowing * as wildcard.
     * Ported from PHP, originally in Laravel 5.3 Str::is - See: https://github.com/laravel/framework/blob/v5.3.10/src/Illuminate/Support/Str.php#L119
     * 
     * @param {string} pattern - Pattern to search in value
     * @param {string} value - String in which the pattern is searched
     * @returns {boolean} True if value matches pattern
     */
    strIs: (pattern, value) => {
        if (pattern == value) return true
        if (pattern == '*') return true

        pattern = module.exports.pregQuote(pattern, '/')

        // Asterisks are translated into zero-or-more regular expression wildcards
        // to make it convenient to check if the strings starts with the given
        // pattern such as "library/*", making any string check convenient.
        let regex = new RegExp('^' + pattern.replace(/\\\*/g, '.*') + '$')

        return !!value.match(regex)
    },

    /**
     * Converts dashed strings (eg. 'foo-bar') to camelCase ('fooBar')
     * 
     * Source: http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/comment-page-1/
     * 
     * @param {string} str - Dashed string
     * @returns {string} String converted to camelCase
     */ 
    stringToCamel: (str) => {
        return str.replace(/(\-[a-z])/g, ($1) => {
            return $1.toUpperCase().replace('-', '')
        })
    },

    /**
     * Updates a property (represented in the "dot notation") in an object.
     * The object is modified.
     * 
     * @param {object} obj - Object to the be updated
     * @param {string} property - Name of the property to update, in "dot notation"
     * @param {*} value - New value for the matched property
     */
    updatePropertyInObject: (obj, property, value) => {
        // Explode the dot notation
        let parts = property.split('.')
        let last = parts.pop()

        // Get the destination object
        let dest = obj
        for (let i = 0; i < parts.length; i++) {
            if (!dest[parts[i]]) {
                dest[parts[i]] = {}
            }
            dest = dest[parts[i]]
        }

        // Update the value
        dest[last] = value
    }
}

module.exports = SMHelper
