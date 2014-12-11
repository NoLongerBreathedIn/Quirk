MatrixTest = TestCase("MatrixTest");

MatrixTest.prototype.testIsEqualTo = function() {
    var m = new Matrix([[new Complex(2, 3), new Complex(5, 7)], [new Complex(11, 13), new Complex(17, 19)]]);
    assertTrue(m.isEqualTo(m));
    assertTrue(m.isEqualTo(
        new Matrix([[new Complex(2, 3), new Complex(5, 7)], [new Complex(11, 13), new Complex(17, 19)]])));

    assertFalse(m.isEqualTo(
        new Matrix([[new Complex(2, 3)]])));
    assertFalse(m.isEqualTo(
        new Matrix([[new Complex(-2, 3), new Complex(5, 7)], [new Complex(11, 13), new Complex(17, 19)]])));
    assertFalse(m.isEqualTo(
        new Matrix([[new Complex(2, 3), new Complex(-5, 7)], [new Complex(11, 13), new Complex(17, 19)]])));
    assertFalse(m.isEqualTo(
        new Matrix([[new Complex(2, 3), new Complex(5, 7)], [new Complex(-11, 13), new Complex(17, 19)]])));
    assertFalse(m.isEqualTo(
        new Matrix([[new Complex(2, 3), new Complex(5, 7)], [new Complex(11, 13), new Complex(-17, 19)]])));

    var col = new Matrix([[new Complex(2, 3), new Complex(5, 7)]]);
    var row = new Matrix([[new Complex(2, 3)], [new Complex(5, 7)]]);
    assertTrue(col.isEqualTo(col));
    assertTrue(row.isEqualTo(row));
    assertFalse(row.isEqualTo(col));
};

MatrixTest.prototype.testGenerate = function() {
    assertEquals("{{0, 10, 20}, {1, 11, 21}}",
        Matrix.generate(3, 2, function(r, c) { return r + 10* c; }).toString());
};

MatrixTest.prototype.testSquare = function() {
    var m = Matrix.square([1, new Complex(2, 3), -5.5, 0]);
    assertTrue(m.rows[0][0].isEqualTo(1));
    assertTrue(m.rows[0][1].isEqualTo(new Complex(2, 3)));
    assertTrue(m.rows[1][0].isEqualTo(-5.5));
    assertTrue(m.rows[1][1].isEqualTo(0));
    assertTrue(m.rows.length === 2);

    assertTrue(Matrix.square([1]).rows[0][0].isEqualTo(1));
};

MatrixTest.prototype.testRow = function() {
    assertEquals("{{2, 3, 5i}}", Matrix.row([2, 3, new Complex(0, 5)]).toString());
};

MatrixTest.prototype.testCol = function() {
    assertEquals("{{2}, {3}, {5i}}", Matrix.col([2, 3, new Complex(0, 5)]).toString());
};

MatrixTest.prototype.testToString = function() {
    assertEquals("{{2}}", Matrix.square([2]).toString());
    assertEquals("{{1, 0}, {-i, 2-3i}}", Matrix.square([1, 0, new Complex(0, -1), new Complex(2, -3)]).toString());
    assertEquals("{{1, 0}, {0, 1}}", Matrix.square([1, 0, 0, 1]).toString());
    assertEquals("{{1, 0, 0}, {0, 1, 0}, {0, 0, 1}}", Matrix.identity(3).toString());
};

MatrixTest.prototype.testAdjoint = function() {
    var v = Matrix.square([new Complex(2, 3), new Complex(5, 7),
                          new Complex(11, 13), new Complex(17, 19)]);
    var a = Matrix.square([new Complex(2, -3), new Complex(11, -13),
                          new Complex(5, -7), new Complex(17, -19)]);
    assertTrue(v.adjoint().isEqualTo(a));
};

