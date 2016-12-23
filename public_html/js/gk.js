/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

let jsonFile;
let nameLength;
let maxPlayersPerPageGlobal;
let maxPlayersTotalGlobal;
let maxPlayersPerPageCurrent;
let maxPlayersTotalCurrent;
let updatePlayersSpeed;
let scrollSpeed;
let globalUpdateSpeed;
let newPlayerPopupTime;
let racers = [];
let prestige = [{"level": 0, "name": "", "image": ""}];
let currentPage = 0;
let players = [];
let newPlayerQueue = [];
let globalPlayers = [];
let apiSocket;
let displayGlobal = false;
let racerFilter = -1;
let showAll = false;
let usersToIgnore;
let currentUserRequest = 0;
let totalUsers;
let globalTempArray = [];
let lock = 0;

function sortPrestige(a, b) {
    if (a.prestige.level > b.prestige.level) { return -1; }
    if (a.prestige.level < b.prestige.level) { return 1; }
    if (a.keys > b.keys) { return -1; }
    if (a.keys < b.keys) { return 1; }
    if (a.name < b.name) { return -1; }
    if (a.name > b.name) { return 1; }
    return 0;
}

function updateDisplayNow() {
    currentPage = 0;
    clearInterval(document.updateDisplayTimer);
    updateDisplay(true);
    document.updateDisplayTimer = setInterval(updateDisplay, scrollSpeed * 1000);
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
        $(el.children()[0]).finish().animate({left: '350px'},newPlayerPopupTime * 1000).queue(function() {
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

function updateDisplay(fadeArg = undefined) {
    let d = $("#racersDiv");
    let playerArray = [];
    let leaderBoard = $('.leaderboardHeader');
    let global = (lock == 2) || ((lock != 1) && (displayGlobal));
    let maxPlayersPerPage;
    let maxPlayersTotal;
    if (global) {
        maxPlayersPerPage = maxPlayersPerPageGlobal
        maxPlayersTotal = maxPlayersTotalGlobal;
        if (leaderBoard.text() == 'Current Players') {
            leaderBoard.fadeOut(function() { $(this).finish().text('Global Leaders'); });
        }
        Object.keys(globalPlayers).forEach(function (key) {
            let player = { "name": this[key].name };
            if (players[this[key].name] !== undefined) {
                player.racer = players[this[key].name].racer
            }
            player.prestige = this[key].prestige;
            player.keys = this[key].keys;
            playerArray.push(player);
        }, globalPlayers);
    }
    else {
        maxPlayersPerPage = maxPlayersPerPageCurrent;
        maxPlayersTotal = maxPlayersTotalCurrent;
        if (leaderBoard.text() == 'Global Leaders') {
            leaderBoard.fadeOut(function() { $(this).text('Current Players'); });
        }
        Object.keys(players).forEach(function (key) {
            let player = { "name": this[key].name };
            player.racer = this[key].racer
            if (globalPlayers[this[key].name] !== undefined) {
                player.prestige = globalPlayers[this[key].name].prestige;
                player.keys = globalPlayers[this[key].name].keys;
            }
            else {
                player.prestige = { "level": 0, "name": prestige[0].name, "image": prestige[0].image };
            }
            playerArray.push(player);
        }, players);
    }
    let sorted = playerArray;
    if (racerFilter > -1) {
        sorted = sorted.filter(function (item) {
            return (players[item.name] === undefined) ? false : (players[item.name].racer.id == racerFilter);
        });
    }
    sorted = sorted.sort(sortPrestige);
    if (global || (showAll == false)) {
        sorted = sorted.slice(0, maxPlayersTotal);
    }
    let fade = true || fadeArg || sorted.length > maxPlayersPerPage;
    let update = function () {
        d.empty();
        for (let i = currentPage * maxPlayersPerPage; i < (currentPage + 1) * maxPlayersPerPage && sorted[i] !== undefined; i++) {
            let player = sorted[i];
            let t = '<div><div class="numberDiv">' + (i + 1) + '.</div> ';
            if (player.racer !== undefined) {
                t = t + '<img class="racerImage" src="' + player.racer.image + '" alt="' + player.racer.name + '" /> ';
            }
            if ((player.prestige !== undefined) && (player.prestige.level > 0)) {
                t = t + '<img class="prestigeImage" src="' + player.prestige.image + '" alt="' + player.prestige.name + '" /> ';
            }
            t = t + '<span class="playerName">' + ((player.name.length > nameLength) ? (player.name.substring(0, nameLength - 2) + '...') : player.name) + '</span>';
            if (player.keys !== undefined) {
                t = t + '<span class="playerDash"> - </span><span class="playerKeys">' + player.keys + '</span></div>';
            }
            d.append(t);
        }
        if (d.children().length < 1) {
            d.append('<div style="font-style: italic; text-align: center; margin-top: 19px;">No players found</div>');
        }
        currentPage += 1;
        if ((currentPage * maxPlayersPerPage) > sorted.length - 1) {
            currentPage = 0;
            displayGlobal = !displayGlobal;
        }
        leaderBoard.fadeIn();
        fade ? d.fadeIn() : d.show();
    };
    fade ? d.fadeOut(update) : d.hide(0,update);
}

function updatePlayers(initial = false) {
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
                    }
                };
                if (players[keysData[i].name] === undefined) {
                    newPlayerQueue[keysData[i].racer].push(player);
                }
                players[keysData[i].name] = player;
            }
            if (initial) {
                updateDisplay();
                updateOverlays();
                updateGlobal();
           }
        }
        catch(e) { }
    }).always(function() {
        if ($('#readFile').is(':checked')) {
            document.updatePlayersTimeout = setTimeout(updatePlayers, updatePlayersSpeed * 1000);
        }
    });
}

