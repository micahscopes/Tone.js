import { Tone } from 'core';
import { Effect } from 'effect';
import { WaveShaper } from 'signal';

	"use strict";

	/**
	 *  @class Distortion is a simple distortion effect using WaveShaper.
	 *         Algorithm from [a stackoverflow answer](http://stackoverflow.com/a/22313408).
	 *
	 *  @extends {Effect}
	 *  @constructor
	 *  @param {Number|Object} [distortion] The amount of distortion (nominal range of 0-1)
	 *  @example
	 * var dist = new Distortion(0.8).toMaster();
	 * var fm = new SimpleFM().connect(dist);
	 * //this sounds good on bass notes
	 * fm.triggerAttackRelease("A1", "8n");
	 */
	export function Distortion(){

		var options = this.optionsObject(arguments, ["distortion"], Distortion.defaults);

		Effect.call(this, options);

		/**
		 *  @type {WaveShaper}
		 *  @private
		 */
		this._shaper = new WaveShaper(4096);

		/**
		 * holds the distortion amount
		 * @type {number}
		 * @private
		 */
		this._distortion = options.distortion;

		this.connectEffect(this._shaper);
		this.distortion = options.distortion;
		this.oversample = options.oversample;
	};

	Tone.extend(Distortion, Effect);

	/**
	 *  @static
	 *  @const
	 *  @type {Object}
	 */
	Distortion.defaults = {
		"distortion" : 0.4,
		"oversample" : "none"
	};

	/**
	 * The amount of distortion.
	 * @memberOf Distortion#
	 * @type {NormalRange}
	 * @name distortion
	 */
	Object.defineProperty(Distortion.prototype, "distortion", {
		get : function(){
			return this._distortion;
		},
		set : function(amount){
			this._distortion = amount;
			var k = amount * 100;
			var deg = Math.PI / 180;
			this._shaper.setMap(function(x){
				if (Math.abs(x) < 0.001){
					//should output 0 when input is 0
					return 0;
				} else {
					return ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
				}
			});
		}
	});

	/**
	 * The oversampling of the effect. Can either be "none", "2x" or "4x".
	 * @memberOf Distortion#
	 * @type {string}
	 * @name oversample
	 */
	Object.defineProperty(Distortion.prototype, "oversample", {
		get : function(){
			return this._shaper.oversample;
		},
		set : function(oversampling){
			this._shaper.oversample = oversampling;
		}
	});

	/**
	 *  Clean up.
	 *  @returns {Distortion} this
	 */
	Distortion.prototype.dispose = function(){
		Effect.prototype.dispose.call(this);
		this._shaper.dispose();
		this._shaper = null;
		return this;
	};
