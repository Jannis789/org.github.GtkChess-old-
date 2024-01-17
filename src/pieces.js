import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import GdkPixbuf from 'gi://GdkPixbuf';

import {
    fetchTile,
    updateChessBoard,
    printGameBoard
} from './game-board.js';

import {
    getPiece,
    definePiece,
    deletePiece,
    getPossibleMoves,
    performMove,
    isWhitesTurn,

} from './piecesController.js';

export const pieces = {};

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

class piece { // Base class for every Chess Piece
    constructor(pieceType, x, y) {
        this.pieceType = pieceType;
        this.x = x;
        this.y = y;
        this.initPiece(this.pieceType, this.x, this.y);
        definePiece(this, this.x, this.y);
        this.isWhitePiece = pieceType === pieceType.toUpperCase() ? true : false;
    }
    moveTo(newX, newY) {
        const {
            pieceType,
            x,
            y,
            initPiece
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
    initPiece(pieceType, x, y) {
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
export default positionCallback;

