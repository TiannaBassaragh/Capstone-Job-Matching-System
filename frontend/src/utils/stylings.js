export function getScoreStyle(score) {
    if (score >= 80) {
        return {
            color: "#1D6B2E",
            barColor: score >= 85 ? "#22a84a" : "#4dbb6a",
        };
    }

    if (score >= 60) {
        return {
            color: "#BA7517",
            barColor: "#EF9F27",
        };
    }

    return {
            color: "#a32d2d",
            barColor: "#E24B4A",
    };
}