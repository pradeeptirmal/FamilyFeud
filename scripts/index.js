var app = {
  version: 1,
  currentQ: -1,
  jsonFile: "./assets/questions.json",
  // jsonFile: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/40041/FF3.json",
  board: $(
    "<div class='gameBoard'>" +
      "<!--- Scores --->" +
      "<div class='score' id='boardScore'>0</div>" +
      "<div class='score' id='team1' >0</div>" +
      "<div class='score' id='team2' >0</div>" +
      "<!--- Question --->" +
      "<div class='questionHolder'>" +
        "<span class='question'></span>" +
      "</div>" +
      "<!--- Answers --->" +
      "<div class='colHolder'>" +
        "<div class='col1'></div>" +
        "<div class='col2'></div>" +
      "</div>" +
      "<!--- Buttons --->" +
      "<div class='btnHolder'>" +
        "<div id='awardTeam1' data-team='1' class='button'>Award Team 1</div>" +
        "<div id='newQuestion' class='button'>New Question</div>" +
        "<div id='cross' data-team='1' class='cross button'>Strike</div>" +
        "<div id='awardTeam2' data-team='2'class='button'>Award Team 2</div>" +
      "</div>" +
    "</div>" +
    "<ul id='xContainer'></ul>"
  ),
  buzzer: document.getElementById("buzzer"),
  ding: document.getElementById("ding"),
  xCount: 0,
  // Utility functions
  shuffle: function(array) {
    var currentIndex = array.length,
      temporaryValue,
      randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  },
  jsonLoaded: function(data) {
    app.allData = data;
    app.questions = Object.keys(data);
    app.shuffle(app.questions);
    app.makeQuestion(app.currentQ);
    $("body").append(app.board);
    app.currentQ++;
  },
  // Action functions
  makeQuestion: function(qNum) {
    xCount = 0;
    if (qNum < 0) {
      return;
    }
    var qText = app.questions[qNum];
    var qAnswr = app.allData[qText];

    var qNum = qAnswr.length;
    qNum = qNum < 8 ? 8 : qNum;
    qNum = qNum % 2 != 0 ? qNum + 1 : qNum;

    var boardScore = app.board.find("#boardScore");
    var question = app.board.find(".question");
    var col1 = app.board.find(".col1");
    var col2 = app.board.find(".col2");

    boardScore.html(0);
    question.html(qText.replace(/&x22;/gi, '"'));
    col1.empty();
    col2.empty();

    for (var i = 0; i < qNum; i++) {
      var aLI;
      if (qAnswr[i]) {
        aLI = $(
          "<div class='cardHolder'>" +
            "<div class='card'>" +
            "<div class='front'>" +
            "<span class='DBG'>" +
            (i + 1) +
            "</span>" +
            "</div>" +
            "<div class='back DBG'>" +
            "<span>" +
            qAnswr[i][0] +
            "</span>" +
            "<b class='LBG'>" +
            qAnswr[i][1] +
            "</b>" +
            "</div>" +
            "</div>" +
            "</div>"
        );
      } else {
        aLI = $("<div class='cardHolder empty'><div></div></div>");
      }
      var parentDiv = i < qNum / 2 ? col1 : col2;
      $(aLI).appendTo(parentDiv);
    }

    var cardHolders = app.board.find(".cardHolder");
    var cards = app.board.find(".card");
    var backs = app.board.find(".back");
    var cardSides = app.board.find(".card>div");

    TweenLite.set(cardHolders, { perspective: 800 });
    TweenLite.set(cards, { transformStyle: "preserve-3d" });
    TweenLite.set(backs, { rotationX: 180 });
    TweenLite.set(cardSides, { backfaceVisibility: "hidden" });

    cards.data("flipped", false);

    function showCard() {
      var card = $(".card", this);
      if(card.length === 0) {
        return;
      }
      var flipped = $(card).data("flipped");
      var cardRotate = flipped ? 0 : -180;
      TweenLite.to(card, 1, { rotationX: cardRotate, ease: Back.easeOut });
      flipped = !flipped;
      if(card.length > 0 && flipped) {
        ding.play();
      }
      $(card).data("flipped", flipped);
      app.getBoardScore();
    }
    cardHolders.on("click", showCard);
  },
  getBoardScore: function() {
    var cards = app.board.find(".card");
    var boardScore = app.board.find("#boardScore");
    var currentScore = { var: boardScore.html() };
    var score = 0;
    function tallyScore() {
      if ($(this).data("flipped")) {
        var value = $(this)
          .find("b")
          .html();
        score += parseInt(value);
      }
    }
    $.each(cards, tallyScore);
    TweenMax.to(currentScore, 1, {
      var: score,
      onUpdate: function() {
        boardScore.html(Math.round(currentScore.var));
      },
      ease: Power3.easeOut
    });
  },
  awardPoints: function(number) {
    var num = Number.isInteger(number) ? number : $(this).attr("data-team");
    var boardScore = app.board.find("#boardScore");
    var currentScore = { var: parseInt(boardScore.html()) };
    var team = app.board.find("#team" + num);
    var teamScore = { var: parseInt(team.html()) };
    var teamScoreUpdated = teamScore.var + currentScore.var;
    TweenMax.to(teamScore, 1, {
      var: teamScoreUpdated,
      onUpdate: function() {
        team.html(Math.round(teamScore.var));
      },
      ease: Power3.easeOut
    });

    TweenMax.to(currentScore, 1, {
      var: 0,
      onUpdate: function() {
        boardScore.html(Math.round(currentScore.var));
      },
      ease: Power3.easeOut
    });
  },
  changeQuestion: function() {
    document.getElementById("xContainer").innerHTML = '';
    app.currentQ++;
    app.makeQuestion(app.currentQ);
  },
  addCross: function() {
    if(xCount <= 3) {
      xCount++;
      buzzer.play();
      var xContainer = document.getElementById("xContainer");
      var xMark = $("<li class='strike'>x</li>");
      $(xMark).appendTo(xContainer).show("fast");
      var ele = $( "li.strike" ).last();
      var tl = new TimelineLite();
          tl.to(ele, 0.25, {scaleX:2, scaleY:2})
            .to(ele, 0.5, {scaleX:1, scaleY:1});
      
	  }
  },
  revealAnswer: function(answerNumber) {
    console.log(`reveal answer ${answerNumber}`);
  },
  keyBoardEvents: function() {
    document.onkeypress = function (e) {
      // use e.keyCode
      switch(e.code) {
        case 'KeyX':
          app.addCross();
          break;
        case 'KeyN':
          app.changeQuestion();
          break;
        case 'Digit1':
          app.awardPoints(1);
          break;
        case 'Digit2':
          app.awardPoints(2);
          break;
        case 'Numpad1':
          app.revealAnswer(1);
          break;
        case 'Numpad2':
          app.revealAnswer(2);
          break;
        case 'Numpad3':
          app.revealAnswer(3);
          break;
        case 'Numpad4':
          app.revealAnswer(4);
          break;
        case 'Numpad5':
          app.revealAnswer(5);
          break;
        case 'Numpad6':
          app.revealAnswer(6);
          break;
        case 'Numpad7':
          app.revealAnswer(7);
          break;
        case 'Numpad8':
          app.revealAnswer(8);
          break;

      }
    };
  },
  // Inital function
  init: function() {
    $.getJSON(app.jsonFile, app.jsonLoaded);
    app.board.find("#newQuestion").on("click", app.changeQuestion);
    app.board.find("#awardTeam1").on("click", app.awardPoints);
    app.board.find("#awardTeam2").on("click", app.awardPoints);
    app.board.find("#cross").on("click", app.addCross);
    app.keyBoardEvents();
  }
};
app.init();
