import {
  BaseJavaCstVisitorWithDefaults,
  DimsCtx,
  IntegralTypeCtx,
  NumericTypeCtx,
  UnannClassOrInterfaceTypeCtx,
  UnannClassTypeCtx,
  UnannPrimitiveTypeCtx,
  UnannPrimitiveTypeWithOptionalDimsSuffixCtx,
  UnannReferenceTypeCtx,
  UnannTypeCstNode,
  UnannTypeCtx
} from "java-parser";

import { UnannType } from "../types/classes";

export class TypeExtractor extends BaseJavaCstVisitorWithDefaults {
  extract(cst: UnannTypeCstNode): UnannType {
    return this.visit(cst);
  }

  unannType(ctx: UnannTypeCtx) {
    if (ctx.unannPrimitiveTypeWithOptionalDimsSuffix) {
      return this.visit(ctx.unannPrimitiveTypeWithOptionalDimsSuffix);
    } else /* if (ctx.unannReferenceType) */ {
      return this.visit(ctx.unannReferenceType!);
    }
  }

  unannPrimitiveTypeWithOptionalDimsSuffix(ctx: UnannPrimitiveTypeWithOptionalDimsSuffixCtx) {
    let type = this.visit(ctx.unannPrimitiveType);
    ctx.dims && (type += this.visit(ctx.dims));
    return type;
  }

  unannPrimitiveType(ctx: UnannPrimitiveTypeCtx) {
    if (ctx.numericType) {
      return this.visit(ctx.numericType);
    } else /* if (ctx.Boolean) */ {
      return "boolean" as UnannType;
    }
  }

  numericType(ctx: NumericTypeCtx) {
    if (ctx.integralType) {
      return this.visit(ctx.integralType);
    }
  }

  integralType(ctx: IntegralTypeCtx) {
    if (ctx.Byte) {
      return "byte";
    } else if (ctx.Short) {
      return "short";
    } else if (ctx.Int) {
      return "int";
    } else if (ctx.Long) {
      return "long";
    } else /* if (ctx.Char) */ {
      return "char";
    }
  }

  unannReferenceType(ctx: UnannReferenceTypeCtx) {
    let type = this.visit(ctx.unannClassOrInterfaceType);
    ctx.dims && (type += this.visit(ctx.dims));
    return type;
  }

  unannClassOrInterfaceType(ctx: UnannClassOrInterfaceTypeCtx) {
    return this.visit(ctx.unannClassType);
  }

  unannClassType(ctx: UnannClassTypeCtx) {
    return ctx.Identifier[0].image;
  }

  dims(_: DimsCtx) {
    return "[]";
  }
}