let crossesSave = [];
let devicesSave = [];
let errorRows = [];
let ws;
let scrollSave = 0;

//Функция для открытия вкладки
function openPage(url) {
    window.open(location.origin + '/user/' + localStorage.getItem('login') + url);
}

/**
 * @return {number}
 */
function sortByID(a, b) {
    return a.id - b.id;
}

function sendGPRS() {
    // let toSend = {ip: '', port: ''};
    let gprsFlag = $('#changeGPRS').prop('checked');
    let exchangeFlag = $('#exchangeTime').prop('checked');
    let modeFlag = $('#commMode').prop('checked');
    if (gprsFlag || exchangeFlag || modeFlag) {
        let gprs = {id: Number($('#idevice')[0].innerText), f0x32: gprsFlag, f0x33: exchangeFlag, f0x34: modeFlag};
        if (gprsFlag) {
            gprs.ip = [$('#gprs1').val(), $('#gprs2').val(), $('#gprs3').val(), $('#gprs4').val()].join('.');
            gprs.port = Number($('#port').val());
        }
        if (exchangeFlag) {
            gprs.long = Number($('#exTimeD').val());
        }
        if (modeFlag) {
            gprs.type = ($('#techRegion').val() === 'true');
        }
        ws.send(JSON.stringify({type: 'gprs', gprs: gprs}));
    }
}

function checkDifference() {
    let devNumInTable = 4;
    devicesSave.forEach(device => {
        let cross = checkCross(device.idevice);
        if (switchArrayType(cross.arrayType) !== switchArrayTypeFromDevice(device.device.Model)) {
            let list = $('#table').bootstrapTable('getData');
            let index = -1;
            list.forEach((item, i) => {
                if (item.idevice === device.idevice) {
                    index = i;
                }
            });
            $('#table tbody tr').each((i, tr) => {
                if (i === index) {
                    $(tr).find('td').each((j, td) => {
                        if (j === devNumInTable) {
                            $(td).attr('style', 'background-color: red;');
                        }
                    })
                }
            })
        }
    })
}

$(function () {
    $('.fixed-table-toolbar').hide();

    ws = new WebSocket('wss://' + location.host + location.pathname + 'W' + location.search);

    ws.onerror = function (evt) {
        console.log('WebSocket error:', evt);
        alert('Произошла ошибка, попробуйте снова');
        window.close();
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
            case 'armInfo': {
                crossesSave = data.crosses.sort(sortByID);
                devicesSave = data.devices;

                let gprs = data.gprs.ip.split('.');
                $('#gprs1').val(gprs[0]);
                $('#gprs2').val(gprs[1]);
                $('#gprs3').val(gprs[2]);
                $('#gprs4').val(gprs[3]);
                $('#port').val(data.gprs.port);

                $('#changeGPRSButton')[0].disabled = !data.gprs.send;

                buildTable(true);
                break;
            }
            case 'crosses':
                crossesSave = data.crosses.sort(sortByID);
                buildTable(false);
                break;
            case 'devices':
                data.devices.forEach(device => {
                    if (checkDeviceID(device.idevice) !== -1) {
                        updateDevices(device);
                    } else {
                        devicesSave.push(device);
                    }
                });
                buildTable(false);
                break;
            case 'close':
                ws.close();
                // if (data.message !== '') {
                //     if (!document.hidden) alert(data.message);
                // } else {
                //     if (!document.hidden) alert('Потеряна связь с сервером');
                // }
                window.close();
                break;
            case 'error':
                console.log('error', evt);
                break;
            default:
                break;
        }
    };

    ws.onclose = function (evt) {
        console.log('disconnected', evt);
    };

    //Всплывающее окно для изменения настроек GPRS
    $('#gprsDialog').dialog({
        autoOpen: false,
        buttons: {
            'Отправить': function () {
                sendGPRS();
                $(this).dialog('close');
            },
            'Отмена': function () {
                $(this).dialog('close');
            }
        },
        maxWidth: window.screen.width,
        maxHeight: window.screen.height,
        width: window.screen.width / 2,
        height: window.screen.height / 2,
        modal: true,
        resizable: false,
        close: function () {
            // $('#areasMsg').remove();
        }
    });
});

