'use strict';

var allDirections = [
        {x: -1, y: -1},
        {x:  0, y: -1},
        {x: -1, y:  0},
        {x:  1, y:  0},
        {x:  0, y:  1},
        {x:  1, y:  1},
    ];

function newGame(players) {
    var state = makeDummyState(players);
    drawCards(state);
    return state;
}

function move(state, d) { // active worm is moved by player
    if (!canMove(state, d)) {
        fail("move not allowed");
    }
    state.movesLeft -= 1;
    var w = state.selectedWorm;
    var worm = state.worms[w];
    if (!state.trail) {
        state.trail = [];
    }
    state.trail.push({x:worm.x, y:worm.y});
    moveWorm(state, w, addXY(worm, d));
    return state;
}

function moveWorm(state, wormId, p) {
    checkargs(state, wormId, p);
    if (state.board[p.x][p.y].mine) {
        if (!state.mines) {
            state.mines = [];
        }
        state.mines.push(p);
        state.board[p.x][p.y].mine = false;
    }

    var x = state.worms[wormId].x;
    var y = state.worms[wormId].y;
    state.board[x][y].worm = -1;
    state.board[p.x][p.y].worm = wormId;
    state.worms[wormId].x = p.x;
    state.worms[wormId].y = p.y;
    return state;
}

// test if position exists
function exists(state, x, y) {
    checkargs(arguments);
    if (x < 0 || x >= state.board.length) {
        return false;
    }
    if (y < 0 || y >= state.board[0].length) {
        return false;
    }
    return state.board[x][y].exists;
}

function canMove(state, d) {
    if (state.movesLeft <= 0) {
        return false;
    }
    var w = state.selectedWorm;
    if (w < 0) {
        return false;
    }
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
    if (w.player >= 0) {
        state.players[w.player].worms--;
    }
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
    if (state.mines) {
        for (var i = 0; i < state.mines.length; i++) {
            var mine = state.mines[i];
            explode(state, mine);
            state.board[mine.x][mine.y].mine = false;
        }
        state.mines = null;
    }

    state.selectedCard = -1;
    state.selectedWorm = -1;
    drawCards(state);
    return state;
}

function nextPlayer(state) {
    var n = 0;
    var p;
    for (var i = 1; i <= state.players.length; i++) {
        p = (state.currentPlayer + i) % state.players.length;
        if (state.players[p].worms > 0) {
            break;
        }
    }

    if (state.players[p].worms <= 0) {
        return -1; // no one left
    }

    if (p === state.currentPlayer) {
        if (state.players.length === 1) { // 1-player game
            return p;
        }
        return -1;
    }
    return p;
}

function newTurn(state, c) {
    state.currentPlayer = nextPlayer(state);
    state.selectedCard = 0;
    state.selectedWorm = c.worm;
    state.hasPlayed = false;
    state.movesLeft = 3;
    state.trail = [];
    return state;
}

function canAttack(state, c) {
    if (state.selectedCard <= 0) {
        return false;
    }
    var action = state.actions[state.selectedCard];
    if (c.worm === state.selectedWorm) {
        return ["Sleep", "Kamikaze"].indexOf(action) >= 0;
    }

    var activeWorm = state.worms[state.selectedWorm];
    var targetWorm = c.worm < 0 ? null : state.worms[c.worm];
    var direction = findDirection(activeWorm, c.worm < 0 ? c : targetWorm);
    var distance = distanceBetween(activeWorm, c.worm < 0 ? c : targetWorm);
    var nearestTarget = direction === null ? null : nearestWorm(state, activeWorm, direction);

    switch (state.actions[state.selectedCard]) {
    case "Kamikaze":
    case "Sleep":
        return false;
    case "Uzi":
    case "Shotgun":
    case "Bow":
        return nearestTarget !== null && nearestTarget === targetWorm;
    case "Baseball Bat":
    case "Knife":
        return targetWorm !== null && distance === 1;
    case "Grenade":
        return distance <= 3;
    case "Mine":
    case "Dynamite":
        return containsXY(state.trail, c);
    case "Flame Thrower":
        return nearestTarget !== null && targetWorm !== null && distance <= 4;
    case "Teleport":
        return targetWorm === null;
    default:
        fail(state.actions[state.selectedCard] + " not implemented");
    }
}

