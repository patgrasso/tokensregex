%token REGEXP LBRACE RBRACE LPAREN RPAREN LBRAK RBRAK COLON WORD OR AND
%token MAYBE KLEENE PLUS SP SEMICOLON

%%
regex     : exp                     { return $1; } ;

exp       : exp sp maybe            { $$=[].concat($1, $3, [["."]]); }
          | maybe                   { $$=$1; }
          ;

maybe     : quant MAYBE             { $$=[].concat($1, [["?"]]); }
          | quant                   { $$=$1; }
          ;

quant     : atom KLEENE             { $$=[].concat($1, [["*"]]); }
          | atom PLUS               { $$=[].concat($1, [["+"]]); }
          | atom                    { $$=$1; }
          ;
                                        /*maybe illegal*/
oneof     : oneof sp atom           { $$=[].concat($1, $3, [["|"]]); }
          | oneof binop atom        { $$=[].concat($1, $3, $2); }
          | atom                    { $$=$1; }
          ;

binop     : sp OR sp                { $$=[["|"]]; }
          | sp AND sp               { $$=[["&"]]; }
          ;

atom      : LPAREN sp exp sp RPAREN { $$=$3; }
          | LBRAK sp oneof sp RBRAK { $$=$3; }
          | LBRACE sp atr sp RBRACE { $$=$3; }
          | REGEXP                  { $$=[[ "REGEXP" , new RegExp($1) ]]; }
          | WORD                    { $$=[[ "WORD"   , $1 ]]; }
          ;

atr       : atr SEMICOLON prop      { $$=[].concat($1, $3, [["&"]]); }
          | prop                    { $$=$1; }
          ;

prop      : WORD sp COLON sp REGEXP { $$=[[ "ATTR", $1, new RegExp($5) ]]; }
          | WORD sp COLON sp WORD   { $$=[[ "ATTR", $1, $5 ]]; }
          ;


sp        : SP | ;
%%