MatrixTest.prototype.testScaledBy = function() {
    var v = Matrix.square([new Complex(2, 3), new Complex(5, 7),
                          new Complex(11, 13), new Complex(17, 19)]);
    var a = Matrix.square([new Complex(-2, -3), new Complex(-5, -7),
                          new Complex(-11, -13), new Complex(-17, -19)]);
    assertTrue(v.scaledBy(-1).isEqualTo(a));
    assertTrue(v.scaledBy(0).isEqualTo(Matrix.square([0, 0, 0, 0])));
    assertTrue(v.scaledBy(1).isEqualTo(v));

    assertTrue(Matrix.col([2, 3]).scaledBy(5).isEqualTo(Matrix.col([10, 15])));
    assertTrue(Matrix.row([2, 3]).scaledBy(5).isEqualTo(Matrix.row([10, 15])));
};

MatrixTest.prototype.testPlus = function() {
    assertTrue(Matrix.square([2, 3, 5, 7]).plus(Matrix.square([11, 13, 17, 19]))
        .isEqualTo(Matrix.square([13, 16, 22, 26])));
};

MatrixTest.prototype.testMinus = function() {
    assertTrue(Matrix.square([2, 3, 5, 7]).minus(Matrix.square([11, 13, 17, 19]))
        .isEqualTo(Matrix.square([-9, -10, -12, -12])));
};

MatrixTest.prototype.testTimes = function() {
    assertTrue(Matrix.square([2, 3, 5, 7]).times(Matrix.square([11, 13, 17, 19]))
        .isEqualTo(Matrix.square([73, 83, 174, 198])));

    var x = Matrix.square([new Complex(0.5, -0.5), new Complex(0.5, 0.5),
                          new Complex(0.5, 0.5), new Complex(0.5, -0.5)]);
    assertTrue(x.times(x.adjoint()).isEqualTo(Matrix.identity(2)));
    assertTrue(Matrix.PAULI_X.times(Matrix.PAULI_Y).times(Matrix.PAULI_Z).scaledBy(new Complex(0, -1))
        .isEqualTo(Matrix.identity(2)));
};

var assertUnitaryApproxEqual = function (actual, expected) {
    assertTrue(actual instanceof Matrix);
    assertTrue(expected instanceof Matrix);
    if (!actual.isApproximatelyEqualTo(expected, 0.0001)) {
        fail('Expected ' + actual.toString() + ' to be approximately ' + expected.toString());
    }
};

MatrixTest.prototype.testIsApproximatelyEqualTo = function() {
    // Size must match
    assertFalse(Matrix.row([1, 1]).isApproximatelyEqualTo(Matrix.col([1, 1]), 0));
    assertFalse(Matrix.row([1, 1]).isApproximatelyEqualTo(Matrix.square([1, 1, 1, 1]), 0));
    assertFalse(Matrix.row([1, 1]).isApproximatelyEqualTo(Matrix.row([1, 1, 1]), 0));
    assertTrue(Matrix.row([1, 1]).isApproximatelyEqualTo(Matrix.row([1, 1]), 0));

    // Error bound matters
    assertTrue(Matrix.row([1]).isApproximatelyEqualTo(Matrix.row([1]), 0));
    assertTrue(Matrix.row([1]).isApproximatelyEqualTo(Matrix.row([1]), 1/16));
    assertTrue(Matrix.row([1.25]).isApproximatelyEqualTo(Matrix.row([1]), 1/16));
    assertTrue(Matrix.row([0.75]).isApproximatelyEqualTo(Matrix.row([1]), 1/16));
    assertFalse(Matrix.row([1.26]).isApproximatelyEqualTo(Matrix.row([1]), 1/16));
    assertFalse(Matrix.row([0.74]).isApproximatelyEqualTo(Matrix.row([1]), 1/16));

    // Error bound spreads
    assertTrue(Matrix.row([0, 0]).isApproximatelyEqualTo(Matrix.row([0, 0]), 1));
    assertTrue(Matrix.row([1, 0]).isApproximatelyEqualTo(Matrix.row([0, 0]), 1));
    assertTrue(Matrix.row([0, 1]).isApproximatelyEqualTo(Matrix.row([0, 0]), 1));
    assertFalse(Matrix.row([1, 1]).isApproximatelyEqualTo(Matrix.row([0, 0]), 1));
};

MatrixTest.prototype.testNorm2 = function() {
    assertEquals(1, Matrix.row([1]).norm2());
    assertEquals(4, Matrix.row([2]).norm2());
    assertEquals(2, Matrix.row([1, 1]).norm2());
    assertEquals(2, Matrix.col([1, 1]).norm2());
    assertEquals(30, Matrix.square([1, 2, 3, 4]).norm2());
};

