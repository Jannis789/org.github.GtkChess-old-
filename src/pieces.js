import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import GdkPixbuf from 'gi://GdkPixbuf';

import {
    fetchTile
}
from './game-board.js';

const imageFile = {
    p: 'pawn',
    r: 'rook',
    n: 'knight',
    b: 'bishop',
    q: 'queen',
    k: 'king'
}

const pieces = {};

export function initPiece(pieceType, x, y) { // refactored
    const button = fetchTile(x, y);
    if (pieceType === null) {
        button.set_child(null);
        return button;
    }
    const piecePrefix = pieceType.toUpperCase() === pieceType ? 'white_' : 'black_'
    const resourcePath = '/org/github/GtkChess/img/' + piecePrefix + imageFile[pieceType.toLowerCase()] + '.svg';
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
        let reachedEnemyPiece = false;
        while (true) {
            const newX = x + xOffset * offsetMultiplier;
            const newY = y + yOffset * offsetMultiplier;
            const newPiece = pieces[newX]?.[newY];
            const outOfBounds = newX < 0 || newX > 7 || newY < 0 || newY > 7;

            if (outOfBounds || (newPiece && newPiece.isWhitePiece === isWhitePiece)) {
                false;
                break;
            }

            if (newPiece && newPiece.isWhitePiece !== isWhitePiece && !reachedEnemyPiece) {
                reachedEnemyPiece = true;
                validMoves.push([newX, newY]);
            }

            if (!reachedEnemyPiece) {
                validMoves.push([newX, newY]);
            }

            offsetMultiplier++;
        }
    }

    return validMoves;
}

function selectValidMoves(validPositions) {
    for (const [x, y] of validPositions) {
        const buttonContext = fetchTile(x, y).get_style_context();
        buttonContext.add_class('possible-position');
    }
    return validPositions;
}

function unselectMoves(positions) {
    if (!positions) {
        return;
    }
    for (const [x, y] of positions) {
        const buttonContext = fetchTile(x, y).get_style_context();
        buttonContext.remove_class('possible-position');
    }
}

export class pawn {
    constructor(pieceType, x, y) {
        this.pieceType = pieceType;
        this.x = x;
        this.y = y;
        initPiece(this.pieceType, this.x, this.y);
        pieces[x] = pieces[x] || [];
        pieces[x][y] = this;
        this.isWhitePiece = pieceType === pieceType.toUpperCase() ? true : false;
    }
    get getValidMoves() {
        const validMoves = [];
        const offsetY = this.isWhitePiece ? -1 : 1;
        const regularPosition = pieces[this.x]?.[this.y + offsetY] ? true : false;
        const startPosition = pieces[this.x]?.[this.y + offsetY * 2] ? true : false;
        const capturePositions = this.isWhitePiece ? [
            [-1, -1],
            [1, -1]
        ] : [
            [1, 1],
            [-1, 1]
        ];

        if (!regularPosition) {
            validMoves.push([this.x, this.y + offsetY]);
            if (!startPosition) {
                validMoves.push([this.x, this.y + offsetY * 2]);
            }
        }

        for (const [captureX, captureY] of capturePositions) {
            const opponent = pieces[this.x + captureX]?.[this.y + captureY];

            if (opponent && this.isWhitePiece !== opponent.isWhitePiece) {
                validMoves.push([this.x + captureX, this.y + captureY]);
            }
        }

        return validMoves;
    }

}

export class rook {
    constructor(pieceType, x, y) {
        this.pieceType = pieceType;
        this.x = x;
        this.y = y;
        initPiece(this.pieceType, this.x, this.y);
        pieces[x] = pieces[x] || [];
        pieces[x][y] = this;
        this.isWhitePiece = pieceType === pieceType.toUpperCase() ? true : false;
        const movementPattern = [
            [0, 1],
            [-1, 0],
            [1, 0],
            [0, -1],
        ];
        this.movementPattern = movementPattern;
    }
    get getValidMoves() {
        const validMoves = getValidMoves(this.isWhitePiece, this.x, this.y, this.movementPattern);

        return validMoves;

    }

}

export class knight {
    constructor(pieceType, x, y) {
        this.pieceType = pieceType;
        this.x = x;
        this.y = y;
        initPiece(this.pieceType, this.x, this.y);
        pieces[x] = pieces[x] || [];
        pieces[x][y] = this;
        this.isWhitePiece = pieceType === pieceType.toUpperCase() ? true : false;
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
        const validMoves = [];
        for (const [xOffset, yOffset] of this.movementPattern) {
            const newX = this.x + xOffset;
            const newY = this.y + yOffset;
            const newPiece = pieces[newX]?.[newY];
            const outOfBounds = newX < 0 || newX > 7 || newY < 0 || newY > 7;
            if (!outOfBounds && (!newPiece || newPiece.isWhitePiece !== this.isWhitePiece)) {
                validMoves.push([newX, newY]);
            }
        }
        return validMoves;
    }

}

export class bishop {
    constructor(pieceType, x, y) {
        this.pieceType = pieceType;
        this.x = x;
        this.y = y;
        initPiece(this.pieceType, this.x, this.y);
        pieces[x] = pieces[x] || [];
        pieces[x][y] = this;
        this.isWhitePiece = pieceType === pieceType.toUpperCase() ? true : false;
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

export class queen {
    constructor(pieceType, x, y) {
        this.pieceType = pieceType;
        this.x = x;
        this.y = y;
        initPiece(this.pieceType, this.x, this.y);
        pieces[x] = pieces[x] || [];
        pieces[x][y] = this;
        this.isWhitePiece = pieceType === pieceType.toUpperCase();
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
export class king {
    constructor(pieceType, x, y) {
        this.pieceType = pieceType;
        this.x = x;
        this.y = y;
        initPiece(this.pieceType, this.x, this.y);
        pieces[x] = pieces[x] || [];
        pieces[x][y] = this;
        this.isWhitePiece = pieceType === pieceType.toUpperCase() ? true : false;
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
    }
    get getValidMoves() {
        const validMoves = [];
        const {
            x,
            y,
            isWhitePiece,
            movementPattern
        } = this;

        for (const [xOffset, yOffset] of movementPattern) {
            const newX = x + xOffset;
            const newY = y + yOffset;

            if (newX >= 0 && newX <= 7 && newY >= 0 && newY <= 7) {
                const newPiece = pieces[newX]?.[newY];

                if (!newPiece || newPiece.isWhitePiece !== isWhitePiece) {
                    validMoves.push([newX, newY]);
                }
            }
        }

        return validMoves;
    }
}
const cachedMoves = [];
let cachedPieces = '';
// refactored
function pervomeMove(x, y) {
    if (pieces[x]?.[y]) {
        const selectedMoves = pieces[x][y].getValidMoves;
        cachedPieces = pieces[x][y].pieceType;
        cachedMoves.push([...selectedMoves]);

        if (cachedMoves.length === 2) {
            const previousMove = cachedMoves.shift();
            unselectMoves(previousMove);
        }

        selectValidMoves(selectedMoves);

        selectedMoves.length = 0;
        selectedMoves.push(...selectValidMoves(selectedMoves));
    }
    const isInCache = cachedMoves[0].some(([nx,ny]) => nx === x && ny === y);
    if (isInCache) {
        initPiece(cachedPieces, x, y);
    }
}


const positionCallback = {
    handleChessPiece: function(x, y) {
        console.log(x + "|" + y);
        pervomeMove(x, y);
    }
};

export default positionCallback;
