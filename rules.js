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

function canAttack(state, c) {
    if (state.selectedCard <= 0) {
        return false;
    }
    if (c.worm < 0 || c.worm == state.selectedWorm) {
        return false;
    }
    var activeWorm = state.worms[state.selectedWorm];
    var clickedWorm = state.worms[c.worm];
    var direction = findDirection(activeWorm, clickedWorm);
    var distance = distanceBetween(activeWorm, clickedWorm);
    var nearestTarget = direction === null ? null : nearestWorm(state, activeWorm, direction);
    if (state.actions[state.selectedCard] == "Shotgun") {
	return direction !== null && nearestTarget === clickedWorm;
    } else if (state.actions[state.selectedCard] == "Bow") {
	return direction !== null && nearestTarget === clickedWorm;
    } else if (state.actions[state.selectedCard] == "Baseball Bat") {
	return direction !== null && distance === 1;
    } else if (state.actions[state.selectedCard] == "Pistol") {
    } else if (state.actions[state.selectedCard] == "Flame Thrower") {
    } else if (state.actions[state.selectedCard] == "Kamikaze") {
    } else if (state.actions[state.selectedCard] == "Hook") {
    } else if (state.actions[state.selectedCard] == "") {
    } else if (state.actions[state.selectedCard] == "") {
    } else if (state.actions[state.selectedCard] == "") {
    }
    // TODO
    return true;
}

function attack(state, c) {
    var activeWorm = state.worms[state.selectedWorm];
    var clickedWorm = state.worms[c.worm];
    var direction = findDirection(activeWorm, clickedWorm);
    var distance = distanceBetween(activeWorm, clickedWorm);
    var nearestTarget = nearestWorm(state, activeWorm, direction);
    if (state.actions[state.selectedCard] == "Shotgun") {
	if (direction !== null && nearestTarget === clickedWorm) {
	    push(state, clickedWorm, direction);
	    if (clickedWorm.life > 0) {
		harm(state, clickedWorm);
	    }
	}
    } else if (state.actions[state.selectedCard] == "Bow") {
	if (direction !== null && nearestTarget === clickedWorm) {
	    push(state, clickedWorm, direction);
	    push(state, clickedWorm, direction);
	}
    } else if (state.actions[state.selectedCard] == "Baseball Bat") {
	if (direction !== null && distance === 1) {
	    push(state, clickedWorm, direction);
	    push(state, clickedWorm, direction);
	    push(state, clickedWorm, direction);
	}
    } else if (state.actions[state.selectedCard] == "Pistol") {
    } else if (state.actions[state.selectedCard] == "Flame Thrower") {
    } else if (state.actions[state.selectedCard] == "Kamikaze") {
    } else if (state.actions[state.selectedCard] == "Hook") {
    } else if (state.actions[state.selectedCard] == "") {
    } else if (state.actions[state.selectedCard] == "") {
    } else if (state.actions[state.selectedCard] == "") {
    } else {
	// TODO
	harm(state, state.worms[c.worm]);
    }
    return state;
}

function push(state, worm, direction) {
    checkargs(state, worm, direction);
    if (worm.life < 1) {
	return;
    }
    var behind = addXY(worm, direction);
    if (!exists(state, behind.x, behind.y)) {
	kill(state, worm);
    } else {
	var wormBehind = findWormAt(state, behind);
	if (wormBehind !== null) {
	    push(state, wormBehind, direction);
	}
	worm.x += direction.x;
	worm.y += direction.y;
    }
}

function findWormAt(state, p) {
    checkargs(state, p);
    for (var i = 0; i < state.worms.length; i++) {
        var w = state.worms[i];
	if (w.x === p.x && w.y === p.y) {
	    return w;
	}
    }
    return null;
}

function nearestWorm(state, from, direction) {
    checkargs(state, from, direction);
    var p = addXY(from, direction);
    if (!exists(state, p.x, p.y)) {
	return null;
    }
    var worm = findWormAt(state, p);
    if (worm !== null) {
	return worm;
    }
    return nearestWorm(state, p, direction);
}


// hexagonal topology

function isLinedUpWith(from, to) {
    checkargs(from, to);
    var dx = to.x - from.x, dy = to.y - from.y;
    return dx === 0 || dy === 0 || dx - dy === 0;
}

function distanceBetween(from, to) {
    checkargs(from, to);
    var dx = to.x - from.x, dy = to.y - from.y;
    if (dx * dy > 0) {
	return Math.max(Math.abs(dx), Math.abs(dy));
    } else {
	return Math.abs(dx) + Math.abs(dy);
    }
}

function findDirection(from, to) {
    checkargs(from, to);
    if (!isLinedUpWith(from, to)) {
	return null;
    }
    var dx = to.x - from.x, dy = to.y - from.y;
    if (dx === dy) {
	return dx > 0 ? {x:1,y:1} : {x:-1,y:-1};
    } else if (dx === 0) {
	return dx > 0 ? {x:0,y:1} : {x:0,y:-1};
    } else {
	return dx > 0 ? {x:1,y:0} : {x:-1,y:0};
    }
}

function addXY(p1, p2) {
    checkargs(p1, p2);
    return {x:p1.x+p2.x, y:p1.y+p2.y};
}


// programmer sanity

function fail(message) {
    checkargs(message);
    console.log(new Error().stack);
    throw 'Assertion failed! ' + message;
}

function checkargs() { // varargs
    for (var i = 0; i < arguments.length; ++i) {
	var arg = arguments[i];
	if (arg === undefined) {
	    fail('argument is undefined.');
	}
	if (arg === null) {
	    fail('argument is null.');
	}
    }
}
