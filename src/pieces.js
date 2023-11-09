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
    if (validMoves.some(([x,y]) => x === enemyKing[0] && y === enemyKing[1])) {
        console.log('Check!');
        return true;
    }
    return false;
}

function forceToProtect(possibleMoves, x, y) {
    // function shall be calculate the moves which can block the attack
    // Or King shall be moved to a save Position

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

class piece {
    constructor(pieceType, x, y) {
        this.pieceType = pieceType;
        this.x = x;
        this.y = y;
        initPiece(this.pieceType, this.x, this.y);
        definePiece(this, this.x, this.y);
        this.isWhitePiece = pieceType === pieceType.toUpperCase() ? true : false;
    }
    moveTo(newX, newY) {
        if (newX === this.x && newY === this.y) {
            return false;
        }
        updateChessBoard(this.x, this.y, null);
        updateChessBoard(newX, newY, this.pieceType);
        initPiece(null, this.x, this.y);
        deletePiece(newX, newY);
        deletePiece(this.x, this.y);
        console.log('------------------------------------------------');
        console.log('Piece: ' + this.pieceType + ' will be moved from: ' + this.x + '|' + this.y + ' to: ' + newX + '|' + newY);
        console.log('------------------------------------------------');
        printGameBoard();
        this.x = newX;
        this.y = newY;
        definePiece(this, newX, newY);
        initPiece(this.pieceType, newX, newY);
        return true;
    }
}

export class pawn extends piece {
    constructor(pieceType, x, y) {
        super(pieceType, x, y);
    }

    get getValidMoves() {
        const {isWhitePiece} = this;
        const validMoves = [];
        const offsetY = isWhitePiece ? -1 : 1;
        // Check regular position
        if (getPiece(this.x, this.y + offsetY) === undefined) {
            validMoves.push([this.x, this.y + offsetY]);
            // Check if there is no figure at the starting position
            // Check if the Y-coordinate for white is 6 or if the Y-coordinate for black is 1.
            if (
                getPiece(this.x, this.y + offsetY * 2) === undefined &&
                ((this.y === 6 && isWhitePiece) || (this.y === 1 && !isWhitePiece))
            ) {
                validMoves.push([this.x, this.y + offsetY * 2]);
            }
        }
        // Check capture positions
		let filteredHittablePositions = [];
        const capturePositions = isWhitePiece ? [
			[-1, -1],
			[1, -1]
		] : [
			[1, 1],
			[-1, 1]
		];
        for (const [captureX, captureY] of capturePositions) {
            const opponent = getPiece(this.x + captureX, this.y + captureY);
            if (opponent && isWhitePiece !== opponent.isWhitePiece) {
				filteredHittablePositions.push([this.x + captureX, this.y + captureY]);
                validMoves.push([this.x + captureX, this.y + captureY]);
                
            }
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
        const { isWhitePiece } = this;
        const validMoves = [];
        for (const [xOffset, yOffset] of this.movementPattern) {
            const [newX, newY] = [this.x + xOffset, this.y + yOffset];
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
        const { x, y, isWhitePiece, movementPattern } = this;
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
        const {isWhitePiece} = this;
        // Create an array to store valid moves
        const validMoves = [];

        // Get the current x and y coordinates of the piece
        const [x, y] = [this.x, this.y];

        // Iterate through each offset in the movement pattern of the piece
        for (const [xOffset, yOffset] of this.movementPattern) {
            // Calculate the new x and y coordinates based on the offset
            const [newX, newY] = [x + xOffset, y + yOffset];

            // Get the piece at the new coordinates
            const newPiece = getPiece(newX, newY);
            
            // Check if the new coordinates are out of bounds
            const outOfBounds = newX < 0 || newX > 7 || newY < 0 || newY > 7;

            // Check if the new coordinates are empty or contain an opponent's piece
            if (!outOfBounds && (!newPiece || newPiece.isWhitePiece !== isWhitePiece)) {
                // Add the valid move to the array
                validMoves.push([newX, newY]);
            }
        }

        // Get all values from pieces and flaten it
        const allPieces = Object.values(pieces).flat();

        // Iterate through each piece
        for (let i = 0; i < allPieces.length; i++) {
            // Get the current piece
            const piece = allPieces[i];

            // Check if the piece exists and is not the same color as the current piece and is not a king
            if (piece && piece.isWhitePiece !== isWhitePiece && piece.pieceType.toLowerCase() !== 'k') {
                // Get the valid moves of the opponent piece
                const enemyValidMoves = piece.getValidMoves;

                // Iterate through each valid move of the current current ValidPieces
                for (const [x, y] of validMoves) {
                    // Check if the opponent's valid moves include the current move
                    if (enemyValidMoves.some(([enemyX, enemyY]) => enemyX === x && enemyY === y)) {
                        // Remove the move from the validMoves array
                        return validMoves.filter(([previousX, previousY]) => previousX !== x && previousY !== y);
                    }
                }
            }
        }

        // Return the array of valid moves

        // can't attack the king, needs new function

        return validMoves;
    }
}

function initPiece(pieceType, x, y) { // refactored
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

const positionCallback = {
    handleChessPiece: function(x, y) {
        performMove(x, y);
    }
};

let previousMoves = [];
let previousPiece = [];

function performMove(x, y) {
    const piece = getPiece(x, y);
    if (piece && piece.isWhitePiece === isWhitesTurn) {
        const selectedMoves = piece.getValidMoves;
        previousPiece = piece;
        unselectMoves(previousMoves);
        selectValidMoves(selectedMoves);
        previousMoves = selectedMoves;
    }
    if (previousMoves.some(([selectedX, selectedY]) => selectedX === x && selectedY === y)) {
        previousPiece.moveTo(x, y);
        if (checkCheck(getPiece(x, y).getValidMoves)) {
            
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
