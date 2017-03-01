import { Tone } from 'core';
import { Effect } from 'effect';
import { LFO } from 'component';
import { Panner } from 'component';

	"use strict";

	/**
	 *  @class AutoPanner is a Panner with an LFO connected to the pan amount.
	 *         More on using autopanners [here](https://www.ableton.com/en/blog/autopan-chopper-effect-and-more-liveschool/).
	 *
	 *  @constructor
	 *  @extends {Effect}
	 *  @param {Frequency|Object} [frequency] Rate of left-right oscillation.
	 *  @example
	 * //create an autopanner and start it's LFO
	 * var autoPanner = new AutoPanner("4n").toMaster().start();
	 * //route an oscillator through the panner and start it
	 * var oscillator = new Oscillator().connect(autoPanner).start();
	 */
	export function AutoPanner(){

		var options = this.optionsObject(arguments, ["frequency"], AutoPanner.defaults);
		Effect.call(this, options);

		/**
		 *  the lfo which drives the panning
		 *  @type {LFO}
		 *  @private
		 */
		this._lfo = new LFO({
			"frequency" : options.frequency,
			"amplitude" : options.depth,
			"min" : -1,
			"max" : 1,
		});

		/**
		 * The amount of panning between left and right.
		 * 0 = always center. 1 = full range between left and right.
		 * @type {NormalRange}
		 * @signal
		 */
		this.depth = this._lfo.amplitude;

		/**
		 *  the panner node which does the panning
		 *  @type {Panner}
		 *  @private
		 */
		this._panner = new Panner();

		/**
		 * How fast the panner modulates between left and right.
		 * @type {Frequency}
		 * @signal
		 */
		this.frequency = this._lfo.frequency;

		//connections
		this.connectEffect(this._panner);
		this._lfo.connect(this._panner.pan);
		this.type = options.type;
		this._readOnly(["depth", "frequency"]);
	};

	//extend Effect
	Tone.extend(AutoPanner, Effect);

	/**
	 *  defaults
	 *  @static
	 *  @type {Object}
	 */
	AutoPanner.defaults = {
		"frequency" : 1,
		"type" : "sine",
		"depth" : 1
	};

	/**
	 * Start the effect.
	 * @param {Time} [time=now] When the LFO will start.
	 * @returns {AutoPanner} this
	 */
	AutoPanner.prototype.start = function(time){
		this._lfo.start(time);
		return this;
	};

/**
	 * Stop the effect.
	 * @param {Time} [time=now] When the LFO will stop.
	 * @returns {AutoPanner} this
	 */
	AutoPanner.prototype.stop = function(time){
		this._lfo.stop(time);
		return this;
	};

	/**
	 * Sync the panner to the transport.
	 * @param {Time} [delay=0] Delay time before starting the effect after the
	 *                               Transport has started.
	 * @returns {AutoPanner} this
	 */
	AutoPanner.prototype.sync = function(delay){
		this._lfo.sync(delay);
		return this;
	};

	/**
	 * Unsync the panner from the transport
	 * @returns {AutoPanner} this
	 */
	AutoPanner.prototype.unsync = function(){
		this._lfo.unsync();
		return this;
	};

	/**
	 * Type of oscillator attached to the AutoFilter.
	 * Possible values: "sine", "square", "triangle", "sawtooth".
	 * @memberOf AutoFilter#
	 * @type {string}
	 * @name type
	 */
	Object.defineProperty(AutoPanner.prototype, "type", {
		get : function(){
			return this._lfo.type;
		},
		set : function(type){
			this._lfo.type = type;
		}
	});

	/**
	 *  clean up
	 *  @returns {AutoPanner} this
	 */
	AutoPanner.prototype.dispose = function(){
		Effect.prototype.dispose.call(this);
		this._lfo.dispose();
		this._lfo = null;
		this._panner.dispose();
		this._panner = null;
		this._writable(["depth", "frequency"]);
		this.frequency = null;
		this.depth = null;
		return this;
	};
