import { Tone } from 'core/Tone';

import { Signal } from 'signal/Signal';

import { Gain } from 'core/Gain';


	"use strict";

	/**
	 *  @class Volume is a simple volume node, useful for creating a volume fader.
	 *
	 *  @extends {Tone}
	 *  @constructor
	 *  @param {Decibels} [volume=0] the initial volume
	 *  @example
	 * var vol = new Volume(-12);
	 * instrument.chain(vol, Master);
	 */
	export var Volume = function(){

		var options = this.optionsObject(arguments, ["volume"], Volume.defaults);

		/**
		 * the output node
		 * @type {GainNode}
		 * @private
		 */
		this.output = this.input = new Gain(options.volume, Type.Decibels);

		/**
		 * The unmuted volume
		 * @type {Decibels}
		 * @private
		 */
		this._unmutedVolume = 0;

		/**
		 *  if the volume is muted
		 *  @type {Boolean}
		 *  @private
		 */
		this._muted = false;

		/**
		 *  The volume control in decibels.
		 *  @type {Decibels}
		 *  @signal
		 */
		this.volume = this.output.gain;

		this._readOnly("volume");

		//set the mute initially
		this.mute = options.mute;
	};

	Tone.extend(Volume);

	/**
	 *  Defaults
	 *  @type  {Object}
	 *  @const
	 *  @static
	 */
	Volume.defaults = {
		"volume" : 0,
		"mute" : false
	};

	/**
	 * Mute the output.
	 * @memberOf Volume#
	 * @type {boolean}
	 * @name mute
	 * @example
	 * //mute the output
	 * volume.mute = true;
	 */
	Object.defineProperty(Volume.prototype, "mute", {
		get : function(){
			return this._muted;
		},
		set : function(mute){
			if (!this._muted && mute){
				this._unmutedVolume = this.volume.value;
				//maybe it should ramp here?
				this.volume.value = -Infinity;
			} else if (this._muted && !mute){
				this.volume.value = this._unmutedVolume;
			}
			this._muted = mute;
		}
	});

	/**
	 *  clean up
	 *  @returns {Volume} this
	 */
	Volume.prototype.dispose = function(){
		this.input.dispose();
		Tone.prototype.dispose.call(this);
		this._writable("volume");
		this.volume.dispose();
		this.volume = null;
		return this;
	};
