export type Coordinate = {
    x: number;
    y: number;
};

export type Turn = {
    turnNumber: number;
    first: Coordinate;
    second?: Coordinate;
    threatsCount?: number;
};

export type TimeControl =
    | {
          mode: `match`;
          initialTime: number;
          increment: number;
      }
    | {
          mode: `turn`;
          timePerTurn: number;
      }
    | {
          mode: `unlimited`;
      };

export const RESULTS = [`1-0`, `0-1`, `1/2-1/2`, `*`] as const;
export const ENDING_CONDITIONS = [`win`, `time`, `resign`, `agreed-draw`] as const;

export type Result = (typeof RESULTS)[number];
export type EndingCondition = (typeof ENDING_CONDITIONS)[number];

export type Metadata = {
    matchName?: string;
    player1Name?: string;
    player2Name?: string;
    unixTimestamp?: number;
    timeControl?: TimeControl;
    result?: Result;
    endingCondition?: EndingCondition;
};

export type HGN = {
    metadata: Metadata;
    turns: Turn[];
};

export const HGNKeysMap = {
    matchName: `name`,
    player1Name: `player1`,
    player2Name: `player2`,
    unixTimestamp: `utcdatetime`,
    timeControl: `timecontrol`,
    result: `result`,
    endingCondition: `endreason`,
} as const satisfies Record<keyof Metadata, string>;

export type HGNAllowedKeys = (typeof HGNKeysMap)[keyof typeof HGNKeysMap];
