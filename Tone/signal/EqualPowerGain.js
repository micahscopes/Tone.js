import { Tone } from 'core/Tone';

import { WaveShaper } from 'signal/WaveShaper';


	"use strict";

	/**
	 *  @class Convert an incoming signal between 0, 1 to an equal power gain scale.
	 *
	 *  @extends {SignalBase}
	 *  @constructor
	 *  @example
	 * var eqPowGain = new EqualPowerGain();
	 */
	export var EqualPowerGain = function(){

		/**
		 *  @type {WaveShaper}
		 *  @private
		 */
		this._eqPower = this.input = this.output = new WaveShaper(function(val){
			if (Math.abs(val) < 0.001){
				//should output 0 when input is 0
				return 0;
			} else {
				return this.equalPowerScale(val);
			}
		}.bind(this), 4096);
	};

	Tone.extend(EqualPowerGain, SignalBase);

	/**
	 *  clean up
	 *  @returns {EqualPowerGain} this
	 */
	EqualPowerGain.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._eqPower.dispose();
		this._eqPower = null;
		return this;
	};