function buildTable(firstLoadFlag) {
    let $table = $('#table');
    let toWrite = [];
    let selected = $table.bootstrapTable('getSelections');
    scrollSave = $table.bootstrapTable('getScrollPosition');

    $('#deviceCount').text(devicesSave.filter(dev => dev.device.scon).length);
    $('#crossCount').text(crossesSave.length);

    crossesSave.forEach(cross => {
        let device = checkDevice(cross.idevice).device;
        let devFlag = (device !== undefined);
        let copy = {
            state: (selected.length !== 0) ? (cross.idevice === selected[0].idevice) : false,
            area: cross.area,
            usdk: cross.id,
            sv: devFlag ? (device.scon ? (device.Status.ethernet ? 'L' : '+') : '') : '',
            type: devFlag ? switchArrayTypeFromDevice(device.Model) : switchArrayType(cross.arrayType),
            exTime: devFlag ? timeFormat(device.ltime).substring(0, 15) : '',
            malfDk: cross.status,
            gps: devFlag ? checkGPS(device.GPS) : '',
            addData: devFlag ? (((mErrorText[device.Status.elc] === undefined)
                ? ('Неизвестный код неисправности ' + device.Status.elc) : mErrorText[device.Status.elc])
                + checkMalfunction(device.Error)) : '',
            traffic: devFlag ? (`${prettyTraffic(device.Traffic.FromDevice1Hour)}Кб / ${prettyTraffic(device.Traffic.LastFromDevice1Hour)}Кб`) : '',
            place: cross.describe,
            idevice: cross.idevice
        };

        if ((cross.idevice === crossesSave[0].idevice) && (firstLoadFlag)) copy.state = true;
        toWrite.push(copy);
    });

    $table.bootstrapTable('load', toWrite);
    $table.bootstrapTable('hideColumn', 'idevice');
    $table.bootstrapTable('scrollTo', {unit: 'px', value: scrollSave});

    let data = $table.bootstrapTable('getData');
    devicesSave.forEach(devSave => {
        let id = findDevice(data, devSave);
        $('#table tbody tr')[id].cells[3].style.backgroundColor = devSave.device.StatusCommandDU.IsReqSFDK1 ? 'lightblue' : '';
    });

    $table.unbind().on('click', function () {
        buildBottom();
    });

    checkDifference();
    buildBottom();
}

function prettyTraffic(tf) {
    return (tf / 1024).toFixed(1);
}

function findDevice(data, device) {
    let id = -1;
    data.forEach((row, index) => {
        if (row.idevice === device.idevice) id = index;
    });
    return id;
}

//ПРОБЕЛЫ ВАЖНЫ #SPACELIVESMATTER
function checkCommand(cmd, value) {
    let $command = $('#' + cmd);
    if (value) {
        $command.attr('class', $command.attr('class').replace(' inactive', ' active'));
    } else {
        $command.attr('class', $command.attr('class').replace(' active', ' inactive'));
    }
}

function switchArrayTypeFromDevice(model) {
    let type = 'УСДК';
    if (model.C12) return 'С12' + type;
    if (model.DKA) return 'ДК-А';
    if (model.DTA) return 'ДТ СК';
    return type;
}

