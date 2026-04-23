<!-- 
MIT License

Copyright (c) 2026 hex-tic-tac-toe

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
-->

# HeXO Game Notation (HGN)

## Grammar

```bnf
<game>        ::=  <metadata>? <turns>?

<metadata>    ::= <data>+
<data>        ::= '[' <key> '"' <value> '"' ']'  // defined below in `Metadata Attributes`

<turns>       ::= <partial_turn> <turn>* <partial_turn>?
<partial_turn> ::= <turn_number> <coordinate>
<turn>        ::= <turn_number> <coordinate> <coordinate> <amount_of_threats>?
<turn_number> ::= <nonnegative_integer> '.' // starts with 0 and increments by 1 for each turn / partial turn.
<coordinate>  ::= '(' <integer> ',' <integer> ')'
<amount_of_threats> ::= '!'* // each '!' represents a threat (optional).

<integer>     ::= <sign> <nonnegative_integer>
<sign>        ::= '-'?
<nonnegative_integer> ::= [0-9]+
<positive_integer> ::= [1-9][0-9]*
```

## Metadata Attributes

All attributes are optional.

| Key           | Description               | Value                           |
|---------------|---------------------------|---------------------------------|
| `name`        | Display name of the match | string                          |
| `player1`     | Name of the first player  | string                          |
| `player2`     | Name of the second player | string                          |
| `utcdatetime` | Game start time in UTC    | ISO 8601: `YYYY-MM-DD HH:MM:SS` |
| `timecontrol` | Time control format       | `<timecontrol>`                 |
| `result`      | Game result               | `<result>`                      |
| `endreason`   | How the game ended        | `<endreason>`                   |

```bnf
<timecontrol> ::= <match_time> | <turn_time> | <unlimited_time>
<match_time> ::= <positive_integer> '+' <nonnegative_integer> // Base time (minutes) + increment (seconds)
<turn_time>   ::= <positive_integer>  // Time limit per turn (seconds)
<unlimited_time> ::= '0' // No time limit

<result>      ::= '1-0' // Player 1 wins
                | '0-1' // Player 2 wins
                | '1/2-1/2' // Draw
                | '*' // Unfinished or unknown result
<endreason>   ::= 'win' | 'time' | 'resign' | 'agreed-draw'
```

## Turns

The first partial turn is always made by `player1` and is located at `(0, 0)`. All following turns are relative to the
move. Move coordinates must follow
the [axial coordinate system](https://www.redblobgames.com/grids/hexagons/#:~:text=Axial%20coordinates) and be written
as: `(q, r)`.

## Example

```
[name "Hexagon Idk"]
[player1 "Grey Fox"]
[player2 "Orange Whale"]
[utcdatetime "2026-04-23 11:23:14"]
[timecontrol "5+2"]
[result "1/2-1/2"]
[endreason "agreed-draw"]

 0. (0,0)
 1. (-1,0)(0,1)
 2. (-1,1)(-2,2)
 3. (1,-1)(-5,5)
 4. (-1,2)(1,0)
 5. (5,0)(-3,2)
```
