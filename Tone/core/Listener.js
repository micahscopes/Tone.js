import { Tone } from 'core/Tone';

import { CrossFade } from 'component/CrossFade';

import { Merge } from 'component/Merge';

import { Split } from 'component/Split';

import { Signal } from 'signal/Signal';

import { AudioToGain } from 'signal/AudioToGain';

import { Zero } from 'signal/Zero';


	"use strict";

	/**
	 *  @class  Both Panner3D and Listener have a position in 3D space
	 *          using a right-handed cartesian coordinate system.
	 *          The units used in the coordinate system are not defined;
	 *          these coordinates are independent/invariant of any particular
	 *          units such as meters or feet. Panner3D objects have an forward
	 *          vector representing the direction the sound is projecting. Additionally,
	 *          they have a sound cone representing how directional the sound is.
	 *          For example, the sound could be omnidirectional, in which case it would
	 *          be heard anywhere regardless of its forward, or it can be more directional
	 *          and heard only if it is facing the listener. Listener objects
	 *          (representing a person's ears) have an forward and up vector
	 *          representing in which direction the person is facing. Because both the
	 *          source stream and the listener can be moving, they both have a velocity
	 *          vector representing both the speed and direction of movement. Taken together,
	 *          these two velocities can be used to generate a doppler shift effect which changes the pitch.
	 *          <br><br>
	 *          Note: the position of the Listener will have no effect on nodes not connected to a Panner3D
	 *
	 *  @constructor
	 *  @extends {Tone}
	 *  @singleton
	 *  @param {Number} positionX The initial x position.
	 *  @param {Number} positionY The initial y position.
	 *  @param {Number} positionZ The initial z position.
	 */
	export var Listener = function(){

		var options = this.optionsObject(arguments, ["positionX", "positionY", "positionZ"], ListenerConstructor.defaults);

		/**
		 *  Holds the current forward orientation
		 *  @type  {Array}
		 *  @private
		 */
		this._orientation = [options.forwardX, options.forwardY, options.forwardZ, options.upX, options.upY, options.upZ];

		/**
		 *  Holds the current position
		 *  @type  {Array}
		 *  @private
		 */
		this._position = [options.positionX, options.positionY, options.positionZ];

		// set the default position/forward
		this.forwardX = options.forwardX;
		this.forwardY = options.forwardY;
		this.forwardZ = options.forwardZ;
		this.upX = options.upX;
		this.upY = options.upY;
		this.upZ = options.upZ;
		this.positionX = options.positionX;
		this.positionY = options.positionY;
		this.positionZ = options.positionZ;
	};

	Tone.extend(Listener);

	/**
	 *  the default parameters
	 *  @static
	 *  @const
	 *  @type {Object}
	 *  Defaults according to the specification
	 */
	Listener.defaults = {
		"positionX" : 0,
		"positionY" : 0,
		"positionZ" : 0,
		"forwardX" : 0,
		"forwardY" : 0,
		"forwardZ" : 1,
		"upX" : 0,
		"upY" : 1,
		"upZ" : 0
	};

	/**
	 * The ramp time which is applied to the setTargetAtTime
	 * @type {Number}
	 * @private
	 */
	Listener.prototype._rampTimeConstant = 0.01;

	/**
	 *  Sets the position of the listener in 3d space.
	 *  @param  {Number}  x
	 *  @param  {Number}  y
	 *  @param  {Number}  z
	 *  @return {Listener} this
	 */
	Listener.prototype.setPosition = function(x, y, z){
		if (this.context.listener.positionX){
			var now = this.now();
			this.context.listener.positionX.setTargetAtTime(x, now, this._rampTimeConstant);
			this.context.listener.positionY.setTargetAtTime(y, now, this._rampTimeConstant);
			this.context.listener.positionZ.setTargetAtTime(z, now, this._rampTimeConstant);
		} else {
			this.context.listener.setPosition(x, y, z);
		}
		this._position = Array.prototype.slice.call(arguments);
		return this;
	};

	/**
	 *  Sets the orientation of the listener using two vectors, the forward
	 *  vector (which direction the listener is facing) and the up vector
	 *  (which the up direction of the listener). An up vector
	 *  of 0, 0, 1 is equivalent to the listener standing up in the Z direction.
	 *  @param  {Number}  x
	 *  @param  {Number}  y
	 *  @param  {Number}  z
	 *  @param  {Number}  upX
	 *  @param  {Number}  upY
	 *  @param  {Number}  upZ
	 *  @return {Listener} this
	 */
	Listener.prototype.setOrientation = function(x, y, z, upX, upY, upZ){
		if (this.context.listener.forwardX){
			var now = this.now();
			this.context.listener.forwardX.setTargetAtTime(x, now, this._rampTimeConstant);
			this.context.listener.forwardY.setTargetAtTime(y, now, this._rampTimeConstant);
			this.context.listener.forwardZ.setTargetAtTime(z, now, this._rampTimeConstant);
			this.context.listener.upX.setTargetAtTime(upX, now, this._rampTimeConstant);
			this.context.listener.upY.setTargetAtTime(upY, now, this._rampTimeConstant);
			this.context.listener.upZ.setTargetAtTime(upZ, now, this._rampTimeConstant);
		} else {
			this.context.listener.setOrientation(x, y, z, upX, upY, upZ);
		}
		this._orientation = Array.prototype.slice.call(arguments);
		return this;
	};

	/**
	 *  The x position of the panner object.
	 *  @type {Number}
	 *  @memberOf Listener#
	 *  @name positionX
	 */
	Object.defineProperty(Listener.prototype, "positionX", {
		set : function(pos){
			this._position[0] = pos;
			this.setPosition.apply(this, this._position);
		},
		get : function(){
			return this._position[0];
		}
	});

	/**
	 *  The y position of the panner object.
	 *  @type {Number}
	 *  @memberOf Listener#
	 *  @name positionY
	 */
	Object.defineProperty(Listener.prototype, "positionY", {
		set : function(pos){
			this._position[1] = pos;
			this.setPosition.apply(this, this._position);
		},
		get : function(){
			return this._position[1];
		}
	});

	/**
	 *  The z position of the panner object.
	 *  @type {Number}
	 *  @memberOf Listener#
	 *  @name positionZ
	 */
	Object.defineProperty(Listener.prototype, "positionZ", {
		set : function(pos){
			this._position[2] = pos;
			this.setPosition.apply(this, this._position);
		},
		get : function(){
			return this._position[2];
		}
	});

	/**
	 *  The x coordinate of the listeners front direction. i.e.
	 *  which way they are facing.
	 *  @type {Number}
	 *  @memberOf Listener#
	 *  @name forwardX
	 */
	Object.defineProperty(Listener.prototype, "forwardX", {
		set : function(pos){
			this._orientation[0] = pos;
			this.setOrientation.apply(this, this._orientation);
		},
		get : function(){
			return this._orientation[0];
		}
	});

	/**
	 *  The y coordinate of the listeners front direction. i.e.
	 *  which way they are facing.
	 *  @type {Number}
	 *  @memberOf Listener#
	 *  @name forwardY
	 */
	Object.defineProperty(Listener.prototype, "forwardY", {
		set : function(pos){
			this._orientation[1] = pos;
			this.setOrientation.apply(this, this._orientation);
		},
		get : function(){
			return this._orientation[1];
		}
	});

	/**
	 *  The z coordinate of the listeners front direction. i.e.
	 *  which way they are facing.
	 *  @type {Number}
	 *  @memberOf Listener#
	 *  @name forwardZ
	 */
	Object.defineProperty(Listener.prototype, "forwardZ", {
		set : function(pos){
			this._orientation[2] = pos;
			this.setOrientation.apply(this, this._orientation);
		},
		get : function(){
			return this._orientation[2];
		}
	});

	/**
	 *  The x coordinate of the listener's up direction. i.e.
	 *  the direction the listener is standing in.
	 *  @type {Number}
	 *  @memberOf Listener#
	 *  @name upX
	 */
	Object.defineProperty(Listener.prototype, "upX", {
		set : function(pos){
			this._orientation[3] = pos;
			this.setOrientation.apply(this, this._orientation);
		},
		get : function(){
			return this._orientation[3];
		}
	});

	/**
	 *  The y coordinate of the listener's up direction. i.e.
	 *  the direction the listener is standing in.
	 *  @type {Number}
	 *  @memberOf Listener#
	 *  @name upY
	 */
	Object.defineProperty(Listener.prototype, "upY", {
		set : function(pos){
			this._orientation[4] = pos;
			this.setOrientation.apply(this, this._orientation);
		},
		get : function(){
			return this._orientation[4];
		}
	});

	/**
	 *  The z coordinate of the listener's up direction. i.e.
	 *  the direction the listener is standing in.
	 *  @type {Number}
	 *  @memberOf Listener#
	 *  @name upZ
	 */
	Object.defineProperty(Listener.prototype, "upZ", {
		set : function(pos){
			this._orientation[5] = pos;
			this.setOrientation.apply(this, this._orientation);
		},
		get : function(){
			return this._orientation[5];
		}
	});

	/**
	 *  Clean up.
	 *  @returns {Listener} this
	 */
	Listener.prototype.dispose = function(){
		this._orientation = null;
		this._position = null;
		return this;
	};

	//SINGLETON SETUP
	var ListenerConstructor = Listener;
	Listener = new ListenerConstructor();

	Context.on("init", function(context){
		if (context.Listener instanceof ListenerConstructor){
			//a single listener object
			Listener = context.Listener;
		} else {
			//make new Listener insides
			Listener = new ListenerConstructor();
		}
		context.Listener = Listener;
	});
	//END SINGLETON SETUP
