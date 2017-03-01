import { Tone } from 'core';
import { Effect } from 'effect';
import { Signal } from 'signal';
import { Multiply } from 'signal';
import { Gain } from 'core';

	"use strict";

	/**
	 * 	@class  FeedbackEffect provides a loop between an
	 * 	        audio source and its own output. This is a base-class
	 * 	        for feedback effects.
	 *
	 *  @constructor
	 *  @extends {Effect}
	 *  @param {NormalRange|Object} [feedback] The initial feedback value.
	 */
	export function FeedbackEffect(){

		var options = this.optionsObject(arguments, ["feedback"]);
		options = this.defaultArg(options, FeedbackEffect.defaults);

		Effect.call(this, options);

		/**
		 *  the gain which controls the feedback
		 *  @type {Gain}
		 *  @private
		 */
		this._feedbackGain = new Gain(options.feedback, Type.NormalRange);

		/**
		 *  The amount of signal which is fed back into the effect input.
		 *  @type {NormalRange}
		 *  @signal
		 */
		this.feedback = this._feedbackGain.gain;

		//the feedback loop
		this.effectReturn.chain(this._feedbackGain, this.effectSend);
		this._readOnly(["feedback"]);
	};

	Tone.extend(FeedbackEffect, Effect);

	/**
	 *  @static
	 *  @type {Object}
	 */
	FeedbackEffect.defaults = {
		"feedback" : 0.125
	};

	/**
	 *  Clean up.
	 *  @returns {FeedbackEffect} this
	 */
	FeedbackEffect.prototype.dispose = function(){
		Effect.prototype.dispose.call(this);
		this._writable(["feedback"]);
		this._feedbackGain.dispose();
		this._feedbackGain = null;
		this.feedback = null;
		return this;
	};
