import { Tone } from 'core/Tone';

import { GreaterThanZero } from 'signal/GreaterThanZero';

import { Subtract } from 'signal/Subtract';

import { Signal } from 'signal/Signal';


	"use strict";

	/**
	 *  @class  Output 1 if the signal is greater than the value, otherwise outputs 0.
	 *          can compare two signals or a signal and a number.
	 *
	 *  @constructor
	 *  @extends {Signal}
	 *  @param {number} [value=0] the value to compare to the incoming signal
	 *  @example
	 * var gt = new GreaterThan(2);
	 * var sig = new Signal(4).connect(gt);
	 * //output of gt is equal 1.
	 */
	export var GreaterThan = function(value){

		this.createInsOuts(2, 0);

		/**
		 *  subtract the amount from the incoming signal
		 *  @type {Subtract}
		 *  @private
		 */
		this._param = this.input[0] = new Subtract(value);
		this.input[1] = this._param.input[1];

		/**
		 *  compare that amount to zero
		 *  @type {GreaterThanZero}
		 *  @private
		 */
		this._gtz = this.output = new GreaterThanZero();

		//connect
		this._param.connect(this._gtz);
	};

	Tone.extend(GreaterThan, Signal);

	/**
	 *  dispose method
	 *  @returns {GreaterThan} this
	 */
	GreaterThan.prototype.dispose = function(){
		prototype.dispose.call(this);
		this._param.dispose();
		this._param = null;
		this._gtz.dispose();
		this._gtz = null;
		return this;
	};
