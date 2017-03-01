import { Tone } from 'core/Tone';

import { WaveShaper } from 'signal/WaveShaper';

import { Multiply } from 'signal/Multiply';

import { Subtract } from 'signal/Subtract';


	"use strict";

	/**
	 *  @class Signal-rate modulo operator. Only works in AudioRange [-1, 1] and for modulus
	 *         values in the NormalRange.
	 *
	 *  @constructor
	 *  @extends {SignalBase}
	 *  @param {NormalRange} modulus The modulus to apply.
	 *  @example
	 * var mod = new Modulo(0.2)
	 * var sig = new Signal(0.5).connect(mod);
	 * //mod outputs 0.1
	 */
	export var Modulo = function(modulus){

		this.createInsOuts(1, 0);

		/**
		 *  A waveshaper gets the integer multiple of
		 *  the input signal and the modulus.
		 *  @private
		 *  @type {WaveShaper}
		 */
		this._shaper = new WaveShaper(Math.pow(2, 16));

		/**
		 *  the integer multiple is multiplied by the modulus
		 *  @type  {Multiply}
		 *  @private
		 */
		this._multiply = new Multiply();

		/**
		 *  and subtracted from the input signal
		 *  @type  {Subtract}
		 *  @private
		 */
		this._subtract = this.output = new Subtract();

		/**
		 *  the modulus signal
		 *  @type  {Signal}
		 *  @private
		 */
		this._modSignal = new Signal(modulus);

		//connections
		this.input.fan(this._shaper, this._subtract);
		this._modSignal.connect(this._multiply, 0, 0);
		this._shaper.connect(this._multiply, 0, 1);
		this._multiply.connect(this._subtract, 0, 1);
		this._setWaveShaper(modulus);
	};

	Tone.extend(Modulo, SignalBase);

	/**
	 *  @param  {number}  mod  the modulus to apply
	 *  @private
	 */
	Modulo.prototype._setWaveShaper = function(mod){
		this._shaper.setMap(function(val){
			var multiple = Math.floor((val + 0.0001) / mod);
			return multiple;
		});
	};

	/**
	 * The modulus value.
	 * @memberOf Modulo#
	 * @type {NormalRange}
	 * @name value
	 */
	Object.defineProperty(Modulo.prototype, "value", {
		get : function(){
			return this._modSignal.value;
		},
		set : function(mod){
			this._modSignal.value = mod;
			this._setWaveShaper(mod);
		}
	});

	/**
	 * clean up
	 *  @returns {Modulo} this
	 */
	Modulo.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._shaper.dispose();
		this._shaper = null;
		this._multiply.dispose();
		this._multiply = null;
		this._subtract.dispose();
		this._subtract = null;
		this._modSignal.dispose();
		this._modSignal = null;
		return this;
	};
