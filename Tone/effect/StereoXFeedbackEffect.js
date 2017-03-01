import { Tone } from 'core';
import { StereoEffect } from 'effect';
import { FeedbackEffect } from 'effect';

	"use strict";

	/**
	 *  @class Just like a stereo feedback effect, but the feedback is routed from left to right
	 *         and right to left instead of on the same channel.
	 *
	 *	@constructor
	 *	@extends {FeedbackEffect}
	 */
	export function StereoXFeedbackEffect(){

		var options = this.optionsObject(arguments, ["feedback"], FeedbackEffect.defaults);
		StereoEffect.call(this, options);

		/**
		 *  The amount of feedback from the output
		 *  back into the input of the effect (routed
		 *  across left and right channels).
		 *  @type {NormalRange}
		 *  @signal
		 */
		this.feedback = new Signal(options.feedback, Type.NormalRange);

		/**
		 *  the left side feeback
		 *  @type {Gain}
		 *  @private
		 */
		this._feedbackLR = new Gain();

		/**
		 *  the right side feeback
		 *  @type {Gain}
		 *  @private
		 */
		this._feedbackRL = new Gain();

		//connect it up
		this.effectReturnL.chain(this._feedbackLR, this.effectSendR);
		this.effectReturnR.chain(this._feedbackRL, this.effectSendL);
		this.feedback.fan(this._feedbackLR.gain, this._feedbackRL.gain);
		this._readOnly(["feedback"]);
	};

	Tone.extend(StereoXFeedbackEffect, FeedbackEffect);

	/**
	 *  clean up
	 *  @returns {StereoXFeedbackEffect} this
	 */
	StereoXFeedbackEffect.prototype.dispose = function(){
		StereoEffect.prototype.dispose.call(this);
		this._writable(["feedback"]);
		this.feedback.dispose();
		this.feedback = null;
		this._feedbackLR.dispose();
		this._feedbackLR = null;
		this._feedbackRL.dispose();
		this._feedbackRL = null;
		return this;
	};
