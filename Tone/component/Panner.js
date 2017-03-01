import { Tone } from 'core';
import { CrossFade } from 'component';
import { Merge } from 'component';
import { Split } from 'component';
import { Signal } from 'signal';
import { AudioToGain } from 'signal';
import { Zero } from 'signal';

	"use strict";

	/**
	 *  @class  Panner is an equal power Left/Right Panner and does not
	 *          support 3D. Panner uses the StereoPannerNode when available.
	 *
	 *  @constructor
	 *  @extends {Tone}
	 *  @param {NormalRange} [initialPan=0] The initail panner value (defaults to 0 = center)
	 *  @example
	 *  //pan the input signal hard right.
	 *  var panner = new Panner(1);
	 */
	export function Panner(initialPan){

		if (this._hasStereoPanner){

			/**
			 *  the panner node
			 *  @type {StereoPannerNode}
			 *  @private
			 */
			this._panner = this.input = this.output = this.context.createStereoPanner();

			/**
			 *  The pan control. -1 = hard left, 1 = hard right.
			 *  @type {NormalRange}
			 *  @signal
			 */
			this.pan = this._panner.pan;

		} else {

			/**
			 *  the dry/wet knob
			 *  @type {CrossFade}
			 *  @private
			 */
			this._crossFade = new CrossFade();

			/**
			 *  @type {Merge}
			 *  @private
			 */
			this._merger = this.output = new Merge();

			/**
			 *  @type {Split}
			 *  @private
			 */
			this._splitter = this.input = new Split();

			/**
			 *  The pan control. -1 = hard left, 1 = hard right.
			 *  @type {AudioRange}
			 *  @signal
			 */
			this.pan = new Signal(0, Type.AudioRange);

			/**
			 *  always sends 0
			 *  @type {Zero}
			 *  @private
			 */
			this._zero = new Zero();

			/**
			 *  The analog to gain conversion
			 *  @type  {AudioToGain}
			 *  @private
			 */
			this._a2g = new AudioToGain();

			//CONNECTIONS:
			this._zero.connect(this._a2g);
			this.pan.chain(this._a2g, this._crossFade.fade);
			//left channel is a, right channel is b
			this._splitter.connect(this._crossFade, 0, 0);
			this._splitter.connect(this._crossFade, 1, 1);
			//merge it back together
			this._crossFade.a.connect(this._merger, 0, 0);
			this._crossFade.b.connect(this._merger, 0, 1);
		}
		//initial value
		this.pan.value = this.defaultArg(initialPan, 0);
		this._readOnly("pan");
	};

	Tone.extend(Panner);

	/**
	 *  indicates if the panner is using the new StereoPannerNode internally
	 *  @type  {boolean}
	 *  @private
	 */
	Panner.prototype._hasStereoPanner = prototype.isFunction(context.createStereoPanner);

	/**
	 *  Clean up.
	 *  @returns {Panner} this
	 */
	Panner.prototype.dispose = function(){
		prototype.dispose.call(this);
		this._writable("pan");
		if (this._hasStereoPanner){
			this._panner.disconnect();
			this._panner = null;
			this.pan = null;
		} else {
			this._zero.dispose();
			this._zero = null;
			this._crossFade.dispose();
			this._crossFade = null;
			this._splitter.dispose();
			this._splitter = null;
			this._merger.dispose();
			this._merger = null;
			this.pan.dispose();
			this.pan = null;
			this._a2g.dispose();
			this._a2g = null;
		}
		return this;
	};
