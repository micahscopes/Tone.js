import { Tone } from 'core';
import { Timeline } from 'core';

	"use strict";

	/**
	 *  @class Draw is useful for synchronizing visuals and audio events.
	 *         Callbacks from Transport or any of the Event classes
	 *         always happen _before_ the scheduled time and are not synchronized
	 *         to the animation frame so they are not good for triggering tightly
	 *         synchronized visuals and sound. Draw makes it easy to schedule
	 *         callbacks using the AudioContext time and uses requestAnimationFrame.
	 *
	 *  @singleton
	 *  @extends {Tone}
	 *  @example
	 * Transport.schedule(function(time){
	 * 	//use the time argument to schedule a callback with Draw
	 * 	Draw.schedule(function(){
	 * 		//do drawing or DOM manipulation here
	 * 	}, time)
	 * }, "+0.5")
	 */
	export var Draw = function(){
		/**
		 *  All of the events.
		 *  @type  {Timeline}
		 *  @private
		 */
		this._events = new Timeline();

		/**
		 *  The duration after which events are not invoked.
		 *  @type  {Number}
		 *  @default 0.25
		 */
		this.expiration = 0.25;

		/**
		 *  The amount of time before the scheduled time
		 *  that the callback can be invoked. Default is
		 *  half the time of an animation frame (0.008 seconds).
		 *  @type  {Number}
		 *  @default 0.008
		 */
		this.anticipation = 0.008;

		/**
		 *  The draw loop
		 *  @type  {Function}
		 *  @private
		 */
		this._boundDrawLoop = this._drawLoop.bind(this);
	};

	Tone.extend(Draw);

	/**
	 *  Schedule a function at the given time to be invoked
	 *  on the nearest animation frame.
	 *  @param  {Function}  callback  Callback is invoked at the given time.
	 *  @param  {Time}    time      The time relative to the AudioContext time
	 *                              to invoke the callback.
	 *  @return  {Draw}    this
	 */
	Draw.prototype.schedule = function(callback, time){
		this._events.add({
			callback : callback,
			time : this.toSeconds(time)
		});
		//start the draw loop on the first event
		if (this._events.length === 1){
			requestAnimationFrame(this._boundDrawLoop);
		}
		return this;
	};

	/**
	 *  Cancel events scheduled after the given time
	 *  @param  {Time=}  after  Time after which scheduled events will
	 *                          be removed from the scheduling timeline.
	 *  @return  {Draw}  this
	 */
	Draw.prototype.cancel = function(after){
		this._events.cancel(this.toSeconds(after));
		return this;
	};

	/**
	 *  The draw loop
	 *  @private
	 */
	Draw.prototype._drawLoop = function(){
		var now = Tone.now();
		while(this._events.length && this._events.peek().time - this.anticipation <= now){
			var event = this._events.shift();
			if (now - event.time <= this.expiration){
				event.callback();
			}
		}
		if (this._events.length > 0){
			requestAnimationFrame(this._boundDrawLoop);
		}
	};

	//make a singleton
	Draw = new Draw();