MatrixTest.prototype.testIsApproximatelyUnitary = function() {
    assertFalse(Matrix.row([1, 1]).isApproximatelyUnitary(999));
    assertFalse(Matrix.col([1, 1]).isApproximatelyUnitary(999));

    assertTrue(Matrix.row([1]).isApproximatelyUnitary(0));
    assertTrue(Matrix.row([Complex.I]).isApproximatelyUnitary(0));
    assertTrue(Matrix.row([-1]).isApproximatelyUnitary(0));
    assertFalse(Matrix.row([-2]).isApproximatelyUnitary(0));
    assertFalse(Matrix.row([0]).isApproximatelyUnitary(0));
    assertTrue(Matrix.row([-2]).isApproximatelyUnitary(999));

    assertTrue(Matrix.square([1, 0, 0, 1]).isApproximatelyUnitary(0));
    assertTrue(Matrix.rotation(1).isApproximatelyUnitary(0.001));
    assertTrue(Matrix.PAULI_X.isApproximatelyUnitary(0));
    assertTrue(Matrix.PAULI_Y.isApproximatelyUnitary(0));
    assertTrue(Matrix.PAULI_Z.isApproximatelyUnitary(0));
    assertTrue(Matrix.HADAMARD.isApproximatelyUnitary(0.001));
};

MatrixTest.prototype.testFromRotation = function() {
    // No turn gives no-op
    assertUnitaryApproxEqual(Matrix.fromPauliRotation(0, 0, 0), Matrix.identity(2));

    // Whole turns are no-ops
    assertUnitaryApproxEqual(Matrix.fromPauliRotation(1, 0, 0), Matrix.identity(2));
    assertUnitaryApproxEqual(Matrix.fromPauliRotation(0, 1, 0), Matrix.identity(2));
    assertUnitaryApproxEqual(Matrix.fromPauliRotation(0, 0, 1), Matrix.identity(2));
    assertUnitaryApproxEqual(Matrix.fromPauliRotation(-1, 0, 0), Matrix.identity(2));
    assertUnitaryApproxEqual(Matrix.fromPauliRotation(0, -1, 0), Matrix.identity(2));
    assertUnitaryApproxEqual(Matrix.fromPauliRotation(0, 0, -1), Matrix.identity(2));
    assertUnitaryApproxEqual(Matrix.fromPauliRotation(0.6, 0.8, 0), Matrix.identity(2));

    // Half turns along each axis is the corresponding Pauli operation
    assertUnitaryApproxEqual(Matrix.fromPauliRotation(0.5, 0, 0), Matrix.PAULI_X);
    assertUnitaryApproxEqual(Matrix.fromPauliRotation(0, 0.5, 0), Matrix.PAULI_Y);
    assertUnitaryApproxEqual(Matrix.fromPauliRotation(0, 0, 0.5), Matrix.PAULI_Z);
    assertUnitaryApproxEqual(Matrix.fromPauliRotation(-0.5, 0, 0), Matrix.PAULI_X);
    assertUnitaryApproxEqual(Matrix.fromPauliRotation(0, -0.5, 0), Matrix.PAULI_Y);
    assertUnitaryApproxEqual(Matrix.fromPauliRotation(0, 0, -0.5), Matrix.PAULI_Z);

    // Hadamard
    assertUnitaryApproxEqual(Matrix.fromPauliRotation(Math.sqrt(0.125), 0, Math.sqrt(0.125)), Matrix.HADAMARD);

    // Opposites are inverses
    assertUnitaryApproxEqual(Matrix.fromPauliRotation(-0.25, 0, 0).times(Matrix.fromPauliRotation(0.25, 0, 0)),
        Matrix.identity(2));
    assertUnitaryApproxEqual(Matrix.fromPauliRotation(0, -0.25, 0).times(Matrix.fromPauliRotation(0, 0.25, 0)),
        Matrix.identity(2));
    assertUnitaryApproxEqual(Matrix.fromPauliRotation(0, 0, -0.25).times(Matrix.fromPauliRotation(0, 0, 0.25)),
        Matrix.identity(2));

    // Doubling rotation is like squaring
    var s1 = Matrix.fromPauliRotation(0.1, 0.15, 0.25);
    var s2 = Matrix.fromPauliRotation(0.2, 0.3, 0.5);
    assertUnitaryApproxEqual(s1.times(s1), s2);
};