function buildBottom() {
    let selected = $('#table').bootstrapTable('getSelections');
    if (selected.length === 0) return;
    let cross = checkCross(selected[0].idevice);
    let deviceInfo = checkDevice(selected[0].idevice);
    let device = deviceInfo.device;

    if (errorRows.includes(selected[0].idevice)) {
        $('#type').attr('style', 'background-color: red;');
    } else {
        $('#type').attr('style', '');
    }
    $('#type').text(switchArrayType(cross.arrayType));
    $('#id').text(cross.id);
    $('#description').text(cross.describe);
    $('#phone').text(cross.phone.substring(1, cross.phone.length - 1).trim());
    $('#area').text(cross.area);
    $('#subarea').text(cross.subarea);
    $('#crossButton').text('ДК ' + cross.id);

    $('#bindButton').unbind().on('click', function () {
        openPage('/cross/control?Region=' + cross.region + '&Area=' + cross.area + '&ID=' + cross.id);
    });
    $('#crossButton').unbind().on('click', function () {
        openPage('/cross?Region=' + cross.region + '&Area=' + cross.area + '&ID=' + cross.id);
    });

    if (device !== undefined) {
        $('#connect').text(device.Status.ethernet ? 'LAN' : 'G');

        checkCommand('dudk', device.StatusCommandDU.IsDUDK1);
        checkCommand('sfdk', device.StatusCommandDU.IsReqSFDK1);
        checkCommand('cmdPk', device.StatusCommandDU.IsPK);
        checkCommand('cmdSk', device.StatusCommandDU.IsCK);
        checkCommand('cmdNk', device.StatusCommandDU.IsNK);

        $('#exTime').text(device.Status.tobm);
        $('#lnow').text(device.Status.lnow);
        $('#gps').text(device.Status.sGPS);
        $('#addData').text(((mErrorText[device.Status.elc] === undefined))
            ? ('Неизвестный код неисправности ' + device.Status.elc) : mErrorText[device.Status.elc]);

        $('#technology').innerText = device.techMode;

        $('#pk').text(device.pk);
        $('#sk').text(device.ck);
        $('#nk').text(device.nk);

        $('#idevice').text(device.id);

        $('#sfSwitchButton').unbind().on('click', function () {
            (device.StatusCommandDU.IsReqSFDK1) ?
                controlSend({id: cross.idevice, cmd: 4, param: 0}) :
                controlSend({id: cross.idevice, cmd: 4, param: 1});
        });
        $('#sfSwitchButton').text((device.StatusCommandDU.IsReqSFDK1) ? 'Выкл. СФ' : 'Вкл. СФ');
        $('#changeGPRSButton').unbind().on('click', function () {
            $('#exTimeD').val(device.Status.tobm);
            $('#gprsDialog').dialog('open');
        });

        $('#lastOpDev').text(timeFormat(device.dtime));
        $('#lastOp').text(timeFormat(device.ltime));
        if (Math.abs((new Date(device.ltime) - new Date(device.dtime))) > 2 * 60 * 1000) {
            $('#lastOpDev').attr('style', 'background-color: red;');
        } else {
            $('#lastOpDev').attr('style', '');
        }

        $('#ip').text('IP: ' + device.ip);

        $('#status').text(deviceInfo.modeRdk);
        $('#type2').text(switchArrayTypeFromDevice(device.Model));
        $('#phase').text(device.DK.fdk);
        $('#state').text((checkMalfunction(device.Error) === '') ? '-' : checkMalfunction(device.Error));
        $('#lamps').text(device.DK.ldk);
        $('#doors').text(device.DK.odk ? 'Открыты' : 'Закрыты');

        $('#pspd').text(device.Model.vpcpdl + '.' + device.Model.vpcpdr);

        let deviceVer = parseFloat(device.Model.vpcpdl + '.' + device.Model.vpcpdr);
        let crossVer = parseFloat(cross.Model.vpcpdl + '.' + cross.Model.vpcpdr);
        if (((deviceVer <= 12.3) && (crossVer <= 12.3)) || ((deviceVer >= 12.4) && (crossVer >= 12.4))) {
            $('#pspd').attr('style', '');
        } else {
            $('#pspd').attr('style', 'background-color: red;');
        }

        $('#pbs').text(device.Model.vpbsl + '.' + device.Model.vpbsr);
        let inputs = [];
        let statistics = [];

        $('#signal').text(device.Status.lnow + ', ' + device.Status.llast)

        Object.entries(device.Input).forEach((entry, index) => {
            const [key, value] = entry;
            if (key === 'S') {
                value.forEach((st, stIndex) => {
                    if (st) statistics.push(stIndex + 1);
                })
            } else {
                if (value) inputs.push(index + 1);
            }
        });

        ((inputs.length === 0) && (statistics.length === 0)) ? $('#inputErrors').hide() : $('#inputErrors').show();
        $('#inputs').text(((inputs.length === 0) ? '' : 'вх. ') + inputs.join(', '));
        $('#statistics').text(((statistics.length === 0) ? '' : 'ст. ') + statistics.join(', '));
    } else {
        $('#connect').text('');

        checkCommand('dudk', false);
        checkCommand('sfdk', false);
        checkCommand('cmdPk', false);
        checkCommand('cmdSk', false);
        checkCommand('cmdNk', false);

        $('#exTime').text('');
        $('#lnow').text('');
        $('#gps').text('');
        $('#addData').text('');

        $('#technology').text('');

        $('#pk').text('');
        $('#sk').text('');
        $('#nk').text('');

        $('#idevice').text(cross.idevice);

        $('#sfSwitchButton').unbind();
        $('#sfSwitchButton').text('Вкл. СФ');
        $('#gprsDialog').unbind();

        $('#lastOpDev').text('');
        $('#lastOp').text('');

        $('#ip').text('');

        $('#status').text('-');
        $('#type2').text('-');
        $('#phase').text('-');
        $('#state').text('-');
        $('#lamps').text('-');
        $('#doors').text('-');

        $('#pspd').text('-');
        $('#pbs').text('-');
        
        $('#signal').text('')

        $('#inputErrors').hide();
    }
}

