'use strict';

carnageApp.game = function($scope, $timeout) {

    // Messages
    $scope.message = "";
    $scope.showMessage = false;
    var messageQueue = [];
    var log = function(str) {
        messageQueue.push(str);
        if ($scope.showMessage || messageQueue.length != 1) {
            return;
        }

        logNow();
    };

    var logNow = function() {
        if (messageQueue.length == 0) {
            return;
        }
        $scope.message = messageQueue.shift();
        $scope.showMessage = true;
        $timeout(function() {
            $scope.showMessage = false;
            $timeout(logNow, 1000);
        }, 2000);
    }

    // grid position to css position
    $scope.getPos = function(x, y) {
        var a = 25  + x * 40;
        var b = 125 + y * 45 - 20*x;
        return "left: " + a + "px; top: " + b + "px;";
    }

    // Explosions
    $scope.explosion = null;
    var explode = function(c, big) {
        if (big) {
            $scope.explosion = {
                pos: $scope.getPos(c.x-0.5, c.y-0.9),
                size: "width: 100px; height: 100px",
                img: "explosion.png"
            };
        } else {
            $scope.explosion = {
                pos: $scope.getPos(c.x+0.1, c.y+0.2),
                size: "width: 30px; height: 30px",
                img: "boom.png"
            };
        }
        $timeout(function() {
            $scope.explosion = null;
        }, 500);
    }

    // css class for the cell
    $scope.cellClass = function(c) {
        if (c.worm < 0) {
            return "cell";
        }
        var w = $scope.state.worms[c.worm];
        var cl = w.life == 1 ? "injuredWorm" : "worm";
        if (c.worm == $scope.state.selectedWorm) {
            return cl + " selWorm";
        }
        return cl;
    }

    // css style for the cell
    $scope.cellStyle = function(c) {
        if (!exists($scope.state, c.x, c.y)) {
            return "";
        }
        var w = c.worm;
        var border = "";
        if (w >= 0 && $scope.state.worms[w].player == $scope.state.currentPlayer) {
            border = "border: dotted 4px #68f;";
        }

        var col = "";
        var b = c.x%2 * c.y%2;
        if (w < 0 || $scope.state.selectedWorm != w) {
            col = "background-color:" + (b ? "#e0e0f0" : "#eeeeff");
        }

        var pos = $scope.getPos(c.x, c.y);
        return pos + border + col;
    };

    // css style for the "attack" circle
    $scope.attackStyle = function(c) {
        if (!exists($scope.state, c.x, c.y)) {
            return "";
        }
        var x = c.x + 0.25;
        var y = c.y + 0.3;
        var pos = $scope.getPos(x, y);
        if ($scope.state.hasPlayed) {
            return pos + "; background-color: #48F";
        } else {
            return pos;
        }
    };

    // css style for the "move" circle
    $scope.moveStyle = function(d) {
        var w = $scope.state.selectedWorm;
        if (w < 0) {
            return "";
        }
        var x = $scope.state.worms[w].x;
        var y = $scope.state.worms[w].y;
        x += d.x + 0.25;
        y += d.y + 0.3;
        var pos = $scope.getPos(x, y);
        return pos;
    }

    $scope.canMove = function(d) {
        return canMove($scope.state, d);
    };

    $scope.canAttack = function(c) {
        if ($scope.state.hasPlayed) {
            return $scope.state.board[c.x][c.y].worm >= 0;
        } else {
            return canAttack($scope.state, c);
        }
    }

    $scope.attack = function(c) {
        // select a new worm
        if ($scope.state.hasPlayed) {
            log("New turn!");
            $scope.state = newTurn($scope.state, c);
            return;
        }
        // attack
        explode(c, false);
        $scope.state = attack($scope.state, c);
        $scope.endTurn();
    };

    $scope.move = function(d) {
        $scope.state = move($scope.state, d);
    };

    $scope.endTurn = function(d) {
        $scope.state = endTurn($scope.state);
        log("Select which worm will be controlled next.");
        $timeout(function() {
            $scope.state.hasPlayed = true;
        }, 1000);
    };


    $scope.selCard = function(card, index) {
        $scope.state.selectedCard = index;
        if (card == "Sleep") {
            $scope.endTurn();
        }
    };

    $scope.state = newGame();
    $scope.map = $scope.state.board;
    $scope.directions = allDirections;

    // show map for every player
    // sync map with Firebase
};
