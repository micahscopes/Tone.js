import { Tone } from 'core';
import { FeedbackEffect } from 'effect';
import { Signal } from 'signal';
import { Delay } from 'core';

	"use strict";

	/**
	 *  @class  FeedbackDelay is a DelayNode in which part of output
	 *          signal is fed back into the delay.
	 *
	 *  @constructor
	 *  @extends {FeedbackEffect}
	 *  @param {Time|Object} [delayTime] The delay applied to the incoming signal.
	 *  @param {NormalRange=} feedback The amount of the effected signal which
	 *                            is fed back through the delay.
	 *  @example
	 * var feedbackDelay = new FeedbackDelay("8n", 0.5).toMaster();
	 * var tom = new DrumSynth({
	 * 	"octaves" : 4,
	 * 	"pitchDecay" : 0.1
	 * }).connect(feedbackDelay);
	 * tom.triggerAttackRelease("A2","32n");
	 */
	export function FeedbackDelay(){

		var options = this.optionsObject(arguments, ["delayTime", "feedback"], FeedbackDelay.defaults);
		FeedbackEffect.call(this, options);

		/**
		 *  the delay node
		 *  @type {Delay}
		 *  @private
		 */
		this._delayNode = new Delay(options.delayTime);

		/**
		 *  The delayTime of the DelayNode.
		 *  @type {Time}
		 *  @signal
		 */
		this.delayTime = this._delayNode.delayTime;


		// connect it up
		this.connectEffect(this._delayNode);
		this._readOnly(["delayTime"]);
	};

	Tone.extend(FeedbackDelay, FeedbackEffect);

	/**
	 *  The default values.
	 *  @const
	 *  @static
	 *  @type {Object}
	 */
	FeedbackDelay.defaults = {
		"delayTime" : 0.25,
	};

	/**
	 *  clean up
	 *  @returns {FeedbackDelay} this
	 */
	FeedbackDelay.prototype.dispose = function(){
		FeedbackEffect.prototype.dispose.call(this);
		this._delayNode.dispose();
		this._delayNode = null;
		this._writable(["delayTime"]);
		this.delayTime = null;
		return this;
	};
