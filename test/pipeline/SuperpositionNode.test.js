import { Suite, assertThat, assertThrows } from "test/TestUtil.js"
import SuperpositionNode from "src/pipeline/SuperpositionNode.js"

import Complex from "src/math/Complex.js"
import Matrix from "src/math/Matrix.js"
import PipelineNode from "src/pipeline/PipelineNode.js"
import QuantumControlMask from "src/pipeline/QuantumControlMask.js"
import Rect from "src/math/Rect.js"
import Seq from "src/base/Seq.js"

let suite = new Suite("SuperpositionNode");

suite.webGlTest("fromAmplitudes", () => {
    assertThrows(() => SuperpositionNode.fromAmplitudes([]));
    assertThrows(() => SuperpositionNode.fromAmplitudes([1, 2, 3]));

    let t = SuperpositionNode.fromAmplitudes([1.5, new Complex(1, -2), 0, Complex.I]);
    assertThat(t.read().raw().compute()).isEqualTo(new Float32Array([
        1.5, 0, 0, 0, 1, -2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0]));
    assertThat(t.read().asRenormalizedAmplitudes().compute()).isApproximatelyEqualTo([
        1.5/Math.sqrt(8.25), new Complex(1, -2).dividedBy(Math.sqrt(8.25)), 0, Complex.I.dividedBy(Math.sqrt(8.25))]);

    assertThat(SuperpositionNode.fromAmplitudes(Seq.range(16).toArray()).read().raw().compute()).
        isEqualTo(new Float32Array(Seq.range(16).flatMap(e => [e, 0, 0, 0]).toArray()));
});

suite.webGlTest("fromClassicalStateInRegisterOfSize", () => {
    assertThrows(() => SuperpositionNode.fromClassicalStateInRegisterOfSize(-1, 2));
    assertThrows(() => SuperpositionNode.fromClassicalStateInRegisterOfSize(4, 2));
    assertThrows(() => SuperpositionNode.fromClassicalStateInRegisterOfSize(9, 3));

    assertThat(SuperpositionNode.fromClassicalStateInRegisterOfSize(0, 4).read().asRenormalizedAmplitudes().compute()).
        isEqualTo([
            1, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0
        ]);

    assertThat(SuperpositionNode.fromClassicalStateInRegisterOfSize(6, 4).read().asRenormalizedAmplitudes().compute()).
        isEqualTo([
            0, 0, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 0,
            0, 0, 0, 0
        ]);

    assertThat(SuperpositionNode.fromClassicalStateInRegisterOfSize(3, 2).read().asRenormalizedAmplitudes().compute()).
        isEqualTo([
            0, 0,
            0, 1
        ]);
});

suite.webGlTest("withQubitOperationApplied", () => {
    let s = Math.sqrt(0.5);
    let t = SuperpositionNode.fromClassicalStateInRegisterOfSize(7, 3);

    t = t.withQubitOperationApplied(0, Matrix.HADAMARD, QuantumControlMask.NO_CONTROLS);
    assertThat(t.read().asRenormalizedAmplitudes().compute()).isApproximatelyEqualTo(new Float32Array([
        0, 0, 0, 0, 0, 0, s, -s]));

    t = t.withQubitOperationApplied(1, Matrix.HADAMARD, QuantumControlMask.NO_CONTROLS);
    assertThat(t.read().asRenormalizedAmplitudes().compute()).isApproximatelyEqualTo(new Float32Array([
        0, 0, 0, 0, 0.5, -0.5, -0.5, 0.5]));

    t = t.withQubitOperationApplied(2, Matrix.HADAMARD, QuantumControlMask.NO_CONTROLS);
    assertThat(t.read().asRenormalizedAmplitudes().compute()).isApproximatelyEqualTo(new Float32Array([
        s/2, -s/2, -s/2, s/2, -s/2, s/2, s/2, -s/2]));

    t = t.withQubitOperationApplied(1, Matrix.HADAMARD, QuantumControlMask.fromBitIs(0, true));
    assertThat(t.read().asRenormalizedAmplitudes().compute()).isApproximatelyEqualTo(new Float32Array([
        s/2, 0, -s/2, -0.5, -s/2, 0, s/2, 0.5]));

    t = t.withQubitOperationApplied(2, Matrix.HADAMARD, new QuantumControlMask(0x3, 0));
    assertThat(t.read().asRenormalizedAmplitudes().compute()).isApproximatelyEqualTo(new Float32Array([
        0, 0, -s/2, -0.5, 0.5, 0, s/2, 0.5]));
});

