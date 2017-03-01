import { Tone } from 'core/Tone';

import { Signal } from 'signal/Signal';

import { Gain } from 'core/Gain';


	"use strict";

	/**
	 *  @class  Multiply two incoming signals. Or, if a number is given in the constructor,
	 *          multiplies the incoming signal by that value.
	 *
	 *  @constructor
	 *  @extends {Signal}
	 *  @param {number=} value Constant value to multiple. If no value is provided,
	 *                         it will return the product of the first and second inputs
	 *  @example
	 * var mult = new Multiply();
	 * var sigA = new Signal(3);
	 * var sigB = new Signal(4);
	 * sigA.connect(mult, 0, 0);
	 * sigB.connect(mult, 0, 1);
	 * //output of mult is 12.
	 *  @example
	 * var mult = new Multiply(10);
	 * var sig = new Signal(2).connect(mult);
	 * //the output of mult is 20.
	 */
	export var Multiply = function(value){

		this.createInsOuts(2, 0);

		/**
		 *  the input node is the same as the output node
		 *  it is also the GainNode which handles the scaling of incoming signal
		 *
		 *  @type {GainNode}
		 *  @private
		 */
		this._mult = this.input[0] = this.output = new Gain();

		/**
		 *  the scaling parameter
		 *  @type {AudioParam}
		 *  @private
		 */
		this._param = this.input[1] = this.output.gain;

		this._param.value = this.defaultArg(value, 0);
	};

	Tone.extend(Multiply, Signal);

	/**
	 *  clean up
	 *  @returns {Multiply} this
	 */
	Multiply.prototype.dispose = function(){
		prototype.dispose.call(this);
		this._mult.dispose();
		this._mult = null;
		this._param = null;
		return this;
	};
