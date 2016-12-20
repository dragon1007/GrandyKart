/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

let jsonFile;
let nameLength;
let maxPlayersPerPage;
let maxPlayersTotal;
let updatePlayersSpeed;
let scrollSpeed;
let newPlayerPopupTime;
let racers = [];
let prestige = [];
let currentPage = 0;
let players = [];
let newPlayerQueue = [];
let globalPlayers = [];
let apiSecret;
let apiSocket;
let displayGlobal = false;


function sortPrestige(a, b) {
            if (a.prestige.level > b.prestige.level) { return -1; }
            if (a.prestige.level < b.prestige.level) { return 1; }
            if (a.keys > b.keys) { return -1; }
            if (a.keys < b.keys) { return 1; }
            if (a.name < b.name) { return -1; }
            if (a.name > b.name) { return 1; }
            return 0;
        }


function addToOverlay(overlayId) {
    let overlay = $('.racerOverlay' + overlayId);
    while ((newPlayerQueue[overlayId].length > 0) && (overlay.children().length < 2)) {
        overlay.append('<div class="newPlayerPopup"><span><img src="' + newPlayerQueue[overlayId][0].racer.image + '">' + newPlayerQueue[overlayId][0].name + '</span></div>');
        let el = overlay.children().last();
        el.fadeIn();
        newPlayerQueue[overlayId].shift();
    }
}

function updateOverlay(overlayId) {
    let overlay = $('.racerOverlay' + overlayId);
    if (overlay.children().length > 0) {
        let el = $($('.racerOverlay' + overlayId + ' > div')[0]);
        $(el.children()[0]).finish().animate({left: '350px'},1200).queue(function() {
            if (el.next().length) {
                el.finish().fadeOut();
                el.next().animate({top: '162px'}).queue(function () {
                    el.remove();
                    $(this).css({top: '200px'});
                    addToOverlay(overlayId);
                });
            }
            else {
                el.finish().fadeOut();
                el.remove();
                addToOverlay(overlayId);
            }
        });
    }
    else {
        addToOverlay(overlayId);
    }
}

function updateOverlays() {
    for (let i = 0; i < newPlayerQueue.length; i++){
        updateOverlay(i);
    }
}

function updateDisplay() {
    let d = $("#racersDiv");
    let playerArray = [];
    if (displayGlobal) {
        $('.leaderboardHeader').text('Global Leaders');
        Object.keys(globalPlayers).forEach(function (key, index) {
            playerArray.push(this[key]);
        }, globalPlayers);
    }
    else {
        $('.leaderboardHeader').text('Current Players');
        Object.keys(players).forEach(function (key, index) {
            playerArray.push(this[key]);
        }, players);
    }
    let sorted = playerArray.sort(sortPrestige).slice(0, maxPlayersTotal);
    let fade = sorted.length > maxPlayersPerPage;
    let update = function () {
        d.empty();
        for (let i = currentPage * maxPlayersPerPage; i < (currentPage + 1) * maxPlayersPerPage && sorted[i] !== undefined; i++) {
            let player = sorted[i];
            if (displayGlobal == false) {
                d.append('<div><div class="numberDiv">' + (i + 1) + '.</div> <img class="racerImage" src="' + player.racer.image + '" alt="' + player.racer.name + '" /> <img class="prestigeImage" src="' + player.prestige.image + '" alt="' + player.prestige.name + '" /> <span class="playerName">' + ((player.name.length > nameLength) ? (player.name.substring(0, nameLength - 2) + '...') : player.name) + '</span><span class="playerDash"> - </span><span class="playerKeys">' + player.keys + '</span></div>');
            }
            else {
                let t = '<div><div class="numberDiv">' + (i + 1) + '.</div> ';
                if (players[player.name] !== undefined) {
                    t = t + '<img class="racerImage" src="' + players[player.name].racer.image + '" alt="' + players[player.name].racer.name + '" /> <img class="prestigeImage" src="' + players[player.name].prestige.image + '" alt="' + players[player.name].prestige.name + '" /> ';
                }
                t = t + '<span class="playerName">' + ((player.name.length > nameLength) ? (player.name.substring(0, nameLength - 2) + '...') : player.name) + '</span><span class="playerDash"> - </span><span class="playerKeys">' + player.keys + '</span></div>';
                d.append(t);
            }
        }
        currentPage += 1;
        if ((currentPage * maxPlayersPerPage) > sorted.length - 1) {
            currentPage = 0;
            displayGlobal = !displayGlobal;
        }
        fade ? d.fadeIn() : d.show();
    }
    fade ? d.fadeOut(update) : d.hide(0,update);
}

