import { Tone } from 'core';
import { LFO } from 'component';
import { StereoEffect } from 'effect';

	"use strict";

	/**
	 *  @class Tremolo modulates the amplitude of an incoming signal using a LFO.
	 *         The type, frequency, and depth of the LFO is controllable.
	 *
	 *  @extends {StereoEffect}
	 *  @constructor
	 *  @param {Frequency} [frequency] The rate of the effect.
	 *  @param {NormalRange} [depth] The depth of the effect.
	 *  @example
	 * //create a tremolo and start it's LFO
	 * var tremolo = new Tremolo(9, 0.75).toMaster().start();
	 * //route an oscillator through the tremolo and start it
	 * var oscillator = new Oscillator().connect(tremolo).start();
	 */
	export function Tremolo(){

		var options = this.optionsObject(arguments, ["frequency", "depth"], Tremolo.defaults);
		StereoEffect.call(this, options);

		/**
		 *  The tremelo LFO in the left channel
		 *  @type  {LFO}
		 *  @private
		 */
		this._lfoL = new LFO({
			"phase" : options.spread,
			"min" : 1,
			"max" : 0,
		});

		/**
		 *  The tremelo LFO in the left channel
		 *  @type  {LFO}
		 *  @private
		 */
		this._lfoR = new LFO({
			"phase" : options.spread,
			"min" : 1,
			"max" : 0,
		});

		/**
		 *  Where the gain is multiplied
		 *  @type  {Gain}
		 *  @private
		 */
		this._amplitudeL = new Gain();

		/**
		 *  Where the gain is multiplied
		 *  @type  {Gain}
		 *  @private
		 */
		this._amplitudeR = new Gain();

		/**
		 *  The frequency of the tremolo.
		 *  @type  {Frequency}
		 *  @signal
		 */
		this.frequency = new Signal(options.frequency, Type.Frequency);

		/**
		 *  The depth of the effect. A depth of 0, has no effect
		 *  on the amplitude, and a depth of 1 makes the amplitude
		 *  modulate fully between 0 and 1.
		 *  @type  {NormalRange}
		 *  @signal
		 */
		this.depth = new Signal(options.depth, Type.NormalRange);

		this._readOnly(["frequency", "depth"]);
		this.effectSendL.chain(this._amplitudeL, this.effectReturnL);
		this.effectSendR.chain(this._amplitudeR, this.effectReturnR);
		this._lfoL.connect(this._amplitudeL.gain);
		this._lfoR.connect(this._amplitudeR.gain);
		this.frequency.fan(this._lfoL.frequency, this._lfoR.frequency);
		this.depth.fan(this._lfoR.amplitude, this._lfoL.amplitude);
		this.type = options.type;
		this.spread = options.spread;
	};

	Tone.extend(Tremolo, StereoEffect);

	/**
	 *  @static
	 *  @const
	 *  @type {Object}
	 */
	Tremolo.defaults = {
		"frequency" : 10,
		"type" : "sine",
		"depth" : 0.5,
		"spread" : 180,
	};

	/**
	 * Start the tremolo.
	 * @param {Time} [time=now] When the tremolo begins.
	 * @returns {Tremolo} this
	 */
	Tremolo.prototype.start = function(time){
		this._lfoL.start(time);
		this._lfoR.start(time);
		return this;
	};

	/**
	 * Stop the tremolo.
	 * @param {Time} [time=now] When the tremolo stops.
	 * @returns {Tremolo} this
	 */
	Tremolo.prototype.stop = function(time){
		this._lfoL.stop(time);
		this._lfoR.stop(time);
		return this;
	};

	/**
	 * Sync the effect to the transport.
	 * @param {Time} [delay=0] Delay time before starting the effect after the
	 *                              Transport has started.
	 * @returns {AutoFilter} this
	 */
	Tremolo.prototype.sync = function(delay){
		this._lfoL.sync(delay);
		this._lfoR.sync(delay);
		return this;
	};

	/**
	 * Unsync the filter from the transport
	 * @returns {Tremolo} this
	 */
	Tremolo.prototype.unsync = function(){
		this._lfoL.unsync();
		this._lfoR.unsync();
		return this;
	};

	/**
	 * The Tremolo's oscillator type.
	 * @memberOf Tremolo#
	 * @type {string}
	 * @name type
	 */
	Object.defineProperty(Tremolo.prototype, "type", {
		get : function(){
			return this._lfoL.type;
		},
		set : function(type){
			this._lfoL.type = type;
			this._lfoR.type = type;
		}
	});

	/**
	 * Amount of stereo spread. When set to 0, both LFO's will be panned centrally.
	 * When set to 180, LFO's will be panned hard left and right respectively.
	 * @memberOf Tremolo#
	 * @type {Degrees}
	 * @name spread
	 */
	Object.defineProperty(Tremolo.prototype, "spread", {
		get : function(){
			return this._lfoR.phase - this._lfoL.phase; //180
		},
		set : function(spread){
			this._lfoL.phase = 90 - (spread/2);
			this._lfoR.phase = (spread/2) + 90;
		}
	});

	/**
	 *  clean up
	 *  @returns {Tremolo} this
	 */
	Tremolo.prototype.dispose = function(){
		StereoEffect.prototype.dispose.call(this);
		this._writable(["frequency", "depth"]);
		this._lfoL.dispose();
		this._lfoL = null;
		this._lfoR.dispose();
		this._lfoR = null;
		this._amplitudeL.dispose();
		this._amplitudeL = null;
		this._amplitudeR.dispose();
		this._amplitudeR = null;
		this.frequency = null;
		this.depth = null;
		return this;
	};
