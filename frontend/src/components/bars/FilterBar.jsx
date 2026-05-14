import { useState } from "react";
import "./FilterBar.css";

const defaultFilterOptions = [
    { key: "all",   label: "All" },
    { key: "80+",   label: "80%+ match" },
    { key: "60+",   label: "60%+ match" },
    { key: "top10", label: "Top 10" },
    { key: "new",   label: "New this week" },
];

const defaultCustomConditions = [
    { key: "percent", label: "Above", unit: "% match", min: 0,  max: 100, step: 5, initVal: 70 },
    { key: "top",     label: "Top",   unit: "results", min: 1,  max: 50,  step: 1, initVal: 10 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
}

function buildLabel(conditions, values, active) {
    const labelMap = {
        percent:  (v) => `>${v}% match`,
        top:      (v) => `Top ${v}`,
        matches:  (v) => `≥${v} matches`,
        newCount: (v) => `≥${v} new`,
    };
    const parts = conditions
        .filter((c) => active[c.key])
        .map((c) => (labelMap[c.key] ?? ((v) => `${c.label} ${v}`))(values[c.key]));

    return parts.length > 0 ? parts.join(" + ") : "All";
}

function buildRules(conditions, values, active) {
    return Object.fromEntries(
        conditions.map((c) => [c.key, { active: !!active[c.key], value: values[c.key] }])
    );
}

// ── Stepper sub-component ─────────────────────────────────────────────────────

function Stepper({ value, onChange, min, max, step, disabled }) {
    const bump = (delta) => onChange(clamp(Math.round((value + delta) / step) * step, min, max));

    return (
        <div className={`filter-stepper${disabled ? " filter-stepper--dim" : ""}`}>
            <button type="button" className="filter-stepper-btn" onClick={() => bump(-step)} disabled={disabled}>−</button>
            <div className="filter-stepper-divider" />
            <input
                className="filter-stepper-input"
                type="number"
                value={value}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                onChange={(e) => onChange(clamp(parseInt(e.target.value) || min, min, max))}
            />
            <div className="filter-stepper-divider" />
            <button type="button" className="filter-stepper-btn" onClick={() => bump(step)} disabled={disabled}>+</button>
        </div>
    );
}

// ── FilterBar ─────────────────────────────────────────────────────────────────

export default function FilterBar({
    value,
    onChange,
    filterOptions    = defaultFilterOptions,
    customConditions = [],
}) {
    const [customOpen, setCustomOpen] = useState(false);
    const [values, setValues] = useState(() =>
        Object.fromEntries(customConditions.map((c) => [c.key, c.initVal]))
    );
    const [active, setActive] = useState(() =>
        Object.fromEntries(customConditions.map((c) => [c.key, false]))
    );

    const setVal    = (key, val) => setValues((prev) => ({ ...prev, [key]: val }));
    const toggleKey = (key)      => setActive((prev) => ({ ...prev, [key]: !prev[key] }));

    const emitPreset = (key, label) => onChange({ type: "preset", key, label });

    const handlePresetClick = (option) => {
        setCustomOpen(false);
        const isAlreadyActive = value?.key === option.key;
        if (!isAlreadyActive) emitPreset(option.key, option.label);
    };

    const handleCustomToggle = () => {
        const opening = !customOpen;
        setCustomOpen(opening);
        if (opening) {
            setActive(Object.fromEntries(customConditions.map((c) => [c.key, false])));
            emitPreset("all", "All");
        }
    };

    const handleApply = () => {
        const noneActive = customConditions.every((c) => !active[c.key]);
        if (noneActive) { emitPreset("all", "All"); setCustomOpen(false); return; }

        onChange({
            type:  "custom",
            key:   "custom",
            label: buildLabel(customConditions, values, active),
            rules: buildRules(customConditions, values, active),
        });
        setCustomOpen(false);
    };

    const isPresetActive = (key) => value?.type === "preset" && value?.key === key;
    const isCustomActive = value?.type === "custom";

    return (
        <div className="filter-area">
            <div className="filter-pill-row">
                {filterOptions.map((option) => (
                    <button
                        key={option.key}
                        type="button"
                        className={`
                            filter-pill
                            ${isPresetActive(option.key) 
                                ? " filter-pill-on" 
                                : ""
                            }
                        `}
                        onClick={() => handlePresetClick(option)}
                    >
                        {option.label}
                    </button>
                ))}

                {customConditions.length > 0 && (
                    <button
                        type="button"
                        className={`
                            filter-pill 
                            filter-pill-cp
                            ${customOpen || isCustomActive 
                                ? " filter-pill-on" 
                                : ""
                            }
                        `}
                        onClick={handleCustomToggle}
                    >
                        + Custom filter
                    </button>
                )}

                {isCustomActive && !customOpen && (
                    <span className="filter-active-tag">{value.label}</span>
                )}
            </div>

            {customOpen && (
                <div className="filter-custom-bar">
                    {customConditions.map((c) => (
                        <div key={c.key} className="filter-custom-condition">
                            <input
                                type="checkbox"
                                id={`filter-check-${c.key}`}
                                className="filter-custom-checkbox"
                                checked={!!active[c.key]}
                                onChange={() => toggleKey(c.key)}
                            />
                            <label htmlFor={`filter-check-${c.key}`} className="filter-custom-label">
                                {c.label}
                            </label>
                            <Stepper
                                value={values[c.key]}
                                onChange={(val) => setVal(c.key, val)}
                                min={c.min}
                                max={c.max}
                                step={c.step}
                                disabled={!active[c.key]}
                            />
                            <span className="filter-custom-unit">{c.unit}</span>
                        </div>
                    ))}

                    <button type="button" className="filter-apply-btn" onClick={handleApply}>
                        Apply
                    </button>
                </div>
            )}
        </div>
    );
}