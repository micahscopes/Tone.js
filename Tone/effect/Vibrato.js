import { Tone } from 'core/Tone';

import { Effect } from 'effect/Effect';

import { Delay } from 'core/Delay';

import { LFO } from 'component/LFO';


	"use strict";

	/**
	 *  @class A Vibrato effect composed of a Delay and a LFO. The LFO
	 *         modulates the delayTime of the delay, causing the pitch to rise
	 *         and fall.
	 *  @extends {Effect}
	 *  @param {Frequency} frequency The frequency of the vibrato.
	 *  @param {NormalRange} depth The amount the pitch is modulated.
	 */
	export var Vibrato = function(){

		var options = this.optionsObject(arguments, ["frequency", "depth"], Vibrato.defaults);
		Effect.call(this, options);

		/**
		 *  The delay node used for the vibrato effect
		 *  @type {Delay}
		 *  @private
		 */
		this._delayNode = new Delay(0, options.maxDelay);

		/**
		 *  The LFO used to control the vibrato
		 *  @type {LFO}
		 *  @private
		 */
		this._lfo = new LFO({
			"type" : options.type,
			"min" : 0,
			"max" : options.maxDelay,
			"frequency"  : options.frequency,
			"phase" : -90 //offse the phase so the resting position is in the center
		}).start().connect(this._delayNode.delayTime);

		/**
		 *  The frequency of the vibrato
		 *  @type {Frequency}
		 *  @signal
		 */
		this.frequency = this._lfo.frequency;

		/**
		 *  The depth of the vibrato.
		 *  @type {NormalRange}
		 *  @signal
		 */
		this.depth = this._lfo.amplitude;

		this.depth.value = options.depth;
		this._readOnly(["frequency", "depth"]);
		this.effectSend.chain(this._delayNode, this.effectReturn);
	};

	Tone.extend(Vibrato, Effect);

	/**
	 *  The defaults
	 *  @type  {Object}
	 *  @const
	 */
	Vibrato.defaults = {
		"maxDelay" : 0.005,
		"frequency" : 5,
		"depth" : 0.1,
		"type" : "sine"
	};

	/**
	 * Type of oscillator attached to the Vibrato.
	 * @memberOf Vibrato#
	 * @type {string}
	 * @name type
	 */
	Object.defineProperty(Vibrato.prototype, "type", {
		get : function(){
			return this._lfo.type;
		},
		set : function(type){
			this._lfo.type = type;
		}
	});

	/**
	 *  Clean up.
	 *  @returns {Vibrato} this
	 */
	Vibrato.prototype.dispose = function(){
		Effect.prototype.dispose.call(this);
		this._delayNode.dispose();
		this._delayNode = null;
		this._lfo.dispose();
		this._lfo = null;
		this._writable(["frequency", "depth"]);
		this.frequency = null;
		this.depth = null;
	};
