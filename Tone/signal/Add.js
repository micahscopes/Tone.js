import { Tone } from 'core';
import { Signal } from 'signal';
import { Gain } from 'core';

	"use strict";

	/**
	 *  @class Add a signal and a number or two signals. When no value is
	 *         passed into the constructor, Add will sum <code>input[0]</code>
	 *         and <code>input[1]</code>. If a value is passed into the constructor,
	 *         the it will be added to the input.
	 *
	 *  @constructor
	 *  @extends {Signal}
	 *  @param {number=} value If no value is provided, Add will sum the first
	 *                         and second inputs.
	 *  @example
	 * var signal = new Signal(2);
	 * var add = new Add(2);
	 * signal.connect(add);
	 * //the output of add equals 4
	 *  @example
	 * //if constructed with no arguments
	 * //it will add the first and second inputs
	 * var add = new Add();
	 * var sig0 = new Signal(3).connect(add, 0, 0);
	 * var sig1 = new Signal(4).connect(add, 0, 1);
	 * //the output of add equals 7.
	 */
	export function Add(value){

		this.createInsOuts(2, 0);

		/**
		 *  the summing node
		 *  @type {GainNode}
		 *  @private
		 */
		this._sum = this.input[0] = this.input[1] = this.output = new Gain();

		/**
		 *  @private
		 *  @type {Signal}
		 */
		this._param = this.input[1] = new Signal(value);

		this._param.connect(this._sum);
	};

	Tone.extend(Add, Signal);

	/**
	 *  Clean up.
	 *  @returns {Add} this
	 */
	Add.prototype.dispose = function(){
		prototype.dispose.call(this);
		this._sum.dispose();
		this._sum = null;
		this._param.dispose();
		this._param = null;
		return this;
	};
