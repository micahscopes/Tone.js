import { Tone } from 'core/Tone';

import { WaveShaper } from 'signal/WaveShaper';


	"use strict";

	/**
	 *  @class Pow applies an exponent to the incoming signal. The incoming signal
	 *         must be AudioRange.
	 *
	 *  @extends {SignalBase}
	 *  @constructor
	 *  @param {Positive} exp The exponent to apply to the incoming signal, must be at least 2.
	 *  @example
	 * var pow = new Pow(2);
	 * var sig = new Signal(0.5).connect(pow);
	 * //output of pow is 0.25.
	 */
	export var Pow = function(exp){

		/**
		 * the exponent
		 * @private
		 * @type {number}
		 */
		this._exp = this.defaultArg(exp, 1);

		/**
		 *  @type {WaveShaperNode}
		 *  @private
		 */
		this._expScaler = this.input = this.output = new WaveShaper(this._expFunc(this._exp), 8192);
	};

	Tone.extend(Pow, SignalBase);

	/**
	 * The value of the exponent.
	 * @memberOf Pow#
	 * @type {number}
	 * @name value
	 */
	Object.defineProperty(Pow.prototype, "value", {
		get : function(){
			return this._exp;
		},
		set : function(exp){
			this._exp = exp;
			this._expScaler.setMap(this._expFunc(this._exp));
		}
	});


	/**
	 *  the function which maps the waveshaper
	 *  @param   {number} exp
	 *  @return {function}
	 *  @private
	 */
	Pow.prototype._expFunc = function(exp){
		return function(val){
			return Math.pow(Math.abs(val), exp);
		};
	};

	/**
	 *  Clean up.
	 *  @returns {Pow} this
	 */
	Pow.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._expScaler.dispose();
		this._expScaler = null;
		return this;
	};
