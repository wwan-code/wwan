import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "@assets/scss/components/_header-banner.scss";

const HeaderBanner = () => {
    const particlesRef = useRef(null);
    const searchInputRef = useRef(null);
    const searchBoxRef = useRef(null);
    const headerRef = useRef(null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [searchValue, setSearchValue] = useState(searchParams.get("q") || "");

    // Tạo hiệu ứng particles
    useEffect(() => {
        const particlesContainer = particlesRef.current;
        if (!particlesContainer) return;
        particlesContainer.innerHTML = "";
        const particleCount = 30;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement("div");
            particle.className = "header__particle";
            particle.style.left = Math.random() * 100 + "%";
            particle.style.animationDelay = Math.random() * 12 + "s";
            particle.style.animationDuration = Math.random() * 8 + 8 + "s";
            particlesContainer.appendChild(particle);
        }
    }, []);

    // Hiệu ứng tìm kiếm
    useEffect(() => {
        const input = searchInputRef.current;
        const box = searchBoxRef.current;
        if (!input || !box) return;
        const handleFocus = () => { box.style.transform = "scale(1.05)"; };
        const handleBlur = () => { box.style.transform = "scale(1)"; };
        input.addEventListener("focus", handleFocus);
        input.addEventListener("blur", handleBlur);
        return () => {
            input.removeEventListener("focus", handleFocus);
            input.removeEventListener("blur", handleBlur);
        };
    }, []);

    // Hiệu ứng di chuyển chuột
    useEffect(() => {
        const handleMouseMove = (e) => {
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = e.clientY / window.innerHeight;
            const header = headerRef.current;
            if (header) {
                const rect = header.getBoundingClientRect();
                if (rect.top <= window.innerHeight && rect.bottom >= 0) {
                    const bg = header.querySelector(".header__background");
                    if (bg) {
                        bg.style.transform = `translate(${mouseX * 15}px, ${mouseY * 15}px)`;
                    }
                    header.querySelectorAll(".header__floating-element").forEach((element, index) => {
                        const speed = (index + 1) * 0.3;
                        element.style.transform = `translate(${mouseX * speed}px, ${mouseY * speed}px)`;
                    });
                }
            }
        };
        document.addEventListener("mousemove", handleMouseMove);
        return () => document.removeEventListener("mousemove", handleMouseMove);
    }, []);

    // Xử lý submit tìm kiếm
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const q = searchValue.trim();
        if (q) {
            navigate(`/truyen-tranh?q=${encodeURIComponent(q)}&page=1`);
        } else {
            navigate(`/truyen-tranh`);
        }
    };

    // Xử lý thay đổi input
    const handleInputChange = (e) => {
        setSearchValue(e.target.value);
    };

    return (
        <div className="header__banner" ref={headerRef}>
            <div className="header__background"></div>

            <div className="header__floating-elements">
                <div className="header__floating-element">📖</div>
                <div className="header__floating-element">📚</div>
                <div className="header__floating-element">✨</div>
                <div className="header__floating-element">🌟</div>
            </div>

            <div className="header__particles" ref={particlesRef}></div>

            <div className="header__content">
                <h1 className="header__logo">Thế Giới Truyện</h1>
                <p className="header__tagline">
                    Khám phá vô vàn câu chuyện tuyệt vời
                </p>

                <form className="header__search" ref={searchBoxRef} onSubmit={handleSearchSubmit}>
                    <input
                        type="text"
                        className="header__search-input"
                        placeholder="Tìm kiếm truyện yêu thích..."
                        ref={searchInputRef}
                        value={searchValue}
                        onChange={handleInputChange}
                        autoComplete="off"
                    />
                    <button className="header__search-button" type="submit">🔍</button>
                </form>

                <nav className="header__nav">
                    <Link to="/truyen-tranh?sort=views_desc" className="header__nav-link">Truyện Hot</Link>
                    <Link to="/truyen-tranh?sort=createdAt_desc" className="header__nav-link">Mới Đăng</Link>
                    <Link to="/truyen-tranh?sort=lastChapterUpdatedAt_desc" className="header__nav-link">Mới Cập Nhật</Link>
                    <Link to="/truyen-tranh?sort=title_asc" className="header__nav-link">A-Z</Link>
                </nav>
            </div>
        </div>
    );
};

export default HeaderBanner;