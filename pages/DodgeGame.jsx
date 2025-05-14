import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import styles from "../assets/scss/Game.module.scss";

const Game = () => {
    useEffect(() => {
        document.title = "Dodge Game - WWAN Film";
    }, []);
    
    const [playerX, setPlayerX] = useState(4);
    const gridSize = 9;
    const cellWidth = 100 / gridSize;
    const [obstacles, setObstacles] = useState([]);
    const [gameOver, setGameOver] = useState(false);
    const [win, setWin] = useState(false);
    const [difficulty, setDifficulty] = useState(1000);
    const [timeLeft, setTimeLeft] = useState(30);
    const timerRef = useRef(null);

    const resetGame = () => {
        setPlayerX(4);
        setObstacles([]);
        setGameOver(false);
        setWin(false);
        setDifficulty(1000);
        setTimeLeft(22);
    };

    useEffect(() => {
        const handleMove = (e) => {
            setPlayerX((prev) => {
                if (e.key === "ArrowLeft" && prev > 0) return prev - 1;
                if (e.key === "ArrowRight" && prev < gridSize - 1) return prev + 1;
                return prev;
            });
        };
        window.addEventListener("keydown", handleMove);
        return () => window.removeEventListener("keydown", handleMove);
    }, []);

    const generateObstacle = useCallback(() => {
        const randomCell = Math.floor(Math.random() * gridSize); // Chọn 1 trong 9 ô
        const obstacleX = randomCell * cellWidth + cellWidth / 2; // Định vị chính xác trong ô

        return { id: Date.now(), x: obstacleX, y: 0 };
    }, [cellWidth]);

    useEffect(() => {
        if (gameOver || win) return;
        console.log(timeLeft)
        const spawnInterval = timeLeft > 5 ? difficulty : 120; // Khi còn 5s, spawn nhanh hơn
        const fallSpeed = timeLeft > 5 ? 7 : 9; // Khi còn 5s, rơi nhanh hơn

        const interval = setInterval(() => {
            setObstacles((prev) => [...prev, generateObstacle()]);
            setDifficulty((prev) => Math.max(200, prev - 50));
        }, spawnInterval);

        const moveObstacles = setInterval(() => {
            setObstacles((prev) =>
                prev.map((obs) => ({ ...obs, y: obs.y + fallSpeed })).filter((obs) => obs.y < 100)
            );
        }, 80);

        return () => {
            clearInterval(interval);
            clearInterval(moveObstacles);
        };
    }, [gameOver, win, timeLeft, difficulty, generateObstacle]);



    useEffect(() => {
        if (gameOver || win) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setWin(true);
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [gameOver, win]);

    useEffect(() => {
        obstacles.forEach((obs) => {
            if (obs.y > 90) { // Chỉ kiểm tra nếu obstacle còn trong game
                const playerPosition = playerX * cellWidth + cellWidth / 2;
                const obstaclePosition = obs.x;

                if (Math.abs(obstaclePosition - playerPosition) < cellWidth / 2) {
                    setGameOver(true);
                    clearInterval(timerRef.current);
                }
            }
        });
    }, [obstacles, playerX, cellWidth, gameOver]);
    return (
        <div className={styles.gameContainer}>
            <div className={styles.timer}>Time Left: {timeLeft}s</div>
            {timeLeft <= 5 && !gameOver && !win && (
                <motion.div className={styles.warning}>⚠️ Tốc độ cực đại! Né ngay! ⚠️</motion.div>
            )}

            {gameOver && (
                <div className={styles.gameOverScreen}>
                    <p>Game Over</p>
                    <button onClick={resetGame} className={styles.retryButton}>Retry</button>
                </div>
            )}
            {win && (
                <div className={styles.winScreen}>You Win! Code: MOVIE123</div>
            )}
            <motion.div
                className={styles.player}
                style={{ left: `${playerX * cellWidth + cellWidth / 2}%` }}
                transition={{ type: "spring", stiffness: 200 }}
            />

            {obstacles.map((obs) => (
                <motion.div key={obs.id} className={styles.obstacle} style={{ left: `${obs.x}%`, top: `${obs.y}%` }} initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }} />
            ))}
        </div>
    );
};

export default Game;
