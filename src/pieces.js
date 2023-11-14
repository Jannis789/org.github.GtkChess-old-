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

function checkCheck(checkWhitesKing) {
    // Überprüft, ob die gültigen Züge den gegnerischen König bedrohen.
    let isInCheck = false;
    const enemyKing = checkWhitesKing ? blackKing : whiteKing; // Referenz auf den gegnerischen König, da der Zug noch nicht beendet ist
    Object.values(pieces).flat().forEach(piece => {
        if (piece.isWhitePiece === checkWhitesKing) {
            const enemyValidMoves = piece.possibleMoves;
            for (const threatiningPiece of enemyValidMoves) {
                const tP = threatiningPiece.toString();
                const eP = enemyKing.toString();
                if (tP === eP) {
                    isInCheck = true;
                }
            }
        }
    });
    return isInCheck;
}

function forceToProtect(x, y) {
    // should add all the possible moves to the protectableMoves array, if they're protecting the king
    // reference to the enemy King, because the Turn isn't over yet
    // but it will notice if the king is in check in the next round 
    const enemyKing = isWhitesTurn ? blackKing : whiteKing;
    const validMovesWhileInCheck = [];

    let offsetMultiplier = 1;
    while (true) {
        const newX = Math.sign(x - enemyKing[0]) * offsetMultiplier + enemyKing[0];
        const newY = Math.sign(y - enemyKing[1]) * offsetMultiplier + enemyKing[1];

        const outOfBounds = newX < 0 || newX > 7 || newY < 0 || newY > 7;
        validMovesWhileInCheck.push([newX, newY]);

        if (outOfBounds || (newX === x && newY === y)) {
            break;
        }

        offsetMultiplier++;
    }
    if (validMovesWhileInCheck) {
        protectableMoves = validMovesWhileInCheck;
    }
}

// Determines if a piece at the specified position is guarded by a enemy pieces.
function isGuardedPiece(x, y) {
    let isGuarded = false;

    getPiece(x, y).changeTeam;

    Object.values(pieces).flat().flatMap(piece => {
        if (piece && piece.isWhitePiece !== isWhitesTurn) {
            const enemyValidMoves = piece.pieceType.toLowerCase() === 'p' ? piece.attackPositions : piece.possibleMoves;
            isGuarded = enemyValidMoves.some(([enemyValidX, enemyValidY]) => enemyValidX === x && enemyValidY === y) || isGuarded;
        }
    });

    getPiece(x, y).changeTeam;

    return isGuarded;
}

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
    simulateMoveTo(newX, newY) {
        const {
            x,
            y
        } = this;
        if (newX === x && newY === y) {
            return false;
        }

        deletePiece(newX, newY);
        deletePiece(x, y);
        this.x = newX;
        this.y = newY;
        definePiece(this, newX, newY);
        return this;
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
            const newY = x + captureY;
            const outOfBounds = newX < 0 || newX > 7 || newY < 0 || newY > 7;
            if (!outOfBounds) {
                validMoves.push([newX, newY]);
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
        if (pieceType === 'K') {
            whiteKing = [this.x, this.y];
        }
        if (pieceType === 'k') {
            blackKing = [this.x, this.y];
        }
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

function movesWhichWontLeadToCheck(x, y) {
    const [startX, startY] = [x, y];
    const illegalMoves = [];
    const deletedPieces = [];
    let piece = getPiece(x, y);
    const possibleMoves = piece.possibleMoves;

    for (const [possibleX, possibleY] of possibleMoves) {
        const targetPiece = getPiece(possibleX, possibleY);
        if (targetPiece && targetPiece.isWhitePiece !== isWhitesTurn) {
            deletedPieces.push(targetPiece);
        }

        piece = piece.simulateMoveTo(possibleX, possibleY);
        if (!targetPiece) {
            for (const deletedPiece of deletedPieces) {
                initPiece(deletedPiece.pieceType, deletedPiece.x, deletedPiece.y);
                definePiece(deletedPiece, deletedPiece.x, deletedPiece.y);
            }
        }
        if (checkCheck(!isWhitesTurn)) {
            illegalMoves.push([possibleX, possibleY]);
        }
        deletePiece(possibleX, possibleY);

    }

    piece.moveTo(startX, startY);
    for (const deletedPiece of deletedPieces) {
        definePiece(deletedPiece, deletedPiece.x, deletedPiece.y);
        initPiece(deletedPiece.pieceType, deletedPiece.x, deletedPiece.y);
    }
    if (illegalMoves.length === 0) {
        return possibleMoves;
    }

    return possibleMoves.filter(legalMove => {
        return !illegalMoves.some(illegalMove => legalMove[0] === illegalMove[0] && legalMove[1] === illegalMove[1]);
    });
}

function performMove(x, y) {
    const piece = getPiece(x, y);
    // if a piece is encountered
    if (piece && piece.isWhitePiece === isWhitesTurn) {
        let selectedMoves = movesWhichWontLeadToCheck(x, y);
        previousPiece = piece;
        unselectMoves(previousMoves);
        selectPossibleMoves(selectedMoves);
        previousMoves = selectedMoves;
    }

    if (previousMoves.some(([selectedX, selectedY]) => selectedX === x && selectedY === y)) {
        previousPiece.moveTo(x, y);
        unselectMoves(previousMoves);
        isWhitesTurn = !isWhitesTurn;
        previousMoves = [];
        previousPiece = [];
    }
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

export default positionCallback;
