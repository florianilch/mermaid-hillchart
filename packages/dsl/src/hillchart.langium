grammar HillChartGrammar

entry HillChartDiagram:
    NEWLINE*
    'hillchart' NEWLINE*
    (
        ((accDescr=ACC_DESCR | accTitle=ACC_TITLE | title=TITLE) EOL)+
        | scopes+=ScopeStatement
        | phaseUphill=UphillStatement
        | phaseDownhill=DownhillStatement
        | NEWLINE
    )*;

interface PhaseStatement {
    phase: string
    label: string
}

ScopeStatement:
    'scope' (id=ID)? name=(STRING | ID) ':'?
    phase=PhaseKeyword position=NUMBER
    (color=HEX_COLOR)?
    EOL;

UphillStatement returns PhaseStatement:
    phase=('uphill') label=(STRING | ID) EOL;
DownhillStatement returns PhaseStatement:
    phase=('downhill') label=(STRING | ID) EOL;

PhaseKeyword returns string:
    'uphill' | 'downhill';

EOL returns string: NEWLINE+ | EOF;


// Terminals

// Accessibility properties for screen readers
terminal ACC_DESCR: /[\t ]*accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/;
terminal ACC_TITLE: /[\t ]*accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/;

terminal TITLE: /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/;

// Numeric values: supports both floats (45.5) and integers (45)
terminal FLOAT returns number: /[0-9]+\.[0-9]+(?!\.)/;
terminal INT returns number: /0|[1-9][0-9]*(?!\.)/;
terminal NUMBER returns number: FLOAT | INT;

// String: quoted text for names/labels with spaces
terminal STRING returns string: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/;

// ID: alphanumeric identifier for technical references (no spaces)
terminal ID returns string: /[\w]([-\w]*\w)?/;

// Hex color: supports #RRGGBBAA, #RRGGBB, #RGBA, #RGB formats
terminal HEX_COLOR: /#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})/;

terminal NEWLINE: /\r?\n/;

// Hidden terminals are consumed but not represented in the AST
hidden terminal WHITESPACE: /[\t ]+/;
hidden terminal YAML: /---[\t ]*\r?\n(?:[\S\s]*?\r?\n)?---(?:\r?\n|(?!\S))/;
hidden terminal DIRECTIVE: /[\t ]*%%{[\S\s]*?}%%(?:\r?\n|(?!\S))/;
hidden terminal SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*/;
