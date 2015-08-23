'use strict';

var allDirections = [
        {x: -1, y: -1},
        {x:  0, y: -1},
        {x: -1, y:  0},
        {x:  1, y:  0},
        {x:  0, y:  1},
        {x:  1, y:  1},
    ];

function newGame() {
    // TODO
    return makeDummyState();
}

function move(state, d) {
    var w = state.selectedWorm;
    var x = state.worms[w].x;
    var y = state.worms[w].y;
    state.board[x][y].worm = -1;
    state.board[x+d.x][y+d.y].worm = w;
    state.worms[w].x += d.x;
    state.worms[w].y += d.y;
    return state;
}

// test if position exists
function exists(state, x, y) {
    if (x < 0 || x > 10) {
        return false;
    }
    if (y < 0 || y > 10) {
        return false;
    }
    return state.board[x][y].exists;
}

function canAttack(state, c) {
    if (state.selectedCard <= 0) {
        return false;
    }

    if (c.worm < 0 || c.worm == state.selectedWorm) {
        return false;
    }
    return true;
}

function canMove(state, d) {
    var w = state.selectedWorm;
    var x = state.worms[w].x + d.x;
    var y = state.worms[w].y + d.y;

    if (!exists(state, x, y)) {
        return false;
    }
    if (state.board[x][y].worm != -1) {
        return false;
    }
    return true;
}

function kill(state, w) {
    w.life = 0;
    state.board[w.x][w.y].worm = -1;
}

function harm(state, w) {
    if (w.life < 1) {
        throw "cannot harm dead worms";
    } else if (w.life == 1) {
        kill(state, w);
    } else {
        w.life--;
    }
}

function endTurn(state) {
    state.selectedCard = -1;
    state.selectedWorm = -1;
    return state;
}

function newTurn(state, c) {
    state.selectedCard = 0;
    state.selectedWorm = c.worm;
    state.currentPlayer = (state.currentPlayer + 1) % state.players.length;
    state.hasPlayed = false;
    return state;
}

function attack(state, c) {
    // TODO
    harm(state, state.worms[c.worm]);
    return state;
}
