import Thread from "../../../thread";

export const functions = {
  "floatToRawIntBits(F)I": (thread: Thread, locals: any[]) => {
    const float = locals[0];
    const dataview = new DataView(new ArrayBuffer(8));
    dataview.setFloat32(0, float);
    thread.returnStackFrame(dataview.getInt32(0));
  },
};

export default functions;
