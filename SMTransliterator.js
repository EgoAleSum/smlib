'use strict';

const unorm = require('unorm')
const XRegExp = require('xregexp')

/**
 * Unicode transliteration utilities
 */
const SMTransliterator = {
    /**
     * Removes diacritics from strings.
     * In full mode, removes punctuation characters and characters in the "Other" Unicode plane (control characters, unassigned ones, etc).
     * @param {string} str - Source string
     * @param {boolean} full - Enable full mode
     * @return {string} The translitereated string
     */
    Transliterate: (str, full) => {
        // 1. Decompose Unicode sequences
        str = unorm.nfd(str)
        
        if(full) {
            // 2a. Remove all sequences that are part of the "Nonspacing", "Punctuation" and "Other" planes 
            str = str.replace(XRegExp('\\p{M}|\\p{P}|\\p{C}', 'g'), '')
        }
        else {
            // 2b. Remove all sequences that are part of the "Nonspacing" plane 
            str = str.replace(XRegExp('\\p{M}', 'g'), '')
        }
        
        // 3. Compose the Unicode sequences again
        str = unorm.nfc(str)
        return str
    },
    
    /**
     * Short-hand method that performs transliterate and lowercases the string.
     * In full mode, removes punctuation characters and characters in the "Other" Unicode plane (control characters, unassigned ones, etc).
     * @param {string} str - Source string
     * @param {boolean} full - Enable full mode
     * @return {string} The normalized string
     */
    Normalize: (str, full) => {
        str = SMTransliterator.Transliterate(str, full)
        str = str.toLowerCase()
        return str
    }
}

module.exports = SMTransliterator
