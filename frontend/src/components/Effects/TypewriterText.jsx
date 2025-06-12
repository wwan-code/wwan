// frontend/src/components/Effects/TypewriterText.jsx
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import '@assets/scss/components/effects/_typewriter-text.scss';

const TypewriterText = ({
    text,
    speed = 150,
    loop = false,
    delayAfterLoop = 1500, // Thời gian dừng trước khi lặp lại
    cursorChar = '|',
    cursorClassName = 'typewriter-cursor',
    wrapperClassName = 'typewriter-wrapper',
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0); // Để trigger useEffect khi text prop không đổi nhưng muốn reset
    const currentIndexRef = useRef(0);

    useEffect(() => {
        // Reset khi text prop thay đổi hoàn toàn
        setDisplayedText('');
        currentIndexRef.current = 0;
        setIsDeleting(false);
        // setLoopNum(prev => prev + 1); // Không cần thiết nếu text thay đổi thực sự
    }, [text]);


    useEffect(() => {
        if (!text || text.length === 0) {
            setDisplayedText('');
            return;
        }

        const handleTyping = () => {
            const fullText = Array.isArray(text) ? text[loopNum % text.length] : text;

            if (isDeleting) {
                setDisplayedText(prev => fullText.substring(0, prev.length - 1));
                currentIndexRef.current -= 1;
            } else {
                setDisplayedText(prev => fullText.substring(0, prev.length + 1));
                currentIndexRef.current += 1;
            }

            if (!isDeleting && displayedText === fullText) {
                if (loop) {
                    setTimeout(() => setIsDeleting(true), delayAfterLoop);
                }
            } else if (isDeleting && displayedText === '') {
                setIsDeleting(false);
                if (loop) {
                    setLoopNum(prev => prev + 1); // Chuyển sang text tiếp theo nếu text là mảng
                    currentIndexRef.current = 0; // Reset index cho text mới (hoặc text cũ nếu lặp lại)
                } else {
                    // Nếu không loop và đã xóa xong, có thể dừng ở đây hoặc gõ lại
                    // Hiện tại, nếu không loop, nó sẽ dừng sau khi gõ xong lần đầu
                }
            }
        };

        // Nếu không loop và đã gõ xong, không làm gì cả
        if (!loop && displayedText === (Array.isArray(text) ? text[0] : text) && !isDeleting) {
            return;
        }
        // Nếu loop, isDeleting là false, và đã gõ xong text hiện tại, thì đợi trước khi bắt đầu xóa
        if (loop && !isDeleting && displayedText === (Array.isArray(text) ? text[loopNum % text.length] : text)) {
             const timeoutId = setTimeout(handleTyping, delayAfterLoop);
             return () => clearTimeout(timeoutId);
        }


        const typingSpeed = isDeleting ? speed / 2 : speed;
        const timeoutId = setTimeout(handleTyping, typingSpeed);

        return () => clearTimeout(timeoutId);
    }, [displayedText, isDeleting, text, speed, loop, delayAfterLoop, loopNum]);

    return (
        <span className={wrapperClassName}>
            {displayedText}
            <span className={cursorClassName}>{cursorChar}</span>
        </span>
    );
};

TypewriterText.propTypes = {
    text: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
    ]).isRequired,
    speed: PropTypes.number,
    loop: PropTypes.bool,
    delayAfterLoop: PropTypes.number,
    cursorChar: PropTypes.string,
    cursorClassName: PropTypes.string,
    wrapperClassName: PropTypes.string,
};

export default TypewriterText;