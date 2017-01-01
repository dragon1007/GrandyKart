/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

let firstLoad = false;

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
let prestigeNotificationLength;
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
let update = false;
let prestigeUpQueue = [];

let prestigeNotificationTimer;
let updatePlayersTimeout;
let updateDisplayTimer;
let updateOverlaysTimer;
let updateGlobalTimer;

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
    clearInterval(updateDisplayTimer);
    updateDisplay(true);
    updateDisplayTimer = setInterval(updateDisplay, scrollSpeed * 1000);
}

function addToOverlay(overlayId) {
    if (!$('.leaderboardDiv').is(':visible')) {
        return false;
    }
    let overlay = $('.racerOverlay' + overlayId);
    while ((newPlayerQueue[overlayId].length > 0) && (overlay.children().length < 2)) {
        overlay.append('<div class="newPlayerPopup"><span><img class="newPlayerImage" src="' + newPlayerQueue[overlayId][0].racer.image + '">' + newPlayerQueue[overlayId][0].name + '</span></div>');
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
    if (Object.keys(players).length < 1) {
        global = true;
    }
    let maxPlayersPerPage;
    let maxPlayersTotal;
    if (global) {
        maxPlayersPerPage = maxPlayersPerPageGlobal
        maxPlayersTotal = maxPlayersTotalGlobal;
        if ((leaderBoard.text() == 'Current Players') || leaderBoard.text() == '') {
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
        if ((leaderBoard.text() == 'Global Leaders') || leaderBoard.text() == '') {
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
        if ($('.leaderboardDiv').is(':visible')) {
            try {
                data = data.trim();
                if (data.lenth < 2) { data = "[]"; }
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
                totalKeys = Object.keys(players).length * keysPerEntry;
                $("#stats2").html(getPayout());
                if (initial) {
                    updateDisplay();
                    updateOverlays();
                    updateGlobal();
               }
            }
            catch(e) { }
        }
    }).always(function() {
        if (update) {
            updatePlayersTimeout = setTimeout(updatePlayers, updatePlayersSpeed * 1000);
        }
    });
}

function updateGlobal() {
    if ((apiSocket.readyState == 1) && (currentUserRequest == 0)) {
        apiSocket.send('api|get_users_count');
    }
}

function addPrestigeNotification(player) {
    let p = $('.prestigeNotifications');
    let s = '<div class="prestigeNotification">';
    if (prestige[player.prestige.level].image !== undefined) {
        s = s + '<img class="prestigeImage" src="' + prestige[player.prestige.level].image + '" alt="' + prestige[player.prestige.level].displayName + '"> ';
    }
    s = s + '<span class="playerName">' + player.name + '</span>';
    s = s + ' leveled up!</div>';
    p.append(s);
    $(p.children()[0]).fadeIn();
    if (prestige[player.prestige.level].audio !== undefined) {
        prestige[player.prestige.level].audio.play();
    }
    if (prestigeNotificationTimer == undefined) {
        prestigeNotificationTimer = setTimeout(movePrestigeQueue, prestigeNotificationLength * 1000);
    }
}

function movePrestigeQueue() {
    prestigeNotificationTimer = undefined;
    let c = $('.prestigeNotifications').children();
    if (c.length > 0) {
        $(c[0]).fadeOut(function() {
            $(this).remove();
            if (prestigeUpQueue.length > 0) {
                addPrestigeNotification(prestigeUpQueue[0]);
                prestigeUpQueue.shift();
            }
        });
    }
}

function prestigeLevelUp(player) {
    if ($('.prestigeNotifications').children().length == 0) {
        addPrestigeNotification(player);
    }
    else {
        prestigeUpQueue.push(player);
    };
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
            Object.keys(globalTempArray).forEach(function (key) {
                var item = globalTempArray[key];
                if (globalPlayers[item.name] !== undefined) {
                    if ((globalPlayers[item.name].prestige !== undefined) && (globalPlayers[item.name].prestige.level !== undefined)) {
                        if (globalPlayers[item.name].prestige.level < item.prestige.level) {
                            prestigeLevelUp(item);
                        }
                    }
                }
                globalPlayers[item.name] = globalTempArray[key];
            });
            currentUserRequest = 0;
            if (firstLoad == false) {
                firstLoad=true;
                updateDisplay(true);
            }
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
    /** * @property {number} prestigeNotificationLength - how long to display the popup when a player upgrades their prestige, in seconds (decimals allowed) */
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
    prestigeNotificationLength = configData.prestigeNotificationLength;
    keysPerEntry = configData.keysPerEntry;
    MAXSECONDS = configData.timeLimitMinutes * 60;
    firstPercent = configData.firstPercent;
    secondPercent = configData.secondPercent;
    thirdPercent = configData.thirdPercent;

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
    $('.filterButtons').append('<div class="showAllButtons"><div class="showAllButton button dim clicked" id="topButton"><span class="underline">T</span>op</div><div class="showAllButton button dim" id="allButton"><span class="underline">A</span>ll</div></div>');
    $('#topButton').click(function() {
        if ($(this).hasClass('disabled') == false) {
        $(this).addClass('clicked');
        $('#allButton').removeClass('clicked');
        showAll = false;
        updateDisplayNow();
    }
    });
    $('#allButton').click(function() {
        if ($(this).hasClass('disabled') == false) {
            $(this).addClass('clicked');
            $('#topButton').removeClass('clicked');
            showAll = true;
            updateDisplayNow();
        }
    });

    $.each(configData.prestige, function(i, item) {
        let p = {"name": item.displayName, "image": item.image}
        if (item.audio !== undefined) {
            p.audio = new Audio(item.audio);
        }
      prestige.push(p);
    });

    apiSocket = new WebSocket("ws://localhost:3337");
    apiSocket.onopen = function() {apiSocket.send('api|register|' + configData.apiSecret)};
    apiSocket.onmessage = socketResponse;

    //updatePlayers(true);
    updateDisplayTimer = setInterval(updateDisplay, scrollSpeed * 1000);
    updateOverlaysTimer = setInterval(updateOverlays, 3000);
    updateGlobalTimer = setInterval(updateGlobal, globalUpdateSpeed * 1000);
  });
}