function updateDevices(device) {
    devicesSave.forEach((dev, i) => {
        if (device.idevice === dev.idevice) devicesSave[i] = device;
    })
}

function checkDevice(idevice) {
    let device = {};
    devicesSave.forEach((dev, i) => {
        if (dev.idevice === idevice) device = devicesSave[i];
    });
    return device;
}

function checkCross(idevice) {
    let cross = {};
    crossesSave.forEach((crossS, i) => {
        if (crossS.idevice === idevice) cross = crossesSave[i];
    });
    return cross;
}

function checkDeviceID(idevice) {
    let retValue = -1;
    devicesSave.forEach((dev, i) => {
        if (dev.idevice === idevice) retValue = i;
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
        minute: "2-digit",
        second: "2-digit"
    });
    // console.log(date);
    return dateTimeFormat.format(date);
}

const ErrorsText = {
    V220DK1: '220В ДК1',
    V220DK2: '220В ДК2',
    RTC: 'Часы RTC',
    TVP1: 'ТВП1',
    TVP2: 'ТВП2',
    FRAM: 'FRAM'
};

function checkMalfunction(Error) {
    let retValue = ', ';
    for (const [key, value] of Object.entries(Error)) {
        if (value) retValue += ErrorsText[key] + ', ';
    }
    return (retValue.length !== 0) ? retValue.substring(0, retValue.length - 2) : '';
}

const GPSText = {
    Ok: 'Исправно',
    E01: 'Нет связи с приемником',
    E02: 'Ошибка CRC',
    E03: 'Нет валидного времени',
    E04: 'Мало спутников',
    Seek: 'Поиск спутников'
};

function checkGPS(GPS) {
    let retValue = '';
    for (const [key, value] of Object.entries(GPS)) {
        if (value) retValue += GPSText[key] + ', ';
    }
    return (retValue.length !== 0) ? retValue.substring(0, retValue.length - 2) : '';
}

const mErrorText = {
    0: 'Ошибок в процессе соединения с сервером не было зарегистрировано',
    1: 'Не было обмена или некорректный обмен с модемом',
    2: 'Не удалось зарегистрироваться в GSM-сети за отведенный интервал времени',
    3: 'Не удалось войти в GPRS-канал за отведённый интервал времени',
    4: 'Не было соединения с сервером после нескольких попыток',
    5: 'Sim-карта не была установлена',
    6: 'Не было ответов от сервера при попытке подключения',
    7: 'Не было ответов от сервера при попытке подключения',
    8: 'Сервер разорвал предыдущее соединение',
    9: 'Модем не подчинился сигналу включения/выключения',
    10: 'Не было связи с сервером',
    11: 'Неверная контрольная сумма принимаемого сообщения',
    12: 'Не было подтверждения от сервера на прием информации от УСКД',
    16: 'Внутренняя ошибка модема',
    20: 'Были получены новые параметры обмена с сервера',
    21: 'Таймаут по отсутствию связи с сервером',
    22: 'Было получено СМС с настройками',
    23: 'Произошла перезагрузка по пропаданию и восстановлению сетевого питания',
    24: 'Было обновление программы',
    25: 'Не было данных с сервера в режиме обмена',
    26: 'Произошла суточная перезагрузка',
    27: 'Произошло несанкционированное выключение модема',
    28: 'Был загружен новый IP-адрес сервера по USB',
    29: 'Произошел тайм-аут при установлении соединения',
    50: 'Не было данных от сервера в течение интервала обмена  +1 минута',
    51: 'Был разрыв связи по команде ПСПД',
    52: 'Модем выдал сообщение об ошибке в процессе обмена'
};

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

/*
   TODO:
    odk false - дверь закрыта
    lampi - ldk
    base true => все карты базовая привязка
    local true => устройство загружается

   TODO:   в таблице время ПК!!!!
    время1 слева - момент запуска (становится красным если разница больше минуты (пк и устройство))    ЮВ сказал нет
    время2 снизу - максимальное ожидание ответа сбоку 3, красный >8 секунд (от отправки изменений с АРМ, до ответа устройства) Ожидание ответа (дефолт 8сек), если больше - красить красным
    кнопки
            GRPS-обмен - меню ?
            Сброс отв. - сброс и новый счетчик
    в таблице - все горит красным, кроме нет связи
    + gps, l - lan, * есть не переданная информация
    при выборе зеленый, отправка фазы малиновый, синий
 */

//Отправка выбранной команды на сервер
function controlSend(toSend) {
    ws.send(JSON.stringify({type: 'dispatch', id: toSend.id, cmd: toSend.cmd, param: toSend.param}));
}