import { Tone } from 'core';
/*
import { Analyser } from 'component';*/

	"use strict";

	/**
	 *  @class  Meter gets the [RMS](https://en.wikipedia.org/wiki/Root_mean_square)
	 *          of an input signal with some averaging applied. It can also get the raw
	 *          value of the input signal.
	 *
	 *  @constructor
	 *  @extends {Tone}
	 *  @param {String} type Either "level" or "signal".
	 *  @param {Number} smoothing The amount of smoothing applied between frames.
	 *  @example
	 * var meter = new Meter();
	 * var mic = new UserMedia().start();
	 * //connect mic to the meter
	 * mic.connect(meter);
	 * //the current level of the mic input
	 * var level = meter.value;
	 */
	export function Meter(){

		var options = this.optionsObject(arguments, ["type", "smoothing"], Meter.defaults);

		/**
		 *  The type of the meter, either "level" or "signal".
		 *  A "level" meter will return the volume level (rms) of the
		 *  input signal and a "signal" meter will return
		 *  the signal value of the input.
		 *  @type  {String}
		 */
		this.type = options.type;

		/**
		 *  The analyser node which computes the levels.
		 *  @private
		 *  @type  {Analyser}
		 */
		this.input = this.output = this._analyser = new Analyser("waveform", 512);
		this._analyser.returnType = "float";

		/**
		 *  The amount of carryover between the current and last frame.
		 *  Only applied meter for "level" type.
		 *  @type  {Number}
		 */
		this.smoothing = options.smoothing;

		/**
		 *  The last computed value
		 *  @type {Number}
		 *  @private
		 */
		this._lastValue = 0;
	};

	Tone.extend(Meter);

	/**
	 *  @private
	 *  @enum {String}
	 */
	Meter.Type = {
		Level : "level",
		Signal : "signal"
	};

	/**
	 *  The defaults
	 *  @type {Object}
	 *  @static
	 *  @const
	 */
	Meter.defaults = {
		"smoothing" : 0.8,
		"type" : Meter.Type.Level
	};

	/**
	 * The current value of the meter. A value of 1 is
	 * "unity".
	 * @memberOf Meter#
	 * @type {Number}
	 * @name value
	 * @readOnly
	 */
	Object.defineProperty(Meter.prototype, "value", {
		get : function(){
			var signal = this._analyser.analyse();
			if (this.type === Meter.Type.Level){
				//rms
				var sum = 0;
				for (var i = 0; i < signal.length; i++){
					sum += Math.pow(signal[i], 2);
				}
				var rms = Math.sqrt(sum / signal.length);
				//smooth it
				rms = Math.max(rms, this._lastValue * this.smoothing);
				this._lastValue = rms;
				//scale it
				var unity = 0.35;
				var val = rms / unity;
				//scale the output curve
				return Math.sqrt(val);
			} else {
				return signal[0];
			}
		},
	});

	/**
	 *  Clean up.
	 *  @returns {Meter} this
	 */
	Meter.prototype.dispose = function(){
		prototype.dispose.call(this);
		this._analyser.dispose();
		this._analyser = null;
		return this;
	};