function hideBoard() {
    let l = $('.leaderboardDiv');
    if ((l.queue().length == 0) && (l.is(':visible'))) {
        $('#dropdownStats').finish().animate({width: '1849px'},1000);
        $('#stats2, #stats3').finish().animate({left: '1320px'},1000);
        $('#levelResult, #levelResultText').finish().animate({width: '1478px'},1000);
        $('#trackImg').finish().animate({width: '1478px'},1000);
        $('#timer').finish().animate({left: '1720px'},1000);
        $('.racerOverlay').finish().fadeOut();
        l.animate({left: '550px'}, 1000, function () {
            $(this).hide();
            $('#hideBoardButton').addClass('clicked');
            $('#showBoardButton').removeClass('clicked');
            MOVEFACTOR = 1048 / MAXSECONDS;
            let left = Math.ceil(MOVEFACTOR * (MAXSECONDS - time));
            CHARSDIV.css("transform", "TranslateX(" + left + "px)");
        });
    }
}
function showBoard() {
    let l = $('.leaderboardDiv');
    if ((l.queue().length == 0) && (!l.is(':visible'))) {
        $('#dropdownStats').finish().animate({width: '1429px'},1000);
        $('#stats2, #stats3').finish().animate({left: '900px'},1000);
        $('#levelResult, #levelResultText').finish().animate({width: '1000px'},1000);
        $('#trackImg').finish().animate({width: '996px'},1000);
        $('#timer').finish().animate({left: '1240px'},1000);
        $('.racerOverlay').finish().fadeIn();
        l.show().animate({left: '0px'}, 1000, function() {
            $('#showBoardButton').addClass('clicked');
            $('#hideBoardButton').removeClass('clicked');
            MOVEFACTOR = 575 / MAXSECONDS;
            let left = Math.ceil(MOVEFACTOR * (MAXSECONDS - time));
            CHARSDIV.css("transform", "TranslateX(" + left + "px)");
        });
    }
}

