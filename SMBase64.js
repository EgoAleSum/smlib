'use strict';

/**
 * Converts a number to base 64 encoding.
 * This class supports only positive integers. In case a floating point
 * number is passed, the decimal part is stripped.
 * 
 * Adapted from: http://stackoverflow.com/a/6573119/192024
 */
class SMBase64 {
    /**
     * Constructor method - initializes the class
     */
    constructor() {
        /**
         * Define the list of characters used in sequence.
         * This can be any sequence of 64 characters, whatever you prefer.
         * 
         * The default list below uses the traditional base64 sequence with the characters
         * - and _ in positions 62 and 63. The last two characters have been chosen among
         * all options because they are URL-friendly.
         */
        //             0       8       16      24      32      40      48      56     63
        //             v       v       v       v       v       v       v       v      v
        this._chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
    }

    /**
     * Getter function for the chars property.
     */
    get chars() {
        return this._chars
    }

    /**
     * Setter function for the chars property.
     */
    set chars(val) {
        if(!val || typeof val != 'string' || val.length != 64) {
            throw Error('SMBase64.chars must be a string with 64 characters')
        }

        this._chars = val
    }

    /**
     * Converts a number (positive integer) to base64.
     * 
     * Negative numbers are not supported, and decimals are stripped if present.
     * 
     * @param {number} number - Number to convert (positive, finite integer)
     * @returns {string} Number represented in base64 encoding
     */
    fromNumber(val) {
        if(isNaN(Number(val)) || val === null || val === Number.POSITIVE_INFINITY) {
            throw Error('The input is not valid')
        }
        if (val < 0) {
            throw Error('This function does not support negative numbers')
        }

        let rixit 
        let residual = Math.floor(val)
        let result = ''
        do {
            rixit = residual % 64
            result = this._chars.charAt(rixit) + result
            residual = Math.floor(residual / 64)
        } while (residual)

        return result
    }

    /**
     * Converts a base64-encoded string to a number
     * 
     * @param {string} str - Base64-encoded string representing a number
     * @return {number} Decimal number
     */
    toNumber(str) {
        if(!str || typeof str != 'string') {
            throw Error('The input is not valid')
        }

        let result = 0
        let chr
        for (let e = 0; e < str.length; e++) {
            chr = this._chars.indexOf(str.charAt(e))
            // Skip invalid characters (-1 returned by indexOf)
            if(~chr) {
                result = (result * 64) + chr
            }
        }
        return result
    }
}

module.exports = SMBase64
