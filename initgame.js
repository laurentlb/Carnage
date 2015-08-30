'use strict';

function newPlayer(name) {
    return {name: name, dead: false};
}

var BOARD_WIDTH = 11;
var BOARD_HEIGHT = 11;
var NB_WORMS = 21;
var WORMS_PER_TEAM = 3;

function newBoard() {
    var res = [];
    for (var x = 0; x < BOARD_WIDTH; x++) {
        var column = [];
        for (var y = 0; y < BOARD_HEIGHT; y++) {
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

function getEmptyCell(state) {
    var x = Math.floor(Math.random() * BOARD_WIDTH);
    var y = Math.floor(Math.random() * BOARD_HEIGHT);

    if (!state.board[x][y].exists || state.board[x][y].worm >= 0) {
        return getEmptyCell(state);
    }
    return {x:x, y:y};
}

function addWorm(state, player) {
    var c = getEmptyCell(state);
    var wormId = state.worms.length;
    var worm = {
        id: wormId,
        x: c.x,
        y: c.y,
        life: 2,
        player: player
    };
    state.worms.push(worm);
    state.board[c.x][c.y].worm = wormId;
    if (!state.board[c.x][c.y].exists)
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

function card(count, impact, desc) {
    return {
        count: count,
        impact: impact, // {0,1,2} for the type sprite to show
        desc: desc
    };
}

var cardInfo = {
    "Move": card(0, 0, "Move up to 3 cases per turn, before any other action"),
    "Sleep": card(0, 0, "Do nothing"),

    "Baseball Bat": card(5, 1, "Push 3 cases, 1 damage"),
    "Dynamite": card(0, 0, "Explosion at the beginning of your next turn"),
    "Flame Thrower": card(5, 1, "1 damage to 4 cases in one direction"),
    "Grenade": card(4, 2, "Explosion"),
    "Mine": card(5, 0, "Explosion when someone walks on the case"),
    "Shotgun": card(5, 1, "Push 1 case, 1 damage"),
    "Teleport": card(3, 1, "Move worm to another case"),
    "Uzi": card(4, 1, "Shoot 3 times in the same direction, 1 damage"),

    "Kamikaze": card(0, 2, "Kill active worm, explosion"),
    "Bow": card(0, 1, "Push 2 cases, no damage"),
    "Knife": card(0, 1, "1 damage to every adjacent worm"),
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

function makeDummyState(players) {
    checkargs(players);
    var playerArray = [];
    for (var i = 0; i < players.length; i++) {
        playerArray.push({
            name: players[i].name,
            worms: WORMS_PER_TEAM
        });
    }
    shuffle(playerArray);
    var state = {
        players: playerArray,
        board: newBoard(),
        selectedWorm: -1,
	movesLeft: 3,
	trail: [],
        selectedCard: 0,
        currentPlayer: 0,
        hasPlayed: true, // start with worm selection
        futureCards: initCards(),
        activeCards: [],
        actions: [],
        worms: []
    };
    var nbWorms = 0;
    for (var p = 0; p < state.players.length; p++) {
        for (var i = 0; i < WORMS_PER_TEAM; i++) {
            addWorm(state, p);
            nbWorms++;
        }
    }
    while (nbWorms < NB_WORMS) {
        addWorm(state, -1);
        nbWorms++;
    }
    for (var i = 0; i < 1; i++) {
        var c = getEmptyCell(state);
        state.board[c.x][c.y].mine = true;
    }
    return state;
}
