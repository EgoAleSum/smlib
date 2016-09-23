'use strict';

const should = require('should')
const SMTransliterator = require('../SMTransliterator')

describe('SMTransliterator.js', () => {

    it('SMTransliterator should export an object with the correct methods', () => {
        SMTransliterator.should.be.type('object')

        SMTransliterator.Transliterate.should.be.type('function')
        SMTransliterator.Normalize.should.be.type('function')
    })

    it('Transliterate should return a string without diacritics', () => {
        SMTransliterator.Transliterate('ABC').should.be.equal('ABC')
        SMTransliterator.Transliterate('èe').should.be.equal('ee')
        SMTransliterator.Transliterate('€').should.be.equal('€')
        SMTransliterator.Transliterate('àòùìéëü').should.be.equal('aouieeu')
        SMTransliterator.Transliterate('àòùìéëü_-.*').should.be.equal('aouieeu_-.*')
        SMTransliterator.Transliterate('Алушта').should.be.equal('Алушта')
        SMTransliterator.Transliterate('Алушта=/\\"').should.be.equal('Алушта=/\\"')
        SMTransliterator.Transliterate('把百').should.be.equal('把百')

        // Full mode: should remove punctuation characters too
        SMTransliterator.Transliterate('ABC', true).should.be.equal('ABC')
        SMTransliterator.Transliterate('èe', true).should.be.equal('ee')
        SMTransliterator.Transliterate('€', true).should.be.equal('€')
        SMTransliterator.Transliterate('àòùìéëü', true).should.be.equal('aouieeu')
        SMTransliterator.Transliterate('àòùìéëü_-.*', true).should.be.equal('aouieeu')
        SMTransliterator.Transliterate('Алушта', true).should.be.equal('Алушта')
        SMTransliterator.Transliterate('Алушта=/\\"', true).should.be.equal('Алушта=')
        SMTransliterator.Transliterate('把百"', true).should.be.equal('把百')
    })

    it('Normalize should return a lowercased transliterated string', () => {
        SMTransliterator.Normalize('ABC').should.be.equal('abc')
        SMTransliterator.Normalize('èeÈ').should.be.equal('eee')
        SMTransliterator.Normalize('€').should.be.equal('€')
        SMTransliterator.Normalize('àòùìéëü').should.be.equal('aouieeu')
        SMTransliterator.Normalize('ÅÒùìéëü').should.be.equal('aouieeu')
        SMTransliterator.Normalize('ÅÒùìéëü_-.*"').should.be.equal('aouieeu_-.*"')
        SMTransliterator.Normalize('Алушта=/\\').should.be.equal('алушта=/\\')
        SMTransliterator.Normalize('把百').should.be.equal('把百')

        // Full mode: should remove punctuation characters too
        SMTransliterator.Normalize('ABC', true).should.be.equal('abc')
        SMTransliterator.Normalize('èeÈ', true).should.be.equal('eee')
        SMTransliterator.Normalize('€', true).should.be.equal('€')
        SMTransliterator.Normalize('àòùìéëü', true).should.be.equal('aouieeu')
        SMTransliterator.Normalize('ÅÒùìéëü', true).should.be.equal('aouieeu')
        SMTransliterator.Normalize('ÅÒùìéëü_-.*"', true).should.be.equal('aouieeu')
        SMTransliterator.Normalize('Алушта=/\\', true).should.be.equal('алушта=')
        SMTransliterator.Normalize('把百', true).should.be.equal('把百')
    })
})
