import { Tone } from 'core/Tone';

import { Param } from 'core/Param';


	"use strict";

/**
 *  @class Compressor is a thin wrapper around the Web Audio
 *         [DynamicsCompressorNode](http://webaudio.github.io/web-audio-api/#the-dynamicscompressornode-interface).
 *         Compression reduces the volume of loud sounds or amplifies quiet sounds
 *         by narrowing or "compressing" an audio signal's dynamic range.
 *         Read more on [Wikipedia](https://en.wikipedia.org/wiki/Dynamic_range_compression).
 *
 *  @extends {Tone}
 *  @constructor
 *  @param {Decibels|Object} [threshold] The value above which the compression starts to be applied.
 *  @param {Positive} [ratio] The gain reduction ratio.
 *  @example
 * var comp = new Compressor(-30, 3);
 */
export var Compressor = function(){

	var options = this.optionsObject(arguments, ["threshold", "ratio"], Compressor.defaults);

	/**
	 *  the compressor node
	 *  @type {DynamicsCompressorNode}
	 *  @private
	 */
	this._compressor = this.input = this.output = this.context.createDynamicsCompressor();

	/**
	 *  the threshold vaue
	 *  @type {Decibels}
	 *  @signal
	 */
	this.threshold = new Param({
		"param" : this._compressor.threshold,
		"units" : Type.Decibels,
		"convert" : false
	});

	/**
	 *  The attack parameter
	 *  @type {Time}
	 *  @signal
	 */
	this.attack = new Param(this._compressor.attack, Type.Time);

	/**
	 *  The release parameter
	 *  @type {Time}
	 *  @signal
	 */
	this.release = new Param(this._compressor.release, Type.Time);

	/**
	 *  The knee parameter
	 *  @type {Decibels}
	 *  @signal
	 */
	this.knee = new Param({
		"param" : this._compressor.knee,
		"units" : Type.Decibels,
		"convert" : false
	});

	/**
	 *  The ratio value
	 *  @type {Number}
	 *  @signal
	 */
	this.ratio = new Param({
		"param" : this._compressor.ratio,
		"convert" : false
	});

	//set the defaults
	this._readOnly(["knee", "release", "attack", "ratio", "threshold"]);
	this.set(options);
};

extend(Compressor);

/**
 *  @static
 *  @const
 *  @type {Object}
 */
Compressor.defaults = {
	"ratio" : 12,
	"threshold" : -24,
	"release" : 0.25,
	"attack" : 0.003,
	"knee" : 30
};

/**
 *  clean up
 *  @returns {Compressor} this
 */
Compressor.prototype.dispose = function(){
	Tone.prototype.dispose.call(this);
	this._writable(["knee", "release", "attack", "ratio", "threshold"]);
	this._compressor.disconnect();
	this._compressor = null;
	this.attack.dispose();
	this.attack = null;
	this.release.dispose();
	this.release = null;
	this.threshold.dispose();
	this.threshold = null;
	this.ratio.dispose();
	this.ratio = null;
	this.knee.dispose();
	this.knee = null;
	return this;
};
