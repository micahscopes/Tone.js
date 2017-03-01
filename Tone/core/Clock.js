import { Tone } from 'core/Tone';

import { TimelineSignal } from 'signal/TimelineSignal';

import { TimelineState } from 'core/TimelineState';

import { Emitter } from 'core/Emitter';

import { Context } from 'core/Context';


	"use strict";

	/**
	 *  @class  A sample accurate clock which provides a callback at the given rate.
	 *          While the callback is not sample-accurate (it is still susceptible to
	 *          loose JS timing), the time passed in as the argument to the callback
	 *          is precise. For most applications, it is better to use Transport
	 *          instead of the Clock by itself since you can synchronize multiple callbacks.
	 *
	 * 	@constructor
	 *  @extends {Emitter}
	 * 	@param {function} callback The callback to be invoked with the time of the audio event
	 * 	@param {Frequency} frequency The rate of the callback
	 * 	@example
	 * //the callback will be invoked approximately once a second
	 * //and will print the time exactly once a second apart.
	 * var clock = new Clock(function(time){
	 * 	console.log(time);
	 * }, 1);
	 */
	export var Clock = function(){

		Emitter.call(this);

		var options = this.optionsObject(arguments, ["callback", "frequency"], Clock.defaults);

		/**
		 *  The callback function to invoke at the scheduled tick.
		 *  @type  {Function}
		 */
		this.callback = options.callback;

		/**
		 *  The next time the callback is scheduled.
		 *  @type {Number}
		 *  @private
		 */
		this._nextTick = 0;

		/**
		 *  The last state of the clock.
		 *  @type  {State}
		 *  @private
		 */
		this._lastState = State.Stopped;

		/**
		 *  The rate the callback function should be invoked.
		 *  @type  {BPM}
		 *  @signal
		 */
		this.frequency = new TimelineSignal(options.frequency, Type.Frequency);
		this._readOnly("frequency");

		/**
		 *  The number of times the callback was invoked. Starts counting at 0
		 *  and increments after the callback was invoked.
		 *  @type {Ticks}
		 *  @readOnly
		 */
		this.ticks = 0;

		/**
		 *  The state timeline
		 *  @type {TimelineState}
		 *  @private
		 */
		this._state = new TimelineState(State.Stopped);

		/**
		 *  The loop function bound to its context.
		 *  This is necessary to remove the event in the end.
		 *  @type {Function}
		 *  @private
		 */
		this._boundLoop = this._loop.bind(this);

		//bind a callback to the worker thread
    	this.context.on("tick", this._boundLoop);
	};

	Tone.extend(Clock, Emitter);

	/**
	 *  The defaults
	 *  @const
	 *  @type  {Object}
	 */
	Clock.defaults = {
		"callback" : Tone.noOp,
		"frequency" : 1,
		"lookAhead" : "auto",
	};

	/**
	 *  Returns the playback state of the source, either "started", "stopped" or "paused".
	 *  @type {State}
	 *  @readOnly
	 *  @memberOf Clock#
	 *  @name state
	 */
	Object.defineProperty(Clock.prototype, "state", {
		get : function(){
			return this._state.getValueAtTime(this.now());
		}
	});

	/**
	 *  Start the clock at the given time. Optionally pass in an offset
	 *  of where to start the tick counter from.
	 *  @param  {Time}  time    The time the clock should start
	 *  @param  {Ticks=}  offset  Where the tick counter starts counting from.
	 *  @return  {Clock}  this
	 */
	Clock.prototype.start = function(time, offset){
		time = this.toSeconds(time);
		if (this._state.getValueAtTime(time) !== State.Started){
			this._state.add({
				"state" : State.Started,
				"time" : time,
				"offset" : offset
			});
		}
		return this;
	};

	/**
	 *  Stop the clock. Stopping the clock resets the tick counter to 0.
	 *  @param {Time} [time=now] The time when the clock should stop.
	 *  @returns {Clock} this
	 *  @example
	 * clock.stop();
	 */
	Clock.prototype.stop = function(time){
		time = this.toSeconds(time);
		this._state.cancel(time);
		this._state.setStateAtTime(State.Stopped, time);
		return this;
	};


	/**
	 *  Pause the clock. Pausing does not reset the tick counter.
	 *  @param {Time} [time=now] The time when the clock should stop.
	 *  @returns {Clock} this
	 */
	Clock.prototype.pause = function(time){
		time = this.toSeconds(time);
		if (this._state.getValueAtTime(time) === State.Started){
			this._state.setStateAtTime(State.Paused, time);
		}
		return this;
	};

	/**
	 *  The scheduling loop.
	 *  @param  {Number}  time  The current page time starting from 0
	 *                          when the page was loaded.
	 *  @private
	 */
	Clock.prototype._loop = function(){
		//get the frequency value to compute the value of the next loop
		var now = this.now();
		//if it's started
		var lookAhead = this.context.lookAhead;
		var updateInterval = this.context.updateInterval;
		var lagCompensation = this.context.lag * 2;
		var loopInterval = now + lookAhead + updateInterval + lagCompensation;
		while (loopInterval > this._nextTick && this._state){
			var currentState = this._state.getValueAtTime(this._nextTick);
			if (currentState !== this._lastState){
				this._lastState = currentState;
				var event = this._state.get(this._nextTick);
				// emit an event
				if (currentState === State.Started){
					//correct the time
					this._nextTick = event.time;
					if (!this.isUndef(event.offset)){
						this.ticks = event.offset;
					}
					this.emit("start", event.time, this.ticks);
				} else if (currentState === State.Stopped){
					this.ticks = 0;

					this.emit("stop", event.time);
				} else if (currentState === State.Paused){
					this.emit("pause", event.time);
				}
			}
			var tickTime = this._nextTick;
			if (this.frequency){
				this._nextTick += 1 / this.frequency.getValueAtTime(this._nextTick);
				if (currentState === State.Started){
					this.callback(tickTime);
					this.ticks++;
				}
			}
		}
	};

	/**
	 *  Returns the scheduled state at the given time.
	 *  @param  {Time}  time  The time to query.
	 *  @return  {String}  The name of the state input in setStateAtTime.
	 *  @example
	 * clock.start("+0.1");
	 * clock.getStateAtTime("+0.1"); //returns "started"
	 */
	Clock.prototype.getStateAtTime = function(time){
		time = this.toSeconds(time);
		return this._state.getValueAtTime(time);
	};

	/**
	 *  Clean up
	 *  @returns {Clock} this
	 */
	Clock.prototype.dispose = function(){
		Emitter.prototype.dispose.call(this);
		this.context.off("tick", this._boundLoop);
		this._writable("frequency");
		this.frequency.dispose();
		this.frequency = null;
		this._boundLoop = null;
		this._nextTick = Infinity;
		this.callback = null;
		this._state.dispose();
		this._state = null;
	};