function updateGlobal() {
    if ((apiSocket.readyState == 1) && (currentUserRequest == 0)) {
        apiSocket.send('api|get_users_count');
    }
}

function socketResponse(event) {
    let response = JSON.parse(event.data);
    if ((response.function == "register") && (response.msg == "success")) {
        if (apiSocket.readyState == 1) {
            apiSocket.send('api|get_users_count');
        }
    }
    if (response.function == "get_users_count") {
        if (apiSocket.readyState == 1) {
            totalUsers = response.msg;
            apiSocket.send('api|get_users|0');
            currentUserRequest = 0;
        }
    }
    if (response.function == "get_users") {
        $.each(response.msg, function (i, user) {
            if (usersToIgnore.includes(user.user.toLowerCase()) == false) {
                if (user.vip == 10) { user.vip = 0; }
                globalTempArray[user.user] = {"name": user.user,
                    "prestige": {
                    "level": user.vip,
                    "name": prestige[user.vip].name,
                    "image": prestige[user.vip].image
                },
                "keys": user.points};
            }
        });
        currentUserRequest += 100;
        if (currentUserRequest < totalUsers) {
            apiSocket.send('api|get_users|' + currentUserRequest);
        }
        else {
            globalPlayers = globalTempArray;
            currentUserRequest = 0;
        }
    }
}

