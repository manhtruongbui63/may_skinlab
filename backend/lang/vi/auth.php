<?php

declare(strict_types=1);

return [
    'failed' => 'Thông tin tài khoản không tìm thấy trong hệ thống.',
    'password' => 'Mật khẩu không đúng.',
    'throttle' => 'Vượt quá số lần đăng nhập cho phép. Vui lòng thử lại sau :seconds giây.',

    'reset' => [
        'link_sent' => 'Liên kết đặt lại mật khẩu đã được gửi tới email của bạn.',
        'email_not_found' => 'Không tìm thấy tài khoản nào với email này.',
        'success' => 'Mật khẩu của bạn đã được đặt lại. Vui lòng đăng nhập bằng mật khẩu mới.',
        'invalid_token' => 'Liên kết đặt lại mật khẩu không hợp lệ.',
        'expired_token' => 'Liên kết đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu liên kết mới.',
        'same_password' => 'Mật khẩu mới phải khác mật khẩu hiện tại.',

        'mail' => [
            'subject' => 'Đặt lại mật khẩu',
            'greeting' => 'Xin chào :name,',
            'intro' => 'Bạn nhận được email này vì chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.',
            'action' => 'Đặt lại mật khẩu',
            'expires' => 'Liên kết đặt lại mật khẩu này sẽ hết hạn sau :minutes phút.',
            'outro' => 'Nếu bạn không yêu cầu đặt lại mật khẩu, bạn không cần thực hiện thêm thao tác nào.',
        ],

        'changed_mail' => [
            'subject' => 'Mật khẩu của bạn đã được thay đổi',
            'greeting' => 'Xin chào :name,',
            'intro' => 'Đây là email xác nhận mật khẩu của bạn đã được thay đổi vào :datetime.',
            'warning' => 'Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ bộ phận hỗ trợ ngay lập tức.',
        ],
    ],
];
