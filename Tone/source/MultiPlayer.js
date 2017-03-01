import { Tone } from 'core';
import { BufferSource } from 'source';
import { Buffers } from 'core';
import { Source } from 'source';
import { Volume } from 'component';

	/**
	 *  @class MultiPlayer is well suited for one-shots, multi-sampled instruments
	 *         or any time you need to play a bunch of audio buffers.
	 *  @param  {Object|Array|Buffers}  buffers  The buffers which are available
	 *                                                to the MultiPlayer
	 *  @param {Function} onload The callback to invoke when all of the buffers are loaded.
	 *  @extends {Tone}
	 *  @example
	 * var multiPlayer = new MultiPlayer({
	 * 	"kick" : "path/to/kick.mp3",
	 * 	"snare" : "path/to/snare.mp3",
	 * }, function(){
	 * 	multiPlayer.start("kick");
	 * });
	 *  @example
	 * //can also store the values in an array
	 * var multiPlayer = new MultiPlayer(["path/to/kick.mp3", "path/to/snare.mp3"],
	 * function(){
	 * 	//if an array is passed in, the samples are referenced to by index
	 * 	multiPlayer.start(1);
	 * });
	 */
	export function MultiPlayer(){

		var options = this.optionsObject(arguments, ["urls", "onload"], MultiPlayer.defaults);

		if (options.urls instanceof Buffers){
			/**
			 *  All the buffers belonging to the player.
			 *  @type  {Buffers}
			 */
			this.buffers = options.urls;
		} else {
			this.buffers = new Buffers(options.urls, options.onload);
		}

		/**
		 *  Keeps track of the currently playing sources.
		 *  @type  {Object}
		 *  @private
		 */
		this._activeSources = {};

		/**
		 *  The fade in envelope which is applied
		 *  to the beginning of the BufferSource
		 *  @type  {Time}
		 */
		this.fadeIn = options.fadeIn;

		/**
		 *  The fade out envelope which is applied
		 *  to the end of the BufferSource
		 *  @type  {Time}
		 */
		this.fadeOut = options.fadeOut;

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

		//make the output explicitly stereo
		this._volume.output.output.channelCount = 2;
		this._volume.output.output.channelCountMode = "explicit";
		//mute initially
		this.mute = options.mute;
	};

	Tone.extend(MultiPlayer, Source);

	/**
	 *  The defaults
	 *  @type  {Object}
	 */
	MultiPlayer.defaults = {
		"onload" : Tone.noOp,
		"fadeIn" : 0,
		"fadeOut" : 0
	};

	/**
	 * Make the source from the buffername
	 * @param  {String} bufferName
	 * @return {BufferSource}
	 * @private
	 */
	MultiPlayer.prototype._makeSource = function(bufferName){
		var buffer;
		if (this.isString(bufferName) || this.isNumber(bufferName)){
			buffer = this.buffers.get(bufferName).get();
		} else if (bufferName instanceof Buffer){
			buffer = bufferName.get();
		} else if (bufferName instanceof AudioBuffer){
			buffer = bufferName;
		}
		var source = new BufferSource(buffer).connect(this.output);
		if (!this._activeSources.hasOwnProperty(bufferName)){
			this._activeSources[bufferName] = [];
		}
		this._activeSources[bufferName].push(source);
		return source;
	};

	/**
	 *  Start a buffer by name. The `start` method allows a number of options
	 *  to be passed in such as offset, interval, and gain. This is good for multi-sampled
	 *  instruments and sound sprites where samples are repitched played back at different velocities.
	 *  @param  {String}  bufferName    The name of the buffer to start.
	 *  @param  {Time}  time      When to start the buffer.
	 *  @param  {Time}  [offset=0]    The offset into the buffer to play from.
	 *  @param  {Time=}  duration   How long to play the buffer for.
	 *  @param  {Interval}  [pitch=0]  The interval to repitch the buffer.
	 *  @param  {Gain}  [gain=1]      The gain to play the sample at.
	 *  @return  {MultiPlayer}  this
	 */
	MultiPlayer.prototype.start = function(bufferName, time, offset, duration, pitch, gain){
		time = this.toSeconds(time);
		var source = this._makeSource(bufferName);
		source.start(time, offset, duration, this.defaultArg(gain, 1), this.fadeIn);
		if (duration){
			source.stop(time + this.toSeconds(duration), this.fadeOut);
		}
		pitch = this.defaultArg(pitch, 0);
		source.playbackRate.value = this.intervalToFrequencyRatio(pitch);
		return this;
	};

	/**
	 *  Start a looping buffer by name. Similar to `start`, but the buffer
	 *  is looped instead of played straight through. Can still be stopped with `stop`.
	 *  @param  {String}  bufferName    The name of the buffer to start.
	 *  @param  {Time}  time      When to start the buffer.
	 *  @param  {Time}  [offset=0]    The offset into the buffer to play from.
	 *  @param  {Time=}  loopStart   The start of the loop.
	 *  @param  {Time=}  loopEnd	The end of the loop.
	 *  @param  {Interval}  [pitch=0]  The interval to repitch the buffer.
	 *  @param  {Gain}  [gain=1]      The gain to play the sample at.
	 *  @return  {MultiPlayer}  this
	 */
	MultiPlayer.prototype.startLoop = function(bufferName, time, offset, loopStart, loopEnd, pitch, gain){
		time = this.toSeconds(time);
		var source = this._makeSource(bufferName);
		source.loop = true;
		source.loopStart = this.toSeconds(this.defaultArg(loopStart, 0));
		source.loopEnd = this.toSeconds(this.defaultArg(loopEnd, 0));
		source.start(time, offset, undefined, this.defaultArg(gain, 1), this.fadeIn);
		pitch = this.defaultArg(pitch, 0);
		source.playbackRate.value = this.intervalToFrequencyRatio(pitch);
		return this;
	};

	/**
	 *  Stop the first played instance of the buffer name.
	 *  @param  {String}  bufferName  The buffer to stop.
	 *  @param  {Time=}  time    When to stop the buffer
	 *  @return  {MultiPlayer}  this
	 */
	MultiPlayer.prototype.stop = function(bufferName, time){
		if (this._activeSources[bufferName] && this._activeSources[bufferName].length){
			time = this.toSeconds(time);
			this._activeSources[bufferName].shift().stop(time, this.fadeOut);
		} else {
			throw new Error("MultiPlayer: cannot stop a buffer that hasn't been started or is already stopped");
		}
		return this;
	};

	/**
	 *  Stop all currently playing buffers at the given time.
	 *  @param  {Time=}  time  When to stop the buffers.
	 *  @return  {MultiPlayer}  this
	 */
	MultiPlayer.prototype.stopAll = function(time){
		time = this.toSeconds(time);
		for (var bufferName in this._activeSources){
			var sources = this._activeSources[bufferName];
			for (var i = 0; i < sources.length; i++){
				sources[i].stop(time);
			}
		}
		return this;
	};

	/**
	 *  Add another buffer to the available buffers.
	 *  @param {String} name The name to that the buffer is refered
	 *                       to in start/stop methods.
	 *  @param {String|Buffer} url The url of the buffer to load
	 *                                  or the buffer.
	 *  @param {Function} callback The function to invoke after the buffer is loaded.
	 */
	MultiPlayer.prototype.add = function(name, url, callback){
		this.buffers.add(name, url, callback);
		return this;
	};

	/**
	 *  Returns the playback state of the source. "started"
	 *  if there are any buffers playing. "stopped" otherwise.
	 *  @type {State}
	 *  @readOnly
	 *  @memberOf MultiPlayer#
	 *  @name state
	 */
	Object.defineProperty(MultiPlayer.prototype, "state", {
		get : function(){
			return this._activeSources.length > 0 ? State.Started : State.Stopped;
		}
	});

	/**
	 * Mute the output.
	 * @memberOf MultiPlayer#
	 * @type {boolean}
	 * @name mute
	 * @example
	 * //mute the output
	 * source.mute = true;
	 */
	Object.defineProperty(MultiPlayer.prototype, "mute", {
		get : function(){
			return this._volume.mute;
		},
		set : function(mute){
			this._volume.mute = mute;
		}
	});

	/**
	 *  Clean up.
	 *  @return  {MultiPlayer}  this
	 */
	MultiPlayer.prototype.dispose = function(){
		prototype.dispose.call(this);
		this._volume.dispose();
		this._volume = null;
		this._writable("volume");
		this.volume = null;
		for (var bufferName in this._activeSources){
			this._activeSources[bufferName].forEach(function(source){
				source.dispose();
			});
		}
		this.buffers.dispose();
		this.buffers = null;
		this._activeSources = null;
		return this;
	};