$(document).ready(function () {
    $("#restart").click(restart);
    $("#show").click(showTrack);
    $("#hide").click(hideTrack);
    $("#start").click(startTimer);
    $("#stop").click(stopTimer);
    $("#finish").click(endNow);
    $("#undo").click(undo);
    $("#win").click(winLevel);
    $("#skip").click(skipLevel);
    $("#stats").click(toggleStats);
    CHARSDIV = $("#characters");
    TIMEDIV = $("#timer");
    LEVELDIV = $("#completed");
    loadConfig();
    $('#lockCurrentButton').click(function() {
        $('#lockGlobalButton').removeClass('clicked');
        if ($(this).hasClass('clicked')) {
            lock = 0;
            $(this).removeClass('clicked');
        }
        else {
            lock = 1;
            $(this).addClass('clicked');
            clearInterval(updateDisplayTimer);
        }
        $('#topButton, #allButton').removeClass('disabled');
        updateDisplayNow();
    });
    $('#lockGlobalButton').click(function() {
        $('#lockCurrentButton').removeClass('clicked');
        if ($(this).hasClass('clicked')) {
            lock = 0;
            $(this).removeClass('clicked');
            $('#topButton, #allButton').removeClass('disabled');
        }
        else {
            lock = 2;
            $(this).addClass('clicked');
            $('#topButton, #allButton').addClass('disabled');
            clearInterval(updateDisplayTimer);
        }
        updateDisplayNow();
    });

    $('#showBoardButton').click(function() {
        showBoard();
    });
    $('#hideBoardButton').click(function() {
        hideBoard();
    });

    $(document).keydown(function(e) {
        /*
         T = show only Top entries on leaderboard
         A = show All entries on leaderboard
         C = lock to Current leaderboard
         G = lock to Global leaderboard
         1-6 = show only racer #X on leaderboard

         R = fade in/Restart
         O = fade Out
         S = Start
         P = Pause
         E = End now
         W = Win level
         K = sKip level
         U = Undo level completion
         L = toggLe stats screen
         */
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
                if (e.keyCode == 72) {
                    $('#showBoardButton').trigger('click');
                    return false;
                }
                if (e.keyCode == 73) {
                    $('#hideBoardButton').trigger('click');
                    return false;
                }
            if (e.keyCode == 84) {
                $('#topButton').trigger('click');
                return false;
            }
        let b;
        if (e.keyCode == 82) {
            if (time === 0) {
                b = $('#restart');
            }
        }
        if (e.keyCode == 70) {
            b = $('#show');
        }
        if (e.keyCode == 79) {
            b = $('#hide');
        }
        if (e.keyCode == 83) {
            b = $('#start');
        }
        if (e.keyCode == 80) {
            b = $('#stop');
        }
        if (e.keyCode == 87) {
            b = $('#win');
        }
        if (e.keyCode == 75) {
            b = $('#skip');
        }
        if (e.keyCode == 85) {
            b = $('#undo');
        }
        if (e.keyCode == 76) {
            b = $('#stats');
        }
        if ((b !== undefined) && (b.hasClass('disabled') == false)) {
            b.trigger('click');
            return false;
        }
    });
});




let MAXSECONDS;

let MOVEFACTOR;
let CHARSDIV;
let TIMEDIV;
let LEVELDIV;
let DIVS = [];

let levelHistory = [];
let running = false;
let interval;
let time = 0;

let audioLosses = [];
let audioWins = [];

let _racers = [];
let totalKeys = 0;

let firstPercent = 0;
let secondPercent = 0;
let thirdPercent = 0;

let statsTime;
let dropdownTimer;
let levelResultTimer;
let levelStatsInterval;
let levelStatsTimeout;
let levelStatsUp = false;

let startAudio;
let finishAudio;
let timerAudio;
let timerAmount;

function getWins() {
    let count = 0;
    for (let i = 0; i < levelHistory.length; i++) {
        if (levelHistory[i].won == true) {
            count += 1;
        }
    }
    return count;
}


function updateTime() {
    if (!running)
        return;
    let left = Math.ceil(MOVEFACTOR * (MAXSECONDS - time));

    CHARSDIV.css("transform", "TranslateX(" + left + "px)");
    time -= 1;
    TIMEDIV.text(getFormatTime(time));
    if (time < 1 ) {
        clearInterval(interval);
        if (finishAudio !== undefined) {
            finishAudio.play();
        }
        function doFlash(i) {
            TIMEDIV.css("color", (i % 2 == 0 ? "red" : "yellow"));
            if (i < 12) {
                setTimeout(doFlash.bind(this, i + 1), 500);
            } else {
                setTimeout(function () {
                    TIMEDIV.css("color", "white");
                }, 2000);
            }
        }
        doFlash(0);
        setTimeout(showResult, 2000);
    }
    else if ((time < timerAmount) && (timerAudio !== undefined)) {
        timerAudio.play();
    }

}

