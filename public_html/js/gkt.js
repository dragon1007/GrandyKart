/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var MAXSECONDS;

var MOVEFACTOR;
var CHARSDIV;
var TIMEDIV;
var LEVELDIV;
var DIVS = [];
var PLACELOOKUP = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7};

var currentWins = 0;
var time = 45 * 60;
var total = 45 * 60;
var running = false;
var interval;

var audioLosses = [
    new Audio('audio/Bowser Lose.wav'),
    new Audio('audio/Wario Lose.wav'),
    new Audio('audio/DK Lose.wav'),
    new Audio('audio/Yoshi Lose.wav'),
    new Audio('audio/Toad Lose.wav'),
    new Audio('audio/Peach Lose.wav'),
    new Audio('audio/Luigi Lose.wav')
];
var audioWins = [
    new Audio('audio/Wario Win.wav'),
    new Audio('audio/DK Win.wav'),
    new Audio('audio/Yoshi Win.wav'),
    new Audio('audio/Toad Win.wav'),
    new Audio('audio/Peach Win.wav'),
    new Audio('audio/Luigi Win.wav'),
    new Audio('audio/Mario Win.wav')
];

var levelWon = [];
var levelTime = [];
var numOfLevels = 0;
var lastTime = 0;
var racers = [];
var totalKeys = 0;

function updateTime() {
    if (!running)
        return;
    var timepassed = MAXSECONDS - time;
    var left = MOVEFACTOR * timepassed;

    CHARSDIV.css("transform", "TranslateX(" + left + "px)");
    time = time - 1;
    TIMEDIV.text(getFormatTime(time));
    if (time > 0) {
//        setInterval(updateTime, 1000);
    } else {
        flashWinner();
    }
}

function getFormatTime(seconds) {
    var min = Math.floor(seconds / 60);
    min = min < 10 ? "0" + min : min;
    var sec = seconds % 60;
    sec = sec < 10 ? "0" + sec : sec;
    return min + ":" + sec;
}

