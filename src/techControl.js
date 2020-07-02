let crossesSave = [];
let devicesSave = [];
let lastClicked = -1;

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
                crossesSave = data.crosses.sort(sortByID);
                devicesSave = data.devices;
                buildTable();
                break;
            case 'crosses':
                crossesSave = data.crosses.sort(sortByID);
                buildTable();
                break;
            case 'devices':
                data.devices.forEach(device => {
                    if (checkDeviceID(device.idevice) !== -1) {
                        updateDevices(device);
                    } else {
                        devicesSave.push(device);
                    }
                });
                buildTable();
                break;
            default:
                break;
        }
    };

    ws.onclose = function (evt) {
        console.log('disconnected', evt);
    };
});

function buildBottom() {
    let device = {};
    let cross = checkCross(lastClicked);

    $('#type')[0].innerText = switchArrayType(cross.arrayType);
    $('#id')[0].innerText = cross.id;
    $('#description')[0].innerText = cross.describe;
    $('#phone')[0].innerText = cross.phone.substring(1, cross.phone.length -1).trim();
    $('#area')[0].innerText = cross.area;
    $('#subarea')[0].innerText = cross.subarea;

    if (checkDeviceID(lastClicked) !== -1) {
        device = checkDevice(lastClicked).device;
        $('#connect')[0].innerText = device.Status.ethernet ? 'LAN' : 'G';
        $('#exTime')[0].innerText = device.Status.tobm;
    } else {
        $('#connect')[0].innerText = '';
        $('#exTime')[0].innerText = '';
    }
}

function buildTable() {
    let $table = $('#table');
    let toWrite = [];
    let selected = $table.bootstrapTable('getSelections');

    crossesSave.forEach(cross => {
        let device = checkDevice(cross.idevice).device;
        let devFlag = (device !== undefined);
        let copy = {
            state: (selected.length !== 0) ? (cross.idevice === selected[0].idevice) : false,
            region: cross.region,
            area: cross.area,
            usdk: cross.id,
            sv: devFlag ? device.Status.ethernet ? 'LAN' : '+' : '',
            type: switchArrayType(cross.arrayType),
            exTime: devFlag ? timeFormat(device.ltime) : '',
            malfDk: devFlag ? checkMalfunction(device.Error) : '',
            gps: devFlag ? checkGPS(device.GPS) : '',
            addData: '',
            place: cross.describe,
            idevice: cross.idevice
        };
        toWrite.push(copy);
    });

    $table.bootstrapTable('load', toWrite);
    $table.bootstrapTable('hideColumn', 'idevice');
    $table.bootstrapTable('scrollTo', 'top');

    $('tr').each(function() {
        $(this).on('click', function () {
            selected = $table.bootstrapTable('getSelections');
            lastClicked = (selected.length !== 0) ? selected[0].idevice : -1;
            if (lastClicked !== -1) buildBottom();
        })
    });

   if(selected.length !== 0) buildBottom();
}

function updateDevices(device) {
    let i = 0;
    devicesSave.forEach(dev => {
        if (device.idevice === dev.idevice) devicesSave[i] = device;
        i++;
    })
}

function checkDevice(idevice) {
    let device = {};
    let i = 0;
    devicesSave.forEach(dev => {
        if (dev.idevice === idevice) device = devicesSave[i];
        i++;
    });
    return device;
}

function checkCross(idevice) {
    let device = {};
    let i = 0;
    crossesSave.forEach(cross => {
        if (cross.idevice === idevice) device = crossesSave[i];
        i++;
    });
    return device;
}

function checkDeviceID(idevice) {
    let retValue = -1;
    let i = 0;
    devicesSave.forEach(dev => {
        if (dev.idevice === idevice) retValue = i;
        i++;
    });
    return retValue;
}

function timeFormat(time) {
    let date = new Date(time);
    // date = new Date(date.getTime() - (date.getTimezoneOffset() * 60 * 1000));
    const dateTimeFormat = new Intl.DateTimeFormat('ru', {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
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