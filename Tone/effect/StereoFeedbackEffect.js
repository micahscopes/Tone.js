import { Tone } from 'core/Tone';

import { StereoEffect } from 'effect/StereoEffect';

import { FeedbackEffect } from 'effect/FeedbackEffect';

import { Gain } from 'core/Gain';


	"use strict";

	/**
	 *  @class Base class for stereo feedback effects where the effectReturn
	 *         is fed back into the same channel.
	 *
	 *	@constructor
	 *	@extends {FeedbackEffect}
	 */
	export var StereoFeedbackEffect = function(){

		var options = this.optionsObject(arguments, ["feedback"], FeedbackEffect.defaults);
		StereoEffect.call(this, options);

		/**
		 *  controls the amount of feedback
		 *  @type {NormalRange}
		 *  @signal
		 */
		this.feedback = new Signal(options.feedback, Type.NormalRange);

		/**
		 *  the left side feeback
		 *  @type {Gain}
		 *  @private
		 */
		this._feedbackL = new Gain();

		/**
		 *  the right side feeback
		 *  @type {Gain}
		 *  @private
		 */
		this._feedbackR = new Gain();

		//connect it up
		this.effectReturnL.chain(this._feedbackL, this.effectSendL);
		this.effectReturnR.chain(this._feedbackR, this.effectSendR);
		this.feedback.fan(this._feedbackL.gain, this._feedbackR.gain);
		this._readOnly(["feedback"]);
	};

	Tone.extend(StereoFeedbackEffect, FeedbackEffect);

	/**
	 *  clean up
	 *  @returns {StereoFeedbackEffect} this
	 */
	StereoFeedbackEffect.prototype.dispose = function(){
		StereoEffect.prototype.dispose.call(this);
		this._writable(["feedback"]);
		this.feedback.dispose();
		this.feedback = null;
		this._feedbackL.dispose();
		this._feedbackL = null;
		this._feedbackR.dispose();
		this._feedbackR = null;
		return this;
	};
