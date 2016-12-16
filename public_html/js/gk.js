/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var jsonFile;
var nameLength;
var maxPlayers;
var maxPlayersTotal;
var racers;
var prestige;
var scrollSpeed;

function update() {
    $("#racersDiv").children().each(function (i, item) {
        if ($(item).is(":visible")) {
            if ($("#racersDiv").children().length > i+1) {
                $(item).fadeOut(function () {
                    $($("#racersDiv").children()[i + 1]).fadeIn();
                });
            }
            else {
                $(item).fadeOut(updateRacers);
            }
            return false;
        }
    });
}

function updateRacers() {
    $.get(jsonFile, function (data) {
        keysData = JSON.parse(data.slice(0,-1) + "]");
        var players = [];
        for (i = 0; i < keysData.length; i++) {
            var rn = racers[keysData[i].racer].name;
            var rm = racers[keysData[i].racer].image;
            var pn = prestige[keysData[i].prestige].name;
            var pm = prestige[keysData[i].prestige].image;
            players.push({
                "name": keysData[i].name,
                "racer": {
                    "id": keysData[i].racer,
                    "name": rn,
                    "image": rm
                },
                "prestige": {
                    "level": keysData[i].prestige,
                    "name": pn,
                    "image": pm
                },
                "keys": keysData[i].keys
            });
        }
        var sorted = players.sort(function (a, b) {
            if (a.prestige.level > b.prestige.level) { return -1; }
            if (a.prestige.level < b.prestige.level) { return 1; }
            if (a.keys > b.keys) { return -1; }
            if (a.keys < b.keys) { return 1; }
            if (a.name < b.name) { return -1; }
            if (a.name > b.name) { return 1; }
            return 0;
        }).slice(0,maxPlayersTotal);
        var d = $("#racersDiv");
        d.empty();
        $.each(sorted, function (i, player) {
            if (i % maxPlayers == 0) {
                d.append('<div class="playerDiv">');
            } 
            d.children().last().append('<div><div class="numberDiv">' + (i + 1) + '.</div> <img class="racerImage" src="' + player.racer.image + '" alt="' + player.racer.name + '" /> <img class="prestigeImage" src="' + player.prestige.image + '" alt="' + player.prestige.name + '" /> ' + ((player.name.length > nameLength) ? (player.name.substring(0,nameLength - 2) + '...') : player.name) + " - " + player.keys + '</div>');
        });
        if (d.children().length > 0) {
            $(d.children()[0]).fadeIn();
        }
    });
}

function loadConfig() {
    $.getJSON("resources/config.json", function(configData) {
    jsonFile = configData.jsonFile;
    nameLength = configData.nameLength;
    maxPlayers = configData.maxPlayersPerPage;
    maxPlayersTotal = configData.maxPlayersTotal;
    scrollSpeed = configData.scrollSpeed;
    racers = [];
    prestige = [];

    $.each(configData.racers, function(i, item) {
      racers.push({"name": item.displayName, "image": item.image});
    });
    $.each(configData.prestige, function(i, item) {
      prestige.push({"name": item.displayName, "image": item.image});
    });

    updateRacers();
    document.t = setInterval(update, scrollSpeed * 1000);
  });
}

$(document).ready(function () {
    loadConfig();
});