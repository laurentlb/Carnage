'use strict';

function newPlayer(name) {
    return {name: name, dead: false};
}

function newBoard() {
    var res = [];
    for (var x = 0; x <= 10; x++) {
        var column = [];
        for (var y = 0; y <= 10; y++) {
            var exists = x-y >= -5 && x-y <= 5;
            column.push({
                worm: -1,
                mine: false,
                dynamite: false,
                x: x,
                y: y,
                exists: exists
            });
        }
        res.push(column);
    }
    return res;
}

function addWorm(state, player, x, y) {
    var wormId = state.worms.length;
    var worm = {
        id: wormId,
        x: x,
        y: y,
        life: 2,
        player: player
    };
    state.worms.push(worm);
    state.board[x][y].worm = wormId;
    if (!state.board[x][y].exists)
        console.log(x + ", " + y);
    if (player >= 0) {
        state.players[player].dead = false;
    }
}

function makeDummyState() {
    var state = {
        players: [newPlayer("Rubix"), newPlayer("LLB"), newPlayer("Sly")],
        board: newBoard(),
        selectedWorm: 4,
	movesLeft: 3,
	trail: [],
        selectedCard: 0,
        currentPlayer: 0,
        hasPlayed: false,
        worms: []
    };
    var worms = [
        [0,  4, 1],
        [0,  5, 5],
        [0,  1, 1],
        [1,  7, 2],
        [1,  5, 6],
        [1,  4, 3],
        [2,  5, 0],
        [2,  3, 7],
        [2,  8, 3],

        [-1, 0, 4],
        [-1, 0, 5],
        [-1, 1, 6],
        [-1, 2, 3],
        [-1, 4, 6],
        [-1, 4, 9],
        [-1, 5, 3],
        [-1, 7, 7],
        [-1, 6, 9],
        [-1, 7, 4],
        [-1, 8, 5],
        [-1, 9, 7],
        [-1, 10, 5],
        [-1, 10, 10],
    ];
    for (var i = 0; i < worms.length; i++) {
        var w = worms[i];
        addWorm(state, w[0], w[1], w[2]);
    }
    state.actions = [
        "Move",
        "Shotgun",
        "Bow",
        "Baseball Bat",
        "Flame Thrower",
        "Mine",
        "Dynamite",
        "Sleep",
    ];
    return state;
}
