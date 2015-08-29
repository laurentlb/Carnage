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

function shuffle(array) {
    var counter = array.length, temp, index;

    // While there are elements in the array
    while (counter > 0) {
        index = Math.floor(Math.random() * counter);
        counter--;

        // Swap elements
        temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }
    return array;
}

function card(count, desc) {
    return {count: count, desc: desc};
}

var cardInfo = {
    "Baseball Bat": card(5, "Push 3 cases, 1 damage"),
    "Bow": card(5, "Push 2 cases, no damage"),
    "Dynamite": card(5, "Explosion at the beginning of your next turn"),
    "Flame Thrower": card(5, "1 damage to 4 cases in one direction"),
    "Grenade": card(5, "Explosion"),
    "Kamikaze": card(5, "Kill active worm, explosion"),
    "Knife": card(5, "1 damage to every adjacent worm"),
    "Mine": card(5, "Explosion when someone walks on the case"),
    "Move": card(-1, "Move up to 3 cases per turn, before any other action"),
    "Shotgun": card(5, "Push 1 case, 1 damage"),
    "Sleep": card(-1, "Do nothing"),
    "Uzi": card(5, "Shoot 3 times in the same direction, 1 damage"),
}

function initCards() {
    var allCards = [];
    for (var card in cardInfo) {
        for (var i = 0; i < cardInfo[card].count; i++) {
            allCards.push(card);
        }
    }
    shuffle(allCards);
    return allCards;
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
        futureCards: initCards(),
        activeCards: [],
        actions: [],
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
    return state;
}
