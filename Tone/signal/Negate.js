import { Tone } from 'core/Tone';

import { Multiply } from 'signal/Multiply';

import { Signal } from 'signal/Signal';


	"use strict";

	/**
	 *  @class Negate the incoming signal. i.e. an input signal of 10 will output -10
	 *
	 *  @constructor
	 *  @extends {SignalBase}
	 *  @example
	 * var neg = new Negate();
	 * var sig = new Signal(-2).connect(neg);
	 * //output of neg is positive 2.
	 */
	export var Negate = function(){
		/**
		 *  negation is done by multiplying by -1
		 *  @type {Multiply}
		 *  @private
		 */
		this._multiply = this.input = this.output = new Multiply(-1);
	};

	Tone.extend(Negate, SignalBase);

	/**
	 *  clean up
	 *  @returns {Negate} this
	 */
	Negate.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._multiply.dispose();
		this._multiply = null;
		return this;
	};
