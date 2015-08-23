'use strict';

/* Controllers */

var carnageApp = angular.module('carnage', ["firebase", 'ngAnimate']);

var REF = function() {
    var path = "https://carnage.firebaseio.com";
    for (var i = 0; i < arguments.length; i++) {
        path += "/" + arguments[i];
    }
    return new Firebase(path);
}

carnageApp.controller('CarnageCtrl', ['$scope', "$firebase", "$timeout",
                                      function($scope, $firebase, $timeout)
{
    $scope.page = "menu";
    $scope.menuPage = "name";

    var fail = function(msg) {
        $scope.stderr = msg;
        $scope.showStderr = true;
        $timeout(function() {
            $scope.showStderr = null;
        }, 2000);
    };

    $scope.setPage = function(p) {
        $scope.menuPage = p;
    }

    $scope.setName = function(e) {
        if (!(e.keyCode === 13 && $scope.tmp_name)) {
            return;
        }
        var ref = REF("players", $scope.tmp_name);
        ref.transaction(function (current) {
            if (current === null) {
                return true;
            }
            return;
        }, function(error, committed, snapshot) {
            if (error || !committed) {
                fail("Nom '" + $scope.tmp_name + "' non disponible.");
                return;
            }
            $scope.name = $scope.tmp_name;
            $scope.menuPage = "list";
            console.log("Welcome " + $scope.name);
            ref.onDisconnect().remove();
            $scope.$digest();
        });
    };

    var myRoomRef = null;
    $scope.createGame = function() {
        var room = {
            owner: $scope.name,
            status: ""
        };
        myRoomRef = REF("rooms").push(room);
        myRoomRef.onDisconnect().remove();
        $scope.joinGame(myRoomRef.key());
    };

    $scope.cancelGame = function() {
        if (myRoomRef != null) {
            myRoomRef.remove();
        }

        $scope.myRef.remove(function () {
            $scope.menuPage = 'list';
            $scope.$digest();
            // $scope.myInfo.$remove();
            // $scope.room.$destroy();
            // $scope.roomPlayers.$destroy();
            $scope.roomPlayers = null;
            $scope.room = null;
        });
    };

    $scope.joinGame = function(arg) {
        $scope.room = $firebase(REF("rooms", arg)).$asObject();
        var playersRef = REF("rooms", arg, "players");
        $scope.roomPlayers = $firebase(playersRef).$asArray();
        $scope.myRef = playersRef.push({name: $scope.name});
        $scope.myRef.onDisconnect().remove();
        $scope.myInfo = $firebase($scope.myRef).$asObject();

        $scope.menuPage = 'room';
    };

    $scope.connected = $firebase(REF("players")).$asArray();
    $scope.rooms = $firebase(REF("rooms")).$asArray();

    $scope.startGame = function(arg) {
        $scope.page = "game";
    };

    $scope.back = function() {
        $scope.page='menu';
        $scope.menuPage='name';
    };

    carnageApp.game($scope, $timeout);
}]);

carnageApp.controller('PublicChatCtrl', ['$scope', '$firebase', function($scope, $firebase) {
    var ref = REF("public_chat");
    $scope.messages = $firebase(ref).$asArray();

    $scope.addMessage = function(e) {
        console.log('key ' + $scope.tmp_name);

        if (e.keyCode === 13 && $scope.msg) {
            $scope.messages.$add({
                from: $scope.name,
                body: $scope.msg
            });
            $scope.msg = "";
        }
    };
}]);
