import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendEmail = async (mailOptions) => {
    try {
        await transporter.sendMail({
            ...mailOptions,
            from: mailOptions.from || 'contact.wwan@gmail.com' // Default sender
        });
        console.log(`Email sent successfully to ${mailOptions.to}`);
    } catch (error) {
        console.error(`Error sending email to ${mailOptions.to}:`, error);
        // Ném lại lỗi để hàm gọi có thể xử lý nếu cần
        throw new Error('Failed to send email.'); 
    }
};

export default sendEmail;