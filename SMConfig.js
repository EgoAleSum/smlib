'use strict';

const os = require('os')
const fs = require('fs')
const SMHelper = require('./SMHelper')

/**
 * Environment and configuration utilities
 */
class SMConfig {
	/**
	 * Constructor method - initialize the class.
	 * Determines the environment, then sets the appropriate configuration.
	 * 
	 * The `config` parameter can be an object with the configuration values,
	 * or a string representing a JSON/YAML file to load.
	 * 
	 * The configuration object should have the following structure:
	 *   
	 *   default: (Default configuration, for all environments)
	 *     <key1>: <value1>
	 * 	   <key2>: <value2>
	 *     ...
	 *   
	 *   <environment1>: (Configuration for a specific environment - optional)
	 *     <key1>: <newValue> (Overrides <key1>)
	 *     <anotherKey>: <anotherValue>
	 *     ...
	 *   
	 *   <environment2>: (Another environment)
	 *   
	 *   hostnames: (Hostnames to environment matches - optional)
	 *     <environment1>: (Array of strings or RegExp's)
	 * 	     - "<string1>"
	 *       - /<regexp1>/
	 *       ...
	 *     <environment2>:
	 *       - "<string2>"
	 *       ...
	 *     ...
	 * 
	 * Environmental configuration values can always be overridden at runtime by
	 * passing environmental variables to the application. To be considered,
	 * environmental variables must start with a prefix, configured with the
	 * `envVarPrefix` parameter (default: `APPSETTING_`) Environmental variables
	 * are lowercased then converted to camelCase, for example
	 * `APPSETTING_SECRET_KEY` becomes `secretKey`.
	 * Values passed via environmental variables are strings, but numeric ones
	 * (those representing a number) are converted to numbers.
	 * 
	 * Values in the hostnames array can be RegExp's or strings. Strings are
	 * parsed using SMHelper.strIs, so the '*' token can be used as wildcard.
	 * 
	 * The environment is determined by, in order:
	 * 1. The value passed in the `env` parameter
	 * 2. The `NODE_ENV` environmental variable
	 * 3. The environment that is configured for the hostname
	 * 4. Fallback to the `default` environment
	 * 
	 * @param {Object|string} config - Configuration params or filename to load
	 * @param {string} [env] - Optional set environment
	 * @param {string} [envVarPrefix] - Prefix for environmental variables (default: `APPSETTING_`)
	 */
	constructor(config, env, envVarPrefix) {
		// Ensure the config object is valid
		if(!config || !SMHelper.isPlainObject(config)) {
			throw Error('Parameter `config` must be an object')
		}
		if(!config.default || !SMHelper.isPlainObject(config.default)) {
			throw Error('Cannot find default environment configuration in `config` parameter')
		}

		// Default value for envVarPrefix
		envVarPrefix = envVarPrefix ? SMHelper.toStringSafe(envVarPrefix) : 'APPSETTING_'

		// Get the name of the current environment
		this._environment = this._getEnvironment(env, config.hostnames)

		// Check if we have environment-specific configuration
		if(config[this.environment] && SMHelper.isPlainObject(config[this.environment])) {
			// Merge configuration: environment-specific one overrides default
			this._config = Object.assign({}, config.default, config[this.environment])
		}
		else {
			// Default configuration only
			this._config = config.default
		}

		// Loop through environmental variables that can override configuration
		for(let key in process.env) {
			if(!process.env.hasOwnProperty(key)) {
				continue
			}

			// String.startsWith is available only in Node 6+
			if(key.substr(0, envVarPrefix.length) === envVarPrefix) {
				// Convert the key to the right format
				let keyCamelCase = key.substr(envVarPrefix.length)
				let value = process.env[key]

				// Check if value is a numeric string, then convert to number (float)
				if(SMHelper.isNumeric(value)) {
					value = parseFloat(value)
				}

				this._config[keyCamelCase] = value
			}
		}
	}

	/**
	 * Getter function for the environment property
	 */
	get environment() {
		return this._environment
	}

	/* !Private methods */

	// Get the current environment
	_getEnvironment(env, hostnames) {
		// 1. The value passed in the `env` parameter
		if(env) {
			// Ensure env is a string
			env = SMHelper.toStringSafe(env)
			if(env) {
				return env
			}
		}
		
		// 2. The NODE_ENV environmental variable
		if(process.env.NODE_ENV) {
			// Variables in process.env are always strings
			return process.env.NODE_ENV
		}

		// 3. The environment that is configured for the hostname
		if(hostnames) {
			let hostname = os.hostname()

			for(let e in hostnames) {
				if(!hostnames.hasOwnProperty(e)) {
					continue
				}

				// Ensure the value is a non-empty array
				if(!hostnames[e] || !Array.isArray(hostnames[e])) {
					continue
				}

				// Iterate through the list of hostnames
				for(let i in hostnames[e]) {
					let v = hostnames[e][i]
					if(!v) {
						continue
					}

					if(typeof v == 'string') {
						// Value is a string
						if(SMHelper.strIs(v, hostname)) {
							// Return the value from the function
							return e
						}
					}
					else if(v instanceof RegExp) {
						// Value is a RegExp
						if(v.test(hostname)) {
							// Return the value from the function
							return e
						}
					}
				}
			}
		}

		// 4. Fallback to the default environment
		return 'default'
	}
}

module.exports = SMConfig
