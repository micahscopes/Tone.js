import { Tone } from 'core/Tone';


	"use strict";

	/**
	 *  @class Emitter gives classes which extend it
	 *         the ability to listen for and emit events.
	 *         Inspiration and reference from Jerome Etienne's [MicroEvent](https://github.com/jeromeetienne/microevent.js).
	 *         MIT (c) 2011 Jerome Etienne.
	 *
	 *  @extends {Tone}
	 */
	export var Emitter = function(){
		/**
		 *  Contains all of the events.
		 *  @private
		 *  @type  {Object}
		 */
		this._events = {};
	};

	Tone.extend(Emitter);

	/**
	 *  Bind a callback to a specific event.
	 *  @param  {String}    event     The name of the event to listen for.
	 *  @param  {Function}  callback  The callback to invoke when the
	 *                                event is emitted
	 *  @return  {Emitter}    this
	 */
	Emitter.prototype.on = function(event, callback){
		//split the event
		var events = event.split(/\W+/);
		for (var i = 0; i < events.length; i++){
			var eventName = events[i];
			if (!this._events.hasOwnProperty(eventName)){
				this._events[eventName] = [];
			}
			this._events[eventName].push(callback);
		}
		return this;
	};

	/**
	 *  Remove the event listener.
	 *  @param  {String}    event     The event to stop listening to.
	 *  @param  {Function=}  callback  The callback which was bound to
	 *                                the event with Emitter.on.
	 *                                If no callback is given, all callbacks
	 *                                events are removed.
	 *  @return  {Emitter}    this
	 */
	Emitter.prototype.off = function(event, callback){
		var events = event.split(/\W+/);
		for (var ev = 0; ev < events.length; ev++){
			event = events[ev];
			if (this._events.hasOwnProperty(event)){
				if (prototype.isUndef(callback)){
					this._events[event] = [];
				} else {
					var eventList = this._events[event];
					for (var i = 0; i < eventList.length; i++){
						if (eventList[i] === callback){
							eventList.splice(i, 1);
						}
					}
				}
			}
		}
		return this;
	};

	/**
	 *  Invoke all of the callbacks bound to the event
	 *  with any arguments passed in.
	 *  @param  {String}  event  The name of the event.
	 *  @param {*...} args The arguments to pass to the functions listening.
	 *  @return  {Emitter}  this
	 */
	Emitter.prototype.emit = function(event){
		if (this._events){
			var args = Array.prototype.slice.call(arguments, 1);
			if (this._events.hasOwnProperty(event)){
				var eventList = this._events[event];
				for (var i = 0, len = eventList.length; i < len; i++){
					eventList[i].apply(this, args);
				}
			}
		}
		return this;
	};

	/**
	 *  Add Emitter functions (on/off/emit) to the object
	 *  @param  {Object|Function}  object  The object or class to extend.
	 */
	Emitter.mixin = function(object){
		var functions = ["on", "off", "emit"];
		object._events = {};
		for (var i = 0; i < functions.length; i++){
			var func = functions[i];
			var emitterFunc = Emitter.prototype[func];
			object[func] = emitterFunc;
		}
	};

	/**
	 *  Clean up
	 *  @return  {Emitter}  this
	 */
	Emitter.prototype.dispose = function(){
		prototype.dispose.call(this);
		this._events = null;
		return this;
	};
