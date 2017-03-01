import { Tone } from 'core/Tone';

import { Emitter } from 'core/Emitter';

import { Type } from 'type/Type';


	"use strict";

	/**
	 *  @class  Buffer loading and storage. Buffer is used internally by all
	 *          classes that make requests for audio files such as Player,
	 *          Sampler and Convolver.
	 *          <br><br>
	 *          Aside from load callbacks from individual buffers, Buffer
	 *  		provides static methods which keep track of the loading progress
	 *  		of all of the buffers. These methods are Buffer.on("load" / "progress" / "error")
	 *
	 *  @constructor
	 *  @extends {Tone}
	 *  @param {AudioBuffer|string} url The url to load, or the audio buffer to set.
	 *  @param {Function=} onload A callback which is invoked after the buffer is loaded.
	 *                            It's recommended to use Buffer.onload instead
	 *                            since it will give you a callback when ALL buffers are loaded.
	 *  @param {Function=} onerror The callback to invoke if there is an error
	 *  @example
	 * var buffer = new Buffer("path/to/sound.mp3", function(){
	 * 	//the buffer is now available.
	 * 	var buff = buffer.get();
	 * });
	 */
	export var Buffer = function(){

		var options = this.optionsObject(arguments, ["url", "onload", "onerror"], Buffer.defaults);

		/**
		 *  stores the loaded AudioBuffer
		 *  @type {AudioBuffer}
		 *  @private
		 */
		this._buffer = null;

		/**
		 *  indicates if the buffer should be reversed or not
		 *  @type {Boolean}
		 *  @private
		 */
		this._reversed = options.reverse;

		/**
		 *  The XHR
		 *  @type  {XMLHttpRequest}
		 *  @private
		 */
		this._xhr = null;

		if (options.url instanceof AudioBuffer || options.url instanceof Buffer){
			this.set(options.url);
			// invoke the onload callback
			if (options.onload){
				options.onload(this);
			}
		} else if (this.isString(options.url)){
			this.load(options.url, options.onload, options.onerror);
		}
	};

	Tone.extend(Buffer);

	/**
	 *  the default parameters
	 *  @type {Object}
	 */
	Buffer.defaults = {
		"url" : undefined,
		"reverse" : false
	};

	/**
	 *  Pass in an AudioBuffer or Buffer to set the value
	 *  of this buffer.
	 *  @param {AudioBuffer|Buffer} buffer the buffer
	 *  @returns {Buffer} this
	 */
	Buffer.prototype.set = function(buffer){
		if (buffer instanceof Buffer){
			this._buffer = buffer.get();
		} else {
			this._buffer = buffer;
		}
		return this;
	};

	/**
	 *  @return {AudioBuffer} The audio buffer stored in the object.
	 */
	Buffer.prototype.get = function(){
		return this._buffer;
	};

	/**
	 *  Makes an xhr reqest for the selected url then decodes
	 *  the file as an audio buffer. Invokes
	 *  the callback once the audio buffer loads.
	 *  @param {String} url The url of the buffer to load.
	 *                      filetype support depends on the
	 *                      browser.
	 *  @returns {Promise} returns a Promise which resolves with the Buffer
	 */
	Buffer.prototype.load = function(url, onload, onerror){

		var promise = new Promise(function(load, error){

			this._xhr = Buffer.load(url,

				//success
				function(buff){
					this._xhr = null;
					this.set(buff);
					load(this);
					if (onload){
						onload(this);
					}
				}.bind(this),

				//error
				function(err){
					this._xhr = null;
					error(err);
					if (onerror){
						onerror(err);
					}
				}.bind(this));

		}.bind(this));

		return promise;
	};

	/**
	 *  dispose and disconnect
	 *  @returns {Buffer} this
	 */
	Buffer.prototype.dispose = function(){
		Emitter.prototype.dispose.call(this);
		this._buffer = null;
		if (this._xhr){
			Buffer._currentDownloads--;
			this._xhr.abort();
			this._xhr = null;
		}
		return this;
	};

	/**
	 * If the buffer is loaded or not
	 * @memberOf Buffer#
	 * @type {Boolean}
	 * @name loaded
	 * @readOnly
	 */
	Object.defineProperty(Buffer.prototype, "loaded", {
		get : function(){
			return this.length > 0;
		},
	});

	/**
	 * The duration of the buffer.
	 * @memberOf Buffer#
	 * @type {Number}
	 * @name duration
	 * @readOnly
	 */
	Object.defineProperty(Buffer.prototype, "duration", {
		get : function(){
			if (this._buffer){
				return this._buffer.duration;
			} else {
				return 0;
			}
		},
	});

	/**
	 * The length of the buffer in samples
	 * @memberOf Buffer#
	 * @type {Number}
	 * @name length
	 * @readOnly
	 */
	Object.defineProperty(Buffer.prototype, "length", {
		get : function(){
			if (this._buffer){
				return this._buffer.length;
			} else {
				return 0;
			}
		},
	});

	/**
	 * The number of discrete audio channels. Returns 0 if no buffer
	 * is loaded.
	 * @memberOf Buffer#
	 * @type {Number}
	 * @name numberOfChannels
	 * @readOnly
	 */
	Object.defineProperty(Buffer.prototype, "numberOfChannels", {
		get : function(){
			if (this._buffer){
				return this._buffer.numberOfChannels;
			} else {
				return 0;
			}
		},
	});

	/**
	 *  Set the audio buffer from the array
	 *  @param {Float32Array} array The array to fill the audio buffer
	 *  @param {Number} [channels=1] The number of channels contained in the array.
	 *                               If the channel is more than 1, the input array
	 *                               is expected to be a multidimensional array
	 *                               with dimensions equal to the number of channels.
	 *  @return {Buffer} this
	 */
	Buffer.prototype.fromArray = function(array){
		var isMultidimensional = array[0].length > 0;
		var channels = isMultidimensional ? array.length : 1;
		var len = isMultidimensional ? array[0].length : array.length;
		var buffer = this.context.createBuffer(channels, len, this.context.sampleRate);
		if (!isMultidimensional && channels === 1){
			array = [array];
		}
		for (var c = 0; c < channels; c++){
			if (this.isFunction(buffer.copyToChannel)){
				buffer.copyToChannel(array[c], c);
			} else {
				var channel = buffer.getChannelData(c);
				var channelArray = array[c];
				for (var i = 0; i < channelArray.length; i++){
					channel[i] = channelArray[i];
				}
			}
		}
		this._buffer = buffer;
		return this;
	};

	/**
	 * 	Sums muliple channels into 1 channel
	 *  @param {Number=} channel Optionally only copy a single channel from the array.
	 *  @return {Array}
	 */
	Buffer.prototype.toMono = function(chanNum){
		if (this.isNumber(chanNum)){
			this.fromArray(this.toArray(chanNum));
		} else {
			var outputArray = new Float32Array(this.length);
			var numChannels = this.numberOfChannels;
			for (var channel = 0; channel < numChannels; channel++){
				var channelArray = this.toArray(channel);
				for (var i = 0; i < channelArray.length; i++){
					outputArray[i] += channelArray[i];
				}
			}
			//divide by the number of channels
			outputArray = outputArray.map(function(sample){
				return sample / numChannels;
			});
			this.fromArray(outputArray);
		}
		return this;
	};

	/**
	 * 	Get the buffer as an array. Single channel buffers will return a 1-dimensional
	 * 	Float32Array, and multichannel buffers will return multidimensional arrays.
	 *  @param {Number=} channel Optionally only copy a single channel from the array.
	 *  @return {Array}
	 */
	Buffer.prototype.toArray = function(channel){
		if (this.isNumber(channel)){
			return this._buffer.getChannelData(channel);
		} else {
			var ret = [];
			for (var c = 0; c < this.numberOfChannels; c++){
				ret[c] = new Float32Array(this.length);
				if (this.isFunction(this._buffer.copyFromChannel)){
					this._buffer.copyFromChannel(ret[c], c);
				} else {
					var channelData = this._buffer.getChannelData(c);
					var retArray = ret[c];
					for (var i = 0; i < channelData.length; i++){
						retArray[i] = channelData[i];
					}
				}
			}
			if (ret.length === 1){
				return ret[0];
			} else {
				return ret;
			}
		}
	};

	/**
	 *  Cut a subsection of the array and return a buffer of the
	 *  subsection. Does not modify the original buffer
	 *  @param {Time} start The time to start the slice
	 *  @param {Time=} end The end time to slice. If none is given
	 *                     will default to the end of the buffer
	 *  @return {Buffer} this
	 */
	Buffer.prototype.slice = function(start, end){
		end = this.defaultArg(end, this.duration);
		var startSamples = Math.floor(this.context.sampleRate * this.toSeconds(start));
		var endSamples = Math.floor(this.context.sampleRate * this.toSeconds(end));
		var replacement = [];
		for (var i = 0; i < this.numberOfChannels; i++){
			replacement[i] = this.toArray(i).slice(startSamples, endSamples);
		}
		var retBuffer = new Buffer().fromArray(replacement);
		return retBuffer;
	};

	/**
	 *  Reverse the buffer.
	 *  @private
	 *  @return {Buffer} this
	 */
	Buffer.prototype._reverse = function(){
		if (this.loaded){
			for (var i = 0; i < this._buffer.numberOfChannels; i++){
				Array.prototype.reverse.call(this._buffer.getChannelData(i));
			}
		}
		return this;
	};

	/**
	 * Reverse the buffer.
	 * @memberOf Buffer#
	 * @type {Boolean}
	 * @name reverse
	 */
	Object.defineProperty(Buffer.prototype, "reverse", {
		get : function(){
			return this._reversed;
		},
		set : function(rev){
			if (this._reversed !== rev){
				this._reversed = rev;
				this._reverse();
			}
		},
	});

	///////////////////////////////////////////////////////////////////////////
	// STATIC METHODS
	///////////////////////////////////////////////////////////////////////////

	//statically inherits Emitter methods
	Emitter.mixin(Buffer);

	/**
	 *  the static queue for all of the xhr requests
	 *  @type {Array}
	 *  @private
	 */
	Buffer._downloadQueue = [];

	/**
	 *  the total number of downloads
	 *  @type {Number}
	 *  @private
	 */
	Buffer._currentDownloads = 0;

	/**
	 *  A path which is prefixed before every url.
	 *  @type  {String}
	 *  @static
	 */
	Buffer.baseUrl = "";

	/**
	 *  Loads a url using XMLHttpRequest.
	 *  @param {String} url
	 *  @param {Function} onload
	 *  @param {Function} onerror
	 *  @param {Function} onprogress
	 *  @return {XMLHttpRequest}
	 */
	Buffer.load = function(url, onload, onerror){
		//default
		onload = onload || Tone.noOp;

		function onError(e){
			if (onerror){
				onerror(e);
				Buffer.emit("error", e);
			} else {
				throw new Error(e);
			}
		}

		function onProgress(){
			//calculate the progress
			var totalProgress = 0;
			for (var i = 0; i < Buffer._downloadQueue.length; i++){
				totalProgress += Buffer._downloadQueue[i].progress;
			}
			Buffer.emit("progress", totalProgress / Buffer._downloadQueue.length);
		}

		var request = new XMLHttpRequest();
		request.open("GET", Buffer.baseUrl + url, true);
		request.responseType = "arraybuffer";
		//start out as 0
		request.progress = 0;

		Buffer._currentDownloads++;
		Buffer._downloadQueue.push(request);

		request.addEventListener("load", function(){
			if (request.status === 200){
				context.decodeAudioData(request.response, function(buff) {

					request.progress = 1;
					onProgress();
					onload(buff);

					Buffer._currentDownloads--;
					if (Buffer._currentDownloads === 0){
						// clear the downloads
						Buffer._downloadQueue = [];
						//emit the event at the end
						Buffer.emit("load");
					}

				}, function(){
					onError("Buffer: could not decode audio data: "+url);
				});
			} else {
				onError("Buffer: could not locate file: "+url);
			}
		});
		request.addEventListener("error", onError);

		request.addEventListener("progress", function(event){
			if (event.lengthComputable){
				//only go to 95%, the last 5% is when the audio is decoded
				request.progress = (event.loaded / event.total) * 0.95;
				onProgress();
			}
		});

		request.send();

		return request;
	};

	/**
	 *  Stop all of the downloads in progress
	 *  @return {Buffer}
	 *  @static
	 */
	Buffer.cancelDownloads = function(){
		Buffer._downloadQueue.forEach(function(request){
			request.abort();
		});
		Buffer._currentDownloads = 0;
		return Buffer;
	};

	/**
	 *  Checks a url's extension to see if the current browser can play that file type.
	 *  @param {String} url The url/extension to test
	 *  @return {Boolean} If the file extension can be played
	 *  @static
	 *  @example
	 * Buffer.supportsType("wav"); //returns true
	 * Buffer.supportsType("path/to/file.wav"); //returns true
	 */
	Buffer.supportsType = function(url){
		var extension = url.split(".");
		extension = extension[extension.length - 1];
		var response = document.createElement("audio").canPlayType("audio/"+extension);
		return response !== "";
	};

	/**
	 *  Returns a Promise which resolves when all of the buffers have loaded
	 */
	loaded = function(){
		var onload, onerror;
		return new Promise(function(success, fail){
			onload = function(){
				success();
			};
			onerror = function(){
				fail();
			};
			//add the event listeners
			Buffer.on("load", onload);
			Buffer.on("error", onerror);
		}).then(function(){
			//remove the events when it's resolved
			Buffer.off("load", onload);
			Buffer.off("error", onerror);
		}).catch(function(){
			//remove the events when it's resolved
			Buffer.off("load", onload);
			Buffer.off("error", onerror);
		});
	};
