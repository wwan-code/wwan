import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import { registerUser } from '../features/userSlice';
import { Bounce, toast } from 'react-toastify';

const RegisterForm = ({
    onSocialLogin
}) => {
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const dispatch = useDispatch();
    const [formValue, setFormValue] = useState({
        name: "",
        email: "",
        password: "",
        confPassword: "",
        verificationCode: ""
    });

    const [passwordsMatch, setPasswordsMatch] = useState(false);
    const [errors, setErrors] = useState({
        name: '',
        email: '',
        password: '',
        confPassword: '',
        verificationCode: ''
    });

    const validateEmail = (email) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    };

    const handleChangeValue = (event) => {
        const { name, value } = event.target;
        setFormValue({
            ...formValue,
            [name]: value,
        });

        // Kiểm tra lỗi
        if (name === 'email' && !validateEmail(value)) {
            setErrors((prevErrors) => ({ ...prevErrors, email: 'Email không hợp lệ' }));
        } else if (name === 'password' && !validatePassword(value)) {
            setErrors((prevErrors) => ({ ...prevErrors, password: 'Mật khẩu không hợp lệ' }));
        } else {
            setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
        }
    };

    const handleCheckPassword = (e) => {
        const { value } = e.target;
        const password = formValue.password;
        const confPassword = value;
        setFormValue((prevData) => ({
            ...prevData, confPassword
        }))
        if (password !== confPassword) {
            setPasswordsMatch(false);
            setErrors((prevErrors) => ({ ...prevErrors, confPassword: 'Mật khẩu không khớp' }));
        } else {
            setPasswordsMatch(true);
            setErrors((prevErrors) => ({ ...prevErrors, confPassword: '' }));
        }
    };

    const handleRegister = (e) => {
        e.preventDefault();
        if (formValue.password !== formValue.confPassword) {
            toast.warn("Mật khẩu chưa khớp", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: document.documentElement.getAttribute("data-ww-theme"),
                transition: Bounce,
            })
            return;
        }

        if (formValue.email === "" || formValue.password === "" || formValue.confPassword === "" || formValue.verificationCode === "") {
            toast.error("Vui lòng nhập đầy đủ thông tin", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: document.documentElement.getAttribute("data-ww-theme"),
                transition: Bounce,
            })
            return;
        }
        const { name, email, password, confPassword, verificationCode } = formValue;
        setLoading(true);

        dispatch(registerUser({ name, email, password, confPassword, verificationCode }))
            .unwrap()
            .then(() => {
                window.location.href = "/"
            })
            .catch(() => {
                setLoading(false);
            });
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (formValue.email === "") {
            toast.error("Vui lòng nhập địa chỉ email", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: document.documentElement.getAttribute("data-ww-theme"),
                transition: Bounce,
            })
            return;
        }
        try {
            await axios.post('/api/auth/send-otp', { email: formValue.email });
        } catch (error) {
            console.log(error)
        } finally {
            toast.success("Mã xác minh đã được gửi đến email của bạn", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: document.documentElement.getAttribute("data-ww-theme"),
                transition: Bounce,
            })
        }
    };

    return (
        <>
            <h1>Đăng ký</h1>
            <div className="social-container">
                <span className="social" onClick={() => onSocialLogin("facebook")} ><i className="fab fa-facebook-f"></i></span>
                <span className="social" onClick={() => onSocialLogin("google")} ><i className="fab fa-google-plus-g"></i></span>
                <span className="social" onClick={() => onSocialLogin("github")} ><i className="fab fa-github"></i></span>
            </div>
            <form onSubmit={handleRegister}>
                <div className='form-group'>
                    <label htmlFor="name" className='form-label'>Tên</label>
                    <input
                        type="text"
                        placeholder="Nhập tên của bạn"
                        className='form-control'
                        value={formValue.name}
                        onChange={handleChangeValue}
                        name="name"
                    />
                    {errors.name && <span className="error">{errors.name}</span>}
                </div>
                <div className='form-group'>
                    <label htmlFor="email" className='form-label'>Email</label>
                    <input
                        type="email"
                        placeholder="Nhập địa chỉ email"
                        className='form-control'
                        value={formValue.email}
                        onChange={handleChangeValue}
                        name="email"
                    />
                    {errors.email && <span className="error">{errors.email}</span>}
                </div>
                <div className='form-group'>
                    <label htmlFor="password" className='form-label'>Mật khẩu</label>
                    <div className="input-group input-group-merge">
                        <input
                            name="password"
                            placeholder="********"
                            type={showPw ? "text" : "password"}
                            className="form-control"
                            value={formValue.password}
                            onChange={handleChangeValue}
                        />
                        <span className="input-group-text cursor-pointer z-1" onClick={() => setShowPw((prev) => !prev)}><i className={`icon-base fa-solid ${showPw ? "fa-eye" : "fa-eye-slash"}`}></i></span>
                    </div>
                    {errors.password && <span className="error">{errors.password}</span>}
                </div>
                <div className='form-group'>
                    <label htmlFor="confPassword" className='form-label'>Xác nhận mật khẩu</label>
                    <input
                        type={showPw ? "text" : "password"}
                        placeholder="********"
                        className='form-control'
                        value={formValue.confPassword}
                        onChange={handleCheckPassword}
                        name="confPassword"
                    />

                    {errors.confPassword && <span className="error">{errors.confPassword}</span>}
                </div>
                <div className='form-group'>
                    <label htmlFor="verificationCode" className='form-label'>Mã xác minh email</label>
                    <input
                        type="text"
                        placeholder="Nhập mã xác minh"
                        className='form-control'
                        value={formValue.verificationCode}
                        onChange={handleChangeValue}
                        name="verificationCode"
                    />
                    {errors.verificationCode && <span className="error">{errors.verificationCode}</span>}
                </div>
                <button type="button" className='btn btn-sm btn-secondary' onClick={handleSendOTP}>Gửi mã OTP</button>
                <button type="submit" className='btn btn-sm btn-primary' disabled={loading || !passwordsMatch}>{loading ? 'Đang xử lý...' : 'Đăng ký'}</button>
            </form>
        </>
    );
};

export default RegisterForm;