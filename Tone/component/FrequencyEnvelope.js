import { Tone } from 'core';
import { ScaledEnvelope } from 'component';
import { Envelope } from 'component';

	"use strict";

	/**
	 *  @class FrequencyEnvelope is a ScaledEnvelope, but instead of `min` and `max`
	 *         it's got a `baseFrequency` and `octaves` parameter.
	 *
	 *  @extends {Envelope}
	 *  @constructor
	 *  @param {Time|Object} [attack]	the attack time in seconds
	 *  @param {Time} [decay]	the decay time in seconds
	 *  @param {number} [sustain] 	a percentage (0-1) of the full amplitude
	 *  @param {Time} [release]	the release time in seconds
	 *  @example
	 *  var env = new FrequencyEnvelope({
	 *  	"attack" : 0.2,
	 *  	"baseFrequency" : "C2",
	 *  	"octaves" : 4
	 *  });
	 *  scaledEnv.connect(oscillator.frequency);
	 */
	export function FrequencyEnvelope(){

		var options = this.optionsObject(arguments, ["attack", "decay", "sustain", "release"], Envelope.defaults);
		ScaledEnvelope.call(this, options);
		options = this.defaultArg(options, FrequencyEnvelope.defaults);

		/**
		 *  Stores the octave value
		 *  @type {Positive}
		 *  @private
		 */
		this._octaves = options.octaves;

		//setup
		this.baseFrequency = options.baseFrequency;
		this.octaves = options.octaves;
	};

	Tone.extend(FrequencyEnvelope, Envelope);

	/**
	 *  the default parameters
	 *  @static
	 */
	FrequencyEnvelope.defaults = {
		"baseFrequency" : 200,
		"octaves" : 4,
		"exponent" : 2
	};

	/**
	 * The envelope's mininum output value. This is the value which it
	 * starts at.
	 * @memberOf FrequencyEnvelope#
	 * @type {Frequency}
	 * @name baseFrequency
	 */
	Object.defineProperty(FrequencyEnvelope.prototype, "baseFrequency", {
		get : function(){
			return this._scale.min;
		},
		set : function(min){
			this._scale.min = this.toFrequency(min);
			//also update the octaves
			this.octaves = this._octaves;
		}
	});

	/**
	 * The number of octaves above the baseFrequency that the
	 * envelope will scale to.
	 * @memberOf FrequencyEnvelope#
	 * @type {Positive}
	 * @name octaves
	 */
	Object.defineProperty(FrequencyEnvelope.prototype, "octaves", {
		get : function(){
			return this._octaves;
		},
		set : function(octaves){
			this._octaves = octaves;
			this._scale.max = this.baseFrequency * Math.pow(2, octaves);
		}
	});

	/**
	 * The envelope's exponent value.
	 * @memberOf FrequencyEnvelope#
	 * @type {number}
	 * @name exponent
	 */
	Object.defineProperty(FrequencyEnvelope.prototype, "exponent", {
		get : function(){
			return this._exp.value;
		},
		set : function(exp){
			this._exp.value = exp;
		}
	});

	/**
	 *  clean up
	 *  @returns {FrequencyEnvelope} this
	 */
	FrequencyEnvelope.prototype.dispose = function(){
		ScaledEnvelope.prototype.dispose.call(this);
		return this;
	};

	return FrequencyEnvelope;
});
