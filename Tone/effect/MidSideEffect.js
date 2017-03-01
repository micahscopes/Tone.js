import { Tone } from 'core/Tone';

import { Effect } from 'effect/Effect';

import { MidSideSplit } from 'component/MidSideSplit';

import { MidSideMerge } from 'component/MidSideMerge';


	"use strict";

	/**
	 *  @class Mid/Side processing separates the the 'mid' signal
	 *         (which comes out of both the left and the right channel)
	 *         and the 'side' (which only comes out of the the side channels)
	 *         and effects them separately before being recombined.
	 *         Applies a Mid/Side seperation and recombination.
	 *         Algorithm found in [kvraudio forums](http://www.kvraudio.com/forum/viewtopic.php?t=212587).
	 *         <br><br>
	 *         This is a base-class for Mid/Side Effects.
	 *
	 *  @extends {Effect}
	 *  @constructor
	 */
	export var MidSideEffect = function(){

		Effect.apply(this, arguments);

		/**
		 *  The mid/side split
		 *  @type  {MidSideSplit}
		 *  @private
		 */
		this._midSideSplit = new MidSideSplit();

		/**
		 *  The mid/side merge
		 *  @type  {MidSideMerge}
		 *  @private
		 */
		this._midSideMerge = new MidSideMerge();

		/**
		 *  The mid send. Connect to mid processing
		 *  @type {Expr}
		 *  @private
		 */
		this.midSend = this._midSideSplit.mid;

		/**
		 *  The side send. Connect to side processing
		 *  @type {Expr}
		 *  @private
		 */
		this.sideSend = this._midSideSplit.side;

		/**
		 *  The mid return connection
		 *  @type {GainNode}
		 *  @private
		 */
		this.midReturn = this._midSideMerge.mid;

		/**
		 *  The side return connection
		 *  @type {GainNode}
		 *  @private
		 */
		this.sideReturn = this._midSideMerge.side;

		//the connections
		this.effectSend.connect(this._midSideSplit);
		this._midSideMerge.connect(this.effectReturn);
	};

	Tone.extend(MidSideEffect, Effect);

	/**
	 *  Clean up.
	 *  @returns {MidSideEffect} this
	 */
	MidSideEffect.prototype.dispose = function(){
		Effect.prototype.dispose.call(this);
		this._midSideSplit.dispose();
		this._midSideSplit = null;
		this._midSideMerge.dispose();
		this._midSideMerge = null;
		this.midSend = null;
		this.sideSend = null;
		this.midReturn = null;
		this.sideReturn = null;
		return this;
	};
