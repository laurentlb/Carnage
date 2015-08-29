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

function addWorm(state, player) {
    var x = Math.floor(Math.random() * 11);
    var y = Math.floor(Math.random() * 11);

    if (!state.board[x][y].exists || state.board[x][y].worm >= 0) {
        addWorm(state, player);
        return;
    }

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

function card(count, impact, desc) {
    return {
        count: count,
        impact: impact, // {0,1,2} for the type sprite to show
        desc: desc
    };
}

var cardInfo = {
    "Baseball Bat": card(5, 1, "Push 3 cases, 1 damage"),
    "Bow": card(5, 1, "Push 2 cases, no damage"),
    "Dynamite": card(0, 0, "Explosion at the beginning of your next turn"),
    "Flame Thrower": card(5, 1, "1 damage to 4 cases in one direction"),
    "Grenade": card(5, 2, "Explosion"),
    "Kamikaze": card(5, 2, "Kill active worm, explosion"),
    "Knife": card(5, 1, "1 damage to every adjacent worm"),
    "Mine": card(0, 0, "Explosion when someone walks on the case"),
    "Move": card(-1, 0, "Move up to 3 cases per turn, before any other action"),
    "Shotgun": card(5, 1, "Push 1 case, 1 damage"),
    "Sleep": card(-1, 0, "Do nothing"),
    "Uzi": card(5, 1, "Shoot 3 times in the same direction, 1 damage"),
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
            dead: false
        });
    }
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
        for (var i = 0; i < 3; i++) {
            addWorm(state, p);
            nbWorms++;
        }
    }
    while (nbWorms < 20) {
        addWorm(state, -1);
        nbWorms++;
    }
    return state;
}
