let crossesSave = [];
let devicesSave = [];

/**
 * @return {number}
 */
function sortByID(a, b) {
    return a.id - b.id;
}

$(function () {
    $('.fixed-table-toolbar').hide();

    let ws = new WebSocket('ws://' + location.host + location.pathname + 'W' + location.search);

    ws.onerror = function (evt) {
        console.log('WebsSocket error:' + evt);
    };

    ws.onopen = function () {
        // on connecting, do nothing but log it to the console
        console.log('connected');
    };

    ws.onmessage = function (evt) {
        let allData = JSON.parse(evt.data);
        let data = allData.data;
        console.log(data);

        switch (allData.type) {
            case 'armInfo':
                let $table = $('#table');
                crossesSave = data.crosses.sort(sortByID);
                devicesSave = data.devices;
                let toWrite = [];
                crossesSave.forEach(cross => {
                    let device = checkDevice(cross.idevice).device;
                    let devFlag = (device !== undefined);
                    let copy = {
                        state: false,
                        usdk: cross.id,
                        region: cross.region,
                        area: cross.area,
                        sv: devFlag ? '+' : '',
                        type: switchArrayType(cross.arrayType),
                        exTime: devFlag ? timeFormat(device.ltime) : '',
                        malfDk: devFlag ? checkMalfunction(device.Error) : '',
                        gps: devFlag ? checkGPS(device.GPS) : '',
                        addData: '',
                        place: cross.describe
                    };
                    toWrite.push(copy);
                });
                $table.bootstrapTable('append', toWrite);
                $table.bootstrapTable('scrollTo', 'top');
                break;
            case 'mrazb':
                break;
            default:
                break;
        }
    };

    ws.onclose = function (evt) {
        console.log('disconnected', evt);
        // alert('Связь была разорвана');
        // location.reload();
        // automatically try to reconnect on connection loss
    };
});

function checkDevice(idevice) {
    let device = {};
    let i = 0;
    devicesSave.forEach(dev => {
        if (dev.idevice === idevice) device = devicesSave[i];
        i++;
    });
    return device;
}

function timeFormat(time) {
    let date = new Date(time);
    // date = new Date(date.getTime() - (date.getTimezoneOffset() * 60 * 1000));
    const dateTimeFormat = new Intl.DateTimeFormat('ru', { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit"});
    // console.log(date);
    return dateTimeFormat.format(date);
}

let ErrorsText = {
    V220DK1: 'Срабатывание входа контроля 220В ДК1',
    V220DK2: 'Срабатывание входа контроля 220В ДК2',
    RTC: 'Неисправность часов RTC',
    TVP1: 'Неисправность ТВП1',
    TVP2: 'Неисправность ТВП2',
    FRAM: 'Неисправность FRAM'
};

function checkMalfunction(Error) {
    let retValue = '';
    for (const [key, value] of Object.entries(Error)) {
        if (value) retValue += ErrorsText[key] + ', ';
    }
    return (retValue.length !== 0) ? retValue.substring(0, retValue.length - 2) : '';
}

let GPSText = {
    Ok: 'Исправно',
    E01: 'Нет связи с приемником',
    E02: 'Ошибка CRC',
    E03: 'Нет валидного времени',
    E04: 'Мало спутников',
    Seek: 'Поиск спутников после включения'
};

function checkGPS(GPS) {
    let retValue = '';
    for (const [key, value] of Object.entries(GPS)) {
        if (value) retValue += GPSText[key] + ', ';
    }
    return (retValue.length !== 0) ? retValue.substring(0, retValue.length - 2) : '';
}

function switchArrayType(type) {
    let retValue = 'Нет данных';

    switch (type) {
        case 1:
            retValue = 'С12УСДК';
            break;
        case 2:
            retValue = 'УСДК';
            break;
        case 4:
            retValue = 'ДК-А';
            break;
        case 8:
            retValue = 'ДТ СК';
            break;
    }

    return retValue;
}