function loadConfig() {
    /** * @property {string} jsonFile - relative filename of Players file */
    /** * @property {number} nameLength - number of characters to allow for player names before truncating */
    /** * @property {number} maxPlayersPerPageGlobal - number of players to display on each page of the global leaderboard */
    /** * @property {number} maxPlayersTotalGlobal - total number of players to display on all pages of global leaderboard */
    /** * @property {number} maxPlayersPerPageCurrent - number of players to display on each page of the current leaderboard */
    /** * @property {number} maxPlayersTotalCurrent - total number of players to display on all pages of current leaderboard */
    /** * @property {number} updatePlayersSpeed - how often to update Player data, in seconds (decimals allowed) */
    /** * @property {number} scrollSpeed - how often to change pages of the leaderboard in seconds (decimals allowed) */
    /** * @property {number} globalUpdateSpeed - how often to poll the API for the global leaderboard stats, in seconds (decimals allowed) */
    /** * @property {string[]} usersToIgnore - users to not include in the Global Leaderboard */
    /** * @property {number} newPlayerPopupTime - how long to display the popup when players enter, in seconds (decimals allowed) */
    /** * @property {string} apiSecret - DeepBot API key */
    /** * @property {{displayName: string, image: string}} racers */
    /** * @property {{displayName: string, image: string}} prestige */
    $.getJSON("resources/config.json", function(configData) {
    jsonFile = configData.jsonFile;
    nameLength = configData.nameLength;
    maxPlayersPerPageGlobal = configData.maxPlayersPerPageGlobal;
    maxPlayersTotalGlobal = configData.maxPlayersTotalGlobal;
    maxPlayersPerPageCurrent = configData.maxPlayersPerPageCurrent;
    maxPlayersTotalCurrent = configData.maxPlayersTotalCurrent;
    updatePlayersSpeed = configData.updatePlayersSpeed;
    scrollSpeed = configData.scrollSpeed;
    globalUpdateSpeed = configData.globalUpdateSpeed;
    usersToIgnore = configData.usersToIgnore;
    newPlayerPopupTime = configData.newPlayerPopupTime;

    $.each(configData.racers, function(i, item) {
      racers.push({"name": item.displayName, "image": item.image});
      newPlayerQueue.push([]);
      if (i > 0 && i < configData.racers.length - 1) {
          let filterButtons = $('.filterButtons');
          filterButtons.append('<img class="filter dim" src="' + item.image + '">');
          filterButtons.children().last().click(function () {
              $('.filter').removeClass('clicked');
              if (racerFilter == i) {
                  racerFilter = -1;
              }
              else {
                  racerFilter = i;
                  $(this).addClass('clicked');
              }
              updateDisplayNow();
          });
      }
    });
    $('.filterButtons').append('<div class="showAllButtons"><div class="showAllButton button dim clicked" id="topButton">Top</div><div class="showAllButton button dim" id="allButton">All</div></div>');
    $('#topButton').click(function() {
        if ($(this).css('filter') != 'grayscale(1)') {
        $(this).addClass('clicked');
        $('#allButton').removeClass('clicked');
        showAll = false;
        updateDisplayNow();
    }
    });
    $('#allButton').click(function() {
        if ($(this).css('filter') != 'grayscale(1)') {
            $(this).addClass('clicked');
            $('#topButton').removeClass('clicked');
            showAll = true;
            updateDisplayNow();
        }
    });

    $.each(configData.prestige, function(i, item) {
      prestige.push({"name": item.displayName, "image": item.image});
    });

    apiSocket = new WebSocket("ws://localhost:3337");
    apiSocket.onopen = function() {apiSocket.send('api|register|' + configData.apiSecret)};
    apiSocket.onmessage = socketResponse;


    updatePlayers(true);
    document.updateDisplayTimer = setInterval(updateDisplay, scrollSpeed * 1000);
    document.updateOverlaysTimer = setInterval(updateOverlays, 3000);
    document.updateGlobalTimer = setInterval(updateGlobal, globalUpdateSpeed * 1000);
  });
}

$(document).ready(function () {
    loadConfig();
    $('#readFile').change(function() {
        if (this.checked) {
            document.updatePlayersTimeout = setTimeout(updatePlayers, updatePlayersSpeed * 1000);
        }
        else {
            clearInterval(document.updatePlayersTimeout);
        }
    });
    $('#lockCurrentButton').click(function() {
        $('#lockGlobalButton').removeClass('clicked');
        if ($(this).hasClass('clicked')) {
            lock = 0;
            $(this).removeClass('clicked');
        }
        else {
            lock = 1;
            $(this).addClass('clicked');
            clearInterval(document.updateDisplayTimer);
        }
        $('#topButton, #allButton').css('filter', 'grayscale(0)');
        updateDisplayNow();
    });
    $('#lockGlobalButton').click(function() {
        $('#lockCurrentButton').removeClass('clicked');
        if ($(this).hasClass('clicked')) {
            lock = 0;
            $(this).removeClass('clicked');
            $('#topButton, #allButton').css('filter', 'grayscale(0)');
        }
        else {
            lock = 2;
            $(this).addClass('clicked');
            $('#topButton, #allButton').css('filter', 'grayscale(1)');
        }
        updateDisplayNow();
    });

    $(document).keydown(function(e) {
        //if (e.ctrlKey) {
            if ((e.keyCode >= 48) && (e.keyCode <= 57)) {
                let n = e.keyCode - 48;
                $(".filterButtons > img:nth-child(" + n + ")").trigger('click');
                return false;
            }
            if (e.keyCode == 65) {
                $('#allButton').trigger('click');
                return false;
            }
            if (e.keyCode == 67) {
                $('#lockCurrentButton').trigger('click');
                return false;
            }
            if (e.keyCode == 71) {
                $('#lockGlobalButton').trigger('click');
                return false;
            }
            if (e.keyCode == 84) {
                $('#topButton').trigger('click');
                return false;
            }
            if (e.keyCode == 85) {
                $('#readFile').trigger('click');
                return false;
            }
        //}
    });
});