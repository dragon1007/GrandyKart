/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var jsonFile;
var racers;
var prestige;
var xDoc;

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
        var maxRacers = 15;
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
            if (a.prestige.level > b.prestige.level) {
                return -1;
            }
            if (a.prestige.level < b.prestige.level) {
                return 1;
            }
            if (a.keys > b.keys) {
                return -1;
            }
            if (a.keys < b.keys) {
                return 1;
            }
            if (a.name < b.name) {
                return -1;
            }
            if (a.name > b.name) {
                return 1;
            }
            return 0;
        });
        var d = $("#racersDiv");
        d.empty();
        $.each(sorted, function (i, player) {
            if (i % maxRacers == 0) {
                d.append('<div style="float: left; display: none;">');
            }
            d.children().last().append('<div>' + (i + 1) + '. <img style="height: 32px; width: 32px;" src="' + player.prestige.image + '" alt="' + player.prestige.name + '" /> ' + player.name + " - " + player.keys + '<img style="height: 32px; width: 32px;" src="' + player.racer.image + '" alt="' + player.racer.name + '" /></div>');
        });
        if (d.children().length > 0) {
            $(d.children()[0]).fadeIn();
        }
    });
}
$(document).ready(function () {
    loadConfig();
    setTimeout(updateRacers, 2000);
    document.t = setInterval(update, 5000);
});

function loadConfig() {
    $.get("resources/config.xml", function(xmlData) {
    $xml = $($.parseXML(xmlData));
    
    jsonFile = $xml.find('json')[0].textContent;

    racers = [];
    prestige = [];

    $xml.find('racers').each(function() {
      var id = $(this).find('id')[0].textContent;
      var name = $(this).find('displayName')[0].textContent;
      var image = $(this).find('image')[0].textContent;
      racers[id] = {
          "name": name,
          "image": image
      };
    });

    $xml.find('prestige').each(function() {
      var level = $(this).find('level')[0].textContent;
      var name = $(this).find('displayName')[0].textContent;
      var image = $(this).find('image')[0].textContent;
        prestige[level] = {
            "name": name,
            "image": image
        };
    });
  });
}