import { Tone } from 'core';
import { Source } from 'source';
import { Oscillator } from 'source';
import { Signal } from 'signal';
import { WaveShaper } from 'signal';
import { Gain } from 'core';

	"use strict";

	/**
	 *  @class PulseOscillator is a pulse oscillator with control over pulse width,
	 *         also known as the duty cycle. At 50% duty cycle (width = 0.5) the wave is
	 *         a square and only odd-numbered harmonics are present. At all other widths
	 *         even-numbered harmonics are present. Read more
	 *         [here](https://wigglewave.wordpress.com/2014/08/16/pulse-waveforms-and-harmonics/).
	 *
	 *  @constructor
	 *  @extends {Oscillator}
	 *  @param {Frequency} [frequency] The frequency of the oscillator
	 *  @param {NormalRange} [width] The width of the pulse
	 *  @example
	 * var pulse = new PulseOscillator("E5", 0.4).toMaster().start();
	 */
	export function PulseOscillator(){

		var options = this.optionsObject(arguments, ["frequency", "width"], Oscillator.defaults);
		Source.call(this, options);

		/**
		 *  The width of the pulse.
		 *  @type {NormalRange}
		 *  @signal
		 */
		this.width = new Signal(options.width, Type.NormalRange);

		/**
		 *  gate the width amount
		 *  @type {Gain}
		 *  @private
		 */
		this._widthGate = new Gain();

		/**
		 *  the sawtooth oscillator
		 *  @type {Oscillator}
		 *  @private
		 */
		this._sawtooth = new Oscillator({
			frequency : options.frequency,
			detune : options.detune,
			type : "sawtooth",
			phase : options.phase
		});

		/**
		 *  The frequency control.
		 *  @type {Frequency}
		 *  @signal
		 */
		this.frequency = this._sawtooth.frequency;

		/**
		 *  The detune in cents.
		 *  @type {Cents}
		 *  @signal
		 */
		this.detune = this._sawtooth.detune;

		/**
		 *  Threshold the signal to turn it into a square
		 *  @type {WaveShaper}
		 *  @private
		 */
		this._thresh = new WaveShaper(function(val){
			if (val < 0){
				return -1;
			} else {
				return 1;
			}
		});

		//connections
		this._sawtooth.chain(this._thresh, this.output);
		this.width.chain(this._widthGate, this._thresh);
		this._readOnly(["width", "frequency", "detune"]);
	};

	Tone.extend(PulseOscillator, Oscillator);

	/**
	 *  The default parameters.
	 *  @static
	 *  @const
	 *  @type {Object}
	 */
	PulseOscillator.defaults = {
		"frequency" : 440,
		"detune" : 0,
		"phase" : 0,
		"width" : 0.2,
	};

	/**
	 *  start the oscillator
	 *  @param  {Time} time
	 *  @private
	 */
	PulseOscillator.prototype._start = function(time){
		time = this.toSeconds(time);
		this._sawtooth.start(time);
		this._widthGate.gain.setValueAtTime(1, time);
	};

	/**
	 *  stop the oscillator
	 *  @param  {Time} time
	 *  @private
	 */
	PulseOscillator.prototype._stop = function(time){
		time = this.toSeconds(time);
		this._sawtooth.stop(time);
		//the width is still connected to the output.
		//that needs to be stopped also
		this._widthGate.gain.setValueAtTime(0, time);
	};

	/**
	 * The phase of the oscillator in degrees.
	 * @memberOf PulseOscillator#
	 * @type {Degrees}
	 * @name phase
	 */
	Object.defineProperty(PulseOscillator.prototype, "phase", {
		get : function(){
			return this._sawtooth.phase;
		},
		set : function(phase){
			this._sawtooth.phase = phase;
		}
	});

	/**
	 * The type of the oscillator. Always returns "pulse".
	 * @readOnly
	 * @memberOf PulseOscillator#
	 * @type {string}
	 * @name type
	 */
	Object.defineProperty(PulseOscillator.prototype, "type", {
		get : function(){
			return "pulse";
		}
	});

	/**
	 * The partials of the waveform. Cannot set partials for this waveform type
	 * @memberOf PulseOscillator#
	 * @type {Array}
	 * @name partials
	 * @private
	 */
	Object.defineProperty(PulseOscillator.prototype, "partials", {
		get : function(){
			return [];
		}
	});

	/**
	 *  Clean up method.
	 *  @return {PulseOscillator} this
	 */
	PulseOscillator.prototype.dispose = function(){
		Source.prototype.dispose.call(this);
		this._sawtooth.dispose();
		this._sawtooth = null;
		this._writable(["width", "frequency", "detune"]);
		this.width.dispose();
		this.width = null;
		this._widthGate.dispose();
		this._widthGate = null;
		this._thresh.dispose();
		this._thresh = null;
		this.frequency = null;
		this.detune = null;
		return this;
	};