function getFormatTime(seconds) {
    let min = Math.floor(seconds / 60);
    min = min < 10 ? "0" + min : min;
    let sec = seconds % 60;
    sec = sec < 10 ? "0" + sec : sec;
    return min + ":" + sec;
}

function getPayout() {
    return 'First place payout: &nbsp;' + Math.floor(totalKeys * firstPercent / 100) + ' keys<br>Second place payout: ' + Math.floor(totalKeys * secondPercent / 100) + ' keys<br>Third place payout: &nbsp;' + Math.floor(totalKeys * thirdPercent / 100) + ' keys</div>';
}

function getStats() {
    let currentWins = 0;
    let fastestTime = Number.MAX_SAFE_INTEGER;
    let slowestTime = 0;
    let fastest;
    let slowest;
    let levelStats = ""
    for (let i = 0; i < levelHistory.length; i++) {
        if (levelHistory[i].won == true) {
            currentWins += 1;
            if (levelHistory[i].timeTaken > slowestTime) {
                slowestTime = levelHistory[i].timeTaken;
                slowest = i;
            }
            if (levelHistory[i].timeTaken < fastestTime) {
                fastestTime = levelHistory[i].timeTaken;
                fastest = i;
            }
        }
        levelStats += "Level " + (i + 1);
        if (levelHistory[i].won) {
            levelStats += " Completed in " + getFormatTime(levelHistory[i].timeTaken);
        } else {
            levelStats += " Failed in " + getFormatTime(levelHistory[i].timeTaken);
        }
        levelStats += "<br>";
    }
    let stats = "";
    stats = '<div id="stats1">Current record: ' + currentWins + "-" + (levelHistory.length - currentWins);
    stats = stats + '<div id="levelStatsContainer"><div id="levelStats">' + levelStats;
    stats = stats + '</div></div>';
    stats = stats + '</div>';
    stats = stats + '<div id="stats2"">'
    stats = stats + getPayout();
    stats = stats + '</div>';
    stats = stats + '<div id="stats3">';
    if (fastest !== undefined) {
        stats = stats + 'Fastest: &nbsp;Level ' + (fastest + 1) + ' - ' + getFormatTime(fastestTime);
    }
    if (slowest !== undefined) {
        stats = stats + '<br>Slowest: Level ' + (slowest + 1) + ' - ' + getFormatTime(slowestTime);
    }
    stats = stats + '</div>';
    return stats;
}

function showResult() {
    let currentWins = getWins();

    let p1, p2, p3;
    if (currentWins == 0) {
        p1 = DIVS[DIVS.length - 1].attr("src");
        p2 = DIVS[DIVS.length - 2].attr("src");
        p3 = DIVS[DIVS.length - 3].attr("src");
    } else if (currentWins >= DIVS.length - 1) {
        p1 = DIVS[0].attr("src");
        p2 = DIVS[1].attr("src");
        p3 = DIVS[2].attr("src");
    } else {
        p1 = DIVS[(DIVS.length - currentWins - 1)].attr("src");
        p2 = DIVS[(DIVS.length - currentWins)].attr("src");
        p3 = DIVS[(DIVS.length - currentWins - 2)].attr("src");
    }
    $("#score1").css("background-image", "url(" + p1 + ")");
    $("#score2").css("background-image", "url(" + p2 + ")");
    $("#score3").css("background-image", "url(" + p3 + ")");
    let result = $("#result");
    result.css("height", "220px");
    result.animate({opacity: 1}, 800, "linear").delay(4000).animate({opacity: 0}, 800, "linear");
}

function setPositions() {
    let place = getWins();
    if (place >= DIVS.length - 1) {
        place = DIVS.length - 1;
    }
    if (place < DIVS.length) {
        tempDisableButtons();
        DIVS[(DIVS.length - place + 1) % DIVS.length].css("z-index", "1");
        setTimeout(function () {
            DIVS[(DIVS.length - place + 1) % DIVS.length].css("z-index", "2");
        }, 2200);
        if (place != DIVS.length - 1) {
            for (let i = 0; i < DIVS.length; i++) {
                let pos = (place + i) % DIVS.length;
                if (pos > 0 && pos < DIVS.length - 1 && place != 0) {
                    DIVS[i].animate({left: ((pos - 1)
                    % DIVS.length) * 50 + "px"}, 2000, "linear");
                } else if (place != 0) {
                    DIVS[i].animate({left: (((DIVS.length - 1) * 50) + (pos % (DIVS.length - 2) - 1) * 50) + "px"}, 2000, "linear");
                } else {
                    DIVS[i].animate({left: ((pos)
                    % DIVS.length) * 50 + "px"}, 2000, "linear");
                }
            }
        } else {
            for (let i = 0; i < DIVS.length; i++) {
                let pos = (place + i) % DIVS.length;
                if (pos > 1 && pos < DIVS.length - 1) {
                    DIVS[i].animate({left: ((pos - 2)
                    % DIVS.length) * 50 + "px"}, 2000, "linear");
                } else if (pos == DIVS.length - 1) {
                    DIVS[i].animate({left: ((DIVS.length - 1) * 50) + "px"}, 2000, "linear");
                } else {
                    DIVS[i].animate({left: (((DIVS.length - 1) * 50) - (pos + 1) * 50) + "px"}, 2000, "linear");
                }
            }
        }
    }
}

