import { Tone } from 'core';
import { MultibandSplit } from 'component';
import { Gain } from 'core';

	"use strict";

	/**
	 *  @class EQ3 is a three band EQ with control over low, mid, and high gain as
	 *         well as the low and high crossover frequencies.
	 *
	 *  @constructor
	 *  @extends {Tone}
	 *
	 *  @param {Decibels|Object} [lowLevel] The gain applied to the lows.
	 *  @param {Decibels} [midLevel] The gain applied to the mid.
	 *  @param {Decibels} [highLevel] The gain applied to the high.
	 *  @example
	 * var eq = new EQ3(-10, 3, -20);
	 */
	export function EQ3(){

		var options = this.optionsObject(arguments, ["low", "mid", "high"], EQ3.defaults);

		/**
		 *  the output node
		 *  @type {GainNode}
		 *  @private
		 */
		this.output = new Gain();

		/**
		 *  the multiband split
		 *  @type {MultibandSplit}
		 *  @private
		 */
		this._multibandSplit = this.input = new MultibandSplit({
			"lowFrequency" : options.lowFrequency,
			"highFrequency" : options.highFrequency
		});

		/**
		 *  The gain for the lower signals
		 *  @type  {Gain}
		 *  @private
		 */
		this._lowGain = new Gain(options.low, Type.Decibels);

		/**
		 *  The gain for the mid signals
		 *  @type  {Gain}
		 *  @private
		 */
		this._midGain = new Gain(options.mid, Type.Decibels);

		/**
		 * The gain in decibels of the high part
		 * @type {Gain}
		 * @private
		 */
		this._highGain = new Gain(options.high, Type.Decibels);

		/**
		 * The gain in decibels of the low part
		 * @type {Decibels}
		 * @signal
		 */
		this.low = this._lowGain.gain;

		/**
		 * The gain in decibels of the mid part
		 * @type {Decibels}
		 * @signal
		 */
		this.mid = this._midGain.gain;

		/**
		 * The gain in decibels of the high part
		 * @type {Decibels}
		 * @signal
		 */
		this.high = this._highGain.gain;

		/**
		 *  The Q value for all of the filters.
		 *  @type {Positive}
		 *  @signal
		 */
		this.Q = this._multibandSplit.Q;

		/**
		 *  The low/mid crossover frequency.
		 *  @type {Frequency}
		 *  @signal
		 */
		this.lowFrequency = this._multibandSplit.lowFrequency;

		/**
		 *  The mid/high crossover frequency.
		 *  @type {Frequency}
		 *  @signal
		 */
		this.highFrequency = this._multibandSplit.highFrequency;

		//the frequency bands
		this._multibandSplit.low.chain(this._lowGain, this.output);
		this._multibandSplit.mid.chain(this._midGain, this.output);
		this._multibandSplit.high.chain(this._highGain, this.output);
		this._readOnly(["low", "mid", "high", "lowFrequency", "highFrequency"]);
	};

	Tone.extend(EQ3);

	/**
	 *  the default values
	 */
	EQ3.defaults = {
		"low" : 0,
		"mid" : 0,
		"high" : 0,
		"lowFrequency" : 400,
		"highFrequency" : 2500
	};

	/**
	 *  clean up
	 *  @returns {EQ3} this
	 */
	EQ3.prototype.dispose = function(){
		prototype.dispose.call(this);
		this._writable(["low", "mid", "high", "lowFrequency", "highFrequency"]);
		this._multibandSplit.dispose();
		this._multibandSplit = null;
		this.lowFrequency = null;
		this.highFrequency = null;
		this._lowGain.dispose();
		this._lowGain = null;
		this._midGain.dispose();
		this._midGain = null;
		this._highGain.dispose();
		this._highGain = null;
		this.low = null;
		this.mid = null;
		this.high = null;
		this.Q = null;
		return this;
	};
