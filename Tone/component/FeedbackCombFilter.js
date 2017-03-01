import { Tone } from 'core/Tone';

import { ScaleExp } from 'signal/ScaleExp';

import { Signal } from 'signal/Signal';

import { Param } from 'core/Param';

import { Delay } from 'core/Delay';

import { Gain } from 'core/Gain';


	"use strict";

	/**
	 *  @class Comb filters are basic building blocks for physical modeling. Read more
	 *         about comb filters on [CCRMA's website](https://ccrma.stanford.edu/~jos/pasp/Feedback_Comb_Filters.html).
	 *
	 *  @extends {Tone}
	 *  @constructor
	 *  @param {Time|Object} [delayTime] The delay time of the filter.
	 *  @param {NormalRange=} resonance The amount of feedback the filter has.
	 */
	export var FeedbackCombFilter = function(){

		var options = this.optionsObject(arguments, ["delayTime", "resonance"], FeedbackCombFilter.defaults);

		/**
		 *  the delay node
		 *  @type {DelayNode}
		 *  @private
		 */
		this._delay = this.input = this.output = new Delay(options.delayTime);

		/**
		 *  The amount of delay of the comb filter.
		 *  @type {Time}
		 *  @signal
		 */
		this.delayTime = this._delay.delayTime;

		/**
		 *  the feedback node
		 *  @type {GainNode}
		 *  @private
		 */
		this._feedback = new Gain(options.resonance, Type.NormalRange);

		/**
		 *  The amount of feedback of the delayed signal.
		 *  @type {NormalRange}
		 *  @signal
		 */
		this.resonance = this._feedback.gain;

		this._delay.chain(this._feedback, this._delay);
		this._readOnly(["resonance", "delayTime"]);
	};

	Tone.extend(FeedbackCombFilter);

	/**
	 *  the default parameters
	 *  @static
	 *  @const
	 *  @type {Object}
	 */
	FeedbackCombFilter.defaults = {
		"delayTime" : 0.1,
		"resonance" : 0.5
	};

	/**
	 *  clean up
	 *  @returns {FeedbackCombFilter} this
	 */
	FeedbackCombFilter.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._writable(["resonance", "delayTime"]);
		this._delay.dispose();
		this._delay = null;
		this.delayTime = null;
		this._feedback.dispose();
		this._feedback = null;
		this.resonance = null;
		return this;
	};
