import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import GdkPixbuf from 'gi://GdkPixbuf';

import {
    fetchTile,
    updateChessBoard,
    printGameBoard,
    kings
} from './game-board.js';


let isWhitesTurn = true;
const pieces = {};

const fullPieceTerm = {
    p: 'pawn',
    r: 'rook',
    n: 'knight',
    b: 'bishop',
    q: 'queen',
    k: 'king'
}
const positionCallback = {
    handleChessPiece: function(x, y) {
        performMove(x, y);
    }
};

function getPiece(x, y) {
    return pieces[x]?.[y];
}

function deletePiece(x, y) {
    const deleteElement = pieces[x]?.[y];
    delete pieces[x]?.[y];
    return deleteElement;
}

function definePiece(object, x, y) {
    pieces[x] = pieces[x] || [];
    pieces[x][y] = object;
}

function initPiece(pieceType, x, y) {
    const button = fetchTile(x, y);
    if (pieceType === null) {
        button.set_child(null);
        return button;
    }
    const piecePrefix = pieceType.toUpperCase() === pieceType ? 'white_' : 'black_'
    const resourcePath = '/org/github/GtkChess/img/' + piecePrefix + fullPieceTerm[pieceType.toLowerCase()] + '.svg';
    const file = Gio.File.new_for_uri('resource://' + resourcePath);
    const inputStream = file.read(null);
    const image = new Gtk.Image();
    const pixbuf = GdkPixbuf.Pixbuf.new_from_stream_at_scale(inputStream, 400, 400, true, null);
    image.set_from_pixbuf(pixbuf);
    button.set_child(image);
    return button;
}

/**
 * positionCallback is a callback object with a Function,
 * the function handleChessPiece will be triggered every time a chess tile is clicked.
 */

class piece { // Base class for every Chess Piece
    constructor(pieceType, x, y) {
        this.pieceType = pieceType;
        this.x = x;
        this.y = y;
        initPiece(this.pieceType, this.x, this.y);
        definePiece(this, this.x, this.y);
        this.isWhitePiece = pieceType === pieceType.toUpperCase() ? true : false;
    }
    moveTo(newX, newY) {
        const {
            pieceType,
            x,
            y
        } = this;
        updateChessBoard(x, y, null);
        updateChessBoard(newX, newY, pieceType);
        initPiece(null, x, y);
        deletePiece(newX, newY);
        deletePiece(x, y);
        console.log('------------------------------------------------');
        console.log('Piece: ' + this.pieceType + ' will be moved from: ' + this.x + '|' + this.y + ' to: ' + newX + '|' + newY);
        console.log('------------------------------------------------');
        printGameBoard();
        this.x = newX;
        this.y = newY;
        definePiece(this, newX, newY);
        initPiece(pieceType, newX, newY);
        return true;
    }
    simulateMoveTo(newX, newY) {
        const {
            isWhitePiece,
            pieceType,
            x,
            y
        } = this;
        deletePiece(newX, newY);
        deletePiece(x, y);
        this.x = newX;
        this.y = newY;
        definePiece(this, newX, newY);
        return this;
    }
}

export class pawn extends piece {
    constructor(pieceType, x, y) {
        super(pieceType, x, y);
        const isWhitePiece = pieceType === pieceType.toUpperCase() ? true : false;
        this.capturePositions = isWhitePiece ? [
            [-1, -1],
            [1, -1]
        ] : [
            [1, 1],
            [-1, 1]
        ];
    }

