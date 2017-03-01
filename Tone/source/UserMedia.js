import { Tone } from 'core';
import { Volume } from 'component';

	"use strict";

	/**
	 *  @class  UserMedia uses MediaDevices.getUserMedia to open up
	 *          and external microphone or audio input. Check
	 *          [MediaDevices API Support](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
	 *          to see which browsers are supported. Access to an external input
	 *          is limited to secure (HTTPS) connections.
	 *
	 *  @constructor
	 *  @extends {Tone}
	 *  @param {Decibels=} volume The level of the input
	 *  @example
	 * //list the inputs and open the third one
	 * var motu = new UserMedia();
	 *
	 * //opening the input asks the user to activate their mic
	 * motu.open().then(function(){
	 * 	//opening is activates the microphone
	 * 	//starting lets audio through
	 * 	motu.start(10);
	 * });
	 */

	export function UserMedia(){

		var options = this.optionsObject(arguments, ["volume"], UserMedia.defaults);

		/**
		 *  The MediaStreamNode
		 *  @type {MediaStreamAudioSourceNode}
		 *  @private
		 */
		this._mediaStream = null;

		/**
		 *  The media stream created by getUserMedia.
		 *  @type {LocalMediaStream}
		 *  @private
		 */
		this._stream = null;

		/**
		 *  The open device
		 *  @type  {MediaDeviceInfo}
		 *  @private
		 */
		this._device = null;

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
		 * input.volume.value = -6;
		 */
		this.volume = this._volume.volume;
		this._readOnly("volume");

		this.mute = options.mute;
	};

	Tone.extend(UserMedia);

	/**
	 * the default parameters
	 * @type {Object}
	 */
	UserMedia.defaults = {
		"volume" : 0,
		"mute" : false
	};

	/**
	 *  Open the media stream. If a string is passed in, it is assumed
	 *  to be the label or id of the stream, if a number is passed in,
	 *  it is the input number of the stream.
	 *  @param  {String|Number} [labelOrId="default"] The label or id of the audio input media device.
	 *                                                With no argument, the default stream is opened.
	 *  @return {Promise} The promise is resolved when the stream is open.
	 */
	UserMedia.prototype.open = function(labelOrId){
		labelOrId = this.defaultArg(labelOrId, "default");
		return this.enumerateDevices().then(function(devices){
			var device;
			if (this.isNumber(labelOrId)){
				device = devices[labelOrId];
			} else {
				device = devices.find(function(device){
					return device.label === labelOrId || device.deviceId === labelOrId;
				});
				if (!device){
					//otherwise just take the first one
					device = devices[0];
				}
			}
			//didn't find a matching device
			if (!device){
				throw new Error("UserMedia: no matching audio inputs.");
			}
			this._device = device;
			//do getUserMedia
			var constraints = {
				audio : {
					"deviceId": device.deviceId,
					"echoCancellation": false,
					"sampleRate" : this.context.sampleRate
				}
			};
			return navigator.mediaDevices.getUserMedia(constraints).then(function(stream){
				//start a new source only if the previous one is closed
				if (!this._stream){
					this._stream = stream;
					//Wrap a MediaStreamSourceNode around the live input stream.
					this._mediaStream = this.context.createMediaStreamSource(stream);
					//Connect the MediaStreamSourceNode to a gate gain node
					this._mediaStream.connect(this.output);
				}
				return this;
			}.bind(this));
		}.bind(this));
	};

	/**
	 *  Close the media stream
	 *  @return {UserMedia} this
	 */
	UserMedia.prototype.close = function(){
		if(this._stream){
			this._stream.getAudioTracks().forEach(function(track){
				track.stop();
			});
			this._stream = null;
			//remove the old media stream
			this._mediaStream.disconnect();
			this._mediaStream = null;
		}
		this._device = null;
		return this;
	};

	/**
	 *  Returns a promise which resolves with the list of audio input devices available.
	 *  @return {Promise} The promise that is resolved with the devices
	 *  @example
	 * extInput.enumerateDevices().then(function(devices){
	 * 	console.log(devices)
	 * })
	 */
	UserMedia.prototype.enumerateDevices = function(){
		return navigator.mediaDevices.enumerateDevices().then(function(devices){
			return devices.filter(function(device){
				return device.kind === "audioinput";
			});
		});
	};

	/**
	 *  Returns the playback state of the source, "started" when the microphone is open
	 *  and "stopped" when the mic is closed.
	 *  @type {State}
	 *  @readOnly
	 *  @memberOf UserMedia#
	 *  @name state
	 */
	Object.defineProperty(UserMedia.prototype, "state", {
		get : function(){
			return this._stream && this._stream.active ? State.Started : State.Stopped;
		}
	});

	/**
	 * 	Returns an identifier for the represented device that is
	 * 	persisted across sessions. It is un-guessable by other applications and
	 * 	unique to the origin of the calling application. It is reset when the
	 * 	user clears cookies (for Private Browsing, a different identifier is
	 * 	used that is not persisted across sessions). Returns undefined when the
	 * 	device is not open.
	 *  @type {String}
	 *  @readOnly
	 *  @memberOf UserMedia#
	 *  @name deviceId
	 */
	Object.defineProperty(UserMedia.prototype, "deviceId", {
		get : function(){
			if (this._device){
				return this._device.deviceId;
			}
		}
	});

	/**
	 * 	Returns a group identifier. Two devices have the
	 * 	same group identifier if they belong to the same physical device.
	 * 	Returns undefined when the device is not open.
	 *  @type {String}
	 *  @readOnly
	 *  @memberOf UserMedia#
	 *  @name groupId
	 */
	Object.defineProperty(UserMedia.prototype, "groupId", {
		get : function(){
			if (this._device){
				return this._device.groupId;
			}
		}
	});

	/**
	 * 	Returns a label describing this device (for example "Built-in Microphone").
	 * 	Returns undefined when the device is not open or label is not available
	 * 	because of permissions.
	 *  @type {String}
	 *  @readOnly
	 *  @memberOf UserMedia#
	 *  @name groupId
	 */
	Object.defineProperty(UserMedia.prototype, "label", {
		get : function(){
			if (this._device){
				return this._device.label;
			}
		}
	});

	/**
	 * Mute the output.
	 * @memberOf UserMedia#
	 * @type {boolean}
	 * @name mute
	 * @example
	 * //mute the output
	 * userMedia.mute = true;
	 */
	Object.defineProperty(UserMedia.prototype, "mute", {
		get : function(){
			return this._volume.mute;
		},
		set : function(mute){
			this._volume.mute = mute;
		}
	});

	/**
	 * Clean up.
	 * @return {UserMedia} this
	 */
	UserMedia.prototype.dispose = function(){
		prototype.dispose.call(this);
		this.close();
		this._writable("volume");
		this._volume.dispose();
		this._volume = null;
		this.volume = null;
		return this;
	};

	/**
	 *  If getUserMedia is supported by the browser.
	 *  @type  {Boolean}
	 *  @memberOf UserMedia#
	 *  @name supported
	 *  @static
	 *  @readOnly
	 */
	Object.defineProperty(UserMedia, "supported", {
		get : function(){
			return !prototype.isUndef(navigator.mediaDevices) && prototype.isFunction(navigator.mediaDevices.getUserMedia);
		}
	});
