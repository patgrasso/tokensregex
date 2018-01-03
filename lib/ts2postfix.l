%%
[ \t\n]+                    return "SP";
\/.*?\/                     yytext = yytext.slice(1, -1); return "REGEXP";
"["                         return "LBRAK";
"]"                         return "RBRAK";
"("                         return "LPAREN";
")"                         return "RPAREN";
":"                         return "COLON";
";"                         return "SEMICOLON";
"|"                         return "OR";
"&"                         return "AND";
"?"                         return "MAYBE";
"+"                         return "PLUS";
"*"                         return "KLEENE";
"{"                         return "LBRACE";
"}"                         return "RBRACE";
[^{}\[\]\(\): \t\|&\?\*\+]+ return "WORD";
%%
