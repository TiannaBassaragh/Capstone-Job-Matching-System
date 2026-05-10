// utils/matches.js — shared helpers for match score computation

import { competencyDetails } from "../fake-data/MatchData";

// Derives deterministic per-competency scores from an overall match score.
// Offsets are fixed so the same score always produces the same breakdown.
export function getCompetencyScores(score) {
    const offsets = [5, -2, -8, -16, 3];
    return competencyDetails.map((c, i) => ({
        ...c,
        value: Math.min(99, Math.max(30, score + offsets[i])),
    }));
}