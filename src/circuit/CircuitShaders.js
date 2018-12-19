// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Config} from "src/Config.js"
import {Controls} from "src/circuit/Controls.js"
import {ketArgs, ketShaderPermute} from "src/circuit/KetShaderUtil.js"
import {Shaders} from "src/webgl/Shaders.js"
import {Util} from "src/base/Util.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglConfiguredShader} from "src/webgl/WglConfiguredShader.js"
import {
    currentShaderCoder,
    makePseudoShaderWithInputsAndOutputAndCode,
    Inputs,
    Outputs
} from "src/webgl/ShaderCoders.js"

/**
 * Defines operations used to initialize, advance, and inspect quantum states stored in WebGL textures.
 */
class CircuitShaders {}

/**
 * Returns a configured shader that renders the superposition corresponding to a classical state.
 *
 * @param {!int} stateBitMask
 * @returns {!WglConfiguredShader}
 */
CircuitShaders.classicalState = stateBitMask => SET_SINGLE_PIXEL_SHADER(
    WglArg.int("state", stateBitMask));
const SET_SINGLE_PIXEL_SHADER = makePseudoShaderWithInputsAndOutputAndCode([], Outputs.vec2(), `
    uniform int state;
    vec2 outputFor(int k) {
        return vec2(float(k == state), 0.0);
    }`);

/**
 * Renders a texture with the given background texture, but with the given foreground texture's data scanned
 * linearly into the background.
 *
 * @param {!int} offset
 * @param {!WglTexture} foregroundTexture
 * @param {!WglTexture} backgroundTexture
 * @returns {!WglConfiguredShader}
 */
CircuitShaders.linearOverlay = (offset, foregroundTexture, backgroundTexture) => LINEAR_OVERLAY_SHADER(
    backgroundTexture,
    foregroundTexture,
    WglArg.int("offset", offset));
const LINEAR_OVERLAY_SHADER = makePseudoShaderWithInputsAndOutputAndCode(
    [
        Inputs.vec4('back'),
        Inputs.vec4('fore')
    ],
    Outputs.vec4(),
    `
    uniform int offset;
    vec4 outputFor(int k) {
        // Note: can't use multiplication to combine because it spreads NaNs from the background into the foreground.
        return k >= offset && k < offset + len_fore() ? read_fore(k - offset) : read_back(k);
    }`);

/**
 * Returns a configured shader that renders a control mask texture corresponding to the given control mask, with 1s
 * at pixels meeting the control and 0s at pixels not meeting the control.
 * @param {!Controls} controlMask
 * @returns {!WglConfiguredShader}
 */
CircuitShaders.controlMask = controlMask => {
    if (controlMask.isEqualTo(Controls.NONE)) {
        return Shaders.color(1, 0, 0, 0);
    }

    return CONTROL_MASK_SHADER(
        WglArg.int('used', controlMask.inclusionMask),
        WglArg.int('desired', controlMask.desiredValueMask));
};
		
const CONTROL_MASK_SHADER = makePseudoShaderWithInputsAndOutputAndCode([], Outputs.bool(), `
    uniform int used;
    uniform int desired;

    bool outputFor(int k) {
        int mwc = ${Config.MAX_WIRE_COUNT};
       
        ${Config.WGL2? 'return ((k ^ desired) & used) == (1 << mwc) - 1' : 
        'int bit = 1;\n' +
        'for (int i = 0; i < mwc; i++) {\n' +
            'pass *= modi(abs(k / bit - desired / bit) * (used / bit),2);\n' + 
            'bit *= 2;\n' +
        '}\n' + 
        'return bool(pass)'};
    }`);

/**
 * Returns a configured shader that renders only the control-matching parts of an input texture to a smaller output
 * texture. This allows later shaders to omit any control-masking steps (and to work on less data).
 * @param {!Controls} controlMask
 * @param {!WglTexture} dataTexture
 * @returns {!WglConfiguredShader}
 */
CircuitShaders.controlSelect = (controlMask, dataTexture) => {
    if (controlMask.isEqualTo(Controls.NONE)) {
        return Shaders.passthrough(dataTexture);
    }

    return CONTROL_SELECT_SHADER(
        dataTexture,
        WglArg.int('used', controlMask.inclusionMask),
        WglArg.int('desired', controlMask.desiredValueMask));
};
const CONTROL_SELECT_SHADER = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.vec2('input')],
    Outputs.vec2(),
    `
    uniform int used;
    uniform int desired;

    /**
     * Inserts bits from the given value into the holes between used bits in the desired mask.
     */
    int scatter(int k) {
        ${Config.WGL2? '' : 'int mPos = 1;'}
        int cPos = ${Config.WGL2? '0' : '1'};
        int result = 0;
        for (int i = 0; i < ${Config.MAX_WIRE_COUNT}; i++) {
            ${Config.WGL2? 'result |=\n' +
            '(desired | ~used & k << i - cPos) << i;\n' +
            'cPos += 1 ^ used >> i & k' :
            'result += modi(desired / mPos + (k / cPos) * (1 - used / mPos),' +
                           ' 2);\n' +
            'cPos *= 2 - modi(used / mPos, 2);\n' +
            'mPos *= 2'};
        }
        return result;
    }

    vec2 outputFor(int k) {
        return read_input(scatter(k));
    }`);

