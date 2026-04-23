import { SandboxGamePosition, SandboxPositionCell } from '@ih3t/shared';

import { HGNParser } from './HGNParser.ts';
import { HGNWriter } from './HGNWriter.ts';
import { Coordinate, HGN, Turn } from './types.ts';

export function hgnToGame(hgn: HGN): { name: string; gamePosition: SandboxGamePosition } {
    const name = hgn.metadata?.matchName ?? `unnamed`;

    const playerSlotFromTurnNumber = (turnNumber: number) =>
        turnNumber % 2 == 0 ? `player-1` : `player-2`;

    const cells: SandboxPositionCell[] = [];

    for (const turn of hgn.turns) {
        const appendCell = (coord: Coordinate, id: number, turnNumber: number) => {
            cells.push({
                x: coord.x,
                y: coord.y,
                player: playerSlotFromTurnNumber(turnNumber),
                moveId: id,
            });
        };

        appendCell(turn.first, turn.turnNumber === 0 ? 1 : turn.turnNumber * 2, turn.turnNumber);
        if (turn.second) appendCell(turn.second, turn.turnNumber * 2 + 1, turn.turnNumber);
    }

    const lastTurn = hgn.turns.at(-1);
    const lastTurnNumber = lastTurn?.turnNumber ?? 0;
    const lastTurnFinished = lastTurn?.second !== undefined;
    const currentTurnPlayer = playerSlotFromTurnNumber(lastTurnNumber + (lastTurnFinished ? 1 : 0));

    const gamePosition: SandboxGamePosition = {
        cells,
        currentTurnPlayer,
        placementsRemaining: lastTurnFinished ? 2 : 1,
    };

    return { name, gamePosition };
}

export function hgnStringToGame(hgnString: string): {
    name: string;
    gamePosition: SandboxGamePosition;
} {
    const hgnParser = new HGNParser(hgnString);
    const hgn = hgnParser.parse();
    return hgnToGame(hgn);
}

export function gameToHGN(name: string, gamePosition: SandboxGamePosition): HGN {
    const turns: Turn[] = [];

    if (gamePosition.cells.length > 0) {
        const firstCell = gamePosition.cells[0];
        turns.push({
            turnNumber: 0,
            first: { x: firstCell.x, y: firstCell.y },
        });
    }

    for (let i = 1; i < gamePosition.cells.length; i += 2) {
        const turnNumber = Math.floor(i / 2) + 1;

        const firstCell = gamePosition.cells[i];
        const secondCell = gamePosition.cells[i + 1];

        turns.push({
            turnNumber,
            first: { x: firstCell.x, y: firstCell.y },
            second: secondCell ? { x: secondCell.x, y: secondCell.y } : undefined,
        });
    }

    return {
        metadata: { matchName: name },
        turns,
    };
}

export function gameToHGNString(name: string, gamePosition: SandboxGamePosition): string {
    const hgn = gameToHGN(name, gamePosition);
    const hgnWriter = new HGNWriter(hgn);
    return hgnWriter.write();
}
