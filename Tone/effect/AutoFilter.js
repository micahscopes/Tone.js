import { Tone } from 'core';
import { Effect } from 'effect';
import { LFO } from 'component';
import { Filter } from 'component';

	"use strict";

	/**
	 *  @class AutoFilter is a Filter with a LFO connected to the filter cutoff frequency.
	 *         Setting the LFO rate and depth allows for control over the filter modulation rate
	 *         and depth.
	 *
	 *  @constructor
	 *  @extends {Effect}
	 *  @param {Time|Object} [frequency] The rate of the LFO.
	 *  @param {Frequency=} baseFrequency The lower value of the LFOs oscillation
 	 *  @param {Frequency=} octaves The number of octaves above the baseFrequency
	 *  @example
	 * //create an autofilter and start it's LFO
	 * var autoFilter = new AutoFilter("4n").toMaster().start();
	 * //route an oscillator through the filter and start it
	 * var oscillator = new Oscillator().connect(autoFilter).start();
	 */
	export function AutoFilter(){

		var options = this.optionsObject(arguments, ["frequency", "baseFrequency", "octaves"], AutoFilter.defaults);
		Effect.call(this, options);

		/**
		 *  the lfo which drives the filter cutoff
		 *  @type {LFO}
		 *  @private
		 */
		this._lfo = new LFO({
			"frequency" : options.frequency,
			"amplitude" : options.depth,
		});

		/**
		 * The range of the filter modulating between the min and max frequency.
		 * 0 = no modulation. 1 = full modulation.
		 * @type {NormalRange}
		 * @signal
		 */
		this.depth = this._lfo.amplitude;

		/**
		 * How fast the filter modulates between min and max.
		 * @type {Frequency}
		 * @signal
		 */
		this.frequency = this._lfo.frequency;

		/**
		 *  The filter node
		 *  @type {Filter}
		 */
		this.filter = new Filter(options.filter);

		/**
		 *  The octaves placeholder
		 *  @type {Positive}
		 *  @private
		 */
		this._octaves = 0;

		//connections
		this.connectEffect(this.filter);
		this._lfo.connect(this.filter.frequency);
		this.type = options.type;
		this._readOnly(["frequency", "depth"]);
		this.octaves = options.octaves;
		this.baseFrequency = options.baseFrequency;
	};

	//extend Effect
	Tone.extend(AutoFilter, Effect);

	/**
	 *  defaults
	 *  @static
	 *  @type {Object}
	 */
	AutoFilter.defaults = {
		"frequency" : 1,
		"type" : "sine",
		"depth" : 1,
		"baseFrequency" : 200,
		"octaves" : 2.6,
		"filter" : {
			"type" : "lowpass",
			"rolloff" : -12,
			"Q" : 1,
		}
	};

	/**
	 * Start the effect.
	 * @param {Time} [time=now] When the LFO will start.
	 * @returns {AutoFilter} this
	 */
	AutoFilter.prototype.start = function(time){
		this._lfo.start(time);
		return this;
	};

	/**
	 * Stop the effect.
	 * @param {Time} [time=now] When the LFO will stop.
	 * @returns {AutoFilter} this
	 */
	AutoFilter.prototype.stop = function(time){
		this._lfo.stop(time);
		return this;
	};

	/**
	 * Sync the filter to the transport.
	 * @param {Time} [delay=0] Delay time before starting the effect after the
	 *                               Transport has started.
	 * @returns {AutoFilter} this
	 */
	AutoFilter.prototype.sync = function(delay){
		this._lfo.sync(delay);
		return this;
	};

	/**
	 * Unsync the filter from the transport.
	 * @returns {AutoFilter} this
	 */
	AutoFilter.prototype.unsync = function(){
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
	Object.defineProperty(AutoFilter.prototype, "type", {
		get : function(){
			return this._lfo.type;
		},
		set : function(type){
			this._lfo.type = type;
		}
	});

	/**
	 * The minimum value of the filter's cutoff frequency.
	 * @memberOf AutoFilter#
	 * @type {Frequency}
	 * @name min
	 */
	Object.defineProperty(AutoFilter.prototype, "baseFrequency", {
		get : function(){
			return this._lfo.min;
		},
		set : function(freq){
			this._lfo.min = this.toFrequency(freq);
			//and set the max
			this.octaves = this._octaves;
		}
	});

	/**
	 * The maximum value of the filter's cutoff frequency.
	 * @memberOf AutoFilter#
	 * @type {Positive}
	 * @name octaves
	 */
	Object.defineProperty(AutoFilter.prototype, "octaves", {
		get : function(){
			return this._octaves;
		},
		set : function(oct){
			this._octaves = oct;
			this._lfo.max = this.baseFrequency * Math.pow(2, oct);
		}
	});

	/**
	 *  Clean up.
	 *  @returns {AutoFilter} this
	 */
	AutoFilter.prototype.dispose = function(){
		Effect.prototype.dispose.call(this);
		this._lfo.dispose();
		this._lfo = null;
		this.filter.dispose();
		this.filter = null;
		this._writable(["frequency", "depth"]);
		this.frequency = null;
		this.depth = null;
		return this;
	};
