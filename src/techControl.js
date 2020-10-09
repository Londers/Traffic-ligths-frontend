let crossesSave = [];
let devicesSave = [];
let errorRows = [];
let ws;

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
    let gprsFlag = $('#changeGPRS').val();
    let exchangeFlag = $('#exchangeTime').val();
    let modeFlag = $('#commMode').val();
    if (gprsFlag || exchangeFlag || modeFlag) {
        let gprs = {};
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
    errorRows = [];
    devicesSave.forEach(device => {
        let cross = checkCross(device.idevice);
        if (switchArrayType(cross.arrayType) !== switchArrayTypeFromDevice(device.device.Model)) {
            let list = $('#table').bootstrapTable('getData');
            let i = 0;
            let index = -1;
            list.forEach(item => {
                if (item.idevice === device.idevice) {
                    index = i;
                }
                i++;
            });
            if (!errorRows.includes(device.idevice)) errorRows.push(device.idevice);
            $('#table tbody tr').each((i, tr) => {
                if (i++ === index) {
                    $(tr).find('td').each((j, td) => {
                        if (j++ === devNumInTable) {
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

    ws = new WebSocket('ws://' + location.host + location.pathname + 'W' + location.search);

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
            case 'armInfo':
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
                if (data.message !== '') {
                    if (!document.hidden) alert(data.message);
                } else {
                    if (!document.hidden) alert('Потеряна связь с сервером');
                }
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

    crossesSave.forEach(cross => {
        let device = checkDevice(cross.idevice).device;
        let devFlag = (device !== undefined);
        let copy = {
            state: (selected.length !== 0) ? (cross.idevice === selected[0].idevice) : false,
            area: cross.area,
            usdk: cross.id,
            sv: devFlag ? device.scon ? device.Status.ethernet ? 'L' : '+' : '' : '',
            type: devFlag ? switchArrayTypeFromDevice(device.Model) : switchArrayType(cross.arrayType),
            exTime: devFlag ? timeFormat(device.ltime).substring(0, 15) : '',
            malfDk: devFlag ? checkMalfunction(device.Error) : '',
            gps: devFlag ? checkGPS(device.GPS) : '',
            addData: devFlag ? 'М:' + device.Status.elc : '',
            place: cross.describe,
            idevice: cross.idevice
        };
        if ((cross.idevice === crossesSave[0].idevice) && (firstLoadFlag)) copy.state = true;
        toWrite.push(copy);
    });
    // let all = $table.bootstrapTable('getData');
    // let one = $table.bootstrapTable('getSelections')[0];
    // let selectedRow = 0;
    // if (one) {
    //     all.forEach((row, index) => {
    //         if ((row.area === one.area) && (row.usdk === one.usdk)) {
    //             selectedRow = index;
    //         }
    //     });
    // }
    $table.bootstrapTable('load', toWrite);
    $table.bootstrapTable('hideColumn', 'idevice');
    // $table.bootstrapTable('scrollTo', {unit: 'rows', value: selectedRow});

    $table.unbind().on('click', function () {
        buildBottom();
    });

    $('#top').unbind().on('click', () => {
        checkDifference();
    });

    checkDifference();
    buildBottom();
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
    $('#type')[0].innerText = switchArrayType(cross.arrayType);
    $('#id')[0].innerText = cross.id;
    $('#description')[0].innerText = cross.describe;
    $('#phone')[0].innerText = cross.phone.substring(1, cross.phone.length - 1).trim();
    $('#area')[0].innerText = cross.area;
    $('#subarea')[0].innerText = cross.subarea;
    $('#crossButton')[0].innerText = 'ДК ' + cross.id;

    $('#bindButton').unbind().on('click', function () {
        openPage('/cross/control?Region=' + cross.region + '&Area=' + cross.area + '&ID=' + cross.id);
    });
    $('#crossButton').unbind().on('click', function () {
        openPage('/cross?Region=' + cross.region + '&Area=' + cross.area + '&ID=' + cross.id);
    });

    if (device !== undefined) {
        $('#connect')[0].innerText = device.Status.ethernet ? 'LAN' : 'G';

        checkCommand('dudk', device.StatusCommandDU.IsDUDK1);
        checkCommand('sfdk', device.StatusCommandDU.IsReqSFDK1);
        checkCommand('cmdPk', device.StatusCommandDU.IsPK);
        checkCommand('cmdSk', device.StatusCommandDU.IsCK);
        checkCommand('cmdNk', device.StatusCommandDU.IsNK);

        $('#exTime')[0].innerText = device.Status.tobm;
        $('#lnow')[0].innerText = device.Status.lnow;
        $('#gps')[0].innerText = device.Status.sGPS;
        $('#addData')[0].innerText = 'М:' + device.Status.elc;

        $('#technology').innerText = device.techMode;

        $('#pk')[0].innerText = device.pk;
        $('#sk')[0].innerText = device.ck;
        $('#nk')[0].innerText = device.nk;

        $('#idevice')[0].innerText = device.id;

        $('#sfSwitchButton').unbind().on('click', function () {
            (device.StatusCommandDU.IsReqSFDK1) ?
                controlSend({id: cross.idevice, cmd: 4, param: 0}) :
                controlSend({id: cross.idevice, cmd: 4, param: 1});
        });
        $('#sfSwitchButton')[0].innerText = (device.StatusCommandDU.IsReqSFDK1) ? 'Выкл. СФ' : 'Вкл. СФ';
        $('#changeGPRSButton').unbind().on('click', function () {
            $('#exTimeD').val(device.Status.tobm);
            $('#gprsDialog').dialog('open');
        });

        $('#lastOpDev')[0].innerText = timeFormat(device.dtime);
        $('#lastOp')[0].innerText = timeFormat(device.ltime);
        if (Math.abs((new Date(device.ltime) - new Date(device.dtime))) > 1000) {
            $('#lastOpDev').attr('style', 'background-color: red;');
        } else {
            $('#lastOpDev').attr('style', '');
        }

        $('#status')[0].innerText = deviceInfo.modeRdk;
        $('#type2')[0].innerText = switchArrayTypeFromDevice(device.Model);
        $('#phase')[0].innerText = device.DK.fdk;
        $('#state')[0].innerText = (checkMalfunction(device.Error) === '') ? '-' : checkMalfunction(device.Error);
        $('#lamps')[0].innerText = device.DK.ldk;
        $('#doors')[0].innerText = device.DK.odk ? 'Открыты' : 'Закрыты';

        $('#pspd')[0].innerText = device.Model.vpcpdl + '.' + device.Model.vpcpdr;

        let deviceVer = parseFloat(device.Model.vpcpdl + '.' + device.Model.vpcpdr);
        let crossVer = parseFloat(cross.Model.vpcpdl + '.' + cross.Model.vpcpdr);
        if (((deviceVer <= 12.3) && (crossVer <= 12.3)) || ((deviceVer >= 12.4) && (crossVer >= 12.4))) {
            $('#pspd').attr('style', '');
        } else {
            $('#pspd').attr('style', 'background-color: red;');
        }

        $('#pbs')[0].innerText = device.Model.vpbsl + '.' + device.Model.vpbsr;

        } else {
            $('#connect')[0].innerText = '';

            checkCommand('dudk', false);
            checkCommand('sfdk', false);
            checkCommand('cmdPk', false);
            checkCommand('cmdSk', false);
            checkCommand('cmdNk', false);

            $('#exTime')[0].innerText = '';
            $('#lnow')[0].innerText = '';
            $('#gps')[0].innerText = '';
            $('#addData')[0].innerText = '';

            $('#technology').innerText = '';

            $('#pk')[0].innerText = '';
            $('#sk')[0].innerText = '';
            $('#nk')[0].innerText = '';

            $('#idevice')[0].innerText = '';

            $('#sfSwitchButton').unbind();
            $('#sfSwitchButton')[0].innerText = 'Вкл. СФ';
            $('#gprsDialog').unbind();

            $('#lastOpDev')[0].innerText = '';
            $('#lastOp')[0].innerText = '';

            $('#status')[0].innerText = '-';
            $('#type2')[0].innerText = '-';
            $('#phase')[0].innerText = '-';
            $('#state')[0].innerText = '-';
            $('#lamps')[0].innerText = '-';
            $('#doors')[0].innerText = '-';

            $('#pspd')[0].innerText = '-';
            $('#pbs')[0].innerText = '-';
        }
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
        let cross = {};
        let i = 0;
        crossesSave.forEach(crossS => {
            if (crossS.idevice === idevice) cross = crossesSave[i];
            i++;
        });
        return cross;
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
            minute: "2-digit",
            second: "2-digit"
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