MatrixTest.prototype.testTensorProduct = function() {
    assertTrue(Matrix.square([2]).tensorProduct(Matrix.square([3])).isEqualTo(Matrix.square([6])));
    assertTrue(Matrix.square([2]).tensorProduct(Matrix.square([3])).isEqualTo(Matrix.square([6])));
    assertTrue(Matrix.PAULI_X.tensorProduct(Matrix.PAULI_Z).isEqualTo(Matrix.square([
        0, 0, 1, 0,
        0, 0, 0, -1,
        1, 0, 0, 0,
        0, -1, 0, 0
    ])));
    assertTrue(Matrix.square([2, 3, 5, 7]).tensorProduct(Matrix.square([11, 13, 17, 19])).isEqualTo(Matrix.square([
        22, 26, 33, 39,
        34, 38, 51, 57,
        55, 65, 77, 91,
        85, 95, 119, 133
    ])));
};

MatrixTest.prototype.testColRowProducts = function() {
    // When one is a column vector and the other is a row vector...
    var r = Matrix.row([2, 3, 5]);
    var c = Matrix.col([11, 13, 17]);

    // Inner product
    assertEquals("{{146}}", r.times(c).toString());

    // Outer product
    assertEquals("{{22, 33, 55}, {26, 39, 65}, {34, 51, 85}}", c.times(r).toString());

    // Outer product matches tensor product
    assertTrue(c.times(r).isEqualTo(c.tensorProduct(r)));

    // Tensor product is order independent (in this case)
    assertTrue(r.tensorProduct(c).isEqualTo(c.tensorProduct(r)));
};

MatrixTest.prototype.testTensorProduct_Controlled = function() {
    assertTrue(Matrix.CONTROL.tensorProduct(Matrix.square([2, 3, 5, 7])).isEqualTo(Matrix.square([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 2, 3,
        0, 0, 5, 7
    ])));
    assertTrue(Matrix.square([2, 3, 5, 7]).tensorProduct(Matrix.CONTROL).isEqualTo(Matrix.square([
        1, 0, 0, 0,
        0, 2, 0, 3,
        0, 0, 1, 0,
        0, 5, 0, 7
    ])));
};

MatrixTest.prototype.testTensorPower = function() {
    assertEquals("{{1}}", Matrix.row([1, new Complex(0, 1)]).tensorPower(0));
    assertEquals("{{1, i}}", Matrix.row([1, new Complex(0, 1)]).tensorPower(1));
    assertEquals("{{1, i, i, -1}}", Matrix.row([1, new Complex(0, 1)]).tensorPower(2));
    assertEquals("{{1, i, i, -1, i, -1, -1, -i}}", Matrix.row([1, new Complex(0, 1)]).tensorPower(3));
};

MatrixTest.prototype.testFromWireSwap = function() {
    assertEquals("{{1, 0, 0, 0}, {0, 0, 1, 0}, {0, 1, 0, 0}, {0, 0, 0, 1}}", Matrix.fromWireSwap(2, 0, 1).toString());
    var _ = 0;
    assertTrue(Matrix.fromWireSwap(4, 1, 3).isEqualTo(Matrix.square([
        1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, //____
        _, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, //___1
        _, _, _, _, _, _, _, _, 1, _, _, _, _, _, _, _, //__1_
        _, _, _, _, _, _, _, _, _, 1, _, _, _, _, _, _, //__11
        _, _, _, _, 1, _, _, _, _, _, _, _, _, _, _, _, //_1__
        _, _, _, _, _, 1, _, _, _, _, _, _, _, _, _, _, //_1_1
        _, _, _, _, _, _, _, _, _, _, _, _, 1, _, _, _, //_11_
        _, _, _, _, _, _, _, _, _, _, _, _, _, 1, _, _, //_111
        _, _, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, //1___
        _, _, _, 1, _, _, _, _, _, _, _, _, _, _, _, _, //1__1
        _, _, _, _, _, _, _, _, _, _, 1, _, _, _, _, _, //1_1_
        _, _, _, _, _, _, _, _, _, _, _, 1, _, _, _, _, //1_11
        _, _, _, _, _, _, 1, _, _, _, _, _, _, _, _, _, //11__
        _, _, _, _, _, _, _, 1, _, _, _, _, _, _, _, _, //11_1
        _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1, _, //111_
        _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1 //1111
    ])));
};

