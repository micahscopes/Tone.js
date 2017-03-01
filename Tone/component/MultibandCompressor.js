import { Tone } from 'core';
import { MultibandSplit } from 'component';
import { Compressor } from 'component';

	"use strict";

	/**
	 *  @class A compressor with seperate controls over low/mid/high dynamics
	 *
	 *  @extends {Tone}
	 *  @constructor
	 *  @param {Object} options The low/mid/high compressor settings.
	 *  @example
	 *  var multiband = new MultibandCompressor({
	 *  	"lowFrequency" : 200,
	 *  	"highFrequency" : 1300
	 *  	"low" : {
	 *  		"threshold" : -12
	 *  	}
	 *  })
	 */
	export function MultibandCompressor(options){

		options = this.defaultArg(arguments, MultibandCompressor.defaults);

		/**
		 *  split the incoming signal into high/mid/low
		 *  @type {MultibandSplit}
		 *  @private
		 */
		this._splitter = this.input = new MultibandSplit({
			"lowFrequency" : options.lowFrequency,
			"highFrequency" : options.highFrequency
		});

		/**
		 *  low/mid crossover frequency.
		 *  @type {Frequency}
		 *  @signal
		 */
		this.lowFrequency = this._splitter.lowFrequency;

		/**
		 *  mid/high crossover frequency.
		 *  @type {Frequency}
		 *  @signal
		 */
		this.highFrequency = this._splitter.highFrequency;

		/**
		 *  the output
		 *  @type {Gain}
		 *  @private
		 */
		this.output = new Gain();

		/**
		 *  The compressor applied to the low frequencies.
		 *  @type {Compressor}
		 */
		this.low = new Compressor(options.low);

		/**
		 *  The compressor applied to the mid frequencies.
		 *  @type {Compressor}
		 */
		this.mid = new Compressor(options.mid);

		/**
		 *  The compressor applied to the high frequencies.
		 *  @type {Compressor}
		 */
		this.high = new Compressor(options.high);

		//connect the compressor
		this._splitter.low.chain(this.low, this.output);
		this._splitter.mid.chain(this.mid, this.output);
		this._splitter.high.chain(this.high, this.output);

		this._readOnly(["high", "mid", "low", "highFrequency", "lowFrequency"]);
	};

	Tone.extend(MultibandCompressor);

	/**
	 *  @const
	 *  @static
	 *  @type {Object}
	 */
	MultibandCompressor.defaults = {
		"low" : Compressor.defaults,
		"mid" : Compressor.defaults,
		"high" : Compressor.defaults,
		"lowFrequency" : 250,
		"highFrequency" : 2000
	};

	/**
	 *  clean up
	 *  @returns {MultibandCompressor} this
	 */
	MultibandCompressor.prototype.dispose = function(){
		prototype.dispose.call(this);
		this._splitter.dispose();
		this._writable(["high", "mid", "low", "highFrequency", "lowFrequency"]);
		this.low.dispose();
		this.mid.dispose();
		this.high.dispose();
		this._splitter = null;
		this.low = null;
		this.mid = null;
		this.high = null;
		this.lowFrequency = null;
		this.highFrequency = null;
		return this;
	};
