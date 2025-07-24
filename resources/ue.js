$(() => {
    //多行文本输入框根据内容自适应高度
    $('textarea.auto-height ').on('input propertychange', e => {
        const textarea = $(e.currentTarget);
        textarea.css('overflow', 'hidden').css('height', textarea.prop('scrollHeight'));
    });
    //启用禁用状态
    $(':input.disabled').attr('disabled', true);
    $(':input:disabled').addClass('disabled');
    //加role
    $('.alert').attr('role', 'alert');
});