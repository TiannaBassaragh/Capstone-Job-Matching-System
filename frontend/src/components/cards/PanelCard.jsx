import Card from './Card';
import './PanelCard.css';

export default function PanelCard({ 
    children, 
    className = "", 
    style = {}, 
    title = "",
    headerAction=null,
}) {
    return (
        <Card className={`panel ${className}`} style={style}>
            {title && (
                <div className="panel-hdr">
                    <span className="panel-title">
                        {title}
                    </span>
                    {headerAction && (
                        <div className="panel-hdr-action">
                            {headerAction}
                        </div>
                    )}
                </div>
            )}
            {children}
        </Card>
  );
}