import { Tone } from 'core';
import { Add } from 'signal';
import { Multiply } from 'signal';

	"use strict";

	/**
	 *  @class Normalize takes an input min and max and maps it linearly to NormalRange [0,1]
	 *
	 *  @extends {SignalBase}
	 *  @constructor
	 *  @param {number} inputMin the min input value
	 *  @param {number} inputMax the max input value
	 *  @example
	 * var norm = new Normalize(2, 4);
	 * var sig = new Signal(3).connect(norm);
	 * //output of norm is 0.5.
	 */
	export function Normalize(inputMin, inputMax){

		/**
		 *  the min input value
		 *  @type {number}
		 *  @private
		 */
		this._inputMin = this.defaultArg(inputMin, 0);

		/**
		 *  the max input value
		 *  @type {number}
		 *  @private
		 */
		this._inputMax = this.defaultArg(inputMax, 1);

		/**
		 *  subtract the min from the input
		 *  @type {Add}
		 *  @private
		 */
		this._sub = this.input = new Add(0);

		/**
		 *  divide by the difference between the input and output
		 *  @type {Multiply}
		 *  @private
		 */
		this._div = this.output = new Multiply(1);

		this._sub.connect(this._div);
		this._setRange();
	};

	Tone.extend(Normalize, SignalBase);

	/**
	 * The minimum value the input signal will reach.
	 * @memberOf Normalize#
	 * @type {number}
	 * @name min
	 */
	Object.defineProperty(Normalize.prototype, "min", {
		get : function(){
			return this._inputMin;
		},
		set : function(min){
			this._inputMin = min;
			this._setRange();
		}
	});

	/**
	 * The maximum value the input signal will reach.
	 * @memberOf Normalize#
	 * @type {number}
	 * @name max
	 */
	Object.defineProperty(Normalize.prototype, "max", {
		get : function(){
			return this._inputMax;
		},
		set : function(max){
			this._inputMax = max;
			this._setRange();
		}
	});

	/**
	 *  set the values
	 *  @private
	 */
	Normalize.prototype._setRange = function() {
		this._sub.value = -this._inputMin;
		this._div.value = 1 / (this._inputMax - this._inputMin);
	};

	/**
	 *  clean up
	 *  @returns {Normalize} this
	 */
	Normalize.prototype.dispose = function(){
		prototype.dispose.call(this);
		this._sub.dispose();
		this._sub = null;
		this._div.dispose();
		this._div = null;
		return this;
	};
