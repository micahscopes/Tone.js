import { Tone } from 'core/Tone';

/*
import { Abs } from 'signal/Abs';

import { Subtract } from 'signal/Subtract';

import { Multiply } from 'signal/Multiply';

import { Signal } from 'signal/Signal';

import { WaveShaper } from 'signal/WaveShaper';

import { Type } from 'type/Type';

import { Delay } from 'core/Delay';
*/

	"use strict";

	/**
	 *  @class  Follower is a  crude envelope follower which will follow
	 *          the amplitude of an incoming signal.
	 *          Take care with small (< 0.02) attack or decay values
	 *          as follower has some ripple which is exaggerated
	 *          at these values. Read more about envelope followers (also known
	 *          as envelope detectors) on [Wikipedia](https://en.wikipedia.org/wiki/Envelope_detector).
	 *
	 *  @constructor
	 *  @extends {Tone}
	 *  @param {Time|Object} [attack] The rate at which the follower rises.
	 *  @param {Time=} release The rate at which the folower falls.
	 *  @example
	 * var follower = new Follower(0.2, 0.4);
	 */
	export var Follower = function(){

		this.createInsOuts(1, 1);
		var options = this.optionsObject(arguments, ["attack", "release"], Follower.defaults);

		/**
		 *  @type {Abs}
		 *  @private
		 */
		this._abs = new Abs();

		/**
		 *  the lowpass filter which smooths the input
		 *  @type {BiquadFilterNode}
		 *  @private
		 */
		this._filter = this.context.createBiquadFilter();
		this._filter.type = "lowpass";
		this._filter.frequency.value = 0;
		this._filter.Q.value = -100;

		/**
		 *  @type {WaveShaperNode}
		 *  @private
		 */
		this._frequencyValues = new WaveShaper();

		/**
		 *  @type {Subtract}
		 *  @private
		 */
		this._sub = new Subtract();

		/**
		 *  @type {Delay}
		 *  @private
		 */
		this._delay = new Delay(this.blockTime);

		/**
		 *  this keeps it far from 0, even for very small differences
		 *  @type {Multiply}
		 *  @private
		 */
		this._mult = new Multiply(10000);

		/**
		 *  @private
		 *  @type {number}
		 */
		this._attack = options.attack;

		/**
		 *  @private
		 *  @type {number}
		 */
		this._release = options.release;

		//the smoothed signal to get the values
		this.input.chain(this._abs, this._filter, this.output);
		//the difference path
		this._abs.connect(this._sub, 0, 1);
		this._filter.chain(this._delay, this._sub);
		//threshold the difference and use the thresh to set the frequency
		this._sub.chain(this._mult, this._frequencyValues, this._filter.frequency);
		//set the attack and release values in the table
		this._setAttackRelease(this._attack, this._release);
	};

	Tone.extend(Follower);

	/**
	 *  @static
	 *  @type {Object}
	 */
	Follower.defaults = {
		"attack" : 0.05,
		"release" : 0.5
	};

	/**
	 *  sets the attack and release times in the wave shaper
	 *  @param   {Time} attack
	 *  @param   {Time} release
	 *  @private
	 */
	Follower.prototype._setAttackRelease = function(attack, release){
		var minTime = this.blockTime;
		attack = Time(attack).toFrequency();
		release = Time(release).toFrequency();
		attack = Math.max(attack, minTime);
		release = Math.max(release, minTime);
		this._frequencyValues.setMap(function(val){
			if (val <= 0){
				return attack;
			} else {
				return release;
			}
		});
	};

	/**
	 * The attack time.
	 * @memberOf Follower#
	 * @type {Time}
	 * @name attack
	 */
	Object.defineProperty(Follower.prototype, "attack", {
		get : function(){
			return this._attack;
		},
		set : function(attack){
			this._attack = attack;
			this._setAttackRelease(this._attack, this._release);
		}
	});

	/**
	 * The release time.
	 * @memberOf Follower#
	 * @type {Time}
	 * @name release
	 */
	Object.defineProperty(Follower.prototype, "release", {
		get : function(){
			return this._release;
		},
		set : function(release){
			this._release = release;
			this._setAttackRelease(this._attack, this._release);
		}
	});

	/**
	 *  Borrows the connect method from Signal so that the output can be used
	 *  as a Signal control signal.
	 *  @function
	 */
	Follower.prototype.connect = Signal.prototype.connect;

	/**
	 *  dispose
	 *  @returns {Follower} this
	 */
	Follower.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._filter.disconnect();
		this._filter = null;
		this._frequencyValues.disconnect();
		this._frequencyValues = null;
		this._delay.dispose();
		this._delay = null;
		this._sub.disconnect();
		this._sub = null;
		this._abs.dispose();
		this._abs = null;
		this._mult.dispose();
		this._mult = null;
		this._curve = null;
		return this;
	};
