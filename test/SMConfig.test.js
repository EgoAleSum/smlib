'use strict';

const should = require('should')
const assert = require('assert')
const os = require('os')
const SMConfig = require('../SMConfig')

describe('SMConfig.js', () => {

    it('SMConfig should export a class', () => {
        SMConfig.should.be.type('function')
        SMConfig.prototype.should.be.type('object')

        let config = new SMConfig({default: {}})
        assert.ok(config)

        //config.methodName.should.be.type('function')
    })

    describe('Constructor method', () => {
        let originalEnv

        // Sample configuration object
        let params = {
            default: {},
            hostnames: {
                testenv1: [
                    'a--not-found'
                ],
                testenv2: [
                    '--not-found-2',
                    /\-\-still(.*?)notfound/
                ]
            }
        }

        // Current machine's hostname
        let currentHostname = os.hostname()

        // Before all tests in this block, backup process.env
        before(() => {
            originalEnv = process.env
        })

        // After all tests, restore process.env
        after(() => {
            process.env = originalEnv
        })

        it('Configuration object', () => {
            // Parameter config not present
            assert.throws(() => {
                new SMConfig()
            })

            // Parameter config is not an object
            assert.throws(() => {
                new SMConfig('hello world')
            })

            // Missing config.default
            assert.throws(() => {
                new SMConfig({a: 1})
            })

            // config.default is not an object
            assert.throws(() => {
                new SMConfig({default: 1})
            })

            // All ok
            let config = new SMConfig({default: {}})
            assert.ok(config)
        })

        it('Environment: fallback to default', () => {
            // Remove process.env.NODE_ENV if present
            delete process.env.NODE_ENV

            // Test fallback to the "default" environment
            let config = new SMConfig(params)
            assert.equal(config.environment, 'default', "Fallback to 'default'")
        })

        it('Environment: from hostname (using RegExp)', function() {
            // Require current machine's hostname to be at least 5 chars
            if(!currentHostname || currentHostname.length < 5) {
                this.skip()
                return
            }

            // Escape function source: http://stackoverflow.com/a/4371855/192024
            let currentHostnameRegExp = new RegExp(currentHostname.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'))
            params.hostnames.hostenv = [
                /\-\-notfound/,
                currentHostnameRegExp
            ]
            let config = new SMConfig(params)
            assert.equal(config.environment, 'hostenv')
        })

        it('Environment: from hostname (exact string match)', function() {
            // Require current machine's hostname to be at least 5 chars
            if(!currentHostname || currentHostname.length < 5) {
                this.skip()
                return
            }

            params.hostnames.hostenv = [
                '--notfound',
                currentHostname
            ]
            let config = new SMConfig(params)
            assert.equal(config.environment, 'hostenv')
        })

        it('Environment: from hostname (string with *)', function() {
            // Require current machine's hostname to be at least 5 chars
            if(!currentHostname || currentHostname.length < 5) {
                this.skip()
                return
            }

            params.hostnames.hostenv = [
                '--notfound',
                currentHostname.slice(0, -1) + '*'
            ]
            let config = new SMConfig(params)
            assert.equal(config.environment, 'hostenv')
        })

        it('Environment: use NODE_ENV environmental variable', () => {
            // Note: in this test, process.hostname.hostenv should still be set
            // and it should be overridden

            // Set NODE_ENV environmental variable
            process.env.NODE_ENV = 'envvar'

            let config = new SMConfig(params)
            assert.equal(config.environment, 'envvar')
        })

        it('Environment: passing environment to constructor', () => {
            // Note: in this test, process.hostname.hostenv and NODE_ENV are still set,
            // but should both be overridden

            let config = new SMConfig(params, 'passedenv')
            assert.equal(config.environment, 'passedenv')
        })
    })
})
