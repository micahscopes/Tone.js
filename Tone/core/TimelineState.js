import { Tone } from 'core/Tone';

import { Timeline } from 'core/Timeline';

import { Type } from 'type/Type';


	"use strict";

	/**
	 *  @class  A Timeline State. Provides the methods: <code>setStateAtTime("state", time)</code>
	 *          and <code>getValueAtTime(time)</code>.
	 *
	 *  @extends {Timeline}
	 *  @param {String} initial The initial state of the TimelineState.
	 *                          Defaults to <code>undefined</code>
	 */
	export var TimelineState = function(initial){

		Timeline.call(this);

		/**
		 *  The initial state
		 *  @private
		 *  @type {String}
		 */
		this._initial = initial;
	};

	Tone.extend(TimelineState, Timeline);

	/**
	 *  Returns the scheduled state scheduled before or at
	 *  the given time.
	 *  @param  {Number}  time  The time to query.
	 *  @return  {String}  The name of the state input in setStateAtTime.
	 */
	TimelineState.prototype.getValueAtTime = function(time){
		var event = this.get(time);
		if (event !== null){
			return event.state;
		} else {
			return this._initial;
		}
	};

	/**
	 *  Returns the scheduled state scheduled before or at
	 *  the given time.
	 *  @param  {String}  state The name of the state to set.
	 *  @param  {Number}  time  The time to query.
	 */
	TimelineState.prototype.setStateAtTime = function(state, time){
		this.add({
			"state" : state,
			"time" : time
		});
	};
