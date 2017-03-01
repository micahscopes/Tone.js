import { Tone } from 'core/Tone';

import { StereoXFeedbackEffect } from 'effect/StereoXFeedbackEffect';

import { Signal } from 'signal/Signal';

import { Delay } from 'core/Delay';


	"use strict";

	/**
	 *  @class  PingPongDelay is a feedback delay effect where the echo is heard
	 *          first in one channel and next in the opposite channel. In a stereo
	 *          system these are the right and left channels.
	 *          PingPongDelay in more simplified terms is two FeedbackDelays
	 *          with independent delay values. Each delay is routed to one channel
	 *          (left or right), and the channel triggered second will always
	 *          trigger at the same interval after the first.
	 *
	 * 	@constructor
	 * 	@extends {StereoXFeedbackEffect}
	 *  @param {Time|Object} [delayTime] The delayTime between consecutive echos.
	 *  @param {NormalRange=} feedback The amount of the effected signal which
	 *                                 is fed back through the delay.
	 *  @example
	 * var pingPong = new PingPongDelay("4n", 0.2).toMaster();
	 * var drum = new DrumSynth().connect(pingPong);
	 * drum.triggerAttackRelease("C4", "32n");
	 */
	export var PingPongDelay = function(){

		var options = this.optionsObject(arguments, ["delayTime", "feedback"], PingPongDelay.defaults);
		StereoXFeedbackEffect.call(this, options);

		/**
		 *  the delay node on the left side
		 *  @type {Delay}
		 *  @private
		 */
		this._leftDelay = new Delay(0, options.maxDelayTime);

		/**
		 *  the delay node on the right side
		 *  @type {Delay}
		 *  @private
		 */
		this._rightDelay = new Delay(0, options.maxDelayTime);

		/**
		 *  the predelay on the right side
		 *  @type {Delay}
		 *  @private
		 */
		this._rightPreDelay = new Delay(0, options.maxDelayTime);

		/**
		 *  the delay time signal
		 *  @type {Time}
		 *  @signal
		 */
		this.delayTime = new Signal(options.delayTime, Type.Time);

		//connect it up
		this.effectSendL.chain(this._leftDelay, this.effectReturnL);
		this.effectSendR.chain(this._rightPreDelay, this._rightDelay, this.effectReturnR);
		this.delayTime.fan(this._leftDelay.delayTime, this._rightDelay.delayTime, this._rightPreDelay.delayTime);
		//rearranged the feedback to be after the rightPreDelay
		this._feedbackLR.disconnect();
		this._feedbackLR.connect(this._rightDelay);
		this._readOnly(["delayTime"]);
	};

	Tone.extend(PingPongDelay, StereoXFeedbackEffect);

	/**
	 *  @static
	 *  @type {Object}
	 */
	PingPongDelay.defaults = {
		"delayTime" : 0.25,
		"maxDelayTime" : 1
	};

	/**
	 *  Clean up.
	 *  @returns {PingPongDelay} this
	 */
	PingPongDelay.prototype.dispose = function(){
		StereoXFeedbackEffect.prototype.dispose.call(this);
		this._leftDelay.dispose();
		this._leftDelay = null;
		this._rightDelay.dispose();
		this._rightDelay = null;
		this._rightPreDelay.dispose();
		this._rightPreDelay = null;
		this._writable(["delayTime"]);
		this.delayTime.dispose();
		this.delayTime = null;
		return this;
	};
