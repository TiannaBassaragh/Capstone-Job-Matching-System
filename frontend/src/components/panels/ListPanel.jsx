import { getInitials } from "../../utils";
import { PanelCard } from "../cards";
import { FilterBar } from "../bars";
import "./ListPanel.css";

// rows: array of { id, userName, bg, color, title, meta, ...any extra fields }
// renderRight(row): returns JSX for the right-side slot (badges, score, tags, etc.)
// filterConfig / onFilterChange: optional — pass both to show the filter bar
// filterOptions / customConditions: optional — only passed for filter details
// filterConfig shape: { type, key, label, rules? } — see filterMatches.js
 
export default function ListPanel({
    title,
    headerAction,
    rows = [],
    onRowClick,
    renderRight,
    filterConfig,
    onFilterChange,
    filterOptions,
    customConditions = [],
}) {

    const showFilter = filterConfig !== undefined && onFilterChange !== undefined;

    return (
        <PanelCard title={title} headerAction={headerAction}>
            
            {showFilter && (
                <FilterBar
                    value={filterConfig}
                    onChange={onFilterChange}
                    filterOptions={filterOptions}
                    customConditions={customConditions}
                />
            )}

            <div className="list-panel-rows">
                {rows.length === 0 ? (
                    <div className="list-panel-empty">No items to display.</div>
                ) : (

                    rows.map((row, i) => (
                        <div key={row.id}>
                            {i > 0 && <div className="list-panel-divider" />}
                            <button
                                type="button"
                                className="list-panel-row"
                                onClick={() => onRowClick?.(row)}
                            >
                                <div
                                    className="list-panel-icon"
                                    style={{ background: row.bg, color: row.color }}
                                >
                                    {(row.avatar || row.companyLogo)
                                        ? <img src={row.avatar ?? row.companyLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
                                        : getInitials(row.userName)
                                    }
                                </div>
                                <div className="list-panel-body">
                                    <div className="list-panel-title">{row.title}</div>
                                    <div className="list-panel-meta">{row.meta}</div>
                                </div>
                                {renderRight && (
                                    <div className="list-panel-right">
                                        {renderRight(row)}
                                    </div>
                                )}
                            </button>
                        </div>
                    ))
                )}
            </div>

        </PanelCard>
    );
}