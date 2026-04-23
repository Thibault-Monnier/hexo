import { HGN, HGNKeysMap,Metadata } from './types.ts';

export class HGNWriter {
    private readonly hgn: HGN;

    private lines: string[] = [];

    public constructor(hgn: HGN) {
        this.hgn = hgn;
    }

    public write(): string {
        this.writeMetadata();
        this.writeTurns();

        return this.lines.join(`\n`);
    }

    private writeMetadata() {
        if (this.hgn.metadata === undefined) {
            return;
        }

        const keys = Object.keys(this.hgn.metadata) as (keyof Metadata)[];
        for (const key of keys) {
            const value = this.hgn.metadata[key];
            if (value == null) continue;

            let valueStr: string;

            if (key === `timeControl`) {
                const value = this.hgn.metadata.timeControl!;
                switch (value.mode) {
                    case `match`:
                        valueStr = `${value.initialTime}+${value.increment}`;
                        break;
                    case `turn`:
                        valueStr = `${value.timePerTurn}`;
                        break;
                    case `unlimited`:
                        valueStr = `0`;
                        break;
                }
            } else if (key === `unixTimestamp`) {
                const date = new Date(this.hgn.metadata.unixTimestamp!);
                // Format as "YYYY-MM-DD HH:MM:SS"
                valueStr = date.toISOString().replace(`T`, ` `).substring(0, 19);
            } else {
                valueStr = this.hgn.metadata[key]!;
            }

            this.lines.push(this.formatMetadataAttribute(HGNKeysMap[key], valueStr));
        }

        this.lines.push(``);
    }

    private formatMetadataAttribute(key: string, value: string): string {
        return `[${key} "${value}"]`;
    }

    private writeTurns() {
        for (const turn of this.hgn.turns) {
            const turnNumber = turn.turnNumber;
            const first = this.formatCoordinate(turn.first);

            if (turn.second) {
                const second = this.formatCoordinate(turn.second);
                const threatsIndicator = `!`.repeat(turn.threatsCount ?? 0);
                this.lines.push(` ${turnNumber}. ${first} ${second} ${threatsIndicator}`);
            } else {
                this.lines.push(` ${turnNumber}. ${first}`);
            }
        }
    }

    private formatCoordinate(coordinate: { x: number; y: number }): string {
        return `(${coordinate.x}, ${coordinate.y})`;
    }
}
