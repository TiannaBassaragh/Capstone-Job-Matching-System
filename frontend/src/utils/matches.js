// utils/matches.js — shared helpers for match score computation

import { competencyDetails } from "../lib/competencyConfig";

// Derives deterministic per-competency scores from an overall match score.
// Offsets are fixed so the same score always produces the same breakdown.
// TODO: replace with real per-competency scores once backend exposes them
// per match (currently only the aggregate match_score is returned).
export function getCompetencyScores(score) {
    const offsets = [5, -2, -8, -16, 3];
    return competencyDetails.map((c, i) => ({
        ...c,
        value: Math.min(99, Math.max(30, score + offsets[i])),
    }));
}
