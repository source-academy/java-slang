export interface AttributeType {
  [key: string]: any;
}

export interface AttributeConstantValue {
  attribute_name_index: number;
  constantvalue_index: number;
}

export interface ExceptionType {
  start_pc: number;
  end_pc: number;
  handler_pc: number;
  catch_type: number;
}

export interface AttributeCode {
  attribute_name_index: number;
  max_stack: number;
  max_locals: number;
  code: DataView;
  exception_table: Array<ExceptionType>;
  attributes: Array<AttributeType>;
}

export interface Top_variable_info {
  tag: number /* 0 */;
}

export interface Integer_variable_info {
  tag: number /* 1 */;
}

export interface Float_variable_info {
  tag: number /* 2 */;
}

export interface Double_variable_info {
  tag: number /* 2 */;
}

export interface Long_variable_info {
  tag: number /* 4 */;
}

export interface Null_variable_info {
  tag: number /* 5 */;
}

export interface UninitializedThis_variable_info {
  tag: number /* 6 */;
}

export interface Object_variable_info {
  tag: number /* 7 */;
  cpool_index: number;
}

export interface Uninitialized_variable_info {
  tag: number /* 8 */;
  offset: number;
}

export type verification_type_info =
  | Top_variable_info
  | Integer_variable_info
  | Float_variable_info
  | Long_variable_info
  | Double_variable_info
  | Null_variable_info
  | UninitializedThis_variable_info
  | Object_variable_info
  | Uninitialized_variable_info;

export interface same_frame {
  frame_type: number /* 0-63 */;
}

export interface same_locals_1_stack_item_frame {
  frame_type: number /* 64-127 */;
  stack: Array<verification_type_info>;
}

export interface same_locals_1_stack_item_frame_extended {
  frame_type: number /* 247 */;
  offset_delta: number;
  stack: Array<verification_type_info>;
}

export interface chop_frame {
  frame_type: number /* 248-250 */;
  offset_delta: number;
}

export interface same_frame_extended {
  frame_type: number /* 251 */;
  offset_delta: number;
}

export interface append_frame {
  frame_type: number /* 252-254 */;
  offset_delta: number;
  stack: Array<verification_type_info>;
}

export interface full_frame {
  frame_type: number /* 255 */;
  offset_delta: number;
  locals: Array<verification_type_info>;
  stack: Array<verification_type_info>;
}

export type stack_map_frame =
  | same_frame
  | same_locals_1_stack_item_frame
  | same_locals_1_stack_item_frame_extended
  | chop_frame
  | same_frame_extended
  | append_frame
  | full_frame;

export interface AttributeStackMapTable {
  attribute_name_index: number;
  entries: Array<stack_map_frame>;
}

export interface AttributeExceptions {
  attribute_name_index: number;
  exception_index_table: Array<number>;
}

export interface AttributeInnerClasses {
  attribute_name_index: number;
  classes: Array<{
    inner_class_info_index: number;
    outer_class_info_index: number;
    inner_name_index: number;
    inner_class_access_flags: number;
  }>;
}

export interface AttributeEnclosingMethod {
  attribute_name_index: number;
  class_index: number;
  method_index: number;
}

export interface AttributeSynthetic {
  attribute_name_index: number;
}

export interface AttributeSignature {
  attribute_name_index: number;
  signature_index: number;
}

export interface AttributeSourceFile {
  attribute_name_index: number;
  sourcefile_index: number;
}

export interface AttributeSourceDebugExtension {
  attribute_name_index: number;
  debug_extension: Array<number>;
}

export interface AttributeLineNumberTable {
  attribute_name_index: number;
  line_number_table_length: number;
  line_number_table: Array<{
    start_pc: number;
    line_number: number;
  }>;
}

export interface AttributeLocalVariableTable {
  attribute_name_index: number;
  local_variable_table_length: number;
  local_variable_table: Array<{
    start_pc: number;
    length: number;
    name_index: number;
    descriptor_index: number;
    index: number;
  }>;
}

export interface AttributeLocalVariableTypeTable {
  attribute_name_index: number;
  local_variable_type_table_length: number;
  local_variable_type_table: Array<{
    start_pc: number;
    length: number;
    name_index: number;
    signature_index: number;
    index: number;
  }>;
}

export interface AttributeDeprecated {
  attribute_name_index: number;
}

export interface AnnotationType {
  type_index: number;
  num_element_value_pairs: number;
  element_value_pairs: Array<{
    element_name_index: number;
    value: number;
  }>;
}

export interface AttributeBootstrapMethods {
  attribute_name_index: number;
  num_bootstrap_methods: number;
  bootstrap_methods: Array<BootstrapMethod>;
}

export interface BootstrapMethod {
  bootstrap_method_ref: number;
  num_bootstrap_arguments: number;
  bootstrap_arguments: Array<number>;
}