MatrixTest.prototype.testIdentity = function() {
    assertEquals("{{1}}", Matrix.identity(1).toString());
    assertEquals("{{1, 0}, {0, 1}}", Matrix.identity(2).toString());
    assertEquals("{{1, 0, 0}, {0, 1, 0}, {0, 0, 1}}", Matrix.identity(3).toString());
    assertEquals("{{1, 0, 0, 0}, {0, 1, 0, 0}, {0, 0, 1, 0}, {0, 0, 0, 1}}", Matrix.identity(4).toString());
};

MatrixTest.prototype.testRotation = function() {
    var s = Math.sqrt(0.5);
    var t = Math.PI * 2;
    assertUnitaryApproxEqual(Matrix.rotation(0), Matrix.square([1, 0, 0, 1]));
    assertUnitaryApproxEqual(Matrix.rotation(t / 8), Matrix.square([s, -s, s, s]));
    assertUnitaryApproxEqual(Matrix.rotation(t * 2 / 8), Matrix.square([0, -1, 1, 0]));
    assertUnitaryApproxEqual(Matrix.rotation(t * 3 / 8), Matrix.square([-s, -s, s, -s]));
    assertUnitaryApproxEqual(Matrix.rotation(t * 4 / 8), Matrix.square([-1, 0, 0, -1]));
    assertUnitaryApproxEqual(Matrix.rotation(t * 5 / 8), Matrix.square([-s, s, -s, -s]));
    assertUnitaryApproxEqual(Matrix.rotation(t * 6 / 8), Matrix.square([0, 1, -1, 0]));
    assertUnitaryApproxEqual(Matrix.rotation(t * 7 / 8), Matrix.square([s, s, -s, s]));
    assertUnitaryApproxEqual(Matrix.rotation(t), Matrix.square([1, 0, 0, 1]));
};

MatrixTest.prototype.testSingularValueDecomposition_2x2 = function() {
    var z = Matrix.square([0, 0, 0, 0]).singularValueDecomposition();
    assertUnitaryApproxEqual(z.u, Matrix.identity(2));
    assertUnitaryApproxEqual(z.s, Matrix.square([0, 0, 0, 0]));
    assertUnitaryApproxEqual(z.v, Matrix.identity(2));

    var i = Matrix.identity(2).singularValueDecomposition();
    assertUnitaryApproxEqual(i.u, Matrix.identity(2));
    assertUnitaryApproxEqual(i.s, Matrix.identity(2));
    assertUnitaryApproxEqual(i.v, Matrix.identity(2));

    var am = Matrix.square([1, Complex.I.times(2), 3, 4]);
    var ad = am.singularValueDecomposition();
    assertUnitaryApproxEqual(ad.u.times(ad.s).times(ad.v), am);
    assertUnitaryApproxEqual(ad.s, Matrix.square([5.30594, 0, 0, 1.35906]));
};

MatrixTest.prototype.testClosestUnitary_2x2 = function() {
    assertUnitaryApproxEqual(
        Matrix.square([0, 0, 0, 0]).closestUnitary(),
        Matrix.square([1, 0, 0, 1]));
    assertUnitaryApproxEqual(
        Matrix.square([2, 0, 0, 0.0001]).closestUnitary(),
        Matrix.square([1, 0, 0, 1]));
    assertUnitaryApproxEqual(
        Matrix.square([0, 0.5, 0.0001, 0]).closestUnitary(),
        Matrix.square([0, 1, 1, 0]));
    assertUnitaryApproxEqual(
        Matrix.square([1, Complex.I, -1, Complex.I.times(-1)]).closestUnitary(),
        Matrix.square([1, 0, 0, Complex.I.times(-1)]));
};