    get possibleMoves() { // later add outOfBounds to possibleMoves
        const {
            x,
            y,
            isWhitePiece,
            capturePositions
        } = this;
        const validMoves = [];
        const offsetY = isWhitePiece ? -1 : 1;
        // Check regular position
        if (getPiece(x, y + offsetY) === undefined) {
            validMoves.push([x, y + offsetY]);
            // Check if there is no figure at the starting position
            // Check if the Y-coordinate for white is 6 or if the Y-coordinate for black is 1.
            if (
                !getPiece(x, y + offsetY * 2) &&
                ((y === 6 && isWhitePiece) || (y === 1 && !isWhitePiece))
            ) {
                validMoves.push([x, y + offsetY * 2]);
            }
        }
        // Check capture positions
        for (const [captureX, captureY] of capturePositions) {
            const newX = x + captureX;
            const newY = y + captureY;
            const outOfBounds = newX < 0 || newX > 7 || newY < 0 || newY > 7;
            const opponent = getPiece(newX, newY);
            if (opponent && isWhitePiece !== opponent.isWhitePiece && !outOfBounds) {
                validMoves.push([newX, newY]);
            }
        }
        return validMoves;
    }
    get attackPositions() {
        const {
            x,
            y,
            capturePositions
        } = this;

        const validMoves = [];
        for (const [captureX, captureY] of capturePositions) {
            const newX = x + captureX;
            const newY = y + captureY;
            const outOfBounds = newX < 0 || newX > 7 || newY < 0 || newY > 7;
            if (!outOfBounds) {
                validMoves.push([newX, newY]);
            }
        }
        return validMoves;

    }
}

function getPossibleMoves(isWhitePiece, x, y, movementPattern) {
    const validMoves = [];
    for (const [xOffset, yOffset] of movementPattern) {
        let offsetMultiplier = 1;
        while (true) {
            const [newX, newY] = [x + xOffset * offsetMultiplier, y + yOffset * offsetMultiplier];
            const newPiece = getPiece(newX, newY);
            const outOfBounds = newX < 0 || newX > 7 || newY < 0 || newY > 7;
            // Break the loop if the new coordinates are out of bounds or if a piece of the same color is encountered
            if (outOfBounds || (newPiece && newPiece.isWhitePiece === isWhitePiece)) {
                break;
            }
            validMoves.push([newX, newY]); // Add the new coordinates to the valid moves array
            // Break the loop if a piece of a different color is encountered
            if (newPiece && newPiece.isWhitePiece !== isWhitePiece) {
                break;
            }
            offsetMultiplier++;
        }
    }
    return validMoves;
}

export class rook extends piece {
    constructor(pieceType, x, y) {
        super(pieceType, x, y);
        const movementPattern = [
            [0, 1],
            [-1, 0],
            [1, 0],
            [0, -1],
        ];
        this.movementPattern = movementPattern;
        this.isMoved = false;
    }
    get possibleMoves() {
        const {
            isWhitePiece,
            x,
            y,
            movementPattern
        } = this;
        const validMoves = getPossibleMoves(isWhitePiece, x, y, movementPattern);

        return validMoves;
    }

    get allreadyMoved() {
        this.isMoved = true;
    }
}

export class knight extends piece {
    constructor(pieceType, x, y) {
        super(pieceType, x, y);
        const movementPattern = [
            [-2, 1],
            [-1, 2],
            [1, 2],
            [2, 1],
            [2, -1],
            [1, -2],
            [-1, -2],
            [-2, -1]
        ];
        this.movementPattern = movementPattern;
    }
    get possibleMoves() {
        const {
            isWhitePiece,
            x,
            y,
            movementPattern
        } = this;
        const validMoves = [];
        for (const [xOffset, yOffset] of movementPattern) {
            const [newX, newY] = [x + xOffset, y + yOffset];
            const newPiece = getPiece(newX, newY);
            const outOfBounds = newX < 0 || newX > 7 || newY < 0 || newY > 7;
            if (!outOfBounds && (!newPiece || newPiece.isWhitePiece !== isWhitePiece)) {
                validMoves.push([newX, newY]);
            }
        }

        return validMoves;
    }
}

export class bishop extends piece {
    constructor(pieceType, x, y) {
        super(pieceType, x, y);
        const movementPattern = [
            [-1, 1],
            [1, 1],
            [-1, -1],
            [1, -1]
        ];
        this.movementPattern = movementPattern;
    }
    get possibleMoves() {
        const {
            x,
            y,
            isWhitePiece,
            movementPattern
        } = this;
        const validMoves = getPossibleMoves(isWhitePiece, x, y, movementPattern);

        return validMoves;
    }
}

