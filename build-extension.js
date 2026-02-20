const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "out");
const nextDir = path.join(outDir, "_next");
const newNextDir = path.join(outDir, "next");

console.log("Starting post-build processing setup for Chrome Extension...");

if (!fs.existsSync(outDir)) {
    console.error("The 'out' directory does not exist. Please run 'next build' first.");
    process.exit(1);
}

// Rename _next to next
if (fs.existsSync(nextDir)) {
    fs.renameSync(nextDir, newNextDir);
    console.log("Renamed '_next' to 'next'");
} else {
    console.log("No '_next' directory found or it was already renamed.");
}

// Recursively find all HTML, JS, CSS, and JSON files and replace "paths"
function processFiles(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            processFiles(filePath);
        } else if (
            filePath.endsWith(".html") ||
            filePath.endsWith(".js") ||
            filePath.endsWith(".css") ||
            filePath.endsWith(".json")
        ) {
            let content = fs.readFileSync(filePath, "utf8");

            // 1. Replace /_next/ with ./next/
            const hasChangesUrl = content.includes("/_next/");
            const hasChangesEscaped = content.includes("\\/_next\\/");

            if (hasChangesUrl || hasChangesEscaped) {
                // we use exact string replacement for href or src attributes 
                // but a global replace is usually fine for a static Next.js export
                content = content.replace(/\/_next\//g, "./next/");
                content = content.replace(/\\\/_next\\\//g, "\\/next\\/");
                console.log(`Updated paths in: ${filePath.replace(outDir, "")}`);
            }

            // 2. Extract inline scripts for Chrome Extension MV3 CSP Compliance (HTML files only)
            if (filePath.endsWith(".html")) {
                const scriptMatches = [...content.matchAll(/<script(.*?)>([\s\S]*?)<\/script>/gi)];

                scriptMatches.forEach((match, index) => {
                    const fullTag = match[0];
                    const attributes = match[1];
                    const inlineCode = match[2];

                    // Only extract if it has code (not just a src tag) and isn't a Next.js JSON data tag
                    if (inlineCode.trim().length > 0 && !attributes.includes('type="application/json"')) {
                        const hash = require('crypto').createHash('md5').update(inlineCode).digest('hex');
                        const scriptFilename = `inline-script-${hash}.js`;
                        const scriptPath = path.join(dir, scriptFilename);

                        // Save the extracted inline code to a new JS file
                        fs.writeFileSync(scriptPath, inlineCode, "utf8");

                        // Replace the inline script with a reference to the new file (using relative ./ path)
                        content = content.replace(
                            fullTag,
                            `<script${attributes} src="./${path.relative(outDir, scriptPath).replace(/\\/g, '/')}"></script>`
                        );
                        console.log(`Extracted inline script to: ${scriptFilename}`);
                    }
                });
            }

            fs.writeFileSync(filePath, content, "utf8");
        }
    }
}

console.log("Replacing '/_next/' references with '/next/' and extracting inline scripts...");
processFiles(outDir);
console.log("Post-build processing complete! Ready for Chrome Extension.");