suite.webGlTest("withSwapApplied", () => {
    let t = SuperpositionNode.fromClassicalStateInRegisterOfSize(1, 3);

    t = t.withSwap(0, 1, QuantumControlMask.NO_CONTROLS);
    assertThat(t.read().asRenormalizedAmplitudes().compute()).isApproximatelyEqualTo(new Float32Array([
        0, 0, 1, 0, 0, 0, 0, 0]));

    t = t.withSwap(0, 1, QuantumControlMask.NO_CONTROLS);
    assertThat(t.read().asRenormalizedAmplitudes().compute()).isApproximatelyEqualTo(new Float32Array([
        0, 1, 0, 0, 0, 0, 0, 0]));

    t = t.withSwap(0, 2, QuantumControlMask.NO_CONTROLS);
    assertThat(t.read().asRenormalizedAmplitudes().compute()).isApproximatelyEqualTo(new Float32Array([
        0, 0, 0, 0, 1, 0, 0, 0]));

    t = t.withSwap(1, 2, QuantumControlMask.NO_CONTROLS);
    assertThat(t.read().asRenormalizedAmplitudes().compute()).isApproximatelyEqualTo(new Float32Array([
        0, 0, 1, 0, 0, 0, 0, 0]));
});

suite.webGlTest("controlledProbabilities", () => {
    let s = SuperpositionNode.fromAmplitudes([1.5, new Complex(1, -2), 0, Complex.I]);
    let f = m => s.controlledProbabilities(m).read().raw().compute().slice(0, 8);
    assertThat(f(new QuantumControlMask(0, 0))).isEqualTo(new Float32Array([
        8.25, 2.25, 8.25, 2.25,
        8.25, 7.25, 8.25, 7.25]));
    assertThat(f(new QuantumControlMask(1, 0))).isEqualTo(new Float32Array([
        8.25, 2.25, 2.25, 8.25,
        8.25, 7.25, 2.25, 2.25]));
    assertThat(f(new QuantumControlMask(1, 1))).isEqualTo(new Float32Array([
        8.25, 6, 6, 8.25,
        8.25, 7.25, 6, 5]));
    assertThat(f(new QuantumControlMask(2, 2))).isEqualTo(new Float32Array([
        8.25, 2.25, 1, 0,
        8.25, 1, 1, 8.25]));
    assertThat(f(new QuantumControlMask(3, 3))).isEqualTo(new Float32Array([
        8.25, 6, 1, 1,
        8.25, 1, 1, 6]));
});

suite.webGlTest("planPackingIntoSingleTexture", () => {
    assertThat(SuperpositionNode.planPackingIntoSingleTexture(new Map())).isEqualTo({
        width: 1,
        height: 1,
        placeMap: new Map()});

    assertThat(SuperpositionNode.planPackingIntoSingleTexture(new Map([["a", {width: 8, height: 4}]]))).isEqualTo({
        width: 8,
        height: 4,
        placeMap: new Map([
            ["a", 0]
        ])
    });

    assertThat(SuperpositionNode.planPackingIntoSingleTexture(new Map([
        ["a", {width: 8, height: 4}],
        ["b", {width: 8, height: 4}]
    ]))).isEqualTo({
        width: 8,
        height: 8,
        placeMap: new Map([
            ["a", 0],
            ["b", 32]
        ])
    });

    assertThat(SuperpositionNode.planPackingIntoSingleTexture(new Map([
        ["a", {width: 8, height: 4}],
        ["b", {width: 8, height: 4}],
        ["c", {width: 8, height: 4}],
        ["d", {width: 8, height: 4}],
        ["e", {width: 8, height: 4}],
        ["f", {width: 8, height: 4}]
    ]))).isEqualTo({
        width: 16,
        height: 16,
        placeMap: new Map([
            ["a", 0],
            ["b", 32],
            ["c", 64],
            ["d", 96],
            ["e", 128],
            ["f", 160]
        ])
    });

    assertThat(SuperpositionNode.planPackingIntoSingleTexture(new Map([
        ["a", {width: 8, height: 4}],
        ["b", {width: 8, height: 8}],
        ["c", {width: 8, height: 4}],
        ["d", {width: 8, height: 4}],
        ["e", {width: 8, height: 4}],
        ["f", {width: 8, height: 4}]
    ]))).isEqualTo({
        width: 16,
        height: 16,
        placeMap: new Map([
            ["a", 0],
            ["b", 32],
            ["c", 96],
            ["d", 128],
            ["e", 160],
            ["f", 192]
        ])
    });

    assertThat(SuperpositionNode.planPackingIntoSingleTexture(new Map([
        ["a", {width: 4, height: 4}],
        ["b", {width: 8, height: 8}],
        ["c", {width: 4, height: 4}]
    ]))).isEqualTo({
        width: 16,
        height: 8,
        placeMap: new Map([
            ["a", 0],
            ["b", 16],
            ["c", 80]
        ])
    });
});

