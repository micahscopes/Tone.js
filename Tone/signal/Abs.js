import { Tone } from 'core/Tone';

import { WaveShaper } from 'signal/WaveShaper';

import { SignalBase } from 'signal/SignalBase';


	"use strict";

	/**
	 *  @class Return the absolute value of an incoming signal.
	 *
	 *  @constructor
	 *  @extends {SignalBase}
	 *  @example
	 * var signal = new Signal(-1);
	 * var abs = new Abs();
	 * signal.connect(abs);
	 * //the output of abs is 1.
	 */
	export var Abs = function(){
		/**
		 *  @type {LessThan}
		 *  @private
		 */
		this._abs = this.input = this.output = new WaveShaper(function(val){
			if (val === 0){
				return 0;
			} else {
				return Math.abs(val);
			}
		}, 127);
	};

	Tone.extend(Abs, SignalBase);

	/**
	 *  dispose method
	 *  @returns {Abs} this
	 */
	Abs.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._abs.dispose();
		this._abs = null;
		return this;
	};
