import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import authHeader from '../../services/auth-header';
import ReactApexChart from 'react-apexcharts';

const Dashboard = () => {
    const { user: currentUser } = useSelector((state) => state.user);
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);
    const [registrationTime, setRegistrationTime] = useState({
        days: 0,
        hours: 0,
        minutes: 0
    })
    const currentTime = (new Date().getHours() + 7) % 24;
    let greeting = '';

    if (currentTime >= 0 && currentTime < 6) {
        greeting = 'Chào buổi đêm';
    } else if (currentTime >= 6 && currentTime < 12) {
        greeting = 'Chào buổi sáng';
    } else if (currentTime >= 12 && currentTime < 14) {
        greeting = 'Chào buổi trưa';
    } else if (currentTime >= 14 && currentTime < 18) {
        greeting = 'Chào buổi chiều';
    } else {
        greeting = 'Chào buổi tối';
    }

    useEffect(() => {
        const getData = async () => {
            setLoading(true);
            try {
                const res = await axios.get("/api/dashboard", {
                    headers: authHeader()
                });
                setData(res.data);
            } catch (error) {
                console.log(error);
                setLoading(true);
            } finally {
                setLoading(false);
            }
        }
        getData()
    }, [])

    const calculateTime = useCallback(() => {
        if (currentUser?.createdAt) {
            const currentTime = new Date();
            const registeredAt = new Date(currentUser.createdAt);
            if (isNaN(registeredAt)) return;

            const totalSeconds = Math.floor((currentTime - registeredAt) / 1000);
            // Tính tổng số ngày
            const days = Math.floor(totalSeconds / (24 * 3600)); // Số giây trong một ngày là 24 * 3600
            const remainingSecondsAfterDays = totalSeconds % (24 * 3600);

            // Tính tổng số giờ còn lại sau khi trừ ngày
            const hours = Math.floor(remainingSecondsAfterDays / 3600);
            const remainingSecondsAfterHours = remainingSecondsAfterDays % 3600;

            // Tính tổng số phút còn lại sau khi trừ giờ
            const minutes = Math.floor(remainingSecondsAfterHours / 60);

            setRegistrationTime({ days, hours, minutes });
        }
    }, [currentUser?.createdAt]);

    useEffect(() => {
        calculateTime();
        const intervalId = setInterval(calculateTime, 1000);

        return () => clearInterval(intervalId);
    }, [currentUser, calculateTime]);

    const [stats, setStats] = useState({
        daily: [],
        monthly: [],
        status: []
    });

    useEffect(() => {
        const getStats = async () => {
            try {
                const res = await axios.get("/api/m/user/stats", {
                    headers: authHeader()
                });
                setStats(res.data);
            } catch (error) {
                console.error(error);
            }
        };
        getStats();
    }, []);

    const dailyChartOptions = {
        chart: {
            type: 'area',
            height: 350,
            toolbar: { show: false }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth' },
        xaxis: {
            type: 'datetime',
            categories: (stats.daily || []).map(item => item.date)
        },
        title: {
            text: 'Người dùng đăng ký trong 30 ngày qua',
            align: 'left'
        }
    };

    const monthlyChartOptions = {
        chart: {
            type: 'bar',
            height: 350
        },
        xaxis: {
            categories: (stats.monthly || []).map(item =>
                new Date(0, item.month - 1).toLocaleString('vi', { month: 'long' })
            )
        },
        title: {
            text: 'Người dùng đăng ký theo tháng',
            align: 'left'
        }
    };

    const [movieStats, setMovieStats] = useState([]);

    useEffect(() => {
        const fetchMovieStats = async () => {
            try {
                const res = await axios.get(`/api/movies/m/sorted-by-date`, {
                    headers: authHeader()
                });
                setMovieStats(res.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchMovieStats();
    }, []);

    const movieChartOptions = {
        chart: {
            type: 'line',
            height: 350
        },
        xaxis: {
            type: 'datetime',
            categories: movieStats.map(movie => movie.createdAt)
        },
        title: {
            text: 'Thống kê phim theo ngày',
            align: 'left'
        }
    };

    const [trendingMovies, setTrendingMovies] = useState([]);

    useEffect(() => {
        const fetchTrendingMovies = async () => {
            try {
                const res = await axios.get("/api/movies/m/trending", {
                    headers: authHeader()
                });
                setTrendingMovies(res.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchTrendingMovies();
    }, []);

    const trendingChartOptions = {
        chart: {
            type: 'bar',
            height: 350
        },
        xaxis: {
            categories: trendingMovies.map(movie => movie.title)
        },
        title: {
            text: 'Phim đang xu hướng',
            align: 'left'
        }
    };

    return (
        <>
            <div className="flex-grow-1 container-p-y container-fluid">
                <div className="card bg-transparent shadow-none my-6 border-0">
                    <div className="card-body row p-0 pb-6 g-6">
                        <div className="col-12 col-lg-8 card-separator">
                            <h5 className="mb-2">Chào mừng trở lại,<span className="h4"> {currentUser.name} 👋🏻</span></h5>
                            <div className="col-12 col-lg-5">
                                <p>{greeting} !</p>
                            </div>
                            <div className="d-flex justify-content-between flex-wrap gap-4 me-12">
                                <div className="d-flex align-items-center gap-4">
                                    <div className="avatar avatar-lg">
                                        <div className="avatar-initial bg-primary rounded">
                                            <div className="text-white">
                                                <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <g id="Laptop">
                                                        <path id="Vector" opacity="0.2" d="M5.9375 26.125V10.6875C5.9375 10.0576 6.18772 9.45352 6.63312 9.00812C7.07852 8.56272 7.68261 8.3125 8.3125 8.3125H29.6875C30.3174 8.3125 30.9215 8.56272 31.3669 9.00812C31.8123 9.45352 32.0625 10.0576 32.0625 10.6875V26.125H5.9375Z" fill="currentColor" />
                                                        <path
                                                            id="Vector_2"
                                                            d="M5.9375 26.125V10.6875C5.9375 10.0576 6.18772 9.45352 6.63312 9.00812C7.07852 8.56272 7.68261 8.3125 8.3125 8.3125H29.6875C30.3174 8.3125 30.9215 8.56272 31.3669 9.00812C31.8123 9.45352 32.0625 10.0576 32.0625 10.6875V26.125M21.375 13.0625H16.625M3.5625 26.125H34.4375V28.5C34.4375 29.1299 34.1873 29.734 33.7419 30.1794C33.2965 30.6248 32.6924 30.875 32.0625 30.875H5.9375C5.30761 30.875 4.70352 30.6248 4.25812 30.1794C3.81272 29.734 3.5625 29.1299 3.5625 28.5V26.125Z"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round" />
                                                    </g>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="content-right">
                                        <p className="mb-0 fw-medium">Tổng người dùng</p>
                                        <h4 className="text-primary mb-0">
                                            {data && data.users ? data.users.length : 'Đang chờ...'}
                                        </h4>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-4">
                                    <div className="avatar avatar-lg">
                                        <div className="avatar-initial bg-info rounded">
                                            <div className="text-white">
                                                <i className="fa-solid fa-photo-film"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="content-right">
                                        <p className="mb-0 fw-medium">Tổng số phim</p>
                                        <h4 className="text-info mb-0">{data && data.movies ? data.movies.length : 'Đang chờ...'}</h4>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-4">
                                    <div className="avatar avatar-lg">
                                        <div className="avatar-initial bg-warning rounded">
                                            <div className="text-white">
                                                <i className="fa-regular fa-clapperboard-play"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="content-right">
                                        <p className="mb-0 fw-medium">Tổng tập phim</p>
                                        <h4 className="text-warning mb-0">{data && data.episodes ? data.episodes.length : 'Đang chờ...'}</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-lg-4 ps-md-4 ps-lg-6">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div>
                                        <h5 className="mb-1">Thời gian đăng ký</h5>
                                    </div>
                                    <div className="time-spending-chart">
                                        <h4 className="mb-2">
                                            {registrationTime.days}<span className="text-body">d</span>{' '}
                                            {registrationTime.hours}<span className="text-body">h</span>{' '}
                                            {registrationTime.minutes}<span className="text-body">m</span>
                                        </h4>
                                    </div>
                                </div>
                                <div id="leadsReportChart"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row mt-4">
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-body">
                                <ReactApexChart
                                    options={dailyChartOptions}
                                    series={[{
                                        name: 'Người dùng mới',
                                        data: (stats.daily || []).map(item => item.count)
                                    }]}
                                    type="area"
                                    height={350}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-body">
                                <ReactApexChart
                                    options={monthlyChartOptions}
                                    series={[{
                                        name: 'Người dùng mới',
                                        data: (stats.monthly || []).map(item => item.count)
                                    }]}
                                    type="line"
                                    height={350}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row mt-4">
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-body">
                                <ReactApexChart
                                    options={movieChartOptions}
                                    series={[{
                                        name: 'Số lượng phim',
                                        data: movieStats.map(movie => movie.id) // Replace with actual numeric value
                                    }]}
                                    type="line"
                                    height={350}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-body">
                                <ReactApexChart
                                    options={trendingChartOptions}
                                    series={[{
                                        name: 'Lượt xem',
                                        data: trendingMovies.map(movie => movie.views)
                                    }]}
                                    type="bar"
                                    height={350}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;
