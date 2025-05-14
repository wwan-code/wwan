import { Link } from "react-router-dom";
import logo from "../assets/images/wwan-logo-text.png";

const Footer = () => {
	return (
		<footer className="footer">
			<div className="footer__container container pb-6">
				<div className="footer__row row">
					<div className="footer__col footer__col--subscribe col-lg-3">
						<form action="#" className="subscribe-form">
							<div className="subscribe-form__group">
								<input type="email" className="subscribe-form__input" placeholder="Enter your email" />
								<button className="subscribe-form__button">
									<span className="fa fa-right"></span>
								</button>
							</div>
						</form>
					</div>
					<div className="footer__col footer__col--nav col-lg-6">
						<ul className="nav-links nav-links--left text-lg-center">
							<li className="nav-links__item">
								<Link className="nav-links__link">Tài khoản của tôi</Link>
							</li>
							<li className="nav-links__item">
								<Link className="nav-links__link">Lịch sử xem phim</Link>
							</li>
							<li className="nav-links__item">
								<Link className="nav-links__link">Danh sách theo dõi</Link>
							</li>
						</ul>
					</div>
					<div className="footer__col footer__col--social col-lg-3">
						<ul className="nav-links nav-links--social nav-links--right">
							<li className="nav-links__item">
								<Link to={'/'} className="nav-links__link tw">
									<svg viewBox="0 0 24 24" width="1.8em" height="1.8em">
										<g fill="currentColor">
											<path d="M1 2h2.5L3.5 2h-2.5z">
												<animate fill="freeze" attributeName="d" dur="0.4s" values="M1 2h2.5L3.5 2h-2.5z;M1 2h2.5L18.5 22h-2.5z"></animate>
											</path>
											<path d="M5.5 2h2.5L7.2 2h-2.5z">
												<animate fill="freeze" attributeName="d" dur="0.4s" values="M5.5 2h2.5L7.2 2h-2.5z;M5.5 2h2.5L23 22h-2.5z"></animate>
											</path>
											<path d="M3 2h5v0h-5z" opacity="0">
												<set attributeName="opacity" begin="0.4s" to="1"></set>
												<animate fill="freeze" attributeName="d" begin="0.4s" dur="0.4s" values="M3 2h5v0h-5z;M3 2h5v2h-5z"></animate>
											</path>
											<path d="M16 22h5v0h-5z" opacity="0">
												<set attributeName="opacity" begin="0.4s" to="1"></set>
												<animate fill="freeze" attributeName="d" begin="0.4s" dur="0.4s" values="M16 22h5v0h-5z;M16 22h5v-2h-5z"></animate>
											</path>
											<path d="M18.5 2h3.5L22 2h-3.5z" opacity="0">
												<set attributeName="opacity" begin="0.5s" to="1"></set>
												<animate fill="freeze" attributeName="d" begin="0.5s" dur="0.4s" values="M18.5 2h3.5L22 2h-3.5z;M18.5 2h3.5L5 22h-3.5z"></animate>
											</path>
										</g>
									</svg>
								</Link>
							</li>
							<li className="nav-links__item">
								<Link to={'/'} className="nav-links__link ins">
									<svg viewBox="0 0 24 24" width="1.8em" height="1.8em" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<g fill="none" stroke="currentColor">
											<rect x="3" y="3" width="18" height="18" rx="5" ry="5" strokeDasharray="64" strokeDashoffset="64">
												<animate attributeName="stroke-dashoffset" dur="0.4s" values="64;0" fill="freeze" />
											</rect>
											<circle cx="12" cy="12" r="4" strokeDasharray="25" strokeDashoffset="25">
												<animate attributeName="stroke-dashoffset" dur="0.3s" values="25;0" fill="freeze" begin="0.3s" />
											</circle>
											<circle cx="17" cy="7" r="1.2" fill="currentColor" opacity="0">
												<animate attributeName="opacity" from="0" to="1" dur="0.3s" fill="freeze" begin="0.6s" />
											</circle>
										</g>
									</svg>


								</Link>
							</li>
							<li className="nav-links__item">
								<Link to={'/'} className="nav-links__link fb">
									<svg viewBox="0 0 24 24" width="1.8em" height="1.8em">
										<g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="4">
											<path strokeDasharray="24" strokeDashoffset="24" d="M17 4L15 4C12.5 4 11 5.5 11 8V20">
												<animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="24;0"></animate>
											</path>
											<path strokeDasharray="12" strokeDashoffset="12" d="M8 12H15">
												<animate fill="freeze" attributeName="stroke-dashoffset" begin="0.5s" dur="0.2s" values="12;0"></animate>
											</path>
										</g>
									</svg>
								</Link>
							</li>
							<li className="nav-links__item">
								<Link to={'/'} className="nav-links__link tele">
									<svg viewBox="0 0 24 24" width="1.8em" height="1.8em">
										<g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
											<path strokeDasharray="16" strokeDashoffset="16" d="M21 5L18.5 20M21 5L9 13.5">
												<animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="16;0"></animate>
											</path>
											<path strokeDasharray="22" strokeDashoffset="22" d="M21 5L2 12.5">
												<animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="22;0"></animate>
											</path>
											<path strokeDasharray="12" strokeDashoffset="12" d="M18.5 20L9 13.5">
												<animate fill="freeze" attributeName="stroke-dashoffset" begin="0.4s" dur="0.3s" values="12;0"></animate>
											</path>
											<path strokeDasharray="8" strokeDashoffset="8" d="M2 12.5L9 13.5">
												<animate fill="freeze" attributeName="stroke-dashoffset" begin="0.4s" dur="0.3s" values="8;0"></animate>
											</path>
											<path strokeDasharray="6" strokeDashoffset="6" d="M12 16L9 19M9 13.5L9 19">
												<animate fill="freeze" attributeName="stroke-dashoffset" begin="0.7s" dur="0.3s" values="6;0"></animate>
											</path>
										</g>
									</svg>
								</Link>
							</li>
						</ul>
					</div>
				</div>
			</div>
			<hr />
			<div className="footer__container container pt-4">
				<div className="footer__row row">
					<div className="footer__col footer__col--logo col-lg-2">
						<Link to={'/'} className="site-logo">
							<img src={logo} alt="" />
						</Link>
					</div>
					<div className="footer__col footer__col--nav footer__col--nav2 col-lg-5">
						<ul className="nav-links nav-links--left">
							<li className="nav-links__item">
								<Link to="/dieu-khoan" className="nav-links__link">Điều khoản</Link>
							</li>
							<li className="nav-links__item">
								<Link to="/chinh-sach-bao-mat" className="nav-links__link">Chính sách bảo mật</Link>
							</li>
							<li className="nav-links__item">
								<Link to="/lien-he" className="nav-links__link">Liên hệ</Link>
							</li>
						</ul>
					</div>

					<div className="footer__col footer__col--copyright col-lg-5">
						<p className="m-0 text-muted"><small>© 2025 WWAN. Tất cả các quyền được bảo lưu.</small></p>
					</div>
				</div>
			</div>
		</footer>
	);
}

export default Footer;