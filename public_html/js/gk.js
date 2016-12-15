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
            if ($("#racersDiv").children().length > i + 2) {
                $(item).fadeOut(function () {
                    $($("#racersDiv").children()[i + 2]).fadeIn();
                });
                if ($("#racersDiv").children().length > i + 1) {
                    $($("#racersDiv").children()[i + 1]).fadeOut(function () {
                        if ($("#racersDiv").children().length > i + 3) {
                            $($("#racersDiv").children()[i + 3]).fadeIn();
                        }
                    });
                }
            } else {
                if ($("#racersDiv").children().length > i + 1) {
                    $(item).fadeOut();
                    $($("#racersDiv").children()[i + 1]).fadeOut(updateRacers);
                } else {
                    $(item).fadeOut(updateRacers);
                }
            }
            return false;
        }
    });
}

function updateRacers() {
    $.getJSON(jsonFile, function (keysData) {
        var maxRacers = 16;
        var players = [];
        for (i = 0; i < keysData.length; i++) {
            var ri = racers.id.indexOf(keysData[i].racer);
            var pi = prestige.level.indexOf(keysData[i].prestige);
            var rn = racers[ri].name;
            var rm = racers[ri].image;
            var pn = prestige[pi].name;
            var pm = prestige[pi].image;
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
                d.append('<div style="float: left; width: 210px; display: none;">');
            }
            d.children().last().append('<div><img src="' + player.prestige.image + '" alt="' + player.prestige.name + '" /> ' + player.name + " - " + player.keys + '<img style="height: 32px; width: 32px;" src="' + player.racer.image + '" alt="' + player.racer.name + '" /></div>');
        });
        if (d.children().length > 0) {
            $(d.children()[0]).fadeIn();
        }
        if (d.children().length > 1) {
            $(d.children()[1]).fadeIn();
        }
    });
}
$(document).ready(function () {
    loadConfig();
    setTimeout(updateRacers, 2000);
    document.t = setInterval(update, 5000);
});

function getPrestigeImage(p) {
    switch (p) {
        case 0:
            return "null.png";
            break;
        case 1:
            return "mushroom.png";
            break;
        case 2:
            return "fireFlower.png";
            break;
        case 3:
            return "leaf.png";
            break;
        case 4:
            return "capeFeather.png";
            break;
    }
}
function loadConfig() {
    if (document.implementation && document.implementation.createDocument) {
        // this is the W3C DOM way, supported so far only in NN6+
        xDoc = document.implementation.createDocument("", "theXdoc", null);
    } else if (typeof ActiveXObject !== "undefined") {
        // make sure real object is supported (sorry, IE5/Mac)
        if (document.getElementById("msxml").async) {
            xDoc = new ActiveXObject("Msxml.DOMDocument");
        }
    }
    xDoc.load("resources/config.xml");

    setTimeout(contLoad, 1000);
}
function contLoad() {
    jsonFile = xDoc.getElementsByTagName("json")[0].firstChild.nodeValue;

    racers = [];
    prestige = [];

    var racerTags = xDoc.getElementsByTagName("racers");
    for (var i = 0; i < racerTags.length; i++) {
        var id = racerTags[i].getElementsByTagName("id")[0].firstChild.nodeValue;
        var name = racerTags[i].getElementsByTagName("displayName")[0].firstChild.nodeValue;
        var image = racerTags[i].getElementsByTagName("image")[0].firstChild.nodeValue;
        racers.push({
            "id": id,
            "name": name,
            "image": image
        });
    }
    var prestigeTags = xDoc.getElementsByTagName("prestige");
    for (var i = 0; i < prestigeTags.length; i++) {
        var level = prestigeTags[i].getElementsByTagName("level")[0].firstChild.nodeValue;
        var name = prestigeTags[i].getElementsByTagName("displayName")[0].firstChild.nodeValue;
        var image = prestigeTags[i].getElementsByTagName("image")[0].firstChild.nodeValue;
        prestige.push({
            "level": level,
            "name": name,
            "image": image
        });
    }
}
