// colours.js
// Generates a consistent bg/color pair from a string (company name, job title, etc.)
// so avatars always render the same colour for the same entity.

const PALETTES = [
    { bg: "#E8F2FF", color: "#1a55a8" },
    { bg: "#E8FFF4", color: "#1a7a4a" },
    { bg: "#FFF6E8", color: "#a06010" },
    { bg: "#F3F0FF", color: "#5a40c0" },
    { bg: "#FFF0F5", color: "#a0305a" },
    { bg: "#EDF2FD", color: "#1D3E9E" },
    { bg: "#E1F5EE", color: "#0F6E56" },
    { bg: "#FFF3E0", color: "#854F0B" },
    { bg: "#FBEAF0", color: "#72243E" },
    { bg: "#F3EFFE", color: "#534AB7" },
];

export function generateColour(str = "") {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return PALETTES[Math.abs(hash) % PALETTES.length];
}
