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

export let chessBoard = [
    ["r", "p", null, null, null, null, "P", "R"],
    ["n", "p", null, null, null, null, "P", "N"],
    ["b", "p", null, null, null, null, "P", "B"],
    ["q", "p", null, null, null, null, null, "Q"],
    ["k", "p", null, null, "b", "b", "K", null],
    ["b", "p", null, null, null, "b", null, "B"],
    ['n', "p", null, null, null, null, null, "N"],
    ["r", "p", null, null, null, null, "P", "R"]
];

const validPieceCharacters = ["a", "b", "c", "d", "e", "f", "g", "h"];
const numSize = validPieceCharacters.length;
const cssProvider = new Gtk.CssProvider();
const buttons = [];


export function printGameBoard() {
    for (let y = 0; y < 8; y++) {
      let rowString = '';
      for (let x = 0; x < 8; x++) {
        const piece = chessBoard[x][y];
        const symbol = piece !== null ? piece : ' ';
        rowString += ' ' + symbol + ' ';
      }
      console.log(rowString);
    }
  }

export function updateChessBoard(row, cell, piece) {
    delete chessBoard[row][cell];
    chessBoard[row][cell] = piece;
}

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
        for (let x = 0; x < chessBoard.length; x++) {
            for (let y = 0; y < chessBoard[x].length; y++) {
                const piece = chessBoard[x][y];
                createPiece(piece, x, y);
            }
        }
    }
}

export function createPiece(piece, x, y) {
    if (piece !== null) {
        switch (piece.toLowerCase()) {
            case 'p':
                return new pawn(piece, x, y);
            case 'r':
                return new rook(piece, x, y);
            case 'n':
                return new knight(piece, x, y);
            case 'b':
                return new bishop(piece, x, y);
            case 'k':
                return new king(piece, x, y);
            case 'q':
                return new queen(piece, x, y);
        }
    } else {
        return null;
    }
}


export default GameBoard;
