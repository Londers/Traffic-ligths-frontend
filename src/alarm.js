let scrollSave = 0;
let isMuted = false;
let tableData;

const soundMap = {
    'vizg_svini' : new Audio('/free/resources/vizg_svini.mp3'),
    'annoying_alarm' : new Audio('/free/resources/annoying_alarm.mp3'),
    'desk_bells' : new Audio('/free/resources/desk_bells.mp3'),
    'fire_pager' : new Audio('/free/resources/fire_pager.mp3'),
    'woop_woop' : new Audio('/free/resources/woop_woop.mp3')
};

function sortByTime (a, b) {
    const aTime = new Date(a.time).getTime()
    const bTime = new Date(b.time).getTime()
    if (aTime === bTime) {
        return a.idevice - b.idevice
    } else {
        return bTime - aTime
    }
}

$(function () {
    $('#table').bootstrapTable('showLoading');
    $('[class~=loading-text]').text('Загрузка. Пожалуйста, подождите');

    Object.keys(soundMap).forEach((key, index) => {
       $('#alarmSound').append(new Option(`Звук ${index + 1}`, key));
    });

    let sound = localStorage.getItem('alarmSound');

    if (sound === null) {
        localStorage.setItem('alarmSound', $('#alarmSound').val())
    } else {
        $('#alarmSound').val(sound)
    }

    $('#alarmSound').on('click', () => localStorage.setItem('alarmSound', $('#alarmSound').val()));

    $('#checkSound').on('click', () => playSound());

    $('#muteSound').on('click', () => {
        isMuted = !isMuted;
        Object.values(soundMap).forEach(sound => sound.muted = isMuted);
        $('#muteSound').text(isMuted ? 'Включить звук' : 'Выключить звук');
    });

    $('#openCross').on('click', () => {
        const row = $('#table').bootstrapTable('getSelections')[0];
        if (row === undefined) return;

        window.open((location.origin + location.pathname)
                .replace('alarm', 'cross') +
            `?Region=${row.region}&Area=${row.area}&ID=${row.id}`
        );
    });

    let closeReason = '';
    const ws = new WebSocket('wss://' + location.host + location.pathname + 'W' + location.search);

    ws.onopen = function () {
        console.log('connected');
    };

    ws.onclose = function (evt) {
        console.log('disconnected', evt);
        // alert('Ошибка соединения: ' + closeReason);
    };

    ws.onerror = function (evt) {
        // alert(`Ошибка соединения WebSocket, ${evt.reason}`);
    }

    ws.onmessage = function (evt) {
        let allData = JSON.parse(evt.data);
        let data = allData.data;
        switch (allData.type) {
            case 'alarm': {
                const selected = $('#table').bootstrapTable('getSelections')[0]?.idevice ?? -1;
                scrollSave = $('#table').bootstrapTable('getScrollPosition');

                data.alarm.CrossInfo.forEach(cross => {
                    const oldCross = tableData?.find(oldCross => ((oldCross.idevice === cross.idevice)));
                    if (oldCross?.status !== cross.status) data.alarm.ring = true;
                })

                tableData = data.alarm.CrossInfo.sort(sortByTime);
                // tableData = data.alarm.CrossInfo.sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
                tableData.forEach(row => {
                    if (row.idevice === selected) row.state = true;
                    if (row.time.includes('1970')) {
                        row.time = 'Не подключался';
                    } else {
                        row.time = new Date(row.time).toLocaleString('ru-RU', {timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone});
                    }
                });

                $('#table').bootstrapTable('load', tableData)
                    .bootstrapTable('hideLoading')
                    .bootstrapTable('scrollTo', {unit: 'px', value: scrollSave});
                $('[class~=fixed-table-container]').css({height: (($(window).height() - $('#toolbar').height()) * 0.9)});
                if (tableData.length === 0) $('[class~=no-records-found] td').text('Записей не найдено');
                $(window).on('resize', () => $('[class~=fixed-table-container]').css({height: (($(window).height() - $('#toolbar').height()) * 0.9)}));

                if (data.alarm.ring) playSound();
                break;
            }
            case 'error':
                closeReason = data.message;
                ws.close(1000);
                break;
            case 'close':
                closeReason = 'WS Closed by server';
                ws.close(1000);
                window.close();
                break;
        }
    };

    function playSound() {
        let promise = soundMap[$('#alarmSound').val()].play();
        if (promise !== undefined) {
            promise.then(() => {
                console.log('Play sound')
                // Autoplay started
            }).catch(error => {
                console.log('Play sound error', error.message)
            })
        }
    }
});