export class queen extends piece {
    constructor(pieceType, x, y) {
        super(pieceType, x, y);
        this.movementPattern = [
            [-1, 1],
            [0, 1],
            [1, 1],
            [-1, 0],
            [1, 0],
            [-1, -1],
            [0, -1],
            [1, -1]
        ];
    }
    get possibleMoves() {
        const {
            x,
            y,
            isWhitePiece,
            movementPattern
        } = this;
        const validMoves = getPossibleMoves(isWhitePiece, x, y, movementPattern);
        return validMoves;
    }
}

export class king extends piece {
    constructor(pieceType, x, y) {
        super(pieceType, x, y);
        const movementPattern = [
            [-1, 1],
            [0, 1],
            [1, 1],
            [-1, 0],
            [1, 0],
            [-1, -1],
            [0, -1],
            [1, -1]
        ];
        this.movementPattern = movementPattern;
        this.isMoved = false;
    }

    get possibleMoves() {
        const {
            x,
            y,
            isWhitePiece,
            movementPattern
        } = this;

        const legalMoves = [];

        for (const [xOffset, yOffset] of movementPattern) {

            const [newX, newY] = [x + xOffset, y + yOffset];
            const newPiece = getPiece(newX, newY);
            const outOfBounds = newX < 0 || newX > 7 || newY < 0 || newY > 7;

            if (!outOfBounds && (!newPiece || newPiece.isWhitePiece !== isWhitePiece)) {
                legalMoves.push([newX, newY]);
            }

        }

        // prevent king from moving into check by calculating all possible Moves from the enemy

        // If no illegal move is encountered, return the legal moves
        return legalMoves;
    }

    get getRochadeMoves() {
        const leftRook = isWhitesTurn ? getPiece(0, 7) : getPiece(0, 0);
        const rightRook = isWhitesTurn ? getPiece(7, 7) : getPiece(7, 0);
    
        const finalMoves = [];
    
        const checkTilesReachable = (start, end) => {
            for (let i = start; i <= end; i++) {
                const pieceBetweenRookAndKing = isWhitesTurn ? getPiece(i, 7) : getPiece(i, 0);
                if (pieceBetweenRookAndKing) {
                    return false;
                }
            }
            return true;
        };
    
        if (leftRook && !leftRook.isMoved && checkTilesReachable(1, 3)) {
            const kingFinalPosition = isWhitesTurn ? [2, 7] : [2, 0];
            rochadeTriggeredLeft = kingFinalPosition;
            finalMoves.push(kingFinalPosition);
        }
    
        if (rightRook && !rightRook.isMoved && checkTilesReachable(5, 6)) {
            const kingFinalPosition = isWhitesTurn ? [6, 7] : [6, 0];
            rochadeTriggeredRight = kingFinalPosition;
            finalMoves.push(kingFinalPosition);
        }
    
        return finalMoves;
    }

    get allreadyMoved() {
        this.isMoved = true;
    }
}

// <--- END OF CLASSES

let rochadeTriggeredLeft = [];
let rochadeTriggeredRight = [];

function movesWhichWontLeadToCheck(x, y) {
    const possibleMoves = getPiece(x, y).possibleMoves;
    const finalMoves = [];
    const piece = getPiece(x, y) || false;
    const kingPiece = isWhitesTurn ? kings.white : kings.black;
    if (!piece) {
        return finalMoves;
    }
    function getPossibleMoves() {
        const possibleMoves = [];
        
        Object.values(pieces).flat().forEach(vPiece => {
            if (vPiece.isWhitePiece !== piece.isWhitePiece) {
                possibleMoves.push(...vPiece.possibleMoves);
            }
        });
        
        return possibleMoves;
    }

    function checkIfInCheck(kingPosition) {
        const possibleMoves = getPossibleMoves();
        return !possibleMoves.some(v => v[0] === kingPosition[0] && v[1] === kingPosition[1]);
    }
    // returns true if the Piece at the startPosition can check if the piece moves to targetedPosition,
    // it simulates if a move leads to check
    function simulateMove(startPosition, targetedPosition) {
        
            let check = false;
            // ----- save hitted piece -----
            const deletedPiece = getPiece(targetedPosition[0], targetedPosition[1]);
            // ----- simulate possible move -----
            const playerPiece = piece.simulateMoveTo(targetedPosition[0], targetedPosition[1]);
            // ----- check if simulated move leads to check -----
            if (checkIfInCheck([kingPiece.x, kingPiece.y])) {
                check = true;
            }
            // ----- move attacking piece back -----
            playerPiece.simulateMoveTo(startPosition[0], startPosition[1]);
            // ----- restore hitted piece -----
            if (deletedPiece) {
                deletedPiece.simulateMoveTo(targetedPosition[0], targetedPosition[1]);
            }
            return check;
        
    }
    
    possibleMoves.forEach(move => {
        if (simulateMove([x, y], move)) {
            finalMoves.push(move);
        }
    });

    if (piece.pieceType.toLowerCase() === 'k') {
        getPiece(x, y).getRochadeMoves.forEach(move => {
                if (simulateMove([x, y], move)) {
                finalMoves.push(move);
            }
        });
    }

    return finalMoves;
}


