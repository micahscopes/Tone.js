import { Tone } from 'core';
import { Gain } from 'core';

	/**
	 *  @class Zero outputs 0's at audio-rate. The reason this has to be
	 *         it's own class is that many browsers optimize out Signal
	 *         with a value of 0 and will not process nodes further down the graph.
	 *  @extends {Tone}
	 */
	export function Zero(){

		/**
		 *  The gain node
		 *  @type  {Gain}
		 *  @private
		 */
		this._gain = this.input = this.output = new Gain();

		context._zeros.connect(this._gain);
	};

	Tone.extend(Zero);

	/**
	 *  clean up
	 *  @return  {Zero}  this
	 */
	Zero.prototype.dispose = function(){
		prototype.dispose.call(this);
		this._gain.dispose();
		this._gain = null;
		return this;
	};
