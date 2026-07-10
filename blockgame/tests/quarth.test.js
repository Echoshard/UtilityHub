const assert = require('assert');
const {
    createFramefallBoard,
    hasCompletePerimeter,
    findCompletedRectangle,
    FRAMEFALL_SHAPES
} = require('../quarth.js');

const block = groupId => ({ type: 'block', groupId });
assert(FRAMEFALL_SHAPES.some(shape => shape.id === 'wide-short-t'));
assert(FRAMEFALL_SHAPES.some(shape => shape.id === 'medium-t'));
assert(FRAMEFALL_SHAPES.some(shape => shape.id === 'narrow-long-t'));

function addBorder(board, left, right, top, bottom, groupId = 1) {
    for (let column = left; column <= right; column++) {
        board[top][column] = block(groupId);
        board[bottom][column] = block(groupId);
    }
    for (let row = top; row <= bottom; row++) {
        board[row][left] = block(groupId);
        board[row][right] = block(groupId);
    }
}

// Hollow rectangle.
let board = createFramefallBoard(6, 6);
addBorder(board, 1, 4, 1, 4);
assert(hasCompletePerimeter(board, { left: 1, right: 4, top: 1, bottom: 4 }));
assert.deepStrictEqual(
    findCompletedRectangle(board, 2, 4),
    { left: 1, right: 4, top: 1, bottom: 4, occupied: 12, width: 4, height: 4, area: 16 }
);

// Filled rectangle and occupied interior counting.
board = createFramefallBoard(5, 5);
for (let row = 1; row <= 3; row++) {
    for (let column = 1; column <= 3; column++) board[row][column] = block(1);
}
assert.strictEqual(findCompletedRectangle(board, 2, 3).occupied, 9);

// Incomplete borders do not clear.
board = createFramefallBoard(6, 6);
addBorder(board, 1, 4, 1, 4);
board[4][2] = null;
assert.strictEqual(findCompletedRectangle(board, 1, 2), null);

// Group identity is irrelevant.
board = createFramefallBoard(5, 5);
addBorder(board, 0, 3, 0, 3);
board[0][1].groupId = 8;
board[1][3].groupId = 0;
assert(findCompletedRectangle(board, 2, 3));

// A partial loop cannot clear while its side tails continue below it.
board = createFramefallBoard(6, 6);
addBorder(board, 1, 3, 1, 3);
board[2][4] = block(2);
assert.strictEqual(findCompletedRectangle(board, 1, 2), null);

// The full long-tail frame clears once the bottom edge is complete.
board = createFramefallBoard(7, 5);
for (let row = 0; row <= 5; row++) {
    board[row][1] = block(1);
    board[row][3] = block(1);
}
board[0][2] = block(1);
for (let row = 1; row <= 5; row++) board[row][2] = block(0);
assert.deepStrictEqual(
    findCompletedRectangle(board, 2, 5),
    { left: 1, right: 3, top: 0, bottom: 5, occupied: 18, width: 3, height: 6, area: 18 }
);

// Mirrored upside-L pieces resolve correctly from either side.
for (const tailColumn of [1, 3]) {
    board = createFramefallBoard(7, 5);
    const otherColumn = tailColumn === 1 ? 3 : 1;
    for (let column = 1; column <= 3; column++) board[0][column] = block(1);
    for (let row = 1; row <= 5; row++) {
        board[row][tailColumn] = block(1);
        board[row][2] = block(0);
        board[row][otherColumn] = block(0);
    }
    assert.strictEqual(findCompletedRectangle(board, otherColumn, 5).area, 18);
}

// One shot can complete multiple rectangles; the largest wins.
board = createFramefallBoard(6, 6);
addBorder(board, 0, 4, 0, 4);
addBorder(board, 0, 2, 2, 4, 2);
const largest = findCompletedRectangle(board, 1, 4);
assert.deepStrictEqual(
    { left: largest.left, right: largest.right, top: largest.top, bottom: largest.bottom },
    { left: 0, right: 4, top: 0, bottom: 4 }
);

// Rectangles can touch every board edge.
board = createFramefallBoard(4, 4);
addBorder(board, 0, 3, 0, 3);
assert(findCompletedRectangle(board, 3, 2));

console.log('Framefall rectangle tests passed.');
