import { Tone } from 'core';
import { Transport } from 'core';
import { Volume } from 'component';
import { Master } from 'core';
import { Type } from 'type';
import { TimelineState } from 'core';
import { Signal } from 'signal';

	"use strict";

	/**
	 *  @class  Base class for sources. Sources have start/stop methods
	 *          and the ability to be synced to the
	 *          start/stop of Transport.
	 *
	 *  @constructor
	 *  @extends {Tone}
	 *  @example
	 * //Multiple state change events can be chained together,
	 * //but must be set in the correct order and with ascending times
	 *
	 * // OK
	 * state.start().stop("+0.2");
	 * // AND
	 * state.start().stop("+0.2").start("+0.4").stop("+0.7")
	 *
	 * // BAD
	 * state.stop("+0.2").start();
	 * // OR
	 * state.start("+0.3").stop("+0.2");
	 *
	 */
	export function Source(options){

		// this.createInsOuts(0, 1);

		options = this.defaultArg(options, Source.defaults);

		/**
		 *  The output volume node
		 *  @type  {Volume}
		 *  @private
		 */
		this._volume = this.output = new Volume(options.volume);

		/**
		 * The volume of the output in decibels.
		 * @type {Decibels}
		 * @signal
		 * @example
		 * source.volume.value = -6;
		 */
		this.volume = this._volume.volume;
		this._readOnly("volume");

		/**
		 * 	Keep track of the scheduled state.
		 *  @type {TimelineState}
		 *  @private
		 */
		this._state = new TimelineState(State.Stopped);
		this._state.memory = 10;

		/**
		 *  The synced `start` callback function from the transport
		 *  @type {Function}
		 *  @private
		 */
		this._synced = false;

		/**
		 *  Keep track of all of the scheduled event ids
		 *  @type  {Array}
		 *  @private
		 */
		this._scheduled = [];

		//make the output explicitly stereo
		this._volume.output.output.channelCount = 2;
		this._volume.output.output.channelCountMode = "explicit";
		//mute initially
		this.mute = options.mute;
	};

	Tone.extend(Source);

	/**
	 *  The default parameters
	 *  @static
	 *  @const
	 *  @type {Object}
	 */
	Source.defaults = {
		"volume" : 0,
		"mute" : false
	};

	/**
	 *  Returns the playback state of the source, either "started" or "stopped".
	 *  @type {State}
	 *  @readOnly
	 *  @memberOf Source#
	 *  @name state
	 */
	Object.defineProperty(Source.prototype, "state", {
		get : function(){
			if (this._synced){
				if (Transport.state === State.Started){
					return this._state.getValueAtTime(Transport.seconds);
				} else {
					return State.Stopped;
				}
			} else {
				return this._state.getValueAtTime(this.now());
			}
		}
	});

	/**
	 * Mute the output.
	 * @memberOf Source#
	 * @type {boolean}
	 * @name mute
	 * @example
	 * //mute the output
	 * source.mute = true;
	 */
	Object.defineProperty(Source.prototype, "mute", {
		get : function(){
			return this._volume.mute;
		},
		set : function(mute){
			this._volume.mute = mute;
		}
	});

	//overwrite these functions
	Source.prototype._start = Tone.noOp;
	Source.prototype._stop = Tone.noOp;

	/**
	 *  Start the source at the specified time. If no time is given,
	 *  start the source now.
	 *  @param  {Time} [time=now] When the source should be started.
	 *  @returns {Source} this
	 *  @example
	 * source.start("+0.5"); //starts the source 0.5 seconds from now
	 */
	Source.prototype.start = function(time, offset, duration){
		if (this.isUndef(time) && this._synced){
			time = Transport.seconds;
		} else {
			time = this.toSeconds(time);
		}
		//if it's started, stop it and restart it
		if (!this.retrigger && this._state.getValueAtTime(time) === State.Started){
			this.stop(time);
		}
		this._state.setStateAtTime(State.Started, time);
		if (this._synced){
			// add the offset time to the event
			var event = this._state.get(time);
			event.offset = this.defaultArg(offset, 0);
			event.duration = duration;
			var sched = Transport.schedule(function(t){
				this._start(t, offset, duration);
			}.bind(this), time);
			this._scheduled.push(sched);
		} else {
			this._start.apply(this, arguments);
		}
		return this;
	};

	/**
	 *  Stop the source at the specified time. If no time is given,
	 *  stop the source now.
	 *  @param  {Time} [time=now] When the source should be stopped.
	 *  @returns {Source} this
	 *  @example
	 * source.stop(); // stops the source immediately
	 */
	Source.prototype.stop = function(time){
		if (this.isUndef(time) && this._synced){
			time = Transport.seconds;
		} else {
			time = this.toSeconds(time);
		}
		this._state.cancel(time);
		this._state.setStateAtTime(State.Stopped, time);
		if (!this._synced){
			this._stop.apply(this, arguments);
		} else {
			var sched = Transport.schedule(this._stop.bind(this), time);
			this._scheduled.push(sched);
		}
		return this;
	};

	/**
	 *  Sync the source to the Transport so that all subsequent
	 *  calls to `start` and `stop` are synced to the TransportTime
	 *  instead of the AudioContext time.
	 *
	 *  @returns {Source} this
	 *  @example
	 * //sync the source so that it plays between 0 and 0.3 on the Transport's timeline
	 * source.sync().start(0).stop(0.3);
	 * //start the transport.
	 * Transport.start();
	 *
	 *  @example
	 * //start the transport with an offset and the sync'ed sources
	 * //will start in the correct position
	 * source.sync().start(0.1);
	 * //the source will be invoked with an offset of 0.4
	 * Transport.start("+0.5", 0.5);
	 */
	Source.prototype.sync = function(){
		this._synced = true;
		Transport.on("start loopStart", function(time, offset){
			if (offset > 0){
				// get the playback state at that time
				var stateEvent = this._state.get(offset);
				// listen for start events which may occur in the middle of the sync'ed time
				if (stateEvent && stateEvent.state === State.Started && stateEvent.time !== offset){
					// get the offset
					var startOffset = offset - this.toSeconds(stateEvent.time);
					var duration;
					if (stateEvent.duration){
						duration = this.toSeconds(stateEvent.duration) - startOffset;
					}
					this._start(time, this.toSeconds(stateEvent.offset) + startOffset, duration);
				}
			}
		}.bind(this));
		Transport.on("stop pause loopEnd", function(time){
			if (this._state.getValueAtTime(Transport.seconds) === State.Started){
				this._stop(time);
			}
		}.bind(this));
		return this;
	};

	/**
	 *  Unsync the source to the Transport. See Source.sync
	 *  @returns {Source} this
	 */
	Source.prototype.unsync = function(){
		this._synced = false;
		Transport.off("start stop pause loopEnd loopStart");
		// clear all of the scheduled ids
		for (var i = 0; i < this._scheduled.length; i++){
			var id = this._scheduled[i];
			Transport.clear(id);
		}
		this._scheduled = [];
		this._state.cancel(0);
		return this;
	};

	/**
	 *	Clean up.
	 *  @return {Source} this
	 */
	Source.prototype.dispose = function(){
		prototype.dispose.call(this);
		this.unsync();
		this._scheduled = null;
		this._writable("volume");
		this._volume.dispose();
		this._volume = null;
		this.volume = null;
		this._state.dispose();
		this._state = null;
	};
