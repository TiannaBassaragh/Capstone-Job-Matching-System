import { useState } from "react";
import { PanelCard } from "../cards";
import "./SortPanel.css";

export default function SortPanel({ title = "Sort by", options = [], defaultActive = 0, onChange }) {
    const [activeSort, setActiveSort] = useState(defaultActive);

    const handleSelect = (index, label) => {
        setActiveSort(index);
        console.log("Clicked:", label);
        if (onChange) onChange(index, label);
    };

    return (
        <PanelCard title={title}>
            <div className="sort-panel-options">
                {options.map((label, i) => (
                    <button
                        key={i}
                        type="button"
                        className={`sort-option${activeSort === i ? " sort-option--active" : ""}`}
                        onClick={() => handleSelect(i, label)}
                    >
                        <div className={`sort-option-radio${activeSort === i ? " sort-option-radio--active" : ""}`}>
                            {activeSort === i && <div className="sort-option-dot" />}
                        </div>

                        <span className={`sort-option-label${activeSort === i ? " sort-option-label--active" : ""}`}>
                            {label}
                        </span>
                    </button>
                ))}
            </div>
        </PanelCard>
    );
}