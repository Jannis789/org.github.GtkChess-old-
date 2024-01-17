export let isWhitesTurn = true;
export let rochadeTriggeredLeft = [];
export let rochadeTriggeredRight = [];
let previousMoves = [];
let previousPiece = [];

import { 
    pieces
} from './pieces.js';

import {
    kings,
    fetchTile
} from './game-board.js';

export function getPiece(x, y) {
    return pieces[x]?.[y];
}

export function definePiece(object, x, y) {
    pieces[x] = pieces[x] || [];
    pieces[x][y] = object;
}

export function deletePiece(x, y) {
    const deleteElement = pieces[x]?.[y];
    delete pieces[x]?.[y];
    return deleteElement;
}

export function movesWhichWontLeadToCheck(x, y) {
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

export function getPossibleMoves(isWhitePiece, x, y, movementPattern) {
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

export function selectPossibleMoves(possiblePositions) {
    for (const [x, y] of possiblePositions) {
        const buttonContext = fetchTile(x, y).get_style_context();
        buttonContext.add_class('possible-position');
    }
}

export function unselectMoves(previousPosition) {
    for (const [x, y] of previousPosition) {
        const buttonContext = fetchTile(x, y).get_style_context();
        buttonContext.remove_class('possible-position');
    }
}

export function performRochade(x,y) {
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

export function performMove(x, y) {
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
