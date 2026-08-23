const fs = require('fs');
const path = require('path');

// Solid NIQ Blue 16x16 PNG image in base64
const pngBase64 = 'iVBORw0KGgoAAAANSU6BGGgAAAABJRU5ErkJggg==';

// Better 32x32 electric blue PNG icon
const bluePngBase64 = 'iVBORw0KGgoAAAANSU6BGGgAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAcSURBVFhH7cEBDQAAAMKg90t1hk9gAAAAAPgqDX4AAXiY9J4AAAAASUVORK5CYII=';

// A valid 16x16 solid blue PNG with white 'N'
const niqPngBase64 = 'iVBORw0KGgoAAAANSU6BGGgAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAjSURBVDhPY2AYBaNgFIDFh84n/0ECjKAZBqMBDAwMDKMABgYAG+EFz+aZz/sAAAAASUVORK5CYII=';

const assetsDir = path.join(__dirname, 'electron', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Convert base64 data to buffer and write icon.png
const buffer = Buffer.from(
  'iVBORw0KGgoAAAANSU6BGGgAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAADdJREFUeNpi/P//PwMlgImBQgBjyJpBgmEY1QBD2ACQH4jR9eMwAAY0uWbUYjBqAcgKGIwGDAwAAI1kGBZ1NndRAAAAAElFTkSuQmCC',
  'base64'
);

fs.writeFileSync(path.join(assetsDir, 'icon.png'), buffer);
console.log('Successfully created icon.png in electron/assets');
