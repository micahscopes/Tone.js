import { Tone } from 'core/Tone';

import { Follower } from 'component/Follower';

import { GreaterThan } from 'signal/GreaterThan';


	"use strict";

	/**
	 *  @class  Gate only passes a signal through when the incoming
	 *          signal exceeds a specified threshold. To do this, Gate uses
	 *          a Follower to follow the amplitude of the incoming signal.
	 *          A common implementation of this class is a [Noise Gate](https://en.wikipedia.org/wiki/Noise_gate).
	 *
	 *  @constructor
	 *  @extends {Tone}
	 *  @param {Decibels|Object} [threshold] The threshold above which the gate will open.
	 *  @param {Time=} attack The follower's attack time
	 *  @param {Time=} release The follower's release time
	 *  @example
	 * var gate = new Gate(-30, 0.2, 0.3).toMaster();
	 * var mic = new UserMedia().connect(gate);
	 * //the gate will only pass through the incoming
	 * //signal when it's louder than -30db
	 */
	export var Gate = function(){

		this.createInsOuts(1, 1);
		var options = this.optionsObject(arguments, ["threshold", "attack", "release"], Gate.defaults);

		/**
		 *  @type {Follower}
		 *  @private
		 */
		this._follower = new Follower(options.attack, options.release);

		/**
		 *  @type {GreaterThan}
		 *  @private
		 */
		this._gt = new GreaterThan(this.dbToGain(options.threshold));

		//the connections
		this.input.connect(this.output);
		//the control signal
		this.input.chain(this._gt, this._follower, this.output.gain);
	};

	Tone.extend(Gate);

	/**
	 *  @const
	 *  @static
	 *  @type {Object}
	 */
	Gate.defaults = {
		"attack" : 0.1,
		"release" : 0.1,
		"threshold" : -40
	};

	/**
	 * The threshold of the gate in decibels
	 * @memberOf Gate#
	 * @type {Decibels}
	 * @name threshold
	 */
	Object.defineProperty(Gate.prototype, "threshold", {
		get : function(){
			return this.gainToDb(this._gt.value);
		},
		set : function(thresh){
			this._gt.value = this.dbToGain(thresh);
		}
	});

	/**
	 * The attack speed of the gate
	 * @memberOf Gate#
	 * @type {Time}
	 * @name attack
	 */
	Object.defineProperty(Gate.prototype, "attack", {
		get : function(){
			return this._follower.attack;
		},
		set : function(attackTime){
			this._follower.attack = attackTime;
		}
	});

	/**
	 * The release speed of the gate
	 * @memberOf Gate#
	 * @type {Time}
	 * @name release
	 */
	Object.defineProperty(Gate.prototype, "release", {
		get : function(){
			return this._follower.release;
		},
		set : function(releaseTime){
			this._follower.release = releaseTime;
		}
	});

	/**
	 *  Clean up.
	 *  @returns {Gate} this
	 */
	Gate.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._follower.dispose();
		this._gt.dispose();
		this._follower = null;
		this._gt = null;
		return this;
	};
