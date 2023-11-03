import Gtk from 'gi://Gtk?version=4.0';
import positionCallback from './pieces.js';
import {
    pawn,
    rook,
    knight,
    bishop,
    king,
    queen
} from './pieces.js';

export const chessBoard = [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['P', "P", "P", null, "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"]
];
const validPieceCharacters = ["a", "b", "c", "d", "e", "f", "g", "h"];
const numSize = validPieceCharacters.length;
const cssProvider = new Gtk.CssProvider();
const buttons = [];

export function fetchTile(x, y) {
    return buttons[x][y];
}

class GameBoard {
    constructor(buttonGrid) {
        this.initButtons(buttonGrid);
        this.initPieces();
    }

    /**
     * Initializes the buttons for the button grid.
     *
     * @param {Grid} buttonGrid - The grid where the buttons will be attached.
     */
    initButtons(buttonGrid) {
        for (let x = 0; x < numSize; x++) {
            const row = [];
            for (let y = 0; y < numSize; y++) {
                const button = new Gtk.Button();
                const context = button.get_style_context();
                context.add_class((y % 2 === x % 2) ? 'white-button' : 'black-button');
                context.add_provider(cssProvider, Gtk.STYLE_PROVIDER_PRIORITY_USER);
                buttonGrid.attach(button, x, y, 1, 1);
                button.connect('clicked', () => {
                    positionCallback.handleChessPiece(x, y);
                });
                row.push(button);
            }
            buttons.push(row);
        }
    }
    /**
     * Initializes the pieces on the chess board.
     *
     * This function iterates over the chess board and creates new instances of the
     * appropriate chess pieces based on the values in the chess board array. It
     * uses a switch statement to determine the type of each piece and calls the
     * corresponding constructor to create a new instance of that piece.
     *
     * @param {none} - This function does not take any parameters.
     * @return {none} - This function does not return a value.
     */
    initPieces() {
        for (let y = 0; y < chessBoard.length; y++) {
            for (let x = 0; x < chessBoard[y].length; x++) {
                const piece = chessBoard[y][x];
                if (piece !== null) {
                    switch (piece.toLowerCase()) {
                        case 'p':
                            new pawn(piece, x, y);
                            break;
                        case 'r':
                            new rook(piece, x, y);
                            break;
                        case 'n':
                            new knight(piece, x, y);
                            break;
                        case 'b':
                            new bishop(piece, x, y);
                            break;
                        case 'k':
                            new king(piece, x, y);
                            break;
                        case 'q':
                            new queen(piece, x, y);
                            break;
                    }
                }
            }
        }
    }
}


export default GameBoard;