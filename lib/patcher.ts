/**
 * Applies an IPS patch to a ROM file
 * @param rom - The original ROM data
 * @param patchData - The IPS patch data
 * @returns The patched ROM data
 */
export function applyIPS(romData: Uint8Array, patchData: Uint8Array): Uint8Array {
  // Create a copy of the ROM to avoid modifying the original
  const patchedRom = new Uint8Array(romData);

  // Check for IPS header "PATCH"
  const header = new TextDecoder().decode(patchData.slice(0, 5));
  if (header !== 'PATCH') {
    throw new Error('Invalid IPS patch format: missing "PATCH" header');
  }

  let offset = 5; // Start after header

  // Highest byte position this patch wants to write. If it lands past the
  // end of the ROM the writes below are skipped, which used to happen
  // silently and produce a subtly broken ROM. Tracked so we can fail loudly.
  let highestWrite = 0;

  while (offset < patchData.length - 3) { // -3 to check for EOF
    // Check for EOF marker "EOF" (0x45, 0x4F, 0x46)
    if (
      patchData[offset] === 0x45 &&
      patchData[offset + 1] === 0x4F &&
      patchData[offset + 2] === 0x46
    ) {
      break; // End of patch file
    }

    // Read 3-byte offset
    const patchOffset = (patchData[offset] << 16) |
                         (patchData[offset + 1] << 8) |
                         patchData[offset + 2];
    offset += 3;

    // Read 2-byte size
    const size = (patchData[offset] << 8) | patchData[offset + 1];
    offset += 2;

    if (size === 0) {
      // RLE encoding: Next 2 bytes = size, 1 byte = value to repeat
      const rleSize = (patchData[offset] << 8) | patchData[offset + 1];
      offset += 2;

      const value = patchData[offset];
      offset += 1;

      highestWrite = Math.max(highestWrite, patchOffset + rleSize);

      // Fill with the repeated value
      for (let i = 0; i < rleSize; i++) {
        if (patchOffset + i < patchedRom.length) {
          patchedRom[patchOffset + i] = value;
        }
      }
    } else {
      // Standard patch: Copy the bytes
      highestWrite = Math.max(highestWrite, patchOffset + size);

      for (let i = 0; i < size; i++) {
        if (patchOffset + i < patchedRom.length && offset + i < patchData.length) {
          patchedRom[patchOffset + i] = patchData[offset + i];
        }
      }
      offset += size;
    }
  }

  if (highestWrite > patchedRom.length) {
    const neededMB = (highestWrite / (1024 * 1024)).toFixed(2);
    const haveMB = (patchedRom.length / (1024 * 1024)).toFixed(2);
    throw new Error(
      `Patch needs a ${neededMB}MB ROM but this one is ${haveMB}MB. ` +
      `Data past the end would be discarded, producing a broken ROM.`
    );
  }

  return patchedRom;
}
