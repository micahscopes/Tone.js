import { Tone } from 'core/Tone';

import { Filter } from 'component/Filter';

import { Signal } from 'signal/Signal';

import { Gain } from 'core/Gain';


	"use strict";

	/**
	 *  @class Split the incoming signal into three bands (low, mid, high)
	 *         with two crossover frequency controls.
	 *
	 *  @extends {Tone}
	 *  @constructor
	 *  @param {Frequency|Object} [lowFrequency] the low/mid crossover frequency
	 *  @param {Frequency} [highFrequency] the mid/high crossover frequency
	 */
	export var MultibandSplit = function(){
		var options = this.optionsObject(arguments, ["lowFrequency", "highFrequency"], MultibandSplit.defaults);

		/**
		 *  the input
		 *  @type {Gain}
		 *  @private
		 */
		this.input = new Gain();

		/**
		 *  the outputs
		 *  @type {Array}
		 *  @private
		 */
		this.output = new Array(3);

		/**
		 *  The low band. Alias for <code>output[0]</code>
		 *  @type {Filter}
		 */
		this.low = this.output[0] = new Filter(0, "lowpass");

		/**
		 *  the lower filter of the mid band
		 *  @type {Filter}
		 *  @private
		 */
		this._lowMidFilter = new Filter(0, "highpass");

		/**
		 *  The mid band output. Alias for <code>output[1]</code>
		 *  @type {Filter}
		 */
		this.mid = this.output[1] = new Filter(0, "lowpass");

		/**
		 *  The high band output. Alias for <code>output[2]</code>
		 *  @type {Filter}
		 */
		this.high = this.output[2] = new Filter(0, "highpass");

		/**
		 *  The low/mid crossover frequency.
		 *  @type {Frequency}
		 *  @signal
		 */
		this.lowFrequency = new Signal(options.lowFrequency, Type.Frequency);

		/**
		 *  The mid/high crossover frequency.
		 *  @type {Frequency}
		 *  @signal
		 */
		this.highFrequency = new Signal(options.highFrequency, Type.Frequency);

		/**
		 *  The quality of all the filters
		 *  @type {Number}
		 *  @signal
		 */
		this.Q = new Signal(options.Q);

		this.input.fan(this.low, this.high);
		this.input.chain(this._lowMidFilter, this.mid);
		//the frequency control signal
		this.lowFrequency.connect(this.low.frequency);
		this.lowFrequency.connect(this._lowMidFilter.frequency);
		this.highFrequency.connect(this.mid.frequency);
		this.highFrequency.connect(this.high.frequency);
		//the Q value
		this.Q.connect(this.low.Q);
		this.Q.connect(this._lowMidFilter.Q);
		this.Q.connect(this.mid.Q);
		this.Q.connect(this.high.Q);

		this._readOnly(["high", "mid", "low", "highFrequency", "lowFrequency"]);
	};

	Tone.extend(MultibandSplit);

	/**
	 *  @private
	 *  @static
	 *  @type {Object}
	 */
	MultibandSplit.defaults = {
		"lowFrequency" : 400,
		"highFrequency" : 2500,
		"Q" : 1,
	};

	/**
	 *  Clean up.
	 *  @returns {MultibandSplit} this
	 */
	MultibandSplit.prototype.dispose = function(){
		prototype.dispose.call(this);
		this._writable(["high", "mid", "low", "highFrequency", "lowFrequency"]);
		this.low.dispose();
		this.low = null;
		this._lowMidFilter.dispose();
		this._lowMidFilter = null;
		this.mid.dispose();
		this.mid = null;
		this.high.dispose();
		this.high = null;
		this.lowFrequency.dispose();
		this.lowFrequency = null;
		this.highFrequency.dispose();
		this.highFrequency = null;
		this.Q.dispose();
		this.Q = null;
		return this;
	};
