declare module "heic-decode" {
  interface DecodeInput {
    buffer: Uint8Array | ArrayBuffer;
  }
  interface DecodedImage {
    width: number;
    height: number;
    /** RGBA pixel data, 4 bytes per pixel. */
    data: ArrayBuffer;
  }
  function decode(input: DecodeInput): Promise<DecodedImage>;
  export default decode;
}