suite.webGlTest("mergedReadFloats", () => {
    let textureNodes = Seq.range(8).map(i => SuperpositionNode.fromClassicalStateInRegisterOfSize(i, 3)).toArray();
    let readNodes = SuperpositionNode.mergedReadFloats(textureNodes).values();
    let amplitudeNodes = new Seq(readNodes).map(e => e.asRenormalizedAmplitudes()).toArray();
    let amplitudeArrays = PipelineNode.computePipeline(amplitudeNodes);
    assertThat(amplitudeArrays).isEqualTo([
        [1, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 1]
    ]);
});

suite.webGlTest("mergedReadFloats_compressionCircuit", () => {
    let ops = [
        [0, Matrix.HADAMARD, QuantumControlMask.NO_CONTROLS],
        [1, Matrix.HADAMARD, QuantumControlMask.NO_CONTROLS],
        [2, Matrix.HADAMARD, QuantumControlMask.NO_CONTROLS],
        [0, Matrix.PAULI_X, QuantumControlMask.fromBitIs(1, true)],
        [1, Matrix.HADAMARD, QuantumControlMask.fromBitIs(0, true)],
        [1, Matrix.PAULI_X, new QuantumControlMask(5, 5)],
        [0, Matrix.PAULI_X, QuantumControlMask.fromBitIs(2, true)],
        [2, Matrix.fromTargetedRotation(-1/3), QuantumControlMask.fromBitIs(0, true)],
        [2, Matrix.fromTargetedRotation(-2/3), QuantumControlMask.fromBitIs(1, true)]
    ];

    let stateNodes = new Seq(ops).scan(
        SuperpositionNode.fromClassicalStateInRegisterOfSize(0, 3),
        (a, e) => a.withQubitOperationApplied(e[0], e[1], e[2])
    ).toArray();

    let readNodes = SuperpositionNode.mergedReadFloats(stateNodes).values();
    let amplitudeNodes = new Seq(readNodes).map(e => e.asRenormalizedAmplitudes()).toArray();
    let amplitudeArrays = PipelineNode.computePipeline(amplitudeNodes);
    let s = Math.sqrt(0.5);
    assertThat(amplitudeArrays).isApproximatelyEqualTo([
        [1, 0, 0, 0, 0, 0, 0, 0],
        [s, s, 0, 0, 0, 0, 0, 0],
        [0.5, 0.5, 0.5, 0.5, 0, 0, 0, 0],
        [s/2, s/2, s/2, s/2, s/2, s/2, s/2, s/2],
        [s/2, s/2, s/2, s/2, s/2, s/2, s/2, s/2],
        [s/2, 0.5, s/2, 0, s/2, 0.5, s/2, 0],
        [s/2, 0.5, s/2, 0, s/2, 0, s/2, 0.5],
        [s/2, 0.5, s/2, 0, 0, s/2, 0.5, s/2],
        [s/2, Math.sqrt(3/8), s/2, 0.20412412285804749, 0, 0, 0.5, 0.28867512941360474],
        [Math.sqrt(1/8), Math.sqrt(3/8), Math.sqrt(3/8), Math.sqrt(1/8), 0, 0, 0, 0]
    ]);
});