function showRacers() {
    let place = getWins();
    if (place > 0 && place < DIVS.length) {
        let p2 = DIVS[(DIVS.length - place) % DIVS.length].attr("src");
        let p1 = DIVS[(DIVS.length - place - 1) % DIVS.length].attr("src");
        let R1 = $("#R1");
        let R2 = $("#R2");
        let R1p = R1.parent();
        let R2p = R2.parent();
        let race = $("#race");
        R1.css("background-image", "url(" + p1 + ")");
        R2.css("background-image", "url(" + p2 + ")");
        race.css("height", "230px");
        race.animate({opacity: 1}, 900, function () {
            R1p.animate({left: "+=800px"}, 2500);
            R2p.animate({left: "-=1200px"}, 2500,
                function () {
                    race.animate({opacity: 0}, 600, "linear",
                        function () {
                            R1p.css("left", "-=800px");
                            R2p.css("left", "+=1200px");
                            race.css("height", "0px");
                        });
                });



        });
    }
}

function playAudio() {;
    let currentWins = getWins();
    if (currentWins <= audioWins.length) {
        var a = audioLosses[currentWins - 1];
        $(a).off().on('ended', function () {
            audioWins[currentWins - 1].play();
        });
        a.play();
    }
}

function tempDisableButtons() {
    $(".topButton:not(#stats)").addClass('disabled');
    setTimeout(function () {
        $(".topButton").removeClass('disabled');
    }, 2000);
}

function handleLevel(won) {
    let timepassed = MAXSECONDS - time;
    let currentTime = timepassed - (levelHistory.length > 0 ? levelHistory[levelHistory.length - 1].endTime : 0);
    let level = {"endTime": timepassed, "timeTaken": currentTime, "won": won };
    levelHistory.push(level);
    $("#levelResultText").html("Level " + levelHistory.length + (won ? " completed in " : " skipped after ") + getFormatTime(currentTime) + "!");
    $("#levelResult, #levelResultText").slideDown('slow')
    clearTimeout(levelResultTimer);
    levelResultTimer = setTimeout(function() { $("#levelResult, #levelResultText").slideUp('slow'); }, 8800);
}

function load(callback) {
    $.getJSON("resources/config.json", function (configData) {
        let keysPerEntry = 0;
        keysPerEntry = configData.keysPerEntry;
        MAXSECONDS = configData.timeLimitMinutes * 60;
        startAudio = ((configData.startAudio !== undefined) && (configData.startAudio.length > 0)) ? new Audio(configData.startAudio) : undefined;
        finishAudio = ((configData.finishAudio !== undefined) && (configData.finishAudio.length > 0)) ? new Audio(configData.finishAudio) : undefined;
        timerAudio = ((configData.timerAudio !== undefined) && (configData.timerAudio.length > 0)) ? new Audio(configData.timerAudio) : undefined;
        timerAmount = configData.timerAmount;
        firstPercent = configData.firstPercent;
        secondPercent = configData.secondPercent;
        thirdPercent = configData.thirdPercent;
        statsTime = configData.statsTime;
        _racers = [];
        audioLosses = [];
        audioWins = [];
        DIVS = [];
        $('#characters').empty();
        $.each(configData.racers, function (i, item) {
            _racers.push({"name": item.displayName, "image": item.image, "count": 0});
            $('#characters').append('<img id="' + i + '" class="character" src="' + item.trackImage + '" alt="' + item.displayName + '">');
            DIVS.unshift($('#characters #' + i));
            if (item.audioLoss !== undefined) { audioLosses.push(new Audio(item.audioLoss)); }
            if (item.audioWin !== undefined) { audioWins.push(new Audio(item.audioWin)); }
        });
        totalKeys = Object.keys(players).length * keysPerEntry;
        $("#stats2").html(getPayout());

        MOVEFACTOR = ($('.leaderboardDiv').is(':visible') ? 575 : 1048) / MAXSECONDS;

        time = MAXSECONDS;
        callback();
    });
}

