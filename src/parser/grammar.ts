export const javaPegGrammar = `

{{
  function buildBinaryExpression(head, tail) {
    return tail.reduce((result, element) => {
      return {
        type: "BinaryExpression",
        operator: element[0],
        left: result,
        right: element[1]
      };
    }, head);
  }
}}

/*
  Productions from §3 (Lexical Structure)
*/
LineTerminator
  = "\\r\\n"
  / [\\r\\n] 

Whitespace
  = [ \\t\\f]
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
  = @(
      FloatingPointLiteral
    / IntegerLiteral
    / BooleanLiteral
    / CharacterLiteral
    / TextBlock
    / StringLiteral
    / NullLiteral
  ) _

IntegerLiteral
  = head:(HexNumeral / BinaryNumeral / OctalNumeral / DecimalNumeral) tail:[lL]? {
    return head + (tail ?? "");
  }

HexNumeral = ('0x' / '0X') HexDigits

BinaryNumeral = ('0b' / '0B') [01] ([_]* [01])*

OctalNumeral = '0' ([_]* [0-7])+

DecimalNumeral = $('0' / [1-9] ([_]* [0-9])*)

FloatingPointLiteral = HexadecimalFloatingPointLiteral / DecimalFloatingPointLiteral

DecimalFloatingPointLiteral
   = Digits '.' Digits?  ExponentPart? [fFdD]?
    / '.' Digits ExponentPart? [fFdD]?
    / Digits ExponentPart [fFdD]?
    / Digits ExponentPart? [fFdD]

ExponentPart = [eE] [+\\-]? Digits

HexadecimalFloatingPointLiteral = HexSignificand BinaryExponentPart [fFdD]?

HexSignificand
   = ('0x' / '0X') HexDigits? '.' HexDigits
    / HexNumeral '.'?

BinaryExponentPart = [pP] [+\\-]? Digits

Digits = [0-9] ([_]* [0-9])*

HexDigits = HexDigit ([_]*HexDigit)*

HexDigit = [a-fA-F0-9]

BooleanLiteral
  = "true"
  / "false"

CharacterLiteral = ['] (EscapeSequence / !['\\\\] .) [']

StringLiteral = '\\"' (EscapeSequence / !["\\\\\\r\\n] .)* '\\"'

TextBlock
  = "\\"\\"\\"" ([ \\t\\f])* LineTerminator (EscapeSequence / LineTerminator / ![\\\\\\r\\n] .)* "\\"\\"\\""

EscapeSequence = '\\\\' ([bstnfr"'\\\\] / OctalEscape / UnicodeEscape / LineTerminator)

OctalEscape
   = [0-3][0-7][0-7]
    / [0-7][0-7]
    / [0-7]

UnicodeEscape
   = 'u'+ HexDigit HexDigit HexDigit HexDigit

NullLiteral
  = "null"

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
minus = @'-' ![=\\-] _
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
  = head:(pn:(PackageName dot)? Annotation* id:TypeIdentifier TypeArguments?
      { return (pn ?? "") + id; })
    tail:(dot Annotation* @TypeIdentifier TypeArguments?)* {
      return head + tail.join();
    }

Dims
  = Annotation* lsquare rsquare d:(Dims)* {
    return "[]" + d.join();
  }

TypeArguments
  = lt TypeArgumentsList gt

TypeArgumentsList
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
  = TypeIdentifier
  / Identifier dot TypeName

ExpressionName
  = Name

MethodName
  = UnqualifiedMethodIdentifier

PackageOrTypeName
  = Name

AmbiguousName
  = Name

Name
  = id:Identifier ids:(dot Identifier)* {
    return [id, ...ids].join();
  }



/*
  Productions from §7 (Packages and Modules)
*/
CompilationUnit
  = _ @OrdinaryCompilationUnit

OrdinaryCompilationUnit
  = PackageDeclaration? ImportDeclaration* tld:TopLevelClassOrInterfaceDeclaration* {
    return {
      kind: "OrdinaryCompilationUnit",
      topLevelClassOrInterfaceDeclaration: tld,
    }
  }

PackageDeclaration
  = TO_BE_ADDED

ImportDeclaration
  = TO_BE_ADDED

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
  = cm:ClassModifier* class tm:TypeIdentifier TypeParameters? ClassExtends? ClassImplements? ClassPermits? cb:ClassBody {
    return {
      kind: "NormalClassDeclaration",
      classModifier: cm,
      typeIdentifier: tm,
      classBody: cb,
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
  = TO_BE_ADDED

ClassImplements
  = TO_BE_ADDED

InterfaceTypeList
  = TO_BE_ADDED

ClassPermits
  = TO_BE_ADDED

ClassBody
  = lcurly cbd:ClassBodyDeclaration* rcurly {
    return {
      kind: "ClassBody",
      classBodyDeclaration: cbd,
    }
  }

ClassBodyDeclaration
  = ClassMemberDeclaration
//  / InstanceInitializer
//  / StaticInitializer
//  / ConstructorDeclaration

ClassMemberDeclaration
  = FieldDeclaration
  / MethodDeclaration
  / ClassDeclaration
  / InterfaceDeclaration
  / semicolon

FieldDeclaration
  = FieldModifier* UnannType VariableDeclaratorList semicolon

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
  = id:Identifier d:Dims? {
    return {
      identifier: id,
      dims: d ?? "",
    }
  }

VariableInitializer
  = Expression
  / ArrayInitializer

UnannType
  = !Annotation @Type

MethodDeclaration
  = mm:MethodModifier* mh:MethodHeader mb:MethodBody {
    return {
      kind: "MethodDeclaration",
      methodModifier: mm,
      methodHeader: mh,
      methodBody: mb,
    }
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
  = vm:VariableModifier* ut:UnannType vdid:VariableDeclaratorId {
    return {
      kind: "FormalParameter",
      variableModifier: vm,
      unannType: ut + vdid.dims,
      identifier: vdid.identifier,
    }
  }

VariableModifier
  = final

Throws
  = throw TO_BE_ADDED



/*
  Productions from §10 (Arrays)
*/
ArrayInitializer
  = lcurly VariableInitializerList? comma? rcurly

VariableInitializerList
  = VariableInitializer (comma VariableInitializer)*



/*
  Productions from §14 (Blocks, Statements, and Patterns)
*/
Block
  = lcurly @BlockStatement* rcurly

BlockStatement
  = LocalClassOrInterfaceDeclaration
  / LocalVariableDeclarationStatement
  / Statement

LocalClassOrInterfaceDeclaration
  = ClassDeclaration

LocalVariableDeclarationStatement
  = @LocalVariableDeclaration semicolon

LocalVariableDeclaration
  = vm:VariableModifier* ut:UnannType vdl:VariableDeclaratorList {
    return {
      kind: "LocalVariableDeclaration",
      variableModifier: vm,
      unannType: ut,
      variableDeclaratorList: vdl,
    }
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
  = TO_BE_ADDED

DoStatement
  = do Statement while lparen Expression rparen semicolon

BreakStatement
  = break semicolon

ContinueStatement
  = continue semicolon

YieldStatement
  = yield Expression semicolon

ReturnStatement
  = return Expression? semicolon

ThrowStatement
  = throw Expression semicolon

SynchronizedStatement
  = synchronized lparen Expression rparen Block

TryStatement
  = TO_BE_ADDED

IfStatement
  = if lparen Expression rparen Statement (else Statement)?

WhileStatement
  = while lparen Expression rparen Statement

ForStatement
  = for lparen ForInit? semicolon Expression? semicolon ForUpdate? rparen Statement
  / for lparen LocalVariableDeclaration colon Expression rparen Statement

ForInit
  = LocalVariableDeclaration
  / StatementExpressionList

ForUpdate
  = StatementExpressionList

StatementExpressionList
  = StatementExpression (comma @StatementExpression)*

ExpressionStatement
  = @StatementExpression semicolon

StatementExpression
  = Assignment
  / &(increment / decrement) @UnaryExpression
  / !PlusMinus @UnaryExpression
//  / MethodInvocation
//  / ClassInstanceCreationExpression


/*
  Productions from §15 (Expressions)
*/
Primary
  = lparen @Expression rparen
  / l:Literal { return { kind: "Literal", value: l }};

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
    return {
      kind: "AssignmentExpression",
      left: lhs,
      op: op,
      right: rhs,
    }
  }

LeftHandSide
  = ExpressionName

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
      return {
        kind: "ConditionalExpression",
        test: test,
        ... tail,
      }
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
  = op:PrefixOp expr:UnaryExpression {
    return {
      kind: "UnaryPrefixExpression",
      op: op,
      expr: expr,
    }
  }
  / CastExpression
  / SwitchExpression
  / PostfixExpression

PrefixOp
  = plus / minus / increment / decrement / tilde / not

PlusMinus
  = plus / minus

PostfixExpression
  = expr:(Primary / name:ExpressionName { return { kind: "NameExpression", name: name } }) 
    op:(increment / decrement)? {
    return op ? {
      kind: "UnaryPostfixExpression",
      op: op,
      expr: expr,
    } : expr;
  }

CastExpression
  = lparen PrimitiveType rparen UnaryExpression
  / lparen ReferenceType rparen (LambdaExpression / !(PlusMinus) UnaryExpression)

SwitchExpression
  = SwitchStatement

ConstantExpression
  = Expression


// A placeholder that functions as TODO:
TO_BE_ADDED
  = ' '

Annotation = at TO_BE_ADDED
`