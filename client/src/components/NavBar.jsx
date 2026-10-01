import { Link, useLocation } from "react-router-dom";
import { useInterview } from "../context/InterviewContext";
import "./NavBar.css";

function NavBar() {
    const { status, isLocked, lastResultId } = useInterview();
    const { pathname } = useLocation();

    const items = [
        {
            label: "Setup",
            base: "/setup",
            to: "/setup",
            disabled: isLocked,
            reason: "Setup is locked while an interview is running."
        },
        {
            label: "Interview",
            base: "/interview",
            to: "/interview",
            disabled: status !== "active",
            reason: "Start an interview from Setup first."
        },
        {
            label: "History",
            base: "/history",
            to: "/history",
            disabled: isLocked,
            reason: "Finish the interview to open History."
        },
        {
            label: "Results",
            base: "/results",
            to: lastResultId ? `/results/${lastResultId}` : "/results",
            disabled: isLocked,
            reason: "Finish the interview to open Results."
        }
    ];

    return (
        <header className="topbar">
            <div className="topbar-inner">
                <Link
                    to={status === "active" ? "/interview" : "/setup"}
                    className="topbar-brand"
                    aria-disabled={isLocked && status !== "active"}
                >
                    <span className="topbar-logo">AI</span>
                    <span>Mock Interviewer</span>
                </Link>

                <nav className="topbar-nav" aria-label="Main">
                    {items.map((item) =>
                        item.disabled ? (
                            <span
                                key={item.label}
                                className="topbar-link is-disabled"
                                aria-disabled="true"
                                title={item.reason}
                            >
                                {item.label}
                            </span>
                        ) : (
                            <Link
                                key={item.label}
                                to={item.to}
                                className={`topbar-link${
                                    pathname.startsWith(item.base) ? " is-active" : ""
                                }`}
                                aria-current={
                                    pathname.startsWith(item.base) ? "page" : undefined
                                }
                            >
                                {item.label}
                            </Link>
                        )
                    )}
                </nav>

                {isLocked && (
                    <span className="topbar-live" role="status">
                        <i /> Interview in progress
                    </span>
                )}
            </div>
        </header>
    );
}

export default NavBar;
