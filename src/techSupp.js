'use strict';

$(function () {
    init();
    $('#sendButton').on('click', function () {
        //Отправка данных на сервер
        $.ajax({
            url: window.location.href + '/send',
            type: 'post',
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                alert('Ваше сообщение успешно отправлено!');
                window.close();
            },
            data: JSON.stringify({text: $('#txt').val()}),
            error: function (request) {
                console.log(request.status + ' ' + request.responseText);
                alert(JSON.parse(request.responseText).message);
            }
        });
    })
});

function observe(element, event, handler) {
    element.addEventListener(event, handler, false);
}

function init() {
    let text = $('#txt')[0];

    function resize() {
        text.style.height = 'auto';
        text.style.height = text.scrollHeight + 'px';
    }

    /* 0-timeout to get the already changed text */
    function delayedResize() {
        window.setTimeout(resize, 0);
    }

    observe(text, 'change', resize);
    observe(text, 'cut', delayedResize);
    observe(text, 'paste', delayedResize);
    observe(text, 'drop', delayedResize);
    observe(text, 'keydown', delayedResize);

    text.focus();
    text.select();
    resize();
}