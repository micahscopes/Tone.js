import { Tone } from 'core/Tone';

import { Signal } from 'signal/Signal';

import { Filter } from 'component/Filter';

import { Param } from 'core/Param';

import { Gain } from 'core/Gain';

import { Delay } from 'core/Delay';


	"use strict";

	/**
	 *  @class Lowpass is a lowpass feedback comb filter. It is similar to
	 *         FeedbackCombFilter, but includes a lowpass filter.
	 *
	 *  @extends {Tone}
	 *  @constructor
	 *  @param {Time|Object} [delayTime] The delay time of the comb filter
	 *  @param {NormalRange=} resonance The resonance (feedback) of the comb filter
	 *  @param {Frequency=} dampening The cutoff of the lowpass filter dampens the
	 *                                signal as it is fedback.
	 */
	export var LowpassCombFilter = function(){

		this.createInsOuts(1, 1);

		var options = this.optionsObject(arguments, ["delayTime", "resonance", "dampening"], LowpassCombFilter.defaults);

		/**
		 *  the delay node
		 *  @type {DelayNode}
		 *  @private
		 */
		this._delay = this.input = new Delay(options.delayTime);

		/**
		 *  The delayTime of the comb filter.
		 *  @type {Time}
		 *  @signal
		 */
		this.delayTime = this._delay.delayTime;

		/**
		 *  the lowpass filter
		 *  @type  {BiquadFilterNode}
		 *  @private
		 */
		this._lowpass = this.output = this.context.createBiquadFilter();
		this._lowpass.Q.value = -3.0102999566398125;
		this._lowpass.type = "lowpass";

		/**
		 *  The dampening control of the feedback
		 *  @type {Frequency}
		 *  @signal
		 */
		this.dampening = new Param({
			"param" : this._lowpass.frequency,
			"units" : Type.Frequency,
			"value" : options.dampening
		});

		/**
		 *  the feedback gain
		 *  @type {Gain}
		 *  @private
		 */
		this._feedback = new Gain(options.resonance, Type.NormalRange);

		/**
		 *  The amount of feedback of the delayed signal.
		 *  @type {NormalRange}
		 *  @signal
		 */
		this.resonance = this._feedback.gain;

		//connections
		this._delay.chain(this._lowpass, this._feedback, this._delay);
		this._readOnly(["dampening", "resonance", "delayTime"]);
	};

	Tone.extend(LowpassCombFilter);

	/**
	 *  the default parameters
	 *  @static
	 *  @const
	 *  @type {Object}
	 */
	LowpassCombFilter.defaults = {
		"delayTime" : 0.1,
		"resonance" : 0.5,
		"dampening" : 3000
	};

	/**
	 *  Clean up.
	 *  @returns {LowpassCombFilter} this
	 */
	LowpassCombFilter.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._writable(["dampening", "resonance", "delayTime"]);
		this.dampening.dispose();
		this.dampening = null;
		this.resonance.dispose();
		this.resonance = null;
		this._delay.dispose();
		this._delay = null;
		this.delayTime = null;
		this._lowpass.disconnect();
		this._lowpass = null;
		this._feedback.disconnect();
		this._feedback = null;
		return this;
	};
