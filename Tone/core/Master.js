import { Tone } from 'core/Tone';

import { Volume } from 'component/Volume';

import { Context } from 'core/Context';


	"use strict";

	/**
	 *  @class  A single master output which is connected to the
	 *          AudioDestinationNode (aka your speakers).
	 *          It provides useful conveniences such as the ability
	 *          to set the volume and mute the entire application.
	 *          It also gives you the ability to apply master effects to your application.
	 *          <br><br>
	 *          Like Transport, A single Master is created
	 *          on initialization and you do not need to explicitly construct one.
	 *
	 *  @constructor
	 *  @extends {Tone}
	 *  @singleton
	 *  @example
	 * //the audio will go from the oscillator to the speakers
	 * oscillator.connect(Master);
	 * //a convenience for connecting to the master output is also provided:
	 * oscillator.toMaster();
	 * //the above two examples are equivalent.
	 */
	export var Master = function(){

		this.createInsOuts(1, 1);

		/**
		 *  The private volume node
		 *  @type  {Volume}
		 *  @private
		 */
		this._volume = this.output = new Volume();

		/**
		 * The volume of the master output.
		 * @type {Decibels}
		 * @signal
		 */
		this.volume = this._volume.volume;

		this._readOnly("volume");
		//connections
		this.input.chain(this.output, this.context.destination);
	};

	Tone.extend(Master);

	/**
	 *  @type {Object}
	 *  @const
	 */
	Master.defaults = {
		"volume" : 0,
		"mute" : false
	};

	/**
	 * Mute the output.
	 * @memberOf Master#
	 * @type {boolean}
	 * @name mute
	 * @example
	 * //mute the output
	 * Master.mute = true;
	 */
	Object.defineProperty(Master.prototype, "mute", {
		get : function(){
			return this._volume.mute;
		},
		set : function(mute){
			this._volume.mute = mute;
		}
	});

	/**
	 *  Add a master effects chain. NOTE: this will disconnect any nodes which were previously
	 *  chained in the master effects chain.
	 *  @param {AudioNode|..} args All arguments will be connected in a row
	 *                                  and the Master will be routed through it.
	 *  @return  {Master}  this
	 *  @example
	 * //some overall compression to keep the levels in check
	 * var masterCompressor = new Compressor({
	 * 	"threshold" : -6,
	 * 	"ratio" : 3,
	 * 	"attack" : 0.5,
	 * 	"release" : 0.1
	 * });
	 * //give a little boost to the lows
	 * var lowBump = new Filter(200, "lowshelf");
	 * //route everything through the filter
	 * //and compressor before going to the speakers
	 * Master.chain(lowBump, masterCompressor);
	 */
	Master.prototype.chain = function(){
		this.input.disconnect();
		this.input.chain.apply(this.input, arguments);
		arguments[arguments.length - 1].connect(this.output);
	};

	/**
	 *  Clean up
	 *  @return  {Master}  this
	 */
	Master.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._writable("volume");
		this._volume.dispose();
		this._volume = null;
		this.volume = null;
	};

	///////////////////////////////////////////////////////////////////////////
	//	AUGMENT TONE's Tone.PROTOTYPE
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  Connect 'this' to the master output. Shorthand for this.connect(Master)
	 *  @returns {Tone} this
	 *  @example
	 * //connect an oscillator to the master output
	 * var osc = new Oscillator().toMaster();
	 */
	Tone.prototype.toMaster = function(){
		this.connect(Master);
		return this;
	};

	/**
	 *  Also augment AudioNode's Tone.prototype to include toMaster
	 *  as a convenience
	 *  @returns {AudioNode} this
	 */
	AudioNode.prototype.toMaster = function(){
		this.connect(Master);
		return this;
	};

	/**
	 *  initialize the module and listen for new audio contexts
	 */
	var MasterConstructor = Master;
	Master = new MasterConstructor();

	Context.on("init", function(context){
		// if it already exists, just restore it
		if (context.Master instanceof MasterConstructor){
			Master = context.Master;
		} else {
			Master = new MasterConstructor();
		}
		context.Master = Master;
	});