function restart() {
    tempDisableButtons();
    //if (time == 0) {
    players = [];
    updatePlayers(true);
    resetTrack();
    //}
}

function showTrack() {
    tempDisableButtons();
    $("#fulltrack").animate({opacity: 1.0}, 800, "linear", function () {
        CHARSDIV.animate({opacity: 1.0}, 800, "linear");
    });
}


function hideTrack() {
    tempDisableButtons();
    CHARSDIV.animate({opacity: 0}, 800, "linear", function () {
        $("#fulltrack").animate({opacity: 0}, 800, "linear");
    });
}

function resetTrack() {
    stopTimer();
    CHARSDIV.animate({opacity: 0}, 800, "linear", function () {
        $("#fulltrack").animate({opacity: 0}, 800, "linear", function() {
            load(function() {
            update = true;
            newPlayerQueue = [];
            updatePlayersTimeout = setTimeout(updatePlayers, updatePlayersSpeed * 1000);
            time = MAXSECONDS;
            TIMEDIV.text(getFormatTime(time));
            levelHistory = [];
            LEVELDIV.text("levels: " + 0);
            CHARSDIV.css("transform", "TranslateX(0px)");
            setPositions();
            })});
    });
}

function winLevel() {
    if ((time > 0) && (time < MAXSECONDS)) {
        tempDisableButtons();
        handleLevel(true);
        $("#dropdownStats").html(getStats());
        let currentWins = getWins();
        LEVELDIV.text("levels: " + currentWins);
        if (currentWins < DIVS.length) {
            showRacers();
            setTimeout(setPositions, 2000);
        }
        playAudio();
        startTimer();
    }
}

function skipLevel() {
    if ((time > 0) && (time < MAXSECONDS)) {
        tempDisableButtons();
        handleLevel(false);
        $("#dropdownStats").html(getStats());
        startTimer();
    }
}

function undo() {
    if (levelHistory.length > 0) {
        levelHistory.pop();
    }
    LEVELDIV.text("levels: " + getWins());
    $("#dropdownStats").html(getStats());
    setPositions();
}


function endNow() {
    if ((time > 0) && (time < MAXSECONDS)) {
        clearInterval(interval);
        time = 1;
        updateTime();
    }
}

function startTimer() {
    if ((!running) && ($('#fulltrack').css('opacity') > 0)) {
        update = false;
        tempDisableButtons();
        running = true;
        interval = setInterval(updateTime, 1000);
        if ((time == MAXSECONDS) && (startAudio !== undefined)) {
            startAudio.play();
        }
    }
}

function stopTimer() {
    if (running) {
        tempDisableButtons();
        running = false;
        clearInterval(interval);
    }
}

function scrollLevelStats() {
    let ls = $("#levelStats");
    let dds = $("#dropdownStats");
    let top = ls.css('top').slice(0, -2);
    if (levelStatsUp == false) {
        if ((-1 * top) + (dds.height() - 80) < ls.height()) {
            return ls.css("top", top - 2);
        }
    }
    else {
        if (top < 0) {
            return ls.css("top", parseInt(top) + 2);
        }
    }
    clearInterval(levelStatsInterval);
    levelStatsUp = !levelStatsUp;
    levelStatsTimeout = setTimeout(function () {
        levelStatsInterval = setInterval(scrollLevelStats, 100);
    }, 3000);
}
function toggleStats() {
    let dds = $("#dropdownStats");
    if (dds.is(":visible")) {
        dds.finish().slideUp('slow');
        clearInterval(levelStatsInterval);
        clearTimeout(levelStatsTimeout);
    }
    else {
        dds.html(getStats());
        dds.slideDown('slow').queue(function() {
            let ls = $("#levelStats");
            if (ls.height() > (dds.height() - 80)) {
                levelStatsUp = false;
                clearInterval(levelStatsInterval);
                levelStatsTimeout = setTimeout(function() {
                    levelStatsInterval = setInterval(scrollLevelStats,100);
                },2000)
            }
        });
    }
}