function flashWinner() {
    var audio = new Audio('audio/Race Finish.wav');
    audio.play();
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

function showResult() {
    var place = PLACELOOKUP[currentWins];
    place = typeof place === 'undefined' ? DIVS.length - 1 : place;

    var p1;
    var p2;
    var p3;
    if (place == 0) {
        p1 = DIVS[DIVS.length - 1].attr("src");
        p2 = DIVS[DIVS.length - 2].attr("src");
        p3 = DIVS[DIVS.length - 3].attr("src");
    } else if (place == DIVS.length - 1) {
        p1 = DIVS[0].attr("src");
        p2 = DIVS[1].attr("src");
        p3 = DIVS[2].attr("src");
    } else {

        var p3 = DIVS[(DIVS.length - place - 2) % DIVS.length].attr("src");
        var p2 = DIVS[(DIVS.length - place) % DIVS.length].attr("src");
        var p1 = DIVS[(DIVS.length - place - 1) % DIVS.length].attr("src");
    }
    $("#score1").css("background-image", "url(" + p1 + ")");
    $("#score2").css("background-image", "url(" + p2 + ")");
    $("#score3").css("background-image", "url(" + p3 + ")");
    $("#result").css("height", "220px");
    $("#result").animate({opacity: 1}, 800, "linear").delay(4000)
            .animate({opacity: 0}, 800, "linear");
}

function setPositions() {

    var place = PLACELOOKUP[currentWins];
    place = typeof place === 'undefined' ? DIVS.length - 1 : place;
    if (place < DIVS.length) {
        tempDisableButtons();
        DIVS[(DIVS.length - place + 1) % DIVS.length].css("z-index", "1");
        setTimeout(function () {

            DIVS[(DIVS.length - place + 1) % DIVS.length].css("z-index", "2");
        }, 2200);
        if (place != DIVS.length - 1) {
            for (var i = 0; i < DIVS.length; i++) {
                var pos = (place + i) % DIVS.length;
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
            for (var i = 0; i < DIVS.length; i++) {
                var pos = (place + i) % DIVS.length;
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

function swapFirst() {
    tempDisableButtons();
    levelStats(true);
    LEVELDIV.text("levels: " + (++currentWins));
    if (PLACELOOKUP[currentWins] < DIVS.length) {

        showRacers();
        setTimeout(setPositions, 2000);

    }
    playAudio();
}

function showRacers() {
    var place = PLACELOOKUP[currentWins];
    if (currentWins != 0 && PLACELOOKUP[currentWins - 1] != place) {
        var p2 = DIVS[(DIVS.length - place) % DIVS.length].attr("src");
        var p1 = DIVS[(DIVS.length - place - 1) % DIVS.length].attr("src");
        var R1 = $("#R1").parent();
        var R2 = $("#R2").parent();
        $("#R1").css("background-image", "url(" + p1 + ")");
        $("#R2").css("background-image", "url(" + p2 + ")");
        $("#race").css("height", "230px");
        $("#race").animate({opacity: 1}, 900, function () {
            R1.animate({left: "+=800px"}, 2500);
            R2.animate({left: "-=1200px"}, 2500,
                    function () {
                        $("#race").animate({opacity: 0}, 600, "linear",
                                function () {
                                    R1.css("left", "-=800px");
                                    R2.css("left", "+=1200px");
                                    $("#race").css("height", "0px");
                                });
                    });



        });
    }
}

function playAudio() {
    if (currentWins <= audioWins.length) {
        audioLosses[currentWins - 1].play();
        setTimeout(function () {
            audioWins[currentWins - 1].play();
        }, 1500);
        //audioWins[currentWins - 1].play();
    }
}

function undoSwap(resetFull) {
    resetFull = typeof resetFull === 'undefined' ? true : resetFull;
    if (currentWins > 0) {
        currentWins -= 1;
    }
    if (resetFull) {

        stopTimer();
        currentWins = 0;
        time = MAXSECONDS;
        TIMEDIV.text(getFormatTime(MAXSECONDS));
        CHARSDIV.css("transform", "TranslateX(0px)");
        numOfLevels = 0;
        levelTime = [];
        levelWon = [];
        load();
    }

    LEVELDIV.text("levels: " + (currentWins));
    setPositions();
}

function tempDisableButtons() {
    $("input").prop("disabled", true);
    setTimeout(function () {
        $("input").prop("disabled", false);
    }, 2000);
}

function isShown(shown) {
    tempDisableButtons();
    shown = typeof shown === 'undefined' ? true : shown;
    if (shown) {
        undoSwap();
        $("#fulltrack").animate({opacity: 1.0}, 800, "linear", function () {
            CHARSDIV.animate({opacity: 1.0}, 800, "linear");
        });
    } else {
        CHARSDIV.animate({opacity: 0}, 800, "linear", function () {
            $("#fulltrack").animate({opacity: 0}, 800, "linear");
        });

    }


}


function startTimer() {
    if (!running) {
        tempDisableButtons();
        running = true;
        interval = setInterval(updateTime, 1000);
        var audio = new Audio('audio/Race Start.wav');
        audio.play();
    }
}

function stopTimer() {
    if (running) {
        tempDisableButtons();
        running = false;
        clearInterval(interval);
    }
}

function skipLevel() {
    levelStats(false);
}

function levelStats(won) {
    var timepassed = MAXSECONDS - time;
    levelTime[numOfLevels] = timepassed - lastTime;
    lastTime = timepassed;
    levelWon[numOfLevels++] = won;
    var stats = "Levels played: " + numOfLevels;
    for (var i = 0; i < numOfLevels; i++) {
        stats += " <br> Level " + (i + 1);
        if (levelWon[i]) {
            stats += " Completed in " + getFormatTime(levelTime[i]);
        } else {
            stats += " Failed in " + getFormatTime(levelTime[i]);
        }
    }
    if (won) {
        $("#levelResult").html("Completed!");
    } else {
        $("#levelResult").html("Skipped!");
    }
    $("#levelHistory").html(stats);
    $("#dropdownStats").toggle("slow");
    setTimeout(function() {$("#dropdownStats").toggle("slow");},10000);
}

$(document).ready(function () {
    $("#start").click(startTimer);
    //$("#stop").click(showResult);
    $("#stop").click(stopTimer);
    $("#reset").click(isShown);
    $("#win").click(swapFirst);
    $("#lose").click(undoSwap.bind(this, false));
    $("#hide").click(isShown.bind(this, false));
    $("#skip").click(skipLevel);
    CHARSDIV = $("#characters");
    TIMEDIV = $("#timer");
    LEVELDIV = $("#completed");
    DIVS = [$("#7"), $("#6"), $("#5"), $("#4"), $("#3"), $("#2"), $("#1"), $("#0")];
    load();
});

function load() {
    var keysPerEntry = 0;
    $.getJSON("resources/config.json", function (configData) {
        jsonFile = configData.jsonFile;
        keysPerEntry = configData.keysPerEntry;
        MAXSECONDS = configData.timeLimitMinutes * 60;
        racers = [];
        $.each(configData.racers, function (i, item) {
            racers.push({"name": item.displayName, "image": item.image, "count": 0});
        });
    });
    $.get(jsonFile, function (data) {
        var keysData = JSON.parse(data.slice(0, -1) + "]");
        for (var i = 0; i < keysData.length; i++) {
            racers[keysData[i].racer].count++;
        }
        totalKeys = keysData.length * keysPerEntry;
    });
    MOVEFACTOR = 1150 / MAXSECONDS;    
}