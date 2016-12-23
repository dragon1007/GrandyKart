/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


let MAXSECONDS;

let MOVEFACTOR;
let CHARSDIV;
let TIMEDIV;
let LEVELDIV;
let DIVS = [];
let PLACELOOKUP = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7};

let currentWins = 0;
let running = false;
let interval;
let time = 0;

let audioLosses = [];
let audioWins = [];

let levelWon = [];
let levelTime = [];
let numOfLevels = 0;
let lastTime = 0;
let racers = [];
let totalKeys = 0;

function updateTime() {
    if (!running)
        return;
    let timepassed = MAXSECONDS - time;
    let left = MOVEFACTOR * timepassed;

    CHARSDIV.css("transform", "TranslateX(" + left + "px)");
    time = time - 1;
    TIMEDIV.text(getFormatTime(time));
    if (time < 1 ) {
        flashWinner();
        clearInterval(interval);
    }
}

function getFormatTime(seconds) {
    let min = Math.floor(seconds / 60);
    min = min < 10 ? "0" + min : min;
    let sec = seconds % 60;
    sec = sec < 10 ? "0" + sec : sec;
    return min + ":" + sec;
}

function flashWinner() {
    finishAudio.play();
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
    let place = PLACELOOKUP[currentWins];
    place = typeof place === 'undefined' ? DIVS.length - 1 : place;

    let p1;
    let p2;
    let p3;
    if (place == 0) {
        p1 = DIVS[DIVS.length - 1].attr("src");
        p2 = DIVS[DIVS.length - 2].attr("src");
        p3 = DIVS[DIVS.length - 3].attr("src");
    } else if (place == DIVS.length - 1) {
        p1 = DIVS[0].attr("src");
        p2 = DIVS[1].attr("src");
        p3 = DIVS[2].attr("src");
    } else {

        p3 = DIVS[(DIVS.length - place - 2) % DIVS.length].attr("src");
        p2 = DIVS[(DIVS.length - place) % DIVS.length].attr("src");
        p1 = DIVS[(DIVS.length - place - 1) % DIVS.length].attr("src");
    }
    $("#score1").css("background-image", "url(" + p1 + ")");
    $("#score2").css("background-image", "url(" + p2 + ")");
    $("#score3").css("background-image", "url(" + p3 + ")");
    let result = $("#result");
    result.css("height", "220px");
    result.animate({opacity: 1}, 800, "linear").delay(4000)
            .animate({opacity: 0}, 800, "linear");
}

function setPositions() {

    let place = PLACELOOKUP[currentWins];
    place = typeof place === 'undefined' ? DIVS.length - 1 : place;
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
    let place = PLACELOOKUP[currentWins];
    if (currentWins != 0 && PLACELOOKUP[currentWins - 1] != place) {
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
        startAudio.play();
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
    let timepassed = MAXSECONDS - time;
    levelTime[numOfLevels] = timepassed - lastTime;
    lastTime = timepassed;
    levelWon[numOfLevels++] = won;
    let stats = "Levels played: " + numOfLevels;
    for (let i = 0; i < numOfLevels; i++) {
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

function load() {
    $.getJSON("resources/config.json", function (configData) {
        let keysPerEntry = 0;
        jsonFile = configData.jsonFile;
        keysPerEntry = configData.keysPerEntry;
        MAXSECONDS = configData.timeLimitMinutes * 60;
        startAudio = new Audio(configData.startAudio);
        finishAudio = new Audio(configData.finishAudio);
        racers = [];
        $.each(configData.racers, function (i, item) {
            racers.push({"name": item.displayName, "image": item.image, "count": 0});
            if (item.audioLoss !== undefined) { audioLosses.push(new Audio(item.audioLoss)); }
            if (item.audioWin !== undefined) { audioWins.push(new Audio(item.audioWin)); }
        });
        $.get(jsonFile, function (data) {
            let keysData = JSON.parse(data.slice(0, -1) + "]");
            for (let i = 0; i < keysData.length; i++) {
                racers[keysData[i].racer].count++;
            }
            totalKeys = keysData.length * keysPerEntry;
       });
    });
    MOVEFACTOR = 1070 / MAXSECONDS;

    time = MAXSECONDS;

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
}

$(document).ready(function () {
    load();
});