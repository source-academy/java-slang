import { CONSTANT_TAG } from "../ClassFile/constants/constants";
import {
  ConstantInfo,
  ConstantIntegerInfo,
  ConstantFloatInfo,
  ConstantLongInfo,
  ConstantDoubleInfo,
  ConstantUtf8Info,
  ConstantStringInfo,
  ConstantNameAndTypeInfo,
  ConstantMethodTypeInfo,
  ConstantClassInfo,
  ConstantInvokeDynamicInfo,
  ConstantFieldrefInfo,
  ConstantMethodrefInfo,
  ConstantInterfaceMethodrefInfo,
  ConstantMethodHandleInfo,
} from "../ClassFile/types/constants";
import { ClassData } from "./types/class/ClassData";
import {
  Constant,
  ConstantInteger,
  ConstantFloat,
  ConstantLong,
  ConstantDouble,
  ConstantUtf8,
  ConstantString,
  ConstantNameAndType,
  ConstantMethodType,
  ConstantClass,
  ConstantInvokeDynamic,
  ConstantFieldref,
  ConstantMethodref,
  ConstantInterfaceMethodref,
  ConstantMethodHandle,
} from "./types/class/Constants";
import { JvmArray } from "./types/reference/Array";

export class ConstantPool {
  private pool: Constant[];

  constructor(cls: ClassData, infoArr: ConstantInfo[], overrides?: JvmArray) {
    const pool: Constant[] = [];

    function init(index: number) {
      if (pool[index]) {
        return;
      }

      const constant: ConstantInfo = infoArr[index];
      switch (constant.tag) {
        // #region static values
        case CONSTANT_TAG.Integer:
          pool[index] = new ConstantInteger(
            cls,
            (constant as ConstantIntegerInfo).value
          );
          return;
        case CONSTANT_TAG.Float:
          pool[index] = new ConstantFloat(
            cls,
            (constant as ConstantFloatInfo).value
          );
          return;
        case CONSTANT_TAG.Long:
          pool[index] = new ConstantLong(
            cls,
            (constant as ConstantLongInfo).value
          );
          return;
        case CONSTANT_TAG.Double:
          pool[index] = new ConstantDouble(
            cls,
            (constant as ConstantDoubleInfo).value
          );
          return;
        case CONSTANT_TAG.Utf8:
          pool[index] = new ConstantUtf8(
            cls,
            (constant as ConstantUtf8Info).value
          );
          return;
        // #endregion

        // #region utf8 dependency
        case CONSTANT_TAG.String:
          const strIndex = (constant as ConstantStringInfo).stringIndex;
          if (!pool[strIndex]) {
            init(strIndex);
          }
          const str = pool[strIndex] as ConstantUtf8;
          pool[index] = new ConstantString(cls, str);
          return;
        case CONSTANT_TAG.NameAndType:
          const ntNameIndex = (constant as ConstantNameAndTypeInfo).nameIndex;
          if (!pool[ntNameIndex]) {
            init(ntNameIndex);
          }
          const ntName = pool[ntNameIndex] as ConstantUtf8;

          const ntDescriptorIndex = (constant as ConstantNameAndTypeInfo)
            .descriptorIndex;
          if (!pool[ntDescriptorIndex]) {
            init(ntDescriptorIndex);
          }
          const ntDescriptor = pool[ntDescriptorIndex] as ConstantUtf8;

          pool[index] = new ConstantNameAndType(cls, ntName, ntDescriptor);
          return;
        case CONSTANT_TAG.MethodType:
          const mtDescriptorIndex = (constant as ConstantMethodTypeInfo)
            .descriptorIndex;
          if (!pool[mtDescriptorIndex]) {
            init(mtDescriptorIndex);
          }
          const mtDescriptor = pool[mtDescriptorIndex] as ConstantUtf8;
          pool[index] = new ConstantMethodType(cls, mtDescriptor);
          return;
        case CONSTANT_TAG.Class:
          const classnameIndex = (constant as ConstantClassInfo).nameIndex;
          if (!pool[classnameIndex]) {
            init(classnameIndex);
          }
          const classname = pool[classnameIndex] as ConstantUtf8;
          pool[index] = new ConstantClass(cls, classname);
          return;
        // #endregion

        // #region name and type dependency
        case CONSTANT_TAG.InvokeDynamic:
          const bootstrapIdx = (constant as ConstantInvokeDynamicInfo)
            .bootstrapMethodAttrIndex;
          const indyNtIndex = (constant as ConstantInvokeDynamicInfo)
            .nameAndTypeIndex;
          if (!pool[indyNtIndex]) {
            init(indyNtIndex);
          }
          const indyNt = pool[indyNtIndex] as ConstantNameAndType;
          pool[index] = new ConstantInvokeDynamic(cls, bootstrapIdx, indyNt);
          return;
        case CONSTANT_TAG.Fieldref:
          const frClassIndex = (constant as ConstantFieldrefInfo).classIndex;
          if (!pool[frClassIndex]) {
            init(frClassIndex);
          }
          const frClass = pool[frClassIndex] as ConstantClass;
          const frNtIndex = (constant as ConstantFieldrefInfo).nameAndTypeIndex;
          if (!pool[frNtIndex]) {
            init(frNtIndex);
          }
          const frNt = pool[frNtIndex] as ConstantNameAndType;
          pool[index] = new ConstantFieldref(cls, frClass, frNt);
          return;
        case CONSTANT_TAG.Methodref:
          const mrClassIndex = (constant as ConstantMethodrefInfo).classIndex;
          if (!pool[mrClassIndex]) {
            init(mrClassIndex);
          }
          const mrClass = pool[mrClassIndex] as ConstantClass;
          const mrNtIndex = (constant as ConstantMethodrefInfo)
            .nameAndTypeIndex;
          if (!pool[mrNtIndex]) {
            init(mrNtIndex);
          }
          const mrNt = pool[mrNtIndex] as ConstantNameAndType;
          pool[index] = new ConstantMethodref(cls, mrClass, mrNt);
          return;
        case CONSTANT_TAG.InterfaceMethodref:
          const imrClassIndex = (constant as ConstantInterfaceMethodrefInfo)
            .classIndex;
          if (!pool[imrClassIndex]) {
            init(imrClassIndex);
          }
          const imrClass = pool[imrClassIndex] as ConstantClass;
          const imrNtIndex = (constant as ConstantInterfaceMethodrefInfo)
            .nameAndTypeIndex;
          if (!pool[imrNtIndex]) {
            init(imrNtIndex);
          }
          const imrNt = pool[imrNtIndex] as ConstantNameAndType;
          pool[index] = new ConstantInterfaceMethodref(cls, imrClass, imrNt);
          return;
        // #endregion

        // #region rest
        case CONSTANT_TAG.MethodHandle:
          const mhRefKind = (constant as ConstantMethodHandleInfo)
            .referenceKind;
          const mhRefIndex = (constant as ConstantMethodHandleInfo)
            .referenceIndex;
          if (!pool[mhRefIndex]) {
            init(mhRefIndex);
          }
          const mhRef = pool[mhRefIndex] as
            | ConstantFieldref
            | ConstantMethodref
            | ConstantInterfaceMethodref;

          pool[index] = new ConstantMethodHandle(cls, mhRefKind, mhRef);
          return;
        // #endregion
      }
    }

    // 1 indexed
    for (let i = 1; i < infoArr.length; i++) {
      init(i);
    }

    this.pool = pool;
  }

  get(index: number): Constant {
    return this.pool[index];
  }

  insert(constant: Constant): number {
    return this.pool.push(constant) - 1;
  }

  size(): number {
    return this.pool.length;
  }
}
