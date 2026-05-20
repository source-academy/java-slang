/*
  Productions from §3 (Lexical Structure)
*/
LineTerminator
  = "\r\n"
  / [\r\n] 

Whitespace
  = [ \t\f]
  / LineTerminator

Comment
  = "/*" (!"*/" .)* "*/"
  / "//" (!LineTerminator .)* LineTerminator

// We for now restrict identifier to have only alphanumeric characters.
Identifier
  = !Keyword !BooleanLiteral !NullLiteral @$(Letter LetterOrDigit*) _

Letter = [a-zA-Z]

LetterOrDigit = [a-zA-Z0-9]

TypeIdentifier
  = !permits !record !sealed !var !yield @Identifier

UnqualifiedMethodIdentifier
  = !yield @Identifier

Literal
  = l:(
      FloatingPointLiteral
    / IntegerLiteral
    / BooleanLiteral
    / CharacterLiteral
    / TextBlock
    / StringLiteral
    / NullLiteral
  ) _ {
    return addLocInfo({
      kind: "Literal",
      literalType: l,
    })
  }

IntegerLiteral
  = pre:[+\-]? val:(HexNumeral / BinaryNumeral / OctalNumeral / DecimalNumeral) tail:[lL]? {
    val.value = (pre ?? "") + val.value + (tail ?? "");
    return val;
  }

HexNumeral = ('0x' / '0X') HexDigits

BinaryNumeral = ('0b' / '0B') [01] ([_]* [01])*

OctalNumeral = '0' ([_]* [0-7])+

DecimalNumeral 
  = value:$('0' / [1-9] ([_]* [0-9])*) {
    return {
      kind: "DecimalIntegerLiteral",
      value: value,
    }
  }

FloatingPointLiteral 
  = pre:[+\-]? val:(HexadecimalFloatingPointLiteral / DecimalFloatingPointLiteral) {
    val.value = (pre ?? "") + val.value;
    return val;
  }

DecimalFloatingPointLiteral
   = value:
   $(Digits '.' Digits?  ExponentPart? [fFdD]?
    / '.' Digits ExponentPart? [fFdD]?
    / Digits ExponentPart [fFdD]?
    / Digits ExponentPart? [fFdD]) {
      return {
        kind: "DecimalFloatingPointLiteral",
        value: value,
      }
    }

ExponentPart = [eE] [+\-]? Digits

HexadecimalFloatingPointLiteral = HexSignificand BinaryExponentPart [fFdD]?

HexSignificand
   = ('0x' / '0X') HexDigits? '.' HexDigits
    / HexNumeral '.'?

BinaryExponentPart = [pP] [+\-]? Digits

Digits = [0-9] ([_]* [0-9])*

HexDigits = HexDigit ([_]*HexDigit)*

HexDigit = [a-fA-F0-9]

BooleanLiteral
  = value:("true" / "false") {
    return {
      kind: "BooleanLiteral",
      value: value,
    }
  }

CharacterLiteral 
  = ['] char:(@EscapeSequence / !['\\] @.) ['] {
    return {
      kind: "CharacterLiteral",
      value: char,
    }
  }

