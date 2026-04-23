import {
    Coordinate,
    ENDING_CONDITIONS,
    EndingCondition,
    HGN,
    HGNAllowedKeys,
    Result,
    RESULTS,
    TimeControl,
} from './types.ts';

export class HGNParsingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = `HGNParsingError`;
    }
}

export class HGNParser {
    private readonly str: string;
    private currIndex = 0;
    private hgn: HGN = {
        metadata: {},
        turns: [],
    };

    public constructor(str: string) {
        this.str = str;
    }

    private get char(): string {
        return this.str[this.currIndex];
    }

    public parse(): HGN {
        this.parseMetadata();
        this.parseTurns();
        return this.hgn;
    }

    private advance(expectedChar?: string): string {
        const prevChar = this.char;
        if (expectedChar !== undefined && prevChar != expectedChar) {
            throw new HGNParsingError(
                `Invalid HGN: expected '${expectedChar}', got '${prevChar ? prevChar : `end of string`}'`
            );
        }
        this.currIndex++;
        return prevChar;
    }

    private advanceIf(char: string): boolean {
        if (this.char === char) {
            this.currIndex++;
            return true;
        }
        return false;
    }

    private readWhile(predicate: (char: string) => boolean): string {
        const startIdx = this.currIndex;

        while (this.char !== undefined && predicate(this.char)) {
            this.currIndex++;
        }

        return this.str.slice(startIdx, this.currIndex);
    }

    private readUntil(delimiters: string[], forbiddenCharacters?: string[]): string {
        return this.readWhile((char: string): boolean => {
            if (forbiddenCharacters?.includes(char)) {
                throw new HGNParsingError(
                    `Invalid HGN: unexpected character '${this.char}' at position ${this.currIndex}`
                );
            }
            return !delimiters.includes(char);
        });
    }

    private skipWhitespace() {
        this.readWhile((char) => /\s/.test(char));
    }

    private parseInt10(str: string, errorLocation: string) {
        const val = parseInt(str, 10);
        if (Number.isNaN(val)) {
            throw new HGNParsingError(
                `Invalid HGN: ${errorLocation} should be an integer, got '${str}'`
            );
        }
        return val;
    }

    private parseMetadata() {
        const metadata = this.hgn.metadata;

        this.skipWhitespace();

        while (this.advanceIf(`[`)) {
            const rawKey = this.readUntil([`"`]).trim();
            this.advance();
            const key = rawKey as HGNAllowedKeys;

            const value = this.readUntil([`"`]);
            this.advance();
            this.skipWhitespace();
            this.advance(`]`);

            switch (key) {
                case `name`:
                    metadata.matchName = value;
                    break;
                case `player1`:
                    metadata.player1Name = value;
                    break;
                case `player2`:
                    metadata.player2Name = value;
                    break;
                case `utcdatetime`:
                    metadata.unixTimestamp = this.parseDateTime(value);
                    break;
                case `timecontrol`:
                    metadata.timeControl = this.parseTimeControl(value);
                    break;
                case `result`:
                    metadata.result = this.parseResult(value);
                    break;
                case `endreason`:
                    metadata.endingCondition = this.parseEndingCondition(value);
                    break;
                default: {
                    key satisfies never;
                    throw new HGNParsingError(`Invalid HGN: unexpected metadata key '${rawKey}'`);
                }
            }

            this.skipWhitespace();
        }
    }

    private parseDateTime(value: string): number {
        const timestamp = Date.parse(value);
        if (isNaN(timestamp)) {
            throw new HGNParsingError(`Invalid HGN: invalid date-time '${value}'`);
        }
        return timestamp;
    }

    private parseTimeControl(value: string): TimeControl {
        const times = value.split(`+`);

        const parseTerm = (str: string): number => this.parseInt10(str, `time control value`);

        if (times.length == 1) {
            const timePerTurn = parseTerm(times[0]);
            if (timePerTurn === 0) {
                return { mode: `unlimited` };
            } else {
                return {
                    mode: `turn`,
                    timePerTurn,
                };
            }
        } else if (times.length == 2) {
            const initialTime = parseTerm(times[0]);
            const increment = parseTerm(times[1]);
            return {
                mode: `match`,
                initialTime,
                increment,
            };
        } else {
            throw new HGNParsingError(`Invalid HGN: time control should have at most 2 values`);
        }
    }

    private parseEndingCondition(value: string): EndingCondition {
        const isValidEndingCondition = (value: string): value is EndingCondition => {
            return (ENDING_CONDITIONS as readonly string[]).includes(value);
        };

        if (!isValidEndingCondition(value)) {
            throw new HGNParsingError(`Invalid HGN: invalid end reason '${value}'`);
        }
        return value;
    }

    private parseResult(value: string): Result {
        const isValidResult = (value: string): value is Result => {
            return (RESULTS as readonly string[]).includes(value);
        };

        if (!isValidResult(value)) {
            throw new HGNParsingError(`Invalid HGN: invalid result '${value}'`);
        }
        return value;
    }

    private parseTurns() {
        for (let i = 0; this.char !== undefined; i++) {
            const turnNumberStr = this.readUntil([`.`], [`;`]);
            const turnNumber = this.parseInt10(turnNumberStr, `turn number`);

            if (turnNumber !== i) {
                throw new HGNParsingError(
                    `Invalid HGN: expected turn number ${i}, got ${turnNumber}`
                );
            }

            this.advance();

            const first = this.parseCoordinate();
            const second = this.parseCoordinate(true) ?? undefined;

            const threatsCount = second ? this.parseThreatsCount() : undefined;

            this.hgn.turns.push({
                turnNumber,
                first,
                second,
                threatsCount,
            });
        }
    }

    private parseCoordinate(maybeNone: true): Coordinate | null;
    private parseCoordinate(maybeNone?: false): Coordinate;

    private parseCoordinate(maybeNone = false): Coordinate | null {
        this.skipWhitespace();

        if (maybeNone) {
            if (!this.advanceIf(`(`)) return null;
        } else {
            this.advance(`(`);
        }

        const parseTerm = (delimiter: string): number => {
            const str = this.readUntil([delimiter]);
            const val = this.parseInt10(str, `coordinate component`);
            this.advance(delimiter);
            return val;
        };
        const x = parseTerm(`,`);
        const y = parseTerm(`)`);

        return { x, y };
    }

    private parseThreatsCount(): number {
        this.skipWhitespace();

        let counter = 0;
        while (this.advanceIf(`!`)) {
            counter++;
            this.skipWhitespace();
        }

        return counter;
    }
}
