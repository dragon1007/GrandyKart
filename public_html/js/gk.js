/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


function update() {
  $("#racersDiv").children().each(function (i, item) {
    if ($(item).is(":visible")) {
      if ($("#racersDiv").children().length > i + 2) {
        $(item).fadeOut(function() { $($("#racersDiv").children()[i + 2]).fadeIn(); });
        if ($("#racersDiv").children().length > i + 1) {
          $($("#racersDiv").children()[i + 1]).fadeOut(function() {
            if ($("#racersDiv").children().length > i + 3) {
              $($("#racersDiv").children()[i + 3]).fadeIn();
            }
          });
        }
      }
      else { 
        if ($("#racersDiv").children().length > i + 1) {
          $(item).fadeOut();
          $($("#racersDiv").children()[i + 1]).fadeOut(updateRacers);
        }
        else {
          $(item).fadeOut(updateRacers);
        }
      }
      return false;
    }
  });
}

function updateRacers() {
  $.when( $.getJSON("keys.json"), $.getJSON("racers.json") ).done(function(keysData,racerData) {
    var maxRacers = 16;
    var racers = new Array();
    for (i=0; i < racerData[0].racers.length; i++) {
     var keysObject = keysData[0].users.filter(function (obj) {
       return obj.name == racerData[0].racers[i].name;
     })[0];
     racers.push({ "name": racerData[0].racers[i].name,
                  "choice": racerData[0].racers[i].choice,
                  "prestige": keysObject.prestige,
                  "keys": keysObject.keys });
    }
    var sorted = racers.sort(function(a,b) {
      if (a.prestige > b.prestige) {
        return -1;
      }
      if (a.prestige < b.prestige) {
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
    $.each(sorted, function(i, racer) {
      if (i % maxRacers == 0) {
        d.append('<div style="float: left; width: 210px; display: none;">');
      }
      d.children().last().append('<div><img src="' + getPrestigeImage(racer.prestige) + '" /> ' + racer.name + " - " + racer.keys + '<img style="height: 32px; width: 32px;" src="' + racer.choice + 'Racer.png" /></div>');
    });
    if (d.children().length > 0) { $(d.children()[0]).fadeIn(); }
    if (d.children().length > 1) { $(d.children()[1]).fadeIn(); }
  });
}
$(document).ready(function() {
  updateRacers();
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
