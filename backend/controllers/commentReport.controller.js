import CommentReport from '../models/CommentReport.js';
import Comment from '../models/Comment.js';
import nodemailer from 'nodemailer';
import User from '../models/User.js';

const sendEmail = async (report, userName, comment) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail', // Hoặc dịch vụ email bạn sử dụng
        auth: {
            user: process.env.EMAIL_USERNAME, // Email của bạn
            pass: process.env.EMAIL_PASSWORD, // Mật khẩu email
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: 'contact.wwan@gmail.com', // Địa chỉ email nhận báo cáo
        subject: 'Báo cáo bình luận',
        html: `<!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Báo cáo vi phạm</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #e0f7fa;
                        color: #0dcaf0;
                        margin: 0;
                        padding: 20px;
                    }
                    .container {
                        background-color: #edfdff;
                        padding: 25px;
                        border-radius: 10px;
                        box-shadow: 0 4px 15px rgba(0, 96, 100, 0.2);
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    h1 {
                        color: #0dcaf0;
                        font-size: 26px;
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    h2 {
                        color: #0dcaf0;
                        font-size: 20px;
                        margin-bottom: 10px;
                    }
                    p {
                        font-size: 16px;
                        line-height: 1.6;
                        margin: 5px 0;
                    }
                    .highlight {
                        background-color: #b2ebf2;
                        padding: 10px;
                        border-left: 5px solid #0dcaf0;
                        border-radius: 5px;
                        margin: 10px 0;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        font-size: 14px;
                        color: #00796b;
                    }
                    img {
                        display: block;
                        margin: 0 auto 20px;
                        width: 150px;
                    }
                </style>
            </head>
            <body>

            <div class="container">
                <img src="https://cdn.discordapp.com/attachments/983018686598225940/1323333006877921442/W_logo.png?ex=67742167&is=6772cfe7&hm=2cc11cb892a4d2ef6a0262df8d4c5cb6dafaa2f4417d903c839f15245475496e&" alt="WWAN Logo">

                <h1>Báo cáo bình luận vi phạm</h1>

                <h2>1. Thông tin người báo cáo:</h2>
                <p><strong>ID người dùng báo cáo:</strong> ${report.userId}</p>
                <p><strong>Tên người báo cáo:</strong> ${userName}</p>

                <h2>2. Nội dung báo cáo:</h2>
                <p><strong>Lý do báo cáo:</strong> <span class="highlight">${report.reason}</span></p>

                <h2>3. Thông tin bình luận bị báo cáo:</h2>
                <p><strong>Comment ID:</strong> ${report.commentId}</p>
                <p><strong>ID người dùng bị báo cáo:</strong> ${comment.user.id}</p>
                <p><strong>Tên người dùng bị báo cáo:</strong> ${comment.user.name}</p>
                <p><strong>Nội dung comment:</strong> <span class="highlight">${comment.content}</span></p>

                <div class="footer">
                    <p>Cảm ơn bạn đã xem xét báo cáo này.</p>
                </div>
            </div>

            </body>
            </html>`
    };

    await transporter.sendMail(mailOptions);
};

export const commentReport = async (req, res) => {
    const { commentId, userId, reason } = req.body;

    if (!commentId || !userId || !reason) {
        return res.status(400).json({ error: 'Comment ID, user ID, and reason are required.' });
    }

    try {
        const comment = await Comment.findOne({
            where: { id: commentId },
            include: [{ model: User, as: 'user', attributes: ['id','name'] }],
        });
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        const user = await User.findOne({ where: { id: userId } });
        const userName = user ? user.name : 'Unknown User';

        const report = await CommentReport.create({ commentId, userId, reason });

        await sendEmail(report, userName, comment);
        res.status(201).json(report);
    } catch (error) {
        res.status(500).json({ error: 'Error reporting comment: ' + error.message });
    }
};

export const getCommentReports = async (req, res) => {
    try {
        const reports = await CommentReport.findAll({
            include: [
                { model: Comment, as: 'comment', include: [{ model: User, as: 'user', attributes: ['id','name'] }] },
                { model: User, as: 'user', attributes: ['id','name'] },
            ],
        });
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ error: 'Error getting reports: ' + error.message });
    }
}

export const deleteCommentReport = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'CommentReport ID is required.' });
    }

    try {
        await CommentReport.destroy({ where: { id } });
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting report: ' + error.message });
    }
}