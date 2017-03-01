import { Tone } from 'core';
import { Event } from 'event';
import { Type } from 'type';
import { Transport } from 'core';

	"use strict";

	/**
	 *  @class Part is a collection Events which can be
	 *         started/stoped and looped as a single unit.
	 *
	 *  @extends {Event}
	 *  @param {Function} callback The callback to invoke on each event
	 *  @param {Array} events the array of events
	 *  @example
	 * var part = new Part(function(time, note){
	 * 	//the notes given as the second element in the array
	 * 	//will be passed in as the second argument
	 * 	synth.triggerAttackRelease(note, "8n", time);
	 * }, [[0, "C2"], ["0:2", "C3"], ["0:3:2", "G2"]]);
	 *  @example
	 * //use an array of objects as long as the object has a "time" attribute
	 * var part = new Part(function(time, value){
	 * 	//the value is an object which contains both the note and the velocity
	 * 	synth.triggerAttackRelease(value.note, "8n", time, value.velocity);
	 * }, [{"time" : 0, "note" : "C3", "velocity": 0.9},
	 * 	   {"time" : "0:2", "note" : "C4", "velocity": 0.5}
	 * ]).start(0);
	 */
	export function Part(){

		var options = this.optionsObject(arguments, ["callback", "events"], Part.defaults);

		/**
		 *  If the part is looping or not
		 *  @type  {Boolean|Positive}
		 *  @private
		 */
		this._loop = options.loop;

		/**
		 *  When the note is scheduled to start.
		 *  @type  {Ticks}
		 *  @private
		 */
		this._loopStart = this.toTicks(options.loopStart);

		/**
		 *  When the note is scheduled to start.
		 *  @type  {Ticks}
		 *  @private
		 */
		this._loopEnd = this.toTicks(options.loopEnd);

		/**
		 *  The playback rate of the part
		 *  @type  {Positive}
		 *  @private
		 */
		this._playbackRate = options.playbackRate;

		/**
		 *  private holder of probability value
		 *  @type {NormalRange}
		 *  @private
		 */
		this._probability = options.probability;

		/**
		 *  the amount of variation from the
		 *  given time.
		 *  @type {Boolean|Time}
		 *  @private
		 */
		this._humanize = options.humanize;

		/**
		 *  The start offset
		 *  @type {Ticks}
		 *  @private
		 */
		this._startOffset = 0;

		/**
		 *  Keeps track of the current state
		 *  @type {TimelineState}
		 *  @private
		 */
		this._state = new TimelineState(State.Stopped);

		/**
		 *  An array of Objects.
		 *  @type  {Array}
		 *  @private
		 */
		this._events = [];

		/**
		 *  The callback to invoke at all the scheduled events.
		 *  @type {Function}
		 */
		this.callback = options.callback;

		/**
		 *  If mute is true, the callback won't be
		 *  invoked.
		 *  @type {Boolean}
		 */
		this.mute = options.mute;

		//add the events
		var events = this.defaultArg(options.events, []);
		if (!this.isUndef(options.events)){
			for (var i = 0; i < events.length; i++){
				if (Array.isArray(events[i])){
					this.add(events[i][0], events[i][1]);
				} else {
					this.add(events[i]);
				}
			}
		}
	};

	Tone.extend(Part, Event);

	/**
	 *  The default values
	 *  @type  {Object}
	 *  @const
	 */
	Part.defaults = {
		"callback" : Tone.noOp,
		"loop" : false,
		"loopEnd" : "1m",
		"loopStart" : 0,
		"playbackRate" : 1,
		"probability" : 1,
		"humanize" : false,
		"mute" : false,
	};

	/**
	 *  Start the part at the given time.
	 *  @param  {TransportTime}  time    When to start the part.
	 *  @param  {Time=}  offset  The offset from the start of the part
	 *                           to begin playing at.
	 *  @return  {Part}  this
	 */
	Part.prototype.start = function(time, offset){
		var ticks = this.toTicks(time);
		if (this._state.getValueAtTime(ticks) !== State.Started){
			if (this._loop){
				offset = this.defaultArg(offset, this._loopStart);
			} else {
				offset = this.defaultArg(offset, 0);
			}
			offset = this.toTicks(offset);
			this._state.add({
				"state" : State.Started,
				"time" : ticks,
				"offset" : offset
			});
			this._forEach(function(event){
				this._startNote(event, ticks, offset);
			});
		}
		return this;
	};

	/**
	 *  Start the event in the given event at the correct time given
	 *  the ticks and offset and looping.
	 *  @param  {Event}  event
	 *  @param  {Ticks}  ticks
	 *  @param  {Ticks}  offset
	 *  @private
	 */
	Part.prototype._startNote = function(event, ticks, offset){
		ticks -= offset;
		if (this._loop){
			if (event.startOffset >= this._loopStart && event.startOffset < this._loopEnd){
				if (event.startOffset < offset){
					//start it on the next loop
					ticks += this._getLoopDuration();
				}
				event.start(TransportTime(ticks,"i"));
			} else if (event.startOffset < this._loopStart && event.startOffset >= offset) {
				event.loop = false;
				event.start(TransportTime(ticks,"i"));
			}
		} else {
			if (event.startOffset >= offset){
				event.start(TransportTime(ticks,"i"));
			}
		}
	};

	/**
	 *  The start from the scheduled start time
	 *  @type {Ticks}
	 *  @memberOf Part#
	 *  @name startOffset
	 *  @private
	 */
	Object.defineProperty(Part.prototype, "startOffset", {
		get : function(){
			return this._startOffset;
		},
		set : function(offset){
			this._startOffset = offset;
			this._forEach(function(event){
				event.startOffset += this._startOffset;
			});
		}
	});

	/**
	 *  Stop the part at the given time.
	 *  @param  {TimelinePosition}  time  When to stop the part.
	 *  @return  {Part}  this
	 */
	Part.prototype.stop = function(time){
		var ticks = this.toTicks(time);
		this._state.cancel(ticks);
		this._state.setStateAtTime(State.Stopped, ticks);
		this._forEach(function(event){
			event.stop(time);
		});
		return this;
	};

	/**
	 *  Get/Set an Event's value at the given time.
	 *  If a value is passed in and no event exists at
	 *  the given time, one will be created with that value.
	 *  If two events are at the same time, the first one will
	 *  be returned.
	 *  @example
	 * part.at("1m"); //returns the part at the first measure
	 *
	 * part.at("2m", "C2"); //set the value at "2m" to C2.
	 * //if an event didn't exist at that time, it will be created.
	 *  @param {TransportTime} time The time of the event to get or set.
	 *  @param {*=} value If a value is passed in, the value of the
	 *                    event at the given time will be set to it.
	 *  @return {Event} the event at the time
	 */
	Part.prototype.at = function(time, value){
		time = TransportTime(time);
		var tickTime = Time(1, "i").toSeconds();
		for (var i = 0; i < this._events.length; i++){
			var event = this._events[i];
			if (Math.abs(time.toTicks() - event.startOffset) < tickTime){
				if (!this.isUndef(value)){
					event.value = value;
				}
				return event;
			}
		}
		//if there was no event at that time, create one
		if (!this.isUndef(value)){
			this.add(time, value);
			//return the new event
			return this._events[this._events.length - 1];
		} else {
			return null;
		}
	};

	/**
	 *  Add a an event to the part.
	 *  @param {Time} time The time the note should start.
	 *                            If an object is passed in, it should
	 *                            have a 'time' attribute and the rest
	 *                            of the object will be used as the 'value'.
	 *  @param  {Event|*}  value
	 *  @returns {Part} this
	 *  @example
	 * part.add("1m", "C#+11");
	 */
	Part.prototype.add = function(time, value){
		//extract the parameters
		if (time.hasOwnProperty("time")){
			value = time;
			time = value.time;
		}
		time = this.toTicks(time);
		var event;
		if (value instanceof Event){
			event = value;
			event.callback = this._tick.bind(this);
		} else {
			event = new Event({
				"callback" : this._tick.bind(this),
				"value" : value,
			});
		}
		//the start offset
		event.startOffset = time;

		//initialize the values
		event.set({
			"loopEnd" : this.loopEnd,
			"loopStart" : this.loopStart,
			"loop" : this.loop,
			"humanize" : this.humanize,
			"playbackRate" : this.playbackRate,
			"probability" : this.probability
		});

		this._events.push(event);

		//start the note if it should be played right now
		this._restartEvent(event);
		return this;
	};

	/**
	 *  Restart the given event
	 *  @param  {Event}  event
	 *  @private
	 */
	Part.prototype._restartEvent = function(event){
		this._state.forEach(function(stateEvent){
			if (stateEvent.state === State.Started){
				this._startNote(event, stateEvent.time, stateEvent.offset);
			} else {
				//stop the note
				event.stop(TransportTime(stateEvent.time, "i"));
			}
		}.bind(this));
	};

	/**
	 *  Remove an event from the part. Will recursively iterate
	 *  into nested parts to find the event.
	 *  @param {Time} time The time of the event
	 *  @param {*} value Optionally select only a specific event value
	 *  @return  {Part}  this
	 */
	Part.prototype.remove = function(time, value){
		//extract the parameters
		if (time.hasOwnProperty("time")){
			value = time;
			time = value.time;
		}
		time = this.toTicks(time);
		for (var i = this._events.length - 1; i >= 0; i--){
			var event = this._events[i];
			if (event instanceof Part){
				event.remove(time, value);
			} else {
				if (event.startOffset === time){
					if (this.isUndef(value) || (!this.isUndef(value) && event.value === value)){
						this._events.splice(i, 1);
						event.dispose();
					}
				}
			}
		}
		return this;
	};

	/**
	 *  Remove all of the notes from the group.
	 *  @return  {Part}  this
	 */
	Part.prototype.removeAll = function(){
		this._forEach(function(event){
			event.dispose();
		});
		this._events = [];
		return this;
	};

	/**
	 *  Cancel scheduled state change events: i.e. "start" and "stop".
	 *  @param {TimelinePosition} after The time after which to cancel the scheduled events.
	 *  @return  {Part}  this
	 */
	Part.prototype.cancel = function(after){
		after = this.toTicks(after);
		this._forEach(function(event){
			event.cancel(after);
		});
		this._state.cancel(after);
		return this;
	};

	/**
	 *  Iterate over all of the events
	 *  @param {Function} callback
	 *  @param {Object} ctx The context
	 *  @private
	 */
	Part.prototype._forEach = function(callback, ctx){
		ctx = this.defaultArg(ctx, this);
		for (var i = this._events.length - 1; i >= 0; i--){
			var e = this._events[i];
			if (e instanceof Part){
				e._forEach(callback, ctx);
			} else {
				callback.call(ctx, e);
			}
		}
		return this;
	};

	/**
	 *  Set the attribute of all of the events
	 *  @param  {String}  attr  the attribute to set
	 *  @param  {*}  value      The value to set it to
	 *  @private
	 */
	Part.prototype._setAll = function(attr, value){
		this._forEach(function(event){
			event[attr] = value;
		});
	};

	/**
	 *  Internal tick method
	 *  @param  {Number}  time  The time of the event in seconds
	 *  @private
	 */
	Part.prototype._tick = function(time, value){
		if (!this.mute){
			this.callback(time, value);
		}
	};

	/**
	 *  Determine if the event should be currently looping
	 *  given the loop boundries of this Part.
	 *  @param  {Event}  event  The event to test
	 *  @private
	 */
	Part.prototype._testLoopBoundries = function(event){
		if (event.startOffset < this._loopStart || event.startOffset >= this._loopEnd){
			event.cancel(0);
		} else {
			//reschedule it if it's stopped
			if (event.state === State.Stopped){
				this._restartEvent(event);
			}
		}
	};

	/**
	 *  The probability of the notes being triggered.
	 *  @memberOf Part#
	 *  @type {NormalRange}
	 *  @name probability
	 */
	Object.defineProperty(Part.prototype, "probability", {
		get : function(){
			return this._probability;
		},
		set : function(prob){
			this._probability = prob;
			this._setAll("probability", prob);
		}
	});

	/**
	 *  If set to true, will apply small random variation
	 *  to the callback time. If the value is given as a time, it will randomize
	 *  by that amount.
	 *  @example
	 * event.humanize = true;
	 *  @type {Boolean|Time}
	 *  @name humanize
	 */
	Object.defineProperty(Part.prototype, "humanize", {
		get : function(){
			return this._humanize;
		},
		set : function(variation){
			this._humanize = variation;
			this._setAll("humanize", variation);
		}
	});

	/**
	 *  If the part should loop or not
	 *  between Part.loopStart and
	 *  Part.loopEnd. An integer
	 *  value corresponds to the number of
	 *  loops the Part does after it starts.
	 *  @memberOf Part#
	 *  @type {Boolean|Positive}
	 *  @name loop
	 *  @example
	 * //loop the part 8 times
	 * part.loop = 8;
	 */
	Object.defineProperty(Part.prototype, "loop", {
		get : function(){
			return this._loop;
		},
		set : function(loop){
			this._loop = loop;
			this._forEach(function(event){
				event._loopStart = this._loopStart;
				event._loopEnd = this._loopEnd;
				event.loop = loop;
				this._testLoopBoundries(event);
			});
		}
	});

	/**
	 *  The loopEnd point determines when it will
	 *  loop if Part.loop is true.
	 *  @memberOf Part#
	 *  @type {TransportTime}
	 *  @name loopEnd
	 */
	Object.defineProperty(Part.prototype, "loopEnd", {
		get : function(){
			return TransportTime(this._loopEnd, "i").toNotation();
		},
		set : function(loopEnd){
			this._loopEnd = this.toTicks(loopEnd);
			if (this._loop){
				this._forEach(function(event){
					event.loopEnd = loopEnd;
					this._testLoopBoundries(event);
				});
			}
		}
	});

	/**
	 *  The loopStart point determines when it will
	 *  loop if Part.loop is true.
	 *  @memberOf Part#
	 *  @type {TransportTime}
	 *  @name loopStart
	 */
	Object.defineProperty(Part.prototype, "loopStart", {
		get : function(){
			return TransportTime(this._loopStart, "i").toNotation();
		},
		set : function(loopStart){
			this._loopStart = this.toTicks(loopStart);
			if (this._loop){
				this._forEach(function(event){
					event.loopStart = this.loopStart;
					this._testLoopBoundries(event);
				});
			}
		}
	});

	/**
	 * 	The playback rate of the part
	 *  @memberOf Part#
	 *  @type {Positive}
	 *  @name playbackRate
	 */
	Object.defineProperty(Part.prototype, "playbackRate", {
		get : function(){
			return this._playbackRate;
		},
		set : function(rate){
			this._playbackRate = rate;
			this._setAll("playbackRate", rate);
		}
	});

	/**
	 * 	The number of scheduled notes in the part.
	 *  @memberOf Part#
	 *  @type {Positive}
	 *  @name length
	 *  @readOnly
	 */
	Object.defineProperty(Part.prototype, "length", {
		get : function(){
			return this._events.length;
		}
	});

	/**
	 *  Clean up
	 *  @return  {Part}  this
	 */
	Part.prototype.dispose = function(){
		this.removeAll();
		this._state.dispose();
		this._state = null;
		this.callback = null;
		this._events = null;
		return this;
	};