function selectPossibleMoves(possiblePositions) {
    for (const [x, y] of possiblePositions) {
        const buttonContext = fetchTile(x, y).get_style_context();
        buttonContext.add_class('possible-position');
    }
}

function unselectMoves(previousPosition) {
    for (const [x, y] of previousPosition) {
        const buttonContext = fetchTile(x, y).get_style_context();
        buttonContext.remove_class('possible-position');
    }
}

let previousMoves = [];
let previousPiece = [];

function performRochade(x,y) {
    const leftRook = isWhitesTurn ? getPiece(0, 7) : getPiece(0, 0);
    const rightRook = isWhitesTurn ? getPiece(7, 7) : getPiece(7, 0);

    if (rochadeTriggeredLeft[0] === x && rochadeTriggeredLeft[1] === y) {
        isWhitesTurn ? leftRook.moveTo(3, 7) : leftRook.moveTo(3, 0);
    } else if (rochadeTriggeredRight[0] === x && rochadeTriggeredRight[1] === y) {
        isWhitesTurn ? rightRook.moveTo(5, 7) : rightRook.moveTo(5, 0);
    }
            
}
function isCheckMate() {
    Object.values(pieces).flat().forEach(piece => {
        if (piece.isWhitePiece !== isWhitesTurn) {
            if (movesWhichWontLeadToCheck(piece.x, piece.y).length === 0) {

            } else {
                return true;
            }
        }
    })
    return false;
}

function performMove(x, y) {
    const piece = getPiece(x, y);
    const encounteredSelectedposition = previousMoves.some(([selectedX, selectedY]) => selectedX === x && selectedY === y);
    if (piece && piece.isWhitePiece === isWhitesTurn) {
        // get All possible moves
        const selectedMoves = movesWhichWontLeadToCheck(x, y);
        // ------------------
        // update previous piece (also necessary for the else part)
        previousPiece = piece;
        // ------------------
        // unselect previous moves
        unselectMoves(previousMoves);
        // ------------------
        // select new moves
        selectPossibleMoves(selectedMoves);
        // ------------------
        // update previous moves
        previousMoves = selectedMoves;
    } else
    if (encounteredSelectedposition) {
        // prevent Rochade, while moved
        if (previousPiece && (previousPiece.pieceType.toLowerCase() === 'k' || previousPiece.pieceType.toLowerCase() === 'r')) {
            previousPiece.allreadyMoved;
        }
        // ------------------
        // performs Rochade
        if (rochadeTriggeredLeft || rochadeTriggeredRight) {
            performRochade(x,y);
        }
        // ------------------
        // Perform move
        previousPiece.moveTo(x, y);
        // ------------------
        // Update Kings position
        if(previousPiece.pieceType === "K") {
            kings.white = getPiece(x,y);
        }
        if (previousPiece.pieceType === "k") {
            kings.black = getPiece(x,y);
        }
        // ------------------
        // Prepare for next turn
        unselectMoves(previousMoves);
        isWhitesTurn = !isWhitesTurn;
        previousMoves = [];
        previousPiece = [];
        rochadeTriggeredLeft = null;
        rochadeTriggeredRight = null;
        // ------------------
    } 
}

export default positionCallback;

