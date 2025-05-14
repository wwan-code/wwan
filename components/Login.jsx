import React, { useEffect, useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { ToastContainer } from 'react-toastify';
import { GoogleAuthProvider, FacebookAuthProvider, GithubAuthProvider, signInWithPopup, getAuth, fetchSignInMethodsForEmail, linkWithCredential } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { useDispatch } from 'react-redux';
import { loginWithThirdParty } from '../features/userSlice';
import { useNavigate } from 'react-router-dom';
import '../assets/scss/login.css';

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const Login = () => {
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        const signUpButton = document.getElementById('signUp');
        const signInButton = document.getElementById('signIn');
        const container = document.getElementById('container');

        signUpButton.addEventListener('click', () => {
            container.classList.add("right-panel-active");
        });

        signInButton.addEventListener('click', () => {
            container.classList.remove("right-panel-active");
        });
    }, []);

    const handleSocialLogin = async (provider) => {
        if (!auth) {
            console.error("Lỗi: Firebase chưa được khởi tạo.");
            return;
        }

        let authProvider;
        switch (provider) {
            case "google":
                authProvider = new GoogleAuthProvider();
                break;
            case "facebook":
                authProvider = new FacebookAuthProvider();
                break;
            case "github":
                authProvider = new GithubAuthProvider();
                break;
            default:
                console.error(`Lỗi: Nhà cung cấp "${provider}" không được hỗ trợ.`);
                return;
        }

        try {
            // Hiển thị loader trong quá trình đăng nhập
            setIsLoading(true);

            const result = await signInWithPopup(auth, authProvider);
            const user = result.user;

            dispatch(loginWithThirdParty({
                uuid: user.uid,
                email: user.email,
                name: user.displayName || user.email,
                avatar: user.photoURL,
                phoneNumber: user.phoneNumber,
                provider
            }));

            navigate('/');

        } catch (error) {
            console.error("Lỗi đăng nhập bằng tài khoản mạng xã hội:", error);

            if (error.code === "auth/account-exists-with-different-credential") {
                const existingEmail = error.customData?.email;
                const pendingCredential = error.credential;

                if (!existingEmail || !pendingCredential) {
                    console.error("Lỗi: Không tìm thấy email hoặc thông tin xác thực.");
                    return;
                }

                try {
                    const providers = await fetchSignInMethodsForEmail(auth, existingEmail);
                    console.log("Nhà cung cấp đã liên kết với email này:", providers);

                    if (providers.length > 0) {
                        const primaryProvider = getAuthProvider(providers[0]); // Lấy provider phù hợp
                        const primaryResult = await signInWithPopup(auth, primaryProvider);

                        await linkWithCredential(primaryResult.user, pendingCredential);
                        console.log("Tài khoản đã được liên kết thành công!");
                    } else {
                        console.error("Lỗi: Không có phương thức đăng nhập nào phù hợp với email này.");
                    }
                } catch (linkError) {
                    console.error("Lỗi khi liên kết tài khoản:", linkError);
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm helper để lấy provider phù hợp
    const getAuthProvider = (providerId) => {
        switch (providerId) {
            case "google.com": return new GoogleAuthProvider();
            case "facebook.com": return new FacebookAuthProvider();
            case "github.com": return new GithubAuthProvider();
            default: throw new Error(`Lỗi: Không xác định được nhà cung cấp "${providerId}".`);
        }
    };


    return (
        <>
            {
                isLoading && (
                    <div className="loader-overlay">
                        <div className="loader"></div>
                        <p>Đang tải...</p>
                    </div>
                )
            }
            <div className="login-area" id="container">
                <div className="form-container sign-up-container">
                    <RegisterForm onSocialLogin={handleSocialLogin} />
                </div>
                <div className="form-container sign-in-container">
                    <LoginForm onSocialLogin={handleSocialLogin} />
                </div>
                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left">
                            <h1>Chào mừng trở lại!</h1>
                            <p>Vui lòng đăng nhập bằng thông tin cá nhân của bạn</p>
                            <button className="ghost" id="signIn">
                                <i className="fas fa-arrow-left"></i>
                                <span>Đăng nhập</span>
                            </button>
                        </div>
                        <div className="overlay-panel overlay-right">
                            <h1>Xin chào bạn!</h1>
                            <p>Nhập thông tin cá nhân của bạn và bắt đầu hành trình với chúng tôi</p>
                            <button className="ghost" id="signUp">
                                <span>Đăng ký</span>
                                <i className="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </>
    );
};

export default Login;