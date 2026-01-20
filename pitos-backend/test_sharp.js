
console.log("Start test");
try {
    const sharp = require('sharp');
    console.log("Sharp required successfully");
} catch (e) {
    console.error("Sharp failed:", e);
}
console.log("End test");