function hitCell(state, c) {
    checkargs(state, c);
    if (!exists(state, c.x, c.y)) {
        return;
    }
    var w = state.board[c.x][c.y].worm;
    if (w >= 0) {
        harm(state, state.worms[w]);
    }
}

function hitCells(state, c, list) {
    checkargs(state, c, list);
    for (var i = 0; i < list.length; i++) {
        hitCell(state, addXY(c, list[i]));
    }
}

function explode(state, c) {
    checkargs(state, c);
    hitCells(state, c, allDirections.concat([{x: 0, y: 0}]));
}

function attack(state, c) {
    var activeWorm = state.worms[state.selectedWorm];
    var targetWorm = c.worm < 0 ? null : state.worms[c.worm];
    var direction = findDirection(activeWorm, c.worm < 0 ? c : targetWorm);
    var distance = distanceBetween(activeWorm, c.worm < 0 ? c : targetWorm);
    var nearestTarget = direction === null ? null : nearestWorm(state, activeWorm, direction);

    switch (state.actions[state.selectedCard]) {
    case "Sleep":
        break; // Zzzz
    case "Shotgun":
        assert(nearestTarget === targetWorm);
        push(state, targetWorm, direction);
        if (targetWorm.life > 0) {
            harm(state, targetWorm);
        }
        break;
    case "Bow":
        assert(nearestTarget === targetWorm);
        push(state, targetWorm, direction);
        push(state, targetWorm, direction);
        break;
    case "Uzi":
        for (var i = 0; i < 3; i++) {
            var w = nearestWorm(state, activeWorm, direction);
            if (w !== null) {
                harm(state, w);
            }
        }
        break;
    case "Baseball Bat":
        assert(distance == 1);
        push(state, targetWorm, direction);
        push(state, targetWorm, direction);
        push(state, targetWorm, direction);
        if (targetWorm.life > 0) {
            harm(state, targetWorm);
        }
        break;
    case "Mine":
        state.board[c.x][c.y].mine = true;
        break;
    case "Dynamite":
        state.board[c.x][c.y].dynamite = true;
        break;
    case "Flame Thrower":
        var cell = activeWorm;
        for (var i = 1; i <= 4; i++) {
            cell = addXY(cell, direction);
            if (!exists(state, cell.x, cell.y)) {
                break;
            }
            var w = state.board[cell.x][cell.y].worm;
            if (w >= 0) {
                harm(state, state.worms[w]);
            }
        }
        break;
    case "Knife":
        hitCells(state, activeWorm, allDirections);
        break;
    case "Grenade":
        explode(state, c);
        break;
    case "Kamikaze":
        kill(state, activeWorm);
        explode(state, activeWorm);
        break;
    case "Teleport":
        moveWorm(state, state.selectedWorm, c);
        break;
    case "Kamikaze":
    default:
        fail(state.actions[state.selectedCard] + " not implemented");
    }

    // Remove card
    state.activeCards.splice(state.selectedCard - 2, 1); // first 2 cards are permanent
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
        moveWorm(state, wormId(state, worm), addXY(worm, direction));
    }
}

function wormId(state, worm) {
    checkargs(state, worm);
    return state.board[worm.x][worm.y].worm;
}

function findWormAt(state, p) {
    checkargs(state, p);
    var wormId = state.board[p.x][p.y].worm;
    return wormId < 0 ? null : state.worms[wormId];
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


// cards

function drawCards(state) {
    state.activeCards = [];
    while (state.activeCards.length < 3) {
        if (state.futureCards.length == 0) {
            state.futureCards = initCards();
        }
        var c = state.futureCards.pop();
        state.activeCards.push(c);
    }
    state.actions = ["Move", "Sleep"].concat(state.activeCards);
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
        return dy > 0 ? {x:0,y:1} : {x:0,y:-1};
    } else {
        return dx > 0 ? {x:1,y:0} : {x:-1,y:0};
    }
}

function addXY(p1, p2) {
    checkargs(p1, p2);
    return {x:p1.x+p2.x, y:p1.y+p2.y};
}

function containsXY(list, p) {
    if (!list) {
        return false;
    }
    for (var i = 0; i < list.length; ++i) {
        var item = list[i];
        if (item.x === p.x && item.y === p.y) {
            return true;
        }
    }
    return false;
}

// programmer sanity

function fail(message) {
    checkargs(message);
    console.log(new Error().stack);
    throw 'Assertion failed! ' + message;
}

function assert(bool) {
    if (!bool) {
        fail("assert failed");
    }
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