StringLiteral 
  = '\"' chars:(@EscapeSequence / !["\\\r\n] @.)* '\"' {
    return {
      kind: "StringLiteral",
      value: '\"' + chars.join("") + '\"',
    }
  }

TextBlock
  = "\"\"\"" ([ \t\f])* LineTerminator (EscapeSequence / LineTerminator / ![\\\r\n] .)* "\"\"\""

EscapeSequence = '\\' s:(
    'b' { return String.fromCharCode(parseInt('0x0008',16)) }
  / 's' { return String.fromCharCode(parseInt('0x0020',16)) }
  / 't' { return String.fromCharCode(parseInt('0x0009',16)) }
  / 'n' { return String.fromCharCode(parseInt('0x000a',16)) }
  / 'f' { return String.fromCharCode(parseInt('0x000c',16)) }
  / 'r' { return String.fromCharCode(parseInt('0x000d',16)) }
  / '\"' { return String.fromCharCode(parseInt('0x0022',16)) }
  / '\'' { return String.fromCharCode(parseInt('0x0027',16)) }
  / '\\' { return String.fromCharCode(parseInt('0x005c',16)) }
  / OctalEscape
  / UnicodeEscape 
  / LineTerminator) {
    return s;
  }

OctalEscape
   = [0-3][0-7][0-7]
    / [0-7][0-7]
    / [0-7]

UnicodeEscape
   = 'u'+ HexDigit HexDigit HexDigit HexDigit

NullLiteral
  = "null" {
    return {
      kind: "NullLiteral",
      value: "null",
    }
  }

_ 
  = (Whitespace / Comment)*

// ReservedKeyword
abstract = @"abstract" !LetterOrDigit _
assert = @"assert" !LetterOrDigit _
boolean = @"boolean" !LetterOrDigit _
break = @"break" !LetterOrDigit _
byte = @"byte" !LetterOrDigit _
case = @"case" !LetterOrDigit _
catch = @"catch" !LetterOrDigit _
char = @"char" !LetterOrDigit _
class = @"class" !LetterOrDigit _
const = @"const" !LetterOrDigit _
continue = @"continue" !LetterOrDigit _
default = @"default" !LetterOrDigit _
do = @"do" !LetterOrDigit _
double = @"double" !LetterOrDigit _
else = @"else" !LetterOrDigit _
enum = @"enum" !LetterOrDigit _
extends = @"extends" !LetterOrDigit _
final = @"final" !LetterOrDigit _
finally = @"finally" !LetterOrDigit _
float = @"float" !LetterOrDigit _
for = @"for" !LetterOrDigit _
if = @"if" !LetterOrDigit _
goto = @"goto" !LetterOrDigit _
implements = @"implements" !LetterOrDigit _
import = @"import" !LetterOrDigit _
instanceof = @"instanceof" !LetterOrDigit _
int = @"int" !LetterOrDigit _
interface = @"interface" !LetterOrDigit _
long = @"long" !LetterOrDigit _
native = @"native" !LetterOrDigit _
new = @"new" !LetterOrDigit _
package = @"package" !LetterOrDigit _
private = @"private" !LetterOrDigit _
protected = @"protected" !LetterOrDigit _
public = @"public" !LetterOrDigit _
return = @"return" !LetterOrDigit _
short = @"short" !LetterOrDigit _
static = @"static" !LetterOrDigit _
strictfp = @"strictfp" !LetterOrDigit _
super = @"super" !LetterOrDigit _
switch = @"switch" !LetterOrDigit _
synchronized = @"synchronized" !LetterOrDigit _
this = @"this" !LetterOrDigit _
throw = @"throw" !LetterOrDigit _
throws = @"throws" !LetterOrDigit _
transient = @"transient" !LetterOrDigit _
try = @"try" !LetterOrDigit _
void = @"void" !LetterOrDigit _
volatile = @"volatile" !LetterOrDigit _
while = @"while" !LetterOrDigit _
underscore = @"_" !LetterOrDigit _

// ContextualKeyword
exports = @"exports" !LetterOrDigit _
module = @"module" !LetterOrDigit _
non_sealed = @"non-sealed" !LetterOrDigit _
open = @"open" !LetterOrDigit _
opens = @"opens" !LetterOrDigit _
permits = @"permits" !LetterOrDigit _
provides = @"provides" !LetterOrDigit _
record = @"record" !LetterOrDigit _
requires = @"requires" !LetterOrDigit _
sealed = @"sealed" !LetterOrDigit _
to = @"to" !LetterOrDigit _
transitive = @"transitive" !LetterOrDigit _
uses = @"uses" !LetterOrDigit _
var = @"var" !LetterOrDigit _
with = @"with" !LetterOrDigit _
yield = @"yield" !LetterOrDigit _

Keyword
  = abstract 
  / assert 
  / boolean 
  / break 
  / byte 
  / case 
  / catch 
  / char 
  / class 
  / const 
  / continue 
  / default 
  / do 
  / double 
  / else 
  / enum 
  / extends 
  / final 
  / finally 
  / float 
  / for 
  / if 
  / goto 
  / implements 
  / import 
  / instanceof 
  / int 
  / interface 
  / long 
  / native 
  / new 
  / package 
  / private 
  / protected 
  / public 
  / return 
  / short 
  / static 
  / strictfp 
  / super 
  / switch 
  / synchronized 
  / this 
  / throw 
  / throws 
  / transient 
  / try 
  / void 
  / volatile 
  / while 
  / underscore 
  / exports 
  / module 
  / non_sealed
  / open 
  / opens 
  / permits 
  / provides 
  / record 
  / requires 
  / sealed 
  / to 
  / transitive 
  / uses 
  / var 
  / with
  / yield

// Separators
lparen = @'(' _
rparen = @')' _
lcurly = @'{' _
rcurly = @'}' _
lsquare = @'[' _
rsquare = @']' _
semicolon = @';' _
comma = @',' _
dot = @'.' ![.] _
ellipsis = @'...' _
at = @'@' _
coloncolon = @'::' _

// Operators
assign = @'=' !'=' _
equal = @'==' _
gt = @'>' ![=>] _
geq = @'>=' _
lt = @'<' ![=<] _
leq = @'<=' _
not = @'!' !'=' _
noteq = @'!=' _
andand = @'&&' _
oror = @'||' _
tilde = @'~' _
questionmark = @'?' _
colon = @':' !':' _
arrow = @'->' _
increment = @'++' _
decrement = @'--' _
plus = @'+' ![=+] _
pluseq = @'+=' _
minus = @'-' ![=\-] _
minuseq = @'-=' _
mul = @'*' !'=' _
muleq = @'*=' _
div = @'/' !'=' _
diveq = @'/=' _
and = @'&' ![=&] _
andeq = @'&=' _
or = @'|' ![=|] _
oreq = @'|=' _
xor = @'^' !'=' _
xoreq = @'^=' _
mod = @'%' !'=' _
modeq = @'%=' _
lshift = @'<<' !'=' _
lshifteq = @'<<=' _
rshift = @'>>' ![=>] _
rshifteq = @'>>=' _
urshift = @'>>>' !'=' _
urshifteq = @'>>>=' _



/*
  Productions from §4 (Types, Values, and Variables)
*/
Type
  = ReferenceType
  / PrimitiveType

PrimitiveType
  = byte
  / short
  / int
  / long
  / char
  / float
  / double
  / boolean

ReferenceType
  = t:(PrimitiveType / ClassType) d:Dims* {
    return t + d;
  }

ClassType
  = head:(pn:(PackageName dot Annotation*)? id:TypeIdentifier TypeArguments?
      { return (pn ?? "") + id; })
    tail:(dot Annotation* @TypeIdentifier TypeArguments?)* {
      return head + tail.join();
    }

Dims
  = Annotation* lsquare rsquare d:(Dims)* {
    return "[]" + d.join();
  }

TypeArguments
  = lt TypeArgumentList gt

TypeArgumentList
  = TypeArgument (comma TypeArgument)*

TypeArgument
  = ReferenceType
  / Wildcard

Wildcard
  = Annotation* questionmark ((extends / super) ReferenceType)?



/*
  Productions from §6 (Names)
*/
ModuleName
  = Name

PackageName
  = Name

TypeName
  = Name

ExpressionName
  = t:(this dot)? n:Name {
    return addLocInfo({
      kind: "ExpressionName",
      name: (t ? "this." : "") + n,
    })
  }

MethodName
  = UnqualifiedMethodIdentifier

PackageOrTypeName
  = Name

AmbiguousName
  = Name

Name
  = id:Identifier ids:(dot i:Identifier {return "." + i;})* {
    return [id, ...ids].join("");
  }



/*
  Productions from §7 (Packages and Modules)
*/
CompilationUnit
  = _ @OrdinaryCompilationUnit

OrdinaryCompilationUnit
  = PackageDeclaration? ids:ImportDeclaration* tld:TopLevelClassOrInterfaceDeclaration* {
    return addLocInfo({
      kind: "CompilationUnit",
      importDeclarations: ids,
      topLevelClassOrInterfaceDeclarations: tld,
    })
  }

PackageDeclaration
  = TO_BE_ADDED

ImportDeclaration
  = i:(SingleTypeImportDeclaration
  / TypeImportOnDemandDeclaration) {
    return {
      isStatic: false,
      identifier: i,
    }
  }

SingleTypeImportDeclaration
  = import @TypeName semicolon

TypeImportOnDemandDeclaration
  = import @$(PackageOrTypeName dot mul) semicolon

TopLevelClassOrInterfaceDeclaration
  = ClassDeclaration
  / InterfaceDeclaration
  / semicolon

InterfaceDeclaration
  = TO_BE_ADDED



/*
  Productions from §8 (Classes)
*/
ClassDeclaration
  = NormalClassDeclaration

NormalClassDeclaration
  = cm:ClassModifier* class tm:TypeIdentifier TypeParameters? ce:ClassExtends? ClassImplements? ClassPermits? cb:ClassBody {
    if (ce) {
      return addLocInfo({
        kind: "NormalClassDeclaration",
        classModifier: cm,
        typeIdentifier: tm,
        sclass: ce,
        classBody: cb,
      })
    } else {
      return addLocInfo({
        kind: "NormalClassDeclaration",
        classModifier: cm,
        typeIdentifier: tm,
        classBody: cb,
      })
    }
  }

ClassModifier
  = public
  / protected
  / private
  / abstract
  / static
  / final
  / sealed
  / non_sealed
  / strictfp

TypeParameters
  = TO_BE_ADDED

TypeParameterList
  = TO_BE_ADDED

ClassExtends
  = extends @ClassType

ClassImplements
  = TO_BE_ADDED

InterfaceTypeList
  = TO_BE_ADDED

ClassPermits
  = TO_BE_ADDED

ClassBody
  = lcurly @ClassBodyDeclaration* rcurly

ClassBodyDeclaration
  = ClassMemberDeclaration
  / ConstructorDeclaration
//  / InstanceInitializer
//  / StaticInitializer

ClassMemberDeclaration
  = FieldDeclaration
  / MethodDeclaration
  / ClassDeclaration
  / InterfaceDeclaration
  / semicolon

FieldDeclaration
  = fm:FieldModifier* ut:UnannType vdl:VariableDeclaratorList semicolon {
    return addLocInfo({
      kind: "FieldDeclaration",
      fieldModifier: fm,
      fieldType: ut,
      variableDeclaratorList: vdl,
    })
  }

FieldModifier
  = public
  / protected
  / private
  / static
  / final
  / transient
  / volatile

VariableDeclaratorList
  = vd:VariableDeclarator vds:(comma @VariableDeclarator)* {
    return [vd, ...vds];
  }

VariableDeclarator
  = vdid:VariableDeclaratorId vi:(assign @VariableInitializer)? {
    if (vi) { vdid.variableInitializer = vi;}
    return vdid;
  }

VariableDeclaratorId
  = id:Identifier Dims? {
    return {
      kind: "VariableDeclarator",
      variableDeclaratorId: id,
    }
  }

VariableInitializer
  = Expression
  / ArrayInitializer

UnannType
  = !Annotation @Type

MethodDeclaration
  = mm:MethodModifier* mh:MethodHeader mb:MethodBody {
    return addLocInfo({
      kind: "MethodDeclaration",
      methodModifier: mm,
      methodHeader: mh,
      methodBody: mb,
    })
  }

MethodModifier
  = public
  / protected
  / private
  / abstract
  / static
  / final
  / synchronized
  / native
  / strictfp

MethodHeader
  = r:Result id:Identifier lparen (ReceiverParameter comma)? fpl:FormalParameterList? rparen Throws? {
    return {
      kind: "MethodHeader",
      result: r,
      identifier: id,
      formalParameterList: fpl ?? [],
    }
  }

MethodBody
  = Block
  / semicolon { return []; }

Result
  = UnannType
  / void

ReceiverParameter
  = Annotation* UnannType (Identifier dot)? this

FormalParameterList
  = fp:FormalParameter fps:(comma @FormalParameter)* {
    return [fp, ...fps];
  }

FormalParameter
  = VariableModifier* ut:UnannType vdid:VariableDeclaratorId {
    return {
      kind: "FormalParameter",
      unannType: ut + (vdid.dims ?? ""),
      identifier: vdid.variableDeclaratorId,
    }
  }

VariableModifier
  = final

Throws
  = throw TO_BE_ADDED

ConstructorDeclaration
  = cm:ConstructorModifier* cd:ConstructorDeclarator Throws? cb:ConstructorBody {
    return addLocInfo({
      kind: "ConstructorDeclaration",
      constructorModifier: cm,
      constructorDeclarator: cd,
      constructorBody: cb,
    })
  }

ConstructorModifier
  = public
  / protected
  / private

ConstructorDeclarator
  = TypeParameters? id:TypeIdentifier lparen (ReceiverParameter comma)? fpl:FormalParameterList? rparen {
   return {
      identifier: id,
      formalParameterList: fpl ?? [],
    }
  }

ConstructorBody
  = lcurly eci:ExplicitConstructorInvocation? bs:(@BlockStatement*) rcurly {
    return addLocInfo({
      kind: "Block",
      blockStatements: eci === null ? bs : [eci, ...bs],
    })
  }

ExplicitConstructorInvocation
  = ((Primary / ExpressionName) dot)? TypeArguments? ts:(this / super) lparen al:ArgumentList? rparen semicolon {
    return addLocInfo({
      argumentList: al ?? [],
      kind: "ExplicitConstructorInvocation",
      thisOrSuper: ts,
    })
  }


/*
  Productions from §10 (Arrays)
*/
ArrayInitializer
  = lcurly rcurly {
    return [];
  }
  / lcurly @VariableInitializerList? comma? rcurly

VariableInitializerList
  = vi:VariableInitializer vis:(comma @VariableInitializer)* {
    return [vi, ...vis];
  }



/*
  Productions from §14 (Blocks, Statements, and Patterns)
*/
Block
  = lcurly bs:(@BlockStatement*) rcurly {
    return addLocInfo({
      kind: "Block",
      blockStatements: bs
    })
  }

BlockStatement
  = LocalClassOrInterfaceDeclaration
  / LocalVariableDeclarationStatement
  / Statement

LocalClassOrInterfaceDeclaration
  = ClassDeclaration

LocalVariableDeclarationStatement
  = @LocalVariableDeclaration semicolon

LocalVariableDeclaration
  = VariableModifier* ut:UnannType vdl:VariableDeclaratorList {
    return addLocInfo({
      kind: "LocalVariableDeclarationStatement",
      localVariableType: ut,
      variableDeclaratorList: vdl,
    })
  }

Statement
  = Block
  / EmptyStatement
  / AssertStatement
  / SwitchStatement
  / DoStatement
  / BreakStatement
  / ContinueStatement
  / YieldStatement
  / ReturnStatement
  / ThrowStatement
  / SynchronizedStatement
  / TryStatement
  / IfStatement
  / WhileStatement
  / ForStatement
  / ExpressionStatement

EmptyStatement
  = semicolon

AssertStatement
  = assert Expression (colon Expression) semicolon

SwitchStatement
  = switch lparen expr:Expression rparen lcurly
      cases:SwitchBlock?
    rcurly {
      return addLocInfo({
        kind: "SwitchStatement",
        expression: expr,
        cases: cases ?? [],
      });
    }

SwitchBlock
  = cases:SwitchBlockStatementGroup* {
      return cases;
    }

SwitchBlockStatementGroup
  = labels:SwitchLabel+ stmts:BlockStatement* {
      return {
        kind: "SwitchBlockStatementGroup",
        labels: labels,
        statements: stmts,
      };
    }

SwitchLabel
  = case expr:Expression colon {
      return {
        kind: "CaseLabel",
        expression: expr,
      };
    }
  / default colon {
      return {
        kind: "DefaultLabel",
      };
    }

DoStatement
  = do body:Statement while lparen expr:Expression rparen semicolon {
    return addLocInfo({
      kind: "DoStatement",
      condition: expr,
      body: body,
    })
  }

BreakStatement
  = break semicolon {
    return addLocInfo({
      kind: "BreakStatement",
    })
  }

ContinueStatement
  = continue semicolon {
    return addLocInfo({
      kind: "ContinueStatement",
    })
  }

YieldStatement
  = yield Expression semicolon

ReturnStatement
  = return expr:Expression? semicolon {
    if (!expr) {
      return addLocInfo({kind: "ReturnStatement"});
    }
    return addLocInfo({
      kind: "ReturnStatement",
      exp: expr,
    })
  }

ThrowStatement
  = throw Expression semicolon

SynchronizedStatement
  = synchronized lparen Expression rparen Block

TryStatement
  = TO_BE_ADDED

IfStatement
  = if lparen expr:Expression rparen c:Statement a:(else @Statement)? {
    return addLocInfo({
      kind: "IfStatement",
      condition: expr,
      consequent: c,
      alternate: a,
    })
  }

WhileStatement
  = while lparen expr:Expression rparen body:Statement {
    return addLocInfo({
      kind: "WhileStatement",
      condition: expr,
      body: body,
    })
  }

ForStatement
  = for lparen init:ForInit? semicolon cond:Expression? semicolon upd:ForUpdate? rparen body:Statement {
    return addLocInfo({
      kind: "BasicForStatement",
      forInit: init ?? [],
      condition: cond,
      forUpdate: upd ?? [],
      body: body,
    })
  }
  / for lparen LocalVariableDeclaration colon Expression rparen Statement

ForInit
  = LocalVariableDeclaration
  / StatementExpressionList

ForUpdate
  = StatementExpressionList

StatementExpressionList
  = head:StatementExpression tail:(comma @StatementExpression)* {
    return [head, ...tail].map(s => {
      return {
        kind: "ExpressionStatement", stmtExp: s
      }
    });
  }

ExpressionStatement
  = se:StatementExpression semicolon {
    return addLocInfo({
      kind: "ExpressionStatement",
      stmtExp: se,
    })
  }

StatementExpression
  = Assignment
  / ClassInstanceCreationExpression
  / &(increment / decrement) @UnaryExpression
  / !PlusMinus @UnaryExpression
  / MethodInvocation


/*
  Productions from §15 (Expressions)
*/
Primary
  = lparen @Expression rparen
  / ClassInstanceCreationExpression
  / MethodInvocation
  / ArrayAccess
  / Literal 

ClassInstanceCreationExpression
  = u:UnqualifiedClassInstanceCreationExpression {
    u.kind = "ClassInstanceCreationExpression";
    return u;
  }

UnqualifiedClassInstanceCreationExpression
  = new TypeArguments? c:ClassOrInterfaceTypeToInstantiate lparen al:ArgumentList? rparen ClassBody? {
    return addLocInfo({
      kind: "ClassInstanceCreationExpression",
      identifier: c.identifier,
      argumentList: al ?? [],
    })
  }

ClassOrInterfaceTypeToInstantiate
  = id:Name TypeArgumentsOrDiamond? {
    return addLocInfo({
      "kind": "ClassOrInterfaceTypeToInstantiate",
	    "identifier": id,
    })
  }

TypeArgumentsOrDiamond
  = lt gt
  / TypeArguments

FieldAccess
  = id:(Identifier / this) dot n:Name {
    return addLocInfo({
      kind: "FieldAccess",
      name: id + '.' +  n,
    })
  }

ArrayAccess
  = en:ExpressionName lsquare expr:Expression rsquare {
    return addLocInfo({
      kind: "ArrayAccess",
      primary: en,
      expression: expr,
    })
  }

MethodInvocation
  = ts:$((this / super) dot)? n:Name lparen al:ArgumentList? rparen { 
    return addLocInfo({ kind: "MethodInvocation", identifier: (ts ?? "") + n, argumentList: al ?? [] })
  }

ArgumentList
  = e:Expression es:(comma @Expression)* {
    return [e, ...es];
  }

MethodReference
  =  TO_BE_ADDED

ArrayCreationExpression
  = new (PrimitiveType / ClassType) (Dims ArrayInitializer / DimExprs Dims?)

DimExprs
  = DimExpr+

DimExpr
  = Annotation* lsquare Expression rsquare

Expression
  = LambdaExpression
  / Assignment
  / ConditionalExpression

LambdaExpression
  = LambdaParameters arrow LambdaBody

LambdaParameters
  = lparen LambdaParameterList? rparen
  / Identifier

LambdaParameterList
  = FormalParameter (comma FormalParameter)*
  / Identifier (comma Identifier)*

LambdaBody
  = Block
  / Expression

Assignment
  = lhs:LeftHandSide op:AssignmentOperator rhs:Expression {
    return addLocInfo({
      kind: "Assignment",
      left: lhs,
      operator: op,
      right: rhs,
    })
  }

LeftHandSide
  = ArrayAccess
  / ExpressionName

AssignmentOperator
  = assign
  / muleq
  / diveq
  / modeq
  / pluseq
  / minuseq
  / lshifteq
  / rshifteq
  / urshifteq
  / andeq
  / xoreq
  / oreq

ConditionalExpression
  = test:ConditionalOrExpression tail:ConditionalRest? {
      if (!tail) {
        return test;
      }
      return addLocInfo({
        kind: "TernaryExpression",
        condition: test,
        ... tail,
      })
    }

ConditionalRest
  = questionmark consequent:Expression colon alternate:(ConditionalExpression / LambdaExpression) {
    return { consequent: consequent, alternate: alternate };
  }

ConditionalOrExpression
  = head:ConditionalAndExpression tail:(oror ConditionalAndExpression)* {
    return buildBinaryExpression(head, tail);
  }

ConditionalAndExpression
  = head:InclusiveOrExpression tail:(andand InclusiveOrExpression)* {
    return buildBinaryExpression(head, tail);
  }

InclusiveOrExpression
  = head:ExclusiveOrExpression tail:(or ExclusiveOrExpression)* {
    return buildBinaryExpression(head, tail);
  }

ExclusiveOrExpression
  = head:AndExpression tail:(xor AndExpression)* {
    return buildBinaryExpression(head, tail);
  }

AndExpression
  = head:EqualityExpression tail:(and EqualityExpression)* {
    return buildBinaryExpression(head, tail);
  }

EqualityExpression
  = head:RelationalExpression tail:((equal / noteq) RelationalExpression)* {
    return buildBinaryExpression(head, tail);
  }

RelationalExpression
  = head:ShiftExpression 
    tail:((lt / gt / leq / geq) ShiftExpression /
          instanceof (LocalVariableDeclaration / ReferenceType))* {
    return buildBinaryExpression(head, tail);
  }

ShiftExpression
  = head:AdditiveExpression tail:((lshift / rshift / urshift) AdditiveExpression)* {
    return buildBinaryExpression(head, tail);
  }

AdditiveExpression
  = head:MultiplicativeExpression tail:((plus / minus) MultiplicativeExpression)* {
    return buildBinaryExpression(head, tail);
  }

MultiplicativeExpression
  = head:UnaryExpression tail:((mul / div / mod) UnaryExpression)* {
    return buildBinaryExpression(head, tail);
  }

UnaryExpression
  = / CastExpression
  / PostfixExpression
  / op:PrefixOp expr:UnaryExpression {
    return addLocInfo({
      kind: "PrefixExpression",
      operator: op,
      expression: expr,
    })
  }
  / SwitchExpression

PrefixOp
  = plus / minus / increment / decrement / tilde / not

PlusMinus
  = plus / minus

PostfixExpression
  = expr:(Primary / @ExpressionName) 
    op:(increment / decrement)? {
    return op ? addLocInfo({
      kind: "PostfixExpression",
      operator: op,
      expression: expr,
    }) : expr;
  }

CastExpression
  = lparen castType:PrimitiveType rparen expr:UnaryExpression {
    return addLocInfo({
        kind: "CastExpression",
        type: castType,
        expression: expr,
    })}
  / lparen castType:ReferenceType rparen expr:(LambdaExpression / !(PlusMinus) UnaryExpression) {
    return addLocInfo({
        kind: "CastExpression",
        type: castType,
        expression: expr,
    })
  }

SwitchExpression
  = SwitchStatement

ConstantExpression
  = Expression


// A placeholder that functions as TODO:
TO_BE_ADDED
  = ' '

Annotation = at TO_BE_ADDED
