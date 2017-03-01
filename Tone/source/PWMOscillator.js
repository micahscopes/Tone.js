import { Tone } from 'core/Tone';

import { Source } from 'source/Source';

import { PulseOscillator } from 'source/PulseOscillator';

import { Oscillator } from 'source/Oscillator';

import { Multiply } from 'signal/Multiply';


	"use strict";

	/**
	 *  @class PWMOscillator modulates the width of a PulseOscillator
	 *         at the modulationFrequency. This has the effect of continuously
	 *         changing the timbre of the oscillator by altering the harmonics
	 *         generated.
	 *
	 *  @extends {Oscillator}
	 *  @constructor
	 *  @param {Frequency} frequency The starting frequency of the oscillator.
	 *  @param {Frequency} modulationFrequency The modulation frequency of the width of the pulse.
	 *  @example
	 *  var pwm = new PWMOscillator("Ab3", 0.3).toMaster().start();
	 */
	export var PWMOscillator = function(){
		var options = this.optionsObject(arguments, ["frequency", "modulationFrequency"], PWMOscillator.defaults);
		Source.call(this, options);

		/**
		 *  the pulse oscillator
		 *  @type {PulseOscillator}
		 *  @private
		 */
		this._pulse = new PulseOscillator(options.modulationFrequency);
		//change the pulse oscillator type
		this._pulse._sawtooth.type = "sine";

		/**
		 *  the modulator
		 *  @type {Oscillator}
		 *  @private
		 */
		this._modulator = new Oscillator({
			"frequency" : options.frequency,
			"detune" : options.detune,
			"phase" : options.phase
		});

		/**
		 *  Scale the oscillator so it doesn't go silent
		 *  at the extreme values.
		 *  @type {Multiply}
		 *  @private
		 */
		this._scale = new Multiply(2);

		/**
		 *  The frequency control.
		 *  @type {Frequency}
		 *  @signal
		 */
		this.frequency = this._modulator.frequency;

		/**
		 *  The detune of the oscillator.
		 *  @type {Cents}
		 *  @signal
		 */
		this.detune = this._modulator.detune;

		/**
		 *  The modulation rate of the oscillator.
		 *  @type {Frequency}
		 *  @signal
		 */
		this.modulationFrequency = this._pulse.frequency;

		//connections
		this._modulator.chain(this._scale, this._pulse.width);
		this._pulse.connect(this.output);
		this._readOnly(["modulationFrequency", "frequency", "detune"]);
	};

	Tone.extend(PWMOscillator, Oscillator);

	/**
	 *  default values
	 *  @static
	 *  @type {Object}
	 *  @const
	 */
	PWMOscillator.defaults = {
		"frequency" : 440,
		"detune" : 0,
		"phase" : 0,
		"modulationFrequency" : 0.4,
	};

	/**
	 *  start the oscillator
	 *  @param  {Time} [time=now]
	 *  @private
	 */
	PWMOscillator.prototype._start = function(time){
		time = this.toSeconds(time);
		this._modulator.start(time);
		this._pulse.start(time);
	};

	/**
	 *  stop the oscillator
	 *  @param  {Time} time (optional) timing parameter
	 *  @private
	 */
	PWMOscillator.prototype._stop = function(time){
		time = this.toSeconds(time);
		this._modulator.stop(time);
		this._pulse.stop(time);
	};

	/**
	 * The type of the oscillator. Always returns "pwm".
	 * @readOnly
	 * @memberOf PWMOscillator#
	 * @type {string}
	 * @name type
	 */
	Object.defineProperty(PWMOscillator.prototype, "type", {
		get : function(){
			return "pwm";
		}
	});

	/**
	 * The partials of the waveform. Cannot set partials for this waveform type
	 * @memberOf PWMOscillator#
	 * @type {Array}
	 * @name partials
	 * @private
	 */
	Object.defineProperty(PWMOscillator.prototype, "partials", {
		get : function(){
			return [];
		}
	});

	/**
	 * The phase of the oscillator in degrees.
	 * @memberOf PWMOscillator#
	 * @type {number}
	 * @name phase
	 */
	Object.defineProperty(PWMOscillator.prototype, "phase", {
		get : function(){
			return this._modulator.phase;
		},
		set : function(phase){
			this._modulator.phase = phase;
		}
	});

	/**
	 *  Clean up.
	 *  @return {PWMOscillator} this
	 */
	PWMOscillator.prototype.dispose = function(){
		Source.prototype.dispose.call(this);
		this._pulse.dispose();
		this._pulse = null;
		this._scale.dispose();
		this._scale = null;
		this._modulator.dispose();
		this._modulator = null;
		this._writable(["modulationFrequency", "frequency", "detune"]);
		this.frequency = null;
		this.detune = null;
		this.modulationFrequency = null;
		return this;
	};
