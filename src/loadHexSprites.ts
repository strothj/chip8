export function loadHexSprites(memory: Uint8Array) {
	const sprites = `****
*  *
*  *
*  *
****
  *
 **
  *
  *
 ***
****
   *
****
*
****
****
   *
****
   *
****
*  *
*  *
****
   *
   *
****
*
****
   *
****
****
*
****
*  *
****
****
   *
  *
 *
 *
****
*  *
****
*  *
****
****
*  *
****
   *
****
****
*  *
****
*  *
*  *
***
*  *
***
*  *
***
****
*
*
*
****
***
*  *
*  *
*  *
***
****
*
****
*
****
****
*
****
*
*   `;
	const lines = sprites.split("\n");
	for (let j = 0; j < lines.length; j += 1) {
		let value = 0 | 0;
		for (let k = 0; k < 4; k += 1) {
			value = value | ((lines[j][k] === "*" ? 1 : 0) << (7 - k));
		}
		memory.set([value], j);
		console.log(value.toString(2));
	}
}
