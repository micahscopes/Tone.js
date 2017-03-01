import { Tone } from 'core/Tone';

import { Add } from 'signal/Add';

import { Negate } from 'signal/Negate';

import { Signal } from 'signal/Signal';

import { Gain } from 'core/Gain';


	"use strict";

	/**
	 *  @class Subtract the signal connected to <code>input[1]</code> from the signal connected
	 *         to <code>input[0]</code>. If an argument is provided in the constructor, the
	 *         signals <code>.value</code> will be subtracted from the incoming signal.
	 *
	 *  @extends {Signal}
	 *  @constructor
	 *  @param {number=} value The value to subtract from the incoming signal. If the value
	 *                         is omitted, it will subtract the second signal from the first.
	 *  @example
	 * var sub = new Subtract(1);
	 * var sig = new Signal(4).connect(sub);
	 * //the output of sub is 3.
	 *  @example
	 * var sub = new Subtract();
	 * var sigA = new Signal(10);
	 * var sigB = new Signal(2.5);
	 * sigA.connect(sub, 0, 0);
	 * sigB.connect(sub, 0, 1);
	 * //output of sub is 7.5
	 */
	export var Subtract = function(value){

		this.createInsOuts(2, 0);

		/**
		 *  the summing node
		 *  @type {GainNode}
		 *  @private
		 */
		this._sum = this.input[0] = this.output = new Gain();

		/**
		 *  negate the input of the second input before connecting it
		 *  to the summing node.
		 *  @type {Negate}
		 *  @private
		 */
		this._neg = new Negate();

		/**
		 *  the node where the value is set
		 *  @private
		 *  @type {Signal}
		 */
		this._param = this.input[1] = new Signal(value);

		this._param.chain(this._neg, this._sum);
	};

	Tone.extend(Subtract, Signal);

	/**
	 *  Clean up.
	 *  @returns {SignalBase} this
	 */
	Subtract.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._neg.dispose();
		this._neg = null;
		this._sum.disconnect();
		this._sum = null;
		this._param.dispose();
		this._param = null;
		return this;
	};
