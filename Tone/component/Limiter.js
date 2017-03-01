import { Tone } from 'core/Tone';

import { Compressor } from 'component/Compressor';


	"use strict";

	/**
	 *  @class Limiter will limit the loudness of an incoming signal.
	 *         It is composed of a Compressor with a fast attack
	 *         and release. Limiters are commonly used to safeguard against
	 *         signal clipping. Unlike a compressor, limiters do not provide
	 *         smooth gain reduction and almost completely prevent
	 *         additional gain above the threshold.
	 *
	 *  @extends {Tone}
	 *  @constructor
	 *  @param {number} threshold The theshold above which the limiting is applied.
	 *  @example
	 *  var limiter = new Limiter(-6);
	 */
	export var Limiter = function(){

		var options = this.optionsObject(arguments, ["threshold"], Limiter.defaults);

		/**
		 *  the compressor
		 *  @private
		 *  @type {Compressor}
		 */
		this._compressor = this.input = this.output = new Compressor({
			"attack" : 0.001,
			"decay" : 0.001,
			"threshold" : options.threshold
		});

		/**
		 * The threshold of of the limiter
		 * @type {Decibel}
		 * @signal
		 */
		this.threshold = this._compressor.threshold;

		this._readOnly("threshold");
	};

	Tone.extend(Limiter);

	/**
	 *  The default value
	 *  @type {Object}
	 *  @const
	 *  @static
	 */
	Limiter.defaults = {
		"threshold" : -12
	};

	/**
	 *  Clean up.
	 *  @returns {Limiter} this
	 */
	Limiter.prototype.dispose = function(){
		prototype.dispose.call(this);
		this._compressor.dispose();
		this._compressor = null;
		this._writable("threshold");
		this.threshold = null;
		return this;
	};
