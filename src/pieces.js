import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import GdkPixbuf from 'gi://GdkPixbuf';
import {
    fetchTile,
    updateChessBoard,
    printGameBoard
}
from './game-board.js';
let whiteKing = [];
let blackKing = [];
const fullPieceTerm = {
    p: 'pawn',
    r: 'rook',
    n: 'knight',
    b: 'bishop',
    q: 'queen',
    k: 'king'
}
const pieces = {};
let isWhitesTurn = true;

function checkCheck(validMoves) {
    // If true is returned, the King shall be protected or moved
    const enemyKing = isWhitesTurn ? blackKing : whiteKing; // reference to the enemy King
    if (validMoves.some(([x, y]) => x === enemyKing[0] && y === enemyKing[1])) {
        console.log('Check!');
        return true;
    }
    return false;
}

function forceToProtect(possibleMoves, x, y) {
    // function shall be calculate the moves which can block the attack
    // Or King shall be moved to a save Position

}

// Determines if a piece at the specified position is guarded by a enemy pieces.
function isGuardedPiece(x, y) {
    let isGuarded = false;

    getPiece(x, y).changeTeam;

    const allPieces = Object.values(pieces).flat();
    for (let i = 0; i < allPieces.length; i++) {
        const piece = allPieces[i];
        if (piece && piece.isWhitePiece !== isWhitesTurn) {
            const enemyValidMoves = piece.pieceType.toLowerCase() === 'p' ? piece.attackPositions : piece.getValidMoves;
            isGuarded = enemyValidMoves.some(([enemyValidX, enemyValidY]) => enemyValidX === x && enemyValidY === y) || isGuarded;
        }
    }

    getPiece(x, y).changeTeam;

    return isGuarded;
}

function getPiece(x, y) {
    return pieces[x]?.[y];
}

function deletePiece(x, y) {
    delete pieces[x]?.[y];
}

function definePiece(object, x, y) {
    pieces[x] = pieces[x] || [];
    pieces[x][y] = object;
}

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
            y,
            isWhitePiece
        } = this;
        if (newX === x && newY === y) {
            return false;
        }
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
    get changeTeam() {
        this.isWhitePiece = !this.isWhitePiece;
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

    get getValidMoves() {
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
            const opponent = getPiece(x + captureX, y + captureY);
            if (opponent && isWhitePiece !== opponent.isWhitePiece) {
                validMoves.push([x + captureX, y + captureY]);

            }
        }
        return validMoves;
    }
    get attackPositions() {
        const {
            x,
            y,
            isWhitePiece,
            capturePositions
        } = this;
        const validMoves = [];
        for (const [captureX, captureY] of capturePositions) {
            validMoves.push([x + captureX, y + captureY]);
        }

        return validMoves;

    }
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
    }
    get getValidMoves() {
        const {
            isWhitePiece,
            x,
            y,
            movementPattern
        } = this;
        const validMoves = getValidMoves(isWhitePiece, x, y, movementPattern);

        return validMoves;
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
    get getValidMoves() {
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
    get getValidMoves() {
        const {
            x,
            y,
            isWhitePiece,
            movementPattern
        } = this;
        const validMoves = getValidMoves(isWhitePiece, x, y, movementPattern);

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
    get getValidMoves() {
        const {
            x,
            y,
            isWhitePiece,
            movementPattern
        } = this;
        const validMoves = getValidMoves(isWhitePiece, x, y, movementPattern);
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
        if (pieceType === 'K') {
            whiteKing = [this.x, this.y];
        }
        if (pieceType === 'k') {
            blackKing = [this.x, this.y];
        }
    }

    get getValidMoves() {
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
        
        // prevent king from moving into check by calulating all possible Moves from the enemy
        const illegalMoves = []; 
        Object.values(pieces).flat().flatMap(piece => {

            if (piece && piece.isWhitePiece !== isWhitePiece && piece.pieceType.toLowerCase() !== 'k') {

                const enemyValidMoves = piece.pieceType.toLowerCase() === 'p' ? piece.attackPositions : piece.getValidMoves;

                for (const [x, y] of legalMoves) {

                    if ( // x and y is the possible move of the King
                         // enemyX and enemyY is the possible move of the threatining pieces
                        enemyValidMoves.some(([enemyX, enemyY]) => enemyX === x && enemyY === y) || // Add an illegal position if the king can be attacked or
                        (getPiece(x, y) && isGuardedPiece(x, y))                                    // if a piece attacked by the king is guarded.

                    ) {
                        illegalMoves.push([x, y]);
                    }
                }
            }
        
        });
        // If no illegal move is encountered, return the legal moves
        if (!illegalMoves) {
            return legalMoves;
        }
        const filteredMoves = [];

        for (const [x,y] of legalMoves) {
            // If illegal moves matches legal moves, they won't be added to the final array
            if (!illegalMoves.some( ([illegalX, illegalY]) => x === illegalX && y === illegalY)) {
                filteredMoves.push([x,y]);
            }
        }
        return filteredMoves;
    }
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

function getValidMoves(isWhitePiece, x, y, movementPattern) {
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

/** 
 * positionCallback is a callback object with a Function,
 * the function handleChessPiece will be triggered every time a chess tile is clicked.
 */

const positionCallback = {
    handleChessPiece: function(x, y) {
        performMove(x, y);
    }
};

let previousMoves = [];
let previousPiece = [];

function performMove(x, y) {
    const piece = getPiece(x, y);
    // if a piece is encountered
    if (piece && piece.isWhitePiece === isWhitesTurn) {
        const selectedMoves = piece.getValidMoves;
        previousPiece = piece;
        unselectMoves(previousMoves);
        selectValidMoves(selectedMoves);
        previousMoves = selectedMoves;
    }
    // if a selected tile is encountered
    if (previousMoves.some(([selectedX, selectedY]) => selectedX === x && selectedY === y)) {
        previousPiece.moveTo(x, y);
        // if a check is encountered
        if (checkCheck(getPiece(x, y).getValidMoves)) {
            // force King to move
            forceToProtect(getPiece(x, y).getValidMoves, x, y);
        }
        unselectMoves(previousMoves);
        isWhitesTurn = !isWhitesTurn;
        previousMoves = [];
    }
}

function selectValidMoves(validPositions) {
    for (const [x, y] of validPositions) {
        const buttonContext = fetchTile(x, y).get_style_context();
        buttonContext.add_class('possible-position');
    }
}

function unselectMoves(positions) {
    for (const [x, y] of positions) {
        const buttonContext = fetchTile(x, y).get_style_context();
        buttonContext.remove_class('possible-position');
    }
}

export default positionCallback;
