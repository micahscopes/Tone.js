import { Tone } from 'core/Tone';

import { Signal } from 'signal/Signal'

import { Expr } from 'signal/Expr';

import { EqualPowerGain } from 'signal/EqualPowerGain';

import { Gain } from 'core/Gain';


"use strict";

/**
 * @class  Crossfade provides equal power fading between two inputs.
 *         More on crossfading technique [here](https://en.wikipedia.org/wiki/Fade_(audio_engineering)#Crossfading).
 *
 * @constructor
 * @extends {Tone}
 * @param {NormalRange} [initialFade=0.5]
 * @example
 * var crossFade = new CrossFade(0.5);
 * //connect effect A to crossfade from
 * //effect output 0 to crossfade input 0
 * effectA.connect(crossFade, 0, 0);
 * //connect effect B to crossfade from
 * //effect output 0 to crossfade input 1
 * effectB.connect(crossFade, 0, 1);
 * crossFade.fade.value = 0;
 * // ^ only effectA is output
 * crossFade.fade.value = 1;
 * // ^ only effectB is output
 * crossFade.fade.value = 0.5;
 * // ^ the two signals are mixed equally.
 */
export var CrossFade = function(initialFade){

	this.createInsOuts(2, 1);

	/**
	 *  Alias for <code>input[0]</code>.
	 *  @type {Gain}
	 */
	this.a = this.input[0] = new Gain();

	/**
	 *  Alias for <code>input[1]</code>.
	 *  @type {Gain}
	 */
	this.b = this.input[1] = new Gain();

	/**
	 * 	The mix between the two inputs. A fade value of 0
	 * 	will output 100% <code>input[0]</code> and
	 * 	a value of 1 will output 100% <code>input[1]</code>.
	 *  @type {NormalRange}
	 *  @signal
	 */
	this.fade = new Signal(this.defaultArg(initialFade, 0.5), Type.NormalRange);

	/**
	 *  equal power gain cross fade
	 *  @private
	 *  @type {EqualPowerGain}
	 */
	this._equalPowerA = new EqualPowerGain();

	/**
	 *  equal power gain cross fade
	 *  @private
	 *  @type {EqualPowerGain}
	 */
	this._equalPowerB = new EqualPowerGain();

	/**
	 *  invert the incoming signal
	 *  @private
	 *  @type {Tone}
	 */
	this._invert = new Expr("1 - $0");

	//connections
	this.a.connect(this.output);
	this.b.connect(this.output);
	this.fade.chain(this._equalPowerB, this.b.gain);
	this.fade.chain(this._invert, this._equalPowerA, this.a.gain);
	this._readOnly("fade");
};

extend(CrossFade);

/**
 *  clean up
 *  @returns {CrossFade} this
 */
CrossFade.prototype.dispose = function(){
	Tone.prototype.dispose.call(this);
	this._writable("fade");
	this._equalPowerA.dispose();
	this._equalPowerA = null;
	this._equalPowerB.dispose();
	this._equalPowerB = null;
	this.fade.dispose();
	this.fade = null;
	this._invert.dispose();
	this._invert = null;
	this.a.dispose();
	this.a = null;
	this.b.dispose();
	this.b = null;
	return this;
};
