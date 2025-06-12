import React from "react";
import { Link } from "react-router-dom";

const games = [
    {
        title: "Né chướng ngại vật",
        description: "Trò chơi phản xạ, né các vật cản để ghi điểm cao.",
        path: "/minigame/ne-chuong-ngai-vat",
        image: "/assets/games/dodge.png"
    },
    {
        title: "Đố vui",
        description: "Kiểm tra kiến thức của bạn với các câu hỏi thú vị.",
        path: "/minigame/quiz",
        image: "/assets/games/quiz.png"
    },
    {
        title: "Ghép hình",
        description: "Trò chơi rèn luyện trí nhớ và sự tập trung.",
        path: "/minigame/puzzle",
        image: "/assets/games/puzzle.png"
    }
];

const GamesPage = () => (
    <div className="container page-section">
        <div className="page-section__title">
                <h3 className="page-section__title-text">
                    <i className="fas fa-gamepad"></i> Kho trò chơi
                </h3>
            </div>
        <div className="row">
            {games.map((game, idx) => (
                <div className="col-md-4 mb-4" key={idx}>
                    <div className="card h-100">
                        <img src={game.image} className="card-img-top" alt={game.title} />
                        <div className="card-body d-flex flex-column">
                            <h5 className="card-title">{game.title}</h5>
                            <p className="card-text">{game.description}</p>
                            <Link to={game.path} className="btn btn-primary mt-auto">Chơi ngay</Link>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default GamesPage;