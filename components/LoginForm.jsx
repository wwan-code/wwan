import React, { useLayoutEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginUser } from '../features/userSlice';
import { Link, useNavigate } from 'react-router-dom';

const LoginForm = ({
    onSocialLogin
}) => {
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        const remember = document.getElementById('remember').checked;
        dispatch(loginUser(formData))
            .unwrap()
            .then((response) => {
                if (remember) {
                    localStorage.setItem('remember', JSON.stringify(formData));
                } else {
                    localStorage.removeItem('remember');
                }
                navigate('/');
            })
            .catch((err) => {
                console.log(err);
            });
    };

    useLayoutEffect(() => {
        const remember = localStorage.getItem('remember');
        if (remember) {
            const formDataRemember = JSON.parse(remember);
            setFormData(formDataRemember);
            // document.getElementById('remember').checked = true;
        }
    }, []);
    return (
        <>
            <h1>Đăng nhập</h1>
            <div className="social-container">
                <span className="social" onClick={() => onSocialLogin("facebook")} ><i className="fab fa-facebook-f"></i></span>
                <span className="social" onClick={() => onSocialLogin("google")} ><i className="fab fa-google-plus-g"></i></span>
                <span className="social" onClick={() => onSocialLogin("github")} ><i className="fab fa-github"></i></span>
            </div>
            <form onSubmit={handleLogin}>
                <div className='form-group'>
                    <label htmlFor="email" className='form-label'>Email</label>
                    <input
                        type="email"
                        placeholder="Nhập địa chỉ email"
                        className='form-control'
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
                <div className='form-group'>
                    <label htmlFor="password" className='form-label'>Mật khẩu</label>
                    <input
                        type="password"
                        placeholder="********"
                        className='form-control'
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>
                <div className='form-group d-flex justify-content-between align-items-center'>
                    <div className="form-check">
                        <input type="checkbox" className='form-check-input' id="remember" name="remember" />
                        <label htmlFor="remember" className='form-check-label'>Ghi nhớ đăng nhập</label>
                    </div>
                    <div>
                        <Link to={'/forgot-password'}>Quên mật khẩu?</Link>
                    </div>
                </div>
                <button type="submit" className="btn btn-sm btn-primary">Đăng nhập</button>
            </form>
        </>

    );
};

export default LoginForm;