/**
 * Renders the result of applying a controlled swap operation to a superposition.
 *
 * @param {!CircuitEvalContext} ctx
 * @param {!int} otherRow
 * @returns {!WglConfiguredShader}
 */
CircuitShaders.swap = (ctx, otherRow) =>
    SWAP_QUBITS_SHADER.withArgs(...ketArgs(ctx, otherRow - ctx.row + 1));
const SWAP_QUBITS_SHADER = ketShaderPermute('', `
    int low_bit = ${Config.WGL2? 'out_id & 1' : 'modi(out_id, 2)'};
    int mid_bits = ${Config.WGL2? 'out_id & (1 << span - 1) - 2' :
    'modi(out_id, span/2) - low_bit'};
    int high_bit = ${Config.WGL2? 'out_id >> span - 1' :
    '(out_id * 2) / span'};
    return ${Config.WGL2? 'high_bit | mid_bits | low_bit << span - 1' :
    'high_bit + mid_bits + low_bit * span / 2'};`);

/**
 * Returns a configured shader that renders the marginal states of each qubit, for each possible values of the other
 * qubits (i.e. folding still needs to be done), into a destination texture. The marginal states are laid out in
 * [a,br,bi,d] order within each pixel and represent the density matrix {{a, b},{b*, d}}.
 * @param {!WglTexture} inputTexture A superposition texture.
 * @param {undefined|!int=} keptBitMask A bit mask with a 1 at the positions corresponding to indicates of the desired
 * qubit densities.
 * @returns {!WglConfiguredShader}
 */
CircuitShaders.qubitDensities = (inputTexture, keptBitMask = undefined) => {
    if (keptBitMask === undefined) {
        keptBitMask = (1 << currentShaderCoder().vec2.arrayPowerSizeOfTexture(inputTexture)) - 1;
    }
    let keptCount = Util.ceilLg2(Util.numberOfSetBits(keptBitMask));
    if(!Config.WGL2)
	keptCount = 1 << keptCount;
    
    return QUBIT_DENSITIES_SHADER(
        inputTexture,
        WglArg.int('keptCount', keptCount),
        WglArg.int('keptBitMask', keptBitMask));
};
const QUBIT_DENSITIES_SHADER = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.vec2('input')],
    Outputs.vec4(),
    `
    uniform int keptCount;
    uniform int keptBitMask;

    int scatter(int val, int used) {
        int result = 0;
        ${Config.WGL2? '' : 'int pUsed = 1;'}
        int pVal = ${Config.WGL2? '0' : '1'};
        for (int i = 0; i < ${Config.MAX_WIRE_COUNT}; i++) {
            ${Config.WGL2? 'result |= used & val << i - pVal & 1 << i;\n' +
            'pVal += used >> i & 1' :
            'result += modi((used / pUsed) * (v / pVal), 2) * pUsed;\n' +
            'pVal *= 1 + modi(used / pUsed, 2);\n' +
            'pUsed *= 2'};
        }
        return result;
    }

    vec4 outputFor(int k) {
        int otherBits = ${Config.WGL2? 'k >> keptCount' : 'k / keptCount'};
        int bitIndex = ${Config.WGL2? 'k ^ otherBits << keptCount' :
                        'modi(k, keptCount)'};
        int bit = scatter(int(exp2(float(bitIndex))), keptBitMask);

        // Indices of the two complex values making up the current conditional ket.
        int srcIndex0 = ${Config.WGL2?
        'otherBits & bit - 1 | (otherBits & ~(bit - 1)) << 1' :
        'modi(otherBits, bit) + (otherBits / bit) * bit * 2'};
        int srcIndex1 = ${Config.WGL2? 'srcIndex0 | bit' : 'srcIndex0 + bit'};

        // Grab the two complex values.
        vec2 w1 = read_input(srcIndex0);
        vec2 w2 = read_input(srcIndex1);

        // Compute density matrix components.
        float a = dot(w1, w1);
        float br = dot(w1, w2);
        float bi = dot(vec2(-w1.y, w1.x), w2);
        float d = dot(w2, w2);

        return vec4(a, br, bi, d);
    }`);

export {CircuitShaders}
