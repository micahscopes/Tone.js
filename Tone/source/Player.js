import { Tone } from 'core/Tone';

import { Buffer } from 'core/Buffer';

import { Source } from 'source/Source';


	"use strict";

	/**
	 *  @class  Player is an audio file player with start, loop, and stop functions.
	 *
	 *  @constructor
	 *  @extends {Source}
	 *  @param {string|AudioBuffer} url Either the AudioBuffer or the url from
	 *                                  which to load the AudioBuffer
	 *  @param {function=} onload The function to invoke when the buffer is loaded.
	 *                            Recommended to use Buffer.on('load') instead.
	 *  @example
	 * var player = new Player("./path/to/sample.mp3").toMaster();
	 * //play as soon as the buffer is loaded
	 * player.autostart = true;
	 */
	export var Player = function(url){

		var options;
		if (url instanceof Buffer){
			url = url.get();
			options = Player.defaults;
		} else {
			options = this.optionsObject(arguments, ["url", "onload"], Player.defaults);
		}
		Source.call(this, options);

		/**
		 *  @private
		 *  @type {AudioBufferSourceNode}
		 */
		this._source = null;

		/**
		 *  If the file should play as soon
		 *  as the buffer is loaded.
		 *  @type {boolean}
		 *  @example
		 * //will play as soon as it's loaded
		 * var player = new Player({
		 * 	"url" : "./path/to/sample.mp3",
		 * 	"autostart" : true,
		 * }).toMaster();
		 */
		this.autostart = options.autostart;

		/**
		 *  the buffer
		 *  @private
		 *  @type {Buffer}
		 */
		this._buffer = new Buffer({
			"url" : options.url,
			"onload" : this._onload.bind(this, options.onload),
			"reverse" : options.reverse
		});
		if (url instanceof AudioBuffer){
			this._buffer.set(url);
		}

		/**
		 *  if the buffer should loop once it's over
		 *  @type {boolean}
		 *  @private
		 */
		this._loop = options.loop;

		/**
		 *  if 'loop' is true, the loop will start at this position
		 *  @type {Time}
		 *  @private
		 */
		this._loopStart = options.loopStart;

		/**
		 *  if 'loop' is true, the loop will end at this position
		 *  @type {Time}
		 *  @private
		 */
		this._loopEnd = options.loopEnd;

		/**
		 *  the playback rate
		 *  @private
		 *  @type {number}
		 */
		this._playbackRate = options.playbackRate;

		/**
		 *  Enabling retrigger will allow a player to be restarted
		 *  before the the previous 'start' is done playing. Otherwise,
		 *  successive calls to Player.start will only start
		 *  the sample if it had played all the way through.
		 *  @type {boolean}
		 */
		this.retrigger = options.retrigger;
	};

	Tone.extend(Player, Source);

	/**
	 *  the default parameters
	 *  @static
	 *  @const
	 *  @type {Object}
	 */
	Player.defaults = {
		"onload" : Tone.noOp,
		"playbackRate" : 1,
		"loop" : false,
		"autostart" : false,
		"loopStart" : 0,
		"loopEnd" : 0,
		"retrigger" : false,
		"reverse" : false,
	};

	/**
	 *  Load the audio file as an audio buffer.
	 *  Decodes the audio asynchronously and invokes
	 *  the callback once the audio buffer loads.
	 *  Note: this does not need to be called if a url
	 *  was passed in to the constructor. Only use this
	 *  if you want to manually load a new url.
	 * @param {string} url The url of the buffer to load.
	 *                     Filetype support depends on the
	 *                     browser.
	 *  @param  {function=} callback The function to invoke once
	 *                               the sample is loaded.
	 *  @returns {Promise}
	 */
	Player.prototype.load = function(url, callback){
		return this._buffer.load(url, this._onload.bind(this, callback));
	};

	/**
	 * Internal callback when the buffer is loaded.
	 * @private
	 */
	Player.prototype._onload = function(callback){
		callback = this.defaultArg(callback, Tone.noOp);
		callback(this);
		if (this.autostart){
			this.start();
		}
	};

	/**
	 *  Play the buffer at the given startTime. Optionally add an offset
	 *  and/or duration which will play the buffer from a position
	 *  within the buffer for the given duration.
	 *
	 *  @param  {Time} [startTime=now] When the player should start.
	 *  @param  {Time} [offset=0] The offset from the beginning of the sample
	 *                                 to start at.
	 *  @param  {Time=} duration How long the sample should play. If no duration
	 *                                is given, it will default to the full length
	 *                                of the sample (minus any offset)
	 *  @returns {Player} this
	 *  @memberOf Player#
	 *  @method start
	 *  @name start
	 */

	/**
	 *  Internal start method
	 *  @private
	 */
	Player.prototype._start = function(startTime, offset, duration){
		if (this._buffer.loaded){
			//if it's a loop the default offset is the loopstart point
			if (this._loop){
				offset = this.defaultArg(offset, this._loopStart);
			} else {
				//otherwise the default offset is 0
				offset = this.defaultArg(offset, 0);
			}
			offset = this.toSeconds(offset);
			//make sure it has a positive duration
			duration = this.defaultArg(duration, Math.max(this._buffer.duration - offset, 0));
			duration = this.toSeconds(duration);
			//the values in seconds
			startTime = this.toSeconds(startTime);
			//make the source
			this._source = this.context.createBufferSource();
			this._source.buffer = this._buffer.get();
			//set the looping properties
			if (this._loop){
				this._source.loop = this._loop;
				this._source.loopStart = this.toSeconds(this._loopStart);
				this._source.loopEnd = this.toSeconds(this._loopEnd);
			} else if (!this._synced){
				//if it's not looping, set the state change at the end of the sample
				this._state.setStateAtTime(State.Stopped, startTime + duration);
			}
			//and other properties
			this._source.playbackRate.value = this._playbackRate;
			this._source.connect(this.output);
			//start it
			if (this._loop){
				//modify the offset if it's greater than the loop time
				var loopEnd = this._source.loopEnd || this._buffer.duration;
				var loopStart = this._source.loopStart;
				var loopDuration = loopEnd - loopStart;
				if (offset > loopEnd){
					//move the offset back
					while (offset > loopEnd){
						offset -= loopDuration;
					}
				}

				this._source.start(startTime, offset);
			} else {
				this._source.start(startTime, offset, duration);
			}
		} else {
			throw Error("Player: tried to start Player before the buffer was loaded");
		}
		return this;
	};

	/**
	 *  Stop playback.
	 *  @private
	 *  @param  {Time} [time=now]
	 *  @returns {Player} this
	 */
	Player.prototype._stop = function(time){
		if (this._source){
			this._source.stop(this.toSeconds(time));
			this._source = null;
		}
		return this;
	};


	/**
	 *  Seek to a specific time in the player's buffer. If the
	 *  source is no longer playing at that time, it will stop.
	 *  If you seek to a time that
	 *  @param {Time} offset The time to seek to.
	 *  @param {Time=} time The time for the seek event to occur.
	 *  @return {Player} this
	 *  @example
	 * source.start(0.2);
	 * source.stop(0.4);
	 */
	Player.prototype.seek = function(offset, time){
		time = this.toSeconds(time);
		if (this._state.getValueAtTime(time) === State.Started){
			offset = this.toSeconds(offset);
			// if it's currently playing, stop it
			this._stop(time);
			//restart it at the given time
			this._start(time, offset);
		}
		return this;
	};

	/**
	 *  Set the loop start and end. Will only loop if loop is
	 *  set to true.
	 *  @param {Time} loopStart The loop end time
	 *  @param {Time} loopEnd The loop end time
	 *  @returns {Player} this
	 *  @example
	 * //loop 0.1 seconds of the file.
	 * player.setLoopPoints(0.2, 0.3);
	 * player.loop = true;
	 */
	Player.prototype.setLoopPoints = function(loopStart, loopEnd){
		this.loopStart = loopStart;
		this.loopEnd = loopEnd;
		return this;
	};

	/**
	 * If loop is true, the loop will start at this position.
	 * @memberOf Player#
	 * @type {Time}
	 * @name loopStart
	 */
	Object.defineProperty(Player.prototype, "loopStart", {
		get : function(){
			return this._loopStart;
		},
		set : function(loopStart){
			this._loopStart = loopStart;
			if (this._source){
				this._source.loopStart = this.toSeconds(loopStart);
			}
		}
	});

	/**
	 * If loop is true, the loop will end at this position.
	 * @memberOf Player#
	 * @type {Time}
	 * @name loopEnd
	 */
	Object.defineProperty(Player.prototype, "loopEnd", {
		get : function(){
			return this._loopEnd;
		},
		set : function(loopEnd){
			this._loopEnd = loopEnd;
			if (this._source){
				this._source.loopEnd = this.toSeconds(loopEnd);
			}
		}
	});

	/**
	 * The audio buffer belonging to the player.
	 * @memberOf Player#
	 * @type {Buffer}
	 * @name buffer
	 */
	Object.defineProperty(Player.prototype, "buffer", {
		get : function(){
			return this._buffer;
		},
		set : function(buffer){
			this._buffer.set(buffer);
		}
	});

	/**
	 * If the buffer should loop once it's over.
	 * @memberOf Player#
	 * @type {boolean}
	 * @name loop
	 */
	Object.defineProperty(Player.prototype, "loop", {
		get : function(){
			return this._loop;
		},
		set : function(loop){
			this._loop = loop;
			if (this._source){
				this._source.loop = loop;
			}
		}
	});

	/**
	 * The playback speed. 1 is normal speed. This is not a signal because
	 * Safari and iOS currently don't support playbackRate as a signal.
	 * @memberOf Player#
	 * @type {number}
	 * @name playbackRate
	 */
	Object.defineProperty(Player.prototype, "playbackRate", {
		get : function(){
			return this._playbackRate;
		},
		set : function(rate){
			this._playbackRate = rate;
			if (this._source) {
				this._source.playbackRate.value = rate;
			}
		}
	});

	/**
	 * The direction the buffer should play in
	 * @memberOf Player#
	 * @type {boolean}
	 * @name reverse
	 */
	Object.defineProperty(Player.prototype, "reverse", {
		get : function(){
			return this._buffer.reverse;
		},
		set : function(rev){
			this._buffer.reverse = rev;
		}
	});

	/**
	 *  Dispose and disconnect.
	 *  @return {Player} this
	 */
	Player.prototype.dispose = function(){
		Source.prototype.dispose.call(this);
		if (this._source !== null){
			this._source.disconnect();
			this._source = null;
		}
		this._buffer.dispose();
		this._buffer = null;
		return this;
	};
