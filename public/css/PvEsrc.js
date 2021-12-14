import {INPUT_EVENT_TYPE, COLOR, Chessboard, MARKER_TYPE} from "https://socochess.sites.tjhsst.edu/src/cm-chessboard/Chessboard.js";
    var d;
    
    // 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    
    var ws = new WebSocket(`wss://${location.host}/play/`);
    function isOpen(ws2) { return ws2.readyState === ws2.OPEN }
    
    function inputHandler(event) 
    {
        console.log("event", event);
        event.chessboard.removeMarkers(undefined, MARKER_TYPE.dot);
        if (event.type === INPUT_EVENT_TYPE.moveStart) {
            const moves = chess.moves({square: event.square, verbose: true});
            for (const move of moves) {
                board.addMarker(move.to, MARKER_TYPE.dot);
            }
            return moves.length > 0;
        } 
        else if (event.type === INPUT_EVENT_TYPE.moveDone) 
        {
            var move = {from: event.squareFrom, to: event.squareTo};
            var possibleMoves = chess.moves();
            if (!(possibleMoves.includes(move))){
                move = {from: event.squareFrom, to: event.squareTo, promotion: 'q'};
            }
            const result = chess.move(move);
            console.log("move: ", move);
            if (result) {
                board.disableMoveInput();
                board.setPosition(chess.fen());
                updateMoveList(chess.history());
                possibleMoves = chess.moves({verbose: true});
                if (possibleMoves.length > 0) { //the url below should be ai1 for candidate or ai2 for best
                    if(isOpen(ws)){
                        ws.send(JSON.stringify({"message":"request_move_1", "pgn":chess.pgn(), "fen":chess.fen()}));
                        
                    }
                    console.log("requested_move: ", chess.history());
                }
            } 
            else 
            {
                console.warn("invalid move", move);
            }
            return result;
        }
    }
    var chess;
    chess = new Chess();
    var board = "";
    function onmeese(message){
        if(JSON.parse(message.data).pgn === "OPEN"){
        }
        if(board === ""){
            board = new Chessboard(document.getElementById("board"), {
                position: chess.fen(),
                sprite: {url: "/src/images/chessboard-sprite-staunty.svg"},
                style: {moveMarker: MARKER_TYPE.square, hoverMarker: undefined, aspectRation:0.5},
                responsive: true,
                orientation: COLOR.white
            });
        }
        board.enableMoveInput(inputHandler, COLOR.white);
        updateMoveList(chess.history());
        
        if(JSON.parse(message.data).move){
            var mo = JSON.parse(message.data).move;
            chess.move(mo, {sloppy: true});
            console.log(mo);
            board.enableMoveInput(inputHandler, COLOR.white);
            board.setPosition(chess.fen());
            updateMoveList(chess.history());
        }
    }
    ws.onmessage = onmeese;
    
    var a = setInterval(()=>{
        
        console.log(isOpen(ws))
        if(!isOpen(ws)){
            ws = new WebSocket(`wss://${location.host}/play/`);
            ws.onmessage = onmeese;
            //ws.send(JSON.stringify({"message":"request_move_1", "pgn":chess.pgn(), "fen":chess.fen()}));
        }
    }, 1000)
        
    function updateMoveList(history) {
        // get the reference for the body
        var body = document.getElementById("moveList");

        // creates a <table> element and a <tbody> element
        var tbl = document.getElementById("table");
        body.removeChild(body.lastChild);
        tbl = document.createElement("table");
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
                let tbltext = "";
                if (j === 0) {
                    tbltext = "" + (i/2 + 1) + ".";
                }
                else{
                    tbltext += history[i+j-1];
                }
                var cellText = document.createTextNode(tbltext);
                if (j !== 0){
                    cell.className = "table table-move";
                }
                else{
                  cell.className = "table table-movenumber";
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