import {INPUT_EVENT_TYPE, COLOR, Chessboard, MARKER_TYPE} from "../styles/css?name=chb"
    var d
    
    
    $.get('https://jbarkerwebdev.sites.tjhsst.edu/jebchess/src/get_current_game', function(data, status){
        var chess = ''
        if (data !== ""){
            chess = new Chess()
            chess.load_pgn(data)
        }
        else{
            chess = new Chess()
        }
        
        function updateMoveList(history) {
            // get the reference for the body
            var body = document.getElementById("moveList");

            // creates a <table> element and a <tbody> element
            var tbl = document.getElementById("table");
            body.removeChild(body.lastChild)
            tbl = document.createElement("table")
            var tblBody = document.createElement("tbody");
        
            // creating all cells
            for (var i = 0; i < history.length; i+=2) {
                // creates a table row
                var row = document.createElement("tr");
        
                for (var j = 0; j < 3; j++) {
                    // Create a <td> element and a text node, make the text
                    // node the contents of the <td>, and put the <td> at
                    // the end of the table row
                    var cell = document.createElement("td");
                    let tbltext = ""
                    if (j === 0) {
                        tbltext = "" + (i/2 + 1) + "."
                    }
                    else{
                        tbltext += history[i+j-1]
                    }
                    var cellText = document.createTextNode(tbltext);
                    if (j !== 0){
                        cell.className = "table table-move"
                    }
                    else{
                      cell.className = "table table-movenumber"
                    }
                    cell.appendChild(cellText);
                    row.appendChild(cell);
                }
        
                // add the row to the end of the table body
                tblBody.appendChild(row);
            }
        
            // put the <tbody> in the <table>
            tbl.appendChild(tblBody);
            // appends <table> into <body>
            body.appendChild(tbl);
            // sets the border attribute of tbl to 2;
            tbl.setAttribute("border", "2");
        }

        function inputHandler(event) {
            console.log("event", event)
            event.chessboard.removeMarkers(undefined, MARKER_TYPE.dot)
            if (event.type === INPUT_EVENT_TYPE.moveStart) {
                const moves = chess.moves({square: event.square, verbose: true});
                for (const move of moves) {
                    event.chessboard.addMarker(move.to, MARKER_TYPE.dot)
                }
                return moves.length > 0
            } 
            else if (event.type === INPUT_EVENT_TYPE.moveDone) {
                var move = {from: event.squareFrom, to: event.squareTo}
                var possibleMoves = chess.moves()
                if (!(possibleMoves.includes(move))){
                    move = {from: event.squareFrom, to: event.squareTo, promotion: 'q'}
                }
                const result = chess.move(move)
                if (result) {
                    event.chessboard.disableMoveInput()
                    event.chessboard.setPosition(chess.fen())
                    $.get('https://jbarkerwebdev.sites.tjhsst.edu/jebchess/src/update_current_game?current_fen='+chess.pgn(), function(data, status){})
                    updateMoveList(chess.history())
                    possibleMoves = chess.moves({verbose: true})
                    if (possibleMoves.length > 0) { //the url below should be ai1 for candidate or ai2 for best
                        $.get('https://jeb-chess.sites.tjhsst.edu/ai2?fen='+chess.fen()+"&t=5", function(data, status){
                            var dat = data
                        
                        //for random moves
                        // const randomIndex = Math.floor(Math.random() * possibleMoves.length)
                        // const randomMove = possibleMoves[randomIndex]
                            setTimeout(() => { // smoother with 500ms delay
                                // chess.move({from: randomMove.from, to: randomMove.to})
                                chess.move(dat, {sloppy: true})
                                event.chessboard.enableMoveInput(inputHandler, COLOR.white)
                                event.chessboard.setPosition(chess.fen())
                                $.get('https://jbarkerwebdev.sites.tjhsst.edu/jebchess/src/update_current_game?current_fen='+chess.pgn(), function(data, status){})
                                updateMoveList(chess.history())
                            }, 500)
                        })
                    }
                } else {
                    console.warn("invalid move", move)
                }
                return result
            }
        }
        
        const board = new Chessboard(document.getElementById("board"), {
            position: chess.fen(),
            sprite: {url: "../styles/css?name=staunty"},
            style: {moveMarker: MARKER_TYPE.square, hoverMarker: undefined, aspectRation:.5},
            responsive: true,
            orientation: COLOR.white
        })
        board.enableMoveInput(inputHandler, COLOR.white)
        updateMoveList(chess.history())
    })
    
    //console.log(d)
    
    
    

    
    
    jQuery(document).ready(function($) {
        $(".table-movenumber").click(function() {
            history = chess.history()
            console.log("Made it here")
            let m = $(this).val().split(".")[0]
            chess.reset()
            for(var a = 0; a < (+m*2); a++){
                chess.move(history[a])
            }
            updateMoveList(chess.history())
        });
    });