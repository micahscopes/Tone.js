import { Tone } from 'core/Tone';

import { SignalBase } from 'signal/SignalBase';


	"use strict";

	/**
	 *  @class Wraps the native Web Audio API
	 *         [WaveShaperNode](http://webaudio.github.io/web-audio-api/#the-waveshapernode-interface).
	 *
	 *  @extends {SignalBase}
	 *  @constructor
	 *  @param {function|Array|Number} mapping The function used to define the values.
	 *                                    The mapping function should take two arguments:
	 *                                    the first is the value at the current position
	 *                                    and the second is the array position.
	 *                                    If the argument is an array, that array will be
	 *                                    set as the wave shaping function. The input
	 *                                    signal is an AudioRange [-1, 1] value and the output
	 *                                    signal can take on any numerical values.
	 *
	 *  @param {Number} [bufferLen=1024] The length of the WaveShaperNode buffer.
	 *  @example
	 * var timesTwo = new WaveShaper(function(val){
	 * 	return val * 2;
	 * }, 2048);
	 *  @example
	 * //a waveshaper can also be constructed with an array of values
	 * var invert = new WaveShaper([1, -1]);
	 */
	export var WaveShaper = function(mapping, bufferLen){

		/**
		 *  the waveshaper
		 *  @type {WaveShaperNode}
		 *  @private
		 */
		this._shaper = this.input = this.output = this.context.createWaveShaper();

		/**
		 *  the waveshapers curve
		 *  @type {Float32Array}
		 *  @private
		 */
		this._curve = null;

		if (Array.isArray(mapping)){
			this.curve = mapping;
		} else if (isFinite(mapping) || this.isUndef(mapping)){
			this._curve = new Float32Array(this.defaultArg(mapping, 1024));
		} else if (this.isFunction(mapping)){
			this._curve = new Float32Array(this.defaultArg(bufferLen, 1024));
			this.setMap(mapping);
		}
	};

	Tone.extend(WaveShaper, SignalBase);

	/**
	 *  Uses a mapping function to set the value of the curve.
	 *  @param {function} mapping The function used to define the values.
	 *                            The mapping function take two arguments:
	 *                            the first is the value at the current position
	 *                            which goes from -1 to 1 over the number of elements
	 *                            in the curve array. The second argument is the array position.
	 *  @returns {WaveShaper} this
	 *  @example
	 * //map the input signal from [-1, 1] to [0, 10]
	 * shaper.setMap(function(val, index){
	 * 	return (val + 1) * 5;
	 * })
	 */
	WaveShaper.prototype.setMap = function(mapping){
		for (var i = 0, len = this._curve.length; i < len; i++){
			var normalized = (i / (len - 1)) * 2 - 1;
			this._curve[i] = mapping(normalized, i);
		}
		this._shaper.curve = this._curve;
		return this;
	};

	/**
	 * The array to set as the waveshaper curve. For linear curves
	 * array length does not make much difference, but for complex curves
	 * longer arrays will provide smoother interpolation.
	 * @memberOf WaveShaper#
	 * @type {Array}
	 * @name curve
	 */
	Object.defineProperty(WaveShaper.prototype, "curve", {
		get : function(){
			return this._shaper.curve;
		},
		set : function(mapping){
			this._curve = new Float32Array(mapping);
			this._shaper.curve = this._curve;
		}
	});

	/**
	 * Specifies what type of oversampling (if any) should be used when
	 * applying the shaping curve. Can either be "none", "2x" or "4x".
	 * @memberOf WaveShaper#
	 * @type {string}
	 * @name oversample
	 */
	Object.defineProperty(WaveShaper.prototype, "oversample", {
		get : function(){
			return this._shaper.oversample;
		},
		set : function(oversampling){
			if (["none", "2x", "4x"].indexOf(oversampling) !== -1){
				this._shaper.oversample = oversampling;
			} else {
				throw new RangeError("WaveShaper: oversampling must be either 'none', '2x', or '4x'");
			}
		}
	});

	/**
	 *  Clean up.
	 *  @returns {WaveShaper} this
	 */
	WaveShaper.prototype.dispose = function(){
		prototype.dispose.call(this);
		this._shaper.disconnect();
		this._shaper = null;
		this._curve = null;
		return this;
	};