function updatePlayers(initial = false) {
    if (apiSocket.readyState == 1) {
        apiSocket.send('api|get_top_users|0|' + maxPlayersTotal);
    }
    $.get(jsonFile, function (data) {
        try {
            let keysData = JSON.parse(data.slice(0, -1) + "]");
            for (let i = 0; i < keysData.length; i++) {
                let player = {
                    "name": keysData[i].name,
                    "racer": {
                        "id": keysData[i].racer,
                        "name": racers[keysData[i].racer].name,
                        "image": racers[keysData[i].racer].image
                    },
                    "prestige": {
                        "level": keysData[i].prestige,
                        "name": prestige[keysData[i].prestige].name,
                        "image": prestige[keysData[i].prestige].image
                    },
                    "keys": keysData[i].keys
                }
                if (players[keysData[i].name] === undefined) {
                    newPlayerQueue[keysData[i].racer].push(player);
                }
                players[keysData[i].name] = player;
            }
            if (initial) {
                updateDisplay();
                updateOverlays();
           }
        }
        catch(e) { }
    }).always(function() {
        setTimeout(updatePlayers, updatePlayersSpeed * 1000);
    });
}

function updateGlobal(event) {
    var response = JSON.parse(event.data);
    if (response.function == "get_top_users") {
        $('#globalTest').empty();
        $.each(response.msg, function (i, user) {
            $('#globalTest').append('<div>' + user.user + ' - ' + user.points + '</div>');
            globalPlayers[user.name] = {"name": user.user, "keys": user.points};
        });
    }
}

function loadConfig() {
    /** * @property {string} jsonFile - relative filename of Players file */
    /** * @property {number} nameLength - number of characters to allow for player names before truncating */
    /** * @property {number} maxPlayersPerPage - number of players to display on each page of the leaderboard */
    /** * @property {number} maxPlayersTotal - total number of players to display on all pages of leaderboard */
    /** * @property {number} updatePlayersSpeed - how often to update Player data, in seconds (decimals allowed) */
    /** * @property {number} scrollSpeed - how often to change pages of the leaderboard in seconds (decimals allowed) */
    /** * @property {number} newPlayerPopupTime - how long to display the popup when players enter, *in seconds (decimals allowed) */
    /** * @property {string} apiSecret - DeepBot API key */
    /** * @property {{displayName: string, image: string}} racers */
    /** * @property {{displayName: string, image: string}} prestige */
    $.getJSON("resources/config.json", function(configData) {
    jsonFile = configData.jsonFile;
    nameLength = configData.nameLength;
    maxPlayersPerPage = configData.maxPlayersPerPage;
    maxPlayersTotal = configData.maxPlayersTotal;
    updatePlayersSpeed = configData.updatePlayersSpeed;
    scrollSpeed = configData.scrollSpeed;
    newPlayerPopupTime = configData.newPlayerPopupTime;
    apiSecret = configData.apiSecret;
    apiSocket = new WebSocket("ws://localhost:3337");
    apiSocket.onopen = function() {apiSocket.send('api|register|' + apiSecret)};
    apiSocket.onmessage = updateGlobal;

    $.each(configData.racers, function(i, item) {
      racers.push({"name": item.displayName, "image": item.image});
      newPlayerQueue.push(new Array());
    });

    $.each(configData.prestige, function(i, item) {
      prestige.push({"name": item.displayName, "image": item.image});
    });

    updatePlayers(true);
    document.updateDisplayTimer = setInterval(updateDisplay, scrollSpeed * 1000);
    document.updateOverlaysTimer = setInterval(updateOverlays, 3000);
  });
}

$(document).ready(function () {
    loadConfig();
});