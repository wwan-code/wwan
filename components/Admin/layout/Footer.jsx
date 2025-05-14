import { Link } from "react-router-dom";
import "../../../assets/scss/_footer.scss";

const Footer = () => {
    return (
        <footer className="footer docs-footer py-md-3 mt-4 text-center text-sm-start">
            <div className="container-lg px-4 z-1">
                <div className="docs-footer-links mb-3 d-flex flex-column flex-sm-row gap-3">
                    <Link>GitHub</Link>
                    <Link>Twitter</Link>
                </div>
                <div className="d-flex">
                    <div className="flex-grow-1">
                        <p className="mb-0">© 2025 WA. All rights reserved.</p>
                    </div>
                    <div className="flex-shrink-1">
                        <p className="mb-0">Made with <i className="bi bi-heart"></i > by <Link>WWAN</Link></p>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;